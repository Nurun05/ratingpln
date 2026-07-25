/**
 * ============================================================================
 * FRONTEND APP SCRIPT
 * Website Rating Pelayanan PLN ULP Karebosi
 * Handles UI interactions, star selection, and Anti-Spam Controller dispatching.
 * ============================================================================
 */

// Global Rating Form State
const ratingState = {
    rating_bintang: 0,
    keterangan_rating: '',
    deskripsi: '',
    penilaian_pelayanan: ''
};

// Expressive Clean Labels (Murni Tipografi, Tanpa Gelembung/Pill Shape, Tanpa Emoji Outline)
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

/**
 * 1. Star Rating Interactive Logic
 */
function initStarRating() {
    const starButtons = document.querySelectorAll('.star-btn');
    const descriptionSection = document.getElementById('descriptionSection');

    starButtons.forEach((star) => {
        const val = parseInt(star.getAttribute('data-value'), 10);

        star.addEventListener('mouseenter', () => {
            highlightStars(val);
            updateExpressiveText(val);
        });

        star.addEventListener('mouseleave', () => {
            highlightStars(ratingState.rating_bintang);
            updateExpressiveText(ratingState.rating_bintang);
        });

        star.addEventListener('click', () => {
            ratingState.rating_bintang = val;
            ratingState.keterangan_rating = ratingLabels[val].label;
            
            highlightStars(val);
            updateExpressiveText(val);

            if (descriptionSection) {
                descriptionSection.classList.add('visible');
                setTimeout(() => {
                    descriptionSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 120);
            }
        });
    });

    function highlightStars(count) {
        starButtons.forEach((star) => {
            const val = parseInt(star.getAttribute('data-value'), 10);
            if (val <= count) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }

    function updateExpressiveText(val) {
        const el = document.getElementById('expressiveRatingText');
        if (!el) return;

        if (val > 0 && ratingLabels[val]) {
            el.innerHTML = `<span style="color: ${ratingLabels[val].color}; font-weight: 800;">${ratingLabels[val].label}</span>`;
        } else {
            el.innerHTML = '<span style="color: var(--pln-text-muted);">Pilih bintang untuk memberi penilaian</span>';
        }
    }
}

/**
 * 2. Form Validation & Modal Trigger
 */
function initFormValidation() {
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    const btnOpenModal = document.getElementById('btnOpenModal');

    if (deskripsiTextarea) deskripsiTextarea.addEventListener('input', validateDescription);

    if (btnOpenModal) {
        btnOpenModal.addEventListener('click', () => {
            const val = deskripsiTextarea ? deskripsiTextarea.value.trim() : '';
            if (val === '') {
                showValidationError('Alasan rating wajib diisi.');
                if (deskripsiTextarea) deskripsiTextarea.focus();
                return;
            }

            ratingState.deskripsi = val;
            hideValidationError();
            openServiceModal();
        });
    }
}

function validateDescription() {
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    const val = deskripsiTextarea ? deskripsiTextarea.value.trim() : '';
    if (val !== '') hideValidationError();
}

function showValidationError(msg) {
    const errorEl = document.getElementById('validationErrorMsg');
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
    }
    if (deskripsiTextarea) deskripsiTextarea.style.borderColor = '#ef4444';
}

function hideValidationError() {
    const errorEl = document.getElementById('validationErrorMsg');
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    if (errorEl) errorEl.style.display = 'none';
    if (deskripsiTextarea) deskripsiTextarea.style.borderColor = '#e2e8f0';
}

/**
 * 3. Modal Controls
 */
function openServiceModal() {
    const modal = document.getElementById('serviceModal');
    if (modal) modal.classList.add('show');
}

function closeServiceModal() {
    const modal = document.getElementById('serviceModal');
    if (modal) modal.classList.remove('show');
}

/**
 * 4. Modal Emoji Selection & Anti-Spam Controller Submission
 */
function initModalSelection() {
    const emojiCards = document.querySelectorAll('.emoji-option-card');
    const modalContent = document.getElementById('modalContentBody');
    const loadingState = document.getElementById('modalLoadingState');
    const successState = document.getElementById('modalSuccessState');

    emojiCards.forEach(card => {
        card.addEventListener('click', async () => {
            const pilihan = card.getAttribute('data-value');
            ratingState.penilaian_pelayanan = pilihan;

            if (modalContent) modalContent.style.display = 'none';
            if (loadingState) loadingState.style.display = 'block';

            // Dispatch Submission through Hidden RatingController (Anti-Spam & Timestamp Check)
            let result;
            if (window.RatingController) {
                result = await window.RatingController.processSubmission(ratingState);
            } else {
                result = await saveRatingData(ratingState);
            }

            // Transition Modal View
            if (loadingState) loadingState.style.display = 'none';

            if (result.isSpam) {
                // Show Anti-Spam warning in modal
                if (modalContent) modalContent.style.display = 'block';
                alert(result.message);
                return;
            }

            if (successState) successState.style.display = 'block';

            const statusNote = document.getElementById('modalSuccessStatusNote');
            if (statusNote) {
                if (result.isDemo) {
                    statusNote.innerHTML = `<span style="color:#d97706; font-size:0.85rem; font-weight:700;">ℹ️ ${result.message}</span>`;
                } else if (result.success) {
                    statusNote.innerHTML = `<span style="color:#16a34a; font-size:0.85rem; font-weight:700;">✅ ${result.message}</span>`;
                } else {
                    statusNote.innerHTML = `<span style="color:#dc2626; font-size:0.85rem; font-weight:700;">⚠️ ${result.message}</span>`;
                }
            }
        });
    });
}

/**
 * Reset Form & Modal
 */
function resetRatingForm() {
    ratingState.rating_bintang = 0;
    ratingState.keterangan_rating = '';
    ratingState.deskripsi = '';
    ratingState.penilaian_pelayanan = '';

    const deskripsiInput = document.getElementById('deskripsiRating');
    if (deskripsiInput) deskripsiInput.value = '';

    const honeypotInput = document.getElementById('website_hp');
    if (honeypotInput) honeypotInput.value = '';
    
    const starButtons = document.querySelectorAll('.star-btn');
    starButtons.forEach(s => s.classList.remove('selected'));
    
    const expressiveEl = document.getElementById('expressiveRatingText');
    if (expressiveEl) {
        expressiveEl.innerHTML = '<span style="color: var(--pln-text-muted);">Pilih bintang untuk memberi penilaian</span>';
    }

    const descriptionSection = document.getElementById('descriptionSection');
    if (descriptionSection) descriptionSection.classList.remove('visible');

    const modalContent = document.getElementById('modalContentBody');
    const loadingState = document.getElementById('modalLoadingState');
    const successState = document.getElementById('modalSuccessState');

    if (modalContent) modalContent.style.display = 'block';
    if (loadingState) loadingState.style.display = 'none';
    if (successState) successState.style.display = 'none';

    closeServiceModal();
    hideValidationError();
}
