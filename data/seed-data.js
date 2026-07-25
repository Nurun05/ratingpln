/**
 * ============================================================================
 * DATA SEED PROVIDER (DEMO LOCALSTORAGE FALLBACK DATA)
 * Initial sample rating records for PLN ULP Karebosi.
 * ============================================================================
 */

const SeedData = {
    getSampleRatings() {
        const now = Date.now();
        return [
            {
                id: 'demo-101',
                rating_bintang: 5,
                keterangan_rating: 'Sangat Puas',
                deskripsi: 'Proses pelayanan CS cepat dan petugas sangat membantu penjelasan pasang baru.',
                penilaian_pelayanan: 'Sangat Baik',
                unit_pelayanan: 'PLN ULP Karebosi',
                created_at: new Date(now - 3600000 * 2).toISOString()
            },
            {
                id: 'demo-102',
                rating_bintang: 4,
                keterangan_rating: 'Puas',
                deskripsi: 'Informasi untuk tambah daya sangat jelas dan mudah dipahami.',
                penilaian_pelayanan: 'Sangat Baik',
                unit_pelayanan: 'PLN ULP Karebosi',
                created_at: new Date(now - 3600000 * 18).toISOString()
            },
            {
                id: 'demo-103',
                rating_bintang: 3,
                keterangan_rating: 'Cukup Puas',
                deskripsi: 'Waktu antrean di loket perlu dipercepat saat jam istirahat siang.',
                penilaian_pelayanan: 'Cukup Baik',
                unit_pelayanan: 'PLN ULP Karebosi',
                created_at: new Date(now - 3600000 * 48).toISOString()
            }
        ];
    }
};

window.SeedData = SeedData;
