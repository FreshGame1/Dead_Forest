const CONFIG_NORMAL = {
    walkSpeed: 38.0,
    sprintSpeed: 85.0,
    adrenalineSpeed: 350.0,
    monsterSpeed: 40.0,
    adrenalineDuration: 1.0, 
    spawnDistance: 60,
    fogDensity: 0.03,
    chaseDuration: 15000,
    monsterSightDistance: 40,
    monsterPatrolSpeed: 15.0,
    monsterChaseSpeed: 40.0,
    gracePeriod: 5000,
    monsterStopDistance: 4.0,
    deathDistance: 2.6,
    lightMonsterSpeed: 25.0,
    lightMonsterSlowSpeed: 10.0,
    lightMonsterExposureTime: 5.0,
    lightMonsterSpawnChance: 0.003,
    lightMonsterMinDistance: 15,
    lightMonsterMaxDistance: 40,
    lightMonsterCooldown: 30.0,
    observerAttackDistance: 3.0,
    observerAttackCooldown: 10.0,
    observerSpeed: 15.0,
    itemSpawnChance: 0.01,
    maxItems: 20,
    finalChaseMonsterSpeed: 35.0,
    finalChasePlayerSpeed: 350.0,
    finalChaseLightMonsterSpeed: 30.0,
    finalChaseObserverSpeed: 25.0,
    maxRevives: 3
};

const CONFIG_HARD = {
    walkSpeed: 38.0,
    sprintSpeed: 85.0,
    adrenalineSpeed: 350.0,
    monsterSpeed: 40.0,
    adrenalineDuration: 1.0, 
    spawnDistance: 60,
    fogDensity: 0.03,
    chaseDuration: 15000,
    monsterSightDistance: 40,
    monsterPatrolSpeed: 15.0,
    monsterChaseSpeed: 40.0,
    gracePeriod: 5000,
    monsterStopDistance: 4.0,
    deathDistance: 2.6,
    lightMonsterSpeed: 25.0,
    lightMonsterSlowSpeed: 10.0,
    lightMonsterExposureTime: 5.0,
    lightMonsterSpawnChance: 0.01,
    lightMonsterMinDistance: 15,
    lightMonsterMaxDistance: 40,
    lightMonsterCooldown: 0,
    observerAttackDistance: 3.0,
    observerAttackCooldown: 5.0,
    observerSpeed: 20.0,
    itemSpawnChance: 0.005,
    maxItems: 10,
    finalChaseMonsterSpeed: 45.0,
    finalChasePlayerSpeed: 350.0,
    finalChaseLightMonsterSpeed: 40.0,
    finalChaseObserverSpeed: 35.0,
    maxRevives: 1
};

let CONFIG = CONFIG_NORMAL;

const state = {
    notes: 0, totalNotes: 10, isGameOver: false,
    monsterState: 'patrol', sprint: false, stamina: 100,
    battery: 100, flashlightOn: true, volume: 0.5,
    panicMode: false, invertedMode: false,
    adrenaline: 0, maxAdrenaline: 100,
    lastMonsterSighting: 0,
    monsterVisible: false,
    chaseTimeLeft: 15,
    chaseStartTime: 0,
    gracePeriodActive: false,
    lightMonsterActive: false,
    lightMonsterExposure: 0,
    lightMonsterBeingExposed: false,
    lightMonsterSlowed: false,
    lightMonsterCooldown: 0,
    observerActive: false,
    observerAttackCooldown: 0,
    observerAttacking: false,
    health: 8,
    maxHealth: 8,
    medkits: 0,
    batteries: 0,
    energydrinks: 0,
    portalActive: false,
    portal: null,
    finalChase: false,
    finalChaseStartTime: 0,
    finalChaseTimeLeft: 60,
    keysCollected: 0,
    totalKeys: 3,
    roadSegments: [],
    currentSegment: 0,
    roadLength: 1000,
    obstacles: [],
    gate: null,
    infiniteRoad: false,
    roadSections: [],
    currentRoadSection: 0,
    keys: [],
    respawningInFinalChase: false,
    portalCreated: false,
    revives: 3,
    maxRevives: 3
};

let scene, camera, renderer, controls;
let flashLight;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let notes = [], monster, lightMonster, observer;
let particles; 
let chaseTimer = null;
let heartBeatTimer = null;
let patrolTimer = null;
let monsterSightTimer = null;
let chaseCountdownTimer = null;
let graceTimer = null;
let lightMonsterTimer = null;
let observerTimer = null;
let finalChaseTimer = null;
let finalChaseCountdownTimer = null;

let items = [];

let keys = [];

let minimapCanvas, minimapCtx;

const staminaBar = document.getElementById('stamina-bar');
const batteryBar = document.getElementById('battery-bar');
const adrenalineWrapper = document.getElementById('adrenaline-wrapper');
const adrenalineBar = document.getElementById('adrenaline-bar');
const msgEl = document.getElementById('note-msg');
const cpMsgEl = document.getElementById('checkpoint-msg');
const flashEl = document.getElementById('flash');
const bloodEl = document.getElementById('blood-overlay');
const staticEl = document.getElementById('static-overlay');
const jumpscareEl = document.getElementById('jumpscare');
const chaseTimerEl = document.getElementById('chase-timer');
const flashlightIndicator = document.getElementById('flashlight-indicator');
const portalIndicator = document.getElementById('portal-indicator');
const medkitCountEl = document.getElementById('medkit-count');
const batteryCountEl = document.getElementById('battery-count');
const energydrinkCountEl = document.getElementById('energydrink-count');
const healthContainer = document.getElementById('health-container');
const finalChaseOverlay = document.getElementById('final-chase-overlay');
const keysCounter = document.getElementById('keys-counter');
const revivesCounter = document.getElementById('revives-counter');
const deathMessageEl = document.getElementById('death-message');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
masterGain.gain.value = 0.5;

let soundBuffers = {};
let backgroundMusic = null;
let activeSounds = [];

function stopAllSounds() {
    activeSounds.forEach(sound => {
        if (sound.source) {
            sound.source.stop();
            sound.source.disconnect();
        }
    });
    activeSounds = [];
}

async function loadSounds() {
    const soundFiles = {
        pickup: 'sine',
        scream: 'noise',
        whisper: 'noise',
        drone: 'sine',
        heartbeat: 'sine',
        flicker: 'square',
        growl: 'sawtooth',
        breathing: 'sine',
        adrenaline_boost: 'sine',
        light_monster_spawn: 'sawtooth',
        light_monster_hurt: 'square',
        light_monster_death: 'sine',
        observer_spawn: 'triangle',
        observer_attack: 'square',
        item_pickup: 'sine',
        medkit_use: 'sine',
        battery_use: 'sine',
        energydrink_use: 'sine',
        damage: 'square',
        portal_spawn: 'sine',
        portal_enter: 'sine',
        final_chase: 'sawtooth',
        key_pickup: 'sine',
        gate_open: 'sine'
    };

    for (const [name, type] of Object.entries(soundFiles)) {
        soundBuffers[name] = await generateSoundBuffer(type, name);
    }
    
    backgroundMusic = await generateBackgroundMusic();
}

function generateSoundBuffer(type, name) {
    return new Promise((resolve) => {
        const duration = name === 'drone' ? 4 : (name === 'scream' ? 2 : 0.5);
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            let value = 0;
            const t = i / audioCtx.sampleRate;
            
            switch(type) {
                case 'sine':
                    value = Math.sin(2 * Math.PI * getFrequency(name, t) * t);
                    break;
                case 'square':
                    value = Math.sin(2 * Math.PI * getFrequency(name, t) * t) > 0 ? 0.5 : -0.5;
                    break;
                case 'sawtooth':
                    value = 2 * (t * getFrequency(name, t) - Math.floor(0.5 + t * getFrequency(name, t)));
                    break;
                case 'triangle':
                    value = 2 * Math.abs(2 * (t * getFrequency(name, t) - Math.floor(t * getFrequency(name, t) + 0.5))) - 1;
                    break;
                case 'noise':
                    value = Math.random() * 2 - 1;
                    break;
            }
            
            value *= getEnvelope(name, t, duration);
            data[i] = value;
        }
        
        resolve(buffer);
    });
}

function generateBackgroundMusic() {
    return new Promise((resolve) => {
        const duration = 30;
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
        const leftChannel = buffer.getChannelData(0);
        const rightChannel = buffer.getChannelData(1);
        
        const chords = [
            [65.41, 82.41, 98.00],
            [73.42, 92.50, 110.00],
            [87.31, 103.83, 130.81],
            [77.78, 92.50, 116.54]
        ];
        
        let chordIndex = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / audioCtx.sampleRate;
            const chord = chords[chordIndex];
            
            if (i % (audioCtx.sampleRate * 4) === 0) {
                chordIndex = (chordIndex + 1) % chords.length;
            }
            
            let leftValue = 0;
            let rightValue = 0;
            
            for (let j = 0; j < chord.length; j++) {
                const freq = chord[j];
                const pan = j === 0 ? -0.5 : (j === 1 ? 0 : 0.5);
                
                const tone = 0.3 * Math.sin(2 * Math.PI * freq * t) * 
                            Math.exp(-0.001 * t) * 
                            (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.1 * t));
                
                if (pan < 0) {
                    leftValue += tone * (1 + pan);
                    rightValue += tone * (1 - Math.abs(pan));
                } else {
                    leftValue += tone * (1 - Math.abs(pan));
                    rightValue += tone * (1 - pan);
                }
            }
            
            const noise = 0.05 * (Math.random() * 2 - 1) * Math.exp(-0.002 * t);
            leftValue += noise;
            rightValue += noise;
            
            leftChannel[i] = leftValue;
            rightChannel[i] = rightValue;
        }
        
        resolve(buffer);
    });
}

function getFrequency(name, t) {
    switch(name) {
        case 'pickup': return 600 + 600 * t;
        case 'scream': return 150 - 100 * t;
        case 'whisper': return 400;
        case 'drone': return 60;
        case 'heartbeat': return 50;
        case 'flicker': return 50;
        case 'growl': return 80 - 40 * t;
        case 'breathing': return 30;
        case 'adrenaline_boost': return 200 + 400 * t;
        case 'light_monster_spawn': return 150 - 100 * t;
        case 'light_monster_hurt': return 300 - 200 * t;
        case 'light_monster_death': return 200 - 150 * t;
        case 'observer_spawn': return 100 + 50 * Math.sin(2 * Math.PI * 2 * t);
        case 'observer_attack': return 200 - 100 * t;
        case 'item_pickup': return 800 + 400 * t;
        case 'medkit_use': return 400 + 200 * t;
        case 'battery_use': return 600 + 300 * t;
        case 'energydrink_use': return 500 + 300 * t;
        case 'damage': return 150 - 50 * t;
        case 'portal_spawn': return 300 + 200 * t;
        case 'portal_enter': return 500 + 300 * t;
        case 'final_chase': return 100 + 50 * Math.sin(2 * Math.PI * 5 * t);
        case 'key_pickup': return 1000 + 500 * t;
        case 'gate_open': return 300 + 200 * t;
        default: return 440;
    }
}

function getEnvelope(name, t, duration) {
    switch(name) {
        case 'pickup': 
            return t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.4);
        case 'scream':
            return t < 0.5 ? t / 0.5 : Math.max(0, 1 - (t - 0.5) / 1.5);
        case 'whisper':
            return t < 0.5 ? t / 0.5 : Math.max(0, 1 - (t - 0.5) / 0.5);
        case 'drone':
            return 0.05;
        case 'heartbeat':
            return t < 0.05 ? t / 0.05 : Math.max(0, 1 - (t - 0.05) / 0.1);
        case 'flicker':
            return t < 0.05 ? 1 : 0;
        case 'growl':
            return t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 0.6);
        case 'breathing':
            return Math.exp(-0.5 * t);
        case 'adrenaline_boost':
            return t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.2);
        case 'light_monster_spawn':
            return t < 0.5 ? t / 0.5 : Math.max(0, 1 - (t - 0.5) / 0.5);
        case 'light_monster_hurt':
            return t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.2);
        case 'light_monster_death':
            return t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 0.3);
        case 'observer_spawn':
            return 0.3 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t));
        case 'observer_attack':
            return t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.2);
        case 'item_pickup':
            return t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.2);
        case 'medkit_use':
            return t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 0.3);
        case 'battery_use':
            return t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 0.3);
        case 'energydrink_use':
            return t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 0.3);
        case 'damage':
            return t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.2);
        case 'portal_spawn':
            return t < 0.5 ? t / 0.5 : Math.max(0, 1 - (t - 0.5) / 1.0);
        case 'portal_enter':
            return t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.7);
        case 'final_chase':
            return 0.2;
        case 'key_pickup':
            return t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.2);
        case 'gate_open':
            return t < 0.3 ? t / 0.3 : Math.max(0, 1 - (t - 0.3) / 0.7);
        default:
            return t < duration * 0.1 ? t / (duration * 0.1) : 
                   t > duration * 0.9 ? (duration - t) / (duration * 0.1) : 1;
    }
}

function playSound(type) {
    if (!soundBuffers[type]) return;
    
    const source = audioCtx.createBufferSource();
    source.buffer = soundBuffers[type];
    
    const gain = audioCtx.createGain();
    source.connect(gain);
    gain.connect(masterGain);
    
    switch(type) {
        case 'drone': gain.gain.value = 0.05; break;
        case 'scream': gain.gain.value = 0.8; break;
        case 'whisper': gain.gain.value = 0.3; break;
        case 'heartbeat': gain.gain.value = 0.5; break;
        case 'growl': gain.gain.value = 0.4; break;
        case 'breathing': gain.gain.value = 0.2; break;
        case 'adrenaline_boost': gain.gain.value = 0.6; break;
        case 'portal_spawn': gain.gain.value = 0.7; break;
        case 'portal_enter': gain.gain.value = 0.8; break;
        case 'final_chase': gain.gain.value = 0.4; break;
        case 'key_pickup': gain.gain.value = 0.6; break;
        case 'gate_open': gain.gain.value = 0.7; break;
        default: gain.gain.value = 0.5;
    }
    
    source.start();
    
    if (type === 'drone' || type === 'final_chase') {
        source.loop = true;
        const soundObj = { source, gain, type };
        activeSounds.push(soundObj);
        return soundObj;
    }
    
    return null;
}

function stopSound(type) {
    activeSounds = activeSounds.filter(sound => {
        if (sound.type === type) {
            sound.source.stop();
            sound.source.disconnect();
            return false;
        }
        return true;
    });
}

function playBackgroundMusic() {
    if (!backgroundMusic) return;
    
    const source = audioCtx.createBufferSource();
    source.buffer = backgroundMusic;
    
    const gain = audioCtx.createGain();
    source.connect(gain);
    gain.connect(masterGain);
    gain.gain.value = 0.1;
    
    source.loop = true;
    source.start();
    
    const soundObj = { source, gain, type: 'background' };
    activeSounds.push(soundObj);
    
    return soundObj;
}

document.getElementById('volume-slider').addEventListener('input', (e) => {
    state.volume = e.target.value / 100;
    masterGain.gain.value = state.volume;
});

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('difficulty-screen').style.display = 'flex';
});

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('difficulty-screen').style.display = 'none';
    document.getElementById('instructions').style.display = 'flex';
});

document.getElementById('normal-btn').addEventListener('click', () => {
    CONFIG = CONFIG_NORMAL;
    state.maxRevives = CONFIG.maxRevives;
    state.revives = state.maxRevives;
    startGame();
});

document.getElementById('hard-btn').addEventListener('click', () => {
    CONFIG = CONFIG_HARD;
    state.maxRevives = CONFIG.maxRevives;
    state.revives = state.maxRevives;
    startGame();
});

document.getElementById('respawn-btn').addEventListener('click', respawnPlayer);

function initMinimap() {
    minimapCanvas = document.getElementById('minimap');
    minimapCtx = minimapCanvas.getContext('2d');
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
}

function drawMinimap() {
    minimapCtx.clearRect(0, 0, 200, 200);
    
    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    minimapCtx.fillRect(0, 0, 200, 200);
    
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.beginPath();
    minimapCtx.arc(100, 100, 3, 0, Math.PI * 2);
    minimapCtx.fill();
    
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    minimapCtx.strokeStyle = '#00ff00';
    minimapCtx.beginPath();
    minimapCtx.moveTo(100, 100);
    minimapCtx.lineTo(100 + direction.x * 10, 100 + direction.z * 10);
    minimapCtx.stroke();
    
    minimapCtx.fillStyle = '#00ffff';
    notes.forEach(note => {
        const notePos = note.position.clone();
        const relativeX = (notePos.x - camera.position.x) * 2;
        const relativeZ = (notePos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.beginPath();
            minimapCtx.arc(100 + relativeX, 100 + relativeZ, 2, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });
    
    if (state.monsterState !== 'patrol' && monster.position.y > -50) {
        minimapCtx.fillStyle = '#ff0000';
        const monsterPos = monster.position.clone();
        const relativeX = (monsterPos.x - camera.position.x) * 2;
        const relativeZ = (monsterPos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.beginPath();
            minimapCtx.arc(100 + relativeX, 100 + relativeZ, 4, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    }
    
    if (state.lightMonsterActive) {
        minimapCtx.fillStyle = '#9900ff';
        const lightMonsterPos = lightMonster.position.clone();
        const relativeX = (lightMonsterPos.x - camera.position.x) * 2;
        const relativeZ = (lightMonsterPos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.beginPath();
            minimapCtx.arc(100 + relativeX, 100 + relativeZ, 4, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    }
    
    if (state.observerActive) {
        minimapCtx.fillStyle = '#ffff00';
        const observerPos = observer.position.clone();
        const relativeX = (observerPos.x - camera.position.x) * 2;
        const relativeZ = (observerPos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.beginPath();
            minimapCtx.arc(100 + relativeX, 100 + relativeZ, 4, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    }
    
    items.forEach(item => {
        if (item.userData.type === 'medkit') {
            minimapCtx.fillStyle = '#ff0000';
        } else if (item.userData.type === 'battery') {
            minimapCtx.fillStyle = '#ffff00';
        } else if (item.userData.type === 'energydrink') {
            minimapCtx.fillStyle = '#00ff00';
        }
        
        const itemPos = item.position.clone();
        const relativeX = (itemPos.x - camera.position.x) * 2;
        const relativeZ = (itemPos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.beginPath();
            minimapCtx.arc(100 + relativeX, 100 + relativeZ, 2, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });
    
    minimapCtx.fillStyle = '#ffcc00';
    keys.forEach(key => {
        const keyPos = key.position.clone();
        const relativeX = (keyPos.x - camera.position.x) * 2;
        const relativeZ = (keyPos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.beginPath();
            minimapCtx.arc(100 + relativeX, 100 + relativeZ, 3, 0, Math.PI * 2);
            minimapCtx.fill();
        }
    });
    
    if (state.portalActive) {
        minimapCtx.fillStyle = '#00ffff';
        const portalPos = state.portal.position.clone();
        const relativeX = (portalPos.x - camera.position.x) * 2;
        const relativeZ = (portalPos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.beginPath();
            minimapCtx.arc(100 + relativeX, 100 + relativeZ, 5, 0, Math.PI * 2);
            minimapCtx.fill();
        }
        
        const angle = Math.atan2(relativeZ, relativeX);
        const arrowLength = 15;
        const arrowX = 100 + Math.cos(angle) * arrowLength;
        const arrowY = 100 + Math.sin(angle) * arrowLength;
        
        minimapCtx.strokeStyle = '#00ffff';
        minimapCtx.lineWidth = 2;
        minimapCtx.beginPath();
        minimapCtx.moveTo(100, 100);
        minimapCtx.lineTo(arrowX, arrowY);
        minimapCtx.stroke();
        
        minimapCtx.beginPath();
        minimapCtx.moveTo(arrowX, arrowY);
        minimapCtx.lineTo(arrowX - 5 * Math.cos(angle - Math.PI/6), arrowY - 5 * Math.sin(angle - Math.PI/6));
        minimapCtx.lineTo(arrowX - 5 * Math.cos(angle + Math.PI/6), arrowY - 5 * Math.sin(angle + Math.PI/6));
        minimapCtx.closePath();
        minimapCtx.fillStyle = '#00ffff';
        minimapCtx.fill();
    }
    
    if (state.gate) {
        minimapCtx.fillStyle = '#00ff00';
        const gatePos = state.gate.position.clone();
        const relativeX = (gatePos.x - camera.position.x) * 2;
        const relativeZ = (gatePos.z - camera.position.z) * 2;
        if (Math.abs(relativeX) < 100 && Math.abs(relativeZ) < 100) {
            minimapCtx.fillRect(100 + relativeX - 3, 100 + relativeZ - 3, 6, 6);
        }
    }
}

function createHearts() {
    healthContainer.innerHTML = '';
    for (let i = 0; i < state.maxHealth; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        healthContainer.appendChild(heart);
    }
    updateHearts();
}

function updateHearts() {
    const hearts = document.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index < state.health) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

function takeDamage(amount) {
    state.health = Math.max(0, state.health - amount);
    updateHearts();
    playSound('damage');
    
    bloodEl.style.display = 'block';
    setTimeout(() => {
        bloodEl.style.display = 'none';
    }, 500);
    
    if (state.health <= 0) {
        gameOver();
    }
}

function useMedkit() {
    if (state.medkits > 0 && state.health < state.maxHealth) {
        state.medkits--;
        state.health = Math.min(state.maxHealth, state.health + 2);
        updateHearts();
        medkitCountEl.textContent = state.medkits;
        playSound('medkit_use');
        showMessage("Использована аптечка!", 2000, "#00ff00");
    }
}

function useBattery() {
    if (state.batteries > 0 && state.battery < 100) {
        state.batteries--;
        state.battery = Math.min(100, state.battery + 50);
        batteryCountEl.textContent = state.batteries;
        playSound('battery_use');
        showMessage("Использована батарейка!", 2000, "#ffff00");
    }
}

function useEnergyDrink() {
    if (state.energydrinks > 0 && state.stamina < 100) {
        state.energydrinks--;
        state.stamina = 100;
        energydrinkCountEl.textContent = state.energydrinks;
        playSound('energydrink_use');
        showMessage("Использован энергетик! Выносливость восстановлена!", 2000, "#00ff00");
    }
}

function createItems() {
    for (let i = 0; i < CONFIG.maxItems; i++) {
        let x, z;
        let safe = false;
        while(!safe) {
            x = (Math.random() - 0.5) * 180;
            z = (Math.random() - 0.5) * 180;
            if (Math.sqrt(x*x + z*z) > 15) safe = true;
        }

        const itemType = Math.random() < 0.33 ? 'medkit' : (Math.random() < 0.5 ? 'battery' : 'energydrink');
        let itemColor, itemGeometry;
        
        if (itemType === 'medkit') {
            itemGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.6);
            itemColor = 0xff0000;
        } else if (itemType === 'battery') {
            itemGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
            itemColor = 0xffff00;
        } else {
            itemGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8);
            itemColor = 0x00ff00;
        }
        
        const item = new THREE.Mesh(
            itemGeometry,
            new THREE.MeshBasicMaterial({ color: itemColor })
        );
        
        if (itemType === 'battery' || itemType === 'energydrink') {
            item.rotation.x = Math.PI / 2;
        }
        
        item.position.set(x, 0.5, z);
        item.userData = { type: itemType };
        
        scene.add(item);
        items.push(item);
    }
}

function collectItem(itemObj) {
    scene.remove(itemObj);
    items = items.filter(i => i !== itemObj);
    
    if (itemObj.userData.type === 'medkit') {
        state.medkits++;
        medkitCountEl.textContent = state.medkits;
        showMessage("Найдена аптечка!", 2000, "#ff0000");
    } else if (itemObj.userData.type === 'battery') {
        state.batteries++;
        batteryCountEl.textContent = state.batteries;
        showMessage("Найдена батарейка!", 2000, "#ffff00");
    } else {
        state.energydrinks++;
        energydrinkCountEl.textContent = state.energydrinks;
        showMessage("Найден энергетик!", 2000, "#00ff00");
    }
    
    playSound('item_pickup');
}

function createObserver() {
    const observerGroup = new THREE.Group();
    
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );
    body.position.y = 1.0;
    
    const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    eye.position.set(0, 0.2, 0.4);
    
    const eyeLight = new THREE.PointLight(0xffff00, 1.0, 10);
    eyeLight.position.set(0, 0.5, 0);
    
    observerGroup.add(body);
    observerGroup.add(eye);
    observerGroup.add(eyeLight);
    
    observer = observerGroup;
    observer.position.set(0, -100, 0);
    scene.add(observer);
}

function spawnObserver() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 30;
    
    const x = camera.position.x + Math.cos(angle) * distance;
    const z = camera.position.z + Math.sin(angle) * distance;
    
    observer.position.set(x, 1.0, z);
    state.observerActive = true;
    state.observerAttackCooldown = CONFIG.observerAttackCooldown;
    
    playSound('observer_spawn');
    showMessage("НАБЛЮДАТЕЛЬ ПОЯВИЛСЯ! СМОТРИ НА НЕГО ЧТОБЫ ОСТАНОВИТЬ!", 3000, "#ffff00");
}

function updateObserver(delta) {
    if (!state.observerActive) return;
    
    const dist = observer.position.distanceTo(camera.position);
    
    const observerDirection = new THREE.Vector3().subVectors(observer.position, camera.position).normalize();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);
    
    const angle = observerDirection.angleTo(viewDirection);
    const isLookingAtObserver = angle < Math.PI/4;
    
    let observerSpeed = state.finalChase ? CONFIG.finalChaseObserverSpeed : CONFIG.observerSpeed;
    
    if (isLookingAtObserver) {
        observerSpeed = 0;
    } else {
        if (dist > CONFIG.observerAttackDistance) {
            const dir = new THREE.Vector3().subVectors(camera.position, observer.position).normalize();
            observer.position.x += dir.x * observerSpeed * delta;
            observer.position.z += dir.z * observerSpeed * delta;
            observer.lookAt(camera.position);
        } else if (!state.observerAttacking) {
            state.observerAttacking = true;
            takeDamage(2);
            playSound('observer_attack');
            showMessage("НАБЛЮДАТЕЛЬ АТАКОВАЛ!", 2000, "#ff0000");
            
            const dir = new THREE.Vector3().subVectors(observer.position, camera.position).normalize();
            observer.position.add(dir.multiplyScalar(5));
            
            setTimeout(() => {
                state.observerAttacking = false;
            }, 2000);
        }
    }
    
    if (dist > 50) {
        state.observerActive = false;
        observer.position.y = -100;
        showMessage("Наблюдатель исчез!", 2000, "#00ff00");
        return;
    }
    
    if (state.observerAttackCooldown > 0) {
        state.observerAttackCooldown -= delta;
    }
}

function createPortal() {
    const portalGroup = new THREE.Group();
    
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.3, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    ring.rotation.x = Math.PI / 2;
    
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 100;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ 
        size: 0.1, 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.7 
    });
    const portalParticles = new THREE.Points(particlesGeo, particlesMat);
    
    const portalLight = new THREE.PointLight(0x00ffff, 2, 20);
    
    portalGroup.add(ring);
    portalGroup.add(portalParticles);
    portalGroup.add(portalLight);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 50;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    portalGroup.position.set(x, 1, z);
    state.portal = portalGroup;
    scene.add(portalGroup);
    state.portalActive = true;
    state.portalCreated = true;
    
    playSound('portal_spawn');
    portalIndicator.style.display = 'block';
    showMessage("ПОРТАЛ ОТКРЫТ! БЕГИ К НЕМУ ЧТОБЫ СБЕЖАТЬ!", 5000, "#00ffff");
}

function checkPortal() {
    if (!state.portalActive || !state.portal) return;
    
    const dist = camera.position.distanceTo(state.portal.position);
    if (dist < 3) {
        winGame();
    }
}

function createInfiniteRoad() {
    while(scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    
    state.obstacles = [];
    state.roadSections = [];
    state.keys = [];
    keys = [];
    
    state.infiniteRoad = true;
    state.roadSections = [];
    state.currentRoadSection = 0;
    
    for (let i = 0; i < 10; i++) {
        createRoadSection(i * 100);
    }
    
    placeKeysOnInfiniteRoad();
    
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);
    
    camera.position.set(0, 1.7, 5);
    
    state.adrenaline = 100;
    adrenalineWrapper.style.display = 'block';
    
    keysCounter.style.display = 'block';
    keysCounter.textContent = `Ключи: ${state.keysCollected}/${state.totalKeys}`;
    
    finalChaseOverlay.style.display = 'block';
    scene.fog = new THREE.FogExp2(0x220000, 0.01);
    
    stopSound('final_chase');
    playSound('final_chase');
    playSound('scream');
    
    showMessage("БЕГИ ПО ДОРОГЕ И СОБЕРИ 3 КЛЮЧА! МОНСТРЫ ИДУТ ЗА ТОБОЙ!", 5000, "#ff0000");
    
    setTimeout(() => {
        spawnFinalMonsters();
    }, 2000);
}

function createRoadSection(zOffset) {
    const sectionLength = 100;
    const roadWidth = 20;
    
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, sectionLength);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, zOffset + sectionLength / 2);
    scene.add(road);
    
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(1, 5, sectionLength),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    leftWall.position.set(-roadWidth/2 - 0.5, 2.5, zOffset + sectionLength / 2);
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(1, 5, sectionLength),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    rightWall.position.set(roadWidth/2 + 0.5, 2.5, zOffset + sectionLength / 2);
    scene.add(rightWall);
    
    createObstaclesInSection(zOffset, sectionLength);
    
    state.roadSections.push({
        road: road,
        walls: [leftWall, rightWall],
        zStart: zOffset,
        zEnd: zOffset + sectionLength
    });
}

function createObstaclesInSection(zOffset, sectionLength) {
    const obstacleCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < obstacleCount; i++) {
        const obstacleZ = zOffset + (i + 1) * (sectionLength / (obstacleCount + 1));
        const lane = Math.floor(Math.random() * 3) - 1;
        const x = lane * 6;
        
        const obstacle = new THREE.Mesh(
            new THREE.BoxGeometry(4, 2, 2),
            new THREE.MeshStandardMaterial({ color: 0xaa0000 })
        );
        obstacle.position.set(x, 1, obstacleZ);
        scene.add(obstacle);
        
        state.obstacles.push(obstacle);
    }
}

function placeKeysOnInfiniteRoad() {
    keys.forEach(key => {
        scene.remove(key);
    });
    keys = [];
    
    const keyPositions = [
        { x: -6, z: 150 },
        { x: 0, z: 450 },
        { x: 6, z: 750 }
    ];
    
    keyPositions.forEach(pos => {
        const keyGroup = new THREE.Group();
        
        const keyBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16),
            new THREE.MeshBasicMaterial({ color: 0xffcc00 })
        );
        keyBase.rotation.x = Math.PI / 2;
        
        const keyStem = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.8),
            new THREE.MeshBasicMaterial({ color: 0xffcc00 })
        );
        keyStem.position.z = 0.4;
        
        const keyHead = new THREE.Mesh(
            new THREE.TorusGeometry(0.2, 0.05, 8, 16),
            new THREE.MeshBasicMaterial({ color: 0xffcc00 })
        );
        keyHead.rotation.x = Math.PI / 2;
        keyHead.position.z = -0.2;
        
        const keyTooth1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.1),
            new THREE.MeshBasicMaterial({ color: 0xffcc00 })
        );
        keyTooth1.position.set(0.1, 0, 0.6);
        
        const keyTooth2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.05, 0.15),
            new THREE.MeshBasicMaterial({ color: 0xffcc00 })
        );
        keyTooth2.position.set(-0.08, 0, 0.7);
        
        keyGroup.add(keyBase);
        keyGroup.add(keyStem);
        keyGroup.add(keyHead);
        keyGroup.add(keyTooth1);
        keyGroup.add(keyTooth2);
        
        keyGroup.position.set(pos.x, 1, pos.z);
        scene.add(keyGroup);
        keys.push(keyGroup);
    });
}

function updateInfiniteRoad() {
    if (!state.infiniteRoad) return;
    
    const playerZ = camera.position.z;
    const lastSection = state.roadSections[state.roadSections.length - 1];
    
    if (playerZ > lastSection.zStart + 50) {
        const newZ = lastSection.zEnd;
        createRoadSection(newZ);
        
        if (state.roadSections.length > 10) {
            const oldSection = state.roadSections.shift();
            scene.remove(oldSection.road);
            oldSection.walls.forEach(wall => scene.remove(wall));
            
            state.obstacles = state.obstacles.filter(obs => {
                if (obs.position.z < oldSection.zStart) {
                    scene.remove(obs);
                    return false;
                }
                return true;
            });
        }
    }
    
    if (state.keysCollected >= state.totalKeys && !state.portalCreated) {
        createFinalGateAndPortal();
    }
    
    checkKeyRespawn();
    
    checkPortalPassed();
}

function checkPortalPassed() {
    if (state.portalActive && state.portal && state.gate) {
        if (camera.position.z > state.portal.position.z + 10) {
            movePortalForward();
        }
    }
}

function movePortalForward() {
    if (!state.portalActive || !state.portal || !state.gate) return;
    
    scene.remove(state.portal);
    scene.remove(state.gate);
    
    const newZ = camera.position.z + 300;
    createFinalGateAndPortalAtPosition(newZ);
    
    showMessage("ПОРТАЛ ПЕРЕМЕЩЕН ВПЕРЕД! БЕГИ К НЕМУ!", 3000, "#00ffff");
}

function createFinalGateAndPortalAtPosition(zPosition) {
    const gateGroup = new THREE.Group();
    
    const leftPillar = new THREE.Mesh(
        new THREE.BoxGeometry(1, 5, 1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    leftPillar.position.set(-4, 2.5, zPosition);
    
    const rightPillar = new THREE.Mesh(
        new THREE.BoxGeometry(1, 5, 1),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    rightPillar.position.set(4, 2.5, zPosition);
    
    const crossbeam = new THREE.Mesh(
        new THREE.BoxGeometry(9, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    crossbeam.position.set(0, 5, zPosition);
    
    gateGroup.add(leftPillar);
    gateGroup.add(rightPillar);
    gateGroup.add(crossbeam);
    
    state.gate = gateGroup;
    scene.add(gateGroup);
    
    const portalGroup = new THREE.Group();
    
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.3, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    ring.rotation.x = Math.PI / 2;
    
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 100;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 5;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ 
        size: 0.1, 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.7 
    });
    const portalParticles = new THREE.Points(particlesGeo, particlesMat);
    
    const portalLight = new THREE.PointLight(0x00ffff, 2, 20);
    
    portalGroup.add(ring);
    portalGroup.add(portalParticles);
    portalGroup.add(portalLight);
    
    portalGroup.position.set(0, 1, zPosition + 10);
    state.portal = portalGroup;
    scene.add(portalGroup);
    state.portalActive = true;
    state.portalCreated = true;
    
    playSound('gate_open');
    playSound('portal_spawn');
    portalIndicator.style.display = 'block';
    showMessage("ВОРОТА ОТКРЫТЫ! БЕГИ К ПОРТАЛУ!", 5000, "#00ff00");
}

function checkKeyRespawn() {
    const playerZ = camera.position.z;
    
    keys.forEach(key => {
        if (key.position.z < playerZ - 50 && !key.userData.collected) {
            const newZ = playerZ + 300 + Math.random() * 200;
            const lane = Math.floor(Math.random() * 3) - 1;
            const x = lane * 6;
            
            key.position.set(x, 1, newZ);
            key.userData.collected = false;
        }
    });
}

function createFinalGateAndPortal() {
    createFinalGateAndPortalAtPosition(camera.position.z + 200);
}

function spawnFinalMonsters() {
    monster.position.set(0, 1.3, camera.position.z - 20);
    state.monsterState = 'chasing';
    
    lightMonster.position.set(-5, 1.0, camera.position.z - 30);
    state.lightMonsterActive = true;
    
    observer.position.set(5, 1.0, camera.position.z - 40);
    state.observerActive = true;
    
    scene.add(monster);
    scene.add(lightMonster);
    scene.add(observer);
}

function collectKey(keyObj) {
    scene.remove(keyObj);
    keys = keys.filter(k => k !== keyObj);
    state.keysCollected++;
    keysCounter.textContent = `Ключи: ${state.keysCollected}/${state.totalKeys}`;
    playSound('key_pickup');
    showMessage(`Найден ключ! ${state.keysCollected}/${state.totalKeys}`, 2000, "#ffcc00");
    
    if (state.keysCollected >= state.totalKeys) {
        createFinalGateAndPortal();
    }
}

function startFinalChase() {
    renderer.setPixelRatio(1.0);

    state.finalChase = true;
    state.finalChaseStartTime = performance.now();
    
    createInfiniteRoad();
}

function respawnInFinalChase() {
    state.respawningInFinalChase = true;
    state.isGameOver = false;
    document.getElementById('death-screen').style.display = 'none';
    controls.lock();
    
    stopAllSounds();
    
    state.portalActive = false;
    state.portalCreated = false;
    portalIndicator.style.display = 'none';
    
    state.finalChase = false;
    state.infiniteRoad = false;
    
    state.keysCollected = 0;
    state.health = state.maxHealth;
    updateHearts();
    
    monster.position.set(0, -100, 0);
    lightMonster.position.set(0, -100, 0);
    observer.position.set(0, -100, 0);
    state.monsterState = 'patrol';
    state.lightMonsterActive = false;
    state.observerActive = false;
    
    if (state.portal) {
        scene.remove(state.portal);
        state.portal = null;
    }
    if (state.gate) {
        scene.remove(state.gate);
        state.gate = null;
    }
    
    setTimeout(() => {
        startFinalChase();
        state.respawningInFinalChase = false;
    }, 1000);
    
    showMessage("ВОЗРОЖДЕНИЕ! БЕГИ СНОВА!", 3000, "#00ff00");
}

function startGame() {
    if (!scene) initGame();
    controls.lock();
    document.getElementById('difficulty-screen').style.display = 'none';
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    revivesCounter.style.display = 'block';
    revivesCounter.textContent = `Возрождений: ${state.revives}`;
    
    playBackgroundMusic();
}

function initGame() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    scene.fog = new THREE.FogExp2(0x020202, CONFIG.fogDensity);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    flashLight = new THREE.SpotLight(0xffffff, 1.2, 50, Math.PI / 4, 0.5, 1);
    flashLight.position.set(0, 0, 0);
    flashLight.target.position.set(0, 0, -1);
    camera.add(flashLight);
    camera.add(flashLight.target);
    scene.add(camera);
    
    const moonLight = new THREE.DirectionalLight(0x222244, 0.3);
    moonLight.position.set(50, 100, 50);
    scene.add(moonLight);

    const floorGeo = new THREE.PlaneGeometry(300, 300);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1.0 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    for (let i = 0; i < 300; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, z);

        const trunkH = 2 + Math.random() * 2;
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.4, trunkH, 4),
            new THREE.MeshBasicMaterial({ color: 0x050505 })
        );
        trunk.position.y = trunkH / 2;
        treeGroup.add(trunk);

        const cones = Math.floor(Math.random() * 2) + 2;
        for(let j=0; j<cones; j++) {
            const coneH = 2 + Math.random();
            const coneW = 1.5 - (j * 0.3);
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(coneW, coneH, 7),
                new THREE.MeshStandardMaterial({ color: 0x070907 })
            );
            cone.position.y = trunkH + (j * 1.5);
            treeGroup.add(cone);
        }
        
        treeGroup.rotation.y = Math.random() * Math.PI;
        treeGroup.rotation.z = (Math.random() - 0.5) * 0.1;
        treeGroup.rotation.x = (Math.random() - 0.5) * 0.1;
        scene.add(treeGroup);
    }

    for (let i = 0; i < 100; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        if (Math.sqrt(x*x + z*z) < 15) continue;

        const objectType = Math.random() < 0.5 ? 'rock' : 'bush';
        let object;
        
        if (objectType === 'rock') {
            object = new THREE.Mesh(
                new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 6, 6),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
        } else {
            object = new THREE.Mesh(
                new THREE.SphereGeometry(1 + Math.random(), 6, 6),
                new THREE.MeshStandardMaterial({ color: 0x003300 })
            );
        }
        
        object.position.set(x, objectType === 'rock' ? 0.5 : 1, z);
        scene.add(object);
    }

    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i=0; i<particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 100;
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.1, color: 0xaaaaaa, transparent: true, opacity: 0.5 });
    particles = new THREE.Points(particlesGeo, particlesMat);
    camera.add(particles);

    const noteGeo = new THREE.PlaneGeometry(0.4, 0.5);
    const noteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    for (let i = 0; i < state.totalNotes; i++) {
        let nx, nz;
        let safe = false;
        while(!safe) {
            nx = (Math.random() - 0.5) * 180;
            nz = (Math.random() - 0.5) * 180;
            if (Math.sqrt(nx*nx + nz*nz) > 15) safe = true;
        }

        const note = new THREE.Mesh(noteGeo, noteMat);
        note.position.set(nx, 1.5, nz);
        note.rotation.y = Math.random() * Math.PI * 2;
        
        const noteLight = new THREE.PointLight(0x00ffff, 1, 10);
        noteLight.position.z = 0.2;
        note.add(noteLight);
        
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4), new THREE.MeshStandardMaterial({color:0x333333}));
        stick.position.y = -0.75;
        note.add(stick);

        scene.add(note);
        notes.push(note);
    }

    const monsterGroup = new THREE.Group();
    
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.1, 2.6, 8), 
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    body.position.y = 1.3;
    
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 6), 
        new THREE.MeshBasicMaterial({color: 0x000000})
    );
    head.position.y = 2.6;
    head.scale.set(1.2, 0.9, 0.8);
    
    const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyes = new THREE.Mesh(eyeGeo, eyeMat);
    const eyes2 = new THREE.Mesh(eyeGeo, eyeMat);
    
    eyes.position.set(-0.18, 2.6, 0.35);
    eyes2.position.set(0.12, 2.55, 0.38);
    eyes.scale.set(1, 0.8, 1);
    eyes2.scale.set(0.9, 1.1, 1);
    
    const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(0.15, 0.05, 8, 12, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0x330000 })
    );
    mouth.position.set(0, 2.3, 0.4);
    mouth.rotation.x = Math.PI / 6;
    
    const arm1 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.05, 1.5, 6),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    arm1.position.set(-0.5, 1.8, 0);
    arm1.rotation.z = Math.PI / 4;
    
    const arm2 = arm1.clone();
    arm2.position.set(0.5, 1.8, 0);
    arm2.rotation.z = -Math.PI / 4;
    
    const eyeLight = new THREE.PointLight(0xff0000, 1.5, 8);
    eyeLight.position.set(0, 2.6, 0.5);

    monsterGroup.add(body); 
    monsterGroup.add(head); 
    monsterGroup.add(eyes); 
    monsterGroup.add(eyes2);
    monsterGroup.add(mouth);
    monsterGroup.add(arm1);
    monsterGroup.add(arm2);
    monsterGroup.add(eyeLight);
    
    monster = monsterGroup;
    monster.position.set(0, -100, 0);
    scene.add(monster);

    const lightMonsterGroup = new THREE.Group();
    
    const lightBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x330033, transparent: true, opacity: 0.8 })
    );
    lightBody.position.y = 1.0;
    
    const lightEye1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x9900ff })
    );
    const lightEye2 = lightEye1.clone();
    lightEye1.position.set(-0.2, 0.2, 0.4);
    lightEye2.position.set(0.2, 0.2, 0.4);
    
    const lightMouth = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.05, 8, 12, Math.PI),
        new THREE.MeshBasicMaterial({ color: 0x9900ff })
    );
    lightMouth.position.set(0, -0.1, 0.4);
    lightMouth.rotation.x = Math.PI / 6;
    
    const lightGlow = new THREE.PointLight(0x9900ff, 1.0, 10);
    lightGlow.position.set(0, 0.5, 0);
    
    lightMonsterGroup.add(lightBody);
    lightMonsterGroup.add(lightEye1);
    lightMonsterGroup.add(lightEye2);
    lightMonsterGroup.add(lightMouth);
    lightMonsterGroup.add(lightGlow);
    
    lightMonster = lightMonsterGroup;
    lightMonster.position.set(0, -100, 0);
    scene.add(lightMonster);

    createObserver();

    createItems();

    renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        powerPreference: "high-performance",
        precision: "mediump"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x020202);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());

    initMinimap();

    createHearts();

    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': moveRight = true; break;
            case 'ShiftLeft': state.sprint = true; break;
            case 'KeyF': state.flashlightOn = !state.flashlightOn; playSound('flicker'); break;
            case 'Digit1': useMedkit(); break;
            case 'Digit2': useBattery(); break;
            case 'Digit3': useEnergyDrink(); break;
        }
    });
    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': moveRight = false; break;
            case 'ShiftLeft': state.sprint = false; break;
        }
    });
    document.addEventListener('mousedown', () => {
        if (controls.isLocked) {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
            
            const noteIntersects = raycaster.intersectObjects(notes);
            if (noteIntersects.length > 0) {
                const obj = noteIntersects[0].object;
                if (obj.position.distanceTo(camera.position) < 8) collectNote(obj);
            }
            
            const itemIntersects = raycaster.intersectObjects(items);
            if (itemIntersects.length > 0) {
                const obj = itemIntersects[0].object;
                if (obj.position.distanceTo(camera.position) < 8) collectItem(obj);
            }
            
            const keyIntersects = raycaster.intersectObjects(keys, true);
            if (keyIntersects.length > 0) {
                const obj = keyIntersects[0].object;
                let keyGroup = obj;
                while (keyGroup.parent && !keys.includes(keyGroup)) {
                    keyGroup = keyGroup.parent;
                }
                if (keys.includes(keyGroup) && keyGroup.position.distanceTo(camera.position) < 8) {
                    collectKey(keyGroup);
                }
            }
        }
    });
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    startMonsterPatrol();
    
    loadSounds().then(() => {
        console.log("Все звуки загружены");
    });
    
    animate();
}

function collectNote(noteObj) {
    scene.remove(noteObj);
    notes = notes.filter(n => n !== noteObj);
    state.notes++;
    document.getElementById('notes-counter').innerText = `${state.notes} / 10`;
    playSound('pickup');
    
    if (state.notes % 2 === 0) { 
        cpMsgEl.style.display = 'block';
        setTimeout(() => cpMsgEl.style.display = 'none', 2000);
    }
    
    if (state.notes === 3 || state.notes === 6) {
        spawnObserver();
    }
    
    if (state.notes === 10) {
        startFinalChase();
    } else {
        handleRandomEvents(state.notes);
    }
}

function handleRandomEvents(count) {
    if (count === 7) {
        startChaseEvent();
        return;
    }

    const events = [
        triggerFaceJumpscare,
        triggerBloodMode,
        () => { 
            showMessage("Свет нестабилен.", 3000); 
            let flickerCount = 0;
            const maxFlickers = 20;
            const flickerInterval = setInterval(() => {
                flashLight.intensity = Math.random() > 0.5 ? 0 : 1.2; 
                playSound('flicker');
                flickerCount++; 
                if (flickerCount > maxFlickers) { 
                    clearInterval(flickerInterval); 
                    flashLight.intensity = state.flashlightOn ? 1.2 : 0; 
                }
            }, 50);
        },
        () => { showMessage("Головокружение...", 4000); state.panicMode = true; setTimeout(() => state.panicMode = false, 8000); },
        () => { 
            showMessage("Они шепчут...", 4000); 
            playSound('whisper'); 
            staticEl.style.opacity = 0.5; 
            setTimeout(() => staticEl.style.opacity = 0, 1000); 
        },
        () => {
            showMessage("Глаза привыкают к тьме?", 4000);
            scene.fog.color.setHex(0xffffff);
            scene.background.setHex(0xaaaaaa);
            setTimeout(() => {
                scene.fog.color.setHex(0x020202);
                scene.background.setHex(0x020202);
            }, 5000);
        },
        () => {
            showMessage("Что-то приближается...", 3000);
            playSound('growl');
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            monster.position.copy(camera.position).add(dir.multiplyScalar(30));
            monster.position.y = 1.3;
            setTimeout(() => {
                if (state.monsterState !== 'chasing') monster.position.y = -100;
            }, 2000);
        }
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
}

function triggerFaceJumpscare() {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    monster.position.copy(camera.position).add(dir.multiplyScalar(1.5));
    monster.position.y = 1.3; 
    monster.lookAt(camera.position);
    playSound('scream');
    flashEl.style.opacity = 1;
    jumpscareEl.style.display = 'block';
    setTimeout(() => {
        monster.position.set(0, -100, 0);
        flashEl.style.opacity = 0;
        jumpscareEl.style.display = 'none';
    }, 800);
}

function triggerBloodMode() {
    showMessage("КРОВЬ", 4000, "red"); 
    bloodEl.style.display = 'block'; 
    scene.fog.color.setHex(0x550000);
    playSound('scream'); 
    setTimeout(() => {
        bloodEl.style.display = 'none';
        scene.fog.color.setHex(0x020202);
    }, 5000); 
}

function startChaseEvent() {
    state.monsterState = 'chasing';
    teleportMonsterBehindPlayer(CONFIG.spawnDistance); 
    state.adrenaline = 100;
    adrenalineWrapper.style.display = 'block';
    state.chaseTimeLeft = 15;
    chaseTimerEl.style.display = 'block';
    chaseTimerEl.textContent = state.chaseTimeLeft;
    
    state.gracePeriodActive = true;
    state.chaseStartTime = performance.now();
    
    showMessage("АДРЕНАЛИН! БЕГИ ОТ МОНСТРА! (5 сек защиты)", 4000, "#00ffff");
    playSound('adrenaline_boost');
    startHeartbeat();

    if (graceTimer) clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
        state.gracePeriodActive = false;
        showMessage("ЗАЩИТА ЗАКОНЧИЛАСЬ! ПРОДОЛЖАЙ БЕЖАТЬ!", 2000, "#ff0000");
    }, CONFIG.gracePeriod);

    if (chaseCountdownTimer) clearInterval(chaseCountdownTimer);
    chaseCountdownTimer = setInterval(() => {
        state.chaseTimeLeft--;
        chaseTimerEl.textContent = state.chaseTimeLeft;
        
        if (state.chaseTimeLeft <= 5) {
            chaseTimerEl.style.color = '#ff0000';
            chaseTimerEl.style.textShadow = '0 0 15px #ff0000';
        }
        
        if (state.chaseTimeLeft <= 0) {
            clearInterval(chaseCountdownTimer);
            if (!state.isGameOver && state.notes < 10) endChaseEvent();
        }
    }, 1000);

    if (chaseTimer) clearTimeout(chaseTimer);
    chaseTimer = setTimeout(() => {
        if (!state.isGameOver && state.notes < 10) endChaseEvent();
    }, CONFIG.chaseDuration);
}

function endChaseEvent() {
    state.monsterState = 'patrol';
    monster.position.y = -100;
    showMessage("Ты пережил погоню!", 4000, "#00ff00");
    stopHeartbeat();
    
    setTimeout(() => { 
        adrenalineWrapper.style.display = 'none'; 
        state.adrenaline = 0;
        chaseTimerEl.style.display = 'none';
        chaseTimerEl.style.color = '#ff0000';
        chaseTimerEl.style.textShadow = '0 0 10px #ff0000';
        state.gracePeriodActive = false;
    }, 2000);
    
    if (chaseCountdownTimer) clearInterval(chaseCountdownTimer);
    if (graceTimer) clearTimeout(graceTimer);
    startMonsterPatrol();
}

function trySpawnLightMonster() {
    if (state.lightMonsterActive || state.isGameOver || state.monsterState === 'chasing') return;
    
    if (state.lightMonsterCooldown > 0) return;
    
    if (Math.random() < CONFIG.lightMonsterSpawnChance) {
        spawnLightMonster();
    }
}

function spawnLightMonster() {
    const angle = Math.random() * Math.PI * 2;
    const distance = CONFIG.lightMonsterMinDistance + Math.random() * (CONFIG.lightMonsterMaxDistance - CONFIG.lightMonsterMinDistance);
    
    const x = camera.position.x + Math.cos(angle) * distance;
    const z = camera.position.z + Math.sin(angle) * distance;
    
    lightMonster.position.set(x, 1.0, z);
    state.lightMonsterActive = true;
    state.lightMonsterExposure = 0;
    
    playSound('light_monster_spawn');
    showMessage("ЧУВСТВУЮ СВЕТОЧУВСТВИТЕЛЬНОЕ СУЩЕСТВО!", 3000, "#9900ff");
    flashlightIndicator.style.display = 'block';
}

function updateLightMonster(delta) {
    if (!state.lightMonsterActive) return;
    
    const dist = lightMonster.position.distanceTo(camera.position);
    
    const monsterDirection = new THREE.Vector3().subVectors(lightMonster.position, camera.position).normalize();
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);
    
    const angle = monsterDirection.angleTo(viewDirection);
    const isLookingAtMonster = angle < Math.PI/4;
    
    let currentSpeed = state.finalChase ? CONFIG.finalChaseLightMonsterSpeed : CONFIG.lightMonsterSpeed;
    state.lightMonsterSlowed = false;
    
    if (isLookingAtMonster) {
        if (state.flashlightOn && state.battery > 0) {
            currentSpeed = 0;
            state.lightMonsterBeingExposed = true;
            state.lightMonsterExposure += delta;
            
            const scale = 1.0 - (state.lightMonsterExposure / CONFIG.lightMonsterExposureTime) * 0.5;
            lightMonster.scale.set(scale, scale, scale);
            
            const progress = Math.min(state.lightMonsterExposure / CONFIG.lightMonsterExposureTime, 1.0);
            flashlightIndicator.textContent = `СВЕТИ НА МОНСТРА! ${Math.round(progress * 100)}%`;
            
            if (Math.random() < 0.1) {
                playSound('light_monster_hurt');
            }
            
            if (state.lightMonsterExposure >= CONFIG.lightMonsterExposureTime) {
                defeatLightMonster();
                return;
            }
        } else {
            currentSpeed = CONFIG.lightMonsterSlowSpeed;
            state.lightMonsterSlowed = true;
            state.lightMonsterBeingExposed = false;
            
            if (state.battery <= 0) {
                flashlightIndicator.textContent = "СМОТРИ НА МОНСТРА! (ФОНАРИК РАЗРЯЖЕН)";
            } else {
                flashlightIndicator.textContent = "СМОТРИ НА МОНСТРА! (ВКЛЮЧИ ФОНАРИК ДЛЯ ОСТАНОВКИ)";
            }
            
            lightMonster.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }
    } else {
        state.lightMonsterBeingExposed = false;
        state.lightMonsterExposure = Math.max(0, state.lightMonsterExposure - delta * 0.5);
        flashlightIndicator.textContent = "СВЕТИ НА МОНСТРА!";
        
        lightMonster.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
    
    if (dist > 2.0 && currentSpeed > 0) {
        const dir = new THREE.Vector3().subVectors(camera.position, lightMonster.position).normalize();
        lightMonster.position.x += dir.x * currentSpeed * delta;
        lightMonster.position.z += dir.z * currentSpeed * delta;
        lightMonster.lookAt(camera.position);
    } else if (dist <= 2.0) {
        takeDamage(7);
        defeatLightMonster();
        return;
    }
}

function defeatLightMonster() {
    state.lightMonsterActive = false;
    lightMonster.position.y = -100;
    state.lightMonsterExposure = 0;
    flashlightIndicator.style.display = 'none';
    
    state.lightMonsterCooldown = CONFIG.lightMonsterCooldown;
    
    playSound('light_monster_death');
    showMessage("СУЩЕСТВО ИСЧЕЗЛО!", 3000, "#00ff00");
    
    state.battery = Math.min(state.battery + 20, 100);
}

function startMonsterPatrol() {
    if (patrolTimer) clearInterval(patrolTimer);
    if (monsterSightTimer) clearInterval(monsterSightTimer);
    
    state.monsterState = 'patrol';
    
    patrolTimer = setInterval(() => {
        if (state.isGameOver || state.monsterState !== 'patrol') return;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        monster.position.set(x, 1.3, z);
    }, 8000 + Math.random() * 7000);
    
    monsterSightTimer = setInterval(() => {
        if (state.isGameOver || state.monsterState !== 'patrol') return;
        
        checkMonsterSight();
    }, 1000);
}

function checkMonsterSight() {
    const dist = monster.position.distanceTo(camera.position);
    
    if (dist < CONFIG.monsterSightDistance) {
        const raycaster = new THREE.Raycaster();
        raycaster.set(monster.position, new THREE.Vector3().subVectors(camera.position, monster.position).normalize());
        
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0 && intersects[0].distance > dist - 2) {
            if (!state.monsterVisible) {
                state.monsterVisible = true;
                showMessage("ОНО ВИДИТ ТЕБЯ!", 3000, "#ff0000");
                playSound('growl');
            }
            
            state.lastMonsterSighting = performance.now();
            
            if (Math.random() < 0.3 && state.monsterState === 'patrol') {
                startChaseEvent();
            }
        } else {
            state.monsterVisible = false;
        }
    } else {
        state.monsterVisible = false;
    }
}

function respawnPlayer() {
    if (state.revives <= 0) {
        location.reload();
        return;
    }
    
    state.revives--;
    revivesCounter.textContent = `Возрождений: ${state.revives}`;
    
    stopAllSounds();
    
    if (state.finalChase && !state.respawningInFinalChase) {
        respawnInFinalChase();
        return;
    }
    
    state.isGameOver = false;
    document.getElementById('death-screen').style.display = 'none';
    controls.lock();
    camera.position.set(0, 1.7, 0); 
    monster.position.y = -100;
    lightMonster.position.y = -100;
    observer.position.y = -100;
    state.monsterState = 'patrol';
    state.lightMonsterActive = false;
    state.observerActive = false;
    state.stamina = 100;
    state.battery = 100;
    state.health = state.maxHealth;
    state.panicMode = false;
    scene.fog.color.setHex(0x020202);
    scene.background.setHex(0x020202);
    state.finalChase = false;
    finalChaseOverlay.style.display = 'none';
    state.keysCollected = 0;
    keysCounter.style.display = 'none';
    state.portalActive = false;
    state.portalCreated = false;
    portalIndicator.style.display = 'none';
    state.infiniteRoad = false;
    
    if (state.portal) {
        scene.remove(state.portal);
        state.portal = null;
    }
    if (state.gate) {
        scene.remove(state.gate);
        state.gate = null;
    }
    
    if (chaseTimer) clearTimeout(chaseTimer);
    if (chaseCountdownTimer) clearInterval(chaseCountdownTimer);
    if (graceTimer) clearTimeout(graceTimer);
    if (finalChaseTimer) clearTimeout(finalChaseTimer);
    if (finalChaseCountdownTimer) clearInterval(finalChaseCountdownTimer);
    stopHeartbeat();
    bloodEl.style.display = 'none';
    adrenalineWrapper.style.display = 'none';
    chaseTimerEl.style.display = 'none';
    flashlightIndicator.style.display = 'none';
    state.adrenaline = 0;
    state.gracePeriodActive = false;
    state.lightMonsterCooldown = 0;
    updateHearts();
    showMessage("ВОЗРОЖДЕНИЕ", 3000, "#00ff00");
    
    playBackgroundMusic();
    
    startMonsterPatrol();
}

function showMessage(text, time, color = "#ffcccc") {
    msgEl.innerText = text; msgEl.style.color = color; msgEl.style.display = 'block';
    setTimeout(() => { msgEl.style.display = 'none'; }, time);
}

function flickerFlashlight(times) {
    let count = 0;
    const interval = setInterval(() => {
        flashLight.intensity = Math.random() > 0.5 ? 0 : 1.2; playSound('flicker');
        count++; if (count > times * 2) { clearInterval(interval); flashLight.intensity = 1.2; }
    }, 100);
}

function startHeartbeat() {
    if (heartBeatTimer) return;
    heartBeatTimer = setInterval(() => {
        if (state.isGameOver || state.notes >= 10) stopHeartbeat();
        playSound('heartbeat');
    }, 500);
}
function stopHeartbeat() { clearInterval(heartBeatTimer); heartBeatTimer = null; }

function teleportMonsterBehindPlayer(dist) {
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    dir.y = 0; dir.normalize();
    const behind = dir.clone().multiplyScalar(-dist);
    monster.position.copy(camera.position).add(behind);
    monster.position.y = 1.3;
    monster.lookAt(camera.position);
}

function gameOver() {
    state.isGameOver = true; controls.unlock();
    
    if (state.revives > 0) {
        deathMessageEl.textContent = `Оно нашло тебя. Осталось возрождений: ${state.revives}`;
    } else {
        deathMessageEl.textContent = "Игра окончена. Возрождений не осталось.";
    }
    
    document.getElementById('death-screen').style.display = 'flex'; 
    playSound('scream');
    
    if (Math.random() < 0.7) {
        setTimeout(() => {
            jumpscareEl.style.display = 'block';
            setTimeout(() => jumpscareEl.style.display = 'none', 500);
        }, 1000);
    }
}

function winGame() {
    state.isGameOver = true; controls.unlock();
    playSound('portal_enter');
    document.getElementById('win-screen').style.display = 'flex';
}

function animate() {
    requestAnimationFrame(animate);
    if (controls && controls.isLocked && !state.isGameOver) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;
        prevTime = time;

        notes.forEach(note => { 
            const scale = 1 + Math.sin(time * 0.003) * 0.1; 
            note.scale.set(scale, scale, scale); 
        });

        if (state.panicMode) { camera.fov = 75 + Math.sin(time * 0.01) * 10; camera.updateProjectionMatrix(); }

        if (state.adrenaline > 0) {
            if (state.finalChase) {
                state.adrenaline = 100;
            } else {
                state.adrenaline -= CONFIG.adrenalineDuration * delta;
                if (state.adrenaline < 0) state.adrenaline = 0;
            }
            adrenalineBar.style.width = (state.adrenaline / state.maxAdrenaline * 100) + '%';
            state.stamina = 100; 
        }

        if (state.flashlightOn) {
            state.battery -= 2 * delta; flashLight.intensity = 1.2;
            if (state.battery <= 0) { state.battery = 0; flashLight.intensity = 0; }
        } else {
            state.battery += 5 * delta; flashLight.intensity = 0;
            if (state.battery > 100) state.battery = 100;
        }
        batteryBar.style.width = state.battery + '%';
        batteryBar.style.background = state.battery < 20 ? 'red' : '#ffcc00';

        if (state.adrenaline <= 0) {
            if (state.sprint && (moveForward || moveBackward || moveLeft || moveRight)) {
                state.stamina -= 20 * delta; 
                if (state.stamina < 0) { state.stamina = 0; state.sprint = false; }
            } else {
                state.stamina += 10 * delta; 
                if (state.stamina > 100) state.stamina = 100;
            }
        }
        staminaBar.style.width = state.stamina + '%';

        let speed = CONFIG.walkSpeed;
        if (state.sprint) {
            if (state.adrenaline > 0) {
                speed = CONFIG.adrenalineSpeed;
            } else if (state.stamina > 0) {
                speed = CONFIG.sprintSpeed;
            }
        }

        if (state.finalChase) {
            speed = CONFIG.finalChasePlayerSpeed;
        }

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.y = 1.7;

        if (state.finalChase) {
            if (camera.position.x < -9) camera.position.x = -9;
            if (camera.position.x > 9) camera.position.x = 9;
            
            updateInfiniteRoad();
        } else {
            if (camera.position.x < -100) camera.position.x = -100;
            if (camera.position.x > 100) camera.position.x = 100;
            if (camera.position.z < -100) camera.position.z = -100;
            if (camera.position.z > 100) camera.position.z = 100;
        }

        const dist = monster.position.distanceTo(camera.position);
        if (state.monsterState === 'chasing') {
            monster.lookAt(camera.position);
            
            let currentMonsterSpeed = 0;
            
            if (dist > CONFIG.monsterStopDistance) {
                currentMonsterSpeed = CONFIG.monsterChaseSpeed;
                
                if (state.finalChase) {
                    currentMonsterSpeed = CONFIG.finalChaseMonsterSpeed;
                }
                
                const dir = new THREE.Vector3().subVectors(camera.position, monster.position).normalize();
                monster.position.x += dir.x * currentMonsterSpeed * delta;
                monster.position.z += dir.z * currentMonsterSpeed * delta;
            }
            
            monster.position.y = 1.3;

            if (dist < CONFIG.deathDistance + 1.0 && !state.gracePeriodActive) {
                takeDamage(4);
                const dir = new THREE.Vector3().subVectors(monster.position, camera.position).normalize();
                monster.position.add(dir.multiplyScalar(5));
            }
            
            if (Math.random() < 0.02) playSound('growl');
        } else if (state.monsterState === 'patrol') {
            if (state.lastMonsterSighting > 0 && time - state.lastMonsterSighting < 10000) {
                const dir = new THREE.Vector3().subVectors(camera.position, monster.position).normalize();
                monster.position.x += dir.x * CONFIG.monsterPatrolSpeed * delta;
                monster.position.z += dir.z * CONFIG.monsterPatrolSpeed * delta;
                monster.position.y = 1.3;
                monster.lookAt(camera.position);
            }
            
            if (Math.random() < 0.005) playSound('breathing');
        }
        
        if (!state.finalChase) {
            trySpawnLightMonster();
        }
        updateLightMonster(delta);
        
        updateObserver(delta);
        
        if (state.lightMonsterCooldown > 0) {
            state.lightMonsterCooldown -= delta;
            if (state.lightMonsterCooldown < 0) state.lightMonsterCooldown = 0;
        }
        
        if (state.finalChase) {
            state.obstacles.forEach(obstacle => {
                if (obstacle.position.distanceTo(camera.position) < 2.5) {
                    takeDamage(1);
                    const dir = new THREE.Vector3().subVectors(camera.position, obstacle.position).normalize();
                    camera.position.add(dir.multiplyScalar(3));
                    showMessage("СТОЛКНОВЕНИЕ! ОБХОДИ ПРЕПЯТСТВИЯ!", 2000, "#ff0000");
                }
            });
            
            keys.forEach(key => {
                if (key.position.distanceTo(camera.position) < 2) {
                    collectKey(key);
                }
            });
        }
        
        checkPortal();
        
        drawMinimap();
        
    } else {
        prevTime = performance.now();
    }
    if (renderer) renderer.render(scene, camera);
}