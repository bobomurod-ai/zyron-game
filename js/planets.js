/**
 * ZYRON - Galaxy Map & Planetary Systems
 * Details of distinct planets, hazards, enemy spawns and planetary bosses
 */

const PLANETS_DATA = {
    aethelgard: {
        id: 'aethelgard',
        name: "Aethelgard Orbiti",
        subtitle: "Tinch Kosmik Stansiya",
        icon: "🛰️",
        unlockedByDefault: true,
        cost: 0,
        difficulty: "★☆☆☆☆",
        color: "#00d4ff",
        bgColor: "#050b18",
        nebulaColor: "rgba(0, 180, 255, 0.12)",
        description: "Insoniyatning koinotdagi birinchi qal'asi. Maxluqlarning разведка dronlari va uchuvchi hasharotlari hujum qilmoqda.",
        coinMultiplier: 1.0,
        waveCount: 3,
        boss: {
            name: "Orbital Dreadnought M-1",
            title: "Dastlabki Bos",
            hp: 750,
            color: "#00f0ff",
            attackCooldown: 1800,
            bulletSpeed: 5,
            spreadCount: 6
        }
    },
    pyroclast: {
        id: 'pyroclast',
        name: "Pyroclast",
        subtitle: "Olovli Magma Sayyorasi",
        icon: "🌋",
        unlockedByDefault: false,
        cost: 450,
        difficulty: "★★☆☆☆",
        color: "#ff4d00",
        bgColor: "#160502",
        nebulaColor: "rgba(255, 60, 0, 0.15)",
        description: "Yuzasi qaynoq lava daryolari bilan qoplangan. Olov sochuvchi yirtqich maxluqlar va vulqon toshlari uchraydi.",
        coinMultiplier: 1.5,
        waveCount: 4,
        boss: {
            name: "Ignis Rex",
            title: "Magma Giganti",
            hp: 1400,
            color: "#ff5500",
            attackCooldown: 1500,
            bulletSpeed: 6.5,
            spreadCount: 8
        }
    },
    cryo9: {
        id: 'cryo9',
        name: "Cryo-9",
        subtitle: "Muzlagan Bo'ronlar Sayyorasi",
        icon: "❄️",
        unlockedByDefault: false,
        cost: 1100,
        difficulty: "★★★☆☆",
        color: "#00ffee",
        bgColor: "#021217",
        nebulaColor: "rgba(0, 255, 238, 0.15)",
        description: "Cheksiz muzlik va qor bo'ronlari hukmron. Bu yerdagi maxluqlar o'ta tez va o'tkir muz parchalarini otadi.",
        coinMultiplier: 2.0,
        waveCount: 4,
        boss: {
            name: "Cryo-Titan Zero",
            title: "Muzlik Hukmdori",
            hp: 2200,
            color: "#7df9ff",
            attackCooldown: 1300,
            bulletSpeed: 7.5,
            spreadCount: 10
        }
    },
    neon_prime: {
        id: 'neon_prime',
        name: "Neon-Prime",
        subtitle: "Kiber-Bio Metropol",
        icon: "🏙️",
        unlockedByDefault: false,
        cost: 2200,
        difficulty: "★★★★☆",
        color: "#e000ff",
        bgColor: "#120216",
        nebulaColor: "rgba(224, 0, 255, 0.15)",
        description: "Kiber virus bilan zararlangan robotlashgan maxluqlar va lazer tuzoqlari bilan to'la yuqori texnologik sayyora.",
        coinMultiplier: 2.8,
        waveCount: 5,
        boss: {
            name: "Overmind Alpha",
            title: "Kiber Intellekt Bos",
            hp: 3500,
            color: "#ff00bb",
            attackCooldown: 1100,
            bulletSpeed: 8.5,
            spreadCount: 12
        }
    },
    void_core: {
        id: 'void_core',
        name: "Void-Core",
        subtitle: "Zulmat Qora Tuynugi",
        icon: "🕳️",
        unlockedByDefault: false,
        cost: 4500,
        difficulty: "★★★★★",
        color: "#8400ff",
        bgColor: "#09010f",
        nebulaColor: "rgba(132, 0, 255, 0.22)",
        description: "Galaktika markazidagi sirli qora tuynuk. Barcha maxluqlarni boshqarayotgan qadimgi Zulmat Podshosi shu yerda!",
        coinMultiplier: 4.0,
        waveCount: 5,
        boss: {
            name: "ZYRON - Zulmat Hukmdori",
            title: "Afsonaviy Final Bos",
            hp: 5500,
            color: "#bf00ff",
            attackCooldown: 900,
            bulletSpeed: 9.5,
            spreadCount: 16
        }
    }
};

class PlanetManager {
    static getPlanet(id) {
        return PLANETS_DATA[id] || PLANETS_DATA.aethelgard;
    }

    static canUnlock(id) {
        const planet = this.getPlanet(id);
        const isUnlocked = window.gameStorage.data.unlockedPlanets.includes(id);
        return !isUnlocked && window.gameStorage.data.coins >= planet.cost;
    }

    static unlockPlanet(id) {
        const planet = this.getPlanet(id);
        if (this.canUnlock(id)) {
            window.gameStorage.spendCoins(planet.cost);
            window.gameStorage.data.unlockedPlanets.push(id);
            window.gameStorage.data.selectedPlanet = id;
            window.gameStorage.checkQuestsAndAchievements();
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playSuccess();
            return true;
        }
        return false;
    }

    static selectPlanet(id) {
        if (window.gameStorage.data.unlockedPlanets.includes(id)) {
            window.gameStorage.data.selectedPlanet = id;
            window.gameStorage.save();
            if (window.soundEngine) window.soundEngine.playClick();
            return true;
        }
        return false;
    }
}

window.PlanetManager = PlanetManager;
