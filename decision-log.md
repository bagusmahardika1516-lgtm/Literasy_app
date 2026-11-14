# Decision Log — Jejak Keputusan Desain (ADDIE)

Format ADR ringkas. Setiap keputusan mencantumkan bukti temuan, rasional teori, alternatif, perilaku pengguna yang
diharapkan, dan indikator uji (pedoman wawancara bagian H). Status: **Diusulkan · Diterima · Diganti · Ditolak**.

| ID | Tanggal | Keputusan | Status |
|---|---|---|---|
| ADR-001 | 12-11-2026 | Stack React + Vite + TS sebagai **PWA** (Capacitor ditunda) | Diterima (direvisi setelah wawancara Android) |
| ADR-002 | 12-11-2026 | Three.js untuk ilustrasi 3D terbatas + fallback SVG | Diterima |
| ADR-003 | 12-11-2026 | ~~Offline-first~~ → Online dengan buffer lokal Dexie | Diganti (wawancara Android) |
| ADR-004 | 12-11-2026 | ~~Supabase diakses langsung dari frontend~~ | Diganti oleh ADR-017 |
| ADR-005 | 12-11-2026 | Kode warna tetap busur/juring/sudut | Diterima |
| ADR-006 | 12-11-2026 | Step Solver 6 langkah | Diterima |
| ADR-007 | 12-11-2026 | Petunjuk 3 tingkat dengan pemudaran | Diterima |
| ADR-008 | 12-11-2026 | Tanpa auto-play, timer, dan animasi dekoratif | Diterima |
| ADR-009 | 12-11-2026 | Soal cerita per kalimat + Tandai Info Penting | Diterima |
| ADR-010 | 12-11-2026 | Tanpa gamifikasi poin/leaderboard | Diterima |
| ADR-011 | 12-11-2026 | ~~Masuk dengan kode pseudonim, tanpa kata sandi~~ | Diganti oleh ADR-022 |
| ADR-012 | 12-11-2026 | Konten dalam JSON terpisah dari kode | Diterima |
| ADR-013 | 12-11-2026 | Target HP kelas menengah, pemakaian di kelas didampingi guru | Diterima |
| ADR-014 | 12-11-2026 | Hosting PWA di Vercel | Diterima |
| ADR-015 | 12-11-2026 | ~~Rekap guru sederhana (F15)~~ | Ditunda (target: hanya untuk siswa) |
| ADR-016 | 12-11-2026 | Tanpa narasi audio | Diterima |
| ADR-017 | 12-11-2026 | Backend Python FastAPI + PostgreSQL | Diterima |
| ADR-022 | 14-11-2026 | Login username + password, sesi token, satu perangkat aktif | Diterima |
| ADR-018 | 12-11-2026 | Frontend JavaScript (bukan TypeScript) | Diterima |
| ADR-019 | 12-11-2026 | Engine rumus ganda (Python & JS) diuji dengan konten yang sama | Diterima |
| ADR-020 | 12-11-2026 | Soal Tabel 2 docx = Uji Literasi pre/post, diskor per tahap di server | Diterima (rubrik T1/T3 menunggu konfirmasi) |
| ADR-021 | 12-11-2026 | Permainan "Busur atau Juring?" tanpa poin/timer | Diterima |

---

### ADR-001 — Stack React + Vite + TypeScript sebagai PWA
- **Konteks:** pengembang tunggal (vibe coding), wajib Android, wajib Three.js.
- **Keputusan awal:** web app dibungkus Capacitor menjadi APK.
- **Revisi (wawancara Android sesi 1):** distribusi lewat **tautan PWA**; siswa membuka di Chrome Android dan dapat
  menambahkannya ke layar utama. Capacitor ditunda ke P2.
- **Alasan revisi:** tanpa instalasi APK/izin "sumber tidak dikenal", pembaruan instan untuk semua siswa, cocok untuk
  pemakaian di kelas yang selalu online.
- **Alternatif:** Flutter + WebView; React Native + expo-three; APK Capacitor.
- **Konsekuensi:** bergantung pada browser; perlu uji Chrome & Samsung Internet; tidak ada akses API native (tidak
  dibutuhkan).
- **Indikator:** interaktif ≤ 3 s di 4G, 3D ≥ 45 FPS (NFR-02, NFR-04), Lighthouse PWA lulus.

### ADR-002 — Three.js untuk 3D terbatas + fallback SVG
- **Bukti:** EL02, GL01 (gambar lingkaran berwarna membantu); EL03, DS03 (animasi berlebihan mengganggu).
- **Rasional:** visual dinamis membantu melihat hubungan θ ↔ bagian lingkaran; *coherence principle* membatasi pemakaian.
- **Keputusan:** 3D hanya di Eksplorasi, scene Angkat Juring, Luruskan Busur, dan konteks literasi; layar lain SVG 2D.
- **Alternatif:** semua 2D (lebih ringan, kurang menarik); semua 3D (berisiko beban extraneous).
- **Perilaku yang diharapkan:** siswa menggeser θ dan menjelaskan "90° = ¼ lingkaran".
- **Indikator:** siswa dapat menjelaskan hubungan besaran setelah Eksplorasi; uji kecil 3D vs SVG pada skala Paas.

### ADR-003 — Online dengan buffer lokal (menggantikan offline-first)
- **Konteks awal:** asumsi kuota terbatas → offline-first.
- **Temuan wawancara Android:** siswa selalu online saat pemakaian.
- **Keputusan:** Supabase menjadi penyimpanan utama; Dexie tetap dipakai sebagai *write-behind buffer* agar data tidak
  hilang saat Wi-Fi kelas putus sesaat; service worker meng-cache materi agar dibuka ulang dengan cepat.
- **Keuntungan:** progres dapat dilanjutkan di HP lain; rekap guru (F15) mendapat data segera.
- **Indikator:** 0 data hilang pada uji putus-sambung jaringan ([testing.md](testing.md) §7).

### ADR-004 — Supabase insert-only untuk data penelitian
- **Konteks:** tahap Evaluation memerlukan data log, skala usaha, hasil tes.
- **Keputusan:** RLS anon hanya `insert`; peneliti membaca via role terpisah.
- **Alternatif:** ekspor CSV manual saja (tanpa server) — tetap disediakan sebagai cadangan.
- **Risiko:** konfigurasi RLS salah → kebocoran; mitigasi uji RLS di [testing.md](testing.md).

### ADR-005 — Kode warna tetap
- **Bukti:** EL02 ("busur dan juringnya diberi warna berbeda"), IL01, K03 (tertukar).
- **Rasional:** *signaling*; asosiasi warna–konsep yang konsisten mengurangi pencarian visual.
- **Keputusan:** busur oranye `#E69F00`, juring biru `#0072B2`, sudut hijau `#009E73` (Okabe–Ito, aman buta warna).
- **Indikator:** ≥ 80% benar pada item "pilih rumus" (G3).

### ADR-006 — Step Solver 6 langkah
- **Bukti:** IL02 (r, θ, yang ditanya sekaligus), IL05 (salah pilih rumus, urutan).
- **Rasional:** *segmenting* menurunkan interaktivitas unsur; langkah "ditanya" didahulukan agar pemilihan rumus terarah.
- **Indikator:** persentase langkah benar tanpa petunjuk meningkat antarsoal.

### ADR-007 — Petunjuk 3 tingkat dengan pemudaran
- **Bukti:** GL03 ("sedikit demi sedikit, jangan langsung jawabannya").
- **Rasional:** *guidance fading*, *expertise reversal effect*.
- **Keputusan:** isyarat → strategi → langkah parsial; tersedia tingkat berkurang setelah 2 benar beruntun tanpa petunjuk.
- **Indikator:** rata-rata petunjuk per soal menurun dari bagian terbimbing ke mandiri (G4).

### ADR-008 — Tanpa auto-play, timer, animasi dekoratif
- **Bukti:** EL03, EL04, DS03.
- **Rasional:** *coherence* & *learner pacing*.
- **Indikator:** skor item EL rendah; frekuensi tombol Ulangi dicatat.

### ADR-009 — Soal cerita per kalimat + Tandai Info Penting
- **Bukti:** EL01, EL05, IL04.
- **Rasional:** mengurangi beban membaca; melatih proses *formulate* literasi.
- **Indikator:** siswa menandai data relevan tanpa petunjuk; akurasi soal L2.

### ADR-010 — Tanpa gamifikasi poin/leaderboard
- **Bukti:** DS03, EL03.
- **Rasional:** elemen kompetitif & animasi hadiah menambah beban extraneous dan kecemasan.
- **Catatan:** dapat ditinjau ulang bila uji coba menunjukkan motivasi rendah; ringkasan progres sederhana tetap ada.

### ADR-011 — Kode pseudonim
- **Dasar:** pedoman etika wawancara bagian C; data anak di bawah umur.
- **Keputusan:** login `S01` + kode kelas; tanpa nama/email/foto.

### ADR-012 — Konten JSON terpisah
- **Rasional:** guru/peneliti dapat merevisi materi setelah validasi ahli tanpa mengubah kode; kunci jawaban diverifikasi
  otomatis oleh `content:check`.

### ADR-013 — Target HP kelas menengah & pemakaian di kelas
- **Sumber:** wawancara Android sesi 1.
- **Keputusan:** target Android 11+, RAM 4–6 GB; 3D boleh memakai antialias, target ≥ 45 FPS; tetap ada fallback SVG.
  Sesi dirancang untuk 2–3 pertemuan × 40 menit; guru mendampingi.
- **Implikasi CLT:** guru dapat menjadi sumber bantuan tambahan, tetapi aplikasi tetap tidak bergantung pada
  penjelasan guru (petunjuk bertingkat tetap lengkap).

### ADR-014 — Hosting Vercel
- **Keputusan:** Vercel (HTTPS otomatis, wajib untuk PWA; deploy otomatis dari GitHub; preview URL per branch untuk
  validasi ahli).
- **Alternatif:** Netlify, GitHub Pages.

### ADR-015 — Rekap guru sederhana (F15)
- **Sumber:** wawancara Android (guru perlu melihat kemajuan) + ADR-013 (pemakaian di kelas).
- **Keputusan:** halaman `/guru` dengan login Supabase Auth; tabel per kode siswa; penanda "Perlu bantuan"; tanpa
  real-time.
- **Alternatif ditolak:** dasbor penuh real-time (ruang lingkup terlalu besar).
- **Indikator:** guru dapat menyebut siswa yang perlu bantuan dalam ≤ 1 menit.

### ADR-016 — Tanpa narasi audio
- **Sumber:** wawancara Android.
- **Alasan:** pemakaian di kelas (suara dari banyak HP mengganggu); mengurangi pekerjaan rekaman; teks pendek +
  visual sudah dirancang sesuai EL01/DS03.
- **Konsekuensi:** prinsip modalitas tidak dimanfaatkan; dicatat sebagai keterbatasan.

### ADR-017 — Backend Python FastAPI + PostgreSQL
- **Sumber:** permintaan pengembang: bahasa yang dipakai hanya Python dan JavaScript beserta framework-nya.
- **Keputusan:** FastAPI (Python) sebagai backend; SQLAlchemy 2; PostgreSQL di cloud (Supabase/Neon, sebagai database
  saja) untuk produksi, SQLite untuk pengembangan lokal. Frontend tidak lagi mengakses Supabase langsung.
- **Alternatif:** Django + DRF (admin siap pakai, tetapi lebih berat & sulit di-hosting di Vercel); Flask (lebih
  banyak dibuat manual).
- **Konsekuensi:** RLS Supabase digantikan oleh otorisasi di endpoint FastAPI; login guru (F15) dibuat di backend;
  dokumentasi API otomatis di `/docs`. Hosting backend (Vercel Python function atau Render/Railway) diputuskan saat
  Sprint 5.

### ADR-018 — Frontend JavaScript (bukan TypeScript)
- **Sumber:** sama dengan ADR-017.
- **Keputusan:** React + Vite dalam JavaScript ES modules; tipe didokumentasikan dengan JSDoc.
- **Konsekuensi:** kehilangan pemeriksaan tipe saat kompilasi; dimitigasi dengan unit test engine dan tes konten.

### ADR-019 — Engine rumus ganda diuji dengan konten yang sama
- **Konteks:** umpan balik di HP harus instan (JS), sedangkan validasi konten & verifikasi data penelitian di server
  (Python).
- **Keputusan:** `backend/app/engine/circle.py` dan `frontend/src/engine/circle.js` mengimplementasikan rumus yang
  sama; keduanya diuji terhadap seluruh kunci jawaban di `content/problems.json` dan tabel kasus yang sama.
  Pembulatan disamakan (half-up berbasis representasi desimal).
- **Risiko:** kedua implementasi menyimpang; mitigasi: tes kasus identik di kedua sisi wajib lulus sebelum rilis.

### ADR-020 — Uji Literasi dari "Soal Mathematical literacy.docx"
- **Sumber:** Tabel 2 dokumen pengembang (4 soal busur/juring, 4 indikator, skor 6 per soal, total 24).
- **Keputusan (dipilih pengembang):** keempat soal menjadi **pretest & posttest** di aplikasi, bukan latihan, agar
  tetap valid sebagai instrumen; latihan memakai bank P01–P18.
- **Bentuk:** setiap tahap kisi-kisi menjadi isian terstruktur (pilihan, angka, isian diketahui, atau teks alasan).
  Skor parsial per tahap sesuai pedoman penskoran ("tahap awal benar tetap diberi skor"). Isian teks disimpan untuk
  dinilai manual. Kunci tidak dikirim ke HP (`GET /api/mltest`); penskoran di server.
- **Penyesuaian sementara rubrik (menunggu konfirmasi):**
  - T1: dokumen memberi skor tahap 1–5 padahal ada 6 tahap → tahap 5 dan 6 masing-masing 0,5.
  - T3: skor tahap (1+2+2+1) tampaknya tersalin dari contoh Tabel 1 → dipakai 1/1/2/1/1/0 (tahap 6 = kesimpulan,
    dinilai manual).
- **Validitas:** posisi jawaban benar pada pilihan dibuat bervariasi (uji ujung-ke-ujung menunjukkan pola "selalu
  pilih pertama" turun dari 14/24 menjadi 1,5/24).

### ADR-021 — Permainan "Busur atau Juring?" tanpa poin
- **Sumber:** permintaan pengembang ("permainan"), dibatasi G3/G10 dan DS03/EL03.
- **Keputusan:** kartu klasifikasi busur vs juring dengan alasan setiap jawaban; kartu yang salah diulang di akhir;
  hanya ditampilkan "x/10 kartu tepat" — tanpa poin, timer, papan peringkat, animasi hadiah.
- **Indikator:** jumlah kartu yang perlu diulang menurun; ≥ 80% benar item "pilih rumus" (G3).

### ADR-022 — Login username + password, sesi token, satu perangkat aktif
- **Tanggal / status:** 14-11-2026 / Diterima. Menggantikan ADR-011 (bagian "tanpa kata sandi").
- **Bukti temuan:** audit 14-11-2026 (AUDIT_LITERASY.md temuan #4–#5): kode `S01` mudah ditebak dan kode kelas
  dibagikan ke seluruh kelas, sehingga siapa pun bisa menulis data atas nama siswa lain; `/masuk` bisa dibuka saat
  sudah masuk.
- **Keputusan:**
  - Username pseudonim (`<kelas>-<kode>`, mis. `8a-2026-s01`) + password acak 10 karakter dari skrip
    `scripts/manage_accounts.py`. Tetap tanpa nama/email/foto.
  - Password di-hash **Argon2id** (`argon2-cffi`); token sesi 32 byte acak, database hanya menyimpan SHA-256-nya.
  - Token dikirim lewat header `Authorization: Bearer` (bukan cookie: frontend dan backend beda domain), disimpan di
    localStorage sehingga siswa tetap masuk setelah browser ditutup. Masa berlaku 30 hari, bergeser saat dipakai.
  - **Satu perangkat aktif:** login baru mencabut sesi lain akun itu; perangkat lama menerima 401
    `session_replaced` dan menampilkan alasannya.
  - Pembatasan percobaan: 5 gagal per username / 30 per IP dalam 15 menit → 429.
  - Antrean catatan & draf uji disimpan per siswa dan tidak dihapus saat keluar atau sesi berakhir.
- **Alternatif:** cookie httpOnly (ditolak: cookie pihak ketiga sering diblokir lintas domain); JWT tanpa tabel
  sesi (ditolak: tidak bisa dicabut untuk aturan satu perangkat).
- **Konsekuensi/risiko:** lupa password hanya bisa direset lewat skrip oleh peneliti; token di localStorage rentan
  bila ada XSS (aplikasi tidak memakai `innerHTML`).

---

## Templat entri baru

```
### ADR-0XX — <judul>
- Tanggal / status:
- Bukti temuan (kode kutipan/observasi):
- Rasional teori:
- Keputusan:
- Alternatif yang dipertimbangkan:
- Perilaku pengguna yang diharapkan:
- Indikator uji:
- Konsekuensi/risiko:
```
