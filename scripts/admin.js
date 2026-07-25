/**
 * ============================================================================
 * ADMIN SCRIPT
 * Handles Corporate Admin Dashboard UI, AdminController interactions,
 * Date Range Filters, Dynamic Chart renderers, and SheetJS XLSX Exporter.
 * ============================================================================
 */

let rawRatingsData = [];
let activeFilteredData = [];

document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    setupEventListeners();
    initDynamicYear();
    
    // Default switch tab to dashboard
    switchTab('dashboard');
});

function initDynamicYear() {
    const el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
    const elArchive = document.getElementById('currentYearArchive');
    if (elArchive) elArchive.textContent = new Date().getFullYear();
}

function checkAdminAuth() {
    const loginBackdrop = document.getElementById('loginBackdrop');
    if (window.AdminController && window.AdminController.isAuthenticated()) {
        if (loginBackdrop) loginBackdrop.classList.add('d-none');
        fetchRatingsData();
    } else {
        if (loginBackdrop) loginBackdrop.classList.remove('d-none');
    }
}

function handleAdminLogin(e) {
    e.preventDefault();
    const user = document.getElementById('adminUsername')?.value || '';
    const pass = document.getElementById('adminPassword')?.value || '';
    const errorMsg = document.getElementById('loginErrorMsg');

    if (window.AdminController && window.AdminController.authenticate(user, pass)) {
        if (errorMsg) errorMsg.style.display = 'none';
        checkAdminAuth();
    } else {
        if (errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.classList.remove('hidden');
        }
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
            updateDataSourceIndicator(true, 'Supabase Connected');
        } catch (err) {
            console.error('Error fetching Supabase data:', err);
            loadLocalDemoData();
        }
    } else {
        loadLocalDemoData();
    }

    applyFilters();
}

function loadLocalDemoData() {
    const raw = localStorage.getItem('pln_ratings_demo');
    if (raw) {
        try { rawRatingsData = JSON.parse(raw); } catch (e) { rawRatingsData = getFallbackSeed(); }
    } else {
        rawRatingsData = getFallbackSeed();
        localStorage.setItem('pln_ratings_demo', JSON.stringify(rawRatingsData));
    }
    updateDataSourceIndicator(false, 'Mode Demo LocalStorage');
}

function getFallbackSeed() {
    if (typeof SeedData !== 'undefined') {
        return SeedData.getSampleRatings();
    }
    return [];
}

function updateDataSourceIndicator(isReal, message) {
    const elText = document.getElementById('adminDataStatusText');
    const elDot = document.getElementById('adminDataStatusDot');
    if (elText) elText.textContent = message;
    if (elDot) elDot.style.backgroundColor = isReal ? '#10b981' : '#f59e0b';
}

function applyDatePreset() {
    const preset = document.getElementById('datePresetSelect')?.value || 'all';
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');

    const today = new Date();
    
    if (preset === 'all') {
        if (startDateInput) startDateInput.value = '';
        if (endDateInput) endDateInput.value = '';
    } else if (preset === 'today') {
        const str = today.toISOString().split('T')[0];
        if (startDateInput) startDateInput.value = str;
        if (endDateInput) endDateInput.value = str;
    } else if (preset === '7days') {
        const past7 = new Date(today.getTime() - 7 * 24 * 3600 * 1000);
        if (startDateInput) startDateInput.value = past7.toISOString().split('T')[0];
        if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    } else if (preset === '30days') {
        const past30 = new Date(today.getTime() - 30 * 24 * 3600 * 1000);
        if (startDateInput) startDateInput.value = past30.toISOString().split('T')[0];
        if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];
    }

    applyFilters();
}

function applyFilters() {
    const query = document.getElementById('searchInput')?.value || '';
    const starVal = document.getElementById('filterStarSelect')?.value || 'all';
    const startDate = document.getElementById('startDateInput')?.value || '';
    const endDate = document.getElementById('endDateInput')?.value || '';

    if (window.AdminController) {
        activeFilteredData = window.AdminController.filterRecords(rawRatingsData, {
            query,
            starVal,
            startDate,
            endDate
        });
    } else {
        activeFilteredData = [...rawRatingsData];
    }

    renderDashboard();
}

function renderDashboard() {
    renderMetricCards();
    renderAnalyticsBars();
    renderDataTable();
    renderTrendChart();
    renderRecentComments();
    renderDonutChart();
}

function renderMetricCards() {
    let metrics = { total: 0, avgScore: '0.0', satisfactionPct: 0, latestTimestamp: null };
    if (window.AdminController) {
        metrics = window.AdminController.calculateMetrics(activeFilteredData);
    }

    const avgScoreEl = document.getElementById('metricAvgScore');
    const totalCountEl = document.getElementById('metricTotalCount');
    const satisfactionEl = document.getElementById('metricSatisfaction');
    const latestTimeEl = document.getElementById('metricLatestTime');

    if (totalCountEl) totalCountEl.textContent = metrics.total;
    if (avgScoreEl) avgScoreEl.textContent = `${metrics.avgScore} ★`;
    if (satisfactionEl) satisfactionEl.textContent = `${metrics.satisfactionPct}%`;
    if (latestTimeEl) {
        latestTimeEl.textContent = metrics.latestTimestamp ? formatDateShort(metrics.latestTimestamp) : '-';
    }
}

function renderAnalyticsBars() {
    const total = activeFilteredData.length || 1;

    for (let i = 1; i <= 5; i++) {
        const count = activeFilteredData.filter(d => parseInt(d.rating_bintang, 10) === i).length;
        const pct = Math.round((count / total) * 100);
        
        const countEl = document.getElementById(`starCount${i}`);
        const barEl = document.getElementById(`starBar${i}`);
        
        if (countEl) countEl.textContent = `${count} (${pct}%)`;
        if (barEl) barEl.style.width = `${pct}%`;
    }

    const emojis = [
        { key: 'Sangat Baik', countId: 'emojiCountSangatBaik', barId: 'emojiBarSangatBaik' },
        { key: 'Cukup Baik', countId: 'emojiCountCukupBaik', barId: 'emojiBarCukupBaik' },
        { key: 'Buruk', countId: 'emojiCountBuruk', barId: 'emojiBarBuruk' }
    ];

    emojis.forEach(e => {
        const count = activeFilteredData.filter(d => d.penilaian_pelayanan === e.key).length;
        const pct = Math.round((count / total) * 100);
        
        const countEl = document.getElementById(e.countId);
        const barEl = document.getElementById(e.barId);
        
        if (countEl) countEl.textContent = `${count} (${pct}%)`;
        if (barEl) barEl.style.width = `${pct}%`;
    });
}

function renderDataTable() {
    const tbody = document.getElementById('ratingsTbody');
    const recordsCountEl = document.getElementById('tableRecordsCount');
    if (!tbody) return;

    if (recordsCountEl) recordsCountEl.textContent = `${activeFilteredData.length} data ditemukan`;

    if (activeFilteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <span class="material-symbols-outlined text-4xl text-outline mb-2">inbox</span>
                    <p>Tidak ada data rating pada filter ini.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = activeFilteredData.map((item, index) => {
        const dateStr = item.created_at ? formatDateFull(new Date(item.created_at)) : '-';
        const stars = '★'.repeat(item.rating_bintang || 0);
        const emojiClass = item.penilaian_pelayanan === 'Sangat Baik' ? 'badge-sangat-baik' :
                           item.penilaian_pelayanan === 'Cukup Baik' ? 'badge-cukup-baik' : 'badge-buruk';
        const emojiIcon = item.penilaian_pelayanan === 'Sangat Baik' ? '😊' :
                          item.penilaian_pelayanan === 'Cukup Baik' ? '😐' : '🙁';

        return `
            <tr class="hover:bg-surface-container-low transition-colors group">
                <td class="px-6 py-4 font-bold text-primary">#${index + 1}</td>
                <td class="px-6 py-4 white-space-nowrap">${dateStr}</td>
                <td class="px-6 py-4">
                    <span class="badge-star">
                        <span>${item.rating_bintang}</span>
                        <span style="color: var(--pln-yellow);">${stars}</span>
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="badge-emoji ${emojiClass}">
                        <span>${emojiIcon}</span>
                        <span>${item.penilaian_pelayanan || '-'}</span>
                    </span>
                </td>
                <td class="px-6 py-4 max-w-[340px] leading-relaxed break-words">${escapeHtml(item.deskripsi || '-')}</td>
                <td class="px-6 py-4 text-center">
                    <button class="btn-delete-row text-outline hover:text-error transition-all" title="Hapus Data" onclick="deleteRatingItem('${item.id}')">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTrendChart() {
    const container = document.getElementById('trendChartBars');
    if (!container) return;
    
    // Group raw data by date for the last 15 days
    const today = new Date();
    let html = '';
    for (let i = 14; i >= 0; i--) {
        const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        // Count ratings on this day
        const dayRatings = rawRatingsData.filter(r => r.created_at && r.created_at.startsWith(dateStr));
        const count = dayRatings.length;
        const avg = count > 0 ? (dayRatings.reduce((acc, r) => acc + (r.rating_bintang || 0), 0) / count).toFixed(1) : 0;
        // Height as percentage of max ratings or up to 100%
        const pct = count > 0 ? Math.min(30 + (avg * 14), 100) : 0;
        const dayLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        html += `
            <div class="w-3.5 bg-secondary/20 rounded-t-sm hover:bg-secondary transition-all cursor-help group relative" style="height: ${pct > 0 ? pct : 5}%;" title="${dayLabel}: ${avg} ★ (${count} Rating)">
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-[#0b1e33] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
                    ${avg} ★ (${count} Ulasan)
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderRecentComments() {
    const container = document.getElementById('dashboardRecentComments');
    if (!container) return;
    const latest = rawRatingsData.slice(0, 3);
    if (latest.length === 0) {
        container.innerHTML = '<p class="text-xs text-on-surface-variant col-span-3 text-center py-4">Belum ada komentar.</p>';
        return;
    }
    container.innerHTML = latest.map(item => {
        const timeStr = item.created_at ? formatDateShort(new Date(item.created_at)) : '-';
        const nameInitials = (item.penilaian_pelayanan || 'CS').slice(0, 2).toUpperCase();
        const emoji = item.penilaian_pelayanan === 'Sangat Baik' ? '😊' :
                      item.penilaian_pelayanan === 'Cukup Baik' ? '😐' : '🙁';
        const borderSide = item.rating_bintang >= 4 ? 'border-l-4 border-l-tertiary-fixed-dim' : 'border-l-4 border-l-error';
        return `
            <div class="glass-card p-5 rounded-xl shadow-sm relative overflow-hidden group ${borderSide}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed-variant text-xs">${nameInitials}</div>
                        <div>
                            <p class="text-label-lg font-bold">${item.penilaian_pelayanan || 'Pelanggan'}</p>
                            <p class="text-[10px] text-on-surface-variant uppercase font-bold">Rating CS</p>
                        </div>
                    </div>
                    <div class="text-xl flex gap-1">
                        <span class="text-amber-500 text-sm font-bold">${item.rating_bintang} ★</span>
                        <span>${emoji}</span>
                    </div>
                </div>
                <p class="text-body-md text-on-surface mb-4 line-clamp-3 italic">
                    "${escapeHtml(item.deskripsi || '-')}"
                </p>
                <div class="flex justify-between items-center text-[11px] text-on-surface-variant font-medium">
                    <span>${timeStr}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderDonutChart() {
    const donut = document.getElementById('serviceMoodDonut');
    if (!donut) return;
    const total = rawRatingsData.length || 1;
    const sangatBaik = Math.round((rawRatingsData.filter(d => d.penilaian_pelayanan === 'Sangat Baik').length / total) * 100);
    const cukupBaik = Math.round((rawRatingsData.filter(d => d.penilaian_pelayanan === 'Cukup Baik').length / total) * 100);
    const buruk = 100 - sangatBaik - cukupBaik;
    
    // Set background gradient dynamically
    donut.style.background = `conic-gradient(#2dbcfe 0% ${sangatBaik}%, #4ae183 ${sangatBaik}% ${sangatBaik + cukupBaik}%, #ba1a1a ${sangatBaik + cukupBaik}% 100%)`;
    
    // Update percentages in legends
    const pSangatBaik = document.getElementById('legendSangatBaik');
    const pCukupBaik = document.getElementById('legendCukupBaik');
    const pBuruk = document.getElementById('legendBuruk');
    if (pSangatBaik) pSangatBaik.textContent = `${sangatBaik}%`;
    if (pCukupBaik) pCukupBaik.textContent = `${cukupBaik}%`;
    if (pBuruk) pBuruk.textContent = `${buruk}%`;
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterStarSelect = document.getElementById('filterStarSelect');
    const startDateInput = document.getElementById('startDateInput');
    const endDateInput = document.getElementById('endDateInput');
    const btnClearData = document.getElementById('btnClearData');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterStarSelect) filterStarSelect.addEventListener('change', applyFilters);
    if (startDateInput) startDateInput.addEventListener('change', applyFilters);
    if (endDateInput) endDateInput.addEventListener('change', applyFilters);
    if (btnClearData) btnClearData.addEventListener('click', clearAllDemoData);
}

function exportToXLSX() {
    if (activeFilteredData.length === 0) {
        alert('Tidak ada data rating pada filter ini untuk diekspor.');
        return;
    }

    const excelRows = activeFilteredData.map((item, index) => ({
        'No': index + 1,
        'ID Feedback': item.id || '-',
        'Tanggal & Waktu': item.created_at ? formatDateFull(new Date(item.created_at)) : '-',
        'Unit Pelayanan': item.unit_pelayanan || 'PLN ULP Karebosi',
        'Bintang Rating': item.rating_bintang || 0,
        'Keterangan Rating': item.keterangan_rating || '-',
        'Penilaian Emoji': item.penilaian_pelayanan || '-',
        'Alasan / Deskripsi Pelanggan': item.deskripsi || '-'
    }));

    if (typeof XLSX !== 'undefined') {
        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Rating ULP Karebosi');

        worksheet['!cols'] = [
            { wch: 6 },
            { wch: 18 },
            { wch: 22 },
            { wch: 22 },
            { wch: 15 },
            { wch: 18 },
            { wch: 18 },
            { wch: 60 }
        ];

        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `Laporan_Rating_PLN_ULP_Karebosi_${dateStr}.xlsx`);
    } else {
        alert('Pustaka SheetJS belum termuat.');
    }
}

function switchTab(tabName) {
    // Hide all tabs
    ['dashboard', 'feedback', 'analytics', 'ekspor'].forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) el.classList.add('hidden');
    });
    
    // Show active tab
    const activeEl = document.getElementById(`tab-${tabName}`);
    if (activeEl) activeEl.classList.remove('hidden');

    // Update active class on sidebar links
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(l => {
        l.classList.remove('active');
    });
    
    // Find link corresponding to tabName
    const targetLink = document.getElementById(`link-${tabName}`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
    
    // Update top header title dynamically
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        if (tabName === 'dashboard') pageTitle.textContent = 'Dashboard Overview';
        else if (tabName === 'feedback') pageTitle.textContent = 'Feedback Pelanggan';
        else if (tabName === 'analytics') pageTitle.textContent = 'Analisis Performa';
        else if (tabName === 'ekspor') pageTitle.textContent = 'Ekspor Data Laporan';
    }
}

async function deleteRatingItem(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus masukan ini?')) return;

    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && supabaseClient) {
        try {
            const { error } = await supabaseClient
                .from('ratings')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (e) {
            alert('Gagal hapus data dari Supabase: ' + e.message);
            return;
        }
    }

    rawRatingsData = rawRatingsData.filter(item => item.id !== id);
    localStorage.setItem('pln_ratings_demo', JSON.stringify(rawRatingsData));
    applyFilters();
}

function clearAllDemoData() {
    if (!confirm('Apakah Anda yakin ingin mengosongkan seluruh data simulasi lokal?')) return;
    localStorage.removeItem('pln_ratings_demo');
    rawRatingsData = [];
    activeFilteredData = [];
    renderDashboard();
}

function formatDateShort(dateObj) {
    return dateObj.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateFull(dateObj) {
    return dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}
