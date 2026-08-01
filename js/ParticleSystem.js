class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'square') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.shape = shape; // 'square', 'feather', 'spark'
        this.angle = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 5;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.angle += this.vRot * dt;
    }

    draw(ctx, camera) {
        if (this.life <= 0) return;
        const alpha = Math.max(0, this.life / this.maxLife);

        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        if (this.shape === 'feather') {
            ctx.fillRect(-this.size / 2, -this.size, this.size, this.size * 2);
        } else if (this.shape === 'spark') {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emitGravityFlip(x, y, gravityDirection) {
        // Cyan energy sparks + feather burst
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed + (gravityDirection * -50);
            const color = Math.random() > 0.5 ? '#06B6D4' : '#38BDF8';
            this.particles.push(new Particle(x, y, vx, vy, color, 3 + Math.random() * 3, 0.4 + Math.random() * 0.3, 'spark'));
        }
        for (let i = 0; i < 6; i++) {
            const vx = (Math.random() - 0.5) * 80;
            const vy = (Math.random() - 0.5) * 80;
            this.particles.push(new Particle(x, y, vx, vy, '#FFFFFF', 4 + Math.random() * 2, 0.6 + Math.random() * 0.4, 'feather'));
        }
    }

    emitBreadCollect(x, y) {
        // Golden sparkle burst
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 120;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = Math.random() > 0.5 ? '#FACC15' : '#FEF08A';
            this.particles.push(new Particle(x, y, vx, vy, color, 3 + Math.random() * 3, 0.5 + Math.random() * 0.3, 'spark'));
        }
    }

    emitCrumbCollect(x, y) {
        // Bright golden sparkle burst for the bonus collectible
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 140;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = Math.random() > 0.5 ? '#FACC15' : '#FFF7CC';
            this.particles.push(new Particle(x, y, vx, vy, color, 2 + Math.random() * 2.5, 0.45, 'spark'));
        }
    }

    emitFootstep(x, y) {
        // Small dust puff kicked up while sprinting
        for (let i = 0; i < 3; i++) {
            const vx = (Math.random() - 0.5) * 60;
            const vy = -Math.random() * 40;
            this.particles.push(new Particle(x, y, vx, vy, '#94A3B8', 2 + Math.random() * 2, 0.22, 'spark'));
        }
    }

    emitDust(x, y, amount = 6) {
        // White/gray dust burst kicked up on jumps, hard landings & flips.
        // Particles fly outward and curl upward (with a touch of randomness).
        for (let i = 0; i < amount; i++) {
            const vx = (Math.random() - 0.5) * 110;
            const vy = -15 - Math.random() * 70;
            const color = Math.random() > 0.5 ? '#FFFFFF' : '#94A3B8';
            this.particles.push(new Particle(x, y, vx, vy, color, 2 + Math.random() * 2.5, 0.3 + Math.random() * 0.25, 'spark'));
        }
    }

    emitBlink(x, y, dir) {
        // Cyan warp ring bursting at each end of the teleport
        for (let i = 0; i < 10; i++) {
            const vx = (Math.random() - 0.5) * 200 + dir * 60;
            const vy = (Math.random() - 0.5) * 200;
            const color = Math.random() > 0.5 ? '#06B6D4' : '#A5F3FC';
            this.particles.push(new Particle(x, y, vx, vy, color, 3 + Math.random() * 3, 0.35, 'spark'));
        }
    }

    emitHurt(x, y) {
        // Feather explosion + Red sparks
        for (let i = 0; i < 15; i++) {
            const vx = (Math.random() - 0.5) * 150;
            const vy = (Math.random() - 0.5) * 150;
            this.particles.push(new Particle(x, y, vx, vy, '#EF4444', 4, 0.5, 'spark'));
        }
        for (let i = 0; i < 12; i++) {
            const vx = (Math.random() - 0.5) * 100;
            const vy = (Math.random() - 0.5) * 100;
            this.particles.push(new Particle(x, y, vx, vy, '#FFFFFF', 5, 0.8, 'feather'));
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, camera) {
        for (let particle of this.particles) {
            particle.draw(ctx, camera);
        }
    }
}
