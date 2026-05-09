"""
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from rag.api.routers import documents, query, tenants, health
from rag.utils.logger import get_logger

log = get_logger(__name__)

app = FastAPI(
    title="RevSathi RAG API",
    version="1.0.0",
    description="Production-grade RAG backend for RevSathi WhatsApp AI bot",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,     prefix="/health",    tags=["health"])
app.include_router(tenants.router,    prefix="/tenants",   tags=["tenants"])
app.include_router(documents.router,  prefix="/documents", tags=["documents"])
app.include_router(query.router,      prefix="/query",     tags=["query"])


@app.on_event("startup")
async def startup():
    log.info("RevSathi RAG API started")
