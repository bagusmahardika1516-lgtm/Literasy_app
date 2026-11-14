"""Kelola akun siswa: buat akun, reset password, nonaktifkan/aktifkan, daftar.

Tidak ada dashboard guru; peneliti/pengembang menjalankan skrip ini (dari folder backend/):

    python -m scripts.manage_accounts create --class 8A-2026 --students 32 --out akun-8a.csv
    python -m scripts.manage_accounts reset-password 8a-2026-s05
    python -m scripts.manage_accounts disable 8a-2026-s05
    python -m scripts.manage_accounts enable 8a-2026-s05
    python -m scripts.manage_accounts list --class 8A-2026

Password hanya ditampilkan SEKALI (database menyimpan hash Argon2id). File .csv sudah di-.gitignore;
bagikan ke guru lalu hapus.
"""

from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import models  # noqa: F401
from app.db import Base, SessionLocal, engine
from app.models import LoginSession, SchoolClass, Student
from app.security import generate_password, hash_password, utcnow


@dataclass
class Credential:
    code: str
    class_code: str
    username: str
    password: str


def make_username(class_code: str, code: str) -> str:
    return f"{class_code}-{code}".lower()


def student_codes(n: int, start: int = 1) -> list[str]:
    return [f"S{i:02d}" if i < 100 else f"S{i}" for i in range(start, start + n)]


def _set_password(student: Student, password: str) -> None:
    student.password_hash = hash_password(password)
    student.password_changed_at = utcnow()


def _revoke_sessions(db: Session, code: str, reason: str) -> None:
    db.execute(
        update(LoginSession)
        .where(LoginSession.student_code == code, LoginSession.revoked_at.is_(None))
        .values(revoked_at=utcnow(), revoked_reason=reason)
    )


def create_accounts(
    db: Session, class_code: str, n_students: int, start: int = 1, group: str | None = None
) -> tuple[list[Credential], list[str]]:
    """Buat siswa + akun. Siswa yang sudah punya akun dilewati (password lama tidak diubah).

    Mengembalikan (akun baru, peringatan)."""
    class_code = class_code.upper()
    if db.get(SchoolClass, class_code) is None:
        db.add(SchoolClass(code=class_code))
    created: list[Credential] = []
    warnings: list[str] = []
    for code in student_codes(n_students, start):
        student = db.get(Student, code)
        if student is not None and student.class_code != class_code:
            # Kunci utama siswa hanya `code` — dua kelas belum bisa memakai kode yang sama
            warnings.append(f"{code} sudah dipakai kelas {student.class_code}; dilewati. Pakai --start lain.")
            continue
        if student is None:
            student = Student(code=code, class_code=class_code, group_label=group)
            db.add(student)
        if student.password_hash:
            warnings.append(f"{code} sudah punya akun ({student.username}); dilewati.")
            continue
        student.username = make_username(class_code, code)
        password = generate_password()
        _set_password(student, password)
        created.append(Credential(code, class_code, student.username, password))
    db.commit()
    return created, warnings


def reset_password(db: Session, username: str) -> str:
    student = _find(db, username)
    password = generate_password()
    _set_password(student, password)
    _revoke_sessions(db, student.code, "password_reset")
    db.commit()
    return password


def set_active(db: Session, username: str, active: bool) -> None:
    student = _find(db, username)
    student.is_active = active
    if not active:
        _revoke_sessions(db, student.code, "disabled")
    db.commit()


def _find(db: Session, username: str) -> Student:
    student = db.scalar(select(Student).where(Student.username == username.strip().lower()))
    if student is None:
        raise SystemExit(f"Username tidak ditemukan: {username}")
    return student


def _write_csv(rows: list[Credential], out: str | None) -> None:
    fh = open(out, "w", newline="", encoding="utf-8") if out else sys.stdout  # noqa: SIM115
    try:
        w = csv.writer(fh)
        w.writerow(["kode", "kelas", "username", "password"])
        for r in rows:
            w.writerow([r.code, r.class_code, r.username, r.password])
    finally:
        if out:
            fh.close()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    c = sub.add_parser("create", help="buat kelas + akun siswa")
    c.add_argument("--class", dest="class_code", required=True)
    c.add_argument("--students", type=int, required=True)
    c.add_argument("--start", type=int, default=1, help="nomor awal kode siswa")
    c.add_argument("--group", default=None)
    c.add_argument("--out", default=None, help="simpan username+password ke file CSV")

    for name in ("reset-password", "disable", "enable"):
        sub.add_parser(name).add_argument("username")

    ls = sub.add_parser("list", help="daftar akun (tanpa password)")
    ls.add_argument("--class", dest="class_code", default=None)

    args = ap.parse_args()
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if args.cmd == "create":
            rows, warnings = create_accounts(db, args.class_code, args.students, args.start, args.group)
            for w in warnings:
                print(f"! {w}", file=sys.stderr)
            _write_csv(rows, args.out)
            if args.out:
                print(f"{len(rows)} akun baru disimpan ke {args.out}. Bagikan ke guru, lalu hapus file ini.")
        elif args.cmd == "reset-password":
            print(f"Password baru {args.username}: {reset_password(db, args.username)}")
            print("Sesi lama akun ini sudah dicabut.")
        elif args.cmd in ("disable", "enable"):
            set_active(db, args.username, args.cmd == "enable")
            print(f"{args.username}: {'aktif' if args.cmd == 'enable' else 'nonaktif (sesi dicabut)'}")
        else:
            q = select(Student).order_by(Student.class_code, Student.code)
            if args.class_code:
                q = q.where(Student.class_code == args.class_code.upper())
            for s in db.scalars(q):
                state = "aktif" if s.is_active else "nonaktif"
                print(f"{s.class_code}\t{s.code}\t{s.username or '(belum ada akun)'}\t{state}")


if __name__ == "__main__":
    main()
