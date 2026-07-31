const physics = {
    g: 0.4,
    update(gameObj) {
        this.gravity(gameObj.entities.nano)
        gameObj.entities.bugs.forEach(g => this.gravity(g))
        gameObj.entities.particles.forEach(k => this.gravity(k))

        this.bgEntityCollision(gameObj)

        this.entityNanoCol(gameObj)
        this.staticEntityCol(gameObj)

        this.checkFallign(gameObj.entities.nano, gameObj)
        gameObj.entities.bugs.forEach(g => this.checkFallign(g))
    },
    staticEntityCol(gameObj) {
        // no-op for now
    },
    entityNanoCol(gameObj) {
        const { nano, bugs, bricks, blocks, bananas } = gameObj.entities;
        if (nano.currentState == nano.states.deadAnim) {
            return;
        }
        bugs.forEach(bug => {
            if (this.checkRectCollision(nano, bug)) {
                this.handleCol(nano, bug, gameObj)
            }
        })
        
        blocks.forEach(block => {
            if (this.checkRectCollision(nano, block)) {
                const wantToReveal = this.handleDirec(block, nano)
                if (wantToReveal) {
                    if (block.currentState == block.states.fullAnim) {
                        if(block.content == "banana") {
                            gameObj.bananasCollected++;
                            // block.createBanana(gameObj) // We just increment directly for simplicity
                        }
                        audio.sounds.bump.play()
                        block.currentState = block.states.emptyAnim
                    }
                    else {
                        audio.sounds.bump.play()
                    }
                }
            }
        })

        bricks.forEach(brick => {
            if (this.checkRectCollision(nano, brick)) {
                const wantToBreak = this.handleDirec(brick, nano)
                if (wantToBreak) {
                    let idx = gameObj.entities.bricks.indexOf(brick);
                    // brick.createParticles(gameObj)
                    audio.sounds.breakBrick.play()
                    gameObj.shakeFrames = 5;
                    gameObj.entities.bricks.splice(idx, 1);
                }
            }
        })

        bananas.forEach(banana => {
            if(this.checkRectCollision(banana, nano)) {
                let idx = bananas.indexOf(banana)
                bananas.splice(idx, 1);
                gameObj.bananasCollected++;
                // Add sound
            }
        })
    },
    handleCol(nano, entity, gameObj) {
        // top 
        if (nano.posY + nano.height > entity.posY && nano.posY < entity.posY && nano.posY + nano.height < entity.posY + entity.height && nano.velY > 0) {
            if (entity.type == "bug") {
                this.enemyDeath(entity, gameObj);
                nano.velY = -5; // bounce
            }
        } else {
            // left or right
            if (entity.type == "bug") {
                if (entity.currentState != entity.states.squashed) {
                    this.nanoDeath(nano, gameObj)
                }
            }
        }
    },
    nanoDeath(nano, gameObj) {
        if(nano.invincible) return;
        nano.velX = 0
        nano.velY = this.getVelocityForDist(100)
        gameObj.userControl = false;
        nano.currentState = nano.states.deadAnim
        audio.sounds.bgTheme.pause();
        audio.sounds.bgTheme.currentTime = 0;
        audio.sounds.nanoDead.play()
    },
    enemyDeath(entity, gameObj) {
        if (entity.type == "bug") {
            entity.currentState = entity.states.squashed
            audio.sounds.stomp.play()
            gameObj.shakeFrames = 5;
            setTimeout(() => {
                const idx = gameObj.entities.bugs.indexOf(entity)
                if(idx > -1) gameObj.entities.bugs.splice(idx, 1);
            }, 200)
        }
    },
    gravity(entity) {
        entity.velY += this.g
        entity.posY += entity.velY
    },
    bgEntityCollision(gameObj) {
        const nano = gameObj.entities.nano
        const bugs = gameObj.entities.bugs
        if (nano.currentState != nano.states.deadAnim) {
            this.bgCollision(nano, gameObj)
        }
        bugs.forEach(g => {
            this.bgCollision(g, gameObj)
        })
    },
    bgCollision(entity, gameObj) {
        gameObj.entities.scenery.forEach(scene => {
            if (scene.type == 'pipe' || scene.type == 'stair') {
                if (this.checkRectCollision(scene, entity)) {
                    this.handleDirec(scene, entity)
                }
            }
            if (scene.type == 'ground' && this.checkRectCollision(scene, entity)) {
                if (entity.posY < scene.posY && entity.posX + entity.width > scene.posX && scene.posX + scene.posY > entity.posX && entity.velY >= 0) {
                    entity.posY = scene.posY - entity.height
                    entity.velY = 1.1
                    if (entity.type == "nano") {
                        entity.currentState = entity.states.standingAnim
                    }
                }
            }

            if (scene.type == "flag" && entity.type == "nano" && this.checkRectCollision(scene, entity)) {
                this.handleLevelUp(gameObj, entity)
            }
            if (scene.type == "castle" && entity.type == "nano" && entity.posX >= scene.posX + scene.width / 2) {
                if (entity.won) {
                    entity.won = false
                    gameObj.nextLevel()
                }
            }
        })
    },
    handleLevelUp(gameObj, nano) {
        audio.sounds.bgTheme.pause()
        audio.sounds.levelComplete.play()
        gameObj.userControl = false;
        nano.won = true;
    },
    handleDirec(scene, entity) {
        // bottom 
        if (entity.posY > scene.posY && entity.posX + entity.width > scene.posX && scene.posX + scene.posY > entity.posX && entity.velY < 0) {
            if(scene.posX-entity.width/2 < entity.posX && entity.posX < scene.posX-entity.width/2+scene.width) {
                if (scene.type == "brick" || scene.type == "block") {
                    entity.posY = scene.posY + scene.height;
                    entity.velY = 0.1;
                    return true;
                }
                return false;
            }
        }
        // left
        if (entity.posX <= scene.posX && entity.posY >= scene.posY) {
            entity.posX = scene.posX - entity.width
            if (entity.type == 'bug') {
                entity.currentDirection = entity.currentDirection == "right" ? "left" : "right";
            }
        }
        // right 
        if (entity.posX >= scene.posX && entity.posY >= scene.posY) {
            entity.posX = scene.posX + scene.width
            if (entity.type == 'bug') {
                entity.currentDirection = entity.currentDirection == "right" ? "left" : "right";
            }
        }
        // top
        if (entity.posY < scene.posY && entity.posX + entity.width > scene.posX && scene.posX + scene.posY > entity.posX && entity.velY >= 0) {
            entity.posY = scene.posY - entity.height
            if(entity.type == "nano") {
                entity.currentState = entity.states.standingAnim
            }
            entity.velY = 1.1
        }
    },
    checkFallign(entity, gameObj) {
        if (entity.posY > 250) {
            if (entity.type == 'nano' && !entity.fallen) {
                entity.fallen = true;
                if (entity.currentState != entity.states.deadAnim) {
                    this.nanoDeath(entity, gameObj)
                }
                gameObj.reset()
            }
        }
    },
    checkRectCollision(scene, entity) {
        let l1 = scene.posX;
        let l2 = entity.posX;
        let r1 = scene.posX + scene.width;
        let r2 = entity.posX + entity.width;
        let t1 = scene.posY + scene.height;
        let t2 = entity.posY + entity.height;
        let b1 = scene.posY;
        let b2 = entity.posY;
        if (r2 > l1 && l2 < r1 && t2 > b1 && t1 > b2) {
            return true;
        }
        return false;
    },
    checkCollision(entity) {
        if (entity.posY + entity.height >= groundOffset && entity.velY > 0) {
            entity.posY = groundOffset - entity.height - 1
            entity.velY = 0
            entity.currentState = entity.states.standingAnim
        }
    },
    getVelocityForDist(s) {
        return (- Math.sqrt(2 * this.g * s));
    }
}