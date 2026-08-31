/**
 * Metro Rush - Coins and Power-up Pickups
 */
class Coin {
    constructor(lane, z, y = 20) {
        this.lane = lane;
        this.laneWidth = 130;
        this.x = lane * this.laneWidth;
        this.y = y;
        this.z = z;
        this.radius = 16;
        this.collected = false;
        this.spin = Math.random() * Math.PI * 2;
    }

    update(dt, player) {
        this.spin += dt * 5;

        // Magnet suction logic
        if (player.hasMagnet && !this.collected) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dz = 0 - (this.z - player.z); // Player is at player.z
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < 450) {
                const pullSpeed = 650;
                this.x += (dx / dist) * pullSpeed * dt;
                this.y += (dy / dist) * pullSpeed * dt;
                this.z -= (dz / dist) * pullSpeed * dt;
            }
        }
    }

    getBounds() {
        return {
            xMin: this.x - this.radius,
            xMax: this.x + this.radius,
            yMin: this.y - this.radius,
            yMax: this.y + this.radius,
            zMin: this.z - 20,
            zMax: this.z + 20
        };
    }

    draw(ctx, screenX, screenY, scale) {
        if (this.collected) return;
        ctx.save();
        ctx.translate(screenX, screenY - this.y * scale);

        // Calculate 3D spin width
        const spinWidth = Math.cos(this.spin) * this.radius * scale;
        const drawRadius = this.radius * scale;

        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12 * scale;

        // Coin Outer Gold
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, Math.abs(spinWidth)), drawRadius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner Coin Detail
        if (Math.abs(spinWidth) > drawRadius * 0.4) {
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.ellipse(0, 0, Math.abs(spinWidth) * 0.7, drawRadius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Star or Metro Symbol
            ctx.fillStyle = '#b45309';
            ctx.font = `bold ${Math.floor(12 * scale)}px Orbitron, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
        }

        ctx.restore();
        ctx.restore();
    }
}


class PowerUpItem {
    constructor(type, lane, z, y = 30) {
        this.type = type; // 'MAGNET', 'JETPACK', 'SHIELD', 'MULTIPLIER', 'SNEAKERS'
        this.lane = lane;
        this.laneWidth = 130;
        this.x = lane * this.laneWidth;
        this.y = y;
        this.z = z;
        this.radius = 24;
        this.collected = false;
        this.bob = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.bob += dt * 4;
    }

    getBounds() {
        return {
            xMin: this.x - this.radius,
            xMax: this.x + this.radius,
            yMin: this.y - this.radius,
            yMax: this.y + this.radius,
            zMin: this.z - 25,
            zMax: this.z + 25
        };
    }

    draw(ctx, screenX, screenY, scale) {
        if (this.collected) return;
        const bobY = Math.sin(this.bob) * 8;

        ctx.save();
        ctx.translate(screenX, screenY - (this.y + bobY) * scale);

        const r = this.radius * scale;

        // Colors per type
        let color = '#38bdf8';
        let emoji = '⚡';

        if (this.type === 'MAGNET') {
            color = '#ef4444';
            emoji = '🧲';
        } else if (this.type === 'JETPACK') {
            color = '#f97316';
            emoji = '🚀';
        } else if (this.type === 'SHIELD') {
            color = '#00f2fe';
            emoji = '🛡️';
        } else if (this.type === 'MULTIPLIER') {
            color = '#a855f7';
            emoji = '✖️';
        } else if (this.type === 'SNEAKERS') {
            color = '#22c55e';
            emoji = '👟';
        }

        // Glowing Orb
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 20 * scale;

        const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, color);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();

        // Icon
        ctx.font = `${Math.floor(20 * scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 0, 0);

        ctx.restore();
        ctx.restore();
    }
}

window.Coin = Coin;
window.PowerUpItem = PowerUpItem;
