# STYLE GUIDE

## Colors
- **Bloop**: Neon Green (`#00ff88`)
- **Background**: Deep office grey/blue (`#050510`)
- **Destructibles**: 
  - Coolers: Deep blue (`#0088ff`)
  - Desks: Wood brown (`#8b4513`)

## Code Style
- Vanilla ES6 Javascript.
- Phaser 3 Class structures (Entities extending `Phaser.Physics.Arcade.Sprite`).
- Use arrow functions for all callbacks to maintain `this` binding.

## Audio Style
- No files. All sounds generated at runtime using `zzfx.js`.
- Slime sounds: Low frequency, high modulation, short duration.
- Metallic hits: High frequency, fast decay, heavy distortion.
