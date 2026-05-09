"""
Celery worker entry point.

Start ingestion + embedding workers:
    python -m rag.worker
  OR via celery CLI:
    celery -A rag.worker.celery_app worker -Q ingestion,embedding --loglevel=info
"""

from rag.queue.celery_app import celery_app  # noqa: F401 – registers tasks

if __name__ == "__main__":
    celery_app.worker_main(
        argv=["worker", "--queues=ingestion,embedding", "--loglevel=info", "--concurrency=2"]
    )
