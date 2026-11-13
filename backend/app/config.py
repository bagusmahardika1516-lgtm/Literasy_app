"""Konfigurasi dari variabel lingkungan / file .env (lihat .env.example)."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Produksi: postgresql+psycopg://user:pass@host:5432/db (Supabase/Neon).
    # Pengembangan lokal tanpa Postgres: SQLite.
    database_url: str = "sqlite:///./literasy_dev.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    content_dir: Path = ROOT_DIR / "content"
    create_tables_on_startup: bool = True  # matikan di produksi setelah migrasi Alembic tersedia

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
