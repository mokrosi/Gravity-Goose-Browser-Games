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

    constructor(x, y, arenaHeight, bossType = 'frog') {
        super(x, y, 96, 84);
        this.bossType = bossType; // 'frog' or 'cat'
        if (this.bossType === 'cat') {
            this.width = 110;
            this.height = 110;
        }
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
        
        // Dynamic timers
        this.idleTime = Boss.IDLE_TIME;
        this.telegraphTime = Boss.TELEGRAPH_TIME;
        this.fireTime = Boss.FIRE_TIME;
        this.cooldownTime = Boss.COOLDOWN_TIME;
        
        // Cat specific
        if (this.bossType === 'cat') {
            this.vx = 0;
            this.vy = 0;
            this.onGround = false;
            this.faceDir = -1; // -1 left, 1 right
            // Positive gravity is required for Physics.resolveY to track
            // onGround — without it the cat never lands and can't jump.
            this.gravity = 1;
            this.jumpCooldown = 0;
        }
    }

    get isDefeated() {
        return this.state === 'dead';
    }

    // Deadly AABB while firing
    firingBeam(levelWidth) {
        if (this.state !== 'firing') return null;
        if (this.bossType === 'cat') {
            // A sweeping dash/swipe attack covering a wide area around the cat
            const sweepWidth = 200 + this.hits * 50;
            if (this.faceDir === -1) {
                return { x: this.x - sweepWidth, y: this.y + 20, width: sweepWidth, height: this.height - 20 };
            } else {
                return { x: this.x + this.width, y: this.y + 20, width: sweepWidth, height: this.height - 20 };
            }
        } else {
            // Frog laser
            const right = this.x - 12;
            if (right <= 0) return null;
            return { x: 0, y: this.aimY - 5, width: right, height: 10 };
        }
    }

    hit() {
        this.hits++;
        this.flashTimer = 0.25;
        this.timer = Math.min(this.timer, this.cooldownTime);
        
        // Escalation: Cat gets faster with every hit
        if (this.bossType === 'cat') {
            this.idleTime = Math.max(0.1, 0.4 - this.hits * 0.1);
            this.telegraphTime = Math.max(0.15, 0.35 - this.hits * 0.05);
        }
    }

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

        if (this.bossType === 'cat') {
            // --- Cat Physics & Chase Logic ---
            this.vy += 1500 * dt; // Gravity
            this.vy = Math.min(this.vy, 800);
            this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);

            // Chases during idle + cooldown, skids to a halt while it
            // telegraphs and swipes so the attack stays dodgeable.
            const chasing = player && (this.state === 'idle' || this.state === 'cooldown');
            if (chasing) {
                const dist = player.x + player.width / 2 - (this.x + this.width / 2);
                if (Math.abs(dist) > 16) this.faceDir = Math.sign(dist) || -1;
                this.vx = this.faceDir * (200 + this.hits * 45);
            } else {
                this.vx *= Math.pow(0.01, dt);
                if (Math.abs(this.vx) < 10) this.vx = 0;
            }

            Physics.resolveX(this, level, dt);
            Physics.resolveY(this, level, dt);
            Physics.enforceBounds(this, level);

            // Jump over walls that block the chase, or hop up to a goose
            // that fights from a ledge above.
            if (chasing && this.onGround && this.jumpCooldown === 0) {
                const dist = player.x + player.width / 2 - (this.x + this.width / 2);
                const wallBlocked = this.vx === 0 && Math.abs(dist) > 50;
                const playerHigh = player.y + player.height < this.y + 20 && Math.abs(dist) < 380;
                if (wallBlocked || playerHigh) {
                    this.vy = -780;
                    this.jumpCooldown = 0.55;
                }
            }

            // Timers for Cat
            this.timer -= dt;
            if (this.timer <= 0) {
                if (this.state === 'idle') {
                    this.state = 'telegraph';
                    this.timer = this.telegraphTime;
                    // Face player for the swipe
                    if (player) {
                        this.faceDir = Math.sign(player.x - this.x) || -1;
                    }
                } else if (this.state === 'telegraph') {
                    this.state = 'firing';
                    this.timer = this.fireTime;
                } else if (this.state === 'firing') {
                    this.state = 'cooldown';
                    this.timer = this.cooldownTime;
                } else {
                    this.state = 'idle';
                    this.timer = this.idleTime;
                }
            }

        } else {
            // --- Frog Hover Logic ---
            this.y = this.hoverBase + Math.sin(this.wobble) * this.hoverRange;

            this.timer -= dt;
            if (this.timer <= 0) {
                if (this.state === 'idle') {
                    this.state = 'telegraph';
                    this.timer = this.telegraphTime;
                    // Lock the aim
                    const target = player ? player.y + player.height / 2 : this.arenaHeight / 2;
                    this.aimY = Math.max(20, Math.min(this.arenaHeight - 20, target));
                } else if (this.state === 'telegraph') {
                    this.state = 'firing';
                    this.timer = this.fireTime;
                } else if (this.state === 'firing') {
                    this.state = 'cooldown';
                    this.timer = this.cooldownTime;
                } else {
                    this.state = 'idle';
                    this.timer = this.idleTime;
                }
            }
        }
    }

    draw(ctx, camera, assetManager, level) {
        const dx = this.x - camera.x;
        const dy = this.y - camera.y;
        const firing = this.state === 'firing';
        const telegraph = this.state === 'telegraph';
        const dying = this.state === 'dead';

        if (this.bossType === 'cat') {
            if (firing || telegraph) this._drawCatSwipe(ctx, camera, level);
        } else {
            if (firing || telegraph) this._drawLaser(ctx, camera, level);
        }

        if (dx + this.width < 0 || dx > camera.width || dy + this.height < 0 || dy > camera.height) return;

        const shake = dying ? (Math.random() * 8 - 4) * Math.max(0, this.timer / Boss.DEATH_TIME) : 0;
        let bx = dx + shake;
        const by = dy + shake;
        const flash = this.flashTimer > 0;

        ctx.save();
        ctx.globalAlpha = dying ? Math.max(0.15, this.timer / Boss.DEATH_TIME) : 1;

        if (this.bossType === 'cat') {
            this._drawCat(ctx, bx, by, flash, dying, firing, telegraph);
        } else {
            this._drawFrog(ctx, bx, by, flash, dying, firing, telegraph);
        }

        ctx.restore();
    }

    _drawCat(ctx, bx, by, flash, dying, firing, telegraph) {
        const furColor = flash ? '#ffffff' : (dying ? '#71717a' : '#ea580c'); // Orange cat
        const bellyColor = flash ? '#fef08a' : (dying ? '#a1a1aa' : '#fde047');
        const eyeColor = (firing || telegraph || dying) ? '#ef4444' : (flash ? '#ffffff' : '#10b981'); // Green eyes to red
        
        ctx.save();
        // Flip horizontally based on faceDir. Origin shift for flip.
        if (this.faceDir === 1) {
            ctx.translate(bx + this.width / 2, by);
            ctx.scale(-1, 1);
            ctx.translate(-(bx + this.width / 2), -by);
        }

        // Tail
        ctx.fillStyle = furColor;
        const tailWobble = Math.sin(this.wobble * 2) * 10;
        ctx.beginPath();
        ctx.moveTo(bx + this.width - 20, by + this.height - 20);
        ctx.quadraticCurveTo(bx + this.width + 20, by + this.height - 50 + tailWobble, bx + this.width - 10, by + 10 + tailWobble);
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.strokeStyle = furColor;
        ctx.stroke();

        // Body
        ctx.fillStyle = furColor;
        ctx.beginPath();
        ctx.ellipse(bx + this.width / 2 + 10, by + this.height / 2 + 10, 45, 35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.ellipse(bx + this.width / 2 + 5, by + this.height / 2 + 20, 30, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = furColor;
        ctx.beginPath();
        ctx.ellipse(bx + 30, by + 40, 35, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.moveTo(bx, by + 20);
        ctx.lineTo(bx + 20, by);
        ctx.lineTo(bx + 30, by + 15);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx + 30, by + 15);
        ctx.lineTo(bx + 45, by + 5);
        ctx.lineTo(bx + 50, by + 25);
        ctx.fill();

        // Eyes
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(bx + 15, by + 40, 8, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(bx + 45, by + 40, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = '#000';
        const pupilW = (firing || telegraph) ? 2 : 4;
        ctx.beginPath();
        ctx.ellipse(bx + 15, by + 40, pupilW, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(bx + 45, by + 40, pupilW, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose/Mouth
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(bx + 25, by + 55);
        ctx.lineTo(bx + 35, by + 55);
        ctx.lineTo(bx + 30, by + 60);
        ctx.fill();
        
        ctx.restore();
    }

    _drawCatSwipe(ctx, camera, level) {
        const firing = this.state === 'firing';
        const sweepWidth = 200 + this.hits * 50;
        
        let startX, startY, width, height;
        if (this.faceDir === -1) {
            startX = this.x - sweepWidth - camera.x;
        } else {
            startX = this.x + this.width - camera.x;
        }
        startY = this.y + 20 - camera.y;
        width = sweepWidth;
        height = this.height - 20;

        ctx.save();
        if (!firing) {
            // Telegraph: Draw a faint red warning zone
            ctx.globalAlpha = 0.3 * (0.5 + 0.5 * Math.sin(this.wobble * 15));
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(startX, startY, width, height);
        } else {
            // Swipe: Draw sharp white/red claw marks
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(startX, startY + 20 + i * 20);
                ctx.lineTo(startX + width, startY + 20 + i * 20);
                ctx.stroke();
            }
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(startX, startY + 20 + i * 20);
                ctx.lineTo(startX + width, startY + 20 + i * 20);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    _drawFrog(ctx, bx, by, flash, dying, firing, telegraph) {
        const hullColor = flash ? '#ffffff' : (dying ? '#3f3f46' : '#1e1b4b');
        const accentColor = flash ? '#fecdd3' : (dying ? '#52525b' : '#312e81');

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
    }

    _drawLaser(ctx, camera, level) {
        const right = this.x - camera.x - 12;
        const y = this.aimY - camera.y;
        const firing = this.state === 'firing';
        const flicker = firing ? 1 : 0.35 + 0.35 * Math.abs(Math.sin(this.wobble * 6));
        
        ctx.save();
        ctx.globalAlpha = (firing ? 0.55 : 0.12) * flicker;
        ctx.fillStyle = '#e11d48';
        ctx.fillRect(0, y - 3, right, 12);
        ctx.globalAlpha = (firing ? 1 : 0.35) * flicker;
        ctx.fillStyle = '#fecdd3';
        ctx.fillRect(0, y + 1, right, 4);
        ctx.restore();
    }
}

class CatBoss extends Entity {
    constructor(x, y, arenaHeight) {
        super(x, y, 120, arenaHeight);
        this.arenaHeight = arenaHeight;
        this.state = 'idle'; // idle | telegraph | swiping | dead
        this.timer = 2.0;
        this.lane = -1; // 0=top, 1=middle, 2=bottom
        this.laneHeights = [arenaHeight * 0.25, arenaHeight * 0.5, arenaHeight * 0.75];
        this.baseX = x; // Starts advancing right
        this.lungeX = 0; // Relative to baseX during swipe
        this.pawY = arenaHeight / 2;
        this.isDefeated = false;
        this.scrollSpeed = 160; // Pixels per second
    }

    update(dt, level, player) {
        if (this.isDefeated) return;

        // Incessantly move forward
        this.baseX += this.scrollSpeed * dt;
        this.x = this.baseX; // Update physical hitbox base

        // Wall of death: if player falls behind baseX, they die.
        if (!player.isDead && player.x + player.width / 2 < this.baseX + 60) {
            player.isDead = true;
        }

        this.timer -= dt;
        if (this.timer <= 0) {
            if (this.state === 'idle') {
                this.state = 'telegraph';
                this.timer = 0.8;
                this.lane = Math.floor(Math.random() * 3);
                this.pawY = this.laneHeights[this.lane] - 40;
                this.lungeX = 0;
            } else if (this.state === 'telegraph') {
                this.state = 'swiping';
                this.timer = 0.4;
            } else if (this.state === 'swiping') {
                this.state = 'idle';
                this.timer = 1.6;
                this.lungeX = 0;
            }
        }

        if (this.state === 'swiping') {
            this.lungeX += 1400 * dt; // fast swipe
            if (this.lungeX > 800) this.lungeX = 800; // max reach
        } else if (this.state === 'telegraph') {
            this.lungeX = (Math.random() * 10 - 5); // Tremble
        } else {
            this.lungeX = 0;
            this.pawY = (this.arenaHeight / 2) - 40 + Math.sin(Date.now() / 300) * 20;
        }
    }

    hit() {
        this.isDefeated = true;
        this.state = 'dead';
    }

    firingBeam(arenaWidth) {
        if (this.state === 'swiping') {
            return {
                x: this.baseX + this.lungeX - 20, // Paw hitbox during swipe
                y: this.pawY + 10,
                width: 140,
                height: 60
            };
        }
        return null;
    }

    draw(ctx, camera, assetManager) {
        if (this.isDefeated) return;
        
        ctx.save();
        const screenX = this.baseX - camera.x;
        
        // Draw Telegraph Warning Lane
        if (this.state === 'telegraph' || this.state === 'swiping') {
            const warnAlpha = (this.state === 'telegraph' && Math.floor(Date.now() / 100) % 2 === 0) ? 0.3 : 0.15;
            ctx.fillStyle = `rgba(249, 115, 22, ${warnAlpha})`;
            ctx.fillRect(screenX, this.laneHeights[this.lane] - camera.y - 40, 1000, 80);
        }

        // Draw Paw Body
        const px = screenX + this.lungeX;
        const py = this.pawY - camera.y;

        // Paw arm coming from the left
        ctx.fillStyle = '#f97316'; // Orange tabby
        ctx.fillRect(screenX - 800, py + 10, 800 + this.lungeX + 60, 60);

        // Paw pad
        ctx.beginPath();
        ctx.roundRect(px, py, 120, 80, 30);
        ctx.fill();
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 4;
        ctx.strokeRect(px + 10, py + 10, 100, 60);

        // White toes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px + 100, py + 15, 12, 0, Math.PI*2);
        ctx.arc(px + 115, py + 40, 12, 0, Math.PI*2);
        ctx.arc(px + 100, py + 65, 12, 0, Math.PI*2);
        ctx.fill();
        
        // Claws out if swiping
        if (this.state === 'swiping') {
            ctx.fillStyle = '#e5e7eb';
            ctx.beginPath();
            ctx.moveTo(px + 110, py + 15); ctx.lineTo(px + 140, py + 10); ctx.lineTo(px + 110, py + 20);
            ctx.moveTo(px + 125, py + 40); ctx.lineTo(px + 155, py + 40); ctx.lineTo(px + 125, py + 45);
            ctx.moveTo(px + 110, py + 65); ctx.lineTo(px + 140, py + 70); ctx.lineTo(px + 110, py + 60);
            ctx.fill();
        }

        ctx.restore();
    }
}
