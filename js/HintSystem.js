class HintSystem {
    constructor(game) {
        this.game = game;
        this.hintEl = document.getElementById('control-hint');
        this.activeKey = null;
        this.moveTimer = 0;
        this.active = false;
    }

    resetForLevel() {
        this.hide();
    }

    update(dt) {
        if (!this.game.player || this.game.state !== 'PLAYING') return;

        if (this.game.save.data.unlocked.length > 1 && !this.game.save.hasSeenHint('move')) {
            this.game.save.markHintSeen('move');
            this.game.save.markHintSeen('jumpHold');
            this.game.save.markHintSeen('blink');
            this.game.save.markHintSeen('flip');
            return;
        }

        const player = this.game.player;
        const save = this.game.save;
        const levelIndex = this.game.currentLevel;

        // 1. Move hint (Level 1)
        if (!save.hasSeenHint('move') && levelIndex === 0) {
            if (this.activeKey !== 'move') {
                this.show('move', '◀ A/D ▶ or D-Pad to Move');
            } else {
                if (Math.abs(player.vx) > 10) {
                    this.moveTimer += dt;
                    if (this.moveTimer >= 0.5) {
                        save.markHintSeen('move');
                        this.hide();
                    }
                }
            }
            this.position(player);
            return;
        }

        // 2. Jump Hold hint (Level 1 when airborne)
        if (save.hasSeenHint('move') && !save.hasSeenHint('jumpHold') && levelIndex === 0) {
            if (!player.onGround) {
                if (this.activeKey !== 'jumpHold') {
                    this.show('jumpHold', 'Hold JUMP for Full Height');
                }
                if (this.game.input.isKeyDown('KeyW') || this.game.input.isKeyDown('ArrowUp') || this.game.input.isTouch('KeyW')) {
                    save.markHintSeen('jumpHold');
                    this.hide();
                }
            }
            this.position(player);
            return;
        }

        // 3. Blink hint (Level 2 when near hazard)
        if (!save.hasSeenHint('blink') && levelIndex === 1) {
            let nearHazard = false;
            for (let h of this.game.levelManager.hazards) {
                const dx = Math.abs((player.x + player.width / 2) - (h.x + h.width / 2));
                const dy = Math.abs((player.y + player.height / 2) - (h.y + h.height / 2));
                if (dx < 120 && dy < 120) {
                    nearHazard = true;
                    break;
                }
            }
            if (nearHazard) {
                if (this.activeKey !== 'blink') {
                    this.show('blink', 'SHIFT / BLINK to Dash Hazards');
                }
                if (player.isInvincible) {
                    save.markHintSeen('blink');
                    this.hide();
                }
            }
            this.position(player);
            return;
        }

        // 4. Flip hint (when a spike tile is directly above/below or in a gravity zone)
        if (!save.hasSeenHint('flip')) {
            const levelMgr = this.game.levelManager;
            const gx = Math.floor((player.x + player.width / 2) / levelMgr.tileSize);
            const gy = Math.floor(player.y / levelMgr.tileSize);
            const tileAt = (tx, ty) => {
                if (ty < 0 || ty >= levelMgr.height || tx < 0 || tx >= levelMgr.width) return null;
                return levelMgr.grid[ty][tx];
            };
            const spikeAbove = tileAt(gx, gy - 1) === 2 || tileAt(gx - 1, gy - 1) === 2 || tileAt(gx + 1, gy - 1) === 2;
            const spikeBelow = tileAt(gx, gy + 1) === 2 || tileAt(gx - 1, gy + 1) === 2 || tileAt(gx + 1, gy + 1) === 2;
            const underFlipTile = spikeAbove || spikeBelow;

            if (underFlipTile || levelMgr.gravityZones.length > 0) {
                if (this.activeKey !== 'flip') {
                    this.show('flip', 'SPACE / Tap Canvas to Flip Gravity');
                }
                if (player.gravitySign < 0) {
                    save.markHintSeen('flip');
                    this.hide();
                }
            }
            this.position(player);
            return;
        }

        this.position(player);
    }

    show(key, text) {
        if (!this.hintEl) return;
        this.activeKey = key;
        this.moveTimer = 0;
        this.hintEl.innerText = text;
        this.hintEl.classList.remove('hidden');
        this.active = true;
    }

    hide() {
        if (!this.hintEl) return;
        this.activeKey = null;
        this.hintEl.classList.add('hidden');
        this.active = false;
    }

    position(player) {
        if (!this.active || !this.hintEl || !player) return;
        const cam = this.game.camera;
        const canvas = this.game.canvas;
        const rect = canvas.getBoundingClientRect();

        const screenX = (player.x + player.width / 2 - cam.x);
        const screenY = (player.y - cam.y - 24);

        const scaleX = rect.width / canvas.width;
        const scaleY = rect.height / canvas.height;

        this.hintEl.style.left = `${rect.left + screenX * scaleX}px`;
        this.hintEl.style.top = `${rect.top + screenY * scaleY}px`;
    }
}
