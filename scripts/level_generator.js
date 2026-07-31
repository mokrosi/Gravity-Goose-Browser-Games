const fs = require('fs');
const path = require('path');

const GROUND_Y = 193;

function buildLevel(config) {
    const { length, gaps, pipes, stairs, bricks, mysteryBlocks, enemies, flagX } = config;
    
    let level = {
        flag: [flagX, 24, 16, 24],
        flagpole: [flagX, 48, 16, 135],
        castle: [flagX + 100, 112, 80, 80],
        smallClouds: [], mediumClouds: [], largeClouds: [],
        bricks: [], ground: [], stairs: [], shrubs: [],
        mountains: [], pipes: [], coins_: [], mushrooms: [],
        coins: [], goombas: [], koopas: []
    };

    // Scenery: Clouds, shrubs, mountains
    for (let x = 100; x < flagX; x += 300) {
        level.smallClouds.push([x, 16 + (x % 32), 32, 24]);
        level.mediumClouds.push([x + 150, 32 - (x % 16), 48, 24]);
        if (x % 600 === 0) level.largeClouds.push([x + 50, 32, 64, 24]);
        level.shrubs.push([x + 70, 169, 48, 24]);
        level.mountains.push([x + 200, 161, 48, 32]);
    }

    // Ground & Gaps
    for (let x = 0; x < flagX + 300; x += 16) {
        let isGap = false;
        for (let gap of gaps) {
            if (x >= gap.start && x <= gap.end) {
                isGap = true; break;
            }
        }
        if (!isGap) {
            level.ground.push([x, GROUND_Y, 16, 24]);
        }
    }

    // Pipes
    pipes.forEach(p => {
        level.pipes.push([p.x, p.y, p.w || 32, p.h || 32]);
    });

    // Stairs
    stairs.forEach(s => {
        level.stairs.push([s.x, s.y, 16, 16]);
    });

    // Bricks
    bricks.forEach(b => {
        level.bricks.push([b.x, b.y, 16, 16]);
    });

    // Mystery Blocks (coins_ or mushrooms)
    mysteryBlocks.forEach(m => {
        if (m.type === 'coin') {
            level.coins_.push([m.x, m.y, 16, 16]);
        } else if (m.type === 'mushroom') {
            level.mushrooms.push([m.x, m.y, 16, 16]);
        }
    });

    // Enemies
    enemies.forEach(e => {
        if (e.type === 'goomba') {
            level.goombas.push([e.x, e.y, 16, 16]);
        } else if (e.type === 'koopa') {
            level.koopas.push([e.x, e.y, 16, 24]);
        }
    });

    return level;
}

// ---------------------------------------------------------
// LEVEL 2 - More pipes, some gaps, first koopas
// ---------------------------------------------------------
const level2 = buildLevel({
    length: 3500,
    flagX: 3200,
    gaps: [
        { start: 500, end: 550 },
        { start: 1000, end: 1100 },
        { start: 2000, end: 2050 }
    ],
    pipes: [
        { x: 400, y: 161, h: 32 },
        { x: 800, y: 145, h: 48 }, // taller pipe
        { x: 1500, y: 129, h: 64 }, // even taller
        { x: 2500, y: 161, h: 32 }
    ],
    stairs: [],
    bricks: [
        { x: 300, y: 120 }, { x: 316, y: 120 }, { x: 332, y: 120 },
        { x: 1200, y: 100 }, { x: 1216, y: 100 }, { x: 1232, y: 100 },
        { x: 2200, y: 80 }, { x: 2216, y: 80 }
    ],
    mysteryBlocks: [
        { x: 348, y: 120, type: 'mushroom' },
        { x: 1216, y: 50, type: 'coin' }, // High block
        { x: 2232, y: 80, type: 'coin' }
    ],
    enemies: [
        { x: 300, y: 176, type: 'goomba' },
        { x: 700, y: 176, type: 'koopa' },
        { x: 1300, y: 176, type: 'koopa' },
        { x: 1800, y: 176, type: 'goomba' },
        { x: 1820, y: 176, type: 'goomba' },
        { x: 2600, y: 176, type: 'koopa' }
    ]
});

// ---------------------------------------------------------
// LEVEL 3 - Staircases, tighter platforming, mixed enemies
// ---------------------------------------------------------
let l3Stairs = [];
for (let i=0; i<5; i++) {
    for (let j=0; j<=i; j++) {
        l3Stairs.push({ x: 800 + i*16, y: 177 - j*16 });
    }
}
for (let i=0; i<5; i++) {
    for (let j=0; j<=4-i; j++) {
        l3Stairs.push({ x: 900 + i*16, y: 177 - j*16 });
    }
}
for (let i=0; i<8; i++) {
    for (let j=0; j<=i; j++) {
        l3Stairs.push({ x: 2500 + i*16, y: 177 - j*16 });
    }
}

const level3 = buildLevel({
    length: 3500,
    flagX: 3200,
    gaps: [
        { start: 600, end: 680 },
        { start: 1200, end: 1280 },
        { start: 1500, end: 1580 },
        { start: 1800, end: 1900 }
    ],
    pipes: [
        { x: 400, y: 161, h: 32 },
        { x: 1400, y: 161, h: 32 },
        { x: 2200, y: 145, h: 48 }
    ],
    stairs: l3Stairs,
    bricks: [
        { x: 600, y: 80 }, { x: 616, y: 80 }, { x: 632, y: 80 },
        { x: 1220, y: 120 }, { x: 1236, y: 120 },
        { x: 1840, y: 120 }, { x: 1856, y: 120 }
    ],
    mysteryBlocks: [
        { x: 616, y: 30, type: 'mushroom' },
        { x: 1840, y: 70, type: 'coin' },
        { x: 1856, y: 70, type: 'coin' }
    ],
    enemies: [
        { x: 300, y: 176, type: 'goomba' },
        { x: 500, y: 176, type: 'koopa' },
        { x: 1100, y: 176, type: 'koopa' },
        { x: 1120, y: 176, type: 'goomba' },
        { x: 2000, y: 176, type: 'goomba' },
        { x: 2020, y: 176, type: 'koopa' }
    ]
});

// ---------------------------------------------------------
// LEVEL 4 - Hard platforming, narrow bricks over pits, traps
// ---------------------------------------------------------
let l4Bricks = [];
for (let i=0; i<10; i++) {
    l4Bricks.push({ x: 1000 + i*48, y: 100 }); // Jumping stones over gap
}
for (let i=0; i<8; i++) {
    l4Bricks.push({ x: 2000 + i*32, y: 80 }); // Even harder jumping stones
}

const level4 = buildLevel({
    length: 3800,
    flagX: 3500,
    gaps: [
        { start: 980, end: 1480 },
        { start: 1980, end: 2260 },
        { start: 2600, end: 2700 },
        { start: 2800, end: 2900 }
    ],
    pipes: [
        { x: 300, y: 145, h: 48 },
        { x: 600, y: 129, h: 64 },
        { x: 1700, y: 145, h: 48 },
        { x: 2400, y: 161, h: 32 }
    ],
    stairs: [],
    bricks: [
        ...l4Bricks,
        { x: 1600, y: 120 }, { x: 1616, y: 120 }, { x: 1632, y: 120 }
    ],
    mysteryBlocks: [
        // TRAP! Looks like a coin, but it's over a gap where jumping into it might bounce you down.
        // Wait, standard mystery block gives a coin. We will place it exactly where the player wants to jump.
        { x: 1048, y: 100, type: 'coin' }, // Right over a pit
        { x: 1616, y: 120, type: 'mushroom' },
        { x: 2100, y: 80, type: 'coin' }
    ],
    enemies: [
        { x: 400, y: 176, type: 'koopa' },
        { x: 500, y: 176, type: 'koopa' },
        { x: 800, y: 176, type: 'koopa' },
        { x: 1600, y: 176, type: 'goomba' },
        { x: 1620, y: 176, type: 'goomba' },
        { x: 2450, y: 176, type: 'koopa' },
        { x: 3000, y: 176, type: 'goomba' },
        { x: 3020, y: 176, type: 'goomba' },
        { x: 3040, y: 176, type: 'koopa' }
    ]
});

// ---------------------------------------------------------
// LEVEL 5 - Longest/densest level
// ---------------------------------------------------------
let l5Stairs = [];
for (let i=0; i<8; i++) {
    for (let j=0; j<=i; j++) {
        l5Stairs.push({ x: 3400 + i*16, y: 177 - j*16 });
    }
}
for (let i=0; i<10; i++) {
    for (let j=0; j<=i; j++) {
        l5Stairs.push({ x: 3900 + i*16, y: 177 - j*16 }); // final stairs to flag
    }
}

const level5 = buildLevel({
    length: 4500,
    flagX: 4200,
    gaps: [
        { start: 800, end: 900 },
        { start: 1500, end: 1700 },
        { start: 2300, end: 2400 },
        { start: 2600, end: 2800 },
        { start: 3600, end: 3800 } // Big pit before the end
    ],
    pipes: [
        { x: 500, y: 161, h: 32 },
        { x: 1200, y: 145, h: 48 },
        { x: 1900, y: 129, h: 64 },
        { x: 2100, y: 129, h: 64 },
        { x: 3000, y: 145, h: 48 }
    ],
    stairs: l5Stairs,
    bricks: [
        { x: 400, y: 120 }, { x: 416, y: 120 }, { x: 432, y: 120 },
        { x: 1000, y: 80 }, { x: 1016, y: 80 },
        { x: 1550, y: 120 }, { x: 1566, y: 120 }, { x: 1600, y: 80 }, { x: 1616, y: 80 }, // Platforms over big gap
        { x: 2650, y: 100 }, { x: 2666, y: 100 }, { x: 2700, y: 100 }, { x: 2716, y: 100 }
    ],
    mysteryBlocks: [
        { x: 416, y: 120, type: 'mushroom' },
        { x: 1016, y: 80, type: 'coin' },
        { x: 1600, y: 80, type: 'coin' },
        { x: 2666, y: 100, type: 'mushroom' },
        { x: 3200, y: 120, type: 'coin' },
        { x: 3216, y: 120, type: 'coin' }
    ],
    enemies: [
        { x: 300, y: 176, type: 'goomba' },
        { x: 320, y: 176, type: 'goomba' },
        { x: 600, y: 176, type: 'koopa' },
        { x: 700, y: 176, type: 'koopa' },
        { x: 1000, y: 176, type: 'goomba' },
        { x: 1300, y: 176, type: 'koopa' },
        { x: 1400, y: 176, type: 'koopa' },
        { x: 1800, y: 176, type: 'goomba' },
        { x: 1820, y: 176, type: 'goomba' },
        { x: 1840, y: 176, type: 'goomba' },
        { x: 2200, y: 176, type: 'koopa' },
        { x: 2220, y: 176, type: 'koopa' },
        { x: 2500, y: 176, type: 'goomba' },
        { x: 2850, y: 176, type: 'koopa' },
        { x: 2880, y: 176, type: 'koopa' },
        { x: 3100, y: 176, type: 'goomba' },
        { x: 3120, y: 176, type: 'goomba' },
        { x: 3140, y: 176, type: 'goomba' }
    ]
});

fs.writeFileSync(path.join(__dirname, '../assets/map/levels/level2.js'), `const level2 = ${JSON.stringify(level2, null, 2)};`);
fs.writeFileSync(path.join(__dirname, '../assets/map/levels/level3.js'), `const level3 = ${JSON.stringify(level3, null, 2)};`);
fs.writeFileSync(path.join(__dirname, '../assets/map/levels/level4.js'), `const level4 = ${JSON.stringify(level4, null, 2)};`);
fs.writeFileSync(path.join(__dirname, '../assets/map/levels/level5.js'), `const level5 = ${JSON.stringify(level5, null, 2)};`);

console.log('Levels 2-5 generated successfully!');
