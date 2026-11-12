# Wedding Invitation — Light Purple, Burgundy & Blush

Template undangan digital satu halaman dengan ilustrasi doodle (tanpa foto wajib), animasi scroll, countdown, Google Maps, RSVP, musik, ucapan & doa, amplop digital, daftar tamu personal, dan dashboard admin.

## Isi folder
- `index.html` — halaman undangan publik
- `styles.css` — desain responsif
- `config.js` — edit nama, tanggal, tempat, link maps, rekening, musik, dan konfigurasi Supabase
- `app.js` — countdown, RSVP, ucapan, salin nomor rekening, kalender
- `admin.html`, `admin.css`, `admin.js` — dashboard, filter, ekspor CSV, daftar tamu, link undangan personal
- `supabase-schema.sql` — tabel dan kebijakan akses database

## 1. Personalisasi
Edit `config.js`. Ganti nama pasangan, tanggal, waktu, venue, alamat, Google Maps URL, detail rekening/e-wallet. Untuk musik, isi `musicUrl` dengan URL MP3 yang kamu miliki hak penggunaannya. Musik hanya mulai setelah tamu menekan tombol musik.

Tanggal harus format ISO dengan zona waktu, contoh `2027-06-20T08:00:00+07:00`. Tanggal dan jam pada label diedit di `dateLabel`, `akadTime`, dan `resepsiTime`.

## Catatan perbaikan data tidak berubah
- Pastikan `config.js`, `index.html`, dan `app.js` yang diedit berasal dari **folder hasil ekstrak yang sama**. Jangan mengedit file di dalam ZIP atau salinan folder lain.
- Simpan `config.js` dengan `Ctrl + S`, lalu di Chrome tekan `Ctrl + Shift + R`.
- Versi ini memakai URL relatif `./config.js` dan `./app.js` dengan penanda versi untuk membantu menghindari cache lama.
- Buka DevTools (`F12`) > Console. Versi ini menampilkan `[Undangan] Config aktif:`. Jika yang muncul masih nilai lama, browser sedang membuka folder/server yang berbeda atau file belum tersimpan.
- Uji sederhana: ubah `bride` menjadi nama unik, simpan, lalu refresh keras. Nama itu harus muncul di cover dan bagian penutup.

## 2. Preview di komputer
Jangan hanya membuka file langsung jika ingin mengetes semua fungsi. Jalankan server lokal di folder ini, misalnya:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000`.

Tanpa Supabase, halaman RSVP dan ucapan memakai localStorage browser untuk demo. Data demo hanya ada di browser/perangkat itu, bukan database online. Dashboard demo terbuka tanpa autentikasi dan **tidak aman untuk data nyata**.

## 3. Aktifkan database online + login admin
1. Buat project di https://supabase.com/.
2. Buka SQL Editor dan jalankan isi `supabase-schema.sql`.
3. Di Authentication > Users, buat user admin dengan email dan password kuat.
4. Di Project Settings > API, salin Project URL dan anon/public key.
5. Isi `supabaseUrl` dan `supabaseAnonKey` di `config.js`. **Jangan pernah taruh service_role key di frontend.**
6. Deploy seluruh folder ini ke hosting static seperti Netlify, Vercel, atau GitHub Pages.
7. Buka `admin.html` dari domain yang sama dan login dengan user admin.

Catatan keamanan: SQL contoh mengizinkan role `authenticated` mengelola tabel. Pada project yang memiliki lebih dari satu akun terdaftar, batasi policy admin berdasarkan user ID/email admin khusus sebelum produksi. Matikan public sign-up di Supabase Auth jika tidak diperlukan. Tabel `guests` tidak dapat dibaca oleh pengunjung anonim.

## 4. Hosting gratis
- **Netlify**: buat akun, lalu drag-and-drop folder situs atau hubungkan repository Git.
- **Vercel**: import repository dan deploy sebagai static site.
- **GitHub Pages**: unggah file ke repository publik dan aktifkan Pages.

Gunakan HTTPS dan uji RSVP/admin setelah konfigurasi Supabase. Fitur link personal memakai pola `/?to=Nama%20Tamu`; dashboard membuat link berdasarkan URL situs yang sedang digunakan.

## 5. Yang masih perlu kamu isi
- Nama lengkap kedua mempelai dan orang tua
- Tanggal, jam akad/resepsi, venue, alamat, link Maps
- URL musik MP3
- Nama bank, nomor rekening, nama penerima, e-wallet
- Supabase URL + anon key agar RSVP/ucapan/dashboard benar-benar online

Desain dan struktur ini merupakan starter template yang bisa dikustomisasi lebih lanjut.
