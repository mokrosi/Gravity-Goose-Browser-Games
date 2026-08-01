const ACHIEVEMENTS_LIST = [
    { id: 'firstStep', title: 'First Step', desc: 'Complete Level 1', icon: '🚀' },
    { id: 'breadWinner', title: 'Bread Winner', desc: 'Collect 50 Golden Breadcrumbs', icon: '🍞' },
    { id: 'speedDemon', title: 'Speed Demon', desc: 'Earn a Gold Medal on any level', icon: '⚡' },
    { id: 'grandChampion', title: 'Grand Champion', desc: 'Clear Level 20 & Defeat Boss', icon: '🏆' },
    { id: 'world4Completionist', title: 'World 4 Completionist', desc: 'Earn Gold Medals on first 20 levels', icon: '🌟' },
    { id: 'culinaryConqueror', title: 'Culinary Conqueror', desc: 'Clear Level 30 & Defeat Mittens', icon: '🐈' },
    { id: 'trueCompletionist', title: 'True Completionist', desc: 'Earn Gold Medals on all 30 levels', icon: '👑' }
];

class AchievementsManager {
    constructor(game) {
        this.game = game;
        this.list = ACHIEVEMENTS_LIST;
    }

    checkAll() {
        const save = this.game.save;
        const levelMgr = this.game.levelManager;

        // 1. First Step
        if (save.isLevelUnlocked(1)) {
            this.unlock('firstStep');
        }

        // 2. Bread Winner
        if (save.getTotalCrumbs() >= 50) {
            this.unlock('breadWinner');
        }

        // 3. Speed Demon
        for (let i = 0; i < levelMgr.levels.length; i++) {
            if (save.getMedal(i, levelMgr.parTimes[i]) === 'gold') {
                this.unlock('speedDemon');
                break;
            }
        }

        // 4. Grand Champion
        if (save.isLevelUnlocked(20) || save.getBestTime(19) !== null) {
            this.unlock('grandChampion');
        }

        // 5. World 4 Completionist
        let goldCountW4 = 0;
        for (let i = 0; i < 20; i++) {
            if (save.getMedal(i, levelMgr.parTimes[i]) === 'gold') {
                goldCountW4++;
            }
        }
        if (goldCountW4 >= 20) {
            this.unlock('world4Completionist');
        }

        // 6. Culinary Conqueror
        if (save.isLevelUnlocked(30) || save.getBestTime(29) !== null) {
            this.unlock('culinaryConqueror');
        }

        // 7. True Completionist
        let goldCountAll = 0;
        for (let i = 0; i < 30; i++) {
            if (save.getMedal(i, levelMgr.parTimes[i]) === 'gold') {
                goldCountAll++;
            }
        }
        if (goldCountAll >= 30) {
            this.unlock('trueCompletionist');
        }
    }

    unlock(id) {
        if (this.game.save.hasAchievement(id)) return;
        this.game.save.unlockAchievement(id);
        const ach = this.list.find(a => a.id === id);
        if (ach) {
            this.game.spawnFloatText(`${ach.icon} UNLOCKED: ${ach.title}!`, this.game.canvas.width / 2, 80, 'perfect');
            this.game.soundManager.playBest();
        }
    }

    renderModal() {
        const container = document.getElementById('achievements-list');
        if (!container) return;
        container.innerHTML = '';

        for (let ach of this.list) {
            const unlocked = this.game.save.hasAchievement(ach.id);
            const card = document.createElement('div');
            card.className = 'achievement-card' + (unlocked ? ' unlocked' : ' locked');
            card.innerHTML = `
                <div class="ach-icon">${unlocked ? ach.icon : '🔒'}</div>
                <div class="ach-info">
                    <div class="ach-title">${ach.title}</div>
                    <div class="ach-desc">${ach.desc}</div>
                </div>
                <div class="ach-status">${unlocked ? 'UNLOCKED' : 'LOCKED'}</div>
            `;
            container.appendChild(card);
        }
    }
}
