from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = Field(..., env="SUPABASE_URL")
    supabase_service_key: str = Field(..., env="SUPABASE_SERVICE_KEY")
    supabase_db_url: str = Field(..., env="SUPABASE_DB_URL")

    # OpenRouter
    openrouter_api_key: str = Field(..., env="OPENROUTER_API_KEY")
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    embedding_model: str = "openai/text-embedding-3-small"
    llm_model: str = "openai/gpt-4o-mini"

    # Redis / Celery
    redis_url: str = Field(default="redis://localhost:6379/0", env="REDIS_URL")

    # Ingestion limits
    max_file_size_mb: int = 50
    ocr_fallback_threshold: int = 100  # chars; below this triggers OCR
    pdf_dpi: int = 300

    # Chunking
    chunk_size_tokens: int = 400
    chunk_overlap_tokens: int = 60

    # Retrieval
    top_k: int = 6
    similarity_weight: float = 0.6
    priority_weight: float = 0.25
    importance_weight: float = 0.15

    # Logging
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
