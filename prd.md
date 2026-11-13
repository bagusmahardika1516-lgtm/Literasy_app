# PRD — Literasy: Busur & Juring

| Atribut | Isi |
|---|---|
| Versi dokumen | 0.1 (12 November 2026) |
| Tahap ADDIE | Analysis → Design |
| Materi | Panjang busur dan luas juring lingkaran (Kelas VIII, Fase D Kurikulum Merdeka) |
| Platform | PWA untuk Chrome Android (hosting Vercel); APK Capacitor ditunda |
| Konteks pemakaian | Di kelas, didampingi guru, 2–3 pertemuan × 40 menit, online |
| Sumber kebutuhan | Wawancara S01 (8 Nov 2026), lihat [analysis.md](analysis.md) |

---

## 1. Latar belakang

Siswa SMP sering mampu menghafal rumus lingkaran, tetapi kesulitan **memilih** rumus yang tepat dan **menerapkannya
pada konteks nyata** — inti dari literasi matematis. Wawancara mendalam berbasis Cognitive Load Theory (CLT) pada siswa
yang telah mempelajari materi ini menunjukkan bahwa kesulitan berasal dari tiga sumber:

1. **Intrinsic load** — dua konsep mirip (busur vs juring) dengan rumus yang strukturnya serupa; banyak unsur yang harus
   diolah bersamaan (r, θ, apa yang ditanya); soal cerita multi-langkah.
2. **Extraneous load** — kalimat soal panjang, informasi penting sulit ditemukan, tampilan terlalu ramai, tempo
   penjelasan terlalu cepat.
3. **Germane (proses pemahaman)** — siswa terbantu oleh gambar berwarna, contoh soal mirip, petunjuk bertahap, dan
   menjelaskan kepada taeman, tetapi belum terbiasa memeriksa kewajaran jawaban.

## 2. Tujuan produk

| ID | Tujuan | Ukuran keberhasilan |
|---|---|---|
| G1 | Meningkatkan literasi matematis pada materi busur & juring | N-gain pretest–posttest literasi ≥ 0,3 (sedang) — lihat [evaluation.md](evaluation.md) |
| G2 | Menjaga beban kognitif extraneous rendah | Rata-rata skala Paas per bagian ≤ 5 (dari 9); skor item EL kuesioner rendah |
| G3 | Siswa dapat membedakan busur dan juring | ≥ 80% benar pada item "pilih rumus" setelah modul Kontras |
| G4 | Siswa makin mandiri | Rata-rata petunjuk per soal menurun dari latihan terbimbing ke latihan mandiri |
| G5 | Aplikasi mudah digunakan | SUS ≥ 70 |

## 3. Pengguna

**Persona utama — "Raka", siswa kelas VIII**
- Usia 13–14 tahun, HP Android kelas menengah (RAM 4–6 GB, Android 11+, Chrome terbaru), selalu online saat belajar.
- Memakai aplikasi di kelas dengan pendampingan guru.
- Sudah belajar keliling dan luas lingkaran di kelas VII, tetapi sebagian lupa.
- Belajar dengan mencatat penjelasan guru dan mengerjakan contoh soal (K02).
- Mudah kehilangan fokus jika layar ramai; perlu bisa mengulang penjelasan.

**Pengguna sekunder**
- **Guru**: memakai aplikasi sebagai media pembelajaran di kelas; melihat **rekap sederhana** kemajuan per kode siswa.
- **Peneliti (pengembang)**: mengumpulkan data log, skala usaha mental, dan hasil tes untuk tahap Evaluation.

## 4. Matriks keterlacakan: temuan → kebutuhan → fitur

Setiap fitur wajib memiliki bukti temuan, rasional teori, perilaku yang diharapkan, dan indikator uji
(pedoman wawancara bagian H).

| ID Fitur | Kode bukti | Temuan | Rasional CLT | Fitur | Indikator uji |
|---|---|---|---|---|---|
| F01 | K03, IL01 | Tertukar busur vs juring; rumus mirip | Kurangi interaktivitas unsur dengan kontras eksplisit; *signaling* | **Modul Kontras Busur–Juring**: busur = θ/360 × **keliling** (satuan cm), juring = θ/360 × **luas** (satuan cm²); warna tetap (busur oranye, juring biru) | ≥ 80% benar item "pilih rumus" |
| F02 | IL02, IL05 | Harus menghubungkan r, θ, yang ditanya; salah urutan | *Segmenting*, mengurangi elemen simultan | **Step Solver 6 langkah**: ① Apa yang ditanya? ② Data diketahui ③ Pecahan θ/360 ④ Pilih rumus ⑤ Hitung ⑥ Periksa | Persentase langkah benar tanpa petunjuk |
| F03 | IL03, K01 | Prasyarat: bagian lingkaran, keliling, luas; sudah lupa | *Pre-training* | **Diagnostik prasyarat** (6 soal) + remedial singkat bila < 4 benar | Skor diagnostik ulang setelah remedial |
| F04 | IL04 | Sulit pada soal cerita & mencari nilai yang belum diketahui | *Worked example effect* → *completion problem* | **Tangga latihan**: contoh terurai → soal melengkapi → mandiri → soal invers (cari r atau θ) | Akurasi per tingkat |
| F05 | EL01, EL05 | Kalimat soal panjang; sulit cari info penting | Kurangi *extraneous load*; *signaling* | **Soal cerita dipecah per kalimat** + alat **"Tandai info penting"** (ketuk kata) + langkah terpisah "Apa yang ditanya?" | Siswa menandai data relevan tanpa petunjuk |
| F06 | EL02, GL01 | Lebih mudah dengan gambar berwarna | *Spatial contiguity*, *multimedia* | **Label menempel pada gambar**; teks penjelas berada tepat di bawah ilustrasi, bukan di halaman lain | Wawancara kejelasan tampilan |
| F07 | EL03, DS03 | Warna & animasi berlebihan mengganggu | *Coherence principle* | **Maks. 3 warna semantik**, tanpa animasi dekoratif, 3D hanya saat menjelaskan hubungan sudut–bagian | Skor EL kuesioner; observasi distraksi |
| F08 | EL04 | Penjelasan terlalu cepat; perlu diulang | *Learner-paced* | **Kontrol tempo**: tombol Lanjut/Kembali/Ulangi, tanpa auto-play, tanpa batas waktu | Frekuensi tombol Ulangi; skala Paas |
| F09 | GL02 | Hanya menghitung ulang, ragu rumusnya benar | Refleksi, monitoring metakognitif | **Cek Kewajaran**: "90° itu ¼ lingkaran → apakah jawabanmu ≈ ¼ keliling?" + **cek satuan** (cm vs cm²) | Persentase siswa memperbaiki jawaban setelah cek |
| F10 | GL03 | Mau petunjuk sedikit demi sedikit, bukan jawaban | *Guidance fading* | **Petunjuk 3 tingkat** (isyarat → strategi → langkah parsial), jumlah petunjuk yang tersedia **dipudarkan** pada latihan berikutnya | Rata-rata petunjuk per soal menurun |
| F11 | GL04 | Menjelaskan ke teman membuat lebih paham | *Self-explanation effect* | **"Jelaskan ke Teman"**: siswa memilih/mengetik alasan langkah ("Mengapa pakai keliling, bukan luas?") | Kualitas penjelasan (rubrik 0–2) |
| F12 | GL05 | Contoh mirip membantu soal baru | *Example–problem pairs*, variasi konteks | **Pasangan contoh–soal** dengan konteks bervariasi (pizza, jam, kipas, taman, bianglala, penyiram) | Akurasi pada soal transfer |
| F13 | DS01, DS02 | Butuh gambar, rumus, contoh; rumus pelan lalu latihan mandiri | Urutan *explore → explain → practice* | **Alur belajar tetap**: Eksplorasi 3D → Konsep → Contoh → Terbimbing → Mandiri → Literasi → Refleksi | Penyelesaian alur; SUS |
| F14 | — (penelitian) | Kebutuhan data evaluasi | Pengukuran beban kognitif (Paas, 1992) | **Skala usaha mental 1–9** di akhir tiap bagian + log peristiwa | Kelengkapan data |
| F15 | — (wawancara Android) | Pemakaian di kelas didampingi guru | Guru dapat memberi bantuan tepat sasaran | **Rekap guru sederhana** per kode siswa | Guru dapat menyebut siswa yang perlu bantuan |

## 5. Ruang lingkup MVP

### P0 — wajib ada pada uji coba pertama
- F01 Modul Kontras, F02 Step Solver, F03 Diagnostik, F05 Tandai info penting, F06/F07 desain bersih,
  F08 kontrol tempo, F10 petunjuk bertingkat, F13 alur belajar.
- Eksplorasi 3D: lingkaran dengan slider sudut pusat (0–360°) dan jari-jari; busur & juring disorot terpisah.
- Penyimpanan kemajuan ke Supabase dengan buffer lokal (tidak hilang bila sinyal putus sesaat).
- Masuk dengan **kode siswa + kode kelas** (mis. S01 + 8A-2026) — tanpa nama, tanpa kata sandi.
- PWA dapat dipasang ke layar utama; aset di-cache service worker agar cepat dibuka ulang.

### P1 — penting
- F04 soal invers, F09 Cek Kewajaran, F11 Jelaskan ke Teman, F12 konteks bervariasi (scene konteks 3D).
- F14 skala Paas + log peristiwa; sinkronisasi ke Supabase.
- Ekspor CSV untuk analisis peneliti.
- **F15 Rekap guru sederhana**: halaman terpisah (login guru) berisi tabel per kode siswa — bagian yang selesai,
  akurasi, rata-rata petunjuk, rata-rata skala usaha. Tanpa grafik real-time.

### P2 — jika waktu memungkinkan
- Topik lanjutan: luas tembereng.
- Paket APK Capacitor bila nanti dibutuhkan distribusi tanpa browser.

### Di luar ruang lingkup (non-goals)
- Gamifikasi berlebihan (poin, papan peringkat, animasi hadiah) — bertentangan dengan EL03/DS03.
- Chat AI bebas untuk siswa.
- Materi lingkaran lain (garis singgung, sudut keliling) pada versi ini.
- Akun dengan nama asli, email, atau foto siswa.
- Narasi audio/suara (diputuskan pada wawancara Android, ADR-016).
- Dasbor guru penuh dengan pemantauan real-time.

## 6. Kebutuhan fungsional

| ID | Kebutuhan |
|---|---|
| FR-01 | Siswa masuk dengan kode (format `S\d{2,3}`) dan kode kelas yang divalidasi server; tanpa kata sandi |
| FR-02 | Diagnostik 6 soal; skor < 4 → remedial prasyarat sebelum lanjut |
| FR-03 | Scene 3D dapat diputar (1 jari), diperbesar (2 jari), dan diatur ulang; slider θ dan r |
| FR-04 | Label nilai (r, θ, θ/360, panjang busur, luas juring) diperbarui langsung saat slider digeser |
| FR-05 | Setiap layar materi hanya memuat satu ide utama (≤ ±40 kata teks) |
| FR-06 | Step Solver memvalidasi tiap langkah; kesalahan memberi umpan balik spesifik (mis. "Satuanmu cm², yang ditanya panjang") |
| FR-07 | Petunjuk tingkat 1→2→3 dibuka berurutan; tingkat 3 tidak menampilkan jawaban akhir |
| FR-08 | Jumlah tingkat petunjuk yang tersedia berkurang setelah 2 soal berturut-turut benar tanpa petunjuk |
| FR-09 | Soal cerita ditampilkan per kalimat; siswa dapat menandai kata/angka penting |
| FR-10 | Jawaban numerik menerima koma/titik desimal dan toleransi pembulatan ±0,01 relatif |
| FR-11 | Skala Paas muncul di akhir tiap bagian (tidak di tengah soal) |
| FR-12 | Data dikirim ke Supabase; ditulis dulu ke buffer lokal dan dikirim ulang otomatis bila koneksi putus |
| FR-13 | Peneliti dapat mengekspor data CSV per kode siswa |
| FR-14 | Guru masuk dengan email + kata sandi (Supabase Auth) dan melihat rekap kelasnya saja |

## 7. Kebutuhan non-fungsional

| ID | Kebutuhan |
|---|---|
| NFR-01 | Berjalan di Chrome Android pada Android 11+, RAM 4 GB |
| NFR-02 | Scene 3D ≥ 45 FPS pada HP kelas menengah; fallback SVG 2D bila WebGL tidak tersedia |
| NFR-03 | Unduhan awal ≤ 3 MB (gzip, tanpa model 3D konteks); model konteks dimuat saat dibutuhkan; Lighthouse PWA lulus |
| NFR-04 | Tampil interaktif ≤ 3 detik pada jaringan 4G (kunjungan pertama), ≤ 1,5 detik (kunjungan berikutnya, cache) |
| NFR-05 | Teks ≥ 16sp, target sentuh ≥ 48dp, kontras WCAG AA, warna aman buta warna |
| NFR-06 | Bahasa Indonesia baku, kalimat pendek, istilah sesuai [glossary.md](glossary.md) |
| NFR-07 | Tidak ada data identitas asli siswa — lihat [privacy.md](privacy.md) |

## 8. Literasi matematis

Mengacu pada kerangka PISA 2022: siswa merumuskan situasi menjadi masalah matematika (*formulate*), menggunakan konsep
dan prosedur (*employ*), serta menafsirkan dan mengevaluasi hasil dalam konteks (*interpret/evaluate*). Konten:
*space and shape*; konteks: personal, sosial, pekerjaan, ilmiah. Pemetaan soal ke proses ada di
[content.md](content.md) dan [design.md](design.md#8-pemetaan-literasi-matematis).

## 9. Asumsi & risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Baru 1 informan (S01) | Kebutuhan bias | Wawancara S02 dengan kemampuan berbeda; catat variasi di [analysis.md](analysis.md) |
| HP siswa tidak kuat WebGL | Fitur 3D gagal | Fallback SVG 2D; render-on-demand |
| Wi-Fi/kuota kelas tidak stabil | Data hilang, siswa tertahan | Buffer lokal + kirim ulang; materi di-cache service worker |
| Browser bukan Chrome / versi lama | Tampilan rusak | Halaman cek kompatibilitas di awal; uji di Chrome & Samsung Internet |
| 3D justru menambah beban kognitif | Bertentangan dengan EL03 | 3D hanya pada Eksplorasi & konteks; uji A/B kecil 3D vs 2D pada tahap uji coba |
| Pedoman wawancara & kuesioner belum tervalidasi | Validitas temuan | Validasi ahli + uji keterbacaan ([evaluation.md](evaluation.md)) |
| Data anak di bawah umur | Etika | Kode pseudonim, persetujuan orang tua ([privacy.md](privacy.md)) |

## 10. Hasil wawancara Android (sesi 1, 12 Nov 2026)

| Topik | Keputusan | ADR |
|---|---|---|
| HP siswa | Kelas menengah, RAM 4–6 GB | ADR-013 |
| Internet | Selalu online saat pemakaian | ADR-003 (direvisi) |
| Distribusi | PWA lewat tautan, hosting Vercel | ADR-001 (direvisi), ADR-014 |
| Guru | Rekap sederhana per kode siswa | ADR-015 |
| Setting pemakaian | Di kelas didampingi guru | ADR-013 |
| Login | Kode siswa + kode kelas | ADR-011 |
| Audio | Tidak ada | ADR-016 |

**Pertanyaan terbuka berikutnya:** jumlah siswa per kelas & sekolah uji coba, browser yang dipakai (Chrome/Samsung
Internet), apakah guru memakai proyektor untuk scene 3D, format ekspor data yang diinginkan dosen pembimbing.
