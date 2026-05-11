/** Cross-career preferences (localStorage), separate from save slots. */

const KEY = 'footy-dynasty-player-prefs';

const DEFAULTS = {
  /** When true, boot tries active slot then most recently saved slot instead of title setup. */
  skipSetupContinueLast: false,
};

export function getPlayerPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

/** @param {Partial<typeof DEFAULTS>} patch */
export function setPlayerPrefs(patch) {
  const next = { ...getPlayerPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}
