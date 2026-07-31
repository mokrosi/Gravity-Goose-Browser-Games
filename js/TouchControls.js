/*
 * TouchControls — Neo-Retro on-screen gamepad (pure vanilla JS + CSS).
 *
 * Glassmorphism buttons (semi-transparent + backdrop blur) hold sharp
 * pixel-art icons drawn at runtime on small <canvas> elements (crisp via
 * image-rendering: pixelated). Input is bound exclusively to touchstart /
 * touchend / touchcancel so there is never a synthetic-click delay, multi-touch
 * works (one listener per button: hold left while tapping jump), and every
 * press fires a short navigator.vibrate() haptic.
 *
 * Layout is pure CSS: landscape floats the controls over the empty screen
 * edges; portrait turns the bottom of the viewport into a solid "Gameboy"
 * control panel (D-pad left, actions right). The controls only appear on
 * coarse-pointer (touch-primary) devices and only while a level is active.
 */
const TOUCH_ICONS = {
    'btn-touch-left': {
        rows: [
            '...XX...',
            '..XXX...',
            '.XXXX...',
            'XXXXXXX.',
            'XXXXXXX.',
            '.XXXX...',
            '..XXX...',
            '...XX...'
        ],
        color: '#ffffff'
    },
    'btn-touch-right': {
        rows: [
            '...XX...',
            '...XXX..',
            '...XXXX.',
            '.XXXXXXX',
            '.XXXXXXX',
            '...XXXX.',
            '...XXX..',
            '...XX...'
        ],
        color: '#ffffff'
    },
    'btn-touch-jump': {
        rows: [
            '...XX...',
            '..XXXX..',
            '.XX..XX.',
            'XX....XX',
            '...XX...',
            '...XX...',
            '........',
            'XXXXXXXX'
        ],
        color: '#fde047'
    },
    'btn-touch-blink': {
        rows: [
            '..X...X.',
            '...X...X',
            'XXXXXXXX',
            'XXXXXXXX',
            '...X...X',
            '..X...X.',
            '........',
            '........'
        ],
        color: '#22d3ee'
    },
    'btn-touch-flip': {
        rows: [
            '...XX...',
            '..XXXX..',
            '.XX..XX.',
            '...XX...',
            '...XX...',
            '.XX..XX.',
            '..XXXX..',
            '...XX...'
        ],
        color: '#f472b6'
    },
    'btn-touch-pause': {
        rows: [
            'XX...XX',
            'XX...XX',
            'XX...XX',
            'XX...XX',
            'XX...XX',
            'XX...XX',
            '........',
            '........'
        ],
        color: '#f8fafc'
    }
};

class TouchControls {
    constructor(input) {
        this.input = input;
        this.root = document.getElementById('touch-controls');
        this.visible = false;
        // Touch buttons -> standard gameplay codes consumed by Player.js.
        this.map = {
            'btn-touch-left': 'KeyA',
            'btn-touch-right': 'KeyD',
            'btn-touch-jump': 'KeyW',
            'btn-touch-blink': 'ShiftLeft',
            'btn-touch-flip': 'Space'
        };
        this.canvasTouches = 0; // fingers currently resting on the canvas (flip)
        this._buildIcons();
        this._bind();
    }

    static isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
    }

    // Render a string-matrix pixel icon into a small canvas (3px pixels).
    _makeIcon(rows, color) {
        const cell = 3;
        const canvas = document.createElement('canvas');
        canvas.width = rows[0].length * cell;
        canvas.height = rows.length * cell;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        for (let y = 0; y < rows.length; y++) {
            for (let x = 0; x < rows[y].length; x++) {
                if (rows[y][x] === 'X') ctx.fillRect(x * cell, y * cell, cell, cell);
            }
        }
        canvas.className = 'touch-icon';
        canvas.style.imageRendering = 'pixelated';
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
        return canvas;
    }

    _buildIcons() {
        for (const [id, cfg] of Object.entries(TOUCH_ICONS)) {
            const btn = document.getElementById(id);
            if (btn) btn.appendChild(this._makeIcon(cfg.rows, cfg.color));
        }
    }

    _vibrate() {
        try {
            if (navigator.vibrate) navigator.vibrate(15);
        } catch (e) {
            // Haptics unavailable (e.g. iOS Safari) — nothing to do.
        }
    }

    _bind() {
        // Button press = touchstart (with preventDefault, no synthetic click),
        // release = touchend / touchcancel. Mouse fallbacks allow desktop
        // testing; they never double-fire on real touch screens because the
        // touchstart preventDefault suppresses the synthetic mouse events.
        for (const [id, code] of Object.entries(this.map)) {
            const btn = document.getElementById(id);
            if (!btn) continue;

            const press = (e) => {
                e.preventDefault();
                if (!this.visible) return;
                if (!this.input.isKeyDown(code)) {
                    this.input.setTouch(code, true);
                }
                btn.classList.add('pressed');
                this._vibrate();
            };
            const release = (e) => {
                e.preventDefault();
                this.input.setTouch(code, false);
                btn.classList.remove('pressed');
            };
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });

            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0 || !this.visible) return;
                this.input.setTouch(code, true);
                btn.classList.add('pressed');
            });
            btn.addEventListener('mouseup', () => {
                this.input.setTouch(code, false);
                btn.classList.remove('pressed');
            });
            btn.addEventListener('mouseleave', () => {
                this.input.setTouch(code, false);
                btn.classList.remove('pressed');
            });
        }

        // Tap anywhere on the canvas = gravity flip (mirrors the left-click
        // parity for touch devices). Only the first finger fires the edge;
        // releasing the last finger releases it.
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.visible) return;
            this.canvasTouches++;
            if (this.canvasTouches === 1) {
                this.input.setTouch('Mouse0', true);
                this._vibrate();
            }
        }, { passive: false });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.canvasTouches = Math.max(0, this.canvasTouches - 1);
            if (this.canvasTouches === 0) {
                this.input.setTouch('Mouse0', false);
            }
        }, { passive: false });
        canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.canvasTouches = Math.max(0, this.canvasTouches - 1);
            if (this.canvasTouches === 0) {
                this.input.setTouch('Mouse0', false);
            }
        }, { passive: false });

        // Pause escape-hatch (touch devices have no ESC key).
        const pause = document.getElementById('btn-touch-pause');
        if (pause) {
            const pausePress = (e) => {
                e.preventDefault();
                if (typeof this.onPause === 'function') this.onPause();
            };
            pause.addEventListener('touchstart', pausePress, { passive: false });
            pause.addEventListener('mousedown', (e) => {
                if (e.button === 0) pausePress(e);
            });
        }
    }

    // Show the gamepad while a level is active.
    show() {
        this.visible = true;
        if (this.root) this.root.classList.remove('hidden');
    }

    // Hide it on menus/pause and drop every held touch so nothing sticks.
    hide() {
        this.visible = false;
        if (this.root) this.root.classList.add('hidden');
        for (const code of Object.values(this.map)) {
            this.input.setTouch(code, false);
        }
        this.input.setTouch('Mouse0', false);
        this.canvasTouches = 0;
        if (this.root) {
            this.root.querySelectorAll('.touch-btn').forEach((b) => b.classList.remove('pressed'));
        }
    }
}
