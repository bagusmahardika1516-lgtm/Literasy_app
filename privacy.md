# Privacy — Etika dan Perlindungan Data Siswa

Pengguna aplikasi adalah anak di bawah umur. Prinsip: **kumpulkan sesedikit mungkin, pseudonimkan, dan minta izin.**
Mengacu pada pedoman etika wawancara (bagian C) dan prinsip UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.

## 1. Persetujuan

| Pihak | Bentuk | Waktu |
|---|---|---|
| Sekolah | Surat izin penelitian | Sebelum uji coba |
| Orang tua/wali | Formulir persetujuan tertulis (tujuan, data yang dikumpulkan, hak menarik diri) | Sebelum siswa memakai aplikasi |
| Siswa | Persetujuan lisan/tertulis dengan bahasa sederhana; partisipasi sukarela, dapat berhenti kapan pun tanpa konsekuensi nilai | Sebelum mulai |

Wawancara: rekaman hanya dengan izin; transkrip memakai kode informan.

## 2. Data yang dikumpulkan

| Data | Dikumpulkan? | Alasan |
|---|---|---|
| Kode siswa (S01) & kode kelas | Ya | Mengaitkan data pre/post dan log |
| Username pseudonim & hash password (Argon2id) | Ya | Masuk aman (ADR-022). Password asli tidak pernah disimpan |
| Sesi login (hash token, waktu, user-agent ≤ 64 karakter) | Ya | Satu perangkat aktif & pencabutan sesi |
| Jawaban, langkah, petunjuk, durasi | Ya | Evaluasi fitur & pembelajaran |
| Skala usaha, kuesioner, refleksi | Ya | Pengukuran beban kognitif & pemahaman |
| Kelas perangkat (low/mid/high) & versi aplikasi | Ya | Analisis performa |
| Nama, email, nomor HP, foto, suara | **Tidak** | — |
| Lokasi, kontak, ID iklan, IMEI/ID perangkat | **Tidak** | — |
| Email guru (akun rekap) | Ya, hanya di Supabase Auth | Login rekap guru (F15); tidak dicampur dengan data siswa |

Daftar padanan kode ↔ nama disimpan **hanya** oleh peneliti, terpisah (dokumen offline terkunci), tidak di repositori,
aplikasi, Supabase, maupun prompt AI.

## 3. Penyimpanan

| Lokasi | Isi | Perlindungan |
|---|---|---|
| HP siswa (IndexedDB browser) | Buffer progres & log milik siswa sendiri | Isolasi origin browser; dihapus saat keluar akun |
| Vercel | Hanya file aplikasi statis | Tidak menyimpan data siswa; analytics Vercel dimatikan |
| Supabase | Data pseudonim | RLS anon insert-only; peneliti membaca via role terpisah; region server dicatat |
| Laptop peneliti | CSV ekspor | Folder terenkripsi; tidak dibagikan publik |

## 4. Retensi dan penghapusan
- Data penelitian disimpan selama masa penelitian + maksimal 2 tahun untuk keperluan publikasi, lalu dihapus.
- Siswa/orang tua dapat meminta penghapusan data kode tertentu kapan saja melalui guru/peneliti.
- Di aplikasi: tombol **Keluar** mencabut sesi dan menghapus token di HP ini (penting karena HP dapat dipinjam bergantian
  di kelas). Catatan yang belum terkirim tetap tersimpan per siswa dan hanya terkirim atas nama siswa itu setelah
  ia masuk lagi; siswa lain di HP yang sama tidak bisa melihat atau mengirimnya.
- Guru hanya melihat rekap kelasnya sendiri dan tidak dapat mengunduh data mentah.

## 5. Larangan untuk tim & AI agent
- Tidak menulis nama siswa, foto wawancara, atau kutipan yang dapat mengidentifikasi di kode, commit, issue, prompt AI,
  atau dokumen publik.
- Foto dokumentasi wawancara tidak disimpan di repositori.
- Kutipan wawancara di [analysis.md](analysis.md) hanya memakai kode informan.

## 6. Publikasi hasil
Hasil dilaporkan agregat atau dengan kode informan; tidak menampilkan wajah siswa tanpa izin tertulis tambahan.

## 7. Insiden
Bila terjadi kebocoran: hentikan sinkronisasi, cabut kunci Supabase, beri tahu sekolah & orang tua, catat di
[decision-log.md](decision-log.md).
