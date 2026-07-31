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
        this.playerStart = { x: 50, y: 50 };

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

    draw(ctx, camera, assetManager) {
        const startX = Math.max(0, Math.floor(camera.x / this.tileSize));
        const endX = Math.min(this.width, Math.ceil((camera.x + camera.width) / this.tileSize));
        const startY = Math.max(0, Math.floor(camera.y / this.tileSize));
        const endY = Math.min(this.height, Math.ceil((camera.y + camera.height) / this.tileSize));

        const tileImg = assetManager.getImage('tileset');
        const spikeImg = assetManager.getImage('spikes');

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
    }
}
