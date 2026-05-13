// ---------------------------------------------------------------------------
// AI club personality — stable, cheap character for opponents (tactics, etc.)
// ---------------------------------------------------------------------------

const TACTIC_POOL = ['defensive', 'balanced', 'attack', 'flood', 'press', 'run'];

export function hashClubId(clubId) {
  const s = String(clubId || 'na');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * @param {string} clubId
 * @returns {{ preferredTactic: string, tradeAggression: number }}
 */
export function aiPersonalityForClub(clubId) {
  const h = hashClubId(clubId);
  return {
    preferredTactic: TACTIC_POOL[h % TACTIC_POOL.length],
    tradeAggression: ((h >> 5) % 6) / 10,
  };
}

/**
 * Blend rating-based heuristics with a stable club “character” tactic.
 * Deterministic — safe for React previews and sims.
 *
 * @param {string} oppClubId
 * @param {number} oppRating
 * @param {number} myRating
 * @returns {string} tactic id (matches TACTIC_PROFILES in matchEngine)
 */
export function resolveAiOppTactic(oppClubId, oppRating, myRating) {
  const ratingTactic =
    oppRating > myRating + 4 ? 'attack' : oppRating < myRating - 4 ? 'defensive' : 'balanced';
  const { preferredTactic } = aiPersonalityForClub(oppClubId);
  const h = hashClubId(oppClubId);
  if ((h % 10) < 4) return preferredTactic;
  return ratingTactic;
}
