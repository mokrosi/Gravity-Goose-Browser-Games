class Physics {
    static TILE_SIZE = 32;

    // Hazard hitboxes are 15% smaller than their visual sprite so near-misses
    // don't kill the goose ("tough but fair").
    static get HAZARD_INSET() {
        return this.TILE_SIZE * 0.15;
    }

    static checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    // Returns a copy of `rect` shrunk by `inset` px on every side.
    static shrink(rect, inset) {
        return {
            x: rect.x + inset,
            y: rect.y + inset,
            width: rect.width - inset * 2,
            height: rect.height - inset * 2
        };
    }

    static solidInColumn(level, col, rowStart, rowEnd) {
        for (let row = rowStart; row <= rowEnd; row++) {
            if (level.isSolid(col, row)) return true;
        }
        return false;
    }

    static solidInRow(level, row, colStart, colEnd) {
        for (let col = colStart; col <= colEnd; col++) {
            if (level.isSolid(col, row)) return true;
        }
        return false;
    }

    static resolveX(entity, level, dt) {
        entity.x += entity.vx * dt;
        if (entity.vx === 0) return;

        const rowStart = Math.floor((entity.y + 0.1) / this.TILE_SIZE);
        const rowEnd = Math.floor((entity.y + entity.height - 0.1) / this.TILE_SIZE);

        if (entity.vx > 0) {
            const rightCol = Math.floor((entity.x + entity.width) / this.TILE_SIZE);
            if (this.solidInColumn(level, rightCol, rowStart, rowEnd)) {
                entity.x = rightCol * this.TILE_SIZE - entity.width;
                entity.vx = 0;
            }
        } else if (entity.vx < 0) {
            const leftCol = Math.floor(entity.x / this.TILE_SIZE);
            if (this.solidInColumn(level, leftCol, rowStart, rowEnd)) {
                entity.x = (leftCol + 1) * this.TILE_SIZE;
                entity.vx = 0;
            }
        }
    }

    static resolveY(entity, level, dt) {
        const oldY = entity.y;
        entity.y += entity.vy * dt;
        entity.onGround = false;
        entity.onCeiling = false;

        const gravDir = Math.sign(entity.gravity) || 1;
        const colStart = Math.floor((entity.x + 0.1) / this.TILE_SIZE);
        const colEnd = Math.floor((entity.x + entity.width - 0.1) / this.TILE_SIZE);

        if (entity.vy > 0) {
            const startRow = Math.floor((oldY + entity.height) / this.TILE_SIZE);
            const endRow = Math.floor((entity.y + entity.height) / this.TILE_SIZE);
            for (let row = startRow; row <= endRow; row++) {
                if (this.solidInRow(level, row, colStart, colEnd)) {
                    entity.y = row * this.TILE_SIZE - entity.height;
                    entity.vy = 0;
                    if (gravDir > 0) entity.onGround = true;
                    else entity.onCeiling = true;
                    break;
                }
            }
        } else if (entity.vy < 0) {
            const startRow = Math.floor(oldY / this.TILE_SIZE);
            const endRow = Math.floor(entity.y / this.TILE_SIZE);
            for (let row = startRow; row >= endRow; row--) {
                if (this.solidInRow(level, row, colStart, colEnd)) {
                    entity.y = (row + 1) * this.TILE_SIZE;
                    entity.vy = 0;
                    if (gravDir < 0) entity.onGround = true;
                    else entity.onCeiling = true;
                    break;
                }
            }
        } else {
            if (gravDir > 0) {
                const groundRow = Math.floor((entity.y + entity.height + 0.5) / this.TILE_SIZE);
                if (this.solidInRow(level, groundRow, colStart, colEnd)) {
                    entity.onGround = true;
                }
            } else {
                const ceilingRow = Math.floor((entity.y - 0.5) / this.TILE_SIZE);
                if (this.solidInRow(level, ceilingRow, colStart, colEnd)) {
                    entity.onGround = true;
                }
            }
        }
    }

    static enforceBounds(entity, level) {
        const worldWidth = level.width * this.TILE_SIZE;
        const worldHeight = level.height * this.TILE_SIZE;

        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        } else if (entity.x + entity.width > worldWidth) {
            entity.x = worldWidth - entity.width;
            entity.vx = 0;
        }

        if (entity.y > worldHeight + 100 || entity.y + entity.height < -100) {
            entity.isDead = true;
        }
    }

    static checkSteamVents(entity, level) {
        if (!level.steamVents || level.steamVents.length === 0) return;

        if (!entity.steamCooldown) entity.steamCooldown = 0;
        if (entity.steamCooldown > 0) {
            entity.steamCooldown--;
            return;
        }

        const hitBox = {
            x: entity.x + 4,
            y: entity.y,
            width: entity.width - 8,
            height: entity.height
        };

        for (const vent of level.steamVents) {
            if (this.checkCollision(hitBox, vent)) {
                const gravDir = Math.sign(entity.gravity) || 1;
                entity.vy = -750 * gravDir; // Strong upward/downward impulse
                entity.steamCooldown = 15; // frames
                
                // Allow a jump immediately after bouncing if we want? Or just treat it like an air launch
                entity.onGround = false;
                entity.onCeiling = false;
                entity.flipsInAir = 0; // Restore gravity flip so player can react mid-air
                
                // Optional: trigger particle effect on entity (could be handled in game loop, but here is fine for data)
                entity.steamLaunch = true;
                break;
            }
        }
    }
}
