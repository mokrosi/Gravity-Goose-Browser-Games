/*
 * VictoryCinematic — pixel-art celebration shown on the Final Victory screen.
 *
 * The victorious goose slides the stolen sandwich in from the right, takes
 * five chomps (crumb particles fly), swallows with a squash, then basks in
 * heart sparkles while the player reads their final stats. One 4.4s cycle,
 * looped, driven by requestAnimationFrame (started/stopped by Game.js).
 */
class VictoryCinematic {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.running = false;
        this.raf = 0;
        this.startTime = 0;
        this.lastT = 0;
        this.goose = SpriteGenerator.generatePlayerSprite();
        this.bread = SpriteGenerator.generateBreadSprite();
        this.crumbs = [];
        this.sparkles = [];
        this.biteCount = 0;
        this.heartCount = 0;
        this.stars = [];
        for (let i = 0; i < 22; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * 70,
                size: Math.random() > 0.8 ? 2 : 1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    start() {
        if (!this.ctx || this.running) return;
        this.running = true;
        this.startTime = performance.now();
        this.lastT = this.startTime;
        this.crumbs = [];
        this.sparkles = [];
        this.biteCount = 0;
        this.heartCount = 0;
        const tick = (t) => {
            if (!this.running) return;
            const dt = Math.min(0.05, Math.max(0, (t - this.lastT) / 1000));
            this.lastT = t;
            this.frame(t, dt);
            this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
    }

    stop() {
        this.running = false;
        if (this.raf) cancelAnimationFrame(this.raf);
        this.raf = 0;
    }

    frame(t, dt) {
        const W = this.canvas.width;
        const H = this.canvas.height;
        const ctx = this.ctx;
        const c = ((t - this.startTime) / 1000) % 4.4; // one 4.4s cycle

        // --- Backdrop: deep space gradient + twinkling stars ---
        ctx.clearRect(0, 0, W, H);
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0b0118');
        grad.addColorStop(1, '#1b1035');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        for (const s of this.stars) {
            ctx.globalAlpha = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(t / 500 + s.phase));
            ctx.fillStyle = '#e9d5ff';
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;

        // --- Floor + neon edge ---
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 148, W, H - 148);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(0, 148, W, 2);

        // --- Goose (2x scale, faces right) ---
        const gooseX = 92;
        const gooseY = 110;
        const bob = Math.sin(c * 3.1) * 3;
        let gooseRot = 0;
        let sy = 1;
        let sx = 1;

        if (c > 1.1 && c < 2.55) {
            // Chewing: quick wobble
            gooseRot = Math.sin(c * 16) * 0.04;
        }
        if (c > 2.55 && c < 2.85) {
            // Swallow: brief squash
            const k = (c - 2.55) / 0.3;
            sy = 1 - 0.25 * Math.sin(Math.PI * k);
            sx = 1 + 0.18 * Math.sin(Math.PI * k);
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(gooseX, 160, 34, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(gooseX, gooseY + bob);
        ctx.rotate(gooseRot);
        ctx.scale(sx, sy);
        ctx.drawImage(this.goose, -32, -32, 64, 64);
        ctx.restore();

        // --- Sandwich: slide in, bite, shrink to nothing ---
        const beakX = gooseX + 30;
        const beakY = gooseY + bob - 12;
        let breadX = beakX;
        let breadY = beakY;
        let breadScale = 1.5;

        if (c < 1.1) {
            // Ease-out slide from the right edge of the canvas
            const k = 1 - Math.pow(1 - Math.min(1, c / 1.1), 2);
            breadX = 240 + (beakX - 240) * k;
            breadY = beakY + Math.sin(c * 6) * 2 - 8;
        } else if (c < 2.55) {
            // Five chomps; every chomp spits out breadcrumbs
            const biteProgress = Math.min(1, (c - 1.1) / 1.45);
            const bites = Math.floor(biteProgress * 5) + 1;
            if (bites > this.biteCount) {
                this.biteCount = bites;
                for (let i = 0; i < 8; i++) {
                    this.crumbs.push({
                        x: beakX + 14 + Math.random() * 10,
                        y: beakY + Math.random() * 6,
                        vx: (Math.random() - 0.5) * 90,
                        vy: -20 - Math.random() * 60,
                        life: 0.5 + Math.random() * 0.3,
                        maxLife: 0.8
                    });
                }
            }
            breadScale = 1.5 * (1 - 0.85 * biteProgress);
        } else {
            // Swallowed
            breadScale = 0.12;
        }

        if (breadScale > 0.05) {
            ctx.save();
            ctx.translate(breadX + 12, breadY + 14);
            ctx.rotate(Math.sin(c * 5) * 0.15);
            ctx.scale(breadScale, breadScale);
            ctx.drawImage(this.bread, -16, -16, 32, 32);
            ctx.restore();
        }

        // --- Happy hearts + sparkles after the swallow ---
        if (c > 2.9) {
            const k = Math.floor((c - 2.9) / 0.45) + 1;
            if (k > this.heartCount) {
                this.heartCount = k;
                for (let i = 0; i < 4; i++) {
                    this.sparkles.push({
                        x: beakX + 20 + Math.random() * 30,
                        y: gooseY - 24,
                        vx: 10 + Math.random() * 25,
                        vy: -40 - Math.random() * 30,
                        life: 0.7,
                        color: Math.random() > 0.5 ? '#f472b6' : '#facc15'
                    });
                }
            }
        }

        // --- Crumb & sparkle physics ---
        for (let i = this.crumbs.length - 1; i >= 0; i--) {
            const p = this.crumbs[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 320 * dt;
            p.life -= dt;
            if (p.life <= 0) { this.crumbs.splice(i, 1); continue; }
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = '#b45309';
            ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        }
        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const p = this.sparkles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) { this.sparkles.splice(i, 1); continue; }
            ctx.globalAlpha = Math.max(0, p.life / 0.7);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
    }
}
