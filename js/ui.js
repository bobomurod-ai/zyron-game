/**
 * ZYRON - UI Manager & Screen Controllers
 * Handles all menu navigations, modals, shops, upgrades, quests, puzzles, and settings
 */

class UIManager {
    constructor() {
        this.currentModal = null;
    }

    init() {
        this.updateTopBar();
        this.bindEvents();
        this.listenStorage();
    }

    listenStorage() {
        window.addEventListener('zyron_storage_updated', () => {
            this.updateTopBar();
            if (this.currentModal) {
                this.refreshCurrentModal();
            }
        });
    }

    updateTopBar() {
        const coinEl = document.getElementById('menu-coins-display');
        const heroEl = document.getElementById('menu-hero-display');
        const planetEl = document.getElementById('menu-planet-display');

        const save = window.gameStorage.data;
        const hero = HeroManager.getHero(save.selectedHero);
        const planet = PlanetManager.getPlanet(save.selectedPlanet);

        if (coinEl) coinEl.innerHTML = `${save.coins} <span class="coin-icon">💰</span>`;
        if (heroEl) heroEl.textContent = `${hero.name}`;
        if (planetEl) planetEl.textContent = `${planet.name}`;
    }

    bindEvents() {
        // Navigation Buttons
        this.bindClick('btn-start-game', () => this.handleStartGame());
        this.bindClick('btn-galaxy-map', () => this.openModal('modal-galaxy-map', () => this.renderGalaxyMap()));
        this.bindClick('btn-weapons', () => this.openModal('modal-weapons', () => this.renderWeapons()));
        this.bindClick('btn-heroes', () => this.openModal('modal-heroes', () => this.renderHeroes()));
        this.bindClick('btn-upgrades', () => this.openModal('modal-upgrades', () => this.renderUpgrades()));
        this.bindClick('btn-quests', () => this.openModal('modal-quests', () => this.renderQuestsAndPuzzles()));
        this.bindClick('btn-story', () => this.openModal('modal-story', () => this.renderStoryChapters()));
        this.bindClick('btn-achievements', () => this.openModal('modal-achievements', () => this.renderAchievements()));
        this.bindClick('btn-settings', () => this.openModal('modal-settings', () => this.renderSettings()));

        // Close Modal buttons
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.onclick = () => this.closeModal();
        });

        // Story dialogue buttons
        this.bindClick('btn-story-next', () => window.storyManager.nextLine());
        this.bindClick('btn-story-skip', () => window.storyManager.skipStory());

        // In-game pause & HUD buttons
        this.bindClick('btn-pause-game', () => window.zyronGame.togglePause());
        this.bindClick('btn-resume-game', () => window.zyronGame.togglePause());
        this.bindClick('btn-quit-game', () => window.zyronGame.exitToMainMenu());
        this.bindClick('btn-gameover-exit', () => window.zyronGame.exitToMainMenu());
        this.bindClick('btn-victory-exit', () => window.zyronGame.exitToMainMenu());
        this.bindClick('hud-special-btn', () => window.zyronGame.triggerSpecialAbility());

        // Puzzle Modal Buttons
        this.bindClick('btn-open-puzzle', () => this.launchPuzzleMiniGame());
        this.bindClick('btn-puzzle-back', () => {
            document.getElementById('puzzle-game-container').classList.add('hidden');
            document.getElementById('quests-list-container').classList.remove('hidden');
        });
        this.bindClick('puzzle-claim-btn', () => {
            document.getElementById('puzzle-claim-btn').classList.add('hidden');
            this.launchPuzzleMiniGame();
        });
        this.bindClick('btn-puzzle-reset', () => {
            window.alienPuzzle.initPuzzle(window.alienPuzzle.size);
        });
    }

    bindClick(id, fn) {
        const el = document.getElementById(id);
        if (el) el.onclick = () => {
            if (window.soundEngine) window.soundEngine.playClick();
            fn();
        };
    }

    openModal(modalId, renderFn = null) {
        this.closeModal();
        const modal = document.getElementById(modalId);
        if (modal) {
            this.currentModal = modalId;
            modal.classList.remove('hidden');
            if (renderFn) renderFn();
        }
    }

    closeModal() {
        if (this.currentModal) {
            const m = document.getElementById(this.currentModal);
            if (m) m.classList.add('hidden');
            this.currentModal = null;
        }
    }

    refreshCurrentModal() {
        if (!this.currentModal) return;
        if (this.currentModal === 'modal-galaxy-map') this.renderGalaxyMap();
        else if (this.currentModal === 'modal-weapons') this.renderWeapons();
        else if (this.currentModal === 'modal-heroes') this.renderHeroes();
        else if (this.currentModal === 'modal-upgrades') this.renderUpgrades();
        else if (this.currentModal === 'modal-quests') this.renderQuestsAndPuzzles();
        else if (this.currentModal === 'modal-achievements') this.renderAchievements();
        else if (this.currentModal === 'modal-settings') this.renderSettings();
    }

    handleStartGame() {
        const curPlanetId = window.gameStorage.data.selectedPlanet;
        const introId = `${curPlanetId}_intro`;

        // Check if intro exists, play it first or jump straight to battle
        const startBattleRoutine = () => {
            document.getElementById('main-menu-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            window.zyronGame.startBattle(curPlanetId);
        };

        if (window.STORY_CUTSCENES && STORY_CUTSCENES[introId]) {
            window.storyManager.playCutscene(introId, startBattleRoutine);
        } else {
            startBattleRoutine();
        }
    }

    // ==========================================
    // 🗺️ GALAXY MAP (XARITA)
    // ==========================================
    renderGalaxyMap() {
        const list = document.getElementById('galaxy-planets-list');
        if (!list) return;

        const currentPlanetId = window.gameStorage.data.selectedPlanet;
        const unlocked = window.gameStorage.data.unlockedPlanets;
        const coins = window.gameStorage.data.coins;

        list.innerHTML = '';

        Object.values(PLANETS_DATA).forEach(planet => {
            const isUnlocked = unlocked.includes(planet.id);
            const isSelected = (planet.id === currentPlanetId);
            const canAfford = coins >= planet.cost;

            const card = document.createElement('div');
            card.className = `planet-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            card.style.borderColor = planet.color;

            let actionHtml = '';
            if (isSelected) {
                actionHtml = `<button class="btn-action active-btn">✓ TANLANGAN</button>`;
            } else if (isUnlocked) {
                actionHtml = `<button class="btn-action select-btn" onclick="PlanetManager.selectPlanet('${planet.id}'); uiManager.renderGalaxyMap();">TANLASH</button>`;
            } else {
                actionHtml = `<button class="btn-action unlock-btn ${!canAfford ? 'disabled' : ''}" onclick="PlanetManager.unlockPlanet('${planet.id}'); uiManager.renderGalaxyMap();">OCHISH: ${planet.cost} 💰</button>`;
            }

            card.innerHTML = `
                <div class="planet-icon-box" style="box-shadow: 0 0 15px ${planet.color}; color:${planet.color};">
                    <span style="font-size:2.4rem;">${planet.icon}</span>
                </div>
                <div class="planet-info">
                    <div class="planet-header">
                        <h3>${planet.name}</h3>
                        <span class="planet-difficulty">${planet.difficulty}</span>
                    </div>
                    <p class="planet-subtitle">${planet.subtitle}</p>
                    <p class="planet-desc">${planet.description}</p>
                    <div class="planet-meta">
                        <span>🏆 Bos: <strong>${planet.boss.name}</strong></span>
                        <span>💰 Tanga koeffitsiyenti: <strong>${planet.coinMultiplier}x</strong></span>
                    </div>
                </div>
                <div class="planet-action-box">
                    ${actionHtml}
                </div>
            `;

            list.appendChild(card);
        });
    }

    // ==========================================
    // ⚔️ WEAPONS & ARSENAL (JIHOZLAR VA QUROLLAR)
    // ==========================================
    renderWeapons() {
        const list = document.getElementById('weapons-list');
        if (!list) return;

        const save = window.gameStorage.data;
        const selectedWpn = save.selectedWeapon;
        const unlockedWpns = save.unlockedWeapons;
        const levels = save.weaponLevels;
        const coins = save.coins;

        list.innerHTML = '';

        Object.values(WEAPONS_DATA).forEach(wpn => {
            const isUnlocked = unlockedWpns.includes(wpn.id);
            const isSelected = (wpn.id === selectedWpn);
            const lvl = levels[wpn.id] || 1;
            const upgradeCost = WeaponManager.getUpgradeCost(wpn.id);
            const effDmg = WeaponManager.getEffectiveDamage(wpn.id);
            const effCd = WeaponManager.getEffectiveCooldown(wpn.id);

            const card = document.createElement('div');
            card.className = `weapon-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            card.style.borderColor = wpn.color;

            let buttonHtml = '';
            if (!isUnlocked) {
                const canBuy = coins >= wpn.cost;
                buttonHtml = `<button class="btn-action unlock-btn ${!canBuy ? 'disabled' : ''}" onclick="WeaponManager.buyWeapon('${wpn.id}'); uiManager.renderWeapons();">SOTIB OLISH: ${wpn.cost} 💰</button>`;
            } else {
                let selectBtn = isSelected 
                    ? `<button class="btn-action active-btn">✓ QO'LLANILGAN</button>` 
                    : `<button class="btn-action select-btn" onclick="gameStorage.data.selectedWeapon='${wpn.id}'; gameStorage.save(); uiManager.renderWeapons();">QO'LLASH</button>`;
                
                let upgradeBtn = '';
                if (lvl >= 5) {
                    upgradeBtn = `<button class="btn-action max-btn">MAKS DARAJA (5)</button>`;
                } else {
                    const canUp = coins >= upgradeCost;
                    upgradeBtn = `<button class="btn-action upgrade-btn ${!canUp ? 'disabled' : ''}" onclick="WeaponManager.upgradeWeapon('${wpn.id}'); uiManager.renderWeapons();">KUCHAYTIRISH (${upgradeCost} 💰)</button>`;
                }

                buttonHtml = `<div class="btn-dual-box">${selectBtn}${upgradeBtn}</div>`;
            }

            card.innerHTML = `
                <div class="weapon-icon-box" style="box-shadow: 0 0 15px ${wpn.glow}; color:${wpn.color};">
                    <span style="font-size:2.2rem;">${wpn.icon}</span>
                    <span class="weapon-level-badge">LVL ${lvl}</span>
                </div>
                <div class="weapon-info">
                    <div class="weapon-header">
                        <h3>${wpn.name}</h3>
                        <span class="weapon-type-badge">${wpn.type.toUpperCase()}</span>
                    </div>
                    <p class="weapon-desc">${wpn.description}</p>
                    <div class="weapon-stats-grid">
                        <div>⚔️ Zarar: <strong>${effDmg}</strong></div>
                        <div>⚡ Tezlik: <strong>${(1000 / effCd).toFixed(1)} o'q/s</strong></div>
                        <div>🎯 O'qlar: <strong>${wpn.bulletCount}</strong></div>
                        <div>${wpn.pierce ? '🌀 Teshib o\'tish' : wpn.homing ? '🚀 Avto-nishon' : wpn.vortex ? '🌌 Girdob' : '✨ Nur'}</div>
                    </div>
                </div>
                <div class="weapon-action-box">
                    ${buttonHtml}
                </div>
            `;

            list.appendChild(card);
        });
    }

    // ==========================================
    // 🦸 HEROES (QAHRAMONLAR)
    // ==========================================
    renderHeroes() {
        const list = document.getElementById('heroes-list');
        if (!list) return;

        const save = window.gameStorage.data;
        const selectedHero = save.selectedHero;
        const unlockedHeroes = save.unlockedHeroes;
        const coins = save.coins;

        list.innerHTML = '';

        Object.values(HEROES_DATA).forEach(hero => {
            const isUnlocked = unlockedHeroes.includes(hero.id);
            const isSelected = (hero.id === selectedHero);
            const stats = HeroManager.getStats(hero.id);

            const card = document.createElement('div');
            card.className = `hero-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            card.style.borderColor = hero.color;

            let buttonHtml = '';
            if (isSelected) {
                buttonHtml = `<button class="btn-action active-btn">✓ TANLANGAN</button>`;
            } else if (isUnlocked) {
                buttonHtml = `<button class="btn-action select-btn" onclick="HeroManager.selectHero('${hero.id}'); uiManager.renderHeroes();">TANLASH</button>`;
            } else {
                const canBuy = coins >= hero.cost;
                buttonHtml = `<button class="btn-action unlock-btn ${!canBuy ? 'disabled' : ''}" onclick="HeroManager.buyHero('${hero.id}'); uiManager.renderHeroes();">OCHISH: ${hero.cost} 💰</button>`;
            }

            card.innerHTML = `
                <div class="hero-icon-box" style="box-shadow:0 0 15px ${hero.color}; color:${hero.color};">
                    <span style="font-size:2.4rem;">${hero.icon}</span>
                </div>
                <div class="hero-info">
                    <div class="hero-header">
                        <h3>${hero.name}</h3>
                        <span class="hero-title">${hero.title}</span>
                    </div>
                    <p class="hero-desc">${hero.description}</p>
                    <div class="hero-stats-row">
                        <div>❤️ HP: <strong>${stats.hp}</strong></div>
                        <div>🛡️ Qalqon: <strong>${stats.shield}</strong></div>
                        <div>⚡ Tezlik: <strong>${stats.speed.toFixed(1)}</strong></div>
                    </div>
                    <div class="hero-special-box">
                        <strong style="color:${hero.color}">🌟 Maxsus Kuch: ${hero.specialName}</strong>
                        <p>${hero.specialDesc}</p>
                    </div>
                </div>
                <div class="hero-action-box">
                    ${buttonHtml}
                </div>
            `;

            list.appendChild(card);
        });
    }

    // ==========================================
    // ⚡ KUCHAYTIRISH (GLOBAL UPGRADES)
    // ==========================================
    renderUpgrades() {
        const list = document.getElementById('upgrades-list');
        if (!list) return;

        const save = window.gameStorage.data;
        const ups = save.upgrades;
        const coins = save.coins;

        const UPGRADE_TYPES = [
            { key: 'maxHp', name: "Maksimal Salomatlik", icon: "❤️", desc: "Kema salomatligini har daraja uchun +25 HP oshiradi.", baseCost: 100, costMult: 1.8 },
            { key: 'shield', name: "Energiya Qalqoni", icon: "🛡️", desc: "Qalqon hajmini +20 va tezroq tiklanishni ta'minlaydi.", baseCost: 150, costMult: 1.8 },
            { key: 'speed', name: "Dvigatel Quvvati", icon: "🚀", desc: "Harakat tezligi va manyovr qilishni +8% oshiradi.", baseCost: 120, costMult: 1.8 },
            { key: 'magnet', name: "Gravitatsiya Magniti", icon: "🧲", desc: "Tanga va mukofotlarni tortish radiusini +35% oshiradi.", baseCost: 80, costMult: 1.7 },
            { key: 'damage', name: "Yadroviy Qurol Quvvati", icon: "⚔️", desc: "Barcha qurollarning umumiy zararini +12% ga ko'taradi.", baseCost: 200, costMult: 2.0 },
            { key: 'crit', name: "Kritik Kalibrlash", icon: "💥", desc: "Kritik zarba berish ehtimolini +5% va kuchini oshiradi.", baseCost: 180, costMult: 2.0 }
        ];

        list.innerHTML = '';

        UPGRADE_TYPES.forEach(item => {
            const curLvl = ups[item.key] || 0;
            const isMax = curLvl >= 5;
            const cost = Math.floor(item.baseCost * Math.pow(item.costMult, curLvl));
            const canAfford = coins >= cost;

            const card = document.createElement('div');
            card.className = 'upgrade-card';

            let actionHtml = '';
            if (isMax) {
                actionHtml = `<button class="btn-action max-btn">MAKS DARAJA (5/5)</button>`;
            } else {
                actionHtml = `<button class="btn-action upgrade-btn ${!canAfford ? 'disabled' : ''}" onclick="uiManager.buyTechUpgrade('${item.key}', ${cost});">KUCHAYTIRISH: ${cost} 💰</button>`;
            }

            // Pip level indicators
            let pips = '';
            for (let i = 1; i <= 5; i++) {
                pips += `<span class="pip ${i <= curLvl ? 'active' : ''}"></span>`;
            }

            card.innerHTML = `
                <div class="upgrade-icon-box">
                    <span style="font-size:2.2rem;">${item.icon}</span>
                </div>
                <div class="upgrade-info">
                    <div class="upgrade-header">
                        <h3>${item.name}</h3>
                        <div class="pip-container">${pips}</div>
                    </div>
                    <p class="upgrade-desc">${item.desc}</p>
                </div>
                <div class="upgrade-action-box">
                    ${actionHtml}
                </div>
            `;

            list.appendChild(card);
        });
    }

    buyTechUpgrade(key, cost) {
        if (window.gameStorage.data.coins >= cost && (window.gameStorage.data.upgrades[key] || 0) < 5) {
            window.gameStorage.spendCoins(cost);
            window.gameStorage.data.upgrades[key] = (window.gameStorage.data.upgrades[key] || 0) + 1;
            window.gameStorage.checkQuestsAndAchievements();
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playSuccess();
            this.renderUpgrades();
        }
    }

    // ==========================================
    // 🧩 QUESTS & ALIEN PUZZLE (TOPSHIRIQ VA JUMBOQLAR)
    // ==========================================
    renderQuestsAndPuzzles() {
        const questsList = document.getElementById('quests-list');
        if (!questsList) return;

        const quests = window.gameStorage.data.quests;
        questsList.innerHTML = '';

        quests.forEach(q => {
            const card = document.createElement('div');
            card.className = `quest-card ${q.completed ? 'completed' : ''} ${q.claimed ? 'claimed' : ''}`;

            const percent = Math.min(100, Math.floor((q.current / q.target) * 100));

            let actionHtml = '';
            if (q.claimed) {
                actionHtml = `<button class="btn-action active-btn" disabled>OLINDI ✓</button>`;
            } else if (q.completed) {
                actionHtml = `<button class="btn-action unlock-btn" onclick="uiManager.claimQuest('${q.id}');">MUKOFOTNI OLISH (${q.reward} 💰)</button>`;
            } else {
                actionHtml = `<span class="quest-progress-txt">${q.current} / ${q.target}</span>`;
            }

            card.innerHTML = `
                <div class="quest-info">
                    <h4>${q.title}</h4>
                    <p>${q.desc}</p>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                    </div>
                </div>
                <div class="quest-action">
                    <span class="quest-reward">+${q.reward} 💰</span>
                    ${actionHtml}
                </div>
            `;

            questsList.appendChild(card);
        });
    }

    claimQuest(id) {
        const q = window.gameStorage.data.quests.find(item => item.id === id);
        if (q && q.completed && !q.claimed) {
            q.claimed = true;
            window.gameStorage.addCoins(q.reward);
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playSuccess();
            this.renderQuestsAndPuzzles();
        }
    }

    launchPuzzleMiniGame() {
        document.getElementById('quests-list-container').classList.add('hidden');
        document.getElementById('puzzle-game-container').classList.remove('hidden');
        document.getElementById('puzzle-status-text').textContent = "Quvvat chiziqlarini burab (Start -> Vault) o'tkazing!";
        document.getElementById('puzzle-claim-btn').classList.add('hidden');
        window.alienPuzzle.initPuzzle(3);
    }

    // ==========================================
    // 📜 2D SYUJETLAR (STORY CUTSCENES)
    // ==========================================
    renderStoryChapters() {
        const list = document.getElementById('story-chapters-list');
        if (!list) return;

        list.innerHTML = '';

        Object.values(STORY_CUTSCENES).forEach(sc => {
            const card = document.createElement('div');
            card.className = 'story-chapter-card';
            card.innerHTML = `
                <div class="story-chapter-info">
                    <h4>${sc.title}</h4>
                    <p>${sc.lines.length} ta dialog sahifasi</p>
                </div>
                <button class="btn-action select-btn" onclick="storyManager.playCutscene('${sc.id}');">TOMOSHA QILISH ▶</button>
            `;
            list.appendChild(card);
        });
    }

    // ==========================================
    // 🏆 ACHIEVEMENTS (YUTUQLAR)
    // ==========================================
    renderAchievements() {
        const list = document.getElementById('achievements-list');
        if (!list) return;

        const achs = window.gameStorage.data.achievements;
        list.innerHTML = '';

        achs.forEach(a => {
            const card = document.createElement('div');
            card.className = `achievement-card ${a.unlocked ? 'unlocked' : 'locked'} ${a.claimed ? 'claimed' : ''}`;

            let actionHtml = '';
            if (a.claimed) {
                actionHtml = `<button class="btn-action active-btn" disabled>OLINDI ✓</button>`;
            } else if (a.unlocked) {
                actionHtml = `<button class="btn-action unlock-btn" onclick="uiManager.claimAchievement('${a.id}');">MUKOFOT: ${a.reward} 💰</button>`;
            } else {
                actionHtml = `<span class="badge-locked">🔒 QULFLANGAN</span>`;
            }

            card.innerHTML = `
                <div class="ach-icon-box">
                    <span style="font-size:2rem;">${a.unlocked ? '🏆' : '🔒'}</span>
                </div>
                <div class="ach-info">
                    <h4>${a.title}</h4>
                    <p>${a.desc}</p>
                </div>
                <div class="ach-action">
                    ${actionHtml}
                </div>
            `;

            list.appendChild(card);
        });
    }

    claimAchievement(id) {
        const a = window.gameStorage.data.achievements.find(item => item.id === id);
        if (a && a.unlocked && !a.claimed) {
            a.claimed = true;
            window.gameStorage.addCoins(a.reward);
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playSuccess();
            this.renderAchievements();
        }
    }

    // ==========================================
    // ⚙️ SETTINGS (SOZLAMALAR)
    // ==========================================
    renderSettings() {
        const s = window.gameStorage.data.settings;

        const sfxSlider = document.getElementById('setting-sfx-volume');
        const musicSlider = document.getElementById('setting-music-volume');
        const shakeCheck = document.getElementById('setting-screenshake');

        if (sfxSlider) {
            sfxSlider.value = s.sfxVolume * 100;
            sfxSlider.oninput = (e) => {
                s.sfxVolume = e.target.value / 100;
                window.soundEngine.setVolumes(s.sfxVolume, s.musicVolume);
                window.gameStorage.save();
            };
        }

        if (musicSlider) {
            musicSlider.value = s.musicVolume * 100;
            musicSlider.oninput = (e) => {
                s.musicVolume = e.target.value / 100;
                window.soundEngine.setVolumes(s.sfxVolume, s.musicVolume);
                window.gameStorage.save();
            };
        }

        if (shakeCheck) {
            shakeCheck.checked = s.screenShake;
            shakeCheck.onchange = (e) => {
                s.screenShake = e.target.checked;
                window.gameStorage.save();
            };
        }

        const resetBtn = document.getElementById('btn-reset-progress');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm("Haqiqatan ham butun o'yin yutuqlari va tangalarni qayta boshlamoqchimisiz?")) {
                    window.gameStorage.resetProgress();
                    this.updateTopBar();
                    this.closeModal();
                    alert("O'yin xotirasi muvaffaqiyatli tozalandi!");
                }
            };
        }
    }
}

window.uiManager = new UIManager();
