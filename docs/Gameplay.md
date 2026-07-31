# Gameplay Mechanics

Aetheria focuses on fluid, responsive movement. 

## Movement
- **Walk/Run**: Immediate acceleration with some ground friction.
- **Jump**: Variable jump height depending on how long the key is held.
- **Coyote Time**: The player can jump for up to 100ms after walking off an edge.
- **Jump Buffering**: Inputs are cached for 100ms before hitting the ground, allowing for perfect consecutive jumps.
- **Wall Slide & Jump**: Touching a wall mid-air allows the player to slide down slowly. Jumping off a wall provides horizontal and vertical momentum.
- **Dash**: A multi-directional, invincible dash that stops vertical momentum. It has a brief cooldown and is refreshed upon touching the ground.

## Interactions
- **Enemies**: 
  - Crawlers patrol on platforms.
  - Flyers hover in a sine-wave pattern.
  - Bouncing on top of enemies destroys them and provides a vertical boost (with a slight hit-stop effect).
  - Touching them from the sides results in a reset (death).
- **Collectibles**: Shards increase your score.
- **Environment**: One-way platforms allow jumping up through them and dropping down by holding `S/Down`. Moving platforms drag the player along perfectly using Arcade Physics friction settings.
