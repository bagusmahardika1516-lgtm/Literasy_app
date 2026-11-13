"""Verifikasi kode siswa + kode kelas untuk setiap kiriman data (ADR-011, agents.md §5)."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Student


def find_student(db: Session, code: str, class_code: str) -> str | None:
    return db.scalar(select(Student.code).where(Student.code == code.upper(), Student.class_code == class_code.upper()))


def require_student(db: Session, code: str, class_code: str) -> str:
    found = find_student(db, code, class_code)
    if found is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Kode siswa atau kode kelas tidak cocok")
    return found
