import { describe, it, expect, beforeEach } from 'vitest';
import { migrate, readSlot, writeSlot, deleteSlot, readSlotMeta, getActiveSlot, setActiveSlot, migrateLegacy, SAVE_VERSION, SLOT_IDS, LEGACY_KEY } from '../save.js';

// JSDOM provides localStorage in the vitest "happy-dom" / "jsdom" env. We set up
// a minimal in-memory polyfill in case the default env is "node".
beforeEach(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
      get length() { return store.size; },
      key: (i) => Array.from(store.keys())[i] || null,
    };
  }
  globalThis.localStorage.clear();
});

describe('migrate', () => {
  it('returns null for null input', () => {
    expect(migrate(null)).toBe(null);
  });

  it('upgrades a v1 save through v2 to v3 with safe defaults', () => {
    const v1 = { managerName: 'X', season: 2026, saveVersion: 1 };
    const m = migrate(v1);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    // v1 -> v2 fields
    expect(m.aiSquads).toEqual({});
    expect(m.draftOrder).toEqual([]);
    expect(m.history).toEqual([]);
    expect(m.brownlow).toEqual({});
    expect(m.themeMode).toBe('A');
    expect(m.options).toEqual({ autosave: true });
    // v2 -> v3 fields (Gameplay Systems Spec)
    expect(m.difficulty).toBe('contender');
    expect(m.committee).toEqual([]);
    expect(m.tutorialComplete).toBe(true); // existing saves skip tutorial
    expect(m.coachReputation).toBe(30);
    expect(m.coachTier).toBe('Journeyman');
    expect(m.coachStats).toBeTruthy();
    expect(m.previousClubs).toEqual([]);
    expect(m.groundCondition).toBe(85);
    expect(m.weeklyWeather).toEqual({});
    expect(m.facilities.stadium).toBe(1);
  });

  it('does not clobber an existing themeMode', () => {
    const m = migrate({ saveVersion: 1, themeMode: 'B' });
    expect(m.themeMode).toBe('B');
  });

  it('treats missing saveVersion as v1 and migrates to current version', () => {
    const m = migrate({ managerName: 'X' });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.history).toEqual([]);
    expect(m.difficulty).toBe('contender');
  });
});

describe('slot read/write/delete', () => {
  it('writeSlot stamps SAVE_VERSION and savedAt', () => {
    writeSlot('A', { managerName: 'M', season: 2026 });
    const r = readSlot('A');
    expect(r.saveVersion).toBe(SAVE_VERSION);
    expect(typeof r.savedAt).toBe('string');
  });

  it('readSlot returns null when slot is empty', () => {
    expect(readSlot('B')).toBe(null);
  });

  it('deleteSlot clears both the slot and its meta', () => {
    writeSlot('A', { managerName: 'M', season: 2026, clubId: 'col' });
    expect(readSlot('A')).not.toBe(null);
    expect(readSlotMeta().A).toBeTruthy();
    deleteSlot('A');
    expect(readSlot('A')).toBe(null);
    expect(readSlotMeta().A).toBeUndefined();
  });

  it('writing different slots does not overwrite each other', () => {
    writeSlot('A', { managerName: 'A', season: 2026 });
    writeSlot('B', { managerName: 'B', season: 2027 });
    expect(readSlot('A').managerName).toBe('A');
    expect(readSlot('B').managerName).toBe('B');
  });

  it('readSlotMeta lists all written slots', () => {
    writeSlot('A', { managerName: 'A', season: 2026, clubId: 'col' });
    writeSlot('C', { managerName: 'C', season: 2030, clubId: 'gee' });
    const meta = readSlotMeta();
    expect(meta.A.managerName).toBe('A');
    expect(meta.C.managerName).toBe('C');
    expect(meta.B).toBeUndefined();
  });
});

describe('active slot', () => {
  it('round-trips an active slot id', () => {
    setActiveSlot('B');
    expect(getActiveSlot()).toBe('B');
  });

  it('clears the active slot when set to null', () => {
    setActiveSlot('A');
    setActiveSlot(null);
    expect(getActiveSlot()).toBe(null);
  });
});

describe('migrateLegacy', () => {
  it('returns null when no legacy save exists', () => {
    expect(migrateLegacy()).toBe(null);
  });

  it('moves a legacy save into slot A and sets it active', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ managerName: 'L', season: 2025, saveVersion: 1 }));
    const m = migrateLegacy();
    expect(m).not.toBe(null);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(getActiveSlot()).toBe('A');
    expect(readSlot('A').managerName).toBe('L');
    expect(localStorage.getItem(LEGACY_KEY)).toBe(null);
  });
});

describe('SLOT_IDS', () => {
  it('exposes A, B, C as slot ids', () => {
    expect(SLOT_IDS).toEqual(['A', 'B', 'C']);
  });
});
