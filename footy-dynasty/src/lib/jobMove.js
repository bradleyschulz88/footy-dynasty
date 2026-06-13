// ---------------------------------------------------------------------------
// Job move timing — when accepting a coaching job actually relocates you.
//
// Rules (from the player's preferences):
//   • Mid-season, immediate moves are ONLY possible when the target club has a
//     genuine vacancy (a seat already empty). Otherwise the move is agreed now
//     but happens at the END of the season so you finish with your current club.
//   • Outside an in-progress season, accepting simply starts you at the new club
//     for the upcoming season (the normal "next season" path).
//
// For an immediate takeover the engine has to fabricate the new club's record so
// far (it doesn't simulate other clubs' seasons), which `simulatePartialSeason`
// does with the lightweight AI-vs-AI sim.
// ---------------------------------------------------------------------------
import { blankLadder, applyResultToLadder } from './leagueEngine.js';
import { simMatch, aiClubRating } from './matchEngine.js';

/** Deterministic per club: does it have a real mid-season vacancy? (~35%). */
export function offerHasVacancy(offer) {
  if (!offer?.clubId) return false;
  const sum = String(offer.clubId).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return (sum % 100) < 35;
}

/** Is a competitive season underway (games being played right now)? */
export function seasonInProgress(career) {
  return career?.phase === 'season' || !!career?.inFinals;
}

/**
 * Effective start timing for an offer given the player's situation:
 *   'immediate'   — take over now, mid-season (vacancy only)
 *   'endOfSeason' — agreed now, you finish the current season first
 *   'nextSeason'  — not mid-season; just start at the new club next season
 */
export function offerStartType(offer, career) {
  if (!seasonInProgress(career)) return 'nextSeason';
  return offerHasVacancy(offer) ? 'immediate' : 'endOfSeason';
}

/** Short human label for the UI. */
export function startTypeLabel(startType) {
  return startType === 'immediate'
    ? 'Starts immediately · vacancy'
    : startType === 'endOfSeason'
      ? "Starts at season's end"
      : 'Starts next season';
}

/**
 * Fast-simulate the first `playedRounds` rounds of a competition (AI vs AI) to
 * seed a believable mid-season ladder + the new club's record so far. Pure given
 * the seeded RNG. Home advantage matches the live engine's default.
 *
 * @returns {{ ladder: object[], record: {W:number,D:number,L:number} }}
 */
export function simulatePartialSeason(clubs, fixtures, playedRounds, tier, myClubId, homeAdv = 4) {
  let ladder = blankLadder(clubs);
  const record = { W: 0, D: 0, L: 0 };
  const rounds = Math.max(0, Math.min(playedRounds, fixtures.length));
  for (let r = 0; r < rounds; r++) {
    for (const m of (fixtures[r] || [])) {
      if (!m?.home || !m?.away) continue;
      const hr = aiClubRating(m.home, tier);
      const ar = aiClubRating(m.away, tier);
      const res = simMatch({ rating: hr }, { rating: ar }, false, ar, homeAdv);
      ladder = applyResultToLadder(ladder, m.home, m.away, res.homeTotal, res.awayTotal);
      if (m.home === myClubId || m.away === myClubId) {
        const mine = m.home === myClubId ? res.homeTotal : res.awayTotal;
        const opp = m.home === myClubId ? res.awayTotal : res.homeTotal;
        if (mine > opp) record.W += 1;
        else if (mine < opp) record.L += 1;
        else record.D += 1;
      }
    }
  }
  return { ladder, record };
}
