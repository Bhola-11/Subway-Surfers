/**
 * Metro Rush - 3D Pseudo-Perspective Projection Canvas Renderer
 * Supports Dynamic Widescreen, Adaptive FOV, Neon Cyber City Scenery & Fullscreen!
 */
class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.cameraX = 0;
        this.cameraY = 175; // Camera height above ground
        this.cameraZ = -150; // Camera distance behind player
        this.cameraDepth = 340; // Focal length / projection scale

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

        // Dynamic depth scaling based on aspect ratio
        const aspect = this.width / Math.max(1, this.height);
        if (aspect > 1.2) {
            // Widescreen / Desktop
            this.cameraDepth = Math.max(340, this.height * 0.55);
            this.cameraY = 180;
        } else {
            // Portrait / Mobile
            this.cameraDepth = Math.max(300, this.height * 0.45);
            this.cameraY = 165;
        }
    }

    addShake(amount) {
        this.shakeAmount = Math.min(28, this.shakeAmount + amount);
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
        this.cameraX += (player.x * 0.35 - this.cameraX) * Math.min(1, 10 * dt);

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
        ctx.fillStyle = '#040714';
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Draw Background Metro Skyline / Tunnel Horizon
        this.drawBackground(ctx, player.z);

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

    drawBackground(ctx, playerZ) {
        // Horizon sky gradient
        const horizonY = this.height * 0.44;
        const grad = ctx.createLinearGradient(0, 0, 0, horizonY);
        grad.addColorStop(0, '#020617');
        grad.addColorStop(0.6, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, horizonY);

        // Ambient cyber stars/particles in sky
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 25; i++) {
            const sx = ((i * 127 + playerZ * 0.02) % this.width);
            const sy = (i * 31) % (horizonY - 20);
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Distant Cyber Buildings across full screen width
        const numBldgs = Math.max(16, Math.floor(this.width / 40));
        const bldgWidth = this.width / numBldgs;
        for (let i = 0; i < numBldgs; i++) {
            const h = 45 + ((i * 43) % 95);
            ctx.fillStyle = (i % 3 === 0) ? '#0b112c' : '#080d22';
            ctx.fillRect(i * bldgWidth, horizonY - h, bldgWidth + 2, h);

            // Windows & Neon Signs
            const hasLight = (i % 2 === 0);
            if (hasLight) {
                ctx.fillStyle = (i % 4 === 0) ? '#00f2fe' : ((i % 4 === 2) ? '#ff007f' : '#facc15');
                ctx.fillRect(i * bldgWidth + 6, horizonY - h + 12, 5, 8);
                ctx.fillRect(i * bldgWidth + 14, horizonY - h + 26, 5, 8);
            }
        }

        // Glowing Horizon Laser Line
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(this.width, horizonY);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawTrackAndRails(ctx, playerZ) {
        const horizonZ = playerZ + 2500;
        const nearZ = playerZ + 10;

        // Expanded ground bounds for widescreen
        const pFarL = this.project(-650, 0, horizonZ);
        const pFarR = this.project(650, 0, horizonZ);
        const pNearL = this.project(-1200, 0, nearZ);
        const pNearR = this.project(1200, 0, nearZ);

        if (!pFarL || !pNearL) return;

        // Ground Subway Bed & Side Cyber Shoulders
        ctx.save();
        ctx.fillStyle = '#060913';
        ctx.beginPath();
        ctx.moveTo(pNearL.x, pNearL.y);
        ctx.lineTo(pFarL.x, pFarL.y);
        ctx.lineTo(pFarR.x, pFarR.y);
        ctx.lineTo(pNearR.x, pNearR.y);
        ctx.closePath();
        ctx.fill();

        // Inner Track ballast
        const pFarTrackL = this.project(-250, 0, horizonZ);
        const pFarTrackR = this.project(250, 0, horizonZ);
        const pNearTrackL = this.project(-250, 0, nearZ);
        const pNearTrackR = this.project(250, 0, nearZ);

        if (pFarTrackL && pNearTrackL) {
            ctx.fillStyle = '#0a0e1c';
            ctx.beginPath();
            ctx.moveTo(pNearTrackL.x, pNearTrackL.y);
            ctx.lineTo(pFarTrackL.x, pFarTrackL.y);
            ctx.lineTo(pFarTrackR.x, pFarTrackR.y);
            ctx.lineTo(pNearTrackR.x, pNearTrackR.y);
            ctx.closePath();
            ctx.fill();
        }

        // 3 Track Rails & Ties
        const laneWidth = 130;
        const rails = [-1.5, -0.5, 0.5, 1.5]; // 4 outer/inner rail steel beams for 3 lanes

        // Wooden / Steel Ties across lanes
        const sleeperSpacing = 60;
        const startZ = Math.floor(playerZ / sleeperSpacing) * sleeperSpacing;
        for (let z = startZ; z < playerZ + 1400; z += sleeperSpacing) {
            const pL = this.project(-230, 0, z);
            const pR = this.project(230, 0, z);
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
                ctx.lineWidth = Math.max(1.2, 3.2 * p1.scale);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        // Side Neon Guardrails on widescreen
        const pSideL1 = this.project(-420, 0, nearZ);
        const pSideL2 = this.project(-420, 0, horizonZ);
        const pSideR1 = this.project(420, 0, nearZ);
        const pSideR2 = this.project(420, 0, horizonZ);
        if (pSideL1 && pSideL2 && pSideR1 && pSideR2) {
            ctx.strokeStyle = 'rgba(255, 0, 127, 0.5)';
            ctx.lineWidth = Math.max(1, 2 * pSideL1.scale);
            ctx.beginPath();
            ctx.moveTo(pSideL1.x, pSideL1.y);
            ctx.lineTo(pSideL2.x, pSideL2.y);
            ctx.moveTo(pSideR1.x, pSideR1.y);
            ctx.lineTo(pSideR2.x, pSideR2.y);
            ctx.stroke();
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
        ctx.shadowBlur = 18;

        // Arch portal
        ctx.beginPath();
        ctx.moveTo(-280, 0);
        ctx.lineTo(-280, -180);
        ctx.quadraticCurveTo(0, -280, 280, -180);
        ctx.lineTo(280, 0);
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
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
        ctx.lineWidth = 2.5;
        const centerX = this.width / 2;
        const centerY = this.height * 0.44;

        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const len = 100 + Math.random() * 160;
            const startDist = 160 + Math.random() * 80;

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
