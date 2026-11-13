# Content — Materi, Contoh, Bank Soal, dan Petunjuk

Spesifikasi isi pembelajaran. Kode program **tidak** menyimpan teks ini secara langsung; isi dipindahkan ke
`src/content/*.json` mengikuti skema di [api.md](api.md#1-skema-konten-json). Istilah mengikuti [glossary.md](glossary.md).

**Capaian (Fase D):** siswa dapat menentukan panjang busur dan luas juring lingkaran serta menggunakannya untuk
menyelesaikan masalah kontekstual.

**Tujuan pembelajaran**
- TP1. Membedakan busur dan juring beserta satuannya.
- TP2. Menentukan pecahan sudut θ/360° dari sudut pusat.
- TP3. Menghitung panjang busur dan luas juring.
- TP4. Menentukan jari-jari atau sudut pusat bila panjang busur/luas juring diketahui.
- TP5. Merumuskan, menyelesaikan, dan menafsirkan masalah kontekstual yang melibatkan busur dan juring (literasi).

**Konvensi π:** 22/7 bila r atau d kelipatan 7; selain itu 3,14. Pembulatan 2 desimal.

---

## 1. Diagnostik prasyarat (F03, IL03)

| ID | Soal | Jawaban | Prasyarat |
|---|---|---|---|
| D1 | Garis dari titik pusat ke lingkaran disebut… (pilihan: diameter / jari-jari / tali busur) | jari-jari | Bagian lingkaran |
| D2 | Diameter 14 cm. Jari-jarinya… cm | 7 | Hubungan d = 2r |
| D3 | Keliling lingkaran dengan r = 7 cm (π = 22/7) adalah… cm | 44 | Keliling |
| D4 | Luas lingkaran dengan r = 7 cm (π = 22/7) adalah… cm² | 154 | Luas |
| D5 | Satu putaran penuh = …° | 360 | Sudut putaran |
| D6 | 90° adalah berapa bagian dari 360°? (¼ / ½ / ⅓) | ¼ | Pecahan |

Skor < 4 → remedial pada butir yang salah (masing-masing 1–2 kartu + 1 soal ulang).

### Kartu remedial (contoh)
- **R-Bagian:** gambar lingkaran dengan label O, r, d, tali busur. "Jari-jari: dari pusat ke tepi. Diameter: tepi ke
  tepi lewat pusat."
- **R-Keliling:** "Keliling = panjang tepi lingkaran = 2 × π × r." Visual tali melingkar lalu diluruskan.
- **R-Luas:** "Luas = daerah di dalam lingkaran = π × r × r." Visual daerah diarsir biru pucat.
- **R-Pecahan sudut:** lingkaran dibagi 4 / 6 / 8 → 90° = ¼, 60° = ⅙, 45° = ⅛.

---

## 2. Kartu konsep

| # | Judul | Isi (≤ 40 kata) | Visual |
|---|---|---|---|
| C1 | Sudut pusat | Sudut pusat titik sudutnya di pusat lingkaran, diapit dua jari-jari. Satu putaran penuh 360°. | Sudut hijau dengan dua jari-jari |
| C2 | Pecahan sudut | Sudut pusat menentukan **berapa bagian** lingkaran yang diambil: θ/360°. Contoh 90°/360° = ¼. | Lingkaran dibagi 4, satu bagian disorot |
| C3 | Busur | Busur adalah **bagian dari keliling**. Bentuknya garis lengkung. Panjang busur = θ/360° × 2πr. Satuan: cm. | Busur oranye; animasi "diluruskan" |
| C4 | Juring | Juring adalah **bagian dari daerah** lingkaran, seperti potongan pizza. Luas juring = θ/360° × πr². Satuan: cm². | Juring biru; animasi "diangkat" |
| C5 | Bedakan! (Modul Kontras) | Sama: keduanya dikali θ/360°. Beda: busur pakai **keliling** (cm), juring pakai **luas** (cm²). | Dua kolom berdampingan |
| C6 | Langkah menyelesaikan soal | ① Ditanya apa? ② Diketahui apa? ③ Hitung θ/360° ④ Pilih rumus ⑤ Hitung ⑥ Periksa: satuan & kewajaran. | Daftar 6 ikon |

---

## 3. Contoh terurai (worked examples)

Contoh WE1 dan WE2 sengaja memakai **data yang sama** agar perbedaan busur/juring terlihat jelas (IL01).

### WE1 — Panjang busur
Lingkaran dengan r = 14 cm, sudut pusat 90°. Tentukan panjang busur.
1. Ditanya: **panjang busur** → busur → pakai keliling → satuan cm.
2. Diketahui: r = 14 cm, θ = 90°.
3. θ/360° = 90/360 = ¼.
4. Rumus: panjang busur = θ/360° × 2πr.
5. = ¼ × 2 × 22/7 × 14 = ¼ × 88 = **22 cm**.
6. Periksa: keliling 88 cm; ¼ dari 88 = 22 ✓. Satuan cm ✓.

*Jelaskan ke teman:* "Kenapa dikali 2πr, bukan πr²?" → karena busur bagian dari keliling.

### WE2 — Luas juring (data sama)
r = 14 cm, θ = 90°. Tentukan luas juring.
1. Ditanya: **luas juring** → juring → pakai luas → satuan cm².
2. r = 14 cm, θ = 90°. 3. θ/360° = ¼.
4. Luas juring = θ/360° × πr².
5. = ¼ × 22/7 × 14 × 14 = ¼ × 616 = **154 cm²**.
6. Periksa: luas lingkaran 616 cm²; ¼-nya 154 ✓. Satuan cm² ✓.

### WE3 — Panjang busur, sudut lain
r = 21 cm, θ = 120°. θ/360 = ⅓. Keliling = 2 × 22/7 × 21 = 132. Panjang busur = ⅓ × 132 = **44 cm**.

### WE4 — Luas juring dengan π = 3,14
r = 10 cm, θ = 72°. θ/360 = ⅕. Luas lingkaran = 3,14 × 100 = 314. Luas juring = ⅕ × 314 = **62,8 cm²**.

### WE5 — Soal invers (mencari sudut)
Panjang busur 22 cm, r = 14 cm. Berapa sudut pusatnya?
1. Ditanya: θ. 2. Diketahui: panjang busur 22 cm, r = 14 cm.
3. Keliling = 88 cm. 4. Busur adalah bagian keliling: 22/88 = ¼.
5. θ = ¼ × 360° = **90°**. 6. Periksa: ¼ × 88 = 22 ✓.

### WE6 — Soal cerita (literasi)
Sebuah taman berbentuk juring dengan jari-jari 14 m dan sudut pusat 90°. Seluruh tepi taman akan dipagari. Berapa
panjang pagar?
1. Ditanya: panjang pagar = **keliling juring** (tepi taman = 2 jari-jari + busur).
2. r = 14 m, θ = 90°. 3. θ/360 = ¼.
4. Panjang busur = ¼ × 88 = 22 m.
5. Pagar = 14 + 14 + 22 = **50 m**.
6. Tafsirkan: pagar tidak hanya busur; tepi lurus juga dipagari.

---

## 4. Bank soal

Tingkat: **L1** langsung · **L2** cerita sederhana · **L3** invers/multi-langkah · **L4** literasi (keputusan/evaluasi
dalam konteks). Proses PISA: **F** formulate · **E** employ · **I** interpret.

| ID | Tk | Proses | Soal | Jawaban | Konteks |
|---|---|---|---|---|---|
| P01 | L1 | E | Panjang busur, r = 7 cm, θ = 90° | 11 cm | — |
| P02 | L1 | E | Luas juring, r = 7 cm, θ = 90° | 38,5 cm² | — |
| P03 | L1 | E | Panjang busur, r = 21 cm, θ = 60° | 22 cm | — |
| P04 | L1 | E | Luas juring, r = 21 cm, θ = 60° | 231 cm² | — |
| P05 | L1 | E | Panjang busur, r = 10 cm, θ = 36° (π = 3,14) | 6,28 cm | — |
| P06 | L1 | E | Luas juring, r = 10 cm, θ = 180° (π = 3,14) | 157 cm² | — |
| P07 | L2 | F, E | Pizza berdiameter 28 cm dipotong 8 sama besar. Luas satu potong? | 77 cm² | Personal |
| P08 | L2 | F, E | Jarum menit jam panjangnya 7 cm. Berapa jarak yang ditempuh ujung jarum selama 20 menit? | 14,67 cm | Personal |
| P09 | L2 | F, E | Penyiram taman menjangkau 7 m dan berputar 270°. Berapa luas rumput yang tersiram? | 115,5 m² | Pekerjaan |
| P10 | L2 | F, E | Bianglala berdiameter 42 m memiliki 12 kabin berjarak sama. Berapa jarak antarkabin di sepanjang lingkaran? | 11 m | Sosial |
| P11 | L3 | E | Panjang busur 22 cm, r = 14 cm. Sudut pusat? | 90° | — |
| P12 | L3 | E | Luas juring 77 cm², θ = 45°. Jari-jari? | 14 cm | — |
| P13 | L3 | E | Panjang busur 44 cm, θ = 120°. Jari-jari? | 21 cm | — |
| P14 | L3 | F, E | Keliling juring dengan r = 14 cm, θ = 90° | 50 cm | — |
| P15 | L4 | F, E, I | Taman berbentuk juring, r = 14 m, θ = 90°. Pagar Rp25.000 per meter. Biaya memagari seluruh tepi? Apakah Rp1.000.000 cukup? | Rp1.250.000; tidak cukup | Sosial |
| P16 | L4 | F, E, I | Pizza A (d = 28 cm) dipotong 8 sama besar; pizza B (d = 21 cm) dipotong 6 sama besar. Potongan mana yang lebih luas? | A (77 cm² > 57,75 cm²) | Personal |
| P17 | L4 | I | Dina berkata: "Untuk r = 7 cm, busur 180° panjangnya sama dengan diameter." Benarkah? Jelaskan. | Tidak. Busur 180° = 22 cm, diameter = 14 cm | Ilmiah |
| P18 | L4 | F, E, I | Kue bolu bundar berdiameter 20 cm. Ani ingin potongan berluas minimal 30 cm². Apakah potongan bersudut 36° cukup? | Ya, 31,4 cm² ≥ 30 | Personal |

### Petunjuk 3 tingkat per soal (F10, GL03)

Tingkat 1 = **isyarat** (mengarahkan perhatian) · Tingkat 2 = **strategi** (rumus/rencana) · Tingkat 3 = **langkah
parsial** (tidak memberi jawaban akhir).

| ID | Petunjuk 1 | Petunjuk 2 | Petunjuk 3 |
|---|---|---|---|
| P01 | Yang ditanya garis atau daerah? | Busur → θ/360° × 2πr | θ/360 = ¼; keliling = 44 cm; ¼ × 44 = … |
| P02 | Yang ditanya garis atau daerah? | Juring → θ/360° × πr² | ¼ × luas lingkaran (154 cm²) = … |
| P03 | 60° itu berapa bagian dari 360°? | Panjang busur = ⅙ × keliling | Keliling = 2 × 22/7 × 21 = 132 cm; ⅙ × 132 = … |
| P04 | 60° = ⅙ lingkaran | Luas juring = ⅙ × luas lingkaran | Luas = 22/7 × 21 × 21 = 1386 cm²; ⅙ × 1386 = … |
| P05 | r = 10 bukan kelipatan 7 → π = 3,14 | 36/360 = 1/10 | Keliling = 62,8 cm; 1/10 × 62,8 = … |
| P06 | 180° = setengah lingkaran | Luas juring = ½ × πr² | Luas = 3,14 × 100 = 314; ½ × 314 = … |
| P07 | Potongan pizza itu busur atau juring? Diameter 28 → r = ? | 8 potong sama besar → θ = 360/8 = 45° | Luas pizza = 22/7 × 14 × 14 = 616; ⅛ × 616 = … |
| P08 | Ujung jarum bergerak di sepanjang… (busur!) | 60 menit = 360°, jadi 20 menit = …° | 20 menit = 120° = ⅓; keliling = 44 cm; ⅓ × 44 = … |
| P09 | Daerah tersiram itu busur atau juring? | 270° = ¾ lingkaran | Luas lingkaran r = 7 m = 154 m²; ¾ × 154 = … |
| P10 | Jarak di sepanjang lingkaran = panjang busur | 12 kabin → θ = 360/12 = 30° → 1/12 keliling | Keliling = 22/7 × 42 = 132 m; 132/12 = … |
| P11 | Panjang busur bagian dari… (keliling) | θ/360 = panjang busur ÷ keliling | Keliling = 88; 22/88 = ¼; ¼ × 360° = … |
| P12 | 45° = ⅛ lingkaran | Luas lingkaran = 8 × 77 | 616 = 22/7 × r² → r² = 196 → r = … |
| P13 | 120° = ⅓ lingkaran | Keliling = 3 × 44 = 132 | 132 = 2 × 22/7 × r → r = 132 × 7 / 44 = … |
| P14 | Tepi juring terdiri dari apa saja? | Keliling juring = r + r + panjang busur | Panjang busur = 22; 14 + 14 + 22 = … |
| P15 | Pagar ada di seluruh tepi → keliling juring | Keliling juring × harga per meter | Keliling = 50 m; 50 × 25.000 = …; bandingkan dengan 1.000.000 |
| P16 | Bandingkan luas satu potong masing-masing | Pizza A: r = 14, θ = 45°; pizza B: r = 10,5, θ = 60° | A = ⅛ × 616; B = ⅙ × 346,5; bandingkan |
| P17 | Hitung keduanya lalu bandingkan | Busur 180° = ½ × keliling | ½ × 44 = 22; diameter = 14; sama? |
| P18 | 36° = berapa bagian? r = ? | Luas juring = 1/10 × 3,14 × 10² | 1/10 × 314 = …; bandingkan dengan 30 |

### Umpan balik miskonsepsi (dipicu oleh jawaban tertentu)

| Pola jawaban | Diagnosis | Umpan balik |
|---|---|---|
| Jawaban busur = nilai luas juring (mis. P01 → 38,5) | Tertukar rumus (IL01) | "Itu luas juring. Yang ditanya panjang busur → pakai keliling." |
| Jawaban juring = nilai busur (P02 → 11) | Tertukar rumus | "Itu panjang busur. Juring adalah daerah → pakai luas." |
| Lupa θ/360 (P01 → 44) | Lupa pecahan sudut | "Itu keliling seluruh lingkaran. Busurmu hanya ¼-nya." |
| Pakai d sebagai r (P07 → 308) | Prasyarat d/r (IL03) | "Periksa: diameter 28, jari-jarinya berapa?" |
| P14 hanya busur (→ 22) | Salah tafsir konteks | "Tepi juring juga punya dua sisi lurus." |
| P08 θ = 20° | Salah konversi waktu-sudut | "20 menit bukan 20°. Satu jam = 360°." |

---

## 5. Prompt refleksi "Jelaskan ke Teman" (F11, GL04)

| ID | Muncul setelah | Pertanyaan | Pilihan (jawaban benar ditandai *) |
|---|---|---|---|
| SE1 | WE1 | Kenapa panjang busur pakai 2πr? | *Busur bagian dari keliling · Karena hasilnya lebih kecil · Karena r = 14 |
| SE2 | WE2 | Kenapa satuan luas juring cm²? | *Juring adalah daerah · Karena dikali 2 · Kebetulan saja |
| SE3 | P07 | Kenapa θ = 45° untuk 8 potong? | *360° dibagi 8 · 8 × 45 = 360 tidak penting · Karena pizza bundar |
| SE4 | WE6/P14 | Kenapa pagar bukan hanya panjang busur? | *Tepi taman juga punya dua jari-jari · Busur selalu lebih pendek · Pagar harus lurus |
| SE5 | Akhir modul | Tulis dengan kata-katamu: apa beda busur dan juring? | Isian bebas, dinilai rubrik 0–2 |

Rubrik isian: **2** = menyebut busur bagian keliling/garis **dan** juring bagian luas/daerah; **1** = salah satu benar;
**0** = tidak relevan.

## 6. Prompt Cek Kewajaran (F09, GL02)

Template: "Sudut {θ}° = {pecahan} lingkaran. {Keliling|Luas} lingkaran = {nilai}. {pecahan} dari {nilai} ≈ {estimasi}.
Apakah jawabanmu {jawaban} {satuan} masuk akal?" + cek satuan "Yang ditanya {panjang|luas} → satuan {cm|cm²}".

## 7. Contoh representasi JSON (P07)

```json
{
  "id": "P07",
  "level": "L2",
  "mlProcess": ["formulate", "employ"],
  "clTags": ["IL04", "EL05", "GL05"],
  "context": "personal",
  "scene": "pizza",
  "stem": [
    "Sebuah pizza berdiameter 28 cm.",
    "Pizza dipotong menjadi 8 bagian sama besar.",
    "Berapa luas satu potong pizza?"
  ],
  "given": { "d": 28, "pieces": 8 },
  "asked": "sectorArea",
  "answer": { "value": 77, "unit": "cm2", "tolerance": 0.01 },
  "pi": "22/7",
  "steps": ["asked", "given", "fraction", "formula", "compute", "check"],
  "hints": [
    "Potongan pizza itu busur atau juring? Diameter 28 → r = ?",
    "8 potong sama besar → θ = 360/8 = 45°",
    "Luas pizza = 22/7 × 14 × 14 = 616; ⅛ × 616 = …"
  ],
  "misconceptions": [
    { "answer": 308, "feedback": "Periksa: diameter 28, jari-jarinya berapa?" },
    { "answer": 11, "feedback": "Itu panjang busur. Juring adalah daerah → pakai luas." }
  ],
  "selfExplain": "SE3"
}
```

## 8. Urutan penyajian (sequencing)

| Bagian | Item | Bantuan |
|---|---|---|
| Contoh | WE1, WE2 (+SE1, SE2) | Penuh |
| Terbimbing | P01, P02, P03, P04 | Step Solver + 3 petunjuk |
| Contoh | WE3, WE4, WE5 | Penuh |
| Terbimbing | P05, P06, P11 | Step Solver + petunjuk (pudar) |
| Mandiri | P12, P13, P14 | Tanpa Step Solver; petunjuk ≤ 1 (pudar) |
| Contoh literasi | WE6 (+SE4) | Penuh |
| Literasi | P07, P08, P09, P10 → P15, P16, P17, P18 | Tandai info + Cek Kewajaran; petunjuk tersedia, tercatat |
| Refleksi | SE5 | — |

Item P01–P18 **bukan** butir pretest/posttest; instrumen tes literasi disusun terpisah di [evaluation.md](evaluation.md).
