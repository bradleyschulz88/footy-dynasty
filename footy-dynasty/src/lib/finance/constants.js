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
    cash:           120_000,
    annualIncome:   350_000,
    transferBudget: 20_000,
    wageBudget:     55_000,
  },
  4: {
    cash:             3_000,
    annualIncome:    18_000,
    transferBudget:       0,
    wageBudget:           0,
  },
};

// Annual league distribution (AFL / state-league funding), as shares of the
// tier's annualIncome: every club gets `base`; the equalisation top-up scales
// up to `eqMax` with need (prior ladder finish + revenue weakness).
// ponytail: T3/T4 intentionally absent — community clubs get grants and
// registration fees, not league distributions; add a tier key here to extend.
export const DISTRIBUTION_SHARES = {
  1: { base: 0.40, eqMax: 0.18 }, // premier ≈ 40% of annualIncome, wooden-spooner ≈ 55%+
  2: { base: 0.25, eqMax: 0.10 },
};

// Annual facility upkeep per level. Single source of truth — referenced both
// in the weekly cashflow tick and the FinancesTab annual projection.
export const FACILITY_UPKEEP_PER_LEVEL_ANNUAL = {
  1: 130_000,   // Tier 1
  2: 30_000,
  3: 6_000,
  4: 500,
};

// Income mix — fraction of the headline annual income that each line represents.
// Gate, broadcast and sponsorship are now paid PER MATCH (see matchDayRevenue),
// so only membership + merchandise accrue continuously each calendar day.
// `broadcast`/`gate` here are retained purely so the FinancesTab annual
// projection can scale the smoothed slice; the live money comes match by match.
// Membership + merch carry 30% of income so clubs aren't starved through the
// long pre-season months when no match money arrives.
export const INCOME_MIX = {
  broadcast: 0.40,
  gate:      0.30,
  membership: 0.22,
  merchandise: 0.08,
};

// Fraction of the headline annual income that accrues continuously (smoothed)
// each calendar day — memberships + merch. The rest is earned on match day.
export const CONTINUOUS_INCOME_FRACTION = INCOME_MIX.membership + INCOME_MIX.merchandise; // 0.20

// Broadcast / TV-rights money paid for EVERY match played (home and away), by tier.
// This is the single biggest match-day line at tier 1 and the reason a deep
// finals run is so lucrative.
// Tier 3 is local/community footy: no TV-rights money. Clubs may stream games
// locally for exposure, but that brings no income — so tier 3 is set to 0 and
// makes its match-day money from the gate (small) and the bar/canteen instead.
export const BROADCAST_PER_MATCH = {
  1: 1_900_000,
  2: 110_000,
  3: 0,
  4: 0,
};

// Approximate matches per season (home + away) used to (a) project per-match
// income to an annual figure for the FinancesTab and (b) spread annual sponsor
// value into per-match activation payments.
export const SEASON_MATCHES_EST = 22;

// Prize money by tier — paid in finishSeason()
export const PRIZE_MONEY = {
  1: { premiership: 5_000_000, runnerUp: 2_500_000, finals: 1_250_000, woodenSpoonPenalty: 500_000 },
  2: { premiership:   400_000, runnerUp:   200_000, finals:    90_000, woodenSpoonPenalty:  40_000 },
  3: { premiership:    25_000, runnerUp:    12_500, finals:     5_000, woodenSpoonPenalty:   3_000 },
  4: { premiership:       500, runnerUp:       250, finals:       100, woodenSpoonPenalty:       0 },
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

// Stadium gate revenue per attendee, by tier. Tier 3 is gold-coin / small entry
// — the bar and canteen are where a local club actually makes its game-day money.
export const TICKET_PRICE = { 1: 38, 2: 16, 3: 5 };

// Base attendance, by tier (multiplied by stadium level + fan happiness).
export const BASE_ATTENDANCE = { 1: 35_000, 2: 4_000, 3: 350 };

// Transfer budget — how much unused budget rolls over season-to-season.
export const TRANSFER_BUDGET_ROLLOVER_FRACTION = 0.30;

// ---------------------------------------------------------------------------
// Tier 4 / Grassroots community club budget constants.
// No wages, no broadcast, no gate — the loop is cash-flow survival, fundraising
// and keeping the local sponsor happy.
// ---------------------------------------------------------------------------
export const T4_COMMUNITY = {
  // Net registration income per listed player at the start of each season
  // (after the federation levy is deducted).
  registrationFeePerPlayer: 200,

  // Canteen / BBQ takings per home game. The randomised swing represents weather,
  // crowd size, volunteers showing up, and how well the pie warmer is stocked.
  canteenPerHomeGame: { min: 200, max: 600 },

  // Per-game operating costs (home games only — away travel is on the other club).
  groundHirePerGame: 300,
  umpireFeePerGame: 120,

  // Annual fixed costs regardless of season outcome.
  affiliationFeeAnnual: 800,
  insuranceAnnual: 1_200,
  equipmentAnnual: { min: 600, max: 1_500 }, // balls, training aids, first-aid kit

  // Cash-shortage escalation thresholds (weeks negative before each event fires).
  cashShortageHuntWeeks:  2, // → generate local sponsor offers, push player to Sponsors tab
  cashShortageGrantWeeks: 4, // → lodge an emergency grant application (result in 2–3 weeks)
};

// ---------------------------------------------------------------------------
// Tier 3 / Semi-amateur community club budget constants.
// Semi-professional — some paid players, but bar & social is the #1 game-day
// earner. No broadcast, no gate beyond a small entry fee.
// ---------------------------------------------------------------------------
export const T3_COMMUNITY = {
  // Bar / social club takings per home game — the main game-day earner.
  barPerHomeGame:      { min: 500,  max: 2_000 },
  // Canteen / food (BBQ, pies) — lower margin than bar.
  canteenPerHomeGame:  { min: 200,  max: 700  },
  // Player registration fee collected per listed player at season start.
  registrationFeePerPlayer: 150,
  // Ground hire per HOME game (away club covers their own ground).
  groundHirePerGame:   350,
  // Umpire fees — paid for all home games.
  umpireFeePerGame:    180,
  // Annual affiliation + insurance levy to the state body.
  affiliationFeeAnnual: 1_500,
  insuranceAnnual:      2_500,
  // Equipment budget per season (training gear, first-aid, balls).
  equipmentAnnual:     { min: 1_000, max: 3_000 },
};

// ---------------------------------------------------------------------------
// Board financial objectives — set each season, evaluated at season end.
// The board picks one based on the club's financial health.
// ---------------------------------------------------------------------------
export const BOARD_FINANCIAL_OBJECTIVES = {
  breakEven: {
    label: 'Break Even',
    description: 'End the season without running a loss.',
    confidenceReward: 8,
    confidencePenalty: -6,
  },
  profitTarget: {
    label: 'Return a Profit',
    description: 'Generate a meaningful surplus to strengthen reserves.',
    // threshold set dynamically at 8% of annual income projection
    confidenceReward: 10,
    confidencePenalty: -8,
  },
  investToWin: {
    label: 'Invest in the List',
    description: 'Spend at least 70% of the transfer budget — the board wants results, not savings.',
    confidenceReward: 8,
    confidencePenalty: -5,
  },
  reduceLiabilities: {
    label: 'Reduce Financial Exposure',
    description: 'Repay debt or grow cash reserves — financial discipline is the priority.',
    confidenceReward: 12,
    confidencePenalty: -8,
  },
};

// ---------------------------------------------------------------------------
// Gaming / social venue investment — Tier 1–2 optional strategic decision.
// A real AFL mechanic: clubs own pokies and social venues for large recurring
// revenue, at a cost to community reputation.
// ---------------------------------------------------------------------------
export const GAMING_VENUE = {
  types: {
    socialClub: {
      label: 'Social Club',
      description: 'Bar, bistro and function rooms. Good revenue, minimal controversy.',
      investmentCost: 500_000,
      annualRevenueBase: 350_000,
      annualRevenuePerLevel: 150_000,
      communityRatingHit: -3,
    },
    pokies: {
      label: 'Gaming Lounge (Pokies)',
      description: 'Maximum revenue — but a significant community reputation hit that grows with each expansion.',
      investmentCost: 1_500_000,
      annualRevenueBase: 900_000,
      annualRevenuePerLevel: 420_000,
      communityRatingHit: -12,
    },
  },
  maxLevel: 3,
  upgradeCostMultiplier: 0.6, // subsequent levels cost 60% of initial investment
};

// ---------------------------------------------------------------------------
// Membership milestone multipliers — permanently adjust career.membershipBase
// (starts at 1.0) after key season outcomes.
// ---------------------------------------------------------------------------
export const MEMBERSHIP_MILESTONES = {
  premiership:      +0.15,
  finalsAppearance: +0.04, // stacks; capped in engine at 3 consecutive
  promoted:         +0.08,
  relegated:        -0.12,
  woodenSpoon:      -0.06,
};

// Base member count per tier at membership health 1.0 (career.membershipBase).
// The visible "members" number = MEMBER_BASE[tier] × membershipBase, so the
// existing milestone system (premierships, finals, relegation) drives it.
// T1 spans ≈27k–137k across the 0.5–2.5 health range — matching real AFL scale.
export const MEMBER_BASE = {
  1: 55_000,
  2: 4_500,
  3: 300,
  4: 60,
};
