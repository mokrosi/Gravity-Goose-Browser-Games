/*
 * SaveManager — thin, crash-proof wrapper around browser localStorage.
 *
 * Persists everything the player should keep across sessions:
 *   - unlocked levels (level indices)
 *   - best speedrun time per level + best total run time
 *   - lifetime "Golden Breadcrumbs" collected (for the 100% badge)
 *   - settings (SFX volume, screen shake toggle)
 *
 * Every read/write is wrapped in try/catch so the game keeps working even
 * when localStorage is unavailable (private mode, file://, sandboxed iframe).
 */
class SaveManager {
    static STORAGE_KEY = 'gravityGoose.save';

    constructor() {
        this.data = {
            unlocked: [0],        // level indices the player can pick from the level select
            bestTimes: {},        // { [levelIndex]: seconds }
            bestTotal: null,      // seconds, or null if no run finished yet
            totalCrumbs: 0,       // lifetime golden breadcrumbs collected
            settings: {
                sfxVolume: 0.8,   // 0..1 master volume
                screenShake: true // accessibility: disable motion-heavy shake
            }
        };
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(SaveManager.STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                this.data = Object.assign({}, this.data, saved);
                this.data.settings = Object.assign({}, this.data.settings, (saved && saved.settings) || {});
            }
        } catch (e) { /* localStorage unavailable — use in-memory defaults */ }
    }

    save() {
        try {
            localStorage.setItem(SaveManager.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) { /* localStorage unavailable — ignore */ }
    }

    // --- Unlocked levels ------------------------------------------------

    isLevelUnlocked(index) {
        return this.data.unlocked.indexOf(index) !== -1;
    }

    unlockLevel(index) {
        if (this.data.unlocked.indexOf(index) === -1) {
            this.data.unlocked.push(index);
            this.data.unlocked.sort((a, b) => a - b);
            this.save();
        }
    }

    getUnlockedLevels() {
        return this.data.unlocked.slice();
    }

    // --- Best times ------------------------------------------------------

    getBestTime(index) {
        return this.data.bestTimes[index] !== undefined ? this.data.bestTimes[index] : null;
    }

    // Returns true if `time` is a new record (and it was saved).
    setBestTime(index, time) {
        const best = this.getBestTime(index);
        if (best === null || time < best) {
            this.data.bestTimes[index] = time;
            this.save();
            return true;
        }
        return false;
    }

    getBestTotal() {
        return this.data.bestTotal;
    }

    setBestTotal(time) {
        if (this.data.bestTotal === null || time < this.data.bestTotal) {
            this.data.bestTotal = time;
            this.save();
            return true;
        }
        return false;
    }

    // --- Lifetime golden breadcrumbs -------------------------------------

    getTotalCrumbs() {
        return this.data.totalCrumbs;
    }

    addCrumb() {
        this.data.totalCrumbs++;
        this.save();
    }

    // --- Settings ----------------------------------------------------------

    getSfxVolume() {
        return this.data.settings.sfxVolume;
    }

    setSfxVolume(volume) {
        this.data.settings.sfxVolume = Math.max(0, Math.min(1, volume));
        this.save();
    }

    getScreenShake() {
        return this.data.settings.screenShake;
    }

    setScreenShake(enabled) {
        this.data.settings.screenShake = !!enabled;
        this.save();
    }

    // --- Records ------------------------------------------------------------

    resetRunRecords() {
        this.data.bestTimes = {};
        this.data.bestTotal = null;
        this.data.totalCrumbs = 0;
        this.data.unlocked = [0];
        this.save();
    }
}
