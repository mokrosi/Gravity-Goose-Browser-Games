class Banana extends Entity {
    constructor(bananaImage, posX, posY, width, height) {
        const sprite = new Sprite(bananaImage, 0, 0, 512, 512);
        super(sprite, 'banana', posX, posY, width, height);
        const self = this;
        this.velY = -0.7

        this.states = {
            spinning: {
                animation: (gameObj) => {
                    this.sprite = new Sprite(bananaImage, 0, 0, 512, 512);
                },
                movement: () => {
                    this.posY += this.velY
                }
            }
        }

        this.currentState = this.states.spinning
    }
}