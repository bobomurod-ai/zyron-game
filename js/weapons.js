/**
 * ZYRON - Weapon Systems & Upgrades
 * Definitions of all guns, projectile types, firing behaviors and upgrade trees
 */

const WEAPONS_DATA = {
    photon: {
        id: 'photon',
        name: "Foton Blaster",
        icon: "⚡",
        color: "#00f0ff",
        glow: "rgba(0, 240, 255, 0.6)",
        cost: 0, // Unlocked by default
        description: "Standart kosmik lazer quroli. Yuqori aniqlik va yaxshi otish tezligi.",
        baseDamage: 22,
        damagePerLevel: 6,
        baseCooldown: 200, // ms between shots
        cooldownReductionPerLevel: 15, // ms
        bulletSpeed: 14,
        bulletCount: 1,
        bulletSpread: 0,
        upgradeCostBase: 120,
        upgradeCostMultiplier: 1.8,
        bulletSize: 4,
        bulletTail: 16,
        type: 'standard'
    },
    plasma: {
        id: 'plasma',
        name: "Plazma Tarqatuvchi (Shotgun)",
        icon: "💥",
        color: "#ff007f",
        glow: "rgba(255, 0, 127, 0.6)",
        cost: 450,
        description: "Yaqin masofada halokatli bo'lgan 5 talik tarqoq plazma o'qlari to'lqini.",
        baseDamage: 14, // per pellet (x5 = 70 damage)
        damagePerLevel: 4,
        baseCooldown: 480,
        cooldownReductionPerLevel: 30,
        bulletSpeed: 12,
        bulletCount: 5,
        bulletSpread: 0.35, // radians
        upgradeCostBase: 250,
        upgradeCostMultiplier: 2.0,
        bulletSize: 5,
        bulletTail: 10,
        type: 'plasma'
    },
    laser: {
        id: 'laser',
        name: "Lazron Nur (Railgun)",
        icon: "🔮",
        color: "#b026ff",
        glow: "rgba(176, 38, 255, 0.7)",
        cost: 900,
        description: "Barcha dushmanlarni teshib o'tuvchi yuqori quvvatli giper-nur.",
        baseDamage: 45,
        damagePerLevel: 15,
        baseCooldown: 550,
        cooldownReductionPerLevel: 40,
        bulletSpeed: 22,
        bulletCount: 1,
        bulletSpread: 0,
        pierce: true,
        upgradeCostBase: 400,
        upgradeCostMultiplier: 2.1,
        bulletSize: 6,
        bulletTail: 32,
        type: 'laser'
    },
    missile: {
        id: 'missile',
        name: "Mini-Raketalar (Homing)",
        icon: "🚀",
        color: "#ffaa00",
        glow: "rgba(255, 170, 0, 0.7)",
        cost: 1600,
        description: "Eng yaqin dushmanga avtomatik nishonga oluvchi portlovchi mikroraketalar.",
        baseDamage: 60,
        damagePerLevel: 18,
        baseCooldown: 600,
        cooldownReductionPerLevel: 45,
        bulletSpeed: 9,
        bulletCount: 2,
        bulletSpread: 0.4,
        homing: true,
        homingTurnRate: 0.08,
        blastRadius: 50,
        upgradeCostBase: 600,
        upgradeCostMultiplier: 2.2,
        bulletSize: 7,
        bulletTail: 14,
        type: 'missile'
    },
    ion: {
        id: 'ion',
        name: "Ionli Singulyarlik (Vortex)",
        icon: "🌀",
        color: "#00ffaa",
        glow: "rgba(0, 255, 170, 0.8)",
        cost: 2800,
        description: "Dushmanlarni o'ziga tortuvchi va maydon bo'ylab elektr toki tarqatuvchi shar.",
        baseDamage: 90,
        damagePerLevel: 30,
        baseCooldown: 850,
        cooldownReductionPerLevel: 60,
        bulletSpeed: 7,
        bulletCount: 1,
        bulletSpread: 0,
        vortex: true,
        blastRadius: 90,
        upgradeCostBase: 900,
        upgradeCostMultiplier: 2.4,
        bulletSize: 12,
        bulletTail: 20,
        type: 'ion'
    }
};

class WeaponManager {
    static getWeapon(id) {
        return WEAPONS_DATA[id] || WEAPONS_DATA.photon;
    }

    static getWeaponLevel(id) {
        return window.gameStorage.data.weaponLevels[id] || 1;
    }

    static getUpgradeCost(id) {
        const wpn = this.getWeapon(id);
        const lvl = this.getWeaponLevel(id);
        if (lvl >= 5) return null; // Max lvl
        return Math.floor(wpn.upgradeCostBase * Math.pow(wpn.upgradeCostMultiplier, lvl - 1));
    }

    static getEffectiveDamage(id) {
        const wpn = this.getWeapon(id);
        const lvl = this.getWeaponLevel(id);
        const techBoost = 1 + (window.gameStorage.data.upgrades.damage * 0.12);
        return Math.floor((wpn.baseDamage + (lvl - 1) * wpn.damagePerLevel) * techBoost);
    }

    static getEffectiveCooldown(id) {
        const wpn = this.getWeapon(id);
        const lvl = this.getWeaponLevel(id);
        const cd = Math.max(80, wpn.baseCooldown - (lvl - 1) * wpn.cooldownReductionPerLevel);
        return cd;
    }

    static canBuy(id) {
        const wpn = this.getWeapon(id);
        const isUnlocked = window.gameStorage.data.unlockedWeapons.includes(id);
        return !isUnlocked && window.gameStorage.data.coins >= wpn.cost;
    }

    static buyWeapon(id) {
        const wpn = this.getWeapon(id);
        if (this.canBuy(id)) {
            window.gameStorage.spendCoins(wpn.cost);
            window.gameStorage.data.unlockedWeapons.push(id);
            window.gameStorage.data.selectedWeapon = id;
            window.gameStorage.checkQuestsAndAchievements();
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playSuccess();
            return true;
        }
        return false;
    }

    static upgradeWeapon(id) {
        const cost = this.getUpgradeCost(id);
        if (cost !== null && window.gameStorage.data.coins >= cost) {
            window.gameStorage.spendCoins(cost);
            window.gameStorage.data.weaponLevels[id] = (window.gameStorage.data.weaponLevels[id] || 1) + 1;
            window.gameStorage.checkQuestsAndAchievements();
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playSuccess();
            return true;
        }
        return false;
    }
}

window.WeaponManager = WeaponManager;
