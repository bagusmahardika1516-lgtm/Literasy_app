# Testing — Rencana QA

Pengujian teknis aplikasi. Evaluasi pedagogis ada di [evaluation.md](evaluation.md).

## 1. Piramida pengujian

| Lapisan | Alat | Cakupan target |
|---|---|---|
| Unit | Vitest | `engine/*` ≥ 90% baris |
| Konten | `npm run content:check` | 100% item JSON |
| Komponen | Vitest + Testing Library | Interaksi utama tiap fitur |
| End-to-end | Playwright (viewport 360 × 760, Chromium, emulasi Pixel 5) | Alur belajar lengkap + rekap guru |
| PWA | Lighthouse (mobile) | Installable, service worker, performa ≥ 80 |
| Perangkat | Emulator + HP fisik | Matriks §5 |
| Manual | Checklist §7 | Setiap rilis |

## 2. Unit test engine

### 2.1 `math.ts` — tabel kasus (dari [content.md](content.md))

| Fungsi | Input | Harapan |
|---|---|---|
| `arcLength` | r=14, θ=90, 22/7 | 22 |
| `sectorArea` | r=14, θ=90, 22/7 | 154 |
| `arcLength` | r=7, θ=90 | 11 |
| `sectorArea` | r=7, θ=90 | 38,5 |
| `arcLength` | r=21, θ=60 | 22 |
| `sectorArea` | r=21, θ=60 | 231 |
| `arcLength` | r=10, θ=36, 3.14 | 6,28 |
| `sectorArea` | r=10, θ=180, 3.14 | 157 |
| `sectorArea` | r=10, θ=72, 3.14 | 62,8 |
| `arcLength` | r=7, θ=120 | 14,67 (round2) |
| `sectorPerimeter` | r=14, θ=90 | 50 |
| `thetaFromArc` | arc=22, r=14 | 90 |
| `radiusFromArea` | area=77, θ=45 | 14 |
| `radiusFromArc` | arc=44, θ=120 | 21 |
| `pickPi` | r=14 / r=10 / r=10,5 | '22/7' / '3.14' / '22/7' (d = 21 kelipatan 7) |
| Batas | θ=0 → 0; θ=360 → keliling/luas penuh; r ≤ 0 → error |

> Catatan: `pickPi` memeriksa r **atau** d kelipatan 7.

### 2.2 `checker.ts`
- "7,33", "7.33", " 7,33 " → 7,33; "7,3,3" → null.
- Toleransi relatif 0,01: 14,67 dan 14,666 diterima untuk P08.
- Satuan salah (cm² untuk panjang) → `unitOk=false`, umpan balik satuan.
- Pola miskonsepsi: P01 jawaban 38,5 → `swap_formula`; P01 jawaban 44 → `forgot_fraction`; P07 jawaban 308 →
  `diameter_as_radius`.

### 2.3 `stepSolver.ts`
- Urutan `asked → … → done`; tidak bisa melompat pada mode terbimbing.
- `goBack` mempertahankan isian langkah sebelumnya.
- Kesalahan menambah `errors` tanpa memajukan langkah.

### 2.4 `hintFader.ts`
- Mulai 3 tingkat; 2 soal benar beruntun tanpa petunjuk → 2; lagi → 1; minimum 1 di bagian mandiri.
- Salah 2× pada soal yang sama → +1 tingkat (maks 3).
- Petunjuk dibuka berurutan; tidak bisa membuka tingkat 3 sebelum 2.

### 2.5 `adaptivePath.ts`
- Skor 3/6 → remedial hanya untuk butir salah; 4/6 → lanjut.

## 3. Uji konten (`content:check`)
- ID unik & referensi valid.
- Kunci jawaban = hasil `math.ts` dari `given`.
- Kartu ≤ 40 kata; kalimat soal ≤ 20 kata.
- Tepat 3 petunjuk; petunjuk 3 tidak memuat nilai jawaban akhir.
- Istilah terlarang dari [glossary.md](glossary.md) §4 tidak muncul (regex: `radius|keliling busur|luas busur|panjang juring|sudut tengah`).

## 4. Uji komponen & E2E

| Skenario | Harapan |
|---|---|
| Masuk dengan kode tidak valid | Pesan jelas, tidak lanjut |
| Diagnostik skor 3 | Diarahkan ke remedial yang sesuai |
| Eksplorasi: geser θ ke 90° | Label "¼", busur 22 cm, juring 154 cm² (r=14) |
| Toggle "Busur" | Juring tersembunyi |
| Step Solver P01 jawaban 38,5 | Umpan balik tertukar rumus |
| Buka petunjuk 1→2→3 | Berurutan, tingkat 3 tanpa jawaban |
| Soal cerita: tandai "14 m" & "90°" | Muncul di ringkasan yang ditandai |
| Cek Kewajaran → "Periksa lagi" | Kembali ke input, event `sanity_check` tercatat |
| Akhir bagian | Skala Paas muncul satu kali |
| Tutup & buka ulang aplikasi | Progres tetap |
| Tombol Kembali Android | Kembali satu layar (history API), tidak keluar aplikasi tiba-tiba |
| Masuk di HP lain dengan kode sama | Progres dilanjutkan dari server |
| Guru login & buka rekap kelas 8A | Hanya siswa 8A tampil; guru kelas lain ditolak |
| Versi baru di-deploy saat siswa mengerjakan soal | Prompt pembaruan muncul di beranda, bukan di tengah soal |

## 5. Matriks perangkat Android

Target utama: HP kelas menengah (ADR-013). Browser: Chrome terbaru (utama), Samsung Internet (sekunder).

| Kelas | Contoh spesifikasi | Android | Fokus |
|---|---|---|---|
| Menengah (target) | RAM 4–6 GB, Helio G8x/G9x atau Snapdragon 6xx | 11–14 | Alur penuh, FPS 3D, install PWA |
| Batas bawah (jaga-jaga) | RAM 3 GB | 10 | Fallback SVG berjalan |
| Samsung | Galaxy A-series | 12+ | Samsung Internet |
| Emulator | Pixel 5 API 30 & API 34 | — | CI/manual |

Ukuran layar: 360 × 640, 360 × 760, 412 × 915; font sistem 100% & 130%.

## 6. Performa & 3D

| Metrik | Target | Cara ukur |
|---|---|---|
| FPS saat menggeser slider | ≥ 45 (HP kelas menengah) | `watchFps`, Chrome DevTools remote debugging |
| Memori setelah 10× masuk-keluar scene | Tidak naik > 10% | `renderer.info.memory` (geometries, textures kembali ke awal) |
| Interaktif (kunjungan pertama, 4G) | ≤ 3 s | Lighthouse / DevTools throttling |
| Interaktif (kunjungan ulang) | ≤ 1,5 s | Lighthouse |
| Unduhan awal | ≤ 3 MB gzip | `vite build` report |
| Fallback | Aktif bila WebGL off atau FPS < 20 selama 3 s | Paksa `webglSupport=false` |

## 7. Koneksi & sinkronisasi
- Wi-Fi diputus di tengah latihan selama 1 menit: siswa dapat terus mengerjakan (materi dari cache); data terkirim
  setelah tersambung; tidak ada duplikat (id UUID, `ignore-duplicates`).
- Server gagal (500): backoff; data tidak hilang.
- 30 HP mengirim data bersamaan (simulasi kelas): tidak ada error rate limit Supabase.
- `VITE_SYNC_ENABLED=false` (pengembangan): tidak ada request jaringan.

## 8. Keamanan & privasi
- RLS: dengan kunci anon, `select` ke `attempts` mengembalikan 0 baris / ditolak.
- `get_my_progress` dengan kode kelas salah → tidak mengembalikan data.
- `class_recap` oleh guru yang tidak terdaftar di `teacher_classes` → 0 baris.
- Tidak ada nama/foto/PII di fixture, log, atau commit (pindai `git grep` sebelum rilis).
- Isian refleksi: tolak pola nomor HP dan email.
- PWA tidak meminta izin kamera, lokasi, mikrofon, atau notifikasi.

## 9. Aksesibilitas
- TalkBack membaca semua tombol & slider dengan label bermakna.
- Kontras ≥ 4.5:1 (cek otomatis axe di Playwright).
- Simulasi buta warna (deuteranopia, protanopia): busur vs juring tetap dapat dibedakan.
- `prefers-reduced-motion`: transisi dimatikan.

## 10. Checklist rilis

- [ ] Semua test & `content:check` lulus
- [ ] Uji manual di minimal 1 HP kelas menengah (Chrome) dan 1 Samsung (Samsung Internet)
- [ ] Lighthouse mobile dicatat (PWA, performa, aksesibilitas)
- [ ] Deploy preview Vercel diuji sebelum promote ke production
- [ ] [changelog.md](changelog.md) diperbarui
- [ ] Versi `appVersion` dinaikkan (masuk ke data log)
