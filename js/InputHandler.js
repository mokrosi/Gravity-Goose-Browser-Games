class InputHandler {
    constructor() {
        this.keys = {};
        this.previousKeys = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    update() {
        // Copy current keys to previous keys at the end of the frame
        this.previousKeys = { ...this.keys };
    }

    isKeyDown(code) {
        return this.keys[code] === true;
    }

    isKeyPressed(code) {
        return this.keys[code] === true && !this.previousKeys[code];
    }

    isKeyReleased(code) {
        return !this.keys[code] && this.previousKeys[code] === true;
    }
}
