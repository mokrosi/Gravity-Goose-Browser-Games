/*
 * Boss — Level 15 mecha-frog overlord.
 *
 * Stationary on the left of the boss arena, the boss cycles an attack pattern:
 * idle → telegraph → firing → cooldown → idle, alternating which half of the
 * arena it floods with a full-width laser beam. While "firing" the beam is a
 * deadly AABB the player must dodge by being in the OTHER half of the arena.
 *
 * The boss cannot be hurt directly: the goose must touch all 3 overload
 * switches on the right of the arena. Each switch triggers `hit()`, and the
 * third one calls `defeat()` which plays a short dying animation before the
 * game declares Final Victory.
 */
class Boss extends Entity {
    static IDLE_TIME = 1.1;
    static TELEGRAPH_TIME = 0.9;
    static FIRE_TIME = 1.5;
    static COOLDOWN_TIME = 0.7;
    static DEATH_TIME = 1.6;

    constructor(x, y, arenaHeight) {
        super(x, y, 96, 128);
        this.arenaHeight = arenaHeight;
        this.state = 'idle';      // idle | telegraph | firing | cooldown | dead
        this.timer = Boss.IDLE_TIME;
        this.side = 'top';        // which half fires next
        this.hits = 0;
        this.flashTimer = 0;      // white hit-flash
        this.wobble = Math.random() * Math.PI * 2;
    }

    get isDefeated() {
        return this.state === 'dead';
    }

    // Deadly AABB while firing, else null. The beam spans from the boss to
    // the right edge of the arena and covers the top or bottom half.
    firingBeam(levelWidth) {
        if (this.state !== 'firing') return null;
        const half = this.arenaHeight / 2;
        const x = this.x + this.width;
        const width = levelWidth - x;
        return this.side === 'top'
            ? { x, y: 0, width, height: half }
            : { x, y: half, width, height: this.arenaHeight - half };
    }

    // One overload switch was hit — the boss shudders and flashes.
    hit() {
        this.hits++;
        this.flashTimer = 0.25;
        this.timer = Math.min(this.timer, Boss.TELEGRAPH_TIME);
    }

    // All three switches overloaded — enter the death sequence.
    defeat() {
        this.state = 'dead';
        this.timer = Boss.DEATH_TIME;
    }

    update(dt, level) {
        this.wobble += dt * 2;
        this.flashTimer = Math.max(0, this.flashTimer - dt);

        if (this.state === 'dead') {
            this.timer -= dt;
            return;
        }

        this.timer -= dt;
        if (this.timer <= 0) {
            if (this.state === 'idle') {
                this.state = 'telegraph';
                this.timer = Boss.TELEGRAPH_TIME;
            } else if (this.state === 'telegraph') {
                this.state = 'firing';
                this.timer = Boss.FIRE_TIME;
            } else if (this.state === 'firing') {
                this.state = 'cooldown';
                this.timer = Boss.COOLDOWN_TIME;
                this.side = this.side === 'top' ? 'bottom' : 'top';
            } else {
                this.state = 'idle';
                this.timer = Boss.IDLE_TIME;
            }
        }
    }

    draw(ctx, camera, assetManager, level) {
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;

        // Full-width half-arena laser beam (telegraph flickers, firing is hot).
        if (this.state === 'telegraph' || this.state === 'firing') {
            this._drawBeam(ctx, camera, level);
        }

        if (dx + this.width < 0 || dx > camera.width || dy + this.height < 0 || dy > camera.height) return;

        const shake = this.state === 'dead'
            ? (Math.random() * 6 - 3) * Math.max(0, this.timer / Boss.DEATH_TIME)
            : 0;
        const bx = dx + shake;
        const by = dy + shake;
        const flash = this.flashTimer > 0;
        const dying = this.state === 'dead';
        const bodyColor = flash ? '#ffffff' : (dying ? '#3f3f46' : '#14532d');

        ctx.save();
        ctx.globalAlpha = dying ? Math.max(0.2, this.timer / Boss.DEATH_TIME) : 1;

        // Legs
        ctx.fillStyle = flash ? '#fecdd3' : '#065f46';
        ctx.fillRect(bx + 6, by + this.height - 24, 20, 24);
        ctx.fillRect(bx + this.width - 26, by + this.height - 24, 20, 24);

        // Armored torso
        ctx.fillStyle = bodyColor;
        ctx.fillRect(bx + 4, by + 30, this.width - 8, this.height - 40);
        ctx.fillStyle = flash ? '#fecdd3' : '#065f46';
        ctx.fillRect(bx + 10, by + 38, 22, 56);
        ctx.fillRect(bx + this.width - 32, by + 38, 22, 56);

        // Head
        ctx.fillStyle = bodyColor;
        ctx.fillRect(bx + 10, by, this.width - 20, 42);
        ctx.fillStyle = flash ? '#fecdd3' : '#166534';
        ctx.fillRect(bx + 14, by + 6, this.width - 28, 30);

        // Angry glowing eyes (flare while attacking / dying)
        const eyeColor = (this.state === 'firing' || this.state === 'telegraph' || dying)
            ? '#f43f5e'
            : (flash ? '#ffffff' : '#facc15');
        ctx.fillStyle = eyeColor;
        ctx.fillRect(bx + 18, by - 10, 20, 20);
        ctx.fillRect(bx + this.width - 38, by - 10, 20, 20);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(bx + 25, by - 6, 7, 7);
        ctx.fillRect(bx + this.width - 32, by - 6, 7, 7);

        // Antenna
        ctx.fillStyle = flash ? '#fecdd3' : '#a3e635';
        ctx.fillRect(bx + this.width / 2 - 2, by - 18, 4, 12);
        ctx.fillRect(bx + this.width / 2 - 7, by - 26, 14, 9);

        // Overload core — spins up as switches are hit
        ctx.fillStyle = this.hits >= 3 ? '#ffffff' : (flash ? '#fda4af' : '#f43f5e');
        ctx.beginPath();
        ctx.arc(bx + this.width / 2, by + 76, 13 + this.hits * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    _drawBeam(ctx, camera, level) {
        const levelWidth = level.width * Physics.TILE_SIZE;
        const half = this.arenaHeight / 2;
        const bx = this.x + this.width - camera.x;
        const bw = levelWidth - (this.x + this.width);
        const top = this.side === 'top';
        const by = top ? -camera.y : half - camera.y;
        const bh = top ? half : this.arenaHeight - half;
        const firing = this.state === 'firing';
        const flicker = firing ? 1 : 0.4 + 0.4 * Math.abs(Math.sin(this.wobble * 5));

        ctx.save();
        ctx.globalAlpha = (firing ? 0.7 : 0.15) * flicker;
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(bx, by, bw, bh);
        ctx.globalAlpha = firing ? 1 : 0.35 * flicker;
        ctx.fillStyle = '#fecdd3';
        if (top) {
            ctx.fillRect(bx, by + bh - 4, bw, 4);
        } else {
            ctx.fillRect(bx, by, bw, 4);
        }
        ctx.restore();
    }
}
