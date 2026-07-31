const groundOffset = 193

const render = {
    init(gameObj) {
        // drawSky
        gameObj.tool.fillStyle = "#0d1117"
        gameObj.tool.fillRect(0, 0, window.innerWidth, window.innerHeight);
        const nano = gameObj.entities.nano
        gameObj.levelBuilder.stock(gameObj)
        gameObj.tool.drawImage(
            nano.sprite.img,
            nano.sprite.srcX,
            nano.sprite.srcY,
            nano.sprite.srcW,
            nano.sprite.srcH,
            nano.posX,
            nano.posY,
            nano.width,
            nano.height
        )

    },
    update(gameObj) {
        this.updateFrame(gameObj)
        gameObj.tool.save();
        if (gameObj.shakeFrames > 0) {
            const dx = (Math.random() - 0.5) * 10;
            const dy = (Math.random() - 0.5) * 10;
            gameObj.tool.translate(dx, dy);
            gameObj.shakeFrames--;
        }

        gameObj.tool.clearRect(-10, -10, window.innerWidth + 20, window.innerHeight + 20);
        gameObj.tool.fillStyle = "#0d1117"
        gameObj.tool.fillRect(0, 0, window.innerWidth, window.innerHeight);

        gameObj.levelBuilder.render(gameObj)
        const camera = gameObj.camera
        const nano = gameObj.entities.nano
        this.drawEntity(camera, nano, gameObj)

        gameObj.entities.bugs.forEach(bug => {
            this.drawEntity(camera, bug, gameObj)
        })

        gameObj.entities.particles.forEach(particle => {
            this.drawEntity(camera, particle, gameObj)
        })

        gameObj.entities.bananas.forEach(banana => {
            this.drawEntity(camera, banana, gameObj)
        })

        if(gameObj.userControl == false) {
            // handled by DOM UI now
        }
        
        gameObj.tool.restore();

        // Update HUD
        document.getElementById('banana-count').innerText = gameObj.bananasCollected || 0;
        document.getElementById('level-indicator').innerText = localStorage.getItem('nano_level') || 1;
    },
    drawEntities(entities, camera, gameObj) {
        entities.forEach(ent => {
            this.drawEntity(camera, ent, gameObj)
        })
    },
    drawEntity(camera, entity, gameObj) {
        if (!entity || !entity.sprite) return;
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

    },
    updateFrame(gameObj) {
        if (!gameObj.entities.nano) return;
        const center = gameObj.entities.nano.posX + gameObj.entities.nano.width / 2;
        const dist = window.innerWidth / 9;
        gameObj.camera.start = Math.max(center - dist, 0);
    }
}

class Game {
    constructor() {
        this.gameObj = null;
    }
    
    init() {
        document.getElementById('btn-start').addEventListener('click', () => {
            document.getElementById('main-menu').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
            this.startGame();
        });
        document.getElementById('btn-restart').addEventListener('click', () => {
            document.getElementById('game-over').classList.add('hidden');
            this.startGame();
        });
    }
    
    startGame() {
        if (this.gameObj && this.gameObj.reqId) {
            cancelAnimationFrame(this.gameObj.reqId);
        }
        document.getElementById('level-screen').classList.remove('hidden');
        document.getElementById('level-title').innerText = `SYSTEM PARTITION ${parseInt(localStorage.getItem('nano_level')) || 1}`;

        let currentLevelIndex = parseInt(localStorage.getItem('nano_level')) || 1;
        if (currentLevelIndex > 5) currentLevelIndex = 1;
        const currentLevel = levels[currentLevelIndex - 1];

        const canvas = document.querySelector('.board')
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        const tool = canvas.getContext("2d")
        tool.setTransform(1, 0, 0, 1, 0, 0);
        const entities = { scenery: [], bricks: [], particles: [], blocks: [], bananas: [], bugs: [] }
        const camera = {
            start: 0,
            width: window.innerWidth/2
        }

        this.gameObj = {
            tool,
            canvas,
            entities,
            animFrame: 0,
            levelBuilder: null,
            camera,
            reset: () => this.reset(this.gameObj),
            nextLevel: () => this.nextLevel(this.gameObj),
            userControl : true,
            bananasCollected: 0
        }

        preload().then((images) => {
            document.getElementById('level-screen').classList.add('hidden');
            this.gameObj.camera = new Camera()
            // Pass the images to levelBuilder and Nano
            this.gameObj.levelBuilder = new LevelBuilder(currentLevel, images)
            this.gameObj.entities.nano = new Nano(images.spriteSheetImage, 175, -20, 24, 24)
            if (currentLevel.bugs) {
                currentLevel.bugs.forEach(coord => {
                    this.gameObj.entities.bugs.push(
                        new Bug(images.bugImage, ...coord)
                    )
                });
            }

            render.init(this.gameObj)

            input.init();
            audio.init();
            this.update(this.gameObj)
        }).catch(err => console.error("Error starting game:", err))
    }

    update(gameObj) {
        function gameloop() {
            if (!gameObj.paused) {
                input.update(gameObj)
                animation.update(gameObj)
                physics.update(gameObj)
                movement.update(gameObj)
                gameObj.animFrame++
            }
            render.update(gameObj)
            gameObj.reqId = requestAnimationFrame(gameloop)
        }
        gameloop()
    }

    reset(gameObj) {
        if (gameObj) gameObj.paused = true;
        setTimeout(() => {
            if (gameObj && gameObj.reqId) {
                cancelAnimationFrame(gameObj.reqId);
            }
            
            if (gameObj && gameObj.winState) {
                // Next level transition handles this
            } else if (gameObj && !gameObj.userControl) {
                document.getElementById('game-over').classList.remove('hidden');
            } else {
                this.startGame(); // instant restart
            }
        }, (gameObj && !gameObj.userControl && !gameObj.winState) ? 2000 : 500);
    }

    nextLevel(gameObj) {
        let level = parseInt(localStorage.getItem('nano_level')) || 1;
        if (level < 5) {
            localStorage.setItem('nano_level', level + 1);
            
            // show transition screen
            const tScreen = document.getElementById('level-screen');
            document.getElementById('level-title').innerText = "SYSTEM PARTITION " + (level + 1);
            tScreen.classList.remove('hidden');
            setTimeout(() => {
                tScreen.classList.add('hidden');
                this.startGame();
            }, 2000);
            
        } else {
            if (gameObj) gameObj.winState = true;
            localStorage.setItem('nano_level', 1);
            document.getElementById('level-title').innerText = "SYSTEM SECURED - YOU WIN";
            document.getElementById('level-screen').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('level-screen').classList.add('hidden');
                document.getElementById('main-menu').classList.remove('hidden');
            }, 3000);
        }
    }
}
const game = new Game()
game.init()


document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === 'visible') {
        // audio.sounds.bgTheme.play()
    } else {
        // audio.sounds.bgTheme.pause()
    }
});
