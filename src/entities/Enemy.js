class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        // Create dummy texture based on type
        const key = `enemy_${type}`;
        if (!scene.textures.exists(key)) {
            const g = scene.make.graphics();
            if (type === 'crawler') {
                g.fillStyle(0xffaa00, 1).fillRect(0, 0, 24, 16);
                g.generateTexture(key, 24, 16);
            } else if (type === 'flyer') {
                g.fillStyle(0xff55ff, 1).fillRect(0, 0, 20, 20);
                g.generateTexture(key, 20, 20);
            }
            g.destroy();
        }
        
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.enemyType = type;
        
        if (type === 'crawler') {
            this.body.setGravityY(800);
            this.setVelocityX(50);
            this.setCollideWorldBounds(true);
            this.setBounceX(1); // Bounce off walls automatically
        } else if (type === 'flyer') {
            this.body.setAllowGravity(false);
            this.body.setImmovable(true);
            this.startX = x;
            this.startY = y;
            // Simple sine wave flying
            scene.tweens.add({
                targets: this,
                y: y - 50,
                duration: 1000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
            this.setVelocityX(70);
            this.setBounceX(1);
        }
    }
    
    update(time, delta) {
        // Crawlers turn around at edges if we check floor, but bouncing handles walls.
        // Let's manually flip sprite based on velocity
        if (this.body.velocity.x > 0) {
            this.setFlipX(false);
        } else if (this.body.velocity.x < 0) {
            this.setFlipX(true);
        }
    }
    
    die() {
        this.body.enable = false;
        this.scene.tweens.add({
            targets: this,
            scaleY: 0.1,
            scaleX: 1.5,
            y: this.y + this.height/2,
            duration: 150,
            onComplete: () => this.destroy()
        });
        
        // Particle effect
        const particles = this.scene.add.particles(this.x, this.y, 'tile_shard', {
            speed: { min: -100, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            quantity: 5,
            tint: 0xffaa00
        });
        particles.explode();
    }
}
