/*
 * Headless Practice Mode + World 4 theme test suite (Node.js, no browser).
 *
 * Loads the real game classes in a sandboxed VM with a DOM stub, then asserts:
 *   1. World 4 palette mapping (levels 16-20 -> 'mothership')
 *   2. Practice entry sets the flag + HUD badge
 *   3. Deaths in Practice never trigger Game Over
 *   4. Practice clears never write best times / ghosts / medals / unlocks /
 *      achievements / lifetime crumb counts
 *   5. Normal runs still write everything (regression)
 *   6. Level-select buttons expose the Practice chip
 * Run with: node tests/practice.test.js
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

// --- DOM stub: real-ish elements with working classList + innerHTML ---
function makeClassList(el) {
    const set = new Set();
    return {
        add: (...c) => c.forEach(x => set.add(x)),
        remove: (...c) => c.forEach(x => set.delete(x)),
        toggle: (c, force) => {
            if (force === undefined) {
                if (set.has(c)) { set.delete(c); return false; }
                set.add(c); return true;
            }
            if (force) set.add(c); else set.delete(c);
            return force;
        },
        contains: (c) => set.has(c),
    };
}

function makeElement(id) {
    const el = {
        id,
        innerText: '',
        innerHTML: '',
        className: '',
        style: {},
        offsetWidth: 0,
        children: [],
        _listeners: {},
        classList: null,
    appendChild(child) { this.children.push(child); },
    addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); },
    click() { (this._listeners['click'] || []).forEach(fn => fn({ stopPropagation() {} })); },
    querySelectorAll() { return []; },
    getContext() { return makeCtx2d(); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 800, height: 600 }; },
    };
    el.classList = makeClassList(el);
    return el;
}

function makeCtx2d() {
    const fn = () => {};
    const state = {};
    const handler = {
        get(target, prop) {
            if (prop in target) return target[prop];
            return typeof prop === 'string' ? fn : undefined;
        },
        set(target, prop, value) {
            if (prop === 'canvas') return true;
            target[prop] = value;
            return true;
        },
    };
    return new Proxy(state, handler);
}

// --- Global stubs ---
const elements = {};
function getElement(id) {
    if (!elements[id]) elements[id] = makeElement(id);
    return elements[id];
}

global.document = {
    getElementById: getElement,
    querySelector: getElement,
    querySelectorAll: () => [],
    createElement: (tag) => makeElement('created-' + tag),
    body: makeElement('body'),
    addEventListener() {},
};

global.window = { addEventListener() {}, setTimeout, clearTimeout, setInterval, clearInterval };
global.navigator = { vibrate() {} };
global.performance = { now: () => 0 };
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};
const store = {};
global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
};

function makeAudioParam() {
    return {
        value: 0,
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
        linearRampToValueAtTime() {},
    };
}
global.AudioContext = class {
    constructor() {
        this.destination = { connect() {} };
        this.state = 'running';
        this.currentTime = 0;
    }
    createGain() { return { connect() {}, gain: makeAudioParam() }; }
    createOscillator() {
        return {
            connect() {}, start() {}, stop() {},
            frequency: makeAudioParam(), type: 'square',
        };
    }
    resume() {}
};
global.Audio = class { play() {} };
global.Image = class {};

// --- Load all game classes ---
const files = [
    'entities/Entity.js', 'entities/Item.js', 'entities/Crumb.js',
    'entities/Enemy.js', 'entities/Laser.js', 'entities/Boss.js',
    'entities/Ghost.js', 'Physics.js', 'Player.js', 'LevelManager.js',
    'SaveManager.js', 'SpriteGenerator.js', 'AssetManager.js',
    'InputHandler.js', 'Camera.js', 'HintSystem.js', 'MechanicToasts.js',
    'ParticleSystem.js', 'SoundManager.js', 'TouchControls.js',
    'Achievements.js', 'VictoryCinematic.js', 'Game.js',
];
let code = files.map(f => fs.readFileSync(path.join(jsDir, f), 'utf8')).join('\n');
code += '\nglobalThis.__E = { Game, SaveManager, LevelManager };';
vm.runInThisContext(code, { filename: 'combined.js' });

const GameClass = global.__E.Game;

console.log('--- Practice Mode + World 4 tests ---');

// ============ 1. World 4 palette mapping ============
{
    const lm = new __E.LevelManager();
    const expect = [];
    for (let i = 0; i < 20; i++) {
        lm.loadLevel(i);
        expect.push(i < 5 ? 'retro' : (i < 10 ? 'sunset' : (i < 15 ? 'cyberpunk' : 'mothership')));
        assert(lm.theme === expect[i], `level ${i + 1} theme = ${lm.theme} (expected ${expect[i]})`);
    }
    assert(expect[14] === 'cyberpunk' && expect[15] === 'mothership', 'world boundary at level 16');
}

// ============ Helpers ============
function unlockAll(save) {
    for (let i = 0; i < 20; i++) save.unlockLevel(i);
}

function newGame() {
    const game = new GameClass();
    game.save.resetRunRecords(); // wipe any best times written by prior tests
    unlockAll(game.save);
    return game;
}

// Force a full level clear through update(): give the player one pre-collected
// item and let the update loop run the win-condition block.
function forceLevelClear(game, items) {
    game.levelManager.items = items;
    game.update(1 / 60);
}

function fakeCollectedItem() {
    return { collected: true, x: 0, y: 0, width: 16, height: 16, update() {} };
}

// ============ 2. Practice entry: flag + badge ============
{
    const game = newGame();
    game.startPractice(19);
    assert(game.practiceRun === true, 'startPractice sets practiceRun');
    assert(game.currentLevel === 19, 'practice targets level 20 (index 19)');
    assert(game.state === 'PLAYING', 'practice level loads into PLAYING');
    assert(game.lives === 3, 'practice keeps the default 3 lives');
    const badge = getElement('hud-practice-badge');
    assert(!badge.classList.contains('hidden'), 'practice badge visible during practice');

    game.startLevel(19);
    assert(game.practiceRun === false, 'startLevel clears practiceRun');
    assert(badge.classList.contains('hidden'), 'practice badge hidden on normal run');
}

// ============ 3. Deaths never end the run ============
{
    const game = newGame();
    game.startPractice(19);
    let everGameOver = false;
    for (let i = 0; i < 12; i++) {
        game.player.isDead = true;
        game.update(1 / 60);
        if (game.state === 'GAME_OVER') { everGameOver = true; break; }
        assert(game.state === 'PLAYING', `death ${i + 1}: still PLAYING`);
    }
    assert(!everGameOver, '12 practice deaths never trigger GAME_OVER');
    assert(game.lives === 3, 'practice deaths do not decrement lives');
}

// ============ 4. Practice clear writes nothing ============
// (Level 19, index 18: troll gauntlet — a normal-clear level, unlike the
// boss arena at index 19 which clears through the switch sequence instead.)
{
    const game = newGame();
    game.startPractice(18);

    const crumbsBefore = game.save.getTotalCrumbs();
    const bestBefore = game.save.getBestTime(18);
    const unlockBefore = game.save.isLevelUnlocked(19);
    const ghostBefore = game.save.getGhost(18);
    const achievementsBefore = game.save.data.achievements.slice();

    // Collect one Golden Breadcrumb during the practice run (placed on the
    // goose so the collision definitely fires).
    const crumb = {
        collected: false, x: game.player.x, y: game.player.y, width: 20, height: 20,
        update() {}, rechargeFlip() {},
    };
    game.levelManager.crumbs = [crumb];
    game.update(1 / 60);
    assert(game.crumbCollected === 1, 'practice run collects the crumb');
    assert(game.save.getTotalCrumbs() === crumbsBefore, 'practice crumb collection not saved');

    // Clear the level.
    forceLevelClear(game, [fakeCollectedItem()]);
    assert(game.state === 'LEVEL_COMPLETE', 'practice clear still shows LEVEL_COMPLETE');
    assert(getElement('level-best').innerText === 'PRACTICE CLEAR — NOT SAVED', 'clear screen says practice');

    assert(game.save.getBestTime(18) === bestBefore, 'practice clear does not set a best time');
    assert(game.save.isLevelUnlocked(19) === unlockBefore, 'practice clear does not unlock the next level');
    assert(JSON.stringify(game.save.getGhost(18)) === JSON.stringify(ghostBefore), 'practice clear does not overwrite the ghost');
    assert(JSON.stringify(game.save.data.achievements) === JSON.stringify(achievementsBefore), 'practice clear grants no achievements');
    assert(getElement('level-medal').innerText === '', 'practice clear shows no medal');
}

// ============ 5. Normal run regression: everything still writes ============
{
    const game = newGame();
    game.startLevel(18);

    const crumb = {
        collected: false, x: game.player.x, y: game.player.y, width: 20, height: 20,
        update() {}, rechargeFlip() {},
    };
    game.levelManager.crumbs = [crumb];
    game.update(1 / 60);
    assert(game.crumbCollected === 1, 'normal run collects the crumb');
    assert(game.save.getTotalCrumbs() === 1, 'normal run crumb collection saved');

    forceLevelClear(game, [fakeCollectedItem()]);
    assert(game.state === 'LEVEL_COMPLETE', 'normal clear reaches LEVEL_COMPLETE');
    assert(game.save.getBestTime(18) !== null, 'normal clear writes a best time');
    assert(game.save.isLevelUnlocked(19) === true, 'normal clear unlocks the next level');
}

// ============ 6. Level-select Practice chip ============
{
    const game = newGame();
    const grid = getElement('level-select-grid');
    game.renderLevelSelect();
    let btnWithChip = null;
    for (const btn of grid.children) {
        if (btn.children.some(c => c.className === 'level-practice')) { btnWithChip = btn; break; }
    }
    assert(btnWithChip !== null, 'unlocked level buttons contain a Practice chip');
    if (btnWithChip) {
        const chip = btnWithChip.children.find(c => c.className === 'level-practice');
        chip.click();
        assert(game.practiceRun === true, 'chip click starts a practice run');
        assert(game.state === 'PLAYING', 'chip click loads the level');
        game.quitToMenu();
        assert(game.practiceRun === false, 'quitting to menu clears practiceRun');
    }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
