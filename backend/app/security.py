"""Hash password (Argon2id) dan token sesi.

- Password tidak pernah disimpan sebagai teks: hanya hash Argon2id (salt acak sudah termasuk di dalam hash).
- Token sesi adalah 32 byte acak. Database hanya menyimpan SHA-256-nya, jadi bocornya database
  tidak membuat token bisa langsung dipakai.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime
from functools import lru_cache

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

_hasher = PasswordHasher()  # Argon2id, parameter bawaan argon2-cffi (RFC 9106, profil rendah memori)

# Huruf/angka yang tidak mudah tertukar saat dibacakan guru (tanpa 0/o, 1/l/i)
_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
MIN_PASSWORD_LENGTH = 8


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    """Bandingkan password dengan hash. Bila akun tidak punya hash, tetap jalankan verifikasi palsu
    agar waktu respons sama (penyerang tidak bisa menebak username dari lamanya respons)."""
    target = password_hash or _dummy_hash()
    try:
        ok = _hasher.verify(target, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    return ok and password_hash is not None


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


@lru_cache
def _dummy_hash() -> str:
    return _hasher.hash(secrets.token_urlsafe(16))


def generate_password(length: int = 10) -> str:
    return "".join(secrets.choice(_PASSWORD_ALPHABET) for _ in range(length))


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def utcnow() -> datetime:
    return datetime.now(UTC)


def as_utc(dt: datetime) -> datetime:
    """SQLite mengembalikan datetime tanpa zona waktu; semua nilai disimpan dalam UTC."""
    return dt if dt.tzinfo else dt.replace(tzinfo=UTC)
