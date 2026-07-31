class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load very minimal assets here, like a loading bar background or studio logo
    }

    create() {
        this.scene.start('PreloadScene');
    }
}
