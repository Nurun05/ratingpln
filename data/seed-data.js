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
                deskripsi: 'Pelayanan sangat memuaskan, petugas CS ramah dan membantu proses pasang baru dengan cepat.',
                penilaian_pelayanan: 'Sangat Baik',
                unit_pelayanan: 'PLN ULP Karebosi',
                created_at: new Date(now - 3600000 * 2).toISOString()
            },
            {
                id: 'demo-102',
                rating_bintang: 4,
                keterangan_rating: 'Puas',
                deskripsi: 'Penanganan informasi permohonan tambah daya jelas dan petugas sangat sopan.',
                penilaian_pelayanan: 'Sangat Baik',
                unit_pelayanan: 'PLN ULP Karebosi',
                created_at: new Date(now - 3600000 * 18).toISOString()
            },
            {
                id: 'demo-103',
                rating_bintang: 3,
                keterangan_rating: 'Cukup Puas',
                deskripsi: 'Proses konsultasi baik, namun waktu antrean di jam istirahat perlu disesuaikan.',
                penilaian_pelayanan: 'Cukup Baik',
                unit_pelayanan: 'PLN ULP Karebosi',
                created_at: new Date(now - 3600000 * 48).toISOString()
            }
        ];
    }
};

window.SeedData = SeedData;
