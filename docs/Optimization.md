# Optimization

To achieve a locked 60 FPS natively in the browser without build tools, several critical performance choices were made:

## 1. Phaser 3 Static Groups
Instead of iterating through every block in the world for collision detection every frame, static terrain uses `this.physics.add.staticGroup()`. Arcade Physics optimizes these via spatial hashing, meaning only objects near the player are checked.

## 2. Dynamic Texture Generation
Instead of loading external `.png` files, which incur HTTP request overhead and parsing time, placeholder pixel-art geometries are generated on the fly via `Graphics.generateTexture()`. This is kept cached in memory on the GPU.

## 3. Procedural Audio
Using `zzfx.js` means we bypass downloading MBs of `.wav` or `.ogg` files. The synth generates the sound buffer locally in milliseconds upon the first scene load, keeping the memory footprint incredibly low.

## 4. Object Pooling (Phaser Default)
Particles and enemies spawned in groups utilize Phaser's internal pooling, preventing garbage collection stutters (GC pauses) during intensive gameplay moments.
