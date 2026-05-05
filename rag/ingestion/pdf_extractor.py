"""
PDF ingestion: text-based fast path + OCR fallback for scanned/image PDFs.
"""

import io
import logging
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
from PIL import Image
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from rag.config import get_settings
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _is_scanned_page(page: fitz.Page, threshold: int) -> bool:
    """Return True if the page has too little extractable text (likely scanned)."""
    text = page.get_text("text")
    return len(text.strip()) < threshold


def _extract_text_fitz(pdf_path: str) -> list[dict]:
    """Fast path: extract text from each page using PyMuPDF."""
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        pages.append({"page": i + 1, "text": text, "method": "text"})
    doc.close()
    return pages


def _ocr_page(image: Image.Image, engine: str = "tesseract") -> str:
    """Run OCR on a single PIL image. Falls back to tesseract if paddle not installed."""
    if engine == "paddle":
        try:
            from paddleocr import PaddleOCR  # noqa: WPS433
            ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
            result = ocr.ocr(image, cls=True)
            lines = [word_info[1][0] for line in result for word_info in line]
            return "\n".join(lines)
        except ImportError:
            log.warning("PaddleOCR not installed, falling back to Tesseract")

    import pytesseract  # noqa: WPS433
    return pytesseract.image_to_string(image, config="--psm 6")


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def _ocr_pdf(pdf_path: str) -> list[dict]:
    """Convert each PDF page to image and OCR it."""
    from pdf2image import convert_from_path  # noqa: WPS433

    log.info("Starting OCR pipeline", pdf=pdf_path)
    images = convert_from_path(pdf_path, dpi=settings.pdf_dpi)
    pages = []
    for i, img in enumerate(images):
        text = _ocr_page(img)
        pages.append({"page": i + 1, "text": text, "method": "ocr"})
        log.debug("OCR page done", page=i + 1, chars=len(text))
    return pages


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_pdf(file_path: str) -> list[dict]:
    """
    Extract text from a PDF with automatic fallback to OCR.

    Returns a list of dicts: [{page, text, method}]
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > settings.max_file_size_mb:
        raise ValueError(
            f"File too large: {size_mb:.1f} MB (limit {settings.max_file_size_mb} MB)"
        )

    log.info("Extracting PDF", path=str(path), size_mb=round(size_mb, 2))

    # --- Phase 1: try text extraction ---
    try:
        pages = _extract_text_fitz(file_path)
    except Exception as exc:
        log.warning("PyMuPDF extraction failed, attempting OCR", error=str(exc))
        return _ocr_pdf(file_path)

    # --- Phase 2: inspect quality; OCR pages that are below threshold ---
    total_chars = sum(len(p["text"].strip()) for p in pages)
    if total_chars < settings.ocr_fallback_threshold * len(pages):
        log.info(
            "Text extraction quality too low, running full OCR",
            total_chars=total_chars,
            pages=len(pages),
        )
        return _ocr_pdf(file_path)

    # --- Phase 3: per-page mixed mode (some text, some scanned) ---
    ocr_needed = [p for p in pages if len(p["text"].strip()) < settings.ocr_fallback_threshold]
    if ocr_needed:
        log.info("Mixed PDF: running OCR on low-text pages", count=len(ocr_needed))
        from pdf2image import convert_from_path  # noqa: WPS433

        images = convert_from_path(file_path, dpi=settings.pdf_dpi)
        for p in ocr_needed:
            idx = p["page"] - 1
            p["text"] = _ocr_page(images[idx])
            p["method"] = "ocr"

    log.info(
        "PDF extraction complete",
        pages=len(pages),
        ocr_pages=sum(1 for p in pages if p["method"] == "ocr"),
    )
    return pages
