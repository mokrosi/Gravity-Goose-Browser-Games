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
    static FLIP_BUFFER_TIME = 0.15;
    static WALL_SLIDE_SPEED = 120;
    static WALL_JUMP_VX = 360;
    static WALL_JUMP_VY = 500;
    static BLINK_DISTANCE = 96;         // 3 tiles
    static BLINK_COOLDOWN = 0.6;
    static INVINCIBLE_TIME = 0.35;      // i-frames during + just after a blink
    static AFTERIMAGE_LIFE = 0.25;

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
        this.blinkCooldown = 0;
        this.invincibleTimer = 0;       // blink i-frames (hazard/enemy immunity)
        this.afterimages = [];          // fading teleport trail (globalAlpha copies)
        this.flipsInAir = 0;        // 0 = the once-per-airtime flip is available
        this.flipBufferTimer = 0;   // queued flip, fires on landing if still active
        this.flipLimit = true;      // Level 6+: only one flip per airtime
        this.inGravityZone = false; // inside a forced-gravity zone
    }

    // Levels 6-10 restrict flips to once per airtime; Levels 1-5 don't.
    setFlipLimit(enabled) {
        this.flipLimit = enabled;
        if (!enabled) this.flipsInAir = 0;
    }

    // Collecting a Golden Breadcrumb instantly recharges the mid-air flip.
    rechargeFlip() {
        this.flipsInAir = 0;
        this.flipBufferTimer = 0;
    }

    get gravitySign() {
        return Math.sign(this.gravity);
    }

    get isRunningFast() {
        return this.onGround && Math.abs(this.vx) > Player.MAX_SPEED * 0.8;
    }

    get canBlink() {
        return this.blinkCooldown <= 0;
    }

    get isInvincible() {
        return this.invincibleTimer > 0;
    }

    // The player may flip gravity only once per airtime (Level 6+). Touching
    // the ground/ceiling or grabbing a Golden Breadcrumb recharges the ability.
    // Forced-gravity zones lock out flipping entirely while inside.
    get canFlip() {
        if (this.inGravityZone) return false;
        if (!this.flipLimit) return true;
        return this.onGround || this.flipsInAir === 0;
    }

    // Does the player's AABB overlap a forced-gravity zone tile?
    _inGravityZone(level) {
        if (!level.gravityZones || level.gravityZones.length === 0) return false;
        for (const zone of level.gravityZones) {
            if (Physics.checkCollision(this, zone)) return true;
        }
        return false;
    }

    flipGravity(soundManager, particleSystem) {
        this.gravity = -this.gravity;
        this.onGround = false;
        this.onCeiling = false;
        this.coyoteTimer = 0;
        this.wallSliding = false;
        this.wallDir = 0;
        if (this.flipLimit) this.flipsInAir = 1; // every flip launches the goose airborne
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

        // --- Blink i-frames: hazards & enemies ignore the goose while active ---
        this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);

        // --- Blink afterimages: fade out the teleport trail ---
        for (let i = this.afterimages.length - 1; i >= 0; i--) {
            this.afterimages[i].life -= dt;
            if (this.afterimages[i].life <= 0) {
                this.afterimages.splice(i, 1);
            }
        }

        // --- Forced-gravity zones: snap to normal gravity + lock out flipping ---
        this.inGravityZone = this._inGravityZone(level);
        if (this.inGravityZone && this.gravity < 0) {
            this.gravity = Player.GRAVITY; // instantly forced back to normal
            this.onCeiling = false;
            this.flipsInAir = 0;
            this.flipBufferTimer = 0;
        }

        // --- Gravity flip (SPACE or Left-Click): buffered + once per airtime ---
        // The ability recharges when the goose touches the ground/ceiling
        // again, or collects a Golden Breadcrumb.
        const flipPressed = input.isKeyPressed('Space') || input.isKeyPressed('Mouse0');
        if (flipPressed) {
            this.flipBufferTimer = Player.FLIP_BUFFER_TIME;
        }
        if (this.inGravityZone) {
            this.flipBufferTimer = 0; // flipping is disabled inside the zone
        }
        this.flipBufferTimer = Math.max(0, this.flipBufferTimer - dt);
        if (this.onGround) {
            this.flipsInAir = 0; // grounded again: the mid-air flip recharges
        }
        if (this.flipBufferTimer > 0 && this.canFlip) {
            this.flipGravity(soundManager, particleSystem);
            this.flipBufferTimer = 0;
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

        // --- Blink (Shift): instant teleport, i-frames, cooldown, afterimages ---
        this.blinkCooldown = Math.max(0, this.blinkCooldown - dt);
        if ((input.isKeyPressed('ShiftLeft') || input.isKeyPressed('ShiftRight')) && this.canBlink) {
            this.blinkCooldown = Player.BLINK_COOLDOWN;
            const blinkDir = dir !== 0 ? dir : (this.facingRight ? 1 : -1);
            this._performBlink(level, blinkDir, soundManager, particleSystem);
        }

        // --- Wall detection: pressing toward a wall while airborne ---
        this.wallDir = 0;
        const pressingLeft = input.isKeyDown('ArrowLeft') || input.isKeyDown('KeyA');
        const pressingRight = input.isKeyDown('ArrowRight') || input.isKeyDown('KeyD');
        if (pressingLeft && this._touchingWall(level, -1)) this.wallDir = -1;
        else if (pressingRight && this._touchingWall(level, 1)) this.wallDir = 1;

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
        const jumpReleased = input.isKeyReleased('KeyW') || input.isKeyReleased('ArrowUp');
        if (jumpReleased && this.vy * this.gravitySign < 0) {
            this.vy *= Player.JUMP_CUT;
        }

        // --- Gravity (scaled by dt) with terminal velocity ---
        this.vy += this.gravity * dt;
        this.vy = Player.clamp(this.vy, -Player.MAX_FALL_SPEED, Player.MAX_FALL_SPEED);

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

    // Teleport `BLINK_DISTANCE` px in `dir`, passing through hazards, enemies
    // and walls one tile thick. Thick walls and the level border stop the
    // blink flush against them. Grants i-frames and leaves an afterimage trail.
    _performBlink(level, dir, soundManager, particleSystem) {
        const ts = Physics.TILE_SIZE;
        const startX = this.x;
        let endX = startX + dir * Player.BLINK_DISTANCE;
        const worldW = level.width * ts;
        endX = Player.clamp(endX, 0, worldW - this.width);

        const rowStart = Math.floor(this.y / ts);
        const rowEnd = Math.floor((this.y + this.height - 1) / ts);
        const bandSolid = (col) => {
            for (let row = rowStart; row <= rowEnd; row++) {
                if (level.isSolid(col, row)) return true;
            }
            return false;
        };
        const bodyOverlapsSolid = (x) => {
            const c1 = Math.floor(x / ts);
            const c2 = Math.floor((x + this.width - 1) / ts);
            for (let c = c1; c <= c2; c++) {
                if (bandSolid(c)) return true;
            }
            return false;
        };
        const depthOfSolidRun = (col) => {
            let depth = 0;
            while (col >= 0 && col < level.width && bandSolid(col)) {
                depth += ts;
                col += dir;
            }
            return depth;
        };

        const step = 4; // px resolution for the body sweep
        const maxScan = (Player.BLINK_DISTANCE + 2 * ts) / step;
        let newX = startX;
        let x = startX;
        let scanned = 0;
        const forward = dir > 0;
        while ((forward ? x < endX : x > endX) && scanned < maxScan) {
            scanned++;
            const next = forward ? Math.min(endX, x + step) : Math.max(endX, x - step);
            if (bodyOverlapsSolid(next)) {
                const hitCol = forward
                    ? Math.floor((next + this.width - 1) / ts)
                    : Math.floor(next / ts);
                const depth = depthOfSolidRun(hitCol);
                if (depth > ts) {
                    // Thick wall: stop flush before it.
                    newX = forward ? hitCol * ts - this.width : (hitCol + 1) * ts;
                    break;
                }
                // One-tile wall: leap fully past it (trailing edge clears the far face).
                const leap = forward ? (hitCol + 1) * ts : hitCol * ts - this.width;
                if (leap < 0 || leap + this.width > worldW || bodyOverlapsSolid(leap)) {
                    // No room to clear it (e.g. the level border): stop flush instead.
                    newX = forward ? hitCol * ts - this.width : (hitCol + 1) * ts;
                    break;
                }
                x = leap;
                newX = leap;
                continue;
            }
            x = next;
            newX = next;
        }

        this.facingRight = dir > 0;
        this.x = newX;
        this.invincibleTimer = Player.INVINCIBLE_TIME;
        if (Math.abs(newX - startX) > 2) {
            this._spawnAfterimages(startX, newX);
        }
        if (soundManager) soundManager.playBlink();
        if (particleSystem) {
            particleSystem.emitBlink(startX + this.width / 2, this.y + this.height / 2, dir);
            particleSystem.emitBlink(newX + this.width / 2, this.y + this.height / 2, dir);
        }
    }

    // Fading ghost copies along the teleport path; the oldest fade out first.
    _spawnAfterimages(startX, endX) {
        const steps = 6;
        const dist = endX - startX;
        const y = this.y;
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            this.afterimages.push({
                x: startX + dist * t,
                y: y,
                facingRight: this.facingRight,
                gravitySign: this.gravitySign,
                life: Player.AFTERIMAGE_LIFE * (0.3 + 0.7 * t),
                maxLife: Player.AFTERIMAGE_LIFE
            });
        }
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    draw(ctx, camera, assetManager) {
        if (this.isDead) return;

        const img = assetManager.getImage('player');
        if (!img) return;

        // Blink afterimage trail: translucent copies fading along the path.
        for (const a of this.afterimages) {
            if (a.life <= 0) continue;
            ctx.save();
            const alpha = Math.max(0, a.life / a.maxLife) * 0.45;
            const scaleX = a.facingRight ? 1 : -1;
            const scaleY = a.gravitySign > 0 ? 1 : -1;
            ctx.translate(a.x - camera.x + this.width / 2, a.y - camera.y + this.height / 2);
            ctx.scale(scaleX, scaleY);
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, -16, -16, 32, 32);
            ctx.restore();
        }

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
