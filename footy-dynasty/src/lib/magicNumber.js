// Late-season finals "magic number" — wins needed to clinch top 8 (tier 1).

import { sortedLadder } from './leagueEngine.js';

/**
 * Rough magic number: wins needed assuming rest-of-field wins out at .500.
 * @param {object} career
 * @param {number} finalsSpots default 8
 */
export function finalsMagicNumber(career, finalsSpots = 8) {
  const ladder = sortedLadder(career.ladder || []);
  const me = ladder.find((r) => r.id === career.clubId);
  if (!me) return null;

  const myPos = ladder.findIndex((r) => r.id === career.clubId) + 1;
  const cutoff = ladder[finalsSpots - 1];
  if (!cutoff) return null;

  const myPts = me.pts ?? 0;
  const cutPts = cutoff.pts ?? 0;
  const myPlayed = me.played ?? 0;
  const roundsLeft = Math.max(0, (career.totalRounds ?? 23) - myPlayed);

  if (myPos <= finalsSpots && myPts > cutPts + roundsLeft * 4) {
    return { clinched: true, label: 'Finals secured', myPos, roundsLeft };
  }

  const ptsNeeded = Math.max(0, cutPts + 4 - myPts + 1);
  const winsNeeded = Math.ceil(ptsNeeded / 4);
  const possible = Math.min(winsNeeded, roundsLeft);

  return {
    clinched: false,
    winsNeeded: possible,
    roundsLeft,
    myPos,
    label: possible <= roundsLeft
      ? `${possible} win${possible === 1 ? '' : 's'} to clinch top ${finalsSpots}`
      : 'Must rely on percentage',
  };
}
