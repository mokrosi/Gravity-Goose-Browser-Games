class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.vx = 60; // Patrol speed
        this.gravity = 900;
        this.onGround = false;
        this.onCeiling = false;
    }

    update(dt, level) {
        if (this.isDead) return;

        // Apply gravity (dt-scaled)
        this.vy += this.gravity * dt;
        this.vy = Math.max(-800, Math.min(800, this.vy));

        let oldVx = this.vx;

        Physics.resolveX(this, level, dt);
        Physics.resolveY(this, level, dt);
        Physics.enforceBounds(this, level);

        // Turn around on hitting a solid wall
        if (this.vx === 0 && oldVx !== 0) {
            this.vx = -oldVx;
        }
    }

    draw(ctx, camera, assetManager, theme) {
        if (this.isDead) return;

        const img = assetManager.getImage(theme === 'kitchen' ? 'enemy_bug' : 'enemy_frog');
        if (img) {
            ctx.save();
            let drawX = this.x - camera.x;
            let drawY = this.y - camera.y;

            if (this.vx < 0) {
                ctx.translate(drawX + this.width + 2, drawY - 2);
                ctx.scale(-1, 1);
                ctx.drawImage(img, 0, 0, 32, 32);
            } else {
                ctx.drawImage(img, drawX - 2, drawY - 2, 32, 32);
            }
            ctx.restore();
        }
    }
}
