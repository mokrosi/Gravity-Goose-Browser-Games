class Bug extends Entity {
    constructor(bugImage, posX, posY, width, height) {
        const sprite = new Sprite(bugImage, 0, 0, 512, 512);
        super(sprite, 'bug', posX, posY, width, height)
        this.velX = 0.8
        this.velY = 0
        let self = this
        this.animFrame = {
            walking: new Sprite(bugImage, 0, 0, 512, 512),
            squashed: new Sprite(bugImage, 0, 0, 512, 512) // can scale Y in render later
        };
        // animation
        this.states = {
            walkingAnim: {
                animation(gameObj) {
                    self.sprite = self.animFrame.walking;
                },
                movement() {
                    if (self.currentDirection == "left") {
                        self.posX -= self.velX;
                    } else {
                        self.posX += self.velX;
                    }
                }
            },
            squashed: {
                movement() {
                    self.velX = 0
                },
                animation() {
                    self.sprite = self.animFrame.squashed
                }
            }

        }
        this.currentDirection = "left";
        this.currentState = this.states.walkingAnim;
    }
}
