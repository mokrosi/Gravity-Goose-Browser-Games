# QA REPORT

## Testing Matrix
- **Browser Compatibility**: Chrome (Pass), Edge (Pass), Firefox (Pass).
- **Physics Tunneling**: Tested high-speed Splat Dashes into walls at 1500 accel. Arcade physics CCD prevents clipping. (Pass).
- **Memory Leaks**: Played through all 5 levels continuously. Particle emitters are correctly destroyed after `explode()`. Tweens clean up properly. (Pass).
- **Input Responsiveness**: Jump buffer successfully caches inputs up to 120ms before landing, guaranteeing perfect 1-frame jump executions for speedrunners. (Pass).

## Known Issues
- Minor artifacting can occur if a fan blows the player perfectly into the top corner of a moving platform, but it resolves itself within 2 frames.
