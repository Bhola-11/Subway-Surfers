/**
 * Metro Rush - Procedural Track and World Generator
 */
class TrackManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.segmentLength = 100;
        this.renderDistance = 3000;
        this.trackWidth = 460;
        this.laneWidth = 130;
        this.nextSpawnZ = 300; // Start spawning ahead of player

        this.obstacles = [];
        this.coins = [];
        this.powerups = [];
        this.sceneryArchways = [];

        // Pre-populate initial track
        this.generateInitialTrack();
    }

    generateInitialTrack() {
        // Pre-generate scenery archways
        for (let z = 200; z < this.renderDistance; z += 350) {
            this.sceneryArchways.push({ z: z, color: (z % 700 === 0) ? '#00f2fe' : '#ff007f' });
        }

        // Fill initial obstacle stream
        while (this.nextSpawnZ < this.renderDistance) {
            this.spawnTrackSection();
        }
    }

    spawnTrackSection() {
        const z = this.nextSpawnZ;
        const sectionType = Math.floor(Math.random() * 6);

        if (sectionType === 0) {
            // Low hurdle with arched coins over it
            const lane = Math.floor(Math.random() * 3) - 1;
            this.obstacles.push(new Obstacle('BARRIER_LOW', lane, z));

            // Arched coins over hurdle
            for (let i = -2; i <= 2; i++) {
                const coinZ = z + i * 40;
                const coinY = 25 + Math.cos((i / 2) * (Math.PI / 2)) * 55;
                this.coins.push(new Coin(lane, coinZ, coinY));
            }
            this.nextSpawnZ += 280;

        } else if (sectionType === 1) {
            // High barrier (must duck) with low coins underneath
            const lane = Math.floor(Math.random() * 3) - 1;
            this.obstacles.push(new Obstacle('BARRIER_HIGH', lane, z));

            for (let i = -1; i <= 2; i++) {
                this.coins.push(new Coin(lane, z + i * 40, 15));
            }
            this.nextSpawnZ += 260;

        } else if (sectionType === 2) {
            // Static subway train with coins on the roof
            const lane = Math.floor(Math.random() * 3) - 1;
            this.obstacles.push(new Obstacle('TRAIN_STATIC', lane, z));

            // Coins along train roof
            for (let i = 0; i < 5; i++) {
                this.coins.push(new Coin(lane, z + 50 + i * 50, 135));
            }
            this.nextSpawnZ += 450;

        } else if (sectionType === 3) {
            // Moving Oncoming Subway Train!
            const lane = Math.floor(Math.random() * 3) - 1;
            this.obstacles.push(new Obstacle('TRAIN_MOVING', lane, z + 400));
            this.nextSpawnZ += 500;

        } else if (sectionType === 4) {
            // Multi-lane blockade with safe lane & powerup
            const safeLane = Math.floor(Math.random() * 3) - 1;
            for (let l = -1; l <= 1; l++) {
                if (l !== safeLane) {
                    const type = Math.random() > 0.5 ? 'BLOCK_WALL' : 'BARRIER_LOW';
                    this.obstacles.push(new Obstacle(type, l, z));
                }
            }

            // Powerup in safe lane
            const powerupTypes = ['MAGNET', 'JETPACK', 'SHIELD', 'MULTIPLIER', 'SNEAKERS'];
            const chosenType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            this.powerups.push(new PowerUpItem(chosenType, safeLane, z + 60));

            this.nextSpawnZ += 320;

        } else {
            // Clear stretch with zigzag coin rush
            const lanes = [-1, 0, 1, 0, -1];
            lanes.forEach((l, idx) => {
                this.coins.push(new Coin(l, z + idx * 45, 20));
            });
            this.nextSpawnZ += 320;
        }

        // Add periodic Archway
        if (z % 400 < 100) {
            this.sceneryArchways.push({ z: z + 200, color: (z % 800 === 0) ? '#00f2fe' : '#a855f7' });
        }
    }

    update(dt, playerZ, player) {
        // Recycle and spawn forward
        while (this.nextSpawnZ < playerZ + this.renderDistance) {
            this.spawnTrackSection();
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.update(dt, playerZ);

            // Clean up behind player
            if (obs.z + (obs.depth || 50) < playerZ - 150) {
                this.obstacles.splice(i, 1);
            }
        }

        // Update coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update(dt, player);

            if (coin.z < playerZ - 100 || coin.collected) {
                this.coins.splice(i, 1);
            }
        }

        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pu = this.powerups[i];
            pu.update(dt);

            if (pu.z < playerZ - 100 || pu.collected) {
                this.powerups.splice(i, 1);
            }
        }

        // Clean archways
        for (let i = this.sceneryArchways.length - 1; i >= 0; i--) {
            if (this.sceneryArchways[i].z < playerZ - 150) {
                this.sceneryArchways.splice(i, 1);
            }
        }
    }
}

window.TrackManager = TrackManager;
