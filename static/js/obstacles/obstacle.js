/**
 * Metro Rush - Obstacles & Subway Trains
 */
class Obstacle {
    constructor(type, lane, z) {
        this.type = type; // 'BARRIER_LOW', 'BARRIER_HIGH', 'BLOCK_WALL', 'TRAIN_STATIC', 'TRAIN_MOVING'
        this.lane = lane; // -1, 0, 1
        this.z = z; // Z distance in world units
        this.laneWidth = 130;
        this.x = lane * this.laneWidth;
        this.y = 0;
        this.speed = 0;
        this.passed = false;
        this.hornPlayed = false;

        // Configuration based on type
        if (this.type === 'BARRIER_LOW') {
            this.width = 90;
            this.height = 36;
            this.depth = 15;
            this.yMin = 0;
            this.yMax = 36;
        } else if (this.type === 'BARRIER_HIGH') {
            this.width = 95;
            this.height = 70;
            this.depth = 15;
            this.yMin = 30; // Slide underneath
            this.yMax = 95;
        } else if (this.type === 'BLOCK_WALL') {
            this.width = 95;
            this.height = 90;
            this.depth = 20;
            this.yMin = 0;
            this.yMax = 95;
        } else if (this.type === 'TRAIN_STATIC') {
            this.width = 105;
            this.height = 110;
            this.depth = 280; // Long train car
            this.yMin = 0;
            this.yMax = 110;
            this.hasRamp = true;
        } else if (this.type === 'TRAIN_MOVING') {
            this.width = 105;
            this.height = 110;
            this.depth = 340;
            this.yMin = 0;
            this.yMax = 110;
            this.speed = 260; // Approaching speed
            this.hasRamp = false;
        }
    }

    update(dt, playerZ) {
        if (this.type === 'TRAIN_MOVING') {
            this.z -= this.speed * dt;
            // Play train horn when approaching player
            if (!this.hornPlayed && (this.z - playerZ) < 500 && (this.z - playerZ) > 0) {
                this.hornPlayed = true;
                window.soundEngine.playTrainHorn();
            }
        }
    }

    getBounds() {
        return {
            xMin: this.x - this.width / 2,
            xMax: this.x + this.width / 2,
            yMin: this.yMin,
            yMax: this.yMax,
            zMin: this.z,
            zMax: this.z + this.depth
        };
    }

    draw(ctx, screenX, screenY, scale, playerY = 0) {
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        if (this.type === 'BARRIER_LOW') {
            // Low hurdle - Neon yellow & black warning barrier
            ctx.save();
            ctx.fillStyle = '#0f172a';
            // Legs
            ctx.fillRect(-40, -36, 8, 36);
            ctx.fillRect(32, -36, 8, 36);

            // Barrier Crossbar
            ctx.fillStyle = '#facc15';
            ctx.fillRect(-45, -34, 90, 18);

            // Stripes
            ctx.fillStyle = '#000';
            for (let i = -40; i < 40; i += 18) {
                ctx.beginPath();
                ctx.moveTo(i, -34);
                ctx.lineTo(i + 8, -34);
                ctx.lineTo(i + 3, -16);
                ctx.lineTo(i - 5, -16);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();

        } else if (this.type === 'BARRIER_HIGH') {
            // High Overhead Rail Sign - Tall posts with top barrier (Slide under!)
            ctx.save();
            ctx.fillStyle = '#334155';
            // Tall Side Posts
            ctx.fillRect(-44, -95, 8, 95);
            ctx.fillRect(36, -95, 8, 95);

            // Top Hazard Board
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-48, -95, 96, 45);

            // Warning LED / Text
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 10px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('▼ DUCK ▼', 0, -68);

            // Clearance indicator
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(-48, -95, 96, 45);
            ctx.restore();

        } else if (this.type === 'BLOCK_WALL') {
            // Neon Construction Wall
            ctx.save();
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-44, -90, 88, 90);

            // Cyber border
            ctx.strokeStyle = '#ff007f';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff007f';
            ctx.shadowBlur = 10;
            ctx.strokeRect(-44, -90, 88, 90);

            // Danger Symbol
            ctx.fillStyle = '#ff007f';
            ctx.beginPath();
            ctx.moveTo(0, -68);
            ctx.lineTo(18, -32);
            ctx.lineTo(-18, -32);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('!', 0, -38);
            ctx.restore();

        } else if (this.type === 'TRAIN_STATIC' || this.type === 'TRAIN_MOVING') {
            // Detailed Subway Train Car
            ctx.save();
            const isMoving = this.type === 'TRAIN_MOVING';
            const bodyMain = isMoving ? '#be123c' : '#1e3a8a';
            const bodyAccent = isMoving ? '#fb7185' : '#38bdf8';

            // Train Front Body
            ctx.fillStyle = bodyMain;
            ctx.beginPath();
            ctx.roundRect(-50, -115, 100, 115, [14, 14, 2, 2]);
            ctx.fill();

            // Train Front Glass Windshield
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.roundRect(-42, -105, 84, 40, [8, 8, 2, 2]);
            ctx.fill();

            // Front Glow & Headlights
            ctx.fillStyle = isMoving ? '#fef08a' : '#e0f2fe';
            ctx.shadowColor = isMoving ? '#facc15' : '#38bdf8';
            ctx.shadowBlur = 20;

            // Headlight Left & Right
            ctx.beginPath();
            ctx.arc(-32, -45, 9, 0, Math.PI * 2);
            ctx.arc(32, -45, 9, 0, Math.PI * 2);
            ctx.fill();

            // Front Bumper / Grill
            ctx.fillStyle = '#0f172a';
            ctx.shadowBlur = 0;
            ctx.fillRect(-45, -30, 90, 26);
            ctx.strokeStyle = bodyAccent;
            ctx.lineWidth = 2;
            ctx.strokeRect(-45, -30, 90, 26);

            // Roof Ramp for static trains
            if (this.hasRamp) {
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.moveTo(-45, 0);
                ctx.lineTo(-45, -115);
                ctx.lineTo(-30, -115);
                ctx.lineTo(-35, 0);
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }
}

window.Obstacle = Obstacle;
