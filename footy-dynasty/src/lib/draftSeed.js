/** National draft pool + pick order seeding (inaugural lottery or reverse ladder). */
import { seedRng, rand } from './rng.js';
import { generatePlayer } from './playerGen.js';
import { withDraftScoutingDefaults } from './draftScouting.js';
import { sortedLadder, competitionClubsForCareer } from './leagueEngine.js';
import { PYRAMID } from '../data/pyramid.js';

export const DRAFT_POOL_SIZE = 60;

/** Worst ladder finisher → pick 1 (AFL reverse order). */
export function buildReverseLadderOrder(ladderRows) {
  if (!ladderRows?.length) return [];
  return sortedLadder(ladderRows).slice().reverse().map((r) => r.id);
}

/** Deterministic lottery for inaugural draft before any ladder exists. */
export function buildInauguralDraftOrder(clubIds, seedKey) {
  if (!clubIds?.length) return [];
  seedRng(Number(seedKey) * 7919 + 13);
  const order = [...clubIds];
  for (let i = order.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
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
 * @param {object} c — career (mutated)
 * @param {object} league
 * @param {{ ladderSnapshot?: object[], inaugural?: boolean, force?: boolean }} [options]
 */
export function seedNationalDraft(c, league, options = {}) {
  const { ladderSnapshot, inaugural = false, force = false } = options;
  if (!force && (c.draftPool?.length > 0) && (c.draftOrder?.length > 0)) return c;

  const season = c.season || 2026;
  seedRng(season * 999 + 17);
  c.draftPool = Array.from({ length: DRAFT_POOL_SIZE }, (_, i) =>
    withDraftScoutingDefaults(
      generatePlayer(2, 9000 + i + season * 100, { clubId: 'draft', season }),
    ),
  );

  const clubIds = competitionClubIds(c, league);
  const useInaugural = inaugural || !ladderSnapshot?.length;
  const orderIds = useInaugural
    ? buildInauguralDraftOrder(clubIds, inauguralSeedKey(c))
    : buildReverseLadderOrder(ladderSnapshot);

  c.draftOrder = orderIds.map((clubId, i) => ({ pick: i + 1, clubId, used: false }));
  c.lastDraftOrderSnapshot = orderIds;
  c.draftOrderInaugural = useInaugural;
  return c;
}

/** Pick number (1-based) for a club in the last draft order snapshot. */
export function draftPickPositionForClub(c, clubId) {
  const snap = c?.lastDraftOrderSnapshot;
  if (!snap?.length) return null;
  const idx = snap.indexOf(clubId);
  return idx >= 0 ? idx + 1 : null;
}
