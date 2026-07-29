/**
 * ADMIN SCRIPT - Production Ready
 * Dashboard, Filters, Table Rendering, Tab Switching, XLSX Export
 */

let rawRatingsData = [];
let activeFilteredData = [];

document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    setupEventListeners();
});

function checkAdminAuth() {
    const login = document.getElementById('loginBackdrop');
    if (window.AdminController && window.AdminController.isAuthenticated()) {
        if (login) login.classList.add('d-none');
        fetchRatingsData();
    } else {
        if (login) login.classList.remove('d-none');
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const user = document.getElementById('adminUsername')?.value || '';
    const pass = document.getElementById('adminPassword')?.value || '';
    const err = document.getElementById('loginErrorMsg');

    if (window.AdminController && window.AdminController.authenticate(user, pass)) {
        if (err) err.style.display = 'none';
        checkAdminAuth();
    } else {
        if (err) err.style.display = 'block';
    }
}

function handleAdminLogout() {
    if (window.AdminController) window.AdminController.logout();
    checkAdminAuth();
}

async function fetchRatingsData() {
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('ratings')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            rawRatingsData = data || [];
            // Hapus data demo lokal saat Supabase berhasil terhubung
            localStorage.removeItem('pln_ratings_demo');
            updateStatus(true, 'Sistem Terhubung');
            setupRealtimeSubscription();
        } catch (err) {
            console.error('Supabase error:', err);
            loadLocalData();
        }
    } else {
        loadLocalData();
    }
    applyFilters();
}

let realtimeChannel = null;
function setupRealtimeSubscription() {
    if (realtimeChannel) return; // prevent duplicate subscriptions

    realtimeChannel = supabaseClient
        .channel('schema-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'ratings'
            },
            (payload) => {
                console.log('⚡ Realtime change detected:', payload);
                
                if (payload.eventType === 'INSERT') {
                    // Cek jika ID sudah ada untuk mencegah duplikasi
                    if (!rawRatingsData.some(item => item.id === payload.new.id)) {
                        rawRatingsData.unshift(payload.new);
                    }
                } else if (payload.eventType === 'DELETE') {
                    rawRatingsData = rawRatingsData.filter(item => item.id !== payload.old.id);
                } else if (payload.eventType === 'UPDATE') {
                    const index = rawRatingsData.findIndex(item => item.id === payload.new.id);
                    if (index !== -1) {
                        rawRatingsData[index] = payload.new;
                    }
                }
                
                // Urutkan kembali berdasarkan created_at desc
                rawRatingsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                applyFilters();
            }
        )
        .subscribe();
}

function loadLocalData() {
    const raw = localStorage.getItem('pln_ratings_demo');
    if (raw) {
        try { rawRatingsData = JSON.parse(raw); } catch (e) { rawRatingsData = getFallbackSeed(); }
    } else {
        rawRatingsData = getFallbackSeed();
        localStorage.setItem('pln_ratings_demo', JSON.stringify(rawRatingsData));
    }
    updateStatus(false, 'Mode Demo (LocalStorage)');
}

function getFallbackSeed() {
    return typeof SeedData !== 'undefined' ? SeedData.getSampleRatings() : [];
}

function updateStatus(isReal, msg) {
    const dot = document.getElementById('adminDataStatusDot');
    const txt = document.getElementById('adminDataStatusText');
    if (txt) txt.textContent = msg;
    if (dot) dot.className = dot.className.replace(/bg-\S+/g, '') + (isReal ? ' bg-emerald-500' : ' bg-amber-500');
}

// ── Date Preset ────────────────────────────────────
function applyDatePreset() {
    const preset = document.getElementById('datePresetSelect')?.value || 'all';
    const start = document.getElementById('startDateInput');
    const end = document.getElementById('endDateInput');
    const today = new Date();
    const fmt = d => d.toISOString().split('T')[0];

    if (preset === 'all') {
        if (start) start.value = '';
        if (end) end.value = '';
    } else if (preset === 'today') {
        if (start) start.value = fmt(today);
        if (end) end.value = fmt(today);
    } else if (preset === '7days') {
        if (start) start.value = fmt(new Date(today.getTime() - 7*86400000));
        if (end) end.value = fmt(today);
    } else if (preset === '30days') {
        if (start) start.value = fmt(new Date(today.getTime() - 30*86400000));
        if (end) end.value = fmt(today);
    }
    applyFilters();
}

// ── Filters ────────────────────────────────────────
function applyFilters() {
    const query = document.getElementById('searchInput')?.value || '';
    const starVal = document.getElementById('filterStarSelect')?.value || 'all';
    const startDate = document.getElementById('startDateInput')?.value || '';
    const endDate = document.getElementById('endDateInput')?.value || '';

    if (window.AdminController) {
        activeFilteredData = window.AdminController.filterRecords(rawRatingsData, { query, starVal, startDate, endDate });
    } else {
        activeFilteredData = [...rawRatingsData];
    }
    renderAll();
}

// ── Render All ─────────────────────────────────────
function renderAll() {
    renderMetrics();
    renderStarBars();
    renderEmojiDonut();
    renderTable();
    renderRecentComments();
}

// ── Metrics ────────────────────────────────────────
function renderMetrics() {
    let m = { total: 0, avgScore: '0.0', satisfactionPct: 0, latestTimestamp: null };
    if (window.AdminController) m = window.AdminController.calculateMetrics(activeFilteredData);

    const el = id => document.getElementById(id);
    if (el('metricTotalCount')) el('metricTotalCount').textContent = m.total;
    if (el('metricAvgScore')) el('metricAvgScore').textContent = m.avgScore + ' ★';
    if (el('metricSatisfaction')) el('metricSatisfaction').textContent = m.satisfactionPct + '%';
    if (el('satisfactionProgressBar')) el('satisfactionProgressBar').style.width = m.satisfactionPct + '%';
    if (el('metricLatestTime')) el('metricLatestTime').textContent = m.latestTimestamp ? formatShort(m.latestTimestamp) : '-';
}

// ── Star Distribution Bars ─────────────────────────
function renderStarBars() {
    const total = activeFilteredData.length || 1;
    for (let i = 1; i <= 5; i++) {
        const count = activeFilteredData.filter(d => parseInt(d.rating_bintang, 10) === i).length;
        const pct = Math.round((count / total) * 100);
        const cEl = document.getElementById('starCount' + i);
        const bEl = document.getElementById('starBar' + i);
        if (cEl) cEl.textContent = count + ' (' + pct + '%)';
        if (bEl) bEl.style.width = pct + '%';
    }
}

// ── Emoji Donut ────────────────────────────────────
function renderEmojiDonut() {
    const total = activeFilteredData.length || 1;
    const sb = activeFilteredData.filter(d => d.penilaian_pelayanan === 'Sangat Baik').length;
    const cb = activeFilteredData.filter(d => d.penilaian_pelayanan === 'Cukup Baik').length;
    const br = activeFilteredData.filter(d => d.penilaian_pelayanan === 'Buruk').length;

    const pSb = Math.round((sb / total) * 100);
    const pCb = Math.round((cb / total) * 100);
    const pBr = Math.round((br / total) * 100);

    const donut = document.getElementById('serviceMoodDonut');
    if (donut) {
        donut.style.background = `conic-gradient(#2dbcfe 0% ${pSb}%, #6bfe9c ${pSb}% ${pSb + pCb}%, #ef4444 ${pSb + pCb}% 100%)`;
    }

    const el = id => document.getElementById(id);
    if (el('legendSangatBaik')) el('legendSangatBaik').textContent = pSb + '%';
    if (el('legendCukupBaik')) el('legendCukupBaik').textContent = pCb + '%';
    if (el('legendBuruk')) el('legendBuruk').textContent = pBr + '%';
}

// ── Table ──────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById('ratingsTbody');
    const countEl = document.getElementById('tableRecordsCount');
    if (!tbody) return;

    if (countEl) countEl.textContent = activeFilteredData.length;

    if (activeFilteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>Tidak ada data pada filter ini.</p></td></tr>';
        return;
    }

    tbody.innerHTML = activeFilteredData.map((item, i) => {
        const date = item.created_at ? formatFull(new Date(item.created_at)) : '-';
        const name = item.nama_pelangan || item.nama_pelanggan || 'Anonim';
        const stars = '★'.repeat(item.rating_bintang || 0);
        const emojiClass = item.penilaian_pelayanan === 'Sangat Baik' ? 'badge-sangat-baik'
            : item.penilaian_pelayanan === 'Cukup Baik' ? 'badge-cukup-baik' : 'badge-buruk';
        const emoji = item.penilaian_pelayanan === 'Sangat Baik' ? '😊'
            : item.penilaian_pelayanan === 'Cukup Baik' ? '😐' : '🙁';

        return `<tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-3 text-xs font-bold text-gray-400">#${i + 1}</td>
            <td class="px-6 py-3 text-xs whitespace-nowrap">${date}</td>
            <td class="px-6 py-3 text-xs font-semibold text-gray-700">${esc(name)}</td>
            <td class="px-6 py-3"><span class="badge-star"><span>${item.rating_bintang}</span> <span class="text-amber-400">${stars}</span></span></td>
            <td class="px-6 py-3"><span class="badge-emoji ${emojiClass}">${emoji} ${item.penilaian_pelayanan || '-'}</span></td>
            <td class="px-6 py-3 text-xs max-w-xs">${esc(item.deskripsi || '-')}</td>
            <td class="px-6 py-3 text-center"><button class="btn-delete-row" title="Hapus" onclick="deleteRatingItem('${item.id}')"><i class="fa-solid fa-trash-can"></i></button></td>
        </tr>`;
    }).join('');
}

// ── Recent Comments ────────────────────────────────
function renderRecentComments() {
    const container = document.getElementById('dashboardRecentComments');
    if (!container) return;

    const recent = activeFilteredData.slice(0, 3);
    if (recent.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400 col-span-full text-center py-8">Belum ada ulasan.</p>';
        return;
    }

    container.innerHTML = recent.map(item => {
        const emoji = item.penilaian_pelayanan === 'Sangat Baik' ? '😊'
            : item.penilaian_pelayanan === 'Cukup Baik' ? '😐' : '🙁';
        const time = item.created_at ? formatShort(new Date(item.created_at)) : '-';
        return `<div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-center justify-between mb-2">
                <span class="text-lg">${emoji}</span>
                <span class="text-xs text-gray-400">${time}</span>
            </div>
            <div class="flex items-center gap-1 mb-2">
                <span class="text-amber-400 text-sm">${'★'.repeat(item.rating_bintang || 0)}</span>
                <span class="text-gray-300 text-sm">${'★'.repeat(5 - (item.rating_bintang || 0))}</span>
            </div>
            <p class="text-sm text-gray-700 line-clamp-3">${esc(item.deskripsi || '-')}</p>
        </div>`;
    }).join('');
}

// ── Event Listeners ────────────────────────────────
function setupEventListeners() {
    const search = document.getElementById('searchInput');
    const star = document.getElementById('filterStarSelect');
    const sd = document.getElementById('startDateInput');
    const ed = document.getElementById('endDateInput');
    const clear = document.getElementById('btnClearData');

    if (search) search.addEventListener('input', applyFilters);
    if (star) star.addEventListener('change', applyFilters);
    if (sd) sd.addEventListener('change', applyFilters);
    if (ed) ed.addEventListener('change', applyFilters);
    if (clear) clear.addEventListener('click', clearAllData);
}

// ── Export XLSX ─────────────────────────────────────
function exportToXLSX() {
    if (activeFilteredData.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }

    const rows = activeFilteredData.map((item, i) => ({
        'No.': i + 1,
        'ID': item.id || '-',
        'Tanggal': item.created_at ? formatFull(new Date(item.created_at)) : '-',
        'Nama': item.nama_pelangan || item.nama_pelanggan || 'Anonim',
        'Unit ': item.unit_pelayanan || 'PLN ULP Karebosi',
        'Bintang ': item.rating_bintang || 0,
        'Keterangan': item.keterangan_rating || '-',
        'Penilaian Emoji': item.penilaian_pelayanan || '-',
        'Alasan/Deskripsi': item.deskripsi || '-'
    }));

    if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        
        // Tentukan nama sheet secara dinamis: Berdasarkan Bulan-Tahun filter, Tanggal filter, atau Gabungan
        const startDate = document.getElementById('startDateInput')?.value;
        const endDate = document.getElementById('endDateInput')?.value;
        let sheetName = 'Laporan Gabungan';
        
        if (startDate && endDate) {
            // Ambil MM-YYYY jika rentang tanggal berada pada bulan yang sama
            const startYM = startDate.slice(0, 7); // YYYY-MM
            const endYM = endDate.slice(0, 7);
            if (startYM === endYM) {
                const parts = startYM.split('-'); // [YYYY, MM]
                sheetName = `${parts[1]}-${parts[0]}`; // MM-YYYY
            } else {
                sheetName = `${startDate} s.d ${endDate}`;
            }
        } else if (startDate) {
            sheetName = `Mulai ${startDate}`;
        } else if (endDate) {
            sheetName = `Hingga ${endDate}`;
        }

        // Batasi nama sheet maksimal 31 karakter (aturan Excel)
        if (sheetName.length > 31) {
            sheetName = sheetName.slice(0, 31);
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        ws['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 50 }];
        
        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `Laporan_Rating_PLN_ULP_Karebosi_${dateStr}.xlsx`);
    } else {
        alert('Pustaka SheetJS belum termuat.');
    }
}

// ── Buka Google Spreadsheet ────────────────
function openGoogleSpreadsheet() {
    const urlInput = document.getElementById('gasSpreadsheetUrl');
    const url = urlInput?.value?.trim();
    if (url) {
        window.open(url, '_blank');
    } else {
        alert('Tolong masukkan Link Google Spreadsheet terlebih dahulu.');
    }
}

// Muat URL Spreadsheet yang tersimpan
document.addEventListener('DOMContentLoaded', () => {
    const savedUrl = localStorage.getItem('pln_gas_spreadsheet_url');
    const urlInput = document.getElementById('gasSpreadsheetUrl');
    if (urlInput) {
        if (savedUrl) {
            urlInput.value = savedUrl;
        }
        urlInput.addEventListener('change', () => {
            localStorage.setItem('pln_gas_spreadsheet_url', urlInput.value.trim());
        });
    }
});

// ── Tab Switching ──────────────────────────────────
function switchTab(name) {
    const tabs = ['dashboard', 'feedback', 'analytics', 'ekspor'];
    const titles = {
        dashboard: 'Ringkasan Informasi Pelayanan',
        feedback: 'Daftar Ulasan Pelanggan',
        analytics: 'Grafik Kepuasan Pelanggan',
        ekspor: 'Unduh Laporan Excel'
    };

    tabs.forEach(t => {
        const tabEl = document.getElementById('tab-' + t);
        const linkEl = document.getElementById('link-' + t);
        if (tabEl) tabEl.classList.toggle('hidden', t !== name);
        if (linkEl) linkEl.classList.toggle('active', t === name);
    });

    const title = document.getElementById('pageTitle');
    if (title) title.textContent = titles[name] || '';

    // Jangan langsung download — tampilkan tab dulu
    if (name === 'ekspor') {
        // biarkan tab ekspor muncul, download dilakukan manual lewat tombol
    }
}

// ── Delete ─────────────────────────────────────────
async function deleteRatingItem(id) {
    if (!confirm('Hapus masukan ini?')) return;

    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && supabaseClient) {
        try {
            const { error } = await supabaseClient.from('ratings').delete().eq('id', id);
            if (error) throw error;
        } catch (e) {
            alert('Gagal hapus: ' + e.message);
            return;
        }
    }

    rawRatingsData = rawRatingsData.filter(item => item.id !== id);
    localStorage.setItem('pln_ratings_demo', JSON.stringify(rawRatingsData));
    applyFilters();
}

function clearAllData() {
    if (!confirm('Reset seluruh data demo?')) return;
    localStorage.removeItem('pln_ratings_demo');
    rawRatingsData = [];
    activeFilteredData = [];
    renderAll();
}

// ── Utils ──────────────────────────────────────────
function formatShort(d) {
    if (!(d instanceof Date)) d = new Date(d);
    return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatFull(d) {
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function esc(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}
