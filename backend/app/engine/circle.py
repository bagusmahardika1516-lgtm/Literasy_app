"""Rumus busur & juring lingkaran (padanan Python dari frontend/src/engine/circle.js).

Semua sudut dalam derajat. Mode pi: "22/7" atau "3.14" (glossary.md §3).
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from math import gcd, isclose, sqrt
from typing import Any, Literal

PiMode = Literal["22/7", "3.14"]

_PI_VALUES: dict[str, float] = {"22/7": 22 / 7, "3.14": 3.14}


def round2(x: float) -> float:
    """Bulatkan ke 2 desimal, setengah ke atas (cara sekolah): 14,665 -> 14,67."""
    # repr() memberi representasi desimal terpendek, sehingga 6.280000000000001 tetap 6.28
    return float(Decimal(repr(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _is_multiple_of_7(x: float) -> bool:
    q = x / 7
    return isclose(q, round(q), abs_tol=1e-9) and round(q) != 0


def pick_pi(r: float) -> PiMode:
    """22/7 bila jari-jari atau diameter kelipatan 7, selain itu 3,14."""
    return "22/7" if _is_multiple_of_7(r) or _is_multiple_of_7(2 * r) else "3.14"


def pi_value(mode: PiMode | None, r: float | None = None) -> float:
    if mode is None:
        if r is None:
            raise ValueError("mode pi atau r harus diberikan")
        mode = pick_pi(r)
    try:
        return _PI_VALUES[mode]
    except KeyError as exc:
        raise ValueError(f"mode pi tidak dikenal: {mode}") from exc


def _check_r(r: float) -> None:
    if r <= 0:
        raise ValueError("jari-jari harus positif")


def _check_theta(theta: float) -> None:
    if not 0 <= theta <= 360:
        raise ValueError("sudut pusat harus 0–360°")


def fraction(theta: float) -> float:
    _check_theta(theta)
    return theta / 360


def fraction_label(theta: int) -> str:
    """Pecahan sudut paling sederhana, mis. 90 -> '1/4', 360 -> '1'."""
    _check_theta(theta)
    if theta == 0:
        return "0"
    g = gcd(int(theta), 360)
    num, den = int(theta) // g, 360 // g
    return str(num) if den == 1 else f"{num}/{den}"


def circumference(r: float, pi: PiMode | None = None) -> float:
    _check_r(r)
    return 2 * pi_value(pi, r) * r


def circle_area(r: float, pi: PiMode | None = None) -> float:
    _check_r(r)
    return pi_value(pi, r) * r * r


def arc_length(r: float, theta: float, pi: PiMode | None = None) -> float:
    return fraction(theta) * circumference(r, pi)


def sector_area(r: float, theta: float, pi: PiMode | None = None) -> float:
    return fraction(theta) * circle_area(r, pi)


def sector_perimeter(r: float, theta: float, pi: PiMode | None = None) -> float:
    return 2 * r + arc_length(r, theta, pi)


def theta_from_arc(arc: float, r: float, pi: PiMode | None = None) -> float:
    return arc / circumference(r, pi) * 360


def theta_from_area(area: float, r: float, pi: PiMode | None = None) -> float:
    return area / circle_area(r, pi) * 360


def radius_from_arc(arc: float, theta: float, pi: PiMode = "22/7") -> float:
    if theta <= 0:
        raise ValueError("sudut pusat harus > 0")
    return arc / (fraction(theta) * 2 * pi_value(pi))


def radius_from_area(area: float, theta: float, pi: PiMode = "22/7") -> float:
    if theta <= 0:
        raise ValueError("sudut pusat harus > 0")
    return sqrt(area / (fraction(theta) * pi_value(pi)))


# ---------------------------------------------------------------------------
# Menyelesaikan soal dari konten JSON (content/problems.json)
# ---------------------------------------------------------------------------

def solve(problem: dict[str, Any]) -> float | str:
    """Hitung kunci jawaban dari field 'model' + 'asked' sebuah soal."""
    m = problem["model"]
    pi = problem.get("pi")
    asked = problem["asked"]
    mult = m.get("multiplier", 1)

    if asked == "arcLength":
        value = arc_length(m["r"], m["theta"], pi)
    elif asked == "sectorArea":
        value = sector_area(m["r"], m["theta"], pi)
    elif asked == "sectorPerimeter":
        value = sector_perimeter(m["r"], m["theta"], pi)
    elif asked == "theta":
        value = theta_from_arc(m["arc"], m["r"], pi) if "arc" in m else theta_from_area(m["area"], m["r"], pi)
    elif asked == "radius":
        value = radius_from_arc(m["arc"], m["theta"], pi) if "arc" in m else radius_from_area(m["area"], m["theta"], pi)
    elif asked == "compareSectorArea":
        a = round2(sector_area(m["a"]["r"], m["a"]["theta"], pi))
        b = round2(sector_area(m["b"]["r"], m["b"]["theta"], pi))
        return "A" if a > b else "B" if b > a else "Sama"
    elif asked == "evaluateClaim":
        if m["claim"] != "arcEqualsDiameter":
            raise ValueError(f"klaim tidak dikenal: {m['claim']}")
        return "ya" if isclose(arc_length(m["r"], m["theta"], pi), 2 * m["r"]) else "tidak"
    else:
        raise ValueError(f"jenis pertanyaan tidak dikenal: {asked}")

    return round2(value * mult)


def solve_decision(problem: dict[str, Any]) -> str | None:
    """Jawaban 'ya'/'tidak' untuk bagian keputusan (soal literasi L4)."""
    decision = problem.get("decision")
    if not decision:
        return None
    value = solve(problem)
    assert isinstance(value, float)
    ok = value >= decision["threshold"] if decision["rule"] == ">=" else value <= decision["threshold"]
    return "ya" if ok else "tidak"
