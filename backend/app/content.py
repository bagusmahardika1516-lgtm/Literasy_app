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
def sections() -> list[dict[str, Any]]:
    """Urutan bagian belajar (content/sequence.json)."""
    return load_json("sequence.json")["sections"]


@lru_cache
def mltest_items() -> list[dict[str, Any]]:
    return load_json("mltest.json")["items"]


# --- ID soal per jenis bagian (dipakai untuk memeriksa "semua soal sudah dijawab") ---


@lru_cache
def diagnostic_item_ids() -> tuple[str, ...]:
    return tuple(i["id"] for i in load_json("diagnostic.json")["items"])


@lru_cache
def game_item_ids() -> tuple[str, ...]:
    return tuple(i["id"] for i in load_json("game.json")["items"])


@lru_cache
def example_prompts() -> dict[str, str | None]:
    """{id contoh: id prompt "Jelaskan ke Teman" atau None}."""
    return {e["id"]: e.get("selfExplain") for e in load_json("examples.json")["examples"]}
