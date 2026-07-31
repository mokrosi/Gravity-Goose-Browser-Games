const MECHANIC_INTROS = {
    5: "GRAVITY FLIP: now limited to once per jump!",
    10: "WARNING: crumbling platforms & moving lasers ahead!",
    14: "WARNING: BOSS INCOMING!"
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
