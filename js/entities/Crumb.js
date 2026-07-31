class Crumb extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.collected = false;
        this.twinkle = Math.random() * Math.PI * 2;
    }

    update(dt) {
        if (this.collected) return;
        this.twinkle += dt * 6;
    }

    draw(ctx, camera, assetManager) {
        if (this.collected) return;
        const img = assetManager.getImage('crumb');
        if (!img) return;

        const cx = this.x + this.width / 2 - camera.x;
        const cy = this.y + this.height / 2 - camera.y;
        const glow = 0.5 + Math.sin(this.twinkle) * 0.25;

        ctx.save();
        ctx.globalAlpha = 0.3 * glow;
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(cx, cy, 13 + Math.sin(this.twinkle) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.drawImage(img, this.x - camera.x - 6, this.y - camera.y - 6, 32, 32);
    }
}
