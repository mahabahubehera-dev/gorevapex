"""
Celery tasks for async document ingestion.

Pipeline per document:
  1. ingest_document  – download from Supabase Storage, extract text, split blocks
  2. embed_document   – chunk blocks, embed, upsert into DB

Status tracking uses documents.status:
  pending → processing → ready | failed
"""

import tempfile
import os
import traceback
from datetime import datetime

import psycopg2

from rag.queue.celery_app import celery_app
from rag.config import get_settings
from rag.ingestion import extract_file
from rag.chunking import chunk_blocks
from rag.embedding import embed_texts
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _conn():
    return psycopg2.connect(settings.supabase_db_url)


def _set_status(doc_id: str, status: str, error: str | None = None) -> None:
    conn = _conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE documents
                SET status = %s, error_message = %s, updated_at = NOW()
                WHERE id = %s
                """,
                (status, error, doc_id),
            )
        conn.commit()
    finally:
        conn.close()


def _upsert_chunks(
    tenant_id: str,
    doc_id: str,
    chunks,
    embeddings: list[list[float]],
) -> int:
    """Insert chunks + embeddings, delete old ones first."""
    conn = _conn()
    count = 0
    try:
        with conn.cursor() as cur:
            # Clean existing chunks for idempotency
            cur.execute("DELETE FROM chunks WHERE document_id = %s", (doc_id,))

            for chunk, vec in zip(chunks, embeddings):
                vec_str = "[" + ",".join(str(v) for v in vec) + "]"
                cur.execute(
                    """
                    INSERT INTO chunks
                        (tenant_id, document_id, chunk_index, text, token_count,
                         section, embedding)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
                    """,
                    (
                        tenant_id,
                        doc_id,
                        chunk.chunk_index,
                        chunk.text,
                        chunk.token_count,
                        chunk.section,
                        vec_str,
                    ),
                )
                count += 1

            # Update chunk_count on document
            cur.execute(
                "UPDATE documents SET chunk_count = %s WHERE id = %s",
                (count, doc_id),
            )
        conn.commit()
    finally:
        conn.close()
    return count


def _download_from_storage(storage_path: str, local_path: str) -> None:
    """Download a file from Supabase Storage to a local temp path."""
    from supabase import create_client  # noqa: WPS433

    client = create_client(settings.supabase_url, settings.supabase_service_key)
    # storage_path format: "bucket/path/to/file.pdf"
    parts = storage_path.split("/", 1)
    bucket, path = parts[0], parts[1]
    data = client.storage.from_(bucket).download(path)
    with open(local_path, "wb") as f:
        f.write(data)


def _get_doc(doc_id: str) -> dict:
    conn = _conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT tenant_id, storage_path, file_name, file_type FROM documents WHERE id = %s",
                (doc_id,),
            )
            row = cur.fetchone()
    finally:
        conn.close()
    if not row:
        raise ValueError(f"Document not found: {doc_id}")
    return {"tenant_id": str(row[0]), "storage_path": row[1], "file_name": row[2], "file_type": row[3]}


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="rag.queue.tasks.ingest_document",
    max_retries=3,
    default_retry_delay=30,
)
def ingest_document(self, document_id: str) -> dict:
    """
    Full ingestion pipeline for a single document.
    Downloads from Supabase Storage, extracts, chunks, embeds, and stores.
    """
    log.info("Ingestion started", doc_id=document_id, attempt=self.request.retries + 1)
    _set_status(document_id, "processing")

    try:
        doc = _get_doc(document_id)
        tenant_id = doc["tenant_id"]
        storage_path = doc["storage_path"]
        file_name = doc["file_name"]

        # Determine extension from file_name / file_type
        ext = "." + doc["file_type"]  # pdf | docx | xlsx

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp_path = tmp.name

        try:
            log.info("Downloading file", storage_path=storage_path)
            _download_from_storage(storage_path, tmp_path)

            # --- Extract ---
            blocks = extract_file(tmp_path)
            log.info("Extraction done", doc_id=document_id, blocks=len(blocks))

            if not blocks:
                raise ValueError("No text extracted — file may be empty or corrupted")

            # --- Chunk ---
            chunks = chunk_blocks(blocks)
            log.info("Chunking done", doc_id=document_id, chunks=len(chunks))

            # --- Embed ---
            texts = [c.text for c in chunks]
            embeddings = embed_texts(texts)

            # --- Store ---
            count = _upsert_chunks(tenant_id, document_id, chunks, embeddings)

        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

        _set_status(document_id, "ready")
        log.info("Ingestion complete", doc_id=document_id, chunks=count)
        return {"status": "ready", "chunk_count": count}

    except Exception as exc:
        tb = traceback.format_exc()
        log.error("Ingestion failed", doc_id=document_id, error=str(exc), traceback=tb)
        _set_status(document_id, "failed", error_message=str(exc)[:500])
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            return {"status": "failed", "error": str(exc)}


@celery_app.task(name="rag.queue.tasks.embed_document")
def embed_document(document_id: str) -> dict:
    """
    Re-embed an already-extracted document (useful after model upgrades).
    Reads existing chunks from DB, re-embeds, overwrites vectors.
    """
    conn = _conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT tenant_id FROM documents WHERE id = %s", (document_id,)
            )
            row = cur.fetchone()
            if not row:
                raise ValueError(f"Document not found: {document_id}")
            tenant_id = str(row[0])

            cur.execute(
                "SELECT id, text, chunk_index, token_count, section FROM chunks WHERE document_id = %s ORDER BY chunk_index",
                (document_id,),
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        return {"status": "skipped", "reason": "no chunks found"}

    texts = [r[1] for r in rows]
    embeddings = embed_texts(texts)

    conn = _conn()
    try:
        with conn.cursor() as cur:
            for row, vec in zip(rows, embeddings):
                vec_str = "[" + ",".join(str(v) for v in vec) + "]"
                cur.execute(
                    "UPDATE chunks SET embedding = %s::vector WHERE id = %s",
                    (vec_str, row[0]),
                )
        conn.commit()
    finally:
        conn.close()

    log.info("Re-embedding complete", doc_id=document_id, chunks=len(rows))
    return {"status": "ok", "chunks_re_embedded": len(rows)}
