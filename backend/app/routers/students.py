"""Masuk siswa dengan kode siswa + kode kelas (FR-01, ADR-011)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import find_student
from ..db import get_db
from ..schemas import VerifyStudentIn, VerifyStudentOut

router = APIRouter(prefix="/api/students", tags=["siswa"])


@router.post("/verify", response_model=VerifyStudentOut)
def verify_student(body: VerifyStudentIn, db: Session = Depends(get_db)) -> VerifyStudentOut:
    """Kembalikan `valid=true` bila kode siswa terdaftar di kelas tersebut.

    Sengaja tidak membedakan "kode salah" dan "kelas salah" agar kode siswa lain tidak bisa ditebak.
    """
    return VerifyStudentOut(valid=find_student(db, body.code, body.class_code) is not None)
