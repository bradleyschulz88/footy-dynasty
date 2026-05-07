// ---------------------------------------------------------------------------
// Finance constants — tier baselines, prize money, contract demand curves,
// insolvency thresholds, fundraiser ranges. Single tunable block so future
// rebalances live in one file.
// ---------------------------------------------------------------------------

// Baseline financial state at career creation (or at a new club after sacking).
// "Authentic" rebalance: Tier 3 lifted from $90k → $180k cash so the volunteer
// club isn't perpetually one bad week from insolvency; Tier 1 cap tightened.
export const TIER_FINANCE = {
  1: {
    cash:           12_000_000,
    annualIncome:   90_000_000,
    transferBudget: 2_200_000,
    wageBudget:     13_000_000,
  },
  2: {
    cash:           1_200_000,
    annualIncome:   5_500_000,
    transferBudget: 250_000,
    wageBudget:     1_400_000,
  },
  3: {
    cash:           180_000,
    annualIncome:   480_000,
    transferBudget: 35_000,
    wageBudget:     130_000,
  },
};

// Annual facility upkeep per level. Single source of truth — referenced both
// in the weekly cashflow tick and the FinancesTab annual projection.
export const FACILITY_UPKEEP_PER_LEVEL_ANNUAL = {
  1: 130_000,   // Tier 1
  2: 30_000,
  3: 6_000,
};

// Income mix — fraction of annualIncome that comes from each line.
// Sponsors are tracked separately on top of annualIncome (they're an explicit
// line in `career.sponsors`).
export const INCOME_MIX = {
  broadcast: 0.45,
  gate:      0.35,
  membership: 0.15,
  merchandise: 0.05,
};

// Prize money by tier — paid in finishSeason()
export const PRIZE_MONEY = {
  1: { premiership: 5_000_000, runnerUp: 2_500_000, finals: 1_250_000, woodenSpoonPenalty: 500_000 },
  2: { premiership:   400_000, runnerUp:   200_000, finals:    90_000, woodenSpoonPenalty:  40_000 },
  3: { premiership:    25_000, runnerUp:    12_500, finals:     5_000, woodenSpoonPenalty:   3_000 },
};

// Contract renewal demand curve. Player demands a multiplier on their current
// wage based on age + form. Younger players accept smaller bumps; veterans
// demand more for one last season.
export const RENEWAL_AGE_CURVE = {
  // age <= 22 — youth
  young:  { wageMult: [1.05, 1.15], yearsRange: [2, 4] },
  // 23–28 — prime
  prime:  { wageMult: [1.10, 1.25], yearsRange: [2, 4] },
  // 29–32 — veteran
  vet:    { wageMult: [1.05, 1.18], yearsRange: [1, 3] },
  // 33+ — twilight
  twilight:{ wageMult: [1.00, 1.12], yearsRange: [1, 2] },
};

// Performance multiplier on renewal demand based on current form (0–100).
// Form 90+ wants more; form 50- accepts less.
export function formRenewalMultiplier(form) {
  if (form >= 90) return 1.20;
  if (form >= 80) return 1.12;
  if (form >= 65) return 1.05;
  if (form >= 50) return 1.00;
  if (form >= 35) return 0.92;
  return 0.85;
}

// Insolvency thresholds (cash < 0 streaks)
export const INSOLVENCY = {
  warningStartWeeks:    1,   // first negative week → news warning
  emergencySaleWeeks:   3,   // forced player sale offer
  bankLoanWeeks:        6,   // bank loan offered + sponsor flees
  emergencySackWeeks:   9,   // sacking trigger short-circuits
  bankLoanInterestRate: 0.04,
  bankLoanTermYears:    5,
};

// Fundraiser ranges (Tier 3 community pressure-valve)
export const FUNDRAISERS = {
  triviaNight:   { min: 200, max: 800,  labelEvent: 'Trivia Night',  newsTone: 'committee' },
  sausageSizzle: { min: 150, max: 500,  labelEvent: 'Sausage Sizzle',newsTone: 'committee' },
  workingBee:    { min: 100, max: 400,  labelEvent: 'Working Bee',   newsTone: 'committee' },
  raffle:        { min: 250, max: 1_500,labelEvent: 'Big Raffle',    newsTone: 'committee' },
};

// Community grant (Tier 3 only, once per season if board confidence > 60)
export const COMMUNITY_GRANT = {
  min: 5_000,
  max: 20_000,
  boardConfidenceFloor: 60,
};

// Sponsor renewal proposal multipliers
export const SPONSOR_RENEWAL = {
  contendingBump:  [1.08, 1.15], // top 4 in current season
  averageBump:     [1.00, 1.05], // mid table
  losingDiscount:  [0.92, 0.97], // bottom 4
};

// Stadium gate revenue per attendee, by tier.
export const TICKET_PRICE = { 1: 38, 2: 16, 3: 10 };

// Base attendance, by tier (multiplied by stadium level + fan happiness).
export const BASE_ATTENDANCE = { 1: 35_000, 2: 4_000, 3: 600 };

// Transfer budget — how much unused budget rolls over season-to-season.
export const TRANSFER_BUDGET_ROLLOVER_FRACTION = 0.30;
