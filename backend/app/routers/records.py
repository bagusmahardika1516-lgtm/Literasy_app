"""Catatan belajar dari HP: jawaban latihan, skala usaha (Paas), refleksi (F11, F14).

Idempoten: baris dengan id yang sudah ada diabaikan (antrean HP boleh mengirim ulang).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import current_student
from ..content import sections
from ..db import get_db
from ..models import Attempt, EffortRating, Reflection, SectionResult, Student
from ..schemas import RecordsIn, RecordsOut

router = APIRouter(prefix="/api/records", tags=["catatan belajar"])


@router.post("", response_model=RecordsOut)
def save_records(
    body: RecordsIn, student: Student = Depends(current_student), db: Session = Depends(get_db)
) -> RecordsOut:
    code = student.code
    inserted = 0
    known_sections = {s["id"] for s in sections()}
    unknown = {r.section_id for r in body.results} - known_sections
    if unknown:
        raise HTTPException(422, detail=f"Bagian tidak dikenal: {sorted(unknown)}")
    batches = (
        (Attempt, body.attempts),
        (EffortRating, body.effort),
        (Reflection, body.reflections),
        (SectionResult, body.results),
    )
    for model, rows in batches:
        for row in rows:
            if db.get(model, row.id) is not None:
                continue
            db.add(model(student_code=code, **row.model_dump()))
            inserted += 1
    db.commit()
    return RecordsOut(inserted=inserted)
