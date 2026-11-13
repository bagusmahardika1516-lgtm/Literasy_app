"""Buat ikon PWA (PNG) tanpa dependensi: juring biru + busur oranye di atas lingkaran abu.

Jalankan dari root proyek:  python tools/make_icons.py
Hasil: frontend/public/icons/icon-192.png, icon-512.png, icon-maskable-512.png
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "icons"

WHITE = (255, 255, 255)
DISC = (228, 231, 235)
SECTOR = (0, 114, 178)  # --c-sector
ARC = (230, 159, 0)  # --c-arc


def _png(width: int, height: int, rows: list[bytes]) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + r for r in rows)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def draw(size: int, scale: float, ss: int = 3) -> bytes:
    """scale = jari-jari relatif terhadap setengah sisi (maskable perlu lebih kecil). ss = supersampling."""
    c = size / 2
    r = c * scale
    arc_w = r * 0.14
    theta = math.radians(90)
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            acc = [0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    px = x + (sx + 0.5) / ss - c
                    py = c - (y + (sy + 0.5) / ss)
                    d = math.hypot(px, py)
                    a = math.atan2(py, px) % (2 * math.pi)
                    col = WHITE
                    if d <= r:
                        col = SECTOR if a <= theta else DISC
                    if abs(d - r) <= arc_w / 2 and a <= theta:
                        col = ARC
                    for i in range(3):
                        acc[i] += col[i]
            row += bytes(v // (ss * ss) for v in acc)
        rows.append(bytes(row))
    return _png(size, size, rows)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "icon-192.png").write_bytes(draw(192, 0.82))
    (OUT / "icon-512.png").write_bytes(draw(512, 0.82))
    (OUT / "icon-maskable-512.png").write_bytes(draw(512, 0.6))  # zona aman maskable ±80%
    print(f"Ikon dibuat di {OUT}")


if __name__ == "__main__":
    main()
