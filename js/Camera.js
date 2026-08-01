class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.width = canvasWidth;
        this.height = canvasHeight;
        // Lower = smoother / more lag. 0.12 gives a snappy-but-soft follow.
        this.smoothness = 0.12;
        // Lead the camera ahead based on horizontal velocity so the goose
        // can see obstacles before it runs into them.
        this.lookaheadTime = 0.18;   // seconds of velocity to lead
        this.lookaheadMax = 90;      // hard cap on the lead distance (px)
        // Level 20's single-screen boss arena: when true the camera is
        // permanently centered on the level, so nothing ever scrolls away.
        this.locked = false;
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    follow(target, levelWidth, levelHeight) {
        if (this.locked) {
            this._lockCenter(levelWidth, levelHeight);
            return;
        }

        const lead = target.vx * this.lookaheadTime;
        const leadClamped = Math.max(-this.lookaheadMax, Math.min(this.lookaheadMax, lead));

        const desiredX = target.x + target.width / 2 - this.width / 2 + leadClamped;
        const desiredY = target.y + target.height / 2 - this.height / 2;

        // Smoothly glide toward the target position instead of rigid lock.
        this.x = Camera.lerp(this.x, desiredX, this.smoothness);
        this.y = Camera.lerp(this.y, desiredY, this.smoothness);

        this._clamp(levelWidth, levelHeight);
    }

    // Stable vertical framing for boss fights to prevent vertical motion sickness on mobile screens.
    followBossArena(target, levelWidth, levelHeight) {
        if (this.locked) {
            this._lockCenter(levelWidth, levelHeight);
            return;
        }

        const lead = target.vx * this.lookaheadTime;
        const leadClamped = Math.max(-this.lookaheadMax, Math.min(this.lookaheadMax, lead));

        const desiredX = target.x + target.width / 2 - this.width / 2 + leadClamped;
        const desiredY = (levelHeight / 2) - (this.height / 2);

        this.x = Camera.lerp(this.x, desiredX, this.smoothness);
        this.y = Camera.lerp(this.y, desiredY, this.smoothness);

        this._clamp(levelWidth, levelHeight);
    }

    // Instantly center on a target (used on level load / respawn so the
    // camera doesn't sweep across the level).
    snap(target, levelWidth, levelHeight) {
        if (this.locked) {
            this._lockCenter(levelWidth, levelHeight);
            return;
        }
        this.x = target.x + target.width / 2 - this.width / 2;
        this.y = target.y + target.height / 2 - this.height / 2;
        this._clamp(levelWidth, levelHeight);
    }

    // Locked mode: pin the camera to the exact center of the level. Clamped
    // so small arenas (Level 20's 25x15) still fit the full viewport.
    _lockCenter(levelWidth, levelHeight) {
        this.x = (levelWidth - this.width) / 2;
        this.y = (levelHeight - this.height) / 2;
        this._clamp(levelWidth, levelHeight);
    }

    _clamp(levelWidth, levelHeight) {
        this.x = Math.max(0, Math.min(this.x, Math.max(0, levelWidth - this.width)));
        this.y = Math.max(0, Math.min(this.y, Math.max(0, levelHeight - this.height)));
    }
}
