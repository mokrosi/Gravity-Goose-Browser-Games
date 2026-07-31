class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.width = canvasWidth;
        this.height = canvasHeight;
    }

    follow(target, levelWidth, levelHeight) {
        // Center target on screen
        this.x = target.x + target.width / 2 - this.width / 2;
        this.y = target.y + target.height / 2 - this.height / 2;

        // Clamp camera to level bounds
        this.x = Math.max(0, Math.min(this.x, levelWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, levelHeight - this.height));
    }
}
