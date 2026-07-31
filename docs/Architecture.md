# Architecture

The game uses a Scene-based architecture powered by Phaser 3.

## Scenes
1. **BootScene**: Handles immediate loading of essential UI assets (like loading bars).
2. **PreloadScene**: Handles loading of heavy game assets (images, audio). Currently dynamically generates placeholders.
3. **MainMenuScene**: Handles the start screen and level initialization.
4. **GameScene**: The core gameplay loop.
   - Parses 2D arrays from `LevelData.js` to construct tilemaps on the fly.
   - Instantiates `Player`, `Enemy`, and `MovingPlatform` entities.
   - Handles overlap and collision logic between Arcade Physics groups.

## Entities
- `Player.js`: Extends `Phaser.Physics.Arcade.Sprite`. Contains its own state machine for advanced platforming mechanics (coyote time, jump buffering, dashing).
- `Enemy.js`: Extends `Phaser.Physics.Arcade.Sprite`. Takes a `type` parameter ('crawler' or 'flyer') to determine AI behavior (patrolling vs sine-wave flying).
- `MovingPlatform.js`: Extends `Phaser.Physics.Arcade.Sprite`. A kinematic body that uses Phaser Tweens for deterministic back-and-forth movement.

## Data
- `LevelData.js`: Centralized dictionary of levels. Separating this from the logic ensures easy level design without touching game logic.
- `zzfx.js`: Micro-synth for procedural audio, avoiding large `.wav` files.
