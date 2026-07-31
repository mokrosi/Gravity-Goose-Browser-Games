/*
 * Headless InputHandler test suite (Node.js, no DOM required).
 *
 * Stubs the tiny bit of DOM/window the constructor touches, then exercises the
 * virtual touch input (setTouch) and the clear() used on screen transitions.
 * Run with:  node tests/input.test.js
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const jsDir = path.join(__dirname, '..', 'js');

// The constructor only attaches listeners — a no-op canvas is enough.
global.document = {
    getElementById: () => ({ addEventListener: () => {} })
};
global.window = {
    addEventListener: () => {}
};

function load(rel) {
    vm.runInThisContext(fs.readFileSync(path.join(jsDir, rel), 'utf8'), { filename: rel });
}

load('InputHandler.js');

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

const input = new InputHandler();

// 1. setTouch press edge (touchstart)
assert(!input.isKeyDown('KeyA'), 'starts released');
assert(!input.isKeyPressed('KeyA'), 'starts with no press edge');
input.setTouch('KeyA', true);
assert(input.isKeyDown('KeyA') === true, 'held while a finger is down');
assert(input.isKeyPressed('KeyA') === true, 'first touchstart fires the press edge');

// 2. Holding the button must not re-fire the edge
input.update(); // per-frame edge clear
input.setTouch('KeyA', true);
assert(input.isKeyPressed('KeyA') === false, 'repeated touchstart while held does not re-fire');
assert(input.isKeyDown('KeyA') === true, 'still held after repeat');

// 3. touchend / touchcancel fires the release edge
input.setTouch('KeyA', false);
assert(input.isKeyReleased('KeyA') === true, 'touchend fires the release edge');
assert(input.isKeyDown('KeyA') === false, 'released after touchend');

// 4. Multi-touch: left + jump can be held at the same time
input.setTouch('KeyA', true);
input.setTouch('KeyW', true);
assert(input.isKeyDown('KeyA') && input.isKeyDown('KeyW'), 'multi-touch holds both buttons');

// 5. update() clears edge flags but keeps held keys
input.update();
assert(!input.isKeyPressed('KeyA') && !input.isKeyReleased('KeyW'), 'update clears edges');
assert(input.isKeyDown('KeyA') && input.isKeyDown('KeyW'), 'held keys survive update');

// 6. clear() drops everything (screen transitions, pause)
input.clear();
assert(!input.isKeyDown('KeyA') && !input.isKeyDown('KeyW'), 'clear releases all held keys');
assert(!input.isKeyPressed('KeyA') && !input.isKeyReleased('KeyW'), 'clear wipes edge flags');

// 7. Canvas tap aliases the gravity-flip input (Mouse0)
input.setTouch('Mouse0', true);
assert(input.isKeyPressed('Mouse0') === true, 'canvas tap fires Mouse0 flip press');
assert(input.isKeyDown('Mouse0') === true, 'Mouse0 held while tapping');
input.setTouch('Mouse0', false);
assert(input.isKeyReleased('Mouse0') === true, 'canvas touch end releases flip');
assert(input.isKeyDown('Mouse0') === false, 'Mouse0 released');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
