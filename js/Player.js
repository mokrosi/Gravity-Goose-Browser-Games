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
    static WALL_SLIDE_SPEED = 120;
    static WALL_JUMP_VX = 360;
    static WALL_JUMP_VY = 500;
    static DASH_SPEED = 520;
    static DASH_TIME = 0.2;
    static DASH_COOLDOWN = 0.6;

    constructor(x, y) {
        super(x, y, 28, 28);
        this.gravity = Player.GRAVITY;
        this.onGround = false;
        this.onCeiling = false;
        this.facingRight = true;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.walkCycle = 0;
        this.wallDir = 0;
        this.wallSliding = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
    }

    get gravitySign() {
        return Math.sign(this.gravity);
    }

    get isRunningFast() {
        return this.onGround && Math.abs(this.vx) > Player.MAX_SPEED * 0.8;
    }

    get canDash() {
        return this.dashCooldown <= 0;
    }

    flipGravity(soundManager, particleSystem) {
        this.gravity = -this.gravity;
        this.onGround = false;
        this.onCeiling = false;
        this.coyoteTimer = 0;
        this.wallSliding = false;
        this.wallDir = 0;
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

    // Is there a solid tile immediately beside the player in `dir`?
    _touchingWall(level, dir) {
        const ts = Physics.TILE_SIZE;
        const edge = dir > 0 ? this.x + this.width : this.x - 1;
        const col = Math.floor(edge / ts);
        const rowStart = Math.floor(this.y / ts);
        const rowEnd = Math.floor((this.y + this.height - 1) / ts);
        for (let row = rowStart; row <= rowEnd; row++) {
            if (level.isSolid(col, row)) return true;
        }
        return false;
    }

    update(dt, input, level, soundManager, particleSystem) {
        if (this.isDead) return;

        // --- Gravity toggle ---
        if (input.isKeyPressed('Space')) {
            this.flipGravity(soundManager, particleSystem);
        }

        // --- Horizontal: acceleration & friction (disabled mid-dash) ---
        let dir = 0;
        if (input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA')) dir--;
        if (input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD')) dir++;

        if (this.dashTimer <= 0) {
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
        }

        // --- Dash (Shift): horizontal burst, gravity-off window, cooldown ---
        this.dashCooldown = Math.max(0, this.dashCooldown - dt);
        this.dashTimer = Math.max(0, this.dashTimer - dt);
        if ((input.isKeyPressed('ShiftLeft') || input.isKeyPressed('ShiftRight')) && this.canDash) {
            this.dashTimer = Player.DASH_TIME;
            this.dashCooldown = Player.DASH_COOLDOWN;
            const dashDir = dir !== 0 ? dir : (this.facingRight ? 1 : -1);
            this.vx = dashDir * Player.DASH_SPEED;
            this.vy = 0;
            if (soundManager) soundManager.playDash();
            if (particleSystem) particleSystem.emitDash(this.x + this.width / 2, this.y + this.height / 2, dashDir);
        } else if (this.dashTimer > 0 && particleSystem && Math.random() < 0.5) {
            particleSystem.emitDash(this.x + this.width / 2, this.y + this.height / 2, this.facingRight);
        }

        // --- Wall detection: pressing toward a wall while airborne ---
        this.wallDir = 0;
        const pressingLeft = input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA');
        const pressingRight = input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD');
        if (pressingLeft && this._touchingWall(level, -1)) this.wallDir = -1;
        else if (pressingRight && this._touchingWall(level, 1)) this.wallDir = 1;

        // --- Jump buffering: remember presses made just before landing ---
        // Mouse click (Left) is a full mouse/keyboard parity alias for jump.
        const jumpPressed = input.isKeyPressed('KeyW') || input.isKeyPressed('ArrowUp') || input.isKeyPressed('Mouse0');
        if (jumpPressed) {
            this.jumpBufferTimer = Player.JUMP_BUFFER_TIME;
        } else {
            this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
        }

        // --- Coyote time: allow jumping for a short window after leaving a ledge ---
        this.coyoteTimer = this.onGround
            ? Player.COYOTE_TIME
            : Math.max(0, this.coyoteTimer - dt);

        // --- Wall slide: falling while pressed against a wall ---
        this.wallSliding = this.wallDir !== 0 && !this.onGround && this.vy * this.gravitySign > 0;

        // --- Buffered ground jump execution (adapts to inverted gravity) ---
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.wallSliding) {
            this.vy = -this.gravitySign * Player.JUMP_VELOCITY;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            if (soundManager) soundManager.playJump();
        }

        // --- Wall jump: burst away from the wall + up from the slide ---
        if (this.wallSliding && jumpPressed) {
            this.vx = -this.wallDir * Player.WALL_JUMP_VX;
            this.vy = -this.gravitySign * Player.WALL_JUMP_VY;
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            this.wallSliding = false;
            if (soundManager) soundManager.playJump();
        }

        // --- Variable jump height: releasing early cuts the ascent ---
        const jumpReleased = input.isKeyReleased('KeyW') || input.isKeyReleased('ArrowUp') || input.isKeyReleased('Mouse0');
        if (jumpReleased && this.vy * this.gravitySign < 0) {
            this.vy *= Player.JUMP_CUT;
        }

        // --- Gravity (scaled by dt) with terminal velocity; disabled while dashing ---
        if (this.dashTimer <= 0) {
            this.vy += this.gravity * dt;
            this.vy = Player.clamp(this.vy, -Player.MAX_FALL_SPEED, Player.MAX_FALL_SPEED);
        }

        // --- Wall slide caps the fall speed so the wall is climbable ---
        if (this.wallSliding && this.vy * this.gravitySign > Player.WALL_SLIDE_SPEED) {
            this.vy = this.gravitySign * Player.WALL_SLIDE_SPEED;
        }

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
