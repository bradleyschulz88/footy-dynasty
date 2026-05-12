import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import {
  defaultFinance,
  DEFAULT_FACILITIES,
  DEFAULT_TRAINING,
  generateSponsors,
  generateStaff,
  defaultKits,
  generateTradePool,
} from '../defaults.js';

// ---------------------------------------------------------------------------
describe('defaultFinance', () => {
  it('returns higher cash for tier 1 than tier 3', () => {
    expect(defaultFinance(1).cash).toBeGreaterThan(defaultFinance(3).cash);
  });

  // Numbers below come from finance/constants.js TIER_FINANCE — single source of truth.
  it('tier-1 returns expected cash value', () => {
    expect(defaultFinance(1).cash).toBe(12_000_000);
  });

  it('tier-2 returns expected cash value', () => {
    expect(defaultFinance(2).cash).toBe(1_200_000);
  });

  it('tier-3 returns expected cash value', () => {
    expect(defaultFinance(3).cash).toBe(180_000);
  });

  it('unknown tier falls back to the tier-3 baseline', () => {
    const f = defaultFinance(9);
    expect(f.cash).toBe(180_000);
    expect(f.annualIncome).toBe(480_000);
  });

  it('returns all required financial fields', () => {
    const f = defaultFinance(1);
    expect(f).toMatchObject({
      cash:            expect.any(Number),
      annualIncome:    expect.any(Number),
      transferBudget:  expect.any(Number),
      wageBudget:      expect.any(Number),
      boardConfidence: expect.any(Number),
      fanHappiness:    expect.any(Number),
    });
  });

  it('tier-1 has the largest transfer budget', () => {
    expect(defaultFinance(1).transferBudget).toBeGreaterThan(defaultFinance(2).transferBudget);
    expect(defaultFinance(2).transferBudget).toBeGreaterThan(defaultFinance(3).transferBudget);
  });

  it('boardConfidence and fanHappiness are within 0-100', () => {
    for (const tier of [1, 2, 3]) {
      const f = defaultFinance(tier);
      expect(f.boardConfidence).toBeGreaterThanOrEqual(0);
      expect(f.boardConfidence).toBeLessThanOrEqual(100);
      expect(f.fanHappiness).toBeGreaterThanOrEqual(0);
      expect(f.fanHappiness).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
describe('DEFAULT_FACILITIES', () => {
  it('returns an object with six facility keys', () => {
    const f = DEFAULT_FACILITIES();
    expect(Object.keys(f)).toHaveLength(6);
    for (const key of ['trainingGround', 'gym', 'medical', 'academy', 'stadium', 'recovery']) {
      expect(f).toHaveProperty(key);
    }
  });

  it('every facility starts at level 1', () => {
    const f = DEFAULT_FACILITIES();
    for (const v of Object.values(f)) expect(v.level).toBe(1);
  });

  it('every facility has a positive cost and max of 5', () => {
    const f = DEFAULT_FACILITIES();
    for (const v of Object.values(f)) {
      expect(v.cost).toBeGreaterThan(0);
      expect(v.max).toBe(5);
    }
  });

  it('each call returns a fresh object (not a shared reference)', () => {
    const a = DEFAULT_FACILITIES();
    const b = DEFAULT_FACILITIES();
    a.gym.level = 3;
    expect(b.gym.level).toBe(1);
  });
});

// ---------------------------------------------------------------------------
describe('DEFAULT_TRAINING', () => {
  it('returns intensity and focus fields', () => {
    const t = DEFAULT_TRAINING();
    expect(t).toHaveProperty('intensity');
    expect(t).toHaveProperty('focus');
  });

  it('intensity is between 1 and 100', () => {
    const t = DEFAULT_TRAINING();
    expect(t.intensity).toBeGreaterThan(0);
    expect(t.intensity).toBeLessThanOrEqual(100);
  });

  it('focus percentages sum to 100', () => {
    const { focus } = DEFAULT_TRAINING();
    const sum = Object.values(focus).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('each call returns a fresh object', () => {
    const a = DEFAULT_TRAINING();
    const b = DEFAULT_TRAINING();
    a.intensity = 99;
    expect(b.intensity).not.toBe(99);
  });
});

// ---------------------------------------------------------------------------
describe('generateSponsors', () => {
  beforeEach(() => seedRng(42));

  it('returns an array', () => {
    expect(Array.isArray(generateSponsors(1))).toBe(true);
  });

  it('returns more sponsors on average for tier 1 than tier 3', () => {
    expect(generateSponsors(1).length).toBeGreaterThanOrEqual(generateSponsors(3).length);
  });

  it('each sponsor has the required shape', () => {
    const sponsors = generateSponsors(1);
    for (const s of sponsors) {
      expect(s).toMatchObject({
        id:          expect.stringContaining('sp_'),
        name:        expect.any(String),
        category:    expect.any(String),
        annualValue: expect.any(Number),
        yearsLeft:   expect.any(Number),
        type:        expect.any(String),
      });
    }
  });

  it('annualValue is strictly positive', () => {
    for (const tier of [1, 2, 3]) {
      for (const s of generateSponsors(tier)) {
        expect(s.annualValue).toBeGreaterThan(0);
      }
    }
  });

  it('tier-1 sponsors have higher annual values than tier-3', () => {
    const t1avg = generateSponsors(1).reduce((a, s) => a + s.annualValue, 0) / generateSponsors(1).length;
    const t3avg = generateSponsors(3).reduce((a, s) => a + s.annualValue, 0) / Math.max(generateSponsors(3).length, 1);
    expect(t1avg).toBeGreaterThan(t3avg);
  });

  it('yearsLeft is at least 1', () => {
    for (const s of generateSponsors(2)) {
      expect(s.yearsLeft).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
describe('generateStaff', () => {
  beforeEach(() => seedRng(42));

  it('tier 1 keeps a full department (10), tier 2 slimmer (7), tier 3 volunteer core + medic (5)', () => {
    expect(generateStaff(1)).toHaveLength(10);
    expect(generateStaff(2)).toHaveLength(7);
    expect(generateStaff(3)).toHaveLength(5);
  });

  it('each staff member has the required shape', () => {
    const staff = generateStaff(1);
    for (const s of staff) {
      expect(s).toMatchObject({
        id:       expect.any(String),
        role:     expect.any(String),
        name:     expect.any(String),
        rating:   expect.any(Number),
        wage:     expect.any(Number),
        contract: expect.any(Number),
      });
    }
  });

  it('staff ids are unique', () => {
    const ids = generateStaff(1).map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tier-3 volunteers earn $0; part-time senior coach has a small stipend', () => {
    const t3 = generateStaff(3);
    expect(t3.find(s => s.id === 's2').wage).toBe(0);
    expect(t3.find(s => s.id === 's4').wage).toBe(0);
    expect(t3.find(s => s.id === 's5').wage).toBe(0);
    expect(t3.find(s => s.id === 's6').wage).toBe(0);
    expect(t3.filter(s => s.volunteer).length).toBe(4);
    const hc = t3.find(s => s.id === 's1');
    expect(hc.wage).toBeGreaterThan(0);
    expect(hc.wage).toBeLessThan(80_000);
  });

  it('tier-1 head coach earns more than tier-3 head coach', () => {
    const t1 = generateStaff(1);
    const t3 = generateStaff(3);
    expect(t1.find(s => s.id === 's1').wage).toBeGreaterThan(t3.find(s => s.id === 's1').wage);
  });

  it('ratings are within blueprint bounds', () => {
    for (const s of generateStaff(1)) {
      expect(s.rating).toBeGreaterThanOrEqual(50);
      expect(s.rating).toBeLessThanOrEqual(88);
    }
  });

  it('contract lengths are at least 1', () => {
    for (const s of generateStaff(2)) {
      expect(s.contract).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
describe('defaultKits', () => {
  const colors = ['#FF0000', '#FFFFFF', '#0000FF'];

  it('returns home, away, and clash kits', () => {
    const kits = defaultKits(colors);
    expect(kits).toHaveProperty('home');
    expect(kits).toHaveProperty('away');
    expect(kits).toHaveProperty('clash');
  });

  it('home kit primary matches the first team color', () => {
    expect(defaultKits(colors).home.primary).toBe(colors[0]);
  });

  it('away kit primary is white', () => {
    expect(defaultKits(colors).away.primary).toBe('#FFFFFF');
  });

  it('clash kit primary is dark', () => {
    expect(defaultKits(colors).clash.primary).toBe('#1A1A1A');
  });

  it('each kit has primary, secondary, accent, pattern, and numberColor', () => {
    for (const kit of Object.values(defaultKits(colors))) {
      expect(kit).toMatchObject({
        primary:     expect.any(String),
        secondary:   expect.any(String),
        accent:      expect.any(String),
        pattern:     expect.any(String),
        numberColor: expect.any(String),
      });
    }
  });

  it('clash kit uses stripes pattern', () => {
    expect(defaultKits(colors).clash.pattern).toBe('stripes');
  });
});

// ---------------------------------------------------------------------------
describe('generateTradePool', () => {
  it('returns an array of 25 players', () => {
    const pool = generateTradePool('AFL', 2026);
    expect(pool).toHaveLength(25);
  });

  it('each entry has a fromClub field', () => {
    for (const p of generateTradePool('AFL', 2026)) {
      expect(p).toHaveProperty('fromClub');
      expect(typeof p.fromClub).toBe('string');
    }
  });

  it('each entry has standard player fields', () => {
    for (const p of generateTradePool('AFL', 2026)) {
      expect(p).toMatchObject({
        id:      expect.any(String),
        name:    expect.any(String),
        age:     expect.any(Number),
        overall: expect.any(Number),
      });
    }
  });

  it('is deterministic for the same season', () => {
    const a = generateTradePool('AFL', 2026);
    const b = generateTradePool('AFL', 2026);
    expect(a[0].id).toBe(b[0].id);
  });

  it('differs between seasons', () => {
    const a = generateTradePool('AFL', 2026);
    const b = generateTradePool('AFL', 2027);
    expect(a.map(p => p.id)).not.toEqual(b.map(p => p.id));
  });
});
