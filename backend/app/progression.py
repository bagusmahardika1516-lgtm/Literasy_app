"""Pembukaan bagian bertahap (sequential unlock) dan syarat "bagian selesai".

Aturan pembukaan (sama persis dengan `unlockState` di frontend/src/data/progress.js):
- Bagian pertama selalu terbuka.
- Bagian ke-n terbuka bila bagian ke-(n-1) sudah selesai.
- Bagian yang sudah pernah selesai tetap terbuka. Ini menjaga progres lama (sebelum aturan ini ada)
  dan memastikan mengulang bagian tidak pernah mengunci bagian lain.

Status "selesai" diturunkan dari riwayat yang hanya ditambah, tidak pernah dihapus atau diubah:
`section_results` (setiap kali bagian diselesaikan) dan `ml_tests` (Uji Awal/Akhir). Karena itu
status terbuka bersifat permanen dan terpisah per akun siswa, tanpa tabel tambahan.

Syarat selesai = semua soal di bagian itu sudah dijawab (tanpa nilai minimum). Soal dicocokkan
dengan ID soal di folder content/, bukan dengan jumlah jawaban yang dikirim.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from .content import diagnostic_item_ids, example_prompts, game_item_ids, sections
from .engine.mltest import is_filled
from .models import Attempt, MlTest, Reflection, SectionResult
from .schemas import SectionResultIn
from .security import as_utc

# Jawaban dicatat di HP yang sama dengan waktu mulai bagian; toleransi kecil untuk pembulatan waktu
_CLOCK_TOLERANCE = timedelta(seconds=5)

# Alasan penolakan hasil bagian (dikirim ke frontend)
LOCKED = "section_locked"
INCOMPLETE = "incomplete"
USE_MLTEST_SUBMIT = "use_mltest_submit"


def section_by_id(section_id: str) -> dict[str, Any] | None:
    return next((s for s in sections() if s["id"] == section_id), None)


def mltest_section(kind: str) -> dict[str, Any]:
    return next(s for s in sections() if s["kind"] == "mltest" and s.get("testKind") == kind)


def completed_sections(db: Session, student_code: str) -> set[str]:
    """ID bagian yang sudah pernah diselesaikan siswa ini."""
    done = set(
        db.scalars(select(SectionResult.section_id).where(SectionResult.student_code == student_code).distinct())
    )
    test_kinds = set(db.scalars(select(MlTest.kind).where(MlTest.student_code == student_code).distinct()))
    for s in sections():
        if s["kind"] == "mltest" and s.get("testKind") in test_kinds:
            done.add(s["id"])
    return done


def unlocked_sections(done: set[str]) -> set[str]:
    out: set[str] = set()
    previous_done = True  # bagian pertama selalu terbuka
    for s in sections():
        sid = s["id"]
        if previous_done or sid in done:
            out.add(sid)
        previous_done = sid in done
    return out


def section_status(section_id: str, done: set[str], unlocked: set[str]) -> str:
    if section_id in done:
        return "done"
    return "open" if section_id in unlocked else "locked"


# --- Syarat "semua soal sudah dijawab" -------------------------------------------------------


def _since(row: SectionResultIn) -> datetime | None:
    return as_utc(row.started_at) - _CLOCK_TOLERANCE if row.started_at else None


def _answered_problems(db: Session, code: str, section_id: str, items: list[str], since: datetime | None) -> set[str]:
    rows = db.execute(
        select(Attempt.problem_id, Attempt.created_at).where(
            Attempt.student_code == code, Attempt.section_id == section_id, Attempt.problem_id.in_(items)
        )
    ).all()
    return {pid for pid, at in rows if since is None or as_utc(at) >= since}


def _answered_prompts(db: Session, code: str, prompts: set[str], since: datetime | None) -> set[str]:
    rows = db.execute(
        select(Reflection.prompt_id, Reflection.created_at).where(
            Reflection.student_code == code, Reflection.prompt_id.in_(prompts)
        )
    ).all()
    return {pid for pid, at in rows if since is None or as_utc(at) >= since}


def missing_answers(db: Session, code: str, section: dict[str, Any], row: SectionResultIn) -> list[str]:
    """ID soal yang belum dijawab pada pengerjaan ini. List kosong = lengkap."""
    kind, since = section["kind"], _since(row)

    if kind == "practice":
        # Setiap soal latihan tercatat sebagai attempt (jawaban yang dikirim siswa)
        answered = _answered_problems(db, code, section["id"], section["items"], since)
        return [p for p in section["items"] if p not in answered]

    if kind == "examples":
        # Contoh soal: yang perlu dijawab adalah "Jelaskan ke Teman" pada contoh yang memilikinya
        prompts = {eid: example_prompts().get(eid) for eid in section["items"]}
        answered = _answered_prompts(db, code, {p for p in prompts.values() if p}, since)
        return [eid for eid, p in prompts.items() if p and p not in answered]

    if kind == "reflection":
        prompt = section["prompt"]
        return [] if prompt in _answered_prompts(db, code, {prompt}, since) else [prompt]

    if kind == "diagnostic":
        answers = row.details.get("answers")
        answers = answers if isinstance(answers, dict) else {}
        return [i for i in diagnostic_item_ids() if not is_filled(answers.get(i))]

    if kind == "game":
        answered = row.details.get("answered")
        answered = {a for a in answered if isinstance(a, str)} if isinstance(answered, list) else set()
        return [i for i in game_item_ids() if i not in answered]

    return []  # explore, deck, contrast: materi tanpa soal, selesai saat dibaca sampai akhir


def completion_problem(
    db: Session, code: str, section: dict[str, Any], row: SectionResultIn, done: set[str]
) -> tuple[str, list[str]] | None:
    """None bila hasil bagian sah; selain itu (alasan, ID soal yang belum dijawab)."""
    if section["kind"] == "mltest":
        return USE_MLTEST_SUBMIT, []  # Uji Literasi diskor & dicatat lewat /api/mltest/submit
    if section["id"] not in unlocked_sections(done):
        return LOCKED, []
    missing = missing_answers(db, code, section, row)
    if missing:
        return INCOMPLETE, missing
    return None
