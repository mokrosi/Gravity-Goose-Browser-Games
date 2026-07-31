class Player extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.speed = 260;
        this.gravity = 1400; // Positive is down, negative is up
        this.onGround = false;
        this.onCeiling = false;
        this.facingRight = true;
    }

    update(dt, input, level, soundManager, particleSystem) {
        if (this.isDead) return;

        // Horizontal Movement
        this.vx = 0;
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) {
            this.vx = -this.speed;
            this.facingRight = false;
        }
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) {
            this.vx = this.speed;
            this.facingRight = true;
        }

        // Gravity Flip Mechanic
        if (input.isKeyPressed('Space')) {
            this.gravity = -this.gravity;
            // Provide a tiny vertical bump to detach from floor/ceiling immediately
            this.vy = this.gravity > 0 ? 60 : -60;

            if (soundManager) soundManager.playFlip();
            if (particleSystem) {
                particleSystem.emitGravityFlip(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    Math.sign(this.gravity)
                );
            }
        }

        // Apply gravity
        this.vy += this.gravity * dt;
        
        // Terminal velocity
        if (this.vy > 800) this.vy = 800;
        if (this.vy < -800) this.vy = -800;

        Physics.resolveTileCollision(this, level);
    }

    draw(ctx, camera, assetManager) {
        if (this.isDead) return;

        const img = assetManager.getImage('player');
        if (img) {
            ctx.save();
            let drawX = this.x - camera.x;
            let drawY = this.y - camera.y;

            // Handle flipping for direction and gravity
            let scaleX = this.facingRight ? 1 : -1;
            let scaleY = this.gravity > 0 ? 1 : -1;

            ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
            ctx.scale(scaleX, scaleY);
            // Draw pixel goose centered
            ctx.drawImage(img, -16, -16, 32, 32);
            ctx.restore();
        }
    }
}
