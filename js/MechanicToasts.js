const MECHANIC_INTROS = {
    5: "GRAVITY FLIP: now limited to once per jump!",
    10: "WARNING: crumbling platforms & moving lasers ahead!",
    13: "CAUTION: some golden crumbs are not what they seem...",
    14: "INCOMING: invisible trap triggers!",
    15: "TRUST NO ONE: fake crumbs everywhere!",
    16: "WARNING: spike rain & trap triggers!",
    17: "WARNING: crumbling guillotines & hidden spikes!",
    18: "LAST LAUGH: gravity zones + troll traps!",
    19: "WARNING: FINAL BOSS INCOMING!"
};

class MechanicToasts {
    constructor(game) {
        this.game = game;
        this.toastEl = document.getElementById('mechanic-toast');
        this.timer = 0;
    }

    checkAndShow(levelIndex) {
        if (!this.toastEl) return;
        const text = MECHANIC_INTROS[levelIndex];
        if (!text) return;

        if (this.game.save.hasSeenMechanicToast(levelIndex)) return;

        this.game.save.markMechanicToastSeen(levelIndex);
        this.show(text);
    }

    show(text) {
        if (!this.toastEl) return;
        this.toastEl.innerText = text;
        this.toastEl.classList.remove('hidden');
        this.toastEl.classList.remove('toast-out');
        this.toastEl.classList.add('toast-in');

        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.toastEl.classList.remove('toast-in');
            this.toastEl.classList.add('toast-out');
            setTimeout(() => {
                this.toastEl.classList.add('hidden');
            }, 300);
        }, 2800);
    }
}
