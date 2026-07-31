class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setDragX(1000);
        this.setMaxVelocity(200, 600);
        
        this.acceleration = 1200;
        this.jumpVelocity = -350;
        this.coyoteTime = 100;
        this.jumpBuffer = 100;
        this.lastGroundedTime = 0;
        this.lastJumpPressedTime = 0;
        
        this.canDash = true;
        this.isDashing = false;
        this.dashSpeed = 400;
        this.dashDuration = 150;
        this.dashCooldown = 500;
        this.lastDashTime = 0;
        
        this.canDoubleJump = false;
        this.wallSlideSpeed = 50;
        this.wallJumpVelocity = { x: 250, y: -300 };
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
        if (this.isDashing) return;
        
        const isGrounded = this.body.onFloor() || this.body.touching.down;
        const isTouchingRight = this.body.blocked.right;
        const isTouchingLeft = this.body.blocked.left;
        const isTouchingWall = (isTouchingLeft || isTouchingRight) && !isGrounded;
        
        if (isGrounded) {
            this.lastGroundedTime = time;
            this.canDash = true;
            this.canDoubleJump = true;
            if (this.scaleX !== 1 || this.scaleY !== 1) {
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
        
        if (inputX !== 0) {
            this.setAccelerationX(inputX * this.acceleration);
            this.setFlipX(inputX < 0);
        } else {
            this.setAccelerationX(0);
        }
        
        // Wall Slide
        if (isTouchingWall && this.body.velocity.y > 0) {
            if ((isTouchingLeft && inputX < 0) || (isTouchingRight && inputX > 0)) {
                this.isWallSliding = true;
                this.setVelocityY(this.wallSlideSpeed);
                // Also reset double jump when wall sliding
                this.canDoubleJump = true; 
            } else {
                this.isWallSliding = false;
            }
        } else {
            this.isWallSliding = false;
        }
        
        // Jump Input
        if (Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.w) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            this.lastJumpPressedTime = time;
        }
        
        const timeSinceGrounded = time - this.lastGroundedTime;
        const timeSinceJumpPressed = time - this.lastJumpPressedTime;
        
        if (timeSinceJumpPressed <= this.jumpBuffer) {
            if (timeSinceGrounded <= this.coyoteTime) {
                this.jump(time, false);
            } else if (this.isWallSliding || isTouchingWall) {
                this.wallJump(isTouchingRight ? -1 : 1);
            } else if (this.canDoubleJump) {
                this.jump(time, true);
            }
        }
        
        // Variable Jump
        if ((this.keys.up.isUp && this.keys.w.isUp && this.keys.space.isUp) && this.body.velocity.y < 0) {
            this.body.velocity.y *= 0.5;
        }
        
        // Dash
        if (Phaser.Input.Keyboard.JustDown(this.keys.shift) && this.canDash && time > this.lastDashTime + this.dashCooldown) {
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
            // Additional squish for double jump
            this.scene.tweens.add({
                targets: this,
                scaleX: 0.8,
                scaleY: 1.2,
                duration: 100,
                yoyo: true
            });
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
        this.setFlipX(dir < 0);
        
        sfx.jump();
        
        // Wall jump effect
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
            scaleX: 1.5,
            scaleY: 0.5,
            duration: this.dashDuration,
            yoyo: true
        });
        
        // Dash trail effect (simple version, can be expanded)
        let trailTimer = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                const trail = this.scene.add.sprite(this.x, this.y, 'player');
                trail.setTint(0x00ffff);
                trail.setAlpha(0.5);
                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            },
            repeat: this.dashDuration / 30
        });
        
        this.scene.time.delayedCall(this.dashDuration, () => {
            this.isDashing = false;
            this.body.setAllowGravity(true);
            this.setVelocityX(0);
        });
    }
}
