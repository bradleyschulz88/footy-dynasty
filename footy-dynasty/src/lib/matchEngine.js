import { rand, randNorm, rng, pick } from './rng.js';
import { findClub } from '../data/pyramid.js';
import { isForwardPreferred, isMidPreferred } from './playerGen.js';

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function teamRating(squad, lineup, training, facilitiesAvg, staffAvg) {
  const top22 = lineup && lineup.length
    ? lineup.map(id => squad.find(p => p.id === id)).filter(Boolean)
    : squad.slice().sort((a, b) => b.overall - a.overall).slice(0, 22);
  if (top22.length === 0) return 50;
  const avgOverall  = top22.reduce((a, b) => a + (b.trueRating || b.overall), 0) / top22.length;
  const avgForm     = top22.reduce((a, b) => a + b.form, 0) / top22.length;
  const avgFitness  = top22.reduce((a, b) => a + b.fitness, 0) / top22.length;
  const trainingBoost = (training.intensity - 50) * 0.04;
  return avgOverall
    + (avgForm - 70) * 0.15
    + (avgFitness - 90) * 0.1
    + trainingBoost
    + (facilitiesAvg - 1) * 1.2
    + (staffAvg - 60) * 0.15;
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
export function simMatch(home, away, isPlayerHome, playerStrength) {
  const hAdv = 4;
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

  const hAdv = 4;
  const hStr = isPlayerHome ? playerStrength + hAdv : home.rating + hAdv;
  const aStr = !isPlayerHome ? playerStrength : away.rating;

  // Apply tactic mods to whichever side is the player
  const playerSideMod = profile.goalRateMod;
  const playerOppMod  = profile.oppRateMod;
  const oppSideMod    = oppProfile.goalRateMod;
  const oppOppMod     = oppProfile.oppRateMod;

  let momentum = 0; // -1 .. +1, positive = home
  const quarters = [];
  const events = [];   // flat timeline
  const keyMoments = [];
  const goalAttribution = {}; // playerId -> { goals, behinds, votesScore }
  const injuredPlayerIds = [];
  const reportedPlayerIds = [];

  for (let q = 0; q < 4; q++) {
    const diff = (hStr - aStr) + momentum * 8; // momentum tilts up to ~8 rating
    const rates = shotRates(diff);

    // Apply tactic shot-rate adjustments
    const homeShotMean = isPlayerHome
      ? rates.home * (1 + playerSideMod) * (1 - oppOppMod * 0.5)
      : rates.home * (1 + oppSideMod) * (1 - playerOppMod * 0.5);
    const awayShotMean = !isPlayerHome
      ? rates.away * (1 + playerSideMod) * (1 - oppOppMod * 0.5)
      : rates.away * (1 + oppSideMod) * (1 - playerOppMod * 0.5);

    const homeShots = poisson(Math.max(2, homeShotMean * groundScoring));
    const awayShots = poisson(Math.max(2, awayShotMean * groundScoring));

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

    quarters.push({
      homeGoals: hG, homeBehinds: hB, homeTotal: hG * 6 + hB,
      awayGoals: aG, awayBehinds: aB, awayTotal: aG * 6 + aB,
      events: qEvents,
      momentumEnd: momentum,
    });

    // Decay momentum slightly between quarters
    momentum *= 0.55;
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
    const q = rem > 0 ? Math.floor(Math.random() * Math.ceil(rem * 0.6 + 1)) : 0;
    parts.push(q);
    rem -= q;
  }
  parts.push(Math.max(0, rem));
  return parts;
}

export function simMatchWithQuarters(home, away, isPlayerHome, playerStrength, opts = {}) {
  if (opts && (opts.playerLineup || opts.tactic)) {
    return simMatchEvents(home, away, isPlayerHome, playerStrength, opts);
  }
  const result = simMatch(home, away, isPlayerHome, playerStrength);
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
  const top22 = [...squad].sort((a, b) => (b.trueRating || b.overall) - (a.trueRating || a.overall)).slice(0, 22);
  const avg = top22.reduce((a, b) => a + (b.trueRating || b.overall), 0) / top22.length;
  return avg;
}
