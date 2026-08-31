/**
 * Metro Rush - Master Game Engine
 */
class GameEngine {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new GameRenderer(this.canvas);
        this.player = new Player();
        this.track = new TrackManager();
        this.ui = new UIManager(this);

        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
        this.score = 0;
        this.coinsCollected = 0;
        this.distanceMeters = 0;
        this.baseSpeed = 380;
        this.gameSpeed = this.baseSpeed;
        this.maxMultiplier = 1.0;
        this.powerupsUsedCount = 0;
        this.durationSec = 0;

        this.sessionId = null;
        this.telemetryBuffer = [];
        this.particles = [];
        this.lastTime = 0;
        this.deathCause = 'OBSTACLE_COLLISION';

        this.init();
    }

    async init() {
        // Load player profile from API to sync active character and sound preferences
        const res = await window.apiClient.getProfile();
        if (res.status === 'success' && res.data) {
            const data = res.data;
            if (data.active_character) {
                this.player.characterSlug = data.active_character;
            }
            if (data.active_skin) {
                this.player.skinSlug = data.active_skin;
            }
            if (typeof data.sound_enabled === 'boolean') {
                window.soundEngine.soundEnabled = data.sound_enabled;
            }
            if (typeof data.music_enabled === 'boolean') {
                window.soundEngine.musicEnabled = data.music_enabled;
            }
        }

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    async startGame() {
        this.state = 'PLAYING';
        this.score = 0;
        this.coinsCollected = 0;
        this.distanceMeters = 0;
        this.durationSec = 0;
        this.powerupsUsedCount = 0;
        this.maxMultiplier = 1.0;
        this.gameSpeed = this.baseSpeed;
        this.telemetryBuffer = [];
        this.particles = [];

        this.player.reset();
        this.track.reset();

        this.ui.showHUD();
        window.soundEngine.startBGM();

        // Start server session
        const sessionRes = await window.apiClient.startSession();
        if (sessionRes.status === 'success') {
            this.sessionId = sessionRes.session_id;
        }
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.ui.showPause();
            window.soundEngine.stopBGM();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.ui.hidePause();
            window.soundEngine.startBGM();
            this.lastTime = performance.now();
        }
    }

    createParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 120;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 2 + Math.random() * 4,
                life: 1.0,
                decay: 1.5 + Math.random() * 1.5
            });
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        this.durationSec += dt;

        // Increase speed smoothly over distance
        this.gameSpeed = this.baseSpeed + Math.min(380, this.distanceMeters * 0.12);
        const frameDistance = (this.gameSpeed * dt);
        this.distanceMeters += frameDistance * 0.08;

        // Calculate score
        let currentMultiplier = 1.0;
        if (this.player.hasMultiplier) currentMultiplier *= 2.0;
        if (currentMultiplier > this.maxMultiplier) this.maxMultiplier = currentMultiplier;

        this.score += (frameDistance * 0.25) * currentMultiplier;

        // Move player forward in world Z
        this.player.z += frameDistance;

        // Update player & track
        this.player.update(dt, this.gameSpeed);
        this.track.update(dt, this.player.z, this.player);

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= p.decay * dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Check Collisions
        this.checkCollisions();

        // Update HUD
        this.ui.updateHUD(this.score, this.coinsCollected, currentMultiplier, this.player);
    }

    checkCollisions() {
        const pBounds = this.player.getBounds();
        const playerWorldZ = this.player.z;

        // 1. Coin Collisions
        for (const coin of this.track.coins) {
            if (coin.collected) continue;
            const cBounds = coin.getBounds();

            // Z overlap check
            if (Math.abs(coin.z - playerWorldZ) < 35) {
                // X & Y overlap
                if (Math.abs(coin.x - this.player.x) < 40 && Math.abs(coin.y - this.player.y) < 45) {
                    coin.collected = true;
                    this.coinsCollected++;
                    window.soundEngine.playCoin();

                    const proj = this.renderer.project(coin.x, coin.y, coin.z);
                    if (proj) this.createParticles(proj.x, proj.y, '#facc15', 6);
                }
            }
        }

        // 2. Power-up Collisions
        for (const pu of this.track.powerups) {
            if (pu.collected) continue;
            if (Math.abs(pu.z - playerWorldZ) < 40) {
                if (Math.abs(pu.x - this.player.x) < 45 && Math.abs(pu.y - this.player.y) < 55) {
                    pu.collected = true;
                    this.powerupsUsedCount++;
                    window.soundEngine.playPowerup();

                    if (pu.type === 'MAGNET') {
                        this.player.hasMagnet = true;
                        this.player.magnetDuration = 10;
                    } else if (pu.type === 'JETPACK') {
                        this.player.hasJetpack = true;
                        this.player.jetpackDuration = 7;
                        this.player.hasMagnet = true;
                        this.player.magnetDuration = 8;
                    } else if (pu.type === 'SHIELD') {
                        this.player.hasShield = true;
                    } else if (pu.type === 'MULTIPLIER') {
                        this.player.hasMultiplier = true;
                        this.player.multiplierDuration = 10;
                    } else if (pu.type === 'SNEAKERS') {
                        this.player.hasSuperSneakers = true;
                        this.player.superSneakersDuration = 10;
                    }

                    const proj = this.renderer.project(pu.x, pu.y, pu.z);
                    if (proj) this.createParticles(proj.x, proj.y, '#38bdf8', 14);
                }
            }
        }

        // 3. Obstacle Collisions
        if (this.player.hasJetpack) return; // Jetpack flies above obstacles

        for (const obs of this.track.obstacles) {
            const oBounds = obs.getBounds();

            // Check if player is within obstacle Z slice
            if (playerWorldZ >= (oBounds.zMin - 15) && playerWorldZ <= (oBounds.zMax + 15)) {
                // Check X (Lane)
                if (Math.abs(obs.x - this.player.x) < (obs.width * 0.42)) {
                    // Check Y
                    const playerY = this.player.y;
                    let isColliding = false;

                    if (obs.type === 'BARRIER_LOW') {
                        // Collision if not jumped above hurdle
                        if (playerY < obs.yMax) {
                            isColliding = true;
                        }
                    } else if (obs.type === 'BARRIER_HIGH') {
                        // Collision if standing/jumping (must slide underneath)
                        if (!this.player.isSliding || playerY > 20) {
                            isColliding = true;
                        }
                    } else if (obs.type === 'BLOCK_WALL' || obs.type === 'TRAIN_MOVING' || obs.type === 'TRAIN_STATIC') {
                        // Full collision unless landed on static train roof ramp
                        if (obs.type === 'TRAIN_STATIC' && playerY >= (obs.yMax - 15)) {
                            // Safely running on train roof!
                            isColliding = false;
                        } else {
                            isColliding = true;
                        }
                    }

                    if (isColliding) {
                        if (this.player.hasShield) {
                            // Shield absorbs the blow!
                            this.player.hasShield = false;
                            window.soundEngine.playShieldHit();
                            this.renderer.addShake(12);

                            const proj = this.renderer.project(this.player.x, this.player.y, this.player.z);
                            if (proj) this.createParticles(proj.x, proj.y, '#00f2fe', 20);

                            // Push obstacle past player so it doesn't immediately re-collide
                            obs.z = playerWorldZ - 200;
                        } else {
                            // Fatal Crash!
                            this.deathCause = obs.type === 'TRAIN_MOVING' ? 'TRAIN_COLLISION' : 'OBSTACLE_COLLISION';
                            this.gameOver();
                            return;
                        }
                    }
                }
            }
        }
    }

    async gameOver() {
        this.state = 'GAMEOVER';
        window.soundEngine.stopBGM();
        window.soundEngine.playCrash();
        this.renderer.addShake(22);

        const proj = this.renderer.project(this.player.x, this.player.y, this.player.z);
        if (proj) this.createParticles(proj.x, proj.y, '#ef4444', 30);

        // Submit run to Django backend
        const runPayload = {
            session_id: this.sessionId,
            score: Math.floor(this.score),
            distance_m: Math.floor(this.distanceMeters),
            coins: this.coinsCollected,
            duration_sec: Math.max(1, this.durationSec),
            max_multiplier: this.maxMultiplier,
            powerups_used: this.powerupsUsedCount,
            death_cause: this.deathCause,
            character_used: this.player.characterSlug,
            skin_used: this.player.skinSlug,
            telemetry: this.telemetryBuffer
        };

        const res = await window.apiClient.submitRun(runPayload);
        if (res.status === 'success') {
            this.ui.showGameOver(res.data);
        } else {
            this.ui.showGameOver({
                score: Math.floor(this.score),
                distance_m: Math.floor(this.distanceMeters),
                coins: this.coinsCollected,
                new_high_score: false
            });
        }
    }

    loop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        this.update(dt);
        this.renderer.render(this.player, this.track, this.particles, dt, this.gameSpeed);

        requestAnimationFrame((t) => this.loop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
});
