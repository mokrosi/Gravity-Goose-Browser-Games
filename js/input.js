

const input = {
    down: {},
    pressed: {},
    init() {
        if (this.initialized) return;
        this.initialized = true;
        window.addEventListener('keydown', e => {
            // console.log(e.code)
            this.down[e.code] = true
            this.pressed[e.code] = true
        })

        window.addEventListener('keyup', e => {
            delete this.down[e.code]
            // delete this.pressed[e.code]
        })
        
    },

    update(gameObj) {
        if(gameObj.userControl==false) return;
        let nano = gameObj.entities.nano
        if (this.isDown('ArrowLeft') || this.isDown('KeyA')) {
            nano.posX -= nano.velX
            nano.posX = Math.max(nano.posX, 0)
            nano.currentDirection = "left"
            if(nano.velY == 1.1) {
                nano.currentState = nano.states.walkingAnim
            }
        }
        else if (this.isDown('ArrowRight') || this.isDown('KeyD')) {
            nano.posX += nano.velX
            nano.currentDirection = "right"
            if(nano.velY == 1.1) {
                nano.currentState = nano.states.walkingAnim
            }
        }

        if(this.isDown('KeyX')) {
            nano.velX += 1 // hack
        }
        
        let jumpPressed = this.isPressed("Space") || this.isPressed("KeyW");
        let jumpDown = this.isDown("Space") || this.isDown("KeyW");

        if (nano.velY === 1.1) {
            nano.groundedFrames = 8;
        } else if (nano.groundedFrames > 0) {
            nano.groundedFrames--;
        }

        if (jumpPressed) {
            nano.jumpBuffer = 8;
        } else if (nano.jumpBuffer > 0) {
            nano.jumpBuffer--;
        }

        if (nano.jumpBuffer > 0 && nano.groundedFrames > 0) {
            nano.velY -= 9.5;
            nano.currentState = nano.states.jumpingAnim;
            audio.sounds.jump.play();
            nano.jumpBuffer = 0;
            nano.groundedFrames = 0;
            nano.jumpHoldFrames = 12;
        } else if (jumpDown && nano.jumpHoldFrames > 0) {
            nano.velY -= 0.25;
            nano.jumpHoldFrames--;
        } else {
            nano.jumpHoldFrames = 0;
        }

        if(this.isPressed('KeyM')) {
            audio.toggleMute()
        }

        if(this.isPressed('Equal')) {
            audio.volumeUp()
        }
        else if(this.isPressed('Minus')) {
            audio.volumeDown()
        }
    },

    isDown(key) {
        return this.down[key]
    },
    isPressed(key) {
        if (this.pressed[key]) {
            delete this.pressed[key]
            return true;
        } 
    }
}