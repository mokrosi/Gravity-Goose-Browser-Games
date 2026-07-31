class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        // Generate placeholder graphics for comedic bots
        if (!scene.textures.exists('bot_intern')) {
            const g = scene.make.graphics();
            // Intern: Small, nervous looking (grey and blue)
            g.fillStyle(0xcccccc, 1).fillRect(0, 0, 20, 24);
            g.fillStyle(0x0000ff, 1).fillRect(4, 4, 12, 8); // visor
            g.generateTexture('bot_intern', 20, 24);
            
            // Manager: Bulky, red tie
            g.clear().fillStyle(0x888888, 1).fillRect(0, 0, 28, 32);
            g.fillStyle(0xff0000, 1).fillRect(10, 10, 8, 20); // tie
            g.generateTexture('bot_manager', 28, 32);

            // Drone: Floating eye
            g.clear().fillStyle(0x444444, 1).fillCircle(12, 12, 12);
            g.fillStyle(0xff0000, 1).fillCircle(12, 12, 6); // red eye
            g.generateTexture('bot_drone', 24, 24);
            g.destroy();
        }

        super(scene, x, y, `bot_${type}`);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.enemyType = type;
        this.startX = x;
        this.startY = y;
        this.isDead = false;
        
        // AI States
        this.state = 'idle'; 
        this.patrolDir = 1;
        this.speed = type === 'intern' ? 100 : (type === 'manager' ? 60 : 80);
        
        if (type === 'drone') {
            this.body.setAllowGravity(false);
            this.scene.tweens.add({
                targets: this,
                y: this.y - 20,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    update(time, delta) {
        if (this.isDead || !this.scene.player) return;

        const player = this.scene.player;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (this.enemyType === 'intern') {
            // Comedic AI: Intern panics and runs away
            if (dist < 150) {
                if (this.state !== 'panic') {
                    this.state = 'panic';
                    this.speed = 200; // run fast
                    this.scene.add.text(this.x, this.y - 20, '!', { font: 'bold 16px Arial', fill: '#ff0000' })
                        .setOrigin(0.5).setAlpha(1);
                }
                const runDir = this.x < player.x ? -1 : 1;
                this.setVelocityX(runDir * this.speed);
                this.setFlipX(runDir > 0);
            } else {
                this.state = 'idle';
                this.setVelocityX(0);
            }
        } 
        else if (this.enemyType === 'manager') {
            // Comedic AI: Manager slowly chases, but gets angry
            if (dist < 200) {
                const chaseDir = this.x < player.x ? 1 : -1;
                this.setVelocityX(chaseDir * this.speed);
                this.setFlipX(chaseDir > 0);
            } else {
                this.setVelocityX(0);
            }
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.body.enable = false;

        // Comedic death: Flatten or spin out
        this.scene.tweens.add({
            targets: this,
            scaleY: 0.1,
            scaleX: 1.5,
            angle: 180,
            y: this.y + this.height/2,
            alpha: 0,
            duration: 300,
            onComplete: () => this.destroy()
        });
        
        // Explosion particles
        const particles = this.scene.add.particles(this.x, this.y, 'tile_shard', {
            speed: { min: -100, max: 100 },
            scale: { start: 1, end: 0 },
            lifespan: 500,
            quantity: 8,
            tint: 0x555555
        });
        particles.explode();
    }
}
