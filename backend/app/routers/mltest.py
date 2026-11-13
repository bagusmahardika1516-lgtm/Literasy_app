"""Uji Literasi Matematis (pretest/posttest) — evaluation.md §4.

Soal dikirim tanpa kunci; jawaban diskor di server per tahap (skor parsial).
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import require_student
from ..content import mltest_items
from ..db import get_db
from ..engine.mltest import public_items, score_item
from ..models import MlTest
from ..schemas import MlTestStatusOut, MlTestSubmitIn, MlTestSubmitOut, StudentAuth

router = APIRouter(prefix="/api/mltest", tags=["uji literasi"])


@router.get("")
def get_items() -> dict[str, Any]:
    return {"items": public_items(mltest_items())}


@router.post("/status", response_model=MlTestStatusOut)
def status(body: StudentAuth, db: Session = Depends(get_db)) -> MlTestStatusOut:
    code = require_student(db, body.code, body.class_code)
    kinds = set(db.scalars(select(MlTest.kind).where(MlTest.student_code == code)).all())
    return MlTestStatusOut(pre_done="pre" in kinds, post_done="post" in kinds)


@router.post("/submit", response_model=MlTestSubmitOut)
def submit(body: MlTestSubmitIn, db: Session = Depends(get_db)) -> MlTestSubmitOut:
    code = require_student(db, body.code, body.class_code)
    items = {i["id"]: i for i in mltest_items()}
    unknown = set(body.answers) - set(items)
    if unknown:
        raise HTTPException(422, detail=f"Soal tidak dikenal: {sorted(unknown)}")

    saved = 0
    for item_id, item in items.items():
        answers = body.answers.get(item_id, {})
        result = score_item(item, answers)
        # id deterministik → kiriman ulang (koneksi putus) tidak menggandakan data
        row_id = uuid.uuid5(body.submission_id, item_id)
        if db.get(MlTest, row_id) is not None:
            continue
        db.add(
            MlTest(
                id=row_id,
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
    return MlTestSubmitOut(saved_items=saved)
