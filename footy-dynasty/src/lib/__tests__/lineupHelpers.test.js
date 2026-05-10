import { describe, it, expect } from 'vitest';
import {
  LINEUP_CAP,
  lineupPlayersOrdered,
  removeIdFromLineup,
  addIdToLineupAt,
  moveLineupIndex,
  dedupeLineup,
} from '../lineupHelpers.js';

const squad = [
  { id: 'a', overall: 80 },
  { id: 'b', overall: 70 },
  { id: 'c', overall: 90 },
];

describe('lineupHelpers', () => {
  it('lineupPlayersOrdered preserves lineup order', () => {
    expect(lineupPlayersOrdered(squad, ['c', 'a'])).toEqual([squad[2], squad[0]]);
    expect(lineupPlayersOrdered(squad, ['missing', 'b'])).toEqual([squad[1]]);
  });

  it('removeIdFromLineup', () => {
    expect(removeIdFromLineup(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('addIdToLineupAt inserts and caps', () => {
    const base = Array.from({ length: LINEUP_CAP }, (_, i) => `p${i}`);
    expect(addIdToLineupAt(['a', 'b'], 'c', 1)).toEqual(['a', 'c', 'b']);
    expect(addIdToLineupAt(base, 'new', 5, LINEUP_CAP)).toHaveLength(LINEUP_CAP);
    expect(addIdToLineupAt(['a', 'b'], 'a', 0)).toEqual(['a', 'b']);
  });

  it('moveLineupIndex', () => {
    expect(moveLineupIndex(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveLineupIndex(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });

  it('dedupeLineup', () => {
    expect(dedupeLineup(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });
});
