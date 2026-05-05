"""
Query endpoint: runs the full RAG pipeline and returns an LLM answer.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rag.retrieval.query_flow import answer_query
from rag.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter()


class QueryRequest(BaseModel):
    tenant_id: str
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=6, ge=1, le=20)


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]


@router.post("", response_model=QueryResponse)
async def run_query(body: QueryRequest):
    """
    Full RAG query:
    embed → retrieve (hybrid) → assemble context → LLM → response
    """
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    result = await answer_query(
        tenant_id=body.tenant_id,
        query=body.query,
        top_k=body.top_k,
    )
    return QueryResponse(answer=result["answer"], sources=result["sources"])
