"""Tes endpoint data dengan database SQLite sementara (fixture di conftest.py)."""

import pytest

from .conftest import bearer, full_mltest_answers, login


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "database": "ok", "problems_loaded": 18}


def test_old_verify_endpoint_removed(client):
    assert client.post("/api/students/verify", json={"code": "S01", "class_code": "8A-2026"}).status_code == 404


def test_mltest_items_have_no_keys(client):
    body = client.get("/api/mltest").json()
    assert [i["id"] for i in body["items"]] == ["T1", "T2", "T3", "T4"]
    assert "answer" not in str(body)


MLTEST = {
    "submission_id": "8d0f6f7e-4b6b-4a5a-9a2e-0d7b9a1c2e33",
    "kind": "pre",
    # Semua tahap wajib terisi (pembukaan bertahap); T4 s5/s6 tetap berisi jawaban contoh sebelumnya
    "answers": full_mltest_answers()
    | {"T4": full_mltest_answers()["T4"] | {"s5": "22", "s6": "Jawaban Doni salah; panjang busur 22 cm"}},
}


def test_mltest_submit_scores_and_is_idempotent(client, auth):
    first = client.post("/api/mltest/submit", json=MLTEST, headers=auth).json()
    assert first["saved_items"] == 4
    assert client.post("/api/mltest/submit", json=MLTEST, headers=auth).json()["saved_items"] == 0
    status = client.get("/api/mltest/status", headers=auth).json()
    assert (status["pre_done"], status["post_done"]) == (True, False)


def test_mltest_status_is_per_student(client, auth):
    client.post("/api/mltest/submit", json=MLTEST, headers=auth)
    s02 = bearer(login(client, "8a-2026-s02", "rahasia-s02"))
    status = client.get("/api/mltest/status", headers=s02).json()
    assert (status["pre_done"], status["post_done"], status["pre_score"]) == (False, False, None)


def test_mltest_requires_login(client):
    assert client.post("/api/mltest/submit", json=MLTEST).status_code == 401


def test_mltest_rejects_oversized_answers(client, auth):
    payload = MLTEST | {"answers": {"T1": {"s1": "x" * 25_000}}}
    assert client.post("/api/mltest/submit", json=payload, headers=auth).status_code == 422


def test_body_identity_is_ignored(client, auth, db_factory):
    """Kode siswa di body tidak dipakai lagi: identitas hanya dari token."""
    from app.models import Attempt

    payload = {
        "code": "S02",
        "class_code": "8A-2026",
        "attempts": [{"id": "55555555-5555-4555-8555-555555555555", "problem_id": "P01", "section_id": "guided",
                      "correct": True, "created_at": "2026-11-12T08:00:00Z"}],
    }
    assert client.post("/api/records", json=payload, headers=auth).json() == {"inserted": 1}
    with db_factory() as db:
        assert db.query(Attempt).one().student_code == "S01"


RECORDS = {
    "attempts": [{"id": "11111111-1111-4111-8111-111111111111", "problem_id": "P01", "section_id": "guided",
                  "answer_value": "11", "answer_unit": "cm", "correct": True, "hints_used": 1,
                  "created_at": "2026-11-12T08:00:00Z"}],
    "effort": [{"id": "22222222-2222-4222-8222-222222222222", "section_id": "guided", "value": 5,
                "created_at": "2026-11-12T08:05:00Z"}],
    "reflections": [{"id": "33333333-3333-4333-8333-333333333333", "prompt_id": "SE1",
                     "choice": "Karena busur bagian dari keliling", "score": 2,
                     "created_at": "2026-11-12T08:06:00Z"}],
}


def test_records_insert_and_ignore_duplicates(client, auth):
    assert client.post("/api/records", json=RECORDS, headers=auth).json() == {"inserted": 3}
    assert client.post("/api/records", json=RECORDS, headers=auth).json() == {"inserted": 0}


def test_records_require_login(client):
    assert client.post("/api/records", json=RECORDS).status_code == 401


def test_records_validate_effort_range(client, auth):
    payload = {"effort": [{"id": "44444444-4444-4444-8444-444444444444", "section_id": "x", "value": 12,
                           "created_at": "2026-11-12T08:05:00Z"}]}
    assert client.post("/api/records", json=payload, headers=auth).status_code == 422


@pytest.mark.parametrize("username", ["' OR '1'='1", "8a-2026-s01'; DROP TABLE students;--", "\" OR 1=1 --"])
def test_login_sql_injection_attempts_fail_safely(client, username):
    r = client.post("/api/auth/login", json={"username": username, "password": "' OR '1'='1"})
    assert r.status_code == 401
    login(client)  # tabel students masih utuh


def test_practice_check(client):
    r = client.post("/api/practice/check", json={"problem_id": "P01", "value": "38,5"})
    body = r.json()
    assert body["correct"] is False and body["misconception_id"] == "swap_formula"
    assert client.post("/api/practice/check", json={"problem_id": "P99", "value": "1"}).status_code == 404


def test_docs_can_be_disabled(monkeypatch):
    """DOCS_ENABLED=false menutup /docs dan /openapi.json (produksi)."""
    import importlib

    from fastapi.testclient import TestClient

    import app.main as main_mod
    from app.config import get_settings

    monkeypatch.setenv("DOCS_ENABLED", "false")
    get_settings.cache_clear()
    try:
        mod = importlib.reload(main_mod)
        c = TestClient(mod.app)
        assert c.get("/docs").status_code == 404
        assert c.get("/openapi.json").status_code == 404
    finally:
        monkeypatch.delenv("DOCS_ENABLED")
        get_settings.cache_clear()
        importlib.reload(main_mod)
