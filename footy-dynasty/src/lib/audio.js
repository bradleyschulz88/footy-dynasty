import { Howler } from 'howler';

let masterVolume = parseFloat(localStorage.getItem('fd_volume') ?? '0.6');
Howler.volume(masterVolume);

// Lazily-created AudioContext for procedural sounds
let _ctx = null;
function getCtx() {
  if (_ctx) return _ctx;
  try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  return _ctx;
}
function ctx() {
  const c = getCtx();
  if (c?.state === 'suspended') c.resume();
  return c;
}

// Goal siren — ascending whirl 440→880→660 Hz over 1.2 s
function playGoal() {
  const c = ctx(); if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'sine';
  const t = c.currentTime;
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.3);
  osc.frequency.exponentialRampToValueAtTime(660, t + 0.9);
  gain.gain.setValueAtTime(masterVolume * 0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  osc.start(t); osc.stop(t + 1.2);
}

// Quarter/match siren — four klaxon blasts
function playSiren() {
  const c = ctx(); if (!c) return;
  [0, 0.28, 0.56, 0.84].forEach(delay => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sawtooth';
    const t = c.currentTime + delay;
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.22);
    gain.gain.setValueAtTime(masterVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.start(t); osc.stop(t + 0.24);
  });
}

// Crowd roar — bandpass-filtered noise burst, 2 s
function playCrowd() {
  const c = ctx(); if (!c) return;
  const len = c.sampleRate * 2;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 0.5;
  const gain = c.createGain();
  const t = c.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(masterVolume * 0.4, t + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
  src.connect(filter); filter.connect(gain); gain.connect(c.destination);
  src.start(t); src.stop(t + 2.0);
}

// UI click — short 800 Hz percussive pulse, 80 ms
function playClick() {
  const c = ctx(); if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'square'; osc.frequency.value = 800;
  const t = c.currentTime;
  gain.gain.setValueAtTime(masterVolume * 0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
  osc.start(t); osc.stop(t + 0.08);
}

// Whoosh — sine sweep 200→1200 Hz, 300 ms
function playWhoosh() {
  const c = ctx(); if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain); gain.connect(c.destination);
  osc.type = 'sine';
  const t = c.currentTime;
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
  gain.gain.setValueAtTime(masterVolume * 0.2, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.start(t); osc.stop(t + 0.3);
}

// Milestone fanfare — C5 → E5 → G5 ascending arpeggio
function playMilestone() {
  const c = ctx(); if (!c) return;
  [[523.25, 0], [659.25, 0.18], [783.99, 0.36]].forEach(([freq, delay]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = 'sine'; osc.frequency.value = freq;
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(masterVolume * 0.35, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.start(t); osc.stop(t + 0.4);
  });
}

export const audio = {
  setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v));
    Howler.volume(masterVolume);
    localStorage.setItem('fd_volume', String(masterVolume));
  },
  getVolume: () => masterVolume,
  goal:      playGoal,
  siren:     playSiren,
  crowd:     playCrowd,
  click:     playClick,
  whoosh:    playWhoosh,
  milestone: playMilestone,
};
