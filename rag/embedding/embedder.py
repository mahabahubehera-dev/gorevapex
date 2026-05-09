"""
Embedding generation via OpenRouter API.

- Batched requests to minimise API calls
- L2 normalisation so cosine similarity == dot product (faster pgvector ops)
- Retry with exponential backoff
"""

import asyncio
from typing import Optional

import httpx
import numpy as np
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from rag.config import get_settings
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()

BATCH_SIZE = 32  # OpenRouter embedding batch limit


def _normalize(vec: list[float]) -> list[float]:
    arr = np.array(vec, dtype=np.float32)
    norm = np.linalg.norm(arr)
    if norm == 0:
        return vec
    return (arr / norm).tolist()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=16),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
def _embed_batch_sync(texts: list[str]) -> list[list[float]]:
    """Call OpenRouter embeddings endpoint for a single batch."""
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    payload = {"model": settings.embedding_model, "input": texts}

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(
            f"{settings.openrouter_base_url}/embeddings",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()

    data = resp.json()
    embeddings = [item["embedding"] for item in data["data"]]
    return [_normalize(e) for e in embeddings]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of texts, batching internally.

    Returns normalised float vectors aligned with input texts.
    """
    if not texts:
        return []

    results: list[Optional[list[float]]] = [None] * len(texts)

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        log.debug("Embedding batch", start=start, count=len(batch))
        batch_vecs = _embed_batch_sync(batch)
        for i, vec in enumerate(batch_vecs):
            results[start + i] = vec

    log.info("Embedding complete", total=len(texts))
    return results  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Async variant (used in FastAPI endpoints)
# ---------------------------------------------------------------------------

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=16),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
async def _embed_batch_async(texts: list[str]) -> list[list[float]]:
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    payload = {"model": settings.embedding_model, "input": texts}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{settings.openrouter_base_url}/embeddings",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()

    data = resp.json()
    embeddings = [item["embedding"] for item in data["data"]]
    return [_normalize(e) for e in embeddings]


async def embed_texts_async(texts: list[str]) -> list[list[float]]:
    """Async version of embed_texts for use in FastAPI handlers."""
    if not texts:
        return []

    results: list[Optional[list[float]]] = [None] * len(texts)
    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        batch_vecs = await _embed_batch_async(batch)
        for i, vec in enumerate(batch_vecs):
            results[start + i] = vec

    return results  # type: ignore[return-value]
