"""Unit test pemeriksa jawaban (testing.md §2.2)."""

import pytest

from app.content import problems_by_id
from app.engine.checker import check_answer, parse_number

P = problems_by_id()


@pytest.mark.parametrize(
    ("raw", "expected"),
    [("7,33", 7.33), ("7.33", 7.33), (" 7,33 ", 7.33), ("22", 22.0), ("1.250.000", 1250000.0), ("7,3,3", None), ("", None), ("abc", None)],
)
def test_parse_number(raw, expected):
    assert parse_number(raw) == expected


def test_correct_answer_with_comma_and_rounding():
    assert check_answer(P["P08"], "14,67", "cm").correct
    assert check_answer(P["P08"], "14.666", "cm").correct


def test_wrong_unit_group_is_flagged():
    r = check_answer(P["P01"], "11", "cm2")
    assert not r.correct and not r.unit_ok
    assert "panjang" in r.feedback


def test_swap_formula_detected():
    r = check_answer(P["P01"], "38,5")
    assert r.misconception_id == "swap_formula"
    r = check_answer(P["P02"], "11")
    assert r.misconception_id == "swap_formula"


def test_forgot_fraction_detected():
    r = check_answer(P["P01"], "44")
    assert r.misconception_id == "forgot_fraction"
    assert "1/4" in r.feedback


def test_explicit_misconceptions_from_content():
    assert check_answer(P["P07"], "308").misconception_id == "diameter_as_radius"
    assert check_answer(P["P08"], "2,44").misconception_id == "minutes_as_degrees"
    assert check_answer(P["P14"], "22").misconception_id == "arc_only"


def test_choice_answers():
    assert check_answer(P["P16"], "a").correct
    assert not check_answer(P["P17"], "ya").correct


def test_unparseable_input():
    r = check_answer(P["P01"], "sebelas")
    assert not r.correct and "angka" in r.feedback
