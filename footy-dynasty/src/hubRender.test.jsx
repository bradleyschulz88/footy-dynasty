// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import { PYRAMID, findClub } from './data/pyramid.js';
import { generateSquad } from './lib/playerGen.js';
import { generateFixtures, blankLadder, getCompetitionClubs, tier3DivisionCount } from './lib/leagueEngine.js';
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits, generateTradePool } from './lib/defaults.js';
import { seedNationalDraft } from './lib/draftSeed.js';
import { generateSeasonCalendar } from './lib/calendar.js';
import { DEFAULT_STAFF_TASKS } from './lib/staffTasks.js';
import { getDifficultyConfig } from './lib/difficulty.js';
import { generateCommittee, generateJournalist, rollPlayerTrait } from './lib/community.js';
import { makeStartingFinance, scaledSquadToFitCap } from './lib/finance/engine.js';
import { buildInitialSponsorOffers } from './lib/finance/sponsors.js';
import { getClubGround } from './data/grounds.js';
import { assignDefaultCaptains, defaultClubCulture } from './lib/gameDepth.js';
import { ensureCareerBoard, generateSeasonObjectives, planSeasonBoardMeetings } from './lib/board.js';
import { primeSeasonStoryState } from './lib/careerAdvance.js';
import { LINEUP_CAP } from './lib/lineupHelpers.js';
import { SAVE_VERSION } from './lib/setupConstants.js';
import { assignDynastyQuestsForSeason } from './lib/dynastyQuests.js';

function buildFreshCareer(clubId, leagueKey, state, { isFirstCareer = true, difficulty = 'balanced' } = {}) {
  const club = findClub(clubId);
  const league = PYRAMID[leagueKey];
  const SEASON = 2026;
  const cfg = getDifficultyConfig(difficulty);
  const tunedFinance = makeStartingFinance(league.tier, difficulty, 55);
  const startDiv = league.tier === 3 ? Math.min(1, tier3DivisionCount(leagueKey, state)) : null;
  const compClubs = getCompetitionClubs(leagueKey, state, startDiv);
  const ladder0 = blankLadder(compClubs);
  const squadRaw = generateSquad(clubId, league.tier, 32, SEASON).map(p => ({ ...p, traits: rollPlayerTrait() ? [rollPlayerTrait()] : [] }));
  const squad = scaledSquadToFitCap({ clubId, leagueKey, difficulty, finance: tunedFinance, squad: squadRaw });
  const lineup = squad.slice().sort((a, b) => b.overall - a.overall).slice(0, LINEUP_CAP).map(p => p.id);
  const fixtures = generateFixtures(compClubs);
  const eventQueue = generateSeasonCalendar(SEASON, compClubs, fixtures, clubId);
  const facilities = DEFAULT_FACILITIES();
  const clubGround = getClubGround(club, facilities.stadium.level, league.tier);
  const startOffers = buildInitialSponsorOffers({ leagueTier: league.tier, difficulty, clubId, ladder: ladder0, coachReputation: 30 });
  const c = {
    managerName: 'Coach', clubId, leagueKey, regionState: state, localDivision: startDiv,
    season: SEASON, week: 0, currentDate: `${SEASON - 1}-12-01`, phase: 'preseason',
    eventQueue, lastEvent: null, inMatchDay: false, currentMatchResult: null,
    squad, lineup, training: DEFAULT_TRAINING(), facilities, finance: tunedFinance,
    sponsors: [], staff: generateStaff(league.tier), staffTasks: DEFAULT_STAFF_TASKS(),
    kits: defaultKits(club.colors), ladder: ladder0, fixtures,
    tradePool: generateTradePool(leagueKey, SEASON), draftPool: [],
    youth: { recruits: [], zone: club.state, programLevel: 1, scoutFocus: 'All-rounders' },
    news: [{ week: 0, type: 'draw', text: 'Appointed.' }],
    weeklyHistory: [], inFinals: false, finalsRound: 0, finalsFixtures: [], finalsResults: [],
    premiership: null, tacticChoice: 'balanced', seasonHistory: [], saveVersion: SAVE_VERSION,
    aiSquads: {}, draftOrder: [], history: [], brownlow: {}, boardWarning: 0, gameOver: null,
    themeMode: 'A',
    options: { autosave: true, confirmBeforeNewCareer: true, confirmBeforeDeleteSlot: true, uiDensity: 'comfortable', reduceMotion: false },
    pendingTradeOffers: [], inbox: [], retiredThisSeason: [], difficulty, gameMode: 'standard',
    challengeId: null, challengeGoal: null,
    tutorialStep: isFirstCareer && cfg.tutorialPolicy !== 'never' ? 0 : 6,
    tutorialComplete: !(isFirstCareer && cfg.tutorialPolicy !== 'never'),
    isFirstCareer, committee: generateCommittee(league.tier), footyTripAvailable: false, footyTripUsed: false,
    groundCondition: 85, clubGround, groundName: clubGround.shortName, weeklyWeather: {},
    winStreak: 0, homeWinStreak: 0, coachReputation: 30, coachTier: 'Journeyman',
    coachStats: { totalWins: 0, totalLosses: 0, totalDraws: 0, premierships: 0, promotions: 0, relegations: 0, clubsManaged: 1, seasonsManaged: 1 },
    previousClubs: [], isSacked: false, jobMarketOpen: false, sackingStep: null, jobOffers: [],
    boardVotePrepBonus: 0, jobMarketRerolls: 0, arrivalBriefing: null, journalist: generateJournalist(),
    lastBoardConfidenceDelta: 0, lastMatchSummary: null, lastFinanceTickWeek: null, lastFinanceTickDay: null,
    cashCrisisStartWeek: null, cashCrisisLevel: 0, bankLoan: null, sponsorRenewalProposals: [],
    sponsorOffers: startOffers, expiredSponsorsLastSeason: [], pendingRenewals: [], renewalsClosed: false,
    pendingStaffRenewals: [], fundraisersUsed: {}, communityGrantUsed: false, lastEosFinance: null,
    postSeasonPhase: 'none', inTradePeriod: false, tradePeriodDay: 0, freeAgencyOpen: false,
    postSeasonDraftCountdown: null, freeAgentBalance: { gained: 0, lost: 0 }, tradeHistory: [],
    draftPickBank: null, offSeasonFreeAgents: [], clubCulture: defaultClubCulture(), headToHead: {},
    finalsRivalryLog: [], captainId: null, viceCaptainId: null, captainHistory: [], bogeyTeamId: null,
    dominatedTeamId: null, crucialFive: [], crisisFiredThisSeason: false, teamStats: null,
  };
  assignDefaultCaptains(c);
  ensureCareerBoard(c, club, league);
  generateSeasonObjectives(c, league);
  planSeasonBoardMeetings(c);
  primeSeasonStoryState(c);
  seedNationalDraft(c, league, { inaugural: true, force: true });
  assignDynastyQuestsForSeason(c, league.tier, compClubs.length);
  return c;
}

async function importAFLManager() {
  const mod = await import('./AFLManager.jsx');
  return mod.default;
}

describe('Hub renders for a fresh career (no crash / no error boundary)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  const cases = [
    ['ade', 'AFL', 'SA', { isFirstCareer: false }],   // returning player → no tutorial/briefing
    ['ade', 'AFL', 'SA', { isFirstCareer: true }],    // first-time → tutorial + arrival briefing path
    ['vfl_box_hill_hawks', 'VFL', 'VIC', { isFirstCareer: false }],
    ['efnl_balwyn', 'EFNL', 'VIC', { isFirstCareer: false }],
  ];

  for (const [clubId, leagueKey, state, opts] of cases) {
    it(`renders hub for ${leagueKey}/${clubId} (firstCareer=${opts.isFirstCareer})`, async () => {
      const career = buildFreshCareer(clubId, leagueKey, state, opts);
      localStorage.setItem(`footy-dynasty-career-slot-A`, JSON.stringify({ ...career, savedAt: new Date().toISOString() }));
      localStorage.setItem('footy-dynasty-active-slot', 'A');
      localStorage.setItem('footy-dynasty-slots', JSON.stringify({ A: { managerName: 'Coach', clubId, leagueKey, season: 2026 } }));

      const AFLManager = await importAFLManager();
      const { container } = render(React.createElement(AFLManager));

      const text = container.textContent || '';
      // The AppErrorBoundary renders this exact copy when a child throws.
      expect(text).not.toContain('Something went wrong');
      // Sanity: we rendered *something* substantial.
      expect(container.querySelector('#root, div')).toBeTruthy();
      expect(text.length).toBeGreaterThan(20);
    });
  }
});
