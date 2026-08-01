/*
 * Headless level-data test suite (Node.js, no DOM required).
 *
 * Validates all 30 level matrices (rectangular rows, solid borders, one
 * player start and one bread per level) and the LevelManager loading logic:
 * retro/sunset/cyberpunk/mothership/kitchen themes, forced-gravity zones,
 * crumbling platforms, steam vents, moving lasers, the Level 6+ flip-limit
 * rule, the Level Devil troll traps ('F' fake crumbs + 'T' trigger zones)
 * and the Level 20 / Level 30 boss arenas.
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

// 1. Thirty levels
assert(lm.levels.length === 30, 'exactly 30 levels');

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
        assert(/^[#^PBcEzCSFTV. ]+$/.test(row), `L${i + 1} row ${r} only uses known tiles`);
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

// 5. Levels 11-13: cyberpunk theme, crumbling platforms + moving lasers
for (let i = 10; i < 13; i++) {
    lm.loadLevel(i);
    assert(lm.theme === 'cyberpunk', `L${i + 1} uses the cyberpunk theme`);
    assert(lm.flipLimit === true, `L${i + 1} enforces the flip limit`);
    assert(lm.crumbles.length > 0, `L${i + 1} contains crumbling platforms`);
    assert(lm.lasers.length > 0, `L${i + 1} spawns moving lasers`);
    assert(lm.hazards.length > 0, `L${i + 1} contains spike hazards`);
    assert(lm.entities.length > 0, `L${i + 1} contains patrolling enemies`);
}

// 6. Levels 14-19: Level Devil troll gauntlets with fake crumbs + trigger traps
//    (16-19 use the mothership palette; 14-15 are still cyberpunk)
for (let i = 13; i < 19; i++) {
    lm.loadLevel(i);
    assert(lm.theme === (i < 15 ? 'cyberpunk' : 'mothership'), `L${i + 1} uses the ${i < 15 ? 'cyberpunk' : 'mothership'} theme`);
    assert(lm.flipLimit === true, `L${i + 1} enforces the flip limit`);
    assert(lm.fakeCrumbs.length > 0, `L${i + 1} contains fake crumbs ('F')`);
    assert(lm.trapZones.length > 0, `L${i + 1} contains trigger zones ('T')`);
    assert(lm.entities.length > 0, `L${i + 1} contains patrolling enemies`);
    assert(lm.hazards.length > 0, `L${i + 1} contains spike hazards`);
    assert(lm.isBossLevel === false, `L${i + 1} is not a boss level`);
    assert(lm.switches.length === 0, `L${i + 1} has no boss switches`);
}

// 7. Level 20: single-screen mothership boss arena with exactly 4 corner switches
{
    lm.loadLevel(19);
    assert(lm.theme === 'mothership', 'L20 uses the mothership theme');
    assert(lm.isBossLevel === true, 'L20 is a boss level');
    assert(lm.boss !== null, 'L20 loads a boss');
    assert(lm.switches.length === 4, 'L20 has exactly 4 overload switches');
    assert(lm.boss.x >= 0 && lm.boss.y >= 0, 'L20 boss has a valid spawn');
    assert(lm.width * lm.tileSize <= 25 * 32, 'L20 arena fits a phone-width viewport');
    assert(lm.trapZones.length === 0 && lm.fakeCrumbs.length === 0, 'L20 has no troll traps');
    const corners = lm.switches.map(s => `${Math.round(s.x / 32)},${Math.round(s.y / 32)}`).sort();
    assert(corners[0] === '1,1' && corners[3] === '23,13', 'L20 switches sit in the arena corners');
}

// 7b. Level 30: single-screen kitchen boss arena with exactly 4 corner switches
{
    lm.loadLevel(29);
    assert(lm.theme === 'kitchen', 'L30 uses the kitchen theme');
    assert(lm.isBossLevel === true, 'L30 is a boss level');
    assert(lm.boss !== null, 'L30 loads a boss');
    assert(lm.switches.length === 4, 'L30 has exactly 4 overload switches');
    assert(lm.boss.x >= 0 && lm.boss.y >= 0, 'L30 boss has a valid spawn');
    assert(lm.width * lm.tileSize === 25 * 32, 'L30 arena is exactly phone-width');
    assert(lm.trapZones.length === 0 && lm.fakeCrumbs.length === 0, 'L30 has no troll traps');
    const corners = lm.switches.map(s => `${Math.round(s.x / 32)},${Math.round(s.y / 32)}`).sort();
    assert(corners[0] === '1,1' && corners[3] === '23,14', 'L30 switches sit in the arena corners');
}

// 8. Every level loads exactly one bread and a valid player start
for (let i = 0; i < 30; i++) {
    lm.loadLevel(i);
    assert(lm.items.length === 1, `L${i + 1} loads exactly one bread item`);
    assert(lm.playerStart.x >= 0 && lm.playerStart.y >= 0, `L${i + 1} has a player start`);
}

// 9. Crumbling platforms: tremble while stood on, break, and reset
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

// 10. Moving lasers patrol between their min/max bounds
{
    const laser = new Laser(100, 100, 10, 60, 'y', 100, 300, 100);
    laser.update(0.5);
    assert(laser.y > 100, 'vertical sweep moves the beam downward');
    for (let i = 0; i < 400; i++) laser.update(1 / 60);
    assert(laser.y >= 100 && laser.y + laser.height <= 300, 'beam stays inside its y-range');
}

// 11. Fake crumbs: dormant near a real crumb look-alike, erupt into spikes
//     once the goose gets within 60px.
{
    lm.loadLevel(13);
    const fc = lm.fakeCrumbs[0];
    assert(fc && fc.triggered === false, 'fake crumb loads dormant');

    const far = new Player(fc.x - 300, fc.y);
    assert(far.near(fc, 60) === false, '60px trigger does not fire from afar');

    const close = new Player(fc.x + 8, fc.y);
    assert(close.near(fc, 60) === true, 'proximity trigger fires within 60px');

    const before = lm.hazards.length;
    lm.triggerFake(fc);
    assert(fc.triggered === true, 'fake crumb triggers');
    assert(lm.hazards.length === before + 1, 'triggered crumb spawns a spike hazard');
    assert(lm.droppedHazards.length === 1, 'spawned spike is tracked for drawing');
    lm.resetTraps();
    assert(fc.triggered === false, 'reset re-arms the fake crumb');
    assert(lm.hazards.length === before, 'reset removes the spawned spike');
}

// 12. Trigger zones: entering one drops its configured spike traps instantly
{
    lm.loadLevel(13);
    const zone = lm.trapZones[0];
    assert(zone && zone.drops.length > 0, 'trigger zone carries configured drops');

    const before = lm.hazards.length;
    lm.triggerTrap(zone);
    assert(zone.triggered === true, 'trigger zone fires');
    assert(lm.hazards.length === before + zone.drops.length, 'all configured traps drop');
    assert(lm.droppedHazards.length === zone.drops.length, 'dropped traps are tracked');
    lm.resetTraps();
    assert(zone.triggered === false, 'reset re-arms the trigger zone');
    assert(lm.hazards.length === before, 'reset removes the dropped traps');
}

// 13. Boss attack cycle: telegraph locks the aim to the goose's altitude and
//     the firing beam is a horizontal laser at that exact height.
{
    lm.loadLevel(19);
    const boss = lm.boss;
    const goose = { y: 160, height: 28, x: 200, width: 28 };
    let fired = false;
    for (let i = 0; i < 400; i++) {
        boss.update(1 / 60, lm, goose);
        if (boss.state === 'firing') {
            fired = true;
            break;
        }
    }
    assert(fired, 'boss reaches the firing state');
    assert(boss.state === 'firing', 'boss enters the firing state');
    const beam = boss.firingBeam(25 * 32);
    assert(beam !== null, 'firing beam is active');
    if (beam) {
        assert(Math.abs(beam.y + beam.height / 2 - (goose.y + goose.height / 2)) < 1,
            'beam is aimed at the goose altitude');
        assert(beam.x === 0 && beam.y >= 0, 'beam spans from the left wall');
        assert(beam.width + beam.height > 0, 'beam has positive size');
    }
    // The beam disappears once the shot ends.
    for (let i = 0; i < 60 && boss.state === 'firing'; i++) {
        boss.update(1 / 60, lm, goose);
    }
    assert(boss.state !== 'firing', 'firing state ends');
    assert(boss.firingBeam(25 * 32) === null, 'beam is null outside the firing state');
}

// 14. Boss overload: every switch press adds a hit; defeat enters the death
//     sequence and the death timer runs down.
{
    const boss = new Boss(600, 200, 480);
    for (let i = 0; i < 4; i++) boss.hit();
    assert(boss.hits === 4, 'four switches land four hits');
    boss.defeat();
    assert(boss.isDefeated === true, 'defeat kills the boss');
    boss.update(1 / 60, lm, { y: 200, height: 28 });
    assert(boss.timer < Boss.DEATH_TIME, 'death sequence counts down');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
