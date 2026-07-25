# Panduan Konfigurasi Supabase: Website Rating Pelayanan PLN

Dokumen ini berisi panduan langkah demi langkah untuk menyiapkan **Database Supabase**, membuat tabel `ratings`, mengatur **Row Level Security (RLS)**, hingga menghubungkan Kredensial API Supabase ke website rating PLN.

---

## 📋 Ringkasan Struktur Kolom Tabel `ratings`

| Nama Kolom | Tipe Data | Constraint | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | Otomatis dibuat (`gen_random_uuid()`) |
| `rating_bintang` | `integer` | NOT NULL, 1-5 | Rating bintang dari pengguna (1 - 5) |
| `keterangan_rating` | `text` | NOT NULL | Contoh: "Sangat Buruk", "Bagus Sekali" |
| `deskripsi` | `text` | NOT NULL | Alasan atau detail masukan dari pengguna |
| `penilaian_pelayanan` | `text` | NOT NULL | Hasil dari modal emoji ("Sangat Baik", "Cukup Baik", "Buruk") |
| `created_at` | `timestamptz` | NOT NULL | Tanggal & waktu pengiriman rating (`now()`) |

---

## 🚀 Langkah 1: Membuat Project Baru di Supabase

1. Buka situs [https://supabase.com](https://supabase.com) dan **Sign In** (bisa menggunakan akun GitHub).
2. Di halaman Dashboard, klik tombol **New Project**.
3. Isi formulir pembuatan project:
   - **Name**: `pln-rating-service` (atau nama lain sesuai kebutuhan).
   - **Database Password**: Buat password yang kuat dan simpan baik-baik.
   - **Region**: Pilih lokasi terdekat, misalnya **Singapore (`ap-southeast-1`)**.
   - **Pricing Plan**: Pilih **Free Plan**.
4. Klik **Create new project** dan tunggu 1–2 menit hingga infrastruktur database selesai disiapkan.

---

## 🗄️ Langkah 2: Membuat Tabel Database `ratings` & RLS (Cara Tercepat)

Cara tercepat dan paling akurat adalah menggunakan **SQL Editor** di Dashboard Supabase.

1. Di Dashboard Supabase, pilih menu **SQL Editor** di bilah navigasi sebelah kiri (ikon `>_`).
2. Klik **New Query**.
3. *Copy* (salin) seluruh script SQL berikut, lalu *paste* (tempel) di editor:

```sql
-- 1. Membuat Tabel ratings
CREATE TABLE public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rating_bintang INT NOT NULL CHECK (rating_bintang BETWEEN 1 AND 5),
    keterangan_rating TEXT NOT NULL,
    deskripsi TEXT NOT NULL,
    penilaian_pelayanan TEXT NOT NULL CHECK (penilaian_pelayanan IN ('Sangat Baik', 'Cukup Baik', 'Buruk')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 3. Membuat Policy agar Pengunjung Website (Publik/Anon) Bisa Mengirim Data (INSERT)
CREATE POLICY "Izinkan publik memasukkan rating" 
ON public.ratings 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 4. Membuat Policy agar Data Dapat Dibaca (SELECT) untuk Kebutuhan Dashboard Admin
CREATE POLICY "Izinkan membaca data rating" 
ON public.ratings 
FOR SELECT 
TO anon, authenticated 
USING (true);
```

4. Klik tombol **Run** (atau tombol ▶️ di pojok kanan bawah editor SQL).
5. Jika berhasil, akan muncul pesan hijau `Success. No rows returned`.

---

## 🔑 Langkah 3: Mengambil URL & Anon Key Supabase

1. Masuk ke menu **Project Settings** (ikon roda gigi ⚙️ di pojok kiri bawah Dashboard).
2. Pilih sub-menu **API**.
3. Di bagian **Project API Keys** & **Project URL**, Anda akan melihat dua informasi penting:
   - **Project URL**: Berformat `https://[ref-project-anda].supabase.co`
   - **anon / public key**: String acak panjang yang diawali dengan `eyJhbGci...`

---

## 🔗 Langkah 4: Menghubungkan Supabase ke Website

1. Buka berkas [`supabase-config.js`](file:///c:/Users/NurunNisa/OneDrive/Dokumen/TUGAS%20AKHIR/supabase-config.js) pada project website ini.
2. Cari baris berikut di bagian atas berkas:

```javascript
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';
```

3. Ganti `'https://YOUR-PROJECT-REF.supabase.co'` dengan **Project URL** milik Anda.
4. Ganti `'YOUR-SUPABASE-ANON-KEY'` dengan **anon / public key** milik Anda.
5. Simpan berkas (`Ctrl + S`).

---

## ✅ Langkah 5: Pengujian & Verifikasi Data

1. Buka berkas [`index.html`](file:///c:/Users/NurunNisa/OneDrive/Dokumen/TUGAS%20AKHIR/index.html) di browser Anda.
2. Perhatikan banner di bagian bawah halaman:
   - Jika indikator berwarna hijau `● Terhubung ke Database Supabase`, artinya koneksi berhasil!
3. Cobalah memberi rating:
   - Pilih bintang (1–5).
   - Klik **Lanjutkan Ke Deskripsi**.
   - Isi alasan/deskripsi rating (atau klik rekomendasi chip).
   - Klik **Kirim Rating**.
   - Pilih emoji pelayanan di pop-up modal ("Sangat Baik", "Cukup Baik", atau "Buruk").
4. Masuk kembali ke Dashboard Supabase -> menu **Table Editor** (ikon tabel 📊 di kiri) -> klik tabel `ratings`.
5. Anda akan melihat baris data baru beserta waktu pengirimannya secara real-time! 🎉
