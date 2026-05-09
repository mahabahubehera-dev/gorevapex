"""
Ingestion dispatcher: routes files to the correct extractor by MIME/extension.
Returns a unified list of text blocks regardless of source format.
"""

import mimetypes
from pathlib import Path
from typing import Literal

from rag.utils.logger import get_logger

log = get_logger(__name__)

FileType = Literal["pdf", "docx", "xlsx", "unknown"]


def detect_file_type(file_path: str) -> FileType:
    ext = Path(file_path).suffix.lower()
    mime, _ = mimetypes.guess_type(file_path)
    if ext == ".pdf" or mime == "application/pdf":
        return "pdf"
    if ext in (".docx",) or mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return "docx"
    if ext in (".xlsx",) or mime == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return "xlsx"
    return "unknown"


def extract_file(file_path: str) -> list[dict]:
    """
    Auto-detect file type and extract text blocks.

    Each block: {text, section?, is_heading?, type, page?}
    """
    file_type = detect_file_type(file_path)
    log.info("Dispatching extraction", file=file_path, type=file_type)

    if file_type == "pdf":
        from rag.ingestion.pdf_extractor import extract_pdf
        pages = extract_pdf(file_path)
        # Normalise PDF page dicts to common block format
        return [
            {
                "text": p["text"],
                "section": f"Page {p['page']}",
                "is_heading": False,
                "type": "page",
                "page": p["page"],
                "method": p.get("method", "text"),
            }
            for p in pages
            if p["text"].strip()
        ]

    elif file_type == "docx":
        from rag.ingestion.docx_extractor import extract_docx
        return extract_docx(file_path)

    elif file_type == "xlsx":
        from rag.ingestion.xlsx_extractor import extract_xlsx
        return extract_xlsx(file_path)

    raise ValueError(f"Unsupported file type for: {file_path}")
