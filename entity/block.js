class Block extends Entity {
    constructor(content, blockImage, posX, posY, width, height) {
        const sprite = new Sprite(blockImage, 0, 0, 512, 512);
        super(sprite, 'block', posX, posY, width, height);
        this.content = content;
        
        this.states = {
            fullAnim: 'full',
            emptyAnim: 'empty'
        };
        this.currentState = this.states.fullAnim;
    }

    draw(tool) {
        // Render block with solid color so it stands out
        if (this.currentState === this.states.emptyAnim) {
            tool.fillStyle = "#444";
            tool.fillRect(this.posX, this.posY, this.width, this.height);
            tool.strokeStyle = "#222";
            tool.strokeRect(this.posX, this.posY, this.width, this.height);
        } else {
            tool.fillStyle = "#ffcc00"; // golden
            tool.fillRect(this.posX, this.posY, this.width, this.height);
            tool.strokeStyle = "#cc9900";
            tool.strokeRect(this.posX, this.posY, this.width, this.height);
            
            // Draw a question mark or dot
            tool.fillStyle = "#000";
            tool.font = "bold 12px Arial";
            tool.textAlign = "center";
            tool.textBaseline = "middle";
            tool.fillText("?", this.posX + this.width/2, this.posY + this.height/2);
        }
    }
}
