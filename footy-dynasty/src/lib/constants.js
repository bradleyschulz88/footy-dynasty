// Game Constants - Magic numbers replaced with named constants
// Extracted from matchEngine.js, leagueEngine.js, careerAdvance.js, etc.

// Match Engine Constants
export const MATCH = {
  // Base shot rates per quarter (both teams combined)
  BASE_SHOTS_PER_QUARTER: 16,
  // Base goal accuracy at 0 rating diff
  BASE_GOAL_ACCURACY: 0.42,
  // Accuracy randomness range
  ACCURACY_RANDOMNESS: 0.18,
  // Behind probability when not a goal
  BEHIND_PROBABILITY: 0.30,
  // Minimum shots per quarter
  MIN_SHOTS_PER_QUARTER: 2,
  // Momentum tilt at full swing (~9 rating points)
  MOMENTUM_STRENGTH: 9,
  // Momentum decay per quarter
  MOMENTUM_DECAY: 0.72,
  // Margin nudge factor
  MARGIN_NUDGE_FACTOR: 0.14,
  // Stoppage chain count range
  STOPPAGE_CHAINS_MIN: 3,
  STOPPAGE_CHAINS_MAX: 6,
  // Fatigue factor in Q3/Q4
  FATIGUE_FACTOR: 0.35,
  // Bench strength bonus multiplier
  BENCH_STRENGTH_MULTIPLIER: 0.11,
  // Interchange rotation bonus multiplier
  INTERCHANGE_ROTATION_MULTIPLIER: 0.85,
  // Key moments per quarter probability
  KEY_MOMENT_PROB_1: 0.45,
  KEY_MOMENT_PROB_2: 0.20,
  // Goal finishing quality exponent
  GOAL_FINISH_EXPONENT: 3,
  // Defensive pressure base multiplier
  DEF_PRESSURE_BASE: 0.003,
  // Weather accuracy penalties
  WEATHER_RAIN_PENALTY: 0.92,
  WEATHER_WIND_PENALTY: 0.96,
  // Tactic lean multipliers
  TACTIC_LEAN_DEFENSIVE: 1.5,
  TACTIC_LEAN_FLOOD: 1.3,
  TACTIC_LEAN_BALANCED: 1.0,
  // Quarter shot rate multipliers
  TACTIC_QUARTER_MULT: {
    defensive: [1.05, 1.03, 0.98, 0.94],
    balanced: [1, 1, 1, 1],
    attack: [0.96, 0.98, 1.02, 1.06],
    flood: [1.02, 1.04, 1.0, 0.96],
    press: [1.0, 1.02, 1.04, 0.98],
    run: [0.98, 0.99, 1.03, 1.05],
  },
  // Suppression scale for opponent tactics
  SUPPRESSION_BASE: 0.5,
  SUPPRESSION_GOAL_MOD_MULTIPLIER: 2,
  // Score splitting for AI-vs-AI quarters
  QUARTER_SPLIT_RANDOM_FACTOR: 0.6,
};

// League Engine Constants
export const LEAGUE = {
  // Tier 3 local divisions
  LOCAL_DIVISION_COUNT: 5,
  TIER3_CLUBS_PER_DIVISION_TARGET: 10,
  TIER3_MIN_CLUBS_PER_DIVISION: 4,
  // Maximum season rounds (AFL plays ~22-23, not full 34 round double RR)
  MAX_SEASON_ROUNDS: 23,
  // Bye round window
  BYE_START_ROUND: 12,
  BYE_END_ROUND: 19,
  // Max byes per round
  MAX_BYES_PER_ROUND_FACTOR: 0.5,
};

// Career Advancement Constants
export const CAREER = {
  // Tutorial steps
  TUTORIAL_COMPLETE_STEP: 6,
  // Quick advance batch limit
  QUICK_ADVANCE_MAX_ITERATIONS: 30,
  // Board patience seasons by difficulty
  BOARD_PATIENCE_GRASSROOTS: 5,
  BOARD_PATIENCE_CONTENDER: 3,
  BOARD_PATIENCE_ELITE: 2,
  // Injury multiplier by difficulty
  INJURY_MULTIPLIER_GRASSROOTS: 0.7,
  INJURY_MULTIPLIER_CONTENDER: 1.0,
  INJURY_MULTIPLIER_ELITE: 1.3,
  // Cash crisis threshold
  CASH_CRISIS_WEEKS: 4,
  // Cash crisis levels
  CASH_CRISIS_LEVELS: 3,
  // Trade period days
  TRADE_PERIOD_DAYS: 14,
  // Post-trade draft countdown
  POST_TRADE_DRAFT_COUNTDOWN_DAYS: 7,
  // Squad size limits
  MAX_SQUAD_SIZE: 40,
  MATCH_DAY_SQUAD: 23,
  FIELD_PLAYERS: 18,
  INTERCHANGE_PLAYERS: 4,
  MEDICAL_SUB: 1,
  // Minimum games for partnership bonus
  PARTNERSHIP_MIN_GAMES: 20,
  // Max synergy bonus
  MAX_SYNERGY_BONUS: 5,
  // Coach reputation tiers
  COACH_TIERS: {
    GRASSROOTS: { min: 0, max: 29, label: 'Grassroots' },
    JOURNEYMAN: { min: 30, max: 49, label: 'Journeyman' },
    SENIOR: { min: 50, max: 69, label: 'Senior Coach' },
    ELITE: { min: 70, max: 84, label: 'Elite Coach' },
    LEGEND: { min: 85, max: 100, label: 'Legend' },
  },
  // Accreditation levels
  ACCREDITATION_LEVELS: {
    1: 'Level 1',
    2: 'Level 2',
    3: 'Level 3',
    4: 'Level 4',
  },
  // Milestone games
  MILESTONE_GAMES: [1, 50, 100, 150, 200, 250, 300],
  // Milestone career goals
  MILESTONE_GOALS: [50, 100, 200, 300, 500],
};

// Finance Constants
export const FINANCE = {
  // Tier-based salary caps
  SALARY_CAP_TIER1: 13_000_000,
  SALARY_CAP_TIER2: 2_500_000,
  SALARY_CAP_TIER3: 400_000,
  // Wage multipliers by tier
  WAGE_MULTIPLIER_TIER1: 5800,
  WAGE_MULTIPLIER_TIER2: 1200,
  WAGE_MULTIPLIER_TIER3: 250,
  // Value calculation multipliers
  VALUE_MULTIPLIER_TIER1: 280,
  VALUE_MULTIPLIER_TIER2: 70,
  VALUE_MULTIPLIER_TIER3: 12,
  // Sponsor renewal
  SPONSOR_RENEWAL_MIN_YEARS: 1,
  SPONSOR_RENEWAL_MAX_YEARS: 3,
  // Membership milestones
  MEMBERSHIP_MILESTONES: [5000, 10000, 20000, 30000, 50000, 75000, 100000],
  // Prize money
  PRIZE_MONEY_TIER1_PREMIERS: 2_000_000,
  PRIZE_MONEY_TIER1_RUNNER_UP: 1_000_000,
  PRIZE_MONEY_TIER2_PREMIERS: 500_000,
  PRIZE_MONEY_TIER3_PREMIERS: 100_000,
  // Grassroots income
  GRASSROOTS_CANTEEN_PER_GAME: 2000,
  GRASSROOTS_BAR_PER_GAME: 3000,
  GRASSROOTS_PER_GAME_EXPENSES: 1500,
  REGISTRATION_FEE_PER_PLAYER: 200,
  // Bank loan
  BANK_LOAN_MAX_WEEKS: 52,
  BANK_LOAN_INTEREST_RATE: 0.08,
  // Insolvency
  INSOLVENCY_CASH_THRESHOLD: -50000,
  // Fundraiser
  FUNDRAISER_MAX_PER_SEASON: 2,
  FUNDRAISER_INCOME_MULTIPLIER: 0.1,
  // Community grant
  COMMUNITY_GRANT_ONCE_PER_CAREER: true,
  COMMUNITY_GRANT_AMOUNT: 100000,
  // Naming rights
  NAMING_RIGHTS_MIN_YEARS: 3,
  NAMING_RIGHTS_MAX_YEARS: 10,
};

// Player Generation Constants
export const PLAYER = {
  // Age distribution
  AGE_MEAN: 24,
  AGE_STDDEV: 4,
  MIN_AGE: 17,
  MAX_AGE: 36,
  // Base skill distribution
  BASE_SKILL_MEAN: 68,
  BASE_SKILL_STDDEV: 11,
  MIN_SKILL: 42,
  MAX_SKILL: 99,
  // Attribute stddevs
  ATTR_STDDEV_BASE: 6,
  ATTR_STDDEV_HANDBALL: 5,
  ATTR_STDDEV_TACKLING: 7,
  ATTR_STDDEV_SPEED: 7,
  ATTR_STDDEV_ENDURANCE: 6,
  ATTR_STDDEV_STRENGTH: 7,
  ATTR_STDDEV_DECISION: 6,
  // Position weights
  POSITION_WEIGHTS: {
    KF: 2, HF: 3, C: 4, HB: 3, KB: 2, R: 3, RU: 1, WG: 2, UT: 2,
  },
  // Secondary position chances
  SEC_CHANCE_UT: 0.10,
  SEC_CHANCE_RU: 0.55,
  SEC_CHANCE_DEFAULT: 0.28,
  // Contract length
  MIN_CONTRACT: 1,
  MAX_CONTRACT: 4,
  // Rookie age threshold
  ROOKIE_MAX_AGE: 19,
  // Form range
  MIN_FORM: 50,
  MAX_FORM: 85,
  // Fitness range
  MIN_FITNESS: 85,
  MAX_FITNESS: 100,
  // Morale range
  MIN_MORALE: 60,
  MAX_MORALE: 90,
  // Trait probabilities by age
  TRAIT_PROB_UNDER_22: { grinder: 0.35, hothead: 0.25, mentor: 0.15, leader: 0.15, drifter: 0.10 },
  TRAIT_PROB_22_28: { leader: 0.25, grinder: 0.25, mentor: 0.20, hothead: 0.20, drifter: 0.10 },
  TRAIT_PROB_OVER_28: { leader: 0.30, mentor: 0.30, grinder: 0.20, hothead: 0.10, drifter: 0.10 },
  // Potential gains by age
  POTENTIAL_GAIN_UNDER_22: { min: 5, max: 18 },
  POTENTIAL_GAIN_22_25: { min: 0, max: 8 },
  POTENTIAL_GAIN_OVER_25: { min: -2, max: 3 },
  // Ruck attribute bonuses
  RUCK_STRENGTH_BONUS: 8,
  RUCK_MARKING_BONUS: 5,
  RUCK_SPEED_PENALTY: 6,
  // Midfielder/Wing bonuses
  MID_SPEED_BONUS: 6,
  MID_ENDURANCE_BONUS: 5,
  // Key position bonuses
  KP_MARKING_BONUS: 6,
  KP_STRENGTH_BONUS: 4,
  // Attribute clamp
  MIN_ATTR: 30,
  MAX_ATTR: 99,
};

// Injury Constants
export const INJURY = {
  INJURY_TABLE: [
    { type: 'soft_tissue', label: 'Hamstring Strain', minWeeks: 2, maxWeeks: 5, chance: 0.30 },
    { type: 'soft_tissue', label: 'Calf Strain', minWeeks: 2, maxWeeks: 4, chance: 0.15 },
    { type: 'shoulder', label: 'Shoulder (AC)', minWeeks: 3, maxWeeks: 8, chance: 0.12 },
    { type: 'knee_minor', label: 'Knee (Meniscus)', minWeeks: 4, maxWeeks: 10, chance: 0.08 },
    { type: 'ankle', label: 'Ankle Sprain', minWeeks: 2, maxWeeks: 6, chance: 0.12 },
    { type: 'concussion', label: 'Concussion', minWeeks: 1, maxWeeks: 3, chance: 0.08 },
    { type: 'fracture', label: 'Foot Fracture', minWeeks: 5, maxWeeks: 12, chance: 0.05 },
    { type: 'knee_acl', label: 'ACL (Knee)', minWeeks: 20, maxWeeks: 28, chance: 0.03 },
    { type: 'soft_tissue', label: 'Quad Strain', minWeeks: 2, maxWeeks: 4, chance: 0.07 },
  ],
  // Severity distribution
  SEVERITY_MILD_PROB: 0.33,
  SEVERITY_MODERATE_PROB: 0.34,
  SEVERITY_SEVERE_PROB: 0.33,
};

// UI Constants
export const UI = {
  // Touch targets
  MIN_TOUCH_TARGET: 44, // px
  MIN_TOUCH_TARGET_SM: 40, // px
  // Animations
  ANIMATION_DURATION_FAST: 150,
  ANIMATION_DURATION_NORMAL: 250,
  ANIMATION_DURATION_SLOW: 400,
  // Breakpoints
  BREAKPOINT_SM: 640,
  BREAKPOINT_MD: 768,
  BREAKPOINT_LG: 1024,
  BREAKPOINT_XL: 1280,
  // Z-index layers
  Z_INDEX_DROPDOWN: 100,
  Z_INDEX_MODAL: 200,
  Z_INDEX_TOAST: 300,
  Z_INDEX_TOOLTIP: 400,
};

// Calendar Constants
export const CALENDAR = {
  PRESEASON_START_MONTH: 11,
  PRESEASON_START_DAY: 1,
  SEASON_START_MONTH: 3,
  SEASON_START_DAY: 15,
  FINALS_START_MONTH: 9,
  FINALS_START_DAY: 1,
  GRAND_FINAL_MONTH: 9,
  GRAND_FINAL_DAY: 25,
  // Training intensity scale
  TRAINING_INTENSITY_MIN: 30,
  TRAINING_INTENSITY_MAX: 100,
  TRAINING_INTENSITY_DEFAULT: 60,
  // Training focus boost
  TRAINING_ATTR_FOCUS_BOOST: 0.15,
};

// Draft Constants
export const DRAFT = {
  COMBINE_SCOUT_COST: 50000,
  SCOUT_REVEAL_TIERS: {
    1: { attrReveal: 3, overallReveal: 5 },
    2: { attrReveal: 5, overallReveal: 3 },
    3: { attrReveal: 7, overallReveal: 2 },
  },
  REGIONAL_SCOUT_QUALITY: {
    sameState: 0.9,
    adjacentState: 0.7,
    otherState: 0.5,
  },
};

// Scouting System Constants
export const SCOUTING = {
  DEPLOYMENT_DURATION_WEEKS: 4,
  RELATIONSHIP_BOOST_BASE: 10,
  RELATIONSHIP_BOOST_DECAY: 0.1,
  WATCHLIST_STALENESS_THRESHOLD: 8,
  WATCHLIST_MAX_ENTRIES: 20,
};

// Lineup Constants
export const LINEUP = {
  FIELD_COUNT: 18,
  INTERCHANGE_COUNT: 4,
  MEDICAL_SUB_COUNT: 1,
  TOTAL_CAP: 23,
  // Slot zones
  SLOT_ZONES: {
    0: 'DEF', 1: 'DEF', 2: 'DEF',
    3: 'HB', 4: 'HB', 5: 'HB',
    6: 'MID', 7: 'MID', 8: 'MID',
    9: 'HF', 10: 'HF', 11: 'HF',
    12: 'FWD', 13: 'FWD', 14: 'FWD',
    15: 'RUCK', 16: 'RUCK', 17: 'RUCK',
    18: 'IC', 19: 'IC', 20: 'IC', 21: 'IC', 22: 'IC',
  },
  // Position to zone mapping
  POSITION_ZONES: {
    KB: 'DEF', HB: 'DEF',
    C: 'MID', R: 'MID', WG: 'MID',
    HF: 'HF', KF: 'FWD',
    RU: 'RUCK',
    UT: 'IC',
  },
};

// Community Constants
export const COMMUNITY = {
  COMMITTEE_ROLES: ['President', 'Secretary', 'Treasurer', 'Social Coordinator', 'Sponsorship Coordinator', 'Facilities Manager', 'Volunteer Coordinator'],
  COMMITTEE_MOOD_BASE: 50,
  COMMITTEE_MOOD_WIN_BONUS: 2,
  COMMITTEE_MOOD_LOSS_PENALTY: 3,
  COMMITTEE_MOOD_DRAW: 0,
  COMMITTEE_BURNOUT_CHANCE: 0.05,
  VOLUNTEER_RECOVERY_PER_WEEK: 1,
  FOOTY_TRIP_COST: 15000,
  FOOTY_TRIP_MOOD_BOOST: 15,
  FUNDRAISER_TYPES: ['Bunnings BBQ', 'Trivia Night', 'Raffle', 'Gala Dinner', 'Auction'],
};

// Board Constants
export const BOARD = {
  CONFIDENCE_MIN: 0,
  CONFIDENCE_MAX: 100,
  CONFIDENCE_START: 55,
  WARNING_THRESHOLD: 3,
  VOTE_SURVIVAL_THRESHOLD: 50,
  MEETING_FREQUENCY_WEEKS: 4,
  OBJECTIVE_TYPES: ['ladder_position', 'budget_discipline', 'youth_promoted', 'premiership'],
  VISION_EVALUATION_YEARS: 3,
};

// Dynasty Constants
export const DYNASTY = {
  QUEST_TYPES: ['wins', 'ladder_pos', 'finals_apps', 'premierships', 'develop_players'],
  MILESTONE_TYPES: ['career_wins', 'premierships', 'seasons_managed', 'promotions', 'players_developed'],
  QUEST_REWARD_BOARD_CONFIDENCE: 5,
  MILESTONE_REWARD_BOARD_CONFIDENCE: 3,
};

// Finals Constants
export const FINALS = {
  TIER1_FINALISTS: 8,
  TIER23_FINALISTS: 6,
  PROMOTION_PLAYOFF_TEAMS: 4,
  RELEGATION_PLAYOFF_TEAMS: 2,
};

// RNG Constants
export const RNG = {
  SEED_MULTIPLIER: 9301,
  SEED_INCREMENT: 49297,
  SEED_MODULUS: 233280,
  // FNV-1a 32-bit
  FNV_OFFSET: 2166136261,
  FNV_PRIME: 16777619,
};

// TIER_SCALE is already in rng.js but included here for reference
export const TIER_SCALE = { 1: 1.00, 2: 0.80, 3: 0.64 };

// Save Constants
export const SAVE = {
  CURRENT_VERSION: 34,
  SLOT_IDS: ['A', 'B', 'C'],
  LEGACY_KEY: 'footy-dynasty-career',
  SLOT_KEY_PREFIX: 'footy-dynasty-career-slot-',
  META_KEY: 'footy-dynasty-slots',
  ACTIVE_KEY: 'footy-dynasty-active-slot',
  EXPORT_KEY: 'footy-dynasty-last-export-at',
  SETUP_KEY: 'footy-dynasty-setup',
};