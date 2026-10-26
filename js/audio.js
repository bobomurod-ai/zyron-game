/**
 * ZYRON - Audio Engine (Web Audio API)
 * 100% self-contained synthesized sounds & dynamic ambient synth music.
 * Zero external asset dependencies.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        this.musicNode = null;
        this.isMusicPlaying = false;
        this.musicInterval = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolumes(sfx, music) {
        this.sfxVolume = Math.max(0, Math.min(1, sfx));
        this.musicVolume = Math.max(0, Math.min(1, music));
    }

    // SFX: Blaster Shoot
    playShoot(type = 'photon') {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;

        if (type === 'plasma') {
            // Shotgun scatter thump
            for (let i = 0; i < 3; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(380 + i * 40, now + i * 0.01);
                osc.frequency.exponentialRampToValueAtTime(70, now + 0.15 + i * 0.01);
                gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.01);
                osc.stop(now + 0.18);
            }
            return;
        }

        if (type === 'laser') {
            // Piercing beam buzz
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(500, now + 0.12);
            gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
            return;
        }

        if (type === 'missile') {
            // Whoosh rocket launch
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(550, now + 0.2);
            gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.23);
            return;
        }

        if (type === 'ion') {
            // Deep cosmic pulse
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
            gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.36);
            return;
        }

        // Standard Photon Blaster (default)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // SFX: Explosion (Noise generator with decay)
    playExplosion(intensity = 'medium') {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;
        const dur = intensity === 'big' ? 0.6 : intensity === 'boss' ? 1.0 : 0.3;
        
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(intensity === 'boss' ? 300 : 600, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + dur);

        const gain = this.ctx.createGain();
        const vol = (intensity === 'big' ? 0.45 : intensity === 'boss' ? 0.6 : 0.25) * this.sfxVolume;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + dur);

        // Sub bass thump for impact
        if (intensity === 'big' || intensity === 'boss') {
            const osc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + dur * 0.8);
            subGain.gain.setValueAtTime(vol * 0.8, now);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);
            osc.connect(subGain);
            subGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + dur * 0.8);
        }
    }

    // SFX: Coin pickup chime
    playCoin() {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [987.77, 1318.51]; // B5, E6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.13);
        });
    }

    // SFX: Player Hurt
    playPlayerHurt() {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // SFX: Special Ability Trigger
    playSpecial() {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
        gain.gain.setValueAtTime(0.4 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
    }

    // SFX: UI Click
    playClick() {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // SFX: Success / Quest Done / Upgrade
    playSuccess() {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;
        const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
        chord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.3);
        });
    }

    // SFX: Dialogue character voice blip
    playDialogueBlip() {
        if (!this.ctx || this.sfxVolume <= 0) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450 + Math.random() * 200, now);
        gain.gain.setValueAtTime(0.04 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    // Dynamic Sci-Fi Ambient Synth Music (Zero mp3/wav files needed!)
    startMusic() {
        if (!this.ctx || this.isMusicPlaying) return;
        this.resume();
        this.isMusicPlaying = true;

        const bassNotes = [110, 110, 130.81, 146.83, 110, 98, 110, 164.81]; // A2, C3, D3, G2, E3
        let step = 0;

        this.musicInterval = setInterval(() => {
            if (!this.isMusicPlaying || this.musicVolume <= 0) return;
            try {
                const now = this.ctx.currentTime;
                // Bass synth pluck
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                const freq = bassNotes[step % bassNotes.length];
                osc.frequency.setValueAtTime(freq, now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);
                filter.frequency.exponentialRampToValueAtTime(150, now + 0.25);

                const vol = 0.12 * this.musicVolume;
                gain.gain.setValueAtTime(vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 0.28);

                // Cosmic Arp high note every 2 steps
                if (step % 2 === 0) {
                    const arpOsc = this.ctx.createOscillator();
                    const arpGain = this.ctx.createGain();
                    arpOsc.type = 'sine';
                    arpOsc.frequency.setValueAtTime(freq * 4, now + 0.05);
                    arpGain.gain.setValueAtTime(0.05 * this.musicVolume, now + 0.05);
                    arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                    arpOsc.connect(arpGain);
                    arpGain.connect(this.ctx.destination);
                    arpOsc.start(now + 0.05);
                    arpOsc.stop(now + 0.25);
                }

                step++;
            } catch (err) {
                // Ignore transient audio errors
            }
        }, 220); // 136 BPM feel
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

// Global sound instance
window.soundEngine = new SoundEngine();
