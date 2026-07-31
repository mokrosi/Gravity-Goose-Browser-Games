/*
 * Headless physics test suite (Node.js, no DOM required).
 *
 * Loads the real game modules (Entity, Physics, Player) in a sandboxed VM and
 * asserts actual collision / resolution behavior. Run with:  node tests/physics.test.js
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

const soundStub = {
    playJump() {}, playFlip() {}, playCrumb() {}, playBest() {},
    playCollect() {}, playWin() {}, playHurt() {}, playStart() {}, playDash() {},
};
const particleStub = {
    emitGravityFlip() {}, emitFootstep() {}, emitCrumbCollect() {},
    emitBreadCollect() {}, emitHurt() {}, emitDash() {},
};
const noInput = {
    isKeyDown: () => false,
    isKeyPressed: () => false,
    isKeyReleased: () => false,
};

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

console.log('--- Physics tests ---');

// 1. Floor landing: flush, grounded, no sinking
{
    const p = new Player(2 * T, 10 * T);
    for (let i = 0; i < 90; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(Math.abs(p.y + p.height - 11 * T) < 0.01, 'rests flush against the floor');
    assert(p.onGround === true, 'onGround while resting');
    const yBefore = p.y;
    for (let i = 0; i < 30; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(Math.abs(p.y - yBefore) < 0.01, 'never sinks into the floor');
}

// 2. Wall: flush push, vx zeroed, can move away
{
    const level = new Level([
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
        '....############',
        '################',
    ]);
    const p = new Player(1 * T, 10 * T);
    const input = { isKeyDown: (code) => code === 'KeyD', isKeyPressed: () => false, isKeyReleased: () => false };
    for (let i = 0; i < 120; i++) p.update(1 / 60, input, level, soundStub, particleStub);
    assert(Math.abs(p.x + p.width - 4 * T) < 0.01, 'pushed flush against the wall');
    assert(p.vx === 0, 'vx zeroed on wall contact');
    const inputLeft = { isKeyDown: (code) => code === 'KeyA', isKeyPressed: () => false, isKeyReleased: () => false };
    for (let i = 0; i < 30; i++) p.update(1 / 60, inputLeft, level, soundStub, particleStub);
    assert(p.x < 4 * T - p.width, 'can move away from the wall');
}

// 3. Jump: rises, lands flush, vy zeroed
{
    const p = new Player(2 * T, 10 * T);
    for (let i = 0; i < 3; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub); // land first
    const press = { isKeyDown: () => false, isKeyPressed: (code) => code === 'KeyW' || code === 'ArrowUp', isKeyReleased: () => false };
    for (let i = 0; i < 5; i++) p.update(1 / 60, press, flat, soundStub, particleStub);
    const noPress = noInput;
    for (let i = 0; i < 120; i++) p.update(1 / 60, noPress, flat, soundStub, particleStub);
    assert(p.onGround === true, 'lands after jumping');
    assert(Math.abs(p.y + p.height - 11 * T) < 0.01, 'lands flush on the floor');
    assert(p.vy === 0, 'vy zeroed on landing');
}

// 4. Inverted gravity: ceiling becomes the floor
{
    const p = new Player(2 * T, 10 * T);
    for (let i = 0; i < 30; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(p.onGround === true, 'grounded before flip');
    const flip = { isKeyDown: () => false, isKeyPressed: () => true, isKeyReleased: () => false };
    p.update(1 / 60, flip, flat, soundStub, particleStub);
    assert(p.gravity < 0, 'gravity inverted');
    for (let i = 0; i < 120; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(Math.abs(p.y - 32) < 0.01, 'rests flush against the ceiling');
    assert(p.onGround === true, 'onGround true while resting on the ceiling');
}

// 5. Inverted gravity jump propels downward
{
    const p = new Player(2 * T, 10 * T);
    for (let i = 0; i < 30; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    p.update(1 / 60, { isKeyDown: () => false, isKeyPressed: () => true, isKeyReleased: () => false }, flat, soundStub, particleStub);
    for (let i = 0; i < 120; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    p.update(1 / 60, { isKeyDown: () => false, isKeyPressed: (code) => code === 'KeyW' || code === 'ArrowUp', isKeyReleased: () => false }, flat, soundStub, particleStub);
    assert(p.vy > 0, 'inverted jump propels downward');
}

// 6. Ceiling bonk: flush, vy zeroed, onCeiling flagged
{
    const tight = new Level([
        '################',
        '................',
        '......#######...',
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
    const p = new Player(7 * T, 2 * T - 28); // standing on the row-2 platform
    for (let i = 0; i < 5; i++) p.update(1 / 60, noInput, tight, soundStub, particleStub); // settle on platform
    const press = { isKeyDown: () => false, isKeyPressed: (code) => code === 'KeyW' || code === 'ArrowUp', isKeyReleased: () => false };
    p.update(1 / 60, press, tight, soundStub, particleStub); // jump fires and bonks the ceiling
    assert(p.vy === 0, 'vy zeroed on ceiling bonk');
    assert(p.onCeiling === true, 'onCeiling flagged on bonk frame');
    assert(Math.abs(p.y - 32) < 0.01, 'flush against the ceiling');
    p.update(1 / 60, noInput, tight, soundStub, particleStub); // gravity pulls away from the ceiling
    assert(p.vy > 0 && p.onCeiling === false, 'falls back away from the ceiling after bonk');
}

// 7. No tunneling at terminal velocity
{
    const p = new Player(2 * T, 2 * T);
    p.vy = 800;
    for (let i = 0; i < 30; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(p.onGround === true, 'catches the floor at terminal velocity');
    assert(Math.abs(p.y + p.height - 11 * T) < 0.01, 'lands flush, no tunneling');
}

// 8. Single large capped dt tick still catches the landing
{
    const p = new Player(2 * T, 2 * T);
    p.vy = 800;
    for (let i = 0; i < 4; i++) p.update(0.1, noInput, flat, soundStub, particleStub);
    assert(p.onGround === true, 'lands even with capped 0.1s dt ticks');
}

// 9. World bounds clamp + vx zeroed
{
    const p = new Player(2 * T, 10 * T);
    for (let i = 0; i < 30; i++) p.update(1 / 60, noInput, flat, soundStub, particleStub);
    const input = { isKeyDown: (code) => code === 'KeyD', isKeyPressed: () => false, isKeyReleased: () => false };
    for (let i = 0; i < 300; i++) p.update(1 / 60, input, flat, soundStub, particleStub);
    assert(Math.abs(p.x + p.width - flat.width * T) < 0.01, 'clamped to right world bound');
    assert(p.vx === 0, 'vx zeroed at world bound');
}

// 10. checkCollision helper
{
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    const c = { x: 20, y: 20, width: 10, height: 10 };
    assert(Physics.checkCollision(a, b) === true, 'overlapping rects collide');
    assert(Physics.checkCollision(a, c) === false, 'separated rects do not collide');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
