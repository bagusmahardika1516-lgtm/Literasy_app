# Laporan Audit Literasy

> **Status: usang.** Ditulis sebelum commit `1b8d05c` (login username + password, sesi token) dan `4ed8e09` (progres di server). Banyak temuan di bawah sudah diperbaiki. Simpan sebagai arsip; jangan dipakai sebagai acuan tanpa diperiksa ulang ke kode.

- **Tanggal audit:** 14 November 2026
- **Commit terakhir saat audit:** `b5adb7a` (branch `main`)
- **Perubahan yang belum di-commit saat audit:** `frontend/package.json`, `frontend/package-lock.json` (upgrade dependensi), folder `.vscode/`
- **Sifat audit:** hanya membaca. Tidak ada kode, konfigurasi, atau database proyek yang diubah. Tidak ada package yang diinstal dan tidak ada migrasi yang dijalankan.

## Daftar isi

1. [Cakupan dan metode](#1-cakupan-dan-metode)
2. [Temuan paling mendesak](#2-temuan-paling-mendesak)
3. [Target pengembangan](#3-target-pengembangan)
4. [Arsitektur saat ini](#4-arsitektur-saat-ini)
5. [Hasil verifikasi (tes dan build)](#5-hasil-verifikasi-tes-dan-build)
6. [Fitur yang sudah berjalan](#6-fitur-yang-sudah-berjalan)
7. [Fitur yang belum tersedia](#7-fitur-yang-belum-tersedia)
8. [Endpoint API](#8-endpoint-api)
9. [Struktur database](#9-struktur-database)
10. [Autentikasi dan sesi](#10-autentikasi-dan-sesi)
11. [Penggunaan localStorage dan sessionStorage](#11-penggunaan-localstorage-dan-sessionstorage)
12. [Penyimpanan progres, jawaban latihan, dan hasil tes](#12-penyimpanan-progres-jawaban-latihan-dan-hasil-tes)
13. [Logout](#13-logout)
14. [Antrean offline dan potensi kehilangan data](#14-antrean-offline-dan-potensi-kehilangan-data)
15. [Keamanan](#15-keamanan)
16. [Kesiapan migrasi ke Supabase PostgreSQL](#16-kesiapan-migrasi-ke-supabase-postgresql)
17. [Kesiapan deployment online](#17-kesiapan-deployment-online)
18. [Kesesuaian dokumentasi dengan kode](#18-kesesuaian-dokumentasi-dengan-kode)
19. [File yang perlu diubah](#19-file-yang-perlu-diubah)
20. [File baru yang diperlukan](#20-file-baru-yang-diperlukan)
21. [Risiko pengembangan](#21-risiko-pengembangan)
22. [Rekomendasi urutan pengerjaan](#22-rekomendasi-urutan-pengerjaan)
23. [Keputusan yang diperlukan sebelum mulai](#23-keputusan-yang-diperlukan-sebelum-mulai)

---

## 1. Cakupan dan metode

**Dibaca lengkap**

- Backend: `app/main.py`, `config.py`, `db.py`, `models.py`, `auth.py`, `schemas.py`, `content.py`, seluruh `app/routers/*.py`, `app/engine/mltest.py`, `scripts/seed.py`, `tests/test_api.py` (bagian fixture), `.env.example`, `requirements.txt`, `pyproject.toml`.
- Frontend: `package.json`, `vite.config.js`, `vercel.json`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/api/client.js`, `src/data/profile.js`, `src/data/records.js`, `src/data/uuid.js`, `src/test/setup.js`, dan layar yang menyimpan atau membaca data: `LoginScreen`, `HomeScreen`, `UpdatePrompt`, `WelcomeScreen`, `SectionScreen`, `MlTestScreen`, `PracticeScreen`, `ProblemView`, `DiagnosticScreen`, `EffortRating`, `SelfExplain`, `ReflectionScreen`.
- Konten: `content/sequence.json`.
- Dokumen: `agents.md`, `architecture.md`, `privacy.md`, bagian endpoint di `api.md`, daftar tugas di `task.md`, serta pencarian kata kunci (auth, guru, Supabase, Alembic, logout, Dexie) di `decision-log.md`, `prd.md`, `readme.md`, `changelog.md`.
- Database `backend/literasy_dev.db`, dibuka dalam mode read-only.
- `.gitignore`, `.vscode/settings.json`, diff perubahan yang belum di-commit.

**Hanya dibaca sebagian atau lewat pencarian**

- Komponen `src/ui/`, `src/scenes/` (Three.js dan SVG), engine rumus (`checker`, `circle`, `practice`), layar `Explore`, `Game`, `Examples`, `CardDeck`, `Contrast` (hanya dicek apakah menyimpan data).
- Isi JSON konten selain `sequence.json`.
- Dokumen `design.md`, `content.md`, `evaluation.md`, `glossary.md`, `analysis.md`, `testing.md`.

**Tidak dibuka**

- `Soal Mathematical literacy.docx`.
- `node_modules/`, `backend/.venv/`, `backend/venv/` (hanya dicek versi package yang terpasang).

**Tidak ada file atau folder yang gagal diakses.**

---

## 2. Temuan paling mendesak

| # | Temuan | Lokasi | Dampak |
|---|---|---|---|
| 1 | **Build produksi gagal.** Perubahan yang belum di-commit menaikkan Vite 5 → 8, Vitest 2 → 5, react-router-dom 6 → 7. Build berhenti dengan `TypeError: manualChunks is not a function` karena Vite 8 (Rolldown) tidak menerima bentuk objek. Tes tetap lulus. | [frontend/vite.config.js:48](frontend/vite.config.js#L48), [frontend/package.json](frontend/package.json) | Deploy ke Vercel akan gagal. |
| 2 | **Logout menghapus data yang belum terkirim.** `clearAll()` menghapus `literasy.queue` dan `literasy.mltest-draft` tanpa mencoba mengirimnya. | [frontend/src/data/profile.js:34-42](frontend/src/data/profile.js#L34-L42) | Jawaban yang belum tersinkron hilang permanen. |
| 3 | **Progres belajar hanya ada di localStorage.** `markDone()` tidak pernah dikirim ke server, dan tidak ada endpoint untuk membaca progres. | [frontend/src/data/profile.js:28-31](frontend/src/data/profile.js#L28-L31) | Pindah HP atau data browser terhapus berarti progres hilang. |
| 4 | **Data bisa tercatat atas nama siswa lain.** Rute `/masuk` tetap bisa dibuka saat sudah login, lalu `saveProfile()` menimpa profil tanpa mengosongkan antrean, progres, dan draf tes. | [frontend/src/App.jsx:28](frontend/src/App.jsx#L28), [frontend/src/features/auth/LoginScreen.jsx:28](frontend/src/features/auth/LoginScreen.jsx#L28) | Catatan siswa A terkirim atas nama siswa B, dan B melihat progres A. |
| 5 | **Login tidak punya rahasia.** Cukup kode siswa `S01`–`S999` (mudah ditebak) ditambah kode kelas (dibagikan ke seluruh kelas). Tidak ada password, token, atau rate limit. | [backend/app/auth.py](backend/app/auth.py), [backend/app/routers/students.py](backend/app/routers/students.py) | Siapa pun yang tahu kode kelas bisa menulis data atas nama siswa lain. |

---

## 3. Target pengembangan

Target yang menjadi acuan audit ini:

- Login menggunakan username dan password.
- Siswa tetap login meskipun browser ditutup dan dibuka kembali.
- Siswa hanya keluar jika menekan Logout.
- Semua data belajar tersimpan permanen di database online.
- Website hanya untuk siswa, tanpa dashboard guru.
- Frontend di-host di Vercel.
- Backend FastAPI di-host terpisah.
- Database online menggunakan Supabase PostgreSQL.

---

## 4. Arsitektur saat ini

```
Browser (PWA: React 18 + Vite, JavaScript)      Backend (FastAPI, Python >= 3.11)         Database
 ├─ localStorage:                                 ├─ routers/students.py                    SQLite (dev):
 │   profile, progress, queue, mltest-draft       ├─ routers/records.py     ──SQLAlchemy──▶  backend/literasy_dev.db
 ├─ content/*.json (dibundel via @content)  ─REST─▶ routers/mltest.py                        PostgreSQL (rencana)
 ├─ engine/ (pemeriksa jawaban di browser)        ├─ routers/practice.py
 └─ Service worker (vite-plugin-pwa, prompt)      └─ membaca content/*.json dari root repo
```

**Struktur repositori**

```
/                      dokumen perencanaan (*.md), Soal Mathematical literacy.docx
├── backend/           FastAPI: app/ (routers, engine, models), scripts/, tests/
├── content/           JSON konten bersama (dibaca frontend dan backend)
├── frontend/          React + Vite: src/ (api, data, engine, features, scenes, ui)
└── tools/             make_icons.py
```

**Catatan arsitektur**

- **Konten dipakai dua sisi.** Frontend mengimpor lewat alias `@content` → `../content` ([vite.config.js:6](frontend/vite.config.js#L6)). Backend membaca `ROOT_DIR / "content"` ([config.py:8](backend/app/config.py#L8), [config.py:18](backend/app/config.py#L18)). Kedua deployment harus menyertakan folder `content/`.
- **Pemeriksaan jawaban latihan terjadi di browser** (`frontend/src/engine/checker.js`). Kunci jawaban latihan (`problems.json`) ikut di bundel frontend. Ini sesuai desain.
- **Kunci Uji Literasi (`mltest.json`) tidak dikirim ke browser.** Frontend tidak mengimpornya; soal diambil dari `GET /api/mltest` tanpa kunci ([engine/mltest.py:54-65](backend/app/engine/mltest.py#L54-L65)) dan diskor di server. Ini sudah benar.
- **Routing frontend:** `/` (Welcome atau Home), `/masuk` (Login), `/bagian/:sectionId` (dilindungi `RequireProfile`), `*` → `/`.
- **Alur belajar** 12 bagian di [content/sequence.json](content/sequence.json): pretest → diagnostik → eksplorasi → konsep → kontras → permainan → contoh soal → latihan terbimbing → latihan mandiri → soal kehidupan nyata → refleksi → posttest.

**Versi yang terpasang saat audit**

| Komponen | Versi |
|---|---|
| Node.js | 26.13.1 |
| vite | 8.3.8 (di `package.json` yang belum di-commit; versi commit: ^5.4.11) |
| vitest | 5.1.0 (versi commit: ^2.1.8) |
| react-router-dom | 7.18.5 (versi commit: ^6.28.0) |
| vite-plugin-pwa | 0.21.2 |
| @vitejs/plugin-react | 4.7.0 |
| fastapi | 0.162.6 |
| SQLAlchemy | 2.1.8 |
| pydantic | 2.14.3 |
| pydantic-settings | 2.16.3 |
| psycopg / psycopg-binary | 3.3.9 |
| uvicorn | 0.54.0 |
| Alembic, library hashing password, library JWT | **tidak terpasang** |

---

## 5. Hasil verifikasi (tes dan build)

| Pemeriksaan | Perintah | Hasil |
|---|---|---|
| Tes backend | `pytest` (SQLite in-memory, tidak menyentuh `literasy_dev.db`) | **114 lulus**, 1 peringatan deprecation (`httpx` di `starlette.testclient`) |
| Tes frontend | `vitest run` | **123 lulus** (7 file), dengan peringatan deprecation dari plugin React di Vite 8 |
| Build frontend | `vite build` ke folder sementara di luar proyek | **Gagal**: `TypeError: manualChunks is not a function` |
| Konflik dependensi | `npm ls --depth=0` | Tidak ada pesan invalid atau peer yang hilang |

Folder `frontend/dist/` berisi hasil build lama (sebelum upgrade). Folder ini di-gitignore dan tidak dipakai Vercel.

---

## 6. Fitur yang sudah berjalan

- **Alur belajar lengkap 12 bagian:** pretest, diagnostik D1–D6 + remedial, eksplorasi 3D (dengan fallback SVG), kartu konsep, modul kontras, permainan "Busur atau Juring?", contoh terurai, latihan terbimbing (Step Solver), latihan mandiri, soal literasi (Tandai Info Penting), refleksi, posttest.
- **Petunjuk bertingkat** dengan aturan pemudaran.
- **Skala usaha (Paas 1–9)** di akhir bagian tertentu.
- **Login** dengan kode siswa + kode kelas lewat `POST /api/students/verify`.
- **Antrean catatan belajar:** jawaban latihan, skala usaha, dan refleksi ditulis dulu ke localStorage, lalu dikirim ke `POST /api/records`.
  - Pengiriman ulang aman (idempoten berdasarkan UUID).
  - Retry 5 detik / 30 detik / 2 menit, dan dikirim ulang saat event `online` atau saat aplikasi dibuka.
- **Uji Literasi pre/post:**
  - Draf jawaban tersimpan otomatis di localStorage.
  - Skor dihitung per tahap di server.
  - Pengiriman ulang aman (`uuid5(submission_id, item_id)`).
  - Status sudah dikerjakan dicek lewat `POST /api/mltest/status`.
- **PWA:** manifest, ikon, service worker mode `prompt`, tawaran update hanya di beranda.
- **Konfigurasi Vercel:** SPA rewrite dan header cache di [vercel.json](frontend/vercel.json).
- **Skrip:** `scripts/seed.py` (membuat kelas dan kode siswa), `scripts/content_check.py` (validasi konten).

---

## 7. Fitur yang belum tersedia

| Target | Kondisi saat ini |
|---|---|
| Login username + password | ❌ Belum ada kolom username/password, hashing, maupun library hashing. |
| Tetap login setelah browser ditutup | ⚠️ Secara tidak sengaja sudah terjadi karena profil disimpan di localStorage. Tetapi tidak ada sesi di server, jadi tidak bisa dicabut dan tidak aman. |
| Hanya keluar lewat Logout | ⚠️ Tombol Keluar ada, tetapi menghapus data yang belum terkirim. Tidak ada endpoint logout di server. |
| Semua data belajar tersimpan permanen online | ❌ Lihat rincian di bawah. |
| Tanpa dashboard guru | ✅ Memang belum dibangun. Dokumen (ADR-015, F15, FR-14) masih merencanakannya dan perlu direvisi. |
| Frontend di Vercel | ❌ Build gagal (temuan #1). `VITE_API_URL` belum diset di Vercel. |
| Backend di-host terpisah | ❌ Belum ada konfigurasi hosting, start command, atau Alembic. |
| Database Supabase | ❌ Belum ada proyek, migrasi, maupun pengaturan koneksi pooler. |

**Data belajar yang belum tersimpan online**

| Data | Kondisi |
|---|---|
| Progres per bagian (`markDone`) | Hanya localStorage |
| Hasil diagnostik D1–D6 | Tidak dicatat sama sekali (hanya state React) |
| Hasil permainan, eksplorasi, kartu konsep | Tidak dicatat |
| Petunjuk per level | Hanya jumlahnya (`hints_used`) di tabel `attempts`; tabel `hint_events` tidak diisi |
| Event (`section_start`, `step_submit`, dll.) | Tabel `events` ada, tetapi tidak pernah diisi |
| Sesi belajar | Tabel `sessions` ada, tetapi tidak pernah diisi |
| Keputusan pada soal literasi (ya/tidak) | Tidak dicatat |

---

## 8. Endpoint API

| Metode | Path | Fungsi | Identitas | Dipakai frontend? |
|---|---|---|---|---|
| GET | `/api/health` | Status server, database, jumlah soal | – | Tidak |
| POST | `/api/students/verify` | Cek kode siswa + kode kelas → `{valid}` | – | Ya (login) |
| POST | `/api/practice/check` | Periksa jawaban di server | – | Tidak |
| GET | `/api/mltest` | Soal Uji Literasi tanpa kunci | – | Ya |
| POST | `/api/mltest/status` | `{pre_done, post_done}` | kode + kelas di body | Ya |
| POST | `/api/mltest/submit` | Simpan dan skor Uji Literasi | kode + kelas di body | Ya |
| POST | `/api/records` | Simpan attempts, effort, reflections | kode + kelas di body | Ya |

Catatan:

- `/docs` dan `/openapi.json` (bawaan FastAPI) terbuka untuk publik.
- CORS: origin dari env `CORS_ORIGINS`, method hanya `GET`/`POST`, header `Content-Type` dan `Authorization` ([main.py:40-45](backend/app/main.py#L40-L45)).
- Endpoint yang tercantum di `api.md` sebagai "Sprint 5" belum ada: `/api/sessions`, `/api/students/progress`, `/api/teacher/*`, `/api/research/export/*`.

---

## 9. Struktur database

### 9.1 Tabel (dari `backend/app/models.py`, sama dengan `literasy_dev.db`)

| Tabel | Kolom utama | Relasi | Dipakai? |
|---|---|---|---|
| `classes` | `code` (PK), `created_at` | – | ✅ |
| `students` | `code` (PK, `String(8)`), `class_code`, `group_label`, `created_at` | `class_code → classes.code` | ✅ |
| `sessions` | `id` (UUID), `student_code`, `started_at`, `ended_at`, `app_version`, `device_class` | `student_code → students.code` | ❌ tidak pernah ditulis |
| `attempts` | `id`, `session_id`, `student_code`, `problem_id`, `section_id`, `answer_value`, `answer_unit`, `correct`, `misconception_id`, `hints_used`, `duration_ms`, `created_at` | `session_id → sessions.id`, `student_code → students.code` | ✅ |
| `hint_events` | `id`, `attempt_id` (tanpa FK), `student_code`, `problem_id`, `level` (CHECK 1–3), `created_at` | `student_code → students.code` | ❌ |
| `effort_ratings` | `id`, `student_code`, `section_id`, `value` (CHECK 1–9), `created_at` | `student_code → students.code` | ✅ |
| `reflections` | `id`, `student_code`, `prompt_id`, `choice`, `free_text`, `score` (CHECK 0–2), `created_at` | `student_code → students.code` | ✅ |
| `events` | `id`, `student_code`, `session_id` (tanpa FK), `type`, `payload` (JSON), `created_at` | `student_code → students.code` | ❌ |
| `ml_tests` | `id`, `student_code`, `kind` (pre/post), `item_id`, `ml_process`, `score`, `max_score`, `stage_scores` (JSON), `answers` (JSON), `created_at` | `student_code → students.code` | ✅ |

### 9.2 Isi `literasy_dev.db` saat audit

| Tabel | Baris |
|---|---|
| classes | 1 (`DEMO`) |
| students | 3 (`S01`, `S02`, `S03`, kelas `DEMO`) |
| attempts | 3 |
| effort_ratings | 7 |
| reflections | 6 |
| ml_tests | 8 (S01: 4 pre, 4 post) |
| sessions, hint_events, events | 0 |

Isinya hanya data demo, jadi tidak perlu dipindahkan ke Supabase.

### 9.3 Masalah struktur

1. **Primary key siswa hanya `code`.** Dua kelas tidak bisa sama-sama punya `S01`. Selain itu [seed.py:25](backend/scripts/seed.py#L25) diam-diam melewati kode yang sudah dipakai kelas lain, sehingga siswa kelas kedua tidak terbuat tanpa pesan error.
2. **Tidak ada tabel akun/kredensial** (username, password hash, status aktif).
3. **Tidak ada tabel sesi login** (token, masa berlaku, pencabutan).
4. **Tidak ada tabel progres** per siswa per bagian.
5. **`ml_tests` tidak punya unique constraint** `(student_code, kind, item_id)`. `submission_id` baru akan menggandakan data; larangan mengulang tes hanya dicek di frontend.
6. **Waktu berasal dari HP siswa.** `created_at` di attempts, effort, reflections dikirim klien. Tidak ada kolom waktu terima server (`received_at`).
7. **`correct` di attempts dipercaya dari klien.** Server tidak memeriksa ulang.
8. **`attempts.session_id`** punya FK ke `sessions`, tetapi selalu NULL.
9. **Skema dibuat dengan `Base.metadata.create_all`** saat startup ([main.py:26-27](backend/app/main.py#L26-L27)). Belum ada Alembic, jadi perubahan kolom pada tabel yang sudah ada tidak akan diterapkan otomatis.

---

## 10. Autentikasi dan sesi

**Alur login saat ini**

1. Siswa mengisi kode siswa (format `^S\d{2,3}$`) dan kode kelas di [LoginScreen.jsx](frontend/src/features/auth/LoginScreen.jsx).
2. Frontend memanggil `POST /api/students/verify`.
3. Jika `valid: true`, objek `{code, classCode}` disimpan ke `localStorage['literasy.profile']`. Hanya ini yang menandai siswa "sedang login".

**Di backend**

- Tidak ada sesi atau token.
- Setiap request tulis membawa `code` + `class_code` di body, lalu dicek ulang oleh `require_student()` ([auth.py:14-18](backend/app/auth.py#L14-L18)). Jika tidak cocok → 403.
- `/verify` sengaja tidak membedakan "kode salah" dan "kelas salah", tetapi tidak dibatasi frekuensinya, jadi kombinasi kode bisa ditebak massal.

**Guard rute di frontend**

- `RequireProfile` hanya melindungi `/bagian/:sectionId`.
- `/masuk` tidak dilindungi. Siswa yang sudah login bisa login lagi sebagai siswa lain tanpa logout, dan data lama tidak dibersihkan (temuan #4).

**Pengelolaan akun siswa**

- Akun hanya bisa dibuat lewat CLI: `python -m scripts.seed --class <KODE> --students <N>`.
- Tidak ada password, reset password, penonaktifan akun, atau penghapusan akun.

---

## 11. Penggunaan localStorage dan sessionStorage

sessionStorage dan IndexedDB **tidak dipakai**. Semua penyimpanan lokal memakai localStorage:

| Key | Ditulis di | Isi | Dihapus saat |
|---|---|---|---|
| `literasy.profile` | [profile.js:25](frontend/src/data/profile.js#L25) | `{code, classCode}` | Logout |
| `literasy.progress` | [profile.js:29-31](frontend/src/data/profile.js#L29-L31) | `{sectionId: 'done'}` | Logout |
| `literasy.queue` | [records.js:26-32](frontend/src/data/records.js#L26-L32) | `{attempts[], effort[], reflections[]}` yang belum terkirim | Setelah terkirim, atau saat logout (data hilang) |
| `literasy.mltest-draft` | [MlTestScreen.jsx:24-30](frontend/src/features/mltest/MlTestScreen.jsx#L24-L30) | `{kind, id, answers, pos}` | Setelah tes terkirim, atau saat logout |

Catatan:

- Semua baca/tulis dibungkus `try/catch`, jadi aplikasi tidak crash jika penyimpanan diblokir. Akibatnya data diam-diam tidak tersimpan.
- `literasy.queue` dan `literasy.mltest-draft` **tidak menyimpan identitas siswa**.
- `src/test/setup.js` menyediakan pengganti localStorage untuk tes.

---

## 12. Penyimpanan progres, jawaban latihan, dan hasil tes

| Data | Dibuat di | Disimpan ke | Sampai ke server? |
|---|---|---|---|
| Progres bagian | `SectionScreen.finish()` → `markDone()` | `literasy.progress` | ❌ Tidak pernah |
| Jawaban latihan | `ProblemView.onAttempt()` → `recordAttempt()` | `literasy.queue` → `POST /api/records` | ✅ Lewat antrean |
| Skala usaha | `EffortRating.save()` → `recordEffort()` | `literasy.queue` → `POST /api/records` | ✅ Lewat antrean |
| Refleksi / "Jelaskan ke Teman" | `SelfExplain.submit()` → `recordReflection()` | `literasy.queue` → `POST /api/records` | ✅ Lewat antrean |
| Jawaban Uji Literasi | `MlTestScreen` | `literasy.mltest-draft` → `POST /api/mltest/submit` | ✅ Saat siswa menekan "Kirim semua jawaban" (tidak lewat antrean) |
| Hasil diagnostik | `DiagnosticScreen` | Hanya state React | ❌ |
| Keputusan soal literasi | `ProblemView` | Hanya state React | ❌ |

Di server, `POST /api/records` melewati baris yang `id`-nya sudah ada ([records.py:21-27](backend/app/routers/records.py#L21-L27)), sehingga kiriman ulang tidak menggandakan data.

---

## 13. Logout

- Tombol **Keluar** ada di beranda ([HomeScreen.jsx:17-20](frontend/src/features/progress/HomeScreen.jsx#L17-L20)).
- Memanggil `clearAll()`: menghapus `literasy.profile`, `literasy.progress`, `literasy.queue`, `literasy.mltest-draft`, lalu kembali ke `/`.
- **Tidak mengirim antrean terlebih dahulu** dan tidak memberi peringatan jika masih ada data tertunda.
- **Tidak ada konfirmasi**, jadi satu ketukan tidak sengaja langsung menghapus progres lokal.
- Tidak ada pemberitahuan ke server, karena memang belum ada sesi di server.

---

## 14. Antrean offline dan potensi kehilangan data

Cara kerja antrean ([records.js](frontend/src/data/records.js)):

- Setiap catatan diberi UUID dan `created_at`, ditambahkan ke `literasy.queue`, lalu dijadwalkan dikirim 1,5 detik kemudian.
- `flush()` mengirim **seluruh isi antrean dalam satu request**. Jika berhasil, hanya baris yang terkirim yang dihapus.
- Jika gagal, dicoba lagi setelah 5 detik, 30 detik, lalu setiap 2 menit tanpa batas.
- `flush()` juga dipanggil saat aplikasi dibuka ([App.jsx:20-22](frontend/src/App.jsx#L20-L22)) dan saat event `online`.

**Potensi kehilangan atau kerusakan data**

| # | Skenario | Akibat | Tingkat |
|---|---|---|---|
| 1 | Siswa logout saat antrean belum terkirim | Data hilang permanen | Tinggi |
| 2 | Siswa membuka `/masuk` dan login sebagai siswa lain tanpa logout | Antrean dan draf siswa A terkirim atas nama siswa B; progres A tampil untuk B | Tinggi |
| 3 | Progres hanya di localStorage | Hilang saat pindah HP, ganti browser, mode incognito, atau data situs dihapus | Tinggi |
| 4 | Antrean melebihi batas server (maks. 200 attempts, 50 effort, 50 reflections per request; [schemas.py:97-99](backend/app/schemas.py#L97-L99)) | Server menolak dengan 422; antrean macet selamanya karena selalu dikirim utuh | Sedang |
| 5 | Satu baris tidak valid (misalnya `answer_unit` > 8 karakter, `misconception_id` > 48 karakter) | Seluruh batch ditolak 422 dan di-retry tanpa batas; semua baris lain ikut tertahan | Sedang |
| 6 | Akun siswa dihapus/berubah di server (403) | Retry tanpa batas, data tidak pernah terkirim | Sedang |
| 7 | localStorage penuh atau diblokir | Data hanya di memori dan hilang saat tab ditutup | Rendah |
| 8 | Tab ditutup sebelum jeda 1,5 detik | Data tetap di localStorage, terkirim saat aplikasi dibuka lagi di browser yang sama; hilang jika siswa tidak kembali ke browser itu | Rendah |
| 9 | Kirim Uji Literasi gagal | Draf aman, tetapi siswa harus menekan ulang secara manual | Rendah |
| 10 | Dua request bersamaan dengan UUID yang sama | Bisa memicu IntegrityError 500 di server; data aman setelah retry | Rendah |

---

## 15. Keamanan

**Tinggi**

- Login tanpa rahasia: kode siswa mudah ditebak, kode kelas dibagikan ke seluruh kelas (temuan #5).
- Tidak ada rate limit di `/verify` atau endpoint tulis.
- Nilai `correct` dan `created_at` dipercaya dari klien.

**Sedang**

- `/docs` dan `/openapi.json` terbuka di produksi.
- `Soal Mathematical literacy.docx` ada di repositori. Jika repositori GitHub publik, file ini kemungkinan berisi kunci Uji Literasi (isinya belum diperiksa).
- Supabase mengekspos tabel di skema `public` lewat Data API dengan anon key yang bersifat publik. Jika RLS tidak diaktifkan pada tabel yang dibuat backend, tabel bisa dibaca/ditulis langsung tanpa melewati FastAPI.
- `VITE_API_URL` jatuh ke `http://127.0.0.1:8000` jika tidak diset ([client.js:2](frontend/src/api/client.js#L2)), sehingga build produksi bisa diam-diam memanggil alamat lokal.

**Sudah baik**

- Tidak ada `dangerouslySetInnerHTML`, `innerHTML`, atau `eval` di `frontend/src`.
- `.env`, `.env.*` (kecuali `.env.example`), dan `*.db` sudah di-gitignore. `backend/.env` dan `frontend/.env.local` ada secara lokal dan isinya sama dengan contoh.
- Kredensial database hanya ada di backend; frontend tidak terhubung langsung ke database.
- Kunci jawaban Uji Literasi tidak dikirim ke browser.
- Validasi input di backend memakai Pydantic (panjang string, rentang angka, format kode).

**Catatan privasi**

`privacy.md` dan ADR-011 menetapkan "tanpa nama, tanpa kata sandi". Target baru memakai username dan password. Jika username dibuat dari nama asli, kebijakan privasi dan formulir persetujuan perlu direvisi. Alternatifnya, username tetap berupa kode pseudonim.

---

## 16. Kesiapan migrasi ke Supabase PostgreSQL

**Sudah siap**

- Tipe kolom portabel: `Uuid`, `JSON`, `Numeric(5, 2)`, `DateTime(timezone=True)`, `CheckConstraint`.
- Driver `psycopg[binary]` sudah terpasang dan ada di `requirements.txt`.
- `DATABASE_URL` diambil dari variabel lingkungan; contoh format Postgres ada di [.env.example](backend/.env.example).
- `pool_pre_ping=True` sudah diaktifkan ([db.py:16](backend/app/db.py#L16)).

**Belum siap**

- Alembic belum ada; skema masih memakai `create_all`.
- Pengaturan koneksi untuk pooler Supabase belum ada. Mode *transaction* (port 6543) membutuhkan `prepare_threshold=None` pada psycopg 3, atau gunakan session pooler / koneksi langsung.
- Ukuran pool belum diatur sesuai batas koneksi paket Supabase.
- `.env` dibaca relatif terhadap working directory ([config.py:12](backend/app/config.py#L12)); server harus dijalankan dari folder `backend/`.
- Belum ada rencana RLS deny-all untuk tabel di Supabase.
- Kolom `JSON` akan menjadi `json` (bukan `jsonb`) di Postgres. Tidak masalah untuk penyimpanan, tetapi kurang efisien jika nanti perlu query isi JSON.

**Data**

Isi SQLite hanya data demo. Cukup buat skema baru di Supabase, tidak perlu memindahkan data.

---

## 17. Kesiapan deployment online

**Frontend (Vercel)**

| Aspek | Kondisi |
|---|---|
| Build | ❌ Gagal dengan Vite 8 (temuan #1) |
| `vercel.json` | ✅ SPA rewrite dan header cache sudah ada |
| `VITE_API_URL` | ❌ Belum diset; fallback ke `127.0.0.1` |
| Folder `content/` | ⚠️ Root Directory Vercel `frontend` membutuhkan akses ke `../content` (opsi "Include files outside root directory" harus aktif) |
| Repositori terhubung ke Vercel | ❌ Belum (tercatat di `task.md`) |

**Backend**

| Aspek | Kondisi |
|---|---|
| Platform hosting | ❌ Belum ditentukan |
| Dockerfile / Procfile / start command | ❌ Belum ada |
| `--proxy-headers` untuk uvicorn di balik proxy | ❌ Belum |
| Folder `content/` ikut ter-deploy | ⚠️ Wajib, karena backend membacanya saat startup dan gagal jika tidak ada |
| `/docs` dimatikan di produksi | ❌ Belum |
| `CREATE_TABLES_ON_STARTUP` | ⚠️ Masih `true` |
| Virtualenv ganda (`backend/.venv` dan `backend/venv`) | ⚠️ Membingungkan; `.vscode/settings.json` menunjuk ke `.venv` |

**Lainnya**

- Repositori baru punya 2 commit; remote `origin` sudah ada di GitHub.
- Belum ada CI.

---

## 18. Kesesuaian dokumentasi dengan kode

| Dokumen menyebut | Kenyataan di kode |
|---|---|
| Dexie / IndexedDB sebagai buffer | localStorage |
| Supabase RLS, RPC, Supabase Auth | Belum ada; akses melalui FastAPI |
| TypeScript, file `.ts` | JavaScript (sudah dicatat sebagai revisi ADR-018) |
| Rekap guru `/guru`, login guru (ADR-015, F15, FR-14) | Belum ada, dan bertentangan dengan target "tanpa dashboard guru" |
| Login tanpa kata sandi (ADR-011, FR-01) | Bertentangan dengan target username + password |
| Progres diambil dari server saat pindah HP | Belum ada |
| Event logging (`architecture.md` §8) | Belum ada |
| Menu "Keluar & hapus data di HP ini" | Ada sebagai tombol Keluar, tanpa pengiriman data tertunda |

---

## 19. File yang perlu diubah

### Backend

| File | Perubahan |
|---|---|
| [backend/app/models.py](backend/app/models.py) | Tabel akun (username unik, `password_hash`, `is_active`), tabel progres, kolom `received_at`, unique constraint `ml_tests`, perbaikan primary key siswa |
| [backend/app/auth.py](backend/app/auth.py) | Ditulis ulang menjadi dependency `current_student` berbasis token |
| [backend/app/schemas.py](backend/app/schemas.py) | Hapus `code`/`class_code` dari body; tambah skema login, sesi, progres |
| [backend/app/routers/students.py](backend/app/routers/students.py) | Ganti `/verify` dengan alur auth baru |
| [backend/app/routers/records.py](backend/app/routers/records.py) | Identitas dari token |
| [backend/app/routers/mltest.py](backend/app/routers/mltest.py) | Identitas dari token; server menolak tes yang diulang |
| [backend/app/main.py](backend/app/main.py) | Daftarkan router baru, CORS, matikan `/docs` dan `create_all` di produksi |
| [backend/app/config.py](backend/app/config.py) | Secret, masa berlaku sesi, flag docs, path `.env` absolut |
| [backend/app/db.py](backend/app/db.py) | Pengaturan pool dan pooler Supabase |
| [backend/.env.example](backend/.env.example) | Variabel baru |
| [backend/requirements.txt](backend/requirements.txt) | Tambah Alembic dan library hashing password (perlu persetujuan) |
| [backend/scripts/seed.py](backend/scripts/seed.py) | Sesuaikan dengan tabel akun atau digantikan skrip baru |
| [backend/tests/test_api.py](backend/tests/test_api.py) | Sesuaikan dengan auth token |

### Frontend

| File | Perubahan |
|---|---|
| [frontend/src/api/client.js](frontend/src/api/client.js) | Header `Authorization`, penanganan 401, endpoint baru, gagal jelas jika `VITE_API_URL` kosong |
| [frontend/src/data/profile.js](frontend/src/data/profile.js) | Simpan token, progres dari server, logout aman |
| [frontend/src/data/records.js](frontend/src/data/records.js) | Antrean per siswa, kirim per potongan, karantina baris tidak valid, flush sebelum logout |
| [frontend/src/App.jsx](frontend/src/App.jsx) | Guard `/masuk`, ambil sesi dan progres saat aplikasi dibuka |
| [frontend/src/features/auth/LoginScreen.jsx](frontend/src/features/auth/LoginScreen.jsx) | Form username + password |
| [frontend/src/features/progress/HomeScreen.jsx](frontend/src/features/progress/HomeScreen.jsx) | Logout dengan flush dan konfirmasi; progres dari server |
| [frontend/src/features/section/SectionScreen.jsx](frontend/src/features/section/SectionScreen.jsx) | Simpan progres ke server |
| [frontend/src/features/mltest/MlTestScreen.jsx](frontend/src/features/mltest/MlTestScreen.jsx) | Pakai token; draf dikunci per siswa |
| [frontend/src/features/mltest/MlTestScreen.test.jsx](frontend/src/features/mltest/MlTestScreen.test.jsx) | Sesuaikan mock |
| [frontend/src/features/diagnostic/DiagnosticScreen.jsx](frontend/src/features/diagnostic/DiagnosticScreen.jsx) | Catat hasil diagnostik (opsional, sesuai kebutuhan penelitian) |
| [frontend/vite.config.js](frontend/vite.config.js) | Perbaiki `manualChunks` jika tetap memakai Vite 8 |
| [frontend/package.json](frontend/package.json) | Putuskan upgrade dependensi |
| [frontend/.env.example](frontend/.env.example) | Contoh URL backend produksi |
| [content/welcome.json](content/welcome.json) | Teks halaman awal terkait cara masuk |

### Dokumen

`decision-log.md` (ADR baru menggantikan ADR-011, membatalkan ADR-015), `prd.md`, `privacy.md`, `api.md`, `architecture.md`, `task.md`, `changelog.md`, `readme.md`.

---

## 20. File baru yang diperlukan

### Backend

| File | Fungsi |
|---|---|
| `backend/app/security.py` | Hashing password dan pembuatan/verifikasi token sesi |
| `backend/app/routers/auth.py` | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| `backend/app/routers/progress.py` | `GET` dan `PUT` progres siswa |
| `backend/alembic.ini` + `backend/migrations/` | Migrasi skema database |
| `backend/scripts/manage_accounts.py` | CLI membuat akun, reset password, menonaktifkan akun (pengganti dashboard guru) |
| `backend/tests/test_auth.py` | Tes login, logout, token kedaluwarsa, rate limit |
| `backend/tests/test_progress.py` | Tes progres |
| Konfigurasi hosting (`Dockerfile` atau `render.yaml`, tergantung platform) | Deploy backend |

### Frontend

| File | Fungsi |
|---|---|
| `frontend/src/data/session.js` (atau `features/auth/AuthProvider.jsx`) | Menyimpan token dan status login |
| `frontend/src/data/records.test.js` | Tes antrean: per siswa, potongan, baris tidak valid, logout |
| `frontend/src/features/auth/LoginScreen.test.jsx` | Tes form login |

---

## 21. Risiko pengembangan

1. **Login lintas domain.** Frontend di `*.vercel.app` dan backend di domain lain membuat cookie httpOnly menjadi cookie pihak ketiga, yang sering diblokir browser.
   - **Rekomendasi:** token sesi acak (opaque) yang disimpan dalam bentuk hash di tabel sesi, dikirim sebagai header `Authorization: Bearer`, disimpan di localStorage. Masa berlaku panjang dan diperpanjang saat dipakai, sehingga siswa tetap login setelah browser ditutup. Token dicabut di server saat logout. Risiko XSS rendah karena tidak ada `innerHTML`.
   - **Alternatif:** gunakan domain sendiri (misalnya `app.` dan `api.` di satu domain) lalu pakai cookie httpOnly.
2. **Perubahan identitas di seluruh API.** Memindahkan identitas dari body ke token menyentuh semua endpoint dan tes. Paling aman dikerjakan dalam satu tahap dengan tes lengkap.
3. **Data di HP siswa versi lama.** Antrean dan draf di localStorage memakai format lama tanpa identitas. Perlu migrasi sekali jalan di klien, atau tenggat yang jelas sebelum versi baru dipasang.
4. **Upgrade Vite 8 / Vitest 5 / router 7 bersamaan dengan pekerjaan auth** memperbesar area kesalahan. Sebaiknya diselesaikan atau dibatalkan lebih dulu.
5. **Cold start hosting gratis** (misalnya layanan yang tidur saat tidak dipakai) membuat request pertama lambat dan bisa memicu timeout atau retry saat login.
6. **Batas koneksi Supabase** pada paket gratis. Pool yang terlalu besar atau koneksi yang tidak ditutup bisa menghabiskan kuota.
7. **Privasi anak di bawah umur.** Username dan password menuntut kebijakan password yang sederhana tetapi aman, prosedur reset lewat peneliti, dan pembaruan formulir persetujuan.
8. **Lupa password tanpa dashboard guru.** Reset hanya bisa lewat CLI oleh pengembang/peneliti. Prosedurnya perlu jelas sebelum dipakai di kelas.
9. **Service worker PWA menyimpan versi lama.** Setelah deploy versi baru, siswa tetap memakai versi lama sampai menekan "Muat ulang" di beranda. Perubahan API harus tetap kompatibel selama masa transisi.

---

## 22. Rekomendasi urutan pengerjaan

| Tahap | Isi | Hasil yang bisa diuji |
|---|---|---|
| **0. Stabilkan** | Putuskan upgrade Vite 8 (perbaiki `manualChunks` atau kembalikan versi lama). Commit. Rapikan virtualenv ganda. | `npm run build` lulus |
| **1. Cegah kehilangan data** | Kirim antrean sebelum logout, beri peringatan jika masih ada data tertunda, dan minta konfirmasi. Lindungi `/masuk`. Kunci antrean dan draf per siswa. Kirim per potongan. Karantina baris tidak valid. | `records.test.js` lulus |
| **2. Fondasi database** | Pasang Alembic dan buat migrasi awal. Tambah tabel `accounts`, `auth_sessions`, `progress`. Unique constraint `ml_tests`. Kolom `received_at`. | `alembic upgrade head` berhasil di SQLite |
| **3. Auth backend** | Hashing password; endpoint `login`, `logout`, `me`; dependency `current_student`; rate limit login; CLI pengelolaan akun. | `pytest` auth lulus |
| **4. Auth frontend** | Form username + password; simpan token; 401 diarahkan ke halaman login; siswa tetap login setelah browser ditutup. | Tes komponen + uji manual tutup-buka browser |
| **5. Progres online** | Endpoint progres; beranda membaca progres dari server; catat hasil diagnostik. | Login di browser lain, progres tetap ada |
| **6. Supabase** | Buat proyek; aktifkan RLS deny-all; jalankan migrasi ke Postgres; atur pool dan pooler. | `/api/health` → `database: ok` |
| **7. Deploy** | Hosting backend dan env; Vercel dan `VITE_API_URL`; CORS ke domain Vercel; matikan `/docs`. | Uji end-to-end di HP Android |
| **8. Dokumentasi** | ADR baru, `privacy.md`, `api.md`, `architecture.md`, `task.md`, `changelog.md`. | Dokumen sesuai kode |

Tahap 0 dan 1 kecil, tidak bergantung pada keputusan desain auth, dan langsung mengurangi risiko hilangnya data. Keduanya sebaiknya dikerjakan lebih dulu.

---

## 23. Keputusan yang diperlukan sebelum mulai

1. **Upgrade dependensi frontend:** pertahankan Vite 8 / Vitest 5 / react-router 7 (dengan perbaikan konfigurasi), atau kembalikan ke versi yang ter-commit?
2. **Format username:** kode pseudonim (misalnya `s01-8a`) agar tetap sesuai kebijakan privasi, atau nama siswa (kebijakan privasi harus direvisi)?
3. **Hosting backend:** Render, Railway, Fly.io, atau platform lain?
4. **Mekanisme sesi:** token Bearer di localStorage (rekomendasi), atau domain sendiri dengan cookie httpOnly?
5. **Repositori GitHub:** publik atau privat? Ini menentukan apakah `Soal Mathematical literacy.docx` perlu dikeluarkan dari repositori.
