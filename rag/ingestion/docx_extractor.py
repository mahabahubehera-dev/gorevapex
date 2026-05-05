"""
DOCX ingestion: extracts paragraphs and tables, preserving heading metadata.
"""

from pathlib import Path
from docx import Document
from docx.oxml.ns import qn

from rag.config import get_settings
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()

HEADING_STYLES = {"Heading 1", "Heading 2", "Heading 3", "Heading 4"}


def _para_to_dict(para, section_title: str) -> dict | None:
    text = para.text.strip()
    if not text:
        return None
    is_heading = para.style.name in HEADING_STYLES
    return {
        "text": text,
        "is_heading": is_heading,
        "section": section_title,
        "type": "paragraph",
    }


def _table_to_text(table) -> str:
    """Flatten a DOCX table to a readable string."""
    rows = []
    for row in table.rows:
        cells = [cell.text.strip() for cell in row.cells]
        rows.append(" | ".join(cells))
    return "\n".join(rows)


def extract_docx(file_path: str) -> list[dict]:
    """
    Extract text blocks from a DOCX file.

    Returns [{text, is_heading, section, type}]
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"DOCX not found: {file_path}")

    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > settings.max_file_size_mb:
        raise ValueError(f"File too large: {size_mb:.1f} MB")

    log.info("Extracting DOCX", path=str(path), size_mb=round(size_mb, 2))

    doc = Document(file_path)
    blocks: list[dict] = []
    current_section = "Untitled"

    for element in doc.element.body:
        tag = element.tag.split("}")[-1]

        if tag == "p":
            # Map element back to paragraph object to access style info
            para_text = "".join(r.text for r in element.findall(f".//{qn('w:t')}"))
            para_text = para_text.strip()
            if not para_text:
                continue

            style_name = ""
            style_elem = element.find(f".//{qn('w:pStyle')}")
            if style_elem is not None:
                style_id = style_elem.get(qn("w:val"), "")
                # Normalize to human-readable name
                style_name = style_id.replace("Heading", "Heading ").strip()

            is_heading = any(h.replace(" ", "").lower() in style_name.lower() for h in ["Heading1", "Heading2", "Heading3", "Heading4"])
            if is_heading:
                current_section = para_text

            blocks.append({
                "text": para_text,
                "is_heading": is_heading,
                "section": current_section,
                "type": "paragraph",
            })

        elif tag == "tbl":
            # Build a table text block
            cells_text = []
            for row_elem in element.findall(f".//{qn('w:tr')}"):
                row_cells = []
                for cell_elem in row_elem.findall(f".//{qn('w:tc')}"):
                    cell_text = "".join(t.text or "" for t in cell_elem.findall(f".//{qn('w:t')}"))
                    row_cells.append(cell_text.strip())
                cells_text.append(" | ".join(row_cells))
            table_text = "\n".join(cells_text)
            if table_text.strip():
                blocks.append({
                    "text": table_text,
                    "is_heading": False,
                    "section": current_section,
                    "type": "table",
                })

    log.info("DOCX extraction complete", blocks=len(blocks))
    return blocks
