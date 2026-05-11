import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import {
  Trophy, Users, DollarSign, Dumbbell, Building2, Handshake, Shirt,
  UserCog,   Repeat, Sprout, BarChart3, Calendar, ChevronRight, ChevronLeft,
  Home, Settings, Play, Pause, Save, ArrowUp, ArrowDown, ArrowRight,
  Star, Zap, Heart, Target, Activity, Flame, Sparkles, Crown,
  TrendingUp, TrendingDown, Plus, Minus, X, Check, Clock, MapPin,
  Newspaper, ShieldCheck, Gauge, Palette, Briefcase, GraduationCap,
  Map, Award, AlertCircle, ChevronsUp, FileText, RefreshCw, UserPlus,
  Landmark, GripVertical, LayoutDashboard, Wrench,
} from "lucide-react";
import { seedRng, rand, pick, rng, TIER_SCALE } from './lib/rng.js';
import { STATES, PYRAMID, LEAGUES_BY_STATE, ALL_CLUBS, findClub, findLeagueOf, findClubByShort } from './data/pyramid.js';
import { pyramidNoteForLeague } from './data/pyramidMeta.js';
import { POSITIONS, POSITION_NAMES, FIRST_NAMES, LAST_NAMES, generatePlayer, generateSquad, playerHasPosition, formatPositionSlash, isForwardPreferred, isMidPreferred } from './lib/playerGen.js';
import { generateFixtures, blankLadder, sortedLadder, finalsLabel, pickPromotionLeague, pickRelegationLeague, getCompetitionClubs, localDivisionForClub, tier3DivisionCount, tier3DivisionTeamCounts, LOCAL_DIVISION_COUNT, TIER3_CLUBS_PER_DIVISION_TARGET, TIER3_MIN_CLUBS_PER_DIVISION } from './lib/leagueEngine.js';
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits, generateTradePool } from './lib/defaults.js';
import { fmt, fmtK, clamp, avgFacilities, avgStaff } from './lib/format.js';
import { generateSeasonCalendar, TRAINING_INFO, formatDate, intensityScale, trainingAttrFocusBoost } from './lib/calendar.js';
import { SAVE_VERSION, SLOT_IDS, readSlot, writeSlot, deleteSlot, readSlotMeta, getActiveSlot, setActiveSlot, migrateLegacy, migrate as migrateSave } from './lib/save.js';
import {
  playerBlockedFromTrade,
  TRADE_PERIOD_DAYS,
  POST_TRADE_DRAFT_COUNTDOWN_DAYS,
} from './lib/tradePeriod.js';
import { css, Bar, RatingDot, Pill, Stat, Jersey, GlobalStyle } from './components/primitives.jsx';
import GameOverScreen from './screens/GameOverScreen.jsx';
import PostMatchSummary from './screens/PostMatchSummary.jsx';
import SackingSequence from './screens/SackingSequence.jsx';
import VoteOfConfidenceFlow from './screens/VoteOfConfidenceFlow.jsx';
import BoardMeetingScreen from './screens/BoardMeetingScreen.jsx';
import ArrivalBriefingFlow from './screens/ArrivalBriefingFlow.jsx';
import TutorialOverlay, {
  tutorialAllowsNavigation,
  tutorialMidStepCompleted,
  tutorialLocksAdvanceButton,
} from './components/TutorialOverlay.jsx';
import { HubScreen } from './screens/hub/HubScreen.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import { CareerSetup } from './screens/CareerSetupScreen.jsx';
import { Sidebar } from './components/gameChrome/Sidebar.jsx';
import { TopBar } from './components/gameChrome/TopBar.jsx';
import { TUTORIAL_STEPS } from './lib/tutorialConstants.js';
import { SETUP_SS_KEY, SETUP_SS_KEY_LEGACY } from './lib/setupConstants.js';

const ScheduleScreenLazy = lazy(() => import('./screens/ScheduleScreen.jsx'));
const CompetitionScreenLazy = lazy(() => import('./screens/competition/CompetitionScreen.jsx'));
const SquadScreenLazy = lazy(() => import('./screens/squad/SquadScreen.jsx'));
const ClubScreenLazy = lazy(() => import('./screens/club/ClubScreen.jsx'));
const RecruitScreenLazy = lazy(() => import('./screens/recruit/RecruitScreen.jsx'));

// --- Gameplay systems spec (Sections 1-3) ---
import { DIFFICULTY_IDS, DIFFICULTY_META, getDifficultyConfig, getDifficultyProfile, shouldShowTutorial } from './lib/difficulty.js';
import {
  generateCommittee, getCommitteeMember, bumpCommitteeMood, committeeMoodAverage,
  committeeMessage, FOOTY_TRIP_OPTIONS, applyFootyTrip, postMatchFundraiser,
  ensureWeatherForWeek, applyGroundDegradation, recoverGroundPreseason,
  groundConditionBand, stadiumDescription, generateJournalist, journalistMatchLine,
  rollPlayerTrait,
} from './lib/community.js';
import {
  generateJobMarket, takeSeasonOff,
} from './lib/coachReputation.js';
// --- Finance system rebuild ---
import {
  effectiveWageCap, capHeadroom,
  currentPlayerWageBill,
  canAffordSigning, makeStartingFinance, scoutedOverall,
  incomeBreakdown, expenseBreakdown,
  annualWageBill, leagueTierOf,
  scaledSquadToFitCap, rookieDraftWage,
} from './lib/finance/engine.js';
import {
  tickSponsorYears, proposalForRenewal, generateSponsorOffers,
  applyRenewalAcceptance, applyRenewalDecline, applySponsorOfferAcceptance,
  buildInitialSponsorOffers,
} from './lib/finance/sponsors.js';
import { proposeRenewal, renewalExtensionStableKey, applyRenewal, applyRenewalRejection, canAffordRenewal } from './lib/finance/contracts.js';
import { applyStaffRenewalAccept, applyStaffRenewalReject, canAffordStaffRenewal } from './lib/staffRenewals.js';
import { getAdvanceContext } from './lib/advanceContext.js';
import {
  ensureCareerBoard,
  resetExecutiveBoard,
  applyBoardConfidenceDelta,
  generateSeasonObjectives,
  updateBoardObjectiveProgress,
  resolveBoardObjectivesAtSeasonEnd,
  youthSeniorGameCount,
  boardObjectiveUiStatus,
  maybeEnqueueBoardMessage,
  maybeEnqueueBoardCrisisPrep,
  resolveBoardInboxChoice,
  planSeasonBoardMeetings,
  findDueBoardMeetingSlot,
  openBoardMeetingBlockingFromSlot,
  catchUpBoardMeetingForCurrentWeek,
  applyVoteSurvivalMutate,
  resolveRoutineBoardMeeting,
  alignBoardMembersToTarget,
  recalcBoardConfidence,
  applyMemberConfidenceDelta,
} from './lib/board.js';
import { getClubGround } from './data/grounds.js';
import { advanceCareerNextEvent, triggerSackState, primeSeasonStoryState } from './lib/careerAdvance.js';
import { LINEUP_CAP } from './lib/lineupHelpers.js';

/** Single light UI — always `dirA` (see tokens.css `--A-*`). */
function themeWrapperClass() {
  return 'dirA';
}


// ============================================================================
// MAIN APP
// ============================================================================
export default function AFLManager() {
  return <AppErrorBoundary><AFLManagerInner /></AppErrorBoundary>;
}


function AFLManagerInner() {
  const [activeSlot, setActiveSlotState] = useState(() => getActiveSlot());
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [slotMetaTick, setSlotMetaTick] = useState(0);
  const [showPostMatch, setShowPostMatch] = useState(false);
  const [career, setCareer] = useState(() => {
    const slot = getActiveSlot();
    if (slot) {
      const fromSlot = readSlot(slot);
      if (fromSlot) return fromSlot;
    }
    // Try legacy key migration
    return migrateLegacy();
  });
  const [screen, setScreen] = useState("hub");
  const [tab, setTab] = useState(null);

  // Autosave on career change to active slot
  useEffect(() => {
    if (!career || !activeSlot) return;
    const opts = career.options || { autosave: true };
    if (!opts.autosave) return;
    writeSlot(activeSlot, career);
    sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
    sessionStorage.removeItem(SETUP_SS_KEY);
    setSlotMetaTick(t => t + 1);
  }, [career, activeSlot]);

  // Tutorial mid-step auto-advance (must run before any early return — Rules of Hooks)
  useEffect(() => {
    if (!career || career.tutorialComplete) return;
    const step = career.tutorialStep ?? 0;
    if (step <= 0 || step >= 6) return;
    if (!tutorialMidStepCompleted(step, screen, tab, career)) return;
    const next = step + 1;
    const isDone = next >= TUTORIAL_STEPS.length;
    setCareer((c) => ({ ...c, tutorialStep: next, tutorialComplete: isDone }));
  }, [career, career?.tutorialStep, career?.tutorialComplete, career?.sponsors, screen, tab]);

  function handleNewGame() {
    if (!window.confirm('Abandon your current career and start a new game?')) return;
    sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
    sessionStorage.removeItem(SETUP_SS_KEY);
    setActiveSlot(null);
    setActiveSlotState(null);
    setCareer(null);
    setScreen('hub');
    setTab(null);
  }

  function handleSaveNow() {
    if (!career || !activeSlot) return;
    writeSlot(activeSlot, career);
    setSlotMetaTick(t => t + 1);
  }

  function handleSwitchSlot(slot) {
    if (slot === activeSlot) {
      setShowSlotPicker(false);
      return;
    }
    if (career && activeSlot) writeSlot(activeSlot, career);
    const loaded = readSlot(slot);
    setActiveSlot(slot);
    setActiveSlotState(slot);
    setCareer(loaded);
    setScreen('hub');
    setTab(null);
    setShowSlotPicker(false);
  }

  function handleDeleteSlot(slot) {
    if (!window.confirm(`Delete save in slot ${slot}? This cannot be undone.`)) return;
    deleteSlot(slot);
    if (slot === activeSlot) {
      setActiveSlot(null);
      setActiveSlotState(null);
      setCareer(null);
    }
    setSlotMetaTick(t => t + 1);
  }

  // ============== JOB MARKET — accept a new job at a different club ==============
  function acceptNewJob(offer) {
    const newLeague = PYRAMID[offer.leagueKey];
    if (!newLeague) return;
    const newClub = newLeague.clubs.find(c => c.id === offer.clubId);
    if (!newClub) return;
    seedRng(Date.now() % 100000);
    const cfg = getDifficultyConfig(career.difficulty);
    const newSquad = generateSquad(newClub.id, newLeague.tier, 32, career.season + 1).map(p => ({
      ...p,
      // Spec 3F: legacy follows you — premiership winners boost morale, relegation history sows doubt
      morale: clamp((p.morale ?? 70)
        + ((career.coachStats?.premierships || 0) > 0 ? 5 : 0)
        + ((career.coachStats?.relegations  || 0) > 0 && rng() < 0.05 ? -8 : 0),
        cfg.moraleFloor, 100),
      traits: rollPlayerTrait() ? [rollPlayerTrait()] : [],
    }));
    const newRegionState = newClub.state;
    const newLocalDivision = newLeague.tier === 3 ? localDivisionForClub(newClub.id, offer.leagueKey, newRegionState) : null;
    const compClubsNew = getCompetitionClubs(offer.leagueKey, newRegionState, newLocalDivision);
    const newFixtures = generateFixtures(compClubsNew);
    const SEASON = career.season + 1;
    const eventQueue = generateSeasonCalendar(SEASON, compClubsNew, newFixtures, newClub.id);
    const interviewBump = offer.interviewStartingBoardBonus ?? 0;
    const startingBoard = clamp(
      ((career.coachReputation ?? 30) >= 60 ? 65 : 55) + interviewBump,
      38,
      78,
    );
    const newFinance = makeStartingFinance(newLeague.tier, career.difficulty, startingBoard);
    const newLadder = blankLadder(compClubsNew);
    const squadForCap = scaledSquadToFitCap({
      clubId: newClub.id,
      leagueKey: offer.leagueKey,
      difficulty: career.difficulty,
      finance: newFinance,
      squad: newSquad,
    });
    const newLineup = squadForCap.slice().sort((a,b)=>b.overall-a.overall).slice(0, LINEUP_CAP).map(p => p.id);
    const initialOffers = buildInitialSponsorOffers({
      leagueTier: newLeague.tier,
      difficulty: career.difficulty,
      clubId: newClub.id,
      ladder: newLadder,
      coachReputation: career.coachReputation ?? 30,
    });
    const newFacilities = DEFAULT_FACILITIES();
    const newClubGround = getClubGround(newClub, newFacilities.stadium.level, newLeague.tier);

    const nextCareer = {
      ...career,
      // Persist coach stats / reputation / previous clubs
      coachStats: {
        ...career.coachStats,
        clubsManaged: (career.coachStats?.clubsManaged || 1) + 1,
      },
      previousClubs: [
        ...(career.previousClubs || []),
        {
          clubId: career.clubId, leagueKey: career.leagueKey,
          seasons: career.coachStats?.seasonsManaged || 1,
          wins: career.coachStats?.totalWins || 0,
          losses: career.coachStats?.totalLosses || 0,
          premierships: career.coachStats?.premierships || 0,
          finalSeason: career.season,
          tier: league.tier,
        },
      ],
      // New club state
      clubId:    newClub.id,
      leagueKey: offer.leagueKey,
      regionState: newRegionState,
      localDivision: newLocalDivision,
      season:    SEASON,
      week:      0,
      winStreak: 0,
      homeWinStreak: 0,
      currentDate: `${SEASON - 1}-12-01`,
      phase:     'preseason',
      eventQueue,
      squad:     squadForCap,
      lineup:    newLineup,
      kits:      defaultKits(newClub.colors),
      ladder:    newLadder,
      fixtures:  newFixtures,
      finance:   newFinance,
      sponsors:  [],
      staff:     generateStaff(newLeague.tier),
      facilities: newFacilities,
      training:  DEFAULT_TRAINING(),
      // Reset round/match state
      isSacked:  false,
      jobMarketOpen: false,
      sackingStep: null,
      gameOver:  null,
      jobOffers: [],
      boardWarning: 0,
      boardVotePrepBonus: 0,
      jobMarketRerolls: 0,
      arrivalBriefing: { pending: true },
      boardCrisis: null,
      boardMeetingBlocking: null,
      boardMeetingSlots: [],
      boardMeetingSeasonPlanned: null,
      aiSquads:  {},
      brownlow:  {},
      pendingTradeOffers: [],
      retiredThisSeason: [],
      lastEvent: null,
      lastMatchSummary: null,
      currentMatchResult: null,
      inMatchDay: false,
      // Community state for the new tier
      committee: generateCommittee(newLeague.tier),
      footyTripAvailable: false,
      footyTripUsed: false,
      groundCondition: 85,
      clubGround: newClubGround,
      groundName: newClubGround.shortName,
      weeklyWeather: {},
      // v4 finance state — fresh ledger at the new club
      weeklyHistory: [],
      lastFinanceTickWeek:        null,
      lastFinanceTickDay:         null,
      cashCrisisStartWeek:        null,
      cashCrisisLevel:            0,
      bankLoan:                   null,
      sponsorRenewalProposals:    [],
      sponsorOffers:              initialOffers,
      expiredSponsorsLastSeason:  [],
      pendingRenewals:            [],
      renewalsClosed:             false,
      pendingStaffRenewals:       [],
      fundraisersUsed:            {},
      communityGrantUsed:         false,
      lastEosFinance:             null,
      postSeasonPhase:            'none',
      inTradePeriod:              false,
      tradePeriodDay:             0,
      freeAgencyOpen:             false,
      postSeasonDraftCountdown:   null,
      freeAgentBalance:           { gained: 0, lost: 0 },
      tradeHistory:               [],
      draftPickBank:              null,
      offSeasonFreeAgents:        [],
      // Fresh journalist at the new club
      journalist: career.coachReputation >= 60
        ? { ...generateJournalist(), satisfaction: 65 }
        : generateJournalist(),
      news: [
        { week: 0, type: 'win', text: `✍️ Welcome to ${newClub.name}, ${career.managerName}. ${offer.chairmanLine.replace(/&ldquo;|&rdquo;|&quot;|"/g, '').trim()}` },
        { week: 0, type: 'info', text: '🤝 No shirt sponsors signed yet — open the Club tab to review incoming offers.' },
      ],
    };
    resetExecutiveBoard(nextCareer, newClub, newLeague, newFinance.boardConfidence);
    generateSeasonObjectives(nextCareer, newLeague);
    planSeasonBoardMeetings(nextCareer);
    setCareer(nextCareer);
    setScreen('hub');
    setTab(null);
  }

  // ============== CAREER SETUP ==============
  if (!career) {
    return <CareerSetup onStart={(c) => {
      const meta = readSlotMeta();
      let slot = activeSlot;
      if (!slot) {
        slot = SLOT_IDS.find(s => !meta[s]) || 'A';
      }
      setActiveSlot(slot);
      setActiveSlotState(slot);
      const initialised = { ...c, saveVersion: SAVE_VERSION, options: c.options || { autosave: true } };
      writeSlot(slot, initialised);
      sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
      sessionStorage.removeItem(SETUP_SS_KEY);
      setCareer(initialised);
      setScreen("hub");
    }} existingSlots={readSlotMeta()} onResume={(slot) => { handleSwitchSlot(slot); }} />;
  }

  const club = findClub(career.clubId);
  const league = PYRAMID[career.leagueKey];
  const myLineup = career.lineup;

  function advanceToNextEvent() {
    advanceCareerNextEvent({ career, league, club, setCareer, setScreen });
  }

  // ============== UPDATER ==============
  const updateCareer = (patch) => setCareer(c => ({ ...c, ...patch }));
  const updateField = (field, value) => setCareer(c => ({ ...c, [field]: value }));

  const tutorialActive = career && !career.tutorialComplete;

  const onNavScreen = (key) => {
    if (career && !career.tutorialComplete && !tutorialAllowsNavigation(career.tutorialStep ?? 0, key)) {
      return;
    }
    setScreen(key);
    setTab(null);
  };

  const myLadderPos = (() => {
    const s = sortedLadder(career.ladder);
    return s.findIndex(r => r.id === career.clubId) + 1;
  })();

  // ============== RENDER ==============
  const globalStyle = <GlobalStyle />;

  // ============== GAME OVER (sacking) ==============
  // Sacking sequence (Spec Section 3F) — runs whenever isSacked is true.
  // Drives the 5-step narrative, then a Job Market screen for the new club.
  if (career.isSacked) {
    return (
      <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
        {globalStyle}
        <SackingSequence
          career={career}
          club={club}
          onAdvanceStep={(nextStep) => {
            const update = { sackingStep: nextStep };
            // When entering Job Market step, generate offers
            if (nextStep === 4 && (!career.jobOffers || career.jobOffers.length === 0)) {
              update.jobOffers = generateJobMarket(career);
            }
            updateCareer(update);
          }}
          onAcceptJob={(offer) => acceptNewJob(offer)}
          onTakeSeasonOff={() => {
            const result = takeSeasonOff(career);
            // Re-roll offers for next pass; bump rep slightly
            updateCareer({
              ...result,
              jobOffers: generateJobMarket({ ...career, ...result }),
              news: [{ week: 0, type: 'info', text: `🪞 Took the season off. Reputation +5. The phone might ring louder next year.` }, ...(career.news || [])].slice(0, 20),
            });
          }}
          onRerollJobMarket={() => {
            if ((career.jobMarketRerolls ?? 0) >= 1) return;
            updateCareer({
              jobMarketRerolls: (career.jobMarketRerolls ?? 0) + 1,
              jobOffers: generateJobMarket(career, { desperate: true }),
              news: [{ week: career.week ?? 0, type: 'info', text: '📡 Re-scanned the job market — deeper vacancies listed.' }, ...(career.news || [])].slice(0, 20),
            });
          }}
        />
      </div>
    );
  }

  // Legacy game-over (kept as a no-op fallback so older saves with gameOver but no isSacked don't crash)
  if (career.gameOver && !career.isSacked) {
    return (
      <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
        {globalStyle}
        <GameOverScreen
          career={career}
          club={club}
          onRestart={() => {
            setActiveSlot(null);
            setActiveSlotState(null);
            setCareer(null);
            setScreen('hub');
            setTab(null);
          }}
          onTakeNewJob={() => {
            const next = {
              ...career,
              gameOver: null,
              finance: { ...career.finance, boardConfidence: 55 },
              boardWarning: 0,
            };
            resetExecutiveBoard(next, findClub(career.clubId), PYRAMID[career.leagueKey] || league, 55);
            updateCareer(next);
          }}
        />
      </div>
    );
  }

  if (career.showSeasonSummary && career.seasonSummary) {
    return (
      <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
        {globalStyle}
        <SeasonSummaryScreen
          summary={career.seasonSummary}
          club={club}
          retiredThisSeason={career.retiredThisSeason}
          eosFinance={career.lastEosFinance}
          onContinue={() => updateCareer({ showSeasonSummary: false })}
        />
      </div>
    );
  }

  if (career.inMatchDay && career.currentMatchResult) {
    return (
      <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
        {globalStyle}
        <MatchDayScreen
          result={career.currentMatchResult}
          league={league}
          career={career}
          club={club}
          onContinue={() => {
            // Show post-match summary first if we have one (regular-season player matches)
            if (career.lastMatchSummary && !career.currentMatchResult.isPreseason) {
              setShowPostMatch(true);
            } else {
              updateCareer({ inMatchDay: false, currentMatchResult: null, lastMatchSummary: null });
            }
          }}
        />
        {showPostMatch && career.lastMatchSummary && (
          <PostMatchSummary
            summary={career.lastMatchSummary}
            career={career}
            club={club}
            onReview={() => setShowPostMatch(false)}
            onContinue={() => {
              setShowPostMatch(false);
              updateCareer({ inMatchDay: false, currentMatchResult: null, lastMatchSummary: null });
            }}
          />
        )}
      </div>
    );
  }

  if (career.boardCrisis?.phase === 'active') {
    return (
      <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
        {globalStyle}
        <VoteOfConfidenceFlow
          career={career}
          club={club}
          league={league}
          onComplete={({ survived, pitchBonus }) => {
            if (survived) {
              const next = JSON.parse(JSON.stringify(career));
              const { newsLine } = applyVoteSurvivalMutate(next, league, pitchBonus);
              const catchUp = catchUpBoardMeetingForCurrentWeek(next);
              if (catchUp) next.boardMeetingBlocking = catchUp;
              next.news = [{ week: next.week, type: 'board', text: newsLine }, ...(next.news || [])].slice(0, 20);
              updateCareer(next);
            } else {
              const next = JSON.parse(JSON.stringify(career));
              triggerSackState(next, club.name, career.week);
              updateCareer(next);
            }
          }}
        />
      </div>
    );
  }

  if (career.boardMeetingBlocking) {
    return (
      <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
        {globalStyle}
        <BoardMeetingScreen
          career={career}
          blocking={career.boardMeetingBlocking}
          onChoose={(choiceId) => {
            const draft = JSON.parse(JSON.stringify(career));
            const r = resolveRoutineBoardMeeting(draft, league, career.boardMeetingBlocking.slotId, choiceId);
            if (r.ok) {
              updateCareer({
                ...draft,
                news: [{ week: draft.week, type: 'board', text: r.newsLine }, ...(draft.news || [])].slice(0, 20),
              });
            }
          }}
        />
      </div>
    );
  }

  if (career.arrivalBriefing?.pending) {
    return (
      <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
        {globalStyle}
        <ArrivalBriefingFlow
          career={career}
          club={club}
          league={league}
          onComplete={(patch) => {
            const next = JSON.parse(JSON.stringify({ ...career, ...patch }));
            ensureCareerBoard(next, findClub(next.clubId), PYRAMID[next.leagueKey]);
            alignBoardMembersToTarget(next.board, next.finance.boardConfidence);
            recalcBoardConfidence(next);
            setCareer(next);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${themeWrapperClass()} min-h-screen font-sans text-atext flex w-full flex-col md:flex-row`}>
      {globalStyle}
      <Sidebar
        screen={screen}
        onNavigate={onNavScreen}
        club={club}
        league={league}
        career={career}
        myLadderPos={myLadderPos}
        onNewGame={handleNewGame}
        onSaveNow={handleSaveNow}
        activeSlot={activeSlot}
        onTogglePicker={() => setShowSlotPicker(s => !s)}
        showSlotPicker={showSlotPicker}
        slotMeta={readSlotMeta()}
        slotMetaTick={slotMetaTick}
        onSwitchSlot={handleSwitchSlot}
        onDeleteSlot={handleDeleteSlot}
      />
      <main className="flex-1 overflow-y-auto min-w-0">
        <TopBar
          career={career}
          club={club}
          league={league}
          myLadderPos={myLadderPos}
          onAdvance={advanceToNextEvent}
          advanceDisabled={tutorialLocksAdvanceButton(career)}
          tutorialSpotlightAdvance={!!tutorialActive && (career.tutorialStep ?? 0) === 6}
        />
        <div className="p-3 md:p-6 max-w-[1400px] mx-auto">
          {screen === "hub"      && <HubScreen career={career} club={club} league={league} myLadderPos={myLadderPos} setScreen={onNavScreen} setTab={setTab} onAdvance={advanceToNextEvent} />}
          {screen === "squad" && (
            <Suspense fallback={<div className="anim-in py-16 text-center text-atext-dim font-mono text-sm">Loading squad…</div>}>
              <SquadScreenLazy career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} tutorialActive={tutorialActive} />
            </Suspense>
          )}
          {screen === "schedule" && (
            <Suspense fallback={<div className="anim-in py-16 text-center text-atext-dim font-mono text-sm">Loading calendar…</div>}>
              <ScheduleScreenLazy career={career} club={club} league={league} />
            </Suspense>
          )}
          {screen === "club" && (
            <Suspense fallback={<div className="anim-in py-16 text-center text-atext-dim font-mono text-sm">Loading club…</div>}>
              <ClubScreenLazy career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} tutorialActive={tutorialActive} />
            </Suspense>
          )}
          {screen === "recruit" && (
            <Suspense fallback={<div className="anim-in py-16 text-center text-atext-dim font-mono text-sm">Loading recruit…</div>}>
              <RecruitScreenLazy career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} />
            </Suspense>
          )}
          {screen === "compete" && (
            <Suspense fallback={<div className="anim-in py-16 text-center text-atext-dim font-mono text-sm">Loading competition…</div>}>
              <CompetitionScreenLazy career={career} club={club} league={league} tab={tab} setTab={setTab} />
            </Suspense>
          )}
        </div>
      </main>
      {/* Tutorial Overlay (Spec Section 1) */}
      {!career.tutorialComplete && (career.tutorialStep ?? 0) < TUTORIAL_STEPS.length && (
        <TutorialOverlay
          step={career.tutorialStep ?? 0}
          onNext={() => {
            const cur = career.tutorialStep ?? 0;
            if (cur !== 0) return;
            const next = 1;
            updateCareer({ tutorialStep: next, tutorialComplete: next >= TUTORIAL_STEPS.length });
          }}
          onSkip={() => updateCareer({ tutorialStep: TUTORIAL_STEPS.length, tutorialComplete: true })}
        />
      )}
    </div>
  );
}

// ============================================================================
// SEASON SUMMARY SCREEN
// ============================================================================
function EosFinTile({ label, value, accent = 'var(--A-accent)', sub }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
      <div className={css.label}>{label}</div>
      <div className="font-display text-2xl mt-1" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[10px] text-atext-mute mt-1">{sub}</div>}
    </div>
  );
}

function SeasonSummaryScreen({ summary, club, retiredThisSeason = [], eosFinance = null, onContinue }) {
  const posColor   = summary.position <= 1 ? '#FFD700' : summary.position <= 4 ? '#4AE89A' : summary.position <= summary.totalTeams / 2 ? 'var(--A-accent)' : '#E84A6F';
  const tierColors = { 1: '#E84A6F', 2: 'var(--A-accent)', 3: '#4ADBE8' };
  const tierColor  = tierColors[summary.leagueTier] || 'var(--A-accent)';

  let outcomeText  = `Finished ${summary.position}${summary.position===1?'st':summary.position===2?'nd':summary.position===3?'rd':'th'} of ${summary.totalTeams}`;
  let outcomeIcon  = summary.champion ? '🏆' : summary.promoted ? '⬆️' : summary.relegated ? '⬇️' : summary.position <= 4 ? '✅' : '📊';
  let outcomeSub   = summary.champion   ? 'PREMIERS — ' + summary.leagueShort + ' Champions!'
    : summary.promoted  ? `Promoted to the next division`
    : summary.relegated ? `Relegated — bounce back next season`
    : outcomeText;

  const AwardCard = ({ icon, label, name, stat, sub }) => (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{background:'rgba(232,154,74,0.15)', border:'1px solid rgba(232,154,74,0.3)'}}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
        <div className="font-bold text-white truncate">{name || '—'}</div>
        <div className="text-sm font-display text-aaccent">{stat}</div>
      </div>
      {sub && <div className="text-[10px] text-slate-500 text-right leading-tight">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(160deg,#0F172A 0%,#1E293B 100%)'}}>
      {/* Header */}
      <div className="text-center px-6 py-10" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="text-5xl mb-4">{outcomeIcon}</div>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-2" style={{color: tierColor}}>{summary.leagueName} · Season {summary.season}</div>
        <div className="font-display text-6xl leading-none text-white mb-2">{summary.leagueShort} {summary.season}</div>
        <div className="font-bold text-xl" style={{color: posColor}}>{outcomeSub}</div>

        {/* Season record strip */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {[
            { label: 'Position', value: `#${summary.position}`, color: posColor },
            { label: 'Wins',     value: summary.W,  color: '#4AE89A' },
            { label: 'Losses',   value: summary.L,  color: '#E84A6F' },
            { label: 'Draws',    value: summary.D,  color: 'var(--A-accent)' },
            { label: 'Points',   value: summary.pts, color: '#A78BFA' },
            { label: 'Pct',      value: `${summary.pct}%`, color: '#4ADBE8' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="font-display text-4xl leading-none" style={{color}}>{value}</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Awards */}
      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4">Season Awards</div>

        {summary.champion && (
          <div className="rounded-2xl p-4 text-center mb-4" style={{background:'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(232,154,74,0.1))', border:'2px solid rgba(255,215,0,0.4)'}}>
            <div className="text-4xl mb-2">🏆</div>
            <div className="font-display text-3xl text-[#FFD700]">PREMIERS!</div>
            <div className="text-sm text-slate-300 mt-1">{club.name} are the {summary.season} {summary.leagueShort} Champions</div>
          </div>
        )}

        <AwardCard
          icon="🥇" label="Best & Fairest"
          name={summary.baf?.name}
          stat={summary.baf ? `${summary.baf.overall} OVR · ${summary.baf.games} games` : '—'}
        />
        <AwardCard
          icon="⚽" label="Top Goal Kicker"
          name={summary.topScorer?.name}
          stat={summary.topScorer ? `${summary.topScorer.goals} goals` : '—'}
          sub={summary.topScorer ? `${summary.topScorer.games} games` : null}
        />
        <AwardCard
          icon="🤝" label="Disposal King"
          name={summary.topDisposal?.name}
          stat={summary.topDisposal ? `${summary.topDisposal.disposals} disposals` : '—'}
          sub={summary.topDisposal ? `${summary.topDisposal.games} games` : null}
        />

        <AwardCard
          icon="🥇" label="Brownlow Medal"
          name={summary.brownlow?.name || '—'}
          stat={summary.brownlow ? `${summary.brownlow.votes} votes` : 'Outside our club this year'}
          sub={summary.brownlow?.position}
        />

        {retiredThisSeason && retiredThisSeason.length > 0 && (
          <div className="rounded-2xl p-4 mt-2" style={{background:'rgba(168,139,250,0.08)', border:'1px solid rgba(168,139,250,0.3)'}}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A78BFA] mb-3">Retirements & Departures</div>
            <div className="space-y-1.5">
              {retiredThisSeason.map((r, i) => (
                <div key={r.id || i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-200 font-semibold">{r.name}</span>
                  <span className="text-[11px] text-slate-400">
                    {r.reason === 'retired' ? `🏁 retired @ ${r.age}` : `📤 released`} · {r.career.gamesPlayed} games · {r.career.goals} goals
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(summary.promoted || summary.relegated) && (
          <div className="rounded-2xl p-4 mt-2" style={{background: summary.promoted ? 'rgba(74,232,154,0.1)' : 'rgba(232,74,111,0.1)', border: `1px solid ${summary.promoted ? 'rgba(74,232,154,0.3)' : 'rgba(232,74,111,0.3)'}`}}>
            <div className="font-bold text-base" style={{color: summary.promoted ? '#4AE89A' : '#E84A6F'}}>
              {summary.promoted ? '⬆️ Promoted!' : '⬇️ Relegated'}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {summary.promoted ? 'A new challenge awaits in the division above.' : 'Time to rebuild and fight back up.'}
            </div>
          </div>
        )}

        {eosFinance && (
          <div className="rounded-2xl p-5 mt-2" style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line-2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-aaccent" />
              <div className="font-display text-2xl tracking-wide text-atext">FINANCIAL YEAR</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <EosFinTile label="Cash on hand"        value={fmtK(eosFinance.cashEnd)} accent={eosFinance.cashEnd >= 0 ? '#4AE89A' : '#E84A6F'} />
              <EosFinTile label="Prize money"         value={`+${fmtK(eosFinance.prizeMoney)}`} accent="#FFD200" />
              <EosFinTile label="Transfer refill"     value={`+${fmtK(eosFinance.transferBudgetRefill)}`} accent="#4ADBE8" />
              <EosFinTile label="Sponsors lost"       value={eosFinance.sponsorsExpired} accent={eosFinance.sponsorsExpired > 0 ? '#E84A6F' : '#4AE89A'} sub={`${eosFinance.sponsorsActive} active now`} />
            </div>
            {eosFinance.cashCrisis > 0 && (
              <div className="mt-3 text-xs text-[#E84A6F] flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Cash crisis level {eosFinance.cashCrisis} carries into next season</div>
            )}
            {eosFinance.ripple && (
              <div className="mt-3 text-xs text-atext-dim">
                {eosFinance.ripple.promoted ? `Promotion ripple: sponsor values +30%, board confidence +20.` : `Relegation ripple: sponsor values cut to half, board confidence -25.`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-6" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="max-w-2xl mx-auto">
          <button onClick={onContinue}
            className="w-full py-4 rounded-2xl font-display text-xl tracking-widest text-white transition-all"
            style={{background:'linear-gradient(135deg,var(--A-accent),#D07A2A)', boxShadow:'0 4px 20px rgba(232,154,74,0.4)'}}>
            START SEASON {summary.season + 1} →
          </button>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// GAME OVER SCREEN
// ============================================================================
// ============================================================================
// MATCH DAY SCREEN — quarter-by-quarter visual scoreboard
// ============================================================================
function MatchDayScreen({ result, league, career, club, onContinue }) {
  const [revealed, setRevealed] = React.useState(0);
  const [showEvents, setShowEvents] = React.useState(true);

  const quarters = result.quarters || [];
  const qLabels  = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Cumulative scores per quarter
  const cumHome = [], cumAway = [];
  let hG = 0, hB = 0, aG = 0, aB = 0;
  quarters.forEach(q => {
    hG += q.homeGoals;   hB += q.homeBehinds;
    aG += q.awayGoals;   aB += q.awayBehinds;
    cumHome.push({ g: hG, b: hB, total: hG * 6 + hB });
    cumAway.push({ g: aG, b: aB, total: aG * 6 + aB });
  });

  // Events for the broadcast feed — only visible up to current revealed quarter
  const visibleQuarter = revealed === 0 ? 0 : Math.min(revealed, quarters.length);
  const eventFeed = (result.events || []).filter(ev => ev.q <= visibleQuarter);
  // Lookup helper for event scorer / moment player
  const playerLookup = useMemo(() => {
    const map = {};
    (career.squad || []).forEach(p => { map[p.id] = p; });
    return map;
  }, [career.squad]);

  // Final-quarter momentum (from event-driven engine if available)
  const momentumEnd = quarters.length ? (quarters[Math.min(visibleQuarter, quarters.length) - 1]?.momentumEnd ?? 0) : 0;
  const momentumPct = ((momentumEnd + 1) / 2) * 100; // -1..1 -> 0..100

  const homeClub = result.isHome ? club : result.opp;
  const awayClub = result.isHome ? result.opp : club;
  const myColor  = club.colors[0] || 'var(--A-accent)';
  const oppColor = result.opp?.colors?.[0] || '#64748B';

  const won  = result.won;
  const drew = result.drew;
  const resultLabel = won ? 'WIN' : drew ? 'DRAW' : 'LOSS';
  const resultColor = won ? '#4AE89A' : drew ? 'var(--A-accent)' : '#E84A6F';

  // AFL-tier commentary lines
  const commentary = result.isAFL ? [
    won  ? `${club.name} put in a dominant performance today.` : drew ? `An even contest — both sides had their chances.` : `A tough day at the office for ${club.name}.`,
    result.myTotal > 80 ? 'The forward line was electric, converting at a high rate.' : result.myTotal > 60 ? 'A solid if unremarkable offensive effort.' : 'The team struggled to convert inside 50.',
    won && result.myTotal - result.oppTotal > 30 ? 'It was never in doubt from the third quarter on.' : won ? 'They held on for a hard-fought victory.' : '',
    result.isPreseason ? 'Pre-season result — ladders unaffected.' : `${league.short} Round ${result.label.replace('Round ', '')}.`,
  ].filter(Boolean) : [];

  return (
    <div className="min-h-screen flex flex-col" style={{background:'linear-gradient(160deg, #0F172A 0%, #1E293B 100%)'}}>
      {/* Header */}
      <div className="px-6 py-5 text-center" style={{borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] mb-1" style={{color: result.isPreseason ? '#4ADBE8' : 'var(--A-accent)'}}>
          {result.label} · {career.currentDate ? formatDate(career.currentDate) : ''}
          {result.isPreseason && ' · Pre-Season'}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-center gap-6 mt-4">
          {/* Home */}
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-display text-2xl mb-2"
              style={{background:`linear-gradient(135deg,${homeClub?.colors?.[0]||'var(--A-accent)'},${homeClub?.colors?.[1]||'#D07A2A'})`,color:homeClub?.colors?.[2]||'#FFF'}}>
              {homeClub?.short}
            </div>
            <div className="text-white font-bold text-sm">{homeClub?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">HOME</div>
          </div>

          {/* Score */}
          <div className="text-center px-6">
            <div className="font-display text-6xl leading-none" style={{color: resultColor}}>
              {result.homeTotal} – {result.awayTotal}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{color: resultColor}}>{resultLabel}</div>
          </div>

          {/* Away */}
          <div className="text-center flex-1">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-display text-2xl mb-2"
              style={{background:`linear-gradient(135deg,${awayClub?.colors?.[0]||'#64748B'},${awayClub?.colors?.[1]||'#475569'})`,color:awayClub?.colors?.[2]||'#FFF'}}>
              {awayClub?.short}
            </div>
            <div className="text-white font-bold text-sm">{awayClub?.name}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest">AWAY</div>
          </div>
        </div>
      </div>

      {/* Momentum bar */}
      {(result.events && result.events.length > 0) && (
        <div className="px-6 py-3 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Momentum {visibleQuarter > 0 ? `· End of ${qLabels[visibleQuarter - 1]}` : ''}</div>
            <div className="text-[10px] text-slate-400">
              {momentumEnd > 0.15 ? `${(result.isHome ? club.short : result.opp?.short) || 'Home'} on top` : momentumEnd < -0.15 ? `${(result.isHome ? result.opp?.short : club.short) || 'Away'} on top` : 'Even contest'}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex" style={{background:'rgba(255,255,255,0.05)'}}>
            <div className="h-full" style={{width: `${momentumPct}%`, background: 'linear-gradient(90deg,#4ADBE8,#4AE89A)'}} />
            <div className="h-full" style={{width: `${100 - momentumPct}%`, background: 'linear-gradient(90deg,#E84A6F,#A78BFA)'}} />
          </div>
        </div>
      )}

      {/* Live event feed */}
      {(result.events && result.events.length > 0) && (
        <div className="px-6 max-w-2xl mx-auto w-full">
          <button onClick={() => setShowEvents(s => !s)} className="text-[10px] font-bold uppercase tracking-[0.2em] text-aaccent flex items-center gap-1 mb-2">
            {showEvents ? '▾' : '▸'} Broadcast Feed
            {result.events.filter(e => e.kind === 'moment').length > 0 && (
              <span className="text-[9px] text-slate-400 ml-2">{result.events.filter(e => e.kind === 'moment').length} key moments</span>
            )}
          </button>
          {showEvents && (
            <div className="rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1" style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)'}}>
              {eventFeed.length === 0 && <div className="text-xs text-slate-500 text-center py-3">Waiting for first quarter…</div>}
              {eventFeed.slice().reverse().map((ev, i) => {
                const player = ev.scorer ? playerLookup[ev.scorer] : ev.playerId ? playerLookup[ev.playerId] : null;
                const sideMine = (result.isHome ? 'home' : 'away') === ev.side;
                const color = ev.kind === 'goal' ? '#4AE89A' : ev.kind === 'behind' ? 'var(--A-accent)' : ev.kind === 'moment' ? '#A78BFA' : '#64748B';
                const icon = ev.kind === 'goal' ? '⚽' : ev.kind === 'behind' ? '○' : ev.kind === 'miss' ? '×' : '✦';
                let label = '';
                if (ev.kind === 'goal') label = 'GOAL';
                else if (ev.kind === 'behind') label = 'Behind';
                else if (ev.kind === 'miss') label = 'Out on the full / OOB';
                else if (ev.kind === 'moment') label = ev.text;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded" style={{background: i === 0 ? `${color}10` : 'transparent'}}>
                    <span className="text-[9px] font-mono text-slate-500 w-12 flex-shrink-0">Q{ev.q} {String(ev.minute % 25).padStart(2, '0')}{"'"}</span>
                    <span style={{color}} className="font-bold w-4">{icon}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold w-12 flex-shrink-0" style={{color: sideMine ? '#4AE89A' : '#E84A6F'}}>{sideMine ? club.short : (result.opp?.short || 'OPP')}</span>
                    <span className="text-slate-300 flex-1 truncate">{player ? `${player.firstName ? player.firstName[0] + '. ' : ''}${player.lastName || player.name || ''}: ` : ''}{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quarter breakdown */}
      <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Quarter by Quarter</div>
          {quarters.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-4">No quarter data available.</div>
          )}
          <div className="space-y-3">
            {quarters.map((q, i) => {
              const isShowing = i < revealed || revealed === quarters.length;
              const hCum = cumHome[i] || { g: 0, b: 0, total: 0 };
              const aCum = cumAway[i] || { g: 0, b: 0, total: 0 };
              const qWinner = hCum.total > aCum.total ? 'home' : aCum.total > hCum.total ? 'away' : 'draw';
              return (
                <div key={i} className={`rounded-2xl p-4 transition-all duration-300 ${isShowing ? 'opacity-100' : 'opacity-0 translate-y-2'}`}
                  style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{qLabels[i]}</div>
                    {isShowing && (
                      <div className="text-[10px] text-slate-500">
                        {q.homeGoals}.{q.homeBehinds} — {q.awayGoals}.{q.awayBehinds} (this qtr)
                      </div>
                    )}
                  </div>
                  {isShowing && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-right flex-1">
                        <span className="font-display text-3xl" style={{color: result.isHome ? myColor : oppColor}}>{hCum.total}</span>
                        <div className="text-[10px] text-slate-400">{hCum.g}.{hCum.b}</div>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{background: qWinner === (result.isHome ? 'home' : 'away') ? '#4AE89A22' : '#64748B22', color: qWinner === (result.isHome ? 'home' : 'away') ? '#4AE89A' : '#64748B'}}>
                        {qWinner === 'draw' ? '=' : qWinner === (result.isHome ? 'home' : 'away') ? '▲' : '▼'}
                      </div>
                      <div className="text-left flex-1">
                        <span className="font-display text-3xl" style={{color: result.isHome ? oppColor : myColor}}>{aCum.total}</span>
                        <div className="text-[10px] text-slate-400">{aCum.g}.{aCum.b}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Reveal controls */}
          {quarters.length > 0 && revealed < quarters.length && (
            <button onClick={() => setRevealed(r => Math.min(r + 1, quarters.length))}
              className="mt-4 w-full rounded-xl py-3 text-sm font-bold uppercase tracking-widest transition-all"
              style={{background:'rgba(232,154,74,0.15)', color:'var(--A-accent)', border:'1px solid rgba(232,154,74,0.3)'}}>
              Show {qLabels[revealed]} →
            </button>
          )}
        </div>

        {/* AFL Commentary */}
        {result.isAFL && commentary.length > 0 && revealed === quarters.length && (
          <div className="rounded-2xl p-4 mt-2" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Match Commentary</div>
            <div className="space-y-2">
              {commentary.map((line, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-aaccent flex-shrink-0">›</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-5" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {revealed < quarters.length && quarters.length > 0 ? (
            <button onClick={() => setRevealed(quarters.length)}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-400 uppercase tracking-widest"
              style={{border:'1px solid rgba(255,255,255,0.1)'}}>
              Skip to Full Time
            </button>
          ) : null}
          <button onClick={onContinue}
            className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-white transition-all`}
            style={{background:`linear-gradient(135deg,${resultColor}CC,${resultColor})`, boxShadow:`0 4px 20px ${resultColor}44`}}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}



