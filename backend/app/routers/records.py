"""Catatan belajar dari HP: jawaban latihan, skala usaha (Paas), refleksi (F11, F14).

Idempoten: baris dengan id yang sudah ada diabaikan (antrean HP boleh mengirim ulang).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import require_student
from ..db import get_db
from ..models import Attempt, EffortRating, Reflection
from ..schemas import RecordsIn, RecordsOut

router = APIRouter(prefix="/api/records", tags=["catatan belajar"])


@router.post("", response_model=RecordsOut)
def save_records(body: RecordsIn, db: Session = Depends(get_db)) -> RecordsOut:
    code = require_student(db, body.code, body.class_code)
    inserted = 0
    for model, rows in ((Attempt, body.attempts), (EffortRating, body.effort), (Reflection, body.reflections)):
        for row in rows:
            if db.get(model, row.id) is not None:
                continue
            db.add(model(student_code=code, **row.model_dump()))
            inserted += 1
    db.commit()
    return RecordsOut(inserted=inserted)
