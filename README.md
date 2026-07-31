# Gravity Goose: The Bread Robbery

A fast-paced, Vanilla JS, HTML5 Canvas platformer where you play as an angry goose with anti-gravity boots stealing back its bread from alien frogs!

## Tech Stack
- HTML5 Canvas
- CSS3 (Juicy UI, CSS animations)
- Vanilla JavaScript (ES6 Classes)
- **Zero Frameworks**

## How to Play

### Controls
- **A / D** or **Left / Right Arrow**: Move left and right.
- **SPACEBAR**: Instantly flip gravity. Use this to walk on ceilings and bypass obstacles!

### Objective
- Collect all the bread (yellow items) in the level to advance.
- Avoid the Alien Frogs (green enemies) and falling off the screen!
- Complete all 5 levels to win the game.

## Architecture & Code Structure
The game follows a modular Object-Oriented design using Vanilla ES6 classes:

- `/index.html`: The main entry point containing the `<canvas>` and UI overlays (`<div class="screen">`).
- `/css/style.css`: All styling, including the pixel-art scaling (`image-rendering: pixelated`), retro fonts, and screen shake animations.
- `/js/`:
  - `main.js`: Bootstraps the game when the window loads.
  - `Game.js`: The core controller. Manages the game loop (`requestAnimationFrame`), state transitions (menu, playing, game over), and delegates updates/draw calls.
  - `AssetManager.js`: Handles preloading of images with a Promise-based API. Includes a graceful fallback to procedural canvas drawing if assets are missing.
  - `InputHandler.js`: Tracks key states for smooth, continuous input polling.
  - `Physics.js`: A robust AABB collision engine that correctly handles gravity flipping and resolving collisions with tiles.
  - `Camera.js`: A simple 2D camera that follows the player and clamps to the level bounds.
  - `LevelManager.js`: Stores the 5 levels as 2D string arrays and parses them into a grid of solid tiles and entities.
  - `Player.js`: The protagonist. Handles specific physics interactions like the gravity flip mechanic and animation states.
  - `entities/`: Base `Entity.js` class with `Enemy.js` and `Item.js` extending it for specific logic.

## QA & Testing Steps
1. **Setup:** Open `index.html` in a modern web browser. (Use a local server like VSCode Live Server for best results, though local file protocol works).
2. **Start Screen:** Verify the retro UI loads with the "Press Start 2P" font. Click "Start Game".
3. **Level 1 (Movement):** Move left and right. Ensure the camera follows the player. Collect the bread to trigger the "Level Cleared" screen.
4. **Level 2 (Gravity Flip):** Press Spacebar. The Goose should instantly snap to the ceiling and walk inverted. Collect the bread.
5. **Enemy Interaction:** Run into an enemy. The screen should shake, lives decrease, and the level restarts. If lives reach 0, verify the "Game Over" screen appears.
6. **Performance:** The game runs on a fixed timestep `dt` to ensure physics stability regardless of refresh rate (capped to avoid spiral of death on lag spikes). Monitor memory in DevTools during level transitions to confirm objects are garbage collected properly.
