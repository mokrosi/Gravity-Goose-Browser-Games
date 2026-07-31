class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.promises = [];

        // Generate procedural pixel sprites immediately as fallback defaults!
        this.images['player'] = SpriteGenerator.generatePlayerSprite();
        this.images['bread'] = SpriteGenerator.generateBreadSprite();
        this.images['enemy_frog'] = SpriteGenerator.generateFrogSprite();
        this.images['tileset'] = SpriteGenerator.generateTileSprite();
        this.images['spikes'] = SpriteGenerator.generateSpikeSprite();
    }

    loadImage(key, src) {
        const promise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                resolve(img);
            };
            img.onerror = () => {
                console.log(`Using procedural pixel sprite fallback for '${key}'`);
                // Keeps procedural fallback generated in constructor
                resolve(this.images[key]);
            };
            img.src = src;
        });
        this.promises.push(promise);
    }

    getImage(key) {
        return this.images[key];
    }

    isDone() {
        return Promise.all(this.promises);
    }
}
