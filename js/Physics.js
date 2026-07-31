class Physics {
    static TILE_SIZE = 32;

    static checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    static resolveTileCollision(entity, level) {
        // Broad phase: find tiles near the entity
        const startX = Math.floor(entity.x / this.TILE_SIZE);
        const endX = Math.floor((entity.x + entity.width) / this.TILE_SIZE);
        const startY = Math.floor(entity.y / this.TILE_SIZE);
        const endY = Math.floor((entity.y + entity.height) / this.TILE_SIZE);

        entity.onGround = false;
        entity.onCeiling = false;

        // Resolve X axis first
        entity.x += entity.vx;
        for (let y = startY; y <= endY; y++) {
            for (let x = Math.floor(entity.x / this.TILE_SIZE); x <= Math.floor((entity.x + entity.width) / this.TILE_SIZE); x++) {
                if (level.isSolid(x, y)) {
                    const tileRect = { x: x * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };
                    if (this.checkCollision(entity, tileRect)) {
                        if (entity.vx > 0) { // Moving right
                            entity.x = tileRect.x - entity.width;
                            entity.vx = 0;
                        } else if (entity.vx < 0) { // Moving left
                            entity.x = tileRect.x + tileRect.width;
                            entity.vx = 0;
                        }
                    }
                }
            }
        }

        // Recalculate X bounds after X resolution
        const newStartX = Math.floor(entity.x / this.TILE_SIZE);
        const newEndX = Math.floor((entity.x + entity.width) / this.TILE_SIZE);

        // Resolve Y axis
        entity.y += entity.vy;
        for (let y = Math.floor(entity.y / this.TILE_SIZE); y <= Math.floor((entity.y + entity.height) / this.TILE_SIZE); y++) {
            for (let x = newStartX; x <= newEndX; x++) {
                if (level.isSolid(x, y)) {
                    const tileRect = { x: x * this.TILE_SIZE, y: y * this.TILE_SIZE, width: this.TILE_SIZE, height: this.TILE_SIZE };
                    if (this.checkCollision(entity, tileRect)) {
                        if (entity.vy > 0) { // Moving down
                            entity.y = tileRect.y - entity.height;
                            entity.vy = 0;
                            if (entity.gravity > 0) entity.onGround = true; // Normal ground
                            else entity.onCeiling = true; // Reverse gravity ground
                        } else if (entity.vy < 0) { // Moving up
                            entity.y = tileRect.y + tileRect.height;
                            entity.vy = 0;
                            if (entity.gravity > 0) entity.onCeiling = true; // Hit ceiling normal
                            else entity.onGround = true; // Hit ground while reversed
                        }
                    }
                }
            }
        }
        
        // Prevent going out of world bounds (left/right)
        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        } else if (entity.x + entity.width > level.width * this.TILE_SIZE) {
            entity.x = level.width * this.TILE_SIZE - entity.width;
            entity.vx = 0;
        }

        // Death by falling out of world bounds (up/down)
        if (entity.y > level.height * this.TILE_SIZE + 100 || entity.y < -100) {
            entity.isDead = true;
        }
    }
}
