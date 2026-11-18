"""Progres & skor per bagian milik siswa yang sedang masuk (beranda, pindah HP).

Sumber: section_results (setiap kali bagian diselesaikan) + ml_tests (Uji Awal/Akhir).
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import current_student
from ..content import sections
from ..db import get_db
from ..models import SectionResult, Student
from ..progression import completed_sections, section_status, unlocked_sections
from ..schemas import ProgressOut, ScoreOut, SectionProgressOut
from .mltest import kind_totals

router = APIRouter(prefix="/api/progress", tags=["progres"])


def _ratio(s: ScoreOut) -> float:
    return s.score / s.max_score if s.max_score else 0.0


@router.get("", response_model=ProgressOut)
def get_progress(student: Student = Depends(current_student), db: Session = Depends(get_db)) -> ProgressOut:
    rows = db.scalars(
        select(SectionResult)
        .where(SectionResult.student_code == student.code)
        .order_by(SectionResult.completed_at)
    ).all()
    by_section: dict[str, list[SectionResult]] = {}
    for r in rows:
        by_section.setdefault(r.section_id, []).append(r)

    ml = kind_totals(db, student.code)
    done = completed_sections(db, student.code)
    unlocked = unlocked_sections(done)
    out: list[SectionProgressOut] = []
    for sec in sections():
        sid = sec["id"]
        access = {"unlocked": sid in unlocked, "status": section_status(sid, done, unlocked)}
        if sec["kind"] == "mltest":
            total = ml.get(sec.get("testKind", ""))
            score = ScoreOut(score=total[0], max_score=total[1]) if total else None
            out.append(
                SectionProgressOut(
                    section_id=sid,
                    done=total is not None,
                    times_completed=1 if total else 0,
                    last=score,
                    best=score,
                    **access,
                )
            )
            continue

        done_rows = by_section.get(sid, [])
        scored = [
            ScoreOut(score=float(r.score), max_score=float(r.max_score), completed_at=r.completed_at)
            for r in done_rows
            if r.score is not None and r.max_score is not None
        ]
        out.append(
            SectionProgressOut(
                section_id=sid,
                done=bool(done_rows),
                times_completed=len(done_rows),
                last=scored[-1] if scored else None,
                # persentase tertinggi; bila sama, yang terbaru
                best=max(reversed(scored), key=_ratio) if scored else None,
                last_completed_at=done_rows[-1].completed_at if done_rows else None,
                **access,
            )
        )
    return ProgressOut(sections=out)
