class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const titleText = this.add.text(width / 2, height / 2 - 50, 'AETHERIA: NEON ASCEND', {
            font: '32px Courier',
            fill: '#00ffff'
        });
        titleText.setOrigin(0.5, 0.5);

        const startText = this.add.text(width / 2, height / 2 + 50, 'Click to Start', {
            font: '16px Courier',
            fill: '#ffffff'
        });
        startText.setOrigin(0.5, 0.5);

        // Blinking effect for start text
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            ease: 'Power1',
            yoyo: true,
            repeat: -1
        });

        this.input.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 1, shards: 0 });
        });
    }
}
