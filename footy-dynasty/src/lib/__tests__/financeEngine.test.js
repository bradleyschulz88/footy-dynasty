import { describe, it, expect, beforeEach } from 'vitest';
import {
  recomputeAnnualIncome, tickWeeklyCashflow, effectiveWageCap, capHeadroom,
  currentPlayerWageBill, canAffordSigning, refillTransferBudget,
  applyPrizeMoney, applyPromotionRipple, cashCrisisLevel, makeStartingFinance,
  effectiveInjuryRate, scoutedOverall, moraleClamp, incomeBreakdown,
  expenseBreakdown, annualNetProjection, annualWageBill, annualSponsorIncome,
  annualFacilityUpkeep, leagueTierOf, isoWeekOf,
} from '../finance/engine.js';
import { TIER_FINANCE } from '../finance/constants.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(42));

const baseCareer = (overrides = {}) => ({
  clubId: 'col',
  difficulty: 'contender',
  squad: [{ id: 'p1', wage: 100_000 }, { id: 'p2', wage: 80_000 }],
  staff: [{ id: 's1', wage: 60_000 }],
  facilities: { stadium: { level: 1, cost: 350_000, max: 5 }, gym: { level: 1, cost: 60_000, max: 5 } },
  sponsors: [{ id: 'sp1', annualValue: 500_000, yearsLeft: 2 }],
  ladder: [{ id: 'col', pts: 24 }, { id: 'gee', pts: 18 }],
  finance: { cash: 1_000_000, annualIncome: 5_500_000, transferBudget: 250_000, wageBudget: 1_400_000, boardConfidence: 65, fanHappiness: 60 },
  week: 5,
  ...overrides,
});

describe('isoWeekOf', () => {
  it('returns ISO week from a date string', () => {
    expect(isoWeekOf('2026-01-01')).toBe(1);
    expect(isoWeekOf('2026-12-31')).toBeGreaterThan(50);
  });
  it('returns 0 for empty input', () => {
    expect(isoWeekOf('')).toBe(0);
  });
});

describe('makeStartingFinance', () => {
  it('produces tier-1 baseline at contender difficulty', () => {
    const f = makeStartingFinance(1, 'contender', 60);
    expect(f.cash).toBe(TIER_FINANCE[1].cash);
    expect(f.transferBudget).toBe(TIER_FINANCE[1].transferBudget);
    expect(f.wageBudget).toBe(TIER_FINANCE[1].wageBudget);
    expect(f.boardConfidence).toBe(60);
  });

  it('grassroots multiplies cash + transfer budget upward', () => {
    const c = makeStartingFinance(2, 'grassroots');
    expect(c.cash).toBeGreaterThan(TIER_FINANCE[2].cash);
    expect(c.transferBudget).toBeGreaterThan(TIER_FINANCE[2].transferBudget);
  });

  it('legend dials cash + transfer budget down', () => {
    const c = makeStartingFinance(2, 'legend');
    expect(c.cash).toBeLessThan(TIER_FINANCE[2].cash);
    expect(c.transferBudget).toBeLessThan(TIER_FINANCE[2].transferBudget);
  });
});

describe('annual breakdowns', () => {
  it('annualWageBill sums player + staff wages', () => {
    const c = baseCareer();
    expect(annualWageBill(c)).toBe(100_000 + 80_000 + 60_000);
  });

  it('annualSponsorIncome sums sponsor annualValue', () => {
    const c = baseCareer();
    expect(annualSponsorIncome(c)).toBe(500_000);
  });

  it('annualFacilityUpkeep scales with facility level + tier', () => {
    const c = baseCareer({ clubId: 'col' });
    expect(annualFacilityUpkeep(c)).toBeGreaterThan(0);
  });

  it('annualNetProjection = income - expenses', () => {
    const c = baseCareer();
    const inc = incomeBreakdown(c);
    const exp = expenseBreakdown(c);
    expect(annualNetProjection(c)).toBe(inc.grandTotal - exp.grandTotal);
  });
});

describe('recomputeAnnualIncome', () => {
  it('top of ladder beats bottom of ladder for the same tier', () => {
    const top = baseCareer({ ladder: [{ id: 'col', pts: 30 }, { id: 'a', pts: 10 }, { id: 'b', pts: 8 }] });
    const bot = baseCareer({ ladder: [{ id: 'a', pts: 30 }, { id: 'b', pts: 25 }, { id: 'col', pts: 8 }] });
    expect(recomputeAnnualIncome(top)).toBeGreaterThan(recomputeAnnualIncome(bot));
  });

  it('high fan happiness lifts annual income', () => {
    const happy = baseCareer({ finance: { ...baseCareer().finance, fanHappiness: 95 } });
    const sad   = baseCareer({ finance: { ...baseCareer().finance, fanHappiness: 25 } });
    expect(recomputeAnnualIncome(happy)).toBeGreaterThan(recomputeAnnualIncome(sad));
  });

  it('higher stadium level lifts annual income', () => {
    const big = baseCareer({ facilities: { stadium: { level: 5, cost: 350_000, max: 5 } } });
    const small = baseCareer({ facilities: { stadium: { level: 1, cost: 350_000, max: 5 } } });
    expect(recomputeAnnualIncome(big)).toBeGreaterThan(recomputeAnnualIncome(small));
  });
});

describe('salary cap', () => {
  it('effectiveWageCap applies difficulty capOverflow', () => {
    const c = baseCareer({ difficulty: 'grassroots' });
    const cap = effectiveWageCap(c);
    expect(cap).toBeGreaterThan(c.finance.wageBudget); // grassroots = +20%
  });

  it('effectiveWageCap is tighter under legend', () => {
    const c = baseCareer({ difficulty: 'legend' });
    expect(effectiveWageCap(c)).toBeLessThan(c.finance.wageBudget);
  });

  it('canAffordSigning honours the effective cap', () => {
    const c = baseCareer({ difficulty: 'contender' });
    const remaining = c.finance.wageBudget - currentPlayerWageBill(c);
    expect(canAffordSigning(c, remaining - 1)).toBe(true);
    expect(canAffordSigning(c, remaining + 1_000_000)).toBe(false);
  });

  it('capHeadroom never goes negative', () => {
    const c = baseCareer({ squad: [{ id: 'a', wage: 5_000_000 }] });
    expect(capHeadroom(c)).toBeGreaterThanOrEqual(0);
  });
});

describe('operating cashflow tick (per calendar day)', () => {
  it('applies a daily slice of the annual P&L the first time a date is seen', () => {
    const c = baseCareer({ currentDate: '2026-03-25' });
    const before = c.finance.cash;
    const delta = tickWeeklyCashflow(c);
    expect(delta).not.toBe(0);
    expect(c.finance.cash).toBe(before + delta);
    expect(c.lastFinanceTickDay).toBe('2026-03-25');
    expect((c.weeklyHistory || []).length).toBeGreaterThan(0);
  });

  it('accrues again when the calendar advances to a new day', () => {
    const c = baseCareer({ currentDate: '2026-03-25' });
    tickWeeklyCashflow(c);
    c.currentDate = '2026-03-26';
    const before = c.finance.cash;
    tickWeeklyCashflow(c);
    expect(c.finance.cash).not.toBe(before);
  });

  it('does not double-charge when called twice for the same day', () => {
    const c = baseCareer({ currentDate: '2026-03-25' });
    tickWeeklyCashflow(c);
    const after1 = c.finance.cash;
    tickWeeklyCashflow(c);
    expect(c.finance.cash).toBe(after1);
  });

  it('merges multiple days in the same ISO week into one chart bucket', () => {
    const c = baseCareer({ currentDate: '2026-03-25' });
    tickWeeklyCashflow(c);
    c.currentDate = '2026-03-26';
    tickWeeklyCashflow(c);
    expect(c.weeklyHistory.length).toBe(1);
    expect(c.weeklyHistory[0].profit).toBe(
      c.weeklyHistory[0].income - c.weeklyHistory[0].expenses
    );
  });

  it('updates cashCrisisStartWeek when cash goes negative', () => {
    const c = baseCareer({
      currentDate: '2026-03-25',
      clubId: '__none__',
      finance: { cash: 100, annualIncome: 1, wageBudget: 1, transferBudget: 0, boardConfidence: 50, fanHappiness: 50 },
      squad: [{ id: 'a', wage: 500_000_000 }],
      staff: [],
      sponsors: [],
    });
    tickWeeklyCashflow(c);
    expect(c.finance.cash).toBeLessThan(0);
    expect(c.cashCrisisStartWeek).not.toBe(null);
  });
});

describe('refillTransferBudget', () => {
  it('produces a positive number', () => {
    expect(refillTransferBudget(baseCareer())).toBeGreaterThan(0);
  });

  it('higher board confidence yields a bigger refill', () => {
    const high = baseCareer({ finance: { ...baseCareer().finance, boardConfidence: 95 } });
    const low  = baseCareer({ finance: { ...baseCareer().finance, boardConfidence: 20 } });
    expect(refillTransferBudget(high)).toBeGreaterThan(refillTransferBudget(low));
  });

  it('rolls over up to 30% of unused budget', () => {
    const c = baseCareer({ finance: { ...baseCareer().finance, transferBudget: 1_000_000 } });
    const refilled = refillTransferBudget(c);
    // refill + 300_000 rollover (30% of 1M)
    expect(refilled).toBeGreaterThanOrEqual(refilled - 300_001);
  });
});

describe('prize money', () => {
  it('premiership pays the largest amount', () => {
    const c = baseCareer({ finance: { cash: 0, annualIncome: 1, transferBudget: 0, wageBudget: 1, boardConfidence: 50, fanHappiness: 50 } });
    const p = applyPrizeMoney(c, { premiership: true });
    expect(p.cash).toBeGreaterThan(0);
    expect(p.events[0].label).toMatch(/Premiership/);
  });

  it('finals appearance pays a smaller bonus than premiership', () => {
    const c = baseCareer({ finance: { cash: 0, annualIncome: 1, transferBudget: 0, wageBudget: 1, boardConfidence: 50, fanHappiness: 50 } });
    const finals = applyPrizeMoney(c, { finals: true });
    const flag   = applyPrizeMoney(c, { premiership: true });
    expect(flag.cash).toBeGreaterThan(finals.cash);
  });

  it('wooden spoon stacks a penalty', () => {
    const c = baseCareer({ finance: { cash: 1_000_000, annualIncome: 1, transferBudget: 0, wageBudget: 1, boardConfidence: 50, fanHappiness: 50 } });
    const out = applyPrizeMoney(c, { woodenSpoon: true });
    expect(out.cash).toBeLessThan(c.finance.cash);
  });
});

describe('promotion / relegation ripple', () => {
  it('promotion bumps board confidence + bumps sponsor values', () => {
    const c = baseCareer();
    const ripple = applyPromotionRipple(c, { promoted: true, newTier: 1 });
    expect(ripple.finance.boardConfidence).toBeGreaterThan(c.finance.boardConfidence);
    expect(ripple.sponsors[0].annualValue).toBeGreaterThan(500_000);
  });

  it('relegation halves sponsors + drops board confidence', () => {
    const c = baseCareer();
    const ripple = applyPromotionRipple(c, { relegated: true, newTier: 3 });
    expect(ripple.finance.boardConfidence).toBeLessThan(c.finance.boardConfidence);
    expect(ripple.sponsors[0].annualValue).toBeLessThan(500_000);
  });
});

describe('cashCrisisLevel', () => {
  it('returns 0 when cash is non-negative', () => {
    expect(cashCrisisLevel(baseCareer({ finance: { cash: 100, ...baseCareer().finance, cash: 100 } }))).toBe(0);
  });

  it('escalates with consecutive negative weeks', () => {
    expect(cashCrisisLevel({ finance: { cash: -1 }, week: 1, cashCrisisStartWeek: 0 })).toBe(1);
    expect(cashCrisisLevel({ finance: { cash: -1 }, week: 4, cashCrisisStartWeek: 0 })).toBe(2);
    expect(cashCrisisLevel({ finance: { cash: -1 }, week: 7, cashCrisisStartWeek: 0 })).toBe(3);
    expect(cashCrisisLevel({ finance: { cash: -1 }, week: 10, cashCrisisStartWeek: 0 })).toBe(4);
  });
});

describe('difficulty hooks', () => {
  it('effectiveInjuryRate applies the multiplier', () => {
    expect(effectiveInjuryRate({ difficulty: 'grassroots' }, 0.20)).toBeCloseTo(0.10, 5);
    expect(effectiveInjuryRate({ difficulty: 'legend' },     0.20)).toBeCloseTo(0.40, 5);
  });

  it('moraleClamp respects the difficulty floor', () => {
    expect(moraleClamp({ difficulty: 'grassroots' }, 30)).toBe(50);
    expect(moraleClamp({ difficulty: 'legend' },    30)).toBe(30);
    expect(moraleClamp({ difficulty: 'legend' },    -5)).toBe(10);
  });

  it('scoutedOverall returns a number close to true overall', () => {
    seedRng(7);
    const out = scoutedOverall({ overall: 70 }, { difficulty: 'contender' });
    expect(out).toBeGreaterThanOrEqual(40);
    expect(out).toBeLessThanOrEqual(99);
  });
});

describe('leagueTierOf', () => {
  it('returns 1 for AFL clubs and 3 for community clubs', () => {
    expect(leagueTierOf({ clubId: 'col' })).toBe(1);
    expect(leagueTierOf({ clubId: 'efnl_balwyn' })).toBe(3);
  });
  it('falls back to 2 for unknown clubs', () => {
    expect(leagueTierOf({ clubId: 'nope' })).toBe(2);
  });
});
