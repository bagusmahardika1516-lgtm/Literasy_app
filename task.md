# Task — Backlog per Tahap ADDIE

Format: `[ ]` belum · `[x]` selesai · `[~]` berjalan. Setiap tugas menyebut ID fitur ([prd.md](prd.md)) dan/atau kode
temuan ([analysis.md](analysis.md)). Estimasi dalam hari kerja (h).

## A. Analysis

- [x] Susun kisi-kisi & pedoman wawancara CLT
- [x] Wawancara informan S01 (kelas IX, 8 Nov 2026)
- [x] Pengodean kutipan S01 (K/IL/EL/GL/DS)
- [x] Matriks temuan → fitur ([prd.md](prd.md) §4)
- [ ] Validasi isi pedoman wawancara oleh 2–3 ahli (lihat [evaluation.md](evaluation.md) §1)
- [ ] Uji keterbacaan pedoman pada 1–2 siswa non-informan
- [ ] Wawancara informan S02 (kemampuan berbeda) → perbarui [analysis.md](analysis.md) §7
- [x] Wawancara sisi Android sesi 1 (HP, internet, distribusi, guru, login, audio, hosting) → ADR-013 s.d. ADR-016
- [ ] Wawancara Android sesi 2 (jumlah siswa, browser, proyektor, format ekspor)
- [ ] Analisis kurikulum: CP Fase D & buku siswa kelas VIII untuk materi lingkaran

## B. Design

- [x] Dokumen perencanaan v0.1 (15 file .md)
- [ ] Review materi & kunci jawaban [content.md](content.md) oleh dosen/guru matematika
- [ ] Wireframe resolusi tinggi (Figma/kertas) berdasarkan [design.md](design.md) §4
- [ ] Paper prototype diuji 2 siswa (think-aloud singkat)
- [ ] Susun kisi-kisi tes literasi pre/post ([evaluation.md](evaluation.md) §4)
- [ ] Finalisasi keputusan desain di [decision-log.md](decision-log.md)

## C. Development

### Sprint 0 — Fondasi (3 h)
- [x] Inisialisasi Vite + React (**JavaScript**), ESLint, Prettier, Vitest — *ditulis; belum dijalankan (Node.js belum terpasang)*
- [x] Backend FastAPI: config, SQLAlchemy models (semua tabel api.md §4.1), `/api/health`, `/api/students/verify`
- [x] Skrip `seed.py` (kode kelas & siswa) dan `content_check.py`
- [x] `ui/tokens.css` (warna, tipografi, jarak) sesuai [design.md](design.md) §2
- [x] Komponen dasar: Button, Slider (dengan −/+ dan snap)
- [ ] Komponen: Card, Formula (KaTeX)
- [x] Routing (`/masuk`, `/`, `/eksplorasi`) & layout potret
- [x] `vite-plugin-pwa`: manifest, ikon 192/512/maskable (`tools/make_icons.py`), service worker mode prompt
- [x] `vercel.json` (SPA rewrite, header cache)
- [x] `npm install`, `npm run test` & `npm run build` lulus (dengan Node portabel sementara)
- [ ] Pasang Node.js LTS permanen di laptop pengembang
- [ ] Hubungkan repo GitHub ke Vercel; env var `VITE_API_URL` Production & Preview
- [ ] Tentukan hosting backend (Vercel Python function / Render) + database PostgreSQL
- [ ] Uji install PWA di HP Android pertama
- [ ] Migrasi database dengan Alembic (menggantikan `create_all`)
- [ ] Dexie (`data/db.js`) sebagai buffer — menggantikan localStorage

### Sprint 1 — Ilustrasi 3D (5 h) · F01, F06, F07
- [x] `scenes/core`: renderer singleton, render-on-demand, dispose, `webglSupport`
- [ ] `watchFps` → fallback SVG bila FPS rendah
- [x] `CircleSectorScene`: cakram, busur (tube oranye), juring (ekstrusi biru), sudut hijau, label CSS2D
- [x] Slider θ (snap 30/45/60/90/120/180/270/360) dan r; toggle Busur/Juring/Keduanya; Tampak atas & Ulangi
- [x] Layar Eksplorasi dengan penjelasan angka langsung di bawah gambar (F01, F06)
- [x] Uji tampilan 3D di Edge headless ukuran HP (terang & gelap)
- [ ] Uji tampilan 3D di HP Android nyata
- [ ] `SectorLiftScene` (angkat & susun juring)
- [ ] `ArcUnrollScene` (luruskan busur)
- [x] Fallback SVG (`SvgSector.jsx`) dengan props yang sama
- [ ] Uji performa di emulator API 24, RAM 2 GB

### Sprint 2 — Engine & materi inti (5 h) · F01, F02, F03, F13
- [x] Engine rumus `circle.py` + `circle.js` dengan unit test identik (P01–P18 lulus di Python; JS menunggu Node.js)
- [x] `checker.py` + `checker.js` (parse koma/titik, toleransi, satuan, miskonsepsi umum & dari konten)
- [x] `content/problems.json` (P01–P18) + validasi `content_check` (Python) & `content:check` (JS)
- [x] `content/*.json` lainnya: diagnostik, kartu konsep, contoh terurai, refleksi, permainan, Uji Literasi
- [x] Fitur masuk dengan kode siswa + kode kelas (FR-01)
- [x] Halaman awal (sebelum masuk)
- [x] Diagnostik D1–D6 + `evaluateDiagnostic` + kartu remedial (F03)
- [x] Kartu konsep C1–C6 + Modul Kontras (F01)
- [x] Permainan "Busur atau Juring?" (F01, ADR-021)
- [x] Contoh terurai WE1–WE6 dengan langkah per ketukan (F04)
- [x] Beranda/Jalur & penyimpanan progres
- [x] Uji Literasi pre/post T1–T4 dari docx + penskoran per tahap di server (ADR-020)
- [ ] Konfirmasi rubrik T1 & T3 oleh pengembang

### Sprint 3 — Latihan & petunjuk (4 h) · F02, F08, F10
- [x] `engine/practice.js` (checkStep, availableHintLevels, sanityInfo) + test
- [x] Layar Step Solver dengan jejak langkah yang menyusut
- [x] Petunjuk 3 tingkat + aturan pudar
- [x] Latihan mandiri tanpa Step Solver
- [x] Umpan balik miskonsepsi spesifik
- [x] Tombol Kembali/Ulangi di semua layar materi (F08)

### Sprint 4 — Literasi & refleksi (5 h) · F05, F09, F11, F12
- [x] Soal cerita per kalimat + "Tandai Info Penting" (F05)
- [x] Cek Kewajaran & cek satuan (F09)
- [x] "Jelaskan ke Teman" pilihan + isian (F11); rubrik isian dinilai peneliti
- [ ] Scene konteks low-poly: pizza, jam, taman, bianglala, penyiram, kue (F12)
- [x] Soal L4 (P15–P18) dengan keputusan ya/tidak

### Sprint 5 — Data penelitian (4 h) · F14
- [ ] Event logger + semua event di [architecture.md](architecture.md) §8
- [x] Skala Paas di akhir bagian
- [x] Antrean catatan belajar → `POST /api/records` (localStorage, kirim ulang)
- [ ] Ekspor CSV + bagikan via Web Share API (fallback unduh)
- [ ] Supabase: tabel, RLS, RPC `verify_student`, `get_my_progress` ([api.md](api.md) §4)
- [ ] `syncQueue` write-behind dengan backoff; uji putus-sambung Wi-Fi
- [ ] Rekap guru `/guru` (F15): login Supabase Auth, `teacher_classes`, RPC `class_recap`, penanda "Perlu bantuan"

### Sprint 6 — Pemolesan & QA (4 h)
- [ ] Aksesibilitas: TalkBack, kontras, font 130%, mode gelap
- [ ] Pengujian sesuai [testing.md](testing.md); perbaiki bug
- [ ] Ikon aplikasi, splash sederhana (tanpa animasi), nama aplikasi
- [ ] Lighthouse: PWA lulus, performa ≥ 80 (mobile); unduhan awal ≤ 3 MB
- [ ] Rilis v0.5.0 di URL preview Vercel untuk validasi ahli

### Validasi produk (tahap Development)
- [ ] Validasi ahli materi (2–3 orang) — lembar di [evaluation.md](evaluation.md) §2
- [ ] Validasi ahli media (2–3 orang)
- [ ] Hitung Aiken's V; revisi produk → v0.6.0
- [ ] Uji coba perorangan (1–3 siswa) + wawancara kejelasan tampilan
- [ ] Uji coba kelompok kecil (6–9 siswa); revisi → v0.9.0

## D. Implementation

- [ ] Izin sekolah, persetujuan orang tua/wali, persetujuan siswa ([privacy.md](privacy.md))
- [ ] Daftarkan kode kelas, kode siswa, dan akun guru (`teacher_classes`) di Supabase
- [ ] Bagikan tautan PWA (QR code di papan/proyektor); pastikan Wi-Fi kelas memadai
- [ ] Kartu kecil berisi kode siswa untuk tiap siswa (tanpa nama di sistem)
- [ ] Pretest literasi matematis
- [ ] Pembelajaran dengan aplikasi (rencana 2–3 pertemuan × 40 menit)
- [ ] Observasi penggunaan fitur (lembar observasi [evaluation.md](evaluation.md) §6)
- [ ] Posttest literasi + kuesioner beban kognitif + SUS

## E. Evaluation

- [ ] Ekspor & bersihkan data
- [ ] N-gain literasi (total & per proses formulate/employ/interpret)
- [ ] Analisis skala Paas per bagian & kuesioner beban kognitif
- [ ] Analisis log: penggunaan petunjuk (bukti fading), Cek Kewajaran, miskonsepsi tersering
- [ ] Skor SUS
- [ ] Bandingkan hasil dengan indikator uji per fitur ([prd.md](prd.md) §4)
- [ ] Revisi akhir → v1.0.0; tulis laporan & perbarui [decision-log.md](decision-log.md)
