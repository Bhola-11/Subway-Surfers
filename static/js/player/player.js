/**
 * Metro Rush - Player Class & Physics Engine
 */
class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.lane = 0; // -1 (Left), 0 (Center), 1 (Right)
        this.targetX = 0;
        this.x = 0;
        this.y = 0; // Height above ground (0 = on rails)
        this.z = 0; // Relative z anchor

        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        this.slideDuration = 0.65;

        // Visual animation
        this.runCycle = 0;
        this.leanAngle = 0;

        // Customization
        this.characterSlug = 'dash';
        this.skinSlug = 'classic-cyan';
        this.bodyColor = '#22d3ee';
        this.clothColor = '#0369a1';
        this.shoesColor = '#fbbf24';
        this.glowColor = '#38bdf8';

        // Power-up States
        this.hasShield = false;
        this.hasMagnet = false;
        this.magnetDuration = 0;
        this.hasJetpack = false;
        this.jetpackDuration = 0;
        this.hasMultiplier = false;
        this.multiplierDuration = 0;
        this.hasSuperSneakers = false;
        this.superSneakersDuration = 0;

        // Base physics constants
        this.laneWidth = 130;
        this.jumpVelocity = 480;
        this.gravity = -1250;
    }

    setEquipment(charData, skinData) {
        if (charData) {
            this.characterSlug = charData.slug || this.characterSlug;
            this.bodyColor = charData.primary_color || this.bodyColor;
            this.clothColor = charData.secondary_color || this.clothColor;
            this.glowColor = charData.accent_color || this.glowColor;
        }
        if (skinData) {
            this.skinSlug = skinData.slug || this.skinSlug;
            if (skinData.body_color) this.bodyColor = skinData.body_color;
            if (skinData.cloth_color) this.clothColor = skinData.cloth_color;
            if (skinData.shoes_color) this.shoesColor = skinData.shoes_color;
            if (skinData.glow_color) this.glowColor = skinData.glow_color;
        }
    }

    moveLeft() {
        if (this.lane > -1) {
            this.lane--;
            this.targetX = this.lane * this.laneWidth;
            this.leanAngle = -0.25;
            window.soundEngine.playLaneSwitch();
            return true;
        }
        return false;
    }

    moveRight() {
        if (this.lane < 1) {
            this.lane++;
            this.targetX = this.lane * this.laneWidth;
            this.leanAngle = 0.25;
            window.soundEngine.playLaneSwitch();
            return true;
        }
        return false;
    }

    jump() {
        if (this.hasJetpack) return; // In jetpack flight

        if (this.isGrounded || this.hasSuperSneakers) {
            const boost = this.hasSuperSneakers ? 1.3 : 1.0;
            this.vy = this.jumpVelocity * boost;
            this.isGrounded = false;
            this.isJumping = true;
            this.isSliding = false;
            window.soundEngine.playJump();
        }
    }

    slide() {
        if (this.hasJetpack) return;

        if (!this.isGrounded) {
            // Fast fall / smash down if sliding in mid-air!
            this.vy = -700;
        }
        this.isSliding = true;
        this.slideTimer = this.slideDuration;
        this.isJumping = false;
        window.soundEngine.playSlide();
    }

    update(dt, gameSpeed) {
        // Smooth horizontal lane transition (snappy spring lerp)
        const lerpSpeed = 18;
        this.x += (this.targetX - this.x) * Math.min(1, lerpSpeed * dt);
        this.leanAngle += (0 - this.leanAngle) * Math.min(1, 10 * dt);

        // Run cycle
        this.runCycle += dt * (gameSpeed * 0.02);

        // Jetpack mode
        if (this.hasJetpack) {
            this.jetpackDuration -= dt;
            this.y += (180 - this.y) * Math.min(1, 8 * dt);
            this.isGrounded = false;
            this.isJumping = false;
            this.isSliding = false;
            if (this.jetpackDuration <= 0) {
                this.hasJetpack = false;
            }
        } else {
            // Vertical physics (Jump & Gravity)
            if (!this.isGrounded) {
                this.y += this.vy * dt;
                this.vy += this.gravity * dt;

                if (this.y <= 0) {
                    this.y = 0;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.isJumping = false;
                }
            }

            // Slide timer
            if (this.isSliding) {
                this.slideTimer -= dt;
                if (this.slideTimer <= 0) {
                    this.isSliding = false;
                }
            }
        }

        // Power-up cooldown timers
        if (this.hasMagnet) {
            this.magnetDuration -= dt;
            if (this.magnetDuration <= 0) this.hasMagnet = false;
        }
        if (this.hasMultiplier) {
            this.multiplierDuration -= dt;
            if (this.multiplierDuration <= 0) this.hasMultiplier = false;
        }
        if (this.hasSuperSneakers) {
            this.superSneakersDuration -= dt;
            if (this.superSneakersDuration <= 0) this.hasSuperSneakers = false;
        }
    }

    // Get 3D bounding box for collision detection
    getBounds() {
        const width = 50;
        let height = 75;
        let yOffset = this.y;

        if (this.isSliding) {
            height = 35;
        }

        return {
            xMin: this.x - width / 2,
            xMax: this.x + width / 2,
            yMin: yOffset,
            yMax: yOffset + height,
            zMin: -20,
            zMax: 20
        };
    }

    draw(ctx, screenX, screenY, scale) {
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.scale(scale, scale);
        ctx.rotate(this.leanAngle);

        // Ground shadow
        const shadowScale = Math.max(0.2, 1 - (this.y / 200));
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 0 + (this.y * (1 - shadowScale)), 28 * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Translate up by player's jump height
        ctx.translate(0, -this.y);

        // Jetpack thruster flames
        if (this.hasJetpack) {
            ctx.save();
            const flamePulse = 15 + Math.random() * 12;
            // Left Thruster
            const gradL = ctx.createLinearGradient(-15, 20, -15, 20 + flamePulse);
            gradL.addColorStop(0, '#fef08a');
            gradL.addColorStop(0.5, '#f97316');
            gradL.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = gradL;
            ctx.beginPath();
            ctx.moveTo(-20, 20);
            ctx.lineTo(-10, 20);
            ctx.lineTo(-15, 20 + flamePulse);
            ctx.closePath();
            ctx.fill();

            // Right Thruster
            ctx.beginPath();
            ctx.moveTo(10, 20);
            ctx.lineTo(20, 20);
            ctx.lineTo(15, 20 + flamePulse);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // Draw character body
        if (this.isSliding) {
            // Sliding / Rolling pose
            ctx.save();
            // Glow aura
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 12;

            // Torso low
            ctx.fillStyle = this.clothColor;
            ctx.beginPath();
            ctx.roundRect(-22, -32, 44, 24, 8);
            ctx.fill();

            // Head low
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.arc(14, -26, 12, 0, Math.PI * 2);
            ctx.fill();

            // Visor / Goggles
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(16, -29, 8, 6);

            // Legs tucked
            ctx.fillStyle = this.shoesColor;
            ctx.beginPath();
            ctx.ellipse(-14, -14, 10, 6, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

        } else {
            // Standing / Running / Jumping pose
            const legSwing = Math.sin(this.runCycle * 14) * 12;
            const armSwing = Math.cos(this.runCycle * 14) * 10;

            // Draw Legs
            ctx.fillStyle = '#0f172a'; // Pants
            // Left leg
            ctx.fillRect(-12, -26, 8, this.isGrounded ? 22 + legSwing * 0.4 : 18);
            // Right leg
            ctx.fillRect(4, -26, 8, this.isGrounded ? 22 - legSwing * 0.4 : 18);

            // Shoes
            ctx.fillStyle = this.shoesColor;
            ctx.beginPath();
            ctx.roundRect(-14, -8 + (this.isGrounded ? legSwing * 0.4 : 0), 11, 8, 3);
            ctx.roundRect(3, -8 + (this.isGrounded ? -legSwing * 0.4 : 0), 11, 8, 3);
            ctx.fill();

            // Torso / Jacket
            ctx.save();
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 10;
            ctx.fillStyle = this.clothColor;
            ctx.beginPath();
            ctx.roundRect(-18, -62, 36, 38, 8);
            ctx.fill();

            // Inner accent stripe
            ctx.fillStyle = this.bodyColor;
            ctx.fillRect(-4, -60, 8, 32);

            // Head & Hair/Cap
            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.arc(0, -74, 15, 0, Math.PI * 2);
            ctx.fill();

            // Cyber Visor / Glasses
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(-11, -78, 22, 9, 3);
            ctx.fill();
            ctx.fillStyle = this.glowColor;
            ctx.fillRect(-8, -76, 16, 4);

            // Arms
            ctx.fillStyle = this.clothColor;
            // Left arm
            ctx.beginPath();
            ctx.roundRect(-24, -58 + (this.isGrounded ? armSwing * 0.5 : 0), 7, 24, 3);
            ctx.fill();
            // Right arm
            ctx.beginPath();
            ctx.roundRect(17, -58 + (this.isGrounded ? -armSwing * 0.5 : 0), 7, 24, 3);
            ctx.fill();
            ctx.restore();
        }

        // Magnet visual effect
        if (this.hasMagnet) {
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(0, -45, 32, Math.PI * 0.8, Math.PI * 2.2);
            ctx.stroke();
            ctx.restore();
        }

        // Energy Shield bubble
        if (this.hasShield) {
            ctx.save();
            const shieldPulse = Math.sin(Date.now() * 0.008) * 4;
            const radius = 48 + shieldPulse;
            const grad = ctx.createRadialGradient(0, -45, radius * 0.6, 0, -45, radius);
            grad.addColorStop(0, 'rgba(0, 242, 254, 0.05)');
            grad.addColorStop(0.8, 'rgba(0, 242, 254, 0.35)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0.8)');

            ctx.fillStyle = grad;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 16;

            ctx.beginPath();
            ctx.arc(0, -45, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }
}

window.Player = Player;
