"""Uji Literasi Matematis (pretest/posttest) — evaluation.md §4.

Soal dikirim tanpa kunci; jawaban diskor di server per tahap (skor parsial).
Setiap jenis uji (pre/post) hanya boleh dikirim sekali per siswa.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import current_student
from ..content import mltest_items
from ..db import get_db
from ..engine.mltest import public_items, score_item
from ..models import MlTest, Student
from ..schemas import MlTestStatusOut, MlTestSubmitIn, MlTestSubmitOut

router = APIRouter(prefix="/api/mltest", tags=["uji literasi"])


def kind_totals(db: Session, student_code: str) -> dict[str, tuple[float, float]]:
    """{kind: (skor, skor maksimum)} — dipakai juga oleh /api/progress."""
    rows = db.execute(
        select(MlTest.kind, func.sum(MlTest.score), func.sum(MlTest.max_score))
        .where(MlTest.student_code == student_code)
        .group_by(MlTest.kind)
    ).all()
    return {kind: (float(s), float(m)) for kind, s, m in rows}


@router.get("")
def get_items() -> dict[str, Any]:
    return {"items": public_items(mltest_items())}


@router.get("/status", response_model=MlTestStatusOut)
def status(student: Student = Depends(current_student), db: Session = Depends(get_db)) -> MlTestStatusOut:
    totals = kind_totals(db, student.code)
    pre, post = totals.get("pre"), totals.get("post")
    return MlTestStatusOut(
        pre_done=pre is not None,
        post_done=post is not None,
        pre_score=pre[0] if pre else None,
        pre_max=pre[1] if pre else None,
        post_score=post[0] if post else None,
        post_max=post[1] if post else None,
    )


@router.post("/submit", response_model=MlTestSubmitOut)
def submit(
    body: MlTestSubmitIn, student: Student = Depends(current_student), db: Session = Depends(get_db)
) -> MlTestSubmitOut:
    code = student.code
    items = {i["id"]: i for i in mltest_items()}
    unknown = set(body.answers) - set(items)
    if unknown:
        raise HTTPException(422, detail=f"Soal tidak dikenal: {sorted(unknown)}")

    # id deterministik → kiriman ulang (koneksi putus) tidak menggandakan data
    row_ids = {item_id: uuid.uuid5(body.submission_id, item_id) for item_id in items}
    existing = set(
        db.scalars(select(MlTest.id).where(MlTest.student_code == code, MlTest.kind == body.kind)).all()
    )
    if existing and not existing <= set(row_ids.values()):
        raise HTTPException(409, detail="Uji ini sudah pernah dikirim.")

    saved = 0
    for item_id, item in items.items():
        if row_ids[item_id] in existing:
            continue
        answers = body.answers.get(item_id, {})
        result = score_item(item, answers)
        db.add(
            MlTest(
                id=row_ids[item_id],
                student_code=code,
                kind=body.kind,
                item_id=item_id,
                ml_process=result.ml_process,
                score=result.total,
                max_score=result.max_score,
                stage_scores=result.stage_scores,
                answers=answers,
            )
        )
        saved += 1
    db.commit()
    score, max_score = kind_totals(db, code)[body.kind]
    return MlTestSubmitOut(saved_items=saved, score=score, max_score=max_score)
