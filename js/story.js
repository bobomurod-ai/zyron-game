/**
 * ZYRON - 2D Story & Visual Dialogue System (Syujet)
 * Cinematic cutscenes, visual character dialogs, prologue, and planetary lore
 */

const STORY_CHARACTERS = {
    player: {
        name: "Kapitan Zaxar",
        title: "Koinot Himoyachisi",
        color: "#00f0ff",
        avatar: `<svg viewBox="0 0 100 100" class="avatar-svg">
            <defs>
                <radialGradient id="grad-cap" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#00f0ff" />
                    <stop offset="100%" stop-color="#004488" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="#0d1b2a" stroke="#00f0ff" stroke-width="3" />
            <!-- Pilot Helmet -->
            <path d="M 25 50 Q 50 15 75 50 L 70 75 Q 50 85 30 75 Z" fill="#1b263b" stroke="#00f0ff" stroke-width="2"/>
            <!-- Visor with glow -->
            <path d="M 32 45 Q 50 35 68 45 Q 65 60 50 62 Q 35 60 32 45 Z" fill="url(#grad-cap)" />
            <ellipse cx="44" cy="48" rx="8" ry="3" fill="#ffffff" opacity="0.7"/>
            <path d="M 40 75 L 60 75" stroke="#00f0ff" stroke-width="3"/>
        </svg>`
    },
    aria: {
        name: "A.R.I.A.",
        title: "Sun'iy Intellekt Maslahatchi",
        color: "#00ffcc",
        avatar: `<svg viewBox="0 0 100 100" class="avatar-svg">
            <circle cx="50" cy="50" r="45" fill="#041a1a" stroke="#00ffcc" stroke-width="3" />
            <!-- AI Hologram Core -->
            <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" fill="none" stroke="#00ffcc" stroke-width="2.5" />
            <circle cx="50" cy="50" r="16" fill="rgba(0, 255, 204, 0.25)" stroke="#00ffcc" stroke-width="2"/>
            <circle cx="50" cy="50" r="7" fill="#ffffff" />
            <line x1="20" y1="50" x2="80" y2="50" stroke="#00ffcc" stroke-width="1" stroke-dasharray="3,3"/>
            <line x1="50" y1="20" x2="50" y2="80" stroke="#00ffcc" stroke-width="1" stroke-dasharray="3,3"/>
        </svg>`
    },
    zyron_boss: {
        name: "Lord Zyron",
        title: "Zulmat Qora Tuynuk Hukmdori",
        color: "#bf00ff",
        avatar: `<svg viewBox="0 0 100 100" class="avatar-svg">
            <circle cx="50" cy="50" r="45" fill="#13011a" stroke="#bf00ff" stroke-width="3" />
            <!-- Alien Horns / Crown -->
            <path d="M 20 30 Q 35 15 50 30 Q 65 15 80 30 Q 65 55 50 65 Q 35 55 20 30 Z" fill="#2b003b" stroke="#ff007f" stroke-width="2" />
            <!-- Evil Glowing Eyes -->
            <ellipse cx="38" cy="45" rx="7" ry="3" fill="#ff0055" />
            <ellipse cx="62" cy="45" rx="7" ry="3" fill="#ff0055" />
            <ellipse cx="38" cy="45" rx="3" ry="1.5" fill="#ffff00" />
            <ellipse cx="62" cy="45" rx="3" ry="1.5" fill="#ffff00" />
            <path d="M 40 68 Q 50 60 60 68" stroke="#ff0055" stroke-width="2" fill="none"/>
        </svg>`
    }
};

const STORY_CUTSCENES = {
    prologue: {
        id: 'prologue',
        title: "Muqaddima: Koinot Zulmati",
        lines: [
            { speaker: 'aria', text: "Kapitan Zaxar, trevoga! Galaktika markazidagi qadimiy 'ZYRON Energiya Kristallari' zulmat maxluqlari tomonidan o'g'irlandi!" },
            { speaker: 'player', text: "Qanday qilib? Ularning kuchi butun yulduz tizimlarini yakson qilishga yetadi-ku!" },
            { speaker: 'aria', text: "To'g'ri. Hozirda 5 ta asosiy sayyorada maxluqlar to'dasi koinotni qamrab olmoqda. Ularning yetakchisi 'Lord Zyron' qora tuynuk tubida joylashgan." },
            { speaker: 'zyron_boss', text: "Hahahaha! Ojiz insonlar! Butun koinot tez orada abadiy qorong'ulikka g'arq bo'ladi! Hech kim mening maxluqlarimni to'xtata olmaydi!" },
            { speaker: 'player', text: "Xomxayollaringni yig'ishtir, maxluq! Kemam qurollarini to'liq jangovar shay holatga keltiraman. Sayyoralarni birma-bir ozod qilamiz!" },
            { speaker: 'aria', text: "Tizim tayyor, Kapitan. Dushmanlarni yo'q qilib tangalar yig'ing, kemani kuchaytiring va jumboqlarni yeching. Omad!" }
        ]
    },
    aethelgard_intro: {
        id: 'aethelgard_intro',
        title: "Aethelgard Orbiti: Hujum Boshlandi",
        lines: [
            { speaker: 'aria', text: "Kapitan, Aethelgard stansiyasi perimetriga kirdik. Dushman skanerlari bizni aniqladi." },
            { speaker: 'player', text: "Foton blasterlarini qizdiring! Ular stansiya yadro reaktoriga yaqinlashmasligi shart." },
            { speaker: 'aria', text: "Dushmanlar to'lqin bo'lib kelmoqda. Olov ochishga tayyorlaning!" }
        ]
    },
    pyroclast_intro: {
        id: 'pyroclast_intro',
        title: "Pyroclast: Magma Jahannami",
        lines: [
            { speaker: 'aria', text: "Ogohlantirish! Pyroclast sayyorasi harorati reaktorlarimizni qizdirmoqda. Olovli mutant maxluqlar yaqinlashmoqda." },
            { speaker: 'player', text: "Qalqon quvvatini oshir! Ularning olovli snaryadlaridan qochib, tezkor javob zarbasi beramiz." }
        ]
    },
    cryo9_intro: {
        id: 'cryo9_intro',
        title: "Cryo-9: Muzlagan Bo'ron",
        lines: [
            { speaker: 'player', text: "Dvigatellar muzlab qolmayaptimi, ARIA? Ko'rish masofasi o'ta past." },
            { speaker: 'aria', text: "Kriogen harorat datchiklarni susaytirmoqda. Muzlik Golem monsterlari to'g'ridan-to'g'ri biz tomon harakatlanmoqda. Ehtiyot bo'ling!" }
        ]
    },
    neon_prime_intro: {
        id: 'neon_prime_intro',
        title: "Neon-Prime: Kiber Urush",
        lines: [
            { speaker: 'aria', text: "Neon-Prime kiber-shahridamiz. Maxluqlar robototexnika tizimlarini buzib, lazerli qotillarga aylangan." },
            { speaker: 'player', text: "Biz ularning dastur kodini ham, vujudini ham lazer qurolimiz bilan yo'q qilamiz!" }
        ]
    },
    void_core_intro: {
        id: 'void_core_intro',
        title: "Void-Core: Yakuniy Hal qiluvchi Jang",
        lines: [
            { speaker: 'zyron_boss', text: "Shuncha yo'l bosib, o'limingni topish uchun keldinmi, Kapitan? Bu yerda hatto yorug'lik ham qochib qutula olmaydi!" },
            { speaker: 'player', text: "Men yolg'iz emasman, orqamda ozod qilingan galaktika bor! Sening zulmating bugun tugaydi, ZYRON!" },
            { speaker: 'aria', text: "Barcha tizimlar 100% yuklamada! Butun qurol-yarog'ni ishga soling, Kapitan!" }
        ]
    },
    victory_cutscene: {
        id: 'victory_cutscene',
        title: "G'alaba: Galaktika Najoti!",
        lines: [
            { speaker: 'zyron_boss', text: "Yo'q... Bu mumkin emas... Mening qudratli koinot imperiyam... Yo'q bo'lmoqda... Aaaargh!" },
            { speaker: 'player', text: "U quladi! Zyron qora tuynuk girdobida g'arq bo'ldi!" },
            { speaker: 'aria', text: "Kristallar kuchi qaytarildi. Sayyoralardagi maxluqlar chekindi. Siz koinot tarixidagi eng buyuk Qahramonsiz, Kapitan Zaxar!" },
            { speaker: 'player', text: "Bu bizning umumiy g'alabamiz. Galaktika endi tinch va erkin nafas oladi!" }
        ]
    }
};

class StoryManager {
    constructor() {
        this.currentCutscene = null;
        this.currentLineIndex = 0;
        this.typewriterInterval = null;
        this.isTyping = false;
        this.onFinishCallback = null;
    }

    playCutscene(cutsceneId, onFinish = null) {
        const cutscene = STORY_CUTSCENES[cutsceneId];
        if (!cutscene) {
            if (onFinish) onFinish();
            return;
        }

        this.currentCutscene = cutscene;
        this.currentLineIndex = 0;
        this.onFinishCallback = onFinish;

        const overlay = document.getElementById('story-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            this.showCurrentLine();
        }
    }

    showCurrentLine() {
        if (!this.currentCutscene) return;
        const line = this.currentCutscene.lines[this.currentLineIndex];
        const speaker = STORY_CHARACTERS[line.speaker] || STORY_CHARACTERS.player;

        const avatarContainer = document.getElementById('story-avatar-box');
        const nameEl = document.getElementById('story-speaker-name');
        const textEl = document.getElementById('story-text');
        const chapterTitleEl = document.getElementById('story-chapter-title');

        if (chapterTitleEl) chapterTitleEl.textContent = this.currentCutscene.title;
        if (avatarContainer) avatarContainer.innerHTML = speaker.avatar;
        if (nameEl) {
            nameEl.textContent = speaker.name + ` (${speaker.title})`;
            nameEl.style.color = speaker.color;
        }

        if (textEl) {
            textEl.textContent = '';
            this.isTyping = true;
            let charIdx = 0;
            const fullText = line.text;

            if (this.typewriterInterval) clearInterval(this.typewriterInterval);

            this.typewriterInterval = setInterval(() => {
                if (charIdx < fullText.length) {
                    textEl.textContent += fullText[charIdx];
                    if (charIdx % 3 === 0 && window.soundEngine) {
                        window.soundEngine.playDialogueBlip();
                    }
                    charIdx++;
                } else {
                    clearInterval(this.typewriterInterval);
                    this.isTyping = false;
                }
            }, 25);
        }
    }

    nextLine() {
        if (this.isTyping) {
            // Instantly complete current line
            if (this.typewriterInterval) clearInterval(this.typewriterInterval);
            const line = this.currentCutscene.lines[this.currentLineIndex];
            const textEl = document.getElementById('story-text');
            if (textEl) textEl.textContent = line.text;
            this.isTyping = false;
            return;
        }

        this.currentLineIndex++;
        if (this.currentLineIndex < this.currentCutscene.lines.length) {
            this.showCurrentLine();
        } else {
            this.closeStory();
        }
    }

    skipStory() {
        if (this.typewriterInterval) clearInterval(this.typewriterInterval);
        this.closeStory();
    }

    closeStory() {
        const overlay = document.getElementById('story-overlay');
        if (overlay) overlay.classList.add('hidden');
        const cb = this.onFinishCallback;
        this.currentCutscene = null;
        this.onFinishCallback = null;
        if (cb) cb();
    }
}

window.StoryManager = StoryManager;
window.storyManager = new StoryManager();
