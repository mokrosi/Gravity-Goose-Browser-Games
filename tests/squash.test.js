/*
 * Headless squash & stretch + dust particle test suite (Node.js, no DOM).
 *
 * Loads the real Player/Physics/LevelManager and simulates jump, flip and
 * landing sequences, asserting the squash/stretch timers, the dust burst
 * sizes emitted at each event, and the scale math applied in draw().
 * Run with: node tests/squash.test.js
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const jsDir = path.join(__dirname, '..', 'js');
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

global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
for (const f of [
    'Physics.js',
    'entities/Entity.js',
    'entities/Item.js',
    'entities/Crumb.js',
    'entities/Enemy.js',
    'entities/Laser.js',
    'Player.js',
    'LevelManager.js',
]) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, f), 'utf8'), { filename: f });
}

console.log('--- Squash & stretch / dust tests ---');

const dustCalls = [];
const particleStub = {
    emitDust(x, y, n) { dustCalls.push({ x, y, n }); },
    emitGravityFlip() {}, emitFootstep() {}, emitCrumbCollect() {},
    emitBreadCollect() {}, emitHurt() {}, emitBlink() {},
};
const soundStub = {
    playJump() {}, playFlip() {}, playHurt() {}, playCrumb() {},
    playCollect() {}, playBlink() {}, playBest() {}, playReset() {},
    playWin() {}, playStart() {},
};

// Key-specific input stub
const pressed = new Set();
const held = new Set();
const released = new Set();
const input = {
    isKeyPressed: (k) => pressed.has(k),
    isKeyDown: (k) => held.has(k),
    isKeyReleased: (k) => released.has(k),
    isTouch: () => false,
};

const lm = new LevelManager();
lm.loadLevel(0); // retro open level with flat ground
const p = new Player(lm.playerStart.x, lm.playerStart.y);
p.setFlipLimit(lm.flipLimit);

const tick = () => {
    p.update(1 / 60, input, lm, soundStub, particleStub);
    pressed.clear();
    released.clear();
};
const hold = (k) => { held.add(k); pressed.add(k); };
const waitUntil = (pred, cap = 200) => {
    for (let i = 0; i < cap; i++) {
        tick();
        if (pred()) return true;
    }
    return false;
};

// 1. Settle on the ground
assert(waitUntil(() => p.onGround), 'player grounded after settle');

// 2. Jump: stretch + 7-particle dust burst at the feet
dustCalls.length = 0;
hold('KeyW');
tick();
assert(!p.onGround && p.vy < 0, 'jump launches airborne');
assert(p.stretchTimer > 0, 'jump sets stretchTimer');
assert(dustCalls.length === 1 && dustCalls[0].n === 7,
    'jump emits a 7-particle dust burst at the feet, got: ' + JSON.stringify(dustCalls));

// 3. Stretch decays to zero mid-flight
held.clear();
assert(waitUntil(() => p.stretchTimer === 0, 10), 'stretch decays to zero');

// 4. Flip: stretch + 4-particle dust at the contact edge left behind
assert(waitUntil(() => p.onGround), 'grounded again before flip');
dustCalls.length = 0;
p.flipGravity(soundStub, particleStub);
assert(p.stretchTimer > 0, 'flip sets stretchTimer');
assert(dustCalls.length === 1 && dustCalls[0].n === 4,
    'flip emits a 4-particle dust burst at the old feet');
p.flipGravity(soundStub, particleStub); // back to normal gravity
assert(waitUntil(() => p.onGround && p.squashTimer === 0), 'grounded and squash decayed after unflip');

// 5. Hard landing: squash + 8-particle dust burst
hold('KeyW');
tick();
held.clear();
dustCalls.length = 0;
assert(waitUntil(() => p.squashTimer > 0), 'hard landing sets squashTimer');
assert(dustCalls.some(d => d.n === 8), 'landing emits an 8-particle dust burst, got: ' + JSON.stringify(dustCalls));

// 6. Squash decays back to zero
assert(waitUntil(() => p.squashTimer === 0), 'squash decays to zero');

// 7. draw() scale math: squash widens X / shortens Y; stretch does the opposite
let captured = null;
const ctx = {
    save() {}, restore() {}, translate() {},
    scale(x, y) { captured = { x, y }; },
    drawImage() {}, globalAlpha: 1,
};
const camera = { x: 0, y: 0 };
const fakeImg = { width: 32, height: 32 };

p.squashTimer = 0.1;
p.draw(ctx, camera, { getImage: () => fakeImg });
assert(Math.abs(captured.x) > 1, 'squash widens X scale (' + captured.x + ')');
assert(Math.abs(captured.y) < 1, 'squash shortens Y scale (' + captured.y + ')');

p.squashTimer = 0;
p.stretchTimer = 0.1;
p.draw(ctx, camera, { getImage: () => fakeImg });
assert(Math.abs(captured.x) < 1, 'stretch narrows X scale (' + captured.x + ')');
assert(Math.abs(captured.y) > 1, 'stretch elongates Y scale (' + captured.y + ')');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
