import { getPlayerPrefs } from './playerPrefs.js';
import {
  getActiveSlot,
  setActiveSlot,
  readSlot,
  readSlotMeta,
  migrateLegacy,
  getLatestSavedSlot,
} from './save.js';

/**
 * Initial career + slot when the app mounts (respects "skip title" player pref).
 * Safe under React Strict Mode double-mount if localStorage state is consistent.
 */
export function computeInitialCareerBoot() {
  const prefs = getPlayerPrefs();
  let slot = getActiveSlot();

  if (prefs.skipSetupContinueLast) {
    const loaded = slot ? readSlot(slot) : null;
    if (!loaded) {
      const latest = getLatestSavedSlot(readSlotMeta());
      if (latest) {
        slot = latest;
        setActiveSlot(latest);
      }
    }
  }

  if (slot) {
    const fromSlot = readSlot(slot);
    if (fromSlot) return { career: fromSlot, activeSlot: slot };
  }

  const legacy = migrateLegacy();
  if (legacy) return { career: legacy, activeSlot: getActiveSlot() };

  return { career: null, activeSlot: null };
}
