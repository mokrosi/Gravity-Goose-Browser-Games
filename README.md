# Glitch Macaque: Cyber Escape

## Overview
Glitch Macaque is a 2D pixel platformer game written entirely in Vanilla HTML, CSS, and JS. It features a complete custom game engine utilizing the HTML5 Canvas API without any external frameworks (No Phaser, No PixiJS).

## The Story
You play as **Nano**, a genetically modified, microscopic monkey trapped inside a malfunctioning supercomputer. "The Glitch" (a malicious virus) has corrupted the system and stolen all the Golden Bananas! You must traverse 5 levels of the computer (Motherboard, RAM, GPU, Hard Drive, CPU) to retrieve the bananas, defeat the Glitch bugs, and restore order.

## Features
- **Custom Game Engine**: Entity-component styled game loop.
- **Physics**: Gravity, friction, collision detection.
- **5 Full Levels**: Increasing difficulty.
- **Original Assets**: Cyberpunk motherboard theme, bananas, and virus bugs.
- **UI/UX**: Custom Start Menu, HUD, Level Transitions, and Game Over overlays.

## How to Play
1. Open `index.html` in any modern web browser.
2. Click **INITIALIZE** on the main menu.
3. Use the **Arrow Keys** (or **A/D**) to move Left and Right.
4. Press **Spacebar** or **W** to Jump. Hold for a higher jump!
5. Collect bananas and jump on glitches to clear the levels!
6. Reach the end flag to proceed to the next system partition.

## Development Stack
- **HTML5**
- **CSS3**
- **Vanilla JavaScript**

## File Structure
- `index.html`: Entry point and UI overlay.
- `assets/css/styles.css`: Styles for the UI.
- `assets/images/`: Contains all generated pixel art sprites.
- `assets/map/levels/`: Contains JSON-like JS level configurations.
- `js/`: Core game engine files (`game.js`, `physics.js`, `nano.js`, `levelBuilder.js`).
- `entity/`: Game entities (`bug.js`, `banana.js`).

## Author
Developed by JS Game Dev Browser (Antigravity).
