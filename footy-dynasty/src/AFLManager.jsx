import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import {
  Trophy, Users, DollarSign, Dumbbell, Building2, Handshake, Shirt,
  UserCog,   Repeat, Sprout, BarChart3, Calendar, ChevronRight, ChevronLeft,
  Home, Settings, Play, Pause, Save, ArrowUp, ArrowDown, ArrowRight,
  Star, Zap, Heart, Target, Activity, Flame, Sparkles, Crown,
  TrendingUp, TrendingDown, Plus, Minus, X, Check, Clock, MapPin,
  Newspaper, ShieldCheck, Gauge, Palette, Briefcase, GraduationCap,
  Map, Award, AlertCircle, ChevronsUp, FileText, RefreshCw, UserPlus,
  Landmark, GripVertical,
} from "lucide-react";
import { seedRng, rand, pick, rng, TIER_SCALE } from './lib/rng.js';
import { STATES, PYRAMID, LEAGUES_BY_STATE, ALL_CLUBS, findClub, findLeagueOf } from './data/pyramid.js';
import { pyramidNoteForLeague } from './data/pyramidMeta.js';
import { POSITIONS, POSITION_NAMES, FIRST_NAMES, LAST_NAMES, generatePlayer, generateSquad, playerHasPosition, formatPositionSlash, isForwardPreferred, isMidPreferred } from './lib/playerGen.js';
import { generateFixtures, blankLadder, sortedLadder, finalsLabel, pickPromotionLeague, pickRelegationLeague } from './lib/leagueEngine.js';
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits, generateTradePool } from './lib/defaults.js';
import { fmt, fmtK, clamp, avgFacilities, avgStaff } from './lib/format.js';
import { generateSeasonCalendar, TRAINING_INFO, formatDate } from './lib/calendar.js';
import { SAVE_VERSION, SLOT_IDS, readSlot, writeSlot, deleteSlot, readSlotMeta, getActiveSlot, setActiveSlot, migrateLegacy, migrate as migrateSave } from './lib/save.js';
import {
  playerBlockedFromTrade,
  TRADE_PERIOD_DAYS,
  POST_TRADE_DRAFT_COUNTDOWN_DAYS,
} from './lib/tradePeriod.js';
import { css, Bar, RatingDot, Pill, Stat, Jersey, GlobalStyle } from './components/primitives.jsx';
import TabNav from './components/TabNav.jsx';
import GameOverScreen from './screens/GameOverScreen.jsx';
import PostMatchSummary from './screens/PostMatchSummary.jsx';
import SackingSequence from './screens/SackingSequence.jsx';
import VoteOfConfidenceFlow from './screens/VoteOfConfidenceFlow.jsx';
import BoardMeetingScreen from './screens/BoardMeetingScreen.jsx';
import ArrivalBriefingFlow from './screens/ArrivalBriefingFlow.jsx';
import TutorialOverlay, {
  TUTORIAL_STEPS,
  tutorialAllowsNavigation,
  tutorialMidStepCompleted,
  tutorialHighlightScreen,
  tutorialHighlightTab,
  tutorialLocksAdvanceButton,
} from './components/TutorialOverlay.jsx';
import SeasonStrip from './components/SeasonStrip.jsx';
import MatchPreviewPanel from './components/MatchPreviewPanel.jsx';
import StitchClubDashboard from './components/stitch/StitchClubDashboard.jsx';

const ScheduleScreenLazy = lazy(() => import('./screens/ScheduleScreen.jsx'));

// --- Gameplay systems spec (Sections 1-3) ---
import { DIFFICULTY_IDS, DIFFICULTY_META, getDifficultyConfig, shouldShowTutorial } from './lib/difficulty.js';
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
import { applyRenewal, applyRenewalRejection, canAffordRenewal } from './lib/finance/contracts.js';
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
import { assignDefaultCaptains, defaultClubCulture, turningPointRibbon } from './lib/gameDepth.js';

/** Visual theme: aligns with `.dirA` / `.dirB` / `.dirS` in tokens.css (Stitch mockups → dirS). */
function themeWrapperClass(themeMode) {
  if (themeMode === 'B') return 'dirB';
  if (themeMode === 'S') return 'dirS';
  return 'dirA';
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-8">
          <div className="max-w-lg w-full rounded-2xl p-6" style={{background:'#1E293B', border:'1px solid #E84A6F44'}}>
            <div className="text-3xl mb-3">💥</div>
            <div className="font-display text-2xl text-[#E84A6F] mb-2">Something went wrong</div>
            <pre className="text-xs text-atext-mute bg-[#0F172A] rounded-lg p-3 overflow-auto max-h-48 mb-4">{this.state.error?.message}{'\n'}{this.state.error?.stack}</pre>
            <div className="flex gap-2">
              <button onClick={() => this.setState({ error: null })}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-aaccent text-white hover:bg-[#D07A2A]">
                Try again
              </button>
              <button onClick={() => { sessionStorage.removeItem('footy-dynasty-setup'); localStorage.removeItem('footy-dynasty-career'); this.setState({ error: null }); }}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-[#E84A6F] text-white hover:bg-[#F06070]">
                Start new game
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// MAIN APP
// ============================================================================
export default function AFLManager() {
  return <ErrorBoundary><AFLManagerInner /></ErrorBoundary>;
}

const SETUP_SS_KEY = 'footy-dynasty-setup';

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
    const newSquad = generateSquad(newClub.id, newLeague.tier).map(p => ({
      ...p,
      // Spec 3F: legacy follows you — premiership winners boost morale, relegation history sows doubt
      morale: clamp((p.morale ?? 70)
        + ((career.coachStats?.premierships || 0) > 0 ? 5 : 0)
        + ((career.coachStats?.relegations  || 0) > 0 && rng() < 0.05 ? -8 : 0),
        cfg.moraleFloor, 100),
      traits: rollPlayerTrait() ? [rollPlayerTrait()] : [],
    }));
    const newFixtures = generateFixtures(newLeague.clubs);
    const SEASON = career.season + 1;
    const eventQueue = generateSeasonCalendar(SEASON, newLeague.clubs, newFixtures, newClub.id);
    const interviewBump = offer.interviewStartingBoardBonus ?? 0;
    const startingBoard = clamp(
      ((career.coachReputation ?? 30) >= 60 ? 65 : 55) + interviewBump,
      38,
      78,
    );
    const newFinance = makeStartingFinance(newLeague.tier, career.difficulty, startingBoard);
    const newLadder = blankLadder(newLeague.clubs);
    const squadForCap = scaledSquadToFitCap({
      clubId: newClub.id,
      leagueKey: offer.leagueKey,
      difficulty: career.difficulty,
      finance: newFinance,
      squad: newSquad,
    });
    const newLineup = squadForCap.slice().sort((a,b)=>b.overall-a.overall).slice(0, 22).map(p => p.id);
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
      <div className={`${themeWrapperClass(career.themeMode)} font-sans min-h-screen`}>
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
      <div className={`${themeWrapperClass(career.themeMode)} font-sans min-h-screen`}>
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
      <div className={`${themeWrapperClass(career.themeMode)} font-sans min-h-screen`}>
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
      <div className={`${themeWrapperClass(career.themeMode)} font-sans min-h-screen`}>
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
      <div className={`${themeWrapperClass(career.themeMode)} font-sans min-h-screen`}>
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
      <div className={`${themeWrapperClass(career.themeMode)} font-sans min-h-screen`}>
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
      <div className={`${themeWrapperClass(career.themeMode)} font-sans min-h-screen`}>
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
    <div className={`${themeWrapperClass(career.themeMode)} min-h-screen font-sans text-atext flex w-full flex-col md:flex-row`}>
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
          {screen === "squad"    && <SquadScreen career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} tutorialActive={tutorialActive} />}
          {screen === "schedule" && (
            <Suspense fallback={<div className="anim-in py-16 text-center text-atext-dim font-mono text-sm">Loading calendar…</div>}>
              <ScheduleScreenLazy career={career} club={club} league={league} />
            </Suspense>
          )}
          {screen === "club"     && <ClubScreen career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} tutorialActive={tutorialActive} />}
          {screen === "recruit"  && <RecruitScreen career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} />}
          {screen === "compete"  && <CompetitionScreen career={career} club={club} league={league} tab={tab} setTab={setTab} />}
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
// CAREER SETUP SCREEN
// ============================================================================
function loadSetup() {
  try { return JSON.parse(sessionStorage.getItem(SETUP_SS_KEY) || '{}'); } catch { return {}; }
}
function saveSetup(patch) {
  try { sessionStorage.setItem(SETUP_SS_KEY, JSON.stringify({ ...loadSetup(), ...patch })); } catch {}
}

function CareerSetup({ onStart, existingSlots = {}, onResume }) {
  const saved = loadSetup();
  const [step, _setStep] = useState(saved.step ?? 0);
  const [state, _setSelState] = useState(saved.state ?? null);
  const [tier, _setTier] = useState(saved.tier ?? null);
  const [leagueKey, _setLeagueKey] = useState(saved.leagueKey ?? null);
  const [clubId, _setClubId] = useState(saved.clubId ?? null);
  const [managerName, setManagerName] = useState(saved.managerName ?? "");
  const [difficulty, _setDifficulty] = useState(saved.difficulty ?? 'contender');
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState(null);
  const slotsWithSaves = SLOT_IDS.filter(s => existingSlots && existingSlots[s]);

  const setStep       = (v) => { saveSetup({ step: v });       _setStep(v); };
  const setSelState   = (v) => { saveSetup({ state: v });      _setSelState(v); };
  const setTier       = (v) => { saveSetup({ tier: v });       _setTier(v); };
  const setLeagueKey  = (v) => { saveSetup({ leagueKey: v });  _setLeagueKey(v); };
  const setClubId     = (v) => { saveSetup({ clubId: v });     _setClubId(v); };
  const setDifficulty = (v) => { saveSetup({ difficulty: v }); _setDifficulty(v); };

  const availableLeagues = state ? LEAGUES_BY_STATE(state).filter(l => tier ? l.tier === tier : true) : [];
  const availableClubs = leagueKey ? PYRAMID[leagueKey].clubs : [];
  const tiersForState = state ? [1, 2, 3].filter(t => LEAGUES_BY_STATE(state).some(l => l.tier === t)) : [1, 2, 3];

  function start(e) {
    if (e) e.preventDefault();
    if (!clubId || !leagueKey || loading) return;
    setStartError(null);
    setLoading(true);
    try {
    const club = findClub(clubId);
    const league = PYRAMID[leagueKey];
    if (!club) throw new Error(`Club not found: ${clubId}`);
    if (!league) throw new Error(`League not found: ${leagueKey}`);
    const SEASON = 2026;
    seedRng(clubId.split("").reduce((a,c)=>a + c.charCodeAt(0), 7) + 1);
    const cfg = getDifficultyConfig(difficulty);
    const tunedFinance = makeStartingFinance(league.tier, difficulty, 55);
    const ladder0 = blankLadder(league.clubs);
    const squadRaw = generateSquad(clubId, league.tier).map(p => ({ ...p, traits: rollPlayerTrait() ? [rollPlayerTrait()] : [] }));
    const squad = scaledSquadToFitCap({
      clubId,
      leagueKey,
      difficulty,
      finance: tunedFinance,
      squad: squadRaw,
    });
    const lineup = squad.slice().sort((a,b)=>b.overall-a.overall).slice(0, 22).map(p=>p.id);
    const fixtures = generateFixtures(league.clubs);
    const eventQueue = generateSeasonCalendar(SEASON, league.clubs, fixtures, clubId);
    const facilities = DEFAULT_FACILITIES();
    const clubGround = getClubGround(club, facilities.stadium.level, league.tier);
    const isFirstCareer = !existingSlots || Object.keys(existingSlots).length === 0;
    const startOffers = buildInitialSponsorOffers({
      leagueTier: league.tier,
      difficulty,
      clubId,
      ladder: ladder0,
      coachReputation: 30,
    });
    const newCareer = {
      managerName: managerName || "Coach",
      clubId,
      leagueKey,
      season: SEASON,
      week: 0,
      currentDate: `${SEASON - 1}-12-01`,
      phase: 'preseason',
      eventQueue,
      lastEvent: null,
      inMatchDay: false,
      currentMatchResult: null,
      squad,
      lineup,
      training: DEFAULT_TRAINING(),
      facilities,
      finance: tunedFinance,
      sponsors: [],
      staff: generateStaff(league.tier),
      kits: defaultKits(club.colors),
      ladder: ladder0,
      fixtures,
      tradePool: (() => { seedRng(7777); return Array.from({ length: 25 }, (_, i) => { const p = generatePlayer(rand(1,3), 5000+i); return { ...p, fromClub: pick(ALL_CLUBS).short }; }); })(),
      draftPool: Array.from({ length: 60 }, (_, i) => generatePlayer(2, 9000 + i)),
      youth: { recruits: [], zone: club.state, programLevel: 1, scoutFocus: "All-rounders" },
      news: [
        { week: 0, type: "draw", text: `${managerName || "Coach"} appointed at ${club.name}. Pre-season begins Dec 1.` },
        { week: 0, type: "info", text: "🤝 No sponsors locked in yet — visit Club → Sponsors to choose from incoming offers." },
      ],
      weeklyHistory: [],
      inFinals: false,
      finalsRound: 0,
      finalsFixtures: [],
      finalsResults: [],
      premiership: null,
      tacticChoice: "balanced",
      seasonHistory: [],
      // v2 additions
      saveVersion: SAVE_VERSION,
      aiSquads: {},
      draftOrder: [],
      history: [],
      brownlow: {},
      boardWarning: 0,
      gameOver: null,
      themeMode: 'A',
      options: { autosave: true },
      pendingTradeOffers: [],
      retiredThisSeason: [],
      // v3 additions — Gameplay Systems Spec
      difficulty,
      tutorialStep: isFirstCareer && cfg.tutorialPolicy !== 'never' ? 0 : 6,
      tutorialComplete: !(isFirstCareer && cfg.tutorialPolicy !== 'never'),
      isFirstCareer,
      committee: generateCommittee(league.tier),
      footyTripAvailable: false,
      footyTripUsed: false,
      groundCondition: 85,
      clubGround,
      groundName: clubGround.shortName,
      weeklyWeather: {},
      winStreak: 0,
      homeWinStreak: 0,
      coachReputation: 30,
      coachTier: 'Journeyman',
      coachStats: {
        totalWins: 0, totalLosses: 0, totalDraws: 0,
        premierships: 0, promotions: 0, relegations: 0,
        clubsManaged: 1, seasonsManaged: 1,
      },
      previousClubs: [],
      isSacked: false,
      jobMarketOpen: false,
      sackingStep: null,
      jobOffers: [],
      boardVotePrepBonus: 0,
      jobMarketRerolls: 0,
      arrivalBriefing: null,
      journalist: generateJournalist(),
      lastBoardConfidenceDelta: 0,
      lastMatchSummary: null,
      // v4 additions — Finance system rebuild
      lastFinanceTickWeek:        null,
      lastFinanceTickDay:         null,
      cashCrisisStartWeek:        null,
      cashCrisisLevel:            0,
      bankLoan:                   null,
      sponsorRenewalProposals:    [],
      sponsorOffers:              startOffers,
      expiredSponsorsLastSeason:  [],
      pendingRenewals:            [],
      renewalsClosed:             false,
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
      clubCulture:                defaultClubCulture(),
      headToHead:                 {},
      captainId:                  null,
      viceCaptainId:              null,
      captainHistory:             [],
      bogeyTeamId:                null,
      dominatedTeamId:            null,
      crucialFive:                [],
      crisisFiredThisSeason:      false,
      teamStats:                  null,
    };
    assignDefaultCaptains(newCareer);
    ensureCareerBoard(newCareer, club, league);
    generateSeasonObjectives(newCareer, league);
    planSeasonBoardMeetings(newCareer);
    primeSeasonStoryState(newCareer);
    onStart(newCareer);
    } catch (err) {
      setStartError(err.message);
      console.error('[start] career init error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dirA min-h-screen font-sans text-atext flex flex-col">
      <style>{`
        body, html { background:var(--A-bg); margin:0; color:var(--A-text); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease-out; }
      `}</style>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-aline" style={{ background: "radial-gradient(circle at 30% 20%, rgba(0, 224, 255, 0.10) 0%, transparent 65%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, var(--A-accent) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="max-w-5xl mx-auto px-8 py-12 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:"linear-gradient(135deg, var(--A-accent), #0098b0)"}}><Trophy className="w-6 h-6 text-[#001520]" /></div>
            <span className="text-[12px] uppercase tracking-[0.3em] text-aaccent font-mono font-bold">Manager 2026</span>
          </div>
          <h1 className="font-display text-7xl tracking-wider leading-none">FOOTY <span className="text-aaccent">DYNASTY</span></h1>
          <p className="text-atext-dim mt-3 text-lg max-w-2xl">Take a community side from the suburban grounds to the MCG. Real Australian rules football management — 7 states, full pyramid, every system you'd expect.</p>
        </div>
      </div>
      {/* Stepper */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 py-8">
        <div className="flex items-center gap-2 mb-8">
          {["State", "Tier", "League", "Club", "You"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition ${step === i ? "bg-aaccent text-[#001520]" : i < step ? "bg-aaccent/15 text-aaccent border border-aaccent/40" : "bg-apanel text-atext-mute border border-aline"}`}>{i+1}</div>
              <span className={`text-sm font-semibold ${step === i ? "text-atext" : "text-atext-mute"}`}>{s}</span>
              {i < 4 && <ChevronRight className="w-4 h-4 text-atext-mute mx-1" />}
            </div>
          ))}
        </div>

        {step === 0 && slotsWithSaves.length > 0 && (
          <div className="fade-up mb-8">
            <h2 className={`${css.h1} text-3xl mb-3`}>RESUME A CAREER</h2>
            <p className="text-atext-dim mb-4 text-sm">Pick up where you left off, or scroll down to start a fresh career in another save slot.</p>
            <div className="grid md:grid-cols-3 gap-3">
              {slotsWithSaves.map(slot => {
                const meta = existingSlots[slot];
                const c = findClub(meta.clubId);
                return (
                  <button key={slot} onClick={() => onResume && onResume(slot)} className={`${css.panelHover} p-4 text-left`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-aaccent">SLOT {slot}</span>
                      <span className="text-[10px] text-atext-mute">·</span>
                      <span className="text-[10px] text-atext-mute">Season {meta.season}{meta.week ? ` · R${meta.week}` : ''}</span>
                    </div>
                    <div className="font-bold text-atext truncate">{meta.managerName || 'Coach'}</div>
                    <div className="text-xs text-atext-dim truncate">{c?.name || meta.clubId}</div>
                    {meta.premiership && <div className="text-[10px] text-aaccent mt-2 font-mono">🏆 {meta.premiership}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {step === 0 && (
          <div className="fade-up">
            <h2 className={`${css.h1} text-4xl mb-4`}>{slotsWithSaves.length > 0 ? 'OR START A NEW CAREER' : 'PICK A STATE'}</h2>
            <p className="text-atext-dim mb-8">Where will your story begin? Each state has its own football culture and pyramid.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STATES.map(s => {
                const flag = { VIC: "🏉", SA: "🦘", WA: "🌅", TAS: "🍎", NT: "🐊", QLD: "🌴", NSW: "🌉", ACT: "🏛️" };
                const desc = { VIC: "The heartland. Most clubs.", SA: "SANFL country.", WA: "WAFL & two AFL sides.", TAS: "Tassie Devils incoming.", NT: "Top End footy.", QLD: "Sun, Suns, Lions.", NSW: "Swans & Giants country.", ACT: "Capital territory footy." };
                return (
                  <button key={s} onClick={()=>{setSelState(s); setStep(1);}} className={`${css.panelHover} p-6 text-left group`}>
                    <div className="text-4xl mb-2">{flag[s]}</div>
                    <div className={`${css.h1} text-3xl`}>{s}</div>
                    <div className="text-[12px] text-atext-dim mt-1">{desc[s]}</div>
                    <div className="text-[10px] text-aaccent mt-3 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition">Choose →</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-up">
            <button onClick={()=>setStep(0)} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>CHOOSE YOUR DIFFICULTY</h2>
            <p className="text-atext-dim mb-8">Start at the top, the middle, or the bottom of the pyramid. Showing tiers available in <strong>{state}</strong>.</p>
            <div className={`grid gap-4 ${tiersForState.length === 1 ? 'md:grid-cols-1 max-w-sm' : tiersForState.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
              {tiersForState.includes(3) && (
                <button onClick={()=>{setTier(3); setLeagueKey(null); setClubId(null); setStep(2);}} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="#4ADBE8">Underdog</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 3</div>
                  <div className="text-sm text-atext font-semibold mt-1">Community / Local</div>
                  <div className="text-[12px] text-atext-dim mt-3">Suburban grounds. Tiny budgets. Long road. Most rewarding climb.</div>
                  <div className="text-[#4ADBE8] text-xs mt-4 font-bold uppercase tracking-widest">3 Promotions to AFL</div>
                </button>
              )}
              {tiersForState.includes(2) && (
                <button onClick={()=>{setTier(2); setLeagueKey(null); setClubId(null); setStep(2);}} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="var(--A-accent)">Established</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 2</div>
                  <div className="text-sm text-atext font-semibold mt-1">State League</div>
                  <div className="text-[12px] text-atext-dim mt-3">VFL, SANFL, WAFL etc. Real budgets. One step from the big show.</div>
                  <div className="text-aaccent text-xs mt-4 font-bold uppercase tracking-widest">1 Promotion to AFL</div>
                </button>
              )}
              {tiersForState.includes(1) && (
                <button onClick={()=>{setTier(1); setLeagueKey(null); setClubId(null); setStep(2);}} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="#E84A6F">Big Time</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 1</div>
                  <div className="text-sm text-atext font-semibold mt-1">AFL</div>
                  <div className="text-[12px] text-atext-dim mt-3">Premiership pressure. Salary caps. Trade weeks. Every game on TV.</div>
                  <div className="text-[#E84A6F] text-xs mt-4 font-bold uppercase tracking-widest">Win the Cup</div>
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-up">
            <button onClick={()=>setStep(1)} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>PICK A LEAGUE</h2>
            <p className="text-atext-dim mb-8">{state} • Tier {tier}</p>
            {availableLeagues.length === 0 ? (
              <div className={`${css.panel} p-8 text-center text-atext-dim`}>No leagues at this tier in {state}. <button className="text-aaccent underline" onClick={()=>setStep(1)}>Pick a different tier</button>.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableLeagues.map(l => (
                  <button key={l.key} onClick={()=>{setLeagueKey(l.key); setClubId(null); setStep(3);}} className={`${css.panelHover} p-5 text-left flex items-center justify-between`}>
                    <div>
                      <div className="text-xs text-atext-dim uppercase tracking-widest">Tier {l.tier}</div>
                      <div className={`${css.h1} text-2xl mt-1`}>{l.short}</div>
                      <div className="text-sm text-atext">{l.name}</div>
                      <div className="text-[12px] text-atext-dim mt-1">{l.clubs.length} clubs</div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-aaccent" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="fade-up">
            <button onClick={()=>setStep(2)} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>CHOOSE YOUR CLUB</h2>
            <p className="text-atext-dim mb-8">{PYRAMID[leagueKey].name}</p>
            <div className="grid md:grid-cols-3 gap-4">
              {availableClubs.map(c => (
                <button key={c.id} onClick={()=>{setClubId(c.id); setStep(4);}} className={`${css.panelHover} p-5 text-left`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center font-display text-xl" style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})`, color: c.colors[2] }}>{c.short}</div>
                    <div>
                      <div className="font-bold text-atext">{c.name}</div>
                      <div className="text-[11px] text-atext-dim">{c.state}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && clubId && leagueKey && findClub(clubId) && (
          <div className="fade-up max-w-3xl">
            <button type="button" onClick={()=>{ setClubId(null); setStep(3); }} disabled={loading} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>YOUR DETAILS</h2>

            <div className={`${css.panel} p-6 mb-4`}>
              {(() => { const c = findClub(clubId); return (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center font-display text-2xl" style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})`, color: c.colors[2] }}>{c.short}</div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-atext-dim">Appointed at</div>
                  <div className="font-bold text-xl">{c.name}</div>
                  <div className="text-[12px] text-atext-dim">{PYRAMID[leagueKey].name}</div>
                </div>
              </div>
              ); })()}
              <label className={css.label}>Manager Name</label>
              <input
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') start(e); }}
                placeholder="Bluey McGee"
                className="w-full mt-2 bg-apanel border border-aline focus:border-aaccent outline-none rounded-lg px-4 py-3 text-atext"
                disabled={loading}
              />
            </div>

            {/* Difficulty selector — Spec Section 2.6 */}
            <div className={`${css.panel} p-6 mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`${css.h1} text-2xl`}>DIFFICULTY</h3>
                <span className="text-[10px] text-atext-mute uppercase tracking-widest font-mono">Can change in Settings later</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {DIFFICULTY_IDS.map(id => {
                  const meta = DIFFICULTY_META[id];
                  const active = difficulty === id;
                  return (
                    <button key={id} type="button" onClick={() => setDifficulty(id)} disabled={loading}
                      className={`text-left p-4 rounded-xl border transition-all ${active ? 'ring-2' : 'hover:border-aaccent/40'}`}
                      style={{
                        background: active ? `${meta.color}15` : 'var(--A-panel-2)',
                        borderColor: active ? meta.color : 'var(--A-line)',
                        ringColor: meta.color,
                      }}>
                      <div className="font-display text-2xl mb-1" style={{ color: meta.color }}>{meta.label.toUpperCase()}</div>
                      <div className="text-[10px] uppercase tracking-widest text-atext-mute mb-2 font-mono">{meta.audience}</div>
                      <div className="text-xs text-atext-dim mb-3 leading-snug">{meta.summary}</div>
                      <ul className="space-y-1">
                        {meta.bullets.map((b, i) => (
                          <li key={i} className="text-[11px] text-atext flex gap-1.5"><span style={{ color: meta.color }}>•</span><span>{b}</span></li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {startError && (
              <div className="mb-3 p-3 rounded-xl text-sm text-aneg bg-aneg/10 border border-aneg/30">
                ⚠️ {startError}
              </div>
            )}
            <button type="button" onClick={start} disabled={loading} className={`${css.btnPrimary} w-full text-lg py-4 ${loading ? 'opacity-70' : 'glow'}`}>
              {loading ? '⏳ Starting career…' : 'START CAREER →'}
            </button>
          </div>
        )}
      </div>
      <div className="border-t border-aline p-4 text-center text-[10px] text-atext-mute uppercase tracking-widest font-mono">A Football Manager-style game for Australian rules</div>
    </div>
  );
}


// ============================================================================
// SIDEBAR + TOPBAR
// ============================================================================
function Sidebar({ screen, onNavigate, club, league, career, myLadderPos, onNewGame, onSaveNow, activeSlot, slotMeta, slotMetaTick, onTogglePicker, showSlotPicker, onSwitchSlot, onDeleteSlot }) {
  const season = career.season;
  const week   = career.week;
  const phase  = career.phase || 'preseason';
  const tutorialOn = career && !career.tutorialComplete;
  const tutStep = career?.tutorialStep ?? 0;
  const highlightNav = tutorialOn ? tutorialHighlightScreen(tutStep) : null;
  const items = [
    { key: "hub",      label: "Hub",        icon: Home,      desc: "Overview" },
    { key: "squad",    label: "Squad",       icon: Users,     desc: "Players & Tactics" },
    { key: "schedule", label: "Schedule",    icon: Calendar,  desc: "Calendar & Fixtures" },
    { key: "club",     label: "Club",        icon: Building2, desc: "Finances & Ops" },
    { key: "recruit",  label: "Recruit",     icon: Repeat,    desc: "Trade & Draft" },
    { key: "compete",  label: "Competition", icon: Trophy,    desc: "Ladder & Fixtures" },
  ];
  return (
    <aside className="w-full md:w-64 md:flex flex-col md:sticky md:top-0 md:h-screen shrink-0 bg-apanel border-b md:border-b-0 md:border-r border-aline">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-aline hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background:"linear-gradient(135deg, var(--A-accent), #0098b0)", boxShadow:"0 4px 12px rgba(0,224,255,0.25)"}}>
            <Trophy className="w-5 h-5 text-[#001520]" />
          </div>
          <div>
            <div className="font-display text-[26px] tracking-[0.1em] leading-none text-atext">DYNASTY</div>
            <div className="text-[9px] text-atext-mute uppercase tracking-[0.25em] mt-0.5">Footy Manager</div>
          </div>
        </div>
      </div>

      {/* Club identity card */}
      <div className="px-4 py-3 border-b border-aline hidden md:block">
        <div className="panel rounded-xl overflow-hidden">
          <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg, ${club.colors[0]}, ${club.colors[1]})`}} />
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display text-xl flex-shrink-0"
                style={{background:`linear-gradient(135deg,${club.colors[0]},${club.colors[1]})`, color:club.colors[2], boxShadow:`0 4px 12px ${club.colors[0]}44`}}>
                {club.short}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate text-atext leading-tight">{club.name}</div>
                <div className={`text-[10px] mt-0.5 font-mono ${club.colors[0] === '#FFFFFF' ? 'text-aaccent' : ''}`} style={club.colors[0] === '#FFFFFF' ? undefined : { color: club.colors[0] }}>{league.short}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[["SEASON", season], [phase === 'preseason' ? "PHASE" : "ROUND", phase === 'preseason' ? "PRE" : week], ["POS", myLadderPos||"—"]].map(([l,v])=>(
                <div key={l} className="rounded-lg py-1.5 bg-apanel/60 border border-aline/80">
                  <div className="text-[8px] text-atext-mute uppercase tracking-widest font-bold font-mono">{l}</div>
                  <div className="font-display text-xl text-aaccent leading-tight">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-2 md:p-3 flex md:flex-col gap-1 md:gap-0.5 md:flex-1 overflow-x-auto md:overflow-y-auto md:overflow-x-visible">
        {items.map(it => {
          const Icon = it.icon;
          const active = screen === it.key;
          const navLocked = tutorialOn && !tutorialAllowsNavigation(tutStep, it.key);
          const spotlight = tutorialOn && highlightNav === it.key;
          return (
            <button key={it.key} type="button" disabled={navLocked} onClick={() => { if (!navLocked) onNavigate(it.key); }}
              title={navLocked ? 'Complete the current tutorial step or skip the tutorial.' : undefined}
              className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-3 rounded-xl transition-all group border whitespace-nowrap md:w-full ${spotlight ? "ring-2 ring-[var(--A-accent)] ring-offset-2 ring-offset-apanel animate-pulse" : ""} ${navLocked ? "opacity-35 cursor-not-allowed border-transparent" : ""} ${active ? "bg-aaccent/10 border-aaccent/40 text-aaccent" : !navLocked ? "border-transparent text-atext-dim hover:bg-aaccent/5 hover:text-atext" : "border-transparent text-atext-mute"}`}>
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${active ? "bg-aaccent/15 text-aaccent" : "text-atext-mute"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 hidden sm:block">
                <div className={`text-sm font-bold leading-tight ${active ? "text-aaccent" : "text-atext-dim group-hover:text-atext"}`}>{it.label}</div>
                <div className={`text-[9px] truncate hidden md:block ${active ? "text-aaccent/80" : "text-atext-mute"}`}>{it.desc}</div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-aaccent hidden md:inline" />}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-3 space-y-2 border-t border-aline hidden md:block">
        {/* Save status */}
        {onSaveNow && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button onClick={onSaveNow} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-apanel-2 hover:bg-aaccent/10 hover:text-aaccent transition text-[10px] font-bold uppercase tracking-widest font-mono text-atext-dim">
                <Save className="w-3.5 h-3.5" /> Save{activeSlot ? ` Slot ${activeSlot}` : ''}
              </button>
              <button onClick={onTogglePicker} className="px-2 py-2 rounded-lg bg-apanel-2 hover:bg-aaccent/10 hover:text-aaccent transition text-[10px] font-bold uppercase font-mono text-atext-dim">
                <ChevronsUp className="w-3.5 h-3.5" />
              </button>
            </div>
            {showSlotPicker && SLOT_IDS && (
              <div className="rounded-lg overflow-hidden text-[10px]" style={{background:'var(--A-panel-2)', border:'1px solid var(--A-line)'}} key={slotMetaTick}>
                {SLOT_IDS.map(s => {
                  const meta = slotMeta?.[s];
                  const isActive = s === activeSlot;
                  return (
                    <div key={s} className={`flex items-center gap-2 px-2.5 py-1.5 ${isActive ? 'bg-aaccent/10' : ''}`} style={{borderBottom:'1px solid var(--A-line)'}}>
                      <span className={`font-mono font-bold ${isActive ? 'text-aaccent' : 'text-atext-dim'}`}>{s}</span>
                      {meta ? (
                        <>
                          <span className="flex-1 text-atext-dim truncate">S{meta.season}{meta.week ? ` R${meta.week}` : ''} · {findClub(meta.clubId)?.short || meta.clubId}</span>
                          {!isActive && (
                            <button onClick={() => onSwitchSlot && onSwitchSlot(s)} className="text-aaccent hover:text-[#4ADBE8] font-bold">Load</button>
                          )}
                          <button onClick={() => onDeleteSlot && onDeleteSlot(s)} className="text-atext-mute hover:text-aneg">×</button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-atext-mute italic">empty</span>
                          {career && !isActive && (
                            <button onClick={() => onSwitchSlot && onSwitchSlot(s)} className="text-aaccent hover:text-[#4ADBE8] font-bold">Use</button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <button onClick={onNewGame} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-atext-mute hover:text-aneg hover:bg-aneg/10 transition text-xs font-bold uppercase tracking-widest font-mono">
          <RefreshCw className="w-3.5 h-3.5" /> New Career
        </button>
        <div className="text-[9px] text-atext-mute text-center uppercase tracking-widest font-mono">Footy Dynasty v2.0</div>
      </div>
    </aside>
  );
}

function TopBar({ career, club, league, myLadderPos, onAdvance, advanceDisabled, tutorialSpotlightAdvance }) {
  const ctx = getAdvanceContext(career, league);
  const nextEv = (career.eventQueue || []).find(e => !e.completed);
  const phaseColors = { preseason: 'var(--A-accent)', season: 'var(--A-accent-2)', finals: 'var(--A-neg)', offseason: '#A78BFA' };
  const phaseLabel  = { preseason: 'Pre-Season', season: 'Season', finals: 'Finals', offseason: 'Off-Season' };
  const phase = career.phase || 'preseason';

  let nextLabel = 'End of Season';
  let nextIcon  = null;
  if (career.inFinals) {
    nextLabel = 'Finals Match';
    nextIcon  = '🏆';
  } else if (nextEv) {
    if (nextEv.type === 'training') {
      const info = TRAINING_INFO[nextEv.subtype] || {};
      nextLabel = info.name || 'Training';
      nextIcon  = info.icon || '🏋️';
    } else if (nextEv.type === 'key_event') {
      nextLabel = nextEv.name;
      nextIcon  = '📅';
    } else if (nextEv.type === 'preseason_match') {
      nextLabel = nextEv.label;
      nextIcon  = '⚽';
    } else if (nextEv.type === 'round') {
      const myMatch = (nextEv.matches || []).find(m => m.home === career.clubId || m.away === career.clubId);
      if (myMatch) {
        const isHome = myMatch.home === career.clubId;
        const opp = findClub(isHome ? myMatch.away : myMatch.home);
        nextLabel = `Rd ${nextEv.round}: ${isHome ? 'vs' : '@'} ${opp?.short || ''}`;
        nextIcon  = '🏉';
      } else {
        nextLabel = `Round ${nextEv.round}`;
        nextIcon  = '🏉';
      }
    }
  }

  const showRichNext = ctx.mode === 'calendar' && nextEv;
  const headerNextLabel = showRichNext ? `${nextIcon ? nextIcon + ' ' : ''}${nextLabel}` : `${ctx.nextEventShort}${ctx.mode === 'finals' ? ' 🏆' : ''}`;

  return (
    <header className="sticky top-0 z-20 bg-apanel/90 backdrop-blur-md border-b border-aline shadow-[0_1px_0_rgba(0,224,255,0.06)]">
      <div className="px-3 md:px-6 py-0">
      <div className="flex items-center justify-between gap-2 max-w-[1400px] mx-auto h-16">
        {/* Left: date + phase + finance stats */}
        <div className="flex items-center gap-0 min-w-0 overflow-hidden">
          {/* Date + phase */}
          <div className="pr-3 mr-2 md:pr-4 md:mr-2 border-r border-aline flex-shrink-0">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest" style={{color: phaseColors[phase]}}>{phaseLabel[phase]}</div>
            <div className="font-display text-base md:text-lg leading-tight text-atext">{career.currentDate ? formatDate(career.currentDate) : '—'}</div>
          </div>
          {[
            { label: "Cash",     value: fmtK(career.finance.cash),           color: "var(--A-pos)",       hideBelow: 'sm' },
            { label: "Transfer", value: fmtK(career.finance.transferBudget), color: "var(--A-accent)",    hideBelow: 'lg' },
            { label: "Board",    value: career.finance.boardConfidence,       color: "var(--A-accent-2)", bar: true, hideBelow: 'md' },
            { label: "Fans",     value: career.finance.fanHappiness,          color: "#A78BFA",           bar: true, hideBelow: 'lg' },
          ].map(({ label, value, color, bar, hideBelow }) => {
            const cls = hideBelow === 'lg' ? 'hidden lg:flex' : hideBelow === 'md' ? 'hidden md:flex' : hideBelow === 'sm' ? 'hidden sm:flex' : 'flex';
            return (
              <div key={label} className={`${cls} items-center px-3 md:px-4 h-full border-r border-aline last:border-r-0 flex-shrink-0`}>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-atext-mute">{label}</div>
                  {bar ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-12 lg:w-16 h-1.5 rounded-full overflow-hidden bg-apanel border border-aline">
                        <div className="h-full rounded-full" style={{width:`${value}%`, background:`linear-gradient(90deg,${color}88,${color})`}} />
                      </div>
                      <span className="font-display text-lg leading-none" style={{color}}>{value}</span>
                    </div>
                  ) : (
                    <div className="font-display text-lg md:text-xl leading-tight" style={{color}}>{value}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: next event + advance button */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="text-right hidden lg:block max-w-[min(280px,40vw)]">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-atext-mute">Next</div>
            <div className="text-sm font-semibold text-atext truncate" title={ctx.detail}>{headerNextLabel}</div>
          </div>
          <button
            type="button"
            onClick={onAdvance}
            disabled={advanceDisabled}
            title={advanceDisabled ? "Finish the tutorial step in the card (or skip) before advancing time." : undefined}
            className={`${css.btnPrimary} flex items-center gap-1.5 md:gap-2 glow text-[11px] md:text-xs px-3 md:px-5 ${tutorialSpotlightAdvance ? "ring-2 ring-[var(--A-accent)] ring-offset-2 ring-offset-apanel animate-pulse" : ""} ${advanceDisabled ? "opacity-45 cursor-not-allowed" : ""}`}
          >
            <Play className="w-4 h-4" /> {ctx.buttonLabel.toUpperCase()}
          </button>
        </div>
      </div>
      </div>
      <SeasonStrip career={career} league={league} club={club} />
    </header>
  );
}

// ============================================================================
// HUB SCREEN
// ============================================================================
// ---------------------------------------------------------------------------
// Hub strip showing ground conditions + footy trip prompt + committee mood.
// Spec Sections 3A, 3B, 3D.
// ---------------------------------------------------------------------------
function HubGroundStrip({ career, club, league, setScreen }) {
  const cfg = getDifficultyConfig(career.difficulty);
  const showCommunity = league.tier <= 3 && Array.isArray(career.committee) && career.committee.length > 0;
  const band = groundConditionBand(career.groundCondition ?? 85);
  const stadiumLevel = career.facilities?.stadium ?? 1;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {/* Ground conditions */}
      <div className={`${css.panel} p-4`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className={css.label}>Home Ground</div>
            <div className="font-bold text-sm text-atext leading-tight">{career.groundName || `${club.short} Oval`}</div>
          </div>
          <Pill color={band.color}>{band.label}</Pill>
        </div>
        <div className="text-[11px] text-atext-dim mb-2 leading-snug">{stadiumDescription(stadiumLevel)}</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
            <div className="h-full rounded-full" style={{ width: `${career.groundCondition ?? 85}%`, background: `linear-gradient(90deg, ${band.color}88, ${band.color})` }} />
          </div>
          <span className="font-display text-lg w-10 text-right" style={{ color: band.color }}>{career.groundCondition ?? 85}</span>
        </div>
        <div className="text-[10px] text-atext-mute mt-1.5 italic">{band.desc}</div>
      </div>

      {/* Footy trip prompt or committee summary */}
      <div className={`${css.panel} p-4`}>
        {career.footyTripAvailable && !career.footyTripUsed ? (
          <FootyTripPromoCard career={career} setScreen={setScreen} />
        ) : showCommunity ? (
          <CommitteeMiniSummary career={career} setScreen={setScreen} />
        ) : (
          <DifficultyMiniSummary career={career} cfg={cfg} />
        )}
      </div>
    </div>
  );
}

function FootyTripPromoCard({ career, setScreen }) {
  const social = (career.committee || []).find(m => m.role === 'Social Coordinator');
  return (
    <div>
      <div className={css.label}>Footy Trip</div>
      <div className="font-bold text-sm text-atext leading-tight mb-1">{social ? social.name : 'The Social Coordinator'} has a proposal</div>
      <div className="text-[11px] text-atext-dim mb-3 leading-snug">An annual footy trip is on the table. Approve a destination in the Club tab.</div>
      <button onClick={() => setScreen('club')} className={`${css.btnPrimary} text-[10px] py-2 px-3`}>OPEN CLUB →</button>
    </div>
  );
}

function CommitteeMiniSummary({ career, setScreen }) {
  const avg = committeeMoodAverage(career.committee);
  const accent = avg >= 70 ? '#4AE89A' : avg >= 40 ? 'var(--A-accent-2)' : '#E84A6F';
  return (
    <div>
      <div className={css.label}>Committee Mood</div>
      <div className="font-display text-3xl" style={{ color: accent }}>{avg}</div>
      <div className="text-[11px] text-atext-dim mb-2">{
        avg >= 70 ? 'The volunteers are happy. Things are humming.'
        : avg >= 40 ? 'The committee is supportive but watching closely.'
        : 'Committee tensions are surfacing — keep an eye on them.'
      }</div>
      <button onClick={() => setScreen('club')} className={`${css.btnGhost} text-[10px] py-1.5 px-2.5`}>VIEW COMMITTEE →</button>
    </div>
  );
}

function DifficultyMiniSummary({ career, cfg }) {
  const meta = DIFFICULTY_META[career.difficulty] || DIFFICULTY_META.contender;
  return (
    <div>
      <div className={css.label}>Difficulty</div>
      <div className="font-display text-2xl" style={{ color: meta.color }}>{meta.label.toUpperCase()}</div>
      <div className="text-[11px] text-atext-dim mb-2 leading-snug">{meta.summary}</div>
      <div className="text-[10px] text-atext-mute">{cfg.boardPatienceSeasons} season{cfg.boardPatienceSeasons === 1 ? '' : 's'} of board patience · {cfg.injuryMultiplier}× injuries</div>
    </div>
  );
}

function HubScreen({ career, club, league, myLadderPos, setScreen, setTab, onAdvance }) {
  const stitch = (career.themeMode || 'A') === 'S';
  const advanceCtx = getAdvanceContext(career, league);
  const sorted = sortedLadder(career.ladder);
  const top5 = sorted.slice(0, 5);
  const myRow = sorted.find(r => r.id === career.clubId);
  const recentNews = (career.news || []).slice(0, 6);
  const wagesAnnual = career.squad.reduce((a, p) => a + p.wage, 0) + career.staff.reduce((a, s) => a + s.wage, 0);
  const sponsorsAnnual = (career.sponsors || []).reduce((a, s) => a + s.annualValue, 0);
  const squadAvg = career.squad.length ? Math.round(career.squad.reduce((a, p) => a + p.overall, 0) / career.squad.length) : 0;
  const posColor = myLadderPos <= 2 ? "var(--A-pos)" : myLadderPos <= 5 ? "var(--A-accent)" : "var(--A-neg)";

  // Next 7 upcoming events
  const upcoming7 = (career.eventQueue || []).filter(e => !e.completed).slice(0, 7);

  // Last event display
  const lastEv = career.lastEvent;

  return (
    <div className="anim-in space-y-5">
      {stitch ? (
        <StitchClubDashboard
          career={career}
          club={club}
          league={league}
          myLadderPos={myLadderPos}
          myRow={myRow}
          setScreen={setScreen}
          setTab={setTab}
          onAdvance={onAdvance}
        />
      ) : (
      <>
      {/* Hero Banner */}
      <div className="panel rounded-2xl overflow-hidden relative min-h-[160px] border border-aline">
        <div className="absolute inset-0 opacity-40" style={{background:`linear-gradient(135deg, ${club.colors[0]}33 0%, transparent 55%)`}} />
        <div className="absolute inset-0" style={{background:`radial-gradient(ellipse at 80% 50%, ${club.colors[1]}22, transparent 65%)`}} />
        <div className="absolute right-6 top-0 bottom-0 flex items-center opacity-20">
          <Jersey kit={career.kits.home} size={200} />
        </div>
        <div className="relative z-10 p-6 flex items-end justify-between">
          <div>
            <div className="label mb-1 dim">{league.name} · Season {career.season}</div>
            <h1 className="display text-5xl tracking-wide text-atext leading-none">{club.name.toUpperCase()}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Pill color="var(--A-accent)">Tier {league.tier}</Pill>
              {career.phase === 'preseason'
                ? <Pill color="#4ADBE8">Pre-Season {career.season}</Pill>
                : career.inFinals
                  ? <Pill color="#E84A6F">Finals</Pill>
                  : <Pill color="#4ADBE8">Round {career.week}</Pill>}
              <Pill color={posColor}>#{myLadderPos || "—"} on Ladder</Pill>
              {myRow && <Pill color="#64748B">{myRow.W}W {myRow.L}L {myRow.D}D</Pill>}
              {career.clubCulture && (
                <Pill color="#A78BFA">
                  Culture: {career.clubCulture.tier} {Math.round(career.clubCulture.score ?? 60)}
                </Pill>
              )}
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="font-display text-7xl leading-none" style={{color: posColor}}>
              {myRow?.pts || 0}
            </div>
            <div className="text-[10px] text-atext-dim uppercase tracking-widest">Points</div>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Ground & Footy Trip strip — Spec 3D + 3B + Committee */}
      <HubGroundStrip career={career} club={club} league={league} setScreen={setScreen} />

      {!stitch && <MatchPreviewPanel career={career} league={league} />}

      {/* Last Event Result Card */}
      {lastEv && (
        <div className={`${css.panel} p-4 anim-in`}>
          {lastEv.type === 'training' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'#F0FDF4', border:'1px solid #BBF7D0'}}>
                {TRAINING_INFO[lastEv.subtype]?.icon || '🏋️'}
              </div>
              <div className="flex-1">
                <div className={css.label}>Last Session</div>
                <div className="font-bold text-atext">{lastEv.name} <span className="text-atext-dim font-normal text-sm">· {formatDate(lastEv.date)}</span></div>
                <div className="text-xs text-atext-dim mt-1">Led by {lastEv.staffName} (Rating: {lastEv.staffRating}) · Gains:&nbsp;
                  {Object.entries(lastEv.gains || {}).map(([k, v]) => `${k} +${v}`).join(', ') || '—'}
                </div>
                {lastEv.devNotes && lastEv.devNotes.length > 0 && (
                  <div className="text-xs text-[#4ADE80] mt-1 leading-relaxed">
                    {lastEv.devNotes.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}
          {lastEv.type === 'key_event' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'#EFF6FF', border:'1px solid #BFDBFE'}}>📅</div>
              <div className="flex-1">
                <div className={css.label}>Event</div>
                <div className="font-bold text-atext">{lastEv.name}</div>
                <div className="text-xs text-atext-dim mt-1">{lastEv.description}</div>
              </div>
              {lastEv.action && (
                <button onClick={() => setScreen(lastEv.action)} className={css.btnPrimary + ' text-xs'}>Go →</button>
              )}
            </div>
          )}
          {(lastEv.type === 'round' || lastEv.type === 'preseason_match') && (
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}
                style={{background: lastEv.won ? '#F0FDF4' : lastEv.drew ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${lastEv.won ? '#BBF7D0' : lastEv.drew ? '#FDE68A' : '#FECACA'}`}}>
                {lastEv.won ? '✅' : lastEv.drew ? '🤝' : '❌'}
              </div>
              <div className="flex-1">
                <div className={css.label}>{lastEv.type === 'preseason_match' ? lastEv.label : `Round ${lastEv.round}`}</div>
                <div className="font-bold text-atext">
                  {lastEv.isHome ? 'vs' : '@'} {lastEv.opp?.name}
                  <span className="ml-3 font-display text-xl" style={{color: lastEv.won ? '#4AE89A' : lastEv.drew ? 'var(--A-accent)' : '#E84A6F'}}>
                    {lastEv.myTotal} – {lastEv.oppTotal}
                  </span>
                </div>
                <div className="text-xs text-atext-dim mt-1">{formatDate(lastEv.date)} · {lastEv.won ? 'Win' : lastEv.drew ? 'Draw' : 'Loss'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events Strip */}
      {upcoming7.length > 0 && (
        <div className={css.panel}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <h3 className="font-display text-lg text-atext tracking-wide">UPCOMING</h3>
            <button onClick={() => setScreen('schedule')} className="text-[11px] font-bold text-aaccent uppercase tracking-wider hover:text-[#F0A558]">Full calendar →</button>
          </div>
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
            {upcoming7.map((ev, i) => {
              const isMatch = ev.type === 'round' || ev.type === 'preseason_match';
              const isTraining = ev.type === 'training';
              const isKey = ev.type === 'key_event';
              const info = isTraining ? TRAINING_INFO[ev.subtype] : null;
              const color = isMatch ? 'var(--A-accent)' : isKey ? '#4ADBE8' : (info?.color || '#94A3B8');
              let evLabel = '';
              if (isMatch && ev.type === 'round') {
                const m = (ev.matches || []).find(m2 => m2.home === career.clubId || m2.away === career.clubId);
                const opp2 = m ? findClub(m.home === career.clubId ? m.away : m.home) : null;
                evLabel = opp2 ? `Rd ${ev.round} ${opp2.short}` : `Rd ${ev.round}`;
              } else if (ev.type === 'preseason_match') {
                const oppId = ev.homeId === career.clubId ? ev.awayId : ev.homeId;
                evLabel = findClub(oppId)?.short || ev.label;
              } else if (isTraining) {
                evLabel = info?.name || ev.subtype;
              } else {
                evLabel = ev.name || 'Event';
              }
              return (
                <div key={ev.id} className="flex-shrink-0 rounded-xl p-3 text-center min-w-[88px]" style={{background:`${color}10`, border:`1px solid ${color}30`}}>
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{color}}>{formatDate(ev.date).split(' ').slice(0,-1).join(' ')}</div>
                  <div className="text-lg mt-1">{isTraining ? (info?.icon || '🏋️') : isKey ? '📅' : '🏉'}</div>
                  <div className="text-[10px] font-semibold text-atext mt-1 leading-tight">{evLabel}</div>
                </div>
              );
            })}
            <div className="flex-shrink-0 flex items-center justify-center min-w-[60px]">
              <button type="button" onClick={onAdvance} className="rounded-xl px-3 py-2 text-[11px] font-bold text-white flex flex-col items-center gap-1"
                style={{background:'linear-gradient(135deg,var(--A-accent),#D07A2A)'}}>
                <Play className="w-4 h-4" />
                <span>{advanceCtx.buttonLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finals Banner */}
      {career.inFinals && (
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{background:"linear-gradient(135deg, rgba(0, 224, 255, 0.12), rgba(252, 211, 77, 0.06))", border:"2px solid rgba(0, 224, 255, 0.35)"}}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="font-display text-2xl text-aaccent">FINALS MODE</div>
              <div className="text-sm text-atext-dim">{(career.finalsAlive||[]).length} clubs remain · {finalsLabel(career.finalsRound||0, career.finalsTotalRounds||3)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-xl text-aaccent">{(career.finalsAlive||[]).includes(career.clubId) ? "STILL ALIVE" : "SEASON OVER"}</div>
          </div>
        </div>
      )}

      {career.postSeasonPhase === 'trade_period' && career.inTradePeriod && (
        <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3" style={{background:"linear-gradient(135deg, rgba(74, 232, 154, 0.12), rgba(0, 224, 255, 0.08))", border:"2px solid rgba(74, 232, 154, 0.4)"}}>
          <div className="flex items-center gap-3 min-w-[200px]">
            <span className="text-3xl">🔀</span>
            <div>
              <div className="font-display text-xl text-aaccent">TRADE PERIOD</div>
              <div className="text-xs text-atext-dim">
                {(career.tradePeriodDay || 0) === 0
                  ? 'Advance time (Next) to begin day 1'
                  : `Day ${career.tradePeriodDay} of ${TRADE_PERIOD_DAYS}`}
                {career.freeAgencyOpen ? ' · Free agency open (through Day 7)' : ' · Trades only'}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" onClick={() => { setScreen('recruit'); setTab('freeagents'); }} className={`${css.btnPrimary} text-xs px-3 py-2`}>Free agents</button>
            <button type="button" onClick={() => setScreen('recruit')} className={`${css.btnGhost} text-xs px-3 py-2`}>Recruit hub</button>
            <div className="text-[10px] text-atext-dim max-w-[220px]">Advance time with <strong>Next</strong> in the bar above — each step is one Trade Period day.</div>
          </div>
        </div>
      )}

      {career.postSeasonPhase === 'draft_waiting' && (
        <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3" style={{background:"linear-gradient(135deg, rgba(255, 179, 71, 0.12), rgba(0, 224, 255, 0.06))", border:"2px solid rgba(255, 179, 71, 0.35)"}}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <div className="font-display text-xl text-aaccent">NATIONAL DRAFT COUNTDOWN</div>
              <div className="text-xs text-atext-dim">{career.postSeasonDraftCountdown ?? POST_TRADE_DRAFT_COUNTDOWN_DAYS} step{(career.postSeasonDraftCountdown ?? POST_TRADE_DRAFT_COUNTDOWN_DAYS) === 1 ? '' : 's'} until list reset &amp; new pre-season</div>
            </div>
          </div>
          <div className="text-[10px] text-atext-dim">Keep using <strong>Next</strong> — when this hits zero, the off-season rolls (contracts, draft pool, new calendar).</div>
        </div>
      )}

      {/* Premiership Banner */}
      {career.premiership === career.season - 1 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"linear-gradient(135deg, rgba(252, 211, 77, 0.12), rgba(0, 224, 255, 0.06))", border:"2px solid rgba(252, 211, 77, 0.35)"}}>
          <span className="text-3xl">🎉</span>
          <div>
            <div className="font-display text-2xl text-aaccent">BACK-TO-BACK PREMIERS!</div>
            <div className="text-sm text-atext-dim">Can you go three in a row this season?</div>
          </div>
        </div>
      )}

      {/* Stat Row */}
      {stitch ? (
        <div className="stitch-neon-card p-4 md:p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Squad Rating" value={squadAvg} sub={`${career.squad.length} players`} accent="var(--A-accent)" icon={Users} />
            <Stat label="Cash" value={fmtK(career.finance.cash)} sub={`Wages ${fmtK(wagesAnnual)}/yr`} accent="#4AE89A" icon={DollarSign} />
            <Stat label="Sponsors" value={fmtK(sponsorsAnnual)} sub={`${(career.sponsors || []).length} active deals`} accent="#4ADBE8" icon={Handshake} />
            <Stat label="Ladder Pos" value={`#${myLadderPos||"—"}`} sub={`${myRow?.w||0}W / ${myRow?.l||0}L`} accent={posColor} icon={Trophy} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Squad Rating" value={squadAvg} sub={`${career.squad.length} players`} accent="var(--A-accent)" icon={Users} />
          <Stat label="Cash" value={fmtK(career.finance.cash)} sub={`Wages ${fmtK(wagesAnnual)}/yr`} accent="#4AE89A" icon={DollarSign} />
          <Stat label="Sponsors" value={fmtK(sponsorsAnnual)} sub={`${(career.sponsors || []).length} active deals`} accent="#4ADBE8" icon={Handshake} />
          <Stat label="Ladder Pos" value={`#${myLadderPos||"—"}`} sub={`${myRow?.w||0}W / ${myRow?.l||0}L`} accent={posColor} icon={Trophy} />
        </div>
      )}

      <div className="grid md:grid-cols-5 gap-5">
        {/* Ladder */}
        <div className={`${css.panel} md:col-span-3`}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-display text-xl tracking-wide text-atext">LADDER</h3>
            <button onClick={()=>setScreen("compete")} className="text-[11px] font-bold text-aaccent uppercase tracking-wider hover:text-[#F0A558]">Full table →</button>
          </div>
          <div>
            {top5.map((row, i) => {
              const c = findClub(row.id);
              if (!c) return null;
              const isMe = row.id === career.clubId;
              const rankColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#94A3B8";
              return (
                <div key={row.id} className={`flex items-center gap-4 px-5 py-3 transition-colors ${isMe ? "" : "hover:bg-aaccent/5"}`}
                  style={isMe ? {background:"linear-gradient(90deg, rgba(0, 224, 255, 0.06), transparent)", borderLeft:"3px solid var(--A-accent)"} : {borderLeft:"3px solid transparent"}}>
                  <div className="font-display text-2xl w-6 text-center flex-shrink-0" style={{color: rankColor}}>{i+1}</div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm flex-shrink-0"
                    style={{background:`linear-gradient(135deg,${c.colors[0]},${c.colors[1]})`, color:c.colors[2]}}>
                    {c.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${isMe ? "text-aaccent" : "text-atext"}`}>{c.name}</div>
                    <div className="text-[10px] text-atext-dim">{row.W}W {row.L}L {row.D}D</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl text-aaccent">{row.pts}</div>
                    <div className="text-[10px] text-atext-dim">pts</div>
                  </div>
                </div>
              );
            })}
            {myLadderPos > 5 && myRow && (
              <>
                <div className="px-5 py-1 text-atext-mute text-xs">· · ·</div>
                <div className="flex items-center gap-4 px-5 py-3"
                  style={{background:"linear-gradient(90deg, rgba(0, 224, 255, 0.06), transparent)", borderLeft:"3px solid var(--A-accent)"}}>
                  <div className="font-display text-2xl w-6 text-center text-aaccent">{myLadderPos}</div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm"
                    style={{background:`linear-gradient(135deg,${club.colors[0]},${club.colors[1]})`, color:club.colors[2]}}>
                    {club.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-aaccent">{club.name}</div>
                    <div className="text-[10px] text-atext-dim">{myRow.W}W {myRow.L}L {myRow.D}D</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl text-aaccent">{myRow.pts}</div>
                    <div className="text-[10px] text-atext-dim">pts</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* News */}
        <div className={`${css.panel} p-5 md:col-span-2`}>
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-aaccent" />
            <h3 className="font-display text-xl tracking-wide text-atext">NEWS</h3>
          </div>
          <div className="space-y-2">
            {recentNews.length === 0 && <div className="text-sm text-atext-dim py-4 text-center">No news yet.</div>}
            {recentNews.map((n, i) => {
              const c = n.type === "win" ? "#4AE89A" : n.type === "loss" ? "#E84A6F" : n.type === "info" ? "#4ADBE8" : "#64748B";
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl" style={{background:"var(--A-panel-2)", border:"1px solid var(--A-line)"}}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{background: c, boxShadow:`0 0 6px ${c}`}} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-atext leading-snug">{n.text}</div>
                    <div className="text-[9px] text-atext-mute uppercase tracking-widest mt-0.5 font-bold">{n.week === 0 ? 'Pre-Season' : `Round ${n.week}`}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Board Pressure */}
      {career.finance.boardConfidence < 35 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"#FEF2F2", border:"1.5px solid #FECACA"}}>
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-sm text-[#DC2626]">Board On Notice — Confidence {career.finance.boardConfidence}%</div>
            <div className="text-xs text-[#EF4444]">Win your next match or face consequences. The board is watching closely.</div>
          </div>
        </div>
      )}

      {/* Contract Expiry Warnings */}
      {(() => {
        const expiring = career.squad.filter(p => (career.lineup || []).includes(p.id) && p.contract <= 1);
        if (!expiring.length) return null;
        return (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{background:"#FFFBEB", border:"1.5px solid #FDE68A"}}>
            <span className="text-2xl flex-shrink-0">📋</span>
            <div>
              <div className="font-bold text-sm text-[#D97706]">Contracts Expiring — Act Now</div>
              <div className="text-xs text-[#92400E] mt-1">
                {expiring.map(p => `${p.firstName} ${p.lastName} (${p.contract === 0 ? 'Out of contract' : '1 year left'})`).join(' · ')}
              </div>
              <button onClick={() => setScreen('squad')} className="mt-2 text-xs font-bold text-[#D97706] hover:text-[#B45309]">Manage contracts →</button>
            </div>
          </div>
        );
      })()}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users,    label: "Manage Squad",  sub: "Players & lineup", screen: "squad", color: "var(--A-accent)" },
          { icon: Dumbbell, label: "Set Training",  sub: "Intensity & focus", screen: "squad", color: "#4ADBE8" },
          { icon: Building2,label: "Upgrade Club",  sub: "Facilities & staff", screen: "club",  color: "#4AE89A" },
          { icon: Repeat,   label: "Trade & Draft", sub: "Signings & youth",   screen: "recruit",color: "#E84A6F" },
        ].map(q => {
          const Icon = q.icon;
          return (
            <button key={q.label} onClick={()=>setScreen(q.screen)}
              className="rounded-2xl p-4 text-left flex items-center gap-4 transition-all group"
              style={{background:"var(--A-panel)", border:"1px solid var(--A-line)"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=q.color+"66"; e.currentTarget.style.background="rgba(0,224,255,0.05)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--A-line)"; e.currentTarget.style.background="var(--A-panel)";}}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`${q.color}18`, color:q.color}}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-atext truncate">{q.label}</div>
                <div className="text-[10px] text-atext-dim">{q.sub}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-atext-mute flex-shrink-0" />
            </button>
          );
        })}
      </div>
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
                    <span className="text-[9px] font-mono text-slate-500 w-12 flex-shrink-0">Q{ev.q} {String(ev.minute % 25).padStart(2, '0')}'</span>
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


// ============================================================================
// SHARED TAB NAV
// ============================================================================
// ============================================================================
// SQUAD SCREEN — players, tactics, training
// ============================================================================
function SquadScreen({ career, club, updateCareer, tab, setTab, tutorialActive }) {
  const renewalCount = (career.pendingRenewals || []).filter(r => !r._handled).length;
  const t = tab || (renewalCount > 0 ? "renewals" : "players");
  const tutStep = career.tutorialStep ?? 0;
  const squadTutorialTab = tutorialActive && (tutStep === 1 || tutStep === 2 || tutStep === 5) ? tutorialHighlightTab(tutStep) : null;
  const stitch = (career.themeMode || 'A') === 'S';
  const lineupN = (career.lineup || []).length;
  const tabs = [
    { key: "players", label: "Players", icon: Users },
    { key: "tactics", label: "Tactics", icon: Target },
    { key: "training", label: "Training", icon: Dumbbell },
    ...(renewalCount > 0 || (career.pendingRenewals?.length ?? 0) > 0
      ? [{ key: "renewals", label: `Renewals${renewalCount ? ` (${renewalCount})` : ''}`, icon: FileText }]
      : []),
  ];
  return (
    <div className="anim-in">
      {stitch && (
        <div className="stitch-mock-squad-head">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl border border-[rgba(200,255,61,0.35)] flex items-center justify-center flex-shrink-0 bg-[rgba(200,255,61,0.08)]">
              <Jersey kit={career.kits.home} size={36} />
            </div>
            <div className="min-w-0">
              <div className="font-display text-2xl md:text-3xl text-atext tracking-wide uppercase leading-tight truncate">
                Team management
              </div>
              <div className="text-[10px] font-mono text-atext-mute uppercase tracking-widest mt-1">
                {club.name} · {lineupN}/22 XXII
              </div>
            </div>
          </div>
          <button
            type="button"
            className="stitch-mock-btn-ghost"
            onClick={() => setTab('tactics')}
          >
            Apply tactics
          </button>
        </div>
      )}
      <TabNav
        tabs={tabs}
        active={t}
        onChange={setTab}
        tutorialAllowOnly={squadTutorialTab}
        tutorialHighlightKey={squadTutorialTab}
      />
      {t === "players"  && <PlayersTab career={career} updateCareer={updateCareer} />}
      {t === "tactics"  && <TacticsTab career={career} updateCareer={updateCareer} />}
      {t === "training" && <TrainingTab career={career} updateCareer={updateCareer} />}
      {t === "renewals" && <RenewalsTab career={career} updateCareer={updateCareer} />}
    </div>
  );
}

function RenewalsTab({ career, updateCareer }) {
  const queue = (career.pendingRenewals || []).filter(r => !r._handled);
  const renewalsLeague = PYRAMID[career.leagueKey];
  const capLimit = effectiveWageCap(career);
  const wageBillAnnual = annualWageBill(career);
  const headroom = capHeadroom(career);
  const accept = (proposal) => {
    if (!canAffordRenewal(career, proposal)) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot renew ${proposal.name} — would breach the salary cap` }, ...(career.news || [])].slice(0, 25),
      });
      return;
    }
    const patch = applyRenewal(career, proposal);
    const merged = JSON.parse(JSON.stringify({ ...career, ...patch }));
    ensureCareerBoard(merged, findClub(merged.clubId), renewalsLeague);
    const wageDelta = proposal.proposedWage - (proposal.currentWage ?? 0);
    if (wageDelta <= 0) {
      applyMemberConfidenceDelta(merged, "Football Director", 2);
      applyMemberConfidenceDelta(merged, "Finance Director", 1);
    } else if (wageDelta >= 40_000) {
      applyMemberConfidenceDelta(merged, "Finance Director", -2);
      applyMemberConfidenceDelta(merged, "Football Director", 1);
    } else {
      applyMemberConfidenceDelta(merged, "Chairman", 1);
    }
    recalcBoardConfidence(merged);
    updateCareer({
      ...patch,
      board: merged.board,
      finance: merged.finance,
      pendingRenewals: (career.pendingRenewals || []).map(r => r.playerId === proposal.playerId ? { ...r, _handled: 'accepted' } : r),
      news: [{ week: career.week, type: 'win', text: `✍️ Re-signed ${proposal.name} for ${proposal.proposedYears}y @ ${fmtK(proposal.proposedWage)}/yr` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const reject = (proposal) => {
    const patch = applyRenewalRejection(career, proposal);
    updateCareer({
      ...patch,
      pendingRenewals: (career.pendingRenewals || []).map(r => r.playerId === proposal.playerId ? { ...r, _handled: 'rejected' } : r),
      news: [{ week: career.week, type: 'loss', text: `🚪 ${proposal.name} will walk at the end of pre-season` }, ...(career.news || [])].slice(0, 25),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>CONTRACT RENEWALS</div>
          <div className="text-xs text-atext-dim">Players whose contracts are about to expire. Re-sign before pre-season ends or they walk.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Cap Headroom" value={fmtK(headroom)} accent={headroom > 0 ? '#4AE89A' : '#E84A6F'} />
          <Stat label="Outstanding" value={queue.length} accent="var(--A-accent-2)" />
        </div>
      </div>
      <div className={`${css.panel} p-4 grid sm:grid-cols-3 gap-3 text-[11px]`}>
        <div>
          <div className={css.label}>Annual wage bill</div>
          <div className="text-atext font-mono font-bold">${fmtK(wageBillAnnual)}</div>
        </div>
        <div>
          <div className={css.label}>Salary cap</div>
          <div className="text-atext font-mono font-bold">${fmtK(capLimit)}</div>
        </div>
        <div>
          <div className={css.label}>If you renew…</div>
          <div className="text-atext-dim leading-snug">Board reacts to wage discipline. Cap-smart deals please Football + Finance; big raises draw Treasury heat.</div>
        </div>
      </div>
      {queue.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">No active renewals. They&apos;ll appear at season end.</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {queue.map(r => {
            const player = (career.squad || []).find(p => p.id === r.playerId);
            if (!player) return null;
            const wageDelta = r.proposedWage - (r.currentWage ?? 0);
            const canAfford = canAffordRenewal(career, r);
            const formColor = (player.form ?? 70) >= 80 ? '#4AE89A' : (player.form ?? 70) >= 60 ? 'var(--A-accent)' : '#E84A6F';
            return (
              <div key={r.playerId} className={`${css.panel} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-base">{r.name}</div>
                    <div className="text-[10px] text-atext-dim uppercase tracking-widest font-mono">{r.position} · age {r.age} · OVR {r.overall}</div>
                  </div>
                  <RatingDot value={r.overall} size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="text-atext-mute">Current</div>
                  <div className="text-atext text-right font-mono">{fmtK(r.currentWage)}/yr</div>
                  <div className="text-atext-mute">Demand</div>
                  <div className="text-right font-mono font-bold" style={{ color: wageDelta >= 0 ? '#FFB347' : '#4AE89A' }}>
                    {fmtK(r.proposedWage)}/yr <span className="text-atext-mute font-normal">({wageDelta >= 0 ? '+' : ''}{fmtK(wageDelta)})</span>
                  </div>
                  <div className="text-atext-mute">Years</div>
                  <div className="text-atext text-right font-mono">{r.proposedYears}y</div>
                  <div className="text-atext-mute">Form factor</div>
                  <div className="text-right font-mono" style={{ color: formColor }}>{(r.formMult ?? 1).toFixed(2)}×</div>
                </div>
                {!canAfford && (
                  <div className="text-[10px] text-[#E84A6F] mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Over salary cap</div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => reject(r)} className="text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10">Let Walk</button>
                  <button onClick={() => accept(r)} disabled={!canAfford} className={canAfford ? `${css.btnPrimary} text-xs px-3 py-2` : "px-3 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute"}>Re-Sign</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlayersTab({ career, updateCareer }) {
  const [sort, setSort] = useState("overall");
  const [filterPos, setFilterPos] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const stitch = (career.themeMode || 'A') === 'S';
  const rowHoverBg = stitch ? 'rgba(200,255,61,0.06)' : 'rgba(0,224,255,0.05)';
  const rowSelectBg = stitch ? 'rgba(200, 255, 61, 0.1)' : 'rgba(0, 224, 255, 0.08)';
  const players = useMemo(() => {
    let arr = [...career.squad];
    if (filterPos !== "ALL") arr = arr.filter(p => playerHasPosition(p, filterPos));
    if (filterStatus === "lineup") arr = arr.filter(p => career.lineup.includes(p.id));
    if (filterStatus === "bench") arr = arr.filter(p => !career.lineup.includes(p.id));
    if (filterStatus === "injured") arr = arr.filter(p => (p.injured || 0) > 0 || (p.suspended || 0) > 0);
    if (filterStatus === "rookies") arr = arr.filter(p => p.rookie);
    const name = p => p.firstName ? p.firstName+" "+p.lastName : (p.name||"");
    arr.sort((a, b) => {
      if (sort === "overall") return b.overall - a.overall;
      if (sort === "age") return a.age - b.age;
      if (sort === "form") return b.form - a.form;
      if (sort === "wage") return b.wage - a.wage;
      if (sort === "contract") return (a.contract ?? 0) - (b.contract ?? 0);
      if (sort === "potential") return (b.potential || 0) - (a.potential || 0);
      return name(a).localeCompare(name(b));
    });
    return arr;
  }, [career.squad, career.lineup, sort, filterPos, filterStatus]);
  const pName = p => p.firstName ? p.firstName+" "+p.lastName : (p.name||"Player");

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Left: filters + table */}
      <div className="flex-1 min-w-0">
        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-wrap items-center">
          {["ALL", ...POSITIONS].map(pos => (
            <button key={pos} onClick={()=>setFilterPos(pos)}
              className="text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all"
              style={filterPos===pos ? {background:"var(--A-accent)", color:"#001520"} : {background:"var(--A-panel)", color:"var(--A-text-dim)", border:"1px solid var(--A-line)"}}>
              {pos}
            </button>
          ))}
          <span className="text-[10px] text-atext-mute uppercase font-bold ml-1">Status</span>
          {[
            { key: "ALL", label: "All" },
            { key: "lineup", label: "Lineup" },
            { key: "bench", label: "Bench" },
            { key: "injured", label: "Out" },
            { key: "rookies", label: "Rookies" },
          ].map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setFilterStatus(key)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all"
              style={filterStatus === key ? { background: "rgba(74,219,232,0.2)", color: "var(--A-accent)", border: "1px solid var(--A-accent)" } : { background: "var(--A-panel)", color: "var(--A-text-dim)", border: "1px solid var(--A-line)" }}>
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className={css.label}>Sort</span>
            <select value={sort} onChange={e=>setSort(e.target.value)}
              className="text-sm font-semibold rounded-lg px-3 py-1.5"
              style={{background:"var(--A-panel)", border:"1px solid var(--A-line)", color:"var(--A-text)"}}>
              <option value="overall">Rating</option>
              <option value="potential">Potential</option>
              <option value="age">Age</option>
              <option value="form">Form</option>
              <option value="wage">Wage</option>
              <option value="contract">Contract (yrs left)</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Roster: data table (A/B) · Stitch cards (corrected_18 PNG) */}
        {stitch ? (
          <>
            <div className="stitch-neon-card p-3 md:p-4 space-y-2 max-h-[65vh] overflow-y-auto">
              {players.map((p) => {
                const inLineup = career.lineup.includes(p.id);
                const isSelected = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : p)}
                    className={`stitch-mock-player-card ${isSelected ? 'stitch-mock-player-card-selected' : ''}`}
                  >
                    <div className="stitch-mock-player-rating">{p.overall}</div>
                    <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2">
                      <div className="w-9 h-9 rounded-full border border-[rgba(200,255,61,0.25)] bg-apanel-2 flex items-center justify-center text-[10px] font-bold text-atext flex-shrink-0">
                        {(p.firstName?.[0] || '')}{(p.lastName?.[0] || '')}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-[9px] font-mono text-atext-mute uppercase tracking-wider">
                          {formatPositionSlash(p)}
                          {inLineup && <span className="text-aaccent ml-2">· XXII</span>}
                          {p.injured > 0 && <span className="text-aneg ml-1">· OUT {p.injured}w</span>}
                        </div>
                        <div className="font-bold text-sm text-atext truncate">{pName(p)}</div>
                        <div className="flex gap-2 mt-1 text-[10px] font-mono text-atext-mute">
                          <span>FIT {p.fitness}</span>
                          <span>·</span>
                          <span>FRM {p.form}</span>
                        </div>
                      </div>
                      <GripVertical className="w-4 h-4 text-atext-mute flex-shrink-0 opacity-60" aria-hidden />
                    </div>
                    <div className="stitch-mock-player-tab" aria-hidden />
                  </button>
                );
              })}
            </div>
            {(() => {
              const bench = [...career.squad]
                .filter((p) => !career.lineup.includes(p.id))
                .sort((a, b) => b.overall - a.overall)
                .slice(0, 14);
              if (bench.length === 0) return null;
              return (
                <div className="mt-4">
                  <div className="stitch-mock-bench-label">
                    Bench ({bench.length})
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
                    {bench.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelected(p.id === selected?.id ? null : p)}
                        className={`flex-shrink-0 snap-start stitch-mock-player-card max-w-[220px] ${selected?.id === p.id ? 'stitch-mock-player-card-selected' : ''}`}
                        style={{ marginBottom: 0 }}
                      >
                        <div className="stitch-mock-player-rating text-xs w-9">{p.overall}</div>
                        <div className="flex flex-col justify-center px-2 py-1.5 min-w-0 text-left flex-1">
                          <div className="text-[8px] font-mono text-atext-mute uppercase truncate">{formatPositionSlash(p)}</div>
                          <div className="text-xs font-bold text-atext truncate">{pName(p)}</div>
                        </div>
                        <div className="stitch-mock-player-tab w-1.5" aria-hidden />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
            <button
              type="button"
              className="stitch-mock-slant-btn mt-4"
              onClick={() =>
                updateCareer({
                  lineup: [...career.squad].sort((a, b) => b.overall - a.overall).slice(0, 22).map((p) => p.id),
                })
              }
            >
              <span>Auto-select team</span>
            </button>
          </>
        ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--A-line)" }}>
          <div className="overflow-x-auto">
          <div className="grid px-4 py-3 min-w-[820px]" style={{gridTemplateColumns:"2rem minmax(140px,1fr) 4rem 3rem 3.5rem 5rem 5rem 4.5rem 3.5rem", gap:"0.5rem", background:"var(--A-panel-2)", borderBottom:"1px solid var(--A-line)"}}>
            {["#","Player","Pos","Age","OVR","Form","Fitness","Wage","Status"].map((h,i)=>(
              <div key={h} className={`text-[10px] font-black uppercase tracking-[0.15em] text-atext-mute ${i>1?"text-center":""} ${i===7?"text-right":""}`}>{h}</div>
            ))}
          </div>
          <div className="max-h-[65vh] overflow-y-auto min-w-[820px]" style={{background:"var(--A-panel)"}}>
            {players.map((p, i) => {
              const inLineup = career.lineup.includes(p.id);
              const isSelected = selected?.id === p.id;
              const formColor = p.form >= 75 ? "#4AE89A" : p.form >= 55 ? "var(--A-accent)" : "#E84A6F";
              const fitColor  = p.fitness >= 80 ? "#4AE89A" : p.fitness >= 60 ? "var(--A-accent)" : "#E84A6F";
              return (
                <button key={p.id} onClick={()=>setSelected(isSelected ? null : p)}
                  className="w-full grid px-4 py-3 transition-all"
                  style={{
                    gridTemplateColumns:"2rem minmax(140px,1fr) 4rem 3rem 3.5rem 5rem 5rem 4.5rem 3.5rem", gap:"0.5rem",
                    borderBottom:"1px solid var(--A-line)",
                    background: isSelected ? rowSelectBg : "transparent",
                    borderLeft: isSelected ? "3px solid var(--A-accent)" : "3px solid transparent",
                  }}
                  onMouseEnter={e=>{if(!isSelected) e.currentTarget.style.background=rowHoverBg;}}
                  onMouseLeave={e=>{if(!isSelected) e.currentTarget.style.background="transparent";}}>
                  <div className="text-atext-mute text-sm font-bold text-left">{i+1}</div>
                  <div className="flex items-center gap-2 min-w-0 text-left">
                    {p.injured > 0 && <Heart className="w-3 h-3 flex-shrink-0 text-[#E84A6F]" />}
                    {inLineup && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:"#4AE89A", boxShadow:"0 0 4px #4AE89A"}} />}
                    <span className="truncate text-sm font-semibold text-atext">{pName(p)}</span>
                    {p.rookie && <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0" style={{background:"#4ADBE822",color:"#4ADBE8"}}>R</span>}
                  </div>
                  <div className="text-center"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                  <div className="text-center text-sm text-[#8A9AB8]">{p.age}</div>
                  <div className="text-center flex justify-center"><RatingDot value={p.overall} size="sm" /></div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"var(--A-line)"}}>
                      <div className="h-full rounded-full" style={{width:`${p.form}%`, background:formColor}} />
                    </div>
                    <span className="text-[10px] font-bold w-6 text-right" style={{color:formColor}}>{p.form}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"var(--A-line)"}}>
                      <div className="h-full rounded-full" style={{width:`${p.fitness}%`, background:fitColor}} />
                    </div>
                    <span className="text-[10px] font-bold w-6 text-right" style={{color:fitColor}}>{p.fitness}</span>
                  </div>
                  <div className="text-right text-xs font-mono text-atext-dim">{fmtK(p.wage)}</div>
                  <div className="text-center">
                    {p.suspended > 0
                      ? <Pill color="#A78BFA">SUS {p.suspended}w</Pill>
                      : p.injured > 0
                        ? <Pill color="#E84A6F">{p.injured}w</Pill>
                        : inLineup
                          ? <Pill color="#4AE89A">XI</Pill>
                          : <span className="text-atext-mute text-xs">—</span>}
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        </div>
        )}
        <div className="mt-2 text-[10px] text-atext-mute">{players.length} players · {career.lineup.length}/22 in XXII · {career.squad.length} total squad</div>
      </div>

      {/* Right: player detail */}
      <div className="w-full lg:w-72 flex-shrink-0">
        {selected ? (
          <PlayerDetail player={selected} career={career} updateCareer={updateCareer} onClose={()=>setSelected(null)} />
        ) : (
          <div className="rounded-2xl p-8 text-center" style={{background:"var(--A-panel-2)", border:"1px solid var(--A-line)"}}>
            <Users className="w-10 h-10 mx-auto mb-3 text-aline-2" />
            <div className="text-sm text-atext-mute font-medium">Click a player to view their profile</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerDetail({ player, career, updateCareer, onClose }) {
  const inLineup = career.lineup.includes(player.id);
  const pName = player.firstName ? player.firstName+" "+player.lastName : (player.name||"Player");
  const toggleLineup = () => {
    if (inLineup) updateCareer({ lineup: career.lineup.filter(id => id !== player.id) });
    else if (career.lineup.length < 22) updateCareer({ lineup: [...career.lineup, player.id] });
  };
  const offerNewContract = () => {
    const wageBump = Math.round(player.wage * 1.15);
    updateCareer({ squad: career.squad.map(p => p.id === player.id ? {...p, contract:3, wage:wageBump, morale:clamp(p.morale+8,30,100)} : p) });
  };
  const release = () => {
    updateCareer({ squad: career.squad.filter(p => p.id !== player.id), lineup: career.lineup.filter(id => id !== player.id) });
    onClose();
  };
  const ATTR_COLORS = { kicking:"#4ADBE8", marking:"#4AE89A", handball:"#A78BFA", tackling:"#E84A6F", speed:"var(--A-accent)", endurance:"#4AE89A", strength:"#E84A6F", decision:"#4ADBE8" };

  return (
    <div className="rounded-2xl overflow-hidden sticky top-20" style={{background:"var(--A-panel-2)", border:"1px solid var(--A-line)"}}>
      {/* Header */}
      <div className="p-4" style={{background:`linear-gradient(135deg, var(--A-panel), var(--A-panel-2))`}}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-dim mb-0.5">
              {POSITION_NAMES[player.position]}{player.secondaryPosition ? ` · ${POSITION_NAMES[player.secondaryPosition]}` : ''}
            </div>
            <h3 className="font-display text-2xl text-atext leading-tight truncate">{pName.toUpperCase()}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-atext-dim">Age {player.age}</span>
              <span className="text-aline-2">·</span>
              <span className={`text-[11px] ${player.contract <= 1 ? 'text-[#FFB347] font-bold' : 'text-atext-dim'}`}>{player.contract}yr</span>
              <span className="text-aline-2">·</span>
              <span className="text-[11px] text-atext-dim">{fmtK(player.wage)}/yr</span>
              {player.contract <= 1 && <Pill color="#FFB347">Renew soon</Pill>}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <RatingDot value={player.overall} size="lg" />
            {player.trueRating && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:"#4ADBE814",color:"#4ADBE8",border:"1px solid #4ADBE830"}}>
                Scout {player.trueRating}
              </span>
            )}
          </div>
        </div>
        {/* Form / Fitness / Morale row */}
        <div className="grid grid-cols-3 gap-2">
          {[["Form", player.form, player.form>=75?"#4AE89A":player.form>=55?"var(--A-accent)":"#E84A6F"],
            ["Fitness", player.fitness, player.fitness>=80?"#4AE89A":player.fitness>=60?"var(--A-accent)":"#E84A6F"],
            ["Morale", player.morale, player.morale>=75?"#4AE89A":"var(--A-accent)"]].map(([l,v,c])=>(
            <div key={l} className="rounded-xl p-2.5 text-center" style={{background:"var(--A-panel-2)"}}>
              <div className="text-[8px] font-black uppercase tracking-widest text-atext-mute">{l}</div>
              <div className="font-display text-2xl leading-tight" style={{color:c}}>{v}</div>
              <div className="h-1 rounded-full mt-1 overflow-hidden" style={{background:"var(--A-line)"}}>
                <div className="h-full rounded-full" style={{width:`${v}%`,background:c}} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attributes */}
      <div className="p-4" style={{borderTop:"1px solid var(--A-line)"}}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-3">Attributes</div>
        <div className="space-y-2.5">
          {Object.entries(player.attrs).map(([k, v]) => {
            const color = ATTR_COLORS[k] || "var(--A-accent)";
            return (
              <div key={k} className="flex items-center gap-2">
                <div className="text-[11px] capitalize font-semibold text-[#8A9AB8] w-20 flex-shrink-0">{k}</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:"var(--A-line)"}}>
                  <div className="h-full rounded-full transition-all" style={{width:`${v}%`, background:`linear-gradient(90deg,${color}88,${color})`}} />
                </div>
                <div className="text-[12px] font-black w-7 text-right" style={{color}}>{v}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Season Stats */}
      <div className="px-4 pb-4" style={{borderTop:"1px solid var(--A-line)", paddingTop:"1rem"}}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-3">Season Stats</div>
        <div className="grid grid-cols-4 gap-2">
          {[["G", player.goals,"#4AE89A"],["B",player.behinds,"var(--A-accent)"],["DSP",player.disposals,"#4ADBE8"],["M",player.marks,"#A78BFA"]].map(([l,v,c])=>(
            <div key={l} className="rounded-xl p-2.5 text-center" style={{background:"var(--A-panel-2)", border:"1px solid var(--A-line)"}}>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{color:c}}>{l}</div>
              <div className="font-display text-2xl leading-tight text-atext">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2" style={{borderTop:"1px solid var(--A-line)"}}>
        <button onClick={toggleLineup} className={`w-full text-sm font-bold py-2.5 rounded-xl transition-all ${inLineup ? css.btnDanger : css.btnPrimary}`}>
          {inLineup ? "Remove from XXII" : career.lineup.length >= 22 ? "XXII Full" : "Add to XXII"}
        </button>
        <button onClick={offerNewContract} className={`w-full ${css.btnGhost} text-sm`}>Offer Contract Ext. (+15%)</button>
        <button onClick={release} className="w-full text-sm py-2.5 rounded-xl font-bold transition-all text-[#E84A6F] hover:bg-[#E84A6F]/10">
          Release Player
        </button>
      </div>
    </div>
  );
}

const TACTIC_CARDS = [
  { key: 'defensive', label: 'Defensive', icon: ShieldCheck, color: '#4ADBE8',  desc: 'Lock down the contest. Lower scoring both ways.' },
  { key: 'flood',     label: 'Flood',     icon: Activity,    color: '#A78BFA',  desc: 'Pack defensive 50. Frustrates flair sides.' },
  { key: 'balanced',  label: 'Balanced',  icon: Target,      color: 'var(--A-accent)', desc: 'Even spread. No team-rating swing.' },
  { key: 'press',     label: 'Press',     icon: Zap,         color: '#4AE89A',  desc: 'Forward press, choke turnovers in our half.' },
  { key: 'run',       label: 'Run-and-Gun', icon: TrendingUp, color: '#FFB347', desc: 'Open the game up. High-scoring shootout.' },
  { key: 'attack',    label: 'All-Out Attack', icon: Flame,  color: '#E84A6F',  desc: 'Pump it long. Big upside, leakier defensively.' },
];

function TacticsTab({ career, updateCareer }) {
  const stitch = (career.themeMode || 'A') === 'S';
  const lineup = career.lineup.map(id => career.squad.find(p => p.id === id)).filter(Boolean);
  const byPos = POSITIONS.reduce((acc, p) => ({ ...acc, [p]: lineup.filter(pl => pl.position === p) }), {});
  const currentTactic = career.tacticChoice || 'balanced';
  const fieldStroke = stitch ? 'rgba(200, 255, 61, 0.28)' : '#FFFFFF20';
  const fieldStrokeHi = stitch ? 'rgba(200, 255, 61, 0.45)' : '#FFFFFF30';
  const goalStroke = stitch ? 'rgba(200, 255, 61, 0.55)' : '#FFFFFF60';
  return (
    <div className="space-y-4">
      <div className={`${css.panel} p-5`}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className={`${css.h1} text-2xl`}>MATCH-DAY APPROACH</h3>
          {stitch && (
            <span className="text-[10px] font-mono text-aaccent uppercase tracking-[0.2em] hidden sm:inline">Stitch · team_selection_tactics</span>
          )}
          <Pill color="var(--A-accent)">Active: {TACTIC_CARDS.find(t => t.key === currentTactic)?.label || 'Balanced'}</Pill>
        </div>
        <p className="text-xs text-atext-dim mb-4">Sets shot rate, momentum gain and risk for every match. Switch tactics to suit the opposition.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TACTIC_CARDS.map(t => {
            const Icon = t.icon;
            const active = currentTactic === t.key;
            return (
              <button key={t.key} onClick={() => updateCareer({ tacticChoice: t.key })}
                className={`text-left p-4 rounded-2xl border transition-all ${active ? 'ring-2 ring-aaccent' : 'hover:border-aaccent/40'}`}
                style={{ background: active ? `${t.color}15` : 'var(--A-panel)', borderColor: active ? t.color : 'var(--A-line)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55` }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="font-display text-xl text-atext tracking-wide">{t.label.toUpperCase()}</div>
                </div>
                <div className="text-[12px] text-atext-dim leading-relaxed">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    <div className="grid md:grid-cols-2 gap-4">
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>FORMATION (XXII)</h3>
        <div className="text-[11px] text-atext-dim mb-4">{lineup.length}/22 selected. AFL teams field 18 + 4 interchange.</div>
        {/* SVG oval — Stitch: neon pitch lines per mock */}
        <div className={`relative aspect-[5/4] rounded-2xl overflow-hidden ${stitch ? 'stitch-mock-field-wrap' : ''}`} style={{ background: stitch ? 'radial-gradient(ellipse at center, #0f1a14 0%, #0a120e 70%, #060a08 100%)' : 'radial-gradient(ellipse at center, #1B5E3F 0%, #0F4029 70%, #08251A 100%)' }}>
          <svg viewBox="0 0 500 400" className="absolute inset-0">
            <ellipse cx="250" cy="200" rx="240" ry="190" fill="none" stroke={fieldStroke} strokeWidth={stitch ? 2 : 2} />
            <ellipse cx="250" cy="200" rx="60" ry="60" fill="none" stroke={fieldStrokeHi} strokeWidth={1.5} />
            <line x1="250" y1="10" x2="250" y2="390" stroke={fieldStroke} strokeWidth={1} strokeDasharray="4,4" />
            <line x1="10" y1="170" x2="10" y2="230" stroke={goalStroke} strokeWidth={3} />
            <line x1="490" y1="170" x2="490" y2="230" stroke={goalStroke} strokeWidth={3} />
            {/* Position dots */}
            {[
              { pos: "KF", x: 80, y: 200, lbl: "Full Forward" },
              { pos: "HF", x: 150, y: 130, lbl: "Half Fwd" },
              { pos: "HF", x: 150, y: 270, lbl: "Half Fwd" },
              { pos: "C", x: 250, y: 200, lbl: "Centre" },
              { pos: "WG", x: 250, y: 110, lbl: "Wing" },
              { pos: "WG", x: 250, y: 290, lbl: "Wing" },
              { pos: "RU", x: 200, y: 200, lbl: "Ruck" },
              { pos: "R", x: 300, y: 200, lbl: "Rover" },
              { pos: "HB", x: 350, y: 130, lbl: "Half Back" },
              { pos: "HB", x: 350, y: 270, lbl: "Half Back" },
              { pos: "KB", x: 420, y: 200, lbl: "Full Back" },
            ].map((sp, i) => {
              const players = byPos[sp.pos] || [];
              const filled = players.length > 0;
              const dotStroke = stitch ? 'rgba(200, 255, 61, 0.5)' : (filled ? career.kits.home.accent : '#FFFFFF40');
              return (
                <g key={i}>
                  <circle cx={sp.x} cy={sp.y} r="14" fill={filled ? (stitch ? 'rgba(200,255,61,0.15)' : career.kits.home.primary) : (stitch ? 'rgba(200,255,61,0.08)' : '#FFFFFF20')} stroke={dotStroke} strokeWidth={stitch ? 2 : 2} />
                  <text x={sp.x} y={sp.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={stitch ? '#C8FF3D' : '#FFFFFF'} fontFamily={stitch ? 'JetBrains Mono, monospace' : 'Bebas Neue'}>{sp.pos}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {POSITIONS.map(p => (
            <div key={p} className={`${css.inset} p-2 text-center`}>
              <div className="text-[9px] text-atext-dim uppercase">{p}</div>
              <div className="font-display text-2xl text-aaccent">{byPos[p]?.length || 0}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>SELECTED XXII</h3>
        <div className="text-[11px] text-atext-dim mb-4">Tap to remove. Add players from the Players tab.</div>
        <div className={`space-y-1.5 max-h-[60vh] overflow-y-auto ${stitch ? 'pr-1' : ''}`}>
          {lineup.length === 0 && <div className="text-sm text-atext-dim text-center py-12">No players selected.</div>}
          {lineup.sort((a,b)=>b.overall-a.overall).map(p => (
            stitch ? (
              <button
                key={p.id}
                type="button"
                onClick={()=>updateCareer({ lineup: career.lineup.filter(id => id !== p.id) })}
                className="stitch-mock-player-card"
              >
                <div className="stitch-mock-player-rating">{p.overall}</div>
                <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2">
                  <div className="w-9 h-9 rounded-full border border-[rgba(200,255,61,0.25)] bg-apanel-2 flex items-center justify-center text-[10px] font-bold text-atext flex-shrink-0">
                    {(p.firstName?.[0] || '')}{(p.lastName?.[0] || '')}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-[9px] font-mono text-atext-mute uppercase tracking-wider">{formatPositionSlash(p)}</div>
                    <div className="font-bold text-sm text-atext truncate">{p.firstName ? `${p.firstName} ${p.lastName}` : p.name}</div>
                  </div>
                  <GripVertical className="w-4 h-4 text-atext-mute flex-shrink-0" aria-hidden />
                </div>
                <div className="stitch-mock-player-tab" aria-hidden />
              </button>
            ) : (
            <button key={p.id} onClick={()=>updateCareer({ lineup: career.lineup.filter(id => id !== p.id) })} className="w-full flex items-center gap-2 p-2 rounded-lg bg-apanel hover:bg-apanel-2 transition group">
              <span className="text-[9px] px-1 py-0.5 bg-aline rounded font-bold text-center leading-tight inline-block max-w-[4.5rem]" title={formatPositionSlash(p)}>{formatPositionSlash(p)}</span>
              <span className="text-sm flex-1 text-left truncate">{p.firstName ? p.firstName + " " + p.lastName : p.name}</span>
              <span className="text-xs text-atext-dim">{p.age}</span>
              <RatingDot value={p.overall} />
              <X className="w-4 h-4 text-[#E84A6F] opacity-0 group-hover:opacity-100" />
            </button>
          )
          ))}
        </div>
        {stitch && (
          <button
            type="button"
            className="stitch-mock-slant-btn mt-4"
            onClick={() => updateCareer({
              lineup: [...career.squad].sort((a,b)=>b.overall-a.overall).slice(0, 22).map(p => p.id),
            })}
          >
            <span>Auto-select XXII</span>
          </button>
        )}
      </div>
    </div>
    </div>
  );
}

function TrainingTab({ career, updateCareer }) {
  const t = career.training;
  const setIntensity = (v) => updateCareer({ training: { ...t, intensity: v } });
  const setFocus = (k, v) => {
    const others = Object.keys(t.focus).filter(x => x !== k);
    const remain = 100 - v;
    const oldOthers = others.reduce((a, x) => a + t.focus[x], 0);
    const newFocus = { [k]: v };
    others.forEach(x => { newFocus[x] = oldOthers === 0 ? Math.round(remain / others.length) : Math.round((t.focus[x] / oldOthers) * remain); });
    updateCareer({ training: { ...t, focus: newFocus } });
  };

  const medLevel = career.facilities?.medical?.level ?? 1;
  const recoveryFocus = t.focus.recovery ?? 20;
  const intensity = t.intensity ?? 60;
  // Mirror the formula in advanceToNextEvent for honesty
  const matchInjuryProb = clamp(0.12 + (intensity - 50) * 0.002 - medLevel * 0.012 - (recoveryFocus - 20) * 0.001, 0.04, 0.28);
  const trainingInjuryProb = Math.max(0, ((intensity - 50) * 0.0014) + 0.012 - medLevel * 0.005 - (recoveryFocus - 20) * 0.0008);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>TRAINING INTENSITY</h3>
        <p className="text-xs text-atext-dim mb-4">Higher intensity boosts development but increases fatigue and injury risk.</p>
        <div className="flex items-center gap-3 mb-2">
          <div className={`${css.h1} text-5xl text-aaccent w-20 text-center`}>{t.intensity}</div>
          <div className="flex-1">
            <input type="range" min="20" max="100" value={t.intensity} onChange={(e)=>setIntensity(+e.target.value)} className="w-full accent-[var(--A-accent)]" />
            <div className="flex justify-between text-[10px] text-atext-dim mt-1 uppercase tracking-widest"><span>Easy</span><span>Hard</span></div>
          </div>
        </div>
        <div className={`${css.inset} p-3 mt-4 space-y-2`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-atext-dim uppercase tracking-widest font-mono">Match-day injury risk</span>
            <span className="font-display text-base" style={{ color: matchInjuryProb > 0.20 ? '#E84A6F' : matchInjuryProb > 0.13 ? 'var(--A-accent)' : '#4AE89A' }}>
              {(matchInjuryProb * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-atext-dim uppercase tracking-widest font-mono">Training-day injury risk</span>
            <span className="font-display text-base" style={{ color: trainingInjuryProb > 0.04 ? '#E84A6F' : trainingInjuryProb > 0.02 ? 'var(--A-accent)' : '#4AE89A' }}>
              {(trainingInjuryProb * 100).toFixed(2)}%
            </span>
          </div>
          <div className="text-[10px] text-atext-mute leading-relaxed">
            Medical Centre Lvl {medLevel} cuts injury rate{medLevel > 1 ? ` and recovery time by ${medLevel - 1}w` : ''}. Recovery focus ({recoveryFocus}%) further softens hits.
          </div>
        </div>
      </div>
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>TRAINING FOCUS</h3>
        <p className="text-xs text-atext-dim mb-4">Distribution must total 100. Skills boosts kicking/marking/handball. Fitness boosts speed/endurance/strength. Tactics boosts decision/tackling. Recovery cuts injuries.</p>
        {Object.entries(t.focus).map(([k, v]) => {
          const colors = { skills: "var(--A-accent)", fitness: "#4ADBE8", tactics: "#E84A6F", recovery: "#4AE89A" };
          const labels = { skills: "Skills", fitness: "Fitness", tactics: "Tactics", recovery: "Recovery" };
          return (
            <div key={k} className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-sm capitalize font-semibold" style={{ color: colors[k] }}>{labels[k] || k}</span>
                <span className="font-display text-lg">{v}%</span>
              </div>
              <input type="range" min="5" max="80" value={v} onChange={(e)=>setFocus(k, +e.target.value)} className="w-full" style={{ accentColor: colors[k] }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================================
// CLUB SCREEN — finances, sponsors, kits, facilities, staff
// ============================================================================
function ClubScreen({ career, club, updateCareer, tab, setTab, tutorialActive }) {
  const t = tab || "finances";
  const tutStep = career.tutorialStep ?? 0;
  const clubTutorialTab = tutorialActive && (tutStep === 3 || tutStep === 4) ? tutorialHighlightTab(tutStep) : null;
  const leagueTier = (() => {
    const lg = findLeagueOf(career.clubId);
    return lg ? lg.tier : 1;
  })();
  const showCommittee = leagueTier <= 3 && Array.isArray(career.committee) && career.committee.length > 0;
  const tabs = [
    { key: "finances", label: "Finances", icon: DollarSign },
    { key: "board", label: "Board", icon: Landmark },
    { key: "sponsors", label: "Sponsors", icon: Handshake },
    { key: "kits", label: "Kits", icon: Shirt },
    { key: "facilities", label: "Facilities", icon: Building2 },
    { key: "staff", label: "Staff", icon: UserCog },
    ...(showCommittee ? [{ key: "committee", label: "Committee", icon: Users }] : []),
    { key: "honours", label: "Honours", icon: Award },
    { key: "rookies", label: "Rookie List", icon: Sprout },
    { key: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <div className="anim-in">
      <TabNav
        tabs={tabs}
        active={t}
        onChange={setTab}
        tutorialAllowOnly={clubTutorialTab}
        tutorialHighlightKey={clubTutorialTab}
      />
      {t === "finances"   && <FinancesTab career={career} />}
      {t === "board"      && <BoardTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "sponsors"   && <SponsorsTab career={career} updateCareer={updateCareer} />}
      {t === "kits"       && <KitsTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "facilities" && <FacilitiesTab career={career} updateCareer={updateCareer} />}
      {t === "staff"      && <StaffTab career={career} updateCareer={updateCareer} />}
      {t === "committee"  && <CommitteeTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "honours"    && <HonoursTab career={career} club={club} />}
      {t === "rookies"    && <RookieListTab career={career} updateCareer={updateCareer} />}
      {t === "settings"   && <SettingsTab career={career} updateCareer={updateCareer} />}
    </div>
  );
}

function BoardTab({ career, club, updateCareer }) {
  const league = findLeagueOf(career.clubId);
  const members = career.board?.members ?? [];
  const objectives = career.board?.objectives ?? [];
  const inbox = career.board?.inbox ?? [];
  const overall = career.finance?.boardConfidence ?? 0;

  const respondInbox = (messageId, optionId) => {
    if (!league) return;
    const draft = {
      ...career,
      board: {
        ...career.board,
        members: (career.board?.members || []).map((m) => ({ ...m })),
        inbox: [...(career.board?.inbox || [])],
        objectives: [...(career.board?.objectives || [])],
      },
      finance: { ...career.finance },
    };
    const result = resolveBoardInboxChoice(draft, league, messageId, optionId);
    if (!result.ok) return;
    updateCareer({
      board: draft.board,
      finance: draft.finance,
      news: result.newsLine
        ? [{ week: career.week, type: 'board', text: result.newsLine }, ...(career.news || [])].slice(0, 20)
        : career.news,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>EXECUTIVE BOARD</div>
        <div className="text-xs text-atext-dim max-w-2xl leading-snug">
          Club directors and weighted confidence — separate from the volunteer committee at lower tiers. Overall score feeds into finances and match-day systems.
        </div>
      </div>

      {inbox.length > 0 && (
        <div>
          <div className={`${css.h1} text-lg mb-2`}>Inbox</div>
          <div className="space-y-3">
            {inbox.map((msg) => (
              <div key={msg.id} className={`${css.panel} p-4`} style={{ borderColor: 'var(--A-accent)' }}>
                <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-1">{msg.fromRole}</div>
                <div className="font-bold text-atext mb-2">{msg.title}</div>
                <p className="text-sm text-atext-dim leading-snug mb-3">{msg.body}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {(msg.options || []).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => respondInbox(msg.id, o.id)}
                      className={`${css.btnPrimary} text-xs px-3 py-2 flex-1 text-left`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${css.panel} p-4`}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <span className={css.label}>Overall board confidence</span>
          <span className="font-display text-2xl text-aaccent">{overall}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
          <div className="h-full" style={{ width: `${overall}%`, background: 'linear-gradient(90deg, var(--A-accent-2), var(--A-accent))' }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {(members.length ? members : []).map((m) => {
          const col = m.confidence >= 70 ? '#4AE89A' : m.confidence >= 40 ? 'var(--A-accent-2)' : '#E84A6F';
          const moodLabel = (m.mood || 'neutral').toUpperCase();
          return (
            <div key={m.role} className={`${css.panel} p-4`}>
              <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-0.5">{m.role}</div>
              <div className="font-bold text-atext leading-tight mb-1">{m.name}</div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] text-atext-dim">Priority: {m.priority}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ border: `1px solid ${col}`, color: col }}>{moodLabel}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
                <div className="h-full transition-all" style={{ width: `${m.confidence}%`, background: col }} />
              </div>
              <div className="flex justify-between text-[11px] text-atext-dim">
                <span>Confidence</span>
                <span>{m.confidence}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className={`${css.h1} text-lg mb-2`}>Season objectives</div>
        <div className="grid gap-3 md:grid-cols-2">
          {objectives.length === 0 && (
            <div className={`${css.panel} p-6 text-sm text-atext-dim`}>Objectives are set at the start of each season.</div>
          )}
          {objectives.map((obj) => {
            const st = boardObjectiveUiStatus(obj, career);
            const stColor = st === 'MET' || st === 'ON TRACK' ? '#4AE89A' : st === 'MISSED' ? '#E84A6F' : 'var(--A-accent-2)';
            return (
              <div key={obj.id} className={`${css.panel} p-4`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-[11px] text-atext-mute uppercase tracking-wide">{obj.setBy}</div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0" style={{ color: stColor, border: `1px solid ${stColor}` }}>{st}</span>
                </div>
                <p className="text-sm text-atext leading-snug mb-2">{obj.description}</p>
                <div className="text-[11px] text-atext-dim">
                  {obj.type === 'ladder_position' && obj.current != null && <>Ladder position: <strong className="text-atext">{obj.current}</strong> (target ≤ {obj.target})<br /></>}
                  {obj.type === 'premiership' && <>Premiership: {career.premiership === career.season ? 'Leading — won flag this year' : 'Need to win the grand final'}<br /></>}
                  {obj.type === 'budget_discipline' && obj.current != null && <>Cash: <strong className="text-atext">{fmtK(obj.current)}</strong> (target ≥ $0)<br /></>}
                  {obj.type === 'youth_promoted' && obj.current != null && <>Youth (≤22, 5+ games): <strong className="text-atext">{obj.current}</strong> (need {obj.target})<br /></>}
                  Reward {obj.confidenceReward >= 0 ? '+' : ''}{obj.confidenceReward} / penalty {obj.confidencePenalty} to {obj.setBy}&apos;s confidence.
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-atext-mute leading-snug">
        Playing as <strong className="text-atext">{club?.short}</strong>
        {league ? ` · ${league.short} (Tier ${league.tier})` : ''}. Directors may message you after games — respond here. Formal meetings and votes are still to come.
      </p>
    </div>
  );
}

function CommitteeTab({ career, club, updateCareer }) {
  const committee = career.committee || [];
  if (committee.length === 0) {
    return (
      <div className={`${css.panel} p-12 text-center`}>
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
        <div className="text-sm text-atext-dim">{club.name} runs with a professional board, not a volunteer committee.</div>
      </div>
    );
  }
  const avg = committeeMoodAverage(committee);
  const accent = avg >= 70 ? '#4AE89A' : avg >= 40 ? 'var(--A-accent-2)' : '#E84A6F';
  const tripUsed = career.footyTripUsed;
  const tripAvailable = career.footyTripAvailable && !tripUsed;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>VOLUNTEER COMMITTEE</div>
          <div className="text-xs text-atext-dim">Five locals who keep the club running. They have opinions — and they&apos;ll tell you about them.</div>
        </div>
        <Stat label="Avg Mood" value={avg} accent={accent} icon={Users} />
      </div>

      {tripAvailable && (
        <FootyTripCard career={career} updateCareer={updateCareer} />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {committee.map(m => {
          const trait = COMMITTEE_TRAIT_INFO[m.trait] || {};
          const moodColor = m.mood >= 70 ? '#4AE89A' : m.mood >= 40 ? 'var(--A-accent-2)' : '#E84A6F';
          return (
            <div key={m.role} className={`${css.panel} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={css.label}>{m.role}</div>
                  <div className="font-bold text-atext leading-tight">{m.name}</div>
                </div>
                <div className="font-display text-2xl" style={{ color: moodColor }}>{m.mood}</div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
                <div className="h-full" style={{ width: `${m.mood}%`, background: `linear-gradient(90deg, ${moodColor}88, ${moodColor})` }} />
              </div>
              <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-1 font-mono">Loves</div>
              <div className="text-[11px] text-atext-dim mb-2 leading-snug">{trait.loves || ''}</div>
              <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-1 font-mono">Hates</div>
              <div className="text-[11px] text-atext-dim leading-snug">{trait.hates || ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COMMITTEE_TRAIT_INFO = {
  old_school: { loves: 'Hard-nosed defenders, loyalty, tradition',                 hates: 'Spending money on unknowns, dropping veterans' },
  cautious:   { loves: 'Sponsor deals, budget discipline, cost control',           hates: 'Overspending, expensive facilities, footy trips' },
  community:  { loves: 'Footy trips, post-match functions, community events',      hates: 'Being ignored, low crowd games' },
  loyal:      { loves: 'Players staying healthy, fitness drills, being consulted', hates: 'Medical-facility upgrades that make him feel replaced' },
  connected:  { loves: 'Local signings, youth development, community ties',        hates: 'Signing players from outside the zone, ignored tips' },
};

function FootyTripCard({ career, updateCareer }) {
  const social = (career.committee || []).find(m => m.role === 'Social Coordinator');
  const acceptTrip = (optionId) => {
    const result = applyFootyTrip(career, optionId);
    if (!result) return;
    const option = FOOTY_TRIP_OPTIONS.find(o => o.id === optionId);
    const news = [
      { week: career.week, type: 'committee', text: `🚌 Footy trip approved: ${option.label}. Cash -$${option.cost.toLocaleString()}, morale +${option.moraleGain}.` },
      ...result.news.map(n => ({ week: career.week, ...n })),
      ...(career.news || []),
    ].slice(0, 25);
    updateCareer({
      squad: result.squad,
      committee: result.committee,
      finance: { ...career.finance, cash: career.finance.cash - option.cost },
      footyTripUsed: true,
      footyTripAvailable: false,
      news,
    });
  };
  const declineTrip = () => {
    const committee = bumpCommitteeMood(career.committee, 'Social Coordinator', -8);
    updateCareer({
      committee,
      footyTripUsed: true,
      footyTripAvailable: false,
      news: [{ week: career.week, type: 'committee', text: `🚫 Footy trip cancelled this year due to budget constraints. ${social ? social.name + ' is disappointed.' : 'The players are disappointed.'}` }, ...(career.news || [])].slice(0, 25),
    });
  };
  return (
    <div className={`${css.panel} p-4`} style={{ borderColor: 'var(--A-accent)' }}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className={css.label}>Footy Trip Proposal</div>
          <div className="font-bold text-atext leading-tight">{social ? social.name : 'The Social Coordinator'} is proposing this year&apos;s footy trip.</div>
        </div>
        <button onClick={declineTrip} className={`${css.btnGhost} text-[10px] py-1.5 px-3`}>DECLINE</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mt-3">
        {FOOTY_TRIP_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => acceptTrip(opt.id)}
            className="text-left p-3 rounded-xl transition hover:border-aaccent"
            style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
            <div className="font-display text-lg text-aaccent">{opt.label.toUpperCase()}</div>
            <div className="text-[11px] text-atext-dim mb-2 leading-snug">{opt.blurb}</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="text-atext-mute">Cost</div><div className="text-aneg font-mono text-right">${opt.cost.toLocaleString()}</div>
              <div className="text-atext-mute">Morale</div><div className="text-[#4AE89A] font-mono text-right">+{opt.moraleGain}</div>
              <div className="text-atext-mute">Treasurer</div><div className="text-aneg font-mono text-right">{opt.treasurerHit}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HonoursTab({ career, club }) {
  const history = career.history || [];
  const titles  = history.filter(h => h.champion).length;
  const promotions = history.filter(h => h.promoted).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>HONOURS</div>
          <div className="text-xs text-atext-dim">Your career story, season by season.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Premierships" value={titles} accent="#FFD200" icon={Trophy} />
          <Stat label="Promotions" value={promotions} accent="#4AE89A" icon={ChevronsUp} />
          <Stat label="Seasons" value={history.length} accent="var(--A-accent)" icon={Calendar} />
        </div>
      </div>

      {history.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">Your career honour roll fills up after each season ends. Get to work.</div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
          <div className="overflow-x-auto">
          <div className="grid gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b min-w-[680px]"
            style={{gridTemplateColumns:"5rem 1fr 4rem 4rem 4rem 4rem 1fr 1fr",borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
            <div>Season</div>
            <div>League</div>
            <div className="text-center">Pos</div>
            <div className="text-center">W-L-D</div>
            <div className="text-center">Pts</div>
            <div className="text-center">%</div>
            <div>Top Scorer</div>
            <div>Brownlow</div>
          </div>
          {[...history].reverse().map((h, i) => (
            <div key={i} className="grid gap-2 px-4 py-3 text-sm items-center min-w-[680px]"
              style={{gridTemplateColumns:"5rem 1fr 4rem 4rem 4rem 4rem 1fr 1fr",borderBottom:"1px solid var(--A-line)"}}>
              <div className="font-display text-lg text-aaccent">{h.season}</div>
              <div>
                <span className="font-semibold">{h.leagueShort}</span>
                {h.champion && <Pill color="#FFD200">🏆 Premiers</Pill>}
                {h.promoted && <Pill color="#4AE89A">⬆ Promoted</Pill>}
                {h.relegated && <Pill color="#E84A6F">⬇ Relegated</Pill>}
              </div>
              <div className="text-center font-bold">{h.position}</div>
              <div className="text-center font-mono text-xs">{h.W}-{h.L}-{h.D}</div>
              <div className="text-center font-mono">{h.pts}</div>
              <div className="text-center font-mono text-xs">{h.pct}%</div>
              <div className="text-xs text-atext-dim truncate">{h.topScorer ? `${h.topScorer.name} · ${h.topScorer.goals}g` : '—'}</div>
              <div className="text-xs text-atext-dim truncate">{h.brownlow ? `${h.brownlow.name} · ${h.brownlow.votes}v` : '—'}</div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RookieListTab({ career, updateCareer }) {
  const rookies = career.squad.filter(p => p.rookie || p.age <= 19);
  const promote = (p) => {
    const newWage = Math.round((p.wage || 0) * 1.4);
    const wageDelta = newWage - (p.wage || 0);
    if (!canAffordSigning(career, wageDelta)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot promote ${p.firstName} ${p.lastName} — would breach the salary cap` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    updateCareer({
      squad: career.squad.map(x => x.id === p.id ? { ...x, rookie: false, wage: newWage } : x),
      news: [{ week: career.week, type: 'info', text: `📈 Promoted ${p.firstName} ${p.lastName} to senior list (${fmtK(newWage)}/yr)` }, ...(career.news || [])].slice(0, 20),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>ROOKIE LIST</div>
          <div className="text-xs text-atext-dim">Track your young talent. Promote when ready — wage rises 40% on elevation.</div>
        </div>
        <Stat label="Rookies" value={rookies.length} accent="#4ADBE8" icon={Sprout} />
      </div>
      {rookies.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Sprout className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">No rookies on your list. Draft or sign academy talent to start your pipeline.</div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
          {rookies.map((p, i) => (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center" style={{borderBottom:"1px solid var(--A-line)"}}>
              <div className="col-span-4 font-semibold text-sm">{p.firstName} {p.lastName} <span className="text-[10px] text-atext-dim ml-1">age {p.age}</span></div>
              <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
              <div className="col-span-1"><RatingDot value={p.overall} /></div>
              <div className="col-span-2 flex items-center gap-1 text-[11px]">
                <span className="text-atext-mute">POT</span>
                <span className="font-bold text-[#4AE89A]">{p.potential}</span>
              </div>
              <div className="col-span-2 text-xs text-atext-dim">{p.contract}yr · {fmtK(p.wage)}/yr</div>
              <div className="col-span-2 flex justify-end">
                {p.rookie
                  ? <button onClick={() => promote(p)} className={`${css.btnPrimary} text-xs px-3 py-1.5`}>Promote</button>
                  : <span className="text-[10px] text-atext-mute uppercase tracking-widest">Senior</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ career, updateCareer }) {
  const themeMode = career.themeMode || 'A';
  const autosave = career.options?.autosave !== false;
  const setTheme = (mode) => updateCareer({ themeMode: mode });
  const setAutosave = (v) => updateCareer({ options: { ...(career.options || {}), autosave: v } });
  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>SETTINGS</div>
        <div className="text-xs text-atext-dim">Tune the game's look and persistence to suit your vibe.</div>
      </div>

      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>VISUAL THEME</h3>
        <p className="text-xs text-atext-dim mb-4">Choose a palette for the UI. Your choice persists with the save.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'A', label: 'Broadcast Cinematic', sub: 'Warm cyan + slate. The default.' },
            { key: 'B', label: 'Stadium Carbon',      sub: 'Cool monochrome with green pop.' },
            { key: 'S', label: 'Stitch mockups',      sub: 'Neon lime on charcoal — Hub & Squad tuned to design refs.' },
          ].map(t => {
            const active = themeMode === t.key;
            return (
              <button key={t.key} onClick={() => setTheme(t.key)}
                className={`text-left p-4 rounded-2xl border transition-all ${active ? 'ring-2 ring-aaccent' : 'hover:border-aaccent/40'}`}
                style={{ background: active ? 'rgba(0,224,255,0.10)' : 'var(--A-panel-2)', borderColor: active ? 'var(--A-accent)' : 'var(--A-line)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-display text-2xl tracking-wide">DIRECTION {t.key}</div>
                  {active && <Pill color="var(--A-accent)">Active</Pill>}
                </div>
                <div className="font-semibold text-sm text-atext">{t.label}</div>
                <div className="text-xs text-atext-dim">{t.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>SAVE</h3>
        <p className="text-xs text-atext-dim mb-4">Autosave runs every event. Disable if you'd rather control saves manually from the sidebar.</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-sm">Autosave on advance</div>
            <div className="text-[11px] text-atext-dim">Saves the active slot after every event tick.</div>
          </div>
          <button onClick={() => setAutosave(!autosave)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition`}
            style={{
              background: autosave ? 'rgba(74,232,154,0.15)' : 'var(--A-panel-2)',
              color: autosave ? '#4AE89A' : 'var(--A-text-dim)',
              border: `1px solid ${autosave ? 'rgba(74,232,154,0.4)' : 'var(--A-line)'}`,
            }}>
            {autosave ? 'On' : 'Off'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FinancesTab({ career }) {
  const inc = incomeBreakdown(career);
  const exp = expenseBreakdown(career);
  const net = inc.grandTotal - exp.grandTotal;
  const wageCap = effectiveWageCap(career);
  const playerWages = currentPlayerWageBill(career);
  const wagePct = wageCap > 0 ? Math.min(150, Math.round((playerWages / wageCap) * 100)) : 0;
  const wageCapColor = wagePct >= 100 ? "#E84A6F" : wagePct >= 90 ? "var(--A-accent-2)" : wagePct >= 80 ? "var(--A-accent)" : "#4AE89A";
  const cfg = getDifficultyConfig(career.difficulty);
  const overflowPct = Math.round((cfg.capOverflow ?? 0) * 100);
  const crisis = career.cashCrisisLevel ?? 0;

  return (
    <div className="space-y-4">
      <div className="text-xs text-atext-dim -mt-1">
        Commercial income (broadcast, memberships, merch) tracks your ladder spot, fan mood, and stadium. Cash ticks on each new calendar day as you advance the schedule.
      </div>
      {/* Cash crisis banner */}
      {crisis > 0 && (
        <div className={`${css.panel} p-4 flex items-start gap-3`} style={{ borderColor: '#E84A6F', background: 'rgba(232,74,111,0.06)' }}>
          <AlertCircle className="w-5 h-5 text-[#E84A6F] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[#E84A6F] text-sm">CASH CRISIS · LEVEL {crisis}/4</div>
            <div className="text-xs text-atext-dim mt-1">{
              crisis === 1 ? 'Cash is in the red. Get back to black before the board steps in.' :
              crisis === 2 ? 'Emergency board meeting — a forced player sale is on the table.' :
              crisis === 3 ? 'Bank loan accepted. Sponsor pressure mounting.' :
                              'Insolvent. The board is preparing your termination.'
            }</div>
          </div>
        </div>
      )}

      {/* Top-line stats */}
      <div className="grid md:grid-cols-4 gap-3">
        <Stat label="Cash" value={fmtK(career.finance.cash)} accent={career.finance.cash >= 0 ? "#4AE89A" : "#E84A6F"} icon={DollarSign} />
        <Stat label="Annual Net (proj)" value={fmtK(net)} accent={net > 0 ? "#4AE89A" : "#E84A6F"} />
        <Stat label="Wage Bill" value={fmtK(playerWages + exp.staffWages)} sub="players + staff" accent="var(--A-accent)" />
        <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="#4ADBE8" />
      </div>

      {/* Salary cap with overflow indicator */}
      {wageCap > 0 && (
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className={`${css.h1} text-2xl`}>SALARY CAP</h3>
            <div className="flex items-center gap-3">
              {overflowPct !== 0 && (
                <Pill color={overflowPct > 0 ? '#4AE89A' : '#E84A6F'}>
                  {overflowPct > 0 ? `+${overflowPct}% headroom` : `${overflowPct}% tighter`}
                </Pill>
              )}
              <span className="text-xs font-bold" style={{ color: wageCapColor }}>{wagePct}% used</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-atext-dim mb-2">
            <span>Player wages: <span className="font-bold text-atext">{fmtK(playerWages)}</span></span>
            <span>Effective cap: <span className="font-bold text-atext">{fmtK(wageCap)}</span></span>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--A-panel-2)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, wagePct)}%`, background: wageCapColor }} />
          </div>
          <div className="text-xs text-atext-dim mt-2">
            {wagePct >= 100 ? '⚠️ Over the effective cap — board pressure rising' :
             wagePct >= 90  ? 'Cap stretched — careful with new signings' :
             wagePct >= 80  ? 'Cap tightening — plan ahead' :
                              `${fmtK(wageCap - playerWages)} of cap headroom available`}
          </div>
        </div>
      )}

      {/* Income / Expenses split */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>INCOME (ANNUAL)</h3>
          {[
            { label: "Broadcast / TV Rights", value: inc.broadcast,   color: "var(--A-accent)" },
            { label: "Gate Revenue",          value: inc.gate,        color: "#4ADBE8" },
            { label: "Membership",            value: inc.membership,  color: "#4AE89A" },
            { label: "Merchandise",           value: inc.merchandise, color: "var(--A-accent-2)" },
            { label: "Sponsorship",           value: inc.sponsors,    color: "#A78BFA" },
          ].map(r => (
            <div key={r.label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-atext">{r.label}</span>
                <span className="font-display text-lg" style={{ color: r.color }}>{fmtK(r.value)}</span>
              </div>
              <Bar value={inc.grandTotal > 0 ? (r.value / inc.grandTotal) * 100 : 0} color={r.color} />
            </div>
          ))}
          <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
            <span>Total income</span><span className="text-[#4AE89A]">{fmtK(inc.grandTotal)}</span>
          </div>
        </div>
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>EXPENSES (ANNUAL)</h3>
          {[
            { label: "Player Wages",      value: exp.playerWages, color: "#E84A6F" },
            { label: "Staff Wages",       value: exp.staffWages,  color: "var(--A-accent)" },
            { label: "Facilities Upkeep", value: exp.facilities,  color: "#4ADBE8" },
          ].map(r => (
            <div key={r.label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-atext">{r.label}</span>
                <span className="font-display text-lg" style={{ color: r.color }}>{fmtK(r.value)}</span>
              </div>
              <Bar value={exp.grandTotal > 0 ? (r.value / exp.grandTotal) * 100 : 0} color={r.color} />
            </div>
          ))}
          <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
            <span>Total expenses</span><span className="text-[#E84A6F]">{fmtK(exp.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Bank loan card */}
      {career.bankLoan && (
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-2`}>BANK LOAN</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div><div className={css.label}>Principal</div><div className="font-display text-2xl">{fmtK(career.bankLoan.principal)}</div></div>
            <div><div className={css.label}>Weeks left</div><div className="font-display text-2xl">{career.bankLoan.weeksRemaining}</div></div>
            <div><div className={css.label}>Interest / wk</div><div className="font-display text-2xl text-[#E84A6F]">{fmtK(career.bankLoan.interestPerWeek)}</div></div>
          </div>
        </div>
      )}

      {/* Weekly cashflow chart */}
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>CASH FLOW (BY CALENDAR WEEK)</h3>
        {(career.weeklyHistory || []).length === 0 ? (
          <div className="text-sm text-atext-dim py-8 text-center">No ledger entries yet — advance the schedule (each new day accrues operating cash).</div>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {career.weeklyHistory.map((w, i) => {
              const max = Math.max(...career.weeklyHistory.map(x => Math.abs(x.profit ?? 0)));
              const h = max === 0 ? 0 : (Math.abs(w.profit ?? 0) / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`Week ${w.week}: ${fmtK(w.profit)}`}>
                  <div className="w-full rounded-t" style={{ height: `${h}%`, background: (w.profit ?? 0) >= 0 ? "#4AE89A" : "#E84A6F", opacity: 0.85 }} />
                  <div className="text-[9px] text-atext-dim">R{w.week}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SponsorsTab({ career, updateCareer }) {
  const sponsorList = career.sponsors || [];
  const totalAnnual = sponsorList.reduce((a, s) => a + s.annualValue, 0);
  const proposals = career.sponsorRenewalProposals || [];
  const offers    = career.sponsorOffers || [];
  const expiredLastSeason = career.expiredSponsorsLastSeason || [];
  const cfg = getDifficultyConfig(career.difficulty);

  const drop = (sp) => updateCareer({ sponsors: sponsorList.filter(s => s.id !== sp.id) });
  const acceptRenewal = (proposal) => {
    const patch = applyRenewalAcceptance(career, proposal);
    updateCareer({
      ...patch,
      sponsorRenewalProposals: proposals.filter(p => p.sponsorId !== proposal.sponsorId),
      news: [{ week: career.week, type: 'win', text: `🤝 Renewed ${proposal.name} for ${proposal.proposedYears}y @ ${fmtK(proposal.proposedValue)}/yr` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const declineRenewal = (proposal) => {
    const patch = applyRenewalDecline(career, proposal);
    updateCareer({
      ...patch,
      sponsorRenewalProposals: proposals.filter(p => p.sponsorId !== proposal.sponsorId),
      news: [{ week: career.week, type: 'loss', text: `📉 Let ${proposal.name} walk — sponsor expired` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const acceptOffer = (offer) => {
    const patch = applySponsorOfferAcceptance(career, offer);
    updateCareer({
      ...patch,
      sponsorOffers: offers.filter(o => o.offerId !== offer.offerId),
      news: [{ week: career.week, type: 'win', text: `📈 New sponsor: ${offer.name} (${fmtK(offer.annualValue)}/yr, ${offer.yearsLeft}y)` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const declineOffer = (offer) => {
    updateCareer({ sponsorOffers: offers.filter(o => o.offerId !== offer.offerId) });
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="Total Annual" value={fmtK(totalAnnual)} accent="#4AE89A" />
        <Stat label="Active Deals" value={sponsorList.length} accent="var(--A-accent)" />
        <Stat label="Avg Deal" value={sponsorList.length ? fmtK(Math.round(totalAnnual/sponsorList.length)) : "—"} accent="#4ADBE8" />
        <Stat label="Sponsor x" value={`${cfg.sponsorMultiplier.toFixed(2)}×`} sub="difficulty" accent="var(--A-accent-2)" />
      </div>

      {expiredLastSeason.length > 0 && (
        <div className={`${css.panel} p-4`} style={{borderColor: '#E84A6F'}}>
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-[#E84A6F]" /><div className="font-bold text-sm">Lost last season</div></div>
          <div className="flex flex-wrap gap-2">
            {expiredLastSeason.map(s => (
              <Pill key={s.id} color="#E84A6F">{s.name} · {fmtK(s.annualValue)}/yr</Pill>
            ))}
          </div>
        </div>
      )}

      {proposals.length > 0 && (
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>RENEWAL PROPOSALS</h3>
          <p className="text-xs text-atext-dim mb-3">These deals expire at season end. Renew now or let them walk.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {proposals.map(p => {
              const delta = (p.proposedValue ?? 0) - (p.currentValue ?? 0);
              return (
                <div key={p.sponsorId} className={`${css.inset} p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-display text-xl">{p.name}</div>
                      <div className="text-[10px] text-atext-dim uppercase tracking-widest">{p.category} · {p.perf}</div>
                    </div>
                    <Pill color={delta >= 0 ? '#4AE89A' : '#E84A6F'}>{delta >= 0 ? '+' : ''}{fmtK(delta)}</Pill>
                  </div>
                  <div className="text-[11px] text-atext-dim mb-2">
                    Was {fmtK(p.currentValue)}/yr → propose <span className="font-bold text-atext">{fmtK(p.proposedValue)}/yr</span> for {p.proposedYears}y
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => declineRenewal(p)} className="text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10">Decline</button>
                    <button onClick={() => acceptRenewal(p)} className={`${css.btnPrimary} text-xs px-3 py-2`}>Accept Renewal</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {offers.length > 0 && (
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>NEW OFFERS</h3>
          <p className="text-xs text-atext-dim mb-3">Brands knocking on the door — performance-weighted by your finish.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {offers.map(o => (
              <div key={o.offerId} className={`${css.inset} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-display text-xl">{o.name}</div>
                    <div className="text-[10px] text-atext-dim uppercase tracking-widest">{o.category} · {o.type}</div>
                  </div>
                  <Pill color="var(--A-accent)">{o.yearsLeft}y</Pill>
                </div>
                <div className="text-[11px] text-atext-dim mb-2">Offer: <span className="font-bold text-[#4AE89A]">{fmtK(o.annualValue)}/yr</span></div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => declineOffer(o)} className="text-xs px-3 py-2 rounded-lg text-atext-mute hover:text-atext">Pass</button>
                  <button onClick={() => acceptOffer(o)} className={`${css.btnPrimary} text-xs px-3 py-2`}>Accept Deal</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${css.panel} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${css.h1} text-2xl`}>ACTIVE PARTNERS</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {sponsorList.length === 0 && (
            <div className="text-sm text-atext-dim md:col-span-2 text-center py-6">
              {offers.length > 0
                ? 'No signed sponsors yet — see NEW OFFERS below.'
                : 'No active sponsors. More offers arrive after results and at season end.'}
            </div>
          )}
          {sponsorList.map(s => (
            <div key={s.id} className={`${css.inset} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-2xl">{s.name}</div>
                  <div className="text-[10px] text-atext-dim uppercase tracking-widest">{s.category} • {s.type}</div>
                </div>
                <Pill color={s.yearsLeft <= 1 ? '#FFB347' : 'var(--A-accent)'}>{s.yearsLeft}y left</Pill>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-[10px] text-atext-dim uppercase tracking-widest">Annual Value</div>
                  <div className="font-display text-3xl text-[#4AE89A]">{fmtK(s.annualValue)}</div>
                </div>
                <button onClick={()=>drop(s)} className="text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10">Drop</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// KITS TAB
// ============================================================================
function KitsTab({ career, club, updateCareer }) {
  const [editing, setEditing] = useState("home");
  const kit = career.kits[editing];
  const PATTERNS = [
    { key: "solid", label: "Solid" },
    { key: "stripes", label: "Stripes" },
    { key: "v", label: "V-Yoke" },
    { key: "sash", label: "Sash" },
    { key: "yoke", label: "Yoke" },
  ];
  const updateKit = (field, value) => {
    updateCareer({ kits: { ...career.kits, [editing]: { ...career.kits[editing], [field]: value } } });
  };
  const resetToClubColors = () => {
    updateCareer({ kits: { ...career.kits, [editing]: defaultKits(club.colors)[editing] } });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>KIT DESIGNER</div>
          <div className="text-xs text-atext-dim">Customise your club's three jerseys. Live preview updates as you tweak.</div>
        </div>
        <div className="flex gap-2">
          {["home","away","clash"].map(k => (
            <button key={k} onClick={()=>setEditing(k)} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${editing===k ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{k}</button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* PREVIEW */}
        <div className={`${css.panel} p-6 flex flex-col items-center justify-center lg:col-span-1`}>
          <div className={css.label}>Preview · {editing}</div>
          <div className="my-4 p-4 bg-gradient-to-br from-apanel-2 to-apanel rounded-2xl">
            <Jersey kit={kit} size={220} />
          </div>
          <div className="flex gap-2 text-[10px] uppercase tracking-wider text-atext-dim">
            <span>{kit.pattern}</span>·
            <span style={{color: kit.primary}}>●</span>
            <span style={{color: kit.secondary}}>●</span>
            <span style={{color: kit.accent}}>●</span>
          </div>
          <button onClick={resetToClubColors} className={`${css.btnGhost} mt-4 text-xs`}>Reset to club colours</button>
        </div>

        {/* CONTROLS */}
        <div className={`${css.panel} p-6 lg:col-span-2 space-y-5`}>
          <div>
            <div className={css.label}>Pattern</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {PATTERNS.map(p => (
                <button key={p.key} onClick={()=>updateKit("pattern", p.key)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${kit.pattern===p.key ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{p.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {field:"primary", label:"Primary"},
              {field:"secondary", label:"Secondary"},
              {field:"accent", label:"Accent"},
              {field:"numberColor", label:"Number"},
            ].map(c => (
              <div key={c.field}>
                <div className={css.label}>{c.label}</div>
                <div className="flex items-center gap-3 mt-2">
                  <input type="color" value={kit[c.field]} onChange={e=>updateKit(c.field, e.target.value)} className="w-14 h-14 rounded-lg border border-aline bg-transparent cursor-pointer" />
                  <input type="text" value={kit[c.field]} onChange={e=>updateKit(c.field, e.target.value)} className="flex-1 bg-apanel border border-aline rounded-lg px-3 py-2 text-sm font-mono text-atext" />
                </div>
              </div>
            ))}
          </div>

          <div className={`${css.inset} p-4`}>
            <div className={css.label}>Quick Palettes</div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                ["#0E1A40","#FFFFFF","#FFD200"],
                ["#7A0019","#FDB930","#003E80"],
                ["#000000","#FFD200","#FF0000"],
                ["#003F87","#FFFFFF","#E21937"],
                ["#4D2004","#FBBF15","#FFFFFF"],
                ["#2A0D54","#FFFFFF","var(--A-accent)"],
                ["#008AAB","#000000","#FFFFFF"],
                ["#0F1131","#CC2031","#FFFFFF"],
              ].map((pal,i) => (
                <button key={i} onClick={()=>updateCareer({kits:{...career.kits,[editing]:{...career.kits[editing], primary:pal[0], secondary:pal[1], accent:pal[2]}}})} className="h-10 rounded-lg overflow-hidden flex border border-aline hover:border-[var(--A-accent)] transition">
                  <div style={{background:pal[0]}} className="flex-1" />
                  <div style={{background:pal[1]}} className="flex-1" />
                  <div style={{background:pal[2]}} className="flex-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All three kits row */}
      <div className={`${css.panel} p-6`}>
        <div className={css.label}>Full kit set</div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          {["home","away","clash"].map(k => (
            <div key={k} className={`${css.inset} p-4 flex flex-col items-center cursor-pointer hover:border-[var(--A-accent)] transition`} onClick={()=>setEditing(k)}>
              <Jersey kit={career.kits[k]} size={120} />
              <div className="mt-2 text-xs uppercase tracking-wider text-atext-dim">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FACILITIES TAB
// ============================================================================
function FacilitiesTab({ career, updateCareer }) {
  const FAC_INFO = {
    trainingGround: { name: "Training Ground", icon: Activity, desc: "Improves training effectiveness and skill development", color: "#4ADBE8" },
    gym: { name: "Strength & Conditioning", icon: Dumbbell, desc: "Boosts player strength, speed and endurance gains", color: "var(--A-accent)" },
    medical: { name: "Medical Centre", icon: Heart, desc: "Reduces injury rate, faster recovery from knocks", color: "#E84A6F" },
    academy: { name: "Youth Academy", icon: GraduationCap, desc: "Better youth recruits and development progression", color: "#4AE89A" },
    stadium: { name: "Stadium", icon: Building2, desc: "Higher capacity = bigger gate revenue & sponsor pull", color: "#FFD200" },
    recovery: { name: "Recovery Centre", icon: Sparkles, desc: "Faster fitness recovery between matches", color: "#A78BFA" },
  };
  const upgrade = (key) => {
    const f = career.facilities[key];
    if (f.level >= f.max) return;
    const cost = f.cost * f.level;
    if (career.finance.cash < cost) return;
    const nextLevel = f.level + 1;
    const payload = {
      facilities: { ...career.facilities, [key]: { ...f, level: nextLevel } },
      finance: { ...career.finance, cash: career.finance.cash - cost },
      news: [{ week: career.week, type: "info", text: `📈 Upgraded ${FAC_INFO[key].name} to Level ${nextLevel}` }, ...career.news].slice(0, 15),
    };
    if (key === "stadium") {
      const lg = findLeagueOf(career.clubId);
      const cg = getClubGround(findClub(career.clubId), nextLevel, lg?.tier ?? 2);
      payload.clubGround = cg;
      payload.groundName = cg.shortName;
    }
    updateCareer(payload);
  };
  const totalLevel = Object.values(career.facilities).reduce((a,b)=>a+b.level,0);
  const maxTotal = Object.values(career.facilities).reduce((a,b)=>a+b.max,0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>FACILITIES</div>
          <div className="text-xs text-atext-dim">Long-term investment. Effects compound across the season.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Overall Rating" value={`${totalLevel}/${maxTotal}`} accent="#4ADBE8" />
          <Stat label="Cash" value={fmtK(career.finance.cash)} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(career.facilities).map(([key, f]) => {
          const info = FAC_INFO[key];
          const Icon = info.icon;
          const cost = f.cost * f.level;
          const canAfford = career.finance.cash >= cost;
          const maxed = f.level >= f.max;
          return (
            <div key={key} className={`${css.panel} p-5`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${info.color}1A`, border: `1px solid ${info.color}44` }}>
                  <Icon className="w-7 h-7" style={{ color: info.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold tracking-wide">{info.name}</div>
                    <div className={`${css.num} text-2xl`} style={{color: info.color}}>{f.level}<span className="text-sm text-atext-dim">/{f.max}</span></div>
                  </div>
                  <div className="text-[11px] text-atext-dim mt-1">{info.desc}</div>
                  <div className="flex gap-1 mt-3">
                    {Array.from({length: f.max}).map((_,i) => (
                      <div key={i} className="flex-1 h-2 rounded-full" style={{ background: i < f.level ? info.color : "var(--A-line)" }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-atext-dim">
                      {maxed ? <span className="text-[#4AE89A]">⭐ Max level</span> : <>Upgrade: <span className={canAfford ? "text-atext font-bold" : "text-[#E84A6F] font-bold"}>${(cost/1000).toFixed(0)}k</span></>}
                    </div>
                    <button onClick={()=>upgrade(key)} disabled={maxed||!canAfford} className={maxed||!canAfford ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-xs px-3 py-1.5`}>
                      {maxed ? "Maxed" : "Upgrade"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// STAFF TAB
// ============================================================================
function StaffTab({ career, updateCareer }) {
  const leagueTier = PYRAMID[career.leagueKey]?.tier || 1;
  const replaceStaff = (idx) => {
    const old = career.staff[idx];
    seedRng(Date.now() % 100000 + idx);
    const newRating = clamp(old.rating + rand(-8, 14), 35, 95);
    let newWage;
    if (old.volunteer) newWage = 0;
    else if (leagueTier === 3 && old.id === 's1') newWage = Math.round((newRating / 75) * 35000);
    else newWage = Math.round((newRating / 75) * 80000);
    const newStaff = [...career.staff];
    newStaff[idx] = {
      ...old,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      rating: newRating,
      wage: newWage,
      volunteer: !!old.volunteer,
      contract: rand(1, 3),
    };
    updateCareer({
      staff: newStaff,
      news: [{ week: career.week, type: "info", text: `🤝 Hired new ${old.role}: ${newStaff[idx].name} (${newRating} OVR)` }, ...career.news].slice(0,15),
    });
  };
  const totalWage = career.staff.reduce((a,s)=>a+s.wage,0);
  const avgRating = Math.round(career.staff.reduce((a,s)=>a+s.rating,0) / career.staff.length);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>STAFF</div>
          <div className="text-xs text-atext-dim">Your support team shapes training outcomes, recruitment quality and player development.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Avg Rating" value={avgRating} accent="#4AE89A" />
          <Stat label="Annual Wages" value={fmtK(totalWage)} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Rating</div>
          <div className="col-span-1 text-center">Years</div>
          <div className="col-span-2 text-right">Wage</div>
          <div className="col-span-1"></div>
        </div>
        {career.staff.map((s, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid var(--A-line)"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,224,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div className="col-span-3 font-semibold text-sm">{s.name}</div>
            <div className="col-span-3 text-sm text-atext-dim">{s.role}</div>
            <div className="col-span-2 flex items-center gap-2">
              <RatingDot value={s.rating} />
              <Bar value={s.rating} small />
            </div>
            <div className="col-span-1 text-center text-sm">{s.contract}y</div>
            <div className="col-span-2 text-right text-sm font-mono">{s.volunteer ? <span className="text-[#4AE89A]">Volunteer</span> : `$${(s.wage/1000).toFixed(0)}k`}</div>
            <div className="col-span-1 flex justify-end">
              <button onClick={()=>replaceStaff(idx)} className="text-xs px-3 py-1.5 rounded-lg border border-aline hover:border-[var(--A-accent)] hover:text-aaccent transition">Replace</button>
            </div>
          </div>
        ))}
      </div>

      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Replacing a staff member rolls a new candidate. Volunteers at local level are unpaid; senior coach is usually a small part-time stipend. Higher ratings still improve training.
      </div>
    </div>
  );
}

// ============================================================================
// RECRUIT SCREEN — Trade / Draft / Youth / Local
// ============================================================================
function RecruitScreen({ career, club, updateCareer, tab, setTab }) {
  const offerCount = (career.pendingTradeOffers || []).filter(o => o.status === 'pending').length;
  const inTradePeriod = career.postSeasonPhase === 'trade_period' && career.inTradePeriod;
  const showPicks = !!career.draftPickBank;
  const t = tab || (offerCount > 0 ? "offers" : "trade");
  const tabs = [
    { key: "offers", label: `Offers${offerCount ? ` (${offerCount})` : ''}`, icon: Newspaper },
    ...(inTradePeriod ? [{ key: "freeagents", label: career.freeAgencyOpen ? "Free agents" : "Free agents (closed)", icon: UserPlus }] : []),
    ...(showPicks ? [{ key: "picks", label: "Draft picks", icon: FileText }] : []),
    { key: "trade", label: inTradePeriod ? "Player market" : "Trades", icon: Repeat },
    { key: "draft", label: "Draft", icon: Award },
    { key: "youth", label: "Youth Academy", icon: GraduationCap },
    { key: "local", label: "Local Football", icon: Map },
  ];
  return (
    <div className="anim-in">
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "offers" && <OffersTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "freeagents" && (inTradePeriod ? <FreeAgentsTab career={career} club={club} updateCareer={updateCareer} /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>Free agency runs during the post-season Trade Period (after the grand final).</div>
      ))}
      {t === "picks" && (showPicks ? <DraftPickBankTab career={career} /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>Draft capital is prepared when the Trade Period opens.</div>
      ))}
      {t === "trade" && <TradeTab career={career} updateCareer={updateCareer} />}
      {t === "draft" && <DraftTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "youth" && <YouthTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "local" && <LocalTab career={career} club={club} updateCareer={updateCareer} />}
    </div>
  );
}

function DraftPickBankTab({ career }) {
  const bank = career.draftPickBank || {};
  const years = Object.keys(bank).sort();
  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>DRAFT CAPITAL</div>
        <div className="text-xs text-atext-dim">Selections tied to your club for the next three national drafts. Compensation picks are not tradeable.</div>
      </div>
      {years.length === 0 ? (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>No pick bank loaded.</div>
      ) : (
        years.map((y) => (
          <div key={y} className={`${css.panel} p-4`}>
            <div className="font-display text-lg text-aaccent mb-2">Season {y}</div>
            <div className="space-y-2">
              {(bank[y] || []).map((p) => (
                <div key={p.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-aline pb-2 last:border-0">
                  <span>Round {p.round} · pick #{p.selection}</span>
                  <span className="text-atext-dim">{p.type === 'compensation' ? 'Compensation (NT)' : 'Tradeable'}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FreeAgentsTab({ career, updateCareer }) {
  const pool = career.offSeasonFreeAgents || [];
  const wageCap = effectiveWageCap(career);
  const sign = (fa) => {
    if (!career.freeAgencyOpen) return;
    if (career.squad.length >= 40) return;
    if (career.finance.transferBudget < fa.value * 0.35) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ Not enough transfer budget to sign ${fa.firstName} ${fa.lastName}.` }, ...(career.news || [])].slice(0, 15) });
      return;
    }
    if (!canAffordSigning(career, fa.wageAsk)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ Cap won’t fit ${fa.firstName} ${fa.lastName} at ${fmtK(fa.wageAsk)}/yr.` }, ...(career.news || [])].slice(0, 15) });
      return;
    }
    const fee = Math.round(fa.value * 0.35);
    const signingBonus = Math.round(fa.value * 0.05);
    const newPlayer = {
      id: `fa_sign_${Date.now()}_${rand(1e9, 2e9 - 1)}`,
      firstName: fa.firstName,
      lastName: fa.lastName,
      position: fa.position,
      age: fa.age,
      overall: fa.overall,
      potential: fa.potential ?? fa.overall + 5,
      value: fa.value,
      wage: fa.wageAsk,
      contract: fa.contractYearsAsk,
      attrs: fa.attrs,
      trueRating: fa.trueRating ?? fa.overall,
      tier: fa.tier ?? leagueTierOf(career),
      fitness: 92,
      form: 72,
      goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0, suspended: 0, morale: 78,
      receivedInTrade: null,
      seasonsAtClub: 0,
    };
    const bal = { ...(career.freeAgentBalance || { gained: 0, lost: 0 }), gained: (career.freeAgentBalance?.gained || 0) + 1 };
    updateCareer({
      squad: [...career.squad, newPlayer],
      offSeasonFreeAgents: pool.filter((x) => x.id !== fa.id),
      finance: {
        ...career.finance,
        transferBudget: career.finance.transferBudget - fee,
        cash: career.finance.cash - signingBonus,
      },
      freeAgentBalance: bal,
      news: [{ week: career.week, type: 'win', text: `✍️ Free agency: signed ${fa.firstName} ${fa.lastName} — ${fa.contractYearsAsk}yr @ ${fmtK(fa.wageAsk)}/yr` }, ...(career.news || [])].slice(0, 20),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>FREE AGENTS</div>
          <div className="text-xs text-atext-dim">Out-of-contract players movement through Day 7 of the Trade Period.</div>
        </div>
        {!career.freeAgencyOpen && (
          <Pill color="#64748B">Window closed — list-only trades until Day 14</Pill>
        )}
      </div>
      <div className={`${css.panel} p-4 text-xs text-atext-dim`}>
        Cap room: {wageCap > 0 ? fmtK(Math.max(0, wageCap - currentPlayerWageBill(career))) : '—'} · Transfer budget {fmtK(career.finance.transferBudget)}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--A-line)', background: 'var(--A-panel)' }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{ borderColor: 'var(--A-line)', background: 'var(--A-panel-2)' }}>
          <div className="col-span-4">Player</div>
          <div className="col-span-2">Pos</div>
          <div className="col-span-2">OVR</div>
          <div className="col-span-2 text-right">Ask</div>
          <div className="col-span-2 text-right"></div>
        </div>
        {pool.length === 0 ? (
          <div className="p-8 text-center text-sm text-atext-dim">No listings left this off-season.</div>
        ) : (
          pool.map((fa) => (
            <div key={fa.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm" style={{ borderBottom: '1px solid var(--A-line)' }}>
              <div className="col-span-4">
                <div className="font-semibold">{fa.firstName} {fa.lastName}</div>
                <div className="text-[10px] text-atext-dim">{fa.freeAgentType || 'UFA'} · age {fa.age}</div>
              </div>
              <div className="col-span-2"><Pill color="#4ADBE8">{fa.position}</Pill></div>
              <div className="col-span-2"><RatingDot value={fa.overall} /></div>
              <div className="col-span-2 text-right font-mono text-xs">{fmtK(fa.wageAsk)}/yr · {fa.contractYearsAsk}y</div>
              <div className="col-span-2 text-right">
                <button
                  type="button"
                  disabled={!career.freeAgencyOpen}
                  onClick={() => sign(fa)}
                  className={career.freeAgencyOpen ? `${css.btnPrimary} text-xs px-3 py-1.5` : 'px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute'}
                >
                  Sign
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OffersTab({ career, club, updateCareer }) {
  const offers = (career.pendingTradeOffers || []).filter(o => o.status === 'pending');
  const finance = career.finance;

  const acceptOffer = (offer) => {
    const targetPlayer = career.squad.find(p => p.id === offer.targetPlayerId);
    if (!targetPlayer) return;
    if (playerBlockedFromTrade(targetPlayer, career.season)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ ${targetPlayer.firstName} ${targetPlayer.lastName} can't be traded until next season (recently arrived).` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    const incomingPlayer = offer.offerPlayerSnapshot
      ? { ...offer.offerPlayerSnapshot, id: `incoming_${Date.now()}`, fitness: 90, form: 70, contract: 2, attrs: targetPlayer.attrs, potential: offer.offerPlayerSnapshot.overall + 4, trueRating: offer.offerPlayerSnapshot.overall, goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0, suspended: 0, morale: 75,
          receivedInTrade: career.season, seasonsAtClub: 0 }
      : null;
    // Cap check: if a swap player is incoming, ensure their wage fits after target leaves
    if (incomingPlayer) {
      const wageDelta = (incomingPlayer.wage ?? 0) - (targetPlayer.wage ?? 0);
      if (!canAffordSigning(career, wageDelta)) {
        updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Trade rejected — bringing in ${incomingPlayer.firstName} ${incomingPlayer.lastName} would breach the cap` }, ...(career.news || [])].slice(0, 20) });
        return;
      }
    }
    const newSquad = career.squad.filter(p => p.id !== offer.targetPlayerId);
    if (incomingPlayer) newSquad.push(incomingPlayer);
    // Remove swap player from AI squad (if any)
    const newAiSquads = { ...(career.aiSquads || {}) };
    if (offer.offerPlayerId && newAiSquads[offer.fromClubId]) {
      newAiSquads[offer.fromClubId] = newAiSquads[offer.fromClubId].filter(p => p.id !== offer.offerPlayerId);
      // Add the player we sold to their squad
      newAiSquads[offer.fromClubId] = [...newAiSquads[offer.fromClubId], targetPlayer];
    }
    updateCareer({
      squad: newSquad,
      lineup: career.lineup.filter(id => id !== offer.targetPlayerId),
      aiSquads: newAiSquads,
      finance: { ...finance, cash: finance.cash + offer.offerCash, transferBudget: finance.transferBudget + Math.round(offer.offerCash * 0.4) },
      pendingTradeOffers: (career.pendingTradeOffers || []).map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o),
      news: [{
        week: career.week,
        type: 'info',
        text: `🤝 Trade complete: ${targetPlayer.firstName} ${targetPlayer.lastName} → ${offer.fromClubName} for ${fmtK(offer.offerCash)}${incomingPlayer ? ` + ${incomingPlayer.firstName} ${incomingPlayer.lastName}` : ''}`,
      }, ...(career.news || [])].slice(0, 20),
    });
  };

  const rejectOffer = (offer) => {
    updateCareer({
      pendingTradeOffers: (career.pendingTradeOffers || []).map(o => o.id === offer.id ? { ...o, status: 'rejected' } : o),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>TRADE OFFERS</div>
          <div className="text-xs text-atext-dim">Rival clubs are circling. Accept, reject — or let the window close.</div>
        </div>
        <Stat label="Pending" value={offers.length} accent="var(--A-accent-2)" />
      </div>

      {offers.length === 0 ? (
        <div className={`${css.panel} p-12 text-center text-sm text-atext-dim`}>
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No active offers right now. Wait for the trade window or check back after key events.
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => {
            const player = career.squad.find(p => p.id === offer.targetPlayerId);
            if (!player) return null;
            return (
              <div key={offer.id} className={`${css.panel} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-aaccent">{offer.fromClubName} offers</div>
                    <div className="font-display text-2xl text-atext mt-1">{fmtK(offer.offerCash)}{offer.offerPlayerSnapshot ? ` + ${offer.offerPlayerSnapshot.firstName} ${offer.offerPlayerSnapshot.lastName}` : ''}</div>
                    {offer.offerPlayerSnapshot && (
                      <div className="text-xs text-atext-dim mt-1">{offer.offerPlayerSnapshot.position} · {offer.offerPlayerSnapshot.overall} OVR · age {offer.offerPlayerSnapshot.age}</div>
                    )}
                  </div>
                  <ArrowRight className="w-6 h-6 text-aaccent" />
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-dim">For</div>
                    <div className="font-display text-2xl text-atext mt-1">{player.firstName} {player.lastName}</div>
                    <div className="text-xs text-atext-dim mt-1">{player.position} · {player.overall} OVR · age {player.age} · {fmtK(player.wage)}/yr</div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => rejectOffer(offer)} className="px-4 py-2 rounded-lg text-xs font-bold bg-apanel-2 text-atext-dim hover:bg-aline">Reject</button>
                  <button onClick={() => acceptOffer(offer)} className={`${css.btnPrimary} text-xs px-4 py-2`}>Accept Trade</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TradeTab({ career, updateCareer }) {
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("overall");
  const [capOnly, setCapOnly] = useState(false);
  const [negotiating, setNegotiating] = useState(null); // { playerId, wage, years, counterUsed }
  const pool = career.tradePool || [];
  const wageCap = effectiveWageCap(career);
  const currentWages = currentPlayerWageBill(career);
  const headroom = Math.max(0, wageCap - currentWages);

  const filtered = pool.filter(p => {
    if (filter !== "ALL" && !playerHasPosition(p, filter)) return false;
    if (capOnly && wageCap > 0 && !canAffordSigning(career, p.wage)) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "overall") return b.overall - a.overall;
    if (sortBy === "value") return b.value - a.value;
    if (sortBy === "age") return a.age - b.age;
    if (sortBy === "wage") return (a.wage || 0) - (b.wage || 0);
    if (sortBy === "potential") return (b.potential || 0) - (a.potential || 0);
    return 0;
  });

  const openNegotiation = (p) => {
    const demandedWage  = Math.round(p.wage * (1.05 + rng() * 0.2));
    const demandedYears = rand(1, 3);
    setNegotiating({ playerId: p.id, wage: demandedWage, years: demandedYears, counterUsed: false });
  };

  const acceptDeal = (p) => {
    if (career.finance.transferBudget < p.value) return;
    if (career.squad.length >= 40) return;
    if (!canAffordSigning(career, negotiating.wage)) return;
    const signedPlayer = { ...p, id: Date.now() + rand(0, 999_999), wage: negotiating.wage, contract: negotiating.years, receivedInTrade: null, seasonsAtClub: 0 };
    // Spec Phase 2: trades come out of the transfer budget only; signing-on bonus = 5% of value from cash.
    const signingBonus = Math.round(p.value * 0.05);
    updateCareer({
      squad: [...career.squad, signedPlayer],
      tradePool: pool.filter(x => x.id !== p.id),
      finance: { ...career.finance, transferBudget: career.finance.transferBudget - p.value, cash: career.finance.cash - signingBonus },
      news: [{ week: career.week, type: "win", text: `🤝 Signed ${p.firstName} ${p.lastName} (${p.overall} OVR) — ${negotiating.years}yr @ ${fmtK(negotiating.wage)}/yr` }, ...career.news].slice(0,15),
    });
    setNegotiating(null);
  };

  const counterOffer = (p) => {
    if (negotiating.counterUsed) return;
    const counterWage = Math.round(negotiating.wage * 0.88);
    const success = rng() < 0.65;
    if (success) {
      setNegotiating({ ...negotiating, wage: counterWage, counterUsed: true });
    } else {
      setNegotiating(null);
      updateCareer({ news: [{ week: career.week, type: "info", text: `❌ ${p.firstName} ${p.lastName} rejected your counter-offer and walked away` }, ...career.news].slice(0,15) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>TRADE MARKET</div>
          <div className="text-xs text-atext-dim">Players currently available across the league pyramid.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="#4ADBE8" />
          <Stat label="Cap headroom" value={fmtK(headroom)} accent={headroom > 0 ? "#4AE89A" : "#E84A6F"} />
          <Stat label="Squad Size" value={`${career.squad.length}/40`} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-atext-dim uppercase tracking-wider">Position:</span>
        {["ALL", ...POSITIONS].map(pos => (
          <button key={pos} onClick={()=>setFilter(pos)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter===pos ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{pos}</button>
        ))}
        <label className="flex items-center gap-2 text-[11px] text-atext-dim cursor-pointer ml-2">
          <input type="checkbox" checked={capOnly} onChange={e => setCapOnly(e.target.checked)} className="rounded border-aline" />
          Fits cap (listed wage)
        </label>
        <span className="ml-4 text-xs text-atext-dim uppercase tracking-wider">Sort:</span>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="bg-apanel-2 border border-aline rounded-lg px-3 py-1.5 text-xs text-atext">
          <option value="overall">Overall</option>
          <option value="value">Value</option>
          <option value="age">Age</option>
          <option value="wage">Listed wage</option>
          <option value="potential">Potential</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-x-auto" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b grid min-w-[720px]" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)", gridTemplateColumns:"minmax(120px,1.1fr) 2.5rem 2rem 2.5rem 2.5rem minmax(56px,0.7fr) minmax(64px,0.9fr) minmax(56px,0.7fr) 4rem 3.5rem"}}>
          <div>Player</div>
          <div>Ps</div>
          <div>Ag</div>
          <div>OVR</div>
          <div>Pot</div>
          <div>Club</div>
          <div className="text-right">Fee</div>
          <div className="text-right">Wage</div>
          <div className="text-center">Cap</div>
          <div></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto min-w-[720px]">
          {sorted.map(p => {
            const canAfford = career.finance.transferBudget >= p.value;
            const capRoom = wageCap - currentWages;
            const isNeg = negotiating?.playerId === p.id;
            const capBlock = negotiating && isNeg && (currentWages + negotiating.wage > wageCap);
            const fitsListWage = wageCap <= 0 || canAffordSigning(career, p.wage);
            return (
              <div key={p.id}>
                <div className="gap-2 px-4 py-3 items-center transition-colors grid min-w-[720px]" style={{borderBottom: isNeg ? "none" : "1px solid var(--A-line)", gridTemplateColumns:"minmax(120px,1.1fr) 2.5rem 2rem 2.5rem 2.5rem minmax(56px,0.7fr) minmax(64px,0.9fr) minmax(56px,0.7fr) 4rem 3.5rem"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,224,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div>
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-atext-dim">Ask · {fmtK(p.wage)}/yr</div>
                  </div>
                  <div><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                  <div className="text-sm text-center">{p.age}</div>
                  <div className="flex justify-center"><RatingDot value={p.overall} /></div>
                  <div className="text-sm text-center text-[#4AE89A]">{p.potential}</div>
                  <div className="text-[10px] text-atext-dim truncate" title={p.fromClub}>{p.fromClub}</div>
                  <div className="text-right text-sm font-mono font-bold" style={{color: canAfford ? "#4AE89A" : "#E84A6F"}}>{fmtK(p.value)}</div>
                  <div className="text-right text-xs font-mono text-atext-dim">{fmtK(p.wage)}</div>
                  <div className="flex justify-center">
                    {wageCap <= 0 ? (
                      <Pill color="#64748B">—</Pill>
                    ) : fitsListWage ? (
                      <Pill color="#4AE89A">OK</Pill>
                    ) : (
                      <Pill color="#E84A6F">No</Pill>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {isNeg
                      ? <button onClick={()=>setNegotiating(null)} className="text-xs text-atext-mute hover:text-atext-dim px-2 py-1">✕</button>
                      : <button onClick={()=>canAfford ? openNegotiation(p) : null} disabled={!canAfford} className={canAfford ? `${css.btnPrimary} text-xs px-3 py-1.5` : "px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute"}>{canAfford ? "Negotiate" : "Too dear"}</button>
                    }
                  </div>
                </div>
                {isNeg && (
                  <div className="mx-4 mb-3 rounded-xl p-4" style={{background:"#F0FDF4", border:"1px solid #BBF7D0"}}>
                    <div className="text-xs font-bold text-[#166534] mb-2">📋 {p.firstName} {p.lastName}'s demands</div>
                    <div className="flex gap-6 mb-3">
                      <div>
                        <div className="text-[10px] text-atext-dim uppercase tracking-wider">Wage demand</div>
                        <div className="font-display text-xl text-atext">{fmtK(negotiating.wage)}<span className="text-sm font-sans">/yr</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-atext-dim uppercase tracking-wider">Contract length</div>
                        <div className="font-display text-xl text-atext">{negotiating.years}<span className="text-sm font-sans"> yr</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-atext-dim uppercase tracking-wider">Cap room after</div>
                        <div className={`font-display text-xl ${capBlock ? 'text-[#E84A6F]' : 'text-[#4AE89A]'}`}>{fmtK(capRoom - negotiating.wage)}</div>
                      </div>
                    </div>
                    {capBlock && <div className="text-xs text-[#E84A6F] mb-2">⚠️ Signing this player would exceed your salary cap.</div>}
                    <div className="flex gap-2">
                      <button onClick={()=>acceptDeal(p)} disabled={capBlock} className={capBlock ? "px-4 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-xs px-4 py-2`}>
                        ✅ Accept deal
                      </button>
                      {!negotiating.counterUsed && (
                        <button onClick={()=>counterOffer(p)} className="px-4 py-2 rounded-lg text-xs font-bold border" style={{background:"rgba(255,179,71,0.10)", color:"var(--A-accent-2)", borderColor:"rgba(255,179,71,0.30)"}}>
                          🔄 Counter (−12%)
                        </button>
                      )}
                      {negotiating.counterUsed && (
                        <span className="px-4 py-2 text-xs text-atext-mute">Counter used — accept or walk away</span>
                      )}
                      <button onClick={()=>setNegotiating(null)} className="px-4 py-2 rounded-lg text-xs font-bold bg-apanel-2 text-atext-dim hover:bg-aline">
                        Walk away
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {sorted.length === 0 && <div className="p-8 text-center text-sm text-atext-dim">No players match the filter. Try widening your search.</div>}
        </div>
      </div>
    </div>
  );
}

function DraftTab({ career, club, updateCareer }) {
  const [posFilter, setPosFilter] = useState("ALL");
  const [poolSort, setPoolSort] = useState("overall");
  const draftOrder = career.draftOrder || [];
  const myPickIndex = draftOrder.findIndex(d => d.clubId === career.clubId && !d.used);
  const myNextPick = myPickIndex >= 0 ? draftOrder[myPickIndex] : null;
  const isMyTurn = myPickIndex !== -1 && myPickIndex === draftOrder.findIndex(d => !d.used);
  const dTier = leagueTierOf(career);

  const basePool = useMemo(() => {
    let arr = [...(career.draftPool || [])];
    if (posFilter !== "ALL") arr = arr.filter(p => playerHasPosition(p, posFilter));
    arr.sort((a, b) => {
      if (poolSort === "overall") return b.overall - a.overall;
      if (poolSort === "potential") return (b.potential || 0) - (a.potential || 0);
      if (poolSort === "wageFit") return rookieDraftWage(a.overall, dTier) - rookieDraftWage(b.overall, dTier);
      return b.overall - a.overall;
    });
    return arr;
  }, [career.draftPool, posFilter, poolSort, dTier]);

  const aiPickFromPool = (clubId, currentPool) => {
    if (!currentPool.length) return null;
    const ranked = [...currentPool].sort((a, b) => b.overall - a.overall);
    if (rng() < 0.72) return ranked[0];
    const k = Math.min(5, ranked.length);
    return ranked[rand(0, k - 1)];
  };

  const draftPlayer = (p) => {
    if (!isMyTurn) {
      // Sim AI picks until our slot
      let order = [...draftOrder];
      let currentPool = [...career.draftPool];
      let currentAiSquads = { ...(career.aiSquads || {}) };
      const newsItems = [];
      while (true) {
        const next = order.findIndex(d => !d.used);
        if (next === -1) break;
        const pickEntry = order[next];
        if (pickEntry.clubId === career.clubId) break;
        const aiPick = aiPickFromPool(pickEntry.clubId, currentPool);
        if (!aiPick) break;
        currentPool = currentPool.filter(x => x.id !== aiPick.id);
        currentAiSquads[pickEntry.clubId] = currentAiSquads[pickEntry.clubId] || [];
        currentAiSquads[pickEntry.clubId] = [...currentAiSquads[pickEntry.clubId], { ...aiPick, age: rand(17, 19) }];
        order = order.map((d, i) => i === next ? { ...d, used: true, prospectName: `${aiPick.firstName} ${aiPick.lastName}`, prospectOverall: aiPick.overall, prospectPos: aiPick.position } : d);
        const oppClub = findClub(pickEntry.clubId);
        newsItems.push({ week: career.week, type: 'info', text: `📋 #${pickEntry.pick}: ${oppClub?.short || pickEntry.clubId} → ${aiPick.firstName} ${aiPick.lastName} (${aiPick.overall})` });
      }
      updateCareer({
        draftPool: currentPool,
        draftOrder: order,
        aiSquads: currentAiSquads,
        news: [...newsItems.slice(-5), ...(career.news || [])].slice(0, 20),
      });
      return;
    }
    if (career.squad.length >= 40) return;
    const rw = rookieDraftWage(p.overall, dTier);
    if (!canAffordSigning(career, rw)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot draft ${p.firstName} ${p.lastName} — over salary cap` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    const rookie = { ...p, id: `r_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage: rw, contract: 2, age: rand(17, 19), rookie: true };
    let order = draftOrder.map((d, i) => i === myPickIndex ? { ...d, used: true, prospectName: `${p.firstName} ${p.lastName}`, prospectOverall: p.overall, prospectPos: p.position } : d);
    let currentPool = career.draftPool.filter(x => x.id !== p.id);
    let currentAiSquads = { ...(career.aiSquads || {}) };
    const newsItems = [{ week: career.week, type: 'win', text: `🎯 #${myNextPick.pick}: ${club.short} draft ${p.firstName} ${p.lastName} (${p.overall} OVR)` }];
    // Auto-run AI picks until next player turn
    while (true) {
      const nextIdx = order.findIndex(d => !d.used);
      if (nextIdx === -1) break;
      const pickEntry = order[nextIdx];
      if (pickEntry.clubId === career.clubId) break;
      const aiPick = aiPickFromPool(pickEntry.clubId, currentPool);
      if (!aiPick) break;
      currentPool = currentPool.filter(x => x.id !== aiPick.id);
      currentAiSquads[pickEntry.clubId] = currentAiSquads[pickEntry.clubId] || [];
      currentAiSquads[pickEntry.clubId] = [...currentAiSquads[pickEntry.clubId], { ...aiPick, age: rand(17, 19) }];
      order = order.map((d, i) => i === nextIdx ? { ...d, used: true, prospectName: `${aiPick.firstName} ${aiPick.lastName}`, prospectOverall: aiPick.overall, prospectPos: aiPick.position } : d);
      const oppClub = findClub(pickEntry.clubId);
      newsItems.push({ week: career.week, type: 'info', text: `📋 #${pickEntry.pick}: ${oppClub?.short || pickEntry.clubId} → ${aiPick.firstName} ${aiPick.lastName}` });
    }
    updateCareer({
      squad: [...career.squad, rookie],
      draftPool: currentPool,
      draftOrder: order,
      aiSquads: currentAiSquads,
      news: [...newsItems.slice(0, 6), ...(career.news || [])].slice(0, 20),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>NATIONAL DRAFT</div>
          <div className="text-xs text-atext-dim">{draftOrder.length === 0 ? 'Draft order is set after each season ends.' : isMyTurn ? `On the clock: pick #${myNextPick.pick}.` : myNextPick ? `Your next pick: #${myNextPick.pick}` : 'You have no remaining picks.'}</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Pool" value={basePool.length} accent="#4AE89A" />
          <Stat label="Squad" value={`${career.squad.length}/40`} accent="var(--A-accent)" />
        </div>
      </div>

      {draftOrder.length > 0 && (
        <div className={`${css.panel} p-4`}>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute mb-2">Pick Order — next 12</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {draftOrder.slice(0, 12).map(d => {
              const c = findClub(d.clubId);
              const isMe = d.clubId === career.clubId;
              const onClock = !d.used && d.clubId === draftOrder.find(x => !x.used)?.clubId;
              return (
                <div key={d.pick} className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs ${d.used ? 'opacity-40' : ''}`}
                  style={{
                    background: isMe ? 'rgba(0,224,255,0.12)' : 'var(--A-panel-2)',
                    border: `1px solid ${onClock ? 'var(--A-accent)' : 'var(--A-line)'}`,
                    minWidth: 96,
                  }}>
                  <div className="font-mono text-[9px] text-atext-mute">#{d.pick}</div>
                  <div className={`font-display text-sm ${isMe ? 'text-aaccent' : 'text-atext'}`}>{c?.short || d.clubId}</div>
                  {d.used && d.prospectName && <div className="text-[9px] text-atext-dim truncate mt-0.5">{d.prospectName} ({d.prospectOverall})</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-atext-dim uppercase tracking-wider">Position:</span>
        {["ALL", ...POSITIONS].map(pos => (
          <button key={pos} type="button" onClick={() => setPosFilter(pos)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${posFilter === pos ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{pos}</button>
        ))}
        <span className="ml-3 text-xs text-atext-dim uppercase tracking-wider">Sort pool:</span>
        <select value={poolSort} onChange={e => setPoolSort(e.target.value)} className="bg-apanel-2 border border-aline rounded-lg px-3 py-1.5 text-xs text-atext">
          <option value="overall">Overall</option>
          <option value="potential">Potential</option>
          <option value="wageFit">Rookie wage (low first)</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
          <div className="col-span-1">#</div>
          <div className="col-span-4">Prospect</div>
          <div className="col-span-1">Pos</div>
          <div className="col-span-1">OVR</div>
          <div className="col-span-2">Potential</div>
          <div className="col-span-2 text-right">Rookie Wage</div>
          <div className="col-span-1"></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {basePool.slice(0, 50).map((p, i) => {
            const rw = rookieDraftWage(p.overall, dTier);
            const capOk = canAffordSigning(career, rw);
            return (
              <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid var(--A-line)"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,224,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div className="col-span-1 font-bold text-aaccent">#{i+1}</div>
                <div className="col-span-4 font-semibold text-sm">{p.firstName} {p.lastName} <span className="text-[10px] text-atext-dim ml-1">(draft age ~17–19)</span></div>
                <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                <div className="col-span-1"><RatingDot value={p.overall} /></div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="font-bold text-[#4AE89A]">{p.potential}</div>
                  <Bar value={p.potential} color="#4AE89A" small />
                </div>
                <div className="col-span-2 text-right text-sm font-mono">
                  <span style={{ color: capOk ? '#4AE89A' : '#E84A6F' }}>${(rw/1000).toFixed(0)}k</span>
                  <span className="text-[10px] text-atext-dim block">est. rookie</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={()=>draftPlayer(p)} className={`${css.btnPrimary} text-xs px-3 py-1.5`}>{isMyTurn ? 'Draft' : 'Sim →'}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Bottom-of-ladder clubs pick first. Hit "Sim →" to fast-forward AI selections to your slot. Higher potential = bigger growth ceiling but slower start.
      </div>
    </div>
  );
}

function YouthTab({ career, club, updateCareer }) {
  const youth = career.youth;
  const [generated, setGenerated] = useState(youth.recruits || []);

  // Map scout focus to position bias + attribute bias
  const FOCUS_BIAS = {
    'All-rounders':    { positions: null,                    attrBoost: {} },
    'Key Forwards':    { positions: ['KF', 'HF'],            attrBoost: { marking: 4, strength: 3, kicking: 2 } },
    'Midfielders':     { positions: ['C', 'R', 'WG'],        attrBoost: { decision: 3, endurance: 4, handball: 3 } },
    'Key Defenders':   { positions: ['KB', 'HB'],            attrBoost: { marking: 4, tackling: 3, strength: 3 } },
    'Ruckmen':         { positions: ['RU'],                  attrBoost: { strength: 5, marking: 3 } },
    'Small Forwards':  { positions: ['HF', 'UT'],            attrBoost: { speed: 4, kicking: 2, decision: 2 } },
  };

  const generateRecruits = () => {
    seedRng(Date.now() % 99999);
    const count = 4 + youth.programLevel * 2;
    const bias = FOCUS_BIAS[youth.scoutFocus] || FOCUS_BIAS['All-rounders'];
    const recruits = [];
    let i = 0;
    while (recruits.length < count) {
      const p = generatePlayer(2 + Math.floor(youth.programLevel / 3), 12000 + i + Date.now() % 1000);
      i++;
      // Reroll up to 3 times if position doesn't match the focus
      let attempts = 0;
      let cand = p;
      while (bias.positions && !bias.positions.includes(cand.position) && !(cand.secondaryPosition && bias.positions.includes(cand.secondaryPosition)) && attempts < 3) {
        cand = generatePlayer(2 + Math.floor(youth.programLevel / 3), 12000 + i + Date.now() % 1000);
        i++;
        attempts++;
      }
      // Apply attribute bias
      if (bias.attrBoost && Object.keys(bias.attrBoost).length) {
        const newAttrs = { ...cand.attrs };
        Object.entries(bias.attrBoost).forEach(([attr, boost]) => {
          if (attr in newAttrs) newAttrs[attr] = Math.min(99, newAttrs[attr] + boost);
        });
        const overall = Math.round(Object.values(newAttrs).reduce((a, b) => a + b, 0) / Object.keys(newAttrs).length);
        cand = { ...cand, attrs: newAttrs, overall };
      }
      recruits.push(cand);
    }
    setGenerated(recruits);
    updateCareer({ youth: { ...youth, recruits } });
  };
  const upgradeProgram = () => {
    const cost = youth.programLevel * 80000;
    if (career.finance.cash < cost || youth.programLevel >= 5) return;
    updateCareer({
      youth: { ...youth, programLevel: youth.programLevel + 1 },
      finance: { ...career.finance, cash: career.finance.cash - cost },
      news: [{ week: career.week, type: "info", text: `⭐ Youth program upgraded to Level ${youth.programLevel+1}` }, ...career.news].slice(0,15),
    });
  };
  const promote = (p) => {
    if (career.squad.length >= 40) return;
    const youthTier = leagueTierOf(career);
    const wage = youthTier === 1 ? 100_000 : youthTier === 2 ? 35_000 : 8_000;
    if (!canAffordSigning(career, wage)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot promote ${p.firstName} ${p.lastName} — over salary cap` }, ...career.news].slice(0, 15) });
      return;
    }
    const rookie = { ...p, id: Date.now() + rand(0, 999_999), wage, contract: 2, rookie: true };
    const remaining = generated.filter(x => x.id !== p.id);
    setGenerated(remaining);
    updateCareer({
      squad: [...career.squad, rookie],
      youth: { ...youth, recruits: remaining },
      news: [{ week: career.week, type: "info", text: `🌱 Promoted academy talent ${p.firstName} ${p.lastName} to rookie list (${fmtK(wage)}/yr)` }, ...career.news].slice(0,15),
    });
  };
  const focusOptions = ["All-rounders", "Key Forwards", "Midfielders", "Key Defenders", "Ruckmen", "Small Forwards"];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>YOUTH ACADEMY</div>
          <div className="text-xs text-atext-dim">Develop talent from the {club.state} zone. Build the next generation.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Program Level" value={`${youth.programLevel}/5`} accent="#4AE89A" />
          <Stat label="Zone" value={youth.zone} accent="#4ADBE8" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${css.panel} p-5 lg:col-span-1 space-y-4`}>
          <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-[#4AE89A]" /><div className="font-bold tracking-wide">Academy Settings</div></div>
          <div>
            <div className={css.label}>Recruitment Zone</div>
            <select value={youth.zone} onChange={e=>updateCareer({ youth: { ...youth, zone: e.target.value }})} className="w-full mt-2 bg-apanel border border-aline rounded-lg px-3 py-2 text-sm text-atext">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className={css.label}>Scout Focus</div>
            <select value={youth.scoutFocus} onChange={e=>updateCareer({ youth: { ...youth, scoutFocus: e.target.value }})} className="w-full mt-2 bg-apanel border border-aline rounded-lg px-3 py-2 text-sm text-atext">
              {focusOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <div className={css.label}>Program Level</div>
            <div className="flex gap-1 mt-2">
              {Array.from({length:5}).map((_,i) => <div key={i} className="flex-1 h-3 rounded-full" style={{background: i < youth.programLevel ? "var(--A-pos)" : "var(--A-line)"}} />)}
            </div>
            <button onClick={upgradeProgram} disabled={youth.programLevel>=5||career.finance.cash<youth.programLevel*80000} className={`${css.btnPrimary} mt-3 text-xs w-full`}>
              {youth.programLevel >= 5 ? "Maxed" : `Upgrade Program · $${(youth.programLevel*80).toFixed(0)}k`}
            </button>
          </div>
          <button onClick={generateRecruits} className={`${css.btnGhost} text-xs w-full`}>Scout New Intake</button>
        </div>

        <div className={`${css.panel} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Sprout className="w-5 h-5 text-[#4AE89A]" /><div className="font-bold tracking-wide">Current Intake</div></div>
            <div className="text-xs text-atext-dim">{generated.length} recruit{generated.length !== 1 ? "s" : ""}</div>
          </div>
          {generated.length === 0 ? (
            <div className="text-center py-12 text-sm text-atext-dim">No recruits yet. Click "Scout New Intake" to find prospects from {youth.zone}.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {generated.map(p => (
                <div key={p.id} className={`${css.inset} p-3 grid grid-cols-12 gap-2 items-center`}>
                  <div className="col-span-4">
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-atext-dim">Age {rand(16,18)} · From {youth.zone}</div>
                  </div>
                  <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                  <div className="col-span-2"><RatingDot value={p.overall} /></div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-atext-dim">Potential</div>
                    <div className="flex items-center gap-1"><span className="text-xs font-bold text-[#4AE89A]">{p.potential}</span><Bar value={p.potential} color="#4AE89A" small /></div>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button onClick={()=>promote(p)} className={`${css.btnPrimary} text-xs px-3 py-1.5`}>Promote</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LocalTab({ career, club, updateCareer }) {
  const [scoutedPlayers, setScoutedPlayers] = useState([]);
  const [scoutingLeague, setScoutingLeague] = useState(null);
  // Find tier-3 leagues in same state, or tier-2 if at tier-1
  const myLeague = findLeagueOf(career.clubId);
  const localPool = LEAGUES_BY_STATE(club.state) || [];
  const localLeagues = localPool.filter(l => l.tier > myLeague.tier);

  const scout = (leagueKey) => {
    seedRng(Date.now() % 88888);
    const league = PYRAMID[leagueKey];
    const found = Array.from({length: 6}, (_, i) => {
      const p = generatePlayer(league.tier, 13000 + i + Date.now() % 500);
      return { ...p, fromLocal: pick(league.clubs).short, scoutedOverall: scoutedOverall(p, career) };
    });
    setScoutedPlayers(found);
    setScoutingLeague(leagueKey);
  };

  const sign = (p) => {
    const localTier = leagueTierOf(career);
    const wage = localTier === 1 ? 200_000 : localTier === 2 ? 80_000 : 18_000;
    const fee  = localTier === 1 ? 75_000  : localTier === 2 ? 30_000 : 8_000;
    if (career.finance.cash < fee || career.squad.length >= 40) return;
    if (!canAffordSigning(career, wage)) return;
    const newPlayer = { ...p, id: Date.now() + rand(0, 999_999), wage, contract: 2 };
    setScoutedPlayers(s => s.filter(x => x.id !== p.id));
    updateCareer({
      squad: [...career.squad, newPlayer],
      finance: { ...career.finance, cash: career.finance.cash - fee },
      news: [{ week: career.week, type: "info", text: `📍 Signed local talent ${p.firstName} ${p.lastName} from ${p.fromLocal} ($${(fee/1000).toFixed(0)}k fee, ${(wage/1000).toFixed(0)}k/yr)` }, ...career.news].slice(0,15),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>LOCAL FOOTBALL</div>
          <div className="text-xs text-atext-dim">Scout grassroots and lower-tier {club.state} leagues for hidden gems.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Scout Cost" value="$30k" sub="per signing" accent="var(--A-accent)" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${css.panel} p-5 lg:col-span-1`}>
          <div className="flex items-center gap-2 mb-3"><Map className="w-5 h-5 text-aaccent" /><div className="font-bold tracking-wide">Lower {club.state} Leagues</div></div>
          {localLeagues.length === 0 ? (
            <div className="text-sm text-atext-dim py-4">No lower-tier leagues available in {club.state} from your current level.</div>
          ) : (
            <div className="space-y-2">
              {localLeagues.map(l => (
                <button key={l.key} onClick={()=>scout(l.key)} className={`w-full text-left p-3 rounded-lg border transition ${scoutingLeague===l.key ? "border-aaccent bg-aaccent/10" : "border-aline hover:border-aline-2 bg-apanel"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{l.short}</div>
                      <div className="text-[10px] text-atext-dim">{l.name}</div>
                    </div>
                    <Pill color="#4ADBE8">T{l.tier}</Pill>
                  </div>
                  <div className="text-[10px] text-atext-dim mt-1">{l.clubs.length} clubs · Scout for hidden talent</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${css.panel} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-aaccent" /><div className="font-bold tracking-wide">Scouting Reports</div></div>
            {scoutingLeague && <div className="text-xs text-atext-dim">{PYRAMID[scoutingLeague].short}</div>}
          </div>
          {scoutedPlayers.length === 0 ? (
            <div className="text-center py-12 text-sm text-atext-dim">Pick a league to dispatch your scouts.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {scoutedPlayers.map(p => {
                const localTier = leagueTierOf(career);
                const wage = localTier === 1 ? 200_000 : localTier === 2 ? 80_000 : 18_000;
                const fee  = localTier === 1 ? 75_000  : localTier === 2 ? 30_000 : 8_000;
                const canCash = career.finance.cash >= fee;
                const canCap  = canAffordSigning(career, wage);
                const can     = canCash && canCap;
                return (
                  <div key={p.id} className={`${css.inset} p-3 grid grid-cols-12 gap-2 items-center`}>
                    <div className="col-span-4">
                      <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                      <div className="text-[10px] text-atext-dim">From {p.fromLocal} · Age {p.age}</div>
                    </div>
                    <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                    <div className="col-span-2"><RatingDot value={p.scoutedOverall ?? p.overall} /></div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-atext-dim">Potential</div>
                      <div className="flex items-center gap-1"><span className="text-xs font-bold text-[#4AE89A]">{p.potential}</span><Bar value={p.potential} color="#4AE89A" small /></div>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <button onClick={()=>sign(p)} disabled={!can}
                        className={can ? `${css.btnPrimary} text-xs px-3 py-1.5` : "px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute"}
                        title={!canCap ? 'Over salary cap' : !canCash ? 'Insufficient cash' : ''}>
                        Sign · ${(fee/1000).toFixed(0)}k
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Local scouting often unearths late bloomers and gritty depth players. They sign at modest wages but can develop dramatically with the right training program and game time.
      </div>
    </div>
  );
}

// ============================================================================
// COMPETITION SCREEN — Ladder / Fixtures / Pyramid
// ============================================================================
function CompetitionScreen({ career, club, league, tab, setTab }) {
  const t = tab || "ladder";
  const tabs = [
    { key: "ladder", label: "Ladder", icon: BarChart3 },
    { key: "fixtures", label: "Fixtures", icon: Calendar },
    { key: "pyramid", label: "Pyramid", icon: Trophy },
  ];
  return (
    <div className="anim-in">
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "ladder"   && <LadderTab career={career} club={club} league={league} />}
      {t === "fixtures" && <FixturesTab career={career} club={club} league={league} />}
      {t === "pyramid"  && <PyramidTab career={career} club={club} league={league} />}
    </div>
  );
}

function LadderTab({ career, club, league }) {
  const sorted = sortedLadder(career.ladder);
  const promoCutoff = league.tier > 1 ? 1 : 8; // top 1 promoted; top 8 finals at tier 1
  const relegCutoff = league.tier === 1 ? 999 : sorted.length; // bottom 1 relegated except tier 1
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>{league.short} LADDER</div>
          <div className="text-xs text-atext-dim">Round {career.week} of {career.fixtures.length} · {league.name}</div>
        </div>
        <div className="flex items-center gap-3">
          <Pill color="#4AE89A">{league.tier === 1 ? "Top 8 = Finals" : "Top 1 = Promoted"}</Pill>
          {league.tier > 1 && <Pill color="#E84A6F">Bottom = Relegated</Pill>}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
          <div className="col-span-1">#</div>
          <div className="col-span-4">Club</div>
          <div className="col-span-1 text-center">P</div>
          <div className="col-span-1 text-center">W</div>
          <div className="col-span-1 text-center">L</div>
          <div className="col-span-1 text-center">D</div>
          <div className="col-span-1 text-right">F</div>
          <div className="col-span-1 text-right">A</div>
          <div className="col-span-1 text-right">%</div>
        </div>
        {sorted.map((row, i) => {
          const c = findClub(row.id);
          const isMe = row.id === career.clubId;
          const pos = i + 1;
          const inPromo = pos <= promoCutoff;
          const inReleg = pos === relegCutoff && league.tier > 1;
          return (
            <div key={row.id} className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center border-b border-aline ${isMe ? "bg-aaccent/10" : "hover:bg-aaccent/5"} transition`}>
              <div className="col-span-1 flex items-center gap-1">
                <span className={`font-bold ${inPromo ? "text-[#4AE89A]" : inReleg ? "text-[#E84A6F]" : "text-atext-dim"}`}>{pos}</span>
                {inPromo && <ArrowUp className="w-3 h-3 text-[#4AE89A]" />}
                {inReleg && <ArrowDown className="w-3 h-3 text-[#E84A6F]" />}
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <div className="w-2 h-6 rounded-sm" style={{background: c?.colors[0] || "var(--A-line)"}} />
                <span className={isMe ? "font-bold text-aaccent" : "font-semibold"}>{c?.name || row.id}</span>
                {isMe && <Crown className="w-3 h-3 text-aaccent" />}
              </div>
              <div className="col-span-1 text-center text-sm">{row.p}</div>
              <div className="col-span-1 text-center text-sm font-bold text-[#4AE89A]">{row.W}</div>
              <div className="col-span-1 text-center text-sm text-[#E84A6F]">{row.L}</div>
              <div className="col-span-1 text-center text-sm text-atext-dim">{row.D}</div>
              <div className="col-span-1 text-right text-sm font-mono">{row.f}</div>
              <div className="col-span-1 text-right text-sm font-mono text-atext-dim">{row.a}</div>
              <div className="col-span-1 text-right text-sm font-mono font-bold">{row.a > 0 ? ((row.f/row.a)*100).toFixed(1) : "—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixturesTab({ career, club, league }) {
  const { lastPlayedRoundIdx, nextRoundIdx } = useMemo(() => {
    let last = -1;
    for (const e of career.eventQueue || []) {
      if (e.type === 'round' && e.completed && e.round != null) {
        last = Math.max(last, e.round - 1);
      }
    }
    const n = (career.fixtures || []).length;
    const next = last < n - 1 ? last + 1 : Math.min(last, n - 1);
    return { lastPlayedRoundIdx: last, nextRoundIdx: Math.max(0, next) };
  }, [career.eventQueue, career.fixtures]);

  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>FIXTURES</div>
        <div className="text-xs text-atext-dim">Full season schedule · {career.fixtures.length} rounds · progress follows completed matches</div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {career.fixtures.map((round, ri) => {
          const isPlayed = ri <= lastPlayedRoundIdx;
          const isCurrent = ri === nextRoundIdx && ri < career.fixtures.length && !isPlayed;
          const crucialHere = (career.crucialFive || []).some((c) => c.round === ri + 1);
          return (
            <div key={ri} className={`${css.panel} p-4 ${isCurrent ? "ring-2 ring-[var(--A-accent)]" : ""} ${crucialHere ? "ring-1 ring-amber-500/50" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold tracking-wide">Round {ri+1}</div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {crucialHere && <Pill color="#F59E0B">Crucial</Pill>}
                  {isPlayed && <Pill color="#64748B">Played</Pill>}
                  {isCurrent && <Pill color="var(--A-accent)">Up Next</Pill>}
                </div>
              </div>
              <div className="space-y-1.5">
                {round.map((m, mi) => {
                  const home = findClub(m.home);
                  const away = findClub(m.away);
                  const myMatch = m.home === career.clubId || m.away === career.clubId;
                  const oppId = myMatch ? (m.home === career.clubId ? m.away : m.home) : null;
                  const isBogey = myMatch && oppId && career.bogeyTeamId === oppId;
                  const result = isPlayed && m.result;
                  const tp = m.turningPoint ? turningPointRibbon(m.turningPoint) : null;
                  return (
                    <div key={mi} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${myMatch ? "bg-aaccent/10 border border-aaccent/30" : "bg-apanel"}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-1.5 h-4 rounded-sm flex-shrink-0" style={{background: home?.colors[0] || "var(--A-line)"}} />
                        <span className={`truncate ${myMatch && m.home === career.clubId ? "font-bold" : ""}`}>{home?.short || m.home}</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5 px-1 flex-shrink-0">
                        {result ? (
                          <div className="font-mono font-bold text-xs">{result.hScore}–{result.aScore}</div>
                        ) : (
                          <div className="text-[10px] text-atext-dim">vs</div>
                        )}
                        {myMatch && tp && (
                          <span className="text-[9px] font-bold uppercase tracking-tight" title={tp.ribbon}>{tp.emoji} {tp.ribbon}</span>
                        )}
                        {myMatch && isBogey && (
                          <span className="text-[9px] font-bold text-[#E879F9]" title="Bogey opponent">👻 Bogey</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`truncate ${myMatch && m.away === career.clubId ? "font-bold" : ""}`}>{away?.short || m.away}</span>
                        <div className="w-1.5 h-4 rounded-sm flex-shrink-0" style={{background: away?.colors[0] || "var(--A-line)"}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PyramidTab({ career, club, league }) {
  const myState = club.state;
  // Group leagues by tier
  const byTier = { 1: [], 2: [], 3: [] };
  Object.entries(PYRAMID).forEach(([key, l]) => {
    if (byTier[l.tier]) byTier[l.tier].push([key, l]);
  });
  const isMyState = (l) => l.state === myState || l.state === "NAT";

  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>{myState} FOOTBALL PYRAMID</div>
        <div className="text-xs text-atext-dim">Climb from grassroots to the AFL. You're currently in <span className="text-aaccent font-bold">{league.short} (Tier {league.tier})</span>.</div>
      </div>

      <div className="space-y-4">
        {/* TIER 1 */}
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-[#FFD200]" /><div className={`${css.h1} text-2xl`}>TIER 1 · NATIONAL</div></div>
            <Pill color="#FFD200">Premier Competition</Pill>
          </div>
          {byTier[1].map(([key, l]) => (
            <div key={key} className={`p-4 rounded-xl ${career.leagueKey===key ? "bg-aaccent/15 border-2 border-[var(--A-accent)]" : "bg-gradient-to-r from-[#FFD200]/10 to-transparent border border-[#FFD200]/30"}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-bold text-lg">{l.name}</div>
                  <div className="text-xs text-atext-dim">{l.clubs.length} clubs · Australia-wide</div>
                  <div className="text-[11px] text-atext-mute mt-1.5 leading-snug max-w-2xl">{pyramidNoteForLeague(key, l.tier)}</div>
                </div>
                {career.leagueKey===key && <Pill color="var(--A-accent)">YOU ARE HERE</Pill>}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {l.clubs.map(c => (
                  <div key={c.id} className={`px-2 py-1 rounded text-[10px] font-bold ${c.id === career.clubId ? "bg-aaccent text-[#001520]" : ""}`} style={c.id !== career.clubId ? {background: `${c.colors[0]}33`, color: c.colors[1] === "#FFFFFF" ? "var(--A-text)" : c.colors[1], border: `1px solid ${c.colors[0]}66`} : {}}>{c.short}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* TIER 2 */}
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-[#4ADBE8]" /><div className={`${css.h1} text-2xl`}>TIER 2 · STATE LEAGUES</div></div>
            <Pill color="#4ADBE8">Promotion to AFL</Pill>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {byTier[2].map(([key, l]) => {
              const myStateLeague = isMyState(l);
              const isCurrent = career.leagueKey === key;
              return (
                <div key={key} className={`p-3 rounded-xl ${isCurrent ? "bg-aaccent/15 border-2 border-aaccent" : myStateLeague ? "bg-aaccent-2/10 border border-aaccent-2/40" : "bg-apanel border border-aline opacity-60"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{l.short}</div>
                      <div className="text-[10px] text-atext-dim">{l.state} · {l.clubs.length} clubs</div>
                      <div className="text-[10px] text-atext-mute mt-1 leading-snug line-clamp-2">{pyramidNoteForLeague(key, l.tier)}</div>
                    </div>
                    {isCurrent && <Pill color="var(--A-accent)">HERE</Pill>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIER 3 */}
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Sprout className="w-5 h-5 text-[#4AE89A]" /><div className={`${css.h1} text-2xl`}>TIER 3 · COMMUNITY</div></div>
            <Pill color="#4AE89A">Grassroots</Pill>
          </div>
          {byTier[3].length === 0 ? (
            <div className="text-sm text-atext-dim py-4">No tier 3 leagues currently in this build.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-2">
              {byTier[3].map(([key, l]) => {
                const myStateLeague = isMyState(l);
                const isCurrent = career.leagueKey === key;
                return (
                  <div key={key} className={`p-3 rounded-lg ${isCurrent ? "bg-aaccent/15 border-2 border-aaccent" : myStateLeague ? "bg-apos/10 border border-apos/30" : "bg-apanel border border-aline opacity-60"}`}>
                    <div className="font-bold text-xs">{l.short}</div>
                    <div className="text-[10px] text-atext-dim">{l.clubs.length} clubs · {l.state}</div>
                    <div className="text-[10px] text-atext-mute mt-1 leading-snug line-clamp-3">{pyramidNoteForLeague(key, l.tier)}</div>
                    {isCurrent && <div className="mt-1"><Pill color="var(--A-accent)">HERE</Pill></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">PROMOTION:</span> Win your league to climb a tier. The AFL is the summit — once there, chase the flag. The game tracks your full journey, season-by-season, from grassroots to glory.
      </div>
    </div>
  );
}
