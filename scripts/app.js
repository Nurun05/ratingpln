/**
 * FRONTEND APP SCRIPT
 * Website Rating Pelayanan PLN ULP Karebosi
 */

const ratingState = {
    nama_pelanggan: 'Anonim',
    rating_bintang: 0,
    keterangan_rating: '',
    deskripsi: '',
    penilaian_pelayanan: ''
};

const ratingLabels = {
    1: { label: 'Kecewa', color: '#dc2626' },
    2: { label: 'Kurang Puas', color: '#ea580c' },
    3: { label: 'Cukup Puas', color: '#d97706' },
    4: { label: 'Puas', color: '#0284c7' },
    5: { label: 'Sangat Puas', color: '#16a34a' }
};

document.addEventListener('DOMContentLoaded', () => {
    resetRatingForm();
    initStarRating();
    initFormValidation();
    initModalSelection();
});

function initStarRating() {
    const stars = document.querySelectorAll('.star-btn');
    const descSection = document.getElementById('descriptionSection');

    stars.forEach(star => {
        const val = parseInt(star.dataset.value, 10);
        star.addEventListener('mouseenter', () => { highlightStars(val); updateText(val); });
        star.addEventListener('mouseleave', () => { highlightStars(ratingState.rating_bintang); updateText(ratingState.rating_bintang); });
        star.addEventListener('click', () => {
            ratingState.rating_bintang = val;
            ratingState.keterangan_rating = ratingLabels[val].label;
            highlightStars(val);
            updateText(val);
            if (descSection) {
                descSection.classList.add('visible');
                setTimeout(() => descSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
            }
        });
    });

    function highlightStars(count) {
        stars.forEach(s => {
            const v = parseInt(s.dataset.value, 10);
            s.classList.toggle('selected', v <= count);
        });
    }

    function updateText(val) {
        const el = document.getElementById('expressiveRatingText');
        if (!el) return;
        if (val > 0 && ratingLabels[val]) {
            el.innerHTML = `<span style="color:${ratingLabels[val].color};font-weight:800">${ratingLabels[val].label}</span>`;
        } else {
            el.innerHTML = '<span style="color:var(--text-muted)">Pilih bintang untuk memberi penilaian</span>';
        }
    }
}

function initFormValidation() {
    const textarea = document.getElementById('deskripsiRating');
    const nameInput = document.getElementById('namaPelanggan');
    const btn = document.getElementById('btnOpenModal');
    const charCount = document.getElementById('charCount');

    if (textarea) {
        textarea.addEventListener('input', () => {
            if (textarea.value.trim() && (!nameInput || nameInput.value.trim())) hideError();
            if (charCount) {
                const len = textarea.value.length;
                charCount.textContent = `${len} / 500 karakter`;
            }
        });
    }

    if (nameInput) nameInput.addEventListener('input', () => {
        if (nameInput.value.trim() && (!textarea || textarea.value.trim())) hideError();
    });

    if (btn) btn.addEventListener('click', () => {
        const val = textarea ? textarea.value.trim() : '';
        const nameVal = nameInput ? nameInput.value.trim() : '';
        
        if (!nameVal) {
            showError('Nama Anda wajib diisi.');
            if (nameInput) nameInput.focus();
            return;
        }

        if (!val) {
            showError('Saran & masukan pelayanan wajib diisi.');
            if (textarea) textarea.focus();
            return;
        }

        ratingState.nama_pelanggan = nameVal;
        ratingState.deskripsi = val;
        hideError();
        openModal();
    });
}

function showError(msg) {
    const el = document.getElementById('validationErrorMsg');
    const ta = document.getElementById('deskripsiRating');
    const nameInput = document.getElementById('namaPelanggan');
    if (el) { el.textContent = msg; el.classList.add('show'); }
    if (ta && msg.includes('Saran')) ta.style.borderColor = '#ef4444';
    if (nameInput && msg.includes('Nama')) nameInput.style.borderColor = '#ef4444';
}

function hideError() {
    const el = document.getElementById('validationErrorMsg');
    const ta = document.getElementById('deskripsiRating');
    const nameInput = document.getElementById('namaPelanggan');
    if (el) el.classList.remove('show');
    if (ta) ta.style.borderColor = '#e2e8f0';
    if (nameInput) nameInput.style.borderColor = '#e2e8f0';
}

function openModal() {
    const m = document.getElementById('serviceModal');
    if (m) m.classList.add('show');
}

function closeModal() {
    const m = document.getElementById('serviceModal');
    if (m) m.classList.remove('show');
}

function initModalSelection() {
    const cards = document.querySelectorAll('.emoji-option');
    const content = document.getElementById('modalContentBody');
    const loading = document.getElementById('modalLoadingState');
    const success = document.getElementById('modalSuccessState');

    cards.forEach(card => {
        card.addEventListener('click', async () => {
            ratingState.penilaian_pelayanan = card.dataset.value;

            if (content) content.style.display = 'none';
            if (loading) { loading.classList.remove('hidden'); loading.style.display = 'block'; }

            let result;
            if (window.RatingController) {
                result = await window.RatingController.processSubmission(ratingState);
            } else {
                result = await saveRatingData(ratingState);
            }

            if (loading) { loading.classList.add('hidden'); loading.style.display = 'none'; }

            if (result.isSpam) {
                if (content) content.style.display = 'block';
                alert(result.message);
                return;
            }

            if (success) { success.classList.remove('hidden'); success.style.display = 'block'; }

            const note = document.getElementById('modalSuccessStatusNote');
            if (note) {
                if (result.isDemo) {
                    note.innerHTML = `<span style="color:#d97706;font-size:0.8rem;font-weight:700">${result.message}</span>`;
                } else if (result.success) {
                    note.innerHTML = `<span style="color:#16a34a;font-size:0.8rem;font-weight:700">${result.message}</span>`;
                } else {
                    note.innerHTML = `<span style="color:#dc2626;font-size:0.8rem;font-weight:700">${result.message}</span>`;
                }
            }
        });
    });
}

function resetRatingForm() {
    ratingState.nama_pelanggan = 'Anonim';
    ratingState.rating_bintang = 0;
    ratingState.keterangan_rating = '';
    ratingState.deskripsi = '';
    ratingState.penilaian_pelayanan = '';

    const nameInput = document.getElementById('namaPelanggan');
    if (nameInput) nameInput.value = '';

    const ta = document.getElementById('deskripsiRating');
    if (ta) ta.value = '';
    
    const charCount = document.getElementById('charCount');
    if (charCount) charCount.textContent = '0 / 500 karakter';

    const hp = document.getElementById('website_hp');
    if (hp) hp.value = '';
    document.querySelectorAll('.star-btn').forEach(s => s.classList.remove('selected'));

    const expr = document.getElementById('expressiveRatingText');
    if (expr) expr.innerHTML = '<span style="color:var(--text-muted)">Pilih bintang untuk memberi penilaian</span>';

    const desc = document.getElementById('descriptionSection');
    if (desc) desc.classList.remove('visible');

    const content = document.getElementById('modalContentBody');
    const loading = document.getElementById('modalLoadingState');
    const success = document.getElementById('modalSuccessState');

    if (content) content.style.display = 'block';
    if (loading) { loading.classList.add('hidden'); loading.style.display = 'none'; }
    if (success) { success.classList.add('hidden'); success.style.display = 'none'; }

    closeModal();
    hideError();
}
