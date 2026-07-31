class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.currentLevel = data.level || 1;
        this.shards = data.shards || 0;
    }

    create() {
        const levelData = LevelData[this.currentLevel];
        if (!levelData) {
            this.add.text(this.cameras.main.width/2, this.cameras.main.height/2, 'YOU ESCAPED!\nScore: ' + this.shards, { font: '32px Courier', fill: '#00ffff', align: 'center' }).setOrigin(0.5);
            return;
        }

        const tileSize = 32;
        const width = levelData.width * tileSize;
        const height = levelData.height * tileSize;

        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setZoom(1.2);
        this.cameras.main.setBackgroundColor('#050510');
        
        // Ambient dust particles
        this.add.particles(0, 0, 'tile_shard', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            lifespan: 10000,
            speedY: { min: -10, max: 10 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.3, end: 0 },
            quantity: 1,
            frequency: 100,
            blendMode: 'ADD'
        });

        this.platforms = this.physics.add.staticGroup();
        this.oneWayPlatforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.add.group();
        this.destructibles = this.physics.add.staticGroup();
        this.spikes = this.physics.add.staticGroup();
        this.collectibles = this.physics.add.staticGroup();
        this.exits = this.physics.add.staticGroup();
        this.fans = this.physics.add.staticGroup();
        this.bouncePads = this.physics.add.staticGroup();
        this.chests = this.physics.add.staticGroup();
        this.signs = this.physics.add.staticGroup();
        this.enemies = this.add.group({ runChildUpdate: true });

        this.generateLevel(levelData.map, tileSize);

        this.uiText = this.add.text(10, 10, `Level: ${this.currentLevel} | Shards: ${this.shards}`, { font: '16px Courier', fill: '#ffffff' });
        this.uiText.setScrollFactor(0);

        this.player = new Player(this, 64, 64);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        
        this.physics.add.collider(this.player, this.oneWayPlatforms, null, (player, platform) => {
            if (player.body.velocity.y > 0 && player.y + player.height / 2 < platform.y) {
                if (player.keys.down.isDown || player.keys.s.isDown) return false;
                return true;
            }
            return false;
        });
        
        this.physics.add.collider(this.player, this.movingPlatforms);

        this.physics.add.overlap(this.player, this.spikes, this.hitHazard, null, this);
        this.physics.add.overlap(this.player, this.collectibles, this.collectShard, null, this);
        this.physics.add.overlap(this.player, this.exits, this.reachExit, null, this);
        
        // Enemy collision
        this.physics.add.collider(this.player, this.enemies, this.hitEnemy, null, this);

        // Destructibles collision
        this.physics.add.collider(this.player, this.destructibles, this.hitDestructible, null, this);
        this.physics.add.collider(this.player, this.chests, this.hitChest, null, this);
        this.physics.add.overlap(this.player, this.signs, this.readSign, null, this);
        
        // Pause Menu Toggle
        this.isPaused = false;
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.isTransitioning) return;
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.physics.pause();
                this.pauseText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'PAUSED', { font: '48px Courier', fill: '#00ffff' }).setOrigin(0.5).setScrollFactor(0);
            } else {
                this.physics.resume();
                if (this.pauseText) this.pauseText.destroy();
            }
        });
    }

    generateLevel(map, tileSize) {
        if (!this.textures.exists('tile_solid')) {
            const g = this.make.graphics();
            g.fillStyle(0x334455, 1).lineStyle(1, 0x112233, 1).fillRect(0,0,tileSize,tileSize).strokeRect(0,0,tileSize,tileSize).generateTexture('tile_solid', tileSize, tileSize);
            g.clear().fillStyle(0x33aa55, 1).fillRect(0,0,tileSize,tileSize/4).generateTexture('tile_oneway', tileSize, tileSize);
            g.clear().fillStyle(0xff0044, 1).fillTriangle(tileSize/2, 0, tileSize, tileSize, 0, tileSize).generateTexture('tile_spike', tileSize, tileSize);
            g.clear().fillStyle(0x00ffff, 1).fillCircle(tileSize/2, tileSize/2, tileSize/4).generateTexture('tile_shard', tileSize, tileSize);
            g.clear().fillStyle(0xff00ff, 1).fillRect(0,0,tileSize,tileSize*2).generateTexture('tile_exit', tileSize, tileSize*2);
            g.clear().fillStyle(0x88ccff, 0.5).fillRect(0,0,tileSize,tileSize).generateTexture('tile_fan', tileSize, tileSize);
            g.clear().fillStyle(0xffaa00, 1).fillRect(0,tileSize/2,tileSize,tileSize/2).generateTexture('tile_bounce', tileSize, tileSize);
            g.clear().fillStyle(0xffdd00, 1).fillRect(0,tileSize/2,tileSize,tileSize/2).generateTexture('tile_chest', tileSize, tileSize);
            g.clear().fillStyle(0xeeeeee, 1).fillRect(tileSize/4,tileSize/4,tileSize/2,tileSize/2).generateTexture('tile_sign', tileSize, tileSize);
            g.destroy();
        }

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const px = x * tileSize + tileSize/2;
                const py = y * tileSize + tileSize/2;
                const type = map[y][x];
                
                if (type === 1) this.platforms.create(px, py, 'tile_solid');
                else if (type === 2) {
                    const plat = this.oneWayPlatforms.create(px, py, 'tile_oneway');
                    plat.body.checkCollision.down = false;
                    plat.body.checkCollision.left = false;
                    plat.body.checkCollision.right = false;
                }
                else if (type === 3) this.movingPlatforms.add(new MovingPlatform(this, px, py, 64, 16, 150, 2000, false));
                else if (type === 4) this.movingPlatforms.add(new MovingPlatform(this, px, py, 64, 16, -100, 2000, true));
                else if (type === 5) this.collectibles.create(px, py, 'tile_shard');
                else if (type === 6) this.exits.create(px, py + tileSize/2, 'tile_exit');
                else if (type === 7) {
                    const spike = this.spikes.create(px, py, 'tile_spike');
                    spike.body.setSize(tileSize-4, tileSize-10).setOffset(2, 10);
                }
                else if (type === 8) this.enemies.add(new Enemy(this, px, py, 'intern'));
                else if (type === 9) this.enemies.add(new Enemy(this, px, py, 'drone'));
                else if (type === 10) this.destructibles.add(new Destructible(this, px, py - 4, 'cooler'));
                else if (type === 11) this.destructibles.add(new Destructible(this, px, py, 'desk'));
                else if (type === 12) this.fans.create(px, py, 'tile_fan');
                else if (type === 13) this.bouncePads.create(px, py, 'tile_bounce');
                else if (type === 14) this.enemies.add(new Enemy(this, px, py, 'manager'));
                else if (type === 15) this.chests.create(px, py, 'tile_chest');
                else if (type === 16) this.signs.create(px, py, 'tile_sign');
            }
        }
    }

    hitChest(player, chest) {
        if (player.isDashing || player.isGroundPounding || player.body.velocity.y < 0) {
            chest.destroy();
            sfx.hit();
            sfx.collect();
            this.cameras.main.shake(100, 0.02);
            for(let i=0; i<5; i++) {
                const shard = this.collectibles.create(chest.x, chest.y - 10, 'tile_shard');
                this.physics.add.collider(shard, this.platforms);
                shard.body.setVelocity(Math.random()*400-200, Math.random()*-300 - 100);
            }
        }
    }

    readSign(player, sign) {
        if (!sign.hasRead) {
            sign.hasRead = true;
            sfx.jump();
            
            const jokes = [
                "Management requests you stop\nleaving slime on the walls.",
                "Mandatory fun hour is\ncurrently suspended.",
                "Warning: Floor is exceptionally\nclean and slippery.",
                "To whoever keeps eating the\nhardware: Please stop."
            ];
            const joke = jokes[Math.floor(Math.random() * jokes.length)];
            
            const text = this.add.text(sign.x, sign.y - 40, joke, { font: 'bold 12px Arial', fill: '#ffffff', backgroundColor: '#000000', padding: 4 }).setOrigin(0.5);
            this.tweens.add({ targets: text, y: text.y - 50, alpha: 0, duration: 3000, onComplete: () => text.destroy() });
        }
    }

    hitDestructible(player, destructible) {
        // If player is dashing or ground pounding, break it
        if (player.isDashing || player.isGroundPounding) {
            destructible.breakProp();
            player.body.velocity.y *= 0.5; // slow down slightly on impact
            // Add a little hit stop
            this.physics.world.timeScale = 2;
            this.time.delayedCall(30, () => {
                this.physics.world.timeScale = 1;
            });
        } else {
            // Act as a solid block (already handled by collider)
        }
    }

    hitEnemy(player, enemy) {
        if (enemy.isDead) return;

        // Ground pound or falling onto enemy = kill
        if (player.isGroundPounding || (player.body.velocity.y > 0 && player.y + player.height/2 < enemy.y + enemy.height/2)) {
            player.setVelocityY(-400); // Bounce off
            player.canDoubleJump = true;
            player.canDash = true;
            enemy.die();
            sfx.stomp();
            this.cameras.main.shake(100, 0.02);
            
            // Hit stop (Game Feel)
            this.physics.world.timeScale = 3;
            this.time.delayedCall(40, () => {
                this.physics.world.timeScale = 1;
            });
            
            // Pop out a shard on kill
            const shard = this.collectibles.create(enemy.x, enemy.y - 20, 'tile_shard');
            this.physics.add.collider(shard, this.platforms);
            shard.body.setVelocityY(-200);
            
        } else if (player.isDashing) {
            // Dashing into manager knocks them back comedically
            enemy.die();
            sfx.hit();
            this.cameras.main.shake(200, 0.04);
        } else {
            // Player takes damage
            this.hitHazard();
        }
    }

    hitHazard() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        sfx.hit();
        this.scene.restart({ level: this.currentLevel, shards: this.shards });
        this.cameras.main.shake(200, 0.05);
    }

    collectShard(player, shard) {
        shard.destroy();
        sfx.collect();
        this.shards += 1;
        this.uiText.setText(`Level: ${this.currentLevel} | Shards: ${this.shards}`);
        const text = this.add.text(shard.x, shard.y, '+1', { font: '16px Courier', fill: '#00ffff' }).setOrigin(0.5);
        this.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 800, onComplete: () => text.destroy() });
    }

    reachExit(player, exit) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        sfx.portal();
        
        player.body.setVelocity(0,0);
        player.body.setAllowGravity(false);
        
        this.cameras.main.fade(1000, 0, 0, 0);
        this.time.delayedCall(1000, () => {
            this.scene.start('GameScene', { level: this.currentLevel + 1, shards: this.shards });
        });
    }

    update(time, delta) {
        if (this.isPaused) return;
        
        if (this.player && !this.isTransitioning) {
            this.player.update(time, delta);
            
            // Fan logic (Overlap check)
            let inFan = false;
            this.physics.overlap(this.player, this.fans, (p, f) => {
                inFan = true;
                p.body.velocity.y -= 40; // Upward draft
                // Cap upward draft
                if (p.body.velocity.y < -300) p.body.velocity.y = -300;
            });
            
            // Bounce pad logic (Collider)
            this.physics.collide(this.player, this.bouncePads, (p, b) => {
                if (p.body.touching.down && b.body.touching.up) {
                    p.setVelocityY(-600);
                    sfx.jump(); // loud bounce
                    p.canDoubleJump = true;
                    p.canDash = true;
                    this.cameras.main.shake(100, 0.02);
                }
            });
        }
        
        if (this.player && this.player.y > this.physics.world.bounds.height) {
            this.hitHazard();
        }
    }
}
