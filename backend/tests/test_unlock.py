"""Pembukaan bagian bertahap (sequential unlock): app/progression.py + /api/records + /api/mltest/submit."""

import uuid

from app.content import mltest_items
from app.engine.mltest import score_item

from .conftest import bearer, complete_before, full_mltest_answers, login

ORDER = ["pretest", "diagnostic", "explore", "concept", "contrast", "game", "examples", "guided", "independent",
         "literacy", "reflection", "posttest"]
STARTED = "2026-11-14T07:50:00Z"


def rid():
    return str(uuid.uuid4())


def result(section, at="2026-11-14T08:00:00Z", details=None, score=None, max_score=None):
    return {"id": rid(), "section_id": section, "score": score, "max_score": max_score, "details": details or {},
            "started_at": STARTED, "completed_at": at}


def attempts(section, items, at="2026-11-14T07:55:00Z"):
    return [{"id": rid(), "problem_id": p, "section_id": section, "correct": False, "answer_value": "1",
             "created_at": at} for p in items]


def reflection(prompt, at="2026-11-14T07:56:00Z"):
    return {"id": rid(), "prompt_id": prompt, "choice": "x", "score": 0, "created_at": at}


def progress(client, headers):
    return {s["section_id"]: s for s in client.get("/api/progress", headers=headers).json()["sections"]}


def statuses(client, headers):
    return [progress(client, headers)[sid]["status"] for sid in ORDER]


def post(client, headers, **body):
    r = client.post("/api/records", json=body, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def submit_test(client, headers, kind="pre", answers=None):
    body = {"submission_id": rid(), "kind": kind, "answers": answers if answers is not None else full_mltest_answers()}
    return client.post("/api/mltest/submit", json=body, headers=headers)


# 1 — siswa baru hanya bisa membuka bagian pertama
def test_new_student_only_first_section_open(client, auth):
    assert statuses(client, auth) == ["open"] + ["locked"] * 11
    p = progress(client, auth)
    assert p["pretest"]["unlocked"] and not p["diagnostic"]["unlocked"]


# 2 — bagian ke-2 tidak bisa diselesaikan sebelum bagian ke-1 selesai
def test_cannot_complete_second_before_first(client, auth):
    body = post(client, auth, results=[result("diagnostic", details={"answers": {f"D{i}": "1" for i in range(1, 7)}})])
    assert body["inserted"] == 0
    assert body["rejected"][0]["reason"] == "section_locked"
    assert progress(client, auth)["diagnostic"]["done"] is False


# 3 — satu soal belum dijawab → belum selesai (Uji Literasi dan latihan)
def test_one_missing_test_stage_keeps_test_incomplete(client, auth):
    answers = full_mltest_answers()
    del answers["T3"]["s4"]
    r = submit_test(client, auth, answers=answers)
    assert r.status_code == 422
    assert r.json()["detail"]["code"] == "incomplete"
    assert r.json()["detail"]["missing"] == ["T3.s4"]
    assert progress(client, auth)["pretest"]["done"] is False


def test_blank_or_invalid_answers_do_not_count(client, auth):
    answers = full_mltest_answers()
    answers["T1"]["s7"] = "   "  # teks kosong
    answers["T2"]["s1"] = "pilihan yang tidak ada"
    answers["T2"]["s2"] = {"r": "7"}  # isian tidak lengkap
    r = submit_test(client, auth, answers=answers)
    assert r.status_code == 422
    assert sorted(r.json()["detail"]["missing"]) == ["T1.s7", "T2.s1", "T2.s2"]


def test_one_missing_practice_item_keeps_section_incomplete(client, auth, db_factory):
    complete_before(db_factory, "guided")
    body = post(client, auth, attempts=attempts("guided", ["P01", "P02", "P03", "P04", "P05"]),
                results=[result("guided", score=5, max_score=6)])
    assert body["rejected"] == [{"id": body["rejected"][0]["id"], "section_id": "guided", "reason": "incomplete",
                                 "missing": ["P06"]}]
    assert body["inserted"] == 5  # jawaban tetap tersimpan, hanya status selesai yang ditolak
    assert progress(client, auth)["guided"]["done"] is False


def test_answers_from_wrong_section_do_not_count(client, auth, db_factory):
    complete_before(db_factory, "guided")
    body = post(client, auth, attempts=attempts("literacy", ["P01", "P02", "P03", "P04", "P05", "P06"]),
                results=[result("guided")])
    assert body["rejected"][0]["reason"] == "incomplete"


def test_answers_from_before_this_run_do_not_count(client, auth, db_factory):
    complete_before(db_factory, "guided")
    body = post(client, auth, attempts=attempts("guided", ["P01", "P02", "P03", "P04", "P05", "P06"],
                                                at="2026-11-13T07:55:00Z"),
                results=[result("guided")])
    assert body["rejected"][0]["reason"] == "incomplete"


# 4 + 5 — semua soal dijawab → selesai, dan bagian berikutnya langsung terbuka
def test_full_test_completes_and_unlocks_next(client, auth):
    assert submit_test(client, auth).status_code == 200
    assert statuses(client, auth)[:3] == ["done", "open", "locked"]


def test_each_section_kind_requires_its_own_answers(client, auth):
    """Jalur lengkap: setiap bagian hanya selesai bila semua soalnya terjawab, lalu membuka bagian berikutnya."""
    assert submit_test(client, auth).status_code == 200
    steps = [
        ("diagnostic", {}, {"details": {"answers": {f"D{i}": "1" for i in range(1, 6)}}}, ["D6"]),
        ("diagnostic", {}, {"details": {"answers": {f"D{i}": "1" for i in range(1, 7)}}}, None),
        ("explore", {}, {}, None),
        ("concept", {}, {}, None),
        ("contrast", {}, {}, None),
        ("game", {}, {"details": {"answered": [f"G{i:02d}" for i in range(1, 10)]}}, ["G10"]),
        ("game", {}, {"details": {"answered": [f"G{i:02d}" for i in range(1, 11)]}}, None),
        ("examples", {"reflections": [reflection("SE1"), reflection("SE2")]}, {}, ["WE6"]),
        ("examples", {"reflections": [reflection("SE4")]}, {}, None),
        ("guided", {"attempts": attempts("guided", ["P01", "P02", "P03", "P04", "P05", "P06"])}, {}, None),
        ("independent", {"attempts": attempts("independent", ["P11", "P12", "P13", "P14"])}, {}, None),
        ("literacy", {"attempts": attempts("literacy", ["P07", "P08", "P09", "P10", "P15", "P16", "P17"])}, {},
         ["P18"]),
        ("literacy", {"attempts": attempts("literacy", ["P18"])}, {}, None),
        ("reflection", {"reflections": [reflection("SE5")]}, {}, None),
    ]
    for section, extra, res, missing in steps:
        body = post(client, auth, **extra, results=[result(section, **res)])
        if missing:
            assert body["rejected"][0]["missing"] == missing, section
            assert progress(client, auth)[section]["status"] == "open", section
        else:
            assert "rejected" not in body, (section, body)
            assert progress(client, auth)[section]["status"] == "done", section
    assert progress(client, auth)["posttest"]["status"] == "open"
    assert submit_test(client, auth, kind="post").status_code == 200
    assert statuses(client, auth) == ["done"] * 12


def test_completing_in_one_batch_unlocks_following_results(client, auth):
    """Antrean offline: beberapa bagian selesai berurutan terkirim dalam satu kiriman."""
    assert submit_test(client, auth).status_code == 200
    body = post(client, auth, results=[
        result("explore", at="2026-11-14T08:10:00Z"),
        result("diagnostic", at="2026-11-14T08:05:00Z", details={"answers": {f"D{i}": "1" for i in range(1, 7)}}),
    ])
    assert body == {"inserted": 2}
    assert statuses(client, auth)[:4] == ["done", "done", "done", "open"]


# 6 + 7 — mengulang bagian sebelumnya boleh dan tidak mengunci bagian berikutnya
def test_retake_previous_section_keeps_next_open(client, auth, db_factory):
    complete_before(db_factory, "game")  # sampai "contrast" selesai, "game" terbuka
    assert progress(client, auth)["game"]["status"] == "open"
    for at in ("2026-11-14T09:00:00Z", "2026-11-14T10:00:00Z"):
        assert post(client, auth, results=[result("explore", at=at)]) == {"inserted": 1}
    p = progress(client, auth)
    assert p["explore"]["times_completed"] == 3
    assert p["game"]["status"] == "open" and p["concept"]["status"] == "done"


def test_retaking_test_is_not_possible_but_keeps_progress(client, auth):
    assert submit_test(client, auth).status_code == 200
    assert submit_test(client, auth).status_code == 409  # Uji hanya sekali (aturan lama tetap)
    assert progress(client, auth)["diagnostic"]["status"] == "open"


# 8 — tidak bisa melompati bagian terkunci lewat request langsung
def test_cannot_skip_ahead_with_direct_requests(client, auth):
    body = post(client, auth, attempts=attempts("literacy", ["P07"]), results=[result("literacy")])
    assert body["rejected"][0]["reason"] == "section_locked"
    r = submit_test(client, auth, kind="post")
    assert r.status_code == 403 and r.json()["detail"]["code"] == "section_locked"
    assert statuses(client, auth) == ["open"] + ["locked"] * 11


def test_test_sections_cannot_be_marked_done_via_records(client, auth):
    body = post(client, auth, results=[result("pretest", score=24, max_score=24)])
    assert body["rejected"][0]["reason"] == "use_mltest_submit"
    assert progress(client, auth)["pretest"]["done"] is False


# 9 — progres tetap ada setelah keluar dan masuk lagi (atau di perangkat lain)
def test_progress_survives_logout_and_login(client, auth):
    assert submit_test(client, auth).status_code == 200
    before = statuses(client, auth)
    client.post("/api/auth/logout", headers=auth)
    again = bearer(login(client))
    assert statuses(client, again) == before == ["done", "open"] + ["locked"] * 10


# 10 — progres setiap siswa terpisah
def test_progress_is_separate_per_student(client, auth):
    assert submit_test(client, auth).status_code == 200
    s02 = bearer(login(client, "8a-2026-s02", "rahasia-s02"))
    assert statuses(client, s02) == ["open"] + ["locked"] * 11
    body = post(client, s02, results=[result("diagnostic", details={"answers": {f"D{i}": "1" for i in range(1, 7)}})])
    assert body["rejected"][0]["reason"] == "section_locked"


# 11 — penilaian dan riwayat tidak berubah
def test_test_scoring_unchanged(client, auth):
    answers = full_mltest_answers()
    expected = sum(score_item(it, answers[it["id"]]).total for it in mltest_items())
    r = submit_test(client, auth, answers=answers).json()
    assert r["score"] == expected and r["max_score"] == 24


def test_scores_and_history_kept(client, auth, db_factory):
    complete_before(db_factory, "game")
    full = {"answered": [f"G{i:02d}" for i in range(1, 11)]}
    post(client, auth, results=[result("game", details=full, score=8, max_score=10, at="2026-11-14T08:00:00Z")])
    post(client, auth, results=[result("game", details=full, score=10, max_score=10, at="2026-11-14T09:00:00Z")])
    g = progress(client, auth)["game"]
    assert g["times_completed"] == 2 and g["last"]["score"] == 10 and g["best"]["score"] == 10


# Transisi data lama: bagian yang sudah pernah selesai (sebelum aturan ini) tetap terbuka, begitu juga bagian sesudahnya
def test_legacy_progress_is_not_locked(client, auth, db_factory):
    from datetime import UTC, datetime

    from app.models import SectionResult

    with db_factory() as db:  # siswa dulu melompat langsung ke "independent" saat semua bagian masih terbuka
        db.add(SectionResult(id=uuid.uuid4(), student_code="S01", section_id="independent",
                             completed_at=datetime.now(UTC)))
        db.commit()
    p = progress(client, auth)
    assert p["independent"]["status"] == "done"
    assert p["literacy"]["status"] == "open"
    assert p["pretest"]["status"] == "open"
    assert p["diagnostic"]["status"] == "locked"
