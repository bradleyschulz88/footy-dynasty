import { Howl, Howler } from 'howler';

// Volume settings — persisted in localStorage
let masterVolume = parseFloat(localStorage.getItem('fd_volume') ?? '0.6');
Howler.volume(masterVolume);

// Sound registry — paths will be wired when assets are added
const SOUNDS = {};

// Helper: play a named sound if it exists
function play(name) {
  const s = SOUNDS[name];
  if (!s) return;
  try { s.play(); } catch (_) {}
}

export const audio = {
  setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v));
    Howler.volume(masterVolume);
    localStorage.setItem('fd_volume', String(masterVolume));
  },
  getVolume: () => masterVolume,
  // Named cues — no-op until sound assets are added
  goal:      () => play('goal'),
  siren:     () => play('siren'),
  crowd:     () => play('crowd_roar'),
  click:     () => play('ui_click'),
  whoosh:    () => play('ui_whoosh'),
  milestone: () => play('milestone'),
};
