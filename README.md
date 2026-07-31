# Aetheria: Neon Ascend

A production-quality browser game built with Phaser 3.

## Overview

Aetheria is an atmospheric 2D pixel-art platformer focusing on tight "Game Feel", responsiveness, and momentum. You play as Lumi, an energy-being ascending through 5 levels of a derelict cybernetic facility.

## Features

- **Phaser 3 Engine**: Built utilizing Phaser 3 for robust Arcade physics, tilemap rendering, and particle systems.
- **Game Feel Mechanics**: Implements Celeste/Hollow Knight-inspired movement (coyote time, jump buffering, wall jumping, directional dashing, squash and stretch, hit-stop).
- **Enemies & Hazards**: Dynamic AI including Crawlers and Flyers.
- **Procedural Audio**: Utilizes `zzfx.js` for zero-asset, procedural 8-bit sound effects.
- **Levels**: 5 distinct, hand-crafted levels stored efficiently in `LevelData.js`.

## Tech Stack

- HTML5 Canvas
- Phaser 3 (via CDN, no build tool required)
- Vanilla JavaScript (ES6 classes)

## How to Play

Simply open `index.html` in any modern web browser or serve it via a local HTTP server.

- **Move**: A/D or Left/Right Arrows
- **Jump**: W, Space, or Up Arrow
- **Dash**: Shift
- **Pause**: ESC

## File Structure

- `index.html`: Main entry point.
- `src/`: Core game logic.
  - `config/`: Phaser game configuration.
  - `scenes/`: Game states (Boot, Preload, MainMenu, Game).
  - `entities/`: Game objects (Player, Enemy, MovingPlatform).
  - `utils/`: Data and utilities (LevelData, zzfx).
- `assets/`: Directory for external assets (images, audio, tilemaps) if expanded.
