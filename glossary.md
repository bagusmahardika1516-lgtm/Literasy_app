# Glosarium — Istilah Baku

Tujuan: **satu istilah = satu makna = satu simbol = satu warna** di seluruh aplikasi, materi, dan dokumen.
Konsistensi istilah mengurangi beban extraneous (EL01) dan membantu siswa tidak menukar konsep (IL01).

## 1. Istilah inti

| Istilah | Definisi singkat (untuk siswa) | Simbol | Satuan | Warna semantik |
|---|---|---|---|---|
| **Lingkaran** | Kumpulan titik yang jaraknya sama dari titik pusat | — | — | Netral (garis abu tua) |
| **Titik pusat** | Titik tengah lingkaran | O | — | Netral |
| **Jari-jari** | Jarak dari titik pusat ke lingkaran | r | cm, m | Netral (garis putus-putus abu tua) |
| **Diameter** | Garis melalui titik pusat yang menghubungkan dua titik pada lingkaran; d = 2r | d | cm, m | Netral |
| **Keliling lingkaran** | Panjang seluruh lengkungan lingkaran; K = 2πr = πd | K | cm, m | Oranye pucat (seluruh lingkaran, hanya di modul prasyarat) |
| **Luas lingkaran** | Besar daerah di dalam lingkaran; L = πr² | L | cm², m² | Biru pucat (seluruh daerah, hanya di modul prasyarat) |
| **Sudut pusat** | Sudut yang titik sudutnya di titik pusat, diapit dua jari-jari | θ (dibaca "teta"); di layar siswa ditulis "sudut pusat" | derajat (°) | **Hijau** `#009E73` |
| **Busur** | **Bagian dari keliling** lingkaran (garis lengkung) yang diapit sudut pusat | — | — | **Oranye** `#E69F00` |
| **Panjang busur** | Ukuran panjang busur; = (θ/360°) × 2πr | — | **cm, m (satuan panjang)** | **Oranye** |
| **Juring** | **Bagian dari daerah** lingkaran yang dibatasi dua jari-jari dan satu busur (seperti potongan pizza) | — | — | **Biru** `#0072B2` |
| **Luas juring** | Ukuran luas juring; = (θ/360°) × πr² | — | **cm², m² (satuan luas)** | **Biru** |
| **Pecahan sudut** | Perbandingan sudut pusat dengan satu putaran penuh: θ/360° | — | tanpa satuan | Hijau |

### Kalimat kunci pembeda (dipakai berulang di aplikasi)

> **Busur itu garis → panjang → pakai keliling → satuan cm.**
> **Juring itu daerah → luas → pakai luas lingkaran → satuan cm².**

## 2. Istilah pendukung (dikenalkan, tidak dihitung pada MVP)

| Istilah | Definisi | Catatan |
|---|---|---|
| Tali busur | Garis lurus yang menghubungkan dua titik pada lingkaran | Ditampilkan abu-abu bila perlu, **bukan** busur |
| Tembereng | Daerah antara busur dan tali busur | P2 (topik lanjutan); warna ungu tidak dipakai pada MVP |
| Apotema | Jarak terpendek titik pusat ke tali busur | Hanya di glosarium |
| Busur kecil / busur besar | Busur dengan sudut pusat < 180° / > 180° | Dipakai pada eksplorasi slider |
| Juring kecil / juring besar | Juring dengan sudut pusat < 180° / > 180° | Idem |
| Keliling juring | Panjang tepi juring = 2r + panjang busur | Dipakai pada soal literasi (pagar taman) |

## 3. Konstanta dan pembulatan

| Aturan | Isi |
|---|---|
| π = 22/7 | Dipakai bila r atau d kelipatan 7 |
| π = 3,14 | Dipakai pada nilai lain |
| Penulisan desimal | Koma (contoh 7,33). Aplikasi menerima titik maupun koma sebagai masukan |
| Pembulatan | 2 angka di belakang koma, kecuali hasil bulat |
| Satuan derajat | Selalu ditulis dengan simbol ° (90°) |

## 4. Kata yang tidak boleh dipakai bergantian

| Jangan tulis | Tulis |
|---|---|
| "keliling busur", "luas busur" | panjang busur |
| "panjang juring" | luas juring (atau keliling juring bila memang yang dimaksud tepi juring) |
| "lengkungan", "lekukan" | busur |
| "irisan", "potongan" (dalam teks matematis) | juring — boleh dipakai di konteks cerita: "potongan pizza berbentuk juring" |
| "radius", "jejari" | jari-jari |
| "sudut tengah" | sudut pusat |
| "rumus pertama/kedua" | rumus panjang busur / rumus luas juring |

## 5. Istilah teknis untuk tim (tidak tampil ke siswa)

| Istilah | Arti |
|---|---|
| IL / EL / GL | Intrinsic / Extraneous / Germane cognitive load |
| K | Kode konteks/prasyarat pada analisis wawancara |
| DS | Kode rekomendasi desain dari siswa |
| Worked example | Contoh soal yang langkahnya diuraikan lengkap |
| Completion problem | Soal dengan sebagian langkah sudah terisi |
| Fading | Pengurangan bantuan secara bertahap |
| Paas scale | Skala usaha mental 1–9 (Paas, 1992) |
| mlProcess | Proses literasi PISA: `formulate`, `employ`, `interpret` |
