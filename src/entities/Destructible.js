class Destructible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type) {
        // Create dummy texture for destructible
        const key = `prop_${type}`;
        if (!scene.textures.exists(key)) {
            const g = scene.make.graphics();
            if (type === 'cooler') {
                // Water cooler
                g.fillStyle(0x0088ff, 0.8).fillRect(4, 0, 16, 20); // water bottle
                g.fillStyle(0xdddddd, 1).fillRect(0, 20, 24, 20); // base
            } else {
                // Desk
                g.fillStyle(0x8b4513, 1).fillRect(0, 0, 48, 8); // top
                g.fillRect(4, 8, 8, 24); // leg 1
                g.fillRect(36, 8, 8, 24); // leg 2
            }
            g.generateTexture(key, type === 'cooler' ? 24 : 48, type === 'cooler' ? 40 : 32);
            g.destroy();
        }

        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body initially

        this.propType = type;
        this.isBroken = false;
    }

    breakProp() {
        if (this.isBroken) return;
        this.isBroken = true;

        // Visual break
        this.scene.tweens.add({
            targets: this,
            scaleY: 0.2,
            scaleX: 1.2,
            alpha: 0,
            y: this.y + this.height / 2,
            duration: 200,
            onComplete: () => this.destroy()
        });

        // Particles
        const color = this.propType === 'cooler' ? 0x0088ff : 0x8b4513;
        const particles = this.scene.add.particles(this.x, this.y, 'tile_shard', {
            speed: { min: 50, max: 200 },
            angle: { min: 180, max: 360 }, // Burst upwards
            scale: { start: 1, end: 0 },
            lifespan: 600,
            quantity: 10,
            gravityY: 800,
            tint: color
        });
        particles.explode();
        
        sfx.hit();
        this.scene.cameras.main.shake(100, 0.01);
    }
}
