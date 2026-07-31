const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 640,  // Base resolution for pixel art
    height: 360,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    backgroundColor: '#050510'
};
