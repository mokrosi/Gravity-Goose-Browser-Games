# 🪿 Gravity Goose: The Bread Robbery

A fast-paced **vanilla JavaScript / HTML5 Canvas** platformer. You are an angry goose with cyber anti-gravity boots, stealing its bread back from an alien frog armada — one gravity flip at a time.

> Zero frameworks. Zero dependencies. Pure retro synthwave chaos.

![GitHub Actions](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/YOUR_REPO/deploy.yml?label=GitHub%20Pages&logo=github)
![GitHub License](https://img.shields.io/github/license/YOUR_USERNAME/YOUR_REPO)
![JS](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Made with Canvas](https://img.shields.io/badge/HTML5-Canvas-orange)

---

## 🎮 Gameplay Preview

_Replace these placeholders with `.gif` recordings of your playthrough (see `docs/gifs/README.md` for how to record one)._

| General gameplay | Anti-gravity flip | 100% collectibles |
| :---: | :---: | :---: |
| ![Gameplay GIF](docs/gifs/gameplay.gif) | ![Gravity flip GIF](docs/gifs/gravity-flip.gif) | ![Breadcrumbs GIF](docs/gifs/breadcrumbs.gif) |

---

## ✨ Features

- 🧲 **Anti-gravity mechanic** — press `SPACE` to instantly flip gravity and walk on the ceiling. Jumps, landings and coyote time all adapt to the gravity direction.
- 🎮 **Modern game-feel controller** — coyote time (0.1s), jump buffering (0.1s), variable jump height, acceleration/friction, **wall slide + wall jump**, and a **dash** (Shift) with a brief gravity-off window and cooldown. Fully frame-rate independent via a delta-time game loop.
- 🖱️ **Mouse & keyboard parity** — left-click jumps exactly like `W`/`↑`, so you can play entirely with the mouse or switch freely between input styles.
- 🎥 **Smooth lerp camera** — the viewport glides toward the goose with a mathematical `lerp`, and *leads ahead* based on velocity so you can see what's coming.
- ⏱️ **Built-in speedrun timer** — per-level time in `MM:SS:ms` plus a full-run timer.
- 🏆 **Best times + level select** — finish a level to unlock the next one; per-level and full-run bests are saved in `localStorage` and announced with a "NEW BEST" fanfare.
- 👻 **Ghost replays** — every new best run is recorded and replayed as a translucent goose on later attempts. The ghost fades out as you catch up to it (< 60px).
- ✨ **Golden Breadcrumbs** — optional bonus collectibles hidden in dangerous or hard-to-reach places, announced with floating `+1` / `Perfect!` popups. Grab every crumb for the 100% completion badge on the Victory screen; a lifetime counter is saved too.
- ⚙️ **Settings menu** — pause anywhere to adjust **SFX volume** (Web Audio master gain) and toggle **screen shake** off for motion-sickness-friendly play.
- 🧊 **Tunneling-proof physics** — swept AABB collision resolution in sub-tile steps, so nothing falls through the floor — even at terminal velocity or during lag spikes.
- 🎼 **Procedural 8-bit audio** — every jump, flip, pickup, hurt and win is synthesized live with the Web Audio API, plus a looping chiptune soundtrack that **speeds up as you approach your best time**.
- 🎨 **Procedural pixel art** — all sprites are generated at runtime on `<canvas>`. No image assets to ship.
- 🖱️ **Custom pixel cursor** — a neon goose pointer replaces the OS cursor in-game, with a pointer variant over clickable UI buttons.
- 🛠️ **Visual level editor** — a standalone `editor.html` page: paint tiles, validate, export JSON, drop it into the game.
- 📱 **Responsive arcade cabinet** — the game auto-scales to any viewport while keeping the crisp retro 4:3 aspect ratio.
- 🚀 **One-click deploy** — push to `main` and a GitHub Actions workflow publishes the game to GitHub Pages automatically.

---

## 🕹️ How to Play

### Controls

| Key | Action |
| :-- | :-- |
| `A` / `D` or `←` / `→` | Move (acceleration & friction) |
| `W` / `↑` / **left-click** | Jump — **tap** for a small hop, **hold** for full height |
| `SHIFT` | Dash (works in mid-air; brief gravity-off + cooldown) |
| `SPACE` | Flip gravity (walk on ceilings) |
| `ESC` | Pause |

**Wall slide & wall jump:** hold into a wall while falling to slide down it slowly, then press Jump to kick off the wall in the opposite direction.

### Objective

1. Press **START GAME** to open the **level select**, then pick Level 1 to begin a run (finishing a level unlocks the next one).
2. Collect **all the bread** (`B`) in the level to advance.
3. Avoid alien frogs and spike hazards — falling out of the world also costs a life.
4. **Bonus:** collect the golden breadcrumbs (`c`) for a 100% completion run.
5. Complete all **5 levels** to reach the Victory screen and see your final time.

---

## 🏃 Speedrunning & 100% Completion

- The HUD tracks a **per-level timer** (`MM:SS:ms`). It pauses with the game and keeps running if you die — just like a real speedrun.
- Beat your **Best Time** to hear a little victory fanfare; it is saved per-level and for the whole run.
- **Ghost replay:** when a run becomes the new best, it is recorded and replayed on your next attempt. Chase the translucent goose — and the music speeds up the closer you get to your record.
- **Breadcrumbs** (`c`) are the completionist's challenge — they live in spike corridors, on enemy patrol routes and other nasty spots. The HUD shows `CRUMBS n/N`, and the Victory screen shows your overall percentage.

---

## 🛠️ Level Editor

Design your own levels visually — no hand-counting characters:

```bash
python -m http.server 8080
# then open http://localhost:8080/editor.html
```

Paint tiles/spikes/spawns/bread/crumbs/enemies, resize the grid, validate, then **Export JSON** and paste the result into `js/LevelManager.js` → `this.levels`. You can also paste an existing matrix into the editor and remix it. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full tutorial.

---

## 🚀 Running Locally

The game is a static site — no build step, no package install required.

**Option A — open directly**
Double-click `index.html` in any modern browser. (Best times still work; only audio context needs a user gesture, which the Start button provides.)

**Option B — local server (recommended for development)**

```bash
# Python 3
python -m http.server 8080

# or Node.js
npx serve .

# or VS Code: install the "Live Server" extension and click "Go Live"
```

Then open http://localhost:8080 in your browser.

**Option C — run the logic tests**

```bash
npm test
```

Runs the headless physics + controller suites (Node.js only, no browser needed).

---

## 🌐 GitHub Pages

This repo ships with a ready-to-use workflow (`.github/workflows/deploy.yml`) that:

1. Runs the headless logic tests (`npm test`).
2. Deploys the game to GitHub Pages on every push to `main`.

To enable it:

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **GitHub Actions**.
4. Push to `main` (or run the workflow manually from the **Actions** tab).

Your game will be live at `https://<username>.github.io/<repo>/`.

> ⚠️ Remember to replace the badge links in this README with your real username/repo.

---

## 🏗️ Architecture

```
index.html               Entry point: <canvas> + DOM overlay screens + HUD
editor.html              Visual level editor (paint tiles → export JSON)
css/style.css            Retro arcade styling, responsive 4:3 cabinet, animations
js/
  main.js                Bootstraps the Game on window load
  Game.js                Core controller: dt game loop, state machine, timers,
                         level select, settings, collision wiring, HUD
  SaveManager.js         localStorage: unlocked levels, best times, crumbs, settings, ghost replays
  InputHandler.js        Edge-triggered keyboard + mouse input (pressed/released)
  Physics.js             Swept AABB collision engine (X then Y, sub-tile steps)
  Player.js              Goose controller: acceleration, coyote/buffer/variable jump,
                         wall slide/wall jump, dash, gravity flip (gravity-relative ground checks)
  LevelManager.js        The 5 levels as 2D string matrices + parsing
  Camera.js              Smooth lerp follow camera with velocity lookahead + snap()
  SoundManager.js        Procedural 8-bit Web Audio SFX, looping chiptune soundtrack
                         (tempo ramps near a best time), master volume
  ParticleSystem.js      Spark/dust/feather particles
  SpriteGenerator.js     Procedural pixel-art sprites
  AssetManager.js        Image registry (procedural fallbacks)
  entities/
    Entity.js            Base class (x, y, w, h, vx, vy, isDead)
    Enemy.js             Alien frog: patrol, turn-around on walls, gravity
    Item.js              Bread collectible (bobbing animation)
    Crumb.js             Golden breadcrumb bonus collectible (twinkling)
    Ghost.js             Best-run replay: records + draws translucent ghost (proximity fade)
assets/                  Custom pixel cursor PNGs (cursor.png, cursor-pointer.png)
tests/
  physics.test.js        Headless physics suite (Node)
  player.test.js         Headless controller suite (Node)
  save.test.js           Headless SaveManager suite (Node)
.github/workflows/       CI: test + deploy to GitHub Pages
```

### Game loop

```
requestAnimationFrame ──► dt = min((now - last) / 1000, 0.1)
                           ├─ update(dt)   — input → player physics → collisions → pickups → win check
                           ├─ draw()       — parallax → tiles → entities → player → particles
                           └─ input.update() — clear per-frame edge flags
```

The delta-time loop runs continuously (even while paused), which keeps physics stable at any refresh rate and prevents a "delta spike" on resume.

---

## 🧪 Testing

```bash
npm test
```

The `tests/` folder contains three dependency-free Node suites that load the game modules in a sandboxed VM and assert real behavior:

- `physics.test.js` — flush floor/wall/ceiling resolution, no tunneling at terminal velocity, inverted-gravity grounding, bounds.
- `player.test.js` — max-speed acceleration, friction, variable jump, coyote time, jump buffering, gravity-flip jumps, no bunny-hopping, wall slide/wall jump, dash + cooldown, mouse-click jump parity.
- `save.test.js` — `SaveManager` persistence: unlocks, best times, lifetime crumbs, ghost replays, settings, corrupt-storage fallback.

---

## 🤝 Contributing

Want to add a level, a mechanic, or fix a bug? Great — the codebase is small and intentionally framework-free.

👉 **[Read CONTRIBUTING.md](CONTRIBUTING.md)** — it includes a full tutorial on designing new levels by editing the level matrices, plus the coding conventions and PR workflow.

---

## 📄 License

[MIT](LICENSE) — do whatever you want with it, just don't blame the goose.
