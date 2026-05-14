// Interstate travel — small away rating penalty when crossing state lines.

import { findClub } from '../data/pyramid.js';

/**
 * Rating points to subtract from the player when away (0 if home or unknown).
 * @param {boolean} isPlayerHome
 * @param {string} playerClubId
 * @param {string|null} oppClubId
 */
export function awayTravelRatingPenalty(isPlayerHome, playerClubId, oppClubId) {
  if (isPlayerHome) return 0;
  const a = findClub(playerClubId);
  const b = findClub(oppClubId);
  const sa = a?.state;
  const sb = b?.state;
  if (!sa || !sb || sa === sb) return 0;
  return 1.15;
}
