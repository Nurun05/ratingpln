/**
 * ============================================================================
 * ADMIN SCRIPT
 * Handles Corporate Admin Dashboard UI, AdminController interactions,
 * Date Range Filters, and SheetJS XLSX Exporter.
 * ============================================================================
 */

let rawRatingsData = [];
let activeFilteredData = [];

document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    setupEventListeners();
});

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
        if (errorMsg) errorMsg.style.display = 'block';
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
                    <i class="fa-solid fa-inbox" style="font-size: 2.2rem; margin-bottom: 8px; opacity: 0.4;"></i>
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
            <tr>
                <td style="font-weight: 700; color: var(--pln-text-muted); width: 50px;">#${index + 1}</td>
                <td style="white-space: nowrap;">${dateStr}</td>
                <td>
                    <span class="badge-star">
                        <span>${item.rating_bintang}</span>
                        <span style="color: var(--pln-yellow);">${stars}</span>
                    </span>
                </td>
                <td>
                    <span class="badge-emoji ${emojiClass}">
                        <span>${emojiIcon}</span>
                        <span>${item.penilaian_pelayanan || '-'}</span>
                    </span>
                </td>
                <td style="max-width: 340px; line-height: 1.4;">${escapeHtml(item.deskripsi || '-')}</td>
                <td style="text-align: center; width: 50px;">
                    <button class="btn-delete-row" title="Hapus Data" onclick="deleteRatingItem('${item.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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
    const links = document.querySelectorAll('.sidebar-link');
    links.forEach(l => l.classList.remove('active'));

    const analyticsSec = document.getElementById('analyticsSection');
    const feedbackSec = document.getElementById('feedbackSection');
    const pageTitle = document.getElementById('pageTitle');

    if (tabName === 'dashboard') {
        if (analyticsSec) analyticsSec.style.display = 'grid';
        if (feedbackSec) feedbackSec.style.display = 'block';
        if (pageTitle) pageTitle.textContent = 'Dashboard Overview Pelayanan';
        if (links[0]) links[0].classList.add('active');
    } else if (tabName === 'feedback') {
        if (analyticsSec) analyticsSec.style.display = 'none';
        if (feedbackSec) feedbackSec.style.display = 'block';
        if (pageTitle) pageTitle.textContent = 'Data Feedback Pelanggan PLN';
        if (links[1]) links[1].classList.add('active');
    } else if (tabName === 'analytics') {
        if (analyticsSec) analyticsSec.style.display = 'grid';
        if (feedbackSec) feedbackSec.style.display = 'none';
        if (pageTitle) pageTitle.textContent = 'Analisis Visual Pelayanan PLN';
        if (links[2]) links[2].classList.add('active');
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
    if (!confirm('Apakah Anda yakin ingin mereset seluruh data simulasi demo lokal?')) return;
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
