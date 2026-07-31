// Background entities for Nano Banana
class Ground extends Entity {
    constructor(tileset, posX, posY, width, height) {
        // Just use a chunk of the tile image
        let img = new Sprite(tileset, 0, 0, 512, 512); 
        super(img, "ground", posX, posY, width, height);
    }
}
class Pipe extends Entity {
    constructor(tileset, xPos, yPos, width, height) {
        const sprite = new Sprite(tileset, 0, 0, 512, 512); // placeholder tile
        super(sprite, 'pipe', xPos, yPos, width, height);
    }
}
class Stair extends Entity {
    constructor(tileset, xPos, yPos, width, height) {
        const sprite = new Sprite(tileset, 0, 0, 512, 512);
        super(sprite, 'stair', xPos, yPos, width, height);
    }
}
// We replace Clouds and Mountains with just distant background elements
class Mountain extends Entity {
    constructor(bgImage, xPos, yPos, width, height) {
        const sprite = new Sprite(bgImage, 0, 0, 512, 512);
        super(sprite, 'mountain', xPos, yPos, width, height);
    }
}
class SmallCloud extends Entity {
    constructor(bgImage, xPos, yPos, width, height) {
        const sprite = new Sprite(bgImage, 0, 0, 512, 512);
        super(sprite, 'cloud', xPos, yPos, width, height);
    }
}
class MediumCloud extends Entity {
    constructor(bgImage, xPos, yPos, width, height) {
        const sprite = new Sprite(bgImage, 0, 0, 512, 512);
        super(sprite, 'cloud', xPos, yPos, width, height);
    }
}
class LargeCloud extends Entity {
    constructor(bgImage, xPos, yPos, width, height) {
        const sprite = new Sprite(bgImage, 0, 0, 512, 512);
        super(sprite, 'cloud', xPos, yPos, width, height);
    }
}
class Flag extends Entity {
    constructor(bananaImage, xPos, yPos, width, height) {
        const sprite = new Sprite(bananaImage, 0, 0, 512, 512);
        super(sprite, 'flag', xPos, yPos, width, height);
    }
}
class Flagpole extends Entity {
    constructor(tileset, xPos, yPos, width, height) {
        const sprite = new Sprite(tileset, 0, 0, 512, 512);
        super(sprite, 'flag', xPos, yPos, width, height);
    }
}
class Castle extends Entity {
    constructor(tileset, xPos, yPos, width, height) {
        const sprite = new Sprite(tileset, 0, 0, 512, 512);
        super(sprite, 'castle', xPos, yPos, width, height);
    }
}