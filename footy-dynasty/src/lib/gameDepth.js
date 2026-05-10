// Story / depth systems from Game Depth spec (captain, H2H & bogey, turning points, culture shell).

import { clamp } from './matchEngine.js';
import { sortedLadder, getFinalsTeams } from './leagueEngine.js';
import { applyMemberConfidenceDelta } from './board.js';

/** @param {object[]} squad */
export function suggestCaptain(squad) {
  const candidates = (squad || [])
    .filter((p) => (p.age ?? 0) >= 22 && (p.morale ?? 70) >= 65);
  if (!candidates.length) return null;
  const scored = candidates.map((p) => {
    const dec = p.attrs?.decision ?? 70;
    const yrs = p.seasonsAtClub ?? p.yearsAtClub ?? 0;
    const score = (p.overall ?? 50) + dec + yrs * 3;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].p;
}

export function assignDefaultCaptains(career) {
  const squad = career.squad || [];
  const cap = suggestCaptain(squad);
  if (!cap) {
    career.captainId = null;
    career.viceCaptainId = null;
    return;
  }
  career.captainId = cap.id;
  const rest = squad.filter((p) => p.id !== cap.id && (p.age ?? 0) >= 21 && (p.morale ?? 70) >= 60);
  const vice = rest.sort(
    (a, b) => ((b.overall ?? 0) + (b.attrs?.decision ?? 0)) - ((a.overall ?? 0) + (a.attrs?.decision ?? 0)),
  )[0];
  career.viceCaptainId = vice?.id ?? null;
}

export function defaultClubCulture() {
  return {
    score: 60,
    tier: 'Solid',
    localFocus: 0,
    philosophyAlignment: 0,
    tradition: 0,
    history: [],
  };
}

export function cultureTierLabel(score) {
  if (score <= 20) return 'Struggling';
  if (score <= 40) return 'Developing';
  if (score <= 60) return 'Solid';
  if (score <= 80) return 'Strong';
  return 'Elite';
}

export function bumpClubCulture(career, delta) {
  if (!delta) return;
  career.clubCulture = career.clubCulture || defaultClubCulture();
  career.clubCulture.score = clamp((career.clubCulture.score ?? 60) + delta, 0, 100);
  career.clubCulture.tier = cultureTierLabel(career.clubCulture.score);
}

/** Weekly captain lift — run on training days. */
export function applyCaptainWeeklyEffect(career, difficultyId) {
  const captain = (career.squad || []).find((p) => p.id === career.captainId);
  if (!captain) return;

  const decision = captain.attrs?.decision ?? 70;
  const leadershipScore = decision + ((captain.morale ?? 70) / 2);

  if (leadershipScore >= 120) {
    (career.squad || []).forEach((p) => {
      if (p.id !== captain.id && (p.morale ?? 70) < 85) {
        p.morale = Math.min(85, (p.morale ?? 70) + 1);
      }
    });
  }

  if ((captain.morale ?? 70) >= 80) {
    applyMemberConfidenceDelta(career, 'Player Relations Director', 0.5);
  }

  const culture = career.clubCulture?.score ?? 60;
  if (culture < 35) {
    const floor = difficultyId === 'grassroots' ? 40 : 20;
    (career.squad || []).forEach((p) => {
      p.morale = Math.max(floor, (p.morale ?? 70) - 0.5);
    });
  }
}

/**
 * Match-day team rating bonus when the skipper plays.
 * @param {object} career
 * @param {boolean} isFinalsGame
 */
export function getCaptainMatchBonus(career, isFinalsGame) {
  const lineup = career.lineup || [];
  const captain = (career.squad || []).find((p) => p.id === career.captainId);
  if (!captain || !lineup.includes(captain.id)) return 0;
  const d = captain.attrs?.decision ?? 70;
  const base = d >= 80 ? 3 : d >= 65 ? 1.5 : 0.5;
  const finalsBonus = isFinalsGame ? base * 0.8 : 0;
  return base + finalsBonus;
}

const TURNING_META = {
  must_win: { ribbon: 'MUST WIN', emoji: '🔥' },
  undefeated_run: { ribbon: 'UNBEATEN', emoji: '🔥' },
  bogey_buster: { ribbon: 'BOGEY BUSTER', emoji: '🏆' },
  survival: { ribbon: 'SURVIVAL', emoji: '⚠️' },
  promotion_decider: { ribbon: 'TITLE SHOT', emoji: '🏆' },
};

export function turningPointRibbon(tp) {
  return TURNING_META[tp] || null;
}

function countSeasonRoundsLeft(career) {
  return (career.eventQueue || []).filter(
    (e) => !e.completed && e.type === 'round' && e.phase === 'season',
  ).length;
}

function nextSeasonRoundEvent(career) {
  return (career.eventQueue || []).find(
    (e) => !e.completed && e.type === 'round' && e.phase === 'season',
  );
}

/** Strip turning-point tags from all incomplete season fixtures (player's row only). */
export function clearUpcomingTurningPoints(career) {
  const clubId = career.clubId;
  for (const e of career.eventQueue || []) {
    if (e.completed || e.type !== 'round' || e.phase !== 'season') continue;
    for (const m of e.matches || []) {
      if (m.home === clubId || m.away === clubId) {
        if (m.turningPoint) delete m.turningPoint;
      }
    }
  }
}

/**
 * After a round resolves, tag the next H&A match with at most one turning-point type.
 */
export function refreshTurningPointForNextFixture(career, league) {
  clearUpcomingTurningPoints(career);
  const nextEv = nextSeasonRoundEvent(career);
  if (!nextEv) return;

  const clubId = career.clubId;
  const myMatch = (nextEv.matches || []).find((m) => m.home === clubId || m.away === clubId);
  if (!myMatch) return;

  const oppId = myMatch.home === clubId ? myMatch.away : myMatch.home;
  const ladder = sortedLadder(career.ladder || []);
  const myPos = ladder.findIndex((r) => r.id === clubId) + 1;
  const finalsTeams = getFinalsTeams(career.ladder || [], league.tier);
  const finalsLine = finalsTeams.length || (league.tier === 1 ? 8 : league.tier === 2 ? 6 : 4);
  const roundsLeft = countSeasonRoundsLeft(career);
  const ws = career.winStreak ?? 0;
  const h2h = career.headToHead?.[oppId];
  const h2hTotal = (h2h?.wins ?? 0) + (h2h?.losses ?? 0) + (h2h?.draws ?? 0);

  let tp = null;
  if (myPos > finalsLine && roundsLeft <= 4 && roundsLeft >= 1) tp = 'must_win';
  else if (league.tier > 1 && myPos >= ladder.length - 1 && roundsLeft <= 3 && roundsLeft >= 1) {
    tp = 'survival';
  } else if (league.tier > 1 && myPos === 1 && roundsLeft <= 2 && roundsLeft >= 1) {
    tp = 'promotion_decider';
  } else if (h2h && h2hTotal >= 3 && (h2h.streak ?? 0) <= -3) {
    tp = 'bogey_buster';
  } else if (ws >= 5) {
    tp = 'undefeated_run';
  }

  if (tp) {
    myMatch.turningPoint = tp;
    if (tp === 'undefeated_run' && !(career.news || []).some((n) => n.type === 'streak' && n.roundTag === 'unbeaten')) {
      career.news = [{
        week: career.week ?? 0,
        type: 'streak',
        roundTag: 'unbeaten',
        text: `${ws} wins in a row — can they make it ${ws + 1}?`,
      }, ...(career.news || [])].slice(0, 20);
    }
  }
}

/**
 * Crucial five — mid-season highlight (after round 8).
 */
export function refreshCrucialFive(career, league, completedRound) {
  if (completedRound < 8) return;
  const finalsLine = league.tier === 1 ? 8 : 6;
  const ladder = sortedLadder(career.ladder || []);
  const clubId = career.clubId;
  const myPos = ladder.findIndex((r) => r.id === clubId) + 1;

  const crucial = [];
  for (const e of career.eventQueue || []) {
    if (e.completed || e.type !== 'round' || e.phase !== 'season') continue;
    const myMatch = (e.matches || []).find((m) => m.home === clubId || m.away === clubId);
    if (!myMatch) continue;
    const oppId = myMatch.home === clubId ? myMatch.away : myMatch.home;
    const oppPos = ladder.findIndex((r) => r.id === oppId) + 1;
    if (
      Math.abs(oppPos - finalsLine) <= 3
      || Math.abs(myPos - finalsLine) <= 3
    ) {
      crucial.push({ round: e.round, opponentId: oppId });
    }
    if (crucial.length >= 5) break;
  }
  career.crucialFive = crucial.slice(0, 5);
}

export function recordHeadToHead(career, oppId, won, drew, marginPts, shortLabel) {
  if (!oppId) return;
  career.headToHead = career.headToHead || {};
  const rec = career.headToHead[oppId] || { wins: 0, losses: 0, draws: 0, streak: 0 };
  if (won) {
    rec.wins += 1;
    rec.streak = (rec.streak > 0 ? rec.streak : 0) + 1;
  } else if (drew) {
    rec.draws += 1;
    rec.streak = 0;
  } else {
    rec.losses += 1;
    rec.streak = (rec.streak < 0 ? rec.streak : 0) - 1;
  }
  rec.lastResult = shortLabel;
  career.headToHead[oppId] = rec;
  identifyBogeyTeam(career);
}

export function identifyBogeyTeam(career) {
  const h2h = career.headToHead || {};
  let bogey = null;
  let nemesis = null;
  Object.entries(h2h).forEach(([clubId, record]) => {
    const total = record.wins + record.losses + record.draws;
    if (total < 3) return;
    if (record.streak <= -3 && (!bogey || record.streak < bogey.streak)) {
      bogey = { clubId, ...record };
    }
    if (record.wins >= 5 && record.losses === 0) {
      nemesis = { clubId, ...record };
    }
  });
  career.bogeyTeamId = bogey?.clubId || null;
  career.dominatedTeamId = nemesis?.clubId || null;
}

/**
 * Hoodoo broken — win vs opponent who was the bogey rival with 3+ straight losses coming in.
 * Call after `recordHeadToHead` with streaks from *before* the result was applied.
 */
export function celebrateBogeyBreakIfNeeded(career, oppId, won, wasBogeyOpp, lossStreakBefore, findClubFn) {
  if (!won || !oppId || !wasBogeyOpp || lossStreakBefore > -3) return;

  const prevLossStreak = Math.abs(lossStreakBefore);
  (career.squad || []).forEach((p) => {
    p.morale = Math.min(100, (p.morale ?? 70) + 10);
  });
  career.finance = { ...career.finance, boardConfidence: clamp((career.finance?.boardConfidence ?? 55) + 6, 0, 100) };

  if (career.clubCulture) {
    career.clubCulture.score = clamp((career.clubCulture.score ?? 60) + 2, 0, 100);
    career.clubCulture.tier = cultureTierLabel(career.clubCulture.score);
  }

  const opp = findClubFn(oppId);
  const club = findClubFn(career.clubId);
  const oppName = opp?.name || oppId;
  career.news = [{
    week: career.week ?? 0,
    type: 'win',
    text: `HOODOO BROKEN! After ${prevLossStreak} straight losses to ${oppName}, ${club?.short || 'the club'} finally get the win. Scenes.`,
  }, ...(career.news || [])].slice(0, 20);
}

export function pushTeamStatsFromResult(career, myGoals, myBehinds, oppGoals, oppBehinds, won, drew) {
  career.teamStats = career.teamStats || { goalsFor: [], goalsAgainst: [], margin: [], results: [] };
  const myPts = myGoals * 6 + myBehinds;
  const oppPts = oppGoals * 6 + oppBehinds;
  career.teamStats.goalsFor.push(myGoals);
  career.teamStats.goalsAgainst.push(oppGoals);
  career.teamStats.margin.push(myPts - oppPts);
  career.teamStats.results.push(won ? 'W' : drew ? 'D' : 'L');
  const tail = career.teamStats.results.slice(-10);
  career.teamStats.last10 = tail;
}

/** Save migration — game depth / story systems (v12). */
export function migrateSaveGameDepthV12(save) {
  save.clubCulture = save.clubCulture || defaultClubCulture();
  save.headToHead = save.headToHead || {};
  save.bogeyTeamId = save.bogeyTeamId ?? null;
  save.dominatedTeamId = save.dominatedTeamId ?? null;
  save.captainHistory = save.captainHistory || [];
  save.viceCaptainId = save.viceCaptainId ?? null;
  if (save.captainId === undefined) save.captainId = null;
  save.crucialFive = save.crucialFive || [];
  save.crisisFiredThisSeason = save.crisisFiredThisSeason ?? false;
  if (!save.teamStats) save.teamStats = null;
  if (save.captainId == null && Array.isArray(save.squad)) assignDefaultCaptains(save);
}
