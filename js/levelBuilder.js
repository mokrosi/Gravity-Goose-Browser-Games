class LevelBuilder {
    constructor(level) {
        this.sceneryEntities = []
        this.bricks = []
        this.blocks = []
        if (level.ground) level.ground.forEach((coord) => {
            this.sceneryEntities.push(new Ground(tilesetImage, ...coord))
        })
        if (level.shrubs) level.shrubs.forEach((shrub) => {
            // Shrub replaced with tile block if needed, but not in our new entities, let's just map it to Ground
            this.sceneryEntities.push(new Ground(tilesetImage, shrub[0], shrub[1], shrub[2], shrub[3]));
        });
        if (level.mountains) level.mountains.forEach((mountain) => {
            this.sceneryEntities.push(new Mountain(bgImage, mountain[0], mountain[1], mountain[2], mountain[3]));
        });
        if (level.pipes) level.pipes.forEach((pipe) => {
            this.sceneryEntities.push(new Pipe(tilesetImage, pipe[0], pipe[1], pipe[2], pipe[3]));
        });
        if (level.smallClouds) level.smallClouds.forEach((smallCloud) => {
            this.sceneryEntities.push(new SmallCloud(bgImage, smallCloud[0], smallCloud[1], smallCloud[2], smallCloud[3]));
        });
        if (level.mediumClouds) level.mediumClouds.forEach((mediumCloud) => {
            this.sceneryEntities.push(new MediumCloud(bgImage, mediumCloud[0], mediumCloud[1], mediumCloud[2], mediumCloud[3]));
        });
        if (level.largeClouds) level.largeClouds.forEach((largeCloud) => {
            this.sceneryEntities.push(new LargeCloud(bgImage, largeCloud[0], largeCloud[1], largeCloud[2], largeCloud[3]));
        });
        if (level.stairs) level.stairs.forEach((brick) => {
            this.sceneryEntities.push(new Stair(tilesetImage, brick[0], brick[1], brick[2], brick[3]));
        });
        if (level.bricks) level.bricks.forEach((brick) => {
            // Brick requires class Brick but it's defined elsewhere, assuming tilesetImage works
            this.bricks.push(new Brick(tilesetImage, brick[0], brick[1], brick[2], brick[3]));
        });
        if (level.flag) {
            this.sceneryEntities.push(new Flag(bananaImage, level.flag[0], level.flag[1], level.flag[2], level.flag[3]));
        }
        if (level.flagpole) {
            this.sceneryEntities.push(new Flagpole(tilesetImage, level.flagpole[0], level.flagpole[1], level.flagpole[2], level.flagpole[3]));
        }
        if (level.castle) {
            this.sceneryEntities.push(new Castle(tilesetImage, level.castle[0], level.castle[1], level.castle[2], level.castle[3]));
        }
        if (level.bananas) level.bananas.forEach(banana => {
            this.blocks.push(new Block('banana', bananaImage, ...banana))
        })
        if (level.mushrooms) level.mushrooms.forEach(mus => {
            this.blocks.push(new Block('mushroom', tilesetImage, ...mus))
        })
    }

    stock(gameObj) {
        this.sceneryEntities.forEach((entity) => {
            gameObj.entities.scenery.push(entity);
        })
        this.bricks.forEach(brick => {
            gameObj.entities.bricks.push(brick)
        })
        this.blocks.forEach(block => {
            gameObj.entities.blocks.push(block)
        })
    }

    render(gameObj) {
        const camera = gameObj.camera
        gameObj.entities.scenery.forEach(entity => {
            this.drawEntity(camera, entity, gameObj)
        })
        gameObj.entities.bricks.forEach(brick => {
            this.drawEntity(camera, brick, gameObj)
        })
        this.drawEntities(gameObj.entities.blocks, camera, gameObj)
    }

    drawEntities(entities, camera, gameObj) {
        entities.forEach(ent => {
            this.drawEntity(camera, ent, gameObj)
        })
    }

    drawEntity(camera, entity, gameObj) {
        const entityEnd = entity.posX + entity.width
        const frameEnd = camera.start + camera.width
        if (entityEnd >= camera.start && entity.posX <= frameEnd) {
            gameObj.tool.drawImage(
                entity.sprite.img,
                entity.sprite.srcX,
                entity.sprite.srcY,
                entity.sprite.srcW,
                entity.sprite.srcH,
                entity.posX - camera.start,
                entity.posY,
                entity.width,
                entity.height
            )
        }
    }
}