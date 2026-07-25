# System Rating Pelayanan PLN (PT PLN Persero ULP Karebosi)

Aplikasi web dinamis **System Rating Pelayanan PLN ULP Karebosi** yang cepat, simpel, dan modern untuk mengumpulkan umpan balik pelanggan di loket CS, serta dilengkapi **Corporate Admin Panel (Sidebar Layout)** dengan otentikasi akun khusus dan proteksi anti-spam.

---

## ⚡ Fitur Utama & Clean URLs

- **Clean URLs (URL Tanpa Ekstensi `.html`)**:
  - Halaman Utama Pelanggan: `https://domain.com` (Menampilkan `index.html` tanpa muncul nama file di URL).
  - Portal Admin Rahasia: `https://domain.com/admin` (Menampilkan `admin.html` tanpa muncul nama file di URL).
  - Berkas `vercel.json` secara otomatis mengaktifkan `"cleanUrls": true`.

- **Customer Rating Portal (`index.html`)**:
  - Pilihan 5 Bintang tanpa border dengan animasi smooth.
  - Teks indikator rating tipografi murni & otentik (tanpa gelembung AI slop).
  - Pop-up modal pilihan emoji & animasi centang hijau dengan tombol *"Beri Rating Lagi"*.
  - Proteksi Anti-Spam (Honeypot + 5s Cooldown Limiter).
  - Halaman publik bersih tanpa tombol admin.

- **Corporate Admin Panel (`/admin`)**:
  - **Path Secret**: Diakses via path `/admin`.
  - **Login Portal Akun Khusus**: Proteksi kredensial khusus (`Username: admin` | `Password: pln123`).
  - **Sidebar Layout Corporate**: Menu Dashboard Overview, Data Feedback, Analytics, dan Export.
  - **Filter Rentang Waktu**: Tanggal Mulai, Tanggal Akhir, dan Preset.
  - **Ekspor XLSX (Excel)**: Pengunduhan laporan data masukan pelanggan ke berkas `.xlsx`.

---

## 🚀 Cara Menjalankan & Testing Lokal

1. **Jalankan Server Lokal**:
   ```bash
   python -m http.server 8000
   ```
2. **Buka Halaman Rating Pelanggan**:
   - URL: [http://localhost:8000/](http://localhost:8000/)
3. **Buka Portal Admin Khusus**:
   - URL: [http://localhost:8000/admin.html](http://localhost:8000/admin.html)
   - Login Kredensial:
     - **Username**: `admin`
     - **Password**: `pln123`

---

## ☁️ Deployment ke Vercel

1. Deploy repositori ini ke **Vercel**.
2. Vercel akan otomatis membaca `"cleanUrls": true` dan `rewrites` dari `vercel.json`.
3. URL produksi Anda akan tampil sangat bersih:
   - Form Rating Pelanggan: `https://namadomain.vercel.app`
   - Portal Admin: `https://namadomain.vercel.app/admin`