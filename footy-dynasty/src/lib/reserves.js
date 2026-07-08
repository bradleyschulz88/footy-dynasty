// ---------------------------------------------------------------------------
// VFL / reserves affiliate — abstract weekly resolution for players outside
// the senior 23. No second fixture is simulated; each available fringe player
// gets an ability-scaled stat line, a merit-based form move, and (for the
// kids) a development tick. Deterministic under the seeded rng.
// ponytail: the affiliate has no ladder/results of its own — that's the
// documented ceiling; extend here if reserves fixtures ever become real.
// ---------------------------------------------------------------------------
import { rand } from './rng.js';
import { clamp } from './format.js';

const isAvailable = (p) => (p?.injured ?? 0) === 0 && (p?.suspended ?? 0) === 0;

/**
 * One reserves outing for one player. Uses the seeded rng (deterministic per
 * seed) and returns a patch to merge onto the player.
 */
export function reservesGame(player, round = 0) {
  const ability = clamp((player.overall ?? 60) / 100, 0.4, 1);
  // Fringe seniors dominate reserves grades — stat lines scale with ability.
  const disposals = Math.round(rand(10, 22) * (0.6 + ability * 0.8));
  const goals = Math.max(0, Math.round(rand(0, 3) * ability) - (rand(0, 1)));
  const rating = clamp(Math.round(disposals / 4 + goals * 1.5 + rand(-1, 2)), 1, 10);
  // Merit-based form move, bounded: big days climb, quiet days drift back.
  const formDelta = clamp(rating - 5 + rand(-1, 1), -4, 6);
  const patch = {
    lastReserves: { round, disposals, goals, rating },
    form: clamp((player.form ?? 60) + formDelta, 30, 100),
  };
  // Development pathway: under-23s who perform get a bounded tick toward potential.
  const age = player.age ?? 30;
  const potential = player.potential ?? player.overall ?? 60;
  if (age <= 22 && rating >= 7 && (player.overall ?? 0) < potential && rand(1, 100) <= 30) {
    patch.overall = (player.overall ?? 60) + 1;
  }
  return patch;
}

/**
 * Run the round for every available player outside the 23.
 * @returns {{updates: Map<string, object>, standout: {id, name, disposals, goals, rating}|null}}
 */
export function playReservesRound(playersOutside23, round = 0) {
  const updates = new Map();
  let standout = null;
  for (const p of playersOutside23 || []) {
    if (!p || !isAvailable(p)) continue;
    const patch = reservesGame(p, round);
    updates.set(p.id, patch);
    const line = patch.lastReserves;
    if (line.rating >= 7 && (!standout || line.rating > standout.rating)) {
      standout = {
        id: p.id,
        name: p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Player'),
        disposals: line.disposals,
        goals: line.goals,
        rating: line.rating,
      };
    }
  }
  return { updates, standout };
}
