"""Penskoran Uji Literasi (pedoman: skor parsial per tahap)."""

import pytest

from app.content import mltest_items
from app.engine.mltest import public_items, score_item, score_stage

ITEMS = {i["id"]: i for i in mltest_items()}


def perfect_answers(item):
    out = {}
    for st in item["stages"]:
        if st["type"] in ("choice", "number"):
            out[st["id"]] = st["answer"]
        elif st["type"] == "fields":
            out[st["id"]] = {f["id"]: f["answer"] for f in st["fields"]}
        else:
            out[st["id"]] = "alasan siswa"
    return out


@pytest.mark.parametrize("item_id", ["T1", "T2", "T3", "T4"])
def test_each_item_max_score_is_6(item_id):
    item = ITEMS[item_id]
    r = score_item(item, perfect_answers(item))
    assert r.max_score == 6
    assert r.total == 6


def test_total_instrument_is_24():
    assert sum(score_item(i, {}).max_score for i in ITEMS.values()) == 24


def test_partial_credit_when_later_stage_wrong():
    # Contoh pedoman: tahap awal benar, perhitungan akhir salah → tetap dapat skor tahap awal
    item = ITEMS["T2"]
    answers = perfect_answers(item) | {"s6": "616"}
    r = score_item(item, answers)
    assert r.total == 5
    assert r.stage_scores["s6"] == 0


def test_number_accepts_comma_and_tolerance():
    stage = {"type": "number", "score": 1, "answer": 154}
    assert score_stage(stage, "154") == 1
    assert score_stage(stage, "154,0") == 1
    assert score_stage(stage, "150") == 0
    assert score_stage(stage, None) == 0


def test_fields_all_or_nothing():
    stage = ITEMS["T2"]["stages"][1]
    assert score_stage(stage, {"r": "14", "theta": "90"}) == 1
    assert score_stage(stage, {"r": "28", "theta": "90"}) == 0
    assert score_stage(stage, "14") == 0


def test_text_stage_is_manual():
    assert score_stage({"type": "text", "score": 0}, "karena luas A lebih besar") == 0


def test_public_items_hide_answers():
    pub = public_items(list(ITEMS.values()))
    dumped = repr(pub)
    assert "'answer'" not in dumped and "'score'" not in dumped
    assert pub[0]["stages"][0]["choices"]  # pilihan tetap terkirim
