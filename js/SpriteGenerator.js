class SpriteGenerator {
    static generatePlayerSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageRendering = 'pixelated';

        // Clear canvas
        ctx.clearRect(0, 0, 32, 32);

        // Helper pixel drawer
        const p = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        };

        // Draw 32x32 Pixel Goose
        // Main Body (White & Soft Gray Shading)
        const white = '#FFFFFF';
        const shade = '#CBD5E1';
        const shadow = '#94A3B8';
        const beak = '#F97316';
        const beakDark = '#C2410C';
        const eye = '#0F172A';
        const bootBase = '#1E293B';
        const bootCyan = '#06B6D4';
        const bootGlow = '#67E8F9';
        const eyebrow = '#1E1B4B';

        // Tail feathers (Left)
        for (let y = 14; y <= 19; y++) {
            for (let x = 2; x <= 6; x++) p(x, y, (x < 4 || y > 17) ? shade : white);
        }
        p(1, 15, shade); p(1, 16, shade);

        // Goose Torso
        for (let y = 12; y <= 22; y++) {
            for (let x = 6; x <= 22; x++) {
                if (y === 22) p(x, y, shadow);
                else if (y >= 19) p(x, y, shade);
                else p(x, y, white);
            }
        }

        // Neck (Reaching up to right)
        for (let y = 5; y <= 13; y++) {
            for (let x = 17; x <= 23; x++) {
                if (x === 17) p(x, y, shade);
                else p(x, y, white);
            }
        }

        // Goose Head
        for (let y = 3; y <= 8; y++) {
            for (let x = 18; x <= 27; x++) {
                p(x, y, white);
            }
        }

        // Beak (Orange)
        for (let y = 6; y <= 9; y++) {
            for (let x = 27; x <= 31; x++) {
                p(x, y, (y === 9) ? beakDark : beak);
            }
        }
        p(28, 5, beak); p(29, 5, beak);

        // Eye & Angry Eyebrow
        p(24, 5, eye); p(25, 5, eye); // Eye
        p(25, 4, white); // Glint
        // Eyebrow
        p(23, 3, eyebrow); p(24, 4, eyebrow); p(25, 4, eyebrow); p(26, 4, eyebrow);

        // Wing Detail
        for (let y = 14; y <= 19; y++) {
            for (let x = 9; x <= 16; x++) {
                if (y === 19 || x === 9) p(x, y, shadow);
                else p(x, y, shade);
            }
        }

        // Cyber Anti-Gravity Boots! (Feet / Boots)
        // Left Boot
        for (let y = 23; y <= 28; y++) {
            for (let x = 8; x <= 13; x++) p(x, y, bootBase);
        }
        // Right Boot
        for (let y = 23; y <= 28; y++) {
            for (let x = 17; x <= 22; x++) p(x, y, bootBase);
        }
        // Glowing cyan energy soles
        for (let x = 7; x <= 14; x++) { p(x, 29, bootCyan); p(x, 30, bootGlow); }
        for (let x = 16; x <= 23; x++) { p(x, 29, bootCyan); p(x, 30, bootGlow); }

        return canvas;
    }

    static generateBreadSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const crust = '#854D0E';
        const crustDark = '#713F12';
        const bread = '#FEF08A';
        const cheese = '#FACC15';
        const lettuce = '#22C55E';

        const p = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        };

        // Bread Slice Shape
        // Top crust rounded curve
        for (let x = 6; x <= 25; x++) { p(x, 5, crust); p(x, 6, crust); }
        for (let x = 4; x <= 27; x++) { p(x, 7, crust); }

        // Bread body
        for (let y = 8; y <= 25; y++) {
            for (let x = 5; x <= 26; x++) {
                if (x === 5 || x === 26 || y === 25) p(x, y, crustDark);
                else if (x === 6 || x === 25 || y === 8 || y === 24) p(x, y, crust);
                else p(x, y, bread);
            }
        }

        // Melted Cheese Drips
        for (let x = 8; x <= 23; x++) p(x, 14, cheese);
        for (let x = 10; x <= 16; x++) p(x, 15, cheese);
        p(11, 16, cheese); p(12, 16, cheese);

        // Lettuce Layer
        for (let x = 7; x <= 24; x++) p(x, 18, lettuce);
        p(8, 19, lettuce); p(14, 19, lettuce); p(20, 19, lettuce);

        return canvas;
    }

    static generateFrogSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const green = '#10B981';
        const greenDark = '#047857';
        const greenLight = '#6EE7B7';
        const eyeBg = '#FACC15';
        const pupil = '#0F172A';
        const mouth = '#991B1B';

        const p = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        };

        // Alien Frog Eyes (Top)
        for (let y = 4; y <= 11; y++) {
            for (let x = 5; x <= 11; x++) p(x, y, greenDark);
            for (let x = 20; x <= 26; x++) p(x, y, greenDark);
        }
        for (let y = 5; y <= 9; y++) {
            for (let x = 6; x <= 10; x++) p(x, y, eyeBg);
            for (let x = 21; x <= 25; x++) p(x, y, eyeBg);
        }
        // Pupils
        p(8, 7, pupil); p(9, 7, pupil); p(8, 8, pupil); p(9, 8, pupil);
        p(23, 7, pupil); p(24, 7, pupil); p(23, 8, pupil); p(24, 8, pupil);

        // Body
        for (let y = 10; y <= 27; y++) {
            for (let x = 4; x <= 27; x++) {
                if (y === 27 || x === 4 || x === 27) p(x, y, greenDark);
                else if (y < 13) p(x, y, greenLight);
                else p(x, y, green);
            }
        }

        // Alien Antenna
        p(15, 2, '#3B82F6'); p(16, 2, '#3B82F6');
        p(15, 3, '#60A5FA'); p(16, 3, '#60A5FA');
        p(15, 4, greenDark); p(16, 4, greenDark);
        p(15, 5, greenDark); p(16, 5, greenDark);

        // Confused / Angry Alien Mouth
        for (let x = 10; x <= 21; x++) p(x, 20, mouth);
        p(9, 21, mouth); p(22, 19, mouth);

        return canvas;
    }

    static generateCrumbSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const gold = '#FACC15';
        const goldDark = '#A16207';
        const goldLight = '#FEF08A';
        const sparkle = '#FFFFFF';

        const p = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        };

        // Hexagonal golden crumb nugget
        for (let y = 10; y <= 21; y++) {
            const half = (y < 16) ? (y - 9) : (22 - y);
            for (let x = 16 - half; x <= 16 + half; x++) {
                p(x, y, (x === 16 - half || x === 16 + half || y === 21) ? goldDark : gold);
            }
        }

        // Shine highlight
        p(14, 12, goldLight); p(15, 12, goldLight); p(14, 13, goldLight); p(15, 13, goldLight);

        // White sparkle glint (top right)
        p(24, 7, sparkle); p(25, 7, sparkle); p(24, 6, sparkle); p(26, 8, sparkle);

        // Faint glow dots around the nugget
        p(5, 18, goldLight); p(4, 19, goldLight); p(27, 20, goldLight);

        return canvas;
    }

    // theme: 'retro' (levels 1-5), 'sunset' (levels 6-10) or 'cyberpunk' (11-15).
    static generateTileSprite(theme = 'retro') {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const cyberpunk = theme === 'cyberpunk';
        const sunset = theme === 'sunset';
        const base = cyberpunk ? '#17002e' : (sunset ? '#431407' : '#1E1B4B');
        const border = cyberpunk ? '#4a044e' : (sunset ? '#7C2D12' : '#312E81');
        const neon = cyberpunk ? '#e11d48' : (sunset ? '#F59E0B' : '#06B6D4');
        const neonGlow = cyberpunk ? '#f43f5e' : (sunset ? '#FBBF24' : '#38BDF8');
        const rivet = cyberpunk ? '#a78bfa' : (sunset ? '#FDBA74' : '#64748B');

        const p = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        };

        // Fill Base Block
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, 32, 32);

        // Outer Bevel Border
        for (let i = 0; i < 32; i++) {
            p(i, 0, border); p(i, 31, border);
            p(0, i, border); p(31, i, border);
        }

        // Cyber Grid Lines inside block
        for (let i = 4; i < 28; i++) {
            p(i, 4, neon);
            p(i, 27, neon);
            p(4, i, neon);
            p(27, i, neon);
        }

        // Center Circuit Cross
        for (let i = 8; i <= 23; i++) {
            p(i, 16, neonGlow);
            p(16, i, neonGlow);
        }

        // Corner Rivets
        p(2, 2, rivet); p(29, 2, rivet);
        p(2, 29, rivet); p(29, 29, rivet);

        return canvas;
    }

    // theme: 'retro' (levels 1-5), 'sunset' (levels 6-10) or 'cyberpunk' (11-15).
    static generateSpikeSprite(theme = 'retro') {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const cyberpunk = theme === 'cyberpunk';
        const sunset = theme === 'sunset';
        const metalDark = cyberpunk ? '#881337' : (sunset ? '#9A3412' : '#475569');
        const metalLight = cyberpunk ? '#fb7185' : (sunset ? '#FB923C' : '#94A3B8');
        const tipRed = cyberpunk ? '#e11d48' : (sunset ? '#F97316' : '#EF4444');

        const p = (x, y, color) => {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
        };

        // 2 Sharp Metallic Spikes pointing UP
        // Spike 1 (Left)
        for (let y = 6; y <= 31; y++) {
            let width = Math.floor((31 - y) / 3);
            for (let x = 8 - width; x <= 8 + width; x++) {
                if (y < 10) p(x, y, tipRed);
                else if (x < 8) p(x, y, metalDark);
                else p(x, y, metalLight);
            }
        }
        // Spike 2 (Right)
        for (let y = 6; y <= 31; y++) {
            let width = Math.floor((31 - y) / 3);
            for (let x = 24 - width; x <= 24 + width; x++) {
                if (y < 10) p(x, y, tipRed);
                else if (x < 24) p(x, y, metalDark);
                else p(x, y, metalLight);
            }
        }

        return canvas;
    }
}
