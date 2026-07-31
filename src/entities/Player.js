class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Generate a Slime placeholder texture
        if (!scene.textures.exists('slime')) {
            const g = scene.make.graphics();
            g.fillStyle(0x00ff88, 1);
            g.fillRoundedRect(0, 0, 24, 20, 8);
            g.generateTexture('slime', 24, 20);
            g.destroy();
        }

        super(scene, x, y, 'slime');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setDragX(1500);
        this.setMaxVelocity(300, 800);
        
        // Physics & Game Feel properties
        this.acceleration = 1500;
        this.jumpVelocity = -400;
        this.coyoteTime = 120;
        this.jumpBuffer = 120;
        this.lastGroundedTime = 0;
        this.lastJumpPressedTime = 0;
        
        // Slime specific mechanics
        this.canDash = true;
        this.isDashing = false;
        this.dashSpeed = 500;
        this.dashDuration = 150;
        this.dashCooldown = 600;
        this.lastDashTime = 0;
        
        this.isGroundPounding = false;
        this.groundPoundSpeed = 700;

        this.canDoubleJump = false;
        this.wallStickTime = 300;
        this.lastWallStickTime = 0;
        this.wallSlideSpeed = 80;
        this.wallJumpVelocity = { x: 300, y: -350 };
        this.isWallSliding = false;
        
        this.keys = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });
    }
    
    update(time, delta) {
        if (this.isDashing) {
            this.emitSlimeParticles();
            return;
        }
        
        const isGrounded = this.body.onFloor() || this.body.touching.down;
        const isTouchingRight = this.body.blocked.right;
        const isTouchingLeft = this.body.blocked.left;
        const isTouchingWall = (isTouchingLeft || isTouchingRight) && !isGrounded;
        
        if (isGrounded) {
            this.lastGroundedTime = time;
            this.canDash = true;
            this.canDoubleJump = true;
            
            // Landing from Ground Pound
            if (this.isGroundPounding) {
                this.isGroundPounding = false;
                this.scene.cameras.main.shake(150, 0.03);
                sfx.stomp();
                this.createSlimeSplash();
                
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1.6,
                    scaleY: 0.4,
                    duration: 150,
                    yoyo: true
                });
            } else if (this.scaleX !== 1 || this.scaleY !== 1) {
                // Normal landing reset
                this.scene.tweens.add({
                    targets: this,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            }
        }
        
        let inputX = 0;
        if (this.keys.left.isDown || this.keys.a.isDown) inputX = -1;
        else if (this.keys.right.isDown || this.keys.d.isDown) inputX = 1;
        
        if (inputX !== 0 && !this.isGroundPounding) {
            this.setAccelerationX(inputX * this.acceleration);
            this.setFlipX(inputX < 0);
        } else {
            this.setAccelerationX(0);
        }
        
        // Wall Stick & Slide
        if (isTouchingWall && this.body.velocity.y > 0 && !this.isGroundPounding) {
            if ((isTouchingLeft && inputX < 0) || (isTouchingRight && inputX > 0)) {
                if (!this.isWallSliding) {
                    this.lastWallStickTime = time;
                    this.isWallSliding = true;
                    sfx.hit(); // Sticky sound
                }
                
                // Stick for a moment, then slide
                if (time - this.lastWallStickTime < this.wallStickTime) {
                    this.setVelocityY(0);
                    this.body.setAllowGravity(false);
                } else {
                    this.body.setAllowGravity(true);
                    this.setVelocityY(this.wallSlideSpeed);
                }
                
                this.canDoubleJump = true; 
                this.emitSlimeParticles(true); // emit wall slide particles
            } else {
                this.isWallSliding = false;
                this.body.setAllowGravity(true);
            }
        } else {
            this.isWallSliding = false;
            this.body.setAllowGravity(true);
        }
        
        // Ground Pound Input
        if (!isGrounded && !this.isWallSliding && (Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.s))) {
            this.isGroundPounding = true;
            this.setVelocityX(0);
            this.setVelocityY(this.groundPoundSpeed);
            this.scene.tweens.add({
                targets: this,
                scaleX: 0.5,
                scaleY: 1.8,
                duration: 100
            });
        }
        
        // Jump Input
        if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.w) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.lastJumpPressedTime = time;
        }
        
        const timeSinceGrounded = time - this.lastGroundedTime;
        const timeSinceJumpPressed = time - this.lastJumpPressedTime;
        
        if (timeSinceJumpPressed <= this.jumpBuffer && !this.isGroundPounding) {
            if (timeSinceGrounded <= this.coyoteTime) {
                this.jump(time, false);
            } else if (this.isWallSliding || isTouchingWall) {
                this.wallJump(isTouchingRight ? -1 : 1);
            } else if (this.canDoubleJump) {
                this.jump(time, true);
            }
        }
        
        // Variable Jump
        if ((this.keys.up.isUp && this.keys.w.isUp && this.keys.space.isUp) && this.body.velocity.y < 0 && !this.isGroundPounding) {
            this.body.velocity.y *= 0.5;
        }
        
        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.keys.shift) && this.canDash && time > this.lastDashTime + this.dashCooldown && !this.isGroundPounding) {
            this.dash(inputX, time);
        }
    }
    
    jump(time, isDoubleJump) {
        this.setVelocityY(this.jumpVelocity);
        this.lastJumpPressedTime = 0;
        this.lastGroundedTime = 0;
        
        sfx.jump();
        
        if (isDoubleJump) {
            this.canDoubleJump = false;
            this.scene.tweens.add({
                targets: this,
                scaleX: 0.8,
                scaleY: 1.2,
                duration: 100,
                yoyo: true
            });
            this.createSlimeSplash();
        } else {
            this.scene.tweens.add({
                targets: this,
                scaleX: 0.6,
                scaleY: 1.4,
                duration: 100,
                yoyo: true
            });
        }
    }
    
    wallJump(dir) {
        this.setVelocity(dir * this.wallJumpVelocity.x, this.wallJumpVelocity.y);
        this.lastJumpPressedTime = 0;
        this.isWallSliding = false;
        this.body.setAllowGravity(true);
        this.setFlipX(dir < 0);
        
        sfx.jump();
        this.createSlimeSplash();
        
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.7,
            scaleY: 1.3,
            duration: 100,
            yoyo: true
        });
    }
    
    dash(dirX, time) {
        this.isDashing = true;
        this.canDash = false;
        this.lastDashTime = time;
        
        sfx.dash();
        
        if (dirX === 0) dirX = this.flipX ? -1 : 1;
        
        const prevGravityY = this.body.gravity.y;
        this.body.setAllowGravity(false);
        this.setVelocity(dirX * this.dashSpeed, 0);
        
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.8,
            scaleY: 0.4,
            duration: this.dashDuration,
            yoyo: true
        });
        
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.body.setAllowGravity(true);
            this.setVelocityX(0);
        });
    }

    emitSlimeParticles(isWall = false) {
        if (Math.random() > 0.3) return; // limit rate
        const particle = this.scene.add.rectangle(
            this.x + (isWall ? (this.flipX ? -10 : 10) : (Math.random() * 20 - 10)), 
            this.y + (isWall ? 0 : 10), 
            4, 4, 0x00ff88
        );
        this.scene.physics.add.existing(particle);
        particle.body.setVelocity(Math.random() * 50 - 25, isWall ? -50 : 0);
        this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            duration: 400,
            onComplete: () => particle.destroy()
        });
    }

    createSlimeSplash() {
        for(let i=0; i<6; i++) {
            const p = this.scene.add.circle(this.x, this.y + 10, Math.random() * 4 + 2, 0x00ff88);
            this.scene.physics.add.existing(p);
            p.body.setVelocity(Math.random() * 200 - 100, Math.random() * -200);
            this.scene.tweens.add({
                targets: p,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => p.destroy()
            });
        }
    }
}
