"""Skema request/response (Pydantic v2)."""

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

STUDENT_CODE_PATTERN = r"^S\d{2,3}$"
CLASS_CODE_PATTERN = r"^[0-9A-Za-z][0-9A-Za-z-]{1,31}$"


class VerifyStudentIn(BaseModel):
    code: str = Field(pattern=STUDENT_CODE_PATTERN, examples=["S01"])
    class_code: str = Field(pattern=CLASS_CODE_PATTERN, examples=["8A-2026"])


class VerifyStudentOut(BaseModel):
    valid: bool


class HealthOut(BaseModel):
    status: str
    database: str
    problems_loaded: int


class CheckAnswerIn(BaseModel):
    problem_id: str
    value: str = Field(max_length=32)
    unit: str | None = Field(default=None, max_length=8)


class CheckAnswerOut(BaseModel):
    correct: bool
    unit_ok: bool
    feedback: str
    misconception_id: str | None = None


class StudentAuth(BaseModel):
    """Setiap kiriman data membawa kode siswa + kode kelas (diverifikasi ulang di server)."""

    code: str = Field(pattern=STUDENT_CODE_PATTERN)
    class_code: str = Field(pattern=CLASS_CODE_PATTERN)


# --- Uji Literasi ----------------------------------------------------------

class MlTestSubmitIn(StudentAuth):
    submission_id: uuid.UUID
    kind: Literal["pre", "post"]
    answers: dict[str, dict[str, Any]]  # {item_id: {stage_id: jawaban}}


class MlTestSubmitOut(BaseModel):
    saved_items: int


class MlTestStatusOut(BaseModel):
    pre_done: bool
    post_done: bool


# --- Catatan belajar (attempts, skala usaha, refleksi) ---------------------

class AttemptIn(BaseModel):
    id: uuid.UUID
    problem_id: str = Field(max_length=16)
    section_id: str = Field(max_length=32)
    answer_value: str | None = Field(default=None, max_length=64)
    answer_unit: str | None = Field(default=None, max_length=8)
    correct: bool
    misconception_id: str | None = Field(default=None, max_length=48)
    hints_used: int = Field(default=0, ge=0, le=3)
    duration_ms: int | None = Field(default=None, ge=0)
    created_at: datetime


class EffortIn(BaseModel):
    id: uuid.UUID
    section_id: str = Field(max_length=32)
    value: int = Field(ge=1, le=9)
    created_at: datetime


class ReflectionIn(BaseModel):
    id: uuid.UUID
    prompt_id: str = Field(max_length=16)
    choice: str | None = Field(default=None, max_length=200)
    free_text: str | None = Field(default=None, max_length=500)
    score: int | None = Field(default=None, ge=0, le=2)
    created_at: datetime


class RecordsIn(StudentAuth):
    attempts: list[AttemptIn] = Field(default_factory=list, max_length=200)
    effort: list[EffortIn] = Field(default_factory=list, max_length=50)
    reflections: list[ReflectionIn] = Field(default_factory=list, max_length=50)


class RecordsOut(BaseModel):
    inserted: int
