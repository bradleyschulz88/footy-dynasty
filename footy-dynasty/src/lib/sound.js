// ---------------------------------------------------------------------------
// Match-day sound — synthesized with WebAudio so no assets ship with the app.
// Crowd noise is filtered white noise; the siren is the classic two-tone blast.
// All entry points are safe to call anywhere: they no-op without a user
// gesture, on unsupported browsers, or when the player has sound off.
// ---------------------------------------------------------------------------

let ctx = null;

function audioCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function noiseBuffer(ac, seconds) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Crowd swell — a goal, a roar. intensity 0–1 scales volume + length. */
export function playCrowdCheer(intensity = 0.7) {
  const ac = audioCtx();
  if (!ac) return;
  const dur = 0.8 + intensity * 0.9;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, dur);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 900;
  filter.Q.value = 0.6;
  const gain = ac.createGain();
  const now = ac.currentTime;
  const peak = 0.05 + intensity * 0.10;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + dur * 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(now);
  src.stop(now + dur);
}

/** The final siren — a sustained two-tone blast. */
export function playSiren() {
  const ac = audioCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const dur = 1.4;
  [392, 466].forEach((freq) => {
    const osc = ac.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.06);
    gain.gain.setValueAtTime(0.06, now + dur - 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur);
  });
}

/** Short umpire whistle — quarter breaks and the coach's call. */
export function playWhistle() {
  const ac = audioCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2200, now);
  osc.frequency.linearRampToValueAtTime(2350, now + 0.10);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

/** Single gate every caller checks: sound defaults ON, toggle in Settings. */
export function soundEnabled(career) {
  return career?.options?.soundOn !== false;
}
