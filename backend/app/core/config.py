"""
core/config.py — Centralised application settings via Pydantic BaseSettings.

Values are read from environment variables / .env file.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ---- App ---------------------------------------------------------------
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    DEBUG: bool = True

    # ---- Database ----------------------------------------------------------
    DATABASE_URL: str = "postgresql+asyncpg://absa:absa_secret@localhost:5432/absa_db"

    # ---- Redis -------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 300  # seconds

    # ---- CORS --------------------------------------------------------------
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # ---- NLP ---------------------------------------------------------------
    ABSA_MODEL_NAME: str = "yangheng/deberta-v3-base-absa-v1.1"
    SPACY_MODEL: str = "en_core_web_trf"
    BATCH_SIZE: int = 16
    MAX_REVIEW_LENGTH: int = 512

    # ---- Scraper -----------------------------------------------------------
    SCRAPER_USER_AGENT: str = "ABSA-Bot/1.0 (research)"
    SCRAPER_DELAY_SECONDS: float = 1.5
    SCRAPER_MAX_PAGES: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
