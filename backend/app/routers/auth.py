"""Login / logout / profil siswa (sesi token, satu perangkat aktif per akun)."""

from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from ..auth import current_session, current_student, unauthorized
from ..config import get_settings
from ..db import get_db
from ..models import LoginAttempt, LoginSession, Student
from ..schemas import LoginIn, LoginOut, MeOut
from ..security import as_utc, hash_password, hash_token, needs_rehash, new_token, utcnow, verify_password

router = APIRouter(prefix="/api/auth", tags=["login"])


def _client_ip(request: Request) -> str | None:
    # Di balik proxy hosting, jalankan uvicorn dengan --proxy-headers agar ini berisi IP asli.
    return request.client.host if request.client else None


def _too_many_failures(db: Session, username: str, ip: str | None) -> bool:
    settings = get_settings()
    since = utcnow() - timedelta(minutes=settings.login_window_minutes)

    # Kegagalan dihitung sejak login berhasil terakhir (salah ketik setelah berhasil tidak menumpuk)
    last_ok = db.scalar(
        select(func.max(LoginAttempt.created_at)).where(
            LoginAttempt.username == username, LoginAttempt.success.is_(True), LoginAttempt.created_at > since
        )
    )
    user_since = max(since, as_utc(last_ok)) if last_ok is not None else since
    user_failures = db.scalar(
        select(func.count()).where(
            LoginAttempt.username == username, LoginAttempt.success.is_(False), LoginAttempt.created_at > user_since
        )
    )
    if user_failures >= settings.login_max_failures_per_user:
        return True
    if ip is None:
        return False
    ip_failures = db.scalar(
        select(func.count()).where(
            LoginAttempt.ip == ip, LoginAttempt.success.is_(False), LoginAttempt.created_at > since
        )
    )
    return ip_failures >= settings.login_max_failures_per_ip


def _log_attempt(db: Session, username: str, ip: str | None, success: bool) -> None:
    db.add(LoginAttempt(username=username, ip=ip, success=success, created_at=utcnow()))
    # Riwayat lama tidak diperlukan untuk pembatasan
    db.execute(delete(LoginAttempt).where(LoginAttempt.created_at < utcnow() - timedelta(days=1)))
    db.commit()


@router.post("/login", response_model=LoginOut)
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)) -> LoginOut:
    settings = get_settings()
    username = body.username.strip().lower()
    ip = _client_ip(request)

    if _too_many_failures(db, username, ip):
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "too_many_attempts", "message": "Terlalu banyak percobaan. Tunggu beberapa menit."},
            headers={"Retry-After": str(settings.login_window_minutes * 60)},
        )

    student = db.scalar(select(Student).where(Student.username == username))
    # verify_password selalu dijalankan (juga bila username tidak ada) agar waktu respons sama
    ok = verify_password(student.password_hash if student else None, body.password)
    if not ok or student is None:
        _log_attempt(db, username, ip, success=False)
        raise unauthorized("invalid_credentials", "Username atau password salah.")
    if not student.is_active:
        _log_attempt(db, username, ip, success=False)
        raise unauthorized("account_disabled", "Akun ini dinonaktifkan.")

    assert student.password_hash is not None
    if needs_rehash(student.password_hash):
        student.password_hash = hash_password(body.password)

    now = utcnow()
    # Satu akun = satu perangkat aktif: cabut semua sesi lain milik siswa ini
    db.execute(
        update(LoginSession)
        .where(LoginSession.student_code == student.code, LoginSession.revoked_at.is_(None))
        .values(revoked_at=now, revoked_reason="new_login")
    )
    token = new_token()
    session = LoginSession(
        student_code=student.code,
        token_hash=hash_token(token),
        created_at=now,
        last_seen_at=now,
        expires_at=now + timedelta(days=settings.session_ttl_days),
        device_label=(request.headers.get("user-agent") or "")[:64] or None,
    )
    db.add(session)
    _log_attempt(db, username, ip, success=True)  # commit sesi + log sekaligus
    return LoginOut(token=token, expires_at=session.expires_at, student=MeOut.of(student))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(session: LoginSession = Depends(current_session), db: Session = Depends(get_db)) -> None:
    session.revoked_at = utcnow()
    session.revoked_reason = "logout"
    db.commit()


@router.get("/me", response_model=MeOut)
def me(student: Student = Depends(current_student)) -> MeOut:
    return MeOut.of(student)
