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

        // Apply gravity
        this.vy += this.gravity * dt;
        
        let oldVx = this.vx;

        Physics.resolveTileCollision(this, level);

        // Turn around on hitting solid wall
        if (this.vx === 0) {
            this.vx = -oldVx;
        } else {
            this.vx = oldVx;
        }
    }

    draw(ctx, camera, assetManager) {
        if (this.isDead) return;

        const img = assetManager.getImage('enemy_frog');
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
