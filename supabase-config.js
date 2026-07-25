/**
 * ============================================================================
 * SUPABASE CONFIGURATION & CLIENT INITIALIZATION
 * Website Rating Pelayanan PLN
 * ============================================================================
 * 
 * Silakan ganti SUPABASE_URL dan SUPABASE_ANON_KEY di bawah ini dengan
 * kredensial dari project Supabase Anda (Project Settings -> API).
 * 
 * Panduan lengkap dapat dibaca pada berkas: PANDUAN_SUPABASE.md
 */

const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';

let supabaseClient = null;

/**
 * Memeriksa apakah Kredensial Supabase sudah diisi dengan benar
 */
function isSupabaseConfigured() {
    return SUPABASE_URL && 
           !SUPABASE_URL.includes('YOUR-PROJECT-REF') && 
           SUPABASE_ANON_KEY && 
           !SUPABASE_ANON_KEY.includes('YOUR-SUPABASE-ANON-KEY');
}

/**
 * Inisialisasi Supabase SDK
 */
function initSupabase() {
    if (typeof window.supabase !== 'undefined' && isSupabaseConfigured()) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase Client berhasil terhubung.');
            updateSupabaseStatusUI(true, 'Terhubung ke Database Supabase');
        } catch (error) {
            console.error('❌ Gagal inisialisasi Supabase:', error);
            updateSupabaseStatusUI(false, 'Gagal terhubung ke Supabase');
        }
    } else {
        console.warn('⚠️ Supabase URL atau Anon Key belum dikonfigurasi. Menggunakan Mode Simulasi Lokal.');
        updateSupabaseStatusUI(false, 'Mode Demo / Simulasi (Supabase Belum Dikonfigurasi)');
    }
}

/**
 * Update indikator status Supabase pada footer / UI
 */
function updateSupabaseStatusUI(isReady, message) {
    const statusTextEl = document.getElementById('supaStatusText');
    const statusBadgeEl = document.getElementById('supaStatusDot');
    
    if (statusTextEl) {
        statusTextEl.textContent = message;
    }
    if (statusBadgeEl) {
        statusBadgeEl.style.backgroundColor = isReady ? '#22c55e' : '#f59e0b';
    }
}

/**
 * Mengirim data rating ke Supabase
 * @param {Object} ratingData Payload berisi rating_bintang, keterangan_rating, deskripsi, penilaian_pelayanan
 * @returns {Promise<{success: boolean, message: string, data?: any}>}
 */
async function saveRatingData(ratingData) {
    // Sisipkan timestamp waktu pengiriman (UTC ISO string)
    const payload = {
        rating_bintang: ratingData.rating_bintang,
        keterangan_rating: ratingData.keterangan_rating,
        deskripsi: ratingData.deskripsi,
        penilaian_pelayanan: ratingData.penilaian_pelayanan,
        created_at: new Date().toISOString()
    };

    console.log('📤 Mengirim data rating:', payload);

    if (isSupabaseConfigured() && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('ratings')
                .insert([payload]);

            if (error) {
                console.error('❌ Supabase Insert Error:', error);
                throw error;
            }

            console.log('✅ Data berhasil tersimpan di Supabase:', data);
            return {
                success: true,
                message: 'Data rating berhasil disimpan di Database Supabase!',
                data: data
            };
        } catch (err) {
            return {
                success: false,
                message: 'Gagal menyimpan ke Supabase: ' + (err.message || 'Terjadi kesalahan jaringan'),
                error: err
            };
        }
    } else {
        // Fallback / Simulation Mode: Simpan ke localStorage agar bisa diuji di browser
        const localData = JSON.parse(localStorage.getItem('pln_ratings_demo') || '[]');
        localData.push({ ...payload, id: 'demo-' + Date.now() });
        localStorage.setItem('pln_ratings_demo', JSON.stringify(localData));

        // Delay 500ms simulasi network request
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            success: true,
            isDemo: true,
            message: 'Rating tersimpan dalam Mode Simulasi Lokal (Silakan masukkan Kredensial Supabase Anda untuk koneksi nyata).',
            data: payload
        };
    }
}

// Inisialisasi saat dokumen selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
