// Sound system — centralized audio management
// src/lib/sound.ts

type SoundName = 
  | 'kickoff' | 'siren' | 'crowd_cheer' | 'crowd_groan' 
  | 'goal' | 'behind' | 'whistle' | 'mark' 
  | 'tackle' | 'injury' | 'notification' 
  | 'button_click' | 'card_flip' | 'page_transition'
  | 'trade_complete' | 'draft_pick' | 'premiership';

const SOUND_MAP: Record<SoundName, { src: string; volume: number }> = {
  kickoff: { src: '/sounds/kickoff.mp3', volume: 0.6 },
  siren: { src: '/sounds/siren.mp3', volume: 0.8 },
  crowd_cheer: { src: '/sounds/crowd-cheer.mp3', volume: 0.5 },
  crowd_groan: { src: '/sounds/crowd-groan.mp3', volume: 0.5 },
  goal: { src: '/sounds/goal.mp3', volume: 0.7 },
  behind: { src: '/sounds/behind.mp3', volume: 0.5 },
  whistle: { src: '/sounds/whistle.mp3', volume: 0.4 },
  mark: { src: '/sounds/mark.mp3', volume: 0.4 },
  tackle: { src: '/sounds/tackle.mp3', volume: 0.4 },
  injury: { src: '/sounds/injury.mp3', volume: 0.6 },
  notification: { src: '/sounds/notification.mp3', volume: 0.4 },
  button_click: { src: '/sounds/click.mp3', volume: 0.2 },
  card_flip: { src: '/sounds/card-flip.mp3', volume: 0.3 },
  page_transition: { src: '/sounds/page-transition.mp3', volume: 0.25 },
  trade_complete: { src: '/sounds/trade-complete.mp3', volume: 0.5 },
  draft_pick: { src: '/sounds/draft-pick.mp3', volume: 0.5 },
  premiership: { src: '/sounds/premiership.mp3', volume: 0.8 },
};

const audioCache = new Map<SoundName, HTMLAudioElement>();
let globalMuted = false;
let masterVolume = 0.7;

function getAudio(name: SoundName): HTMLAudioElement {
  if (!audioCache.has(name)) {
    const audio = new Audio(SOUND_MAP[name].src);
    audio.preload = 'auto';
    audio.volume = SOUND_MAP[name].volume * masterVolume;
    audioCache.set(name, audio);
  }
  return audioCache.get(name)!;
}

export function playSound(name: SoundName, options?: { volume?: number; rate?: number; loop?: boolean }) {
  if (globalMuted) return;
  try {
    const audio = getAudio(name);
    audio.currentTime = 0;
    if (options?.volume !== undefined) audio.volume = options.volume * masterVolume;
    if (options?.rate !== undefined) audio.playbackRate = options.rate;
    if (options?.loop !== undefined) audio.loop = options.loop;
    audio.play().catch(() => {}); // Ignore autoplay policy rejections
  } catch {}
}

export function stopSound(name: SoundName) {
  const audio = audioCache.get(name);
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

export function setMuted(muted: boolean) {
  globalMuted = muted;
  audioCache.forEach(audio => { audio.muted = muted; });
}

export function setMasterVolume(vol: number) {
  masterVolume = Math.max(0, Math.min(1, vol));
  audioCache.forEach((audio, name) => {
    audio.volume = SOUND_MAP[name].volume * masterVolume;
  });
}

export function preloadSounds(names?: SoundName[]) {
  const toLoad = names ?? Object.keys(SOUND_MAP) as SoundName[];
  toLoad.forEach(name => getAudio(name));
}

export function soundEnabled(career: { options?: { soundEnabled?: boolean } } | null): boolean {
  return career?.options?.soundEnabled !== false && !globalMuted;
}

// Convenience functions for common game events
export const playCrowdCheer = (intensity = 1) => playSound('crowd_cheer', { volume: 0.3 + intensity * 0.4 });
export const playCrowdGroan = (intensity = 1) => playSound('crowd_groan', { volume: 0.3 + intensity * 0.4 });
export const playSiren = () => playSound('siren');
export const playKickoff = () => playSound('kickoff');
export const playGoal = () => playSound('goal');
export const playBehind = () => playSound('behind');
export const playWhistle = () => playSound('whistle');
export const playNotification = () => playSound('notification');
export const playButtonClick = () => playSound('button_click');
export const playCardFlip = () => playSound('card_flip');
export const playPageTransition = () => playSound('page_transition');
export const playTradeComplete = () => playSound('trade_complete');
export const playDraftPick = () => playSound('draft_pick');
export const playPremiership = () => playSound('premiership');