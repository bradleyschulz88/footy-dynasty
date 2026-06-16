// ---------------------------------------------------------------------------
// Finance engine — pure functions consumed by AFLManager.jsx and careerAdvance.js.
// All functions take the career object and return either a delta to apply or
// a new partial career patch.
// ---------------------------------------------------------------------------
import {
  TIER_FINANCE, FACILITY_UPKEEP_PER_LEVEL_ANNUAL, INCOME_MIX,
  PRIZE_MONEY, INSOLVENCY,
  TRANSFER_BUDGET_ROLLOVER_FRACTION,
  CONTINUOUS_INCOME_FRACTION, BROADCAST_PER_MATCH, SEASON_MATCHES_EST,
  TICKET_PRICE, BASE_ATTENDANCE,
  T4_COMMUNITY, GAMING_VENUE, MEMBERSHIP_MILESTONES, BOARD_FINANCIAL_OBJECTIVES,
} from './constants.js';
import { getDifficultyConfig } from '../difficulty.js';
import { findLeagueOf, PYRAMID } from '../../data/pyramid.js';
import { clamp } from '../format.js';
import { rng } from '../rng.js';
import { scoutAccuracyBonus, ensureStaffTasks } from '../staffTasks.js';

// =============================================================================
// Helpers
// =============================================================================

// Resolve the league tier for a career (handles missing league cleanly).
// Prefer the ACTIVE competition (career.leagueKey) so promotion/relegation is
// reflected in all tier-keyed finances; fall back to the club's home league.
export function leagueTierOf(career) {
  const activeTier = PYRAMID[career?.leagueKey]?.tier;
  if (activeTier != null) return activeTier;
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

// Annual revenue from a gaming / social venue (Tier 1–2 optional investment).
export function gamingVenueAnnualRevenue(career) {
  const venue = career.gamingVenue;
  if (!venue) return 0;
  const def = GAMING_VENUE.types[venue.type];
  if (!def) return 0;
  return def.annualRevenueBase + def.annualRevenuePerLevel * ((venue.level ?? 1) - 1);
}

// Invest in / upgrade a gaming or social venue. Returns a career patch.
export function investInGamingVenue(career, type) {
  const def = GAMING_VENUE.types[type];
  if (!def) return null;
  const existing = career.gamingVenue;
  const isNew = !existing || existing.type !== type;
  const currentLevel = isNew ? 0 : (existing.level ?? 1);
  if (currentLevel >= GAMING_VENUE.maxLevel) return null;
  const cost = isNew ? def.investmentCost
    : Math.round(def.investmentCost * GAMING_VENUE.upgradeCostMultiplier);
  if ((career.finance?.cash ?? 0) < cost) return null;
  return {
    finance: { ...career.finance, cash: (career.finance?.cash ?? 0) - cost },
    gamingVenue: { type, level: isNew ? 1 : currentLevel + 1 },
    // Community rating hit accumulates per level.
    communityRating: clamp((career.communityRating ?? 70) + def.communityRatingHit, 0, 100),
  };
}

// Recompute annualIncome dynamically based on tier base + ladder + fans + stadium.
// Uses career.membershipBase (default 1.0) as a persistent membership health multiplier
// that grows with finals appearances / premierships and shrinks on relegation.
export function recomputeAnnualIncome(career) {
  const tier = leagueTierOf(career);
  if (tier === 4) return 0; // T4 uses the grassroots model, not this
  const tierBase = fromTier(TIER_FINANCE, career, { annualIncome: 200_000 }).annualIncome;
  const membershipBase = clamp(career.membershipBase ?? 1.0, 0.5, 2.5);
  const stadiumLevel = career.facilities?.stadium?.level ?? 1;
  const fanHappiness = career.finance?.fanHappiness ?? 60;
  const ladderRow = (career.ladder || []).slice().sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
  const myIdx = ladderRow.findIndex(r => r.id === career.clubId);
  const ladderMult = ladderRow.length > 0 && myIdx >= 0
    ? 1 + (0.30 - (myIdx / Math.max(1, ladderRow.length - 1)) * 0.45)
    : 1.0;
  const fanMult = 0.75 + (fanHappiness / 100) * 0.5;
  const stadiumMult = 0.85 + ((stadiumLevel - 1) / 4) * 0.40;
  const gaming = gamingVenueAnnualRevenue(career);
  return Math.round(tierBase * membershipBase * ladderMult * fanMult * stadiumMult) + gaming;
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

// Expected home-game attendance for the current tier, scaled by stadium + fan mood.
export function expectedAttendance(career, leagueTier) {
  const tier = leagueTier ?? leagueTierOf(career);
  const stadiumLevel = career.facilities?.stadium?.level ?? 1;
  const fanHappiness = career.finance?.fanHappiness ?? 60;
  return Math.round(
    (BASE_ATTENDANCE[tier] ?? 600) * (0.6 + stadiumLevel * 0.15) * (0.7 + fanHappiness / 200)
  );
}

// Per-match revenue: gate (home only) + broadcast/TV (every match) + sponsor
// activation (every match). This is the live, event-driven money the club earns
// each time it plays. Returns each line plus the total so the post-match screen
// and ledger can show the breakdown.
export function matchDayRevenue(career, { isHome = true, leagueTier, finalsMultiplier = 1 } = {}) {
  const tier = leagueTier ?? leagueTierOf(career);
  // Finals draw bigger crowds and bigger TV money.
  const attendance = isHome ? Math.round(expectedAttendance(career, tier) * finalsMultiplier) : 0;
  const gate = Math.round(attendance * (TICKET_PRICE[tier] ?? 10));
  const broadcast = Math.round((BROADCAST_PER_MATCH[tier] ?? 0) * finalsMultiplier);
  const sponsor = Math.round((annualSponsorIncome(career) / SEASON_MATCHES_EST) * finalsMultiplier);
  return { attendance, gate, broadcast, sponsor, total: gate + broadcast + sponsor, isHome };
}

// Income that accrues continuously (smoothed daily) — memberships + merch only.
// Gate, broadcast and sponsorship are paid on match day, not here.
export function continuousAnnualIncome(career) {
  return Math.round(recomputeAnnualIncome(career) * CONTINUOUS_INCOME_FRACTION);
}

// Income breakdown for the FinancesTab UI — an ANNUAL PROJECTION built from the
// per-match model. Gate + broadcast + sponsor are projected across a full season
// of matches; membership + merch are the smoothed continuous lines. This keeps
// the screen honest: the projected total is what the club will actually bank if
// it plays out the season at its current form/stadium/fan level.
export function incomeBreakdown(career) {
  const total = recomputeAnnualIncome(career);
  const tier = leagueTierOf(career);
  const homeGames = Math.round(SEASON_MATCHES_EST / 2);
  const perMatch = matchDayRevenue(career, { isHome: true, leagueTier: tier });

  const broadcast   = (BROADCAST_PER_MATCH[tier] ?? 0) * SEASON_MATCHES_EST;
  const gate        = perMatch.gate * homeGames;
  const membership  = Math.round(total * INCOME_MIX.membership);
  const merchandise = Math.round(total * INCOME_MIX.merchandise);
  const sponsors    = annualSponsorIncome(career);

  const gaming = gamingVenueAnnualRevenue(career);
  return {
    broadcast, gate, membership, merchandise, sponsors, gaming,
    grandTotal: broadcast + gate + membership + merchandise + sponsors + gaming,
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

  // Only memberships + merch accrue continuously. Gate, broadcast and sponsor
  // money is banked on match day (see matchDayRevenue), so it is NOT smoothed here.
  const continuousIncome = continuousAnnualIncome(c);
  const annualWages      = annualWageBill(c);
  const annualUpkeep     = annualFacilityUpkeep(c);

  const dayIncome   = Math.round(continuousIncome / 365);
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

  // Headline annual income shown in the UI = full season projection (per-match
  // lines + smoothed lines), so the number matches what the club actually banks.
  c.finance.annualIncome = incomeBreakdown(c).grandTotal;

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
// Tier 4 / Grassroots community finance
// =============================================================================

// Annual grassroots income for UI projection (not the live event-driven amounts).
export function grassrootsIncomeBreakdown(career) {
  const sponsors  = annualSponsorIncome(career);
  const listSize  = (career.squad || []).length;
  const regFees   = listSize * T4_COMMUNITY.registrationFeePerPlayer;
  const homeGames = Math.round(SEASON_MATCHES_EST / 2);
  const canteen   = homeGames * ((T4_COMMUNITY.canteenPerHomeGame.min + T4_COMMUNITY.canteenPerHomeGame.max) / 2);
  const grants    = career.t4GrantsThisSeason ?? 0;
  return {
    sponsors, regFees, canteen, grants,
    grandTotal: sponsors + regFees + canteen + grants,
  };
}

// Annual grassroots expenses for UI projection.
export function grassrootsExpenseBreakdown(career) {
  const fixed      = T4_COMMUNITY.affiliationFeeAnnual + T4_COMMUNITY.insuranceAnnual;
  const equip      = (T4_COMMUNITY.equipmentAnnual.min + T4_COMMUNITY.equipmentAnnual.max) / 2;
  const homeGames  = Math.round(SEASON_MATCHES_EST / 2);
  const groundHire = homeGames * T4_COMMUNITY.groundHirePerGame;
  const umpires    = SEASON_MATCHES_EST * T4_COMMUNITY.umpireFeePerGame;
  const facilities = annualFacilityUpkeep(career);
  return {
    affiliation: T4_COMMUNITY.affiliationFeeAnnual,
    insurance: T4_COMMUNITY.insuranceAnnual,
    equipment: equip,
    groundHire,
    umpires,
    facilities,
    grandTotal: fixed + equip + groundHire + umpires + facilities,
  };
}

// Canteen/BBQ income for a single home game (random within range).
export function grassrootsCanteenIncome() {
  const { min, max } = T4_COMMUNITY.canteenPerHomeGame;
  return Math.round(min + rng() * (max - min));
}

// Per-game operating expenses for a junior club.
export function grassrootsPerGameExpenses() {
  return T4_COMMUNITY.groundHirePerGame + T4_COMMUNITY.umpireFeePerGame;
}

// Season-start registration fee collection for a T4 club.
export function collectRegistrationFees(career) {
  const listSize = (career.squad || []).length;
  return listSize * T4_COMMUNITY.registrationFeePerPlayer;
}

// Daily cashflow tick for a junior (Tier 4) club — replaces tickWeeklyCashflow.
// No wages, no broadcast, no gate income. Only local sponsorship accrues daily;
// registration fees, canteen and grants are event-driven (see careerAdvance.js).
export function tickGrassrootsFinance(c) {
  if (!c?.currentDate) return 0;
  const day = c.currentDate;
  if (c.lastFinanceTickDay === day) return 0;

  const dayIncome   = Math.round(annualSponsorIncome(c) / 365);
  const dayExpenses = Math.round(annualFacilityUpkeep(c) / 365);
  const delta = dayIncome - dayExpenses;

  c.finance.cash += delta;
  c.lastFinanceTickDay = day;

  const isoKey = `${day.slice(0, 4)}-W${isoWeekOf(day)}`;
  c.lastFinanceTickWeek = isoKey;

  const hist = c.weeklyHistory || [];
  const last = hist[hist.length - 1];
  if (last && last.isoKey === isoKey) {
    last.profit   = (last.profit ?? 0) + delta;
    last.cash     = c.finance.cash;
    last.income   = (last.income ?? 0) + dayIncome;
    last.expenses = (last.expenses ?? 0) + dayExpenses;
  } else {
    hist.push({ isoKey, week: c.week ?? 0, profit: delta, cash: c.finance.cash, income: dayIncome, expenses: dayExpenses });
  }
  c.weeklyHistory = hist.slice(-52);

  // Shortage tracking (no sacking path at T4 — handled as sponsor-hunt / grant events).
  if (c.finance.cash < 0) {
    c.cashCrisisStartWeek = c.cashCrisisStartWeek ?? c.week ?? 0;
  } else {
    c.cashCrisisStartWeek = null;
    c.cashCrisisLevel = 0;
  }

  return delta;
}

// =============================================================================
// Membership milestone adjustments (call at season end)
// =============================================================================

export function applyMembershipMilestone(career, args) {
  let base = career.membershipBase ?? 1.0;
  if (args.premiership)      base += MEMBERSHIP_MILESTONES.premiership;
  if (args.finalsAppearance) base += MEMBERSHIP_MILESTONES.finalsAppearance;
  if (args.promoted)         base += MEMBERSHIP_MILESTONES.promoted;
  if (args.relegated)        base += MEMBERSHIP_MILESTONES.relegated;
  if (args.woodenSpoon)      base += MEMBERSHIP_MILESTONES.woodenSpoon;
  return clamp(base, 0.5, 2.5);
}

// =============================================================================
// Board financial objective — set each season, evaluated at season end
// =============================================================================

// Pick which financial objective the board sets for this season.
// Rich, healthy clubs in Tier 1 favour "invest to win"; struggling clubs favour
// "break even"; clubs with loans get "reduce liabilities".
export function pickBoardFinancialObjective(career) {
  const tier = leagueTierOf(career);
  const net = annualNetProjection(career);
  const hasLoan = !!career.bankLoan;
  const transferBudget = career.finance?.transferBudget ?? 0;

  if (hasLoan) return 'reduceLiabilities';
  if (net < 0)  return 'breakEven';
  if (tier === 1 && transferBudget > 500_000) return 'investToWin';
  if (net > 0 && net > recomputeAnnualIncome(career) * 0.05) return 'profitTarget';
  return 'breakEven';
}

// Evaluate whether the current season met the board's financial objective.
// Returns { met: bool, delta: number } — caller applies delta to boardConfidence.
export function evaluateBoardFinancialObjective(career, args) {
  const objKey = career.boardFinancialObjective;
  const def = BOARD_FINANCIAL_OBJECTIVES[objKey];
  if (!def || !objKey) return { met: null, delta: 0 };

  const seasonNet = args.seasonNet ?? 0;
  const transferSpentFraction = args.transferSpentFraction ?? 0;
  const debtReduced = args.debtReduced ?? false;

  let met = false;
  if (objKey === 'breakEven')         met = seasonNet >= 0;
  if (objKey === 'profitTarget')      met = seasonNet >= (recomputeAnnualIncome(career) * 0.08);
  if (objKey === 'investToWin')       met = transferSpentFraction >= 0.70;
  if (objKey === 'reduceLiabilities') met = debtReduced || (seasonNet > 0 && !career.bankLoan);

  return {
    met,
    delta: met ? def.confidenceReward : def.confidencePenalty,
    label: def.label,
  };
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
  return (career?.squad || []).reduce((a, p) => a + Number(p.wage ?? 0), 0);
}

// Headroom = effective cap minus current player wages.
export function capHeadroom(career) {
  return Math.max(0, effectiveWageCap(career) - currentPlayerWageBill(career));
}

// Can the club add a new player on `wageOffer` without breaching the cap?
export function canAffordSigning(career, wageOffer) {
  const cap = effectiveWageCap(career);
  if (cap === 0) return true; // no cap configured — allow
  const inc = Number(wageOffer ?? 0);
  return currentPlayerWageBill(career) + inc <= cap;
}

// Scale all player wages down so the squad fits under the effective cap (e.g. new career).
// Returns a new squad array; leaves `career` immutable.
// 0.80 default leaves real cap room at career start — a fresh club shouldn't open
// on a "salary cap is tight" warning with no headroom for renewals or trades.
export function scaledSquadToFitCap(career, headroom = 0.80) {
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
export function scoutedOverall(player, career, extras = {}) {
  const cfg = getDifficultyConfig(career?.difficulty);
  let staffBon = scoutAccuracyBonus(career?.staff, ensureStaffTasks(career));
  if (typeof extras.focusBonus === 'number') staffBon += extras.focusBonus;
  const bonus = (cfg.scoutAccuracyBonus ?? 0) + staffBon;
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
