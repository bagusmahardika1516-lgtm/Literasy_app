"""Login, logout, satu perangkat aktif, kedaluwarsa, pembatasan percobaan, hash password."""

from datetime import timedelta

import pytest
from sqlalchemy import select

from app.models import LoginSession, Student
from app.security import hash_password, hash_token, utcnow, verify_password
from scripts.manage_accounts import create_accounts, reset_password, set_active

from .conftest import PASSWORD, bearer, login


def error_code(r):
    return r.json()["detail"]["code"]


def test_login_returns_token_and_profile(client):
    r = client.post("/api/auth/login", json={"username": "8A-2026-S01 ", "password": PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert body["student"] == {"code": "S01", "class_code": "8A-2026", "username": "8a-2026-s01"}
    assert len(body["token"]) >= 40
    me = client.get("/api/auth/me", headers=bearer(body["token"]))
    assert me.json()["code"] == "S01"


@pytest.mark.parametrize(
    "username,password",
    [("8a-2026-s01", "salah"), ("tidak-ada", PASSWORD), ("8a-2026-s03", "apa-saja")],  # s03: belum punya password
)
def test_login_rejects_with_same_message(client, username, password):
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 401
    assert r.json()["detail"] == {"code": "invalid_credentials", "message": "Username atau password salah."}


def test_token_stored_only_as_hash(client, db_factory):
    token = login(client)
    with db_factory() as db:
        row = db.scalar(select(LoginSession))
        assert row.token_hash == hash_token(token)
        assert token not in row.token_hash


def test_password_stored_as_argon2id(db_factory):
    with db_factory() as db:
        s = db.get(Student, "S01")
        assert s.password_hash.startswith("$argon2id$")
        assert PASSWORD not in s.password_hash
    h = hash_password("abc12345")
    assert h != hash_password("abc12345")  # salt acak
    assert verify_password(h, "abc12345") and not verify_password(h, "abc12346")
    assert not verify_password(None, "abc12345")


@pytest.mark.parametrize("path", ["/api/auth/me", "/api/mltest/status"])
def test_endpoints_require_token(client, path):
    r = client.get(path)
    assert r.status_code == 401
    assert error_code(r) == "not_authenticated"
    assert r.headers["www-authenticate"] == "Bearer"
    assert error_code(client.get(path, headers=bearer("token-palsu"))) == "invalid_token"


def test_new_login_replaces_old_device(client):
    first = login(client)
    second = login(client)
    r = client.get("/api/auth/me", headers=bearer(first))
    assert r.status_code == 401
    assert error_code(r) == "session_replaced"
    assert client.get("/api/auth/me", headers=bearer(second)).status_code == 200


def test_other_student_login_does_not_affect_session(client):
    s01 = login(client)
    login(client, "8a-2026-s02", "rahasia-s02")
    assert client.get("/api/auth/me", headers=bearer(s01)).status_code == 200


def test_logout_revokes_session(client):
    token = login(client)
    assert client.post("/api/auth/logout", headers=bearer(token)).status_code == 204
    assert error_code(client.get("/api/auth/me", headers=bearer(token))) == "invalid_token"


def test_expired_session(client, db_factory):
    token = login(client)
    with db_factory() as db:
        row = db.scalar(select(LoginSession))
        row.expires_at = utcnow() - timedelta(minutes=1)
        db.commit()
    assert error_code(client.get("/api/auth/me", headers=bearer(token))) == "session_expired"


def test_session_slides_forward_when_used(client, db_factory):
    token = login(client)
    with db_factory() as db:
        row = db.scalar(select(LoginSession))
        row.last_seen_at = utcnow() - timedelta(days=10)
        row.expires_at = utcnow() + timedelta(days=1)
        db.commit()
    assert client.get("/api/auth/me", headers=bearer(token)).status_code == 200
    with db_factory() as db:
        row = db.scalar(select(LoginSession))
        assert row.expires_at.replace(tzinfo=None) > (utcnow() + timedelta(days=29)).replace(tzinfo=None)


def test_rate_limit_after_repeated_failures(client):
    for _ in range(5):
        r = client.post("/api/auth/login", json={"username": "8a-2026-s01", "password": "salah"})
        assert r.status_code == 401
    r = client.post("/api/auth/login", json={"username": "8a-2026-s01", "password": PASSWORD})
    assert r.status_code == 429
    assert error_code(r) == "too_many_attempts"
    assert int(r.headers["retry-after"]) > 0
    # akun lain tidak ikut terkunci
    assert client.post("/api/auth/login", json={"username": "8a-2026-s02", "password": "rahasia-s02"}).status_code == 200


def test_success_resets_failure_count(client):
    for _ in range(4):
        client.post("/api/auth/login", json={"username": "8a-2026-s01", "password": "salah"})
    login(client)
    for _ in range(4):
        assert client.post("/api/auth/login", json={"username": "8a-2026-s01", "password": "x"}).status_code == 401
    login(client)


def test_reset_password_revokes_sessions(client, db_factory):
    token = login(client)
    with db_factory() as db:
        new_pw = reset_password(db, "8a-2026-s01")
    assert error_code(client.get("/api/auth/me", headers=bearer(token))) == "session_revoked"
    assert client.post("/api/auth/login", json={"username": "8a-2026-s01", "password": PASSWORD}).status_code == 401
    login(client, password=new_pw)


def test_disabled_account(client, db_factory):
    token = login(client)
    with db_factory() as db:
        set_active(db, "8a-2026-s01", False)
    assert error_code(client.get("/api/auth/me", headers=bearer(token))) == "account_disabled"
    r = client.post("/api/auth/login", json={"username": "8a-2026-s01", "password": PASSWORD})
    assert error_code(r) == "account_disabled"


def test_create_accounts_cli(db_factory):
    with db_factory() as db:
        created, warnings = create_accounts(db, "8b-2026", 2, start=10)
        assert [c.username for c in created] == ["8b-2026-s10", "8b-2026-s11"]
        assert all(len(c.password) == 10 for c in created)
        # S01 milik kelas lain → dilewati dengan peringatan, S03 (belum punya akun) tetap di kelasnya
        created2, warnings2 = create_accounts(db, "8B-2026", 1, start=1)
        assert created2 == [] and "8A-2026" in warnings2[0]
        again, warnings3 = create_accounts(db, "8B-2026", 2, start=10)
        assert again == [] and len(warnings3) == 2
