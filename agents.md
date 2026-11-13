# agents.md — Pedoman untuk AI Coding Agent

Dokumen ini dibaca oleh AI coding agent (Claude Code, Cursor, Copilot, dll.) sebelum mengubah kode proyek ini.
Proyek dikembangkan dengan pendekatan *vibe coding* oleh mahasiswa Pendidikan Matematika; agent wajib menjaga
**kualitas pedagogis** sama ketatnya dengan kualitas kode.

## 1. Konteks singkat

- **PWA** untuk Chrome Android untuk siswa SMP kelas VIII: **panjang busur & luas juring**. Dipakai di kelas, online,
  didampingi guru, HP kelas menengah. Tanpa audio. Capacitor ditunda — jangan menambahkannya tanpa keputusan baru.
- **Bahasa yang diizinkan hanya Python dan JavaScript** (ADR-017, ADR-018):
  - `frontend/` — **JavaScript** (bukan TypeScript): React + Vite + `vite-plugin-pwa` + Three.js, hosting Vercel.
  - `backend/` — **Python**: FastAPI + SQLAlchemy 2 + PostgreSQL (SQLite untuk pengembangan lokal).
  - `content/` — JSON bersama yang dibaca kedua sisi.
- Tujuan: meningkatkan **literasi matematis** dengan **mengelola beban kognitif** (CLT).
- Kebutuhan berasal dari wawancara siswa — kode temuan (K, IL, EL, GL, DS) di [analysis.md](analysis.md).
- Baca berurutan sebelum bekerja: [prd.md](prd.md) → [design.md](design.md) → [architecture.md](architecture.md) →
  [api.md](api.md) → [glossary.md](glossary.md) → [task.md](task.md).

## 2. Guardrail CLT (tidak boleh dilanggar)

| # | Aturan | Sumber |
|---|---|---|
| G1 | Satu ide utama per layar; teks kartu ≤ 40 kata | EL01, DS03 |
| G2 | Maks. 3 warna semantik: busur `--c-arc`, juring `--c-sector`, sudut `--c-angle`. Jangan tambah warna aksen baru | EL03, IL01 |
| G3 | Tanpa animasi dekoratif, auto-play, timer, confetti, suara, getar | EL03, EL04 |
| G4 | Animasi hanya untuk perubahan matematis, ≤ 300 ms, hormati `prefers-reduced-motion` | EL03 |
| G5 | Label & penjelasan berada di dekat gambar yang dijelaskannya, pada layar yang sama | EL02 |
| G6 | Tombol Kembali dan Ulangi selalu ada pada layar materi | EL04 |
| G7 | Petunjuk bertingkat; petunjuk tingkat 3 tidak boleh berisi jawaban akhir | GL03 |
| G8 | Istilah persis seperti [glossary.md](glossary.md) — jangan pakai "radius", "keliling busur", dll. | EL01 |
| G9 | Setiap fitur/PR baru menyebut ID fitur (F01–F14) dan kode temuan yang mendasarinya | Pedoman bagian H |
| G10 | Jangan menambah gamifikasi (poin, leaderboard, badge animasi) tanpa keputusan baru di [decision-log.md](decision-log.md) | Non-goal PRD |
| G11 | Tanpa suara/narasi audio | ADR-016 |
| G12 | Prompt pembaruan PWA & prompt install hanya di beranda, tidak pernah menyela soal | EL04 |

Bila permintaan pengguna bertentangan dengan guardrail, **jelaskan konfliknya** dan usulkan alternatif sebelum menulis kode.

## 3. Konvensi kode

**JavaScript (frontend/)**
- ES modules, tanpa TypeScript. Tipe didokumentasikan dengan JSDoc (`@typedef`, `@param`) untuk fungsi publik.
- Komponen React fungsi + hooks; satu komponen per file; < 200 baris.
- **Konten tidak di-hardcode** di komponen — impor dari `@content/*.json` (folder `/content` di root; skema
  [api.md](api.md#1-skema-konten-json)).
- `src/engine/` adalah JS murni (tanpa import React/DOM) dan wajib punya unit test (Vitest).
- Rumus hanya di `src/engine/circle.js`; komponen tidak menghitung rumus sendiri.
- Gaya: CSS Modules + `src/ui/tokens.css`; tidak memakai warna literal di komponen.
- Nama file: `PascalCase.jsx` untuk komponen, `camelCase.js` untuk modul.
- Format: Prettier; lint: ESLint (`react`, `react-hooks`, `jsx-a11y`).

**Python (backend/)**
- Python ≥ 3.11, type hints di semua fungsi; FastAPI router per domain di `app/routers/`.
- Rumus hanya di `app/engine/circle.py`; **harus identik** dengan `frontend/src/engine/circle.js` — setiap perubahan
  rumus diubah di kedua file dan diuji oleh tes konten di kedua sisi.
- Skema request/response di `app/schemas.py` (Pydantic v2); tabel di `app/models.py` (SQLAlchemy 2).
- Lint: `ruff`; tes: `pytest`.

Teks antarmuka berbahasa Indonesia; identifier kode berbahasa Inggris.

## 4. Aturan Three.js

- Gunakan helper di `scenes/core/` (renderer singleton, `renderOnDemand`, `disposeObject`).
- Jangan membuat loop `requestAnimationFrame` permanen; render saat ada perubahan.
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- `dispose()` wajib membersihkan geometry, material, texture, controls, dan event listener.
- Setiap scene 3D harus punya padanan SVG di `scenes/svg/` dengan `SceneHandle` yang sama.
- Tanpa bayangan dinamis, post-processing, atau tekstur > 256 px.
- Model konteks: glTF low-poly ≤ 200 KB, dibundel lokal.
- Import modular: `import { Mesh } from 'three'`; addon dari `three/examples/jsm/...`.

## 5. Privasi & keamanan

- **Jangan pernah** menulis nama asli siswa, foto, nomor HP, atau data wawancara mentah di kode, komentar, commit,
  fixture tes, log, atau prompt AI. Gunakan kode `S01`, `S02`.
- Jangan commit `.env*`. Frontend hanya mengenal `VITE_API_URL`; kredensial database **hanya** ada di backend
  (`DATABASE_URL`). Frontend tidak pernah terhubung langsung ke database.
- Endpoint siswa hanya boleh menulis data/membaca milik kode itu sendiri; data kelas hanya untuk guru terautentikasi.
- Lihat [privacy.md](privacy.md).

## 6. Perintah

```bash
# frontend/ (butuh Node.js LTS)
npm run dev            # server pengembangan (http://localhost:5173)
npm run lint           # ESLint
npm run test           # Vitest (unit + komponen)
npm run content:check  # validasi JSON konten & kunci jawaban (sisi JS)
npm run build          # build produksi + service worker
npm run preview        # uji build lokal

# backend/ (Python, venv di backend/.venv)
.venv/Scripts/python -m uvicorn app.main:app --reload   # API di http://127.0.0.1:8000 (docs: /docs)
.venv/Scripts/python -m pytest                          # tes
.venv/Scripts/python -m ruff check .                     # lint
.venv/Scripts/python -m scripts.content_check            # validasi konten (sisi Python)
.venv/Scripts/python -m scripts.seed --class DEMO --students 3
```
(macOS/Linux: ganti `.venv/Scripts/python` dengan `.venv/bin/python`.)

Deploy: push ke branch → Vercel membuat preview URL; merge ke `main` → production. Jangan deploy manual dengan
kunci produksi dari mesin lokal.

## 7. Definition of Done

- [ ] Frontend: `lint`, `test`, `content:check`, `build` lulus. Backend: `pytest`, `ruff`, `content_check` lulus.
- [ ] Fitur memenuhi guardrail G1–G10; PR menyebut ID fitur + kode temuan.
- [ ] Unit test untuk logika engine baru; test komponen untuk interaksi utama.
- [ ] Dicek di viewport 360 × 760 dan mode gelap; target sentuh ≥ 48 dp.
- [ ] Scene 3D: dispose teruji, fallback SVG berjalan, ≥ 45 FPS di HP kelas menengah; Three.js tetap di-code-split.
- [ ] Lighthouse PWA tetap lulus.
- [ ] Event logging untuk interaksi baru ditambahkan bila relevan untuk evaluasi.
- [ ] [task.md](task.md) dicentang; [changelog.md](changelog.md) diperbarui; keputusan baru dicatat di
      [decision-log.md](decision-log.md).

## 8. Cara bekerja yang diharapkan

1. Baca task terkait di [task.md](task.md) dan dokumen rujukannya.
2. Usulkan rencana singkat (file yang disentuh, risiko CLT) sebelum perubahan besar.
3. Kerjakan dalam langkah kecil yang dapat diuji.
4. Jangan mengubah isi materi matematika atau kunci jawaban tanpa konfirmasi; jika menemukan kesalahan hitung di
   [content.md](content.md), laporkan beserta perhitungannya.
5. Jangan menambah dependensi besar tanpa alasan; catat di decision-log bila menambah.
