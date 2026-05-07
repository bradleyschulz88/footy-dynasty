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

  it('upgrades a v1 save through to the current SAVE_VERSION with safe defaults', () => {
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
    expect(m.tutorialComplete).toBe(true);
    expect(m.coachReputation).toBe(30);
    expect(m.coachTier).toBe('Journeyman');
    expect(m.coachStats).toBeTruthy();
    expect(m.previousClubs).toEqual([]);
    expect(m.groundCondition).toBe(85);
    expect(m.weeklyWeather).toEqual({});
    // v3 -> v4 fields (Finance system rebuild)
    // The stadium is now stamped as a structured object (v3 stamped `1` here, broken).
    expect(m.facilities.stadium).toMatchObject({ level: 1, max: 5 });
    expect(m.lastFinanceTickWeek).toBe(null);
    expect(m.lastFinanceTickDay).toBe(null);
    expect(m.weeklyHistory).toEqual([]);
    expect(m.cashCrisisStartWeek).toBe(null);
    expect(m.cashCrisisLevel).toBe(0);
    expect(m.bankLoan).toBe(null);
    expect(m.sponsorRenewalProposals).toEqual([]);
    expect(m.sponsorOffers).toEqual([]);
    expect(m.expiredSponsorsLastSeason).toEqual([]);
    expect(m.pendingRenewals).toEqual([]);
    expect(m.fundraisersUsed).toEqual({});
    expect(m.communityGrantUsed).toBe(false);
    expect(m.lastEosFinance).toBe(null);
    // v4 -> v5: trade period / pick bank scaffolding + player trade tags
    expect(m.postSeasonPhase).toBe('none');
    expect(m.inTradePeriod).toBe(false);
    expect(m.draftPickBank).toBe(null);
  });

  it('v5 -> v6 adds secondaryPosition to squad and aiSquads players', () => {
    const m = migrate({
      saveVersion: 5,
      squad: [{ id: 'p1', position: 'C' }],
      aiSquads: { xyz: [{ id: 'a1', position: 'HF' }] },
    });
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.squad[0].secondaryPosition).toBe(null);
    expect(m.aiSquads.xyz[0].secondaryPosition).toBe(null);
  });

  it('repairs a broken stadium schema where it was stamped as the integer 1', () => {
    const broken = {
      saveVersion: 3,
      facilities: { stadium: 1, gym: { level: 2, cost: 60_000, max: 5 } },
    };
    const m = migrate(broken);
    expect(m.saveVersion).toBe(SAVE_VERSION);
    expect(m.facilities.stadium).toMatchObject({ level: 1, cost: 350_000, max: 5 });
    expect(m.facilities.gym).toMatchObject({ level: 2, max: 5 });
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
