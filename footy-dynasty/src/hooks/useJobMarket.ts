// Job Market hook - handles job offers, sacking, accepting new jobs
// Extracted from AFLManager.jsx

import { useCallback, useRef } from 'react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';
import { PYRAMID, findClub, getCompetitionClubs, localDivisionForClub } from '../data/pyramid.js';
import { generateSquad } from '../lib/playerGen.js';
import { generateFixtures, generateByeRounds, blankLadder, generateSeasonCalendar } from '../lib/leagueEngine.js';
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits } from '../lib/defaults.js';
import { DEFAULT_STAFF_TASKS } from '../lib/staffTasks.js';
import { clamp } from '../lib/format.js';
import { makeStartingFinance, scaledSquadToFitCap } from '../lib/finance/engine.js';
import { buildStartingSponsors } from '../lib/finance/sponsors.js';
import { getClubGround } from '../data/grounds.js';
import { resetExecutiveBoard, generateSeasonObjectives, planSeasonBoardMeetings } from '../lib/board.js';
import { assignDynastyQuestsForSeason } from '../lib/dynastyQuests.js';
import { seedNationalDraft } from '../lib/draftSeed.js';
import { getDifficultyConfig } from '../lib/difficulty.js';
import { generateCommittee, generateJournalist, rollPlayerTrait } from '../lib/community.js';
import { generateJobMarket, takeSeasonOff } from '../lib/coachReputation.js';
import { simulatePartialSeason } from '../lib/jobMove.js';
import { LINEUP_CAP } from '../lib/lineupHelpers.js';

interface UseJobMarketOptions {
  setScreen: (screen: string) => void;
  setTab: (tab: string | null) => void;
  setCareer: (career: any) => void;
}

export function useJobMarket({ setScreen, setTab, setCareer }: UseJobMarketOptions) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();

  const shellRef = useRef({ career: null, setCareer: updateCareer, setScreen, setTab });
  shellRef.current = { career, setCareer: updateCareer, setScreen, setTab };

  // Accept a new job at a different club
  const acceptNewJob = useCallback((offer: any, opts: { startMode?: string } = {}) => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!c) return;
    
    const startMode = opts.startMode || 'nextSeason';
    const newLeague = PYRAMID[offer.leagueKey];
    if (!newLeague) return;
    const newClub = newLeague.clubs.find((cl: any) => cl.id === offer.clubId);
    if (!newClub) return;
    
    const SEASON = startMode === 'nextSeason' ? c.season + 1 : c.season;
    const newSquad = generateSquad(newClub.id, newLeague.tier, 38, SEASON).map((p: any) => ({
      ...p,
      morale: clamp((p.morale ?? 70)
        + ((c.coachStats?.premierships || 0) > 0 ? 5 : 0)
        + ((c.coachStats?.relegations || 0) > 0 && Math.random() < 0.05 ? -8 : 0),
        0, 100),
      traits: rollPlayerTrait() ? [rollPlayerTrait()] : [],
    }));
    
    const newRegionState = newClub.state;
    const newLocalDivision = newLeague.tier === 3 ? localDivisionForClub(newClub.id, offer.leagueKey, newRegionState) : null;
    const compClubsNew = getCompetitionClubs(offer.leagueKey, newRegionState, newLocalDivision);
    const newFixtures = generateFixtures(compClubsNew);
    const newByeMap = generateByeRounds(compClubsNew.map((cl: any) => cl.id), newFixtures.length);
    const eventQueue = generateSeasonCalendar(SEASON, compClubsNew, newFixtures, newClub.id, {
      nationalDraft: newLeague.tier === 1,
    });

    let startWeek = 0;
    let startPhase = 'preseason';
    let startDate = `${SEASON - 1}-12-01`;
    let startLadder = blankLadder(compClubsNew);
    
    if (startMode === 'midSeason') {
      startDate = c.currentDate || startDate;
      const roundEvents = eventQueue.filter((e: any) => e.type === 'round');
      const playedRounds = roundEvents.filter((e: any) => e.date < startDate).length;
      eventQueue.forEach((e: any) => { if (e.date < startDate) e.completed = true; });
      const sim = simulatePartialSeason(compClubsNew, newFixtures, playedRounds, newLeague.tier, newClub.id);
      startLadder = sim.ladder;
      const nextRound = roundEvents.find((e: any) => !e.completed);
      startWeek = nextRound ? nextRound.round : (roundEvents.length ? roundEvents[roundEvents.length - 1].round : 0);
      startPhase = playedRounds > 0 ? 'season' : 'preseason';
    }
    
    const interviewBump = offer.interviewStartingBoardBonus ?? 0;
    const startingBoard = clamp(
      ((c.coachReputation ?? 30) >= 60 ? 65 : 55) + interviewBump,
      38, 78
    );
    
    const newFinance = makeStartingFinance(newLeague.tier, c.difficulty, startingBoard);
    const squadForCap = scaledSquadToFitCap({
      clubId: newClub.id,
      leagueKey: offer.leagueKey,
      difficulty: c.difficulty,
      finance: newFinance,
      squad: newSquad,
    });
    const newLineup = squadForCap.slice().sort((a: any, b: any) => b.overall - a.overall).slice(0, LINEUP_CAP).map((p: any) => p.id);
    const initialSponsors = buildStartingSponsors(newLeague.tier);
    const newFacilities = DEFAULT_FACILITIES();
    const newClubGround = getClubGround(newClub, newFacilities.stadium.level, newLeague.tier);

    const nextCareer = {
      ...c,
      coachStats: {
        ...c.coachStats,
        clubsManaged: (c.coachStats?.clubsManaged || 1) + 1,
      },
      previousClubs: [
        ...(c.previousClubs || []),
        {
          clubId: c.clubId, leagueKey: c.leagueKey,
          seasons: c.coachStats?.seasonsManaged || 1,
          wins: c.coachStats?.totalWins || 0,
          losses: c.coachStats?.totalLosses || 0,
          premierships: c.coachStats?.premierships || 0,
          finalSeason: c.season,
          tier: (PYRAMID[c.leagueKey])?.tier,
        },
      ],
      clubId: newClub.id,
      leagueKey: offer.leagueKey,
      regionState: newRegionState,
      localDivision: newLocalDivision,
      season: SEASON,
      week: startWeek,
      winStreak: 0,
      homeWinStreak: 0,
      currentDate: startDate,
      phase: startPhase,
      pendingJobOffer: null,
      eventQueue,
      squad: squadForCap,
      lineup: newLineup,
      kits: defaultKits(newClub.colors),
      ladder: startLadder,
      fixtures: newFixtures,
      byeMap: newByeMap,
      finance: newFinance,
      sponsors: initialSponsors,
      staff: generateStaff(newLeague.tier),
      staffTasks: DEFAULT_STAFF_TASKS(),
      facilities: newFacilities,
      training: DEFAULT_TRAINING(),
      isSacked: false,
      jobMarketOpen: false,
      sackingStep: null,
      gameOver: null,
      jobOffers: [],
      tier3Div1Titles: 0,
      lastPromotionPlayoff: null,
      boardWarning: 0,
      boardVotePrepBonus: 0,
      jobMarketRerolls: 0,
      arrivalBriefing: { pending: true },
      boardCrisis: null,
      boardMeetingBlocking: null,
      boardMeetingSlots: [],
      boardMeetingSeasonPlanned: null,
      aiSquads: {},
      brownlow: {},
      pendingTradeOffers: [],
      retiredThisSeason: [],
      lastEvent: null,
      lastMatchSummary: null,
      currentMatchResult: null,
      inMatchDay: false,
      committee: generateCommittee(newLeague.tier),
      footyTripAvailable: false,
      footyTripUsed: false,
      groundCondition: 85,
      clubGround: newClubGround,
      groundName: newClubGround.shortName,
      weeklyWeather: {},
      journalist: c.coachReputation >= 60
        ? { ...generateJournalist(), satisfaction: 65 }
        : generateJournalist(),
      news: [
        { week: startWeek, type: 'win', text: `\u270D\ufe0f Welcome to ${newClub.name}, ${c.managerName}. ${offer.chairmanLine.replace(/&ldquo;|&rdquo;|"|"/g, '').trim()}` },
        ...(startMode === 'midSeason'
          ? [{ week: startWeek, type: 'info', text: `\u1F6B1 You step in mid-season with the club sitting where they are on the ladder \u2014 pick up the run home.` }]
          : []),
        { week: startWeek, type: 'info', text: '\u1F91D No shirt sponsors signed yet \u2014 open the Club tab to review incoming offers.' },
      ],
    };
    
    resetExecutiveBoard(nextCareer, newClub, newLeague, newFinance.boardConfidence);
    generateSeasonObjectives(nextCareer, newLeague);
    planSeasonBoardMeetings(nextCareer);
    const dqN = compClubsNew.length || newLeague.clubs?.length || 12;
    assignDynastyQuestsForSeason(nextCareer, newLeague.tier, dqN);
    seedNationalDraft(nextCareer, newLeague, { inaugural: true, force: true });
    sc(nextCareer);
    ss('hub');
    st(null);
  }, []);

  // Handle accepting job from Job Centre
  const handleAcceptJobFromCentre = useCallback((offer: any, startType: string) => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!c) return;
    
    if (startType === 'endOfSeason') {
      sc({
        pendingJobOffer: { ...offer, agreedSeason: c.season },
        news: [{ week: c.week ?? 0, type: 'info', text: `\u1F91D You've agreed to take over ${offer.clubName} at season's end \u2014 finish strong with ${c.club?.short || 'your club'}.` }, ...(c.news || [])].slice(0, 20),
      });
      ss('hub');
      st(null);
      return;
    }
    acceptNewJob(offer, { startMode: startType === 'immediate' ? 'midSeason' : 'nextSeason' });
  }, [acceptNewJob]);

  // Check for pending end-of-season job
  const checkPendingJobOffer = useCallback(() => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!c?.pendingJobOffer) return;
    const po = c.pendingJobOffer;
    if (c.season > (po.agreedSeason ?? c.season) && c.phase === 'preseason' && !c.isSacked) {
      acceptNewJob(po, { startMode: 'sameSeasonPreseason' });
    }
  }, [acceptNewJob]);

  // Handle sacking
  const triggerSack = useCallback((clubName: string, round: number) => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    triggerSackState(c, clubName, round);
    sc(c);
  }, []);

  return {
    acceptNewJob,
    handleAcceptJobFromCentre,
    checkPendingJobOffer,
    triggerSack,
  };
}