// ---------------------------------------------------------------------------
// Themed rounds — flavour tags for home-and-away rounds (not finals).
// ---------------------------------------------------------------------------

/** @typedef {{ short: string, detail: string }} ThemedRound */

// Real AFL marquee rounds mapped to the season's round numbers. Round 1
// (Opening) and 8 (Anzac) are pinned by tests; the rest mirror the real
// calendar's signature rounds.
const THEMES = /** @type {Record<number, ThemedRound>} */ ({
  1: { short: 'Opening Round', detail: 'New season energy — ladders reset.' },
  5: { short: 'Gather Round', detail: 'The whole round in South Australia — a festival of footy at Adelaide Oval.' },
  8: { short: 'Anzac Round', detail: 'Lest we forget — four quarters of grit and remembrance.' },
  11: { short: 'Sir Doug Nicholls Round', detail: 'Celebrating Indigenous players and culture — the Dreamtime clash headlines.' },
  13: { short: "King's Birthday Round", detail: 'A public-holiday blockbuster under the MCG lights.' },
  15: { short: 'Pride Round', detail: 'Everyone belongs at the footy.' },
  18: { short: 'Rivalry Round', detail: 'Local grudges, louder benches, no love lost.' },
  21: { short: 'Country Round', detail: 'Honouring the bush leagues that grew the game.' },
  22: { short: 'Finals Preview', detail: 'Seeding and percentage heat up before September.' },
});

/**
 * @param {number} roundNum 1-based home-and-away round index
 * @returns {ThemedRound | null}
 */
export function themedRoundForNumber(roundNum) {
  if (!roundNum || roundNum < 1) return null;
  return THEMES[roundNum] || null;
}
