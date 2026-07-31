class InputHandler {
    constructor() {
        this.keys = {};
        this.pressed = {};
        this.released = {};

        const gameKeys = ['Space', 'KeyA', 'KeyD', 'KeyW', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

        window.addEventListener('keydown', (e) => {
            const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT');
            if (gameKeys.includes(e.code) && !typing) {
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

        // Mouse / keyboard parity: a left click on the game canvas is a full
        // alias for the gravity-flip key (SPACE). Treated as a virtual 'Mouse0'
        // code so gameplay code reads it exactly like a keyboard press
        // (edge-triggered, cleared by update()). Bound to the canvas so clicks
        // on UI screens/buttons never trigger gameplay input.
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (!this.keys['Mouse0']) {
                this.pressed['Mouse0'] = true;
            }
            this.keys['Mouse0'] = true;
        });

        canvas.addEventListener('mouseup', (e) => {
            if (e.button !== 0) return;
            if (this.keys['Mouse0']) {
                this.released['Mouse0'] = true;
            }
            this.keys['Mouse0'] = false;
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
