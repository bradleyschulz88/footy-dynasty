// ---------------------------------------------------------------------------
// Save versioning, slots, autosave
// ---------------------------------------------------------------------------

export const SAVE_VERSION = 2;
export const LEGACY_KEY = 'footy-dynasty-career';
const SLOT_KEY = (slot) => `footy-dynasty-career-slot-${slot}`;
const SLOT_META_KEY = 'footy-dynasty-slots';
const ACTIVE_SLOT_KEY = 'footy-dynasty-active-slot';

export const SLOT_IDS = ['A', 'B', 'C'];

export function migrate(save) {
  if (!save) return save;
  let s = { ...save };
  const v = s.saveVersion ?? 1;

  if (v < 2) {
    // v1 -> v2: introduce new fields with safe defaults
    s.saveVersion = 2;
    s.aiSquads = s.aiSquads || {};
    s.draftOrder = s.draftOrder || [];
    s.history = s.history || [];
    s.brownlow = s.brownlow || {};
    s.boardWarning = s.boardWarning || 0;
    s.gameOver = s.gameOver || null;
    s.themeMode = s.themeMode || 'A';
    s.options = s.options || { autosave: true };
  }

  return s;
}

export function readSlot(slot) {
  try {
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch { return null; }
}

export function writeSlot(slot, save) {
  try {
    const out = { ...save, saveVersion: SAVE_VERSION, savedAt: new Date().toISOString() };
    localStorage.setItem(SLOT_KEY(slot), JSON.stringify(out));
    bumpSlotMeta(slot, out);
    return true;
  } catch (err) {
    console.warn('[save] writeSlot failed:', err?.message);
    return false;
  }
}

export function deleteSlot(slot) {
  try {
    localStorage.removeItem(SLOT_KEY(slot));
    const meta = readSlotMeta();
    delete meta[slot];
    localStorage.setItem(SLOT_META_KEY, JSON.stringify(meta));
  } catch {}
}

export function readSlotMeta() {
  try {
    return JSON.parse(localStorage.getItem(SLOT_META_KEY) || '{}');
  } catch { return {}; }
}

export function bumpSlotMeta(slot, save) {
  try {
    const meta = readSlotMeta();
    meta[slot] = {
      managerName: save.managerName,
      clubId: save.clubId,
      leagueKey: save.leagueKey,
      season: save.season,
      week: save.week,
      phase: save.phase,
      currentDate: save.currentDate,
      premiership: save.premiership,
      savedAt: save.savedAt || new Date().toISOString(),
    };
    localStorage.setItem(SLOT_META_KEY, JSON.stringify(meta));
  } catch {}
}

export function getActiveSlot() {
  try { return localStorage.getItem(ACTIVE_SLOT_KEY) || null; }
  catch { return null; }
}

export function setActiveSlot(slot) {
  try {
    if (slot) localStorage.setItem(ACTIVE_SLOT_KEY, slot);
    else localStorage.removeItem(ACTIVE_SLOT_KEY);
  } catch {}
}

// One-time migration of legacy single-key save into Slot A
export function migrateLegacy() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const parsed = migrate(JSON.parse(legacy));
    writeSlot('A', parsed);
    setActiveSlot('A');
    localStorage.removeItem(LEGACY_KEY);
    return parsed;
  } catch { return null; }
}
