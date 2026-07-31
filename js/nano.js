class Sprite {
    constructor(img, srcX, srcY, srcW, srcH) {
        this.img = img
        this.srcX = srcX
        this.srcY = srcY
        this.srcW = srcW
        this.srcH = srcH
    }
}

class Entity {
    constructor(sprite, type, posX, posY, width, height) {
        this.sprite = sprite
        this.type = type
        this.posX = posX
        this.posY = posY
        this.height = height
        this.width = width
    }

    draw(tool) {
        tool.drawImage(
            this.sprite.img,
            this.sprite.srcX,
            this.sprite.srcY,
            this.sprite.srcW,
            this.sprite.srcH,
            this.posX,
            this.posY,
            this.width,
            this.height
        )
    }
}

class Nano extends Entity {
    constructor(spriteImg, posX, posY, width, height) {
        const sprite = new Sprite(spriteImg, 0, 0, 512, 512);
        super(sprite, 'nano', posX, posY, width, height)
        this.velX = 3
        this.velY = 0
        this.won = false
        this.big = false
        this.invincible = false

        this.animFrame = {
            stand: new Sprite(spriteImg, 0, 0, 512, 512)
        };

        this.states = {
            walkingAnim: gameObj => {
                this.sprite = this.animFrame.stand;
            },
            standingAnim: () => {
                this.sprite = this.animFrame.stand;
            },
            jumpingAnim: () => {
                this.sprite = this.animFrame.stand;
            },
            deadAnim: () => {
                this.sprite = this.animFrame.stand;
            }
        }

        this.currentDirection = "right"
        this.currentState = this.states.standingAnim;
    }

    automove() {
        if(this.won) {
            this.currentState = this.states.walkingAnim
            this.currentDirection = "right"
            this.posX += this.velX/2
        }
    }

    promote() {
        if(this.big) return;
        this.height *= 1.3
        this.width *= 1.3
        this.big = true
    }

    demote() {
        if(!this.big) return;
        this.height /= 1.3
        this.width /= 1.3
        this.big = false
        this.invincible = true
        setTimeout(() => {
            this.invincible = false
        }, 2000)
    }
}
