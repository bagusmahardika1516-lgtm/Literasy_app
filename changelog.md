# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan [Semantic Versioning](https://semver.org/).

Rencana versi: `0.1` dokumen → `0.5` prototipe untuk validasi ahli → `0.6` revisi ahli → `0.9` setelah uji kelompok
kecil → `1.0` setelah uji lapangan & evaluasi.

## [Unreleased]

### Direncanakan
- Wawancara Android sesi 2 (jumlah siswa, browser, proyektor, format ekspor).
- Data informan S02 di [analysis.md](analysis.md).
- Sprint 0 pengembangan ([task.md](task.md)).

## [0.3.0] — 2026-11-12

### Ditambahkan
- **Halaman awal** (sebelum masuk) dan beranda dengan 12 bagian belajar.
- **Materi**: Cek Prasyarat D1–D6 + kartu remedial, kartu konsep C1–C6, Modul Kontras Busur–Juring, contoh
  terurai WE1–WE6 (langkah dibuka satu per ketukan), refleksi "Jelaskan ke Teman" SE1–SE5.
- **Permainan "Busur atau Juring?"**: 10 kartu, tanpa poin/timer; kartu yang salah diulang di akhir.
- **Fitur menjawab soal**: Step Solver 5 langkah + Cek Kewajaran (terbimbing P01–P06), jawab langsung dengan
  petunjuk ≤ 1 (mandiri P11–P14), Tandai Info Penting + keputusan ya/tidak (literasi P07–P10, P15–P18); pilihan
  satuan, petunjuk 3 tingkat yang memudar, umpan balik miskonsepsi.
- **Uji Literasi (pretest/posttest)** dari "Soal Mathematical literacy.docx" Tabel 2 (T1–T4, skor maks 24):
  dijawab per tahap tanpa petunjuk, draf tersimpan, diskor per tahap di server (`/api/mltest`).
- **Skala usaha mental (Paas 1–9)** di akhir bagian; antrean catatan belajar → `POST /api/records`.
- Tes komponen (Testing Library) untuk Step Solver, soal literasi, permainan, Uji Literasi; uji ujung-ke-ujung di
  Edge headless ukuran HP (360 × 760).

### Diubah
- Posisi jawaban benar pada pilihan Uji Literasi dan SE1–SE4 dibuat bervariasi (sebelumnya selalu pilihan pertama).
- Kamera & label scene 3D diperbaiki agar label tidak bertumpuk.

### Perlu konfirmasi pengembang
- Rubrik T1 dan T3 di dokumen asli tidak sesuai jumlah tahap; dipakai penyesuaian sementara (lihat ADR-020).

## [0.2.0] — 2026-11-12

### Ditambahkan
- **Backend Python (FastAPI)**: `/api/health`, `/api/students/verify`, `/api/practice/check`; model SQLAlchemy untuk
  semua tabel penelitian; skrip `seed.py` dan `content_check.py`; 99 tes pytest lulus.
- **Engine rumus ganda**: `backend/app/engine/circle.py` & `frontend/src/engine/circle.js` + pemeriksa jawaban
  dengan deteksi miskonsepsi (rumus tertukar, lupa pecahan sudut, diameter sebagai jari-jari, dll.).
- **Konten bersama** `content/`: 18 soal (P01–P18) dalam JSON dengan kunci jawaban terverifikasi otomatis.
- **Frontend JavaScript (React + Vite PWA)**: login kode siswa, beranda/jalur, layar Eksplorasi dengan scene
  Three.js (busur oranye, juring biru, sudut hijau, slider θ & r, toggle, tampak atas) dan fallback SVG 2D.
- Ikon PWA dibuat dengan `tools/make_icons.py`; `vercel.json`; `.gitignore`.

### Diubah
- Stack: hanya Python & JavaScript (ADR-017, ADR-018, ADR-019). TypeScript → JavaScript; akses Supabase langsung →
  backend FastAPI.

### Catatan
- Frontend belum dijalankan/dites karena Node.js belum terpasang di komputer pengembang.

## [0.1.1-docs] — 2026-11-12

### Diubah (hasil wawancara Android sesi 1)
- Platform: APK Capacitor → **PWA** di Vercel; Capacitor ditunda (ADR-001, ADR-014).
- Penyimpanan: offline-first → online dengan buffer lokal Dexie (ADR-003).
- Target perangkat: HP kelas menengah Android 11+, pemakaian di kelas didampingi guru (ADR-013); target FPS 3D ≥ 45.
- Rekap guru dinaikkan dari P2 ke P1 sebagai F15 (ADR-015): tabel `teacher_classes`, RPC `class_recap`.
- Narasi audio dihapus dari rencana (ADR-016).
- Dokumen terdampak: readme, prd, architecture, api, agents, task, testing, privacy, decision-log.

## [0.1.0-docs] — 2026-11-12

### Ditambahkan
- Dokumen perencanaan: `readme.md`, `prd.md`, `agents.md`, `architecture.md`, `task.md`, `design.md`, `api.md`.
- Dokumen tambahan: `content.md`, `glossary.md`, `analysis.md`, `decision-log.md`, `evaluation.md`, `testing.md`,
  `privacy.md`, `changelog.md`.
- Matriks keterlacakan temuan wawancara S01 → fitur F01–F14.
- Bank soal P01–P18, contoh terurai WE1–WE6, diagnostik D1–D6, prompt refleksi SE1–SE5.
- Keputusan desain ADR-001 s.d. ADR-012.
