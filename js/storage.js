/**
 * ZYRON - Storage & State Management
 * Persistent progress via localStorage
 */

const STORAGE_KEY = 'zyron_save_data_v2';

const DEFAULT_SAVE = {
    coins: 300, // starting coins for immediate fun
    selectedHero: 'scout',
    unlockedHeroes: ['scout'],
    selectedWeapon: 'photon',
    unlockedWeapons: ['photon'],
    weaponLevels: {
        photon: 1,
        plasma: 1,
        laser: 1,
        missile: 1,
        ion: 1
    },
    upgrades: {
        maxHp: 0,       // 0 to 5
        shield: 0,      // 0 to 5
        speed: 0,       // 0 to 5
        magnet: 0,      // 0 to 5
        damage: 0,      // 0 to 5
        crit: 0         // 0 to 5
    },
    selectedPlanet: 'aethelgard',
    unlockedPlanets: ['aethelgard'],
    stats: {
        enemiesKilled: 0,
        bossesDefeated: 0,
        coinsEarned: 0,
        puzzlesSolved: 0,
        planetsCompleted: 0,
        shotsFired: 0
    },
    quests: [
        { id: 'q_kill_15', title: "Ilk Qadam", desc: "15 ta koinot dushmanini yo'q qil", target: 15, current: 0, reward: 150, completed: false, claimed: false, type: 'enemiesKilled' },
        { id: 'q_solve_2', title: "Koinot Muhandisi", desc: "2 ta energiya jumboqini yech", target: 2, current: 0, reward: 250, completed: false, claimed: false, type: 'puzzlesSolved' },
        { id: 'q_coins_500', title: "Boylik Izlovchi", desc: "Janglarda 500 tanga yig'ish", target: 500, current: 0, reward: 300, completed: false, claimed: false, type: 'coinsEarned' },
        { id: 'q_upgrade_wpn', title: "Arsenal Mustahkamligi", desc: "Istalgan qurolni 2-bosqichga ko'tar", target: 2, current: 1, reward: 200, completed: false, claimed: false, type: 'maxWeaponLvl' },
        { id: 'q_boss_1', title: "Dreadnought Qotili", desc: "Kamida 1 ta planetar bosni yeng", target: 1, current: 0, reward: 500, completed: false, claimed: false, type: 'bossesDefeated' },
        { id: 'q_unlock_planet', title: "Sayyoralarni Zabt Etish", desc: "2 ta sayyorani ochish", target: 2, current: 1, reward: 400, completed: false, claimed: false, type: 'unlockedPlanetsCount' }
    ],
    achievements: [
        { id: 'ach_first_blood', title: "Birinchi Qon", desc: "Ilk koinot dushmanini mag'lub et", reward: 80, unlocked: false, claimed: false },
        { id: 'ach_100_kills', title: "Maxluqlar Qatliomi", desc: "100 ta yovuz dushmanni yo'q qil", reward: 350, unlocked: false, claimed: false },
        { id: 'ach_puzzle_master', title: "Sirli Jumboq Ustasi", desc: "3 ta koinot jumboqini muvaffaqiyatli yech", reward: 400, unlocked: false, claimed: false },
        { id: 'ach_rich', title: "Kosmik Millioner", desc: "Jami 1000 tanga jamg'ar", reward: 500, unlocked: false, claimed: false },
        { id: 'ach_all_weapons', title: "To'liq Arsenal", desc: "Barcha 5 xil qurolni sotib ol", reward: 800, unlocked: false, claimed: false },
        { id: 'ach_boss_slayer', title: "Boslar Kushandasi", desc: "3 ta yirik bosni tor-mor qil", reward: 1000, unlocked: false, claimed: false },
        { id: 'ach_void_hero', title: "Galaktika Najotkori", desc: "Void-Core so'nggi sayyorasini zabt et", reward: 2500, unlocked: false, claimed: false }
    ],
    settings: {
        sfxVolume: 0.8,
        musicVolume: 0.5,
        screenShake: true,
        particles: 'high'
    }
};

class GameStorage {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
            const parsed = JSON.parse(raw);
            // Merge with default in case of new fields
            return {
                ...DEFAULT_SAVE,
                ...parsed,
                weaponLevels: { ...DEFAULT_SAVE.weaponLevels, ...(parsed.weaponLevels || {}) },
                upgrades: { ...DEFAULT_SAVE.upgrades, ...(parsed.upgrades || {}) },
                stats: { ...DEFAULT_SAVE.stats, ...(parsed.stats || {}) },
                settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
                quests: DEFAULT_SAVE.quests.map(defQ => {
                    const found = (parsed.quests || []).find(q => q.id === defQ.id);
                    return found ? { ...defQ, ...found } : { ...defQ };
                }),
                achievements: DEFAULT_SAVE.achievements.map(defAch => {
                    const found = (parsed.achievements || []).find(a => a.id === defAch.id);
                    return found ? { ...defAch, ...found } : { ...defAch };
                })
            };
        } catch (e) {
            console.error("Storage load error:", e);
            return JSON.parse(JSON.stringify(DEFAULT_SAVE));
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('zyron_storage_updated', { detail: this.data }));
            }
        } catch (e) {
            console.error("Storage save error:", e);
        }
    }

    addCoins(amount) {
        this.data.coins += amount;
        if (amount > 0) {
            this.data.stats.coinsEarned += amount;
            this.checkQuestsAndAchievements();
        }
        this.save();
        return this.data.coins;
    }

    spendCoins(amount) {
        if (this.data.coins >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    recordStat(statKey, delta = 1) {
        if (this.data.stats[statKey] !== undefined) {
            this.data.stats[statKey] += delta;
            this.checkQuestsAndAchievements();
            this.save();
        }
    }

    checkQuestsAndAchievements() {
        const stats = this.data.stats;

        // Check Quests
        const maxWpnLvl = Math.max(...Object.values(this.data.weaponLevels));
        this.data.quests.forEach(q => {
            if (q.completed) return;
            if (q.type === 'enemiesKilled') q.current = stats.enemiesKilled;
            else if (q.type === 'puzzlesSolved') q.current = stats.puzzlesSolved;
            else if (q.type === 'coinsEarned') q.current = stats.coinsEarned;
            else if (q.type === 'bossesDefeated') q.current = stats.bossesDefeated;
            else if (q.type === 'maxWeaponLvl') q.current = maxWpnLvl;
            else if (q.type === 'unlockedPlanetsCount') q.current = this.data.unlockedPlanets.length;

            if (q.current >= q.target) {
                q.completed = true;
                if (window.soundEngine) window.soundEngine.playSuccess();
            }
        });

        // Check Achievements
        const achs = this.data.achievements;
        const setUnlock = (id, condition) => {
            const a = achs.find(item => item.id === id);
            if (a && !a.unlocked && condition) {
                a.unlocked = true;
                if (window.soundEngine) window.soundEngine.playSuccess();
            }
        };

        setUnlock('ach_first_blood', stats.enemiesKilled >= 1);
        setUnlock('ach_100_kills', stats.enemiesKilled >= 100);
        setUnlock('ach_puzzle_master', stats.puzzlesSolved >= 3);
        setUnlock('ach_rich', stats.coinsEarned >= 1000);
        setUnlock('ach_all_weapons', this.data.unlockedWeapons.length >= 5);
        setUnlock('ach_boss_slayer', stats.bossesDefeated >= 3);
        setUnlock('ach_void_hero', this.data.unlockedPlanets.includes('void_core') && stats.bossesDefeated >= 5);
    }

    resetProgress() {
        this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
        this.save();
    }
}

window.gameStorage = new GameStorage();
