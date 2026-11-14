"""Identitas siswa dari token sesi (header `Authorization: Bearer <token>`).

Setiap endpoint data memakai dependency `current_student`; kode siswa tidak lagi dikirim di body.
Error 401 selalu membawa `detail.code` agar frontend bisa menampilkan pesan yang tepat.
"""

from __future__ import annotations

from datetime import timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models import LoginSession, Student
from .security import as_utc, hash_token, utcnow

_bearer = HTTPBearer(auto_error=False)

# Alasan pencabutan sesi → kode error untuk frontend
_REVOKED_CODES = {
    "new_login": "session_replaced",
    "password_reset": "session_revoked",
    "disabled": "account_disabled",
}


def unauthorized(code: str, message: str) -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        detail={"code": code, "message": message},
        headers={"WWW-Authenticate": "Bearer"},
    )


def current_session(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> LoginSession:
    if creds is None or creds.scheme.lower() != "bearer" or not creds.credentials:
        raise unauthorized("not_authenticated", "Silakan masuk terlebih dahulu.")

    session = db.scalar(select(LoginSession).where(LoginSession.token_hash == hash_token(creds.credentials)))
    if session is None:
        raise unauthorized("invalid_token", "Sesi tidak dikenal. Silakan masuk lagi.")
    if session.revoked_at is not None:
        code = _REVOKED_CODES.get(session.revoked_reason or "", "invalid_token")
        raise unauthorized(code, "Sesi sudah tidak berlaku. Silakan masuk lagi.")

    now = utcnow()
    if as_utc(session.expires_at) <= now:
        raise unauthorized("session_expired", "Sesi sudah habis. Silakan masuk lagi.")

    student = db.get(Student, session.student_code)
    if student is None or not student.is_active:
        raise unauthorized("account_disabled", "Akun ini dinonaktifkan.")

    # Sesi bergeser: selama dipakai, siswa tidak pernah keluar sendiri
    settings = get_settings()
    if (now - as_utc(session.last_seen_at)).total_seconds() >= settings.session_touch_seconds:
        session.last_seen_at = now
        session.expires_at = now + timedelta(days=settings.session_ttl_days)
        db.commit()
    return session


def current_student(session: LoginSession = Depends(current_session), db: Session = Depends(get_db)) -> Student:
    student = db.get(Student, session.student_code)
    assert student is not None  # sudah diperiksa di current_session
    return student
