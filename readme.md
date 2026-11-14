# Literasy — Busur & Juring

Aplikasi Android untuk membantu siswa SMP kelas VIII mempelajari **panjang busur dan luas juring lingkaran** dengan
desain yang **mengelola beban kognitif** (Cognitive Load Theory) dan bertujuan **meningkatkan literasi matematis**
(kerangka PISA: *formulate – employ – interpret/evaluate*). Ilustrasi 3D pendukung dibuat dengan **Three.js**.

> Status: **v0.3.0** — alur belajar lengkap: halaman awal → Uji Awal Literasi → cek prasyarat → eksplorasi 3D →
> konsep → bedakan busur/juring → permainan → contoh soal → latihan terbimbing/mandiri/literasi → refleksi →
> Uji Akhir Literasi. Keputusan desain: [decision-log.md](decision-log.md) (ADR-001 s.d. ADR-021).

## Mengapa aplikasi ini?

Wawancara dengan siswa yang pernah mempelajari materi ini (S01, kelas IX) menunjukkan:

- **Tertukar** antara rumus panjang busur dan luas juring karena "bentuk rumusnya hampir sama" (IL01).
- **Sulit pada soal cerita**: kalimat panjang, sulit menemukan informasi penting dan apa yang ditanyakan (EL01, EL05).
- **Terbantu** oleh gambar lingkaran dengan busur & juring berwarna berbeda (EL02), petunjuk sedikit demi sedikit (GL03),
  dan contoh soal yang mirip (GL05).
- **Terganggu** oleh terlalu banyak tulisan, warna, dan animasi (EL03, DS03) serta penjelasan yang terlalu cepat (EL04).

Seluruh fitur diturunkan dari temuan tersebut — lihat matriks keterlacakan di [prd.md](prd.md).

## Alur belajar

```
Diagnostik prasyarat → Eksplorasi 3D → Kartu Konsep → Contoh Terurai → Latihan Terbimbing
→ Latihan Mandiri → Soal Literasi (konteks nyata) → Refleksi "Jelaskan ke Teman"
```

## Teknologi

| Lapisan | Pilihan |
|---|---|
| Frontend (JavaScript) | React 18 + Vite + `vite-plugin-pwa` |
| Ilustrasi 3D | Three.js (dengan fallback SVG 2D) |
| Android | **PWA** dibuka dari tautan di Chrome Android, dapat "Tambahkan ke layar utama"; hosting **Vercel** (HTTPS). Capacitor (APK) ditunda |
| Backend (Python) | FastAPI + SQLAlchemy 2 + Pydantic v2 |
| Database | PostgreSQL (Supabase/Neon) untuk produksi; SQLite untuk pengembangan lokal |
| Penyimpanan lokal | localStorage (Sprint 0) → IndexedDB/Dexie sebagai buffer (Sprint 5) |
| Pengujian | Vitest + Testing Library (JS), pytest (Python), ruff, ESLint |

## Struktur folder

```
Literasy_app/
├── *.md              # dokumen perencanaan
├── content/          # JSON bersama: problems, lessons, diagnostic, examples, game, reflections,
│                     #   mltest (Uji Literasi T1–T4), sequence, practice, explore, welcome
├── backend/          # Python — FastAPI
│   ├── app/
│   │   ├── engine/   # circle.py (rumus), checker.py (pemeriksa jawaban)
│   │   ├── routers/  # students.py, practice.py, …
│   │   ├── models.py # tabel SQLAlchemy
│   │   └── main.py
│   ├── scripts/      # content_check.py, seed.py
│   └── tests/        # pytest
├── frontend/         # JavaScript — React + Vite PWA
│   ├── public/       # ikon, favicon
│   └── src/
│       ├── engine/   # circle.js, checker.js (+ tes Vitest)
│       ├── scenes/   # Three.js (CircleSectorScene) + fallback SVG
│       ├── features/ # auth, progress (beranda), explore, …
│       ├── data/     # profil & progres lokal
│       ├── api/      # klien HTTP ke backend
│       └── ui/       # tokens.css, Button, Slider
└── tools/            # make_icons.py
```

## Menjalankan

**Prasyarat:** Python ≥ 3.11 dan **Node.js LTS** (unduh di nodejs.org).

**1. Backend (terminal pertama)**

```bash
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-dev.txt     # macOS/Linux: .venv/bin/python
copy .env.example .env                                           # macOS/Linux: cp
.venv/Scripts/python -m scripts.seed --class DEMO --students 3   # akun demo-s01..s03, password tampil sekali
# Kelas sungguhan: python -m scripts.manage_accounts create --class 8A-2026 --students 32 --out akun-8a.csv
.venv/Scripts/python -m uvicorn app.main:app --reload --host 0.0.0.0
# Dokumentasi API: http://127.0.0.1:8000/docs
```

**2. Frontend (terminal kedua)**

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev        # buka http://localhost:5173, masuk dengan S01 + DEMO
npm run test       # unit test engine + tes kunci jawaban
npm run build      # build PWA
```

Mencoba di HP Android (satu Wi-Fi dengan laptop): buka `http://<IP-laptop>:5173`, lalu isi `VITE_API_URL` dengan
`http://<IP-laptop>:8000` dan tambahkan alamat itu ke `CORS_ORIGINS` di `backend/.env`.

**Tes & pemeriksaan**

```bash
cd backend && .venv/Scripts/python -m pytest && .venv/Scripts/python -m scripts.content_check
cd frontend && npm run lint && npm run test
```

**Pemakaian:** di kelas, didampingi guru, 2–3 pertemuan × 40 menit. Siswa membuka tautan, masuk dengan
username + password (sesi token, satu perangkat aktif). HP target: Android 11+ kelas menengah (RAM 4–6 GB), Chrome terbaru.

## Indeks dokumen

| Dokumen | Isi | Tahap ADDIE |
|---|---|---|
| [analysis.md](analysis.md) | Ringkasan wawancara & peta beban kognitif | Analysis |
| [prd.md](prd.md) | Kebutuhan produk & matriks keterlacakan | Analysis → Design |
| [design.md](design.md) | Prinsip CLT, design tokens, wireframe, spesifikasi 3D | Design |
| [content.md](content.md) | Materi, contoh, bank soal, petunjuk bertingkat | Design |
| [glossary.md](glossary.md) | Istilah baku, simbol, warna | Design |
| [architecture.md](architecture.md) | Arsitektur sistem & alur data | Design → Development |
| [api.md](api.md) | Skema konten, API engine, Scene API, Supabase | Development |
| [agents.md](agents.md) | Pedoman untuk AI coding agent (vibe coding) | Development |
| [task.md](task.md) | Backlog per sprint & tahap ADDIE | Semua |
| [testing.md](testing.md) | Rencana QA & pengujian perangkat | Development |
| [evaluation.md](evaluation.md) | Validasi ahli, uji coba, pre/post literasi, beban kognitif | Development → Evaluation |
| [decision-log.md](decision-log.md) | Jejak keputusan desain | Semua |
| [privacy.md](privacy.md) | Etika & perlindungan data siswa | Semua |
| [changelog.md](changelog.md) | Riwayat versi | Semua |

## Pengembang

Mahasiswa Pendidikan Matematika — mata kuliah Algoritma & Pemrograman. Proyek penelitian pengembangan (ADDIE).

## Lisensi

Ditentukan kemudian (disarankan MIT untuk kode, CC BY-SA 4.0 untuk konten materi).
