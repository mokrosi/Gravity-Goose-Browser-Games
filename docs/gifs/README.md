# Gameplay GIFs

Place your gameplay recordings here. The README references these three files:

| File | What it should show |
| :--- | :--- |
| `gameplay.gif` | 8–12s of general movement, jumping and collecting bread. |
| `gravity-flip.gif` | The signature moment: goose flips gravity mid-jump and lands on the ceiling. |
| `breadcrumbs.gif` | The goose risking a spike corridor to grab a golden breadcrumb. |

## How to record

1. Run the game locally (see the main README) and start a level.
2. Record your screen (OBS Studio, Windows `Win+Alt+R` game bar, or your OS screen recorder).
3. Keep clips short (~10s) and small (aim < 2 MB).
4. Convert/trim to GIF — e.g. [FFmpeg](https://ffmpeg.org/):

   ```bash
   ffmpeg -i input.mp4 -vf "fps=30,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" gameplay.gif
   ```

5. Name them exactly as in the table and commit them alongside `../README.md`.
