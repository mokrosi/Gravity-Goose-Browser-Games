class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.assetManager = new AssetManager();
        this.input = new InputHandler();
        this.touchControls = new TouchControls(this.input);
        // Touch escape-hatch: the on-screen pause button mirrors the ESC key.
        this.touchControls.onPause = () => {
            if (this.state === 'PLAYING') this.pauseGame();
        };
        if (TouchControls.isTouchDevice()) {
            document.body.classList.add('touch-device');
        }
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.levelManager = new LevelManager();
        this.soundManager = new SoundManager();
        this.particleSystem = new ParticleSystem();
        this.mechanicToasts = new MechanicToasts(this);
        this.hintSystem = new HintSystem(this);
        this.achievements = new AchievementsManager(this);
        this.victoryCinematic = new VictoryCinematic('victory-canvas');

        this.player = null;
        
        this.state = 'START'; // START, LEVEL_SELECT, PLAYING, PAUSED, SETTINGS, LEVEL_COMPLETE, GAME_OVER, VICTORY
        this.lastTime = 0;
        
        this.score = 0;
        this.lives = 3;
        this.currentLevel = 0;

        // Level 20 boss-fight state: after all 4 switches are hit the boss
        // plays a dying animation before the Final Victory screen appears.
        this.bossDeathTimer = 0;
        this.bossVictoryShown = false;

        // Speedrun timer (seconds, frozen when not PLAYING)
        this.levelTimer = 0;
        this.totalTimer = 0;

        // Practice Mode: stakes-free run of an already-unlocked level.
        // Deaths never end the run and a clear never writes to the save file.
        this.practiceRun = false;

        // Persistent progress & settings (localStorage via SaveManager)
        this.save = new SaveManager();

        // Screen to return to when the settings menu is closed
        this.settingsReturn = 'start-screen';

        // Golden Breadcrumbs (optional 100% completion collectibles)
        this.crumbCollected = 0;
        this.crumbTotal = 0;
        this.totalCrumbCollected = 0;
        this.totalCrumbs = 0;

        // Run stats shown on the Final Victory screen
        this.totalDeaths = 0;
        this.totalBread = 0;

        // Best-run ghost replay
        this.ghost = new Ghost();

        // Cached HUD element updated every frame
        this.hudTimeEl = document.getElementById('hud-time');
        this.hudFlipFillEl = document.getElementById('hud-flip-fill');
        this.hudBlinkFillEl = document.getElementById('hud-blink-fill');
        this.hudBossItemEl = document.getElementById('hud-boss-item');
        this.hudBossEl = document.getElementById('hud-boss');

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
        const bind = (id, event, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, fn);
        };

        bind('btn-start', 'click', () => {
            this.requestImmersiveMode();
            this.startGame();
        });
        bind('btn-level-select', 'click', () => {
            this.requestImmersiveMode();
            this.goToLevelSelect();
        });
        bind('btn-level-select-back', 'click', () => this.goToStart());
        bind('btn-start-settings', 'click', () => this.openSettings('start-screen'));
        bind('btn-open-settings', 'click', () => this.openSettings('pause-screen'));
        bind('btn-settings-back', 'click', () => this.settingsBack());
        bind('btn-quit', 'click', () => this.quitToMenu());
        bind('btn-resume', 'click', () => this.resumeGame());
        bind('btn-next-level', 'click', () => this.nextLevel());
        bind('btn-restart', 'click', () => this.retryLevel());
        bind('btn-play-again', 'click', () => this.startGame());
        bind('btn-speedrun', 'click', () => {
            this.requestImmersiveMode();
            this.startLevel(0);
        });
        bind('btn-achievements', 'click', () => this.openAchievements('start-screen'));
        bind('btn-achievements-back', 'click', () => this.achievementsBack());
        bind('btn-reset-records', 'click', () => this.resetRecords());
        bind('btn-share-level', 'click', () => {
            const time = this.formatTime(this.levelTimer);
            this.shareRun(`I cleared Level ${this.currentLevel + 1} in ${time} in Gravity Goose! 🥪⚡`);
        });
        bind('btn-share-victory', 'click', () => {
            const time = this.formatTime(this.totalTimer);
            this.shareRun(`I beat Gravity Goose Level 30 & defeated the Final Boss in ${time}! 🏆🍞`);
        });

        bind('sfx-volume', 'input', () => {
            const volumeSlider = document.getElementById('sfx-volume');
            if (volumeSlider) {
                const vol = parseInt(volumeSlider.value, 10) / 100;
                const volVal = document.getElementById('sfx-volume-value');
                if (volVal) volVal.innerText = Math.round(vol * 100) + '%';
                this.save.setSfxVolume(vol);
                this.soundManager.setVolume(vol);
            }
        });
        bind('screen-shake-toggle', 'change', (e) => {
            this.save.setScreenShake(e.target.checked);
        });
        bind('assist-mode-toggle', 'change', (e) => {
            this.save.setAssistMode(e.target.checked);
        });

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
        this.input.clear();
    }

    requestImmersiveMode() {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen error:', err));
        }
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => console.log('Orientation lock error:', err));
        }
    }

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        this.input.clear();
        if (this.victoryCinematic) this.victoryCinematic.stop();
    }

    startGame() {
        this.goToLevelSelect();
    }

    goToStart() {
        this.state = 'START';
        this.levelManager.theme = 'retro';
        this.showScreen('start-screen');
        document.getElementById('hud').classList.add('hidden');
        this.touchControls.hide();
    }

    goToLevelSelect() {
        this.soundManager.init();
        this.levelManager.theme = 'retro';
        this.renderLevelSelect();
        this.state = 'LEVEL_SELECT';
        this.showScreen('level-select-screen');
        document.getElementById('hud').classList.add('hidden');
        this.touchControls.hide();
    }

    renderLevelSelect() {
        const grid = document.getElementById('level-select-grid');
        grid.innerHTML = '';
        const count = this.levelManager.levels.length;
        for (let i = 0; i < count; i++) {
            const unlocked = this.save.isLevelUnlocked(i);
            const best = this.save.getBestTime(i);
            const btn = document.createElement('button');
            
            // Add chapter header for every 5 (retro/sunset/cyberpunk/mothership) or 10 (kitchen) levels
            if (i === 0 || i === 5 || i === 10 || i === 15 || i === 20) {
                const header = document.createElement('div');
                header.className = 'world-header';
                if (i === 0) header.innerText = 'WORLD 1: RETRO RUN';
                if (i === 5) header.innerText = 'WORLD 2: SUNSET SKIES';
                if (i === 10) header.innerText = 'WORLD 3: CYBERPUNK CITY';
                if (i === 15) header.innerText = 'WORLD 4: ALIEN MOTHERSHIP';
                if (i === 20) header.innerText = 'WORLD 5: KITCHEN CHAOS';
                grid.appendChild(header);
            }
            
            const chapterClass = i >= 20 ? ' kitchen' : (i >= 15 ? ' mothership' : (i >= 10 ? ' cyberpunk' : (i >= 5 ? ' sunset' : '')));
            btn.className = 'level-btn' + chapterClass + (unlocked ? '' : ' locked');
            btn.disabled = !unlocked;
            const medal = unlocked ? this.save.getMedalGlyph(i, this.levelManager) : '';
            btn.innerHTML =
                `<span class="level-num">${i + 1}</span>` +
                `<span class="level-medal">${medal}</span>` +
                `<span class="level-best">${unlocked ? (best !== null ? this.formatTime(best) : '—') : '🔒'}</span>`;
            if (unlocked) {
                btn.addEventListener('click', () => this.startLevel(i));
                // Secondary action: stakes-free Practice run of this level.
                const chip = document.createElement('span');
                chip.className = 'level-practice';
                chip.title = 'Practice Mode — deaths never end the run, clear is not saved';
                chip.innerText = 'P';
                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.startPractice(i);
                });
                btn.appendChild(chip);
            }
            grid.appendChild(btn);
        }
        const bestTotal = this.save.getBestTotal();
        document.getElementById('level-select-stats').innerText =
            `Best Total: ${bestTotal !== null ? this.formatTime(bestTotal) : '—'}  ·  Golden Breadcrumbs: ${this.save.getTotalCrumbs()}`;
    }

    // Begin gameplay on a specific (unlocked) level. Resets the run's totals,
    // so a full speedrun always starts from Level 1.
    startLevel(index) {
        if (!this.save.isLevelUnlocked(index)) return;
        this.practiceRun = false;
        this.soundManager.init();
        this.soundManager.playStart();
        this.soundManager.startMusic();
        this.ghost.load(this.save.getGhost(index));
        this.ghost.startRecording();
        this.score = 0;
        this.lives = this.save.getAssistMode() ? 5 : 3;
        this.currentLevel = index;
        this.totalTimer = 0;
        this.totalCrumbCollected = 0;
        this.totalCrumbs = 0;
        this.totalDeaths = 0;
        this.totalBread = 0;
        this.loadLevel();
    }

    // Practice Mode: same as startLevel but deaths never trigger Game Over
    // and a clear never writes best times / medals / ghosts / achievements.
    startPractice(index) {
        if (!this.save.isLevelUnlocked(index)) return;
        this.practiceRun = true;
        this.soundManager.init();
        this.soundManager.playStart();
        this.soundManager.startMusic();
        this.ghost.load(this.save.getGhost(index));
        this.ghost.startRecording();
        this.score = 0;
        this.lives = this.save.getAssistMode() ? 5 : 3;
        this.currentLevel = index;
        this.totalTimer = 0;
        this.totalCrumbCollected = 0;
        this.totalCrumbs = 0;
        this.totalDeaths = 0;
        this.totalBread = 0;
        this.loadLevel();
    }

    retryLevel() {
        if (this.practiceRun) {
            this.startPractice(this.currentLevel);
        } else {
            this.startLevel(this.currentLevel);
        }
    }

    // Builds the player configured for the current level's difficulty rules.
    createPlayer() {
        const p = new Player(this.levelManager.playerStart.x, this.levelManager.playerStart.y);
        p.setFlipLimit(this.levelManager.flipLimit);
        return p;
    }

    loadLevel() {
        if (this.levelManager.loadLevel(this.currentLevel)) {
            this.player = this.createPlayer();
            this.bossDeathTimer = 0;
            this.bossVictoryShown = false;
            // Level 20 & 30 are single-screen boss arenas: the camera never scrolls.
            this.camera.locked = (this.currentLevel === 19 || this.currentLevel === 29);
            // Hide mobile zoom-strip on the boss level (it doesn't zoom)
            // so we can fit more of the arena on screen.
            document.body.classList.toggle('boss-level', this.currentLevel === 19 || this.currentLevel === 29);
            this.camera.snap(
                this.player,
                this.levelManager.width * this.levelManager.tileSize,
                this.levelManager.height * this.levelManager.tileSize
            );
            this.state = 'PLAYING';
            this.hideAllScreens();
            document.getElementById('hud').classList.remove('hidden');
            this.touchControls.show();
            this.levelTimer = 0;
            this.crumbCollected = 0;
            this.crumbTotal = this.levelManager.crumbs.length;
            this.totalCrumbs += this.crumbTotal;
            this.updateHUD();
            this.mechanicToasts.checkAndShow(this.currentLevel);
            this.hintSystem.resetForLevel();
        } else {
            // No more levels: the run is over.
            this.showVictory();
        }
    }

    // Final Victory screen (reached after defeating the Level 20 boss, or via
    // the fall-through when the next level index does not exist).
    showVictory() {
        this.state = 'VICTORY';
        this.soundManager.playWin();

        const percent = this.totalCrumbs > 0
            ? Math.round((this.totalCrumbCollected / this.totalCrumbs) * 100)
            : 100;

        document.getElementById('final-time').innerText = this.formatTime(this.totalTimer);
        document.getElementById('final-crumbs').innerText = `${this.totalCrumbCollected}/${this.totalCrumbs}`;
        document.getElementById('final-percent').innerText = `${percent}%`;
        document.getElementById('final-bread').innerText = this.totalBread;
        document.getElementById('final-deaths').innerText = this.totalDeaths;

        const bestEl = document.getElementById('final-best');
        if (this.practiceRun) {
            bestEl.innerText = 'PRACTICE CLEAR — NOT SAVED';
            bestEl.classList.remove('best-flash');
        } else {
            const newBest = this.save.setBestTotal(this.totalTimer);
            if (newBest) {
                bestEl.innerText = 'NEW BEST TOTAL TIME!';
                bestEl.classList.add('best-flash');
            } else {
                bestEl.innerText = `Best Total: ${this.formatTime(this.save.getBestTotal())}`;
                bestEl.classList.remove('best-flash');
            }
        }

        this.showScreen('victory-screen');
        document.getElementById('hud').classList.add('hidden');
        this.touchControls.hide();
        this.victoryCinematic.start();
    }

    pauseGame() {
        this.state = 'PAUSED';
        this.soundManager.stopMusic();
        this.showScreen('pause-screen');
        this.touchControls.hide();
    }

    resumeGame() {
        this.state = 'PLAYING';
        this.soundManager.startMusic();
        this.hideAllScreens();
        this.touchControls.show();
    }

    quitToMenu() {
        this.state = 'START';
        this.practiceRun = false;
        this.soundManager.stopMusic();
        this.levelManager.theme = 'retro';
        this.showScreen('start-screen');
        document.getElementById('hud').classList.add('hidden');
        this.touchControls.hide();
    }

    nextLevel() {
        // Practice runs never unlock progression: if the next level isn't
        // actually unlocked yet, re-practice the current one instead.
        if (this.practiceRun && !this.save.isLevelUnlocked(this.currentLevel + 1)) {
            this.startPractice(this.currentLevel);
            return;
        }
        this.currentLevel++;
        this.loadLevel();
    }

    // All four overload switches are down: the boss dies, then the Final
    // Victory screen rolls in after the short dying animation.
    defeatBoss() {
        const boss = this.levelManager.boss;
        if (!boss) return;
        boss.defeat();
        this.bossDeathTimer = Boss.DEATH_TIME;
        this.bossVictoryShown = false;
        this.soundManager.stopMusic();
        this.soundManager.playWin();
        this.screenShakeBig();
        this.flashScreen();
        this.particleSystem.emitHurt(boss.x + boss.width / 2, boss.y + boss.height / 2);
        this.updateHUD();
    }

    openAchievements(fromScreen) {
        this.achievementsReturn = fromScreen || 'start-screen';
        this.achievements.renderModal();
        this.showScreen('achievements-screen');
    }

    achievementsBack() {
        this.showScreen(this.achievementsReturn || 'start-screen');
    }

    shareRun(text) {
        const url = 'https://mokrosi.github.io/Gravity-Goose-Browser-Games/?v=1';
        if (navigator.share) {
            navigator.share({
                title: 'Gravity Goose: The Bread Robbery',
                text: text,
                url: url
            }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(`${text} ${url}`);
            this.spawnFloatText('COPIED LINK!', this.canvas.width / 2, 100, 'perfect');
        }
    }

    // --- Settings -----------------------------------------------------------

    openSettings(returnScreen) {
        this.settingsReturn = returnScreen || 'start-screen';
        const vol = Math.round(this.save.getSfxVolume() * 100);
        document.getElementById('sfx-volume').value = vol;
        document.getElementById('sfx-volume-value').innerText = vol + '%';
        document.getElementById('screen-shake-toggle').checked = this.save.getScreenShake();
        document.getElementById('assist-mode-toggle').checked = this.save.getAssistMode();
        this.state = 'SETTINGS';
        this.showScreen('settings-screen');
    }

    applySettings() {
        const vol = parseInt(document.getElementById('sfx-volume').value, 10) / 100;
        this.save.setSfxVolume(vol);
        this.soundManager.setVolume(vol);
        this.save.setScreenShake(document.getElementById('screen-shake-toggle').checked);
    }

    settingsBack() {
        this.applySettings();
        const target = this.settingsReturn || 'start-screen';
        this.state = target === 'pause-screen' ? 'PAUSED' : 'START';
        this.showScreen(target);
    }

    resetRecords() {
        if (confirm('Reset all best times, level unlocks and breadcrumbs?')) {
            this.save.resetRunRecords();
            this.renderLevelSelect();
        }
    }

    screenShake() {
        if (!this.save.getScreenShake()) return;
        const container = document.getElementById('game-container');
        container.classList.remove('shake');
        void container.offsetWidth; // trigger reflow
        container.classList.add('shake');
    }

    // Extra-violent shake for the boss death sequence.
    screenShakeBig() {
        if (!this.save.getScreenShake()) return;
        const container = document.getElementById('game-container');
        container.classList.remove('shake', 'shake-big');
        void container.offsetWidth; // trigger reflow
        container.classList.add('shake-big');
    }

    updateHUD() {
        document.getElementById('hud-level').innerText = this.currentLevel + 1;
        document.getElementById('hud-score').innerText = this.score;
        document.getElementById('hud-crumbs').innerText = `${this.crumbCollected}/${this.crumbTotal}`;
        document.getElementById('hud-lives').innerText = '❤️'.repeat(Math.max(0, Math.min(5, this.lives)));

        // Persistent "PRACTICE MODE" badge so it's always clear the run
        // doesn't count toward best times, medals or achievements.
        const practiceBadge = document.getElementById('hud-practice-badge');
        if (practiceBadge) {
            practiceBadge.classList.toggle('hidden', !this.practiceRun);
        }

        // Boss-fight overload tracker (only visible on the Level 20 arena).
        const boss = this.levelManager.boss;
        if (this.hudBossItemEl) {
            this.hudBossItemEl.classList.toggle('hidden', !boss || boss.isDefeated);
        }
        if (this.hudBossEl && boss) {
            const total = this.levelManager.switches.length;
            const done = this.levelManager.switches.filter(s => s.activated).length;
            this.hudBossEl.innerText = '●'.repeat(done) + '○'.repeat(total - done);
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(3, '0')}`;
    }

    // Spawn a temporary floating DOM label (e.g. "+1") over the canvas at a
    // world position. Animated with CSS keyframes, then removed when it ends.
    spawnFloatText(text, worldX, worldY, extraClass) {
        const layer = document.getElementById('float-layer');
        if (!layer) return;
        const el = document.createElement('div');
        el.className = 'float-text' + (extraClass ? ' ' + extraClass : '');
        el.innerText = text;
        el.style.left = ((worldX - this.camera.x) / this.canvas.width * 100) + '%';
        el.style.top = ((worldY - this.camera.y) / this.canvas.height * 100) + '%';
        layer.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    // Quick CSS glitch/flash over the canvas (used on instant respawn).
    flashScreen() {
        const overlay = document.getElementById('flash-overlay');
        if (!overlay) return;
        overlay.classList.remove('reset');
        void overlay.offsetWidth; // restart the animation on rapid deaths
        overlay.classList.add('reset');
    }

    start() {
        this.assetManager.isDone().then(() => {
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));
        });
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Speedrun timer (resets to 0 on instant respawn, freezes on pause/level end)
        this.levelTimer += dt;
        this.totalTimer += dt;
        if (this.hudTimeEl) {
            this.hudTimeEl.innerText = this.formatTime(this.levelTimer);
        }
        const deltaEl = document.getElementById('hud-ghost-delta');
        if (deltaEl) {
            const best = this.save.getBestTime(this.currentLevel);
            if (best !== null) {
                const diff = this.levelTimer - best;
                const sign = diff >= 0 ? '+' : '-';
                const absSec = Math.abs(diff).toFixed(2);
                deltaEl.innerText = `${sign}${absSec}s`;
                deltaEl.style.color = diff <= 0 ? '#4ade80' : '#f87171';
            } else {
                deltaEl.innerText = '—';
                deltaEl.style.color = 'inherit';
            }
        }

        // Blink cooldown bar: fills back up as the blink recharges.
        if (this.hudBlinkFillEl) {
            const ratio = 1 - (this.player.blinkCooldown / Player.BLINK_COOLDOWN);
            this.hudBlinkFillEl.style.width = Math.round(Player.clamp(ratio, 0, 1) * 100) + '%';
            this.hudBlinkFillEl.classList.toggle('empty', !this.player.canBlink);
        }

        // Gravity-flip stamina bar: only meaningful in Levels 6-10 (flip limit).
        const flipBar = document.getElementById('hud-flip-item');
        if (flipBar) {
            flipBar.classList.toggle('hidden', !this.levelManager.flipLimit);
        }
        if (this.hudFlipFillEl) {
            this.hudFlipFillEl.classList.toggle('empty', !this.player.canFlip);
        }

        // Background music speeds up while the player closes in on their best time
        const best = this.save.getBestTime(this.currentLevel);
        if (best !== null) {
            const remaining = best - this.levelTimer;
            const ratio = Math.max(0, Math.min(1, (10 - remaining) / 10));
            this.soundManager.setMusicIntensity(ratio);
        } else {
            this.soundManager.setMusicIntensity(0);
        }

        this.player.update(dt, this.input, this.levelManager, this.soundManager, this.particleSystem);
        this.hintSystem.update(dt);

        this.ghost.sample(this.levelTimer, this.player);
        this.particleSystem.update(dt);

        // Sprint dust particles while the goose is running at top speed
        if (this.player.isRunningFast && Math.random() < 0.15) {
            const footY = this.player.gravitySign > 0
                ? this.player.y + this.player.height + 2
                : this.player.y - 2;
            this.particleSystem.emitFootstep(this.player.x + this.player.width / 2, footY);
        }

        // Crumbling platforms tremble under the goose, then collapse.
        this.levelManager.updateCrumbling(dt, this.player);

        // Moving lasers (Levels 11-14) sweep along their axis.
        for (let laser of this.levelManager.lasers) {
            laser.update(dt);
        }

        // ---- Level Devil troll traps (Levels 14-19) ----
        // Fake golden crumbs erupt into spikes once the goose gets within 60px.
        for (const fc of this.levelManager.fakeCrumbs) {
            if (fc.triggered) continue;
            if (this.player.near(fc, 60)) {
                this.levelManager.triggerFake(fc);
                this.soundManager.playHurt();
                this.particleSystem.emitHurt(fc.x + fc.width / 2, fc.y + fc.height / 2);
                this.spawnFloatText('FAKE!', fc.x + fc.width / 2, fc.y - 10, 'trap');
                this.screenShake();
            }
        }
        // Invisible trigger zones: entering one drops its spike trap instantly.
        for (const zone of this.levelManager.trapZones) {
            if (zone.triggered) continue;
            if (Physics.checkCollision(this.player, zone)) {
                this.levelManager.triggerTrap(zone);
                this.soundManager.playReset();
                this.particleSystem.emitHurt(zone.x + zone.width / 2, zone.y + zone.height / 2);
                this.spawnFloatText('TRAP!', zone.x + zone.width / 2, zone.y - 10, 'trap');
                this.screenShake();
            }
        }

        // Check Spike Hazard collisions (forgiving 15%-shrunk hitboxes; blink i-frames protect)
        if (!this.player.isInvincible) {
            for (let hazard of this.levelManager.hazards) {
                const hb = Physics.shrink(hazard, Physics.HAZARD_INSET);
                if (Physics.checkCollision(this.player, hb)) {
                    this.player.isDead = true;
                }
            }

            // Moving laser beams are equally deadly.
            for (let laser of this.levelManager.lasers) {
                const hb = Physics.shrink(laser, Physics.HAZARD_INSET);
                if (Physics.checkCollision(this.player, hb)) {
                    this.player.isDead = true;
                    break;
                }
            }

            // Level 20 boss: horizontal laser aimed at the goose's altitude.
            const boss = this.levelManager.boss;
            if (boss) {
                const beam = boss.firingBeam(this.levelManager.width * this.levelManager.tileSize);
                if (beam) {
                    const hb = Physics.shrink(beam, Physics.HAZARD_INSET);
                    if (Physics.checkCollision(this.player, hb)) {
                        this.player.isDead = true;
                    }
                }
            }
        }

        // Check death / instant respawn (no page reload, no game-over delay)
        if (this.player.isDead) {
            this.soundManager.playHurt();
            this.soundManager.playReset();
            this.particleSystem.emitHurt(this.player.x + 14, this.player.y + 14);
            if (!this.practiceRun) this.lives--;
            this.totalDeaths++;
            this.screenShake();
            this.flashScreen();
            this.updateHUD();

            if (this.lives <= 0 && !this.practiceRun) {
                this.state = 'GAME_OVER';
                this.soundManager.stopMusic();
                this.showScreen('game-over-screen');
                document.getElementById('hud').classList.add('hidden');
                this.touchControls.hide();
            } else {
                // Instant respawn: reset position, level timer, breadcrumbs and traps.
                this.player = this.createPlayer();
                this.camera.snap(
                    this.player,
                    this.levelManager.width * this.levelManager.tileSize,
                    this.levelManager.height * this.levelManager.tileSize
                );
                this.levelTimer = 0;
                if (this.hudTimeEl) {
                    this.hudTimeEl.innerText = this.formatTime(this.levelTimer);
                }
                this.levelManager.resetCrumbs();
                this.levelManager.resetCrumbles();
                this.levelManager.resetTraps();
                this.totalCrumbCollected -= this.crumbCollected;
                this.crumbCollected = 0;
                this.ghost.startRecording(); // keep the replay in sync with the reset timer
            }
            return;
        }

        // Update enemies
        for (let enemy of this.levelManager.entities) {
            enemy.update(dt, this.levelManager);

            // Check collision with player (forgiving hitbox; blink i-frames protect)
            if (!enemy.isDead && !this.player.isInvincible) {
                const hb = Physics.shrink(enemy, Physics.HAZARD_INSET);
                if (Physics.checkCollision(this.player, hb)) {
                    this.player.isDead = true;
                }
            }
        }

        // Level 20 boss: attack cycle, overload switches, death sequence.
        const boss = this.levelManager.boss;
        if (boss && boss.isDefeated) {
            this.bossDeathTimer -= dt;
            // Fiery dying animation before the Final Victory screen.
            if (Math.random() < 0.35) {
                this.particleSystem.emitHurt(
                    boss.x + Math.random() * boss.width,
                    boss.y + Math.random() * boss.height
                );
            }
            if (this.bossDeathTimer <= 0 && !this.bossVictoryShown) {
                this.bossVictoryShown = true;
                if (this.currentLevel === 29) {
                    if (!this.practiceRun) {
                        this.save.setBestTime(this.currentLevel, this.levelTimer);
                        this.save.setGhost(this.currentLevel, this.ghost.stopRecording());
                        this.save.unlockLevel(this.currentLevel + 1); // For achievements
                        this.achievements.checkAll();
                    } else {
                        this.ghost.stopRecording();
                    }
                    this.showVictory();
                } else {
                    this.winLevel(true);
                }
                return;
            }
        } else if (boss) {
            boss.update(dt, this.levelManager, this.player);

            // Overload switches: touching one staggers the boss; all 4 kill it.
            let allActivated = true;
            for (let sw of this.levelManager.switches) {
                if (sw.activated) continue;
                if (Physics.checkCollision(this.player, sw)) {
                    sw.activated = true;
                    this.soundManager.playSwitch();
                    this.particleSystem.emitBreadCollect(sw.x + sw.width / 2, sw.y + sw.height / 2);
                    this.spawnFloatText('OVERLOAD!', sw.x + sw.width / 2, sw.y, 'perfect');
                    boss.hit();
                    this.screenShake();
                    this.updateHUD();
                } else {
                    allActivated = false;
                }
            }
            if (allActivated && this.levelManager.switches.length > 0) {
                this.defeatBoss();
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
                    this.totalBread++;
                    this.soundManager.playCollect();
                    this.particleSystem.emitBreadCollect(item.x + 12, item.y + 12);
                    this.updateHUD();
                } else {
                    allItemsCollected = false;
                }
            }
        }

        // Update Golden Breadcrumbs (optional 100% collectibles)
        for (let crumb of this.levelManager.crumbs) {
            crumb.update(dt);
            if (!crumb.collected && Physics.checkCollision(this.player, crumb)) {
                crumb.collected = true;
                this.crumbCollected++;
                this.totalCrumbCollected++;
                if (!this.practiceRun) this.save.addCrumb();
                this.soundManager.playCrumb();
                this.particleSystem.emitCrumbCollect(crumb.x + crumb.width / 2, crumb.y + crumb.height / 2);
                this.player.rechargeFlip(); // golden breadcrumb recharges the flip
                const perfect = this.crumbCollected === this.crumbTotal;
                this.spawnFloatText(
                    perfect ? 'Perfect!' : '+1',
                    crumb.x + crumb.width / 2,
                    crumb.y + crumb.height / 2,
                    perfect ? 'perfect' : 'crumb'
                );
                this.updateHUD();
            }
        }

        // Win condition for level (the boss arena is cleared via its switches
        // instead — collecting the bread there doesn't end the fight).
        if (allItemsCollected && this.levelManager.items.length > 0 && !this.levelManager.isBossLevel) {
            this.winLevel(false);
        }

        this.camera.follow(this.player, this.levelManager.width * this.levelManager.tileSize, this.levelManager.height * this.levelManager.tileSize);
    }

    winLevel(isBoss = false) {
        this.state = 'LEVEL_COMPLETE';
        this.soundManager.playWin();
        document.getElementById('level-bread-score').innerText = isBoss ? 'BOSS DEFEATED' : this.levelManager.items.length;
        document.getElementById('level-crumb-score').innerText = `${this.crumbCollected}/${this.crumbTotal}`;
        document.getElementById('level-time').innerText = this.formatTime(this.levelTimer);

        const bestEl = document.getElementById('level-best');
        if (this.practiceRun) {
            bestEl.innerText = 'PRACTICE CLEAR — NOT SAVED';
            bestEl.classList.remove('best-flash');
            this.ghost.stopRecording();
        } else {
            const newBest = this.save.setBestTime(this.currentLevel, this.levelTimer);
            if (newBest) {
                bestEl.innerText = 'NEW BEST TIME!';
                bestEl.classList.add('best-flash');
                this.soundManager.playBest();
                this.save.setGhost(this.currentLevel, this.ghost.stopRecording());
            } else {
                this.ghost.stopRecording();
                bestEl.innerText = `Best Time: ${this.formatTime(this.save.getBestTime(this.currentLevel))}`;
                bestEl.classList.remove('best-flash');
            }
            this.save.unlockLevel(this.currentLevel + 1);
            this.achievements.checkAll();
        }

        const medalEl = document.getElementById('level-medal');
        if (medalEl) {
            if (this.practiceRun) {
                medalEl.innerText = '';
            } else {
                const medalGlyph = this.save.getMedalGlyph(this.currentLevel, this.levelManager);
                medalEl.innerText = medalGlyph ? `Medal Earned: ${medalGlyph}` : '';
            }
        }

        this.soundManager.stopMusic();
        this.showScreen('level-complete-screen');
        this.touchControls.hide();
    }

    drawParallaxBackground() {
        // Deep Space Background with Parallax Starfield & Synth Grid.
        // 6-10 sunset/amber; 11-15 neon cyberpunk magenta; 16-20 mothership bio-green; 21-30 kitchen cream.
        const kitchen = this.levelManager.theme === 'kitchen';
        const cyberpunk = this.levelManager.theme === 'cyberpunk';
        const sunset = this.levelManager.theme === 'sunset';
        const mothership = this.levelManager.theme === 'mothership';
        const bg = kitchen ? '#1a0d0a' : (mothership ? '#03120d' : (cyberpunk ? '#0b0118' : (sunset ? '#2b1004' : '#0f172a')));
        const starColor = kitchen ? '#f97316' : (mothership ? '#a7f3d0' : (cyberpunk ? '#f0abfc' : (sunset ? '#fed7aa' : '#ffffff')));
        const gridColor = kitchen ? 'rgba(249, 115, 22, 0.15)' : (mothership ? 'rgba(52, 211, 153, 0.10)' : (cyberpunk ? 'rgba(244, 63, 94, 0.10)' : (sunset ? 'rgba(251, 146, 60, 0.09)' : 'rgba(56, 189, 248, 0.08)')));

        this.ctx.fillStyle = bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Parallax Stars
        this.ctx.fillStyle = starColor;
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
        this.ctx.strokeStyle = gridColor;
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

        const showWorld =
            this.state === 'PLAYING' ||
            this.state === 'PAUSED' ||
            this.state === 'LEVEL_COMPLETE' ||
            (this.state === 'SETTINGS' && this.settingsReturn === 'pause-screen');

        if (showWorld) {
            this.levelManager.draw(this.ctx, this.camera, this.assetManager);
            
            for (let item of this.levelManager.items) {
                item.draw(this.ctx, this.camera, this.assetManager);
            }

            for (let crumb of this.levelManager.crumbs) {
                crumb.draw(this.ctx, this.camera, this.assetManager);
            }

            for (let enemy of this.levelManager.entities) {
                enemy.draw(this.ctx, this.camera, this.assetManager, this.levelManager.theme);
            }

            for (let laser of this.levelManager.lasers) {
                laser.draw(this.ctx, this.camera, this.assetManager);
            }

            if (this.levelManager.boss) {
                this.levelManager.boss.draw(this.ctx, this.camera, this.assetManager, this.levelManager);
            }

            if (this.player) {
                this.player.draw(this.ctx, this.camera, this.assetManager);
            }

            // Best-run ghost replay (fades as the player catches up to it)
            if (this.player) {
                this.ghost.draw(this.ctx, this.camera, this.assetManager, this.levelTimer, this.player);
            }

            this.particleSystem.draw(this.ctx, this.camera);
        }
    }
    start() {
        this.goToStart();
        requestAnimationFrame((t) => {
            this.lastTime = t;
            this.loop(t);
        });
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
