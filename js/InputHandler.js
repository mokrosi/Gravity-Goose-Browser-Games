class InputHandler {
    constructor() {
        this.keys = {};
        this.pressed = {};
        this.released = {};

        const gameKeys = ['Space', 'KeyA', 'KeyD', 'KeyW', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

        window.addEventListener('keydown', (e) => {
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
            if (e.repeat) return;
            if (!this.keys[e.code]) {
                this.pressed[e.code] = true;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys[e.code]) {
                this.released[e.code] = true;
            }
            this.keys[e.code] = false;
        });

        // Avoid stuck keys when the window loses focus
        window.addEventListener('blur', () => {
            this.keys = {};
            this.pressed = {};
            this.released = {};
        });
    }

    // Call once per frame AFTER gameplay logic runs to clear edge-triggered flags
    update() {
        this.pressed = {};
        this.released = {};
    }

    isKeyDown(code) {
        return this.keys[code] === true;
    }

    isKeyPressed(code) {
        return this.pressed[code] === true;
    }

    isKeyReleased(code) {
        return this.released[code] === true;
    }
}
