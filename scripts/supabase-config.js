/**
 * ============================================================================
 * SUPABASE CONFIGURATION & CLIENT INITIALIZATION (VERCEL ENV READY)
 * Website Rating Pelayanan PLN ULP Karebosi
 * ============================================================================
 */

let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';
let supabaseClient = null;

function isSupabaseConfigured() {
    return SUPABASE_URL && 
           SUPABASE_URL.trim() !== '' &&
           SUPABASE_ANON_KEY && 
           SUPABASE_ANON_KEY.trim() !== '';
}

function initSupabase() {
    if (typeof window.supabase !== 'undefined' && isSupabaseConfigured()) {
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase Client berhasil terhubung.');
            updateSupabaseStatusUI(true, 'Sistem Terhubung');
            
            // Pemicu inisialisasi ulang data di admin jika fungsi fetchRatingsData terdefinisi
            if (typeof fetchRatingsData === 'function') {
                fetchRatingsData();
            }
        } catch (error) {
            console.error('❌ Gagal inisialisasi Supabase:', error);
            updateSupabaseStatusUI(false, 'Gagal terhubung ke Supabase');
        }
    } else {
        console.warn('⚠️ Supabase belum terhubung. Menunggu data konfigurasi atau masuk ke Mode Demo.');
        updateSupabaseStatusUI(false, 'Mode Demo / Simulasi');
    }
}

function updateSupabaseStatusUI(isReady, message) {
    const statusTextEl = document.getElementById('supaStatusText');
    const statusBadgeEl = document.getElementById('supaStatusDot');
    
    // Status UI untuk admin
    const adminTextEl = document.getElementById('adminDataStatusText');
    const adminDotEl = document.getElementById('adminDataStatusDot');
    
    if (statusTextEl) statusTextEl.textContent = message;
    if (statusBadgeEl) statusBadgeEl.style.backgroundColor = isReady ? '#10b981' : '#f59e0b';

    if (adminTextEl) adminTextEl.textContent = isReady ? 'Sistem Terhubung' : message;
    if (adminDotEl) {
        adminDotEl.className = adminDotEl.className.replace(/bg-\S+/g, '') + (isReady ? ' bg-emerald-500' : ' bg-amber-500');
    }
}

async function fetchConfig() {
    try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Gagal memuat file konfigurasi api');
        const config = await res.json();
        
        if (config.supabaseUrl && config.supabaseAnonKey) {
            SUPABASE_URL = config.supabaseUrl;
            SUPABASE_ANON_KEY = config.supabaseAnonKey;
            initSupabase();
        } else {
            console.warn('⚠️ Konfigurasi Supabase dari API kosong. Masuk ke mode demo.');
            initSupabase();
        }
    } catch (err) {
        console.error('Gagal mengambil config dari API serverless:', err);
        initSupabase();
    }
}

async function saveRatingData(payload) {
    console.log('📤 Processing rating payload via Controller:', payload);

    if (isSupabaseConfigured() && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('ratings')
                .insert([payload]);

            if (error) throw error;

            return {
                success: true,
                message: 'Penilaian Anda berhasil disimpan.',
                data: data
            };
        } catch (err) {
            return {
                success: false,
                message: 'Koneksi gagal: ' + (err.message || 'Terjadi kesalahan jaringan'),
                error: err
            };
        }
    } else {
        // Fallback / LocalStorage Simulation Mode
        const raw = localStorage.getItem('pln_ratings_demo');
        let localData = [];
        if (raw) {
            try { localData = JSON.parse(raw); } catch (e) { localData = []; }
        } else if (typeof SeedData !== 'undefined') {
            localData = SeedData.getSampleRatings();
        }

        localData.unshift({ ...payload, id: 'demo-' + Date.now() });
        localStorage.setItem('pln_ratings_demo', JSON.stringify(localData));

        await new Promise(resolve => setTimeout(resolve, 400));

        return {
            success: true,
            isDemo: true,
            message: 'Penilaian Anda berhasil disimpan secara lokal.',
            data: payload
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchConfig();
});
