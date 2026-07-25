/**
 * ============================================================================
 * ADMIN CONTROLLER (HIDDEN CONTROLLER FOR ADMIN PORTAL)
 * Handles session state, authentication validation, metrics aggregation,
 * and data filtering logic.
 * ============================================================================
 */

const AdminController = {
    ADMIN_USER: 'admin',
    ADMIN_PASS: 'pln123',

    /**
     * Verify Admin Credentials
     */
    authenticate(username, password) {
        if (username.trim() === this.ADMIN_USER && password.trim() === this.ADMIN_PASS) {
            sessionStorage.setItem('pln_admin_logged', 'true');
            return true;
        }
        return false;
    },

    /**
     * Check if currently logged in
     */
    isAuthenticated() {
        return sessionStorage.getItem('pln_admin_logged') === 'true';
    },

    /**
     * Logout admin session
     */
    logout() {
        sessionStorage.removeItem('pln_admin_logged');
    },

    /**
     * Calculate Metrics & Analytics from Rating Records
     * @param {Array} records Array of rating objects
     */
    calculateMetrics(records = []) {
        const total = records.length;
        if (total === 0) {
            return {
                total: 0,
                avgScore: '0.0',
                satisfactionPct: 0,
                latestTimestamp: '-'
            };
        }

        const sumStars = records.reduce((acc, r) => acc + (parseInt(r.rating_bintang, 10) || 0), 0);
        const avgScore = (sumStars / total).toFixed(1);

        const satisfiedCount = records.filter(r => 
            r.penilaian_pelayanan === 'Sangat Baik' || r.penilaian_pelayanan === 'Cukup Baik'
        ).length;
        const satisfactionPct = Math.round((satisfiedCount / total) * 100);

        const latestTimestamp = records[0]?.created_at ? new Date(records[0].created_at) : null;

        return {
            total,
            avgScore,
            satisfactionPct,
            latestTimestamp
        };
    },

    /**
     * Filter Dataset by Search Query, Star Rating, and Date Range
     */
    filterRecords(records = [], { query = '', starVal = 'all', startDate = '', endDate = '' } = {}) {
        const q = query.toLowerCase().trim();

        return records.filter(item => {
            // Text Search Match
            const matchesQuery = !q || 
                (item.deskripsi && item.deskripsi.toLowerCase().includes(q)) ||
                (item.penilaian_pelayanan && item.penilaian_pelayanan.toLowerCase().includes(q)) ||
                (item.keterangan_rating && item.keterangan_rating.toLowerCase().includes(q));

            // Star Rating Match
            const matchesStar = starVal === 'all' || parseInt(item.rating_bintang, 10) === parseInt(starVal, 10);

            // Date Range Match
            let matchesDate = true;
            if (item.created_at) {
                const itemDate = new Date(item.created_at);
                if (startDate) {
                    const start = new Date(startDate + 'T00:00:00');
                    if (itemDate < start) matchesDate = false;
                }
                if (endDate) {
                    const end = new Date(endDate + 'T23:59:59');
                    if (itemDate > end) matchesDate = false;
                }
            }

            return matchesQuery && matchesStar && matchesDate;
        });
    }
};

window.AdminController = AdminController;
