"""Isi data awal untuk pengembangan: kelas + akun siswa (tanpa nama).

Contoh (dari folder backend/):
    python -m scripts.seed --class DEMO --students 3

Password dicetak sekali ke layar. Untuk kelas sungguhan pakai `scripts.manage_accounts create --out ...`.
"""

from __future__ import annotations

import argparse

from app import models  # noqa: F401
from app.db import Base, SessionLocal, engine
from scripts.manage_accounts import Credential, create_accounts


def seed(class_code: str, n_students: int, group: str | None = None, start: int = 1) -> list[Credential]:
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        created, warnings = create_accounts(db, class_code, n_students, start, group)
    for w in warnings:
        print(f"! {w}")
    return created


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--class", dest="class_code", required=True)
    ap.add_argument("--students", type=int, default=3)
    ap.add_argument("--start", type=int, default=1, help="nomor awal kode siswa")
    ap.add_argument("--group", default=None)
    args = ap.parse_args()
    for c in seed(args.class_code, args.students, args.group, args.start):
        print(f"{c.code}\tusername: {c.username}\tpassword: {c.password}")


if __name__ == "__main__":
    main()
