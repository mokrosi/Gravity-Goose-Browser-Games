/*
 * Laser — moving deadly beam (Levels 11-14).
 *
 * A laser is a dangerous AABB that patrols along one axis. `axis` is the
 * movement axis: 'x' sweeps the beam sideways, 'y' sweeps it up and down.
 * `min`/`max` bound the moving edge so the beam always stays inside the
 * play area. Contact kills the goose (forgiving shrink applies; blink
 * i-frames protect).
 */
class Laser extends Entity {
    constructor(x, y, width, height, axis, min, max, speed) {
        super(x, y, width, height);
        this.axis = axis;          // 'x' or 'y' — movement axis
        this.min = min;
        this.max = max;
        this.speed = speed;
        this.dir = 1;
        this.phase = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.phase += dt * 6;

        if (this.axis === 'y') {
            let y = this.y + this.dir * this.speed * dt;
            if (y < this.min) { y = this.min; this.dir = 1; }
            if (y + this.height > this.max) { y = this.max - this.height; this.dir = -1; }
            this.y = y;
        } else {
            let x = this.x + this.dir * this.speed * dt;
            if (x < this.min) { x = this.min; this.dir = 1; }
            if (x + this.width > this.max) { x = this.max - this.width; this.dir = -1; }
            this.x = x;
        }
    }

    draw(ctx, camera, assetManager) {
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;
        if (dx + this.width < 0 || dx > camera.width || dy + this.height < 0 || dy > camera.height) return;

        const pulse = 0.5 + 0.5 * Math.sin(this.phase);

        ctx.save();
        // Outer glow
        ctx.globalAlpha = 0.22 + 0.18 * pulse;
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(dx - 6, dy - 6, this.width + 12, this.height + 12);
        // Beam body
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(dx, dy, this.width, this.height);
        // Bright core
        ctx.fillStyle = '#ffe4e6';
        if (this.axis === 'y') {
            ctx.fillRect(dx, dy + 2, this.width, this.height - 4);
        } else {
            ctx.fillRect(dx + 2, dy, this.width - 4, this.height);
        }
        ctx.restore();
    }
}
