import { rand, randNorm, rng, pick } from './rng.js';
import { findClub } from '../data/pyramid.js';
import { isForwardPreferred, isMidPreferred } from './playerGen.js';
import { lineupStructureModifier } from './lineupBalance.js';
import { LINEUP_CAP, LINEUP_FIELD_COUNT } from './lineupHelpers.js';

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

/** Effective playing rating for one player (form, fitness, optional quarter fatigue). */
export function playerEffectiveMatchRating(player, quarter = null) {
  if (!player) return 0;
  const base = player.trueRating || player.overall || 0;
  const form = player.form ?? 70;
  const fitness = player.fitness ?? 90;
  // Calibrated to be gentle at league-average form/fitness so teamRating stays comparable to the old formula.
  const formMult = clamp(1 + (form - 70) * 0.0035, 0.92, 1.1);
  const fitnessMult = clamp(0.88 + (fitness - 70) * 0.004, 0.78, 1.06);
  let fatigue = 1;
  if (quarter != null && Number.isFinite(quarter) && quarter >= 3) {
    const q = Math.min(4, Math.max(1, quarter));
    const u = q - 2; // Q3 -> 1, Q4 -> 2
    fatigue = 1 - u * (1 - fitnessMult) * 0.35;
    fatigue = clamp(fatigue, 0.72, 1);
  }
  return base * formMult * fitnessMult * fatigue;
}

/**
 * @param {number|null|undefined} quarter  AFL quarter 1–4; if set, applies in-game fatigue in Q3–Q4 (fitness-dependent).
 */
export function teamRating(squad, lineup, training, facilitiesAvg, staffAvg, quarter = null) {
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
    + lineupStructureModifier(squad, lineupIdsForStructure);
}

// Tactic adjustments (defense, balance, attack)
// Returns a tuple of { goalRateMod, momentumGain, riskMod }
const TACTIC_PROFILES = {
  defensive:  { goalRateMod: -0.10, oppRateMod: -0.18, momentumGain: 0.6, riskMod: 0.7 },
  balanced:   { goalRateMod:  0.00, oppRateMod:  0.00, momentumGain: 1.0, riskMod: 1.0 },
  attack:     { goalRateMod:  0.18, oppRateMod:  0.10, momentumGain: 1.3, riskMod: 1.2 },
  flood:      { goalRateMod: -0.08, oppRateMod: -0.10, momentumGain: 0.7, riskMod: 0.8 },
  press:      { goalRateMod:  0.05, oppRateMod: -0.08, momentumGain: 1.1, riskMod: 1.1 },
  run:        { goalRateMod:  0.12, oppRateMod:  0.05, momentumGain: 1.2, riskMod: 1.15 },
};

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
  const baseTotal = 14; // total per quarter (both teams)
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

// Pick a goal-likely position for "scorer" attribution: weight forwards heavier (primary or secondary).
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
  return pick(pool).id;
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
  const hGoals = Math.floor(hScore / 6) + (hScore % 6 > 3 ? 1 : 0);
  const hBeh   = Math.max(0, Math.round((hScore - hGoals * 6) / 1) + rand(2, 9));
  const aGoals = Math.floor(aScore / 6) + (aScore % 6 > 3 ? 1 : 0);
  const aBeh   = Math.max(0, Math.round((aScore - aGoals * 6) / 1) + rand(2, 9));
  const homeTotal = hGoals * 6 + hBeh;
  const awayTotal = aGoals * 6 + aBeh;
  return {
    homeGoals: hGoals, homeBehinds: hBeh, homeTotal,
    awayGoals: aGoals, awayBehinds: aBeh, awayTotal,
    winner: homeTotal === awayTotal ? "draw" : homeTotal > awayTotal ? "home" : "away",
  };
}

// =============================================================================
// simMatchEvents — quarter-by-quarter event-driven sim
// Returns the same shape as simMatchWithQuarters PLUS:
//   events: per-quarter event objects with timeline-ready data
//   votes:  Brownlow-style 3/2/1 votes for player team only (when supplied)
//   keyMoments: array of human-readable highlights
//   playerLineupSquad: optional array (passed in) used to attribute goals
// =============================================================================
export function simMatchEvents(home, away, isPlayerHome, playerStrength, opts = {}) {
  const tactic = opts.tactic || 'balanced';
  const profile = TACTIC_PROFILES[tactic] || TACTIC_PROFILES.balanced;
  const playerLineup = opts.playerLineup || []; // [{id, position, overall, ...}]
  const oppLineup    = opts.oppLineup || [];
  const oppTactic    = opts.oppTactic || 'balanced';
  const oppProfile   = TACTIC_PROFILES[oppTactic] || TACTIC_PROFILES.balanced;
  // Spec 3D: ground-condition multipliers — defaults to no effect.
  const groundScoring = clamp(opts.groundScoringMod ?? 1.0, 0.5, 1.1);
  const groundAccuracy = clamp(opts.groundAccuracyMod ?? 1.0, 0.5, 1.1);

  const hAdv = opts.homeFixtureAdvantage ?? 4;

  // Apply tactic mods to whichever side is the player
  const playerSideMod = profile.goalRateMod;
  const playerOppMod  = profile.oppRateMod;
  const oppSideMod    = oppProfile.goalRateMod;
  const oppOppMod     = oppProfile.oppRateMod;

  let momentum = 0; // -1 .. +1, positive = home
  let runHomePts = 0;
  let runAwayPts = 0;
  const quarters = [];
  const events = [];   // flat timeline
  const keyMoments = [];
  const goalAttribution = {}; // playerId -> { goals, behinds, votesScore }
  const injuredPlayerIds = [];
  const reportedPlayerIds = [];

  for (let q = 0; q < 4; q++) {
    if (q > 0) {
      momentum *= 0.72;
      const marginPts = runHomePts - runAwayPts;
      const marginNudge = clamp(marginPts / 48, -1, 1) * 0.14;
      momentum = clamp(momentum + marginNudge, -1, 1);
    }
    const quarterNum = q + 1;
    const playerStrNow = typeof opts.getPlayerStrengthForQuarter === 'function'
      ? opts.getPlayerStrengthForQuarter(quarterNum)
      : playerStrength;
    const oppStrNow = typeof opts.getOppStrengthForQuarter === 'function'
      ? opts.getOppStrengthForQuarter(quarterNum)
      : null;

    let hStr;
    let aStr;
    if (isPlayerHome) {
      hStr = playerStrNow + hAdv;
      aStr = oppStrNow != null ? oppStrNow : away.rating;
    } else {
      hStr = (oppStrNow != null ? oppStrNow : home.rating) + hAdv;
      aStr = playerStrNow;
    }
    const diff = (hStr - aStr) + momentum * 9; // momentum tilts effective strength (~9 pts at full swing)
    const rates = shotRates(diff);

    // Apply tactic shot-rate adjustments
    const homeShotMean = isPlayerHome
      ? rates.home * (1 + playerSideMod) * (1 - oppOppMod * 0.5)
      : rates.home * (1 + oppSideMod) * (1 - playerOppMod * 0.5);
    const awayShotMean = !isPlayerHome
      ? rates.away * (1 + playerSideMod) * (1 - oppOppMod * 0.5)
      : rates.away * (1 + oppSideMod) * (1 - playerOppMod * 0.5);

    const plQ = TACTIC_QUARTER_MULT[tactic]?.[q] ?? 1;
    const opQ = TACTIC_QUARTER_MULT[oppTactic]?.[q] ?? 1;
    const homeQuarterMult = isPlayerHome ? plQ : opQ;
    const awayQuarterMult = isPlayerHome ? opQ : plQ;
    const homeShotMeanPhased = homeShotMean * homeQuarterMult;
    const awayShotMeanPhased = awayShotMean * awayQuarterMult;

    const homeShots = poisson(Math.max(2, homeShotMeanPhased * groundScoring));
    const awayShots = poisson(Math.max(2, awayShotMeanPhased * groundScoring));

    let hG = 0, hB = 0, aG = 0, aB = 0;
    const qEvents = [];

    // Resolve home shots
    for (let i = 0; i < homeShots; i++) {
      const accuracy = clamp((0.42 + diff * 0.004 + (rng() - 0.5) * 0.18) * groundAccuracy, 0.10, 0.78);
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
      const accuracy = clamp((0.42 - diff * 0.004 + (rng() - 0.5) * 0.18) * groundAccuracy, 0.10, 0.78);
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
      keyMoments.push(ke);
      if (moment.injuryRisk && playerId) injuredPlayerIds.push(playerId);
      if (moment.suspensionRisk && playerId) reportedPlayerIds.push(playerId);
      if (moment.voteImpact && playerId) {
        goalAttribution[playerId] = goalAttribution[playerId] || { goals: 0, behinds: 0, votesScore: 0 };
        goalAttribution[playerId].votesScore += 4 * moment.voteImpact;
      }
      momentum = clamp(momentum + (side === 'home' ? 1 : -1) * moment.momentumImpact, -1, 1);
    }

    // Sort within quarter by minute
    qEvents.sort((a, b) => a.minute - b.minute);
    events.push(...qEvents);

    const qHomeTot = hG * 6 + hB;
    const qAwayTot = aG * 6 + aB;
    runHomePts += qHomeTot;
    runAwayPts += qAwayTot;

    quarters.push({
      homeGoals: hG, homeBehinds: hB, homeTotal: qHomeTot,
      awayGoals: aG, awayBehinds: aB, awayTotal: qAwayTot,
      events: qEvents,
      momentumEnd: momentum,
    });
  }

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

// Compute a rating from a full AI squad (tier-2 fallback when no squad available)
export function aiSquadRating(squad) {
  if (!squad || squad.length === 0) return 60;
  const top = [...squad].sort((a, b) => (b.trueRating || b.overall) - (a.trueRating || a.overall)).slice(0, LINEUP_CAP);
  const avg = top.reduce((a, b) => a + (b.trueRating || b.overall), 0) / top.length;
  return avg;
}
