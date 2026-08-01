/*
 * Headless SaveManager test suite (Node.js, no DOM required).
 *
 * Stubs `localStorage` and loads the real `js/SaveManager.js` in a sandboxed
 * VM, then asserts persistence of unlocks, best times, lifetime crumbs and
 * settings — including survival across fresh instances. Run with:
 *   node tests/save.test.js
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

function freshLocalStorage() {
    const store = {};
    return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; },
    };
}

global.localStorage = freshLocalStorage();
vm.runInThisContext(fs.readFileSync(path.join(jsDir, 'SaveManager.js'), 'utf8'), { filename: 'SaveManager.js' });

function newSave() {
    global.localStorage = freshLocalStorage();
    return new SaveManager();
}

console.log('--- SaveManager tests ---');

// 1. Fresh save defaults
{
    const save = newSave();
    assert(save.isLevelUnlocked(0) === true, 'level 0 unlocked by default');
    assert(save.isLevelUnlocked(1) === false, 'level 1 locked by default');
    assert(save.getBestTime(0) === null, 'no best time by default');
    assert(save.getBestTotal() === null, 'no best total by default');
    assert(save.getTotalCrumbs() === 0, 'zero crumbs by default');
    assert(save.getSfxVolume() === 0.8, 'default SFX volume 0.8');
    assert(save.getScreenShake() === true, 'screen shake on by default');
}

// 2. Unlock levels (progressive: unlocking 3 also unlocks everything below)
{
    const save = newSave();
    save.unlockLevel(1);
    save.unlockLevel(3);
    assert(save.isLevelUnlocked(1) === true, 'level 1 unlocked after unlockLevel');
    assert(save.isLevelUnlocked(3) === true, 'level 3 unlocked after unlockLevel');
    assert(save.isLevelUnlocked(2) === true, 'level 2 unlocked progressively (2 <= 3)');
    assert(save.isLevelUnlocked(4) === false, 'level 4 still locked');
    save.unlockLevel(1);
    assert(save.getUnlockedLevels().length === 4, 'unlocking lower level does not duplicate or shrink');
}

// 3. Best time per level: first write is a record, slower is not, faster is
{
    const save = newSave();
    assert(save.setBestTime(0, 65.5) === true, 'first level time is a new record');
    assert(save.setBestTime(0, 70) === false, 'slower time is not a record');
    assert(save.setBestTime(0, 60.25) === true, 'faster time is a new record');
    assert(save.getBestTime(0) === 60.25, 'best time stored');
}

// 4. Best total time
{
    const save = newSave();
    assert(save.setBestTotal(320) === true, 'first total is a new record');
    assert(save.setBestTotal(400) === false, 'slower total is not a record');
    assert(save.setBestTotal(300) === true, 'faster total is a new record');
    assert(save.getBestTotal() === 300, 'best total stored');
}

// 5. Lifetime breadcrumbs accumulate
{
    const save = newSave();
    save.addCrumb();
    save.addCrumb();
    save.addCrumb();
    assert(save.getTotalCrumbs() === 3, 'crumbs accumulate');
}

// 6. Settings: clamping + toggle
{
    const save = newSave();
    save.setSfxVolume(2.5);
    assert(save.getSfxVolume() === 1, 'volume clamps to max 1');
    save.setSfxVolume(-1);
    assert(save.getSfxVolume() === 0, 'volume clamps to min 0');
    save.setSfxVolume(0.35);
    assert(save.getSfxVolume() === 0.35, 'volume stored');
    save.setScreenShake(false);
    assert(save.getScreenShake() === false, 'screen shake toggle stored');
}

// 7. Everything persists across instances
{
    global.localStorage = freshLocalStorage();
    const writer = new SaveManager();
    writer.unlockLevel(2);
    writer.setBestTime(1, 42.5);
    writer.setBestTotal(999);
    writer.addCrumb();
    writer.setSfxVolume(0.5);
    writer.setScreenShake(false);

    const reader = new SaveManager();
    assert(reader.isLevelUnlocked(2) === true, 'unlock persists across instances');
    assert(reader.getBestTime(1) === 42.5, 'best time persists across instances');
    assert(reader.getBestTotal() === 999, 'best total persists across instances');
    assert(reader.getTotalCrumbs() === 1, 'crumbs persist across instances');
    assert(reader.getSfxVolume() === 0.5, 'volume persists across instances');
    assert(reader.getScreenShake() === false, 'screen shake persists across instances');
}

// 8. resetRunRecords clears records but keeps settings
{
    const save = newSave();
    save.unlockLevel(1);
    save.setBestTime(0, 55);
    save.setBestTotal(500);
    save.addCrumb();
    save.setSfxVolume(0.25);
    save.setScreenShake(false);
    save.resetRunRecords();
    assert(save.isLevelUnlocked(0) === true, 'reset keeps level 0 unlocked');
    assert(save.isLevelUnlocked(1) === false, 'reset relocks higher levels');
    assert(save.getBestTime(0) === null, 'reset clears best times');
    assert(save.getBestTotal() === null, 'reset clears best total');
    assert(save.getTotalCrumbs() === 0, 'reset clears crumbs');
    assert(save.getSfxVolume() === 0.25, 'reset keeps SFX volume');
    assert(save.getScreenShake() === false, 'reset keeps screen shake setting');
}

// 9. Ghost replays are in-memory only (not persisted) and clear on reset
{
    global.localStorage = freshLocalStorage();
    const writer = new SaveManager();
    assert(writer.getGhost(0) === null, 'no ghost by default');
    writer.setGhost(0, [{ t: 0, x: 10, y: 20 }, { t: 0.5, x: 40, y: 30 }]);
    writer.setGhost(1, []);
    assert(writer.getGhost(0).length === 2, 'ghost recording stored');
    assert(writer.getGhost(1) === null, 'empty recording is not saved');

    const reader = new SaveManager();
    assert(reader.getGhost(0) === null, 'ghost stays in-memory only (not persisted)');

    writer.resetRunRecords();
    assert(writer.getGhost(0) === null, 'reset clears ghost replays');
}

// 10. Corrupt stored JSON falls back to defaults without throwing
{
    const store = { 'gravityGoose.save': '{{{ not json' };
    global.localStorage = {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; },
    };
    const save = new SaveManager();
    assert(save.isLevelUnlocked(0) === true, 'corrupt save falls back to defaults');
    assert(save.getSfxVolume() === 0.8, 'corrupt save keeps default volume');
}

// 11. Version mismatch clears the cache but keeps best times
{
    const store = {
        gameVersion: '1.1',
        'gravityGoose.save': JSON.stringify({
            unlocked: [0, 1, 2],
            bestTimes: { 0: 12.5 },
            totalCrumbs: 7,
            settings: { sfxVolume: 0.3 }
        })
    };
    global.localStorage = {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; },
    };
    const save = new SaveManager();
    assert(store.gameVersion === '1.2', 'version key updated to current game version');
    assert(save.getBestTime(0) === 12.5, 'best times preserved across version bump');
    assert(save.isLevelUnlocked(0) === true, 'level 0 unlocked after version bump');
    assert(save.isLevelUnlocked(1) === false, 'higher levels relocked after version bump');
    assert(save.getTotalCrumbs() === 0, 'crumbs reset after version bump');
    assert(save.getSfxVolume() === 0.8, 'settings reset after version bump');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
