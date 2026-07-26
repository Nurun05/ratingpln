# Panduan Implementasi Sistem Rating Pelayanan PLN ULP Karebosi

Dokumen ini berisi panduan langkah demi langkah untuk mengimplementasikan sistem rating pelayanan PLN ULP Karebosi dari awal hingga siap digunakan di lapangan.

---

## 📋 Daftar Isi
1. [Langkah 1: Setup Database Supabase](#langkah-1-setup-database-supabase)
2. [Langkah 2: Mengambil Kredensial API Supabase](#langkah-2-mengambil-kredensial-api-supabase)
3. [Langkah 3: Deployment ke Vercel](#langkah-3-deployment-ke-vercel)
4. [Langkah 4: Konfigurasi & Uji Coba Lapangan](#langkah-4-konfigurasi--uji-coba-lapangan)

---

## 🛠️ Langkah 1: Setup Database Supabase

1. Daftar atau masuk ke akun Anda di [Supabase](https://supabase.com/).
2. Buat proyek baru (*New Project*), isi nama proyek, atur password database, dan pilih region terdekat (disarankan **Singapore `ap-southeast-1`**).
3. Setelah proyek berhasil dibuat, buka menu **SQL Editor** (ikon `>_` di bilah navigasi kiri).
4. Klik **New Query**, lalu salin dan tempel perintah SQL di bawah ini:

```sql
-- 1. Membuat Tabel ratings
CREATE TABLE public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rating_bintang INT NOT NULL CHECK (rating_bintang BETWEEN 1 AND 5),
    keterangan_rating TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    penilaian_pelayanan TEXT NOT NULL CHECK (penilaian_pelayanan IN ('Sangat Baik', 'Cukup Baik', 'Buruk')),
    unit_pelayanan TEXT DEFAULT 'PLN ULP Karebosi',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 3. Membuat Policy agar Publik/Anon bisa mengirim ulasan (INSERT)
CREATE POLICY "Izinkan publik memasukkan rating" 
ON public.ratings 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 4. Membuat Policy agar data dapat dibaca untuk kebutuhan Admin Panel (SELECT)
CREATE POLICY "Izinkan membaca data rating" 
ON public.ratings 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 5. Mengaktifkan fitur Real-time untuk tabel ratings
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
```
5. Klik tombol **Run** (atau tekan `Ctrl + Enter`). Pastikan muncul pesan sukses berwarna hijau (`Success. No rows returned`).

---

## 🔑 Langkah 2: Mengambil Kredensial API Supabase

1. Masuk ke menu **Project Settings** (ikon roda gigi ⚙️ di pojok kiri bawah dashboard Supabase).
2. Pilih sub-menu **API**.
3. Salin dua nilai penting berikut untuk digunakan di Vercel:
   * **Project URL** (format: `https://xxxxxx.supabase.co`)
   * **anon / public key** (kunci panjang yang diawali dengan `eyJhbGci...`)

---

## ☁️ Langkah 3: Deployment ke Vercel

Sistem ini menggunakan *Serverless Function* untuk menyembunyikan API key Supabase agar aman dari modifikasi pihak luar.

### Metode A: Hubungkan Lewat Dashboard Vercel (Rekomendasi)
1. Masuk ke [Vercel](https://vercel.com/) dan buat proyek baru dengan menghubungkannya ke repositori GitHub Anda (`firgiawann/ratingpln` atau `Nurun05/ratingpln`).
2. Sebelum melakukan deploy, buka bagian **Environment Variables** di halaman konfigurasi proyek.
3. Tambahkan dua variabel berikut:
   * **`SUPABASE_URL`** &rarr; Isi dengan *Project URL* Supabase Anda.
   * **`SUPABASE_ANON_KEY`** &rarr; Isi dengan *anon / public key* Supabase Anda.
4. Klik **Deploy**.

### Metode B: Menggunakan Vercel CLI (Melalui Terminal)
1. Buka terminal di direktori proyek lokal Anda, lalu jalankan:
   ```bash
   vercel
   ```
2. Ikuti instruksi pembuatan proyek baru di layar.
3. Setelah proyek berhasil dibuat, tambahkan variabel lingkungan:
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   ```
4. Deploy ke production:
   ```bash
   vercel --prod
   ```

---

## 🎯 Langkah 4: Konfigurasi & Uji Coba Lapangan

Setelah status proyek di Vercel berubah menjadi **Ready** (aktif), lakukan pengujian berikut:

1. **Halaman Publik Pelanggan (`/`)**:
   * Buka URL utama proyek Anda (misal: `https://ratingpln.vercel.app`) di browser tablet/kios loket pelayanan.
   * Pastikan badge di pojok kanan atas menampilkan status **"Sistem Terhubung"** (titik hijau).
   * Lakukan uji coba pengiriman rating:
     * Pilih bintang &rarr; Tulis saran masukan &rarr; Klik kirim &rarr; Pilih kategori ulasan &rarr; Konfirmasi sukses.

2. **Panel Admin (`/admin`)**:
   * Buka halaman admin di URL `/admin` (misal: `https://ratingpln.vercel.app/admin`).
   * Masuk menggunakan kredensial berikut:
     * **Username**: `admin`
     * **Password**: `pln123`
   * Pastikan ulasan yang baru dikirim dari halaman depan langsung muncul secara instan di tabel tanpa perlu memuat ulang (*refresh*) halaman (Real-time).
   * Klik tab **Unduh Laporan** dan tekan tombol **Unduh Sekarang** untuk menguji ekspor laporan format `.xlsx` (Excel).
