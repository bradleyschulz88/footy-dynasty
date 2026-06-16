/**
 * National draft runtime: seeding guards, single-pick resolution, pick / skip, history.
 */
import { rand, rng } from './rng.js';
import { aiPersonalityForClub, hashClubId } from './aiPersonality.js';
import { findClub } from '../data/pyramid.js';
import { seedNationalDraft, DRAFT_ROUNDS } from './draftSeed.js';
import {
  isDraftLive,
  isPlayerDraftTurn,
  nextDraftPickIndex,
  isDraftScoutingPhase,
} from './recruitPhase.js';
import { rookieDraftWage, canAffordSigning, leagueTierOf } from './finance/engine.js';
import { isForwardPreferred } from './playerGen.js';
import { canAddToList } from './listRules.js';

export { DRAFT_ROUNDS, DRAFT_POOL_SIZE } from './draftSeed.js';
export {
  isDraftLive,
  isDraftScoutingPhase,
  isPlayerDraftTurn,
  nextDraftPickIndex,
  hasUnusedClubDraftPick,
  nationalDraftDayDate,
} from './recruitPhase.js';

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
  return isDraftLive(career) || isDraftScoutingPhase(career);
}

function phaseAfterPicks(order) {
  return order.some((d) => !d.used) ? 'live' : 'complete';
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
    draftStartDate: c.draftStartDate,
    draftPhase: c.draftPhase,
    draftHistory: c.draftHistory || [],
  };
}

/** Transition from scouting window to live draft night (National Draft Day). */
export function beginLiveDraftPatch(career) {
  return {
    draftPhase: 'live',
    draftHistory: career?.draftHistory || [],
  };
}

export function getOnClockPick(career) {
  if (!isDraftLive(career)) return null;
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

// AI REALISM: Expanded position-need detection with per-line thresholds.
// Each AFL line needs a minimum quota from a 32-man squad; being thin at a
// line gives a proportionally larger boost to prospects who fill that gap.
function squadPositionNeeds(squad) {
  const counts = {};
  for (const p of squad || []) {
    const pos = p.position || 'C';
    counts[pos] = (counts[pos] || 0) + 1;
  }
  // Returns { position: boostAmount } for every under-stocked line.
  const needs = {};
  // Ruck — only one specialist needed but a backup is ideal.
  const ruckCount = counts.RU || 0;
  if (ruckCount < 1) needs.RU = 10;     // desperate — no ruck at all
  else if (ruckCount < 2) needs.RU = 4; // thin backup

  // Key forward / half forward — want at least 5 combined.
  const fwdCount = (counts.KF || 0) + (counts.HF || 0);
  if (fwdCount < 3) { needs.KF = 8; needs.HF = 6; }
  else if (fwdCount < 5) { needs.KF = 4; needs.HF = 3; }

  // Key back / half back — want at least 4 combined.
  const defCount = (counts.KB || 0) + (counts.HB || 0);
  if (defCount < 3) { needs.KB = 8; needs.HB = 6; }
  else if (defCount < 4) { needs.KB = 4; needs.HB = 3; }

  // Centre / Wing / Rover — midfield engine, need depth.
  const midCount = (counts.C || 0) + (counts.WG || 0) + (counts.R || 0);
  if (midCount < 4) { needs.C = 7; needs.WG = 5; needs.R = 5; }
  else if (midCount < 6) { needs.C = 3; needs.WG = 2; needs.R = 2; }

  return needs;
}

// AI REALISM: Classify squad mode (rebuild / develop / compete) to guide
// which prospects get priority — young clubs draft high-potential youth;
// contenders chase ready-now talent.
function squadMode(squad) {
  if (!squad || squad.length === 0) return 'develop';
  const avgAge = squad.reduce((s, p) => s + (p.age ?? 24), 0) / squad.length;
  const avgRating = squad.reduce((s, p) => s + (p.trueRating || p.overall || 70), 0) / squad.length;
  if (avgAge >= 28 || avgRating >= 78) return 'compete';
  if (avgAge <= 23 || avgRating <= 64) return 'rebuild';
  return 'develop';
}

function aiPickFromPool(currentPool, clubId, aiSquad) {
  if (!currentPool.length) return null;
  const needs = squadPositionNeeds(aiSquad);
  const mode = squadMode(aiSquad);
  const { preferredTactic } = aiPersonalityForClub(clubId);
  const h = hashClubId(clubId);
  const ranked = [...currentPool].sort((a, b) => {
    let sa = a.overall;
    let sb = b.overall;

    // AI REALISM: Apply positional need boosts (variable size based on urgency).
    sa += needs[a.position] ?? 0;
    sb += needs[b.position] ?? 0;

    // AI REALISM: In rebuild mode, bias toward high-potential youngsters;
    // in compete mode, prefer ready-now (high overall) players.
    if (mode === 'rebuild') {
      const potA = a.potential ?? a.overall;
      const potB = b.potential ?? b.overall;
      sa += Math.max(0, potA - a.overall) * 0.4;
      sb += Math.max(0, potB - b.overall) * 0.4;
    } else if (mode === 'compete') {
      // Compete teams value immediate-use rating slightly higher.
      sa += (a.age ?? 18) >= 22 ? 2 : 0;
      sb += (b.age ?? 18) >= 22 ? 2 : 0;
    }

    // Tactic-personality tilt (unchanged).
    if (preferredTactic === 'attack' && isForwardPreferred(a)) sa += 2;
    if (preferredTactic === 'attack' && isForwardPreferred(b)) sb += 2;
    if (preferredTactic === 'defensive' && (a.position === 'KB' || a.position === 'HB')) sa += 2;
    if (preferredTactic === 'defensive' && (b.position === 'KB' || b.position === 'HB')) sb += 2;
    return sb - sa;
  });
  if (rng() < 0.68 + (h % 5) * 0.02) return ranked[0];
  const k = Math.min(5, ranked.length);
  return ranked[rand(0, k - 1)];
}

function markPickUsed(order, pickIndex, meta) {
  return order.map((d, i) => (i === pickIndex ? { ...d, used: true, ...meta } : d));
}

function applyAiPickAt(order, pool, aiSquads, pickIndex) {
  const pickEntry = order[pickIndex];
  if (!pickEntry || pickEntry.used) return { order, pool, aiSquads, news: null, historyEntry: null };
  const aiPick = aiPickFromPool(pool, pickEntry.clubId, aiSquads?.[pickEntry.clubId]);
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
  nextAi[pickEntry.clubId] = [...nextAi[pickEntry.clubId], { ...aiPick, age: 18 }];
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
 * Resolve exactly one on-the-clock pick (AI club only — returns null if player is on the clock).
 * @returns {object|null} patch fields for updateCareer
 */
export function resolveNextPick(career) {
  if (!isDraftLive(career)) return null;
  if (isPlayerDraftTurn(career)) return null;
  const idx = nextDraftPickIndex(career);
  if (idx < 0) return null;

  const res = applyAiPickAt(
    career.draftOrder,
    career.draftPool || [],
    career.aiSquads || {},
    idx,
  );
  const history = res.historyEntry
    ? appendHistory(career.draftHistory, res.historyEntry)
    : career.draftHistory || [];

  const patch = {
    draftOrder: res.order,
    draftPool: res.pool,
    aiSquads: res.aiSquads,
    draftHistory: history,
    draftPhase: phaseAfterPicks(res.order),
  };
  if (res.news) {
    patch.news = [{ ...res.news, week: career.week }, ...(career.news || [])].slice(0, 20);
  }
  return patch;
}

/** Skip the current on-the-clock pick (live draft only). */
export function skipCurrentPick(career) {
  if (!isDraftLive(career)) return null;
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
  return {
    draftOrder: order,
    draftHistory: history,
    draftPhase: phaseAfterPicks(order),
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
}

/** Player drafts a prospect on their turn — one pick only, no AI chain. */
export function draftProspectOnClock(career, club, prospect) {
  if (!isDraftLive(career)) return { error: 'not_live' };
  const idx = nextDraftPickIndex(career);
  if (idx < 0) return { error: 'no_pick' };
  const pickEntry = career.draftOrder[idx];
  if (pickEntry.clubId !== career.clubId) return { error: 'not_your_turn' };
  const listCheck = canAddToList(career, { rookie: true });
  if (!listCheck.ok) return { error: listCheck.reason || 'squad_full' };

  const dTier = leagueTierOf(career);
  const rw = rookieDraftWage(prospect.overall, dTier);
  if (!canAffordSigning(career, rw)) return { error: 'cap' };

  const rookie = {
    ...prospect,
    id: `r_${Date.now()}_${rand(1e9, 2e9 - 1)}`,
    wage: rw,
    contract: 2,
    age: 18,
    rookie: true,
  };

  const order = markPickUsed(career.draftOrder, idx, {
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    prospectOverall: prospect.overall,
    prospectPos: prospect.position,
  });
  const pool = (career.draftPool || []).filter((x) => x.id !== prospect.id);
  const history = appendHistory(career.draftHistory, {
    pick: pickEntry.pick,
    round: pickEntry.round,
    clubId: career.clubId,
    clubShort: club?.short || clubShort(career.clubId),
    prospectName: `${prospect.firstName} ${prospect.lastName}`,
    overall: prospect.overall,
    position: prospect.position,
    isPlayer: true,
  });

  return {
    patch: {
      squad: [...career.squad, rookie],
      draftPool: pool,
      draftOrder: order,
      draftHistory: history,
      draftPhase: phaseAfterPicks(order),
      news: [
        {
          week: career.week,
          type: 'win',
          text: `🎯 #${pickEntry.pick}: ${club?.short || 'You'} draft ${prospect.firstName} ${prospect.lastName} (${prospect.overall} OVR)`,
        },
        ...(career.news || []),
      ].slice(0, 20),
    },
  };
}

/** Ensure pool exists for scouting — does not start live picks. */
export function startDraftSessionPatch(career, league) {
  return ensureDraftSeeded(career, league, { force: needsDraftSeed(career) }) || {};
}
