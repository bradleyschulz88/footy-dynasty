// Season calendar advancement: event loop, finals, end-of-season rollover.
// Extracted from AFLManager.jsx so the shell stays UI-focused.

import { seedRng, rand, pick, rng, TIER_SCALE } from './rng.js';
import { PYRAMID, findClub } from '../data/pyramid.js';
import { isForwardPreferred, isMidPreferred, generatePlayer } from './playerGen.js';
import { teamRating, simMatch, simMatchWithQuarters, aiClubRating } from './matchEngine.js';
import { generateFixtures, blankLadder, applyResultToLadder, sortedLadder, getFinalsTeams, finalsLabel, pickPromotionLeague, pickRelegationLeague, competitionClubsForCareer, getCompetitionClubs, localDivisionForClub, tier3DivisionCount } from './leagueEngine.js';
import { generateTradePool } from './defaults.js';
import { withDraftScoutingDefaults } from './draftScouting.js';
import { syncTradePeriodManagerInboxRow } from './inbox.js';
import { fmtK, clamp, avgFacilities, avgStaff } from './format.js';
import { generateSeasonCalendar, applyTraining, TRAINING_INFO } from './calendar.js';
import { ensureSquadsForLeague, tickAiSquads, ageAiSquads, selectAiLineup } from './aiSquads.js';
import {
  beginPostSeasonTradePeriod,
  advanceTradePeriodDay,
  advanceDraftCountdown,
  clearPostSeasonTransient,
  playerBlockedFromTrade,
} from './tradePeriod.js';
import { TUTORIAL_STEPS } from './tutorialConstants.js';
import { getDifficultyConfig } from './difficulty.js';
import {
  committeeMessage, bumpCommitteeMood, postMatchFundraiser,
  ensureWeatherForWeek, applyGroundDegradation, recoverGroundPreseason,
  groundConditionBand, journalistMatchLine,
} from './community.js';
import {
  coachTierFromScore, applyEndOfSeasonReputation,
  applySackingReputation,
} from './coachReputation.js';
import {
  recomputeAnnualIncome, tickWeeklyCashflow,
  cashCrisisLevel, applyPrizeMoney, applyPromotionRipple,
  effectiveInjuryRate, annualNetProjection,
  refillTransferBudget,
  effectiveWageCap, currentPlayerWageBill,
} from './finance/engine.js';
import {
  tickSponsorYears, proposalForRenewal, generateSponsorOffers,
} from './finance/sponsors.js';
import { buildRenewalQueue } from './finance/contracts.js';
import { buildStaffRenewalQueue, flushUnhandledStaffRenewals } from './staffRenewals.js';
import {
  INSOLVENCY, FUNDRAISERS, COMMUNITY_GRANT, TICKET_PRICE, BASE_ATTENDANCE,
} from './finance/constants.js';
import { getClubGround } from '../data/grounds.js';
import { resolveHomeAdvantageForFixture, homeAdvantageAiHome } from './homeAdvantage.js';
import {
  ensureCareerBoard,
  applyBoardConfidenceDelta,
  generateSeasonObjectives,
  updateBoardObjectiveProgress,
  resolveBoardObjectivesAtSeasonEnd,
  youthSeniorGameCount,
  maybeEnqueueBoardMessage,
  maybeEnqueueBoardCrisisPrep,
  planSeasonBoardMeetings,
  findDueBoardMeetingSlot,
  openBoardMeetingBlockingFromSlot,
} from './board.js';
import {
  getCaptainMatchBonus,
  recordHeadToHead,
  celebrateBogeyBreakIfNeeded,
  refreshTurningPointForNextFixture,
  refreshCrucialFive,
  pushTeamStatsFromResult,
  applyCaptainWeeklyEffect,
  bumpClubCulture,
} from './gameDepth.js';
import { medicalStaffMitigation } from './staffTasks.js';
import { weeklyClubOperationsPulse } from './weeklyClubPulse.js';
import {
  assignDynastyQuestsForSeason,
  dynastyRecordHomeAwayWin,
  ensureDynastyAssignments,
  finalizeDynastyLadderAtSeasonEnd,
} from './dynastyQuests.js';

const ROUND_REPORT_WIN_CLOSERS = [
  'Fans lingered after the siren.',
  'The song echoed across the terraces.',
  'Change rooms stayed loud well past cool-down.',
  'Hard nuts-to-oranges win on the road.',
  'Four-quarter effort finally stuck.',
];

const ROUND_REPORT_DRAW_CLOSERS = [
  'Neither coach blinked at the last centre bounce.',
  'Honours even — replay vibes without the fixture.',
  'One kick either way all afternoon.',
  'Shared points, split moods in the rooms.',
];

const ROUND_REPORT_LOSS_CLOSERS = [
  'Dressing room fell quiet quick.',
  'Coaches\' box ran out of answers late.',
  'Errors compounded when it mattered.',
  'Review tape will hurt tomorrow.',
  'Momentum never quite flipped.',
];

/** First day of the home-and-away season: formal renewal window closes; auto-fill staff gaps. */
export function applySeasonRenewalDeadline(c, league) {
  if (c.renewalsClosed) return;
  c.renewalsClosed = true;
  const flush = flushUnhandledStaffRenewals(c, league.tier);
  c.staff = flush.staff;
  c.pendingStaffRenewals = flush.pendingStaffRenewals;
  if (flush.extraNews.length) {
    c.news = [...flush.extraNews, ...(c.news || [])].slice(0, 25);
  }
}

/** Home / form streaks for dynamic home-ground advantage (community.js). */
function applyMatchStreaks(c, won, drew, isHome) {
  if (won) {
    c.winStreak = (c.winStreak >= 0 ? c.winStreak : 0) + 1;
  } else if (!drew) {
    c.winStreak = (c.winStreak <= 0 ? c.winStreak : 0) - 1;
  } else {
    const w = c.winStreak ?? 0;
    if (w > 0) c.winStreak = w - 1;
    else if (w < 0) c.winStreak = w + 1;
  }
  if (isHome) {
    if (won) c.homeWinStreak = (c.homeWinStreak ?? 0) + 1;
    else if (!drew) c.homeWinStreak = 0;
  }
}

export function triggerSackState(c, clubName, round) {
  if (c.gameMode === 'sandbox') return;
  c.isSacked = true;
  c.sackingStep = 0;
  c.boardCrisis = null;
  c.boardMeetingBlocking = null;
  c.gameOver = {
    reason: 'sacked', club: clubName, season: c.season, week: round,
    premiership: c.premiership || null,
  };
  c.coachReputation = applySackingReputation(c.coachReputation);
  c.coachTier = coachTierFromScore(c.coachReputation);
  c.boardVotePrepBonus = 0;
  c.jobMarketRerolls = 0;
  c.arrivalBriefing = null;
  c.news = [{ week: round, type: 'loss', text: `💼 The board has terminated your contract at ${clubName}.` }, ...(c.news || [])].slice(0, 20);
}

function markTutorialCompleteAfterAdvance(draft) {
  if (!draft.tutorialComplete && (draft.tutorialStep ?? 0) === 6) {
    draft.tutorialStep = TUTORIAL_STEPS.length;
    draft.tutorialComplete = true;
  }
}

/** Team strength for AI-vs-AI fixtures using persistent squads. */
function aiVsAiTeamRating(c, league, clubId) {
  const sq = c.aiSquads?.[clubId];
  const lineupIds = sq?.length ? selectAiLineup(sq).map((p) => p.id) : [];
  if (sq?.length) {
    return teamRating(sq, lineupIds, { intensity: 60, focus: {} }, 1, 60);
  }
  return aiClubRating(clubId, league.tier);
}

function buildPostMatchSummary(c, league, club, myResult, round) {
  const attribution = myResult.result?.goalAttribution || {};
  let topScorerId = null; let topGoals = -1;
  Object.entries(attribution).forEach(([pid, v]) => {
    if ((v.goals || 0) > topGoals) { topScorerId = pid; topGoals = v.goals || 0; }
  });
  const topScorer = topScorerId ? c.squad.find((p) => p.id === topScorerId) : null;
  let bogId = null; let bogScore = -1;
  Object.entries(attribution).forEach(([pid, v]) => {
    if ((v.votesScore || 0) > bogScore) { bogId = pid; bogScore = v.votesScore || 0; }
  });
  const myLineup = (c.lineup || []).map((id) => c.squad.find((p) => p.id === id)).filter(Boolean);
  const bog = bogId ? c.squad.find((p) => p.id === bogId) : (myLineup[0] || null);

  const margin = Math.abs((myResult.myTotal ?? 0) - (myResult.oppTotal ?? 0));
  const conf = c.finance.boardConfidence;
  const boardReaction = (() => {
    if (myResult.won && margin >= 30) return { emoji: '🔥', text: 'Outstanding. The board is fully behind you.' };
    if (!myResult.won && !myResult.drew && margin >= 40) return { emoji: '🚨', text: 'The board has called an urgent review. Expect a difficult conversation.' };
    if (myResult.won) return conf >= 60 ? { emoji: '👍', text: 'The board is pleased. Keep it up.' }
      : { emoji: '🤝', text: 'A welcome result. The board is watching closely but encouraged.' };
    if (myResult.drew) return { emoji: '😐', text: 'Acceptable. The board expected better but a draw will do.' };
    if (conf >= 60) return { emoji: '😬', text: 'Disappointed but not panicking. One bad result.' };
    if (conf >= 30) return { emoji: '⚠️', text: 'The board is concerned. Results need to improve.' };
    return { emoji: '💀', text: 'The board is not happy. This cannot continue.' };
  })();
  const journoLine = journalistMatchLine(c, myResult, club, myResult.opp);
  let committeeReaction = null;
  if (Array.isArray(c.committee) && c.committee.length) {
    const sorted = [...c.committee].sort((a, b) => Math.abs(b.mood - 50) - Math.abs(a.mood - 50));
    const m = sorted[0];
    committeeReaction = `${m.name} (${m.role}): ${
      m.mood >= 70 ? 'Loved that.' : m.mood >= 40 ? 'Reasonable showing.' : 'Not good enough.'
    }`;
  }
  const baseCrowd = league.tier === 1 ? 35000 : league.tier === 2 ? 4500 : 800;
  const crowd = Math.round(baseCrowd * (0.6 + 0.5 * rng()));
  return {
    label: `Round ${round}`,
    myScore: `${myResult.result?.homeGoals ?? 0}.${myResult.result?.homeBehinds ?? 0} (${myResult.myTotal})`,
    oppScore: `${myResult.result?.awayGoals ?? 0}.${myResult.result?.awayBehinds ?? 0} (${myResult.oppTotal})`,
    myShortName: club.short, oppShortName: myResult.opp?.short || 'OPP',
    myColor: club.colors?.[0] || 'var(--A-accent)',
    oppColor: myResult.opp?.colors?.[0] || '#64748B',
    result: myResult.won ? 'WIN' : myResult.drew ? 'DRAW' : 'LOSS',
    resultColor: myResult.won ? '#4AE89A' : myResult.drew ? 'var(--A-accent)' : '#E84A6F',
    margin,
    crowd,
    bog,
    topScorer, topGoals,
    boardReaction,
    journalistLine: journoLine,
    committeeReaction,
  };
}

function startFinals(c, league) {
  const finalists = getFinalsTeams(c.ladder, league.tier);
  const myPos = sortedLadder(c.ladder).findIndex((r) => r.id === c.clubId) + 1;
  const inFinals = finalists.some((f) => f.id === c.clubId);
  const totalRounds = Math.log2(finalists.length);
  c.inFinals = true;
  c.finalsRound = 0;
  c.finalsFinalists = finalists.map((f) => f.id);
  c.finalsAlive = finalists.map((f) => f.id);
  c.finalsTotalRounds = Math.ceil(totalRounds);
  c.finalsResults = [];
  const news = inFinals
    ? `🏆 FINALS! Finished ${myPos}${myPos === 1 ? 'st' : myPos === 2 ? 'nd' : myPos === 3 ? 'rd' : 'th'} — into the ${finalsLabel(0, c.finalsTotalRounds)}!`
    : `Season over. Finished ${myPos}/${sortedLadder(c.ladder).length} — missed finals.`;
  c.news = [{ week: c.week, type: inFinals ? 'win' : 'draw', text: news }, ...c.news].slice(0, 15);
  return c;
}

function advanceFinalsWeek(c, league) {
  const alive = c.finalsAlive || [];
  if (alive.length <= 1) {
    const winner = alive[0];
    const winnerClub = findClub(winner);
    const isMeChamp = winner === c.clubId;
    c.premiership = isMeChamp ? c.season : c.premiership;
    c.news = [{ week: c.week, type: isMeChamp ? 'win' : 'loss',
      text: isMeChamp ? `🏆🎉 PREMIERS! ${winnerClub?.name} are the ${c.season} champions!`
        : `${winnerClub?.name} win the ${c.season} premiership.` }, ...c.news].slice(0, 15);
    c.inFinals = false;
    beginPostSeasonTradePeriod(c, league, c.leagueKey);
    return c;
  }

  const sorted = c.finalsFinalists.filter((id) => alive.includes(id));
  const pairs = [];
  for (let i = 0; i < Math.floor(sorted.length / 2); i++) {
    pairs.push({ home: sorted[i], away: sorted[sorted.length - 1 - i] });
  }

  const newAlive = [];
  const myRating = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff))
    + getCaptainMatchBonus(c, true);
  const roundLabel = finalsLabel(c.finalsRound, c.finalsTotalRounds);

  for (const m of pairs) {
    const isPlayerMatch = m.home === c.clubId || m.away === c.clubId;
    const isHome = m.home === c.clubId;
    const homeR = m.home === c.clubId ? myRating : aiClubRating(m.home, league.tier);
    const awayR = m.away === c.clubId ? myRating : aiClubRating(m.away, league.tier);
    let result;
    if (isPlayerMatch) {
      c.aiSquads = ensureSquadsForLeague(c, league);
      const oppId = isHome ? m.away : m.home;
      const oppClub = findClub(oppId);
      const oppSquad = c.aiSquads?.[oppId];
      const oppLineup = oppSquad ? selectAiLineup(oppSquad) : [];
      const oppLineupIds = oppLineup.map((p) => p.id);
      const neutralTraining = { intensity: 60, focus: {} };
      const oppRatingForTactics = oppSquad?.length
        ? teamRating(oppSquad, oppLineupIds, neutralTraining, 1, 60)
        : aiClubRating(oppId, league.tier);
      const oppTactic = oppRatingForTactics > myRating + 4 ? 'attack' : oppRatingForTactics < myRating - 4 ? 'defensive' : 'balanced';
      const playerLineup = c.lineup.map((id) => c.squad.find((p) => p.id === id)).filter(Boolean);
      let groundScoringMod = 1.0;
      let groundAccuracyMod = 1.0;
      if (isHome) {
        const band = groundConditionBand(c.groundCondition ?? 85);
        groundScoringMod = band.scoringMod;
        groundAccuracyMod = band.accuracyMod;
      }
      const getPlayerStrengthForQuarter = (qi) =>
        teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff), qi);
      const getOppStrengthForQuarter = oppSquad?.length
        ? (qi) => teamRating(oppSquad, oppLineupIds, neutralTraining, 1, 60, qi)
        : null;
      result = simMatchWithQuarters(
        { rating: homeR }, { rating: awayR }, isHome, myRating,
        {
          tactic: c.tacticChoice || 'balanced',
          playerLineup,
          oppLineup,
          oppTactic,
          groundScoringMod,
          groundAccuracyMod,
          getPlayerStrengthForQuarter,
          ...(getOppStrengthForQuarter ? { getOppStrengthForQuarter } : {}),
          homeFixtureAdvantage: resolveHomeAdvantageForFixture(c, league, isHome, findClub(c.clubId), oppClub),
        },
      );
    } else {
      const weatherTag = typeof c.weeklyWeather?.[c.week] === 'string' ? c.weeklyWeather[c.week] : 'fine';
      const homeAdvAi = homeAdvantageAiHome(
        league,
        getClubGround(findClub(m.home), 3, league.tier),
        true,
        weatherTag,
      );
      result = simMatch({ rating: homeR }, { rating: awayR }, false, awayR, homeAdvAi);
    }
    const winnerId = result.winner === 'home' ? m.home : result.winner === 'away' ? m.away : m.home;
    newAlive.push(winnerId);
    m.result = { hScore: result.homeTotal, aScore: result.awayTotal };

    if (isPlayerMatch) {
      const playerWon = (isHome && result.winner === 'home') || (!isHome && result.winner === 'away');
      const myScore = isHome ? result.homeTotal : result.awayTotal;
      const oppScore = isHome ? result.awayTotal : result.homeTotal;
      const drewFinal = myScore === oppScore;
      applyMatchStreaks(c, playerWon, drewFinal, isHome);
      const opp = findClub(isHome ? m.away : m.home);
      const oid = opp?.id;
      if (oid) {
        const wasBogey = c.bogeyTeamId === oid;
        const prevStreak = c.headToHead?.[oid]?.streak ?? 0;
        const diff = myScore - oppScore;
        const lbl = `${playerWon ? 'W' : drewFinal ? 'D' : 'L'} ${Math.abs(diff)}pt`;
        recordHeadToHead(c, oid, playerWon, drewFinal, diff, lbl);
        celebrateBogeyBreakIfNeeded(c, oid, playerWon, wasBogey, prevStreak, findClub);
      }
      const hg = isHome ? (result.homeGoals ?? 0) : (result.awayGoals ?? 0);
      const hb = isHome ? (result.homeBehinds ?? 0) : (result.awayBehinds ?? 0);
      const ag = isHome ? (result.awayGoals ?? 0) : (result.homeGoals ?? 0);
      const ab = isHome ? (result.awayBehinds ?? 0) : (result.homeBehinds ?? 0);
      pushTeamStatsFromResult(c, hg, hb, ag, ab, playerWon, drewFinal);
      c.news = [{ week: c.week, type: playerWon ? 'win' : 'loss',
        text: playerWon
          ? `✅ ${roundLabel} WIN! ${myScore} def ${opp?.short} ${oppScore}`
          : `❌ Eliminated in ${roundLabel}. ${opp?.short} ${oppScore} def ${myScore}` },
      ...c.news].slice(0, 15);
      c.inMatchDay = true;
      c.currentMatchResult = {
        ...result,
        isHome, opp,
        myTotal: myScore, oppTotal: oppScore,
        won: playerWon, drew: drewFinal,
        isPreseason: false, label: roundLabel, isAFL: league.tier === 1,
      };
      c.lastEvent = {
        type: 'round', round: roundLabel, date: c.currentDate || '', isHome, opp,
        result, myTotal: myScore, oppTotal: oppScore, won: playerWon, drew: drewFinal,
      };
    }
    c.finalsResults.push({ round: c.finalsRound, label: roundLabel, ...m });
  }

  if (sorted.length % 2 !== 0) newAlive.unshift(sorted[0]);

  c.finalsAlive = newAlive;
  c.finalsRound += 1;
  c.week += 1;
  return c;
}

function finishSeason(c, league) {
  const sorted = sortedLadder(c.ladder);
  const myPos = sorted.findIndex((r) => r.id === c.clubId) + 1;
  finalizeDynastyLadderAtSeasonEnd(c, myPos, sorted.length, league.tier);
  const myRow = sorted.find((r) => r.id === c.clubId) || {};
  let promoted = false; let relegated = false;

  const pName = (p) => (p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Unknown'));
  const byGoals = [...c.squad].sort((a, b) => (b.goals || 0) - (a.goals || 0));
  const byDisposals = [...c.squad].sort((a, b) => (b.disposals || 0) - (a.disposals || 0));
  const lineupSquad = c.squad.filter((p) => c.lineup.includes(p.id));
  const bafPlayer = [...lineupSquad].sort((a, b) => {
    const scoreA = (a.disposals || 0) / Math.max(1, a.gamesPlayed || 1);
    const scoreB = (b.disposals || 0) / Math.max(1, b.gamesPlayed || 1);
    return scoreB - scoreA;
  })[0] || null;
  const champion = c.premiership === c.season;
  const oldLeagueKey = c.leagueKey;
  const oldLeagueName = PYRAMID[oldLeagueKey]?.name || '';
  const oldLeagueShort = PYRAMID[oldLeagueKey]?.short || '';
  const endedTier = league.tier;
  const region = c.regionState ?? findClub(c.clubId)?.state;

  if (league.tier === 1) {
    c.fixtures = generateFixtures(league.clubs);
    c.ladder = blankLadder(league.clubs);
  } else if (league.tier === 2) {
    if (myPos === 1) {
      promoted = true;
      const newLeagueKey = pickPromotionLeague(league);
      if (newLeagueKey) {
        const newLeague = PYRAMID[newLeagueKey];
        c.leagueKey = newLeagueKey;
        c.localDivision = null;
        const clubs = newLeague.tier === 1 ? [...newLeague.clubs] : getCompetitionClubs(newLeagueKey, region, null);
        c.fixtures = generateFixtures(clubs);
        c.ladder = blankLadder(clubs);
      } else {
        const clubs = getCompetitionClubs(c.leagueKey, region, null);
        c.fixtures = generateFixtures(clubs);
        c.ladder = blankLadder(clubs);
      }
    } else if (myPos === sorted.length) {
      relegated = true;
      const newLeagueKey = pickRelegationLeague(league);
      if (newLeagueKey) {
        const newLeague = PYRAMID[newLeagueKey];
        c.leagueKey = newLeagueKey;
        c.localDivision = localDivisionForClub(c.clubId, newLeagueKey, region);
        const clubs = getCompetitionClubs(newLeagueKey, region, c.localDivision);
        c.fixtures = generateFixtures(clubs);
        c.ladder = blankLadder(clubs);
      } else {
        const clubs = getCompetitionClubs(c.leagueKey, region, null);
        c.fixtures = generateFixtures(clubs);
        c.ladder = blankLadder(clubs);
      }
    } else {
      const clubs = getCompetitionClubs(c.leagueKey, region, null);
      c.fixtures = generateFixtures(clubs);
      c.ladder = blankLadder(clubs);
    }
  } else if (league.tier === 3) {
    const K = tier3DivisionCount(c.leagueKey, region);
    let div = c.localDivision ?? localDivisionForClub(c.clubId, c.leagueKey, region);
    div = Math.max(1, Math.min(K, div));
    c.localDivision = div;
    if (champion) {
      if (div > 1) {
        promoted = true;
        c.localDivision = div - 1;
        const clubs = getCompetitionClubs(c.leagueKey, region, c.localDivision);
        c.fixtures = generateFixtures(clubs);
        c.ladder = blankLadder(clubs);
      } else {
        promoted = true;
        const newLeagueKey = pickPromotionLeague(league);
        if (newLeagueKey) {
          const newLeague = PYRAMID[newLeagueKey];
          c.leagueKey = newLeagueKey;
          c.localDivision = null;
          const clubs = getCompetitionClubs(newLeagueKey, region, null);
          c.fixtures = generateFixtures(clubs);
          c.ladder = blankLadder(clubs);
        } else {
          const clubs = getCompetitionClubs(c.leagueKey, region, div);
          c.fixtures = generateFixtures(clubs);
          c.ladder = blankLadder(clubs);
        }
      }
    } else {
      const clubs = getCompetitionClubs(c.leagueKey, region, div);
      c.fixtures = generateFixtures(clubs);
      c.ladder = blankLadder(clubs);
    }
  }

  c.seasonSummary = {
    season: c.season,
    leagueName: oldLeagueName,
    leagueShort: oldLeagueShort,
    leagueTier: league.tier,
    position: myPos,
    totalTeams: sorted.length,
    W: myRow.W || 0, L: myRow.L || 0, D: myRow.D || 0,
    pts: myRow.pts || 0,
    pct: Math.round(myRow.pct || 0),
    F: myRow.F || 0, A: myRow.A || 0,
    promoted, relegated, champion,
    topScorer: byGoals[0] ? { name: pName(byGoals[0]), goals: byGoals[0].goals || 0, games: byGoals[0].gamesPlayed || 0 } : null,
    topDisposal: byDisposals[0] ? { name: pName(byDisposals[0]), disposals: byDisposals[0].disposals || 0, games: byDisposals[0].gamesPlayed || 0 } : null,
    baf: bafPlayer ? { name: pName(bafPlayer), overall: bafPlayer.overall, games: bafPlayer.gamesPlayed || 0 } : null,
  };
  c.showSeasonSummary = true;

  const brownlowEntries = Object.entries(c.brownlow || {}).sort((a, b) => b[1] - a[1]);
  let brownlowWinner = null;
  if (brownlowEntries.length > 0) {
    const [winnerId, votes] = brownlowEntries[0];
    const player = c.squad.find((p) => p.id === winnerId);
    if (player) {
      brownlowWinner = { name: pName(player), votes, position: player.position };
    }
  }
  c.seasonSummary = {
    ...c.seasonSummary,
    brownlow: brownlowWinner,
  };

  const youthMet = youthSeniorGameCount(c.squad);
  ensureCareerBoard(c, findClub(c.clubId), league);
  const objLines = resolveBoardObjectivesAtSeasonEnd(c, {
    myPos,
    cash: c.finance.cash,
    youthCount: youthMet,
    champion,
  });
  if (objLines.length) {
    c.news = [...objLines.map((text) => ({ week: 0, type: 'info', text })), ...(c.news || [])].slice(0, 25);
  }

  c.season += 1;
  c.week = 0;
  const newLeagueTier = PYRAMID[c.leagueKey]?.tier || league.tier;
  const newTierScale = TIER_SCALE[newLeagueTier] || 1.0;

  const previousQueue = (c.pendingRenewals || []).filter((r) => !r._handled || r._handled === 'rejected');
  const walkingFromQueue = new Set(previousQueue.map((r) => r.playerId));
  c.squad = c.squad.map((p) => (walkingFromQueue.has(p.id) ? { ...p, _walking: true } : p));

  const retiredThisYear = [];
  c.squad = c.squad.map((p) => {
    const newAge = p.age + 1;
    const decline = newAge >= 30 ? rand(2, 6) : newAge >= 27 ? rand(0, 3) : newAge <= 22 ? -rand(2, 6) : 0;
    const newTrue = clamp((p.trueRating || p.overall) - Math.round(decline * (TIER_SCALE[p.tier || 2] || 1.0)), 25, 99);
    const newOverall = clamp(Math.round(newTrue / newTierScale) - (newLeagueTier < (p.tier || league.tier) ? rand(0, 3) : 0), 30, 99);
    return {
      ...p, age: newAge, overall: newOverall, trueRating: newTrue, tier: newLeagueTier,
      contract: Math.max(0, p.contract - 1), form: rand(50, 80), fitness: rand(85, 100),
      goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0,
      suspended: 0, seasonsAtClub: (p.seasonsAtClub || 0) + 1,
    };
  });
  const survivors = c.squad.filter((p) => !p._walking && p.age <= 36 && p.contract > 0);
  const leavers = c.squad.filter((p) => p._walking || p.age > 36 || p.contract <= 0);
  leavers.forEach((p) => {
    retiredThisYear.push({
      id: p.id,
      name: p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Player'),
      age: p.age,
      reason: p._walking ? 'walked' : p.age > 36 ? 'retired' : 'released',
      career: { goals: p.goals || 0, gamesPlayed: p.gamesPlayed || 0 },
    });
  });
  c.squad = survivors;
  c.retiredThisSeason = retiredThisYear;
  c.staff = (c.staff || []).map((s) => ({ ...s, contract: Math.max(0, (s.contract ?? 0) - 1) }));
  c.pendingStaffRenewals = buildStaffRenewalQueue(c.staff);
  c.aiSquads = ageAiSquads(c.aiSquads || {}, newLeagueTier, c.season);
  seedRng(c.season * 999 + 17);
  c.draftPool = Array.from({ length: 60 }, (_, i) =>
    withDraftScoutingDefaults(
      generatePlayer(2, 9000 + i + c.season * 100, { clubId: 'draft', season: c.season }),
    ),
  );
  c.tradePool = generateTradePool(c.leagueKey, c.season);
  const compClubsDraft = competitionClubsForCareer(c);
  const draftBase = compClubsDraft.length ? compClubsDraft : (PYRAMID[c.leagueKey]?.clubs || []);
  const draftOrder = sortedLadder(c.ladder.length ? c.ladder : blankLadder(draftBase))
    .slice().reverse().map((r) => r.id);
  c.draftOrder = draftOrder.map((clubId, i) => ({ pick: i + 1, clubId, used: false }));

  c.history = c.history || [];
  c.history.push({
    season: c.season - 1,
    leagueKey: oldLeagueKey,
    leagueShort: oldLeagueShort,
    position: myPos,
    W: myRow.W || 0, L: myRow.L || 0, D: myRow.D || 0,
    pts: myRow.pts || 0,
    pct: Math.round(myRow.pct || 0),
    promoted, relegated, champion,
    topScorer: byGoals[0] ? { name: pName(byGoals[0]), goals: byGoals[0].goals || 0 } : null,
    brownlow: brownlowWinner,
  });
  c.brownlow = {};
  c.boardWarning = 0;

  const games = (myRow.W || 0) + (myRow.L || 0) + (myRow.D || 0);
  const winRate = games > 0 ? (myRow.W || 0) / games : 0;
  c.coachReputation = applyEndOfSeasonReputation(c.coachReputation, {
    premiership: champion,
    finals: myPos <= 4,
    promoted, relegated, winRate,
  });
  c.coachTier = coachTierFromScore(c.coachReputation);
  c.coachStats = {
    ...c.coachStats,
    totalWins: (c.coachStats?.totalWins || 0) + (myRow.W || 0),
    totalLosses: (c.coachStats?.totalLosses || 0) + (myRow.L || 0),
    totalDraws: (c.coachStats?.totalDraws || 0) + (myRow.D || 0),
    premierships: (c.coachStats?.premierships || 0) + (champion ? 1 : 0),
    promotions: (c.coachStats?.promotions || 0) + (promoted ? 1 : 0),
    relegations: (c.coachStats?.relegations || 0) + (relegated ? 1 : 0),
    seasonsManaged: (c.coachStats?.seasonsManaged || 1) + 1,
  };

  c.groundCondition = recoverGroundPreseason(c.groundCondition ?? 85);
  c.weeklyWeather = {};

  c.footyTripUsed = false;
  c.footyTripAvailable = false;

  const prizeArgs = {
    premiership: champion, runnerUp: !champion && myPos === 2,
    finals: myPos >= 3 && myPos <= 4, woodenSpoon: myPos === sorted.length,
  };
  const prize = applyPrizeMoney(c, prizeArgs);
  c.finance.cash = prize.cash;
  if (prize.events.length > 0) {
    prize.events.forEach((evp) => {
      c.news = [{ week: 0, type: evp.amount >= 0 ? 'win' : 'loss',
        text: `💰 ${evp.label}: ${evp.amount >= 0 ? '+' : ''}${fmtK(evp.amount)}` },
      ...(c.news || [])].slice(0, 20);
    });
  }

  const newTier = PYRAMID[c.leagueKey]?.tier ?? league.tier;
  let rippleSummary = null;
  if (promoted || relegated) {
    const prevConf = c.finance.boardConfidence;
    const ripple = applyPromotionRipple(c, { promoted, relegated, newTier });
    c.sponsors = ripple.sponsors;
    c.finance = { ...c.finance, ...ripple.finance };
    const confDelta = (c.finance.boardConfidence ?? 0) - (prevConf ?? 0);
    if (confDelta) {
      ensureCareerBoard(c, findClub(c.clubId), PYRAMID[c.leagueKey] || league);
      applyBoardConfidenceDelta(c, confDelta);
    }
    rippleSummary = { promoted, relegated, sponsorMult: promoted ? 1.30 : 0.50 };
  }

  const sponsorTick = tickSponsorYears(c.sponsors || []);
  c.sponsors = sponsorTick.active;
  c.expiredSponsorsLastSeason = sponsorTick.expired;
  sponsorTick.expired.forEach((s) => {
    c.news = [{ week: 0, type: 'loss', text: `📉 Sponsor ${s.name} did not renew their deal (${fmtK(s.annualValue)}/yr)` }, ...(c.news || [])].slice(0, 25);
  });
  c.sponsorRenewalProposals = c.sponsors.filter((s) => (s.yearsLeft ?? 0) === 1).map((s) => proposalForRenewal(s, c));
  const minSponsors = newTier === 1 ? 4 : newTier === 2 ? 2 : 1;
  if (c.sponsors.length < minSponsors) {
    const backfill = generateSponsorOffers(c, newTier, minSponsors - c.sponsors.length + 1);
    c.sponsorOffers = backfill;
  }

  const beforeBudget = c.finance.transferBudget ?? 0;
  c.finance.transferBudget = refillTransferBudget(c);
  const budgetChange = c.finance.transferBudget - beforeBudget;

  c.finance.annualIncome = recomputeAnnualIncome(c);

  c.pendingRenewals = buildRenewalQueue(c);
  c.renewalsClosed = false;

  c.lastFinanceTickWeek = null;
  c.lastFinanceTickDay = null;
  c.weeklyHistory = [];
  c.cashCrisisStartWeek = c.finance.cash < 0 ? 0 : null;
  c.cashCrisisLevel = c.finance.cash < 0 ? 1 : 0;
  c.fundraisersUsed = {};
  c.communityGrantUsed = false;

  c.lastEosFinance = {
    prizeMoney: prize.events.reduce((a, e) => a + e.amount, 0),
    transferBudgetRefill: budgetChange,
    sponsorsExpired: sponsorTick.expired.length,
    sponsorsActive: c.sponsors.length,
    annualIncome: c.finance.annualIncome,
    annualNet: annualNetProjection(c),
    cashEnd: c.finance.cash,
    cashCrisis: c.cashCrisisLevel,
    ripple: rippleSummary,
  };

  retiredThisYear.slice(0, 4).forEach((r) => {
    c.news = [{ week: 0, type: 'info', text: `🏁 ${r.name} ${r.reason === 'retired' ? `retires at ${r.age}` : 'released after contract expired'} (${r.career.gamesPlayed} games, ${r.career.goals} goals)` }, ...(c.news || [])].slice(0, 20);
  });

  let eosHeadline;
  if (relegated) eosHeadline = `⬇️ Relegated. Finished ${myPos}/${sorted.length}.`;
  else if (promoted) {
    const nowLeague = PYRAMID[c.leagueKey];
    if (endedTier === 3 && champion && nowLeague?.tier === 3 && c.localDivision != null) {
      eosHeadline = `🏆 Premiers! Up to Division ${c.localDivision}.`;
    } else if (endedTier === 3 && champion && nowLeague?.tier === 2) {
      eosHeadline = `🏆 Premiers! Promoted to ${nowLeague?.name || 'state league'}.`;
    } else {
      eosHeadline = `🏆 Promoted! Finished ${myPos} in ${league.short}.`;
    }
  } else eosHeadline = `Season complete: finished ${myPos}/${sorted.length}`;
  c.news = [
    { week: 0, type: promoted ? 'win' : relegated ? 'loss' : 'draw', text: eosHeadline },
    ...c.news,
  ].slice(0, 20);
  if (brownlowWinner) {
    c.news = [{ week: 0, type: 'info', text: `🥇 Brownlow Medal: ${brownlowWinner.name} (${brownlowWinner.votes} votes)` }, ...c.news].slice(0, 20);
  }
  if (champion) bumpClubCulture(c, 15);
  c.crisisFiredThisSeason = false;
  const nextLeagueForCal = PYRAMID[c.leagueKey];
  const seasonClub = findClub(c.clubId);
  const regGround = getClubGround(seasonClub, c.facilities?.stadium?.level ?? 1, nextLeagueForCal.tier);
  c.clubGround = regGround;
  c.groundName = regGround.shortName;
  const calPool = competitionClubsForCareer(c);
  const calClubs = calPool.length ? calPool : nextLeagueForCal.clubs;
  c.eventQueue = generateSeasonCalendar(c.season, calClubs, c.fixtures, c.clubId);
  ensureCareerBoard(c, seasonClub, nextLeagueForCal);
  generateSeasonObjectives(c, nextLeagueForCal);
  planSeasonBoardMeetings(c);
  updateBoardObjectiveProgress(c, nextLeagueForCal);
  const dynClubCount =
    competitionClubsForCareer(c).length || calClubs.length || PYRAMID[c.leagueKey]?.clubs?.length || 12;
  assignDynastyQuestsForSeason(c, nextLeagueForCal?.tier ?? league.tier, dynClubCount);
  c.currentDate = `${c.season - 1}-12-01`;
  c.phase = 'preseason';
  c.lastEvent = null;
  c.inMatchDay = false;
  c.currentMatchResult = null;
  clearPostSeasonTransient(c);
  primeSeasonStoryState(c);
  return c;
}

export function primeSeasonStoryState(career) {
  const lg = PYRAMID[career.leagueKey];
  if (!lg) return;
  refreshTurningPointForNextFixture(career, lg);
}

/**
 * Advance the career one step (finals, trade period, draft countdown, or next calendar event).
 * @param {{ career: object, league: object, club: object, setCareer: function, setScreen: function }} ctx
 */
export function advanceCareerNextEvent({ career, league, club, setCareer, setScreen }) {
  const c = JSON.parse(JSON.stringify(career));

  ensureDynastyAssignments(c, league?.tier ?? 3, competitionClubsForCareer(c).length || (league?.clubs?.length ?? 0));

  if (c.inFinals) {
    advanceFinalsWeek(c, league);
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    return;
  }

  if (c.postSeasonPhase === 'trade_period' && c.inTradePeriod) {
    advanceTradePeriodDay(c, league, c.leagueKey);
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    return;
  }
  if (c.postSeasonPhase === 'draft_waiting') {
    const next = advanceDraftCountdown(c);
    if (next === 'finish_season') finishSeason(c, league);
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    return;
  }

  const anyIncomplete = (c.eventQueue || []).find((e) => !e.completed);
  if (!anyIncomplete) {
    const finalists = getFinalsTeams(c.ladder, league.tier);
    if (finalists.length >= 2) {
      startFinals(c, league);
    } else {
      beginPostSeasonTradePeriod(c, league, c.leagueKey);
    }
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    return;
  }

  const evIdx = (c.eventQueue || []).findIndex((e) => !e.completed);
  if (evIdx === -1) { setCareer(c); return; }
  const ev = c.eventQueue[evIdx];
  if (ev.phase === 'season') {
    applySeasonRenewalDeadline(c, league);
  }
  c.currentDate = ev.date;
  c.phase = ev.phase || 'preseason';
  c.eventQueue[evIdx] = { ...ev, completed: true };

  // Operating cashflow: one accrual per distinct calendar day (`tickWeeklyCashflow` uses `lastFinanceTickDay`).
  const financePulse = tickWeeklyCashflow(c);
  if (financePulse !== 0) {
    weeklyClubOperationsPulse(c, league?.tier ?? 3);
  }
  const prevCrisis = c.cashCrisisLevel ?? 0;
  c.cashCrisisLevel = cashCrisisLevel(c);
  if (c.cashCrisisLevel >= 1 && (c.cashCrisisStartWeek == null || c.cashCrisisStartWeek > c.week)) {
    c.cashCrisisStartWeek = c.week;
  }
  if (c.cashCrisisLevel > prevCrisis) {
    if (c.cashCrisisLevel === 1) {
      c.news = [{ week: c.week, type: 'loss', text: '🪙 Cash is in the red. The board is taking notice.' }, ...(c.news || [])].slice(0, 25);
    } else if (c.cashCrisisLevel === 2) {
      const top5 = (c.squad || []).slice().sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0)).slice(0, 5);
      const target = top5.length ? pick(top5) : null;
      if (target) {
        c.pendingTradeOffers = [...(c.pendingTradeOffers || []), {
          id: `forced_${Date.now()}_${rand(1, 1e9)}`,
          fromClubId: 'forced_sale',
          fromClubName: 'Emergency Sale',
          targetPlayerId: target.id,
          offerCash: Math.round((target.value || target.overall * 60_000) * 0.55),
          offerPlayerId: null,
          offerPlayerSnapshot: null,
          status: 'pending',
          createdAt: ev.date,
          isEmergency: true,
        }];
        c.news = [{ week: c.week, type: 'loss', text: `🚨 Emergency board meeting — bidders are circling ${target.firstName} ${target.lastName}. Sale offer in the Recruit tab.` }, ...(c.news || [])].slice(0, 25);
      }
    } else if (c.cashCrisisLevel === 3) {
      c.bankLoan = c.bankLoan || {
        principal: Math.max(0, -c.finance.cash) + 50_000,
        weeksRemaining: INSOLVENCY.bankLoanTermYears * 52,
        interestPerWeek: Math.round((Math.max(0, -c.finance.cash) + 50_000) * INSOLVENCY.bankLoanInterestRate / 52),
      };
      c.finance.cash += c.bankLoan.principal;
      if ((c.sponsors || []).length > 0) {
        const fleeing = pick(c.sponsors);
        c.sponsors = c.sponsors.filter((s) => s.id !== fleeing.id);
        c.news = [{ week: c.week, type: 'loss', text: `📉 ${fleeing.name} pulled their sponsorship — bad news travels fast.` }, ...(c.news || [])].slice(0, 25);
      }
      c.news = [{ week: c.week, type: 'info', text: `🏦 Bank loan accepted: $${(c.bankLoan.principal / 1000).toFixed(0)}k @ ${(INSOLVENCY.bankLoanInterestRate * 100).toFixed(0)}% over ${INSOLVENCY.bankLoanTermYears}y` }, ...(c.news || [])].slice(0, 25);
      ensureCareerBoard(c, findClub(c.clubId), league);
      applyBoardConfidenceDelta(c, -10);
    } else if (c.cashCrisisLevel === 4) {
      c.boardWarning = 99;
      c.news = [{ week: c.week, type: 'loss', text: '💀 The club is insolvent. The board is preparing to wind up your contract.' }, ...(c.news || [])].slice(0, 25);
    }
  }
  if (c.bankLoan && c.bankLoan.weeksRemaining > 0) {
    const repay = Math.round(c.bankLoan.principal / (INSOLVENCY.bankLoanTermYears * 52)) + (c.bankLoan.interestPerWeek || 0);
    c.finance.cash -= repay;
    c.bankLoan = { ...c.bankLoan, weeksRemaining: c.bankLoan.weeksRemaining - 1 };
    if (c.bankLoan.weeksRemaining <= 0) {
      c.news = [{ week: c.week, type: 'info', text: '🏦 Bank loan fully repaid.' }, ...(c.news || [])].slice(0, 25);
      c.bankLoan = null;
    }
  }

  if (ev.type === 'training') {
    const { squad, gains, staffName, staffRating, devNotes } = applyTraining(
      c.squad, c.lineup, ev.subtype, c.staff,
      {
        focus: c.training?.focus,
        intensity: c.training?.intensity,
        trainingLeadId: c.staffTasks?.trainingLeadId ?? null,
      },
    );
    c.squad = squad;

    const intensity = c.training?.intensity ?? 60;
    const recoveryFocus = c.training?.focus?.recovery ?? 20;
    const medLevel = c.facilities?.medical?.level ?? 1;
    const mit = medicalStaffMitigation(c.staff);
    const trainingInjuryProb = effectiveInjuryRate(c,
      Math.max(0, ((intensity - 50) * 0.0014) + 0.012 - medLevel * 0.005 - (recoveryFocus - 20) * 0.0008 - mit.probReduce));
    if (rng() < trainingInjuryProb && c.lineup.length > 0) {
      const injId = pick(c.lineup);
      const baseWeeks = rand(1, 2);
      const weeks = Math.max(1, baseWeeks - Math.max(0, medLevel - 1) - mit.weekReduce);
      c.squad = c.squad.map((p) => (p.id === injId ? { ...p, injured: weeks } : p));
      const injPlayer = c.squad.find((p) => p.id === injId);
      if (injPlayer) {
        c.news = [{ week: c.week, type: 'loss', text: `🩹 ${injPlayer.firstName} ${injPlayer.lastName} pulled up sore at training (${weeks}w)` }, ...(c.news || [])].slice(0, 20);
      }
    }

    const recoveryBoost = Math.round((recoveryFocus - 20) * 0.05);
    if (recoveryBoost > 0) {
      c.squad = c.squad.map((p) => ({ ...p, fitness: clamp((p.fitness ?? 90) + recoveryBoost, 30, 100) }));
    }

    applyCaptainWeeklyEffect(c, c.difficulty);

    if (league.tier === 3 && rng() < 0.18) {
      const keys = Object.keys(FUNDRAISERS);
      const eligible = keys.filter((k) => !((c.fundraisersUsed?.[k]) >= 2));
      if (eligible.length > 0) {
        const kind = pick(eligible);
        const def = FUNDRAISERS[kind];
        const income = rand(def.min, def.max);
        c.finance.cash += income;
        c.fundraisersUsed = { ...(c.fundraisersUsed || {}), [kind]: ((c.fundraisersUsed || {})[kind] || 0) + 1 };
        c.news = [{ week: c.week, type: 'info', text: `🎟️ ${def.labelEvent} raised $${income} for the club. Volunteers, you legends.` }, ...(c.news || [])].slice(0, 25);
      }
    }
    if (league.tier === 3 && !c.communityGrantUsed && (c.finance?.boardConfidence ?? 0) >= COMMUNITY_GRANT.boardConfidenceFloor && rng() < 0.06) {
      const grant = rand(COMMUNITY_GRANT.min, COMMUNITY_GRANT.max);
      c.finance.cash += grant;
      c.communityGrantUsed = true;
      c.news = [{ week: c.week, type: 'win', text: `🤝 Community grant approved: +$${grant.toLocaleString()}. The council came through.` }, ...(c.news || [])].slice(0, 25);
    }

    const info = TRAINING_INFO[ev.subtype] || {};
    c.lastEvent = {
      type: 'training', subtype: ev.subtype, name: info.name || ev.subtype, date: ev.date, gains, staffName, staffRating, devNotes, intensity,
    };
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    setScreen('hub');
    return;
  }

  if (ev.type === 'key_event') {
    const extraNews = [];
    if (ev.name === 'Transfer Window Opens') {
      const comp = competitionClubsForCareer(c);
      const aiClubs = (comp.length ? comp : (league.clubs || [])).filter((cl) => cl.id !== c.clubId).slice(0, 4);
      aiClubs.forEach((cl) => {
        const pool = c.tradePool || [];
        const target = pool[rand(0, Math.max(0, pool.length - 1))];
        if (target) extraNews.push({ week: c.week, type: 'info', text: `🔀 ${cl.name} linked with ${target.firstName} ${target.lastName} (${target.overall} OVR)` });
      });

      const tradableSquad = c.squad.filter((p) => p.contract > 0 && p.overall >= 65 && !c.lineup.slice(0, 5).includes(p.id) && !playerBlockedFromTrade(p, c.season));
      const offerCount = Math.min(tradableSquad.length, rand(2, 4));
      const offerPool = competitionClubsForCareer(c);
      const offerClubs = (offerPool.length ? offerPool : (league.clubs || [])).filter((cl) => cl.id !== c.clubId);
      const offers = [];
      for (let i = 0; i < offerCount; i++) {
        const targetPlayer = pick(tradableSquad);
        const offeringClub = pick(offerClubs);
        if (!targetPlayer || !offeringClub || offers.find((o) => o.targetPlayerId === targetPlayer.id)) continue;
        const cashOffer = Math.round(targetPlayer.value * (0.5 + rng() * 0.6));
        const aiSq = c.aiSquads?.[offeringClub.id] || [];
        const swapCandidates = aiSq.filter((ap) => Math.abs(ap.overall - targetPlayer.overall) <= 8).slice(0, 5);
        const swapPlayer = swapCandidates.length ? pick(swapCandidates) : null;
        offers.push({
          id: `offer_${Date.now()}_${i}_${rand(1, 1e9)}`,
          fromClubId: offeringClub.id,
          fromClubName: offeringClub.name,
          targetPlayerId: targetPlayer.id,
          offerCash: cashOffer,
          offerPlayerId: swapPlayer?.id || null,
          offerPlayerSnapshot: swapPlayer ? { id: swapPlayer.id, firstName: swapPlayer.firstName, lastName: swapPlayer.lastName, overall: swapPlayer.overall, position: swapPlayer.position, secondaryPosition: swapPlayer.secondaryPosition ?? null, age: swapPlayer.age, wage: swapPlayer.wage } : null,
          status: 'pending',
          createdAt: ev.date,
        });
      }
      c.pendingTradeOffers = [...(c.pendingTradeOffers || []), ...offers];
      syncTradePeriodManagerInboxRow(c);
      if (offers.length > 0) {
        extraNews.push({ week: c.week, type: 'info', text: `📨 ${offers.length} new trade offer${offers.length > 1 ? 's' : ''} on the table — check the Trades screen.` });
      }
    }
    if (ev.name === 'Transfer Window Closes') {
      if (!c.footyTripUsed && league.tier <= 3 && (c.committee || []).length > 0) {
        c.footyTripAvailable = true;
        const social = (c.committee || []).find((m) => m.role === 'Social Coordinator');
        const tripMsg = committeeMessage(c, 'Social Coordinator', 'propose_trip');
        if (tripMsg) extraNews.push({ week: c.week, ...tripMsg });
        else if (social) extraNews.push({ week: c.week, type: 'committee', text: `🚌 ${social.name} is proposing the annual footy trip. Approve a destination in the Club tab.` });
      }
      c.tradePool = generateTradePool(c.leagueKey, c.season + ev.date.slice(0, 4) * 0);
      const stale = (c.pendingTradeOffers || []).filter((o) => o.status === 'pending');
      if (stale.length > 0) {
        extraNews.push({ week: c.week, type: 'info', text: `📨 ${stale.length} trade offer${stale.length > 1 ? 's' : ''} expired with the window.` });
      }
      c.pendingTradeOffers = (c.pendingTradeOffers || []).filter((o) => o.status !== 'pending');
      syncTradePeriodManagerInboxRow(c);
      const pool2 = competitionClubsForCareer(c);
      const aiClubs2 = (pool2.length ? pool2 : (league.clubs || [])).filter((cl) => cl.id !== c.clubId).slice(0, 3);
      aiClubs2.forEach((cl) => {
        extraNews.push({ week: c.week, type: 'info', text: `✍️ ${cl.name} complete their pre-season recruitment` });
      });
    }
    c.lastEvent = { type: 'key_event', name: ev.name, description: ev.description, action: ev.action, date: ev.date };
    c.news = [
      { week: c.week, type: 'info', text: `📅 ${ev.name}: ${ev.description}` },
      ...extraNews,
      ...(c.news || []),
    ].slice(0, 20);
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    setScreen('hub');
    return;
  }

  if (ev.type === 'preseason_match') {
    const isHome = ev.homeId === c.clubId;
    const oppId = isHome ? ev.awayId : ev.homeId;
    const opp = findClub(oppId);
    c.aiSquads = ensureSquadsForLeague(c, league);
    const oppSquad = c.aiSquads?.[oppId];
    const oppLineup = oppSquad ? selectAiLineup(oppSquad) : [];
    const myRating = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff));
    const oppRating = oppSquad?.length
      ? teamRating(oppSquad, oppLineup.map((p) => p.id), { intensity: 60, focus: {} }, 1, 60)
      : aiClubRating(oppId, league.tier);
    const playerClub = findClub(c.clubId);
    const result = simMatchWithQuarters(
      { rating: isHome ? myRating : oppRating },
      { rating: isHome ? oppRating : myRating },
      isHome, myRating,
      { homeFixtureAdvantage: resolveHomeAdvantageForFixture(c, league, isHome, playerClub, opp) },
    );
    const myTotal = isHome ? result.homeTotal : result.awayTotal;
    const oppTotal = isHome ? result.awayTotal : result.homeTotal;
    const won = myTotal > oppTotal;
    const drew = myTotal === oppTotal;

    c.squad = c.squad.map((p) => {
      if (!c.lineup.includes(p.id)) return p;
      const fitDrop = rand(5, 12);
      const formChange = won ? rand(1, 4) : drew ? rand(-1, 2) : rand(-3, 1);
      const gAdd = isForwardPreferred(p) ? rand(0, 2) : 0;
      return {
        ...p, fitness: clamp(p.fitness - fitDrop, 30, 100), form: clamp(p.form + formChange, 30, 100),
        goals: p.goals + gAdd, behinds: p.behinds + rand(0, 1), disposals: p.disposals + rand(6, 18),
        marks: p.marks + rand(1, 4), tackles: p.tackles + rand(1, 3), gamesPlayed: p.gamesPlayed + 1,
      };
    });
    const preBase = `${ev.label}: ${isHome ? 'vs' : '@'} ${opp?.short} ${myTotal}–${oppTotal} (${won ? 'W' : drew ? 'D' : 'L'})`;
    const preFlavor = won ? pick(ROUND_REPORT_WIN_CLOSERS) : drew ? pick(ROUND_REPORT_DRAW_CLOSERS) : pick(ROUND_REPORT_LOSS_CLOSERS);
    c.news = [{ week: 0, type: won ? 'win' : drew ? 'draw' : 'loss',
      text: `${preBase} ${preFlavor}` }, ...(c.news || [])].slice(0, 15);
    c.lastEvent = {
      type: 'preseason_match', label: ev.label, date: ev.date, isHome, opp, result, myTotal, oppTotal, won, drew,
    };
    c.inMatchDay = true;
    c.currentMatchResult = { ...result, isHome, opp, myTotal, oppTotal, won, drew, isPreseason: true, label: ev.label, isAFL: league.tier === 1 };
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    return;
  }

  if (ev.type === 'round') {
    const round = ev.matches || [];
    const myMatch = round.find((m) => m.home === c.clubId || m.away === c.clubId);
    let myResult = null;

    c.aiSquads = ensureSquadsForLeague(c, league);

    let turningPointPlayedThisRound = null;
    round.forEach((m) => {
      if (m.home === c.clubId || m.away === c.clubId) {
        const isHome = m.home === c.clubId;
        const opp = findClub(isHome ? m.away : m.home);
        turningPointPlayedThisRound = m.turningPoint || null;
        let myRating = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff));
        myRating += getCaptainMatchBonus(c, false);
        const oppSquad = c.aiSquads?.[opp.id];
        const oppLineup = oppSquad ? selectAiLineup(oppSquad) : [];
        const oppLineupIds = oppLineup.map((p) => p.id);
        const neutralTraining = { intensity: 60, focus: {} };
        const oppRating = oppSquad?.length
          ? teamRating(oppSquad, oppLineupIds, neutralTraining, 1, 60)
          : aiClubRating(opp.id, league.tier);
        const playerLineup = c.lineup.map((id) => c.squad.find((p) => p.id === id)).filter(Boolean);
        const oppTactic = oppRating > myRating + 4 ? 'attack' : oppRating < myRating - 4 ? 'defensive' : 'balanced';
        let groundScoringMod = 1.0; let groundAccuracyMod = 1.0;
        if (isHome) {
          const band = groundConditionBand(c.groundCondition ?? 85);
          groundScoringMod = band.scoringMod;
          groundAccuracyMod = band.accuracyMod;
        }
        const getPlayerStrengthForQuarter = (qi) =>
          teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff), qi);
        const getOppStrengthForQuarter = oppSquad?.length
          ? (qi) => teamRating(oppSquad, oppLineupIds, neutralTraining, 1, 60, qi)
          : null;
        const result = simMatchWithQuarters(
          { rating: isHome ? myRating : oppRating },
          { rating: isHome ? oppRating : myRating },
          isHome, myRating,
          {
            tactic: c.tacticChoice || 'balanced', playerLineup, oppLineup, oppTactic, groundScoringMod, groundAccuracyMod,
            getPlayerStrengthForQuarter,
            ...(getOppStrengthForQuarter ? { getOppStrengthForQuarter } : {}),
            homeFixtureAdvantage: resolveHomeAdvantageForFixture(
              c, league, isHome, findClub(c.clubId), opp,
            ),
          },
        );
        const myTotal = isHome ? result.homeTotal : result.awayTotal;
        const oppTotal = isHome ? result.awayTotal : result.homeTotal;
        const won = myTotal > oppTotal;
        const drew = myTotal === oppTotal;
        c.ladder = applyResultToLadder(c.ladder, m.home, m.away, result.homeTotal, result.awayTotal);
        m.result = { hScore: result.homeTotal, aScore: result.awayTotal };
        myResult = { isHome, opp, result, myTotal, oppTotal, won, drew };

        const attribution = result.goalAttribution || {};
        c.squad = c.squad.map((p) => {
          if (!c.lineup.includes(p.id)) return p;
          const fitDrop = rand(8, 18);
          const formChange = won ? rand(2, 6) : drew ? rand(-2, 2) : rand(-6, -1);
          const att = attribution[p.id] || { goals: 0, behinds: 0 };
          const dispAdd = isMidPreferred(p) ? rand(15, 32) : rand(8, 22);
          return {
            ...p, fitness: clamp(p.fitness - fitDrop, 30, 100), form: clamp(p.form + formChange, 30, 100),
            goals: p.goals + (att.goals || 0), behinds: p.behinds + (att.behinds || 0), disposals: p.disposals + dispAdd,
            marks: p.marks + rand(2, 7), tackles: p.tackles + rand(1, 5), gamesPlayed: p.gamesPlayed + 1,
          };
        });

        const intensity = c.training?.intensity ?? 60;
        const medLevel = c.facilities?.medical?.level ?? 1;
        const recoveryFocus = c.training?.focus?.recovery ?? 20;
        const mit = medicalStaffMitigation(c.staff);
        const baseInjuryProb =
          0.12 + (intensity - 50) * 0.002 - medLevel * 0.012 - (recoveryFocus - 20) * 0.001 - mit.probReduce;
        const injuryProb = effectiveInjuryRate(c, clamp(baseInjuryProb, 0.04, 0.28));
        (result.injuredPlayerIds || []).forEach((pid) => {
          if (!c.lineup.includes(pid)) return;
          const baseWeeks = rand(1, 4);
          const weeks = Math.max(1, baseWeeks - Math.max(0, medLevel - 1) - mit.weekReduce);
          c.squad = c.squad.map((p) => (p.id === pid ? { ...p, injured: weeks } : p));
        });
        if (rng() < injuryProb && c.lineup.length > 0) {
          const injId = pick(c.lineup);
          const baseWeeks = rand(1, 4);
          const weeks = Math.max(1, baseWeeks - Math.max(0, medLevel - 1) - mit.weekReduce);
          c.squad = c.squad.map((p) => (p.id === injId ? { ...p, injured: weeks } : p));
        }
        (result.reportedPlayerIds || []).forEach((pid) => {
          if (rng() < 0.35) {
            const weeks = rand(1, 3);
            c.squad = c.squad.map((p) => (p.id === pid ? { ...p, suspended: (p.suspended || 0) + weeks } : p));
            const player = c.squad.find((p) => p.id === pid);
            if (player) {
              c.news = [{ week: c.week, type: 'loss', text: `⚖️ ${player.firstName} ${player.lastName} suspended ${weeks} match${weeks > 1 ? 'es' : ''} at the tribunal` }, ...(c.news || [])].slice(0, 20);
            }
          }
        });

        c.brownlow = c.brownlow || {};
        (result.votes || []).forEach((v) => {
          c.brownlow[v.playerId] = (c.brownlow[v.playerId] || 0) + v.votes;
        });
      } else {
        const r1 = aiVsAiTeamRating(c, league, m.home);
        const r2 = aiVsAiTeamRating(c, league, m.away);
        const weatherTag = typeof c.weeklyWeather?.[ev.round] === 'string' ? c.weeklyWeather[ev.round] : 'fine';
        const homeAdvAi = homeAdvantageAiHome(
          league,
          getClubGround(findClub(m.home), 3, league.tier),
          !!c.inFinals,
          weatherTag,
        );
        const result = simMatch({ rating: r1 }, { rating: r2 }, false, r2, homeAdvAi);
        c.ladder = applyResultToLadder(c.ladder, m.home, m.away, result.homeTotal, result.awayTotal);
        m.result = { hScore: result.homeTotal, aScore: result.awayTotal };
      }
    });

    ensureCareerBoard(c, findClub(c.clubId), league);
    updateBoardObjectiveProgress(c, league);

    c.aiSquads = tickAiSquads(c.aiSquads || {});
    c.squad = c.squad.map((p) => {
      const susp = Math.max(0, (p.suspended || 0) - 1);
      return susp !== (p.suspended || 0) ? { ...p, suspended: susp } : p;
    });

    c.squad = c.squad.map((p) => {
      if (c.lineup.includes(p.id)) return p;
      return { ...p, fitness: clamp(p.fitness + rand(8, 14), 30, 100), injured: Math.max(0, p.injured - 1) };
    });

    const isHomeMatch = myMatch && myMatch.home === c.clubId;
    if (isHomeMatch) {
      const stadiumLevel = c.facilities.stadium.level;
      const baseAtt = BASE_ATTENDANCE[league.tier] ?? 600;
      const att = Math.round(baseAtt * (0.6 + stadiumLevel * 0.15) * (0.7 + c.finance.fanHappiness / 200));
      const ticketRev = Math.round(att * (TICKET_PRICE[league.tier] ?? 10));
      c.finance.cash += ticketRev;
      if (Array.isArray(c.weeklyHistory) && c.weeklyHistory.length > 0) {
        const last = c.weeklyHistory[c.weeklyHistory.length - 1];
        c.weeklyHistory[c.weeklyHistory.length - 1] = {
          ...last,
          profit: (last.profit ?? 0) + ticketRev,
          cash: c.finance.cash,
          ticketRev,
          attendance: att,
        };
      }
    }

    const cfg = getDifficultyConfig(c.difficulty);
    const winBump = Math.max(2, Math.abs(cfg.boardLossConfidence) - 1);
    const lossDrop = cfg.boardLossConfidence;
    const drawDelta = 0;
    const prevBoard = c.finance.boardConfidence;
    let boardDelta;
    if (myResult) {
      applyMatchStreaks(c, myResult.won, myResult.drew, myResult.isHome);
      boardDelta = myResult.won ? winBump : myResult.drew ? drawDelta : lossDrop;
      c.finance.fanHappiness = clamp(c.finance.fanHappiness + (myResult.won ? 3 : myResult.drew ? 0 : -2), 10, 100);
      ensureCareerBoard(c, findClub(c.clubId), league);
      applyBoardConfidenceDelta(c, boardDelta);
      c.lastBoardConfidenceDelta = c.finance.boardConfidence - prevBoard;
      if (myResult.won) dynastyRecordHomeAwayWin(c);
      const rdBase = `Rd ${ev.round}: ${myResult.isHome ? 'vs' : '@'} ${myResult.opp?.short} ${myResult.myTotal}–${myResult.oppTotal} (${myResult.won ? 'W' : myResult.drew ? 'D' : 'L'})`;
      const rdFlavor = myResult.won ? pick(ROUND_REPORT_WIN_CLOSERS) : myResult.drew ? pick(ROUND_REPORT_DRAW_CLOSERS) : pick(ROUND_REPORT_LOSS_CLOSERS);
      c.news = [{ week: ev.round, type: myResult.won ? 'win' : myResult.drew ? 'draw' : 'loss',
        text: `${rdBase} ${rdFlavor}` },
      ...(c.news || [])].slice(0, 12);

      if (c.journalist) {
        c.journalist = { ...c.journalist, satisfaction: clamp((c.journalist.satisfaction ?? 50) + (myResult.won ? 2 : myResult.drew ? 0 : -3), 0, 100) };
      }

      c.committee = bumpCommitteeMood(c.committee, 'President', myResult.won ? 3 : myResult.drew ? 0 : -2);
      if (myResult.won) {
        const presMsg = committeeMessage(c, 'President', 'win');
        if (presMsg) c.news = [{ week: ev.round, ...presMsg }, ...(c.news || [])].slice(0, 20);
      }

      if (myResult.isHome) {
        const fundraiser = postMatchFundraiser(c, league.tier, true);
        if (fundraiser) {
          c.finance.cash += fundraiser.income;
          c.news = [{ week: ev.round, ...fundraiser.news }, ...(c.news || [])].slice(0, 20);
          if (fundraiser.moralePlayerId) {
            c.squad = c.squad.map((p) => (p.id === fundraiser.moralePlayerId
              ? { ...p, morale: clamp((p.morale ?? 70) + fundraiser.moraleDelta, cfg.moraleFloor, 100) } : p));
          }
        }
      }

      const oppId = myResult.opp?.id;
      if (oppId) {
        const wasBogey = c.bogeyTeamId === oppId;
        const prevStreak = c.headToHead?.[oppId]?.streak ?? 0;
        const diff = myResult.myTotal - myResult.oppTotal;
        const lbl = `${myResult.won ? 'W' : myResult.drew ? 'D' : 'L'} ${Math.abs(diff)}pt`;
        recordHeadToHead(c, oppId, myResult.won, myResult.drew, diff, lbl);
        celebrateBogeyBreakIfNeeded(c, oppId, myResult.won, wasBogey, prevStreak, findClub);
      }
      const hg = myResult.isHome ? (myResult.result?.homeGoals ?? 0) : (myResult.result?.awayGoals ?? 0);
      const hb = myResult.isHome ? (myResult.result?.homeBehinds ?? 0) : (myResult.result?.awayBehinds ?? 0);
      const ag = myResult.isHome ? (myResult.result?.awayGoals ?? 0) : (myResult.result?.homeGoals ?? 0);
      const ab = myResult.isHome ? (myResult.result?.awayBehinds ?? 0) : (myResult.result?.homeBehinds ?? 0);
      pushTeamStatsFromResult(c, hg, hb, ag, ab, myResult.won, myResult.drew);

      if (turningPointPlayedThisRound === 'must_win') {
        ensureCareerBoard(c, findClub(c.clubId), league);
        applyBoardConfidenceDelta(c, myResult.won ? 5 : myResult.drew ? 0 : -8);
      } else if (turningPointPlayedThisRound === 'undefeated_run') {
        if (!myResult.won && !myResult.drew) {
          c.squad = c.squad.map((p) => ({ ...p, morale: clamp((p.morale ?? 70) - 2, cfg.moraleFloor, 100) }));
        }
      } else if (turningPointPlayedThisRound === 'bogey_buster' && myResult.won) {
        bumpClubCulture(c, 2);
      }
    }

    if (myResult && myResult.isHome) {
      const weather = ensureWeatherForWeek(c, ev.round);
      c.groundCondition = applyGroundDegradation(c.groundCondition ?? 85, weather, c.facilities?.stadium ?? 1);
    }

    const inBoardCrisis = c.boardCrisis?.phase === 'active';
    const sackPatience = cfg.boardPatienceSeasons === 1 ? 1 : 2;
    const sandbox = c.gameMode === 'sandbox';
    if (sandbox) {
      c.boardWarning = 0;
    } else {
    if (!inBoardCrisis) {
      if (c.finance.boardConfidence <= 0) {
        c.boardWarning = sackPatience;
      } else if (c.finance.boardConfidence <= 10) {
        c.boardWarning = (c.boardWarning || 0) + 1;
      }
    }
    if (!c.isSacked && !inBoardCrisis) {
      const prepLine = maybeEnqueueBoardCrisisPrep(c, league, sackPatience, c.boardWarning || 0);
      if (prepLine) {
        c.news = [{ week: ev.round, type: 'board', text: prepLine }, ...(c.news || [])].slice(0, 20);
      }
    }
    if ((c.boardWarning || 0) >= sackPatience && !c.isSacked && !inBoardCrisis) {
      const instantSack = c.finance.boardConfidence <= 0 || (c.boardWarning || 0) >= 99;
      if (instantSack) {
        triggerSackState(c, club.name, ev.round);
      } else {
        c.boardCrisis = { phase: 'active', step: 0 };
        if (c.board) c.board.voteScheduled = true;
        c.news = [{ week: ev.round, type: 'loss', text: '📋 Emergency board meeting: a vote of confidence is underway. Address the chair before play continues.' }, ...(c.news || [])].slice(0, 20);
      }
    } else if (!inBoardCrisis && c.finance.boardConfidence > 30) {
      c.boardWarning = 0;
    } else if (!inBoardCrisis && c.finance.boardConfidence <= 20) {
      c.news = [{ week: ev.round, type: 'loss', text: '⚠️ Board confidence is critical — your job is on the line.' }, ...(c.news || [])].slice(0, 20);
    }
    }

    c.week = ev.round;
    if (ev.phase === 'season') {
      refreshTurningPointForNextFixture(c, league);
      refreshCrucialFive(c, league, ev.round);
    }
    c.lastEvent = myResult ? { type: 'round', round: ev.round, date: ev.date, ...myResult } : null;

    if (ev.phase === 'season' && !c.isSacked && c.boardCrisis?.phase !== 'active') {
      const due = findDueBoardMeetingSlot(c, c.week);
      if (due) {
        c.boardMeetingBlocking = openBoardMeetingBlockingFromSlot(due, league.tier);
      }
    }

    if (ev.phase === 'season' && myResult && !c.isSacked) {
      const comms = maybeEnqueueBoardMessage(c, league);
      if (comms) {
        c.news = [{ week: ev.round, type: 'board', text: comms }, ...(c.news || [])].slice(0, 20);
      }
    }

    if (ev.phase === 'season' && myResult && !c.isSacked) {
      const cap = effectiveWageCap(c);
      const wages = currentPlayerWageBill(c);
      if (cap > 0 && wages > cap && (c.capBreachedBoardNoteSeason ?? null) !== c.season) {
        c.capBreachedBoardNoteSeason = c.season;
        ensureCareerBoard(c, findClub(c.clubId), league);
        applyBoardConfidenceDelta(c, -2);
        c.news = [{ week: ev.round, type: 'board', text: '⚖️ Player wages are above the effective salary cap. The board wants a tighter list or discipline on renewals.' }, ...(c.news || [])].slice(0, 25);
      }
    }

    const hasMoreRounds = (c.eventQueue || []).some((e) => !e.completed && e.type === 'round' && e.phase === 'season');
    if (!hasMoreRounds) {
      const finalists = getFinalsTeams(c.ladder, league.tier);
      if (finalists.length >= 2) startFinals(c, league);
      else beginPostSeasonTradePeriod(c, league, c.leagueKey);
    }

    if (myResult) {
      c.inMatchDay = true;
      c.currentMatchResult = {
        ...myResult.result,
        isHome: myResult.isHome, opp: myResult.opp,
        myTotal: myResult.myTotal, oppTotal: myResult.oppTotal, won: myResult.won, drew: myResult.drew,
        isPreseason: false, label: `Round ${ev.round}`, isAFL: league.tier === 1,
      };
      c.lastMatchSummary = buildPostMatchSummary(c, league, club, myResult, ev.round);
    }
    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    return;
  }

  markTutorialCompleteAfterAdvance(c);
  setCareer(c);
}
