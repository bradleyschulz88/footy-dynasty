// Finals bracket — seeding, round labels, pairings, calendar stubs.

import { addDays } from './calendar.js';

/** Label for a finals week based on teams still in contention. */
export function finalsRoundLabel(aliveCount, tier = 1) {
  if (aliveCount <= 2) return 'Grand Final';
  if (aliveCount <= 4) return tier === 1 ? 'Preliminary Final' : 'Semi Final';
  if (aliveCount <= 6) return 'Semi Final';
  return tier === 1 ? 'Finals Week 1' : 'Elimination Final';
}

/** Per-match label (tier-1 opening week uses QF/EF). */
export function finalsMatchLabel(aliveCount, tier, slotIndex, slotsInRound) {
  if (aliveCount <= 2) return 'Grand Final';
  if (tier === 1 && aliveCount === 8) {
    if (slotIndex < 2) return 'Qualifying Final';
    return 'Elimination Final';
  }
  return finalsRoundLabel(aliveCount, tier);
}

/**
 * Pair teams for one finals week (seed order preserved among alive).
 * @param {string[]} seedOrder finalist ids best → worst
 * @param {string[]} aliveIds still competing
 * @param {number} tier league tier
 */
export function pairFinalsRound(seedOrder, aliveIds, tier) {
  const ordered = seedOrder.filter((id) => aliveIds.includes(id));
  const n = ordered.length;
  if (n < 2) return [];

  if (tier === 1 && n === 8) {
    return [
      { home: ordered[0], away: ordered[3], label: 'Qualifying Final' },
      { home: ordered[1], away: ordered[2], label: 'Qualifying Final' },
      { home: ordered[4], away: ordered[7], label: 'Elimination Final' },
      { home: ordered[5], away: ordered[6], label: 'Elimination Final' },
    ];
  }

  const weekLabel = finalsRoundLabel(n, tier);
  const pairs = [];
  for (let i = 0; i < n / 2; i++) {
    pairs.push({
      home: ordered[i],
      away: ordered[n - 1 - i],
      label: finalsMatchLabel(n, tier, i, n / 2) || weekLabel,
    });
  }
  return pairs;
}

/** How many knockout weeks until a premier (estimate). */
export function finalsWeeksEstimate(finalistCount) {
  let alive = finalistCount;
  let weeks = 0;
  while (alive > 1) {
    weeks += 1;
    alive = Math.ceil(alive / 2);
  }
  return weeks;
}

/** Build bracket snapshot stored on career at finals start. */
export function buildFinalsBracket(finalistIds, tier) {
  return {
    seeds: [...finalistIds],
    tier,
    weeksEstimate: finalsWeeksEstimate(finalistIds.length),
    results: [],
  };
}

/** Append dated finals_week stubs to event queue (schedule visibility). */
export function appendFinalsCalendarEvents(career, finalistCount) {
  const queue = [...(career.eventQueue || [])];
  const lastEv = [...queue].reverse().find((e) => e.date);
  const baseDate = lastEv?.date || career.currentDate || `${career.season}-09-21`;
  const weeks = finalsWeeksEstimate(finalistCount);
  for (let i = 0; i < weeks; i++) {
    queue.push({
      id: `finals_${career.season}_w${i}`,
      date: addDays(baseDate, 7 * (i + 1)),
      type: 'finals_week',
      phase: 'finals',
      weekIndex: i,
      completed: false,
      result: null,
    });
  }
  return queue;
}

/** Mark the next incomplete finals_week event complete. */
export function completeNextFinalsCalendarEvent(eventQueue, weekIndex) {
  if (!Array.isArray(eventQueue)) return eventQueue;
  return eventQueue.map((ev) => {
    if (ev.type !== 'finals_week' || ev.completed) return ev;
    if (ev.weekIndex === weekIndex) return { ...ev, completed: true };
    return ev;
  });
}

/** Seed position (1-based) for a club in the bracket. */
export function finalsSeedFor(clubId, bracket) {
  const idx = (bracket?.seeds || []).indexOf(clubId);
  return idx >= 0 ? idx + 1 : null;
}

/** Next opponent id if player has a match this finals week (null if bye or eliminated). */
export function playerFinalsOpponent(career) {
  if (!career?.inFinals || !career.finalsBracket) return null;
  const alive = career.finalsAlive || [];
  if (!alive.includes(career.clubId)) return null;
  const pairs = pairFinalsRound(
    career.finalsBracket.seeds,
    alive,
    career.finalsBracket.tier ?? 1,
  );
  const mine = pairs.find((m) => m.home === career.clubId || m.away === career.clubId);
  if (!mine) return null;
  return mine.home === career.clubId ? mine.away : mine.home;
}
