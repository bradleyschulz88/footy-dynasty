// Finals bracket — seeding, AFL final-eight paths, calendar stubs.

import { addDays } from './calendar.js';

/** Label for a finals week based on teams still in contention. */
export function finalsRoundLabel(aliveCount, tier = 1, weekIndex = null) {
  if (aliveCount <= 2) return 'Grand Final';
  if (tier === 1 && weekIndex === 2) return 'Preliminary Final';
  if (tier === 1 && weekIndex === 1) return 'Semi Final';
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

/** AFL final-eight state for tier 1. */
export function initAflFinalsState(seeds) {
  return {
    week: 0,
    seeds: [...seeds],
    slots: {},
    eliminated: [],
  };
}

function higherSeedHome(a, b, seeds) {
  const ia = seeds.indexOf(a);
  const ib = seeds.indexOf(b);
  return ia <= ib ? { home: a, away: b } : { home: b, away: a };
}

/** Pairs for one AFL finals week (tier 1, eight teams). */
export function pairAflFinalsWeek(aflState) {
  const seeds = aflState.seeds;
  const sl = aflState.slots;
  const w = aflState.week;

  if (w === 0) {
    return [
      { home: seeds[0], away: seeds[3], label: 'Qualifying Final', slotKey: 'qf1' },
      { home: seeds[1], away: seeds[2], label: 'Qualifying Final', slotKey: 'qf2' },
      { home: seeds[4], away: seeds[7], label: 'Elimination Final', slotKey: 'ef1' },
      { home: seeds[5], away: seeds[6], label: 'Elimination Final', slotKey: 'ef2' },
    ];
  }
  if (w === 1) {
    const m1 = higherSeedHome(sl.qf1_loser, sl.ef1_winner, seeds);
    const m2 = higherSeedHome(sl.qf2_loser, sl.ef2_winner, seeds);
    return [
      { ...m1, label: 'Semi Final', slotKey: 'sf1' },
      { ...m2, label: 'Semi Final', slotKey: 'sf2' },
    ];
  }
  if (w === 2) {
    return [
      { home: sl.qf1_winner, away: sl.sf1_winner, label: 'Preliminary Final', slotKey: 'pf1' },
      { home: sl.qf2_winner, away: sl.sf2_winner, label: 'Preliminary Final', slotKey: 'pf2' },
    ];
  }
  if (w === 3) {
    const m = higherSeedHome(sl.pf1_winner, sl.pf2_winner, seeds);
    return [{ ...m, label: 'Grand Final', slotKey: 'gf' }];
  }
  return [];
}

/**
 * Record match results into AFL state; returns eliminated ids this week.
 * @param {object} aflState
 * @param {object[]} pairs with slotKey
 * @param {string[]} winners parallel to pairs
 */
export function recordAflWeekResults(aflState, pairs, winners) {
  const eliminated = [];
  const sl = { ...aflState.slots };
  const w = aflState.week;

  pairs.forEach((m, i) => {
    const win = winners[i];
    const lose = win === m.home ? m.away : m.home;
    const key = m.slotKey;
    if (!key) return;

    if (w === 0) {
      if (key === 'qf1') { sl.qf1_winner = win; sl.qf1_loser = lose; }
      if (key === 'qf2') { sl.qf2_winner = win; sl.qf2_loser = lose; }
      if (key === 'ef1') { sl.ef1_winner = win; eliminated.push(lose); }
      if (key === 'ef2') { sl.ef2_winner = win; eliminated.push(lose); }
    } else if (w === 1) {
      if (key === 'sf1') { sl.sf1_winner = win; eliminated.push(lose); }
      if (key === 'sf2') { sl.sf2_winner = win; eliminated.push(lose); }
    } else if (w === 2) {
      if (key === 'pf1') { sl.pf1_winner = win; eliminated.push(lose); }
      if (key === 'pf2') { sl.pf2_winner = win; eliminated.push(lose); }
    } else if (w === 3) {
      sl.premier = win;
      eliminated.push(lose);
    }
  });

  return {
    ...aflState,
    week: w + 1,
    slots: sl,
    eliminated: [...aflState.eliminated, ...eliminated],
  };
}

/** Teams still competing after an AFL state week. */
export function aflFinalsAlive(aflState) {
  const el = new Set(aflState.eliminated || []);
  return aflState.seeds.filter((id) => !el.has(id));
}

/**
 * Pair teams for one finals week (seed order preserved among alive).
 * @param {string[]} seedOrder finalist ids best → worst
 * @param {string[]} aliveIds still competing
 * @param {number} tier league tier
 * @param {object} [aflState] optional AFL path state
 */
export function pairFinalsRound(seedOrder, aliveIds, tier, aflState = null) {
  if (tier === 1 && seedOrder.length === 8 && aflState) {
    return pairAflFinalsWeek(aflState);
  }

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

/** How many knockout weeks until a premier. */
export function finalsWeeksEstimate(finalistCount, tier = 1) {
  if (tier === 1 && finalistCount === 8) return 4;
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
  const bracket = {
    seeds: [...finalistIds],
    tier,
    weeksEstimate: finalsWeeksEstimate(finalistIds.length, tier),
    results: [],
  };
  if (tier === 1 && finalistIds.length === 8) {
    bracket.aflState = initAflFinalsState(finalistIds);
  }
  return bracket;
}

/** Append dated finals_week stubs to event queue (schedule visibility). */
export function appendFinalsCalendarEvents(career, finalistCount, tier = 1) {
  const queue = [...(career.eventQueue || [])];
  const lastEv = [...queue].reverse().find((e) => e.date);
  const baseDate = lastEv?.date || career.currentDate || `${career.season}-09-21`;
  const weeks = finalsWeeksEstimate(finalistCount, tier);
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
  const tier = career.finalsBracket.tier ?? 1;
  const pairs = pairFinalsRound(
    career.finalsBracket.seeds,
    alive,
    tier,
    career.finalsBracket.aflState,
  );
  const mine = pairs.find((m) => m.home === career.clubId || m.away === career.clubId);
  if (!mine) return null;
  return mine.home === career.clubId ? mine.away : mine.home;
}

/** Bracket tree snapshot for history archive. */
export function finalsBracketArchiveSnapshot(bracket) {
  if (!bracket) return null;
  return {
    seeds: bracket.seeds,
    tier: bracket.tier,
    results: bracket.results || [],
    aflState: bracket.aflState
      ? { week: bracket.aflState.week, slots: { ...bracket.aflState.slots }, eliminated: [...(bracket.aflState.eliminated || [])] }
      : null,
  };
}
