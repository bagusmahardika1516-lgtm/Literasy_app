"""Memuat konten JSON bersama (folder /content di root proyek)."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from .config import get_settings


def load_json(name: str, content_dir: Path | None = None) -> dict[str, Any]:
    path = (content_dir or get_settings().content_dir) / name
    with path.open(encoding="utf-8") as f:
        return json.load(f)


@lru_cache
def problems_by_id() -> dict[str, dict[str, Any]]:
    return {p["id"]: p for p in load_json("problems.json")["problems"]}


@lru_cache
def mltest_items() -> list[dict[str, Any]]:
    return load_json("mltest.json")["items"]
