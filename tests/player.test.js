/*
 * Headless player controller test suite (Node.js, no DOM required).
 *
 * Loads the real game modules (Entity, Physics, Player) in a sandboxed VM and
 * asserts movement / jump / gravity-flip behavior, including coyote time,
 * jump buffering and single-jump-per-press. Run with:  node tests/player.test.js
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const jsDir = path.join(__dirname, '..', 'js');
function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, rel), 'utf8'), { filename: rel });
}

load('entities/Entity.js');
load('Physics.js');
load('Player.js');

const T = 32;
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

class Level {
    constructor(rows) {
        this.rows = rows.map((r) => r.split(''));
        this.width = this.rows[0].length;
        this.height = this.rows.length;
    }
    isSolid(col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) return false;
        return this.rows[row][col] === '#';
    }
}

// Edge-triggered keyboard stub: pressed/released are true for exactly one frame.
class KeyInput {
    constructor() {
        this.down = new Set();
        this.pressed = new Set();
        this.released = new Set();
    }
    press(...codes) {
        for (const code of codes) {
            if (!this.down.has(code)) this.pressed.add(code);
            this.down.add(code);
            this.released.delete(code);
        }
    }
    release(...codes) {
        for (const code of codes) {
            this.down.delete(code);
            this.released.add(code);
        }
    }
    beginFrame() {
        this.pressed.clear();
        this.released.clear();
    }
    isKeyDown(code) { return this.down.has(code); }
    isKeyPressed(code) { return this.pressed.has(code); }
    isKeyReleased(code) { return this.released.has(code); }
}

const noInput = { isKeyDown: () => false, isKeyPressed: () => false, isKeyReleased: () => false, beginFrame: () => {} };
const soundStub = {
    playJump() {}, playFlip() {}, playCrumb() {}, playBest() {},
    playCollect() {}, playWin() {}, playHurt() {}, playStart() {},
};
const particleStub = {
    emitGravityFlip() {}, emitFootstep() {}, emitCrumbCollect() {},
    emitBreadCollect() {}, emitHurt() {},
};

function run(p, frames, input, level) {
    for (let i = 0; i < frames; i++) {
        p.update(1 / 60, input, level, soundStub, particleStub);
        input.beginFrame();
    }
}

// Flat arena: solid ceiling (row 0) + solid floor (row 11)
const flat = new Level([
    '################',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '################',
]);

// Platform at row 9 (cols 4..11) with a long drop to the floor at row 13.
const ledge = new Level([
    '################',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....########.....',
    '................',
    '................',
    '................',
    '################',
]);

console.log('--- Player controller tests ---');

// 1. Acceleration caps at MAX_SPEED and never exceeds it
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('KeyD');
    let maxVx = 0;
    for (let i = 0; i < 60; i++) {
        p.update(1 / 60, input, flat, soundStub, particleStub);
        input.beginFrame();
        maxVx = Math.max(maxVx, p.vx);
    }
    assert(maxVx <= Player.MAX_SPEED, 'speed never exceeds MAX_SPEED');
    assert(p.vx === Player.MAX_SPEED, 'accelerates up to MAX_SPEED');
}

// 2. Friction brings the player to a full stop
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('KeyD');
    run(p, 60, input, flat);
    input.release('KeyD');
    run(p, 30, input, flat);
    assert(p.vx === 0, 'friction stops the player completely');
    run(p, 30, input, flat);
    assert(p.vx === 0, 'player stays stopped');
}

// 3. Variable jump: releasing jump early cuts the upward velocity
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('KeyW');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    input.release('KeyW');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.vy < 0 && p.vy > -400, 'early release cuts the jump ascent');
}

// 4. Ledge walk-off clears onGround
{
    const p = new Player(10 * T, 8 * T);
    run(p, 30, noInput, ledge);
    const input = new KeyInput();
    input.press('KeyD');
    let walked = 0;
    while (p.onGround && walked < 120) {
        p.update(1 / 60, input, ledge, soundStub, particleStub);
        input.beginFrame();
        walked++;
    }
    assert(p.onGround === false, 'walks off the ledge edge');
}

// 5. Coyote time: jump fires within the window after leaving a ledge
{
    const p = new Player(10 * T, 8 * T);
    run(p, 30, noInput, ledge);
    const input = new KeyInput();
    input.press('KeyD');
    while (p.onGround) {
        p.update(1 / 60, input, ledge, soundStub, particleStub);
        input.beginFrame();
    }
    input.press('KeyW');
    p.update(1 / 60, input, ledge, soundStub, particleStub);
    input.beginFrame();
    assert(p.vy < 0, 'coyote jump fires immediately after walking off');
}

// 6. Coyote time expires: no jump once the window has passed
{
    const p = new Player(10 * T, 8 * T);
    run(p, 30, noInput, ledge);
    const input = new KeyInput();
    input.press('KeyD');
    while (p.onGround) {
        p.update(1 / 60, input, ledge, soundStub, particleStub);
        input.beginFrame();
    }
    run(p, 15, noInput, ledge);
    assert(p.onGround === false, 'still airborne after coyote window');
    input.press('KeyW');
    p.update(1 / 60, input, ledge, soundStub, particleStub);
    input.beginFrame();
    assert(p.vy >= 0, 'expired coyote time does not fire a jump');
}

// 7. Jump buffering: a press just before landing fires right after landing
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('KeyW');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    input.release('KeyW');
    input.beginFrame();
    let guard = 0;
    while (p.vy < 0 && guard < 200) {
        p.update(1 / 60, input, flat, soundStub, particleStub);
        input.beginFrame();
        guard++;
    }
    guard = 0;
    while (p.y + p.height < 11 * T - 4 && guard < 200) {
        p.update(1 / 60, input, flat, soundStub, particleStub);
        input.beginFrame();
        guard++;
    }
    input.press('KeyW');
    let fired = false;
    for (let i = 0; i < 8; i++) {
        p.update(1 / 60, input, flat, soundStub, particleStub);
        input.beginFrame();
        if (p.vy < -200) fired = true;
    }
    assert(fired, 'buffered jump fires shortly after landing');
}

// 8. Grounded and upright before flipping gravity
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    assert(p.onGround === true, 'grounded before flip');
    assert(p.gravity > 0, 'gravity pointing down before flip');
}

// 9. Flip inverts gravity and kicks the player toward the new floor
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity < 0, 'flip inverts gravity');
    assert(p.onGround === false, 'flip clears onGround');
    assert(p.vy < 0 && Math.abs(p.vy) < 150, 'flip kicks velocity toward the new floor');
}

// 10. Inverted gravity: the ceiling becomes the floor
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    run(p, 120, noInput, flat);
    assert(Math.abs(p.y - 32) < 0.01, 'rests flush against the ceiling');
    assert(p.onGround === true, 'onGround true while resting on the ceiling');
}

// 11. Inverted gravity jump propels downward
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    run(p, 120, noInput, flat);
    input.press('KeyW');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.vy > 0, 'inverted jump propels downward');
}

// 12. Single jump per press: holding W after landing does not bunny-hop
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('KeyW');
    let airborne = false;
    for (let i = 0; i < 10; i++) {
        p.update(1 / 60, input, flat, soundStub, particleStub);
        input.beginFrame();
        if (!p.onGround) airborne = true;
    }
    assert(airborne, 'jump launches');
    let landed = false;
    for (let i = 0; i < 120; i++) {
        p.update(1 / 60, input, flat, soundStub, particleStub);
        input.beginFrame();
        if (p.onGround) landed = true;
    }
    assert(landed, 'lands while holding W');
    const yAfter = p.y;
    run(p, 30, input, flat);
    assert(Math.abs(p.y - yAfter) < 0.01, 'no bunny-hop while holding W');
    assert(p.vy === 0, 'vy stays zero while grounded with W held');
}

// 13. isRunningFast reports full sprint only
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('KeyD');
    run(p, 60, input, flat);
    assert(p.isRunningFast === true, 'isRunningFast true at top speed');
    input.release('KeyD');
    let guard = 0;
    while (p.isRunningFast && guard < 60) {
        p.update(1 / 60, input, flat, soundStub, particleStub);
        input.beginFrame();
        guard++;
    }
    assert(p.isRunningFast === false, 'isRunningFast false when decelerating');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
