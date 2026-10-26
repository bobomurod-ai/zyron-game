/**
 * ZYRON - 2D Core Game Engine
 * High-performance Canvas renderer, player ship physics, weapons, enemy AI, bosses, particles
 */

class ZyronGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 800;
        this.height = 600;

        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;

        // Entities
        this.player = null;
        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.drops = [];
        this.floatingTexts = [];
        this.stars = [];

        // Planet & Waves
        this.currentPlanet = null;
        this.currentWave = 1;
        this.totalWaves = 3;
        this.waveTimer = 0;
        this.enemiesToSpawn = 0;
        this.spawnTimer = 0;
        this.boss = null;
        this.bossSpawned = false;

        // Session Stats
        this.sessionCoins = 0;
        this.sessionKills = 0;
        this.sessionScore = 0;

        // Input
        this.keys = {};
        this.mouse = { x: 400, y: 300, isDown: false };
        this.screenShake = 0;

        // Touch input support
        this.touchMove = { active: false, startX: 0, startY: 0, curX: 0, curY: 0 };
    }

    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupInputs();
        this.initStars();
    }

    resize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        this.width = parent.clientWidth || 800;
        this.height = parent.clientHeight || 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code] = true;

            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (this.isRunning) this.togglePause();
            }
            if (e.code === 'Space') {
                this.triggerSpecialAbility();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.mouse.isDown = true;
        });

        window.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.mouse.isDown = true;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (e.touches.length === 0) this.mouse.isDown = false;
        }, { passive: false });
    }

    initStars() {
        this.stars = [];
        for (let i = 0; i < 120; i++) {
            this.stars.push({
                x: Math.random() * 2000,
                y: Math.random() * 2000,
                size: Math.random() * 2.2 + 0.6,
                speed: Math.random() * 1.5 + 0.3,
                brightness: Math.random() * 0.7 + 0.3
            });
        }
    }

    startBattle(planetId) {
        this.currentPlanet = PlanetManager.getPlanet(planetId);
        const heroId = window.gameStorage.data.selectedHero;
        const heroStats = HeroManager.getStats(heroId);
        const heroData = HeroManager.getHero(heroId);

        this.player = {
            x: this.width / 2,
            y: this.height - 100,
            radius: 20,
            heroId: heroId,
            heroData: heroData,
            stats: heroStats,
            hp: heroStats.hp,
            maxHp: heroStats.hp,
            shield: heroStats.shield,
            maxShield: heroStats.shield,
            shieldRegenTimer: 0,
            vx: 0,
            vy: 0,
            angle: -Math.PI / 2,
            shootTimer: 0,
            specialCd: 0,
            invulnerableTimer: 0,
            doubleDamageTimer: 0,
            shieldReflectActive: false,
            timeWarpActive: false,
            trailTimer: 0
        };

        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.drops = [];
        this.floatingTexts = [];

        this.currentWave = 1;
        this.totalWaves = this.currentPlanet.waveCount;
        this.boss = null;
        this.bossSpawned = false;
        this.sessionCoins = 0;
        this.sessionKills = 0;
        this.sessionScore = 0;

        this.prepareWave(this.currentWave);

        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();

        if (window.soundEngine) {
            window.soundEngine.startMusic();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    prepareWave(waveNum) {
        this.currentWave = waveNum;
        this.bossSpawned = false;
        this.boss = null;

        if (waveNum <= this.totalWaves) {
            this.enemiesToSpawn = 10 + waveNum * 6;
            this.spawnTimer = 500;
            this.showBanner(`TO'LQIN ${waveNum} / ${this.totalWaves}`, "#00f0ff");
        } else {
            // Boss Wave!
            this.spawnBoss();
        }
    }

    spawnBoss() {
        this.bossSpawned = true;
        this.enemiesToSpawn = 0;
        const pBoss = this.currentPlanet.boss;

        this.boss = {
            name: pBoss.name,
            title: pBoss.title,
            x: this.width / 2,
            y: -120,
            targetY: 140,
            radius: 55,
            hp: pBoss.hp,
            maxHp: pBoss.hp,
            color: pBoss.color,
            shootTimer: 1000,
            attackPatternTimer: 0,
            attackMode: 0,
            vx: 2.5,
            angle: Math.PI / 2,
            isBoss: true
        };

        if (window.soundEngine) window.soundEngine.playExplosion('boss');
        this.showBanner(`⚠️ DIQQAT: ${pBoss.name} YAQINLASHMOQDA!`, "#ff0055", 3000);
        this.screenShake = 15;
    }

    showBanner(text, color = "#00f0ff", duration = 2000) {
        const banner = document.getElementById('game-wave-banner');
        if (banner) {
            banner.textContent = text;
            banner.style.color = color;
            banner.style.textShadow = `0 0 20px ${color}`;
            banner.classList.remove('hidden');
            banner.classList.add('fade-in');
            setTimeout(() => {
                banner.classList.add('hidden');
            }, duration);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseModal = document.getElementById('pause-modal');
        if (pauseModal) {
            if (this.isPaused) pauseModal.classList.remove('hidden');
            else pauseModal.classList.add('hidden');
        }
    }

    triggerSpecialAbility() {
        if (!this.player || this.player.specialCd > 0) return;

        const h = this.player.heroId;
        this.player.specialCd = this.player.heroData.specialCd;

        if (window.soundEngine) window.soundEngine.playSpecial();

        if (h === 'scout') {
            // Hyper Dash
            this.player.invulnerableTimer = 1200;
            const moveAngle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
            this.player.vx = Math.cos(moveAngle) * 22;
            this.player.vy = Math.sin(moveAngle) * 22;
            this.createExplosionShockwave(this.player.x, this.player.y, "#00f0ff", 80);
            this.showFloatingText(this.player.x, this.player.y - 30, "HYPER DASH!", "#00f0ff");
        } else if (h === 'titan') {
            // Shield Overcharge
            this.player.shieldReflectActive = true;
            this.player.invulnerableTimer = 5000;
            this.showFloatingText(this.player.x, this.player.y - 30, "TITAN QALQONI!", "#ffaa00");
            setTimeout(() => {
                if (this.player) this.player.shieldReflectActive = false;
            }, 5000);
        } else if (h === 'phantom') {
            // Time Warp
            this.player.timeWarpActive = true;
            this.showFloatingText(this.player.x, this.player.y - 30, "VAQT BUZILISHI!", "#b026ff");
            setTimeout(() => {
                if (this.player) this.player.timeWarpActive = false;
            }, 4000);
        } else if (h === 'nova') {
            // Supernova Burst
            this.screenShake = 20;
            this.createExplosionShockwave(this.player.x, this.player.y, "#ffff00", 250);
            this.showFloatingText(this.player.x, this.player.y - 30, "SUPERNOVA!", "#ffff00");
            // Kill all non-boss enemies
            this.enemies.forEach(en => {
                if (!en.isBoss) {
                    this.killEnemy(en);
                } else {
                    en.hp -= 400;
                    this.showFloatingText(en.x, en.y, "-400 SUPERNOVA!", "#ffff00");
                }
            });
        }
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        const dt = Math.min((timestamp - this.lastTime), 100);
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update(dt);
        }
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(dt) {
        const timeScale = (this.player && this.player.timeWarpActive) ? 0.4 : 1.0;

        // Update Screen Shake
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 0.04);
        }

        // Update Player
        this.updatePlayer(dt);

        // Update Spawns
        this.updateSpawner(dt * timeScale);

        // Update Bullets
        this.updateBullets(dt);

        // Update Enemies
        this.updateEnemies(dt * timeScale);

        // Update Drops
        this.updateDrops(dt);

        // Update Particles
        this.updateParticles(dt);

        // Update Floating Text
        this.updateFloatingTexts(dt);

        // Check wave completion
        if (!this.bossSpawned && this.enemiesToSpawn <= 0 && this.enemies.length === 0) {
            this.prepareWave(this.currentWave + 1);
        }

        // Update HUD
        this.updateHUD();
    }

    updatePlayer(dt) {
        const p = this.player;
        if (!p) return;

        // Movement input
        let moveX = 0;
        let moveY = 0;
        if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
        if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
        if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

        // Normalize
        const len = Math.hypot(moveX, moveY);
        const speed = p.stats.speed;
        if (len > 0) {
            p.vx += (moveX / len) * speed * 0.25;
            p.vy += (moveY / len) * speed * 0.25;
        }

        // Friction
        p.vx *= 0.88;
        p.vy *= 0.88;

        p.x += p.vx;
        p.y += p.vy;

        // Boundaries
        p.x = Math.max(p.radius, Math.min(this.width - p.radius, p.x));
        p.y = Math.max(p.radius, Math.min(this.height - p.radius, p.y));

        // Aim towards mouse
        p.angle = Math.atan2(this.mouse.y - p.y, this.mouse.x - p.x);

        // Timers
        if (p.specialCd > 0) p.specialCd = Math.max(0, p.specialCd - dt);
        if (p.invulnerableTimer > 0) p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);
        if (p.doubleDamageTimer > 0) p.doubleDamageTimer = Math.max(0, p.doubleDamageTimer - dt);

        // Shield Regen (if not damaged recently)
        p.shieldRegenTimer += dt;
        if (p.shieldRegenTimer >= 3000 && p.shield < p.maxShield) {
            p.shield = Math.min(p.maxShield, p.shield + (dt * 0.02 * (1 + window.gameStorage.data.upgrades.shield * 0.1)));
        }

        // Shooting
        p.shootTimer += dt;
        const wpnId = window.gameStorage.data.selectedWeapon;
        const cd = WeaponManager.getEffectiveCooldown(wpnId);

        if (this.mouse.isDown && p.shootTimer >= cd) {
            this.firePlayerWeapon();
            p.shootTimer = 0;
        }

        // Thruster plume particles
        p.trailTimer += dt;
        if (p.trailTimer > 35) {
            p.trailTimer = 0;
            const rearX = p.x - Math.cos(p.angle) * 18;
            const rearY = p.y - Math.sin(p.angle) * 18;
            this.particles.push({
                x: rearX,
                y: rearY,
                vx: -Math.cos(p.angle) * (Math.random() * 3 + 2) + (Math.random() - 0.5) * 1.5,
                vy: -Math.sin(p.angle) * (Math.random() * 3 + 2) + (Math.random() - 0.5) * 1.5,
                radius: Math.random() * 3 + 2,
                color: p.heroData.color,
                life: 1.0,
                decay: 0.05
            });
        }
    }

    firePlayerWeapon() {
        const p = this.player;
        const wpnId = window.gameStorage.data.selectedWeapon;
        const wpn = WeaponManager.getWeapon(wpnId);
        const damage = WeaponManager.getEffectiveDamage(wpnId) * (p.doubleDamageTimer > 0 ? 2 : 1);

        if (window.soundEngine) window.soundEngine.playShoot(wpn.type);
        window.gameStorage.recordStat('shotsFired', 1);

        const count = wpn.bulletCount;
        const spread = wpn.bulletSpread;
        const baseAngle = p.angle;

        for (let i = 0; i < count; i++) {
            let angleOffset = 0;
            if (count > 1) {
                angleOffset = (i / (count - 1) - 0.5) * spread;
            }
            const bulletAngle = baseAngle + angleOffset;

            this.bullets.push({
                x: p.x + Math.cos(p.angle) * 22,
                y: p.y + Math.sin(p.angle) * 22,
                vx: Math.cos(bulletAngle) * wpn.bulletSpeed,
                vy: Math.sin(bulletAngle) * wpn.bulletSpeed,
                damage: damage,
                color: wpn.color,
                radius: wpn.bulletSize,
                tail: wpn.bulletTail,
                pierce: !!wpn.pierce,
                homing: !!wpn.homing,
                vortex: !!wpn.vortex,
                blastRadius: wpn.blastRadius || 0,
                type: wpn.type,
                life: 120 // frames
            });
        }
    }

    updateSpawner(dt) {
        if (this.bossSpawned) return;
        if (this.enemiesToSpawn <= 0) return;

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = Math.max(600, 1600 - this.currentWave * 200);
            this.spawnEnemy();
            this.enemiesToSpawn--;
        }
    }

    spawnEnemy() {
        const pId = this.currentPlanet.id;
        const types = ['drone', 'swarm'];
        if (this.currentWave >= 2) types.push('stalker');
        if (this.currentWave >= 3) types.push('golem');

        const chosenType = types[Math.floor(Math.random() * types.length)];
        const side = Math.floor(Math.random() * 3); // 0: Top, 1: Left, 2: Right
        let ex = 0, ey = 0;
        if (side === 0) { ex = Math.random() * this.width; ey = -30; }
        else if (side === 1) { ex = -30; ey = Math.random() * (this.height * 0.5); }
        else { ex = this.width + 30; ey = Math.random() * (this.height * 0.5); }

        let hp = 30 + this.currentWave * 15;
        let speed = 2.5;
        let radius = 16;
        let color = '#ff0055';

        if (chosenType === 'swarm') {
            hp = 18 + this.currentWave * 8;
            speed = 3.6;
            radius = 12;
            color = '#ffaa00';
        } else if (chosenType === 'stalker') {
            hp = 45 + this.currentWave * 20;
            speed = 3.0;
            radius = 18;
            color = '#b026ff';
        } else if (chosenType === 'golem') {
            hp = 110 + this.currentWave * 35;
            speed = 1.6;
            radius = 26;
            color = pId === 'pyroclast' ? '#ff4d00' : pId === 'cryo9' ? '#00ffee' : '#00ff88';
        }

        this.enemies.push({
            type: chosenType,
            x: ex,
            y: ey,
            vx: 0,
            vy: 0,
            radius: radius,
            hp: hp,
            maxHp: hp,
            speed: speed,
            color: color,
            shootTimer: Math.random() * 2000 + 1000,
            angle: 0
        });
    }

    updateBullets(dt) {
        // Player Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];

            // Homing logic
            if (b.homing && this.enemies.length > 0) {
                let nearest = null;
                let minDist = 99999;
                for (const en of this.enemies) {
                    const d = Math.hypot(en.x - b.x, en.y - b.y);
                    if (d < minDist) {
                        minDist = d;
                        nearest = en;
                    }
                }
                if (nearest) {
                    const targetAngle = Math.atan2(nearest.y - b.y, nearest.x - b.x);
                    const curAngle = Math.atan2(b.vy, b.vx);
                    let diff = targetAngle - curAngle;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    const turn = Math.sign(diff) * Math.min(Math.abs(diff), 0.12);
                    const speed = Math.hypot(b.vx, b.vy);
                    b.vx = Math.cos(curAngle + turn) * speed;
                    b.vy = Math.sin(curAngle + turn) * speed;
                }
            }

            b.x += b.vx;
            b.y += b.vy;
            b.life--;

            // Collision with enemies
            let bulletConsumed = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const en = this.enemies[j];
                const dist = Math.hypot(en.x - b.x, en.y - b.y);

                if (dist < en.radius + b.radius) {
                    // Critical hit check
                    const isCrit = Math.random() < this.player.stats.critChance;
                    let finalDmg = isCrit ? Math.floor(b.damage * this.player.stats.critMult) : b.damage;

                    en.hp -= finalDmg;
                    this.showFloatingText(en.x, en.y - 15, isCrit ? `CRIT! -${finalDmg}` : `-${finalDmg}`, isCrit ? '#ffd700' : '#ffffff');
                    this.createHitSparks(b.x, b.y, b.color);

                    // Blast radius / Vortex
                    if (b.blastRadius > 0) {
                        this.createExplosionShockwave(b.x, b.y, b.color, b.blastRadius);
                        this.enemies.forEach(otherEn => {
                            if (otherEn !== en) {
                                const dOther = Math.hypot(otherEn.x - b.x, otherEn.y - b.y);
                                if (dOther < b.blastRadius) {
                                    otherEn.hp -= Math.floor(finalDmg * 0.6);
                                    this.showFloatingText(otherEn.x, otherEn.y, `-${Math.floor(finalDmg * 0.6)}`, '#ffaa00');
                                }
                            }
                        });
                    }

                    if (en.hp <= 0) {
                        this.killEnemy(en);
                    }

                    if (!b.pierce) {
                        bulletConsumed = true;
                        break;
                    }
                }
            }

            if (bulletConsumed || b.life <= 0 || b.x < -50 || b.x > this.width + 50 || b.y < -50 || b.y > this.height + 50) {
                this.bullets.splice(i, 1);
            }
        }

        // Enemy Bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const eb = this.enemyBullets[i];
            eb.x += eb.vx;
            eb.y += eb.vy;

            // Collision with Player
            const p = this.player;
            if (p) {
                const dist = Math.hypot(p.x - eb.x, p.y - eb.y);
                if (dist < p.radius + eb.radius) {
                    // Titan reflect?
                    if (p.shieldReflectActive) {
                        eb.vx = -eb.vx * 1.5;
                        eb.vy = -eb.vy * 1.5;
                        this.bullets.push({ ...eb, damage: 40, color: '#ffaa00' });
                        this.enemyBullets.splice(i, 1);
                        continue;
                    }

                    if (p.invulnerableTimer <= 0) {
                        this.damagePlayer(eb.damage || 15);
                    }
                    this.createHitSparks(eb.x, eb.y, '#ff0055');
                    this.enemyBullets.splice(i, 1);
                    continue;
                }
            }

            if (eb.x < -30 || eb.x > this.width + 30 || eb.y < -30 || eb.y > this.height + 30) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    updateEnemies(dt) {
        const p = this.player;

        // If boss exists, update boss
        if (this.boss) {
            this.updateBoss(dt);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const en = this.enemies[i];
            if (en.isBoss) continue;

            // AI movement
            if (p) {
                const angle = Math.atan2(p.y - en.y, p.x - en.x);
                en.angle = angle;

                if (en.type === 'swarm') {
                    // Direct charge
                    en.vx = Math.cos(angle) * en.speed;
                    en.vy = Math.sin(angle) * en.speed;
                } else if (en.type === 'drone') {
                    // Strafe while moving down
                    en.vx = Math.sin(Date.now() * 0.003 + i) * en.speed * 1.2;
                    en.vy = en.speed * 0.7;
                } else if (en.type === 'stalker') {
                    // Flank player
                    const flankAngle = angle + (i % 2 === 0 ? 0.8 : -0.8);
                    en.vx = Math.cos(flankAngle) * en.speed;
                    en.vy = Math.sin(flankAngle) * en.speed;
                } else if (en.type === 'golem') {
                    en.vx = Math.cos(angle) * en.speed * 0.5;
                    en.vy = Math.sin(angle) * en.speed * 0.5;
                }

                en.x += en.vx;
                en.y += en.vy;

                // Enemy shooting
                en.shootTimer -= dt;
                if (en.shootTimer <= 0) {
                    en.shootTimer = en.type === 'golem' ? 1800 : 2500;
                    this.fireEnemyBullet(en);
                }

                // Melee contact with player
                const dist = Math.hypot(p.x - en.x, p.y - en.y);
                if (dist < p.radius + en.radius) {
                    if (p.invulnerableTimer <= 0) {
                        this.damagePlayer(en.type === 'golem' ? 30 : 15);
                    }
                    if (en.type === 'swarm') {
                        this.killEnemy(en, false);
                    }
                }
            }

            // Remove out of bounds (bottom)
            if (en.y > this.height + 60) {
                this.enemies.splice(i, 1);
            }
        }
    }

    fireEnemyBullet(en) {
        if (!this.player) return;
        const angle = Math.atan2(this.player.y - en.y, this.player.x - en.x);
        const speed = 4.5;

        if (en.type === 'golem') {
            // Triple spread
            for (let offset of [-0.3, 0, 0.3]) {
                this.enemyBullets.push({
                    x: en.x,
                    y: en.y,
                    vx: Math.cos(angle + offset) * speed,
                    vy: Math.sin(angle + offset) * speed,
                    radius: 6,
                    color: en.color,
                    damage: 18
                });
            }
        } else {
            this.enemyBullets.push({
                x: en.x,
                y: en.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4,
                color: '#ff0055',
                damage: 12
            });
        }
    }

    updateBoss(dt) {
        const b = this.boss;
        if (!b) return;

        // Move into view
        if (b.y < b.targetY) {
            b.y += 1.5;
            return;
        }

        // Horizontal sway
        b.x += b.vx;
        if (b.x < 100 || b.x > this.width - 100) {
            b.vx = -b.vx;
        }

        // Attack routine
        b.attackPatternTimer += dt;
        if (b.attackPatternTimer > 2500) {
            b.attackPatternTimer = 0;
            b.attackMode = (b.attackMode + 1) % 3;
        }

        b.shootTimer -= dt;
        if (b.shootTimer <= 0) {
            b.shootTimer = this.currentPlanet.boss.attackCooldown;
            const pBoss = this.currentPlanet.boss;

            if (b.attackMode === 0) {
                // Radial ring
                const count = pBoss.spreadCount;
                for (let i = 0; i < count; i++) {
                    const ang = (i / count) * Math.PI * 2 + Date.now() * 0.001;
                    this.enemyBullets.push({
                        x: b.x,
                        y: b.y,
                        vx: Math.cos(ang) * pBoss.bulletSpeed,
                        vy: Math.sin(ang) * pBoss.bulletSpeed,
                        radius: 6,
                        color: b.color,
                        damage: 18
                    });
                }
            } else if (b.attackMode === 1 && this.player) {
                // Direct barrage aimed at player
                const ang = Math.atan2(this.player.y - b.y, this.player.x - b.x);
                for (let i = -2; i <= 2; i++) {
                    this.enemyBullets.push({
                        x: b.x,
                        y: b.y,
                        vx: Math.cos(ang + i * 0.15) * (pBoss.bulletSpeed * 1.2),
                        vy: Math.sin(ang + i * 0.15) * (pBoss.bulletSpeed * 1.2),
                        radius: 5,
                        color: '#ff0055',
                        damage: 15
                    });
                }
            } else {
                // Spiral waves
                for (let i = 0; i < 4; i++) {
                    const ang = (Date.now() * 0.004) + (i * Math.PI / 2);
                    this.enemyBullets.push({
                        x: b.x,
                        y: b.y,
                        vx: Math.cos(ang) * (pBoss.bulletSpeed * 0.9),
                        vy: Math.sin(ang) * (pBoss.bulletSpeed * 0.9),
                        radius: 6,
                        color: '#ffff00',
                        damage: 16
                    });
                }
            }
        }

        // Check if boss died
        if (b.hp <= 0) {
            this.killBoss();
        }
    }

    damagePlayer(amount) {
        const p = this.player;
        if (!p) return;

        p.shieldRegenTimer = 0; // Reset shield regen delay
        this.screenShake = 12;

        if (window.soundEngine) window.soundEngine.playPlayerHurt();

        if (p.shield > 0) {
            if (p.shield >= amount) {
                p.shield -= amount;
                amount = 0;
            } else {
                amount -= p.shield;
                p.shield = 0;
            }
        }

        if (amount > 0) {
            p.hp -= amount;
            this.showFloatingText(p.x, p.y - 20, `-${amount}`, '#ff0055');
        }

        if (p.hp <= 0) {
            this.gameOver(false);
        }
    }

    killEnemy(en, dropItems = true) {
        const idx = this.enemies.indexOf(en);
        if (idx !== -1) this.enemies.splice(idx, 1);

        if (window.soundEngine) window.soundEngine.playExplosion(en.type === 'golem' ? 'big' : 'medium');
        this.createExplosionShockwave(en.x, en.y, en.color, en.radius * 2);

        this.sessionKills++;
        this.sessionScore += en.maxHp * 10;
        window.gameStorage.recordStat('enemiesKilled', 1);

        if (dropItems) {
            // Drop coins based on planet multiplier
            const coinCount = Math.floor((Math.random() * 2 + 1) * this.currentPlanet.coinMultiplier);
            for (let c = 0; c < coinCount; c++) {
                this.drops.push({
                    type: 'coin',
                    x: en.x + (Math.random() - 0.5) * 20,
                    y: en.y + (Math.random() - 0.5) * 20,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    value: Math.floor(10 * this.currentPlanet.coinMultiplier),
                    radius: 9,
                    life: 600
                });
            }

            // Rare drops: Medkit, Shield, Nuke
            const rand = Math.random();
            if (rand < 0.08) {
                this.drops.push({
                    type: 'health',
                    x: en.x,
                    y: en.y,
                    vx: 0,
                    vy: 1,
                    radius: 12,
                    life: 600
                });
            } else if (rand < 0.15) {
                this.drops.push({
                    type: 'shield',
                    x: en.x,
                    y: en.y,
                    vx: 0,
                    vy: 1,
                    radius: 12,
                    life: 600
                });
            } else if (rand < 0.18) {
                this.drops.push({
                    type: 'boost',
                    x: en.x,
                    y: en.y,
                    vx: 0,
                    vy: 1,
                    radius: 12,
                    life: 600
                });
            }
        }
    }

    killBoss() {
        const b = this.boss;
        this.boss = null;
        this.screenShake = 25;
        if (window.soundEngine) window.soundEngine.playExplosion('boss');

        // Multi explosions
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createExplosionShockwave(
                    b.x + (Math.random() - 0.5) * 100,
                    b.y + (Math.random() - 0.5) * 100,
                    b.color,
                    80
                );
            }, i * 80);
        }

        window.gameStorage.recordStat('bossesDefeated', 1);

        // Huge coin chest drop!
        const bossCoins = Math.floor(400 * this.currentPlanet.coinMultiplier);
        this.sessionCoins += bossCoins;
        window.gameStorage.addCoins(bossCoins);
        this.showFloatingText(b.x, b.y, `+${bossCoins} 💰 BOS MUKOFOTI!`, '#ffd700');

        setTimeout(() => {
            this.planetVictory();
        }, 2000);
    }

    updateDrops(dt) {
        const p = this.player;
        if (!p) return;

        const magnetRadius = p.stats.magnet;

        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            drop.life -= dt;

            // Magnet attraction
            const dist = Math.hypot(p.x - drop.x, p.y - drop.y);
            if (dist < magnetRadius) {
                const angle = Math.atan2(p.y - drop.y, p.x - drop.x);
                const pullSpeed = 7 + (1 - dist / magnetRadius) * 8;
                drop.x += Math.cos(angle) * pullSpeed;
                drop.y += Math.sin(angle) * pullSpeed;
            } else {
                drop.x += drop.vx || 0;
                drop.y += drop.vy || 0;
                if (drop.vx) drop.vx *= 0.95;
                if (drop.vy) drop.vy *= 0.95;
            }

            // Pickup check
            if (dist < p.radius + drop.radius) {
                if (drop.type === 'coin') {
                    if (window.soundEngine) window.soundEngine.playCoin();
                    this.sessionCoins += drop.value;
                    window.gameStorage.addCoins(drop.value);
                    this.showFloatingText(drop.x, drop.y, `+${drop.value} 💰`, '#ffd700');
                } else if (drop.type === 'health') {
                    p.hp = Math.min(p.maxHp, p.hp + 40);
                    if (window.soundEngine) window.soundEngine.playSuccess();
                    this.showFloatingText(p.x, p.y - 20, "+40 HP ❤️", "#00ff88");
                } else if (drop.type === 'shield') {
                    p.shield = p.maxShield;
                    if (window.soundEngine) window.soundEngine.playSuccess();
                    this.showFloatingText(p.x, p.y - 20, "QALQON TO'LDI 🛡️", "#00d4ff");
                } else if (drop.type === 'boost') {
                    p.doubleDamageTimer = 8000;
                    if (window.soundEngine) window.soundEngine.playSuccess();
                    this.showFloatingText(p.x, p.y - 20, "2X ZARBA! ⚡", "#ffaa00");
                }

                this.drops.splice(i, 1);
                continue;
            }

            if (drop.life <= 0) {
                this.drops.splice(i, 1);
            }
        }
    }

    createHitSparks(x, y, color) {
        for (let i = 0; i < 6; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 4 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: Math.random() * 2.5 + 1,
                color: color,
                life: 1.0,
                decay: 0.08
            });
        }
    }

    createExplosionShockwave(x, y, color, maxRadius = 60) {
        for (let i = 0; i < 20; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = Math.random() * 6 + 2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: Math.random() * 4 + 2,
                color: color,
                life: 1.0,
                decay: 0.04
            });
        }
    }

    showFloatingText(x, y, text, color = '#ffffff') {
        this.floatingTexts.push({
            x: x,
            y: y,
            text: text,
            color: color,
            alpha: 1.0,
            vy: -1.2
        });
    }

    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= 0.02;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life -= pt.decay;
            if (pt.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateHUD() {
        const p = this.player;
        if (!p) return;

        const hpBar = document.getElementById('hud-hp-bar');
        const shieldBar = document.getElementById('hud-shield-bar');
        const hpText = document.getElementById('hud-hp-text');
        const shieldText = document.getElementById('hud-shield-text');
        const coinText = document.getElementById('hud-coins');
        const waveText = document.getElementById('hud-wave');
        const specialBtn = document.getElementById('hud-special-btn');
        const specialCdText = document.getElementById('hud-special-cd');

        if (hpBar) hpBar.style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
        if (shieldBar) shieldBar.style.width = `${Math.max(0, (p.shield / p.maxShield) * 100)}%`;
        if (hpText) hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
        if (shieldText) shieldText.textContent = `${Math.ceil(p.shield)} / ${p.maxShield}`;
        if (coinText) coinText.textContent = `${window.gameStorage.data.coins} 💰`;
        if (waveText) waveText.textContent = this.boss ? `BOS JANGI` : `To'lqin: ${this.currentWave}/${this.totalWaves}`;

        if (specialBtn && specialCdText) {
            if (p.specialCd > 0) {
                specialCdText.textContent = `${(p.specialCd / 1000).toFixed(1)}s`;
                specialBtn.classList.add('disabled');
            } else {
                specialCdText.textContent = 'TAYYOR';
                specialBtn.classList.remove('disabled');
            }
        }

        // Boss Bar
        const bossBarContainer = document.getElementById('boss-hud-container');
        const bossHpBar = document.getElementById('boss-hp-bar');
        const bossNameEl = document.getElementById('boss-name-text');

        if (this.boss && bossBarContainer && bossHpBar && bossNameEl) {
            bossBarContainer.classList.remove('hidden');
            bossNameEl.textContent = `${this.boss.name} (${this.boss.title})`;
            bossHpBar.style.width = `${Math.max(0, (this.boss.hp / this.boss.maxHp) * 100)}%`;
        } else if (bossBarContainer) {
            bossBarContainer.classList.add('hidden');
        }
    }

    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.save();

        // Screen Shake
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake;
            const sy = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(sx, sy);
        }

        // Background
        this.renderBackground(ctx);

        // Drops
        this.renderDrops(ctx);

        // Particles
        this.renderParticles(ctx);

        // Enemies
        for (const en of this.enemies) {
            this.renderEnemy(ctx, en);
        }

        // Boss
        if (this.boss) {
            this.renderBoss(ctx, this.boss);
        }

        // Bullets
        this.renderBullets(ctx);

        // Player Ship
        if (this.player) {
            this.renderPlayer(ctx, this.player);
        }

        // Floating texts
        this.renderFloatingTexts(ctx);

        ctx.restore();
    }

    renderBackground(ctx) {
        // Gradient based on planet
        const bg = this.currentPlanet ? this.currentPlanet.bgColor : '#050b18';
        const nebula = this.currentPlanet ? this.currentPlanet.nebulaColor : 'rgba(0,180,255,0.1)';

        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Nebula glow
        const grad = ctx.createRadialGradient(this.width / 2, this.height / 3, 50, this.width / 2, this.height / 3, this.width * 0.7);
        grad.addColorStop(0, nebula);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Starfield
        ctx.fillStyle = '#ffffff';
        for (const s of this.stars) {
            s.y += s.speed;
            if (s.y > this.height) s.y = 0;
            ctx.globalAlpha = s.brightness;
            ctx.fillRect(s.x % this.width, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1.0;
    }

    renderPlayer(ctx, p) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        // Invulnerable / Shield shimmer
        if (p.invulnerableTimer > 0 || p.shieldReflectActive) {
            ctx.beginPath();
            ctx.arc(0, 0, p.radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = p.shieldReflectActive ? '#ffaa00' : '#00f0ff';
            ctx.lineWidth = 3;
            ctx.shadowColor = p.shieldReflectActive ? '#ffaa00' : '#00f0ff';
            ctx.shadowBlur = 15;
            ctx.stroke();
        }

        // Main Ship Hull (Crisp Sci-Fi Vector Polygon)
        ctx.shadowColor = p.heroData.color;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        // Nose
        ctx.moveTo(p.radius + 6, 0);
        // Right wing
        ctx.lineTo(-p.radius, p.radius);
        ctx.lineTo(-p.radius * 0.4, p.radius * 0.4);
        // Rear
        ctx.lineTo(-p.radius * 0.7, 0);
        // Left wing
        ctx.lineTo(-p.radius * 0.4, -p.radius * 0.4);
        ctx.lineTo(-p.radius, -p.radius);
        ctx.closePath();

        ctx.fillStyle = '#101c36';
        ctx.fill();
        ctx.strokeStyle = p.heroData.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Cockpit canopy
        ctx.beginPath();
        ctx.ellipse(2, 0, 8, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.heroData.accent || '#ffffff';
        ctx.fill();

        ctx.restore();
    }

    renderEnemy(ctx, en) {
        ctx.save();
        ctx.translate(en.x, en.y);
        ctx.rotate(en.angle);

        ctx.shadowColor = en.color;
        ctx.shadowBlur = 10;

        if (en.type === 'swarm') {
            // Alien bug shape
            ctx.beginPath();
            ctx.moveTo(en.radius, 0);
            ctx.lineTo(-en.radius, en.radius * 0.8);
            ctx.lineTo(-en.radius * 0.5, 0);
            ctx.lineTo(-en.radius, -en.radius * 0.8);
            ctx.closePath();
            ctx.fillStyle = en.color;
            ctx.fill();
        } else if (en.type === 'golem') {
            // Heavy armored octagon
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const ang = (i / 8) * Math.PI * 2;
                const r = en.radius;
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = '#1f1025';
            ctx.fill();
            ctx.strokeStyle = en.color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Core eye
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fillStyle = en.color;
            ctx.fill();
        } else {
            // Recon Drone / Stalker
            ctx.beginPath();
            ctx.moveTo(en.radius, 0);
            ctx.lineTo(-en.radius * 0.7, en.radius * 0.7);
            ctx.lineTo(-en.radius * 0.3, 0);
            ctx.lineTo(-en.radius * 0.7, -en.radius * 0.7);
            ctx.closePath();
            ctx.fillStyle = '#220818';
            ctx.fill();
            ctx.strokeStyle = en.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();

        // Mini HP Bar over enemies
        if (en.hp < en.maxHp) {
            const barW = en.radius * 2;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(en.x - barW / 2, en.y - en.radius - 8, barW, 4);
            ctx.fillStyle = en.color;
            ctx.fillRect(en.x - barW / 2, en.y - en.radius - 8, barW * (en.hp / en.maxHp), 4);
        }
    }

    renderBoss(ctx, b) {
        ctx.save();
        ctx.translate(b.x, b.y);

        ctx.shadowColor = b.color;
        ctx.shadowBlur = 20;

        // Giant Boss Hull
        ctx.beginPath();
        ctx.moveTo(0, b.radius + 10);
        ctx.lineTo(b.radius + 20, 0);
        ctx.lineTo(b.radius * 0.7, -b.radius * 0.8);
        ctx.lineTo(0, -b.radius * 0.4);
        ctx.lineTo(-b.radius * 0.7, -b.radius * 0.8);
        ctx.lineTo(-b.radius - 20, 0);
        ctx.closePath();

        ctx.fillStyle = '#12041a';
        ctx.fill();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Boss Reactor Core Pulse
        const pulse = Math.sin(Date.now() * 0.006) * 5;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        ctx.restore();
    }

    renderBullets(ctx) {
        // Player Bullets
        for (const b of this.bullets) {
            ctx.save();
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = b.color;

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            // Laser tail line
            if (b.tail) {
                const spd = Math.hypot(b.vx, b.vy);
                const nx = b.vx / spd;
                const ny = b.vy / spd;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.lineTo(b.x - nx * b.tail, b.y - ny * b.tail);
                ctx.strokeStyle = b.color;
                ctx.lineWidth = b.radius * 1.5;
                ctx.stroke();
            }
            ctx.restore();
        }

        // Enemy Bullets
        for (const eb of this.enemyBullets) {
            ctx.save();
            ctx.shadowColor = eb.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = eb.color;
            ctx.beginPath();
            ctx.arc(eb.x, eb.y, eb.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    renderDrops(ctx) {
        for (const d of this.drops) {
            ctx.save();
            ctx.translate(d.x, d.y);

            if (d.type === 'coin') {
                // Spinning golden coin
                const rot = (Date.now() * 0.005) % (Math.PI * 2);
                const widthScale = Math.abs(Math.cos(rot));
                ctx.scale(widthScale, 1);
                ctx.shadowColor = '#ffd700';
                ctx.shadowBlur = 10;

                ctx.beginPath();
                ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd700';
                ctx.fill();
                ctx.strokeStyle = '#fff8b0';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#b8860b';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Z', 0, 1);
            } else if (d.type === 'health') {
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+', 0, 1);
            } else if (d.type === 'shield') {
                ctx.fillStyle = '#00d4ff';
                ctx.beginPath();
                ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('S', 0, 1);
            } else if (d.type === 'boost') {
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(0, 0, d.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('2X', 0, 1);
            }

            ctx.restore();
        }
    }

    renderParticles(ctx) {
        for (const pt of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, pt.life);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    renderFloatingTexts(ctx) {
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = ft.color;
            ctx.shadowBlur = 6;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    planetVictory() {
        this.isRunning = false;
        if (window.soundEngine) {
            window.soundEngine.playSuccess();
            window.soundEngine.stopMusic();
        }

        window.gameStorage.recordStat('planetsCompleted', 1);

        // Auto unlock next planet if possible
        const planetKeys = Object.keys(PLANETS_DATA);
        const curIdx = planetKeys.indexOf(this.currentPlanet.id);
        if (curIdx < planetKeys.length - 1) {
            const nextPlanetId = planetKeys[curIdx + 1];
            if (!window.gameStorage.data.unlockedPlanets.includes(nextPlanetId)) {
                window.gameStorage.data.unlockedPlanets.push(nextPlanetId);
                window.gameStorage.save();
            }
        }

        const winModal = document.getElementById('victory-modal');
        const winCoinsEl = document.getElementById('win-coins-summary');
        const winKillsEl = document.getElementById('win-kills-summary');
        const winPlanetNameEl = document.getElementById('win-planet-name');

        if (winCoinsEl) winCoinsEl.textContent = `+${this.sessionCoins} 💰`;
        if (winKillsEl) winKillsEl.textContent = `${this.sessionKills}`;
        if (winPlanetNameEl) winPlanetNameEl.textContent = this.currentPlanet.name;

        if (winModal) winModal.classList.remove('hidden');

        // Check if final boss
        if (this.currentPlanet.id === 'void_core') {
            setTimeout(() => {
                if (window.storyManager) {
                    window.storyManager.playCutscene('victory_cutscene');
                }
            }, 1000);
        }
    }

    gameOver(isVictory = false) {
        this.isRunning = false;
        if (window.soundEngine) {
            window.soundEngine.stopMusic();
            window.soundEngine.playExplosion('big');
        }

        const overModal = document.getElementById('gameover-modal');
        const overCoinsEl = document.getElementById('over-coins-summary');
        const overKillsEl = document.getElementById('over-kills-summary');

        if (overCoinsEl) overCoinsEl.textContent = `+${this.sessionCoins} 💰`;
        if (overKillsEl) overKillsEl.textContent = `${this.sessionKills}`;

        if (overModal) overModal.classList.remove('hidden');
    }

    exitToMainMenu() {
        this.isRunning = false;
        this.isPaused = false;
        if (window.soundEngine) window.soundEngine.stopMusic();

        // Hide game screen, show main menu
        const gameScreen = document.getElementById('game-screen');
        const menuScreen = document.getElementById('main-menu-screen');
        const pauseModal = document.getElementById('pause-modal');
        const winModal = document.getElementById('victory-modal');
        const overModal = document.getElementById('gameover-modal');

        if (gameScreen) gameScreen.classList.add('hidden');
        if (pauseModal) pauseModal.classList.add('hidden');
        if (winModal) winModal.classList.add('hidden');
        if (overModal) overModal.classList.add('hidden');
        if (menuScreen) menuScreen.classList.remove('hidden');

        if (window.uiManager) window.uiManager.updateTopBar();
    }
}

window.ZyronGame = ZyronGame;
window.zyronGame = new ZyronGame();
