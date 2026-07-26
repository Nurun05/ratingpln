# Panduan Implementasi Sistem Rating PLN ULP Karebosi

Panduan ini dipakai untuk implementasi dari awal sampai sistem siap dipakai di lapangan.

## Ringkasan Alur
- Pelanggan mengirim rating dari halaman publik.
- Data masuk ke Supabase.
- Data otomatis di-*sync* ke Google Spreadsheet via Google Apps Script.
- Admin membuka spreadsheet langsung untuk melihat data terbaru.
- Laporan Excel tetap bisa diunduh dari panel admin.

---

## 1) Siapkan Supabase

### 1.1 Buat project
1. Buka Supabase.
2. Buat project baru.
3. Simpan **Project URL** dan **anon/public key**.

### 1.2 Buat tabel `ratings`
Jalankan SQL ini di SQL Editor:

```sql
create table public.ratings (
  id uuid default gen_random_uuid() primary key,
  rating_bintang int not null check (rating_bintang between 1 and 5),
  keterangan_rating text not null,
  deskripsi text not null,
  penilaian_pelayanan text not null,
  unit_pelayanan text default 'PLN ULP Karebosi',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.ratings enable row level security;

create policy "allow insert for anon and authenticated"
on public.ratings
for insert
to anon, authenticated
with check (true);

create policy "allow select for anon and authenticated"
on public.ratings
for select
to anon, authenticated
using (true);

alter publication supabase_realtime add table public.ratings;
```

### 1.3 Cek hasil
- Pastikan tabel `ratings` ada.
- Pastikan RLS aktif.
- Pastikan realtime publikasi sudah aktif.

---

## 2) Set Environment Variable di Vercel

Tambahkan variable berikut di Vercel:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GAS_WEBAPP_URL`

Kalau pakai prefix `NEXT_PUBLIC_...`, isi juga jika memang dipakai di project Anda.

Setelah itu lakukan **Redeploy**.

---

## 3) Pasang Google Apps Script di Spreadsheet

### 3.1 Buka spreadsheet target
Gunakan spreadsheet yang sudah Anda siapkan untuk laporan.

### 3.2 Tempel kode GAS
Buka:
- **Extensions** → **Apps Script**

Lalu tempel isi file `GAS_SCRIPT.js` terbaru dari project ini.

### 3.3 Fungsi yang wajib ada
Kode GAS terbaru harus:
- menerima data dari `doPost(e)`
- menyimpan data ke sheet **Laporan Gabungan**
- membuat sheet bulanan dengan format **`MM-YYYY`**
- mencegah duplikasi berdasarkan `id`

Contoh nama sheet bulanan:
- `07-2026`
- `08-2026`

### 3.4 Deploy ulang Web App
Ini bagian penting.
1. Klik **Deploy**
2. Pilih **Manage deployments**
3. Klik **Edit** pada deployment aktif
4. Pilih **New version**
5. Klik **Deploy** lagi

Kalau tidak redeploy, perubahan kode GAS tidak akan dipakai.

---

## 4) Atur Spreadsheet

### 4.1 Tab yang dipakai
Di spreadsheet akan ada:
- **Laporan Rating**
- **Laporan Gabungan**
- Sheet bulanan, misalnya `07-2026`

### 4.2 Cara lihat data harian/mingguan
Karena sheet utama sekarang bulanan, sorting harian/mingguan sebaiknya memakai filter bawaan Google Sheets:
- Filter pada kolom tanggal
- Sort A-Z / Z-A
- Filter rentang tanggal
- Pivot table kalau perlu rekap

### 4.3 Hapus sheet lama yang tidak dipakai
Kalau masih ada sheet model harian seperti `2026-07-26`, hapus sheet itu supaya tidak membingungkan.

---

## 5) Cara Kerja Admin

### Mode yang dipakai sekarang
- **Tidak ada sinkronisasi manual**
- Data sudah masuk otomatis ke spreadsheet saat rating dikirim
- Admin cukup klik **Buka Spreadsheet** untuk melihat data terbaru

### Unduh laporan
- Tetap ada tombol download Excel
- File unduhan tetap bisa dipakai untuk backup lokal

---

## 6) Alur Uji Coba

### 6.1 Uji dari halaman publik
1. Buka halaman rating.
2. Isi bintang.
3. Isi deskripsi.
4. Kirim.
5. Pastikan muncul pesan sukses.

### 6.2 Uji ke Supabase
- Buka tabel `ratings`.
- Pastikan data baru muncul.

### 6.3 Uji ke Google Sheets
- Buka spreadsheet.
- Pastikan data baru masuk ke:
  - `Laporan Gabungan`
  - sheet bulanan `MM-YYYY`

### 6.4 Uji admin
- Buka panel admin.
- Klik **Buka Spreadsheet**.
- Pastikan link membuka spreadsheet yang benar.

---

## 7) Kalau Data Masih Masuk ke Sheet Tanggal
Kalau masih muncul sheet seperti `2026-07-26`, lakukan ini:
1. Pastikan kode `GAS_SCRIPT.js` yang ditempel benar-benar versi terbaru.
2. Pastikan deployment GAS sudah **New Version**.
3. Hapus sheet lama harian secara manual.
4. Kirim data baru untuk tes.

---

## 8) Checklist Akhir
- [ ] Tabel Supabase sudah ada
- [ ] RLS aktif
- [ ] Realtime aktif
- [ ] Vercel env sudah diisi
- [ ] Vercel sudah redeploy
- [ ] GAS sudah ditempel
- [ ] GAS sudah di-deploy ulang
- [ ] Spreadsheet memakai sheet bulanan `MM-YYYY`
- [ ] Sheet harian lama sudah dihapus
- [ ] Admin memakai tombol **Buka Spreadsheet**

---

## 9) Catatan Penting
- Jangan pakai tombol sinkronisasi manual kalau auto-sync sudah aktif.
- Jangan pakai sheet harian untuk laporan utama spreadsheet.
- Untuk admin, cukup gunakan filter bawaan Google Sheets bila perlu sortir harian atau mingguan.
- Jika ada perubahan kode GAS, selalu deploy ulang versi baru.
