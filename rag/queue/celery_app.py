"""
Celery application factory.
Import this everywhere you need the app or tasks.
"""

from celery import Celery
from rag.config import get_settings

settings = get_settings()

celery_app = Celery(
    "revsathi_rag",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["rag.queue.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,           # re-queue on worker crash
    worker_prefetch_multiplier=1,  # one task at a time per worker process
    result_expires=86400,          # keep results for 24 h
    task_soft_time_limit=600,      # 10 min soft limit
    task_time_limit=660,           # 11 min hard limit
    task_routes={
        "rag.queue.tasks.ingest_document": {"queue": "ingestion"},
        "rag.queue.tasks.embed_document":  {"queue": "embedding"},
    },
)
