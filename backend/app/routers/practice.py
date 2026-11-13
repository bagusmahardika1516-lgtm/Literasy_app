"""Pemeriksaan jawaban di server — dipakai untuk memverifikasi data uji coba.

Umpan balik langsung di HP dihitung oleh engine JS (frontend/src/engine), endpoint ini memakai
logika yang sama sehingga keduanya bisa dibandingkan di tes.
"""

from fastapi import APIRouter, HTTPException

from ..content import problems_by_id
from ..engine.checker import check_answer
from ..schemas import CheckAnswerIn, CheckAnswerOut

router = APIRouter(prefix="/api/practice", tags=["latihan"])


@router.post("/check", response_model=CheckAnswerOut)
def check(body: CheckAnswerIn) -> CheckAnswerOut:
    problem = problems_by_id().get(body.problem_id)
    if problem is None:
        raise HTTPException(status_code=404, detail="Soal tidak ditemukan")
    r = check_answer(problem, body.value, body.unit)
    return CheckAnswerOut(
        correct=r.correct, unit_ok=r.unit_ok, feedback=r.feedback, misconception_id=r.misconception_id
    )
