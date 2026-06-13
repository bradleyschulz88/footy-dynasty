/**
 * Generates a short season narrative (headline + 2 sentences) for the Hub.
 * Updated each call based on current phase, ladder position, form, and stakes.
 */


/** Pull the player's recent form from the news log (last N match results). */
function recentResults(career, n = 5) {
  const matchNews = (career.news || []).filter(item =>
    item.type === 'win' || item.type === 'loss' || item.type === 'draw'
  );
  return matchNews.slice(0, n); // newest first
}

function winsLosses(results) {
  const W = results.filter(r => r.type === 'win').length;
  const L = results.filter(r => r.type === 'loss').length;
  const D = results.filter(r => r.type === 'draw').length;
  return { W, L, D };
}

function streakLabel(results) {
  if (!results.length) return null;
  const last = results[0].type;
  let count = 0;
  for (const r of results) {
    if (r.type !== last) break;
    count++;
  }
  if (count < 2) return null;
  if (last === 'win')  return count >= 4 ? `${count}-game winning run` : `${count} straight wins`;
  if (last === 'loss') return count >= 4 ? `${count}-game losing run` : `${count} straight losses`;
  return null;
}

const CLUB_VERBS_GOOD  = ['surging', 'flying', 'in form', 'building nicely', 'finding their stride'];
const CLUB_VERBS_BAD   = ['struggling', 'under pressure', 'searching for answers', 'in a rut', 'finding it tough'];
const CLUB_VERBS_MID   = ['ticking along', 'in the mix', 'holding firm', 'grinding it out', 'staying afloat'];

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

function posLabel(pos, total) {
  if (pos === 1) return 'atop the table';
  if (pos <= 2)  return `in ${pos}${pos === 2 ? 'nd' : 'rd'} place`;
  const finalsN = total >= 14 ? 8 : total >= 10 ? 6 : 4;
  if (pos <= finalsN) return `in ${pos}${pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} — inside the top ${finalsN}`;
  const gap = pos - finalsN;
  return `${pos}${pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'}, ${gap} spot${gap === 1 ? '' : 's'} outside the top ${finalsN}`;
}

export function seasonNarrative(career, sortedLadderRows, _league) {
  const week    = career.week ?? 0;
  const phase   = career.phase ?? 'preseason';
  const inFinals = !!career.inFinals;
  const totalRounds = career.totalRounds ?? 23;
  const roundsLeft  = Math.max(0, totalRounds - week);
  const total   = (sortedLadderRows || []).length;
  const myRow   = (sortedLadderRows || []).find(r => r.id === career.clubId);
  const myPos   = myRow ? (sortedLadderRows || []).indexOf(myRow) + 1 : null;
  const results = recentResults(career, 5);
  const { W, L } = winsLosses(results);
  const streak  = streakLabel(results);
  const clubName = career.clubName ?? 'Your club';
  // Deterministic seed for picking phrases (changes each round)
  const seed    = (week * 7 + (myPos || 1) * 3 + (W * 5));

  // ── PRESEASON ─────────────────────────────────────────────────────────────
  if (phase === 'preseason') {
    const headline = 'Preseason begins';
    const body =
      `The ${career.season} season is still being shaped — training reps matter now. ` +
      `Get your lineup set and your game-plan locked in before the rounds begin.`;
    return { headline, body, tone: 'neutral' };
  }

  // ── FINALS ────────────────────────────────────────────────────────────────
  if (inFinals) {
    const finalistsLeft = (career.finalsAlive || []).length;
    const stillIn = (career.finalsAlive || []).includes(career.clubId);
    if (!stillIn) {
      return {
        headline: 'Season over',
        body: `Your campaign ended in the finals. Reflect on what went right and what needs work before next year's rebuild begins.`,
        tone: 'negative',
      };
    }
    const roundLabel = finalistsLeft <= 2 ? 'Grand Final' : finalistsLeft <= 4 ? 'Preliminary Final' : finalistsLeft <= 6 ? 'Semi Final' : 'Elimination Final';
    return {
      headline: `${roundLabel} — still alive`,
      body: `${finalistsLeft} teams remain. Win this and ${clubName} are one step closer to the flag — the margin for error is zero.`,
      tone: 'tense',
    };
  }

  // ── SEASON ────────────────────────────────────────────────────────────────
  if (!myRow || !myPos) {
    return {
      headline: `Round ${week} underway`,
      body: `The ladder is taking shape — keep building toward the finals.`,
      tone: 'neutral',
    };
  }

  const finalsN  = total >= 14 ? 8 : total >= 10 ? 6 : 4;
  const inFinalsCont = myPos <= finalsN;
  const pLabel   = posLabel(myPos, total);

  // EARLY SEASON (rounds 1-4)
  if (week <= 4) {
    const tone = inFinalsCont ? 'positive' : (L >= W ? 'negative' : 'neutral');
    const verb = inFinalsCont
      ? pick(CLUB_VERBS_GOOD, seed)
      : (L > W ? pick(CLUB_VERBS_BAD, seed) : pick(CLUB_VERBS_MID, seed));
    const headline = `Early doors — Round ${week}`;
    const streakNote = streak ? ` ${streak} already — ` : ' ';
    const body =
      `${clubName} sit ${pLabel} after ${week} round${week === 1 ? '' : 's'}, ${verb}.` +
      `${streakNote}There's a long road ahead but the tone is being set right now.`;
    return { headline, body, tone };
  }

  // MID SEASON (rounds 5 to totalRounds-6)
  if (roundsLeft >= 6) {
    const tone = inFinalsCont ? (myPos <= 3 ? 'positive' : 'neutral') : (myPos > finalsN + 3 ? 'negative' : 'neutral');
    const verb = inFinalsCont
      ? pick(CLUB_VERBS_GOOD, seed)
      : (myPos > finalsN + 2 ? pick(CLUB_VERBS_BAD, seed) : pick(CLUB_VERBS_MID, seed));
    const headline = `Mid-season — Round ${week} of ${totalRounds}`;
    let body;
    if (streak) {
      body = `A ${streak} has ${clubName} ${pLabel} — ${roundsLeft} rounds left to cement or climb.`;
    } else {
      body = `${clubName} are ${pLabel} with ${roundsLeft} rounds to play, ${verb}.`;
    }
    if (!inFinalsCont) {
      const gap = myPos - finalsN;
      body += ` The top ${finalsN} is ${gap === 1 ? 'just one spot away' : `${gap} spots away`} — points are critical.`;
    } else if (myPos > 2) {
      body += ` Hold position and the finals are yours to lose.`;
    } else {
      body += ` The flag looks real — don't let up.`;
    }
    return { headline, body, tone };
  }

  // RUN HOME (last 5 rounds)
  const tone = inFinalsCont ? 'tense' : 'negative';
  const headline = `Run home — ${roundsLeft} to go`;
  let body;
  if (inFinalsCont) {
    if (streak === `${results.length} straight wins` || (W >= 3 && L === 0)) {
      body = `${clubName} are ${pLabel} and in sizzling form — the momentum feels right. `;
    } else if (L > W) {
      body = `${clubName} are ${pLabel} but form is patchy — the next few weeks could define the season. `;
    } else {
      body = `${clubName} are ${pLabel} with ${roundsLeft} round${roundsLeft === 1 ? '' : 's'} to go. `;
    }
    body += roundsLeft === 1
      ? 'One game stands between now and the finals.'
      : `Every game from here is a finals audition.`;
  } else {
    const gap = myPos - finalsN;
    body =
      `${clubName} are ${pLabel} — ${roundsLeft} rounds left and ${gap} spot${gap === 1 ? '' : 's'} to find. ` +
      `It's a mathematical miracle required, but stranger things have happened in footy.`;
  }
  return { headline, body, tone };
}
