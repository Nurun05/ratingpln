/**
 * ============================================================================
 * SUPABASE CONFIGURATION & CLIENT INITIALIZATION (VERCEL ENV READY)
 * Website Rating Pelayanan PLN ULP Karebosi
 * ============================================================================
 */

const SUPABASE_URL = (typeof window !== 'undefined' && (window.ENV_SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL)) 
    ? (window.ENV_SUPABASE_URL || window.NEXT_PUBLIC_SUPABASE_URL) 
    : '';

const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && (window.ENV_SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY)) 
    ? (window.ENV_SUPABASE_ANON_KEY || window.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
    : '';

let supabaseClient = null;

function isSupabaseConfigured() {
    return SUPABASE_URL && 
           !SUPABASE_URL.includes('YOUR-PROJECT-REF') && 
           SUPABASE_URL.trim() !== '' &&
           SUPABASE_ANON_KEY && 
           !SUPABASE_ANON_KEY.includes('YOUR-SUPABASE-ANON-KEY') &&
           SUPABASE_ANON_KEY.trim() !== '';
}

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

function updateSupabaseStatusUI(isReady, message) {
    const statusTextEl = document.getElementById('supaStatusText');
    const statusBadgeEl = document.getElementById('supaStatusDot');
    
    if (statusTextEl) statusTextEl.textContent = message;
    if (statusBadgeEl) statusBadgeEl.style.backgroundColor = isReady ? '#10b981' : '#f59e0b';
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
                message: 'Data rating tersimpan di Database Supabase!',
                data: data
            };
        } catch (err) {
            return {
                success: false,
                message: 'Gagal ke Supabase: ' + (err.message || 'Terjadi kesalahan jaringan'),
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
            message: 'Rating tersimpan dalam Mode Demo Simulasi Lokal.',
            data: payload
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
