"""
Hybrid retrieval: vector search (pgvector) + keyword search (Postgres FTS),
with priority-weighted final scoring.

final_score = (similarity * sim_weight)
            + (tenant_priority * priority_weight)
            + (chunk_importance * importance_weight)
"""

import asyncio
from dataclasses import dataclass
from typing import Optional

import psycopg2
import psycopg2.extras

from rag.config import get_settings
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    text: str
    section: str
    similarity: float
    fts_rank: float
    importance: float
    final_score: float
    metadata: dict


# ---------------------------------------------------------------------------
# DB connection (synchronous — Celery workers use this)
# ---------------------------------------------------------------------------

def _get_conn():
    return psycopg2.connect(settings.supabase_db_url)


def _set_tenant_ctx(cur, tenant_id: str) -> None:
    """Set the RLS session variable so row-level security filters apply."""
    cur.execute("SET app.current_tenant_id = %s", (tenant_id,))


# ---------------------------------------------------------------------------
# Core hybrid search SQL
# ---------------------------------------------------------------------------

_HYBRID_SQL = """
WITH vector_search AS (
    SELECT
        c.id,
        c.document_id,
        c.text,
        c.section,
        c.importance,
        c.metadata,
        1 - (c.embedding <=> %(query_vec)s::vector) AS similarity
    FROM chunks c
    WHERE c.tenant_id = %(tenant_id)s::uuid
    ORDER BY c.embedding <=> %(query_vec)s::vector
    LIMIT %(vec_limit)s
),
keyword_search AS (
    SELECT
        c.id,
        ts_rank_cd(
            to_tsvector('english', c.text),
            plainto_tsquery('english', %(query_text)s)
        ) AS fts_rank
    FROM chunks c
    WHERE
        c.tenant_id = %(tenant_id)s::uuid
        AND to_tsvector('english', c.text) @@ plainto_tsquery('english', %(query_text)s)
    LIMIT %(fts_limit)s
)
SELECT
    v.id,
    v.document_id,
    v.text,
    v.section,
    v.importance,
    v.metadata,
    v.similarity,
    COALESCE(k.fts_rank, 0) AS fts_rank,
    t.priority_score,
    -- Final weighted score
    (v.similarity        * %(sim_weight)s)
    + (t.priority_score  * %(pri_weight)s)
    + (v.importance      * %(imp_weight)s)
    + (COALESCE(k.fts_rank, 0) * %(fts_weight)s) AS final_score
FROM vector_search v
LEFT JOIN keyword_search k ON k.id = v.id
JOIN tenants t ON t.id = %(tenant_id)s::uuid
ORDER BY final_score DESC
LIMIT %(top_k)s
"""


def retrieve(
    tenant_id: str,
    query_embedding: list[float],
    query_text: str,
    top_k: Optional[int] = None,
) -> list[RetrievedChunk]:
    """
    Hybrid retrieve top-k chunks for a tenant.

    Args:
        tenant_id:       Tenant UUID string.
        query_embedding: Normalised query vector.
        query_text:      Raw query text for full-text ranking.
        top_k:           Number of results (defaults to settings.top_k).

    Returns:
        List of RetrievedChunk sorted by final_score descending.
    """
    k = top_k or settings.top_k
    vec_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    params = {
        "tenant_id": tenant_id,
        "query_vec": vec_str,
        "query_text": query_text,
        "vec_limit": k * 3,       # over-fetch to allow re-ranking
        "fts_limit": k * 2,
        "top_k": k,
        "sim_weight": settings.similarity_weight,
        "pri_weight": settings.priority_weight,
        "imp_weight": settings.importance_weight,
        "fts_weight": 0.10,       # small bonus for keyword matches
    }

    conn = _get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            _set_tenant_ctx(cur, tenant_id)
            cur.execute(_HYBRID_SQL, params)
            rows = cur.fetchall()
    finally:
        conn.close()

    results = [
        RetrievedChunk(
            chunk_id=str(row["id"]),
            document_id=str(row["document_id"]),
            text=row["text"],
            section=row["section"] or "",
            similarity=float(row["similarity"]),
            fts_rank=float(row["fts_rank"]),
            importance=float(row["importance"]),
            final_score=float(row["final_score"]),
            metadata=row["metadata"] or {},
        )
        for row in rows
    ]

    log.info(
        "Retrieval complete",
        tenant_id=tenant_id,
        returned=len(results),
        top_score=results[0].final_score if results else 0,
    )
    return results


# ---------------------------------------------------------------------------
# Async variant for FastAPI
# ---------------------------------------------------------------------------

async def retrieve_async(
    tenant_id: str,
    query_embedding: list[float],
    query_text: str,
    top_k: Optional[int] = None,
) -> list[RetrievedChunk]:
    """Run retrieve() in a thread pool so it doesn't block the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, retrieve, tenant_id, query_embedding, query_text, top_k
    )
