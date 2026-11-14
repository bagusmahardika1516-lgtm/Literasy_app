"""Skema request/response (Pydantic v2)."""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator

if TYPE_CHECKING:
    from .models import Student

MLTEST_ANSWERS_MAX_BYTES = 20_000  # jawaban 4 soal x beberapa tahap; jauh di atas kebutuhan wajar


class HealthOut(BaseModel):
    status: str
    database: str
    problems_loaded: int


class CheckAnswerIn(BaseModel):
    problem_id: str = Field(max_length=16)
    value: str = Field(max_length=32)
    unit: str | None = Field(default=None, max_length=8)


class CheckAnswerOut(BaseModel):
    correct: bool
    unit_ok: bool
    feedback: str
    misconception_id: str | None = None


# --- Login -----------------------------------------------------------------

class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=64, examples=["8a-s01"])
    password: str = Field(min_length=1, max_length=128)


class MeOut(BaseModel):
    code: str
    class_code: str
    username: str

    @classmethod
    def of(cls, student: Student) -> MeOut:
        return cls(code=student.code, class_code=student.class_code, username=student.username or "")


class LoginOut(BaseModel):
    token: str
    expires_at: datetime
    student: MeOut


# --- Uji Literasi ----------------------------------------------------------

class MlTestSubmitIn(BaseModel):
    submission_id: uuid.UUID
    kind: Literal["pre", "post"]
    answers: dict[str, dict[str, Any]] = Field(max_length=20)  # {item_id: {stage_id: jawaban}}

    @field_validator("answers")
    @classmethod
    def _limit_size(cls, v: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
        if len(json.dumps(v, ensure_ascii=False)) > MLTEST_ANSWERS_MAX_BYTES:
            raise ValueError("Jawaban terlalu panjang")
        return v


class MlTestSubmitOut(BaseModel):
    saved_items: int
    score: float
    max_score: float


class MlTestStatusOut(BaseModel):
    pre_done: bool
    post_done: bool
    pre_score: float | None = None
    pre_max: float | None = None
    post_score: float | None = None
    post_max: float | None = None


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


DETAILS_MAX_BYTES = 4_000


class SectionResultIn(BaseModel):
    id: uuid.UUID
    section_id: str = Field(max_length=32)
    score: float | None = Field(default=None, ge=0, le=1000)
    max_score: float | None = Field(default=None, gt=0, le=1000)
    details: dict[str, Any] = Field(default_factory=dict)
    started_at: datetime | None = None
    completed_at: datetime

    @field_validator("details")
    @classmethod
    def _limit_details(cls, v: dict[str, Any]) -> dict[str, Any]:
        if len(json.dumps(v, ensure_ascii=False)) > DETAILS_MAX_BYTES:
            raise ValueError("Detail hasil terlalu panjang")
        return v

    @model_validator(mode="after")
    def _score_pair(self) -> SectionResultIn:
        if (self.score is None) != (self.max_score is None):
            raise ValueError("score dan max_score harus diisi bersama")
        if self.score is not None and self.max_score is not None and self.score > self.max_score:
            raise ValueError("score melebihi max_score")
        return self


class RecordsIn(BaseModel):
    attempts: list[AttemptIn] = Field(default_factory=list, max_length=200)
    effort: list[EffortIn] = Field(default_factory=list, max_length=50)
    reflections: list[ReflectionIn] = Field(default_factory=list, max_length=50)
    results: list[SectionResultIn] = Field(default_factory=list, max_length=50)


# --- Progres (beranda) ------------------------------------------------------

class ScoreOut(BaseModel):
    score: float
    max_score: float
    completed_at: datetime | None = None


class SectionProgressOut(BaseModel):
    section_id: str
    done: bool
    times_completed: int
    last: ScoreOut | None = None  # skor penyelesaian terakhir (None untuk bagian materi)
    best: ScoreOut | None = None  # persentase tertinggi
    last_completed_at: datetime | None = None


class ProgressOut(BaseModel):
    sections: list[SectionProgressOut]


class RecordsOut(BaseModel):
    inserted: int
