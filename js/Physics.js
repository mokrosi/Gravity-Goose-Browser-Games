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

    /**
     * Axis-separated AABB resolution (X axis).
     * Moves the entity by vx*dt in sub-tile steps (never tunneling through a
     * solid tile), pushes it perfectly flush against walls and zeroes vx.
     */
    static resolveX(entity, level, dt) {
        if (entity.vx === 0) return;

        const dx = entity.vx * dt;
        const sign = Math.sign(dx);
        let remaining = Math.abs(dx);

        const rowStart = Math.floor(entity.y / this.TILE_SIZE);
        const rowEnd = Math.floor((entity.y + entity.height - 1) / this.TILE_SIZE);

        while (remaining > 0) {
            const step = Math.min(this.TILE_SIZE, remaining);
            entity.x += sign * step;
            remaining -= step;

            const colStart = Math.floor(entity.x / this.TILE_SIZE);
            const colEnd = Math.floor((entity.x + entity.width) / this.TILE_SIZE);

            if (sign > 0) {
                for (let col = colEnd; col >= colStart; col--) {
                    if (this.solidInColumn(level, col, rowStart, rowEnd)) {
                        entity.x = col * this.TILE_SIZE - entity.width;
                        entity.vx = 0;
                        return;
                    }
                }
            } else {
                for (let col = colStart; col <= colEnd; col++) {
                    if (this.solidInColumn(level, col, rowStart, rowEnd)) {
                        entity.x = (col + 1) * this.TILE_SIZE;
                        entity.vx = 0;
                        return;
                    }
                }
            }
        }
    }

    /**
     * Axis-separated AABB resolution (Y axis).
     * Moves the entity by vy*dt in sub-tile steps (no floor/ceiling tunneling),
     * pushes it flush against the surface and tracks the grounded state.
     * "Ground" is the surface gravity pulls the entity into, so this works
     * identically under inverted gravity (the ceiling becomes the floor).
     */
    static resolveY(entity, level, dt) {
        entity.onGround = false;
        entity.onCeiling = false;

        if (entity.vy === 0) return;

        const dy = entity.vy * dt;
        const sign = Math.sign(dy);
        let remaining = Math.abs(dy);
        const gravDir = Math.sign(entity.gravity);

        const colStart = Math.floor(entity.x / this.TILE_SIZE);
        const colEnd = Math.floor((entity.x + entity.width - 1) / this.TILE_SIZE);

        while (remaining > 0) {
            const step = Math.min(this.TILE_SIZE, remaining);
            entity.y += sign * step;
            remaining -= step;

            const rowStart = Math.floor(entity.y / this.TILE_SIZE);
            const rowEnd = Math.floor((entity.y + entity.height) / this.TILE_SIZE);

            if (sign > 0) {
                for (let row = rowEnd; row >= rowStart; row--) {
                    if (this.solidInRow(level, row, colStart, colEnd)) {
                        entity.y = row * this.TILE_SIZE - entity.height;
                        entity.vy = 0;
                        if (gravDir > 0) entity.onGround = true;
                        else entity.onCeiling = true;
                        return;
                    }
                }
            } else {
                for (let row = rowStart; row <= rowEnd; row++) {
                    if (this.solidInRow(level, row, colStart, colEnd)) {
                        entity.y = (row + 1) * this.TILE_SIZE;
                        entity.vy = 0;
                        if (gravDir < 0) entity.onGround = true;
                        else entity.onCeiling = true;
                        return;
                    }
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
}
