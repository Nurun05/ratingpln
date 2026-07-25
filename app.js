/**
 * ============================================================================
 * APPLICATION LOGIC & INTERACTIVE FLOW (SINGLE PAGE CLEAN & RELOAD SAFE)
 * Website Rating Pelayanan PLN
 * ============================================================================
 */

// Global State Form Rating
const ratingState = {
    rating_bintang: 0,
    keterangan_rating: '',
    deskripsi: '',
    penilaian_pelayanan: ''
};

// Map Keterangan Bintang (1 - 5)
const ratingLabels = {
    1: { label: 'Sangat Buruk', emoji: '😡' },
    2: { label: 'Kurang Baik', emoji: '🙁' },
    3: { label: 'Cukup Baik', emoji: '😐' },
    4: { label: 'Bagus', emoji: '🙂' },
    5: { label: 'Bagus Sekali', emoji: '😁' }
};

document.addEventListener('DOMContentLoaded', () => {
    // Reset status awal agar saat reload halaman tidak ada sisa tampilan sukses
    resetRatingForm();
    initStarRating();
    initFormValidation();
    initModalSelection();
});

/**
 * 1. Logika Interaktif Bintang (Hover, Click, Label Update, & Dynamic Reveal)
 */
function initStarRating() {
    const starButtons = document.querySelectorAll('.star-btn');
    const badgeLabel = document.getElementById('ratingBadgeLabel');
    const badgeIcon = document.getElementById('ratingBadgeIcon');
    const badgeContainer = document.getElementById('ratingBadgeContainer');
    const descriptionSection = document.getElementById('descriptionSection');

    starButtons.forEach((star) => {
        const val = parseInt(star.getAttribute('data-value'));

        // Mouse Hover Event
        star.addEventListener('mouseenter', () => {
            highlightStars(val);
            updateBadgeUI(val);
        });

        // Mouse Leave Event
        star.addEventListener('mouseleave', () => {
            highlightStars(ratingState.rating_bintang);
            updateBadgeUI(ratingState.rating_bintang);
        });

        // Click Event (Memilih Bintang -> Otomatis Munculkan Kolom Deskripsi)
        star.addEventListener('click', () => {
            ratingState.rating_bintang = val;
            ratingState.keterangan_rating = ratingLabels[val].label;
            
            highlightStars(val);
            updateBadgeUI(val);

            // MUNCULKAN KOLOM DESKRIPSI SECARA DYNAMICAL/SMOOTH
            if (descriptionSection) {
                descriptionSection.classList.add('visible');
                
                // Smooth scroll ke kolom deskripsi agar terasa intuitif
                setTimeout(() => {
                    descriptionSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 150);
            }
        });
    });

    function highlightStars(count) {
        starButtons.forEach((star) => {
            const val = parseInt(star.getAttribute('data-value'));
            if (val <= count) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }

    function updateBadgeUI(val) {
        if (val > 0 && ratingLabels[val]) {
            badgeLabel.textContent = `${val} Bintang: ${ratingLabels[val].label}`;
            badgeIcon.textContent = ratingLabels[val].emoji;
            badgeContainer.className = `rating-label-badge active rating-${val}`;
        } else {
            badgeLabel.textContent = 'Sentuh Bintang Di Atas';
            badgeIcon.textContent = '⭐';
            badgeContainer.className = 'rating-label-badge';
        }
    }
}

/**
 * 2. Validasi Deskripsi Rating (Wajib Isi)
 */
function initFormValidation() {
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    const btnOpenModal = document.getElementById('btnOpenModal');

    deskripsiTextarea.addEventListener('input', validateDescription);

    btnOpenModal.addEventListener('click', () => {
        const val = deskripsiTextarea.value.trim();
        if (val === '') {
            showValidationError('⚠️ Mohon tuliskan alasan atau deskripsi rating Anda di atas.');
            deskripsiTextarea.focus();
            return;
        }

        ratingState.deskripsi = val;
        hideValidationError();
        openServiceModal();
    });
}

function validateDescription() {
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    const val = deskripsiTextarea.value.trim();
    if (val !== '') {
        hideValidationError();
    }
}

function showValidationError(msg) {
    const errorEl = document.getElementById('validationErrorMsg');
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    errorEl.textContent = msg;
    errorEl.classList.remove('d-none');
    deskripsiTextarea.style.borderColor = '#dc3545';
}

function hideValidationError() {
    const errorEl = document.getElementById('validationErrorMsg');
    const deskripsiTextarea = document.getElementById('deskripsiRating');
    errorEl.classList.add('d-none');
    deskripsiTextarea.style.borderColor = '#cbd5e1';
}

/**
 * 3. Pop-Up Modal: "Bagaimana Pelayanan Kami Hari Ini?"
 */
function openServiceModal() {
    const modal = document.getElementById('serviceModal');
    modal.classList.add('show');
}

function closeServiceModal() {
    const modal = document.getElementById('serviceModal');
    modal.classList.remove('show');
}

/**
 * 4. Eksekusi Pengiriman saat Pengguna memilih Emoji di Modal
 */
function initModalSelection() {
    const emojiCards = document.querySelectorAll('.emoji-option-card');
    const modalContent = document.getElementById('modalContentBody');
    const loadingState = document.getElementById('modalLoadingState');

    emojiCards.forEach(card => {
        card.addEventListener('click', async () => {
            const pilihan = card.getAttribute('data-value');
            ratingState.penilaian_pelayanan = pilihan;

            // Tampilkan Loading State di Modal
            modalContent.classList.add('d-none');
            loadingState.classList.remove('d-none');

            // Simpan Data ke Supabase
            const result = await saveRatingData(ratingState);

            // Tutup Modal
            closeServiceModal();

            // Tampilkan Layar Sukses
            showSuccessScreen(result);
        });
    });
}

/**
 * 5. Tampilan Sukses / Feedback Terkirim
 */
function showSuccessScreen(result) {
    const mainFormView = document.getElementById('mainFormView');
    const successView = document.getElementById('successView');
    const statusNote = document.getElementById('successStatusNote');

    if (mainFormView) mainFormView.style.display = 'none';
    if (successView) successView.classList.add('active');

    if (statusNote) {
        if (result.isDemo) {
            statusNote.innerHTML = `ℹ️ <em>${result.message}</em>`;
            statusNote.className = 'text-warning mt-3 small fw-bold';
        } else if (result.success) {
            statusNote.innerHTML = `✅ <em>${result.message}</em>`;
            statusNote.className = 'text-success mt-3 small fw-bold';
        } else {
            statusNote.innerHTML = `⚠️ <em>${result.message}</em>`;
            statusNote.className = 'text-danger mt-3 small fw-bold';
        }
    }
}

/**
 * Reset Form untuk mengirim rating baru & pembersihan saat reload
 */
function resetRatingForm() {
    ratingState.rating_bintang = 0;
    ratingState.keterangan_rating = '';
    ratingState.deskripsi = '';
    ratingState.penilaian_pelayanan = '';

    const deskripsiInput = document.getElementById('deskripsiRating');
    if (deskripsiInput) deskripsiInput.value = '';
    
    // Reset Stars
    const starButtons = document.querySelectorAll('.star-btn');
    starButtons.forEach(s => s.classList.remove('selected'));
    
    const badgeLabel = document.getElementById('ratingBadgeLabel');
    const badgeIcon = document.getElementById('ratingBadgeIcon');
    const badgeContainer = document.getElementById('ratingBadgeContainer');
    if (badgeLabel) badgeLabel.textContent = 'Sentuh Bintang Di Atas';
    if (badgeIcon) badgeIcon.textContent = '⭐';
    if (badgeContainer) badgeContainer.className = 'rating-label-badge';

    // Sembunyikan kembali kolom deskripsi
    const descriptionSection = document.getElementById('descriptionSection');
    if (descriptionSection) {
        descriptionSection.classList.remove('visible');
    }

    // Restore Views
    const successView = document.getElementById('successView');
    const mainFormView = document.getElementById('mainFormView');
    if (successView) successView.classList.remove('active');
    if (mainFormView) mainFormView.style.display = 'block';

    // Restore Modal Loading State
    const modalContent = document.getElementById('modalContentBody');
    const loadingState = document.getElementById('modalLoadingState');
    if (modalContent) modalContent.classList.remove('d-none');
    if (loadingState) loadingState.classList.add('d-none');

    hideValidationError();
}
