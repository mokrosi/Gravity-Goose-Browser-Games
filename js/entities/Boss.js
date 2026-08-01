/*
 * Boss — Level 20 "Mecha-Alien" overlord.
 *
 * Hovers on the right side of the single-screen arena, bobbing up and down.
 * Every ~1.5s it charges a horizontal laser cannon aimed at the goose's
 * current altitude and sweeps the beam across the arena. The beam is a
 * deadly AABB (dodgeable with gravity flips and blink).
 *
 * The boss cannot be hurt directly: the goose must press all 4 overload
 * switches ('S') in the four corners of the arena. Each switch triggers
 * `hit()`, and the fourth calls `defeat()` which plays a short dying
 * animation before the game declares Final Victory.
 */
class Boss extends Entity {
    // Full attack cycle ≈ 1.5s: idle → telegraph → firing → cooldown.
    static IDLE_TIME = 0.5;
    static TELEGRAPH_TIME = 0.35;
    static FIRE_TIME = 0.3;
    static COOLDOWN_TIME = 0.35;
    static DEATH_TIME = 1.8;
    static SWITCHES_NEEDED = 4;

    constructor(x, y, arenaHeight) {
        super(x, y, 96, 84);
        this.arenaHeight = arenaHeight;
        this.state = 'idle';      // idle | telegraph | firing | cooldown | dead
        this.timer = Boss.IDLE_TIME;
        this.hits = 0;
        this.flashTimer = 0;      // white hit-flash
        this.wobble = Math.random() * Math.PI * 2;
        // Vertical hover band: keeps the boss inside the arena.
        this.hoverBase = Math.max(96, Math.min(this.arenaHeight - 170, this.y));
        this.hoverRange = Math.max(50, Math.min(140, this.arenaHeight / 4));
        // Y-coordinate the laser is aimed at (locked when the telegraph starts).
        this.aimY = this.hoverBase;
    }

    get isDefeated() {
        return this.state === 'dead';
    }

    // Deadly AABB while firing: a horizontal beam from the left wall to the
    // cannon, at the height the goose stood when the shot was charged.
    firingBeam(levelWidth) {
        if (this.state !== 'firing') return null;
        const right = this.x - 12;
        if (right <= 0) return null;
        return { x: 0, y: this.aimY - 5, width: right, height: 10 };
    }

    // One overload switch was hit — the boss shudders and flashes.
    hit() {
        this.hits++;
        this.flashTimer = 0.25;
        this.timer = Math.min(this.timer, Boss.COOLDOWN_TIME);
    }

    // All four switches overloaded — enter the death sequence.
    defeat() {
        this.state = 'dead';
        this.timer = Boss.DEATH_TIME;
    }

    update(dt, level, player) {
        this.wobble += dt * 2.2;
        this.flashTimer = Math.max(0, this.flashTimer - dt);

        if (this.state === 'dead') {
            this.timer -= dt;
            return;
        }

        // Hover: gentle sine bob up and down on the right side of the arena.
        this.y = this.hoverBase + Math.sin(this.wobble) * this.hoverRange;

        this.timer -= dt;
        if (this.timer <= 0) {
            if (this.state === 'idle') {
                this.state = 'telegraph';
                this.timer = Boss.TELEGRAPH_TIME;
                // Lock the aim to the goose's altitude as the shot charges.
                const target = player ? player.y + player.height / 2 : this.arenaHeight / 2;
                this.aimY = Math.max(20, Math.min(this.arenaHeight - 20, target));
            } else if (this.state === 'telegraph') {
                this.state = 'firing';
                this.timer = Boss.FIRE_TIME;
            } else if (this.state === 'firing') {
                this.state = 'cooldown';
                this.timer = Boss.COOLDOWN_TIME;
            } else {
                this.state = 'idle';
                this.timer = Boss.IDLE_TIME;
            }
        }
    }

    draw(ctx, camera, assetManager, level) {
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;
        const firing = this.state === 'firing';
        const telegraph = this.state === 'telegraph';
        const dying = this.state === 'dead';

        // Laser beam (drawn behind everything: from the left wall to the cannon).
        if (firing || telegraph) {
            this._drawLaser(ctx, camera, level);
        }

        if (dx + this.width < 0 || dx > camera.width || dy + this.height < 0 || dy > camera.height) return;

        const shake = dying
            ? (Math.random() * 8 - 4) * Math.max(0, this.timer / Boss.DEATH_TIME)
            : 0;
        const bx = dx + shake;
        const by = dy + shake;
        const flash = this.flashTimer > 0;
        const hullColor = flash ? '#ffffff' : (dying ? '#3f3f46' : '#1e1b4b');
        const accentColor = flash ? '#fecdd3' : (dying ? '#52525b' : '#312e81');

        ctx.save();
        ctx.globalAlpha = dying ? Math.max(0.15, this.timer / Boss.DEATH_TIME) : 1;

        // Thruster glow under the hull (pulses as it hovers).
        const thruster = 0.5 + 0.5 * Math.sin(this.wobble * 3);
        ctx.globalAlpha = ctx.globalAlpha * (0.45 + 0.4 * thruster);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(bx + 24, by + this.height - 2);
        ctx.lineTo(bx + 72, by + this.height - 2);
        ctx.lineTo(bx + 48, by + this.height + 14 + 10 * thruster);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = dying ? Math.max(0.15, this.timer / Boss.DEATH_TIME) : 1;

        // Rear stabilizer fins.
        ctx.fillStyle = accentColor;
        ctx.fillRect(bx + 4, by + 18, 12, 34);
        ctx.fillRect(bx + this.width - 16, by + 18, 12, 34);
        ctx.fillStyle = flash ? '#fecdd3' : '#0ea5e9';
        ctx.fillRect(bx + 4, by + 22, 6, 26);
        ctx.fillRect(bx + this.width - 10, by + 22, 6, 26);

        // Armored hull (trapezoid-ish block).
        ctx.fillStyle = hullColor;
        ctx.fillRect(bx + 8, by + 12, this.width - 16, this.height - 26);
        ctx.fillStyle = accentColor;
        ctx.fillRect(bx + 14, by + 18, this.width - 28, this.height - 38);
        // Chest plate + core: the core grows & reddens as switches are hit.
        ctx.fillStyle = flash ? '#fda4af' : (this.hits >= Boss.SWITCHES_NEEDED ? '#ffffff' : '#22d3ee');
        ctx.beginPath();
        ctx.arc(bx + this.width / 2, by + 46, 9 + this.hits * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = flash ? '#fecdd3' : '#0e7490';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Head with the eye slit (flares red while charging / firing).
        ctx.fillStyle = hullColor;
        ctx.fillRect(bx + 20, by, this.width - 40, 16);
        const eyeColor = (firing || telegraph || dying)
            ? '#f43f5e'
            : (flash ? '#ffffff' : '#facc15');
        ctx.fillStyle = eyeColor;
        ctx.fillRect(bx + 28, by + 4, this.width - 56, 7);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(bx + 34, by + 6, this.width - 68, 3);
        // Antenna.
        ctx.fillStyle = flash ? '#fecdd3' : '#facc15';
        ctx.fillRect(bx + this.width / 2 - 2, by - 10, 4, 10);
        ctx.fillRect(bx + this.width / 2 - 6, by - 16, 12, 6);

        // Laser cannon arm (front-left, pointing at the goose).
        ctx.fillStyle = accentColor;
        ctx.fillRect(bx - 14, by + 26, 20, 12);
        ctx.fillStyle = (firing || telegraph) ? '#f43f5e' : (flash ? '#ffffff' : '#94a3b8');
        ctx.fillRect(bx - 20, by + 28, 10, 8);

        ctx.restore();
    }

    // Horizontal beam from the left wall to the cannon at aimY.
    _drawLaser(ctx, camera, level) {
        const levelWidth = level.width * Physics.TILE_SIZE;
        const right = this.x - camera.x - 12;
        const y = this.aimY - camera.y;
        const firing = this.state === 'firing';
        const flicker = firing ? 1 : 0.35 + 0.35 * Math.abs(Math.sin(this.wobble * 6));
        const width = right;

        ctx.save();
        ctx.globalAlpha = (firing ? 0.55 : 0.12) * flicker;
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(0, y - 3, width, 12);
        ctx.globalAlpha = (firing ? 1 : 0.35) * flicker;
        ctx.fillStyle = '#fecdd3';
        ctx.fillRect(0, y + 1, width, 4);
        ctx.restore();
    }
}
