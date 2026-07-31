// Assign scenes to the config
config.scene = [BootScene, PreloadScene, MainMenuScene, GameScene];

// Start the game
window.onload = () => {
    const game = new Phaser.Game(config);
};
