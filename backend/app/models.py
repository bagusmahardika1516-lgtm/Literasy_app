"""Tabel database (api.md §4.1). Hanya kode pseudonim — tidak ada nama siswa (privacy.md)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, CheckConstraint, DateTime, ForeignKey, Integer, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def _now() -> datetime:
    return datetime.now(UTC)


class SchoolClass(Base):
    __tablename__ = "classes"
    code: Mapped[str] = mapped_column(String(32), primary_key=True)  # mis. "8A-2026"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Student(Base):
    __tablename__ = "students"
    code: Mapped[str] = mapped_column(String(8), primary_key=True)  # "S01"
    class_code: Mapped[str] = mapped_column(ForeignKey("classes.code"), index=True)
    group_label: Mapped[str | None] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    # Akun login (scripts/manage_accounts.py). Username bukan nama asli (privacy.md).
    username: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255))  # Argon2id, tidak pernah teks asli
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class LoginSession(Base):
    """Sesi login. Satu akun hanya punya satu sesi aktif: login baru mencabut sesi lama."""

    __tablename__ = "login_sessions"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # SHA-256 dari token
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_reason: Mapped[str | None] = mapped_column(String(16))  # logout | new_login | password_reset | disabled
    device_label: Mapped[str | None] = mapped_column(String(64))


class LoginAttempt(Base):
    """Riwayat percobaan login untuk pembatasan (rate limit) — tetap berlaku walau server restart."""

    __tablename__ = "login_attempts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), index=True)
    ip: Mapped[str | None] = mapped_column(String(64), index=True)
    success: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)


class LearningSession(Base):
    __tablename__ = "sessions"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    app_version: Mapped[str | None] = mapped_column(String(32))
    device_class: Mapped[str | None] = mapped_column(String(8))


class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    session_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sessions.id"))
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    problem_id: Mapped[str] = mapped_column(String(16))
    section_id: Mapped[str] = mapped_column(String(32))
    answer_value: Mapped[str | None] = mapped_column(String(64))
    answer_unit: Mapped[str | None] = mapped_column(String(8))
    correct: Mapped[bool] = mapped_column(Boolean)
    misconception_id: Mapped[str | None] = mapped_column(String(48))
    hints_used: Mapped[int] = mapped_column(Integer, default=0)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class HintEvent(Base):
    __tablename__ = "hint_events"
    __table_args__ = (CheckConstraint("level between 1 and 3", name="hint_level_range"),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    attempt_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    problem_id: Mapped[str] = mapped_column(String(16))
    level: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EffortRating(Base):
    __tablename__ = "effort_ratings"
    __table_args__ = (CheckConstraint("value between 1 and 9", name="effort_range"),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    section_id: Mapped[str] = mapped_column(String(32))
    value: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Reflection(Base):
    __tablename__ = "reflections"
    __table_args__ = (CheckConstraint("score between 0 and 2", name="reflection_score_range"),)
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    prompt_id: Mapped[str] = mapped_column(String(16))
    choice: Mapped[str | None] = mapped_column(Text)
    free_text: Mapped[str | None] = mapped_column(Text)
    score: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Event(Base):
    __tablename__ = "events"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    session_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    type: Mapped[str] = mapped_column(String(32), index=True)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SectionResult(Base):
    """Hasil akhir satu kali menyelesaikan satu bagian belajar (skor per sesi).

    Bagian materi (tanpa soal) hanya tercatat selesai: score/max_score kosong.
    Uji Literasi tidak dicatat di sini — skornya dihitung dari tabel ml_tests.
    """

    __tablename__ = "section_results"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    section_id: Mapped[str] = mapped_column(String(32), index=True)
    score: Mapped[float | None] = mapped_column(Numeric(6, 2))
    max_score: Mapped[float | None] = mapped_column(Numeric(6, 2))
    details: Mapped[dict] = mapped_column(JSON, default=dict)  # mis. {"first_try": 5, "hints": 2, "items": {...}}
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class MlTest(Base):
    __tablename__ = "ml_tests"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    student_code: Mapped[str] = mapped_column(ForeignKey("students.code"), index=True)
    kind: Mapped[str] = mapped_column(String(4))  # pre | post
    item_id: Mapped[str] = mapped_column(String(16))
    ml_process: Mapped[str] = mapped_column(String(16))  # reasoning | formulate | employ | interpret
    score: Mapped[float] = mapped_column(Numeric(5, 2))
    max_score: Mapped[float] = mapped_column(Numeric(5, 2))
    stage_scores: Mapped[dict] = mapped_column(JSON, default=dict)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)  # termasuk isian "text" untuk dinilai manual
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
