"""Skor akhir per bagian: simpan hasil, baca progres, skor Uji Literasi."""

import pytest

from .conftest import bearer, login


def result(rid, section="guided", score=4, max_score=6, at="2026-11-14T08:00:00Z", **extra):
    return {
        "id": rid,
        "section_id": section,
        "score": score,
        "max_score": max_score,
        "details": {"first_try": score, "hints": 1},
        "started_at": "2026-11-14T07:50:00Z",
        "completed_at": at,
    } | extra


def progress_of(client, headers):
    return {s["section_id"]: s for s in client.get("/api/progress", headers=headers).json()["sections"]}


def test_progress_empty_lists_all_sections(client, auth):
    p = progress_of(client, auth)
    assert len(p) == 12
    assert all(not s["done"] and s["last"] is None for s in p.values())


def test_results_saved_and_idempotent(client, auth):
    body = {"results": [result("aaaaaaaa-0000-4000-8000-000000000001")]}
    assert client.post("/api/records", json=body, headers=auth).json() == {"inserted": 1}
    assert client.post("/api/records", json=body, headers=auth).json() == {"inserted": 0}
    g = progress_of(client, auth)["guided"]
    assert g["done"] and g["times_completed"] == 1
    assert g["last"]["score"] == 4 and g["last"]["max_score"] == 6


def test_last_and_best_score(client, auth):
    body = {
        "results": [
            result("aaaaaaaa-0000-4000-8000-000000000001", score=5, at="2026-11-14T08:00:00Z"),
            result("aaaaaaaa-0000-4000-8000-000000000002", score=3, at="2026-11-14T09:00:00Z"),
        ]
    }
    client.post("/api/records", json=body, headers=auth)
    g = progress_of(client, auth)["guided"]
    assert g["times_completed"] == 2
    assert g["last"]["score"] == 3
    assert g["best"]["score"] == 5


def test_unscored_section_is_done_without_score(client, auth):
    body = {"results": [result("aaaaaaaa-0000-4000-8000-000000000003", section="explore", score=None, max_score=None)]}
    assert client.post("/api/records", json=body, headers=auth).status_code == 200
    e = progress_of(client, auth)["explore"]
    assert e["done"] and e["last"] is None and e["last_completed_at"]


@pytest.mark.parametrize(
    "bad",
    [
        {"section": "tidak-ada"},
        {"score": 7, "max_score": 6},
        {"score": 3, "max_score": None},
        {"details": {"x": "y" * 5000}},
    ],
)
def test_invalid_results_rejected(client, auth, bad):
    kw = {k: v for k, v in bad.items() if k != "section"}
    r = result("aaaaaaaa-0000-4000-8000-000000000004", section=bad.get("section", "guided"), **kw)
    assert client.post("/api/records", json={"results": [r]}, headers=auth).status_code == 422


def test_progress_is_per_student(client, auth):
    client.post("/api/records", json={"results": [result("aaaaaaaa-0000-4000-8000-000000000005")]}, headers=auth)
    s02 = bearer(login(client, "8a-2026-s02", "rahasia-s02"))
    assert progress_of(client, s02)["guided"]["done"] is False


def test_progress_requires_login(client):
    assert client.get("/api/progress").status_code == 401


SUBMIT = {
    "submission_id": "8d0f6f7e-4b6b-4a5a-9a2e-0d7b9a1c2e33",
    "kind": "pre",
    "answers": {"T4": {"s5": "22"}},
}


def test_mltest_score_returned_and_in_progress(client, auth):
    r = client.post("/api/mltest/submit", json=SUBMIT, headers=auth).json()
    assert r["saved_items"] == 4 and r["max_score"] == 24
    assert 0 <= r["score"] <= 24
    again = client.post("/api/mltest/submit", json=SUBMIT, headers=auth).json()
    assert again == r | {"saved_items": 0}  # kiriman ulang: skor sama, tidak berlipat

    st = client.get("/api/mltest/status", headers=auth).json()
    assert st["pre_done"] and st["pre_score"] == r["score"] and st["pre_max"] == 24
    assert st["post_score"] is None

    p = progress_of(client, auth)
    assert p["pretest"]["done"] and p["pretest"]["last"]["score"] == r["score"]
    assert p["posttest"]["done"] is False


def test_mltest_second_submission_rejected(client, auth):
    client.post("/api/mltest/submit", json=SUBMIT, headers=auth)
    other = SUBMIT | {"submission_id": "8d0f6f7e-4b6b-4a5a-9a2e-0d7b9a1c2e99"}
    assert client.post("/api/mltest/submit", json=other, headers=auth).status_code == 409
    # posttest tetap boleh
    post = other | {"kind": "post"}
    assert client.post("/api/mltest/submit", json=post, headers=auth).status_code == 200
