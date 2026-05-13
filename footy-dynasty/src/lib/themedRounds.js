// ---------------------------------------------------------------------------
// Themed rounds — flavour tags for home-and-away rounds (not finals).
// ---------------------------------------------------------------------------

/** @typedef {{ short: string, detail: string }} ThemedRound */

const THEMES = /** @type {Record<number, ThemedRound>} */ ({
  1: { short: 'Opening Round', detail: 'New season energy — ladders reset.' },
  5: { short: 'Culture Round', detail: 'Big crowds and stories beyond the scoreboard.' },
  8: { short: 'Anzac Round', detail: 'Four-quarter grit and remembrance.' },
  12: { short: 'Rivalry Round', detail: 'Local grudges and louder benches.' },
  15: { short: 'Past Heroes Round', detail: 'Club greats on the big screen.' },
  18: { short: 'Run Home', detail: 'Every edge matters for September.' },
  22: { short: 'Finals Preview', detail: 'Seeding and percentage heat up.' },
});

/**
 * @param {number} roundNum 1-based home-and-away round index
 * @returns {ThemedRound | null}
 */
export function themedRoundForNumber(roundNum) {
  if (!roundNum || roundNum < 1) return null;
  return THEMES[roundNum] || null;
}
