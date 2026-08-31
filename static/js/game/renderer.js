/**
 * Metro Rush - 3D Pseudo-Perspective Projection Canvas Renderer
 */
class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.cameraX = 0;
        this.cameraY = 165; // Camera height above ground
        this.cameraZ = -140; // Camera distance behind player
        this.cameraDepth = 320; // Focal length / projection scale

        this.shakeAmount = 0;
        this.shakeDecay = 0.9;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    addShake(amount) {
        this.shakeAmount = Math.min(25, this.shakeAmount + amount);
    }

    project(worldX, worldY, worldZ) {
        const relZ = worldZ - (this.playerZ + this.cameraZ);
        if (relZ <= 5) return null; // Behind or clipping camera

        const scale = this.cameraDepth / relZ;
        const screenX = (this.width / 2) + (worldX - this.cameraX) * scale;
        const screenY = (this.height / 2) + (this.cameraY - worldY) * scale;

        return { x: screenX, y: screenY, scale: scale, relZ: relZ };
    }

    render(player, trackManager, particles, dt, gameSpeed) {
        const ctx = this.ctx;
        this.playerZ = player.z;

        // Camera follow player horizontally with smooth lag
        this.cameraX += (player.x * 0.4 - this.cameraX) * Math.min(1, 10 * dt);

        // Apply and decay screen shake
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (this.shakeAmount > 0.5) {
            shakeOffsetX = (Math.random() * 2 - 1) * this.shakeAmount;
            shakeOffsetY = (Math.random() * 2 - 1) * this.shakeAmount;
            this.shakeAmount *= this.shakeDecay;
        }

        ctx.save();
        ctx.translate(shakeOffsetX, shakeOffsetY);

        // 1. Clear background
        ctx.fillStyle = '#050711';
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Draw Background Metro Skyline / Tunnel Horizon
        this.drawBackground(ctx);

        // 3. Draw Track, Rails & Sleepers
        this.drawTrackAndRails(ctx, player.z);

        // 4. Collect and depth-sort all 3D entities
        const renderQueue = [];

        // Scenery Archways
        for (const arch of trackManager.sceneryArchways) {
            const p = this.project(0, 0, arch.z);
            if (p) renderQueue.push({ type: 'ARCH', z: p.relZ, proj: p, data: arch });
        }

        // Obstacles & Trains
        for (const obs of trackManager.obstacles) {
            const p = this.project(obs.x, obs.y, obs.z);
            if (p) renderQueue.push({ type: 'OBSTACLE', z: p.relZ, proj: p, obj: obs });
        }

        // Coins
        for (const coin of trackManager.coins) {
            const p = this.project(coin.x, 0, coin.z);
            if (p) renderQueue.push({ type: 'COIN', z: p.relZ, proj: p, obj: coin });
        }

        // PowerUps
        for (const pu of trackManager.powerups) {
            const p = this.project(pu.x, 0, pu.z);
            if (p) renderQueue.push({ type: 'POWERUP', z: p.relZ, proj: p, obj: pu });
        }

        // Player
        const pPlayer = this.project(player.x, 0, player.z);
        if (pPlayer) {
            renderQueue.push({ type: 'PLAYER', z: pPlayer.relZ, proj: pPlayer, obj: player });
        }

        // Sort by distance (furthest Z rendered first)
        renderQueue.sort((a, b) => b.z - a.z);

        // 5. Draw sorted entities
        for (const item of renderQueue) {
            if (item.type === 'ARCH') {
                this.drawArchway(ctx, item.proj.x, item.proj.y, item.proj.scale, item.data.color);
            } else if (item.type === 'OBSTACLE') {
                item.obj.draw(ctx, item.proj.x, item.proj.y, item.proj.scale, player.y);
            } else if (item.type === 'COIN') {
                item.obj.draw(ctx, item.proj.x, item.proj.y, item.proj.scale);
            } else if (item.type === 'POWERUP') {
                item.obj.draw(ctx, item.proj.x, item.proj.y, item.proj.scale);
            } else if (item.type === 'PLAYER') {
                item.obj.draw(ctx, item.proj.x, item.proj.y, item.proj.scale);
            }
        }

        // 6. Draw 3D & 2D Particle Effects
        this.drawParticles(ctx, particles);

        // 7. Speed lines on high speed / Jetpack
        if (player.hasJetpack || gameSpeed > 650) {
            this.drawSpeedLines(ctx);
        }

        ctx.restore();
    }

    drawBackground(ctx) {
        // Horizon sky gradient
        const horizonY = this.height * 0.44;
        const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.7, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, horizonY);

        // Distant Cyber Buildings
        ctx.fillStyle = '#090d1f';
        const numBldgs = 12;
        const bldgWidth = this.width / numBldgs;
        for (let i = 0; i < numBldgs; i++) {
            const h = 40 + ((i * 37) % 70);
            ctx.fillRect(i * bldgWidth, horizonY - h, bldgWidth + 2, h);

            // Windows
            ctx.fillStyle = (i % 2 === 0) ? '#00f2fe' : '#ff007f';
            ctx.fillRect(i * bldgWidth + 6, horizonY - h + 10, 4, 6);
            ctx.fillStyle = '#090d1f';
        }

        // Glowing Horizon Line
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(this.width, horizonY);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawTrackAndRails(ctx, playerZ) {
        const horizonZ = playerZ + 2500;
        const nearZ = playerZ + 10;

        const pFarL = this.project(-250, 0, horizonZ);
        const pFarR = this.project(250, 0, horizonZ);
        const pNearL = this.project(-250, 0, nearZ);
        const pNearR = this.project(250, 0, nearZ);

        if (!pFarL || !pNearL) return;

        // Ground Subway Bed
        ctx.save();
        ctx.fillStyle = '#0b0f19';
        ctx.beginPath();
        ctx.moveTo(pNearL.x, pNearL.y);
        ctx.lineTo(pFarL.x, pFarL.y);
        ctx.lineTo(pFarR.x, pFarR.y);
        ctx.lineTo(pNearR.x, pNearR.y);
        ctx.closePath();
        ctx.fill();

        // 3 Track Rails & Ties
        const laneWidth = 130;
        const rails = [-1.5, -0.5, 0.5, 1.5]; // 4 outer/inner rail steel beams for 3 lanes

        // Wooden / Steel Ties across lanes
        const sleeperSpacing = 60;
        const startZ = Math.floor(playerZ / sleeperSpacing) * sleeperSpacing;
        for (let z = startZ; z < playerZ + 1200; z += sleeperSpacing) {
            const pL = this.project(-220, 0, z);
            const pR = this.project(220, 0, z);
            if (pL && pR) {
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = Math.max(1, 4 * pL.scale);
                ctx.beginPath();
                ctx.moveTo(pL.x, pL.y);
                ctx.lineTo(pR.x, pR.y);
                ctx.stroke();
            }
        }

        // Glowing Rail Lines
        for (const r of rails) {
            const worldX = r * (laneWidth * 0.88);
            const p1 = this.project(worldX, 0, nearZ);
            const p2 = this.project(worldX, 0, horizonZ);
            if (p1 && p2) {
                ctx.strokeStyle = (r === -1.5 || r === 1.5) ? '#00f2fe' : '#38bdf8';
                ctx.lineWidth = Math.max(1, 3 * p1.scale);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawArchway(ctx, screenX, screenY, scale, color) {
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        // Arch portal
        ctx.beginPath();
        ctx.moveTo(-240, 0);
        ctx.lineTo(-240, -170);
        ctx.quadraticCurveTo(0, -260, 240, -170);
        ctx.lineTo(240, 0);
        ctx.stroke();

        ctx.restore();
    }

    drawParticles(ctx, particles) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawSpeedLines(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.lineWidth = 2;
        const centerX = this.width / 2;
        const centerY = this.height * 0.44;

        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const len = 80 + Math.random() * 120;
            const startDist = 140 + Math.random() * 50;

            const x1 = centerX + Math.cos(angle) * startDist;
            const y1 = centerY + Math.sin(angle) * startDist;
            const x2 = centerX + Math.cos(angle) * (startDist + len);
            const y2 = centerY + Math.sin(angle) * (startDist + len);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

window.GameRenderer = GameRenderer;
