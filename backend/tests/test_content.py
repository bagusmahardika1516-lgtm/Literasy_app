"""Semua kunci jawaban di content/problems.json harus cocok dengan engine (agents.md §8.4)."""

import pytest

from app.content import load_json
from app.engine import circle
from scripts.content_check import check_problem

PROBLEMS = load_json("problems.json")["problems"]


def test_has_18_problems():
    assert len(PROBLEMS) == 18
    assert [p["id"] for p in PROBLEMS] == [f"P{i:02d}" for i in range(1, 19)]


@pytest.mark.parametrize("problem", PROBLEMS, ids=lambda p: p["id"])
def test_answer_key_matches_engine(problem):
    assert circle.solve(problem) == problem["answer"]["value"]


@pytest.mark.parametrize("problem", [p for p in PROBLEMS if p.get("decision")], ids=lambda p: p["id"])
def test_decision_matches_engine(problem):
    assert circle.solve_decision(problem) == problem["decision"]["answer"]


@pytest.mark.parametrize("problem", PROBLEMS, ids=lambda p: p["id"])
def test_content_rules(problem):
    assert check_problem(problem) == []
