/**
 * ============================================================================
 * RATING CONTROLLER (HIDDEN CONTROLLER & ANTI-SPAM PROTECTION)
 * Handles submission validation, honeypot traps, cooldown rate limiting,
 * and timestamp injection.
 * ============================================================================
 */

const RatingController = {
    // Cooldown duration in milliseconds (5 seconds)
    SUBMIT_COOLDOWN_MS: 5000,

    /**
     * Submit rating payload with Anti-Spam and Timestamp checks
     * @param {Object} ratingData Payload containing rating_bintang, keterangan_rating, deskripsi, penilaian_pelayanan
     * @returns {Promise<{success: boolean, message: string, isSpam?: boolean, isDemo?: boolean, data?: any}>}
     */
    async processSubmission(ratingData) {
        // 1. Anti-Spam Check: Honeypot Trap
        const honeypotVal = document.getElementById('website_hp')?.value || '';
        if (honeypotVal.trim() !== '') {
            console.warn('⚠️ Anti-Spam Triggered: Honeypot field filled.');
            return {
                success: false,
                isSpam: true,
                message: 'Akses ditolak (Spam).'
            };
        }

        // 2. Anti-Spam Check: Cooldown Rate Limiting (Minimum 5s between submissions)
        const lastSubmit = parseInt(localStorage.getItem('pln_last_submit_time') || '0', 10);
        const now = Date.now();
        if (now - lastSubmit < this.SUBMIT_COOLDOWN_MS) {
            const remainingSec = Math.ceil((this.SUBMIT_COOLDOWN_MS - (now - lastSubmit)) / 1000);
            console.warn(`⚠️ Anti-Spam Cooldown Active. Wait ${remainingSec}s.`);
            return {
                success: false,
                isSpam: true,
                message: `Harap tunggu ${remainingSec} detik sebelum mengirim penilaian lagi.`
            };
        }

        // Record submission timestamp for cooldown
        localStorage.setItem('pln_last_submit_time', now.toString());

        // 3. Inject ISO Timestamp & Unit Meta
        const sanitizedPayload = {
            rating_bintang: parseInt(ratingData.rating_bintang, 10) || 0,
            keterangan_rating: ratingData.keterangan_rating || '',
            deskripsi: (ratingData.deskripsi || '').trim(),
            penilaian_pelayanan: ratingData.penilaian_pelayanan || '',
            unit_pelayanan: 'PLN ULP Karebosi',
            created_at: new Date().toISOString()
        };

        // 4. Delegate to Storage Provider (Supabase or Local Storage)
        if (typeof saveRatingData === 'function') {
            return await saveRatingData(sanitizedPayload);
        } else {
            console.error('❌ Storage provider unavailable.');
            return {
                success: false,
                message: 'Gagal mengirim data. Provider penyimpanan tidak tersedia.'
            };
        }
    }
};

// Make available globally
window.RatingController = RatingController;
