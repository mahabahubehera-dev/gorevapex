"""
Document upload and status endpoints.
"""

import uuid
import os
import tempfile

import psycopg2
import psycopg2.extras
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse

from rag.config import get_settings
from rag.ingestion import detect_file_type
from rag.queue.tasks import ingest_document
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()
router = APIRouter()

ALLOWED_TYPES = {"pdf", "docx", "xlsx"}


def _conn():
    return psycopg2.connect(settings.supabase_db_url)


def _upload_to_storage(file_bytes: bytes, tenant_id: str, file_name: str, ext: str) -> str:
    """Upload file to Supabase Storage and return storage path."""
    from supabase import create_client  # noqa: WPS433

    client = create_client(settings.supabase_url, settings.supabase_service_key)
    bucket = "documents"
    path = f"{tenant_id}/{uuid.uuid4()}{ext}"
    client.storage.from_(bucket).upload(
        path, file_bytes, file_options={"content-type": "application/octet-stream"}
    )
    return f"{bucket}/{path}"


@router.post("/upload", status_code=202)
async def upload_document(
    tenant_id: str = Form(...),
    file: UploadFile = File(...),
):
    """
    Upload a document and enqueue for async ingestion.
    Returns document_id for status polling.
    """
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.max_file_size_mb} MB)")

    # Detect type from filename
    ext = os.path.splitext(file.filename or "")[1].lower()
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        file_type = detect_file_type(tmp_path)
    finally:
        os.unlink(tmp_path)

    if file_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file_type or 'unknown'}")

    # Upload to Supabase Storage
    storage_path = _upload_to_storage(file_bytes, tenant_id, file.filename or "upload", ext)

    # Create DB record
    doc_id = str(uuid.uuid4())
    conn = _conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO documents
                    (id, tenant_id, file_name, file_type, file_size_bytes, storage_path, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                """,
                (doc_id, tenant_id, file.filename, file_type, file_size, storage_path),
            )
        conn.commit()
    finally:
        conn.close()

    # Enqueue ingestion task
    ingest_document.apply_async(args=[doc_id], queue="ingestion")

    log.info("Document queued", doc_id=doc_id, tenant_id=tenant_id, file_type=file_type)
    return {"document_id": doc_id, "status": "pending"}


@router.get("/{document_id}/status")
def get_document_status(document_id: str):
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, file_name, status, chunk_count, error_message, created_at, updated_at FROM documents WHERE id = %s",
                (document_id,),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    return dict(row)


@router.get("")
def list_documents(tenant_id: str):
    conn = _conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id, file_name, file_type, status, chunk_count, created_at
                FROM documents
                WHERE tenant_id = %s
                ORDER BY created_at DESC
                LIMIT 100
                """,
                (tenant_id,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()
    return [dict(r) for r in rows]


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: str, tenant_id: str):
    """Deletes document and its chunks (cascades via FK)."""
    conn = _conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM documents WHERE id = %s AND tenant_id = %s",
                (document_id, tenant_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Document not found or wrong tenant")
        conn.commit()
    finally:
        conn.close()
