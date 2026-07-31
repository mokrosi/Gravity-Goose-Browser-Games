class LevelManager {
    constructor() {
        this.tileSize = 32;
        this.currentLevelIndex = 0;
        this.width = 0;
        this.height = 0;
        this.grid = [];
        this.entities = [];
        this.items = [];
        this.crumbs = [];
        this.hazards = []; // Spikes rects
        this.gravityZones = []; // Forced-gravity zone AABB rects (Level 6+)
        this.crumbles = []; // Crumbling platforms ('C'): tremble then break
        this.crumbleMap = new Map(); // tile key "gx,gy" -> crumble entry
        this.brokenGrid = []; // parallel bool grid: true where a platform broke
        this.switches = []; // Boss-overload switches ('S', Level 15)
        this.lasers = []; // Moving laser entities (Levels 11-14)
        this.boss = null; // Level 15 boss fight
        this.theme = 'retro'; // 'retro' (1-5), 'sunset' (6-10) or 'cyberpunk' (11-15)
        this.playerStart = { x: 50, y: 50 };

        // Target par times in seconds for 15 levels (indices 0 to 14)
        this.parTimes = [
            12.0, 15.0, 18.0, 20.0, 22.0,
            25.0, 25.0, 28.0, 30.0, 32.0,
            35.0, 38.0, 40.0, 42.0, 45.0
        ];

        // Moving-laser spawns per level (index -> config list). Lasers are
        // dynamic entities, not tile characters. `axis` is the movement axis
        // ('x' sweeps the beam sideways, 'y' sweeps it up/down); `min`/`max`
        // bound the moving edge so the beam stays inside the play area.
        this.laserConfigs = {
            10: [
                { x: 760, y: 170, width: 460, height: 10, axis: 'y', min: 150, max: 300, speed: 110 },
                { x: 1840, y: 200, width: 360, height: 10, axis: 'y', min: 180, max: 310, speed: 120 },
                { x: 2010, y: 200, width: 12, height: 340, axis: 'x', min: 1980, max: 2380, speed: 150 }
            ],
            11: [
                { x: 900, y: 220, width: 12, height: 260, axis: 'x', min: 860, max: 1150, speed: 160 },
                { x: 1350, y: 170, width: 400, height: 10, axis: 'y', min: 150, max: 290, speed: 120 },
                { x: 1750, y: 250, width: 12, height: 220, axis: 'x', min: 1720, max: 1950, speed: 150 }
            ],
            12: [
                { x: 500, y: 180, width: 380, height: 10, axis: 'y', min: 160, max: 300, speed: 130 },
                { x: 1600, y: 200, width: 12, height: 300, axis: 'x', min: 1560, max: 1800, speed: 170 },
                { x: 2680, y: 200, width: 300, height: 10, axis: 'y', min: 180, max: 310, speed: 110 }
            ],
            13: [
                { x: 420, y: 190, width: 300, height: 10, axis: 'y', min: 170, max: 310, speed: 140 },
                { x: 1400, y: 230, width: 12, height: 260, axis: 'x', min: 1360, max: 1600, speed: 180 },
                { x: 2240, y: 180, width: 380, height: 10, axis: 'y', min: 160, max: 300, speed: 130 }
            ]
        };

        // Level 15 boss spawn (world px). Its beam height is derived from the
        // arena height at load time.
        this.bossConfigs = {
            14: { x: 128, y: 384 }
        };

        // Levels 6-10 introduce the sunset palette, forced-gravity zones ('z')
        // and the once-per-airtime gravity-flip stamina rule.
        this.levels = [
            // Level 1: Introduction to Movement & Gravity Boots
            [
                "################################",
                "#                              #",
                "#       c                      #",
                "#      ^                       #",
                "#     ###                      #",
                "#                              #",
                "#             B                #",
                "#            ###               #",
                "#      #######       ###########",
                "#P                             #",
                "################################"
            ],
            // Level 2: Gravity Flip Corridor & Spikes
            [
                "################################",
                "#######^^^^^^^^^^^#######      #",
                "#######           #######      #",
                "#######           #######      #",
                "#######   c       #######      #",
                "#P                             #",
                "#                              #",
                "#######   #################    #",
                "#######   #################    #",
                "#######^^^^################   B#",
                "################################"
            ],
            // Level 3: Alien Frog Patrol
            [
                "########################################",
                "#                                      #",
                "#                           c          #",
                "#      E                  E            #",
                "#    #####              #####          #",
                "#            E                         #",
                "#          #####                       #",
                "#                        c             #",
                "#P                  ^^^^               #",
                "####  ^^^^         ######      B       #",
                "########################################"
            ],
            // Level 4: The Inverted Gravity Maze
            [
                "########################################",
                "#P #^^^^^^^^#  c     #^^^^^^^^#        #",
                "#  #   E    #        #   E    #        #",
                "#  ######   ######   ######   ######   #",
                "#               c                      #",
                "#  ######   ######   ######   ######   #",
                "#       #        #        #        #   #",
                "#       #   E    #   E    #        # B #",
                "#^^^^^^^#^^^^^^^^#^^^^^^^^#^^^^^^^^#   #",
                "########################################"
            ],
            // Level 5: The Ultimate Sandwich Heist
            [
                "################################################",
                "#^^^^^^^^^^^^^^^#^^^^^^^^^^^^^#^^^^^^^^^^^^^^^^#",
                "#   E   E       #      Ec     #        E   E   #",
                "###### ######   ##### #####   ###### #######   #",
                "#                                       c      #",
                "#   E   E       #      E      #                #",
                "###### ######   ##### #####   #      #######   #",
                "#                                              #",
                "#P  E   E       #      E      #     B          #",
                "################################################"
            ],
            // Level 6: Sunset Gauntlet — first forced-gravity zones
            [
                "################################################",
                "#                                              #",
                "#        c           zzzzzz         ^^         #",
                "#                 zzzzzzzzzz     ########      #",
                "#       ###       zzzzzzzzzz     #      #      #",
                "#        #    c  zzzzzzzzzz      #      #   E  #",
                "#        #      zzzzzzzzzz       #      ###### #",
                "#        #         zzzzzzz       #             #",
                "#P       #                       #       B     #",
                "################################################"
            ],
            // Level 7: Dusk Corridors — ceiling runs through zones
            [
                "################################################",
                "#     c             zzzzzz          ^^^        #",
                "#                zzzzzzzzzz     ##########     #",
                "#  ########     zzzzzzzzzz      #        #     #",
                "#         #      zzzzzzzzz      #   c    ##### #",
                "#         #   zzzzzzzzzzz         #            #",
                "#         #   zzzzzzzzz         #############  #",
                "#    E    #   zzzzzzzz                   B     #",
                "#P        ##########                           #",
                "################################################"
            ],
            // Level 8: Amber Gauntlet — zone towers
            [
                "####################################################",
                "#        c        zzzzzzzzzz       ^^^^            #",
                "#              zzzzzzzzzzzzzzz  ###########        #",
                "#   ######    zzzzzzzzzzzzzzz  #         #    E    #",
                "#        #        zzzzzzzzzzz  #    c    ########  #",
                "#        #         zzzzzzzzz   #                   #",
                "#        #          zzzzzzzz   #    E              #",
                "#        ########## zzzzzzzz   #############       #",
                "#                    zzzzzz              c     B   #",
                "#P   E                zzzz        E                #",
                "####################################################"
            ],
            // Level 9: Crimson Towers — spike gauntlets & twin zones
            [
                "########################################################",
                "#      c          zzzzzzzzzz          zzzzzzzzzz       #",
                "#               zzzzzzzzzzzzzzz     zzzzzzzzzzzzzzz    #",
                "#     ^^^^      zzzzzzzzzzzzzzz     zzzzzzzzzzzzzzz    #",
                "#    ######    #zzzzzzzzzzzzz#      #zzzzzzzzzzzz#  E  #",
                "#       #      #     c       #      #     c     #      #",
                "#       #      ##############      ##############      #",
                "#       #                #                           B #",
                "#       #     E          #         E                   #",
                "#P      ##############################                 #",
                "########################################################"
            ],
            // Level 10: Grand Heist Finale — zone gauntlet rush
            [
                "########################################################",
                "#        zzzzzzzzzzzz           zzzzzzzzzzzzz          #",
                "#    E zzzzzzzzzzzzzzz    E  zzzzzzzzzzzzzzzzz   E     #",
                "#      zzzzzzzzzzzzzzzzz    zzzzzzzzzzzzzzzzzzz        #",
                "#   ####################   ######################  ^^^ #",
                "#               c                                      #",
                "#   zzzzzzzzzzzzzzzzzzzzzzzz       c                   #",
                "#  zzzzzzzzzzzzzzzzzzzzzzzzzzzz                        #",
                "#   ###########################  ############     B    #",
                "#P                              E                      #",
                "########################################################"
            ],
            // Level 11: Neon Steelworks — crumbling bridges & sweeping lasers
            [
                "################################################################################################",
                "#                                                                                              #",
                "#                                                                                              #",
                "#                             c                   c                   c                        #",
                "#                             C                   C                   C                        #",
                "#                                                                                        c     #",
                "#                      CCCCCCCCCCCC           ###        CCCCCCCCCCCC   ###             B      #",
                "#                                             ###                       ###           #######  #",
                "#                           c                 ###             c         ###           #######  #",
                "# P         E           ^^^^^^^^^^        E               ^^^^^^^^^^            E              #",
                "########################          ########################          ############################",
                "################################################################################################"
            ],
            // Level 12: Laser Grid — sky bridges over spike trenches
            [
                "################################################################################################",
                "#                                                                                              #",
                "#                                                                                              #",
                "#           c                     c                         c                        c         #",
                "#                      c                        c                      c                       #",
                "#                  CCCCCCCCC               CCCCCCCCCCC             CCCCCCCCC               c   #",
                "#                                                                                         B    #",
                "#                                                                                      ####### #",
                "#                                                                                      ####### #",
                "# P     E           ^^^^^^^     E           ^^^^^^^^^   E           ^^^^^^^     E              #",
                "####################       #################         ###############       #####################",
                "################################################################################################"
            ],
            // Level 13: Gravity Foundry — zones, lasers and crumbling foundries
            [
                "################################################################################################",
                "#                                                                                              #",
                "#                                                                                              #",
                "#                   c                       c                       c                     c    #",
                "#                          zzz                                            zzz                  #",
                "#                          zzz                    zzz                     zzz              c   #",
                "#              CCCCCCCCC   zzz       CCCCCCCCC    zzz      CCCCCCCCC      zzz           B      #",
                "#                                                 zzz                                 #######  #",
                "#                           c                   c                     c               #######  #",
                "# P       E     ^^^^^^^       E       ^^^^^^^       E       ^^^^^^^           E                #",
                "################       ###############       ###############       #############################",
                "################################################################################################"
            ],
            // Level 14: Neon Precinct — the densest gauntlet before the boss
            [
                "################################################################################################",
                "#                                                                                              #",
                "#                                                                                              #",
                "#             c               c               c               c               c                #",
                "#                                                                                              #",
                "#                                                                                          c   #",
                "#          CCCCCCC         CCCCCCC         CCCCCCC         CCCCCCC         CCCCCCC        B    #",
                "#                                                                                      ####### #",
                "#                   c                   c                   c                   c      ####### #",
                "# P ^^E     ^^^^^   E^^     ^^^^^   E       ^^^^^   E  ^^   ^^^^^   E       ^^^^^  ^^ E        #",
                "############     ###########     ###########     ###########     ###########     ###############",
                "################################################################################################"
            ],
            // Level 15: THE BOSS — mecha overlord guarding the stolen bread
            // (touch all 3 switches on the right to overload it and win)
            [
                "############################################################",
                "#                                                          #",
                "#                                                          #",
                "#                             c                            #",
                "#                                                     S    #",
                "#                                                   ########",
                "#                                                          #",
                "#                                                          #",
                "#                                                          #",
                "#                                                          #",
                "#                                                          #",
                "#                                                          #",
                "#                                                   B S c  #",
                "#                                                   ########",
                "#                                                          #",
                "# P                                                        #",
                "#  #####                      c                            #",
                "#  #####                      ##            ##    ##       #",
                "#  #####                      ##            ##    ##  S    #",
                "############################################################"
            ]
        ];
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        if (index >= this.levels.length) {
            return false;
        }

        const layout = this.levels[index];
        this.height = layout.length;
        this.width = layout[0].length;
        this.grid = [];
        this.entities = [];
        this.items = [];
        this.crumbs = [];
        this.hazards = [];
        this.gravityZones = [];
        this.crumbles = [];
        this.crumbleMap = new Map();
        this.brokenGrid = [];
        this.switches = [];
        this.lasers = [];
        this.boss = null;
        // 1-5 retro, 6-10 sunset, 11-15 cyberpunk.
        this.theme = index >= 10 ? 'cyberpunk' : (index >= 5 ? 'sunset' : 'retro');

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            this.brokenGrid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const char = layout[y][x];
                this.brokenGrid[y][x] = false;
                if (char === '#') {
                    this.grid[y][x] = 1; // Solid Tile
                } else if (char === '^') {
                    this.grid[y][x] = 2; // Spike Hazard
                    this.hazards.push({
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize
                    });
                } else if (char === 'z') {
                    // Forced-gravity zone: non-solid air that snaps gravity
                    // back to normal and locks out flipping while inside.
                    this.grid[y][x] = 3;
                    this.gravityZones.push({
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        width: this.tileSize,
                        height: this.tileSize
                    });
                } else if (char === 'C') {
                    // Crumbling platform: solid until the goose stands on it,
                    // then it trembles for 0.5s and collapses (reset on respawn).
                    this.grid[y][x] = 4;
                    const c = {
                        x: x * this.tileSize,
                        y: y * this.tileSize,
                        broken: false,
                        tremble: 0
                    };
                    this.crumbles.push(c);
                    this.crumbleMap.set(x + ',' + y, c);
                } else {
                    this.grid[y][x] = 0; // Air
                    if (char === 'P') {
                        this.playerStart = { x: x * this.tileSize, y: y * this.tileSize };
                    } else if (char === 'B') {
                        this.items.push(new Item(x * this.tileSize + 4, y * this.tileSize + 4));
                    } else if (char === 'c') {
                        this.crumbs.push(new Crumb(x * this.tileSize + 6, y * this.tileSize + 6));
                    } else if (char === 'E') {
                        this.entities.push(new Enemy(x * this.tileSize, y * this.tileSize));
                    } else if (char === 'S') {
                        // Boss-overload switch (Level 15): touch it to activate.
                        this.switches.push({
                            x: x * this.tileSize + 4,
                            y: y * this.tileSize + 4,
                            width: this.tileSize - 8,
                            height: this.tileSize - 8,
                            activated: false
                        });
                    }
                }
            }
        }

        // Moving lasers + boss are spawned per-level from configs.
        for (const cfg of (this.laserConfigs[index] || [])) {
            this.lasers.push(new Laser(
                cfg.x, cfg.y, cfg.width, cfg.height,
                cfg.axis, cfg.min, cfg.max, cfg.speed
            ));
        }
        const bcfg = this.bossConfigs[index];
        if (bcfg) {
            this.boss = new Boss(bcfg.x, bcfg.y, this.height * this.tileSize);
        }
        return true;
    }

    isSolid(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        const value = this.grid[y][x];
        if (value === 1) return true;
        if (value === 4) return !this.brokenGrid[y][x]; // crumbling while intact
        return false;
    }

    // The once-per-airtime gravity-flip stamina rule kicks in on Level 6.
    get flipLimit() {
        return this.currentLevelIndex >= 5;
    }

    get isBossLevel() {
        return this.boss !== null;
    }

    // Crumbling platforms tremble while the player stands on them and break
    // after CRUMBLE_TIME seconds, dropping the goose (and anything else).
    updateCrumbling(dt, player) {
        if (this.crumbles.length === 0 || !player) return;
        const ts = this.tileSize;
        for (const c of this.crumbles) {
            if (c.broken) continue;
            const tile = { x: c.x, y: c.y, width: ts, height: ts };
            if (this._entitySupportedBy(player, tile)) {
                c.tremble += dt;
                if (c.tremble >= 0.5) {
                    c.broken = true;
                    this.brokenGrid[Math.floor(c.y / ts)][Math.floor(c.x / ts)] = true;
                }
            } else {
                c.tremble = Math.max(0, c.tremble - dt * 2);
            }
        }
    }

    // Is `entity` resting on the top (or, under inverted gravity, bottom) face
    // of `tile`? Physics resolves flush, so a small tolerance is enough.
    _entitySupportedBy(entity, tile) {
        const overlapX = entity.x + entity.width > tile.x + 2 && entity.x < tile.x + tile.width - 2;
        if (!overlapX) return false;
        if (entity.gravity > 0) {
            return entity.onGround && Math.abs(entity.y + entity.height - tile.y) < 3;
        }
        return entity.onGround && Math.abs(entity.y - (tile.y + tile.height)) < 3;
    }

    // Instant respawn / retry: rebuild every collapsed platform.
    resetCrumbles() {
        for (const c of this.crumbles) {
            c.broken = false;
            c.tremble = 0;
        }
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.brokenGrid[y][x] = false;
            }
        }
    }

    // Instant respawn: un-collect every Golden Breadcrumb for the current level
    // so the player can retry the full 100% run immediately.
    resetCrumbs() {
        for (const crumb of this.crumbs) {
            crumb.collected = false;
        }
    }

    draw(ctx, camera, assetManager) {
        const startX = Math.max(0, Math.floor(camera.x / this.tileSize));
        const endX = Math.min(this.width, Math.ceil((camera.x + camera.width) / this.tileSize));
        const startY = Math.max(0, Math.floor(camera.y / this.tileSize));
        const endY = Math.min(this.height, Math.ceil((camera.y + camera.height) / this.tileSize));

        const cyberpunk = this.theme === 'cyberpunk';
        const sunset = this.theme === 'sunset';
        const tileImg = assetManager.getImage(cyberpunk ? 'tileset_cyberpunk' : (sunset ? 'tileset_sunset' : 'tileset'));
        const spikeImg = assetManager.getImage(cyberpunk ? 'spikes_cyberpunk' : (sunset ? 'spikes_sunset' : 'spikes'));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const type = this.grid[y][x];
                if (type === 1) { // Solid
                    if (tileImg) {
                        ctx.drawImage(tileImg, x * this.tileSize - camera.x, y * this.tileSize - camera.y, this.tileSize, this.tileSize);
                    }
                } else if (type === 2) { // Spike
                    if (spikeImg) {
                        ctx.drawImage(spikeImg, x * this.tileSize - camera.x, y * this.tileSize - camera.y, this.tileSize, this.tileSize);
                    }
                } else if (type === 4) { // Crumbling platform (shake, then vanish)
                    const c = this.crumbleMap.get(x + ',' + y);
                    if (c && !c.broken) {
                        const intensity = Math.min(1, c.tremble * 3);
                        const jx = c.tremble > 0 ? (Math.random() * 6 - 3) * intensity : 0;
                        const jy = c.tremble > 0 ? (Math.random() * 6 - 3) * intensity : 0;
                        if (tileImg) {
                            ctx.drawImage(tileImg, x * this.tileSize - camera.x + jx, y * this.tileSize - camera.y + jy, this.tileSize, this.tileSize);
                        }
                        if (c.tremble > 0) {
                            ctx.save();
                            ctx.globalAlpha = 0.35 + 0.3 * Math.sin(c.tremble * 30);
                            ctx.fillStyle = '#ef4444';
                            ctx.fillRect(x * this.tileSize - camera.x, y * this.tileSize - camera.y, this.tileSize, 4);
                            ctx.restore();
                        }
                    }
                }
            }
        }

        // Boss-overload switches (Level 15): neon panels that light up green
        // once the goose has touched them.
        if (this.switches.length > 0) {
            ctx.save();
            for (const sw of this.switches) {
                const sx = sw.x - camera.x;
                const sy = sw.y - camera.y;
                if (sx + sw.width < 0 || sx > camera.width || sy + sw.height < 0 || sy > camera.height) continue;
                const active = sw.activated;
                ctx.fillStyle = active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(244, 63, 94, 0.3)';
                ctx.fillRect(sx, sy, sw.width, sw.height);
                ctx.strokeStyle = active ? '#4ade80' : '#fb7185';
                ctx.lineWidth = 2;
                ctx.strokeRect(sx + 1, sy + 1, sw.width - 2, sw.height - 2);
                ctx.fillStyle = active ? '#86efac' : '#fecdd3';
                ctx.beginPath();
                ctx.arc(sx + sw.width / 2, sy + sw.height / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Forced-gravity zones: semi-transparent amber AABB boxes.
        if (this.gravityZones.length > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(251, 146, 60, 0.22)';
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
            ctx.lineWidth = 2;
            for (const zone of this.gravityZones) {
                const zx = zone.x - camera.x;
                const zy = zone.y - camera.y;
                if (zx + zone.width < 0 || zx > camera.width || zy + zone.height < 0 || zy > camera.height) continue;
                ctx.fillRect(zx, zy, zone.width, zone.height);
                ctx.strokeRect(zx + 1, zy + 1, zone.width - 2, zone.height - 2);
            }
            ctx.restore();
        }
    }
}
