/*
 * Ghost — best-run time trial replay.
 *
 * Every frame of a completed level run is recorded (timestamp + position).
 * When a run beats the level's best time, the recording is persisted via
 * SaveManager and replayed as a translucent goose on later attempts.
 *
 * The ghost fades out when the player catches up to it (closer than 60px),
 * so it never obscures the live player.
 */
class Ghost {
    constructor() {
        this.points = [];
        this.recording = [];
        this.recordingActive = false;
    }

    get hasRecording() {
        return this.points.length > 0;
    }

    // Swap in a previously saved best-run recording.
    load(points) {
        this.points = points || [];
    }

    // Start a fresh recording for the current run.
    startRecording() {
        this.recording = [];
        this.recordingActive = true;
    }

    // Stop recording and hand back the captured points (may be discarded).
    stopRecording() {
        this.recordingActive = false;
        return this.recording;
    }

    sample(time, player) {
        if (!this.recordingActive || player.isDead) return;
        this.recording.push({ t: time, x: player.x, y: player.y });
    }

    // Interpolated ghost position at the given replay time, or null when the
    // recording does not cover `time`.
    sampleAt(time) {
        const pts = this.points;
        if (!pts || pts.length === 0) return null;
        if (time <= pts[0].t) return { x: pts[0].x, y: pts[0].y };
        if (time >= pts[pts.length - 1].t) return null;
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i];
            const b = pts[i + 1];
            if (time >= a.t && time <= b.t) {
                const f = b.t - a.t > 0 ? (time - a.t) / (b.t - a.t) : 0;
                return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
            }
        }
        return null;
    }

    draw(ctx, camera, assetManager, time, player) {
        if (!this.hasRecording) return;
        const pos = this.sampleAt(time);
        if (!pos) return;

        const img = assetManager.getImage('player');
        if (!img) return;

        // Fade the ghost as the player gets within 60px of it.
        const dist = Math.hypot(pos.x - player.x, pos.y - player.y);
        const fade = dist < 60 ? 0.3 + 0.7 * (dist / 60) : 1;
        const alpha = 0.4 * fade;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.drawImage(img, pos.x - camera.x - 2, pos.y - camera.y - 2, 32, 32);
        ctx.restore();
    }
}
