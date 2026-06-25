import { rand, randNorm, rng, pick } from './rng.js';
import { findClub } from '../data/pyramid.js';
import { isForwardPreferred, isMidPreferred, isBackPreferred, playerHasPosition } from './playerGen.js';
import { lineupStructureModifier } from './lineupBalance.js';
import { lineupRoleModifier } from './playerRoles.js';
import { LINEUP_CAP, LINEUP_FIELD_COUNT } from './lineupHelpers.js';

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const INJURY_TABLE = [
  { type: 'soft_tissue', label: 'Hamstring Strain', minWeeks: 2, maxWeeks: 5,  chance: 0.30 },
  { type: 'soft_tissue', label: 'Calf Strain',      minWeeks: 2, maxWeeks: 4,  chance: 0.15 },
  { type: 'shoulder',    label: 'Shoulder (AC)',    minWeeks: 3, maxWeeks: 8,  chance: 0.12 },
  { type: 'knee_minor',  label: 'Knee (Meniscus)',  minWeeks: 4, maxWeeks: 10, chance: 0.08 },
  { type: 'ankle',       label: 'Ankle Sprain',     minWeeks: 2, maxWeeks: 6,  chance: 0.12 },
  { type: 'concussion',  label: 'Concussion',       minWeeks: 1, maxWeeks: 3,  chance: 0.08 },
  { type: 'fracture',    label: 'Foot Fracture',    minWeeks: 5, maxWeeks: 12, chance: 0.05 },
  { type: 'knee_acl',   label: 'ACL (Knee)',        minWeeks: 20, maxWeeks: 28, chance: 0.03 },
  { type: 'soft_tissue', label: 'Quad Strain',      minWeeks: 2, maxWeeks: 4,  chance: 0.07 },
];

/**
 * Pick an injury type by weighted chance and assign severity/weeks.
 * Returns { type, label, severity, weeks }.
 */
export function pickInjury() {
  const roll = rng();
  let cumulative = 0;
  let chosen = INJURY_TABLE[0];
  for (const entry of INJURY_TABLE) {
    cumulative += entry.chance;
    if (roll < cumulative) { chosen = entry; break; }
  }
  const mid = Math.round((chosen.minWeeks + chosen.maxWeeks) / 2);
  const r2 = rng();
  let severity, weeks;
  if (r2 < 0.33) {
    severity = 'mild';     weeks = chosen.minWeeks;
  } else if (r2 < 0.67) {
    severity = 'moderate'; weeks = mid;
  } else {
    severity = 'severe';   weeks = chosen.maxWeeks;
  }
  return { type: chosen.type, label: chosen.label, severity, weeks };
}

/** Effective playing rating for one player (form, fitness, morale, optional quarter fatigue). */
export function playerEffectiveMatchRating(player, quarter = null) {
  if (!player) return 0;
  const base = player.trueRating || player.overall || 0;
  const form = player.form ?? 70;
  const fitness = player.fitness ?? 90;
  const morale = player.morale ?? 75;
  // Calibrated to be gentle at league-average form/fitness so teamRating stays comparable to the old formula.
  const formMult = clamp(1 + (form - 70) * 0.0035, 0.92, 1.1);
  const fitnessMult = clamp(0.88 + (fitness - 70) * 0.004, 0.78, 1.06);
  // Morale is centred on the generation mean (75) and softer than form: a flat
  // dressing room costs about as much as a couple of points of form.
  const moraleMult = clamp(1 + (morale - 75) * 0.0015, 0.955, 1.045);
  let fatigue = 1;
  if (quarter != null && Number.isFinite(quarter) && quarter >= 3) {
    const q = Math.min(4, Math.max(1, quarter));
    const u = q - 2; // Q3 -> 1, Q4 -> 2
    fatigue = 1 - u * (1 - fitnessMult) * 0.35;
    fatigue = clamp(fatigue, 0.72, 1);
  }
  const computed = base * formMult * fitnessMult * moraleMult * fatigue;
  const traitBonus = (() => {
    switch (player?.trait) {
      case 'leader':  return 1.5;
      case 'grinder': return 1.0;
      case 'hothead': return rng() < 0.45 ? 6 : -4; // volatile (seeded for replay determinism)
      case 'drifter': return -2.0;
      case 'mentor':  return 0.5;
      default: return 0;
    }
  })();
  return Math.max(1, computed + traitBonus);
}

/**
 * @param {number|null|undefined} quarter  AFL quarter 1–4; if set, applies in-game fatigue in Q3–Q4 (fitness-dependent).
 */
export function teamRating(squad, lineup, training, facilitiesAvg, staffAvg, quarter = null, playerRoles = null) {
  const starterIds =
    lineup && lineup.length
      ? lineup.slice(0, LINEUP_FIELD_COUNT).filter((id) => id != null && id !== '')
      : [];
  const topStarters =
    starterIds.length > 0
      ? (() => {
          const byId = new Map(squad.map((p) => [p.id, p]));
          return starterIds.map((id) => byId.get(id)).filter(Boolean);
        })()
      : squad
          .slice()
          .sort((a, b) => b.overall - a.overall)
          .slice(0, LINEUP_FIELD_COUNT);
  if (topStarters.length === 0) return 50;
  const lineupIdsForStructure = starterIds.length > 0 ? starterIds : topStarters.map((p) => p.id);
  const trainingBoost = (training.intensity - 50) * 0.04;
  const avgEff =
    topStarters.reduce((a, p) => a + playerEffectiveMatchRating(p, quarter), 0) / topStarters.length;
  return avgEff
    + trainingBoost
    + (facilitiesAvg - 1) * 1.2
    + (staffAvg - 60) * 0.15
    + lineupStructureModifier(squad, lineupIdsForStructure)
    + lineupRoleModifier(squad, lineupIdsForStructure, playerRoles);
}

// Tactic adjustments (defense, balance, attack)
// Returns a tuple of { goalRateMod, momentumGain, riskMod }
// goalRateMod: own shot volume. oppRateMod: what you do to the OTHER side's
// shot volume (negative = suppress, positive = concede; applied at half
// strength). riskMod > 1 trades shot quality for volume. Tuned so attack is a
// genuine gamble, defensive/flood counter it, and weather shifts the calculus.
const TACTIC_PROFILES = {
  defensive:  { goalRateMod: -0.12, oppRateMod: -0.16, momentumGain: 0.6, riskMod: 0.7 },
  balanced:   { goalRateMod:  0.00, oppRateMod:  0.00, momentumGain: 1.0, riskMod: 1.0 },
  attack:     { goalRateMod:  0.16, oppRateMod:  0.16, momentumGain: 1.3, riskMod: 1.25 },
  flood:      { goalRateMod: -0.14, oppRateMod: -0.20, momentumGain: 0.6, riskMod: 0.72 },
  press:      { goalRateMod:  0.00, oppRateMod: -0.04, momentumGain: 1.1, riskMod: 1.15 },
  run:        { goalRateMod:  0.10, oppRateMod:  0.10, momentumGain: 1.2, riskMod: 1.15 },
};

/**
 * AI coaches adjust at the breaks. From the second half on, an opponent
 * protecting a clear lead locks down (defensive), while one chasing the game
 * throws on the attack — instead of holding one tactic for four quarters. This
 * makes a late-game flip feel real and rewards the player reading the contest.
 * @param {string} baseTactic the opponent's pre-match plan
 * @param {number} oppLead opponent points minus player points (this match)
 * @param {number} quarterIndex 0-based (0=Q1 … 3=Q4)
 */
export function adaptiveOppTactic(baseTactic, oppLead, quarterIndex) {
  if (quarterIndex < 2) return baseTactic;            // only adjust in the 2nd half
  if (oppLead >= 19) return 'flood';                  // big lead, shut the game down
  if (oppLead >= 10) return 'defensive';              // protect a handy lead
  if (oppLead <= -19) return 'attack';                // must-score territory
  if (oppLead <= -10) return 'run';                   // chase, but stay structured
  return baseTactic;
}

/** Per-quarter shot-volume shape (indexes 0–3 = Q1–Q4). Tunable “phase” feel without extra events. */
const TACTIC_QUARTER_MULT = {
  defensive:  [1.05, 1.03, 0.98, 0.94],
  balanced:   [1, 1, 1, 1],
  attack:     [0.96, 0.98, 1.02, 1.06],
  flood:      [1.02, 1.04, 1.0, 0.96],
  press:      [1.0, 1.02, 1.04, 0.98],
  run:        [0.98, 0.99, 1.03, 1.05],
};

/**
 * Small effective-rating boost when the bench is strong vs chosen starters (Q3–Q4 only).
 * @param {object[]} squad
 * @param {string[]} lineupIds
 * @param {number} quarterNum 1–4
 */
export function benchStrengthBonus(squad, lineupIds, quarterNum) {
  if (!Array.isArray(squad) || quarterNum < 3) return 0;
  const ids = new Set((lineupIds || []).filter((id) => id != null && id !== ''));
  const bench = squad.filter((p) => p && !ids.has(p.id));
  if (bench.length < 4) return 0;
  const rate = (p) => p.trueRating ?? p.overall ?? 60;
  const benchTop = [...bench].sort((a, b) => rate(b) - rate(a)).slice(0, 6);
  const starters = squad.filter((p) => p && ids.has(p.id));
  if (starters.length < Math.floor(LINEUP_FIELD_COUNT * 0.5)) return 0;
  const avgStar = starters.reduce((a, p) => a + rate(p), 0) / starters.length;
  const avgBench = benchTop.reduce((a, p) => a + rate(p), 0) / benchTop.length;
  const diff = Math.max(0, avgBench - avgStar);
  const qScale = quarterNum >= 4 ? 1 : 0.65;
  return diff * 0.11 * qScale;
}

/** Ruck + midfield contested strength for stoppage chains. */
function stoppageStrength(lineup) {
  if (!lineup?.length) return 50;
  const rucks = lineup.filter((p) => playerHasPosition(p, 'RU') || playerHasPosition(p, 'R'));
  const mids = lineup.filter((p) => isMidPreferred(p));
  const ruckAvg = rucks.length
    ? rucks.reduce((a, p) => a + (p.attrs?.strength ?? 60) + (p.attrs?.marking ?? 60), 0) / rucks.length
    : 50;
  const midAvg = mids.length
    ? mids.reduce((a, p) => a + (p.attrs?.decision ?? 60) + (p.attrs?.endurance ?? 60), 0) / mids.length
    : 50;
  return ruckAvg * 0.45 + midAvg * 0.55;
}

/**
 * Stoppage win margin for one quarter (-1..1, positive favours home side of diff).
 * @returns {{ margin: number, homeClearances: number, awayClearances: number }}
 */
export function resolveStoppageQuarter(playerLineup, oppLineup, tactic, oppTactic, isPlayerHome) {
  const pressMod = tactic === 'press' ? 0.08 : tactic === 'flood' ? -0.04 : 0;
  const oppPressMod = oppTactic === 'press' ? 0.08 : oppTactic === 'flood' ? -0.04 : 0;
  const playerStop = stoppageStrength(playerLineup) * (1 + pressMod);
  const oppStop = stoppageStrength(oppLineup) * (1 + oppPressMod);
  const homeStop = isPlayerHome ? playerStop : oppStop;
  const awayStop = isPlayerHome ? oppStop : playerStop;
  const total = Math.max(1, homeStop + awayStop);
  const homeShare = homeStop / total;
  const chains = 3 + rand(0, 3);
  const homeClearances = Math.round(chains * homeShare);
  const awayClearances = chains - homeClearances;
  const margin = clamp((homeClearances - awayClearances) / Math.max(1, chains), -1, 1);
  return { margin, homeClearances, awayClearances };
}

/** Interchange rotation — Q2/Q4 boost when bench is strong. */
export function interchangeRotationBonus(squad, lineupIds, quarterNum) {
  if (quarterNum !== 2 && quarterNum !== 4) return 0;
  return benchStrengthBonus(squad, lineupIds, 4) * 0.85;
}

const KEY_MOMENT_KINDS = [
  { id: 'specky',  text: 'Speccie of the year! Hanger over the pack.', weight: 4, posKey: ['KF', 'HF', 'KB', 'HB'], scoreImpact: 0, momentumImpact: 0.25, voteImpact: 1 },
  { id: 'fifty',   text: '50m penalty paid downfield.',                weight: 3, posKey: null,                  scoreImpact: 0, momentumImpact: 0.15, voteImpact: 0 },
  { id: 'comeback',text: 'Massive comeback brewing.',                 weight: 2, posKey: null,                   scoreImpact: 0, momentumImpact: 0.30, voteImpact: 0 },
  { id: 'shank',   text: 'Shanked a set shot from 30m out.',           weight: 3, posKey: null,                   scoreImpact: 0, momentumImpact: -0.15, voteImpact: 0 },
  { id: 'hammy',   text: 'Pulled up sore — looks like a hamstring.',   weight: 2, posKey: null,                   scoreImpact: 0, momentumImpact: -0.10, voteImpact: 0, injuryRisk: true },
  { id: 'report',  text: 'Reported for a high bump. Tribunal looms.',  weight: 1, posKey: null,                   scoreImpact: 0, momentumImpact: -0.10, voteImpact: 0, suspensionRisk: true },
  { id: 'goalrun', text: 'Run-down tackle saves a certain goal.',      weight: 3, posKey: null,                   scoreImpact: 0, momentumImpact: 0.20, voteImpact: 1 },
];

function pickMoment() {
  const total = KEY_MOMENT_KINDS.reduce((a, k) => a + k.weight, 0);
  let r = rng() * total;
  for (const k of KEY_MOMENT_KINDS) {
    r -= k.weight;
    if (r <= 0) return k;
  }
  return KEY_MOMENT_KINDS[0];
}

// Convert a rating differential into base shot rates per quarter (Poisson-ish)
// expected ~10-16 total shots per quarter at AFL level
function shotRates(diff) {
  const baseTotal = 16; // total per quarter (both teams) — calibrated to AFL average ~90 pts/team/game
  const split = clamp(0.5 + diff * 0.012, 0.20, 0.80);
  return {
    home: baseTotal * split,
    away: baseTotal * (1 - split),
  };
}

function poisson(mean) {
  const L = Math.exp(-Math.max(0.001, mean));
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L && k < 30);
  return k - 1;
}

/** Weighted random pick — consumes one rng() like pick(). */
function weightedPickBy(pool, weightFn) {
  if (!pool || pool.length === 0) return null;
  let total = 0;
  const weights = new Array(pool.length);
  for (let i = 0; i < pool.length; i++) {
    const w = Math.max(0.01, weightFn(pool[i]));
    weights[i] = w;
    total += w;
  }
  let r = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// Finishing quality — stars convert more chains than role players.
// Cubic on the quality ratio: an 85-rated finisher is ~2.2x as likely as a 65.
function goalFinishWeight(p) {
  const rating = p.trueRating ?? p.overall ?? 60;
  const kicking = p.attrs?.kicking ?? rating;
  const marking = p.attrs?.marking ?? rating;
  const quality = rating * 0.6 + kicking * 0.25 + marking * 0.15;
  return Math.pow(quality / 60, 3);
}

// Pick a goal-likely position for "scorer" attribution: weight forwards heavier
// (primary or secondary), then weight within the pool by finishing quality.
function pickScorerId(playerLineup) {
  if (!playerLineup || playerLineup.length === 0) return null;
  const fwd = playerLineup.filter(p => p && isForwardPreferred(p));
  const mid = playerLineup.filter(p => p && isMidPreferred(p));
  const all = playerLineup.filter(Boolean);
  const r = rng();
  let pool;
  if (r < 0.55 && fwd.length) pool = fwd;
  else if (r < 0.85 && mid.length) pool = mid;
  else pool = all;
  if (!pool.length) return null;
  return weightedPickBy(pool, goalFinishWeight)?.id ?? null;
}

/**
 * Defensive pressure on the attacking side's shot accuracy: a strong back six
 * against a weak forward line forces worse shots. Centred at 1.0 for even
 * matchups; defensive/flood gameplans lean into it harder.
 * @returns multiplier on attacking accuracy, ~[0.88, 1.10]
 */
export function defensivePressureMod(defLineup, attLineup, defTactic = 'balanced') {
  const backs = (defLineup || []).filter((p) => p && isBackPreferred(p));
  const fwds = (attLineup || []).filter((p) => p && isForwardPreferred(p));
  if (!backs.length || !fwds.length) return 1;
  const defQuality = (p) =>
    (p.trueRating ?? p.overall ?? 60) * 0.5 + (p.attrs?.marking ?? 60) * 0.25 + (p.attrs?.tackling ?? 60) * 0.25;
  const attQuality = (p) =>
    (p.trueRating ?? p.overall ?? 60) * 0.6 + (p.attrs?.kicking ?? 60) * 0.2 + (p.attrs?.marking ?? 60) * 0.2;
  const backAvg = backs.reduce((a, p) => a + defQuality(p), 0) / backs.length;
  const fwdAvg = fwds.reduce((a, p) => a + attQuality(p), 0) / fwds.length;
  const lean = defTactic === 'defensive' ? 1.5 : defTactic === 'flood' ? 1.3 : 1;
  return clamp(1 - (backAvg - fwdAvg) * 0.003 * lean, 0.90, 1.10);
}

/**
 * Weather punishes attacking gameplans more than containing ones — wet or wild
 * conditions reward the side set up to absorb pressure.
 * @returns multiplier on this side's shot accuracy
 */
export function weatherAccuracyMod(weather, tactic = 'balanced') {
  if (!weather) return 1;
  const w = String(weather).toLowerCase();
  const wet = w === 'rainy' || w === 'rain' || w === 'wet' || w === 'stormy';
  const windy = w === 'windy' || w === 'wind';
  if (!wet && !windy) return 1;
  const base = wet ? 0.92 : 0.96;
  const tacticLean =
    { attack: 0.95, run: 0.95, press: 0.98, balanced: 1.0, defensive: 1.04, flood: 1.04 }[tactic] ?? 1.0;
  return clamp(base * tacticLean, 0.8, 1.05);
}

// =============================================================================
// simMatch — legacy API kept for AI-vs-AI macro sim
// =============================================================================
export function simMatch(home, away, isPlayerHome, playerStrength, homeFixtureAdvantage = 4) {
  const hAdv = homeFixtureAdvantage;
  const hStr = isPlayerHome ? playerStrength + hAdv : home.rating + hAdv;
  const aStr = !isPlayerHome ? playerStrength : away.rating;
  const diff = hStr - aStr;
  const expHome = clamp(80 + diff * 1.6, 30, 160);
  const expAway = clamp(80 - diff * 1.6, 30, 160);
  const hScore = Math.max(20, Math.round(randNorm(expHome, 18)));
  const aScore = Math.max(20, Math.round(randNorm(expAway, 18)));
  const hGoals = Math.floor(hScore / 6);
  const hBeh   = hScore - hGoals * 6;
  const aGoals = Math.floor(aScore / 6);
  const aBeh   = aScore - aGoals * 6;
  const homeTotal = hGoals * 6 + hBeh;
  const awayTotal = aGoals * 6 + aBeh;
  return {
    homeGoals: hGoals, homeBehinds: hBeh, homeTotal,
    awayGoals: aGoals, awayBehinds: aBeh, awayTotal,
    winner: homeTotal === awayTotal ? "draw" : homeTotal > awayTotal ? "home" : "away",
  };
}

// =============================================================================
// Steppable match sim — initMatchSim / simMatchQuarter / finishMatchSim.
// State is plain serializable data so a half-time pause can persist to the
// save file (coaching calls re-enter via simMatchQuarter with strength mods).
// simMatchEvents below wraps these for the classic one-shot API.
// =============================================================================

/**
 * Build serializable sim state. Strength-per-quarter callbacks (pure functions)
 * are evaluated up front into arrays so the state can live in localStorage.
 */
export function initMatchSim(home, away, isPlayerHome, playerStrength, opts = {}) {
  const tactic = opts.tactic || 'balanced';
  const profile = TACTIC_PROFILES[tactic] || TACTIC_PROFILES.balanced;
  const playerLineup = opts.playerLineup || []; // [{id, position, overall, ...}]
  const oppLineup    = opts.oppLineup || [];
  const oppTactic    = opts.oppTactic || 'balanced';
  const oppProfile   = TACTIC_PROFILES[oppTactic] || TACTIC_PROFILES.balanced;
  // Spec 3D: ground-condition multipliers — defaults to no effect.
  const groundScoring = clamp(opts.groundScoringMod ?? 1.0, 0.5, 1.1);
  const groundAccuracy = clamp(opts.groundAccuracyMod ?? 1.0, 0.5, 1.1);

  // Each side's shot accuracy is pressured by the opposing back six, the
  // weather/tactic pairing, and its own gameplan's risk appetite (riskMod > 1
  // means more but lower-quality shots). All default to 1.0 when absent.
  const weather = opts.weather || null;
  const playerSideAccMod =
    defensivePressureMod(oppLineup, playerLineup, oppTactic)
    * weatherAccuracyMod(weather, tactic)
    * (1 - (profile.riskMod - 1) * 0.15);
  const oppSideAccMod =
    defensivePressureMod(playerLineup, oppLineup, tactic)
    * weatherAccuracyMod(weather, oppTactic)
    * (1 - (oppProfile.riskMod - 1) * 0.15);

  const strengthArray = (fn, fallbackArr) => {
    if (Array.isArray(fallbackArr) && fallbackArr.length === 4) return fallbackArr;
    if (typeof fn === 'function') return [1, 2, 3, 4].map((qn) => fn(qn));
    return null;
  };

  return {
    cfg: {
      isPlayerHome,
      tactic,
      oppTactic,
      playerLineup,
      oppLineup,
      groundScoring,
      groundAccuracy,
      homeAccMod: isPlayerHome ? playerSideAccMod : oppSideAccMod,
      awayAccMod: isPlayerHome ? oppSideAccMod : playerSideAccMod,
      hAdv: opts.homeFixtureAdvantage ?? 4,
      homeRating: home?.rating ?? 60,
      awayRating: away?.rating ?? 60,
      playerStrength,
      playerStrengthByQuarter: strengthArray(opts.getPlayerStrengthForQuarter, opts.playerStrengthByQuarter),
      oppStrengthByQuarter: strengthArray(opts.getOppStrengthForQuarter, opts.oppStrengthByQuarter),
    },
    momentum: 0, // -1 .. +1, positive = home
    runHomePts: 0,
    runAwayPts: 0,
    quarters: [],
    events: [],   // flat timeline
    keyMoments: [],
    goalAttribution: {}, // playerId -> { goals, behinds, votesScore }
    injuredPlayerIds: [],
    reportedPlayerIds: [],
  };
}

/**
 * Simulate the next quarter in place.
 * @param {object} state from initMatchSim (mutated and returned)
 * @param {{ playerStrengthDelta?: number, oppStrengthDelta?: number }} [mods]
 *   Coaching-call strength adjustments applied to this quarter only.
 */
export function simMatchQuarter(state, mods = {}) {
  const { cfg } = state;
  const q = state.quarters.length;
  if (q >= 4) return state;
  const {
    isPlayerHome, tactic, oppTactic, playerLineup, oppLineup,
    groundScoring, groundAccuracy, homeAccMod, awayAccMod, hAdv,
  } = cfg;
  // AI reacts to the scoreboard from the second half on (protect a lead / chase).
  const oppLeadNow = isPlayerHome
    ? (state.runAwayPts ?? 0) - (state.runHomePts ?? 0)
    : (state.runHomePts ?? 0) - (state.runAwayPts ?? 0);
  const effectiveOppTactic = adaptiveOppTactic(oppTactic, oppLeadNow, q);
  const profile = TACTIC_PROFILES[tactic] || TACTIC_PROFILES.balanced;
  const oppProfile = TACTIC_PROFILES[effectiveOppTactic] || TACTIC_PROFILES.balanced;

  // Apply tactic mods to whichever side is the player
  const playerSideMod = profile.goalRateMod;
  const playerOppMod  = profile.oppRateMod;
  const oppSideMod    = oppProfile.goalRateMod;
  const oppOppMod     = oppProfile.oppRateMod;

  let momentum = state.momentum;
  if (q > 0) {
    momentum *= 0.72;
    const marginPts = state.runHomePts - state.runAwayPts;
    const marginNudge = clamp(marginPts / 48, -1, 1) * 0.14;
    momentum = clamp(momentum + marginNudge, -1, 1);
  }
  const quarterNum = q + 1;
  const playerStrNow =
    (cfg.playerStrengthByQuarter ? cfg.playerStrengthByQuarter[q] : cfg.playerStrength)
    + (mods.playerStrengthDelta ?? 0);
  const oppStrBase = cfg.oppStrengthByQuarter ? cfg.oppStrengthByQuarter[q] : null;
  const oppStrNow = oppStrBase != null ? oppStrBase + (mods.oppStrengthDelta ?? 0) : null;
  const oppFallbackDelta = mods.oppStrengthDelta ?? 0;

  let hStr;
  let aStr;
  if (isPlayerHome) {
    hStr = playerStrNow + hAdv;
    aStr = oppStrNow != null ? oppStrNow : cfg.awayRating + oppFallbackDelta;
  } else {
    hStr = (oppStrNow != null ? oppStrNow : cfg.homeRating + oppFallbackDelta) + hAdv;
    aStr = playerStrNow;
  }
  const diff = (hStr - aStr) + momentum * 9; // momentum tilts effective strength (~9 pts at full swing)
  const stop = resolveStoppageQuarter(playerLineup, oppLineup, tactic, effectiveOppTactic, isPlayerHome);
  const diffWithStop = diff + stop.margin * 6;
  const rates = shotRates(diffWithStop);

  // Apply tactic shot-rate adjustments. A side's oppRateMod scales the
  // OTHER side's shot volume: defensive/flood/press suppress the opposition,
  // attack concedes shots on the rebound. Suppression bites harder against
  // overextended gameplans (scales with the target's own goalRateMod), which
  // is what makes containment a genuine counter to all-out attack.
  const suppressScale = (oppMod, targetGoalMod) =>
    oppMod < 0 ? 0.5 + Math.max(0, targetGoalMod) * 2 : 0.5;
  const homeSideMod = isPlayerHome ? playerSideMod : oppSideMod;
  const awaySideMod = isPlayerHome ? oppSideMod : playerSideMod;
  const homeOppPressure = isPlayerHome ? oppOppMod : playerOppMod;
  const awayOppPressure = isPlayerHome ? playerOppMod : oppOppMod;
  const homeShotMean =
    rates.home * (1 + homeSideMod) * (1 + homeOppPressure * suppressScale(homeOppPressure, homeSideMod));
  const awayShotMean =
    rates.away * (1 + awaySideMod) * (1 + awayOppPressure * suppressScale(awayOppPressure, awaySideMod));

  const plQ = TACTIC_QUARTER_MULT[tactic]?.[q] ?? 1;
  const opQ = TACTIC_QUARTER_MULT[effectiveOppTactic]?.[q] ?? 1;
  const homeQuarterMult = isPlayerHome ? plQ : opQ;
  const awayQuarterMult = isPlayerHome ? opQ : plQ;
  const homeShotMeanPhased = homeShotMean * homeQuarterMult;
  const awayShotMeanPhased = awayShotMean * awayQuarterMult;

  const homeShots = poisson(Math.max(2, homeShotMeanPhased * groundScoring));
  const awayShots = poisson(Math.max(2, awayShotMeanPhased * groundScoring));

  let hG = 0, hB = 0, aG = 0, aB = 0;
  const qEvents = [];
  if (stop.homeClearances + stop.awayClearances > 0) {
    qEvents.push({
      q: quarterNum,
      minute: rand(q * 25, q * 25 + 8),
      side: stop.margin >= 0 ? 'home' : 'away',
      kind: 'stoppage',
      text: `Contested ball — ${stop.homeClearances}–${stop.awayClearances} clearances this quarter`,
    });
  }

  const goalAttribution = state.goalAttribution;

  // Resolve home shots
  for (let i = 0; i < homeShots; i++) {
    const accuracy = clamp((0.42 + diffWithStop * 0.004 + (rng() - 0.5) * 0.18) * groundAccuracy * homeAccMod, 0.10, 0.78);
    const minute = rand(q * 25, q * 25 + 24);
    const r = rng();
    if (r < accuracy) {
      hG++;
      const scorer = isPlayerHome ? pickScorerId(playerLineup) : null;
      if (scorer) {
        goalAttribution[scorer] = goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        goalAttribution[scorer].goals++;
        goalAttribution[scorer].votesScore += 8;
      }
      qEvents.push({ q: q + 1, minute, side: 'home', kind: 'goal', scorer });
      momentum = clamp(momentum + 0.05 * profile.momentumGain, -1, 1);
    } else if (r < accuracy + 0.30) {
      hB++;
      const scorer = isPlayerHome ? pickScorerId(playerLineup) : null;
      if (scorer) {
        goalAttribution[scorer] = goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        goalAttribution[scorer].behinds++;
        goalAttribution[scorer].votesScore += 1;
      }
      qEvents.push({ q: q + 1, minute, side: 'home', kind: 'behind', scorer });
    } else {
      qEvents.push({ q: q + 1, minute, side: 'home', kind: 'miss' });
    }
  }
  // Resolve away shots
  for (let i = 0; i < awayShots; i++) {
    const accuracy = clamp((0.42 - diffWithStop * 0.004 + (rng() - 0.5) * 0.18) * groundAccuracy * awayAccMod, 0.10, 0.78);
    const minute = rand(q * 25, q * 25 + 24);
    const r = rng();
    if (r < accuracy) {
      aG++;
      const scorer = !isPlayerHome ? pickScorerId(playerLineup) : null;
      if (scorer) {
        goalAttribution[scorer] = goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        goalAttribution[scorer].goals++;
        goalAttribution[scorer].votesScore += 8;
      }
      qEvents.push({ q: q + 1, minute, side: 'away', kind: 'goal', scorer });
      momentum = clamp(momentum - 0.05 * oppProfile.momentumGain, -1, 1);
    } else if (r < accuracy + 0.30) {
      aB++;
      const scorer = !isPlayerHome ? pickScorerId(playerLineup) : null;
      if (scorer) {
        goalAttribution[scorer] = goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        goalAttribution[scorer].behinds++;
        goalAttribution[scorer].votesScore += 1;
      }
      qEvents.push({ q: q + 1, minute, side: 'away', kind: 'behind', scorer });
    } else {
      qEvents.push({ q: q + 1, minute, side: 'away', kind: 'miss' });
    }
  }

  // Key moments — 0–2 per quarter
  const numMoments = rng() < 0.45 ? 1 : rng() < 0.20 ? 2 : 0;
  for (let i = 0; i < numMoments; i++) {
    const moment = pickMoment();
    const side = rng() < 0.5 ? 'home' : 'away';
    let playerId = null;
    if (side === (isPlayerHome ? 'home' : 'away') && playerLineup.length) {
      const filtered = moment.posKey
        ? playerLineup.filter(p => moment.posKey.includes(p.position) || moment.posKey.includes(p.secondaryPosition))
        : playerLineup;
      playerId = filtered.length ? pick(filtered).id : pick(playerLineup).id;
    }
    const ke = {
      q: q + 1,
      minute: rand(q * 25, q * 25 + 24),
      side,
      kind: 'moment',
      moment: moment.id,
      text: moment.text,
      playerId,
    };
    qEvents.push(ke);
    state.keyMoments.push(ke);
    if (moment.injuryRisk && playerId) state.injuredPlayerIds.push(playerId);
    if (moment.suspensionRisk && playerId) state.reportedPlayerIds.push(playerId);
    if (moment.voteImpact && playerId) {
      goalAttribution[playerId] = goalAttribution[playerId] || { goals: 0, behinds: 0, votesScore: 0 };
      goalAttribution[playerId].votesScore += 4 * moment.voteImpact;
    }
    momentum = clamp(momentum + (side === 'home' ? 1 : -1) * moment.momentumImpact, -1, 1);
  }

  // Sort within quarter by minute
  qEvents.sort((a, b) => a.minute - b.minute);
  state.events.push(...qEvents);

  const qHomeTot = hG * 6 + hB;
  const qAwayTot = aG * 6 + aB;
  state.runHomePts += qHomeTot;
  state.runAwayPts += qAwayTot;
  state.momentum = momentum;

  state.quarters.push({
    homeGoals: hG, homeBehinds: hB, homeTotal: qHomeTot,
    awayGoals: aG, awayBehinds: aB, awayTotal: qAwayTot,
    events: qEvents,
    momentumEnd: momentum,
  });
  return state;
}

/** Assemble the final result object from completed sim state (4 quarters). */
export function finishMatchSim(state) {
  const { quarters, events, keyMoments, goalAttribution, injuredPlayerIds, reportedPlayerIds } = state;
  const homeGoals = quarters.reduce((a, q) => a + q.homeGoals, 0);
  const homeBehinds = quarters.reduce((a, q) => a + q.homeBehinds, 0);
  const awayGoals = quarters.reduce((a, q) => a + q.awayGoals, 0);
  const awayBehinds = quarters.reduce((a, q) => a + q.awayBehinds, 0);
  const homeTotal = homeGoals * 6 + homeBehinds;
  const awayTotal = awayGoals * 6 + awayBehinds;

  // Brownlow votes — top three player-side contributors by votesScore
  const voteCandidates = Object.entries(goalAttribution)
    .map(([id, v]) => ({ playerId: id, score: v.votesScore }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const votes = voteCandidates.map((c, i) => ({ playerId: c.playerId, votes: 3 - i, score: c.score }));

  return {
    homeGoals, homeBehinds, homeTotal,
    awayGoals, awayBehinds, awayTotal,
    winner: homeTotal === awayTotal ? 'draw' : homeTotal > awayTotal ? 'home' : 'away',
    quarters,
    events,
    keyMoments,
    votes,
    goalAttribution,
    injuredPlayerIds,
    reportedPlayerIds,
  };
}

// =============================================================================
// simMatchEvents — quarter-by-quarter event-driven sim (one-shot wrapper over
// the steppable initMatchSim / simMatchQuarter / finishMatchSim API).
// =============================================================================
export function simMatchEvents(home, away, isPlayerHome, playerStrength, opts = {}) {
  const state = initMatchSim(home, away, isPlayerHome, playerStrength, opts);
  for (let q = 0; q < 4; q++) simMatchQuarter(state);
  return finishMatchSim(state);
}

// =============================================================================
// simMatchWithQuarters — when player lineup is supplied, defers to simMatchEvents
// for richness; otherwise falls back to the legacy macro splitter for AI-vs-AI.
// =============================================================================
function splitAcrossQuarters(total, n) {
  const parts = [];
  let rem = total;
  for (let i = 0; i < n - 1; i++) {
    const q = rem > 0 ? Math.floor(rng() * Math.ceil(rem * 0.6 + 1)) : 0;
    parts.push(q);
    rem -= q;
  }
  parts.push(Math.max(0, rem));
  return parts;
}

export function simMatchWithQuarters(home, away, isPlayerHome, playerStrength, opts = {}) {
  const homeAdv = opts.homeFixtureAdvantage ?? 4;
  if (opts && (opts.playerLineup || opts.tactic)) {
    return simMatchEvents(home, away, isPlayerHome, playerStrength, { ...opts, homeFixtureAdvantage: homeAdv });
  }
  const result = simMatch(home, away, isPlayerHome, playerStrength, homeAdv);
  const hGQ = splitAcrossQuarters(result.homeGoals, 4);
  const hBQ = splitAcrossQuarters(result.homeBehinds, 4);
  const aGQ = splitAcrossQuarters(result.awayGoals, 4);
  const aBQ = splitAcrossQuarters(result.awayBehinds, 4);
  const quarters = [0, 1, 2, 3].map(i => ({
    homeGoals: hGQ[i],   homeBehinds: hBQ[i],
    homeTotal: hGQ[i] * 6 + hBQ[i],
    awayGoals: aGQ[i],   awayBehinds: aBQ[i],
    awayTotal: aGQ[i] * 6 + aBQ[i],
    events: [],
    momentumEnd: 0,
  }));
  return { ...result, quarters, events: [], keyMoments: [], votes: [], goalAttribution: {}, injuredPlayerIds: [], reportedPlayerIds: [] };
}

export function aiClubRating(clubId, tier) {
  const c = findClub(clubId);
  if (!c) return 60;
  const tierMean = tier === 1 ? 75 : tier === 2 ? 60 : 48;
  const sum = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return tierMean + ((sum % 17) - 8);
}

/**
 * Difficulty-aware opponent strength. Difficulty previously had no effect on
 * match outcomes, so a strong squad never lost. This adds a flat bump plus a
 * gap-closing term: when you outclass the opponent, a fraction of that gap is
 * handed back to them, so a great team still wins but stops cruising to 100-pt
 * margins. The boost only ever raises the opponent (never makes games easier),
 * and is capped so weak clubs can't become superhuman.
 *
 * @param {number} oppRating  the opponent's raw rating
 * @param {number} myRating   the player's match rating
 * @param {{flat?:number, gapClose?:number, cap?:number}} opts
 * @returns {number} adjusted opponent rating
 */
export function competitiveOppRating(oppRating, myRating, { flat = 0, gapClose = 0, cap = 16 } = {}) {
  const gap = Math.max(0, myRating - oppRating);
  const delta = Math.min(cap, flat + gap * gapClose);
  return oppRating + delta;
}

// Compute a rating from a full AI squad (tier-2 fallback when no squad available)
export function aiSquadRating(squad) {
  if (!squad || squad.length === 0) return 60;
  const top = [...squad].sort((a, b) => (b.trueRating || b.overall) - (a.trueRating || a.overall)).slice(0, LINEUP_CAP);
  const avg = top.reduce((a, b) => a + (b.trueRating || b.overall), 0) / top.length;
  return avg;
}
