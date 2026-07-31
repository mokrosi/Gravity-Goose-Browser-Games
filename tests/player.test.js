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
        this.gravityZones = [];
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
    playCollect() {}, playWin() {}, playHurt() {}, playStart() {}, playBlink() {}, playReset() {},
};
const particleStub = {
    emitGravityFlip() {}, emitFootstep() {}, emitCrumbCollect() {},
    emitBreadCollect() {}, emitHurt() {}, emitBlink() {},
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

// Tall corridor: a long fall past the solid left/right border walls so wall
// slide / wall jump have room to be exercised before reaching the floor.
const tallCorridor = new Level([
    '################',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
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

// 14. Wall slide: pressing into a wall while falling clamps the fall speed
{
    const p = new Player(450, 3 * T);
    const input = new KeyInput();
    input.press('KeyD');
    run(p, 30, input, tallCorridor);
    assert(p.wallSliding === true, 'slides while pressing into the wall');
    assert(p.vy > 0 && p.vy <= Player.WALL_SLIDE_SPEED + 0.01, 'fall speed capped while wall sliding');
}

// 15. Wall jump: pressing jump while sliding launches away from the wall
{
    const p = new Player(450, 3 * T);
    const input = new KeyInput();
    input.press('KeyD');
    run(p, 30, input, tallCorridor);
    input.press('KeyW');
    p.update(1 / 60, input, tallCorridor, soundStub, particleStub);
    input.beginFrame();
    assert(p.vx < 0, 'wall jump launches away from the wall');
    assert(p.vy < -300, 'wall jump kicks upward');
    assert(p.wallSliding === false, 'wall jump ends the slide');
}

// 16. Blink: Shift teleports 3 tiles forward, grants i-frames + an afterimage trail
{
    const p = new Player(2 * T, 5 * T);
    run(p, 30, noInput, flat);
    const xBefore = p.x;
    const input = new KeyInput();
    input.press('ShiftLeft');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.x === xBefore + Player.BLINK_DISTANCE, 'blink teleports exactly 3 tiles forward');
    assert(p.isInvincible === true, 'blink grants invincibility frames');
    assert(p.blinkCooldown > 0, 'blink enters cooldown');
    assert(p.afterimages.length > 0, 'blink spawns an afterimage trail');
}

// 17. Blink cooldown: a second press is ignored until the cooldown expires
{
    const p = new Player(2 * T, 5 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('ShiftLeft');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    const xAfterFirst = p.x;
    input.press('ShiftLeft');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.x === xAfterFirst, 'second blink is ignored during cooldown');
    assert(p.isInvincible === true, 'i-frames still active right after the first blink');
}

// 18. Blink i-frames decay: the goose becomes vulnerable again afterwards
{
    const p = new Player(2 * T, 5 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('ShiftLeft');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.isInvincible === true, 'invincible right after blinking');
    run(p, Math.ceil(Player.INVINCIBLE_TIME / (1 / 60)) + 5, input, flat);
    assert(p.isInvincible === false, 'i-frames expire after the blink window');
    assert(p.afterimages.length === 0, 'afterimages have fully faded');
}

// 19. Blink passes through a one-tile-thin wall
{
    const thinWall = new Level([
        '################',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#....#.........#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '################',
    ]);
    const p = new Player(2 * T, 5 * T);
    const input = new KeyInput();
    input.press('ShiftLeft');
    p.update(1 / 60, input, thinWall, soundStub, particleStub);
    input.beginFrame();
    assert(p.x === 6 * T, 'blink leaps fully past a thin wall');
    assert(p.x >= 6 * T, 'player body completely clears the thin wall');
}

// 20. Blink stops flush against a wall two tiles thick
{
    const thickWall = new Level([
        '################',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#....##........#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '#..............#',
        '################',
    ]);
    const p = new Player(2 * T, 5 * T);
    const input = new KeyInput();
    input.press('ShiftLeft');
    p.update(1 / 60, input, thickWall, soundStub, particleStub);
    input.beginFrame();
    assert(p.x + p.width <= 5 * T, 'blink cannot pass a thick wall');
    assert(p.x === 5 * T - p.width, 'blink stops flush against the thick wall');
}

// 21. Blink cannot escape through the level border wall
{
    const p = new Player(12 * T, 5 * T);
    const input = new KeyInput();
    input.press('ShiftLeft');
    p.update(1 / 60, input, tallCorridor, soundStub, particleStub);
    input.beginFrame();
    assert(p.x + p.width <= 15 * T, 'blink never crosses the solid right border');
    assert(p.x + p.width > 14 * T, 'blink pushed toward the border');
}

// 18. Mouse/keyboard parity: left click flips gravity exactly like SPACE
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('Mouse0');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity < 0, 'left click flips gravity');
}

// 19. Flip is once per airtime: a mid-air press is ignored, landing recharges it
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity < 0, 'first flip works');
    input.release('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    run(p, 20, input, flat);
    assert(p.onGround === false, 'still airborne when the second press arrives');
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity < 0, 'second mid-air flip is ignored');
    input.release('Space');
    run(p, 120, input, flat);
    assert(p.onGround === true, 'resting on the ceiling recharges the flip');
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity > 0, 'flip recharges after landing');
}

// 20. Without the flip limit (Levels 1-5), flipping mid-air is unrestricted
{
    const p = new Player(2 * T, 10 * T);
    p.setFlipLimit(false);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity < 0, 'first flip works');
    input.release('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    run(p, 20, input, flat);
    assert(p.onGround === false, 'still airborne for a second flip');
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity > 0, 'second mid-air flip allowed without the limit');
}

// 21. Forced-gravity zone: snaps inverted gravity back to normal
{
    const p = new Player(2 * T, 5 * T);
    run(p, 30, noInput, flat);
    p.gravity = -1400; // goose is inverted, mid-air
    flat.gravityZones = [{ x: 0, y: 0, width: 400, height: 400 }];
    p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(p.gravity > 0, 'zone forces gravity back to normal');
    assert(p.inGravityZone === true, 'inGravityZone flag is set inside the zone');
}

// 22. Forced-gravity zone: flipping is completely locked while inside
{
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    flat.gravityZones = [{ x: 0, y: 0, width: 400, height: 400 }];
    const input = new KeyInput();
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity > 0, 'flip press inside the zone is ignored');
    assert(p.flipBufferTimer === 0, 'flip buffer is cleared inside the zone');
}

// 23. Golden Breadcrumb recharges the mid-air flip (Level 6+ rule)
{
    flat.gravityZones = []; // ensure no zone leak from earlier tests
    const p = new Player(2 * T, 10 * T);
    run(p, 30, noInput, flat);
    const input = new KeyInput();
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity < 0, 'first flip works');
    input.release('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    run(p, 20, input, flat);
    assert(p.onGround === false, 'still airborne');
    assert(p.canFlip === false, 'flip spent while airborne');
    p.rechargeFlip();
    assert(p.canFlip === true, 'crumb recharge restores the flip mid-air');
    input.press('Space');
    p.update(1 / 60, input, flat, soundStub, particleStub);
    input.beginFrame();
    assert(p.gravity > 0, 'can flip again after the crumb recharge');
}

// 24. Leaving a zone re-enables flipping with normal gravity
{
    const p = new Player(2 * T, 5 * T);
    run(p, 30, noInput, flat);
    p.gravity = -1400;
    flat.gravityZones = [{ x: 0, y: 0, width: 400, height: 400 }];
    p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(p.gravity > 0, 'zone forces gravity normal');
    assert(p.canFlip === false, 'flip locked while inside the zone');
    flat.gravityZones = [];
    p.update(1 / 60, noInput, flat, soundStub, particleStub);
    assert(p.inGravityZone === false, 'left the zone');
    assert(p.canFlip === true, 'flip re-enabled outside the zone');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
