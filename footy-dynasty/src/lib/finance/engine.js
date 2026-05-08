// ---------------------------------------------------------------------------
// Finance engine — pure functions consumed by AFLManager.jsx and careerAdvance.js.
// All functions take the career object and return either a delta to apply or
// a new partial career patch.
// ---------------------------------------------------------------------------
import {
  TIER_FINANCE, FACILITY_UPKEEP_PER_LEVEL_ANNUAL, INCOME_MIX,
  PRIZE_MONEY, INSOLVENCY, TICKET_PRICE, BASE_ATTENDANCE,
  TRANSFER_BUDGET_ROLLOVER_FRACTION,
} from './constants.js';
import { getDifficultyConfig } from '../difficulty.js';
import { findLeagueOf } from '../../data/pyramid.js';
import { clamp } from '../format.js';
import { rng } from '../rng.js';

// =============================================================================
// Helpers
// =============================================================================

// Resolve the league tier for a career (handles missing league cleanly).
export function leagueTierOf(career) {
  const lg = findLeagueOf(career?.clubId);
  return lg?.tier ?? 2;
}

// Sum a tier-keyed table according to the career's current league tier.
function fromTier(table, career, fallback = 0) {
  const tier = leagueTierOf(career);
  return table[tier] ?? fallback;
}

// =============================================================================
// Income / expenses (annualised)
// =============================================================================

// Recompute annualIncome dynamically based on tier base + ladder + fans + stadium
export function recomputeAnnualIncome(career) {
  const tierBase = fromTier(TIER_FINANCE, career, { annualIncome: 200_000 }).annualIncome;
  const stadiumLevel = career.facilities?.stadium?.level ?? 1;
  const fanHappiness = career.finance?.fanHappiness ?? 60;
  // Ladder bonus: top of table earns more, bottom earns less
  const ladderRow = (career.ladder || []).slice().sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
  const myIdx = ladderRow.findIndex(r => r.id === career.clubId);
  const ladderMult = ladderRow.length > 0 && myIdx >= 0
    ? 1 + (0.30 - (myIdx / Math.max(1, ladderRow.length - 1)) * 0.45)  // 1st = 1.30, last ≈ 0.85
    : 1.0;
  const fanMult = 0.75 + (fanHappiness / 100) * 0.5;                    // 0.75–1.25
  const stadiumMult = 0.85 + ((stadiumLevel - 1) / 4) * 0.40;           // L1=0.85, L5=1.25
  return Math.round(tierBase * ladderMult * fanMult * stadiumMult);
}

// Annual upkeep for all facilities at the current tier.
export function annualFacilityUpkeep(career) {
  const tier = leagueTierOf(career);
  const perLevel = FACILITY_UPKEEP_PER_LEVEL_ANNUAL[tier] ?? 30_000;
  const totalLevel = Object.values(career.facilities || {})
    .reduce((a, f) => a + (typeof f === 'object' ? (f.level ?? 0) : 0), 0);
  return totalLevel * perLevel;
}

// Annual wage bill (players + staff)
export function annualWageBill(career) {
  const playerWages = (career.squad || []).reduce((a, p) => a + (p.wage || 0), 0);
  const staffWages  = (career.staff || []).reduce((a, s) => a + (s.wage || 0), 0);
  return playerWages + staffWages;
}

// Annual sponsorship total
export function annualSponsorIncome(career) {
  return (career.sponsors || []).reduce((a, s) => a + (s.annualValue || 0), 0);
}

// Income / expense breakdowns for the FinancesTab UI.
// Always derive the broadcast/commercial slice from the live ladder / fans / stadium model
// so the screen reflects the new finance system during the season (not only at year-end).
export function incomeBreakdown(career) {
  const total = recomputeAnnualIncome(career);
  return {
    broadcast:   Math.round(total * INCOME_MIX.broadcast),
    gate:        Math.round(total * INCOME_MIX.gate),
    membership:  Math.round(total * INCOME_MIX.membership),
    merchandise: Math.round(total * INCOME_MIX.merchandise),
    sponsors:    annualSponsorIncome(career),
    grandTotal:  total + annualSponsorIncome(career),
  };
}

export function expenseBreakdown(career) {
  const playerWages = (career.squad || []).reduce((a, p) => a + (p.wage || 0), 0);
  const staffWages  = (career.staff || []).reduce((a, s) => a + (s.wage || 0), 0);
  const facilities  = annualFacilityUpkeep(career);
  return {
    playerWages, staffWages, facilities,
    grandTotal: playerWages + staffWages + facilities,
  };
}

export function annualNetProjection(career) {
  return incomeBreakdown(career).grandTotal - expenseBreakdown(career).grandTotal;
}

// =============================================================================
// Cashflow accrual — one tick per distinct calendar day on the event timeline
// =============================================================================
// Pre-season stacks multiple events (Mon/Wed/Fri training) inside the same ISO week.
// The old "once per ISO week" tick meant almost no cash movement until the season —
// the ledger looked broken. We accrue 1/365th of the annual P&L per new day, and roll
// those slices into ISO-week buckets for the Finances chart.

// ISO week number from a YYYY-MM-DD date string.
export function isoWeekOf(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr + 'T00:00:00');
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);
}

// Apply one day of operating cashflow when the career's calendar moves to a new date.
// Returns the delta applied to cash. Idempotent if called twice for the same day.
// Named `tickWeeklyCashflow` for backwards compatibility with imports/tests.
export function tickWeeklyCashflow(c) {
  if (!c?.currentDate) return 0;
  const day = c.currentDate;
  if (c.lastFinanceTickDay === day) return 0;

  const annualIncomeFlat = recomputeAnnualIncome(c);
  const annualSponsors   = annualSponsorIncome(c);
  const annualWages      = annualWageBill(c);
  const annualUpkeep     = annualFacilityUpkeep(c);

  const dayIncome   = Math.round((annualIncomeFlat + annualSponsors) / 365);
  const dayExpenses = Math.round((annualWages + annualUpkeep) / 365);
  const delta = dayIncome - dayExpenses;

  c.finance.cash += delta;
  c.lastFinanceTickDay = day;

  const isoKey = `${day.slice(0, 4)}-W${isoWeekOf(day)}`;
  c.lastFinanceTickWeek = isoKey;

  const hist = c.weeklyHistory || [];
  const last = hist[hist.length - 1];
  if (last && last.isoKey === isoKey) {
    last.profit = (last.profit ?? 0) + delta;
    last.cash = c.finance.cash;
    last.income = (last.income ?? 0) + dayIncome;
    last.expenses = (last.expenses ?? 0) + dayExpenses;
  } else {
    hist.push({
      isoKey,
      week: c.week ?? 0,
      profit: delta,
      cash: c.finance.cash,
      income: dayIncome,
      expenses: dayExpenses,
    });
  }
  c.weeklyHistory = hist.slice(-52);

  c.finance.annualIncome = annualIncomeFlat;

  // Update insolvency tracking
  if (c.finance.cash < 0) {
    c.cashCrisisStartWeek = c.cashCrisisStartWeek ?? c.week ?? 0;
  } else {
    c.cashCrisisStartWeek = null;
    c.cashCrisisLevel = 0;
  }

  return delta;
}

// =============================================================================
// Salary cap enforcement
// =============================================================================

// The effective wage cap including difficulty's capOverflow allowance.
export function effectiveWageCap(career) {
  const cfg = getDifficultyConfig(career?.difficulty);
  const base = career?.finance?.wageBudget ?? 0;
  return Math.round(base * (1 + (cfg.capOverflow ?? 0)));
}

// Sum of player wages currently on the squad.
export function currentPlayerWageBill(career) {
  return (career?.squad || []).reduce((a, p) => a + (p.wage || 0), 0);
}

// Headroom = effective cap minus current player wages.
export function capHeadroom(career) {
  return Math.max(0, effectiveWageCap(career) - currentPlayerWageBill(career));
}

// Can the club add a new player on `wageOffer` without breaching the cap?
export function canAffordSigning(career, wageOffer) {
  const cap = effectiveWageCap(career);
  if (cap === 0) return true; // no cap configured — allow
  return currentPlayerWageBill(career) + wageOffer <= cap;
}

// Scale all player wages down so the squad fits under the effective cap (e.g. new career).
// Returns a new squad array; leaves `career` immutable.
export function scaledSquadToFitCap(career, headroom = 0.92) {
  const squad = career?.squad || [];
  const cap = effectiveWageCap(career);
  if (cap <= 0) return squad.map(p => ({ ...p }));
  const total = currentPlayerWageBill(career);
  const target = Math.max(1, Math.floor(cap * headroom));
  if (total <= target) return squad.map(p => ({ ...p }));
  const scale = target / total;
  return squad.map(p => ({ ...p, wage: Math.max(1, Math.round((p.wage || 0) * scale)) }));
}

// Rookie wage offer for national draft by competition tier (matches DraftTab / career logic).
export function rookieDraftWage(overall, tier) {
  const o = overall ?? 60;
  if (tier === 1) return Math.max(80_000, Math.round(o * 1500));
  if (tier === 2) return Math.max(28_000, Math.round(o * 480));
  return Math.max(6_000, Math.round(o * 90));
}

// =============================================================================
// Transfer budget refill at season start
// =============================================================================

// Compute next season's transfer budget given current state.
export function refillTransferBudget(career) {
  const cfg = getDifficultyConfig(career.difficulty);
  const tierBase = fromTier(TIER_FINANCE, career, { transferBudget: 50_000 }).transferBudget;
  const board = career.finance?.boardConfidence ?? 50;
  const boardMult = 0.6 + (board / 200);                   // 0.6–1.1
  const refill = Math.round(tierBase * (cfg.transferBudgetMultiplier ?? 1.0) * boardMult);
  const rollover = Math.round((career.finance?.transferBudget ?? 0) * TRANSFER_BUDGET_ROLLOVER_FRACTION);
  return refill + rollover;
}

// =============================================================================
// Prize money + promotion/relegation ripple
// =============================================================================

export function applyPrizeMoney(career, args) {
  const tier = leagueTierOf(career);
  const table = PRIZE_MONEY[tier] || PRIZE_MONEY[3];
  let cash = career.finance.cash;
  const events = [];

  if (args.premiership) {
    cash += table.premiership;
    events.push({ amount:  table.premiership, label: 'Premiership prize money' });
  } else if (args.runnerUp) {
    cash += table.runnerUp;
    events.push({ amount:  table.runnerUp,    label: 'Runner-up prize money' });
  } else if (args.finals) {
    cash += table.finals;
    events.push({ amount:  table.finals,      label: 'Finals appearance bonus' });
  }
  if (args.woodenSpoon) {
    cash -= table.woodenSpoonPenalty;
    events.push({ amount: -table.woodenSpoonPenalty, label: 'Wooden spoon penalty' });
  }
  return { cash, events };
}

// Apply finance ripple from promotion/relegation. Returns a partial finance patch.
export function applyPromotionRipple(career, args) {
  const baseTier = args.newTier ?? leagueTierOf(career);
  const baseFinance = TIER_FINANCE[baseTier] || TIER_FINANCE[3];
  const cfg = getDifficultyConfig(career.difficulty);
  const sponsorMult = args.promoted ? 1.30 : args.relegated ? 0.50 : 1.0;
  const newSponsors = (career.sponsors || []).map(s => ({
    ...s,
    annualValue: Math.round((s.annualValue ?? 0) * sponsorMult),
  }));
  const boardDelta = args.promoted ? 20 : args.relegated ? -25 : 0;
  return {
    sponsors: newSponsors,
    finance: {
      ...career.finance,
      wageBudget:     Math.round(baseFinance.wageBudget    * (cfg.cashMultiplier ?? 1.0)),
      transferBudget: Math.round(baseFinance.transferBudget * (cfg.transferBudgetMultiplier ?? 1.0)),
      boardConfidence: clamp((career.finance?.boardConfidence ?? 50) + boardDelta, 0, 100),
    },
  };
}

// =============================================================================
// Insolvency
// =============================================================================

// 0 = healthy, 1 = warning, 2 = emergency, 3 = bank loan, 4 = sacking trigger
export function cashCrisisLevel(career) {
  if ((career.finance?.cash ?? 0) >= 0) return 0;
  const startWeek = career.cashCrisisStartWeek ?? career.week ?? 0;
  const weeks = (career.week ?? 0) - startWeek;
  if (weeks >= INSOLVENCY.emergencySackWeeks)  return 4;
  if (weeks >= INSOLVENCY.bankLoanWeeks)       return 3;
  if (weeks >= INSOLVENCY.emergencySaleWeeks)  return 2;
  if (weeks >= INSOLVENCY.warningStartWeeks)   return 1;
  return 0;
}

// =============================================================================
// Career-creation finance — used by CareerSetup + acceptNewJob
// =============================================================================

// Build a fresh finance object for a club at the given tier with difficulty applied.
export function makeStartingFinance(tier, difficulty, board = 55) {
  const base = TIER_FINANCE[tier] || TIER_FINANCE[3];
  const cfg = getDifficultyConfig(difficulty);
  return {
    cash:           Math.round(base.cash           * (cfg.cashMultiplier ?? 1.0)),
    annualIncome:   base.annualIncome,
    transferBudget: Math.round(base.transferBudget * (cfg.transferBudgetMultiplier ?? 1.0)),
    wageBudget:     base.wageBudget,
    boardConfidence: board,
    fanHappiness:    60,
  };
}

// =============================================================================
// Difficulty hooks — single source of truth for callers
// =============================================================================

// Apply injury multiplier to a base injury probability (0–1).
export function effectiveInjuryRate(career, baseRate) {
  const cfg = getDifficultyConfig(career?.difficulty);
  return clamp(baseRate * (cfg.injuryMultiplier ?? 1.0), 0, 1);
}

// Apply scout-accuracy bonus/penalty to a player's "scouted overall" reading.
// Hides true overall by adding noise, then nudging by the bonus.
export function scoutedOverall(player, career) {
  const cfg = getDifficultyConfig(career?.difficulty);
  const bonus = cfg.scoutAccuracyBonus ?? 0;
  // Positive bonus -> shown rating closer to true; negative -> more noise.
  const noise = bonus >= 0
    ? Math.round(((rng() * 2 - 1) * Math.max(0, 8 - bonus * 0.4)))
    : Math.round(((rng() * 2 - 1) * (8 + Math.abs(bonus) * 0.4)));
  return clamp((player.overall ?? 60) + noise, 30, 99);
}

// Clamp a player's morale floor to whatever the difficulty allows.
export function moraleClamp(career, value) {
  const cfg = getDifficultyConfig(career?.difficulty);
  return clamp(value, cfg.moraleFloor ?? 0, 100);
}
