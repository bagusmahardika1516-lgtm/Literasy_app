"""Penskoran Uji Literasi per tahap (pedoman penskoran: skor parsial per tahap, bukan hanya jawaban akhir).

Isian bertipe "text" disimpan untuk dinilai manual oleh peneliti dan bernilai 0 di skor otomatis.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .checker import DEFAULT_TOLERANCE, parse_number


@dataclass
class ItemScore:
    item_id: str
    ml_process: str
    stage_scores: dict[str, float] = field(default_factory=dict)
    total: float = 0.0
    max_score: float = 0.0


def _num_ok(raw: Any, expected: float) -> bool:
    value = parse_number(str(raw)) if raw is not None else None
    if value is None:
        return False
    return abs(value - expected) <= abs(expected) * DEFAULT_TOLERANCE


def score_stage(stage: dict[str, Any], answer: Any) -> float:
    kind = stage["type"]
    if kind == "choice":
        return stage["score"] if answer == stage["answer"] else 0.0
    if kind == "number":
        return stage["score"] if _num_ok(answer, stage["answer"]) else 0.0
    if kind == "fields":
        if not isinstance(answer, dict):
            return 0.0
        ok = all(_num_ok(answer.get(f["id"]), f["answer"]) for f in stage["fields"])
        return stage["score"] if ok else 0.0
    return 0.0  # "text": dinilai manual


def score_item(item: dict[str, Any], answers: dict[str, Any]) -> ItemScore:
    result = ItemScore(item_id=item["id"], ml_process=item["mlProcess"])
    for stage in item["stages"]:
        s = float(score_stage(stage, answers.get(stage["id"])))
        result.stage_scores[stage["id"]] = s
        result.total += s
        result.max_score += float(stage["score"])
    return result


def is_filled(value: Any) -> bool:
    if isinstance(value, bool) or value is None:
        return False
    return isinstance(value, str | int | float) and str(value).strip() != ""


def stage_answered(stage: dict[str, Any], answer: Any) -> bool:
    """Apakah tahap sudah dijawab (bukan benar/salah). Tidak memengaruhi skor."""
    kind = stage["type"]
    if kind == "choice":
        return isinstance(answer, str) and answer in stage["choices"]
    if kind == "fields":
        return isinstance(answer, dict) and all(is_filled(answer.get(f["id"])) for f in stage["fields"])
    return is_filled(answer)  # number, text


def missing_answers(items: list[dict[str, Any]], answers: dict[str, Any]) -> list[str]:
    """Tahap yang belum dijawab, berbentuk "T1.s3". Dicocokkan dengan soal di mltest.json."""
    missing = []
    for item in items:
        given = answers.get(item["id"])
        given = given if isinstance(given, dict) else {}
        missing += [f"{item['id']}.{st['id']}" for st in item["stages"] if not stage_answered(st, given.get(st["id"]))]
    return missing


def public_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Salinan soal TANPA kunci jawaban & skor untuk dikirim ke HP siswa."""
    out = []
    for item in items:
        stages = []
        for st in item["stages"]:
            pub = {k: v for k, v in st.items() if k not in ("answer", "score")}
            if "fields" in st:
                pub["fields"] = [{k: v for k, v in f.items() if k != "answer"} for f in st["fields"]]
            stages.append(pub)
        out.append({k: item[k] for k in ("id", "title", "stem")} | {"stages": stages})
    return out
