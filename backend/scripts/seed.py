"""Isi data awal: kelas & kode siswa (tanpa nama).

Contoh (dari folder backend/):
    python -m scripts.seed --class 8A-2026 --students 32
    python -m scripts.seed --class DEMO --students 3 --group uji-kecil
"""

from __future__ import annotations

import argparse

from app import models  # noqa: F401
from app.db import Base, SessionLocal, engine
from app.models import SchoolClass, Student


def seed(class_code: str, n_students: int, group: str | None = None, start: int = 1) -> list[str]:
    Base.metadata.create_all(engine)
    class_code = class_code.upper()
    codes = [f"S{i:02d}" if i < 100 else f"S{i}" for i in range(start, start + n_students)]
    with SessionLocal() as db:
        if db.get(SchoolClass, class_code) is None:
            db.add(SchoolClass(code=class_code))
        for code in codes:
            if db.get(Student, code) is None:
                db.add(Student(code=code, class_code=class_code, group_label=group))
        db.commit()
    return codes


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--class", dest="class_code", required=True)
    ap.add_argument("--students", type=int, default=3)
    ap.add_argument("--start", type=int, default=1, help="nomor awal kode siswa")
    ap.add_argument("--group", default=None)
    args = ap.parse_args()
    codes = seed(args.class_code, args.students, args.group, args.start)
    print(f"Kelas {args.class_code.upper()}: {codes[0]} s.d. {codes[-1]} ({len(codes)} siswa)")


if __name__ == "__main__":
    main()
