/*
 * Headless level-data test suite (Node.js, no DOM required).
 *
 * Validates all 15 level matrices (rectangular rows, solid borders, one
 * player start and one bread per level) and the LevelManager loading logic:
 * retro/sunset/cyberpunk themes, forced-gravity zones, crumbling platforms,
 * moving lasers, the Level 6+ flip-limit rule and the Level 15 boss arena.
 * Run with:  node tests/levels.test.js
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const jsDir = path.join(__dirname, '..', 'js');
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, rel), 'utf8'), { filename: rel });
}

load('entities/Entity.js');
load('entities/Item.js');
load('entities/Crumb.js');
load('entities/Enemy.js');
load('entities/Laser.js');
load('entities/Boss.js');
load('Physics.js');
load('Player.js');
load('LevelManager.js');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
    if (cond) {
        pass++;
    } else {
        fail++;
        console.log('FAIL:', msg);
    }
}

console.log('--- Level tests ---');

const lm = new LevelManager();

// 1. Fifteen levels
assert(lm.levels.length === 15, 'exactly 15 levels');

// 2. Every matrix is a solid rectangle with a solid border and valid chars
for (let i = 0; i < lm.levels.length; i++) {
    const layout = lm.levels[i];
    const width = layout[0].length;
    assert(width >= 24 && layout.length >= 10, `L${i + 1} has a playable footprint`);

    layout.forEach((row, r) => {
        assert(row.length === width, `L${i + 1} row ${r} has width ${width}`);
    });

    const count = (ch) => layout.reduce((n, row) => n + row.split(ch).length - 1, 0);
    assert(count('P') === 1, `L${i + 1} has exactly one player start`);
    assert(count('B') === 1, `L${i + 1} has exactly one bread`);
    assert(/^#+$/.test(layout[0]), `L${i + 1} top row all solid`);
    assert(/^#+$/.test(layout[layout.length - 1]), `L${i + 1} bottom row all solid`);
    layout.forEach((row, r) => {
        assert(row[0] === '#' && row[row.length - 1] === '#', `L${i + 1} row ${r} has solid side walls`);
        assert(/^[#^PBcEzCS. ]+$/.test(row), `L${i + 1} row ${r} only uses known tiles`);
    });
}

// 3. Levels 1-5: retro theme, no flip limit, no gravity zones
for (let i = 0; i < 5; i++) {
    lm.loadLevel(i);
    assert(lm.theme === 'retro', `L${i + 1} uses the retro theme`);
    assert(lm.flipLimit === false, `L${i + 1} has no flip limit`);
    assert(lm.gravityZones.length === 0, `L${i + 1} has no gravity zones`);
}

// 4. Levels 6-10: sunset theme, flip limit active, zones present
for (let i = 5; i < 10; i++) {
    lm.loadLevel(i);
    assert(lm.theme === 'sunset', `L${i + 1} uses the sunset theme`);
    assert(lm.flipLimit === true, `L${i + 1} enforces the flip limit`);
    assert(lm.gravityZones.length > 0, `L${i + 1} contains gravity zones`);
    assert(lm.hazards.length > 0, `L${i + 1} contains spike hazards`);
}

// 5. Levels 11-14: cyberpunk theme, crumbling platforms + moving lasers
for (let i = 10; i < 14; i++) {
    lm.loadLevel(i);
    assert(lm.theme === 'cyberpunk', `L${i + 1} uses the cyberpunk theme`);
    assert(lm.flipLimit === true, `L${i + 1} enforces the flip limit`);
    assert(lm.crumbles.length > 0, `L${i + 1} contains crumbling platforms`);
    assert(lm.lasers.length > 0, `L${i + 1} spawns moving lasers`);
    assert(lm.hazards.length > 0, `L${i + 1} contains spike hazards`);
    assert(lm.entities.length > 0, `L${i + 1} contains patrolling enemies`);
}

// 6. Level 15: cyberpunk boss arena with exactly 3 overload switches
{
    lm.loadLevel(14);
    assert(lm.theme === 'cyberpunk', 'L15 uses the cyberpunk theme');
    assert(lm.isBossLevel === true, 'L15 is a boss level');
    assert(lm.boss !== null, 'L15 loads a boss');
    assert(lm.switches.length === 3, 'L15 has exactly 3 overload switches');
    assert(lm.boss.x >= 0 && lm.boss.y >= 0, 'L15 boss has a valid spawn');
}

// 7. Every level loads exactly one bread and a valid player start
for (let i = 0; i < 15; i++) {
    lm.loadLevel(i);
    assert(lm.items.length === 1, `L${i + 1} loads exactly one bread item`);
    assert(lm.playerStart.x >= 0 && lm.playerStart.y >= 0, `L${i + 1} has a player start`);
}

// 8. Crumbling platforms: tremble while stood on, break, and reset
{
    const layout = [
        '################',
        '#..............#',
        '#...CCC........#',
        '#..............#',
        '#..............#',
        '################'
    ];
    lm.levels.push(layout);
    const idx = lm.levels.length - 1;
    lm.loadLevel(idx);
    assert(lm.crumbles.length === 3, 'injected level loads 3 crumbling tiles');
    assert(lm.isSolid(4, 2) === true, 'crumble platform is solid while intact');

    const p = new Player(4 * 32, 1 * 32);
    const noInput = { isKeyDown: () => false, isKeyPressed: () => false, isKeyReleased: () => false };
    for (let i = 0; i < 120 && !p.onGround; i++) {
        p.update(1 / 60, noInput, lm, null, null);
    }
    assert(p.onGround === true, 'goose lands on the crumbling platform');
    assert(lm.isSolid(4, 2) === true, 'platform still intact while standing');

    lm.updateCrumbling(0.3, p);
    assert(lm.crumbles[0].tremble > 0, 'platform trembles while stood on');
    assert(lm.isSolid(4, 2) === true, 'platform holds during the tremble');

    lm.updateCrumbling(0.3, p);
    assert(lm.crumbles[0].broken === true, 'platform breaks after 0.5s of weight');
    assert(lm.isSolid(4, 2) === false, 'broken platform is no longer solid');

    lm.resetCrumbles();
    assert(lm.crumbles[0].broken === false, 'reset restores the platform');
    assert(lm.isSolid(4, 2) === true, 'platform is solid again after reset');
    lm.levels.pop();
}

// 9. Moving lasers patrol between their min/max bounds
{
    const laser = new Laser(100, 100, 10, 60, 'y', 100, 300, 100);
    laser.update(0.5);
    assert(laser.y > 100, 'vertical sweep moves the beam downward');
    for (let i = 0; i < 400; i++) laser.update(1 / 60);
    assert(laser.y >= 100 && laser.y + laser.height <= 300, 'beam stays inside its y-range');
}

// 10. Boss attack cycle alternates top/bottom half-arena beams
{
    const boss = new Boss(128, 384, 640);
    let fired = false;
    for (let i = 0; i < 400; i++) {
        boss.update(1 / 60, lm);
        if (boss.state === 'firing') {
            fired = true;
            break;
        }
    }
    assert(fired, 'boss reaches the firing state');
    assert(boss.state === 'firing', 'boss enters the firing state');
    const beam = boss.firingBeam(60 * 32);
    assert(beam !== null, 'firing beam is active');
    if (beam) {
        assert(beam.height === 320, 'top beam covers exactly the top half');
    }
    // Let it cycle around and confirm the next shot fires on the bottom half.
    let bottomSeen = false;
    for (let i = 0; i < 500; i++) {
        boss.update(1 / 60, lm);
        if (boss.side === 'bottom' && boss.state === 'firing') {
            bottomSeen = true;
            break;
        }
    }
    assert(bottomSeen, 'next attack fires on the bottom half');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
