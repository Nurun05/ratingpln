# 📖 Dokumentasi Lengkap & Panduan Sistem Rating PLN ULP Karebosi

Panduan ini disusun dalam bahasa yang sederhana dan ramah untuk pemula agar mudah dipahami oleh siapa saja, baik staf teknis, administrator, maupun manajemen.

---

## 💡 1. Analogi & Alur Kerja Sistem (How It Works)

Bayangkan sistem ini seperti **restoran modern**:
- 🌐 **Vercel** adalah **Gedung Restoran** tempat pengunjung datang.
- 📦 **GitHub** adalah **Gudang Resep** (tempat menyimpan seluruh kode pembuatan website).
- 🗄️ **Supabase** adalah **Buku Catatan Utama / Brankas** tempat menyimpan semua ulasan secara aman dan cepat secara *realtime*.
- 📊 **Google Sheets & Apps Script (GAS)** adalah **Papan Rekapitulasi Excel** di kantor manajemen untuk melihat laporan gabungan & bulanan otomatis.

```
┌─────────────────┐       (1) Akses Web       ┌────────────────────────┐
│  Pelanggan Loket│ ────────────────────────> │   Vercel Hosting Web   │
│   (index.html)  │                           │(https://domain.com)    │
└────────┬────────┘                           └────────────────────────┘
         │
         │ (2) Kirim Rating
         ├──────────────────────────────────────────┐
         │                                          │
         v (3a) Simpan Langsung                     v (3b) Auto-Sync (Background)
┌─────────────────────────┐                ┌────────────────────────┐
│    Supabase Database    │                │  Google Apps Script    │
│    (Tabel 'ratings')    │                │  (GAS Web App Endpoint)│
└────────┬────────────────┘                └────────┬───────────────┘
         │                                          │
         │ (4) Update Realtime                      v (5) Simpan otomatis
┌────────v────────────────┐                ┌────────────────────────┐
│  Admin Panel (/admin)   │                │   Google Spreadsheet   │
│  (Petugas CS Monitor)   │                │  (Laporan & Rekap MM)  │
└─────────────────────────┘                └────────────────────────┘
```

---

## 🏗️ 2. Peran Komponen Utama

### 🐙 A. GitHub (Gudang Kode & Penyimpan Versi)
- **Fungsi**: Tempat menyimpan seluruh file website (`index.html`, `admin.html`, JavaScript, CSS, dll.).
- **Manfaat**:
  - Membantu melacak setiap perubahan kode dari waktu ke waktu (*Version Control*).
  - Terhubung otomatis ke Vercel. Setiap kali Anda melakukan `git push` perubahan baru ke GitHub, Vercel akan otomatis meng-update website tanpa perlu upload manual.

### ⚡ B. Vercel (Penyedia Server / Hosting Publik)
- **Fungsi**: Server cloud yang membuat website Anda dapat dibuka oleh siapa saja di internet 24/7.
- **Manfaat**:
  - Menyediakan URL cepat dan aman (`https://namadomain.vercel.app`).
  - Mengatur **Clean URLs** (URL rapi tanpa `.html`, seperti `domain.com` dan `domain.com/admin`).
  - Menyediakan fitur *Serverless Function* (`/api/config`) untuk mendistribusikan konfigurasi secara aman.

### 🗄️ C. Supabase (Database Utama & Realtime)
- **Fungsi**: Database PostgreSQL berbasis cloud untuk menyimpan seluruh data ulasan pelanggan secara permanen.
- **Manfaat**:
  - **Sangat Cepat & Realtime**: Saat pelanggan mengirim rating di loket, data langsung muncul di layar Admin dalam hitungan milidetik tanpa perlu meng-refresh halaman.
  - Memiliki fitur *Row Level Security (RLS)* untuk menjaga keamanan data dari akses yang tidak sah.

### 📊 D. Google Apps Script (GAS) & Google Spreadsheet (Laporan Otomatis)
- **Fungsi**: Jembatan otomasi yang menerima data ulasan dari website lalu menuliskannya secara otomatis ke baris Google Spreadsheet.
- **Manfaat**:
  - Mengubah Google Spreadsheet menjadi sistem pencatat otomatis.
  - Otomatis membuat lembar kerja bulanan (format `MM-YYYY`, misal `07-2026`) dan `Laporan Gabungan`.
  - Otomatis mencegah data duplikat berdasarkan ID ulasan.

---

## 🛢️ 3. Kode SQL yang Dipakai di Supabase

Untuk menyiapkan database di Supabase, buka menu **SQL Editor** pada Dashboard Supabase Anda, lalu jalankan kode berikut:

```sql
-- 1. Buat Tabel 'ratings' untuk menyimpan ulasan pelanggan
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  rating_bintang int not null check (rating_bintang between 1 and 5),
  keterangan_rating text not null,
  deskripsi text not null,
  penilaian_pelayanan text not null,
  unit_pelayanan text default 'PLN ULP Karebosi',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Aktifkan Keamanan Tingkat Baris (Row Level Security / RLS)
alter table public.ratings enable row level security;

-- 3. Kebijakan 1: Izinkan publik/anonim untuk mengirim ulasan baru (INSERT)
create policy "allow insert for anon and authenticated"
on public.ratings
for insert
to anon, authenticated
with check (true);

-- 4. Kebijakan 2: Izinkan aplikasi untuk membaca data ulasan (SELECT)
create policy "allow select for anon and authenticated"
on public.ratings
for select
to anon, authenticated
using (true);

-- 5. Aktifkan Fitur Realtime Supabase pada Tabel 'ratings'
alter publication supabase_realtime add table public.ratings;
```

### 📝 Penjelasan Perintah SQL:
- `create table public.ratings`: Membuat wadah/tabel data ulasan dengan kolom ID, Jumlah Bintang, Keterangan, Deskripsi/Alasan, Emoji, Unit Pelayanan, dan Waktu Pembuatan.
- `enable row level security`: Mengaktifkan dinding keamanan agar tidak ada orang luar yang bisa mengubah/menghapus data secara ilegal.
- `create policy ... for insert`: Memberi izin kepada form rating pelanggan untuk memasukkan ulasan baru.
- `alter publication supabase_realtime`: Membuka jalur *live stream* agar panel admin bisa menerima update data secara instan.

---

## 🔑 4. Environment Variables (Variabel Lingkungan)

*Environment Variables* adalah "kunci rahasia" rahasia yang disimpan aman di server Vercel (bukan di dalam kode publik) agar tidak bocor.

### Variabel yang Diisi di Vercel Dashboard:
Buka **Vercel Dashboard** $\rightarrow$ Pilih Project Anda $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**, lalu tambahkan:

| Nama Variabel | Nilai / Isi Variabel | Keterangan |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Didapat dari Supabase: *Project Settings* $\rightarrow$ *API* |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Didapat dari Supabase: *Project Settings* $\rightarrow$ *API* (anon/public key) |
| `GAS_WEBAPP_URL` | `https://script.google.com/macros/s/AKfy.../exec` | URL Web App hasil deploy Google Apps Script |

---

## 📑 5. Penggunaan Google Apps Script (GAS) & Google Sheets

### 📍 Di Mana Cara Mengakses & Memasang GAS?
1. Buka Google Spreadsheet tempat Anda ingin menyimpan laporan ulasan.
2. Di bagian menu atas Google Sheets, klik **Extensions** (*Ekstensi*) $\rightarrow$ **Apps Script**.
3. Hapus semua kode bawaan di jendela editor, lalu **tempel (paste)** seluruh kode dari berkas [`GAS_SCRIPT.js`](file:///d:/Project/25Juli2026%20-%20Copy/GAS_SCRIPT.js).
4. Klik tombol **Save** (Gambar Disket).

### 🚀 Cara Deploy Web App GAS (Langkah Sangat Penting!):
1. Di pojok kanan atas layar Apps Script, klik tombol **Deploy** $\rightarrow$ pilih **New deployment**.
2. Klik ikon Roda Gigi (Select type) $\rightarrow$ pilih **Web app**.
3. Isi konfigurasi wajib berikut:
   - **Description**: `Versi 1 - Auto Sync PLN`
   - **Execute as**: **Me (Email Anda)**
   - **Who has access**: **Anyone** *(Siapa saja — Wajib diset 'Anyone' agar form website pelanggan bisa mengirim data tanpa perlu login Google)*.
4. Klik **Deploy**.
5. Klik **Authorize access** $\rightarrow$ Pilih akun Google Anda $\rightarrow$ Klik *Advanced* $\rightarrow$ Klik *Go to Script (unsafe)* $\rightarrow$ Klik **Allow**.
6. Salin **Web App URL** yang muncul (berakhiran `/exec`).
7. Paste URL tersebut ke variabel `GAS_WEBAPP_URL` di Vercel Environment Variables.

### 🔄 Cara Update Kode GAS Jika Ada Perubahan di Kemudian Hari:
Jika kode `GAS_SCRIPT.js` diubah, lakukan langkah pembaruan ini di Apps Script:
1. Klik **Deploy** $\rightarrow$ **Manage deployments**.
2. Klik ikon **Pensil (Edit)** di bagian kanan atas.
3. Pada bagian **Version**, pilih **New version**.
4. Klik **Deploy**.

---

## 👨‍💻 6. Cara Penggunaan oleh Petugas / Admin

1. **Halaman Publik Pelanggan**:
   - URL: `https://namadomain.vercel.app`
   - Digunakan oleh pelanggan di loket CS untuk mengisi ulasan.

2. **Portal Admin PLN**:
   - URL: `https://namadomain.vercel.app/admin`
   - Login Kredensial:
     - **Username**: `admin`
     - **Password**: `pln123`
   - Fitur Admin: Pemantauan KPI Realtime, Filter Rentang Waktu (Hari ini, 7 hari, 30 hari, custom), Pencarian Kata Kunci, Ekspor ke Excel (.xlsx), dan Tombol Pintas **Buka Spreadsheet**.
