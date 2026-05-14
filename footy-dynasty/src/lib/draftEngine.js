/**
 * National draft runtime: seeding guards, AI sim chain, pick / skip, history.
 */
import { rand, rng } from './rng.js';
import { findClub } from '../data/pyramid.js';
import { seedNationalDraft, DRAFT_POOL_SIZE, DRAFT_ROUNDS } from './draftSeed.js';
import {
  isDraftLive,
  isPlayerDraftTurn,
  nextDraftPickIndex,
  hasUnusedClubDraftPick,
} from './recruitPhase.js';
import { rookieDraftWage, canAffordSigning, leagueTierOf } from './finance/engine.js';

export { DRAFT_ROUNDS, DRAFT_POOL_SIZE } from './draftSeed.js';
export { isDraftLive, isPlayerDraftTurn, nextDraftPickIndex, hasUnusedClubDraftPick };

/** Career needs pool + order seeded (e.g. legacy saves). */
export function needsDraftSeed(career) {
  if (!career) return false;
  const pool = career.draftPool || [];
  const order = career.draftOrder || [];
  if (pool.length < 1 || order.length < 1) return true;
  if (career.draftPhase === 'complete') return false;
  return false;
}

/** True when an active draft session should be offered. */
export function isDraftSessionActive(career) {
  if (career?.draftPhase === 'complete') return false;
  return isDraftLive(career);
}

/** Build snake draft order (round 1 order, even rounds reversed). */
export function buildSnakeDraftOrder(round1ClubIds, rounds = DRAFT_ROUNDS) {
  if (!round1ClubIds?.length) return [];
  const order = [];
  let pickNum = 1;
  for (let r = 1; r <= rounds; r++) {
    const ids = r % 2 === 0 ? [...round1ClubIds].reverse() : [...round1ClubIds];
    for (const clubId of ids) {
      order.push({ pick: pickNum, clubId, round: r, used: false });
      pickNum += 1;
    }
  }
  return order;
}

/**
 * Seed draft if missing. Returns a career patch (immutable-style) or null if no change.
 */
export function ensureDraftSeeded(career, league, options = {}) {
  if (!career || !league) return null;
  if (!needsDraftSeed(career) && !options.force) return null;
  const c = { ...career };
  const inaugural = !(career.history?.length) || career.draftOrderInaugural;
  seedNationalDraft(c, league, {
    inaugural,
    force: true,
    ladderSnapshot: options.ladderSnapshot,
    rounds: options.rounds ?? DRAFT_ROUNDS,
  });
  return {
    draftPool: c.draftPool,
    draftOrder: c.draftOrder,
    lastDraftOrderSnapshot: c.lastDraftOrderSnapshot,
    draftOrderInaugural: c.draftOrderInaugural,
    draftPhase: 'live',
    draftHistory: c.draftHistory || [],
  };
}

export function getOnClockPick(career) {
  const idx = nextDraftPickIndex(career);
  if (idx < 0) return null;
  return career.draftOrder[idx] ?? null;
}

export function getPlayerNextPick(career) {
  const clubId = career?.clubId;
  if (!clubId) return null;
  return (career.draftOrder || []).find((d) => d.clubId === clubId && !d.used) ?? null;
}

function clubShort(clubId) {
  return findClub(clubId)?.short || clubId;
}

function appendHistory(history, entry) {
  return [entry, ...(history || [])].slice(0, 40);
}

function aiPickFromPool(currentPool) {
  if (!currentPool.length) return null;
  const ranked = [...currentPool].sort((a, b) => b.overall - a.overall);
  if (rng() < 0.72) return ranked[0];
  const k = Math.min(5, ranked.length);
  return ranked[rand(0, k - 1)];
}

function markPickUsed(order, pickIndex, meta) {
  return order.map((d, i) => (i === pickIndex ? { ...d, used: true, ...meta } : d));
}

function applyAiPickAt(order, pool, aiSquads, pickIndex) {
  const pickEntry = order[pickIndex];
  if (!pickEntry || pickEntry.used) return { order, pool, aiSquads, news: null, historyEntry: null };
  const aiPick = aiPickFromPool(pool);
  if (!aiPick) {
    return {
      order: markPickUsed(order, pickIndex, { skipped: true, prospectName: 'PASS (empty pool)' }),
      pool,
      aiSquads,
      news: null,
      historyEntry: {
        pick: pickEntry.pick,
        round: pickEntry.round,
        clubId: pickEntry.clubId,
        clubShort: clubShort(pickEntry.clubId),
        skipped: true,
        prospectName: 'PASS',
      },
    };
  }
  const nextPool = pool.filter((x) => x.id !== aiPick.id);
  const nextAi = { ...aiSquads };
  nextAi[pickEntry.clubId] = nextAi[pickEntry.clubId] || [];
  nextAi[pickEntry.clubId] = [...nextAi[pickEntry.clubId], { ...aiPick, age: rand(18, 19) }];
  const nextOrder = markPickUsed(order, pickIndex, {
    prospectName: `${aiPick.firstName} ${aiPick.lastName}`,
    prospectOverall: aiPick.overall,
    prospectPos: aiPick.position,
  });
  const short = clubShort(pickEntry.clubId);
  return {
    order: nextOrder,
    pool: nextPool,
    aiSquads: nextAi,
    news: {
      week: 0,
      type: 'info',
      text: `📋 #${pickEntry.pick}: ${short} → ${aiPick.firstName} ${aiPick.lastName} (${aiPick.overall})`,
    },
    historyEntry: {
      pick: pickEntry.pick,
      round: pickEntry.round,
      clubId: pickEntry.clubId,
      clubShort: short,
      prospectName: `${aiPick.firstName} ${aiPick.lastName}`,
      overall: aiPick.overall,
      position: aiPick.position,
    },
  };
}

/**
 * Run AI picks from current clock until stopClubId is on clock or draft ends.
 * @returns {object} patch fields for updateCareer
 */
export function simAiPicksUntil(career, stopClubId) {
  let order = [...(career.draftOrder || [])];
  let pool = [...(career.draftPool || [])];
  let aiSquads = { ...(career.aiSquads || {}) };
  let history = [...(career.draftHistory || [])];
  const newsItems = [];

  while (true) {
    const idx = order.findIndex((d) => !d.used);
    if (idx === -1) break;
    if (order[idx].clubId === stopClubId) break;
    const res = applyAiPickAt(order, pool, aiSquads, idx);
    order = res.order;
    pool = res.pool;
    aiSquads = res.aiSquads;
    if (res.news) newsItems.push({ ...res.news, week: career.week });
    if (res.historyEntry) history = appendHistory(history, res.historyEntry);
  }

  const patch = {
    draftOrder: order,
    draftPool: pool,
    aiSquads,
    draftHistory: history,
    draftPhase: order.some((d) => !d.used) ? 'live' : 'complete',
  };
  if (newsItems.length) {
    patch.news = [...newsItems.slice(-8), ...(career.news || [])].slice(0, 20);
  }
  return patch;
}

/** Skip the current on-the-clock pick (player or AI when forced). */
export function skipCurrentPick(career) {
  const idx = nextDraftPickIndex(career);
  if (idx < 0) return null;
  const pickEntry = career.draftOrder[idx];
  const order = markPickUsed(career.draftOrder, idx, {
    skipped: true,
    prospectName: 'PASS',
  });
  const history = appendHistory(career.draftHistory, {
    pick: pickEntry.pick,
    round: pickEntry.round,
    clubId: pickEntry.clubId,
    clubShort: clubShort(pickEntry.clubId),
    skipped: true,
    prospectName: 'PASS',
  });
  const short = clubShort(pickEntry.clubId);
  const isMe = pickEntry.clubId === career.clubId;
  const patch = {
    draftOrder: order,
    draftHistory: history,
    draftPhase: order.some((d) => !d.used) ? 'live' : 'complete',
    news: [
      {
        week: career.week,
        type: 'info',
        text: isMe
          ? `📋 #${pickEntry.pick}: ${short} passes on the clock`
          : `📋 #${pickEntry.pick}: ${short} → PASS`,
      },
      ...(career.news || []),
    ].slice(0, 20),
  };
  if (!order.some((d) => !d.used)) patch.draftPhase = 'complete';
  return patch;
}

/** Player drafts a prospect on their turn; auto-sims AI until next player pick or end. */
export function draftProspectOnClock(career, club, prospect) {
  const idx = nextDraftPickIndex(career);
  if (idx < 0) return { error: 'no_pick' };
  const pickEntry = career.draftOrder[idx];
  if (pickEntry.clubId !== career.clubId) return { error: 'not_your_turn' };
  if (career.squad.length >= 40) return { error: 'squad_full' };

  const dTier = leagueTierOf(career);
  const rw = rookieDraftWage(prospect.overall, dTier);
  if (!canAffordSigning(career, rw)) return { error: 'cap' };

  const rookie = {
    ...prospect,
    id: `r_${Date.now()}_${rand(1e9, 2e9 - 1)}`,
    wage: rw,
    contract: 2,
    age: rand(18, 19),
    rookie: true,
  };

  let order = markPickUsed(career.draftOrder, idx, {
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    prospectOverall: prospect.overall,
    prospectPos: prospect.position,
  });
  let pool = (career.draftPool || []).filter((x) => x.id !== prospect.id);
  let aiSquads = { ...(career.aiSquads || {}) };
  let history = appendHistory(career.draftHistory, {
    pick: pickEntry.pick,
    round: pickEntry.round,
    clubId: career.clubId,
    clubShort: club?.short || clubShort(career.clubId),
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    overall: prospect.overall,
    position: prospect.position,
    isPlayer: true,
  });

  const newsItems = [{
    week: career.week,
    type: 'win',
    text: `🎯 #${pickEntry.pick}: ${club?.short || 'You'} draft ${prospect.firstName} ${prospect.lastName} (${prospect.overall} OVR)`,
  }];

  while (true) {
    const nextIdx = order.findIndex((d) => !d.used);
    if (nextIdx === -1) break;
    if (order[nextIdx].clubId === career.clubId) break;
    const res = applyAiPickAt(order, pool, aiSquads, nextIdx);
    order = res.order;
    pool = res.pool;
    aiSquads = res.aiSquads;
    if (res.news) newsItems.push({ ...res.news, week: career.week });
    if (res.historyEntry) history = appendHistory(history, res.historyEntry);
  }

  return {
    patch: {
      squad: [...career.squad, rookie],
      draftPool: pool,
      draftOrder: order,
      aiSquads,
      draftHistory: history,
      draftPhase: order.some((d) => !d.used) ? 'live' : 'complete',
      news: [...newsItems.slice(0, 6), ...(career.news || [])].slice(0, 20),
    },
  };
}

export function startDraftSessionPatch(career, league) {
  const seedPatch = ensureDraftSeeded(career, league, { force: needsDraftSeed(career) });
  const base = seedPatch || {};
  return { ...base, draftPhase: 'live' };
}
