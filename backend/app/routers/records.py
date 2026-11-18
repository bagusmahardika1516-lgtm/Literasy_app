"""Catatan belajar dari HP: jawaban latihan, skala usaha (Paas), refleksi, hasil bagian (F11, F14).

Idempoten: baris dengan id yang sudah ada diabaikan (antrean HP boleh mengirim ulang).

Hasil bagian (results) hanya dicatat bila bagian itu sudah terbuka untuk siswa ini dan semua soalnya
sudah dijawab (app/progression.py). Hasil yang tidak sah tidak menggagalkan seluruh kiriman: barisnya
dilewati dan dilaporkan di `rejected`, supaya antrean di HP tidak macet karena satu baris.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..auth import current_student
from ..content import sections
from ..db import get_db
from ..models import Attempt, EffortRating, Reflection, SectionResult, Student
from ..progression import completed_sections, completion_problem
from ..schemas import RecordsIn, RecordsOut, RejectedResultOut
from ..security import as_utc

router = APIRouter(prefix="/api/records", tags=["catatan belajar"])


@router.post("", response_model=RecordsOut, response_model_exclude_defaults=True)
def save_records(
    body: RecordsIn, student: Student = Depends(current_student), db: Session = Depends(get_db)
) -> RecordsOut:
    code = student.code
    inserted = 0
    known = {s["id"]: s for s in sections()}
    unknown = {r.section_id for r in body.results} - set(known)
    if unknown:
        raise HTTPException(422, detail=f"Bagian tidak dikenal: {sorted(unknown)}")

    # 1) Jawaban dulu: hasil bagian di kiriman yang sama diperiksa terhadap jawaban ini
    for model, rows in ((Attempt, body.attempts), (EffortRating, body.effort), (Reflection, body.reflections)):
        for row in rows:
            if db.get(model, row.id) is not None:
                continue
            db.add(model(student_code=code, **row.model_dump()))
            inserted += 1
    db.flush()

    # 2) Hasil bagian, urut waktu selesai: menyelesaikan bagian A membuka bagian B di kiriman yang sama
    done = completed_sections(db, code)
    rejected: list[RejectedResultOut] = []
    for row in sorted(body.results, key=lambda r: as_utc(r.completed_at)):
        if db.get(SectionResult, row.id) is not None:
            continue
        problem = completion_problem(db, code, known[row.section_id], row, done)
        if problem:
            reason, missing = problem
            rejected.append(RejectedResultOut(id=row.id, section_id=row.section_id, reason=reason, missing=missing))
            continue
        db.add(SectionResult(student_code=code, **row.model_dump()))
        inserted += 1
        done.add(row.section_id)

    db.commit()
    return RecordsOut(inserted=inserted, rejected=rejected)
