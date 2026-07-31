# Developer & Level Design Guide

Welcome to the **Gravity Goose** development guide! We're excited that you want to contribute. This document will help you understand how the game's levels are structured and how you can easily create your own.

## 🗺️ Level Design Guide

The level design in Gravity Goose is matrix-based (2D array of strings), making it incredibly visual and easy to edit directly in the code!

### Locating the Levels
1. Open the `js/LevelManager.js` file in your favorite text editor.
2. Look for the `this.levels` array. 
3. Each level is defined by a 2D array of strings, where each character represents a specific tile, entity, or empty space.

### The Tile Legend
Here is a breakdown of the characters you can use to map out your levels:

| Character | Element | Description |
| :---: | :--- | :--- |
| ` ` (space) | Air | Empty space where the goose can move. |
| `+` | Wall/Floor | Solid ground or walls. |
| `^` | Spikes (Up) | Deadly spikes pointing upwards. |
| `v` | Spikes (Down) | Deadly spikes pointing downwards. |
| `<` | Spikes (Left) | Deadly spikes pointing left. |
| `>` | Spikes (Right) | Deadly spikes pointing right. |
| `*` | Breadcrumb | A collectible item for bonus score/completion. |
| `O` | Goal (Bread) | The end of the level. Collect this sandwich to win! |
| `E` | Enemy | A basic patrolling enemy. |
| `S` | Switch | A mechanism to toggle doors or other interactables. |
| `D` | Door | A solid block that opens when a switch is hit. |
| `@` | Player Spawn | (Optional) Explicitly set where the player starts. |

### Example Level Layout
Here is an example of what a simple level looks like in the code:

```javascript
[
  "++++++++++++++++++++",
  "+                  +",
  "+       ***        +",
  "+                  +",
  "+  S     E     D   +",
  "+                  +",
  "+^^^^^^^^^^^^^^+   +",
  "++++++++++++++++++++"
]
```

### Tips for Good Level Design
1. **Pacing:** Start simple. Introduce mechanics like the Gravity Flip before combining them with Spikes or Enemies.
2. **Readability:** Keep your matrix strings aligned (use a monospaced font) so it's easy to "see" the level in your code editor.
3. **Breadcrumb Trails:** Use `*` (breadcrumbs) to guide the player towards the correct path or a tricky jump.

## 🛠️ Modifying Game Logic
If you want to dive deeper into the engine:
- `js/Player.js` handles all movement, gravity flipping, and the blink dash.
- `js/Physics.js` manages collisions and velocity.
- `js/entities/` contains the logic for different objects (Enemies, Boss, Collectibles).

Feel free to submit pull requests with your custom levels or new features!
