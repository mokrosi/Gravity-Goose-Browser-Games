class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.isDead = false;
    }

    update(dt) {
        // Base update method
    }

    draw(ctx, camera) {
        // Base draw method, usually overridden
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
    }
}
