class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, width, height, distance, duration, isVertical = false) {
        // We'll generate a dummy texture for the platform too if we don't have one
        const key = `platform_${width}x${height}`;
        if (!scene.textures.exists(key)) {
            const g = scene.make.graphics();
            g.fillStyle(0x555555, 1);
            g.lineStyle(2, 0xaaaaaa, 1);
            g.fillRect(0, 0, width, height);
            g.strokeRect(0, 0, width, height);
            g.generateTexture(key, width, height);
            g.destroy();
        }
        
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this, false);
        
        this.body.setAllowGravity(false);
        this.body.setImmovable(true);
        // Important: custom friction for players standing on moving platform
        this.body.setFriction(1, 0); 
        
        // Movement tween
        scene.tweens.add({
            targets: this,
            x: isVertical ? x : x + distance,
            y: isVertical ? y + distance : y,
            duration: duration,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
}
