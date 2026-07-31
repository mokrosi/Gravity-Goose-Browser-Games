# ARCHITECTURE

## Engine
Phaser 3 Engine (via CDN) utilizing Arcade Physics.

## Data Structures
- **LevelData.js**: Stores a dictionary of all maps. Maps are 2D arrays where integers correspond to entities/tiles. This allows for purely data-driven level generation.
- **Config.js**: Initializes the Phaser instance, scale manager, and physics world gravity/bounds.

## Scene Graph
1. **BootScene**: Minimal loading UI.
2. **PreloadScene**: Procedurally generates all Graphics textures into memory. Loads `zzfx` audio definitions.
3. **MainMenuScene**: Listens for 'Enter' to boot the game.
4. **GameScene**: 
   - Responsible for parsing `LevelData`.
   - Creates static groups (`platforms`, `destructibles`, `fans`) and dynamic groups (`enemies`).
   - Updates `Player` input frame-by-frame.

## Entities
- `Player`: Extends Sprite. Has a standalone state machine for movement and abilities.
- `Enemy`: Extends Sprite. Uses `enemyType` variable to dictate AI patterns on `update()`.
- `Destructible`: Extends Sprite. Uses `breakProp()` to run a tween, emit particles, and self-destruct upon collision.
