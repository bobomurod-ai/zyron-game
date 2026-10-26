/**
 * ZYRON - Heroes / Ships System
 * Distinct playable ships with unique stats and special active abilities
 */

const HEROES_DATA = {
    scout: {
        id: 'scout',
        name: "Zyron-1 (Lochin)",
        title: "Tezkor Keshfiyotchi",
        icon: "🦅",
        cost: 0, // Free default
        color: "#00f0ff",
        accent: "#ffffff",
        hp: 100,
        shield: 50,
        speed: 6.5,
        specialName: "Giper-Sakrash (Dash)",
        specialDesc: "Daxlsiz tezkor sakrash va yaqin dushmanlarga zarba to'lqini.",
        specialCd: 5000, // 5s
        description: "Zyron korpusi tomonidan ishlab chiqilgan birinchi avlod kosmik jangchi kema. Balanslashgan va oson boshqariladi."
    },
    titan: {
        id: 'titan',
        name: "Vanguard (Titan)",
        title: "Og'ir Zirhli Tank",
        icon: "🛡️",
        cost: 650,
        color: "#ffaa00",
        accent: "#ff3300",
        hp: 220,
        shield: 140,
        speed: 4.8,
        specialName: "Titan Qalqoni (Reflect)",
        specialDesc: "5 soniya davomida 100% zararni qaytaruvchi mustahkam himoya sferasi.",
        specialCd: 8000,
        description: "Mustahkam titan qotishmasidan yasalgan og'ir harbiy kema. O'ta katta salomatlik va kuchli himoyaga ega."
    },
    phantom: {
        id: 'phantom',
        name: "Shadow-X (Arvoh)",
        title: "Yashirin Qotil",
        icon: "⚡",
        cost: 1400,
        color: "#b026ff",
        accent: "#ff007f",
        hp: 90,
        shield: 50,
        speed: 7.6,
        specialName: "Vaqt Buzilishi (Time Warp)",
        specialDesc: "Barcha dushmanlar harakatini 4 soniya davomida 60% ga sekinlashtiradi.",
        specialCd: 9000,
        description: "Kvantiya laboratoriyasida yaratilgan maxfiy kema. Yuqori tezlik va kritik zarba berish imkoniyati yuqori."
    },
    nova: {
        id: 'nova',
        name: "Nova-V (Kosmo-Yadro)",
        title: "Energiya Hukmdori",
        icon: "☀️",
        cost: 2600,
        color: "#00ff88",
        accent: "#ffff00",
        hp: 130,
        shield: 110,
        speed: 6.2,
        specialName: "Supernova Portlashi",
        specialDesc: "Butun ekran bo'ylab gigant energiya to'lqini yuborib oddiy dushmanlarni yo'q qiladi.",
        specialCd: 12000,
        description: "Koinot yulduzlari yadrosidan quvvat oluvchi afsonaviy kema. Uning maxsus hujumi halokatli kuchga ega."
    }
};

class HeroManager {
    static getHero(id) {
        return HEROES_DATA[id] || HEROES_DATA.scout;
    }

    static canBuy(id) {
        const hero = this.getHero(id);
        const isUnlocked = window.gameStorage.data.unlockedHeroes.includes(id);
        return !isUnlocked && window.gameStorage.data.coins >= hero.cost;
    }

    static buyHero(id) {
        const hero = this.getHero(id);
        if (this.canBuy(id)) {
            window.gameStorage.spendCoins(hero.cost);
            window.gameStorage.data.unlockedHeroes.push(id);
            window.gameStorage.data.selectedHero = id;
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playSuccess();
            return true;
        }
        return false;
    }

    static selectHero(id) {
        if (window.gameStorage.data.unlockedHeroes.includes(id)) {
            window.gameStorage.data.selectedHero = id;
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playClick();
            return true;
        }
        return false;
    }

    static getStats(id) {
        const h = this.getHero(id);
        const up = window.gameStorage.data.upgrades;
        return {
            hp: h.hp + (up.maxHp * 25),
            shield: h.shield + (up.shield * 20),
            speed: h.speed * (1 + up.speed * 0.08),
            magnet: 80 * (1 + up.magnet * 0.35),
            critChance: 0.05 + (up.crit * 0.05) + (id === 'phantom' ? 0.15 : 0),
            critMult: 1.5 + (up.crit * 0.25)
        };
    }
}

window.HeroManager = HeroManager;
