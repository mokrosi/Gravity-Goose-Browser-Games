# Contributing to Gravity Goose: The Bread Robbery

Thanks for wanting to contribute! This is a small, dependency-free vanilla JS game — which means **anyone can add a level, a collectible, or a new mechanic** by editing plain files. No build tools, no package manager magic, just open the folder and start hacking.

- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [How the Game Loop Works](#how-the-game-loop-works)
- [Coding Conventions](#coding-conventions)
- [🗺️ Designing New Levels (Tutorial)](#️-designing-new-levels-tutorial)
- [Running the Tests](#running-the-tests)
- [Manual QA Checklist](#manual-qa-checklist)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [License](#license)

---

## Getting Started

1. **Fork & clone** the repo.
2. **Run the game** — the simplest path is opening `index.html`, but for the best experience serve the folder locally:

   ```bash
   python -m http.server 8080     # or: npx serve .
   ```

   Then open http://localhost:8080.

3. **Run the logic tests** to make sure your environment is sane:

   ```bash
   npm test
   ```

   You should see three suites pass (`physics.test.js`, `player.test.js` and `save.test.js`).

4. Make your change, re-run `npm test`, and manually play-test per the [QA checklist](#manual-qa-checklist) below.

---

## Project Architecture

```
index.html               Entry point: <canvas> + DOM overlay screens + HUD
editor.html              Visual level editor (paint tiles → export JSON)
css/style.css            Retro arcade styling, responsive 4:3 cabinet, animations
js/
  main.js                Bootstraps the Game on window load
  Game.js                Core controller: dt game loop, state machine, timers,
                         level select, settings, collision wiring, HUD
  SaveManager.js         localStorage: unlocked levels, best times, crumbs, settings
  InputHandler.js        Edge-triggered keyboard input (pressed/released)
  Physics.js             Swept AABB collision engine (X then Y, sub-tile steps)
  Player.js              Goose controller: acceleration, coyote/buffer/variable jump,
                         gravity flip (gravity-relative ground checks)
  LevelManager.js        The 5 levels as 2D string matrices + parsing
  Camera.js              Smooth lerp follow camera with velocity lookahead + snap()
  SoundManager.js        Procedural 8-bit Web Audio SFX, master volume
  ParticleSystem.js      Spark/dust/feather particles
  SpriteGenerator.js     Procedural pixel-art sprites
  AssetManager.js        Image registry (procedural fallbacks)
  entities/
    Entity.js            Base class (x, y, w, h, vx, vy, isDead)
    Enemy.js             Alien frog: patrol, turn-around on walls, gravity
    Item.js              Bread collectible (bobbing animation)
    Crumb.js             Golden breadcrumb bonus collectible (twinkling)
tests/                   Headless Node test suites (physics, player, save)
.github/workflows/       CI: test + deploy to GitHub Pages
```

**Key mental model:** `Game.js` is the boss. Each frame it asks every entity to `update(dt)`, then checks collisions via `Physics.checkCollision`, then asks everything to `draw(ctx, camera, assetManager)`. Entities know nothing about the DOM or each other — they only know their rectangle (`x, y, width, height`) and velocity (`vx, vy`). The game is a **state machine** (`START → LEVEL_SELECT → PLAYING → PAUSED/LEVEL_COMPLETE/GAME_OVER → VICTORY`); `SaveManager` holds every persisted bit of progress, and `Camera.follow()` uses `Camera.lerp()` so the viewport glides instead of locking rigidly to the goose.

---

## How the Game Loop Works

```
requestAnimationFrame ──► dt = min((now - last) / 1000, 0.1)
                           ├─ update(dt)
                           ├─ draw()
                           └─ input.update()   (clears per-frame edge flags)
```

- `dt` is **seconds**, capped at `0.1` to avoid tunneling/"spiral of death" after lag spikes.
- All movement is `velocity * dt`. **Never** write `x += 5` per frame — always scale by `dt`.
- The loop runs continuously, even while paused; this keeps `lastTime` fresh so resuming never causes a huge `dt`.

---

## Coding Conventions

- **Vanilla ES6 classes only.** No frameworks, no imports/exports, no npm packages at runtime.
- Scripts are loaded in `index.html` in dependency order — keep new files in that list (and near their related file).
- Methods use **`this.`** for state; static helpers (like `Player.clamp`) are fine for pure functions.
- Prefer **small, single-purpose files** — e.g. a new collectible gets its own class in `js/entities/`.
- Match the existing style: 4-space indentation, `camelCase`, single quotes, trailing commas optional.
- Keep logic **testable in Node** — classes that touch the DOM should isolate that to `draw()`/constructor calls so `tests/` can load them sandboxed.
- Do **not** commit generated artifacts or secrets. `.gitignore` is respected.

---

## 🎨 Using the Level Editor (`editor.html`)

The fastest way to design a level is the in-repo visual editor — no hand-counting characters required.

1. Serve the folder locally and open `http://localhost:8080/editor.html` (or just open `editor.html` directly):

   ```bash
   python -m http.server 8080
   ```

2. **Start from something**: use the `SOURCE` dropdown to load an existing level, or pick `New blank level` and press `FILL BORDERS` to get a solid frame to draw inside.
3. **Paint** with the brush palette: `·` air, `#` solid, `▲` spike, `P` spawn, `🍞` bread, `★` crumb, `🐸` frog. Click to place, **drag** to paint a line, **right-click** to erase.
4. **Resize** the grid with the `SIZE` inputs if you want a wider/taller arena (existing tiles are preserved).
5. **VALIDATE** to catch structural mistakes (row widths, missing spawn/bread, open borders).
6. **EXPORT JSON**, then **COPY**, and paste the array into `js/LevelManager.js` → `this.levels` (see the tutorial below).
7. You can also **paste any existing level matrix** into the textarea and press `LOAD FROM JSON` to edit it visually — great for remixing the shipped levels.

> The editor always emits the exact format the game parser expects: an array of strings, one per row, using the legend characters from the table below.

---

## 🗺️ Designing New Levels (Tutorial)

This is the most fun contribution and also the easiest. **Levels are just arrays of strings** living in `js/LevelManager.js` inside `this.levels`.

### The legend

Each character in a row maps to exactly one 32×32 tile:

| Character | Meaning | Notes |
| :--- | :--- | :--- |
| `#` | Solid cyber tile | Floor, walls, platforms, ceiling |
| `^` | Spike hazard | Kills the goose on contact — place deliberately! |
| `P` | Player spawn point | **Exactly one per level** |
| `B` | Bread item | **You need at least one** — collecting *all* bread ends the level |
| `c` | Golden breadcrumb | Optional bonus collectible for 100% completion |
| `E` | Alien frog enemy | Patrols back and forth, turns around at walls |
| ` ` (space) | Empty air | |

### The rules

1. **Every row must be the same length.** The parser uses `layout[0].length` as the level width — a single short/long row will shift everything and break the level.
2. **Close the borders.** Surround the play area with `#` (or spikes on purpose) so the goose can't leave the world. Falling out of bounds costs a life.
3. **Place exactly one `P`** (the spawn point).
4. **Place at least one `B`** so the level can be completed.
5. **Mind the reachability.** The goose jumps ~4 tiles high and ~7 tiles far (that's a deliberate, generous jump arc). Enemies and spikes on the other hand are always deadly.
6. **Breadcrumbs are optional.** `c` should be risky-but-possible: in a spike corridor, on a high ledge that requires a gravity flip, or on an enemy patrol route. If a crumb is *impossible* to reach, that's a bug — always play-test.

### Step-by-step: add a brand-new level

Open `js/LevelManager.js` and find the `this.levels` array:

```js
this.levels = [
    [ /* Level 1 */ ... ],
    [ /* Level 2 */ ... ],
    ...
];
```

Add a new array **before the closing `];`**. For example, a tiny "Spike Gauntlet" level (12 tiles wide × 9 tiles tall):

```js
// Level 6: The Spike Gauntlet
[
    "############",      // solid ceiling
    "#       ^  #",      // a ceiling spike
    "#  ####### #",      // a platform with a gap underneath it
    "#       c  #",      // golden breadcrumb tucked against the spike
    "#  #     # #",
    "#P #  B  # #",      // goose spawns bottom-left, bread bottom-middle
    "####  ^  ###",      // floor spikes to hop over
    "############"
]
```

Let's verify the rules:

- Every row is exactly **12** characters. ✅
- Borders: row 0 and row 7 are solid `#`, and every row starts/ends with `#`. ✅
- One `P` (row 5), one `B` (row 5). ✅
- The `c` sits next to the ceiling spike — jump from the platform at row 2, or flip gravity and walk the ceiling. Risky, but fair. ✅

> 💡 **Tip for designing:** sketch the level on graph paper (or a spreadsheet) first, then transcribe each row. Keep the goose's 28×28 hitbox and 32px tiles in mind — a gap of one tile is enough to pass through, two tiles is comfortable.

### Adding a new object type (advanced)

If you want a new tile/entity beyond the legend:

1. Add a new entity class in `js/entities/` extending `Entity` (look at `Crumb.js` — it's the smallest example).
2. Register any sprite in `AssetManager.js` (and generate it in `SpriteGenerator.js`).
3. Pick a character in the legend and parse it in `LevelManager.loadLevel()`.
4. Wire the update/collision/draw logic in `Game.js` (look at how `crumbs` are handled).
5. Add a headless test if the logic is testable in Node, and update the legend table in this file.

---

## Running the Tests

```bash
npm test
```

The suites are plain Node scripts with zero dependencies. They load the relevant modules from `js/` with `vm.runInThisContext` (no DOM needed) and assert real behavior:

- `tests/physics.test.js` — floor/wall/ceiling resolution is flush, no tunneling at terminal velocity, inverted-gravity grounding, world bounds.
- `tests/player.test.js` — acceleration to max speed, friction, variable jump height, coyote time, jump buffering, gravity-flip jumps, no bunny-hopping.
- `tests/save.test.js` — `SaveManager` persistence: unlocks, best times, lifetime crumbs, settings, and survival across instances/corrupt storage.

The CI workflow (`.github/workflows/deploy.yml`) runs these before every Pages deployment, so a failing suite blocks the deploy. Keep it green!

---

## Manual QA Checklist

The headless tests cover physics and the controller, but they can't play the game. Always do a quick manual pass on any level change:

- [ ] Start screen loads; `START GAME` opens the **level select**.
- [ ] Level select shows locked/unlocked levels with best times; finishing a level unlocks the next one.
- [ ] The goose moves with acceleration/friction and jumps with variable height.
- [ ] `SPACE` flips gravity; the goose lands on the ceiling and jumps "down".
- [ ] The camera **smoothly lerps** toward the goose and leads slightly ahead when running.
- [ ] `ESC` pauses; `SETTINGS` (volume slider + screen-shake toggle) is reachable from pause and the start screen.
- [ ] Every `B` in the new level is reachable; collecting all of them ends the level.
- [ ] Every `c` is collectible (attempt each one); the HUD `CRUMBS n/N` updates.
- [ ] Enemies patrol and turn around; spikes kill on contact.
- [ ] Falling off the level costs a life; 0 lives shows GAME OVER; the Victory screen appears after level 5.
- [ ] The timer runs in-game, freezes on pause, and shows on the level/victory screens.

---

## Submitting a Pull Request

1. Create a branch: `git checkout -b feat/my-cool-level`.
2. Make your change and **run `npm test`** — all suites must pass.
3. Commit with a clear message, e.g. `feat: add level 6 spike gauntlet`.
4. Push and open a PR against `main`. In the PR description, mention what you changed and how you tested it.

Small, focused PRs are much easier to review. If your PR touches levels, include a screenshot or a short GIF — it makes the diff instantly understandable (see `docs/gifs/README.md` for recording tips).

---

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
