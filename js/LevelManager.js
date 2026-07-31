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
        this.theme = 'retro'; // 'retro' (1-5) or 'sunset' (6-10)
        this.playerStart = { x: 50, y: 50 };

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
        // Levels 6-10 shift to the sunset palette (and difficulty rules).
        this.theme = index >= 5 ? 'sunset' : 'retro';

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const char = layout[y][x];
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
                    }
                }
            }
        }
        return true;
    }

    isSolid(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.grid[y][x] === 1;
    }

    // The once-per-airtime gravity-flip stamina rule kicks in on Level 6.
    get flipLimit() {
        return this.currentLevelIndex >= 5;
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

        const sunset = this.theme === 'sunset';
        const tileImg = assetManager.getImage(sunset ? 'tileset_sunset' : 'tileset');
        const spikeImg = assetManager.getImage(sunset ? 'spikes_sunset' : 'spikes');

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
                }
            }
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
