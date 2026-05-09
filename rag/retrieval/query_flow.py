"""
End-to-end query flow:
  user query → embedding → retrieval → context assembly → prompt → LLM → response
"""

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from rag.config import get_settings
from rag.embedding import embed_texts_async
from rag.retrieval.retriever import retrieve_async, RetrievedChunk
from rag.utils.logger import get_logger

log = get_logger(__name__)
settings = get_settings()

_SYSTEM_PROMPT = """You are RevSathi, a helpful AI assistant for sales and revenue teams.
Answer questions accurately using ONLY the provided context.
If the context doesn't contain enough information, say so clearly.
Be concise, professional, and helpful."""


def _build_context(chunks: list[RetrievedChunk]) -> str:
    """Assemble retrieved chunks into a context block."""
    parts = []
    for i, c in enumerate(chunks, 1):
        section_label = f"[{c.section}] " if c.section else ""
        parts.append(f"--- Context {i} {section_label}---\n{c.text}")
    return "\n\n".join(parts)


def _build_prompt(query: str, context: str) -> list[dict]:
    """Return OpenRouter-compatible messages list."""
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Context:\n{context}\n\n"
                f"Question: {query}\n\n"
                "Answer based on the context above:"
            ),
        },
    ]


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
    reraise=True,
)
async def _call_llm(messages: list[dict]) -> str:
    """Call the OpenRouter chat completions endpoint."""
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://revsathi.ai",
        "X-Title": "RevSathi",
    }
    payload = {
        "model": settings.llm_model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()

    return resp.json()["choices"][0]["message"]["content"]


async def answer_query(
    tenant_id: str,
    query: str,
    top_k: int | None = None,
) -> dict:
    """
    Full RAG pipeline.

    Returns:
        {
            answer: str,
            sources: [{chunk_id, document_id, section, score}],
            context_used: str,
        }
    """
    log.info("Query received", tenant_id=tenant_id, query_len=len(query))

    # 1. Embed query
    [query_vec] = await embed_texts_async([query])

    # 2. Retrieve
    chunks = await retrieve_async(tenant_id, query_vec, query, top_k)

    if not chunks:
        log.warning("No chunks retrieved", tenant_id=tenant_id)
        return {
            "answer": "I couldn't find relevant information in your documents.",
            "sources": [],
            "context_used": "",
        }

    # 3. Assemble context
    context = _build_context(chunks)

    # 4. Build prompt
    messages = _build_prompt(query, context)

    # 5. LLM call
    answer = await _call_llm(messages)

    log.info("Query answered", tenant_id=tenant_id, answer_len=len(answer))

    return {
        "answer": answer,
        "sources": [
            {
                "chunk_id": c.chunk_id,
                "document_id": c.document_id,
                "section": c.section,
                "score": round(c.final_score, 4),
            }
            for c in chunks
        ],
        "context_used": context,
    }
