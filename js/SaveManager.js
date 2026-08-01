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
    static GAME_VERSION = '1.2';

    constructor() {
        this.data = {
            unlockedLevel: 0,
            bestTimes: {},
            bestTotal: null,
            totalCrumbs: 0,
            // In-memory only (not saved to prevent memory leaks)
            ghosts: {},
            seenMechanicToasts: [],
            hintsShown: {},
            achievements: [],
            settings: {
                sfxVolume: 0.8,
                screenShake: true,
                assistMode: false
            }
        };
        this.load();
    }

    load() {
        try {
            const rawVersion = localStorage.getItem('gameVersion');
            if (rawVersion !== SaveManager.GAME_VERSION) {
                // Clear cache on version mismatch, keeping only the bestTimes safely if possible
                let preservedTimes = {};
                try {
                    const oldData = JSON.parse(localStorage.getItem(SaveManager.STORAGE_KEY) || '{}');
                    if (oldData.bestTimes) preservedTimes = oldData.bestTimes;
                } catch (e) {}
                
                localStorage.clear();
                localStorage.setItem('gameVersion', SaveManager.GAME_VERSION);
                this.data.bestTimes = preservedTimes;
                this.save();
                return;
            }

            const raw = localStorage.getItem(SaveManager.STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw);
                this.data.unlockedLevel = typeof saved.unlockedLevel === 'number' ? saved.unlockedLevel : Math.max(...(saved.unlocked || [0]));
                this.data.bestTimes = saved.bestTimes || {};
                this.data.bestTotal = typeof saved.bestTotal === 'number' ? saved.bestTotal : null;
                this.data.totalCrumbs = saved.totalCrumbs || 0;
                this.data.seenMechanicToasts = saved.seenMechanicToasts || [];
                this.data.hintsShown = saved.hintsShown || {};
                this.data.achievements = saved.achievements || [];
                if (saved.settings) {
                    this.data.settings = Object.assign({}, this.data.settings, saved.settings);
                }
            }
        } catch (e) { /* localStorage unavailable — use in-memory defaults */ }
    }

    save() {
        try {
            // ONLY save lightweight primitives to prevent cache bug (ghosts stay in-memory)
            const payload = {
                unlockedLevel: this.data.unlockedLevel,
                bestTimes: this.data.bestTimes,
                bestTotal: this.data.bestTotal,
                totalCrumbs: this.data.totalCrumbs,
                seenMechanicToasts: this.data.seenMechanicToasts,
                hintsShown: this.data.hintsShown,
                achievements: this.data.achievements,
                settings: this.data.settings
            };
            localStorage.setItem(SaveManager.STORAGE_KEY, JSON.stringify(payload));
        } catch (e) { /* localStorage unavailable — ignore */ }
    }

    // --- Unlocked levels ------------------------------------------------

    isLevelUnlocked(index) {
        return index <= this.data.unlockedLevel;
    }

    unlockLevel(index) {
        if (index > this.data.unlockedLevel) {
            this.data.unlockedLevel = index;
            this.save();
        }
    }

    getUnlockedLevels() {
        const levels = [];
        for (let i = 0; i <= this.data.unlockedLevel; i++) {
            levels.push(i);
        }
        return levels;
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

    getMedal(index, parTime) {
        const best = this.getBestTime(index);
        if (best === null || !parTime) return null;
        if (best <= parTime) return 'gold';
        if (best <= parTime * 1.5) return 'silver';
        if (best <= parTime * 2.2) return 'bronze';
        return null;
    }

    getMedalGlyph(index, levelManager) {
        if (!levelManager || !levelManager.parTimes) return '';
        const parTime = levelManager.parTimes[index];
        const tier = this.getMedal(index, parTime);
        return { gold: '🥇', silver: '🥈', bronze: '🥉' }[tier] || '';
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

    // --- Ghost replays ------------------------------------------------------

    getGhost(index) {
        return this.data.ghosts[index] !== undefined ? this.data.ghosts[index] : null;
    }

    setGhost(index, points) {
        if (!points || points.length === 0) return;
        this.data.ghosts[index] = points;
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

    getAssistMode() {
        return !!this.data.settings.assistMode;
    }

    setAssistMode(enabled) {
        this.data.settings.assistMode = !!enabled;
        this.save();
    }

    // --- Mechanic Toasts ---------------------------------------------------

    hasSeenMechanicToast(levelIndex) {
        if (!this.data.seenMechanicToasts) this.data.seenMechanicToasts = [];
        return this.data.seenMechanicToasts.indexOf(levelIndex) !== -1;
    }

    markMechanicToastSeen(levelIndex) {
        if (!this.data.seenMechanicToasts) this.data.seenMechanicToasts = [];
        if (this.data.seenMechanicToasts.indexOf(levelIndex) === -1) {
            this.data.seenMechanicToasts.push(levelIndex);
            this.save();
        }
    }

    // --- Hints ------------------------------------------------------------

    hasSeenHint(key) {
        if (!this.data.hintsShown) this.data.hintsShown = {};
        return !!this.data.hintsShown[key];
    }

    markHintSeen(key) {
        if (!this.data.hintsShown) this.data.hintsShown = {};
        this.data.hintsShown[key] = true;
        this.save();
    }

    // --- Achievements ------------------------------------------------------

    hasAchievement(id) {
        if (!this.data.achievements) this.data.achievements = [];
        return this.data.achievements.indexOf(id) !== -1;
    }

    unlockAchievement(id) {
        if (!this.data.achievements) this.data.achievements = [];
        if (this.data.achievements.indexOf(id) === -1) {
            this.data.achievements.push(id);
            this.save();
        }
    }

    // --- Records ------------------------------------------------------------

    resetRunRecords() {
        this.data.bestTimes = {};
        this.data.bestTotal = null;
        this.data.totalCrumbs = 0;
        this.data.ghosts = {};
        this.data.unlockedLevel = 0;
        this.save();
    }
}
