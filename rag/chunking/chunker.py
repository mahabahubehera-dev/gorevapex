"""
Token-aware semantic chunker.

- Respects heading boundaries (never splits a heading from its first paragraph)
- Sliding window with configurable overlap
- Uses tiktoken for accurate token counting
"""

import re
from dataclasses import dataclass, field
from typing import Optional

import tiktoken

from rag.config import get_settings
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()

_enc = tiktoken.get_encoding("cl100k_base")


@dataclass
class Chunk:
    text: str
    token_count: int
    chunk_index: int
    section: str = ""
    metadata: dict = field(default_factory=dict)


def _count_tokens(text: str) -> int:
    return len(_enc.encode(text))


def _split_into_sentences(text: str) -> list[str]:
    """Split text at sentence boundaries."""
    sentence_end = re.compile(r"(?<=[.!?])\s+")
    sentences = sentence_end.split(text)
    return [s.strip() for s in sentences if s.strip()]


def _blocks_to_text_units(blocks: list[dict]) -> list[tuple[str, str]]:
    """
    Convert raw extraction blocks into (text, section) tuples.
    Headings are prepended to the following paragraph to preserve context.
    """
    units: list[tuple[str, str]] = []
    pending_heading: Optional[str] = None
    current_section = ""

    for block in blocks:
        text = block.get("text", "").strip()
        if not text:
            continue

        section = block.get("section", current_section)
        current_section = section

        if block.get("is_heading"):
            pending_heading = text
            continue

        if pending_heading:
            text = f"{pending_heading}\n{text}"
            pending_heading = None

        units.append((text, section))

    # Flush any trailing heading
    if pending_heading:
        units.append((pending_heading, current_section))

    return units


def chunk_blocks(
    blocks: list[dict],
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None,
) -> list[Chunk]:
    """
    Split extraction blocks into overlapping token-bounded chunks.

    Args:
        blocks: Raw blocks from ingestion (each has {text, section?, is_heading?})
        chunk_size: Max tokens per chunk (default from settings)
        overlap: Overlap tokens between consecutive chunks (default from settings)

    Returns:
        List of Chunk objects ready for embedding.
    """
    size = chunk_size or settings.chunk_size_tokens
    ovlp = overlap or settings.chunk_overlap_tokens

    units = _blocks_to_text_units(blocks)
    chunks: list[Chunk] = []
    chunk_idx = 0

    current_tokens: list[str] = []  # token-level buffer
    current_section = ""

    def flush(tok_list: list[str], section: str) -> None:
        nonlocal chunk_idx
        text = _enc.decode(tok_list)
        if text.strip():
            chunks.append(
                Chunk(
                    text=text.strip(),
                    token_count=len(tok_list),
                    chunk_index=chunk_idx,
                    section=section,
                )
            )
            chunk_idx += 1

    for text, section in units:
        sentences = _split_into_sentences(text)
        current_section = section

        for sentence in sentences:
            sent_tokens = _enc.encode(sentence)

            # If a single sentence exceeds chunk size, force-split it
            if len(sent_tokens) > size:
                for i in range(0, len(sent_tokens), size - ovlp):
                    piece = sent_tokens[i : i + size]
                    flush(piece, section)
                continue

            # Would adding this sentence overflow the chunk?
            if len(current_tokens) + len(sent_tokens) > size:
                flush(current_tokens, current_section)
                # Carry over overlap from the tail of the flushed chunk
                overlap_tokens = current_tokens[-ovlp:] if ovlp else []
                current_tokens = overlap_tokens + sent_tokens
            else:
                current_tokens.extend(sent_tokens)

    if current_tokens:
        flush(current_tokens, current_section)

    log.info("Chunking complete", total_chunks=len(chunks))
    return chunks
