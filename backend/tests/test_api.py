"""Tes endpoint dengan database SQLite sementara."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import SchoolClass, Student


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine)
    with TestSession() as db:
        db.add(SchoolClass(code="8A-2026"))
        db.add(Student(code="S01", class_code="8A-2026"))
        db.commit()

    def override():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "database": "ok", "problems_loaded": 18}


def test_verify_student_valid(client):
    r = client.post("/api/students/verify", json={"code": "S01", "class_code": "8a-2026"})
    assert r.json() == {"valid": True}


@pytest.mark.parametrize("body", [{"code": "S02", "class_code": "8A-2026"}, {"code": "S01", "class_code": "8B-2026"}])
def test_verify_student_invalid(client, body):
    assert client.post("/api/students/verify", json=body).json() == {"valid": False}


@pytest.mark.parametrize("code", ["Budi", "S1", "s01x", ""])
def test_verify_rejects_bad_format(client, code):
    r = client.post("/api/students/verify", json={"code": code, "class_code": "8A-2026"})
    assert r.status_code == 422


AUTH = {"code": "S01", "class_code": "8A-2026"}


def test_mltest_items_have_no_keys(client):
    body = client.get("/api/mltest").json()
    assert [i["id"] for i in body["items"]] == ["T1", "T2", "T3", "T4"]
    assert "answer" not in str(body)


def test_mltest_submit_scores_and_is_idempotent(client):
    payload = AUTH | {
        "submission_id": "8d0f6f7e-4b6b-4a5a-9a2e-0d7b9a1c2e33",
        "kind": "pre",
        "answers": {"T4": {"s5": "22", "s6": "Jawaban Doni salah; panjang busur 22 cm"}},
    }
    assert client.post("/api/mltest/submit", json=payload).json() == {"saved_items": 4}
    assert client.post("/api/mltest/submit", json=payload).json() == {"saved_items": 0}
    status = client.post("/api/mltest/status", json=AUTH).json()
    assert status == {"pre_done": True, "post_done": False}


def test_mltest_rejects_unknown_student(client):
    payload = {"code": "S09", "class_code": "8A-2026", "submission_id": "8d0f6f7e-4b6b-4a5a-9a2e-0d7b9a1c2e34",
               "kind": "post", "answers": {}}
    assert client.post("/api/mltest/submit", json=payload).status_code == 403


def test_records_insert_and_ignore_duplicates(client):
    payload = AUTH | {
        "attempts": [{"id": "11111111-1111-4111-8111-111111111111", "problem_id": "P01", "section_id": "guided",
                      "answer_value": "11", "answer_unit": "cm", "correct": True, "hints_used": 1,
                      "created_at": "2026-11-12T08:00:00Z"}],
        "effort": [{"id": "22222222-2222-4222-8222-222222222222", "section_id": "guided", "value": 5,
                    "created_at": "2026-11-12T08:05:00Z"}],
        "reflections": [{"id": "33333333-3333-4333-8333-333333333333", "prompt_id": "SE1",
                         "choice": "Karena busur bagian dari keliling", "score": 2,
                         "created_at": "2026-11-12T08:06:00Z"}],
    }
    assert client.post("/api/records", json=payload).json() == {"inserted": 3}
    assert client.post("/api/records", json=payload).json() == {"inserted": 0}


def test_records_validate_effort_range(client):
    payload = AUTH | {"effort": [{"id": "44444444-4444-4444-8444-444444444444", "section_id": "x", "value": 12,
                                  "created_at": "2026-11-12T08:05:00Z"}]}
    assert client.post("/api/records", json=payload).status_code == 422


def test_practice_check(client):
    r = client.post("/api/practice/check", json={"problem_id": "P01", "value": "38,5"})
    body = r.json()
    assert body["correct"] is False and body["misconception_id"] == "swap_formula"
    assert client.post("/api/practice/check", json={"problem_id": "P99", "value": "1"}).status_code == 404
