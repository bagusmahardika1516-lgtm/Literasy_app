"""Pemeriksa jawaban siswa + deteksi miskonsepsi (F01, F09; content.md §4 'Umpan balik miskonsepsi')."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from . import circle

DEFAULT_TOLERANCE = 0.01  # relatif (prd.md FR-10)

# Satuan yang diharapkan per jenis pertanyaan → kelompok "panjang" / "luas"
_LENGTH_UNITS = {"cm", "m"}
_AREA_UNITS = {"cm2", "m2"}

_NUMBER_RE = re.compile(r"^[+-]?(\d+([.,]\d+)?|[.,]\d+)$")


@dataclass(frozen=True)
class CheckResult:
    correct: bool
    unit_ok: bool
    feedback: str
    misconception_id: str | None = None


def parse_number(raw: str) -> float | None:
    """Terima '7,33', '7.33', ' 7,33 ', dan pemisah ribuan titik '1.250.000'."""
    s = raw.strip().replace(" ", "")
    if not s:
        return None
    if s.count(".") > 1 and "," not in s:  # 1.250.000
        s = s.replace(".", "")
    if not _NUMBER_RE.match(s):
        return None
    return float(s.replace(",", "."))


def _close(a: float, b: float, tol: float = DEFAULT_TOLERANCE) -> bool:
    if b == 0:
        return abs(a) < 1e-9
    return abs(a - b) / abs(b) <= tol


def _unit_group(unit: str | None) -> str | None:
    if unit in _LENGTH_UNITS:
        return "length"
    if unit in _AREA_UNITS:
        return "area"
    return None


def _generic_misconceptions(problem: dict[str, Any]) -> list[tuple[float, str, str]]:
    """Kandidat jawaban salah yang umum, dihitung dari model soal."""
    asked = problem["asked"]
    m = problem["model"]
    pi = problem.get("pi")
    if asked not in ("arcLength", "sectorArea") or "r" not in m:
        return []
    r, theta = m["r"], m["theta"]
    out: list[tuple[float, str, str]] = []
    if asked == "arcLength":
        out.append((circle.sector_area(r, theta, pi), "swap_formula",
                    "Itu luas juring. Yang ditanya panjang busur → pakai keliling."))
        out.append((circle.circumference(r, pi), "forgot_fraction",
                    f"Itu keliling seluruh lingkaran. Busurmu hanya {circle.fraction_label(int(theta))}-nya."))
    else:
        out.append((circle.arc_length(r, theta, pi), "swap_formula",
                    "Itu panjang busur. Juring adalah daerah → pakai luas."))
        out.append((circle.circle_area(r, pi), "forgot_fraction",
                    f"Itu luas seluruh lingkaran. Juringmu hanya {circle.fraction_label(int(theta))}-nya."))
    return out


def check_answer(problem: dict[str, Any], raw: str, unit: str | None = None) -> CheckResult:
    """Periksa jawaban akhir. Untuk soal pilihan, `raw` dibandingkan sebagai teks."""
    expected = problem["answer"]["value"]
    tol = problem["answer"].get("tolerance", DEFAULT_TOLERANCE)

    if isinstance(expected, str):
        ok = raw.strip().lower() == expected.lower()
        return CheckResult(ok, True, "✓ Tepat." if ok else "Belum tepat. Coba hitung dan bandingkan lagi.")

    value = parse_number(raw)
    if value is None:
        return CheckResult(False, True, "Tulis jawaban berupa angka, misalnya 22 atau 7,33.")

    expected_unit = problem["answer"].get("unit")
    unit_ok = unit is None or expected_unit is None or unit == expected_unit
    if not unit_ok and _unit_group(unit) != _unit_group(expected_unit):
        wanted = "panjang" if _unit_group(expected_unit) == "length" else "luas"
        return CheckResult(False, False,
                           f"Satuanmu {unit.replace('2', '²') if unit else '-'}. Yang ditanya {wanted}.")

    if _close(value, float(expected), tol):
        return CheckResult(True, unit_ok, "✓ Tepat.")

    for mc in problem.get("misconceptions", []):
        if _close(value, float(mc["answer"]), tol):
            return CheckResult(False, unit_ok, mc["feedback"], mc.get("id"))

    for candidate, mc_id, feedback in _generic_misconceptions(problem):
        if _close(value, candidate, tol):
            return CheckResult(False, unit_ok, feedback, mc_id)

    return CheckResult(False, unit_ok, "Belum tepat. Periksa langkahmu satu per satu, atau buka petunjuk.")
