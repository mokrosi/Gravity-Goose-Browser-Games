const fs = require('fs');

const code = `
class Boss {}
class Crumb {}
class Enemy {}
class Ghost {}
class Item {}
class Laser {}
class Entity {}

` + fs.readFileSync('c:/Users/mmssk/OneDrive/Desktop/mario/js/Physics.js', 'utf8') + `
` + fs.readFileSync('c:/Users/mmssk/OneDrive/Desktop/mario/js/Player.js', 'utf8') + `
` + fs.readFileSync('c:/Users/mmssk/OneDrive/Desktop/mario/js/LevelManager.js', 'utf8') + `

try {
    const lm = new LevelManager();
    lm.loadLevel(0);
    const p = new Player(lm.playerStart.x, lm.playerStart.y);
    console.log('Initial:', p.x, p.y, 'gravity:', p.gravity);
    
    // Simulate Game.js respawn logic
    p.vx = 0;
    p.vy = 0;
    p.gravity = 1 * Player.GRAVITY;
    p.isDead = false;
    p.state = 'idle';
    p.flipsInAir = 0;
    p.onGround = false;
    p.onCeiling = false;
    p.wallSliding = false;
    p.steamCooldown = 0;
    p.steamLaunch = false;
    
    const input = { isKeyDown: ()=>false, isKeyPressed: ()=>false, isKeyReleased: ()=>false, isTouch: ()=>false };
    const soundManager = { playJump:()=>{}, playBlink:()=>{} };
    const particleSystem = { emitDust:()=>{}, emitBlink:()=>{} };
    
    console.log('Running 100 frames...');
    for (let i = 0; i < 100; i++) {
        p.update(0.016, input, lm, soundManager, particleSystem);
        Physics.resolveX(p, lm, 0.016);
        Physics.resolveY(p, lm, 0.016);
    }
    console.log('After 100 frames:', p.x, p.y);
} catch (e) {
    console.error('ERROR:', e);
}
`;
eval(code);
