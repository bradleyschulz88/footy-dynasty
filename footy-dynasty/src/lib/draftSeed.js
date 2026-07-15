/** National draft pool + pick order seeding (inaugural lottery or reverse ladder). */
import { seedRng, rand } from './rng.js';
import { generatePlayer } from './playerGen.js';
import { withDraftScoutingDefaults, stampScoutingUncertainty, getScoutRating } from './draftScouting.js';
import { sortedLadder, competitionClubsForCareer } from './leagueEngine.js';
import { PYRAMID } from '../data/pyramid.js';

const ACADEMY_CLUBS = () => (PYRAMID.TalentLeague?.clubs || []).map(c => c.id);

export const DRAFT_POOL_SIZE = 60;
export const DRAFT_ROUNDS = 3;

/** Prospects at the very top of the class generate AFL-ready. */
export const ELITE_PROSPECT_COUNT = 8;

/** The national draft is an AFL institution — only tier 1 careers take part. */
export function careerHasNationalDraft(c, league) {
  const tier = PYRAMID[c?.leagueKey]?.tier ?? league?.tier;
  return tier === 1;
}

/**
 * Shape a generated player into a draft prospect: every prospect is 18 years old,
 * and quality follows the pool index — the top of the class is AFL-ready, the
 * tail is project players. `i` is the pool slot (0 = projected #1 pick).
 */
function shapeDraftProspect(p, i) {
  const target = i < ELITE_PROSPECT_COUNT
    ? rand(74, 84)               // AFL-ready: walks into a senior side
    : i < 30
      ? rand(62, 74)             // solid draftable talent
      : rand(50, 64);            // developmental projects
  const scale = target / Math.max(1, p.overall);
  const attrs = {};
  Object.entries(p.attrs || {}).forEach(([k, v]) => {
    attrs[k] = Math.max(30, Math.min(99, Math.round(v * scale)));
  });
  const attrValues = Object.values(attrs);
  const overall = attrValues.length > 0
    ? Math.round(attrValues.reduce((a, b) => a + b, 0) / attrValues.length)
    : target;
  const potential = Math.min(99, overall + (i < ELITE_PROSPECT_COUNT ? rand(8, 15) : rand(6, 20)));
  return {
    ...p,
    attrs,
    overall,
    potential,
    trueRating: overall,
    potentialTrue: potential,
    age: 18,
    rookie: true,
    contract: 2,
    value: Math.round(overall * overall * 70 * (0.8 + (rand(0, 50) / 100))),
  };
}


/**
 * AFL national draft order: worst-to-best (reverse ladder) in the SAME order
 * every round — unlike an NBA-style snake, the AFL does not reverse even rounds.
 * Optional bonusPicks are inserted at the top.
 */
export function buildDraftOrder(round1ClubIds, rounds = DRAFT_ROUNDS, bonusPicks = []) {
  if (!round1ClubIds?.length) return [];
  const order = [];
  let pickNum = 1;
  for (const clubId of bonusPicks) {
    order.push({ pick: pickNum, clubId, round: 0, bonus: true, used: false });
    pickNum += 1;
  }
  for (let r = 1; r <= rounds; r++) {
    for (const clubId of round1ClubIds) {
      order.push({ pick: pickNum, clubId, round: r, used: false });
      pickNum += 1;
    }
  }
  return order;
}

/** Worst ladder finisher → pick 1 (AFL reverse order). */
export function buildReverseLadderOrder(ladderRows) {
  if (!ladderRows?.length) return [];
  return sortedLadder(ladderRows).slice().reverse().map((r) => r.id);
}

/** Local seeded shuffle that does NOT touch the global RNG state. */
function shuffleWithSeed(arr, seed) {
  let s = seed;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministic lottery for inaugural draft before any ladder exists. */
export function buildInauguralDraftOrder(clubIds, seedKey) {
  if (!clubIds?.length) return [];
  return shuffleWithSeed(clubIds, Number(seedKey) * 7919 + 13);
}

function inauguralSeedKey(c) {
  const season = Number(c.season) || 2026;
  const lk = String(c.leagueKey || '');
  const hash = lk.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return season + hash;
}

function competitionClubIds(c, league) {
  const compClubs = competitionClubsForCareer(c);
  const draftBase = compClubs.length ? compClubs : (PYRAMID[c.leagueKey]?.clubs || league?.clubs || []);
  return draftBase.map((cl) => cl.id);
}

/**
 * Populate draftPool and draftOrder on career. Idempotent if pool already exists unless force=true.
 * Tier 2/3 careers do not take part in the national draft — their draft state is cleared instead.
 * @param {object} c — career (mutated)
 * @param {object} league
 * @param {{ ladderSnapshot?: object[], inaugural?: boolean, force?: boolean, revealAll?: boolean }} [options]
 *   revealAll — fully scout every prospect (used for a player's very first draft so they can learn the system).
 */
export function seedNationalDraft(c, league, options = {}) {
  const { ladderSnapshot, inaugural = false, force = false, rounds = DRAFT_ROUNDS, revealAll = false } = options;

  if (!careerHasNationalDraft(c, league)) {
    c.draftPool = [];
    c.draftOrder = [];
    c.draftPhase = 'complete';
    return c;
  }

  if (!force && (c.draftPool?.length > 0) && (c.draftOrder?.length > 0)) return c;

  const season = c.season || 2026;
  seedRng(season * 999 + 17);
  const academyIds = ACADEMY_CLUBS();
  const rawPool = Array.from({ length: DRAFT_POOL_SIZE }, (_, i) => {
    const academyClub = academyIds.length ? academyIds[rand(0, academyIds.length - 1)] : 'draft';
    const prospect = shapeDraftProspect(
      generatePlayer(2, 9000 + i + season * 100, { clubId: academyClub, season }),
      i,
    );
    const withDefaults = withDraftScoutingDefaults(prospect);
    return revealAll ? { ...withDefaults, scoutReveal: 3 } : withDefaults;
  });
  // Stamp scout uncertainty now while rng is seeded; uses career staff to determine accuracy.
  c.draftPool = stampScoutingUncertainty(rawPool, getScoutRating(c));

  const clubIds = competitionClubIds(c, league);
  const useInaugural = inaugural || !ladderSnapshot?.length;
  const round1Ids = useInaugural
    ? buildInauguralDraftOrder(clubIds, inauguralSeedKey(c))
    : buildReverseLadderOrder(ladderSnapshot);

  // Expansion clubs (e.g. Tasmania in 2028) receive 2 bonus picks at the top of the draft
  const bonusPicks = [];
  if (c.leagueKey === 'AFL') {
    (PYRAMID.AFL?.clubs || [])
      .filter(cl => cl.joinsYear === season && clubIds.includes(cl.id))
      .forEach(cl => bonusPicks.push(cl.id, cl.id));
  }

  c.draftOrder = buildDraftOrder(round1Ids, rounds, bonusPicks);
  c.lastDraftOrderSnapshot = round1Ids;
  c.draftOrderInaugural = useInaugural;
  c.draftStartDate = `${season - 1}-11-20`;
  c.draftPhase = c.draftPhase === 'complete' ? 'complete' : 'scouting';
  c.draftBriefingAck = false;
  c.draftHistory = c.draftHistory || [];
  return c;
}

/** Pick number (1-based) for a club in the last draft order snapshot. */
export function draftPickPositionForClub(c, clubId) {
  const snap = c?.lastDraftOrderSnapshot;
  if (!snap?.length) return null;
  const idx = snap.indexOf(clubId);
  return idx >= 0 ? idx + 1 : null;
}
