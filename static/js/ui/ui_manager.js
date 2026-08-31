/**
 * Metro Rush - UI and Input Controller
 */
class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.activeModal = null;
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.initElements();
        this.initListeners();
    }

    initElements() {
        // Screens
        this.screenMenu = document.getElementById('screen-menu');
        this.screenHUD = document.getElementById('screen-hud');
        this.screenPause = document.getElementById('screen-pause');
        this.screenGameOver = document.getElementById('screen-game-over');

        // Modals
        this.modalShop = document.getElementById('modal-shop');
        this.modalLeaderboard = document.getElementById('modal-leaderboard');
        this.modalMissions = document.getElementById('modal-missions');
        this.modalAchievements = document.getElementById('modal-achievements');
        this.modalHowTo = document.getElementById('modal-howto');

        // HUD Elements
        this.hudScore = document.getElementById('hud-score');
        this.hudCoins = document.getElementById('hud-coins');
        this.hudMultiplier = document.getElementById('hud-multiplier');
        this.hudPowerups = document.getElementById('hud-powerups');

        // Game Over Elements
        this.goScore = document.getElementById('go-score');
        this.goHighScore = document.getElementById('go-high-score');
        this.goDistance = document.getElementById('go-distance');
        this.goCoins = document.getElementById('go-coins');
        this.goHighScoreBadge = document.getElementById('go-new-highscore-badge');
        this.goUnlocksContainer = document.getElementById('go-unlocks-container');
    }

    initListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (this.activeModal) {
                if (e.key === 'Escape') this.closeModals();
                return;
            }

            if (this.engine.state === 'MENU') {
                if (e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    this.engine.startGame();
                }
                return;
            }

            if (this.engine.state === 'PLAYING') {
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                    e.preventDefault();
                    this.engine.player.moveLeft();
                } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                    e.preventDefault();
                    this.engine.player.moveRight();
                } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                    e.preventDefault();
                    this.engine.player.jump();
                } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                    e.preventDefault();
                    this.engine.player.slide();
                } else if (e.code === 'KeyP' || e.code === 'Escape') {
                    e.preventDefault();
                    this.engine.togglePause();
                }
            } else if (this.engine.state === 'PAUSED') {
                if (e.code === 'KeyP' || e.code === 'Escape') {
                    this.engine.togglePause();
                }
            }
        });

        // Touch swipe gestures
        const canvasContainer = document.getElementById('game-canvas-container');
        canvasContainer.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }, { passive: true });

        canvasContainer.addEventListener('touchend', (e) => {
            if (this.activeModal) return;

            if (this.engine.state === 'MENU') {
                this.engine.startGame();
                return;
            }

            if (this.engine.state !== 'PLAYING') return;

            const touch = e.changedTouches[0];
            const dx = touch.clientX - this.touchStartX;
            const dy = touch.clientY - this.touchStartY;
            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);
            const minSwipe = 28;

            if (Math.max(absDx, absDy) > minSwipe) {
                if (absDx > absDy) {
                    if (dx > 0) this.engine.player.moveRight();
                    else this.engine.player.moveLeft();
                } else {
                    if (dy < 0) this.engine.player.jump();
                    else this.engine.player.slide();
                }
            }
        }, { passive: true });

        // Global sound toggles
        const soundBtn = document.getElementById('global-sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const on = window.soundEngine.toggleSound();
                soundBtn.textContent = on ? '🔊' : '🔇';
            });
        }

        const musicBtn = document.getElementById('global-music-toggle');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                const on = window.soundEngine.toggleMusic();
                musicBtn.textContent = on ? '🎵' : '🔇';
            });
        }
    }

    updateHUD(score, coins, multiplier, player) {
        if (this.hudScore) this.hudScore.textContent = Math.floor(score).toLocaleString();
        if (this.hudCoins) this.hudCoins.textContent = coins.toLocaleString();
        if (this.hudMultiplier) this.hudMultiplier.textContent = `x${multiplier.toFixed(1)}`;

        // Active Powerups Bar
        if (this.hudPowerups) {
            let html = '';
            if (player.hasJetpack) {
                const pct = Math.max(0, Math.min(100, (player.jetpackDuration / 6) * 100));
                html += `<div class="flex items-center space-x-1.5 bg-orange-950/80 border border-orange-500/50 rounded-lg px-2 py-1 text-xs text-orange-200">
                    <span>🚀</span>
                    <div class="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div class="bg-orange-500 h-full powerup-meter-fill" style="width: ${pct}%"></div>
                    </div>
                </div>`;
            }
            if (player.hasMagnet) {
                const pct = Math.max(0, Math.min(100, (player.magnetDuration / 8) * 100));
                html += `<div class="flex items-center space-x-1.5 bg-red-950/80 border border-red-500/50 rounded-lg px-2 py-1 text-xs text-red-200">
                    <span>🧲</span>
                    <div class="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div class="bg-red-500 h-full powerup-meter-fill" style="width: ${pct}%"></div>
                    </div>
                </div>`;
            }
            if (player.hasMultiplier) {
                const pct = Math.max(0, Math.min(100, (player.multiplierDuration / 8) * 100));
                html += `<div class="flex items-center space-x-1.5 bg-purple-950/80 border border-purple-500/50 rounded-lg px-2 py-1 text-xs text-purple-200">
                    <span>✖️</span>
                    <div class="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div class="bg-purple-500 h-full powerup-meter-fill" style="width: ${pct}%"></div>
                    </div>
                </div>`;
            }
            if (player.hasShield) {
                html += `<div class="flex items-center space-x-1.5 bg-cyan-950/80 border border-cyan-500/50 rounded-lg px-2 py-1 text-xs text-cyan-200">
                    <span>🛡️</span>
                    <span class="font-bold text-[10px]">ACTIVE</span>
                </div>`;
            }
            this.hudPowerups.innerHTML = html;
        }
    }

    showMenu() {
        this.screenMenu.classList.remove('hidden');
        this.screenHUD.classList.add('hidden');
        this.screenPause.classList.add('hidden');
        this.screenGameOver.classList.add('hidden');
        this.closeModals();
    }

    showHUD() {
        this.screenMenu.classList.add('hidden');
        this.screenHUD.classList.remove('hidden');
        this.screenPause.classList.add('hidden');
        this.screenGameOver.classList.add('hidden');
    }

    showPause() {
        this.screenPause.classList.remove('hidden');
    }

    hidePause() {
        this.screenPause.classList.add('hidden');
    }

    showGameOver(result) {
        this.screenHUD.classList.add('hidden');
        this.screenGameOver.classList.remove('hidden');

        this.goScore.textContent = (result.score || 0).toLocaleString();
        this.goDistance.textContent = `${Math.floor(result.distance_m || 0)}m`;
        this.goCoins.textContent = (result.coins || 0).toLocaleString();

        const profileHigh = result.profile ? result.profile.high_score : result.score;
        this.goHighScore.textContent = profileHigh.toLocaleString();

        if (result.new_high_score) {
            this.goHighScoreBadge.classList.remove('hidden');
        } else {
            this.goHighScoreBadge.classList.add('hidden');
        }

        // Update nav coin balances
        if (result.profile && document.getElementById('nav-coins')) {
            document.getElementById('nav-coins').textContent = result.profile.total_coins;
        }

        // Render unlocked achievements / completed missions notification in game over screen
        let unlockHtml = '';
        if (result.unlocked_achievements && result.unlocked_achievements.length > 0) {
            result.unlocked_achievements.forEach(ach => {
                unlockHtml += `<div class="bg-yellow-950/80 border border-yellow-500/50 p-2 rounded-xl text-xs text-yellow-300 flex items-center justify-between">
                    <span>🏆 Achievement Unlocked: <strong>${ach.name}</strong> (+${ach.reward_coins}🪙)</span>
                </div>`;
            });
        }
        if (result.completed_missions && result.completed_missions.length > 0) {
            result.completed_missions.forEach(m => {
                unlockHtml += `<div class="bg-cyan-950/80 border border-cyan-500/50 p-2 rounded-xl text-xs text-cyan-300 flex items-center justify-between">
                    <span>🎯 Mission Complete: <strong>${m.title}</strong> (+${m.reward_coins}🪙)</span>
                </div>`;
            });
        }
        this.goUnlocksContainer.innerHTML = unlockHtml;
    }

    // Modal Handlers
    openModal(modalElem) {
        this.closeModals();
        if (modalElem) {
            modalElem.classList.add('active');
            this.activeModal = modalElem;
        }
    }

    closeModals() {
        document.querySelectorAll('.game-modal').forEach(m => m.classList.remove('active'));
        this.activeModal = null;
    }

    async openShop() {
        this.openModal(this.modalShop);
        const container = document.getElementById('shop-content');
        container.innerHTML = '<div class="text-center py-8 text-cyan-400 font-arcade animate-pulse">LOADING METRO GEAR...</div>';

        const res = await window.apiClient.getShopCatalog();
        if (res.status === 'success') {
            this.renderShopCatalog(res.characters, res.powerups);
        } else {
            container.innerHTML = `<div class="text-rose-400 text-center py-4">${res.message || 'Error loading shop'}</div>`;
        }
    }

    renderShopCatalog(characters, powerups) {
        const container = document.getElementById('shop-content');
        let html = `
            <div class="space-y-6">
                <div>
                    <h3 class="font-arcade text-xs uppercase tracking-wider text-cyan-400 mb-3">🏃 Select Runner</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        `;

        characters.forEach(c => {
            const isSelected = (this.engine.player.characterSlug === c.slug);
            html += `
                <div class="bg-slate-900/90 border ${isSelected ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700'} rounded-2xl p-3 flex flex-col justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner" style="background: ${c.primary_color}33; border: 2px solid ${c.primary_color}">
                            ${c.avatar_emoji}
                        </div>
                        <div>
                            <h4 class="font-arcade font-bold text-sm text-white">${c.name}</h4>
                            <p class="text-[11px] text-slate-400">${c.description}</p>
                            <span class="text-[10px] text-amber-400 font-semibold">${c.bonus_multiplier}x Score Bonus</span>
                        </div>
                    </div>
                    <div class="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                        ${c.is_unlocked ? `
                            <button onclick="window.gameEngine.ui.selectCharacter('${c.slug}')" class="w-full py-1.5 rounded-xl text-xs font-arcade font-bold ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 hover:bg-cyan-600 text-cyan-200'} transition-all">
                                ${isSelected ? 'EQUIPPED ✓' : 'EQUIP'}
                            </button>
                        ` : `
                            <button onclick="window.gameEngine.ui.unlockCharacter(${c.id})" class="w-full py-1.5 rounded-xl text-xs font-arcade font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center space-x-1 transition-all">
                                <span>UNLOCK</span>
                                <span class="font-sans font-bold">(${c.cost_coins}🪙)</span>
                            </button>
                        `}
                    </div>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
                <div>
                    <h3 class="font-arcade text-xs uppercase tracking-wider text-pink-400 mb-3">⚡ Power-Up Upgrades</h3>
                    <div class="space-y-2.5">
        `;

        powerups.forEach(p => {
            html += `
                <div class="bg-slate-900/90 border border-slate-700 rounded-2xl p-3 flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-2xl">${p.icon}</span>
                        <div>
                            <h4 class="font-bold text-sm text-white">${p.name}</h4>
                            <p class="text-xs text-slate-400">${p.description}</p>
                        </div>
                    </div>
                    <button onclick="window.gameEngine.ui.upgradePowerup('${p.type}')" class="px-3 py-1.5 rounded-xl text-xs font-arcade font-bold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-sm transition-all">
                        UPGRADE (${p.cost}🪙)
                    </button>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    async selectCharacter(slug) {
        const res = await window.apiClient.selectItem(slug, null);
        if (res.status === 'success') {
            this.engine.player.characterSlug = slug;
            this.openShop();
        }
    }

    async unlockCharacter(id) {
        const res = await window.apiClient.unlockItem('character', id);
        alert(res.message);
        if (res.status === 'success') {
            this.openShop();
        }
    }

    async upgradePowerup(type) {
        const res = await window.apiClient.upgradePowerup(type);
        alert(res.message);
        if (res.status === 'success') {
            this.openShop();
        }
    }

    async openLeaderboard(timeframe = 'ALL_TIME') {
        this.openModal(this.modalLeaderboard);
        const container = document.getElementById('leaderboard-list');
        container.innerHTML = '<div class="text-center py-8 text-cyan-400 font-arcade animate-pulse">FETCHING TOP RUNNERS...</div>';

        const res = await window.apiClient.getLeaderboard(timeframe);
        if (res.status === 'success') {
            let html = '';
            res.leaderboard.forEach(r => {
                let medal = `#${r.rank}`;
                if (r.rank === 1) medal = '🥇 1st';
                else if (r.rank === 2) medal = '🥈 2nd';
                else if (r.rank === 3) medal = '🥉 3rd';

                html += `
                    <div class="flex items-center justify-between p-3 rounded-2xl ${r.is_current_user ? 'bg-cyan-950/80 border border-cyan-400' : 'bg-slate-900/80 border border-slate-800'} text-sm">
                        <div class="flex items-center space-x-3">
                            <span class="font-arcade text-xs font-bold ${r.rank <= 3 ? 'text-amber-400' : 'text-slate-400'} w-12">${medal}</span>
                            <span class="text-lg">${r.avatar_emoji || '🏃'}</span>
                            <div>
                                <h5 class="font-bold text-white leading-tight">${r.username} ${r.is_current_user ? '<span class="text-[10px] text-cyan-400">(YOU)</span>' : ''}</h5>
                                <span class="text-[11px] text-slate-400">${r.distance_m}m | ${r.coins}🪙</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="font-arcade font-black text-cyan-300 text-sm">${r.score.toLocaleString()}</span>
                            <div class="text-[10px] text-slate-400 uppercase font-arcade">PTS</div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }

    async openMissions() {
        this.openModal(this.modalMissions);
        const container = document.getElementById('missions-list');
        container.innerHTML = '<div class="text-center py-8 text-cyan-400 font-arcade animate-pulse">LOADING MISSIONS...</div>';

        const res = await window.apiClient.getMissions();
        if (res.status === 'success') {
            let html = '';
            res.missions.forEach(m => {
                html += `
                    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2.5">
                                <span class="text-2xl">${m.icon}</span>
                                <div>
                                    <h4 class="font-bold text-sm text-white">${m.title}</h4>
                                    <p class="text-xs text-slate-400">${m.description}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-xs font-bold text-amber-400">+${m.reward_coins}🪙</span>
                                <span class="text-xs font-bold text-purple-400 ml-1">+${m.reward_gems}💎</span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3 pt-1">
                            <div class="flex-1 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-700">
                                <div class="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" style="width: ${m.progress_pct}%"></div>
                            </div>
                            <span class="text-xs font-arcade text-slate-300">${m.current_value}/${m.target_value}</span>
                            ${m.is_completed ? (
                                m.is_claimed ? `
                                    <span class="text-xs font-arcade text-emerald-400 font-bold px-2 py-1 bg-emerald-950/60 rounded-lg">CLAIMED ✓</span>
                                ` : `
                                    <button onclick="window.gameEngine.ui.claimMission(${m.id})" class="px-3 py-1 rounded-xl text-xs font-arcade font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 animate-bounce">
                                        CLAIM!
                                    </button>
                                `
                            ) : ''}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }

    async claimMission(id) {
        const res = await window.apiClient.claimMission(id);
        alert(res.message);
        if (res.status === 'success') {
            this.openMissions();
        }
    }

    async openAchievements() {
        this.openModal(this.modalAchievements);
        const container = document.getElementById('achievements-list');
        container.innerHTML = '<div class="text-center py-8 text-cyan-400 font-arcade animate-pulse">LOADING TROPHIES...</div>';

        const res = await window.apiClient.getAchievements();
        if (res.status === 'success') {
            let html = '';
            res.achievements.forEach(a => {
                html += `
                    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2.5">
                                <span class="text-2xl">${a.icon}</span>
                                <div>
                                    <h4 class="font-bold text-sm text-white">${a.name}</h4>
                                    <p class="text-xs text-slate-400">${a.description}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <span class="text-xs font-bold text-amber-400">+${a.reward_coins}🪙</span>
                                <span class="text-xs font-bold text-purple-400 ml-1">+${a.reward_gems}💎</span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3 pt-1">
                            <div class="flex-1 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-700">
                                <div class="bg-gradient-to-r from-pink-500 to-purple-500 h-full" style="width: ${a.progress_pct}%"></div>
                            </div>
                            <span class="text-xs font-arcade text-slate-300">${a.current_progress}/${a.target_value}</span>
                            ${a.is_unlocked ? (
                                a.is_claimed ? `
                                    <span class="text-xs font-arcade text-emerald-400 font-bold px-2 py-1 bg-emerald-950/60 rounded-lg">CLAIMED ✓</span>
                                ` : `
                                    <button onclick="window.gameEngine.ui.claimAchievement(${a.id})" class="px-3 py-1 rounded-xl text-xs font-arcade font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 animate-bounce">
                                        CLAIM!
                                    </button>
                                `
                            ) : ''}
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    }

    async claimAchievement(id) {
        const res = await window.apiClient.claimAchievement(id);
        alert(res.message);
        if (res.status === 'success') {
            this.openAchievements();
        }
    }

    openHowToPlay() {
        this.openModal(this.modalHowTo);
    }
}

window.UIManager = UIManager;
