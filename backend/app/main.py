"""Aplikasi FastAPI — Literasy: Busur & Juring.

Jalankan: uvicorn app.main:app --reload   (dari folder backend/)
Dokumentasi API otomatis: http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import models  # noqa: F401  (mendaftarkan tabel ke Base.metadata)
from .config import get_settings
from .content import mltest_items, problems_by_id
from .db import Base, engine, get_db
from .routers import auth, mltest, practice, records
from .schemas import HealthOut

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.create_tables_on_startup:
        Base.metadata.create_all(engine)
    problems_by_id()  # gagal cepat bila konten rusak
    mltest_items()
    yield


app = FastAPI(
    title="Literasy API",
    version="0.3.0",
    description="Backend aplikasi belajar panjang busur & luas juring (data penelitian, rekap guru).",
    lifespan=lifespan,
    # Produksi: DOCS_ENABLED=false agar /docs dan /openapi.json tidak terbuka untuk publik
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router)
app.include_router(practice.router)
app.include_router(mltest.router)
app.include_router(records.router)


@app.get("/api/health", response_model=HealthOut, tags=["sistem"])
def health(db: Session = Depends(get_db)) -> HealthOut:
    try:
        db.execute(text("select 1"))
        db_status = "ok"
    except Exception:  # pragma: no cover - hanya saat database mati
        db_status = "error"
    return HealthOut(status="ok", database=db_status, problems_loaded=len(problems_by_id()))
