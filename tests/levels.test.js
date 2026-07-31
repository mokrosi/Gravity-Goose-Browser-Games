/*
 * Headless level-data test suite (Node.js, no DOM required).
 *
 * Validates all 10 level matrices (rectangular rows, solid borders, one
 * player start and one bread per level) and the LevelManager loading logic:
 * retro/sunset themes, forced-gravity zones and the Level 6+ flip-limit rule.
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

// 1. Ten levels
assert(lm.levels.length === 10, 'exactly 10 levels');

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
        assert(/^[#^PBcEz. ]+$/.test(row), `L${i + 1} row ${r} only uses known tiles`);
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

// 5. Every level loads exactly one bread and a valid player start
for (let i = 0; i < 10; i++) {
    lm.loadLevel(i);
    assert(lm.items.length === 1, `L${i + 1} loads exactly one bread item`);
    assert(lm.playerStart.x >= 0 && lm.playerStart.y >= 0, `L${i + 1} has a player start`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
