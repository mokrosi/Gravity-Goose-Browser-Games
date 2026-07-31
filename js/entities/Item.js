class Item extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.collected = false;
        this.startY = y;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 4;
    }

    update(dt) {
        if (this.collected) return;
        
        // Floating animation
        this.floatOffset += this.floatSpeed * dt;
        this.y = this.startY + Math.sin(this.floatOffset) * 4;
    }

    draw(ctx, camera, assetManager) {
        if (this.collected) return;

        const img = assetManager.getImage('bread');
        if (img) {
            ctx.drawImage(img, this.x - camera.x - 4, this.y - camera.y - 4, 32, 32);
        }
    }
}
