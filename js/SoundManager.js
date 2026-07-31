class SoundManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.8; // 0..1 master volume
        // Procedural background music loop state
        this.musicTimer = null;
        this.musicBeat = 0;
        this.musicBpm = 100;
        this.musicNextTime = 0;
    }

    init() {
        try {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                    // All SFX route through one master gain so the player can
                    // turn the volume down/off from the Settings menu.
                    this.masterGain = this.ctx.createGain();
                    this.masterGain.connect(this.ctx.destination);
                    this.masterGain.gain.value = this.volume;
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {
            console.warn("AudioContext init failed:", e);
            this.enabled = false;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.ctx && this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
        this.enabled = this.volume > 0;
    }

    playStart() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554.37, now + 0.1);
            osc.frequency.setValueAtTime(659.25, now + 0.2);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start();
            osc.stop(now + 0.4);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    playFlip() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    playCollect() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start();
            osc.stop(now + 0.25);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    playJump() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(650, now + 0.09);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.11);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    playBlink() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.22);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    // Sharp rewind/reset sweep played on instant respawn.
    playReset() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    // --- Background music ---------------------------------------------------
    //
    // A tiny procedural chiptune loop scheduled with a lookahead timer. There is
    // no audio file: each step builds a kick / bass / lead / hat from a single
    // oscillator. `setMusicIntensity` ramps the tempo (a playback-rate proxy),
    // which the game drives up to 1.3x while the player approaches a best time.

    startMusic() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx || this.musicTimer) return;
            this.musicBeat = 0;
            this.musicBpm = 100;
            this.musicNextTime = this.ctx.currentTime + 0.05;
            this.musicTimer = setInterval(() => this._scheduleMusic(), 25);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    stopMusic() {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    // ratio 0..1: 0 = calm (100 BPM / 1.0x), 1 = hype (130 BPM / 1.3x)
    setMusicIntensity(ratio) {
        this.musicBpm = 100 + Math.max(0, Math.min(1, ratio)) * 30;
    }

    _scheduleMusic() {
        if (!this.ctx) return;
        const stepTime = 60 / this.musicBpm / 4;
        while (this.musicNextTime < this.ctx.currentTime + 0.15) {
            this._musicStep(this.musicBeat, this.musicNextTime);
            this.musicNextTime += stepTime;
            this.musicBeat = (this.musicBeat + 1) % 32;
        }
    }

    _musicStep(step, time) {
        const bassNotes = [110.0, 110.0, 130.81, 146.83]; // A2, A2, C3, D3
        const bassFreq = bassNotes[Math.floor(step / 8) % 4];
        const leadNotes = [440, 523.25, 659.25, 587.33, 493.88, 587.33, 659.25, 783.99];
        const leadFreq = leadNotes[step % 8];

        const mk = (type, freq, gainV, dur) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(gainV, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);
            osc.start(time);
            osc.stop(time + dur);
        };

        const step16 = 60 / this.musicBpm / 4;

        // Kick on every downbeat of the 4/4 bar
        if (step % 8 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.12);
        }

        // Quarter-note bass line
        if (step % 4 === 0) {
            mk('square', bassFreq, 0.11, step16 * 3.5);
        }

        // Eighth-note lead arpeggio, up an octave on the second half of the bar
        if (step % 2 === 0) {
            const oct = step % 16 >= 8 ? 2 : 1;
            mk('triangle', leadFreq * oct, 0.07, step16 * 1.8);
        }

        // Off-beat hi-hat
        if (step % 2 === 1) {
            mk('square', 6000, 0.015, step16 * 0.9);
        }
    }

    playBest() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now + idx * 0.09);

                gain.gain.setValueAtTime(0.15, now + idx * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.15);

                osc.connect(gain);
                gain.connect(this.masterGain || this.ctx.destination);

                osc.start(now + idx * 0.09);
                osc.stop(now + idx * 0.09 + 0.15);
            });
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    playCrumb() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const notes = [880, 1174.66, 1567.98]; // A5, D6, G6
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                gain.gain.setValueAtTime(0.15, now + idx * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.09);

                osc.connect(gain);
                gain.connect(this.masterGain || this.ctx.destination);

                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.09);
            });
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    playHurt() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);

            osc.start();
            osc.stop(now + 0.2);
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }

    playWin() {
        if (!this.enabled) return;
        try {
            this.init();
            if (!this.ctx) return;

            const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

                gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + idx * 0.1 + 0.12);

                osc.connect(gain);
                gain.connect(this.masterGain || this.ctx.destination);

                osc.start(this.ctx.currentTime + idx * 0.1);
                osc.stop(this.ctx.currentTime + idx * 0.1 + 0.12);
            });
        } catch (e) {
            console.warn("Sound error:", e);
        }
    }
}
