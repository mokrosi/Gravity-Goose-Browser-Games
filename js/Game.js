class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.assetManager = new AssetManager();
        this.input = new InputHandler();
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.levelManager = new LevelManager();
        this.soundManager = new SoundManager();
        this.particleSystem = new ParticleSystem();

        this.player = null;
        
        this.state = 'START'; // START, PLAYING, PAUSED, LEVEL_COMPLETE, GAME_OVER, VICTORY
        this.lastTime = 0;
        
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 0;

        // Parallax stars
        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({
                x: Math.random() * 1600,
                y: Math.random() * 1200,
                size: Math.random() > 0.8 ? 2 : 1,
                alpha: 0.3 + Math.random() * 0.7,
                speed: 0.2 + Math.random() * 0.5
            });
        }

        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-next-level').addEventListener('click', () => this.nextLevel());
        document.getElementById('btn-restart').addEventListener('click', () => this.resetGame());
        document.getElementById('btn-play-again').addEventListener('click', () => this.resetGame());

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.state === 'PLAYING') {
                e.preventDefault();
                this.pauseGame();
            }
        });
    }

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active', 'hidden'));
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
        document.getElementById(id).classList.add('active');
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    }

    startGame() {
        this.soundManager.init();
        this.soundManager.playStart();
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 0;
        this.loadLevel();
    }

    loadLevel() {
        if (this.levelManager.loadLevel(this.currentLevel)) {
            this.player = new Player(this.levelManager.playerStart.x, this.levelManager.playerStart.y);
            this.state = 'PLAYING';
            this.hideAllScreens();
            document.getElementById('hud').classList.remove('hidden');
            this.updateHUD();
        } else {
            // Victory
            this.state = 'VICTORY';
            this.soundManager.playWin();
            this.showScreen('victory-screen');
            document.getElementById('hud').classList.add('hidden');
        }
    }

    pauseGame() {
        this.state = 'PAUSED';
        this.showScreen('pause-screen');
    }

    resumeGame() {
        this.state = 'PLAYING';
        this.hideAllScreens();
    }

    nextLevel() {
        this.currentLevel++;
        this.loadLevel();
    }

    resetGame() {
        this.startGame();
    }

    screenShake() {
        const container = document.getElementById('game-container');
        container.classList.remove('shake');
        void container.offsetWidth; // trigger reflow
        container.classList.add('shake');
    }

    updateHUD() {
        document.getElementById('hud-level').innerText = this.currentLevel + 1;
        document.getElementById('hud-score').innerText = this.score;
        document.getElementById('hud-lives').innerText = '❤️'.repeat(this.lives);
    }

    start() {
        this.assetManager.isDone().then(() => {
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));
        });
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        this.player.update(dt, this.input, this.levelManager, this.soundManager, this.particleSystem);
        this.particleSystem.update(dt);

        // Check Spike Hazard collisions
        for (let hazard of this.levelManager.hazards) {
            if (Physics.checkCollision(this.player, hazard)) {
                this.player.isDead = true;
            }
        }

        // Check death
        if (this.player.isDead) {
            this.soundManager.playHurt();
            this.particleSystem.emitHurt(this.player.x + 14, this.player.y + 14);
            this.lives--;
            this.screenShake();
            this.updateHUD();

            if (this.lives <= 0) {
                this.state = 'GAME_OVER';
                this.showScreen('game-over-screen');
                document.getElementById('hud').classList.add('hidden');
            } else {
                // Respawn
                this.player = new Player(this.levelManager.playerStart.x, this.levelManager.playerStart.y);
            }
            return;
        }

        // Update enemies
        for (let enemy of this.levelManager.entities) {
            enemy.update(dt, this.levelManager);
            
            // Check collision with player
            if (!enemy.isDead && Physics.checkCollision(this.player, enemy)) {
                this.player.isDead = true;
            }
        }

        // Update items (Bread)
        let allItemsCollected = true;
        for (let item of this.levelManager.items) {
            item.update(dt);
            if (!item.collected) {
                if (Physics.checkCollision(this.player, item)) {
                    item.collected = true;
                    this.score++;
                    this.soundManager.playCollect();
                    this.particleSystem.emitBreadCollect(item.x + 12, item.y + 12);
                    this.updateHUD();
                } else {
                    allItemsCollected = false;
                }
            }
        }

        // Win condition for level
        if (allItemsCollected && this.levelManager.items.length > 0) {
            this.state = 'LEVEL_COMPLETE';
            this.soundManager.playWin();
            document.getElementById('level-bread-score').innerText = this.score;
            this.showScreen('level-complete-screen');
        }

        this.camera.follow(this.player, this.levelManager.width * this.levelManager.tileSize, this.levelManager.height * this.levelManager.tileSize);
    }

    drawParallaxBackground() {
        // Deep Space Background with Parallax Starfield & Synth Grid
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Parallax Stars
        this.ctx.fillStyle = '#ffffff';
        for (let star of this.stars) {
            let px = (star.x - this.camera.x * star.speed) % this.canvas.width;
            let py = (star.y - this.camera.y * star.speed) % this.canvas.height;
            if (px < 0) px += this.canvas.width;
            if (py < 0) py += this.canvas.height;

            this.ctx.globalAlpha = star.alpha;
            this.ctx.fillRect(px, py, star.size, star.size);
        }
        this.ctx.globalAlpha = 1.0;

        // Distant Grid Lines (Retro Synthwave Horizon feel)
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        this.ctx.lineWidth = 1;
        const gridSize = 40;
        const offsetX = -(this.camera.x * 0.3) % gridSize;
        const offsetY = -(this.camera.y * 0.3) % gridSize;

        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    draw() {
        this.drawParallaxBackground();

        if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'LEVEL_COMPLETE') {
            this.levelManager.draw(this.ctx, this.camera, this.assetManager);
            
            for (let item of this.levelManager.items) {
                item.draw(this.ctx, this.camera, this.assetManager);
            }

            for (let enemy of this.levelManager.entities) {
                enemy.draw(this.ctx, this.camera, this.assetManager);
            }

            if (this.player) {
                this.player.draw(this.ctx, this.camera, this.assetManager);
            }

            this.particleSystem.draw(this.ctx, this.camera);
        }
    }

    loop(timestamp) {
        // Delta time in seconds, capped to avoid tunneling / spiral-of-death
        // on lag spikes (physics is fully frame-rate independent).
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();
        this.input.update();

        requestAnimationFrame((t) => this.loop(t));
    }
}
