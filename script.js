let audioCtx = null;
let currentPhase = 1;
let difficulty = 'medium'; // easy, medium, hard
let lameMode = false;      // audio-free ugly grey mode
let highDetail = true;     // high detail vs simple graphics
let gameState = 'MENU';
let score = 0;
let streak = 0;
let maxStreak = 0;
let totalHits = 0;
let totalNotes = 0;
let currentBeat = 0;
let bpm = 120;
let beatIntervalMs = (60 / bpm) * 1000;
let rhythmTimer = null;
let menuMusicTimer = null;
let menuBeatCounter = 0;
let songStartTime = 0;
let songDurationBeats = 40;
let activeBeatsQueue = [];

function initAudio() {
    if (lameMode) return;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Procedural Web Audio API Sound Generator
function playSound(freq, type = 'square', duration = 0.08, vol = 0.15) {
    if (lameMode) return;
    try {
        if (!audioCtx) return;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

// Bouncy Menu Chiptune Loop
function startMenuMusic() {
    if (menuMusicTimer) clearInterval(menuMusicTimer);
    menuBeatCounter = 0;
    let funkyNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 440.00, 349.23];
    
    menuMusicTimer = setInterval(() => {
        if (gameState !== 'MENU' || lameMode) return;
        initAudio();
        let freq = funkyNotes[menuBeatCounter % funkyNotes.length];
        let bassFreq = [130.81, 110.00, 98.00, 116.54][Math.floor(menuBeatCounter / 2) % 4];
        
        playSound(freq, 'square', 0.1, 0.12);
        if (menuBeatCounter % 2 === 0) {
            playSound(bassFreq, 'triangle', 0.15, 0.18);
        }
        menuBeatCounter++;
    }, 250);
}

function setDifficulty(diff) {
    difficulty = diff;
    ['easy', 'medium', 'hard'].forEach(d => {
        let btn = document.getElementById(`btn-diff-${d}`);
        if (d === diff) {
            btn.className = 'px-2 py-0.5 rounded-lg bg-amber-400 cursor-pointer font-black';
        } else {
            btn.className = 'px-2 py-0.5 rounded-lg bg-gray-200 cursor-pointer text-gray-700';
        }
    });
}

function openOptions() {
    initAudio();
    document.getElementById('modal-options').classList.remove('hidden');
}

function closeOptions() {
    document.getElementById('modal-options').classList.add('hidden');
}

function toggleLameMode() {
    lameMode = !lameMode;
    let btn = document.getElementById('btn-lame-toggle');
    let header = document.getElementById('main-header');
    let viewport = document.getElementById('viewport-container');
    let headerTitle = document.getElementById('header-title');
    let headerIcon = document.getElementById('header-icon');

    if (lameMode) {
        btn.innerHTML = '<span>📺 Audio-Free: LAME ON</span>';
        header.classList.add('lame-mode');
        viewport.classList.add('lame-mode');
        headerTitle.innerText = 'PROG_TERM.EXE';
        headerIcon.innerText = '[#]';
        if (menuMusicTimer) clearInterval(menuMusicTimer);
    } else {
        btn.innerHTML = '<span>🔊 Normal Audio</span>';
        header.classList.remove('lame-mode');
        viewport.classList.remove('lame-mode');
        headerTitle.innerText = 'COFFEE BEATS';
        headerIcon.innerText = '☕';
        startMenuMusic();
    }
}

function toggleVideoQuality() {
    highDetail = !highDetail;
    let btn = document.getElementById('btn-video-toggle');
    if (highDetail) {
        btn.innerHTML = '<span>✨ High Quality</span>';
    } else {
        btn.innerHTML = '<span>⚡ Simple Graphics</span>';
    }
}

function promptLeaveGame() {
    initAudio();
    document.getElementById('modal-leave').classList.remove('hidden');
}

function closeLeaveModal() {
    document.getElementById('modal-leave').classList.add('hidden');
}

function executeLeaveGame() {
    document.getElementById('modal-leave').classList.add('hidden');
    if (menuMusicTimer) clearInterval(menuMusicTimer);
    document.getElementById('viewport-container').innerHTML = `
        <div class="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6 space-y-3 z-50">
            <div class="text-4xl">🧊☕</div>
            <h2 class="text-2xl font-black text-white">YOUR COFFEE GOT COLD!</h2>
            <p class="text-xs text-gray-400">Thanks for visiting coffeebeats.com. Refresh browser to play again.</p>
        </div>
    `;
}

function goToPhaseSelect() {
    initAudio();
    gameState = 'PHASESELECT';
    document.getElementById('view-menu').classList.add('hidden');
    document.getElementById('view-results').classList.add('hidden');
    document.getElementById('view-game').classList.add('hidden');
    document.getElementById('view-phaseselect').classList.remove('hidden');
}

function returnToMenu() {
    if (rhythmTimer) clearInterval(rhythmTimer);
    gameState = 'MENU';
    document.getElementById('view-game').classList.add('hidden');
    document.getElementById('view-results').classList.add('hidden');
    document.getElementById('view-phaseselect').classList.add('hidden');
    document.getElementById('view-menu').classList.remove('hidden');
    startMenuMusic();
}

function playAnnouncerCue(phase) {
    if (lameMode) return;
    if (phase === 1) {
        playSound(440, 'square', 0.08, 0.15);
        setTimeout(() => playSound(880, 'square', 0.1, 0.15), 120);
    } else if (phase === 2) {
        playSound(330, 'triangle', 0.12, 0.18);
    } else if (phase === 3) {
        playSound(220, 'sawtooth', 0.1, 0.15);
        setTimeout(() => playSound(330, 'sawtooth', 0.1, 0.15), 100);
    } else if (phase === 4) {
        playSound(300, 'square', 0.08, 0.15);
        setTimeout(() => playSound(150, 'square', 0.12, 0.15), 110);
    } else if (phase === 5) {
        playSound(880, 'sawtooth', 0.06, 0.2);
        setTimeout(() => playSound(1760, 'sawtooth', 0.08, 0.2), 80);
    }
}

function playHitSound(isPerfect) {
    if (lameMode) return;
    if (isPerfect) {
        playSound(1046.5, 'square', 0.12, 0.18);
    } else {
        playSound(240, 'sawtooth', 0.12, 0.15);
    }
}

function triggerScreenShake() {
    if (lameMode || !highDetail) return;
    let container = document.getElementById('viewport-container');
    container.classList.add('screen-shake');
    setTimeout(() => container.classList.remove('screen-shake'), 220);
}

// Detailed SVG Character Generators
function renderCharacterSVG(phase) {
    let container = document.getElementById('character-svg-container');
    if (lameMode || !highDetail) {
        container.innerHTML = `<div class="code-font text-xs font-bold">[ CHAR_${phase} ]</div>`;
        return;
    }

    let svgHTML = '';
    if (phase === 1) { // Grind & Pour (Joe)
        svgHTML = `
            <svg viewBox="0 0 120 120" class="w-full h-full">
                <path d="M 30 45 Q 60 20 90 45 L 95 35 Q 60 15 25 35 Z" fill="#b45309" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
                <ellipse cx="60" cy="42" rx="32" ry="10" fill="#d97706" stroke="#000" stroke-width="4"/>
                <circle cx="60" cy="70" r="30" fill="#fde68a" stroke="#000" stroke-width="4"/>
                <path d="M 45 78 Q 60 90 75 78 Q 60 70 45 78 Z" fill="#000"/>
                <circle cx="48" cy="62" r="5" fill="#000"/><circle cx="72" cy="62" r="5" fill="#000"/>
                <circle cx="46" cy="60" r="2" fill="#fff"/><circle cx="70" cy="60" r="2" fill="#fff"/>
                <circle cx="38" cy="72" r="5" fill="#fca5a5" opacity="0.8"/><circle cx="82" cy="72" r="5" fill="#fca5a5" opacity="0.8"/>
                <path d="M 85 85 L 105 85 L 100 105 L 90 105 Z" fill="#fff" stroke="#000" stroke-width="3"/>
                <path d="M 105 90 C 112 90 112 100 105 100" fill="none" stroke="#000" stroke-width="3"/>
            </svg>
        `;
    } else if (phase === 2) { // Bug Squish (Duke)
        svgHTML = `
            <svg viewBox="0 0 120 120" class="w-full h-full">
                <circle cx="38" cy="38" r="14" fill="#0284c7" stroke="#000" stroke-width="4"/>
                <circle cx="82" cy="38" r="14" fill="#0284c7" stroke="#000" stroke-width="4"/>
                <circle cx="38" cy="38" r="7" fill="#bae6fd"/><circle cx="82" cy="38" r="7" fill="#bae6fd"/>
                <circle cx="60" cy="70" r="34" fill="#0284c7" stroke="#000" stroke-width="4"/>
                <ellipse cx="60" cy="76" rx="18" ry="12" fill="#bae6fd" stroke="#000" stroke-width="3"/>
                <circle cx="60" cy="72" r="5" fill="#000"/>
                <path d="M 55 82 Q 60 88 65 82" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>
                <circle cx="46" cy="62" r="5" fill="#000"/><circle cx="74" cy="62" r="5" fill="#000"/>
                <circle cx="44" cy="60" r="2" fill="#fff"/><circle cx="72" cy="60" r="2" fill="#fff"/>
                <path d="M 45 92 L 75 92 L 80 115 L 40 115 Z" fill="#fff" stroke="#000" stroke-width="3"/>
            </svg>
        `;
    } else if (phase === 3) { // Sip & Ship (Byte)
        svgHTML = `
            <svg viewBox="0 0 120 120" class="w-full h-full">
                <polygon points="35,45 25,20 50,35" fill="#e11d48" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
                <polygon points="85,45 95,20 70,35" fill="#e11d48" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="60" cy="70" r="32" fill="#fb7185" stroke="#000" stroke-width="4"/>
                <path d="M 30 70 A 35 35 0 0 1 90 70" fill="none" stroke="#000" stroke-width="8" stroke-linecap="round"/>
                <rect x="22" y="58" width="12" height="20" rx="4" fill="#38bdf8" stroke="#000" stroke-width="3"/>
                <rect x="86" y="58" width="12" height="20" rx="4" fill="#38bdf8" stroke="#000" stroke-width="3"/>
                <rect x="42" y="60" width="36" height="12" rx="6" fill="#38bdf8" stroke="#000" stroke-width="3"/>
                <polygon points="55,78 65,78 60,84" fill="#000"/>
            </svg>
        `;
    } else if (phase === 4) { // Infinite Loop (Moca)
        svgHTML = `
            <svg viewBox="0 0 120 120" class="w-full h-full">
                <polygon points="60,20 95,32 60,44 25,32" fill="#4c1d95" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
                <rect x="52" y="38" width="16" height="10" fill="#6d28d9" stroke="#000" stroke-width="3"/>
                <ellipse cx="60" cy="75" rx="32" ry="36" fill="#9333ea" stroke="#000" stroke-width="4"/>
                <circle cx="45" cy="68" r="14" fill="#fff" stroke="#000" stroke-width="4"/>
                <circle cx="75" cy="68" r="14" fill="#fff" stroke="#000" stroke-width="4"/>
                <circle cx="45" cy="68" r="5" fill="#000"/><circle cx="75" cy="68" r="5" fill="#000"/>
                <polygon points="60,78 54,88 66,88" fill="#f59e0b" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
            </svg>
        `;
    } else if (phase === 5) { // Merge Conflict (Boss)
        svgHTML = `
            <svg viewBox="0 0 120 120" class="w-full h-full">
                <polygon points="35,80 15,105 45,95" fill="#059669" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
                <polygon points="85,80 105,105 75,95" fill="#059669" stroke="#000" stroke-width="4" stroke-linejoin="round"/>
                <path d="M 60 15 Q 85 50 75 95 L 45 95 Q 35 50 60 15 Z" fill="#34d399" stroke="#000" stroke-width="4"/>
                <circle cx="60" cy="55" r="14" fill="#fff" stroke="#000" stroke-width="4"/>
                <circle cx="60" cy="55" r="6" fill="#38bdf8"/>
                <polygon points="48,95 60,118 72,95" fill="#ef4444" stroke="#000" stroke-width="3" stroke-linejoin="round"/>
            </svg>
        `;
    }
    container.innerHTML = svgHTML;
}

function startPhase(phaseNum) {
    initAudio();
    if (menuMusicTimer) clearInterval(menuMusicTimer);
    currentPhase = phaseNum;
    gameState = 'PLAYING';
    score = 0;
    streak = 0;
    maxStreak = 0;
    totalHits = 0;
    currentBeat = 0;

    let baseBpm = [116, 122, 130, 126, 140][phaseNum - 1];
    if (difficulty === 'easy') bpm = baseBpm - 12;
    else if (difficulty === 'medium') bpm = baseBpm;
    else if (difficulty === 'hard') bpm = baseBpm + 16;

    songDurationBeats = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 40 : 50;
    beatIntervalMs = (60 / bpm) * 1000;

    applyPhaseVisuals(phaseNum);
    renderCharacterSVG(phaseNum);

    document.getElementById('view-menu').classList.add('hidden');
    document.getElementById('view-phaseselect').classList.add('hidden');
    document.getElementById('view-results').classList.add('hidden');
    document.getElementById('view-game').classList.remove('hidden');

    generatePhasePattern(phaseNum, difficulty);
    if (highDetail) spawnFloatingDecor();

    songStartTime = performance.now();
    if (rhythmTimer) clearInterval(rhythmTimer);
    rhythmTimer = setInterval(gameLoop, 15);
}

function applyPhaseVisuals(phase) {
    let container = document.getElementById('viewport-container');
    let ground = document.getElementById('bg-ground');
    let subtitle = document.getElementById('hud-subtitle');
    let nameTag = document.getElementById('char-name-tag');

    if (lameMode) return;

    let themes = {
        1: { bg: '#7dd3fc', ground: '#fde047', sub: 'Phase 1: Grind & Pour', name: 'Joe the Barista' },
        2: { bg: '#38bdf8', ground: '#e0f2fe', sub: 'Phase 2: Bug Squish', name: 'Duke the Mascot' },
        3: { bg: '#fda4af', ground: '#451a03', sub: 'Phase 3: Sip & Ship', name: 'Byte the Bug Cat' },
        4: { bg: '#c084fc', ground: '#3b0764', sub: 'Phase 4: Infinite Loop', name: 'Professor Moca' },
        5: { bg: '#34d399', ground: '#065f46', sub: 'Phase 5: Merge Conflict', name: 'Server Boss' }
    };
    let t = themes[phase];
    container.style.backgroundColor = t.bg;
    ground.style.backgroundColor = t.ground;
    subtitle.innerText = t.sub;
    nameTag.innerText = t.name;
}

function spawnFloatingDecor() {
    let bgContainer = document.getElementById('moving-bg-decor');
    bgContainer.innerHTML = '';
    if (lameMode || !highDetail) return;

    let icons = ['☕', '🫘', '💻', '⚡', '🥛', '🐛', '🧹', '⭐'];
    for (let i = 0; i < 5; i++) {
        let el = document.createElement('div');
        el.className = 'absolute text-2xl opacity-35 floating-deco';
        el.style.left = `${Math.random() * 80 + 10}%`;
        el.style.top = `${Math.random() * 50 + 10}%`;
        el.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
        el.innerText = icons[i % icons.length];
        bgContainer.appendChild(el);
    }
}

function generatePhasePattern(phase, diff) {
    activeBeatsQueue = [];
    totalNotes = 0;

    for (let b = 4; b < songDurationBeats; b++) {
        let shouldAdd = false;
        if (diff === 'easy') {
            shouldAdd = (b % 4 === 0);
        } else if (diff === 'medium') {
            shouldAdd = (b % 2 === 0);
        } else {
            shouldAdd = true;
        }

        if (shouldAdd) {
            let typeLabel = phase === 1 ? 'GRIND!' : phase === 2 ? 'SQUISH!' : phase === 3 ? 'SHIP!' : phase === 4 ? 'LOOP!' : 'MERGE!';
            activeBeatsQueue.push({ beatIndex: b, hit: false, missed: false, type: typeLabel });
            totalNotes++;
        }
    }
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;

    let now = performance.now();
    let elapsed = now - songStartTime;
    let expectedBeat = Math.floor(elapsed / beatIntervalMs);

    if (expectedBeat > currentBeat) {
        currentBeat = expectedBeat;

        let note = activeBeatsQueue.find(n => n.beatIndex === currentBeat);
        if (note) {
            triggerCue(note.type);
        }

        activeBeatsQueue.forEach(n => {
            if (!n.hit && !n.missed && currentBeat > n.beatIndex + 1) {
                n.missed = true;
                handleMiss();
            }
        });

        if (currentBeat >= songDurationBeats) {
            endPhase();
        }
    }

    let ringProgress = (elapsed % beatIntervalMs) / beatIntervalMs;
    let ring = document.getElementById('inner-ring');
    let scale = 1 + Math.sin(ringProgress * Math.PI * 2) * 0.16;
    ring.style.transform = `scale(${scale})`;

    document.getElementById('hud-score').innerText = String(score).padStart(4, '0');
    document.getElementById('hud-streak').innerText = streak + 'x';
}

function triggerCue(text) {
    playAnnouncerCue(currentPhase);

    let banner = document.getElementById('cue-banner');
    banner.innerText = lameMode ? 'PROC_BEAT' : text;
    banner.classList.add('pop-animation');
    setTimeout(() => banner.classList.remove('pop-animation'), 180);

    let mascot = document.getElementById('character-wrapper');
    mascot.classList.add('animate-beat');
    setTimeout(() => mascot.classList.remove('animate-beat'), beatIntervalMs);

    let bubble = document.getElementById('char-speech-bubble');
    bubble.innerText = text;
    bubble.style.opacity = '1';
    setTimeout(() => bubble.style.opacity = '0', 220);

    spawnMovingTrackObject(text);
}

function spawnMovingTrackObject(text) {
    let trackObjContainer = document.getElementById('track-objects');
    trackObjContainer.innerHTML = '';
    
    let item = document.createElement('div');
    item.className = 'absolute right-0 w-14 h-14 md:w-16 md:h-16 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black pop-animation rh-shadow';
    
    if (lameMode) {
        item.innerText = '[X]';
    } else {
        if (currentPhase === 1) item.innerText = '🫘';
        else if (currentPhase === 2) item.innerText = '🐛';
        else if (currentPhase === 3) item.innerText = '☕';
        else if (currentPhase === 4) item.innerText = '🔄';
        else if (currentPhase === 5) item.innerText = '⚡';
    }

    trackObjContainer.appendChild(item);
    
    item.style.transition = `transform ${beatIntervalMs}ms linear`;
    item.style.transform = 'translateX(-220px)';

    setTimeout(() => { 
        if (trackObjContainer.contains(item)) trackObjContainer.removeChild(item); 
    }, beatIntervalMs);
}

function handlePlayerInput() {
    if (gameState !== 'PLAYING') return;

    let now = performance.now();
    let elapsed = now - songStartTime;
    let currentSongBeat = elapsed / beatIntervalMs;

    let closestNote = null;
    let minDiff = 999;

    for (let i = 0; i < activeBeatsQueue.length; i++) {
        let note = activeBeatsQueue[i];
        if (!note.hit && !note.missed) {
            let diff = Math.abs(note.beatIndex - currentSongBeat);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = note;
            }
        }
    }

    let threshold = difficulty === 'easy' ? 0.45 : difficulty === 'medium' ? 0.35 : 0.28;
    if (closestNote && minDiff <= threshold) {
        closestNote.hit = true;
        totalHits++;
        streak++;
        if (streak > maxStreak) maxStreak = streak;

        let isPerfect = minDiff <= (difficulty === 'easy' ? 0.22 : 0.15);
        let pts = isPerfect ? 350 : 180;
        score += pts * (streak >= 6 ? 2 : 1);

        playHitSound(isPerfect);
        showStamp(isPerfect ? 'GREAT!' : 'OK!');
        if (isPerfect) triggerScreenShake();
    } else {
        streak = 0;
        playHitSound(false);
        showStamp('MISS');
    }
}

function handleMiss() {
    streak = 0;
    showStamp('MISS');
}

function showStamp(text) {
    let container = document.getElementById('stamp-container');
    container.innerHTML = '';
    let stamp = document.createElement('div');
    let color = lameMode ? 'bg-gray-700 text-gray-300' : text === 'GREAT!' ? 'bg-amber-400 text-black' : text === 'OK!' ? 'bg-cyan-400 text-black' : 'bg-rose-500 text-white';
    stamp.className = `px-5 py-2.5 rounded-2xl border-4 border-black font-black text-xl md:text-2xl stamp-animation ${color} shadow-2xl`;
    stamp.innerText = lameMode ? 'ERR' : text;
    container.appendChild(stamp);
    setTimeout(() => container.innerHTML = '', 300);
}

function endPhase() {
    gameState = 'RESULTS';
    if (rhythmTimer) clearInterval(rhythmTimer);

    document.getElementById('view-game').classList.add('hidden');
    document.getElementById('view-results').classList.remove('hidden');

    let accuracy = totalNotes > 0 ? Math.round((totalHits / totalNotes) * 100) : 100;
    let grade = accuracy >= 90 ? 'SUPERB! ☕' : accuracy >= 70 ? 'OKAY! 👍' : 'TRY AGAIN! 💀';
    if (lameMode) grade = 'DONE.EXE';

    let phaseNames = {
        1: 'Grind & Pour (Joe)',
        2: 'Bug Squish (Duke)',
        3: 'Sip & Ship (Byte)',
        4: 'Infinite Loop (Moca)',
        5: 'Merge Conflict (Boss)'
    };

    document.getElementById('result-grade').innerText = grade;
    document.getElementById('result-comment').innerText = lameMode
        ? 'Execution complete.'
        : accuracy >= 90
            ? 'Absolute rhythm perfection!'
            : accuracy >= 70
                ? 'Nice groove! Keep it going!'
                : 'Practice the beat and try again!';
    document.getElementById('res-phase').innerText = phaseNames[currentPhase];
    document.getElementById('res-diff').innerText = difficulty;
    document.getElementById('res-score').innerText = score;
    document.getElementById('res-streak').innerText = maxStreak + 'x';
    document.getElementById('res-accuracy').innerText = accuracy + '%';
}

function restartCurrentPhase() {
    startPhase(currentPhase);
}

window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        initAudio();
        handlePlayerInput();
    }
});

document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    let button = event.target.closest('[data-action]');
    if (!button) return;

    switch (button.dataset.action) {
        case 'return-menu':
            returnToMenu();
            break;
        case 'phase-select':
            goToPhaseSelect();
            break;
        case 'open-options':
            openOptions();
            break;
        case 'prompt-leave':
            promptLeaveGame();
            break;
        case 'set-difficulty':
            setDifficulty(button.dataset.difficulty);
            break;
        case 'toggle-audio':
            toggleLameMode();
            break;
        case 'toggle-visuals':
            toggleVideoQuality();
            break;
        case 'close-options':
            closeOptions();
            break;
        case 'start-phase':
            startPhase(Number(button.dataset.phase));
            break;
        case 'close-leave-modal':
            closeLeaveModal();
            break;
        case 'leave-game':
            executeLeaveGame();
            break;
        case 'restart-phase':
            restartCurrentPhase();
            break;
        case 'action':
            initAudio();
            handlePlayerInput();
            break;
    }
});

window.addEventListener('load', startMenuMusic);