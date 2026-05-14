// Finals rivalry memory — clubs "remember" September knockouts for trades & preview copy.

const MAX_LOG = 48;

/**
 * @param {object} career
 * @param {{ oppId: string, season: number, roundLabel: string, won: boolean, isGrandFinal: boolean, drew?: boolean }} args
 */
export function recordFinalsRivalryEvent(career, { oppId, season, roundLabel, won, isGrandFinal, drew }) {
  if (!oppId || drew) return;
  career.finalsRivalryLog = career.finalsRivalryLog || [];
  let event;
  if (won) {
    event = isGrandFinal ? 'won_gf' : 'you_eliminated';
  } else {
    event = isGrandFinal ? 'lost_gf' : 'eliminated_you';
  }
  career.finalsRivalryLog.unshift({
    season,
    oppId,
    event,
    round: roundLabel || null,
  });
  career.finalsRivalryLog = career.finalsRivalryLog.slice(0, MAX_LOG);
}

/** Times this club knocked us out of finals (or beat us in a GF) in the last `within` seasons. */
export function clubFinalsGrudgeTowardPlayer(career, oppClubId, within = 2) {
  const se = career.season ?? 2026;
  const log = career.finalsRivalryLog || [];
  return log.filter(
    (e) =>
      e.oppId === oppClubId &&
      e.season >= se - within &&
      (e.event === 'eliminated_you' || e.event === 'lost_gf'),
  ).length;
}

/** One-line ribbon for match preview / hub. */
export function finalsRivalryPreviewLine(career, oppClubId) {
  const se = career.season ?? 2026;
  const log = career.finalsRivalryLog || [];
  const lost = log.find(
    (e) => e.oppId === oppClubId && e.season >= se - 2 && e.event === 'eliminated_you',
  );
  if (lost) return `🗡️ They ended your ${lost.season} finals (${lost.round || 'finals'})`;
  const lostGf = log.find(
    (e) => e.oppId === oppClubId && e.season >= se - 3 && e.event === 'lost_gf',
  );
  if (lostGf) return `🏅 Grand final heartbreak vs them (${lostGf.season})`;
  const beat = log.find(
    (e) => e.oppId === oppClubId && e.season >= se - 2 && e.event === 'you_eliminated',
  );
  if (beat) return `👊 You knocked them out — ${beat.round || 'finals'} ${beat.season}`;
  const beatGf = log.find(
    (e) => e.oppId === oppClubId && e.season >= se - 3 && e.event === 'won_gf',
  );
  if (beatGf) return `🏆 You beat them on the last Saturday (${beatGf.season})`;
  return null;
}

/**
 * Post-match journo flavour when `result` includes finals flags from {@link careerAdvance}.
 * @param {object} career
 * @param {{ isFinals?: boolean, matchLabel?: string, won?: boolean, drew?: boolean }} result
 * @param {{ short?: string, name?: string }} opp
 */
export function journalistFinalsRivalryLine(career, result, opp) {
  if (!result?.isFinals || !opp?.id) return null;
  const j = career.journalist || { name: 'Press', satisfaction: 50, tone: 'neutral' };
  const name = j.name || 'Press';
  const o = opp.short || opp.name || 'Opposition';
  const lbl = result.matchLabel || 'finals';
  if (result.won && lbl === 'Grand Final') {
    return `${name}: "Premiership day — they'll replay this one in pubs for a generation."`;
  }
  if (!result.won && !result.drew && lbl === 'Grand Final') {
    return `${name}: "${o} lift the cup. Another cruel September for the travelling fans."`;
  }
  if (!result.won && !result.drew) {
    const us = club?.short || club?.name || 'the home side';
    return `${name}: "Eliminated in the ${lbl}. ${o} send ${us} out of September."`;
  }
  if (result.drew) return `${name}: "A rare finals stalemate — the rematch talk starts tonight."`;
  return `${name}: "${o} bow out of September while ${club?.short || club?.name || 'the winners'} roll on."`;
}
