import NOTES from './notes.js';

export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export const audioState = {
    isTunePlaying: false,
    timeoutId: null
};

export function resumeAudioContext() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function playSwoosh() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

export function playTaDa() {
    const playNote = (freq, start, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
    };

    playNote(NOTES.C5, 0, 0.2);
    playNote(NOTES.E5, 0.15, 0.5);
}

export function startBackgroundMusic() {
    if (audioState.isTunePlaying) return;
    audioState.isTunePlaying = true;

    const duration = 0.4;

    const melody = [
        { note: NOTES.C3, duration: duration },
        { note: NOTES.D4, duration: duration },
        { note: NOTES.E4, duration: duration },
        { note: NOTES.G4, duration: duration },
        { note: NOTES.E4, duration: duration },
        { note: NOTES.D4, duration: duration },

        { note: NOTES.D3, duration: duration },
        { note: NOTES.D4, duration: duration },
        { note: NOTES.E4, duration: duration },
        { note: NOTES.G4, duration: duration },
        { note: NOTES.E4, duration: duration },
        { note: NOTES.B2, duration: duration }
    ];

    let index = 0;
    const playNext = () => {
        if (!audioState.isTunePlaying) return;

        const item = melody[index];
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.note, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + item.duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + item.duration);

        index = (index + 1) % melody.length;
        audioState.timeoutId = setTimeout(playNext, item.duration * 1000);
    };

    playNext();
}

export function stopBackgroundMusic() {
    audioState.isTunePlaying = false;
    if (audioState.timeoutId) {
        clearTimeout(audioState.timeoutId);
        audioState.timeoutId = null;
    }
}
