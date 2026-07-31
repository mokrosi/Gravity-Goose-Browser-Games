class Player extends Entity {
    static MAX_SPEED = 260;
    static ACCELERATION = 2200;
    static FRICTION = 2400;
    static GRAVITY = 1400;
    static JUMP_VELOCITY = 620;
    static MAX_FALL_SPEED = 800;
    static COYOTE_TIME = 0.1;
    static JUMP_BUFFER_TIME = 0.1;
    static JUMP_CUT = 0.5;

    constructor(x, y) {
        super(x, y, 28, 28);
        this.gravity = Player.GRAVITY;
        this.onGround = false;
        this.onCeiling = false;
        this.facingRight = true;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.walkCycle = 0;
    }

    get gravitySign() {
        return Math.sign(this.gravity);
    }

    get isRunningFast() {
        return this.onGround && Math.abs(this.vx) > Player.MAX_SPEED * 0.8;
    }

    flipGravity(soundManager, particleSystem) {
        this.gravity = -this.gravity;
        this.onGround = false;
        this.onCeiling = false;
        this.coyoteTimer = 0;
        this.vy = this.gravitySign * 80;
        if (soundManager) soundManager.playFlip();
        if (particleSystem) {
            particleSystem.emitGravityFlip(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.gravitySign
            );
        }
    }

    update(dt, input, level, soundManager, particleSystem) {
        if (this.isDead) return;

        // --- Gravity toggle ---
        if (input.isKeyPressed('Space')) {
            this.flipGravity(soundManager, particleSystem);
        }

        // --- Horizontal: acceleration & friction ---
        let dir = 0;
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) dir--;
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) dir++;

        if (dir !== 0) {
            this.facingRight = dir > 0;
            this.vx += dir * Player.ACCELERATION * dt;
            this.vx = Player.clamp(this.vx, -Player.MAX_SPEED, Player.MAX_SPEED);
        } else {
            const friction = Player.FRICTION * dt;
            if (Math.abs(this.vx) <= friction) {
                this.vx = 0;
            } else {
                this.vx -= Math.sign(this.vx) * friction;
            }
        }

        // --- Jump buffering: remember presses made just before landing ---
        const jumpPressed = input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp');
        if (jumpPressed) {
            this.jumpBufferTimer = Player.JUMP_BUFFER_TIME;
        } else {
            this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
        }

        // --- Coyote time: allow jumping for a short window after leaving a ledge ---
        this.coyoteTimer = this.onGround
            ? Player.COYOTE_TIME
            : Math.max(0, this.coyoteTimer - dt);

        // --- Buffered jump execution (adapts to inverted gravity) ---
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
            this.vy = -this.gravitySign * Player.JUMP_VELOCITY;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            if (soundManager) soundManager.playJump();
        }

        // --- Variable jump height: releasing early cuts the ascent ---
        const jumpReleased = input.isKeyReleased('KeyW') || input.isKeyReleased('ArrowUp');
        if (jumpReleased && this.vy * this.gravitySign < 0) {
            this.vy *= Player.JUMP_CUT;
        }

        // --- Gravity (scaled by dt) with terminal velocity ---
        this.vy += this.gravity * dt;
        this.vy = Player.clamp(this.vy, -Player.MAX_FALL_SPEED, Player.MAX_FALL_SPEED);

        // --- Axis-separated collision resolution ---
        Physics.resolveX(this, level, dt);
        Physics.resolveY(this, level, dt);
        Physics.enforceBounds(this, level);

        // --- Walk cycle for the dt-driven running bob ---
        if (Math.abs(this.vx) > 0 && this.onGround) {
            this.walkCycle += Math.abs(this.vx) * dt * 0.06;
        } else {
            this.walkCycle = 0;
        }
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    draw(ctx, camera, assetManager) {
        if (this.isDead) return;

        const img = assetManager.getImage('player');
        if (!img) return;

        ctx.save();
        const bob = Math.abs(Math.sin(this.walkCycle)) * 1.5 * this.gravitySign;
        const drawX = this.x - camera.x;
        const drawY = this.y - camera.y + bob;
        const scaleX = this.facingRight ? 1 : -1;
        const scaleY = this.gravity > 0 ? 1 : -1;

        ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(img, -16, -16, 32, 32);
        ctx.restore();
    }
}
