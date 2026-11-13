"""Validasi konten JSON (api.md §1.2, testing.md §3).

Jalankan dari folder backend/:  python -m scripts.content_check
Keluar dengan kode 1 bila ada kesalahan.
"""

from __future__ import annotations

import re
import sys
from typing import Any

from app.content import load_json
from app.engine import circle

FORBIDDEN_TERMS = re.compile(r"radius|keliling busur|luas busur|panjang juring|sudut tengah", re.IGNORECASE)
MAX_SENTENCE_WORDS = 20
VALID_ASKED = {"arcLength", "sectorArea", "sectorPerimeter", "theta", "radius", "compareSectorArea", "evaluateClaim"}
VALID_PROCESS = {"formulate", "employ", "interpret"}
VALID_LEVEL = {"L1", "L2", "L3", "L4"}


def _num_in_text(value: float, text: str) -> bool:
    """Apakah nilai jawaban akhir tertulis di teks (format 22 / 7,33 / 1.250.000)?"""
    if value == int(value):
        forms = {str(int(value)), f"{int(value):,}".replace(",", ".")}
    else:
        forms = {f"{value:g}".replace(".", ",")}
    # angka yang menjadi bagian pecahan (mis. 22 pada "22/7") tidak dihitung
    return any(re.search(rf"(?<![\d.,/]){re.escape(f)}(?![\d,/]|\.\d)", text) for f in forms)


def check_problem(p: dict[str, Any]) -> list[str]:
    errs: list[str] = []
    pid = p.get("id", "?")

    if p.get("level") not in VALID_LEVEL:
        errs.append(f"{pid}: level tidak valid")
    if p.get("asked") not in VALID_ASKED:
        errs.append(f"{pid}: asked tidak valid")
    if not set(p.get("mlProcess", [])) <= VALID_PROCESS or not p.get("mlProcess"):
        errs.append(f"{pid}: mlProcess tidak valid")

    for s in p.get("stem", []):
        if len(s.split()) > MAX_SENTENCE_WORDS:
            errs.append(f"{pid}: kalimat soal > {MAX_SENTENCE_WORDS} kata: {s!r}")

    hints = p.get("hints", [])
    if len(hints) != 3:
        errs.append(f"{pid}: harus tepat 3 petunjuk (ada {len(hints)})")

    texts = " ".join(p.get("stem", []) + hints)
    if FORBIDDEN_TERMS.search(texts):
        errs.append(f"{pid}: memakai istilah terlarang (glossary.md §4)")

    try:
        expected = circle.solve(p)
    except Exception as exc:  # noqa: BLE001
        return errs + [f"{pid}: model tidak dapat diselesaikan: {exc}"]

    key = p["answer"]["value"]
    if isinstance(expected, str) or isinstance(key, str):
        if str(expected) != str(key):
            errs.append(f"{pid}: kunci {key!r} ≠ hasil engine {expected!r}")
    elif abs(expected - key) > 1e-9:
        errs.append(f"{pid}: kunci {key} ≠ hasil engine {expected}")

    if p.get("decision"):
        d = circle.solve_decision(p)
        if d != p["decision"]["answer"]:
            errs.append(f"{pid}: keputusan {p['decision']['answer']!r} ≠ hasil engine {d!r}")

    if len(hints) == 3 and not isinstance(key, str) and _num_in_text(float(key), hints[2]):
        errs.append(f"{pid}: petunjuk ke-3 memuat jawaban akhir ({key})")

    return errs


MAX_CARD_WORDS = 40


def check_mltest(items: list[dict[str, Any]]) -> list[str]:
    errs: list[str] = []
    total = 0.0
    for item in items:
        item_max = sum(st["score"] for st in item["stages"])
        total += item_max
        if item_max != 6:
            errs.append(f"{item['id']}: skor maksimum {item_max}, seharusnya 6")
        for st in item["stages"]:
            if st["type"] == "choice" and st["answer"] not in st["choices"]:
                errs.append(f"{item['id']}.{st['id']}: kunci tidak ada di pilihan")
    if total != 24:
        errs.append(f"Uji literasi: total skor {total}, seharusnya 24")
    return errs


def check_lessons(lessons: dict[str, Any], diagnostic: dict[str, Any]) -> list[str]:
    errs: list[str] = []
    cards = lessons["cards"]
    for cid, card in cards.items():
        n = len(card["body"].split())
        if n > MAX_CARD_WORDS:
            errs.append(f"Kartu {cid}: {n} kata (> {MAX_CARD_WORDS})")
        if FORBIDDEN_TERMS.search(card["body"]):
            errs.append(f"Kartu {cid}: memakai istilah terlarang")
    for deck, ids in lessons["decks"].items():
        errs.extend(f"Dek {deck}: kartu {i} tidak ada" for i in ids if i not in cards)
    for d in diagnostic["items"]:
        if d["remedial"] not in cards:
            errs.append(f"{d['id']}: kartu remedial {d['remedial']} tidak ada")
        if "choices" in d and d["answer"]["value"] not in d["choices"]:
            errs.append(f"{d['id']}: kunci tidak ada di pilihan")
    return errs


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")  # terminal Windows (cp1252) tidak bisa mencetak ✓/✗
    problems = load_json("problems.json")["problems"]
    errors: list[str] = []

    ids = [p["id"] for p in problems]
    dupes = {i for i in ids if ids.count(i) > 1}
    if dupes:
        errors.append(f"ID ganda: {sorted(dupes)}")

    for p in problems:
        errors.extend(check_problem(p))

    sections = load_json("sequence.json")["sections"]
    sids = [s["id"] for s in sections]
    if len(sids) != len(set(sids)):
        errors.append("ID bagian ganda di sequence.json")

    errors.extend(check_mltest(load_json("mltest.json")["items"]))
    errors.extend(check_lessons(load_json("lessons.json"), load_json("diagnostic.json")))

    if errors:
        print("✗ Konten bermasalah:")
        for e in errors:
            print("  -", e)
        return 1
    print(f"✓ Konten valid: {len(problems)} soal, {len(sections)} bagian.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
