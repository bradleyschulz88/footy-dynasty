// Season calendar advancement: event loop, finals, end-of-season rollover.
// Extracted from AFLManager.jsx so the shell stays UI-focused.

import { pickPressMoment } from './pressEvents.js';
import { rand, pick, rng, TIER_SCALE } from './rng.js';
import { PYRAMID, findClub, getAFLClubsForSeason } from '../data/pyramid.js';
import { isForwardPreferred, isMidPreferred } from './playerGen.js';
import { teamRating, simMatch, simMatchWithQuarters, aiClubRating, benchStrengthBonus, interchangeRotationBonus, initMatchSim, simMatchQuarter, finishMatchSim, competitiveOppRating, calcSynergyBonus, philosophyTacticFit, pickInjury } from './matchEngine.js';
import { getCoachingCall, resolveCoachingCall } from './coachingCalls.js';
import { resolveAiOppTactic } from './aiPersonality.js';
import { generateFixtures, applyByesToFixtures, blankLadder, applyResultToLadder, sortedLadder, getFinalsTeams, pickPromotionLeague, pickRelegationLeague, competitionClubsForCareer, getCompetitionClubs, localDivisionForClub, tier3DivisionCount } from './leagueEngine.js';

/** Set c.fixtures + c.byeMap from a club list in one shot (real byes baked in). */
function setFixtures(c, clubs) {
  const { fixtures, byeMap } = applyByesToFixtures(generateFixtures(clubs), clubs.map(cl => cl.id));
  c.fixtures = fixtures;
  c.byeMap = byeMap;
}
import {
  buildFinalsBracket,
  appendFinalsCalendarEvents,
  completeNextFinalsCalendarEvent,
  pairFinalsRound,
  finalsRoundLabel,
  finalsSeedFor,
  recordAflWeekResults,
  aflFinalsAlive,
  finalsBracketArchiveSnapshot,
  finalsWeeksEstimate,
} from './finalsBracket.js';
import { capBreachSanctionPatch } from './listRules.js';
import { applyLeagueTradeNews } from './tradeEngine.js';
import { recordFinalsRivalryEvent, clubFinalsGrudgeTowardPlayer } from './finalsRivalry.js';
import { awayTravelRatingPenalty } from './travelFatigue.js';
import { generateTradePool } from './defaults.js';
import { seedNationalDraft, careerHasNationalDraft } from './draftSeed.js';
import { syncRecruitPhaseInboxRows } from './inbox.js';
import { generateOffseasonNotifications, buildPlayerTransferRequestNotice } from './notifications.js';
import { adjustMorale, MORALE_REASONS, squadTraitMoraleDelta } from './morale.js';
import { fmtK, clamp, avgFacilities, avgStaff } from './format.js';
import { generateSeasonCalendar, applyTraining, TRAINING_INFO } from './calendar.js';
import { ensureSquadsForLeague, tickAiSquads, ageAiSquads, selectAiLineup } from './aiSquads.js';
import { computeLeagueAwards } from './awards.js';
import { maybeOpenMidSeasonDraft, MID_SEASON_DRAFT_ROUND } from './midSeasonDraft.js';
import {
  beginPostSeasonTradePeriod,
  advanceTradePeriodDay,
  advanceDraftCountdown,
  clearPostSeasonTransient,
  playerBlockedFromTrade,
  tradePlayerSnapshot,
} from './tradePeriod.js';
import { TUTORIAL_STEPS } from './tutorialConstants.js';
import { getDifficultyConfig } from './difficulty.js';
import {
  committeeMessage, bumpCommitteeMood, postMatchFundraiser,
  ensureWeatherForWeek, applyGroundDegradation, recoverGroundPreseason,
  groundConditionBand, journalistMatchLine, generatePostMatchHeadline,
  updateFanbase, journalistBoardImpact, tickVolunteerBurnout, recoverVolunteers,
  checkCommitteeDrama,
} from './community.js';
import {
  coachTierFromScore, applyEndOfSeasonReputation,
  applySackingReputation, buildDominantSeasonApproach,
  accreditationFromSeasons, accreditationLabel, startingAccreditationForTier,
} from './coachReputation.js';
import {
  isPromotionPlayoffEligible, clubBacksPromotion, runPromotionPlayoff,
  TIER3_PROMOTION_TITLE_REQ,
} from './promotionPlayoff.js';
import {
  recomputeAnnualIncome, tickWeeklyCashflow, tickGrassrootsFinance,
  cashCrisisLevel, applyPrizeMoney, applyPromotionRipple,
  effectiveInjuryRate, annualNetProjection,
  refillTransferBudget,
  effectiveWageCap, currentPlayerWageBill,
  matchDayRevenue, grassrootsCanteenIncome, grassrootsPerGameExpenses,
  collectRegistrationFees, applyMembershipMilestone,
  pickBoardFinancialObjective, evaluateBoardFinancialObjective,
} from './finance/engine.js';
import {
  tickSponsorYears, proposalForRenewal, generateSponsorOffers,
} from './finance/sponsors.js';
import { buildRenewalQueue, buildAutoRenewList } from './finance/contracts.js';
import { buildStaffRenewalQueue, flushUnhandledStaffRenewals } from './staffRenewals.js';
import { generateStaffMarket } from './staffHiring.js';
import {
  INSOLVENCY, FUNDRAISERS, COMMUNITY_GRANT, T4_COMMUNITY, T3_COMMUNITY,
} from './finance/constants.js';
import { careerFootballDept } from './finance/footballDept.js';
import { careerMemberCount } from './finance/membership.js';
import { careerSeasonDistribution } from './finance/distribution.js';
import { careerHpEffects } from './finance/highPerformance.js';
import { trimToListMax, listMax } from './listManagement.js';
import { activeNamingRights } from './finance/namingRights.js';
import { defaultVision, evaluateBoardVision } from './boardVision.js';
import { aflwActive, aflwProgramCost, simulateAflwSeason, clubAflwStrength } from './aflw.js';
import { playReservesRound } from './reserves.js';
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
import { sanitizeLineup, lineupPlayersOrdered, lineupRole } from './lineupHelpers.js';
import { scoutPrepRatingBonus } from './oppositionScout.js';
import { processReturningDeployments, tickWatchlistStaleness, tickRivalInterest, bumpRelationship } from './scoutingSystem.js';
import { weeklyClubOperationsPulse } from './weeklyClubPulse.js';
import {
  assignDynastyQuestsForSeason,
  dynastyRecordHomeAwayWin,
  ensureDynastyAssignments,
  ensureLegacyMilestones,
  finalizeDynastyLadderAtSeasonEnd,
  recordCareerWin,
  checkLegacyMilestonesAfterSeason,
} from './dynastyQuests.js';
import { syncAchievements } from './achievements.js';

// Margin-aware match report phrases — indexed by outcome + margin band.
const WIN_CLOSE = [   // margin 1-12
  'Scraped through by the barest of margins.',
  'Survived a late charge to hold on.',
  'Three-quarter time anxiety, four-quarter-time relief.',
  'Ugly but it counts the same — two points.',
  'Hung on through a nervous last five minutes.',
];
const WIN_COMFORT = [ // margin 13-35
  'Took control mid-game and didn\'t look back.',
  'Fans lingered after the siren.',
  'The song echoed across the terraces.',
  'Four-quarter effort that pleased the coaching staff.',
  'Efficient ball movement created the difference.',
];
const WIN_BLOWOUT = [ // margin 36+
  'A statement win — the score tells the full story.',
  'Dominant from the first bounce.',
  'Outclassed them in every department.',
  'The match was over by quarter-time.',
  'One of those days where everything clicked.',
];
const LOSS_CLOSE = [  // margin 1-12
  'Agonisingly close — one kick could have changed history.',
  'Left points on the board at the worst moment.',
  'Hurt more because it was there for the taking.',
  'One quarter short of the points.',
  'So close. The rooms were silent.',
];
const LOSS_COMFORT = [ // margin 13-35
  'Coaches\' box ran out of answers late.',
  'Review tape will hurt tomorrow.',
  'Momentum never quite flipped our way.',
  'Errors compounded when it mattered most.',
  'Outworked in the contested ball — need a response.',
];
const LOSS_BLOWOUT = [ // margin 36+
  'A tough day at the office — need honest reflection.',
  'Outclassed on every front. Time for a reset.',
  'The scoreboard doesn\'t lie — back to the drawing board.',
  'They were a class above us today.',
  'The captain\'s review will be a tough watch.',
];
const DRAW_CLOSERS = [
  'Neither coach blinked at the last centre bounce.',
  'Honours even — replay vibes without the fixture.',
  'One kick either way all afternoon.',
  'Shared points, split moods in the rooms.',
  'A point each feels right after that tussle.',
];

/** Build a journalist-voice match report line with margin + player context. */
function buildMatchReportLine(c, meta, myResult, won, drew, isHome, result) {
  const { myTotal, oppTotal, opp } = myResult;
  const margin = Math.abs((myTotal ?? 0) - (oppTotal ?? 0));
  const oppShort = opp?.short ?? 'them';
  const venueTag = isHome ? 'vs' : '@';

  // Score in AFL goals.behinds.total format when available
  const hG = isHome ? (result.homeGoals ?? 0) : (result.awayGoals ?? 0);
  const hB = isHome ? (result.homeBehinds ?? 0) : (result.awayBehinds ?? 0);
  const aG = isHome ? (result.awayGoals ?? 0) : (result.homeGoals ?? 0);
  const aB = isHome ? (result.awayBehinds ?? 0) : (result.homeBehinds ?? 0);
  const hasGoalData = hG + hB + aG + aB > 0;
  const myScore = hasGoalData ? `${hG}.${hB}.${myTotal}` : String(myTotal ?? 0);
  const oppScore = hasGoalData ? `${aG}.${aB}.${oppTotal}` : String(oppTotal ?? 0);

  // Best on ground: highest vote-getter in our lineup
  let bogLine = '';
  const votes = result?.votes ?? [];
  if (votes.length > 0) {
    const topVote = [...votes].sort((a, b) => b.votes - a.votes)[0];
    const bogPlayer = c.squad.find(p => p.id === topVote.playerId);
    if (bogPlayer) {
      const pName = bogPlayer.firstName ? `${bogPlayer.firstName[0]}. ${bogPlayer.lastName}` : bogPlayer.name;
      bogLine = ` Best: ${pName} (${topVote.votes}v).`;
    }
  }

  // Streak context
  const streak = c.winStreak ?? 0;
  let streakLine = '';
  if (Math.abs(streak) >= 4) {
    streakLine = won
      ? ` ${streak} on the trot — the run is building.`
      : streak <= -4 ? ` That's ${Math.abs(streak)} in a row — something needs to change.` : '';
  }

  // Margin-aware flavor
  let flavor;
  if (drew) {
    flavor = pick(DRAW_CLOSERS);
  } else if (won) {
    flavor = margin <= 12 ? pick(WIN_CLOSE) : margin <= 35 ? pick(WIN_COMFORT) : pick(WIN_BLOWOUT);
  } else {
    flavor = margin <= 12 ? pick(LOSS_CLOSE) : margin <= 35 ? pick(LOSS_COMFORT) : pick(LOSS_BLOWOUT);
  }

  const resultTag = won ? 'W' : drew ? 'D' : 'L';
  const base = `Rd ${meta.round}: ${venueTag} ${oppShort} ${myScore}–${oppScore} (${resultTag})`;
  return `${base} ${flavor}${bogLine}${streakLine}`;
}

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

function buildPostMatchSummary(c, league, club, myResult, roundOrLabel) {
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
  const isHome = !!myResult.isHome;
  const revenue = c.lastMatchRevenue && c.lastMatchRevenue.round === (typeof roundOrLabel === 'number' ? roundOrLabel : c.lastMatchRevenue.round)
    ? c.lastMatchRevenue
    : matchDayRevenue(c, { isHome, leagueTier: league.tier });
  const baseCrowd = league.tier === 1 ? 35000 : league.tier === 2 ? 4500 : 800;
  const crowd = isHome && revenue.attendance ? revenue.attendance : Math.round(baseCrowd * (0.6 + 0.5 * rng()));
  const labelStr = typeof roundOrLabel === 'number' ? `Round ${roundOrLabel}` : String(roundOrLabel || 'Match');
  return {
    label: labelStr,
    myScore: `${(isHome ? myResult.result?.homeGoals : myResult.result?.awayGoals) ?? 0}.${(isHome ? myResult.result?.homeBehinds : myResult.result?.awayBehinds) ?? 0} (${myResult.myTotal})`,
    oppScore: `${(isHome ? myResult.result?.awayGoals : myResult.result?.homeGoals) ?? 0}.${(isHome ? myResult.result?.awayBehinds : myResult.result?.homeBehinds) ?? 0} (${myResult.oppTotal})`,
    myShortName: club.short, oppShortName: myResult.opp?.short || 'OPP',
    myColor: club.colors?.[0] || 'var(--A-accent)',
    oppColor: myResult.opp?.colors?.[0] || '#64748B',
    result: myResult.won ? 'WIN' : myResult.drew ? 'DRAW' : 'LOSS',
    resultColor: myResult.won ? '#4AE89A' : myResult.drew ? 'var(--A-accent)' : '#E84A6F',
    margin,
    crowd,
    isHome,
    revenue,
    bog,
    topScorer, topGoals,
    boardReaction,
    journalistLine: journoLine,
    committeeReaction,
    isFinals: typeof roundOrLabel !== 'number' && !/^Round\s+\d+$/i.test(String(roundOrLabel)),
    isGrandFinal: labelStr === 'Grand Final',
    playerStats: c.lastMatchPlayerStats || {},
  };
}

function crownPremier(c, league, winnerId) {
  const winnerClub = findClub(winnerId);
  const isMeChamp = winnerId === c.clubId;
  c.premiership = isMeChamp ? c.season : c.premiership;
  c.news = [{
    week: c.week,
    type: isMeChamp ? 'win' : 'loss',
    text: isMeChamp
      ? `🏆🎉 PREMIERS! ${winnerClub?.name} are the ${c.season} champions!`
      : `${winnerClub?.name} win the ${c.season} premiership.`,
  }, ...c.news].slice(0, 15);
  c.inFinals = false;
  c.phase = 'offseason';
  c.finalsEliminated = false;
  if (isMeChamp) {
    c.showPremiershipScreen = true;
    c.premiershipMoment = {
      season: c.season,
      leagueName: league.name,
      leagueShort: league.short,
      leagueTier: league.tier,
      clubName: winnerClub?.name,
      clubShort: winnerClub?.short,
    };
  }
  beginPostSeasonTradePeriod(c, league, c.leagueKey);
  return c;
}

function startFinals(c, league) {
  if (c.inFinals) return c;
  const finalists = getFinalsTeams(c.ladder, league.tier);
  const sorted = sortedLadder(c.ladder);
  const myPosIdx = sorted.findIndex((r) => r.id === c.clubId);
  const myPos = myPosIdx >= 0 ? myPosIdx + 1 : sorted.length;
  const inFinals = finalists.some((f) => f.id === c.clubId);
  const seedIds = finalists.map((f) => f.id);

  // Guard: fewer than 2 teams means no bracket is possible — crown the top team directly.
  if (finalists.length < 2) {
    const champion = finalists[0] ?? sorted[0];
    c.inFinals = false;
    c.phase = 'offseason';
    c.seasonChampion = champion?.id ?? null;
    c.news = [{
      week: c.week,
      type: 'win',
      text: champion
        ? `Season complete — ${champion.name} crowned premiers (insufficient teams for finals).`
        : 'Season complete — no teams available for finals.',
    }, ...c.news].slice(0, 15);
    beginPostSeasonTradePeriod(c, league, c.leagueKey);
    return c;
  }

  c.inFinals = true;
  c.phase = 'finals';
  c.finalsRound = 0;
  c.finalsFinalists = seedIds;
  c.finalsAlive = [...seedIds];
  c.finalsTotalRounds = finalsWeeksEstimate(seedIds.length, league.tier);
  c.finalsResults = [];
  c.finalsBracket = buildFinalsBracket(seedIds, league.tier);
  c.finalsEliminated = false;
  c.eventQueue = appendFinalsCalendarEvents(c, seedIds.length);

  if (inFinals) {
    c.showFinalsQualification = true;
    c.finalsQualification = {
      position: myPos,
      seed: finalsSeedFor(c.clubId, c.finalsBracket),
      totalTeams: sorted.length,
      leagueShort: league.short,
      leagueTier: league.tier,
      firstRoundLabel: finalsRoundLabel(seedIds.length, league.tier),
    };
    c.news = [{
      week: c.week,
      type: 'win',
      text: `🏆 FINALS! Finished ${myPos}${myPos === 1 ? 'st' : myPos === 2 ? 'nd' : myPos === 3 ? 'rd' : 'th'} — ${c.finalsQualification.firstRoundLabel} awaits.`,
    }, ...c.news].slice(0, 15);
  } else {
    c.news = [{
      week: c.week,
      type: 'draw',
      text: `Season over. Finished ${myPos}/${sorted.length} — missed finals.`,
    }, ...c.news].slice(0, 15);
    beginPostSeasonTradePeriod(c, league, c.leagueKey);
    c.inFinals = false;
    c.phase = 'offseason';
  }
  return c;
}

function simFinalsPair(c, league, m, _roundLabel) {
  const _headCoach = (c.staff || []).find(s => s.id === 's1');
  let myRating = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff), null, c.playerRoles)
    + getCaptainMatchBonus(c, true)
    + calcSynergyBonus(c.partnerships, c.lineup)
    + philosophyTacticFit(_headCoach?.philosophy, c.tacticChoice || 'balanced');
  const isPlayerMatch = m.home === c.clubId || m.away === c.clubId;
  const isHome = m.home === c.clubId;
  // The Grand Final is played on neutral turf at the MCG — no home-ground edge.
  const isGrandFinal = m.label === 'Grand Final' || _roundLabel === 'Grand Final';
  if (isPlayerMatch) {
    const finalsOppId = isHome ? m.away : m.home;
    const h2hFinals = c.headToHead?.[finalsOppId];
    if (h2hFinals && (h2hFinals.wins + h2hFinals.losses + h2hFinals.draws) >= 3) {
      const streak = h2hFinals.streak ?? 0;
      myRating += streak <= -5 ? -4 : streak <= -3 ? -2 : streak >= 5 ? 4 : streak >= 3 ? 2 : 0;
    }
  }
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
    const oppTactic = resolveAiOppTactic(oppId, oppRatingForTactics, myRating);
    // Difficulty-aware competitiveness — opponents push back in finals too.
    const finalsDiffCfg = getDifficultyConfig(c.difficulty);
    const oppRatingDelta = competitiveOppRating(oppRatingForTactics, myRating, {
      flat: finalsDiffCfg.aiRatingFlat ?? 0,
      gapClose: finalsDiffCfg.aiGapClose ?? 0,
    }) - oppRatingForTactics;
    const playerLineup = c.lineup.map((id) => c.squad.find((p) => p.id === id)).filter(Boolean);
    let groundScoringMod = 1.0;
    let groundAccuracyMod = 1.0;
    if (isHome) {
      const band = groundConditionBand(c.groundCondition ?? 85);
      groundScoringMod = band.scoringMod;
      groundAccuracyMod = band.accuracyMod;
    }
    const travelPen = awayTravelRatingPenalty(isHome, c.clubId, oppId);
    const matchWeather = ensureWeatherForWeek(c, c.week);
    const getPlayerStrengthForQuarter = (qi) =>
      teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff), qi, c.playerRoles)
      + benchStrengthBonus(c.squad, c.lineup, qi)
      + interchangeRotationBonus(c.squad, c.lineup, qi)
      - travelPen;
    const getOppStrengthForQuarter = oppSquad?.length
      ? (qi) =>
          teamRating(oppSquad, oppLineupIds, neutralTraining, 1, 60, qi)
          + benchStrengthBonus(oppSquad, oppLineupIds, qi)
          + oppRatingDelta
      : null;
    result = simMatchWithQuarters(
      { rating: homeR + (isHome ? 0 : oppRatingDelta) }, { rating: awayR + (isHome ? oppRatingDelta : 0) }, isHome, myRating,
      {
        tactic: c.tacticChoice || 'balanced',
        playerLineup,
        oppLineup,
        oppTactic,
        groundScoringMod,
        groundAccuracyMod,
        weather: matchWeather,
        getPlayerStrengthForQuarter,
        ...(getOppStrengthForQuarter ? { getOppStrengthForQuarter } : {}),
        homeFixtureAdvantage: isGrandFinal ? 0 : resolveHomeAdvantageForFixture(c, league, isHome, findClub(c.clubId), oppClub),
      },
    );
  } else {
    const weatherTag = typeof c.weeklyWeather?.[c.week] === 'string' ? c.weeklyWeather[c.week] : 'fine';
    const homeAdvAi = isGrandFinal ? 0 : homeAdvantageAiHome(
      league,
      getClubGround(findClub(m.home), 3, league.tier),
      true,
      weatherTag,
    );
    result = simMatch({ rating: homeR }, { rating: awayR }, false, awayR, homeAdvAi);
  }
  const winnerId = result.winner === 'home' ? m.home : result.winner === 'away' ? m.away : m.home;
  m.result = { hScore: result.homeTotal, aScore: result.awayTotal };
  return { result, winnerId, isPlayerMatch, isHome };
}

function advanceFinalsWeek(c, league) {
  const alive = c.finalsAlive || [];
  if (alive.length <= 1) {
    if (alive.length === 0) {
      c.news = [{ week: c.week, type: 'info', text: 'Finals bracket error — season concluded without a recorded premier.' }, ...(c.news || [])].slice(0, 25);
      return;
    }
    return crownPremier(c, league, alive[0]);
  }

  const tier = c.finalsBracket?.tier ?? league.tier;
  const aflState = c.finalsBracket?.aflState ?? null;
  const pairs = pairFinalsRound(c.finalsFinalists, alive, tier, aflState);
  const roundLabel = aflState
    ? finalsRoundLabel(alive.length, tier, aflState.week)
    : finalsRoundLabel(alive.length, tier);
  const newAlive = [];
  const winners = [];
  let playerMatchPayload = null;

  for (const m of pairs) {
    // A bye (odd alive count) advances the top seed without a match.
    if (m.bye) {
      newAlive.push(m.bye);
      if (m.bye === c.clubId) {
        c.news = [{
          week: c.week,
          type: 'info',
          text: `🎟️ ${findClub(c.clubId)?.name || 'Your club'} earn a finals bye and advance straight to the next week.`,
        }, ...(c.news || [])].slice(0, 40);
      }
      continue;
    }
    const { result, winnerId, isPlayerMatch, isHome } = simFinalsPair(c, league, m, roundLabel);
    winners.push(winnerId);
    newAlive.push(winnerId);

    if (isPlayerMatch) {
      const playerWon = (isHome && result.winner === 'home') || (!isHome && result.winner === 'away');
      const myScore = isHome ? result.homeTotal : result.awayTotal;
      const oppScore = isHome ? result.awayTotal : result.homeTotal;
      const drewFinal = myScore === oppScore;
      const matchLabel = m.label || roundLabel;
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
        recordFinalsRivalryEvent(c, {
          oppId: oid,
          season: c.season,
          roundLabel: matchLabel,
          won: playerWon,
          isGrandFinal: matchLabel === 'Grand Final',
          drew: drewFinal,
        });
      }
      // Store GF votes for Norm Smith Medal — highest vote-getter = BOG
      if (matchLabel === 'Grand Final' && result.votes?.length) {
        c.lastGrandFinalVotes = result.votes.reduce((acc, v) => { acc[v.playerId] = (acc[v.playerId] || 0) + v.votes; return acc; }, {});
      }
      const hg = isHome ? (result.homeGoals ?? 0) : (result.awayGoals ?? 0);
      const hb = isHome ? (result.homeBehinds ?? 0) : (result.awayBehinds ?? 0);
      const ag = isHome ? (result.awayGoals ?? 0) : (result.homeGoals ?? 0);
      const ab = isHome ? (result.awayBehinds ?? 0) : (result.homeBehinds ?? 0);
      pushTeamStatsFromResult(c, hg, hb, ag, ab, playerWon, drewFinal);
      c.news = [{
        week: c.week,
        type: playerWon ? 'win' : 'loss',
        text: playerWon
          ? `✅ ${matchLabel} WIN! ${myScore} def ${opp?.short} ${oppScore}`
          : `❌ Eliminated in ${matchLabel}. ${opp?.short} ${oppScore} def ${myScore}`,
      }, ...c.news].slice(0, 15);

      const club = findClub(c.clubId);
      const myResult = {
        result,
        isHome,
        opp,
        myTotal: myScore,
        oppTotal: oppScore,
        won: playerWon,
        drew: drewFinal,
        isFinals: true,
        matchLabel,
      };
      playerMatchPayload = {
        result,
        isHome,
        opp,
        myTotal: myScore,
        oppTotal: oppScore,
        won: playerWon,
        drew: drewFinal,
        matchLabel,
        myResult,
        club,
      };
    }
    c.finalsResults.push({
      round: c.finalsRound,
      label: m.label || roundLabel,
      winnerId,
      ...m,
    });
  }

  if (aflState && c.finalsBracket) {
    c.finalsBracket.aflState = recordAflWeekResults(aflState, pairs, winners);
    c.finalsAlive = aflFinalsAlive(c.finalsBracket.aflState);
  } else {
    const orderedAlive = c.finalsFinalists.filter((id) => newAlive.includes(id));
    c.finalsAlive = orderedAlive.length ? orderedAlive : newAlive;
  }
  c.finalsRound += 1;
  c.week += 1;
  c.eventQueue = completeNextFinalsCalendarEvent(c.eventQueue, c.finalsRound - 1);

  if (playerMatchPayload) {
    const { result, isHome, opp, myTotal, oppTotal, won, drew, matchLabel, myResult, club } = playerMatchPayload;
    c.inMatchDay = true;
    c.currentMatchResult = {
      ...result,
      isHome,
      opp,
      myTotal,
      oppTotal,
      won,
      drew: drew,
      isPreseason: false,
      label: matchLabel,
      isAFL: league.tier === 1,
      isFinals: true,
      isGrandFinal: matchLabel === 'Grand Final',
    };
    c.lastEvent = {
      type: 'finals',
      round: matchLabel,
      date: c.currentDate || '',
      isHome,
      opp,
      result,
      myTotal,
      oppTotal,
      won,
      drew,
    };
    // Finals match-day income — bigger crowds + premium TV money.
    const finalsMult = matchLabel === 'Grand Final' ? 2.0 : 1.5;
    const finalsRev = matchDayRevenue(c, { isHome, leagueTier: league.tier, finalsMultiplier: finalsMult });
    c.finance.cash += finalsRev.total;
    c.lastMatchRevenue = { ...finalsRev, round: matchLabel, opp: opp?.short || null };
    const fbits = [];
    if (finalsRev.gate) fbits.push(`gate ${fmtK(finalsRev.gate)}`);
    if (finalsRev.broadcast) fbits.push(`TV ${fmtK(finalsRev.broadcast)}`);
    if (finalsRev.sponsor) fbits.push(`sponsor ${fmtK(finalsRev.sponsor)}`);
    c.news = [{ week: c.week, type: 'info',
      text: `💰 ${matchLabel} income +${fmtK(finalsRev.total)}${fbits.length ? ` (${fbits.join(', ')})` : ''}` },
    ...(c.news || [])].slice(0, 14);
    c.lastMatchSummary = buildPostMatchSummary(c, league, club, myResult, matchLabel);
    // Eliminated iff we're no longer among the alive finalists (and it wasn't
    // the GF). Deriving from finalsAlive — rather than `!won` — correctly keeps
    // a drawing HOME side alive (draws resolve to the home team) while still
    // eliminating a drawing AWAY side.
    if (matchLabel !== 'Grand Final' && !c.finalsAlive.includes(c.clubId)) {
      c.finalsEliminated = true;
    }
    return c;
  }

  if (c.finalsAlive.length <= 1) {
    return crownPremier(c, league, c.finalsAlive[0]);
  }
  return c;
}

/** Fast-forward AI finals after the player is eliminated. */
export function fastForwardFinals(career, league) {
  const c = JSON.parse(JSON.stringify(career));
  let guard = 0;
  while (c.inFinals && guard < 12) {
    guard += 1;
    const alive = c.finalsAlive || [];
    if (alive.length <= 1) {
      crownPremier(c, league, alive[0]);
      break;
    }
    if (alive.includes(c.clubId)) break;
    const before = c.finalsRound;
    advanceFinalsWeek(c, league);
    if (c.inMatchDay) {
      c.inMatchDay = false;
      c.currentMatchResult = null;
      c.lastMatchSummary = null;
    }
    if (c.finalsRound === before && c.inFinals) break;
  }
  c.showFinalsEliminated = false;
  return c;
}

function finishSeason(c, league) {
  const sorted = sortedLadder(c.ladder);
  const myPosIdx = sorted.findIndex((r) => r.id === c.clubId);
  const myPos = myPosIdx >= 0 ? myPosIdx + 1 : sorted.length;
  finalizeDynastyLadderAtSeasonEnd(c, myPos, sorted.length, league.tier);
  const myRow = sorted.find((r) => r.id === c.clubId) || {};
  let promoted = false; let relegated = false;

  const pName = (p) => (p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Unknown'));
  const byGoals = [...c.squad].sort((a, b) => (b.goals || 0) - (a.goals || 0));
  const byDisposals = [...c.squad].sort((a, b) => (b.disposals || 0) - (a.disposals || 0));
  const bafFromVotes = Object.entries(c.brownlow || {})
    .map(([id, votes]) => ({ id, votes }))
    .sort((a, b) => b.votes - a.votes)[0];
  const bafPlayer = bafFromVotes
    ? c.squad.find((p) => p.id === bafFromVotes.id) || null
    : null;
  const champion = c.premiership === c.season;
  const oldLeagueKey = c.leagueKey;
  const oldLeagueName = PYRAMID[oldLeagueKey]?.name || '';
  const oldLeagueShort = PYRAMID[oldLeagueKey]?.short || '';
  const endedTier = league.tier;
  const region = c.regionState ?? findClub(c.clubId)?.state;

  if (league.tier === 1) {
    setFixtures(c, league.clubs);
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
        setFixtures(c, clubs);
        c.ladder = blankLadder(clubs);
      } else {
        const clubs = getCompetitionClubs(c.leagueKey, region, null);
        setFixtures(c, clubs);
        c.ladder = blankLadder(clubs);
      }
    } else if (myPos === sorted.length) {
      relegated = true;
      const newLeagueKey = pickRelegationLeague(league);
      if (newLeagueKey) {
        c.leagueKey = newLeagueKey;
        c.localDivision = localDivisionForClub(c.clubId, newLeagueKey, region);
        const clubs = getCompetitionClubs(newLeagueKey, region, c.localDivision);
        setFixtures(c, clubs);
        c.ladder = blankLadder(clubs);
      } else {
        const clubs = getCompetitionClubs(c.leagueKey, region, null);
        setFixtures(c, clubs);
        c.ladder = blankLadder(clubs);
      }
    } else {
      const clubs = getCompetitionClubs(c.leagueKey, region, null);
      setFixtures(c, clubs);
      c.ladder = blankLadder(clubs);
    }
  } else if (league.tier === 3) {
    const K = tier3DivisionCount(c.leagueKey, region);
    let div = c.localDivision ?? localDivisionForClub(c.clubId, c.leagueKey, region);
    div = Math.max(1, Math.min(K, div));
    c.localDivision = div;
    if (champion) {
      if (div > 1) {
        // Won a lower local division — climb one division within tier 3.
        promoted = true;
        c.localDivision = div - 1;
        c.tier3Div1Titles = 0; // arriving fresh in the higher division
        const clubs = getCompetitionClubs(c.leagueKey, region, c.localDivision);
        setFixtures(c, clubs);
        c.ladder = blankLadder(clubs);
      } else {
        // Division 1 flag: NO automatic jump to the state league. A community club
        // only earns a tier-2 spot through sustained dominance — four straight
        // Division 1 flags unlock a promotion playoff the club can enter.
        c.tier3Div1Titles = (c.tier3Div1Titles || 0) + 1;
        const titles = c.tier3Div1Titles;
        let promotedViaPlayoff = false;
        if (isPromotionPlayoffEligible(c) && clubBacksPromotion(c)) {
          const playoff = runPromotionPlayoff(c);
          c.lastPromotionPlayoff = playoff;
          c.news = [{ week: 0, type: playoff.won ? 'win' : 'info', text: playoff.summary }, ...(c.news || [])].slice(0, 25);
          if (playoff.won) {
            const newLeagueKey = pickPromotionLeague(league);
            if (newLeagueKey) {
              promoted = true;
              promotedViaPlayoff = true;
              c.leagueKey = newLeagueKey;
              c.localDivision = null;
              c.tier3Div1Titles = 0;
              const clubs = getCompetitionClubs(newLeagueKey, region, null);
              setFixtures(c, clubs);
              c.ladder = blankLadder(clubs);
            }
          }
        } else if (isPromotionPlayoffEligible(c) && !clubBacksPromotion(c)) {
          c.news = [{ week: 0, type: 'info', text: `🏆 ${titles} straight Division 1 flags — but the board won't back a state-league push while confidence is low. Keep them on side.` }, ...(c.news || [])].slice(0, 25);
        } else {
          const left = TIER3_PROMOTION_TITLE_REQ - titles;
          c.news = [{ week: 0, type: 'win', text: `🏆 Division 1 Premiers (${titles} in a row). ${left > 0 ? `${left} more straight flag${left > 1 ? 's' : ''} unlocks a tier-2 promotion playoff.` : ''}` }, ...(c.news || [])].slice(0, 25);
        }
        if (!promotedViaPlayoff) {
          // Stay in Division 1 and defend the flag.
          const clubs = getCompetitionClubs(c.leagueKey, region, 1);
          setFixtures(c, clubs);
          c.ladder = blankLadder(clubs);
        }
      }
    } else {
      // Streak of Division 1 flags is broken by any non-championship season there.
      if (div === 1) c.tier3Div1Titles = 0;
      const clubs = getCompetitionClubs(c.leagueKey, region, div);
      setFixtures(c, clubs);
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
    baf: bafPlayer
      ? { name: pName(bafPlayer), overall: bafPlayer.overall, games: bafPlayer.gamesPlayed || 0, votes: bafFromVotes?.votes ?? 0 }
      : null,
    risingStar: (() => {
      const pool = c.squad.filter((p) => (p.age ?? 30) <= 21 && (p.gamesPlayed || 0) >= 5);
      const score = (p) => (p.overall ?? 0) + (c.brownlow?.[p.id] || 0) * 2;
      const star = pool.sort((a, b) => score(b) - score(a))[0] || null;
      return star
        ? { name: pName(star), age: star.age, overall: star.overall, games: star.gamesPlayed || 0 }
        : null;
    })(),
  };
  c.showSeasonSummary = true;

  // League-wide honours: Brownlow, Coleman and Rising Star are competition
  // awards, not club prizes — model every club's players and pick the best.
  const leagueAwards = computeLeagueAwards(c, league, ensureSquadsForLeague(c, league));
  const brownlowWinner = leagueAwards.brownlow;
  const colemanWinner = leagueAwards.coleman;

  // Club Champion — our player with the most Brownlow votes
  const clubChampionEntry = Object.entries(c.brownlow || {})
    .filter(([id]) => c.squad.some(p => p.id === id))
    .sort(([, a], [, b]) => b - a)[0];
  const clubChampionPlayer = clubChampionEntry ? c.squad.find(p => p.id === clubChampionEntry[0]) : null;
  const clubChampion = clubChampionPlayer
    ? { name: pName(clubChampionPlayer), votes: clubChampionEntry[1] }
    : null;

  // Norm Smith Medal — best on ground in the Grand Final (only if we won premiership)
  let normSmith = null;
  if (champion && c.lastGrandFinalVotes) {
    const nsEntry = Object.entries(c.lastGrandFinalVotes).sort(([, a], [, b]) => b - a)[0];
    if (nsEntry) {
      const nsPlayer = c.squad.find(p => p.id === nsEntry[0]);
      if (nsPlayer) normSmith = { name: pName(nsPlayer), votes: nsEntry[1] };
    }
  }

  c.seasonSummary = {
    ...c.seasonSummary,
    brownlow: brownlowWinner,
    coleman: colemanWinner,
    risingStar: leagueAwards.risingStar ?? c.seasonSummary.risingStar,
    allAustralian: leagueAwards.allAustralian ?? [],
    clubChampion,
    normSmith,
    highlights: (c.seasonHighlights || []).slice(0, 8),
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

  // Multi-year board mandate — set if absent, judged against this season's outcome.
  if (!c.board.vision) c.board.vision = defaultVision(c.season, league.tier);
  {
    const v = evaluateBoardVision(c.board.vision, {
      madeFinals: (c.finalsFinalists || []).includes(c.clubId),
      champion,
      cash: c.finance.cash,
      season: c.season,
      tier: league.tier,
    });
    if (v.confidenceDelta) applyBoardConfidenceDelta(c, v.confidenceDelta);
    if (v.achieved) c.board.visionsAchieved = (c.board.visionsAchieved ?? 0) + 1;
    if (v.lines.length) {
      c.news = [...v.lines.map((text) => ({ week: 0, type: v.achieved ? 'win' : 'loss', text })), ...(c.news || [])].slice(0, 25);
    }
    c.board.vision = v.nextVision;
  }

  // AFLW program — abstract women's campaign for AFL-tier clubs while active.
  if (aflwActive(c) && league.tier === 1) {
    c.finance.cash -= aflwProgramCost(league.tier);
    const res = simulateAflwSeason(clubAflwStrength(c), c.season);
    c.aflw = {
      ...c.aflw,
      lastResult: { season: c.season, ...res },
      premierships: (c.aflw?.premierships ?? 0) + (res.premiers ? 1 : 0),
    };
    const ord = res.position === 1 ? 'st' : res.position === 2 ? 'nd' : res.position === 3 ? 'rd' : 'th';
    c.news = [{ week: 0, type: res.premiers ? 'win' : 'info',
      text: res.premiers
        ? `🏆 AFLW PREMIERS! Your women's side finished ${res.wins}-${res.losses} and won the flag.`
        : `👩 AFLW season: finished ${res.position}${ord} (${res.wins}-${res.losses}).` },
    ...(c.news || [])].slice(0, 25);
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
    const decline = newAge >= 30 ? rand(2, 6) : newAge >= 27 ? rand(0, 3) : newAge <= 22 ? -rand(2, 6) : -rand(0, 2);
    const newTrue = clamp((p.trueRating || p.overall) - Math.round(decline * (TIER_SCALE[p.tier || 2] || 1.0)), 25, 99);
    const newOverall = clamp(Math.round(newTrue / newTierScale) - (newLeagueTier < (p.tier || league.tier) ? rand(0, 3) : 0), 30, 99);
    return {
      ...p, age: newAge, overall: newOverall, trueRating: newTrue, tier: newLeagueTier,
      contract: Math.max(0, p.contract - 1), _originalContract: p.contract, form: rand(50, 80), fitness: rand(85, 100),
      // Accumulate lifetime career totals before wiping season counters.
      careerGoals: (p.careerGoals || 0) + (p.goals || 0),
      careerGames: (p.careerGames || 0) + (p.gamesPlayed || 0),
      careerDisposals: (p.careerDisposals || 0) + (p.disposals || 0),
      peakRating: Math.max(p.peakRating || 0, p.overall),
      goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0,
      suspended: 0, seasonsAtClub: (p.seasonsAtClub || 0) + 1,
      // Fresh slate for the new season — unhappiness/listing don't carry over.
      unhappySince: null, transferRequested: false, weeksWithoutGame: 0,
    };
  });
  const survivors = c.squad.filter((p) => !p._walking && !p.forcedRetirement && p.age <= 36 && (p._originalContract ?? p.contract) > 0)
    .map((p) => { const { _originalContract, ...rest } = p; return { ...rest, concussionsThisSeason: 0 }; });
  const leavers = c.squad.filter((p) => p._walking || p.forcedRetirement || p.age > 36 || (p._originalContract ?? p.contract) <= 0);
  leavers.forEach((p) => {
    retiredThisYear.push({
      id: p.id,
      name: p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Player'),
      age: p.age,
      reason: p.forcedRetirement ? 'retired' : p._walking ? 'walked' : p.age > 36 ? 'retired' : 'released',
      seasonsAtClub: p.seasonsAtClub || 0,
      peakRating: p.peakRating || p.overall || 0,
      // careerGoals/careerGames are already accumulated above — use those.
      career: {
        goals: p.careerGoals || 0,
        gamesPlayed: p.careerGames || 0,
        disposals: p.careerDisposals || 0,
      },
    });
    // Farewell trigger: genuine retirees (age > 36) with 100+ career games get a send-off.
    const careerGames = p.careerGames ?? p.gamesPlayed ?? p.stats?.careerGames ?? 0;
    if (p.age > 36 && careerGames >= 100) {
      c.pendingFarewells = [...(c.pendingFarewells || []), {
        id: p.id,
        name: p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Player'),
        position: p.position,
        careerGames,
        careerGoals: p.careerGoals ?? p.goals ?? 0,
        age: p.age,
        seasons: p.seasonsAtClub ?? Math.round(careerGames / 18),
      }];
    }
  });
  // List lodgement: enforce the tier's senior-list cap — the lowest-rated
  // excess is delisted so the club can't carry an oversized list into the new season.
  const { kept, delisted } = trimToListMax(survivors, listMax(newLeagueTier));
  delisted.forEach((p) => {
    retiredThisYear.push({
      id: p.id,
      name: p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Player'),
      age: p.age,
      reason: 'delisted',
      seasonsAtClub: p.seasonsAtClub || 0,
      peakRating: p.peakRating || p.overall || 0,
      career: { goals: p.careerGoals || 0, gamesPlayed: p.careerGames || 0, disposals: p.careerDisposals || 0 },
    });
  });
  c.news = [{ week: 0, type: delisted.length > 0 ? 'loss' : 'info',
    text: `📋 List lodged: ${kept.length}/${listMax(newLeagueTier)}${delisted.length > 0 ? ` — ${delisted.length} delisted to fit the cap` : ''}` },
  ...(c.news || [])].slice(0, 25);
  c.squad = kept;
  c.lineup = sanitizeLineup(c.lineup, c.squad);
  c.retiredThisSeason = retiredThisYear;
  // Permanent hall-of-fame archive — never cleared.
  c.retiredPlayers = [...(c.retiredPlayers || []), ...retiredThisYear];
  c.staff = (c.staff || []).map((s) => ({ ...s, contract: Math.max(0, (s.contract ?? 0) - 1) }));
  c.pendingStaffRenewals = buildStaffRenewalQueue(c.staff);
  c.aiSquads = ageAiSquads(c.aiSquads || {}, newLeagueTier, c.season);
  c.tradePool = generateTradePool(c.leagueKey, c.season);

  // Father-son pipeline — players with 150+ club games can generate a son prospect.
  // ponytail: only tier-1 clubs have the national draft; F/S only makes sense there.
  if (league.tier === 1) {
    const eligible = c.squad.filter((p) => (p.legendGames || 0) >= 150 && !p.hasSonRegistered);
    eligible.forEach((father) => {
      if (rng() < 0.3) {
        const sonAge = 16 + Math.floor(rng() * 4);
        const sonRating = Math.round(55 + rng() * 30);
        const sonProspect = {
          id: `fs_${father.id}_${c.season}`,
          firstName: father.firstName,
          lastName: father.lastName,
          age: sonAge,
          position: pick(['MID', 'FWD', 'DEF', 'RUC']),
          overall: sonRating,
          potential: Math.min(95, sonRating + Math.round(rng() * 15)),
          fatherSon: true,
          fatherClubId: c.clubId,
          fatherName: `${father.firstName} ${father.lastName}`,
          fatherGames: father.legendGames || 0,
          scoutReveal: 3, // F/S prospects are fully visible — clubs know who they are
        };
        c.fatherSonPipeline = [...(c.fatherSonPipeline || []), sonProspect];
        c.squad = c.squad.map((p) => p.id === father.id ? { ...p, hasSonRegistered: true } : p);
        c.news = [{
          week: c.week,
          type: 'info',
          text: `⭐ ${father.firstName} ${father.lastName}'s son has been registered as a father-son prospect. The dynasty continues.`,
        }, ...(c.news || [])].slice(0, 25);
      }
    });
  }

  seedNationalDraft(c, league, { ladderSnapshot: sorted, inaugural: false, force: true });
  // seedNationalDraft clears the pool and marks 'complete' for tier 2/3 careers —
  // only tier 1 re-enters the scouting window.
  if (careerHasNationalDraft(c, league)) c.draftPhase = 'scouting';

  // Age the father-son pipeline and inject draft-eligible prospects into the pool.
  if (Array.isArray(c.fatherSonPipeline) && c.fatherSonPipeline.length) {
    c.fatherSonPipeline = c.fatherSonPipeline.map((p) => ({ ...p, age: p.age + 1 }));
    const eligible = c.fatherSonPipeline.filter((p) => p.age >= 17 && !c.draftPool?.some((d) => d.id === p.id));
    if (eligible.length && Array.isArray(c.draftPool)) {
      c.draftPool = [...eligible, ...c.draftPool];
    }
  }

  c.draftHistory = [];
  syncRecruitPhaseInboxRows(c);

  c.history = c.history || [];
  c.history.push({
    season: c.season - 1,
    leagueKey: oldLeagueKey,
    leagueShort: oldLeagueShort,
    position: myPos,
    W: myRow.W || 0, L: myRow.L || 0, D: myRow.D || 0,
    pts: myRow.pts || 0,
    pct: Math.round(myRow.pct || 0),
    F: myRow.F || 0,
    A: myRow.A || 0,
    promoted, relegated, champion,
    woodenSpoon: myPos === sorted.length,
    debtFree: champion && !c.bankLoan && !(c.facilityLoans && c.facilityLoans.length) && (c.finance?.cash ?? 0) >= 0,
    topScorer: byGoals[0] ? { name: pName(byGoals[0]), goals: byGoals[0].goals || 0 } : null,
    brownlow: brownlowWinner,
    colemanWinner,
    clubChampion,
    normSmith,
    finalsBracket: finalsBracketArchiveSnapshot(c.finalsBracket),
    highlights: (c.seasonHighlights || []).slice(0, 8),
  });
  c.seasonHighlights = [];
  c.brownlow = {};
  const capPatch = capBreachSanctionPatch(c, league);
  if (capPatch) Object.assign(c, capPatch);
  c.boardWarning = 0;

  const games = (myRow.W || 0) + (myRow.L || 0) + (myRow.D || 0);
  const winRate = games > 0 ? (myRow.W || 0) / games : 0;
  const madeFinals = (c.finalsFinalists || []).includes(c.clubId) || champion;

  // End-of-season holidays. Everyone gets a break; clubs that missed finals get a
  // longer one — players return refreshed (morale up) but a touch undercooked
  // (fitness dips, to be rebuilt in pre-season). A deep run means a shorter rest.
  if (!madeFinals) {
    c.squad = c.squad.map((p) => {
      const np = adjustMorale(p, rand(6, 14), 'Off-season break', 0);
      return { ...np, fitness: clamp((np.fitness ?? 90) - rand(4, 10), 40, 100) };
    });
    c.news = [{ week: 0, type: 'info', text: `🏖️ Season done — the playing group heads off on a well-earned holiday. They'll come back refreshed for pre-season.` }, ...(c.news || [])].slice(0, 20);
  } else {
    c.squad = c.squad.map((p) => adjustMorale(p, rand(2, 6), 'Finals campaign buzz', 0));
  }

  if (league.tier === 4) {
    // Grassroots: a deliberately-paced résumé climb. Completing a volunteer
    // season always earns something; a junior flag is nice but not a senior
    // achievement. From rep ~5 this reliably reaches Rookie (8) after one or
    // two seasons, opening Tier 3 offers in the off-season job market.
    let r = c.coachReputation ?? 5;
    r += 3;                              // ran the program for a season
    if (champion) r += 5;                // won the junior flag
    else if (madeFinals) r += 2;
    if (winRate > 0.5) r += 2;
    else if (winRate < 0.3) r -= 1;
    c.coachReputation = clamp(r, 0, 100);
  } else {
    c.coachReputation = applyEndOfSeasonReputation(c.coachReputation, {
      premiership: champion,
      finals: madeFinals && !champion,
      promoted, relegated, winRate,
    });
  }
  c.coachTier = coachTierFromScore(c.coachReputation);

  // Coaching accreditation advances one notch per completed season (capped at
  // High Performance). Gates which tiers will interview you next off-season.
  {
    const prevAccredSeasons = c.coachAccreditation ?? startingAccreditationForTier(league.tier);
    const prevLevel = accreditationFromSeasons(prevAccredSeasons);
    c.coachAccreditation = prevAccredSeasons + 1;
    const newLevel = accreditationFromSeasons(c.coachAccreditation);
    if (newLevel > prevLevel) {
      c.news = [{ week: 0, type: 'info', text: `📋 Coaching accreditation advanced to ${accreditationLabel(c.coachAccreditation)}. New levels of football are opening up.` }, ...(c.news || [])].slice(0, 25);
    }
  }

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
  checkLegacyMilestonesAfterSeason(c, league.tier);

  // Staff tenure builds loyalty — long-serving staff resist poaching/leave events.
  c.staff = (c.staff || []).map((s) => ({ ...s, loyalty: (s.loyalty ?? 0) + 1 }));

  // Unsolicited job approach — only after an undefeated season, and only from a
  // higher tier. Browsing/applying remains available separately.
  const dominantApproach = buildDominantSeasonApproach(c, {
    losses: myRow.L || 0,
    games,
    currentTier: league.tier,
  });
  c.jobApproach = dominantApproach || null;
  if (dominantApproach) {
    c.news = [{
      week: 0, type: 'info',
      text: `📞 ${dominantApproach.clubName} (${dominantApproach.leagueShort}) have made an approach after your undefeated season.`,
    }, ...(c.news || [])].slice(0, 25);
    if (!Array.isArray(c.inbox)) c.inbox = [];
    const approachId = `approach_${c.season}_${dominantApproach.clubId}`;
    if (!c.inbox.some((m) => m.id === approachId)) {
      c.inbox.unshift({
        id: approachId,
        kind: 'job_offer',
        blocking: true,
        resolved: false,
        title: 'Club approach',
        detail: `${dominantApproach.clubName} (${dominantApproach.leagueShort}) want to talk after your unbeaten ${c.season} season. Wage ${fmtK(dominantApproach.wage)}/yr — "${dominantApproach.chairmanLine}"`,
        payload: { offer: dominantApproach },
        actions: [{ id: 'accept', label: 'Take the job' }, { id: 'decline', label: 'Stay loyal' }],
      });
    }
  }

  // Off-season notifications (staff moves, volunteer offers, transfer requests).
  if (!Array.isArray(c.inbox)) c.inbox = [];
  for (const note of generateOffseasonNotifications(c, league.tier)) {
    if (!c.inbox.some((m) => m.id === note.id)) c.inbox.unshift(note);
  }

  c.groundCondition = recoverGroundPreseason(c.groundCondition ?? 85);
  c.weeklyWeather = {};
  if ((league?.tier ?? 4) >= 3) c.staff = recoverVolunteers(c.staff);

  c.footyTripUsed = false;
  c.footyTripAvailable = false;

  const gfResult = (c.finalsResults || []).find((r) => r.label === 'Grand Final');
  const inGrandFinal = !!gfResult && (gfResult.home === c.clubId || gfResult.away === c.clubId);
  const madeFinalsRound = (c.finalsFinalists || []).includes(c.clubId) || champion;
  const prizeArgs = {
    premiership: champion,
    runnerUp: !champion && inGrandFinal,
    finals: !champion && !inGrandFinal && madeFinalsRound,
    woodenSpoon: myPos === sorted.length,
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

  // Football-department soft cap: luxury tax on staff spend above the cap,
  // charged once here with the other end-of-season money movements (T1/T2 only).
  {
    const fd = careerFootballDept(c, league.tier);
    if (fd.levy > 0) {
      c.finance.cash -= fd.levy;
      c.news = [{ week: 0, type: 'loss',
        text: `🧾 Football department tax: ${fmtK(fd.over)} over the soft cap → ${fmtK(fd.levy)} levy` },
      ...(c.news || [])].slice(0, 20);
    }
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

  // ── Membership milestone adjustments (persistent base multiplier) ──────────
  c.membershipBase = applyMembershipMilestone(c, {
    premiership: champion,
    finalsAppearance: madeFinalsRound && !champion,
    promoted,
    relegated,
    woodenSpoon: myPos === sorted.length,
  });

  // ── Board financial objective evaluation ─────────────────────────────────
  if (league.tier < 4) {
    const seasonNet = c.finance.cash - (c._seasonStartCash ?? c.finance.cash);
    const totalBudget = c.finance.transferBudget ?? 0;
    const spentBudget = Math.max(0, (c._seasonStartTransferBudget ?? totalBudget) - totalBudget);
    const spentFraction = (c._seasonStartTransferBudget ?? 0) > 0
      ? spentBudget / c._seasonStartTransferBudget
      : 0;
    const debtReduced = !c.bankLoan && !!c._seasonHadLoan;
    const objResult = evaluateBoardFinancialObjective(c, {
      seasonNet, transferSpentFraction: spentFraction, debtReduced,
    });
    if (objResult.met !== null) {
      ensureCareerBoard(c, findClub(c.clubId), PYRAMID[c.leagueKey] || league);
      applyBoardConfidenceDelta(c, objResult.delta);
      c.news = [{
        week: 0, type: objResult.met ? 'win' : 'loss',
        text: objResult.met
          ? `💼 Financial objective met — "${objResult.label}". Board confidence up.`
          : `💼 Financial objective missed — "${objResult.label}". Board expects better.`,
      }, ...(c.news || [])].slice(0, 25);
    }
  }
  // ── Facility loan repayments (annual, per season) ───────────────────────
  if (c.facilityLoans?.length) {
    const paidOff = [];
    const remaining = [];
    (c.facilityLoans || []).forEach(loan => {
      loan.seasonsLeft -= 1;
      c.finance.cash = (c.finance.cash ?? 0) - loan.annualRepayment;
      if (loan.seasonsLeft <= 0) {
        paidOff.push(loan);
      } else {
        remaining.push(loan);
      }
    });
    c.facilityLoans = remaining;
    paidOff.forEach(loan => {
      c.news = [{
        week: 0, type: 'info',
        text: `🏗️ Facility loan for ${loan.facilityKey} fully repaid ($${(loan.originalCost / 1000).toFixed(0)}k over 5 seasons).`,
      }, ...(c.news || [])].slice(0, 25);
    });
  }

  // Snapshot carry-forwards for next season's evaluation
  c._seasonStartCash = c.finance.cash;
  c._seasonStartTransferBudget = refillTransferBudget(c);
  c._seasonHadLoan = !!c.bankLoan;

  // ── Set next season's board financial objective ──────────────────────────
  if (league.tier < 4) {
    c.boardFinancialObjective = pickBoardFinancialObjective(c);
  } else {
    c.boardFinancialObjective = null;
    // Reset T4 season-scoped state
    c.t4GrantsThisSeason = 0;
    c.t4SponsorHuntActive = false;
    c.t4GrantApplicationPending = false;
    c.t4GrantResultWeek = null;
  }

  const beforeBudget = c.finance.transferBudget ?? 0;
  c.finance.transferBudget = c._seasonStartTransferBudget;
  const budgetChange = c.finance.transferBudget - beforeBudget;

  c.finance.annualIncome = recomputeAnnualIncome(c);

  // Lower tiers: auto-renew bottom-ranked expiring players at their current wage.
  const autoRenewPlayers = buildAutoRenewList(c, { tier: league.tier });
  if (autoRenewPlayers.length > 0) {
    c.squad = c.squad.map((p) => {
      if (autoRenewPlayers.some((ar) => ar.id === p.id)) {
        return { ...p, contract: (p.contract ?? 0) + 2 };
      }
      return p;
    });
    c.news = [{
      week: 0, type: 'info',
      text: `📋 ${autoRenewPlayers.length} fringe player${autoRenewPlayers.length > 1 ? 's' : ''} auto-renewed at existing terms.`,
    }, ...(c.news || [])].slice(0, 20);
  }
  c.pendingRenewals = buildRenewalQueue(c, { tier: league.tier });
  c.renewalsClosed = false;
  // Reset rival when moving between divisions so a new one is assigned next season.
  if (promoted || relegated) c.rivalClubId = null;
  // Fanbase shifts at season end based on promotion/relegation.
  c.fanbase = updateFanbase(c, league.tier, { promoted, relegated: relegated && !promoted });

  c.lastFinanceTickWeek = null;
  c.lastFinanceTickDay = null;
  c.weeklyHistory = [];
  c.cashCrisisStartWeek = c.finance.cash < 0 ? 0 : null;
  c.cashCrisisLevel = c.finance.cash < 0 ? 1 : 0;
  c.fundraisersUsed = {};
  c.communityGrantUsed = false;

  // T1/T2 season-start: league central distribution + equalisation support.
  // Paid for the tier the club is IN this season (promotion/relegation follows the new league).
  if (league.tier <= 2) {
    const dist = careerSeasonDistribution(c, league.tier);
    if (dist.total > 0) {
      c.finance.cash += dist.total;
      const label = league.tier === 1 ? 'AFL distribution' : 'League distribution';
      c.news = [{
        week: 0, type: 'info',
        text: `💰 ${label} received: $${(dist.total / 1_000_000).toFixed(1)}M (incl. $${Math.round(dist.equalisation / 1000).toLocaleString()}k equalisation support)`,
      }, ...(c.news || [])].slice(0, 25);
    }
    // High-performance department annual cost (funded, T1/T2).
    const hpBudget = careerHpEffects(c, league.tier);
    if (hpBudget.cost > 0) {
      c.finance.cash -= hpBudget.cost;
      c.news = [{ week: 0, type: 'info',
        text: `🔬 Sports science (${hpBudget.label}) funded: −$${(hpBudget.cost / 1_000_000).toFixed(2)}M · injuries ×${hpBudget.injuryRateMult.toFixed(2)}, recovery +${hpBudget.recoveryWeeksBonus}wk` },
      ...(c.news || [])].slice(0, 25);
    }
    // Stadium naming-rights deal — pay this season's value, then age the term.
    const deal = activeNamingRights(c);
    if (deal) {
      c.finance.cash += deal.annualValue;
      c.news = [{ week: 0, type: 'info',
        text: `🏟️ Naming rights (${deal.name}): +$${(deal.annualValue / 1_000_000).toFixed(2)}M · ${deal.yearsLeft - 1} yr${deal.yearsLeft - 1 === 1 ? '' : 's'} left` },
      ...(c.news || [])].slice(0, 25);
      const yearsLeft = deal.yearsLeft - 1;
      if (yearsLeft <= 0) {
        c.namingRights = null;
        c.news = [{ week: 0, type: 'warning', text: `🏟️ Naming-rights deal with ${deal.name} has expired — re-sign in Facilities.` }, ...(c.news || [])].slice(0, 25);
      } else {
        c.namingRights = { ...deal, yearsLeft };
      }
    }
  }

  // T4 season-start: collect registration fees + deduct annual fixed costs.
  if (league.tier === 4) {
    const regFees = collectRegistrationFees(c);
    const annualFixed = T4_COMMUNITY.affiliationFeeAnnual + T4_COMMUNITY.insuranceAnnual;
    const equip = rand(T4_COMMUNITY.equipmentAnnual.min, T4_COMMUNITY.equipmentAnnual.max);
    c.finance.cash += regFees - annualFixed - equip;
    c.news = [{
      week: 0, type: 'info',
      text: `📝 Season started: registration fees +$${regFees.toLocaleString()} · affiliation/insurance/equipment −$${(annualFixed + equip).toLocaleString()}`,
    }, ...(c.news || [])].slice(0, 25);
  }

  // T3 season-start: collect player registration fees.
  if (league.tier === 3) {
    const regFees = (c.squad || []).length * T3_COMMUNITY.registrationFeePerPlayer;
    c.finance.cash += regFees;
    c.news = [{ week: c.week, type: 'info', text: `📋 Player registrations collected — $${Math.round(regFees / 1000)}k to kick off the season.` }, ...(c.news || [])].slice(0, 25);
  }

  // T4 fundraisers also available (same as Tier 3, with committee tone)
  if (league.tier === 4) {
    c.t4GrantsThisSeason = 0;
    c.t4SponsorHuntActive = false;
    c.t4GrantApplicationPending = false;
    c.t4GrantResultWeek = null;
  }

  // Season-start membership tally — the off-field ladder. YoY delta only when
  // last season was the same tier (cross-tier counts aren't comparable);
  // all-time record fires once per new high (first tally seeds it silently).
  {
    const members = careerMemberCount(c, league.tier);
    const prev = c.lastMemberCount;
    const delta = prev && prev.tier === league.tier ? members - prev.count : null;
    const deltaTxt = delta == null ? '' : delta >= 0 ? ` — up ${delta.toLocaleString()} on last year` : ` — down ${Math.abs(delta).toLocaleString()} on last year`;
    c.news = [{ week: 0, type: delta != null && delta < 0 ? 'loss' : 'info', text: `📈 Membership tally: ${members.toLocaleString()}${deltaTxt}` }, ...(c.news || [])].slice(0, 25);
    if (c.memberRecord == null) {
      c.memberRecord = members; // seed on first tally, no fanfare
    } else if (members > c.memberRecord) {
      c.memberRecord = members;
      c.news = [{ week: 0, type: 'win', text: `🎉 Club record membership: ${members.toLocaleString()}!` }, ...(c.news || [])].slice(0, 25);
    }
    c.lastMemberCount = { count: members, tier: league.tier };
  }

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
    const bClub = brownlowWinner.club ? ` (${brownlowWinner.club})` : '';
    c.news = [{ week: 0, type: 'info', text: `🥇 Brownlow Medal: ${brownlowWinner.name}${bClub} — ${brownlowWinner.votes} votes.` }, ...c.news].slice(0, 25);
  }
  if (colemanWinner) {
    const cClub = colemanWinner.club ? ` (${colemanWinner.club})` : '';
    c.news = [{ week: 0, type: 'win', text: `🥇 Coleman Medal: ${colemanWinner.name}${cClub} — ${colemanWinner.goals} goals.` }, ...c.news].slice(0, 25);
  }
  // Celebrate any of the club's own players named in the All-Australian team.
  const myAllAustralians = (c.seasonSummary?.allAustralian || []).filter((p) => p.isMine);
  if (myAllAustralians.length) {
    const names = myAllAustralians.map((p) => p.name).join(', ');
    c.news = [{ week: 0, type: 'win', text: `⭐ All-Australian honours: ${names} named in the Team of the Year.` }, ...c.news].slice(0, 25);
  }
  if (clubChampion) {
    c.news = [{ week: 0, type: 'info', text: `🏅 Club Champion: ${clubChampion.name} — ${clubChampion.votes} Brownlow votes this season.` }, ...c.news].slice(0, 25);
  }
  if (normSmith) {
    c.news = [{ week: 0, type: 'win', text: `🏆 Norm Smith Medal: ${normSmith.name} — best on ground in the Grand Final.` }, ...c.news].slice(0, 25);
  }
  if (champion) bumpClubCulture(c, 15);
  c.crisisFiredThisSeason = false;

  // Generate staff market for tier 1–3 clubs; clear it for tier 4 (grassroots)
  if (league.tier <= 3) {
    c.staffMarket = generateStaffMarket(c, league);
  } else {
    c.staffMarket = [];
  }


  // AFL expansion: when new clubs join (e.g. Tasmania 2028), rebuild the fixture schedule
  if (c.leagueKey === 'AFL') {
    const newClubs = getAFLClubsForSeason(c.season);
    const prevClubs = getAFLClubsForSeason(c.season - 1);
    if (newClubs.length !== prevClubs.length) {
      setFixtures(c, newClubs);
      newClubs
        .filter(cl => !prevClubs.find(o => o.id === cl.id))
        .forEach(cl => {
          c.news = [
            { week: 0, type: 'info', text: `🏉 ${cl.name} join the AFL as the ${newClubs.length}th team for ${c.season}!` },
            ...(c.news || []),
          ].slice(0, 25);
        });
    }
  }

  const nextLeagueForCal = PYRAMID[c.leagueKey] ?? league;
  const seasonClub = findClub(c.clubId);
  const regGround = getClubGround(seasonClub, c.facilities?.stadium?.level ?? 1, nextLeagueForCal?.tier ?? league?.tier ?? 2);
  c.clubGround = regGround;
  c.groundName = regGround.shortName;
  const calPool = competitionClubsForCareer(c);
  const calClubs = calPool.length ? calPool : (nextLeagueForCal?.clubs ?? league?.clubs ?? []);
  c.eventQueue = generateSeasonCalendar(c.season, calClubs, c.fixtures, c.clubId, {
    nationalDraft: (nextLeagueForCal?.tier ?? league?.tier) === 1,
  });
  ensureCareerBoard(c, seasonClub, nextLeagueForCal ?? league);
  generateSeasonObjectives(c, nextLeagueForCal ?? league);
  planSeasonBoardMeetings(c);
  updateBoardObjectiveProgress(c, nextLeagueForCal ?? league);
  const dynClubCount =
    competitionClubsForCareer(c).length || calClubs.length || PYRAMID[c.leagueKey]?.clubs?.length || 12;
  assignDynastyQuestsForSeason(c, nextLeagueForCal?.tier ?? league?.tier ?? 2, dynClubCount);
  c.currentDate = `${c.season - 1}-11-01`;
  c.phase = 'preseason';
  c.lastEvent = null;
  c.inMatchDay = false;
  c.currentMatchResult = null;
  clearPostSeasonTransient(c);
  primeSeasonStoryState(c);
  syncAchievements(c); // unlock any Steam achievements earned this season
  return c;
}

export function primeSeasonStoryState(career) {
  const lg = PYRAMID[career.leagueKey];
  if (!lg) return;
  refreshTurningPointForNextFixture(career, lg);
}

/**
 * Advance the career one step (finals, trade period, draft countdown, or next calendar event).
 * @param {{ career: object, league: object, club: object, setCareer: function, setScreen: function, setTab?: function }} ctx
 */
export function advanceCareerNextEvent({ career, league, club, setCareer, setScreen }) {
  const c = JSON.parse(JSON.stringify(career));

  // A live match is paused at half time — the coach's call must resolve it first.
  if (c.liveMatch) {
    setCareer(c);
    return;
  }

  // Selection integrity: injured/suspended players can't take the field, and ids
  // belonging to retired/released/traded players are cleared from their slots.
  c.lineup = sanitizeLineup(c.lineup, c.squad);

  ensureDynastyAssignments(c, league?.tier ?? 3, competitionClubsForCareer(c).length || (league?.clubs?.length ?? 0));
  ensureLegacyMilestones(c, league?.tier ?? 3);

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
    const finalists = getFinalsTeams(c.ladder, league?.tier ?? 2);
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

  // Operating cashflow: one accrual per distinct calendar day.
  // Tier 4 uses a stripped grassroots tick (no wages, no broadcast, sponsor only).
  const isGrassroots = (league?.tier ?? 3) === 4;
  const financePulse = isGrassroots ? tickGrassrootsFinance(c) : tickWeeklyCashflow(c);
  if (financePulse !== 0 && !isGrassroots) {
    weeklyClubOperationsPulse(c, league?.tier ?? 3);
  }

  // Fortnightly journalist board confidence effect — guard with lastJournalistTickWeek
  // to ensure it fires at most once per unique week value, not once per advance call.
  if (c.journalist && c.week % 2 === 0 && c.week !== (c.lastJournalistTickWeek ?? -1)) {
    c.lastJournalistTickWeek = c.week;
    const jImpact = journalistBoardImpact(c.journalist);
    if (jImpact !== 0) {
      const bc = Math.max(0, Math.min(100, (c.finance?.boardConfidence ?? 50) + jImpact));
      c.finance = { ...c.finance, boardConfidence: bc };
    }
  }

  // Volunteer burnout — weekly fatigue tick for T3/T4 clubs (once per unique week)
  if ((league?.tier ?? 4) >= 3 && c.week !== (c.lastVolunteerBurnoutWeek ?? -1)) {
    c.lastVolunteerBurnoutWeek = c.week;
    const { staff: updatedStaff, news: burnoutNews } = tickVolunteerBurnout(c);
    c.staff = updatedStaff;
    if (burnoutNews.length > 0) {
      c.news = [...burnoutNews.map(n => ({ ...n, week: c.week })), ...(c.news ?? [])].slice(0, 25);
    }
  }

  // Committee drama — fortnightly check for low-mood members venting before they burn out
  if ((league?.tier ?? 4) >= 3 && c.week % 2 === 0 && c.week !== (c.lastDramaWeek ?? -1)) {
    c.lastDramaWeek = c.week;
    const drama = checkCommitteeDrama(c);
    if (drama) c.news = [{ ...drama, week: c.week }, ...(c.news ?? [])].slice(0, 25);
  }

  // Trade request check — runs fortnightly, only for players in contract final year or with very low morale
  if (c.week % 3 === 0 && c.week !== (c.lastTradeRequestWeek ?? -1)) {
    c.lastTradeRequestWeek = c.week;
    const candidates = (c.squad || []).filter(p => {
      const inFinalYear = (p.contractYears ?? 1) <= 1;
      const unhappy = (p.morale ?? 70) < 40;
      const highValue = (p.overall ?? 60) >= 72; // only quality players demand trades
      const notAlreadyRequesting = !p.hasTradeRequest;
      return notAlreadyRequesting && highValue && (inFinalYear || unhappy) && rng() < 0.08;
    });
    if (candidates.length > 0) {
      const player = pick(candidates);
      c.squad = c.squad.map(p => p.id === player.id ? { ...p, hasTradeRequest: true } : p);
      const reason = (player.morale ?? 70) < 40 ? 'unhappy with their situation at the club' : 'in the final year of their contract and seeking a fresh challenge';
      c.news = [{
        week: c.week, type: 'warning',
        text: `🚨 ${player.firstName} ${player.lastName} has informed the club they want a trade. They are ${reason}.`
      }, ...(c.news || [])].slice(0, 25);
      c.pendingTradeRequests = [...(c.pendingTradeRequests || []), {
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        position: player.position,
        overall: player.overall,
        reason,
        week: c.week,
      }];
    }
  }

  // Scout deployments — process returns, watchlist staleness, rival interest (once per unique week)
  if (c.week !== (c.lastScoutTickWeek ?? -1)) {
    c.lastScoutTickWeek = c.week;
    const origDeployments = c.scoutDeployments || [];
    const { newEntries, completedIds, news: scoutNews } = processReturningDeployments(c, c.week);
    if (completedIds.length > 0) {
      c.scoutWatchlist = [...(c.scoutWatchlist || []), ...newEntries];
      c.scoutDeployments = origDeployments.map(d =>
        completedIds.includes(d.id) ? { ...d, status: 'returned' } : d
      );
      for (const id of completedIds) {
        const dep = origDeployments.find(d => d.id === id);
        if (dep) c.leagueRelationships = bumpRelationship(c.leagueRelationships, dep.leagueKey, c, 10);
      }
    }
    if ((c.scoutWatchlist || []).length > 0) {
      c.scoutWatchlist = tickWatchlistStaleness(c.scoutWatchlist, c.week);
      c.scoutWatchlist = tickRivalInterest(c.scoutWatchlist, rng);
      const urgent = c.scoutWatchlist.filter(w => !w.isStale && (w.rivalInterest || 0) >= 2);
      if (urgent.length > 0 && rng() < 0.35) {
        const w = urgent[Math.floor(rng() * urgent.length)];
        scoutNews.push({ type: 'info', text: `⚡ Intel: ${w.rivalInterest} club${w.rivalInterest > 1 ? 's' : ''} tracking ${w.firstName} ${w.lastName} (${w.fromLeagueShort || ''}) — act soon.` });
      }
    }
    const trustedLeagues = Object.entries(c.leagueRelationships || {}).filter(([, r]) => r.score >= 80);
    if (trustedLeagues.length > 0 && rng() < 0.08) {
      const [lKey] = trustedLeagues[Math.floor(rng() * trustedLeagues.length)];
      const lg = PYRAMID[lKey];
      if (lg) scoutNews.push({ type: 'info', text: `🤝 Tip-off from ${lg.short}: a player is looking for a new club — consider deploying a scout.` });
    }
    if (scoutNews.length > 0) {
      c.news = [...scoutNews.map(n => ({ ...n, week: c.week })), ...(c.news || [])].slice(0, 25);
    }
  }

  // T4 cash-shortage escalation: no sacking — instead push the coach to find
  // a sponsor or lodge a grant application to cover the shortfall.
  if (isGrassroots && (c.finance?.cash ?? 0) < 0) {
    const weeksNeg = (c.week ?? 0) - (c.cashCrisisStartWeek ?? c.week ?? 0);
    if (weeksNeg >= T4_COMMUNITY.cashShortageGrantWeeks && !c.t4GrantApplicationPending) {
      c.t4GrantApplicationPending = true;
      c.t4GrantResultWeek = (c.week ?? 0) + 3;
      c.news = [{ week: c.week, type: 'loss',
        text: `🏛️ The committee has lodged an emergency council grant application. A decision is expected in 2–3 weeks.` },
      ...(c.news || [])].slice(0, 25);
    } else if (weeksNeg >= T4_COMMUNITY.cashShortageHuntWeeks && !c.t4SponsorHuntActive && !c.t4GrantApplicationPending) {
      c.t4SponsorHuntActive = true;
      c.sponsorOffers = generateSponsorOffers(c, 4, 3);
      c.news = [{ week: c.week, type: 'loss',
        text: `💸 The club is running out of money. The committee needs a local sponsor deal — check the Sponsors tab.` },
      ...(c.news || [])].slice(0, 25);
    }
  }
  // Resolve pending T4 grant application
  if (isGrassroots && c.t4GrantApplicationPending && c.t4GrantResultWeek != null && (c.week ?? 0) >= c.t4GrantResultWeek) {
    const won = rng() < 0.55; // 55% success rate
    if (won) {
      const grant = rand(COMMUNITY_GRANT.min, COMMUNITY_GRANT.max);
      c.finance.cash += grant;
      c.t4GrantsThisSeason = (c.t4GrantsThisSeason ?? 0) + grant;
      c.news = [{ week: c.week, type: 'win',
        text: `🤝 Council grant approved: +$${grant.toLocaleString()}! The money comes just in time.` },
      ...(c.news || [])].slice(0, 25);
    } else {
      c.news = [{ week: c.week, type: 'loss',
        text: `🏛️ Grant application unsuccessful. The council funded other priorities this round — time to find a sponsor.` },
      ...(c.news || [])].slice(0, 25);
      // Fall through to sponsor hunt if still short
      if ((c.finance?.cash ?? 0) < 0 && !c.t4SponsorHuntActive) {
        c.t4SponsorHuntActive = true;
        c.sponsorOffers = generateSponsorOffers(c, 4, 3);
      }
    }
    c.t4GrantApplicationPending = false;
    c.t4GrantResultWeek = null;
  }

  const prevCrisis = c.cashCrisisLevel ?? 0;
  c.cashCrisisLevel = isGrassroots ? 0 : cashCrisisLevel(c);
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
        facilities: c.facilities,
      },
    );
    c.squad = squad;

    const intensity = c.training?.intensity ?? 60;
    const recoveryFocus = c.training?.focus?.recovery ?? 20;
    const medLevel = c.facilities?.medical?.level ?? 1;
    const mit = medicalStaffMitigation(c.staff);
    const hpTr = careerHpEffects(c, league.tier);
    const trainingInjuryProb = effectiveInjuryRate(c,
      Math.max(0, ((intensity - 50) * 0.0014) + 0.012 - medLevel * 0.005 - (recoveryFocus - 20) * 0.0008 - mit.probReduce)) * hpTr.injuryRateMult;
    const trainingInjuryPool = lineupPlayersOrdered(c.squad, c.lineup);
    if (rng() < trainingInjuryProb && trainingInjuryPool.length > 0) {
      const injId = pick(trainingInjuryPool).id;
      const inj = pickInjury();
      const trainingMedRating = (c.staff || []).find((s) => s.id === 's6')?.rating ?? 60;
      const trainingMedReduction = (trainingMedRating >= 85 ? 2 : trainingMedRating >= 70 ? 1 : 0) + hpTr.recoveryWeeksBonus;
      const trainingWeeks = Math.max(1, Math.round(Math.min(inj.weeks, 2) - trainingMedReduction)); // ponytail: cap training injuries at 2w base; severity still reflected in label
      c.squad = c.squad.map((p) => {
        if (p.id !== injId) return p;
        let concussionsThisSeason = p.concussionsThisSeason || 0;
        let finalTrainingWeeks = trainingWeeks;
        if (inj.type === 'concussion') {
          if (concussionsThisSeason >= 1) finalTrainingWeeks += 2;
          concussionsThisSeason += 1;
        }
        return { ...p, injured: finalTrainingWeeks, injuryType: inj.type, injuryLabel: inj.label, injurySeverity: inj.severity, concussionsThisSeason };
      });
      const injPlayer = c.squad.find((p) => p.id === injId);
      if (injPlayer) {
        c.news = [{ week: c.week, type: 'loss', text: `🩹 ${injPlayer.firstName} ${injPlayer.lastName} — ${inj.label} at training (${inj.severity}, est. ${injPlayer.injured}w)` }, ...(c.news || [])].slice(0, 20);
      }
    }

    const recoveryBoost = Math.round((recoveryFocus - 20) * 0.05);
    if (recoveryBoost > 0) {
      c.squad = c.squad.map((p) => ({ ...p, fitness: clamp((p.fitness ?? 90) + recoveryBoost, 30, 100) }));
    }

    applyCaptainWeeklyEffect(c, c.difficulty);

    if ((league.tier === 3 || league.tier === 4) && rng() < 0.18) {
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
    if ((league.tier === 3 || league.tier === 4) && !c.communityGrantUsed && rng() < 0.06) {
      const grant = rand(COMMUNITY_GRANT.min, COMMUNITY_GRANT.max);
      c.finance.cash += grant;
      c.communityGrantUsed = true;
      if (league.tier === 4) c.t4GrantsThisSeason = (c.t4GrantsThisSeason ?? 0) + grant;
      c.news = [{ week: c.week, type: 'win', text: `🤝 Community grant approved: +$${grant.toLocaleString()}. The council came through.` }, ...(c.news || [])].slice(0, 25);
    }

    // gains is keyed by attribute name → total gain across the lineup
    // (see calendar.js applyTraining), e.g. { kicking: 5, marking: 3 }.
    const notableGains = Object.entries(gains || {})
      .filter(([, total]) => total >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([attr, total]) => `+${total} ${attr}`);
    if (notableGains.length > 0) {
      c.news = [{ week: c.week, type: 'info', text: `🏋️ Training boost: ${notableGains.slice(0, 3).join(', ')}` }, ...(c.news || [])].slice(0, 40);
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
    if (ev.name === 'Transfer Window Opens' && league.tier !== 3) {
      // Tier 3 has no trade market — recruitment happens by word of mouth.
      c.tradeWindowBriefingPending = true;
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
        const grudge = clubFinalsGrudgeTowardPlayer(c, offeringClub.id);
        if (grudge > 0 && rng() < 0.22 + Math.min(3, grudge) * 0.11) continue;
        let cashOffer = Math.round(targetPlayer.value * (0.5 + rng() * 0.6));
        if (grudge > 0) cashOffer = Math.round(cashOffer * (1 - 0.09 * Math.min(grudge, 2)));
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
          offerPlayerSnapshot: swapPlayer ? tradePlayerSnapshot(swapPlayer) : null,
          status: 'pending',
          createdAt: ev.date,
        });
      }
      c.pendingTradeOffers = [...(c.pendingTradeOffers || []), ...offers];
      syncRecruitPhaseInboxRows(c);
      if (offers.length > 0) {
        extraNews.push({ week: c.week, type: 'info', text: `📨 ${offers.length} new trade offer${offers.length > 1 ? 's' : ''} on the table — check Recruit → Trades.` });
      }
    }
    if (ev.name === 'National Draft Day' && careerHasNationalDraft(c, league)) {
      const inaugural = !(c.history?.length);
      if (!(c.draftPool?.length) || !(c.draftOrder?.length)) {
        // A player's very first draft arrives fully scouted so they can learn the board;
        // later drafts start hidden and need combine scouting through the year.
        seedNationalDraft(c, league, { inaugural, force: true, revealAll: inaugural });
      }
      c.draftPhase = 'live';
      c.draftHistory = c.draftHistory || [];
      syncRecruitPhaseInboxRows(c);
      extraNews.push({
        week: c.week,
        type: 'info',
        text: '📋 National Draft Day — picks are live one at a time. Open the draft room when you are on the clock.',
      });
      c.lastEvent = { type: 'key_event', name: ev.name, description: ev.description, action: ev.action, date: ev.date };
      c.news = [
        { week: c.week, type: 'info', text: `📅 ${ev.name}: ${ev.description}` },
        ...extraNews,
        ...(c.news || []),
      ].slice(0, 20);
      markTutorialCompleteAfterAdvance(c);
      setCareer(c);
      setScreen('draft');
      return;
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
      syncRecruitPhaseInboxRows(c);
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
    syncRecruitPhaseInboxRows(c);
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
    const _hcPreseason = (c.staff || []).find(s => s.id === 's1');
    const myRating = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff), null, c.playerRoles)
      + philosophyTacticFit(_hcPreseason?.philosophy, c.tacticChoice || 'balanced');
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

    // Vote-getters: players who stood out get a form boost (best-on-ground recognition).
    const votesById = {};
    (result.votes || []).forEach((v) => { votesById[v.playerId] = v.votes; });

    c.squad = c.squad.map((p) => {
      if (!c.lineup.includes(p.id)) return p;
      // Pre-season benefit: match sharpness nets +5 fitness on top of the exercise cost.
      // Training camp has built base fitness; game intensity is the final polish.
      const fitNet = 5;
      const formChange = won ? rand(1, 4) : drew ? rand(-1, 2) : rand(-3, 1);
      const voteBoost = (votesById[p.id] ?? 0) > 0 ? 2 : 0;
      const gAdd = isForwardPreferred(p) ? rand(0, 2) : 0;
      const newForm = clamp(p.form + formChange + voteBoost, 30, 100);
      const formHistory = [...(p.formHistory || []), p.form].slice(-5);
      return {
        ...p, fitness: clamp(p.fitness + fitNet, 30, 100), form: newForm, formHistory,
        goals: p.goals + gAdd, behinds: p.behinds + rand(0, 1), disposals: p.disposals + rand(6, 18),
        marks: p.marks + rand(1, 4), tackles: p.tackles + rand(1, 3), gamesPlayed: p.gamesPlayed + 1,
        legendGames: (p.legendGames || 0) + 1,
      };
    });

    // Injuries are real in pre-season — dramatic and momentum-disrupting.
    const medLevel = c.facilities?.medical?.level ?? 1;
    const mit = medicalStaffMitigation(c.staff);
    (result.injuredPlayerIds || []).forEach((pid) => {
      if (!c.lineup.includes(pid)) return;
      const baseWeeks = rand(1, 3);
      const weeks = Math.max(1, baseWeeks - Math.max(0, medLevel - 1) - mit.weekReduce);
      c.squad = c.squad.map((p) => (p.id === pid ? { ...p, injured: weeks } : p));
    });
    if (rng() < 0.08 && c.lineup.length > 0) {
      const injId = pick(c.lineup.filter(id => c.squad.find(p => p.id === id && !p.injured)));
      if (injId) {
        const weeks = Math.max(1, rand(1, 3) - Math.max(0, medLevel - 1) - mit.weekReduce);
        c.squad = c.squad.map((p) => (p.id === injId ? { ...p, injured: weeks } : p));
        const injPlayer = c.squad.find(p => p.id === injId);
        if (injPlayer) {
          c.news = [{ week: 0, type: 'loss',
            text: `🤕 Pre-season injury: ${injPlayer.firstName} ${injPlayer.lastName} out ${weeks} week${weeks > 1 ? 's' : ''} — not how you want to start pre-season.` },
          ...(c.news || [])].slice(0, 15);
        }
      }
    }

    const preText = won
      ? `🏉 ${ev.label}: ${findClub(c.clubId)?.short || 'Us'} def. ${opp?.short || 'Opp'} ${myTotal}–${oppTotal} — result doesn't count, but promising signs.`
      : drew
        ? `🏉 ${ev.label}: Draw ${myTotal}–${oppTotal} vs ${opp?.short || 'Opp'} — no ladder points, coach will be taking notes.`
        : `🏉 ${ev.label}: ${opp?.short || 'Opp'} def. ${findClub(c.clubId)?.short || 'Us'} ${oppTotal}–${myTotal} — result doesn't count, but the coach will be taking notes.`;
    c.news = [{ week: 0, type: won ? 'win' : drew ? 'draw' : 'loss', text: preText },
    ...(c.news || [])].slice(0, 15);
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

    // Scheduled bye week: the player's club sits out this round for recovery.
    const isByeRound = c.byeMap?.[c.clubId] === ev.round;
    if (isByeRound) {
      c.hasByeThisWeek = true;
      c.squad = c.squad.map((p) => ({ ...p, fitness: clamp((p.fitness ?? 90) + 4, 30, 100) }));
      c.news = [{
        week: ev.round,
        type: 'info',
        text: '🏳️ Bye week — players rest and recover. Fitness lifts across the squad.',
      }, ...(c.news || [])].slice(0, 25);
    } else {
      c.hasByeThisWeek = false;
    }

    // Assign a local rival once per stint at a club — picked from same-division opponents.
    if (!c.rivalClubId) {
      const leagueClubs = competitionClubsForCareer(c).filter((cl) => cl.id !== c.clubId);
      if (leagueClubs.length > 0) c.rivalClubId = pick(leagueClubs).id;
    }

    c.aiSquads = ensureSquadsForLeague(c, league);

    round.forEach((m) => {
      if (m.home === c.clubId || m.away === c.clubId) {
        const isHome = m.home === c.clubId;
        const opp = findClub(isHome ? m.away : m.home);
        const _hcRound = (c.staff || []).find(s => s.id === 's1');
        let myRating = teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff), null, c.playerRoles);
        myRating += getCaptainMatchBonus(c, false);
        myRating += calcSynergyBonus(c.partnerships, c.lineup);
        myRating += philosophyTacticFit(_hcRound?.philosophy, c.tacticChoice || 'balanced');
        const scoutPrep = scoutPrepRatingBonus(c, opp.id, ev.round);
        myRating += scoutPrep;
        // H2H psychological factor: bogey teams suppress confidence; dominated
        // opponents inflate it. Only kicks in after 3 games (enough data).
        // Capped at ±4 to stay within the noise band of other modifiers.
        const h2hRec = c.headToHead?.[opp.id];
        if (h2hRec && (h2hRec.wins + h2hRec.losses + h2hRec.draws) >= 3) {
          const streak = h2hRec.streak ?? 0;
          myRating += streak <= -5 ? -4 : streak <= -3 ? -2 : streak >= 5 ? 4 : streak >= 3 ? 2 : 0;
        }
        const oppSquad = c.aiSquads?.[opp.id];
        const oppLineup = oppSquad ? selectAiLineup(oppSquad) : [];
        const oppLineupIds = oppLineup.map((p) => p.id);
        const neutralTraining = { intensity: 60, focus: {} };
        const baseOppRating = oppSquad?.length
          ? teamRating(oppSquad, oppLineupIds, neutralTraining, 1, 60)
          : aiClubRating(opp.id, league.tier);
        // Difficulty-aware competitiveness: opponents push back harder so a
        // strong squad no longer cruises every week (grassroots = gentle).
        const diffCfg = getDifficultyConfig(c.difficulty);
        const oppRating = competitiveOppRating(baseOppRating, myRating, {
          flat: diffCfg.aiRatingFlat ?? 0,
          gapClose: diffCfg.aiGapClose ?? 0,
        });
        const oppRatingDelta = oppRating - baseOppRating;
        const playerLineup = c.lineup.map((id) => c.squad.find((p) => p.id === id)).filter(Boolean);
        const oppTactic = resolveAiOppTactic(opp.id, oppRating, myRating);
        let groundScoringMod = 1.0; let groundAccuracyMod = 1.0;
        if (isHome) {
          const band = groundConditionBand(c.groundCondition ?? 85);
          groundScoringMod = band.scoringMod;
          groundAccuracyMod = band.accuracyMod;
        }
        const travelPen = awayTravelRatingPenalty(isHome, c.clubId, opp.id);
        const matchWeather = ensureWeatherForWeek(c, ev.round);
        const getPlayerStrengthForQuarter = (qi) =>
          teamRating(c.squad, c.lineup, c.training, avgFacilities(c.facilities), avgStaff(c.staff), qi, c.playerRoles)
          + benchStrengthBonus(c.squad, c.lineup, qi)
          + interchangeRotationBonus(c.squad, c.lineup, qi)
          + scoutPrep
          - travelPen;
        const getOppStrengthForQuarter = oppSquad?.length
          ? (qi) =>
              teamRating(oppSquad, oppLineupIds, neutralTraining, 1, 60, qi)
              + benchStrengthBonus(oppSquad, oppLineupIds, qi)
              + oppRatingDelta
          : null;
        // Simulate the first half now; the second half waits on the coach's
        // half-time call (resolveLiveMatchHalfTime applies the call + finishes).
        const simState = initMatchSim(
          { rating: isHome ? myRating : oppRating },
          { rating: isHome ? oppRating : myRating },
          isHome, myRating,
          {
            tactic: c.tacticChoice || 'balanced', playerLineup, oppLineup, oppTactic, groundScoringMod, groundAccuracyMod,
            weather: matchWeather,
            getPlayerStrengthForQuarter,
            ...(getOppStrengthForQuarter ? { getOppStrengthForQuarter } : {}),
            homeFixtureAdvantage: resolveHomeAdvantageForFixture(
              c, league, isHome, findClub(c.clubId), opp,
            ),
          },
        );
        simMatchQuarter(simState);
        simMatchQuarter(simState);
        c.liveMatch = {
          simState,
          meta: {
            round: ev.round,
            phase: ev.phase,
            date: ev.date,
            themedRound: ev.themedRound ?? null,
            home: m.home,
            away: m.away,
            isHome,
            oppId: opp.id,
            turningPoint: m.turningPoint || null,
          },
        };
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
    applyLeagueTradeNews(c, league);

    c.aiSquads = tickAiSquads(c.aiSquads || {});
    c.squad = c.squad.map((p) => {
      const susp = Math.max(0, (p.suspended || 0) - 1);
      return susp !== (p.suspended || 0) ? { ...p, suspended: susp } : p;
    });

    c.squad = c.squad.map((p) => {
      if (c.lineup.includes(p.id)) return p;
      return { ...p, fitness: clamp((p.fitness ?? 90) + rand(8, 14) + careerHpEffects(c, league.tier).preseasonFitnessBonus, 30, 100), injured: Math.max(0, (p.injured ?? 0) - 1) };
    });

    // Player match in progress — pause at half time for the coach's call.
    // Match effects (stats, revenue, board, news) apply at full time via
    // resolveLiveMatchHalfTime; everything above (AI results, squad ticks)
    // already happened.
    if (c.liveMatch) {
      const lmOpp = findClub(c.liveMatch.meta.oppId);
      c.inMatchDay = true;
      c.currentMatchResult = {
        live: true,
        isHome: c.liveMatch.meta.isHome,
        opp: lmOpp,
        quarters: c.liveMatch.simState.quarters,
        events: c.liveMatch.simState.events,
        isPreseason: false,
        label: `Round ${ev.round}`,
        isAFL: league.tier === 1,
      };
      markTutorialCompleteAfterAdvance(c);
      setCareer(c);
      return;
    }

    // Bye round — no player match this week.
    applyPostRoundBoardAndCalendar(c, league, club, {
      round: ev.round, phase: ev.phase, date: ev.date, themedRound: ev.themedRound ?? null, turningPoint: null,
    }, null);

    // Press moment trigger (post-round)
    const pressMomentBye = pickPressMoment(c);
    if (pressMomentBye) {
      c.pendingPressMoment = {
        id: pressMomentBye.id,
        prompt: typeof pressMomentBye.prompt === 'function' ? pressMomentBye.prompt(c) : pressMomentBye.prompt,
      };
    }

    markTutorialCompleteAfterAdvance(c);
    setCareer(c);
    return;
  }

  markTutorialCompleteAfterAdvance(c);
  setCareer(c);
}

// =============================================================================
// Live match — half-time coaching call + deferred full-time effects
// =============================================================================

const MILESTONE_GAMES = new Set([1, 50, 100, 150, 200, 250, 300]);
const MILESTONE_GOALS = [50, 100, 200, 300, 500];

/** Player story beats from one match: debuts, game milestones, first goals, career goal tallies, big bags. */
function collectMatchMilestones(c, attribution, round) {
  const items = [];
  const boostIds = new Set();
  c.squad.forEach((p) => {
    if (!c.lineup.includes(p.id)) return;
    const name = p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Player');
    const newGames = (p.gamesPlayed || 0) + 1;
    const att = attribution[p.id] || { goals: 0 };
    if (newGames === 1) {
      items.push({ week: round, type: 'win', text: `🌟 ${name} makes his senior debut — a moment the kid will never forget.` });
      boostIds.add(p.id);
    } else if (MILESTONE_GAMES.has(newGames)) {
      items.push({ week: round, type: 'win', text: `🏅 Game ${newGames} for ${name} — the banner gets a workout.` });
      boostIds.add(p.id);
    }
    // Career goal milestones — p.careerGoals = previous seasons, p.goals = this season so far
    if ((att.goals || 0) > 0) {
      const prevTotal = (p.careerGoals || 0) + (p.goals || 0);
      const newTotal = prevTotal + att.goals;
      for (const milestone of MILESTONE_GOALS) {
        if (prevTotal < milestone && newTotal >= milestone) {
          items.push({ week: round, type: 'win', text: `🎯 ${name} boots career goal #${milestone}! A milestone to savour.` });
          boostIds.add(p.id);
        }
      }
    }
    if ((p.goals || 0) === 0 && (p.careerGoals || 0) === 0 && (att.goals || 0) > 0) {
      items.push({ week: round, type: 'win', text: `🏉 First career goal for ${name}! The bench loved that one.` });
      boostIds.add(p.id);
    }
    if ((att.goals || 0) >= 5) {
      items.push({ week: round, type: 'win', text: `🎯 ${name} kicks ${att.goals} — a bag to remember.` });
      boostIds.add(p.id);
    }
  });
  return { items, boostIds };
}

/**
 * Everything that needs the final player-match result: stats, injuries, votes,
 * revenue, board confidence, fan mood, news and rivalry tracking. Runs at full
 * time (resolveLiveMatchHalfTime), not when the calendar advances.
 */
function applyPlayerMatchEffects(c, league, meta, myResult) {
  const { result, won, drew, isHome } = myResult;
  const cfg = getDifficultyConfig(c.difficulty);

  const attribution = result.goalAttribution || {};
  const votesById = {};
  (result.votes || []).forEach((v) => { votesById[v.playerId] = v.votes; });

  // Player story beats use pre-match career totals — collect before stats apply.
  const milestones = collectMatchMilestones(c, attribution, meta.round);

  // Attribute-centred stat multiplier (generation mean ≈ 68): skilled players
  // rack up more of the ball, so box scores read as earned, not rolled.
  const attrStatMult = (val) => clamp(1 + ((val ?? 60) - 68) * 0.012, 0.75, 1.35);
  const matchMargin = Math.abs((myResult.myTotal ?? 0) - (myResult.oppTotal ?? 0));
  const heavyDefeat = !won && !drew && matchMargin > 40;
  const matchStats = {};
  // VFL/reserves affiliate: fringe players get a run in the twos each senior
  // match week (T1/T2 affiliates only — community clubs field one side).
  const reservesRound = league.tier <= 2
    ? playReservesRound(c.squad.filter((p) => !c.lineup.includes(p.id)), meta.round)
    : { updates: new Map(), standout: null };
  c.squad = c.squad.map((p) => {
    const playedThisWeek = c.lineup.includes(p.id);
    if (!playedThisWeek) {
      // Fringe players track how long they've gone without a run — a couple of
      // weeks out of the side starts to grate (logged below for transparency).
      const weeksOut = (p.weeksWithoutGame ?? 0) + 1;
      let np = { ...p, weeksWithoutGame: weeksOut };
      const res = reservesRound.updates.get(p.id);
      if (res) {
        // Played reserves: stat line + merit form move (+ youth dev tick);
        // the benched sting softens to every 3rd week — they're playing footy,
        // they just want senior footy.
        np = { ...np, ...res };
        if (weeksOut >= 2 && weeksOut % 3 === 0 && (np.morale ?? 75) > cfg.moraleFloor) {
          np = adjustMorale(np, -1, MORALE_REASONS.benched, meta.round);
          if (np.morale < cfg.moraleFloor) np.morale = cfg.moraleFloor;
        }
      } else if (weeksOut >= 2 && (np.morale ?? 75) > cfg.moraleFloor) {
        np = adjustMorale(np, -1, MORALE_REASONS.benched, meta.round);
        if (np.morale < cfg.moraleFloor) np.morale = cfg.moraleFloor;
      }
      return np;
    }
    // AFL sub rule: the designated medical sub is held back and activated ~half-time,
    // so they cover fewer minutes and finish far fresher than a full-game player.
    // Slot-aware check: the benefit only applies while the sub actually holds an
    // interchange slot — a stale subPlayerId (player since moved on-field) gets nothing.
    const fitDrop = lineupRole(c.lineup, c.subPlayerId, p.id) === 'sub' ? rand(3, 8) : rand(8, 18);
    // Best-on-ground performances carry personal form, even in a loss.
    const votes = votesById[p.id] || 0;
    const formChange = (won ? rand(2, 6) : drew ? rand(-2, 2) : rand(-6, -1)) + votes;
    const att = attribution[p.id] || { goals: 0, behinds: 0 };
    const ballSkill = ((p.attrs?.decision ?? 60) + (p.attrs?.handball ?? 60) + (p.attrs?.endurance ?? 60)) / 3;
    const dispAdd = Math.round((isMidPreferred(p) ? rand(15, 32) : rand(8, 22)) * attrStatMult(ballSkill));
    const markAdd = Math.round(rand(2, 7) * attrStatMult(p.attrs?.marking));
    const tackleAdd = Math.round(rand(1, 5) * attrStatMult(p.attrs?.tackling));
    // Signature AFL stats, derived from on-field role + attributes.
    const isMid = isMidPreferred(p);
    const isFwd = p.position === "KF" || p.position === "HF";
    const hitoutAdd = p.position === "RU"
      ? Math.round(rand(14, 38) * attrStatMult(p.ruckwork ?? p.attrs?.strength))
      : 0;
    const clearAdd = isMid
      ? Math.round(rand(2, 8) * attrStatMult(p.contestedBall ?? p.attrs?.strength))
      : Math.round(rand(0, 2) * attrStatMult(p.contestedBall ?? p.attrs?.strength));
    const inside50Add = (isFwd || isMid)
      ? Math.round(rand(2, 7) * attrStatMult(p.attrs?.kicking))
      : Math.round(rand(0, 3) * attrStatMult(p.attrs?.kicking));
    const contestedAdd = (isMid || p.position === "KF" || p.position === "KB")
      ? Math.round(rand(4, 12) * attrStatMult(p.attrs?.strength))
      : Math.round(rand(2, 7) * attrStatMult(p.attrs?.strength));
    const newForm = clamp(p.form + formChange, 30, 100);
    const formHistory = [...(p.formHistory || []), p.form].slice(-5);
    // Logged, cause-driven morale for players who took the field. Magnitude is
    // kept modest so balance stays close to the old streak-driven model.
    let resultDelta, resultReason;
    if (won) {
      const bigWin = matchMargin >= 40;
      resultDelta = bigWin ? 4 : 2;
      resultReason = bigWin ? MORALE_REASONS.bigWin : MORALE_REASONS.win;
    } else if (drew) {
      resultDelta = 0; resultReason = null;
    } else {
      resultDelta = heavyDefeat ? -4 : -2;
      resultReason = heavyDefeat ? MORALE_REASONS.heavyLoss : MORALE_REASONS.loss;
    }
    matchStats[p.id] = {
      name: `${p.firstName} ${p.lastName}`,
      position: p.position,
      goals: att.goals || 0,
      behinds: att.behinds || 0,
      disposals: dispAdd,
      marks: markAdd,
      tackles: tackleAdd,
      hitouts: hitoutAdd,
      clearances: clearAdd,
      inside50s: inside50Add,
      contested: contestedAdd,
      votes,
    };
    let np = { ...p, fitness: clamp(p.fitness - fitDrop, 30, 100), form: newForm, formHistory,
      weeksWithoutGame: 0,
      goals: p.goals + (att.goals || 0), behinds: p.behinds + (att.behinds || 0), disposals: p.disposals + dispAdd,
      marks: p.marks + markAdd, tackles: p.tackles + tackleAdd, gamesPlayed: p.gamesPlayed + 1,
      legendGames: (p.legendGames || 0) + 1 };
    if (resultReason) np = adjustMorale(np, resultDelta, resultReason, meta.round);
    // Cheap "starred" bump: vote-getters / milestone heroes get a lift, logged.
    if (votes > 0) np = adjustMorale(np, 2, MORALE_REASONS.bestOnGround, meta.round);
    else if (milestones.boostIds.has(p.id)) np = adjustMorale(np, 3, MORALE_REASONS.recalled, meta.round);
    if (np.morale < cfg.moraleFloor) np.morale = cfg.moraleFloor;
    return np;
  });
  c.lastMatchPlayerStats = matchStats;
  if (reservesRound.standout) {
    const s = reservesRound.standout;
    c.news = [{ week: c.week, type: 'info',
      text: `🏉 Reserves: ${s.name} ${s.disposals} disposals${s.goals > 0 ? `, ${s.goals} goal${s.goals !== 1 ? 's' : ''}` : ''} — knocking on the door.` },
    ...(c.news || [])].slice(0, 22);
  }
  if (milestones.items.length > 0) {
    c.news = [...milestones.items, ...(c.news || [])].slice(0, 22);
    // Season highlights — save milestone news to display in end-of-season recap
    c.seasonHighlights = [...(c.seasonHighlights || []), ...milestones.items].slice(0, 30);
  }

  // Partnership tracking: count shared lineup appearances for each pair of starters.
  // ponytail: O(n²) over lineup (≤22 players → max 231 pairs). Grows unboundedly over
  // many seasons; if saves become large, prune pairs with count < 5 at season end.
  const lineupIds = (c.lineup || []).filter(Boolean);
  if (lineupIds.length >= 2) {
    const p = c.partnerships || {};
    lineupIds.forEach((id1, i) => {
      lineupIds.slice(i + 1).forEach((id2) => {
        const key = [id1, id2].sort().join('_');
        p[key] = (p[key] || 0) + 1;
      });
    });
    c.partnerships = p;
  }

  // Crowd atmosphere: big home crowd gives a morale lift win or lose.
  // Only for tier 1–3 (tier 4 has no meaningful gate).
  if (isHome && (league?.tier ?? 4) <= 3) {
    const baseCrowdForTier = league.tier === 1 ? 30_000 : league.tier === 2 ? 4_000 : 600;
    const attendance = result?.attendance ?? meta?.attendance ?? c.lastMatchRevenue?.attendance ?? 0;
    if (attendance > baseCrowdForTier * 1.15) {
      const bonus = Math.min(3, Math.round((attendance / baseCrowdForTier - 1) * 4));
      c.squad = c.squad.map((p) =>
        c.lineup.includes(p.id) ? adjustMorale(p, bonus, MORALE_REASONS.bigWin, meta.round) : p
      );
      const crowdK = Math.round(attendance / 1000);
      c.news = [{ week: meta.round, type: 'info',
        text: `📣 ${crowdK}k packed the stands — the home crowd lifted the whole list.` },
        ...(c.news || [])].slice(0, 22);
    }
  }

  const intensity = c.training?.intensity ?? 60;
  const medLevel = c.facilities?.medical?.level ?? 1;
  const recoveryFocus = c.training?.focus?.recovery ?? 20;
  const mit = medicalStaffMitigation(c.staff);
  const hp = careerHpEffects(c, league.tier);
  const baseInjuryProb =
    0.12 + (intensity - 50) * 0.002 - medLevel * 0.012 - (recoveryFocus - 20) * 0.001 - mit.probReduce;
  // HP department lowers the injury RATE on top of the difficulty multiplier.
  const injuryProb = effectiveInjuryRate(c, clamp(baseInjuryProb, 0.04, 0.28)) * hp.injuryRateMult;
  const medRating = (c.staff || []).find((s) => s.id === 's6')?.rating ?? 60;
  // HP department speeds RECOVERY on top of the medical-staff reduction.
  const medReduction = (medRating >= 85 ? 2 : medRating >= 70 ? 1 : 0) + hp.recoveryWeeksBonus;

  const applyTypedInjury = (pid) => {
    const inj = pickInjury();
    let finalWeeks = Math.max(1, Math.round(inj.weeks - medReduction));
    c.squad = c.squad.map((p) => {
      if (p.id !== pid) return p;
      let concussionsThisSeason = p.concussionsThisSeason || 0;
      if (inj.type === 'concussion') {
        if (concussionsThisSeason >= 1) finalWeeks += 2; // AFL concussion protocol
        concussionsThisSeason += 1;
      }
      const forcedRetirement = (inj.type === 'knee_acl' && (p.age || 0) >= 33 && rng() < 0.20)
        ? true : p.forcedRetirement;
      return { ...p, injured: finalWeeks, injuryType: inj.type, injuryLabel: inj.label, injurySeverity: inj.severity, concussionsThisSeason, forcedRetirement };
    });
    const player = c.squad.find((p) => p.id === pid);
    if (player) {
      const newsText = `🩹 ${player.firstName} ${player.lastName} — ${inj.label} (${inj.severity}, est. ${finalWeeks} week${finalWeeks !== 1 ? 's' : ''})`;
      c.news = [{ week: c.week, type: 'loss', text: newsText }, ...(c.news || [])].slice(0, 20);
      if (player.forcedRetirement) {
        c.news = [{ week: c.week, type: 'warning', text: `💔 ${player.firstName} ${player.lastName}'s ACL injury is career-ending — they will retire at season's end.` }, ...(c.news || [])].slice(0, 20);
      }
    }
  };

  (result.injuredPlayerIds || []).forEach((pid) => {
    if (!c.lineup.includes(pid)) return;
    applyTypedInjury(pid);
  });
  const matchInjuryPool = lineupPlayersOrdered(c.squad, c.lineup);
  if (rng() < injuryProb && matchInjuryPool.length > 0) {
    applyTypedInjury(pick(matchInjuryPool).id);
  }
  (result.reportedPlayerIds || []).forEach((pid) => {
    if (rng() < 0.35) {
      const player = c.squad.find((p) => p.id === pid);
      if (!player) return;
      const r = rng();
      const severity = r < 0.5 ? 'low' : r < 0.85 ? 'medium' : 'high';
      const baseWeeks = severity === 'low' ? 1 : severity === 'medium' ? 2 : rand(3, 4);
      const charge = pick(['Rough Conduct', 'High Contact', 'Dangerous Tackle', 'Striking', 'Intentional Contact']);
      c.tribunalQueue = [...(c.tribunalQueue || []), {
        id: `tribunal_${c.week}_${player.id}`,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        position: player.position,
        charge,
        severity,
        baseWeeks,
        week: c.week,
      }];
      c.news = [{ week: c.week, type: 'warning', text: `⚖️ ${player.firstName} ${player.lastName} referred to tribunal for ${charge}.` }, ...(c.news || [])].slice(0, 20);
    }
  });

  c.brownlow = c.brownlow || {};
  (result.votes || []).forEach((v) => {
    c.brownlow[v.playerId] = (c.brownlow[v.playerId] || 0) + v.votes;
  });

  // Per-match revenue: gate (home only) + broadcast/TV (every match) +
  // sponsor activation (every match). This is the club's live, event-driven
  // income — earned each time it plays, not smoothed across the calendar.
  // T4 junior clubs get canteen/BBQ income on home days instead of gate + TV.
  const isT4 = league.tier === 4;
  if (isT4) {
    const canteen = isHome ? grassrootsCanteenIncome() : 0;
    const gameExpenses = grassrootsPerGameExpenses();
    const netGameDay = canteen - (isHome ? gameExpenses : Math.round(gameExpenses * 0.4));
    c.finance.cash += netGameDay;
    c.lastMatchRevenue = { total: netGameDay, canteen, gameExpenses, isHome, round: meta.round, opp: myResult.opp?.short || null };
    if (isHome) {
      c.news = [{ week: meta.round, type: netGameDay >= 0 ? 'info' : 'loss',
        text: `🍖 Home game day: canteen ${canteen >= 0 ? '+' : ''}$${canteen} · ground/umpires −$${gameExpenses} · net ${netGameDay >= 0 ? '+' : ''}$${netGameDay}` },
      ...(c.news || [])].slice(0, 14);
    }
  }
  const rev = isT4 ? { total: 0, gate: 0, broadcast: 0, sponsor: 0, attendance: 0, isHome } : matchDayRevenue(c, { isHome, leagueTier: league.tier });
  const isDerby = !!(c.rivalClubId && myResult.opp?.id === c.rivalClubId);
  const derbyGateBonus = isDerby && isHome ? Math.round(rev.gate * 0.5) : 0;
  c.finance.cash += rev.total + derbyGateBonus;
  c.lastMatchRevenue = {
    ...rev,
    round: meta.round,
    opp: myResult.opp?.short || null,
    isDerby,
  };
  if (Array.isArray(c.weeklyHistory) && c.weeklyHistory.length > 0) {
    const last = c.weeklyHistory[c.weeklyHistory.length - 1];
    c.weeklyHistory[c.weeklyHistory.length - 1] = {
      ...last,
      profit: (last.profit ?? 0) + rev.total,
      cash: c.finance.cash,
      matchRevenue: rev.total,
      ticketRev: rev.gate,
      attendance: rev.attendance,
    };
  }
  const bits = [];
  if (rev.gate) bits.push(`gate ${fmtK(rev.gate)}`);
  if (rev.broadcast) bits.push(`TV ${fmtK(rev.broadcast)}`);
  if (rev.bar) bits.push(`bar ${fmtK(rev.bar)}`);
  if (rev.canteen) bits.push(`canteen ${fmtK(rev.canteen)}`);
  if (rev.gameExpenses) bits.push(`ops -${fmtK(rev.gameExpenses)}`);
  if (rev.sponsor) bits.push(`sponsor ${fmtK(rev.sponsor)}`);
  c.news = [{ week: meta.round, type: 'info',
    text: `💰 Match-day income +${fmtK(rev.total)}${bits.length ? ` (${bits.join(', ')})` : ''}` },
  ...(c.news || [])].slice(0, 14);

  const winBump = Math.max(2, Math.abs(cfg.boardLossConfidence) - 1);
  const lossDrop = cfg.boardLossConfidence;
  const drawDelta = 0;
  const prevBoard = c.finance.boardConfidence;
  applyMatchStreaks(c, won, drew, isHome);
  const boardDelta = won ? winBump : drew ? drawDelta : lossDrop;
  c.finance.fanHappiness = clamp(c.finance.fanHappiness + (won ? 3 : drew ? 0 : -2), 10, 100);
  c.fanbase = updateFanbase(c, league.tier, { won, drew });
  if (isDerby) {
    const derbySuffix = won ? '🔥 Derby bragging rights are ours!' : drew ? 'Derby honours shared — we\'ll take it.' : 'Derby loss hurts. They\'ll celebrate tonight.';
    c.news = [{
      week: meta.round, type: won ? 'win' : drew ? 'draw' : 'loss',
      text: `⚔️ LOCAL DERBY vs ${myResult.opp?.short || 'rivals'}. ${derbySuffix}${derbyGateBonus ? ` Big crowd boost +${fmtK(derbyGateBonus)}.` : ''}`,
    }, ...(c.news || [])].slice(0, 20);
    c.committee = bumpCommitteeMood(c.committee, 'President', won ? 5 : -3);
  }
  ensureCareerBoard(c, findClub(c.clubId), league);
  applyBoardConfidenceDelta(c, boardDelta);
  c.lastBoardConfidenceDelta = c.finance.boardConfidence - prevBoard;
  if (won) { dynastyRecordHomeAwayWin(c); recordCareerWin(c); }
  c.news = [{ week: meta.round, type: won ? 'win' : drew ? 'draw' : 'loss',
    text: buildMatchReportLine(c, meta, myResult, won, drew, isHome, result) },
  ...(c.news || [])].slice(0, 12);

  if (c.journalist) {
    c.journalist = { ...c.journalist, satisfaction: clamp((c.journalist.satisfaction ?? 50) + (won ? 2 : drew ? 0 : -3), 0, 100) };
    // Generate and push a structured press headline to news
    const pressResult = { won, drew, myTotal: myResult.myTotal, oppTotal: myResult.oppTotal, trailedAtHalf: myResult.trailedAtHalf };
    const pressHeadline = generatePostMatchHeadline(pressResult, findClub(c.clubId), myResult.opp, c.journalist);
    c.news = [{ week: meta.round, type: 'press', text: pressHeadline.headline, subtext: pressHeadline.byline, tone: pressHeadline.tone }, ...(c.news || [])].slice(0, 20);
  }

  c.committee = bumpCommitteeMood(c.committee, 'President', won ? 3 : drew ? 0 : -2);
  if (won) {
    const presMsg = committeeMessage(c, 'President', 'win');
    if (presMsg) c.news = [{ week: meta.round, ...presMsg }, ...(c.news || [])].slice(0, 20);
  }

  if (isHome) {
    const fundraiser = postMatchFundraiser(c, league.tier, true, ensureWeatherForWeek(c, meta.round));
    if (fundraiser) {
      c.finance.cash += fundraiser.income;
      c.news = [{ week: meta.round, ...fundraiser.news }, ...(c.news || [])].slice(0, 20);
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
    const lbl = `${won ? 'W' : drew ? 'D' : 'L'} ${Math.abs(diff)}pt`;
    recordHeadToHead(c, oppId, won, drew, diff, lbl);
    celebrateBogeyBreakIfNeeded(c, oppId, won, wasBogey, prevStreak, findClub);
  }
  const hg = isHome ? (result.homeGoals ?? 0) : (result.awayGoals ?? 0);
  const hb = isHome ? (result.homeBehinds ?? 0) : (result.awayBehinds ?? 0);
  const ag = isHome ? (result.awayGoals ?? 0) : (result.homeGoals ?? 0);
  const ab = isHome ? (result.awayBehinds ?? 0) : (result.homeBehinds ?? 0);
  pushTeamStatsFromResult(c, hg, hb, ag, ab, won, drew);

  if (meta.turningPoint === 'must_win') {
    ensureCareerBoard(c, findClub(c.clubId), league);
    applyBoardConfidenceDelta(c, won ? 5 : drew ? 0 : -8);
  } else if (meta.turningPoint === 'undefeated_run') {
    if (!won && !drew) {
      c.squad = c.squad.map((p) => ({ ...p, morale: clamp((p.morale ?? 70) - 2, cfg.moraleFloor, 100) }));
    }
  } else if (meta.turningPoint === 'bogey_buster' && won) {
    bumpClubCulture(c, 2);
  }

  // Streak-driven squad momentum: win/lose 3+ in a row nudges the dressing room.
  // (Per-match win/loss/margin morale is applied with logged reasons above.)
  if (meta.phase === 'season') {
    const streak = c.winStreak ?? 0;
    let moraleDelta = 0;
    let streakReason = null;
    if (streak >= 3) { moraleDelta = 1; streakReason = 'On a winning run'; }
    else if (streak <= -3) { moraleDelta = -1; streakReason = 'Losing run biting'; }
    if (moraleDelta !== 0) {
      c.squad = c.squad.map((p) => {
        if (!c.lineup.includes(p.id)) return p;
        const np = adjustMorale(p, moraleDelta, streakReason, meta.round);
        if (np.morale < cfg.moraleFloor) np.morale = cfg.moraleFloor;
        return np;
      });
    }
  }

  if (isHome) {
    const weather = ensureWeatherForWeek(c, meta.round);
    c.groundCondition = applyGroundDegradation(c.groundCondition ?? 85, weather, c.facilities?.stadium?.level ?? 1);
  }
}

/**
 * Player unhappiness escalation. Runs once per round advance (after the week
 * counter is set). Fair, legible triggers:
 *   - morale < 40 sets `unhappySince` (the week it started); morale >= 50 clears
 *     it and any standing transfer request.
 *   - 3+ consecutive unhappy weeks, still < 40, contracted senior (OVR >= 65,
 *     contract > 0), not already requested → transfer request + notification.
 *   - A standing transfer request drains a little form each unsettled week
 *     (training disruption). Mild, floored.
 */
function applyUnhappinessEscalation(c, league, week) {
  if (!Array.isArray(c.squad)) return;
  if (!Array.isArray(c.inbox)) c.inbox = [];
  const newRequests = [];
  c.squad = c.squad.map((p) => {
    let np = p;
    const morale = np.morale ?? 75;
    if (morale < 40) {
      if (np.unhappySince == null) np = { ...np, unhappySince: week };
    } else if (morale >= 50) {
      if (np.unhappySince != null || np.transferRequested) {
        np = { ...np, unhappySince: null, transferRequested: false };
      }
    }
    const unhappySince = np.unhappySince;
    const weeksUnhappy = unhappySince != null ? week - unhappySince : 0;
    const isSenior = (np.overall ?? 0) >= 65 && (np.contract ?? 0) > 0;
    if (!np.transferRequested && unhappySince != null && weeksUnhappy >= 3 && (np.morale ?? 75) < 40 && isSenior) {
      np = { ...np, transferRequested: true };
      newRequests.push(np);
    }
    // Training disruption: an unsettled, transfer-listed player loses a touch of
    // form each week the rift persists (floored so it can't tank them).
    if (np.transferRequested && (np.morale ?? 75) < 40) {
      np = { ...np, form: clamp((np.form ?? 70) - rand(1, 2), 30, 100) };
    }
    return np;
  });
  for (const p of newRequests) {
    const name = p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'A player');
    const note = buildPlayerTransferRequestNotice(p);
    if (!c.inbox.some((m) => m.id === note.id)) c.inbox.unshift(note);
    c.news = [{ week, type: 'loss', text: `🗣️ ${name} has requested a trade — unsettled by limited opportunities.` }, ...(c.news || [])].slice(0, 20);
  }
}

/**
 * Round bookkeeping shared by player-match full time and bye weeks:
 * board pressure / sack checks, week counter, turning-point refresh,
 * board meetings, cap-breach drain and the season → finals handover.
 */
function applyPostRoundBoardAndCalendar(c, league, club, meta, myResult) {
  const cfg = getDifficultyConfig(c.difficulty);
  const inBoardCrisis = c.boardCrisis?.phase === 'active';
  const sackPatience = cfg.boardPatienceSeasons === 1 ? 1 : 2;
  // Tier 4 (junior/grassroots) is a volunteer role with a parent committee —
  // there is no director board to sack you over results. You stay until you
  // choose to leave or get headhunted to a senior club.
  const sandbox = c.gameMode === 'sandbox' || league?.tier === 4;
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
      c.news = [{ week: meta.round, type: 'board', text: prepLine }, ...(c.news || [])].slice(0, 20);
    }
  }
  if ((c.boardWarning || 0) >= sackPatience && !c.isSacked && !inBoardCrisis) {
    const instantSack = c.finance.boardConfidence <= 0 || (c.boardWarning || 0) >= 99;
    if (instantSack) {
      triggerSackState(c, club.name, meta.round);
    } else {
      c.boardCrisis = { phase: 'active', step: 0 };
      if (c.board) c.board.voteScheduled = true;
      c.news = [{ week: meta.round, type: 'loss', text: '📋 Emergency board meeting: a vote of confidence is underway. Address the chair before play continues.' }, ...(c.news || [])].slice(0, 20);
    }
  } else if (!inBoardCrisis && c.finance.boardConfidence > 30) {
    c.boardWarning = 0;
  } else if (!inBoardCrisis && c.finance.boardConfidence <= 20) {
    c.news = [{ week: meta.round, type: 'loss', text: '⚠️ Board confidence is critical — your job is on the line.' }, ...(c.news || [])].slice(0, 20);
  }
  }

  c.week = meta.round;

  // Apply squad trait morale delta once per round — traits like Leader/Mentor
  // lift the room while Hothead/Drifter drag it slightly. Capped at ±8 total.
  if (meta.phase === 'season' && Array.isArray(c.squad)) {
    const traitDelta = squadTraitMoraleDelta(c.squad);
    if (traitDelta !== 0) {
      c.squad = c.squad.map((p) => {
        const next = Math.max(0, Math.min(100, (p.morale ?? 75) + traitDelta));
        return { ...p, morale: next };
      });
    }
  }

  applyUnhappinessEscalation(c, league, meta.round);
  if (meta.phase === 'season') {
    refreshTurningPointForNextFixture(c, league);
    refreshCrucialFive(c, league, meta.round);
  }
  c.lastEvent = myResult
    ? { type: 'round', round: meta.round, date: meta.date, themedRound: meta.themedRound ?? null, ...myResult }
    : null;

  if (meta.phase === 'season' && !c.isSacked && c.boardCrisis?.phase !== 'active') {
    const due = findDueBoardMeetingSlot(c, c.week);
    if (due) {
      c.boardMeetingBlocking = openBoardMeetingBlockingFromSlot(due, league?.tier ?? 2);
    }
  }

  // Mid-season draft window (tier-1, once per season, around the byes).
  if (meta.phase === 'season' && meta.round === MID_SEASON_DRAFT_ROUND && !c.isSacked && !c.midSeasonDraftDone) {
    const msd = maybeOpenMidSeasonDraft(c, league);
    if (msd) c.midSeasonDraftBlocking = msd;
  }

  if (meta.phase === 'season' && myResult && !c.isSacked) {
    const comms = maybeEnqueueBoardMessage(c, league);
    if (comms) {
      c.news = [{ week: meta.round, type: 'board', text: comms }, ...(c.news || [])].slice(0, 20);
    }
  }

  if (meta.phase === 'season' && myResult && !c.isSacked) {
    const cap = effectiveWageCap(c);
    const wages = currentPlayerWageBill(c);
    if (cap > 0 && wages > cap) {
      const overRatio = wages / cap - 1;
      const confidenceDrain = overRatio > 0.15 ? -2 : -1;
      ensureCareerBoard(c, findClub(c.clubId), league);
      applyBoardConfidenceDelta(c, confidenceDrain);
      if ((c.capBreachedBoardNoteSeason ?? null) !== c.season) {
        c.capBreachedBoardNoteSeason = c.season;
        const pct = Math.round(overRatio * 100);
        c.news = [{
          week: meta.round, type: 'board',
          text: `⚖️ Cap breach (${pct}% over): board confidence draining every round until wages are trimmed.`,
        }, ...(c.news || [])].slice(0, 25);
      }
    }
  }

  const hasMoreRounds = (c.eventQueue || []).some((e) => !e.completed && e.type === 'round' && e.phase === 'season');
  if (!hasMoreRounds) {
    const finalists = getFinalsTeams(c.ladder, league.tier);
    if (finalists.length >= 2) startFinals(c, league);
    else beginPostSeasonTradePeriod(c, league, c.leagueKey);
  }
}

/**
 * The coach's half-time call: applies the chosen adjustment to Q3 + Q4,
 * finishes the live sim, and runs every full-time effect that used to fire
 * when the calendar advanced. Mirrors advanceCareerNextEvent's clone+set flow.
 */
export function resolveLiveMatchHalfTime({ career, _league, _club, callId, setCareer }) {
  const c = JSON.parse(JSON.stringify(career));
  const lm = c.liveMatch;
  if (!lm?.simState || !lm?.meta) {
    setCareer(c);
    return;
  }

  const mods = resolveCoachingCall(callId, c.staff);
  // Sim Q3 with the half-time call applied, then pause for the Q3 decision.
  simMatchQuarter(lm.simState, mods);
  const q3Snap = finishMatchSim(lm.simState); // partial snapshot for display
  const meta = lm.meta;
  const isHome = meta.isHome;
  const myQ3 = isHome ? q3Snap.homeTotal : q3Snap.awayTotal;
  const oppQ3 = isHome ? q3Snap.awayTotal : q3Snap.homeTotal;

  // Surface the Q3 pause state — Q4 call + optional sub still to come.
  c.liveMatch = {
    ...lm,
    htCallId: callId,
    htMods: mods,
    matchPhase: 'after_q3',
    q3Snapshot: {
      myTotal: myQ3,
      oppTotal: oppQ3,
      margin: myQ3 - oppQ3,
      quarters: q3Snap.quarters,
    },
  };
  setCareer(c);
}

// Q4 CALL: applied after the Q3 check-in. subOutId/subInId are optional player IDs.
export function resolveQ3Decision({ career, league, club, callId, subOutId, subInId, setCareer }) {
  const c = JSON.parse(JSON.stringify(career));
  const lm = c.liveMatch;
  if (!lm?.simState || lm?.matchPhase !== 'after_q3') {
    setCareer(c);
    return;
  }

  // Apply substitution to squad form before Q4.
  if (subOutId && subInId) {
    c.squad = c.squad.map((p) => {
      if (p.id === subOutId) return { ...p, substituted: true };
      if (p.id === subInId) return { ...p, form: Math.min(100, (p.form ?? 70) + 8) };
      return p;
    });
    // Swap in lineup: replace subOut with subIn.
    c.lineup = c.lineup.map((id) => (id === subOutId ? subInId : id));
  }

  const mods = resolveCoachingCall(callId, c.staff);
  const call = getCoachingCall(callId);
  simMatchQuarter(lm.simState, mods);
  const result = finishMatchSim(lm.simState);

  const meta = lm.meta;
  const isHome = meta.isHome;
  const opp = findClub(meta.oppId);
  const myTotal = isHome ? result.homeTotal : result.awayTotal;
  const oppTotal = isHome ? result.awayTotal : result.homeTotal;
  const won = myTotal > oppTotal;
  const drew = myTotal === oppTotal;
  c.pendingPlayerMatchResult = {
    home: meta.home,
    away: meta.away,
    homeTotal: result.homeTotal,
    awayTotal: result.awayTotal,
    round: meta.round,
  };
  const myResult = { isHome, opp, result, myTotal, oppTotal, won, drew };

  applyPlayerMatchEffects(c, league, meta, myResult);
  applyPostRoundBoardAndCalendar(c, league, club, meta, myResult);

  // Press moment trigger (post-round, after player match)
  const pressMomentMatch = pickPressMoment(c);
  if (pressMomentMatch) {
    c.pendingPressMoment = {
      id: pressMomentMatch.id,
      prompt: typeof pressMomentMatch.prompt === 'function' ? pressMomentMatch.prompt(c) : pressMomentMatch.prompt,
    };
  }

  c.liveMatch = null;
  c.inMatchDay = true;
  c.currentMatchResult = {
    ...result,
    isHome, opp, myTotal, oppTotal, won, drew,
    isPreseason: false,
    label: `Round ${meta.round}`,
    isAFL: league.tier === 1,
    coachCall: { id: call.id, icon: call.icon, label: call.label, note: mods.note },
    q3Sub: subOutId && subInId ? { outId: subOutId, inId: subInId } : null,
  };
  c.lastMatchSummary = buildPostMatchSummary(c, league, club, myResult, meta.round);
  setCareer(c);
}
