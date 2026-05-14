/** Session key for multi-step new-career wizard (persisted across refresh). */
export const SETUP_SS_KEY = "footy-dynasty-setup-v2";

/** Older wizard key cleared on reset alongside {@link SETUP_SS_KEY}. */
export const SETUP_SS_KEY_LEGACY = "footy-dynasty-setup";

/**
 * Persisted career schema version — bump only when `migrate()` gains new steps.
 * Imported by `save.js` (re-exported) and by career setup so the wizard does not load `save.js`.
 */
export const SAVE_VERSION = 27;

/** Save slot ids — must match `save.js` slot localStorage keys (`footy-dynasty-career-slot-*`). */
export const SLOT_IDS = ['A', 'B', 'C'];

/** Slot id with newest `savedAt` in meta (same shape as `readSlotMeta()`), or null. */
export function getLatestSavedSlotMeta(meta) {
  if (!meta || typeof meta !== 'object') return null;
  let best = null;
  let bestTime = '';
  for (const id of SLOT_IDS) {
    const m = meta[id];
    if (!m?.savedAt) continue;
    if (!best || m.savedAt > bestTime) {
      best = id;
      bestTime = m.savedAt;
    }
  }
  return best;
}
