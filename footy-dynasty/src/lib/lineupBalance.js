// Light positional structure for teamRating and AI list-building.
import { LINE_FWD, LINE_MID, LINE_BACK, LINE_RUCK } from './playerGen.js';

function primaryBucket(pos) {
  if (!pos) return null;
  if (LINE_RUCK.has(pos)) return 'ruck';
  if (LINE_FWD.has(pos)) return 'fwd';
  if (LINE_BACK.has(pos)) return 'back';
  if (LINE_MID.has(pos) || pos === 'UT') return 'mid';
  return 'mid';
}

/** @param {string|undefined} pos @returns {'fwd'|'mid'|'ruck'|'back'} */
export function primaryLineBucket(pos) {
  const b = primaryBucket(pos);
  return b || 'mid';
}

/** @returns {Record<string, number>} */
export function countLineBucketsFromLineup(squad, lineupIds) {
  const counts = { ruck: 0, fwd: 0, back: 0, mid: 0 };
  const ids = new Set(lineupIds || []);
  for (const p of squad || []) {
    if (!ids.has(p.id)) continue;
    const b = primaryBucket(p.position);
    if (b && counts[b] != null) counts[b] += 1;
  }
  return counts;
}

/**
 * Small additive modifier (roughly “rating points”) when the best-22 is structurally thin.
 * Targets: ≥1 ruck, ≥4 back, ≥4 forward, ≥6 midfield (incl. UT as mid).
 */
export function lineupStructureModifier(squad, lineupIds) {
  const c = countLineBucketsFromLineup(squad, lineupIds);
  let mod = 0;
  if (c.ruck < 1) mod -= 2.8;
  if (c.back < 4) mod -= (4 - c.back) * 0.65;
  if (c.fwd < 4) mod -= (4 - c.fwd) * 0.65;
  if (c.mid < 6) mod -= (6 - c.mid) * 0.4;
  const well =
    c.ruck >= 1 && c.back >= 4 && c.fwd >= 4 && c.mid >= 6;
  if (well) mod += 0.6;
  return mod;
}

/** Pick player ids: fill structural slots then by trueRating/overall. */
export function selectBalancedLineup(squad, size = 22) {
  const eligible = [...(squad || [])]
    .filter((p) => (p.injured ?? 0) === 0 && (p.fitness ?? 90) > 45)
    .sort((a, b) => (b.trueRating || b.overall || 0) - (a.trueRating || a.overall || 0));
  const pool = eligible.length >= size ? eligible : [...(squad || [])].sort(
    (a, b) => (b.trueRating || b.overall || 0) - (a.trueRating || a.overall || 0),
  );
  const pick = [];
  const used = new Set();

  const take = (pred) => {
    for (const p of pool) {
      if (used.has(p.id)) continue;
      if (pred(p)) {
        used.add(p.id);
        pick.push(p);
        return true;
      }
    }
    return false;
  };

  take((p) => primaryBucket(p.position) === 'ruck');
  for (let i = 0; i < 4; i++) take((p) => primaryBucket(p.position) === 'back');
  for (let i = 0; i < 4; i++) take((p) => primaryBucket(p.position) === 'fwd');
  for (let i = 0; i < 6; i++) take((p) => primaryBucket(p.position) === 'mid');

  for (const p of pool) {
    if (pick.length >= size) break;
    if (!used.has(p.id)) {
      used.add(p.id);
      pick.push(p);
    }
  }
  return pick.slice(0, size);
}
