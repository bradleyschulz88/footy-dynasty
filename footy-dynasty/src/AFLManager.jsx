import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "motion/react";
import { seedRng, rng } from "./lib/rng.js";
import { PYRAMID, findClub } from "./data/pyramid.js";
import { generateSquad } from "./lib/playerGen.js";
import {
  generateFixtures,
  blankLadder,
  sortedLadder,
  getCompetitionClubs,
  localDivisionForClub,
} from "./lib/leagueEngine.js";
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits } from "./lib/defaults.js";
import { DEFAULT_STAFF_TASKS } from "./lib/staffTasks.js";
import { clamp } from "./lib/format.js";
import { generateSeasonCalendar } from "./lib/calendar.js";
import {
  SAVE_VERSION,
  SLOT_IDS,
  LAST_EXPORT_STORAGE_KEY,
  readSlot,
  writeSlot,
  deleteSlot,
  readSlotMeta,
  setActiveSlot,
  migrate as migrateSave,
  cloneSerializable,
} from "./lib/save.js";
import { computeInitialCareerBoot } from "./lib/bootCareer.js";
import { GlobalStyle } from "./components/primitives.jsx";
import GameOverScreen from "./screens/GameOverScreen.jsx";
import PostMatchSummary from "./screens/PostMatchSummary.jsx";
import SeasonSummaryScreen from "./screens/SeasonSummaryScreen.jsx";
import MatchDayScreen from "./screens/MatchDayScreen.jsx";
import SackingSequence from './screens/SackingSequence.jsx';
import VoteOfConfidenceFlow from './screens/VoteOfConfidenceFlow.jsx';
import BoardMeetingScreen from './screens/BoardMeetingScreen.jsx';
import ArrivalBriefingFlow from './screens/ArrivalBriefingFlow.jsx';
import TutorialOverlay, {
  tutorialAllowsNavigation,
  tutorialMidStepCompleted,
  tutorialLocksAdvanceButton,
} from './components/TutorialOverlay.jsx';
import { advanceBlockedByCareerNeeds, mergeCareerPatchWithInboxSync } from './lib/inbox.js';
import { HubScreen } from './screens/hub/HubScreen.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import { CareerSetup } from './screens/CareerSetupScreen.jsx';
import { Sidebar } from './components/gameChrome/Sidebar.jsx';
import { TopBar } from './components/gameChrome/TopBar.jsx';
import { InboxBanner } from './components/InboxBanner.jsx';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.jsx';
import {
  useCareerAutosaveEffect,
  useCareerVisibilityFlushEffect,
  useCareerHtmlDatasetEffect,
} from './hooks/useCareerChromeEffects.js';
import { useGameHotkeys } from './hooks/useGameHotkeys.js';
import { TUTORIAL_STEPS } from './lib/tutorialConstants.js';
import { SETUP_SS_KEY, SETUP_SS_KEY_LEGACY } from './lib/setupConstants.js';

const ScheduleScreenLazy = lazy(() => import('./screens/ScheduleScreen.jsx'));
const CompetitionScreenLazy = lazy(() => import('./screens/competition/CompetitionScreen.jsx'));
const SquadScreenLazy = lazy(() => import('./screens/squad/SquadScreen.jsx'));
const ClubScreenLazy = lazy(() => import('./screens/club/ClubScreen.jsx'));
const RecruitScreenLazy = lazy(() => import('./screens/recruit/RecruitScreen.jsx'));
const SettingsScreenLazy = lazy(() => import('./screens/SettingsScreen.jsx'));

// --- Gameplay systems spec (Sections 1-3) ---
import { getDifficultyConfig } from "./lib/difficulty.js";
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

function AppMotionConfig({ reducedMotion, children }) {
  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      {children}
    </MotionConfig>
  );
}

function LazyRouteFallback({ label, reducedMotion }) {
  if (reducedMotion) {
    return <div className="py-16 text-center text-atext-dim font-mono text-sm">{label}</div>;
  }
  return (
    <motion.div
      className="py-16 text-center text-atext-dim font-mono text-sm"
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
    >
      {label}
    </motion.div>
  );
}


// ============================================================================
// MAIN APP
// ============================================================================
export default function AFLManager() {
  return <AppErrorBoundary><AFLManagerInner /></AppErrorBoundary>;
}


function AFLManagerInner() {
  const bootRef = useMemo(() => computeInitialCareerBoot(), []);
  const [activeSlot, setActiveSlotState] = useState(() => bootRef.activeSlot);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [slotMetaTick, setSlotMetaTick] = useState(0);
  const [showPostMatch, setShowPostMatch] = useState(false);
  const [career, setCareer] = useState(() => bootRef.career);
  const [screen, setScreen] = useState("hub");
  const [tab, setTab] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const bumpSlotMeta = useCallback(() => setSlotMetaTick((t) => t + 1), []);

  const advanceShellRef = useRef({ career: null, setCareer, setScreen });
  useEffect(() => {
    advanceShellRef.current = { career, setCareer, setScreen };
  }, [career, setCareer, setScreen]);

  const advanceToNextEvent = useCallback(() => {
    const { career: c, setCareer: sc, setScreen: ss } = advanceShellRef.current;
    if (!c?.clubId) return;
    const advClub = findClub(c.clubId);
    const advLeague = PYRAMID[c.leagueKey];
    advanceCareerNextEvent({ career: c, league: advLeague, club: advClub, setCareer: sc, setScreen: ss });
  }, []);

  const navCareerRef = useRef(null);
  useEffect(() => {
    navCareerRef.current = career;
  }, [career]);

  const onNavScreen = useCallback((key) => {
    const c = navCareerRef.current;
    if (c && !c.tutorialComplete && !tutorialAllowsNavigation(c.tutorialStep ?? 0, key)) return;
    setScreen(key);
    setTab(null);
  }, []);

  useCareerAutosaveEffect(career, activeSlot, bumpSlotMeta);

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

  useCareerHtmlDatasetEffect(career);

  const systemReducedMotion = useReducedMotion();
  const motionReduced = !!(systemReducedMotion || career?.options?.reduceMotion);

  useCareerVisibilityFlushEffect(career, activeSlot, bumpSlotMeta);

  const hotkeysShellActive = !!(
    career &&
    !career.isSacked &&
    !(career.gameOver && !career.isSacked) &&
    !career.showSeasonSummary &&
    !career.inMatchDay &&
    career.boardCrisis?.phase !== 'active' &&
    !career.boardMeetingBlocking &&
    !career.arrivalBriefing?.pending
  );

  useEffect(() => {
    if (!hotkeysShellActive) setShortcutsOpen(false);
  }, [hotkeysShellActive]);

  useGameHotkeys({
    enabled: hotkeysShellActive,
    advanceDisabled: career ? tutorialLocksAdvanceButton(career) || advanceBlockedByCareerNeeds(career) : true,
    onAdvance: advanceToNextEvent,
    onOpenShortcuts: () => setShortcutsOpen(true),
    onNavigateScreen: onNavScreen,
    tutorialStep: career?.tutorialStep,
    tutorialComplete: career?.tutorialComplete,
  });

  function handleExportCareer() {
    if (!career || !activeSlot) return;
    const payload = {
      game: 'footy-dynasty',
      exportedAt: new Date().toISOString(),
      saveVersion: SAVE_VERSION,
      slot: activeSlot,
      career,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `footy-dynasty-${activeSlot}-season-${career.season}.json`;
    a.click();
    URL.revokeObjectURL(url);
    try {
      localStorage.setItem(LAST_EXPORT_STORAGE_KEY, String(Date.now()));
    } catch (_) {
      /* ignore quota / private mode */
    }
    bumpSlotMeta();
  }

  async function handleImportCareerFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const raw = data.career ?? data;
      if (!raw || typeof raw !== 'object') throw new Error('Invalid save file structure.');
      const migrated = migrateSave(raw);
      if (!migrated?.clubId) throw new Error('Missing club — not a Footy Dynasty career.');
      const suggested = activeSlot && SLOT_IDS.includes(activeSlot) ? activeSlot : 'A';
      const slotAns = window.prompt(`Import into slot A, B, or C?`, suggested);
      const slot = String(slotAns || '').trim().toUpperCase();
      if (!SLOT_IDS.includes(slot)) return;
      if (!window.confirm(`Overwrite slot ${slot} with this imported career? This cannot be undone.`)) return;
      writeSlot(slot, migrated);
      setActiveSlot(slot);
      setActiveSlotState(slot);
      setCareer(migrated);
      setScreen('hub');
      setTab(null);
      setSlotMetaTick((t) => t + 1);
    } catch (e) {
      window.alert(e?.message || 'Could not import save.');
    }
  }

  function handleNewGame() {
    if (career?.options?.confirmBeforeNewCareer !== false) {
      if (!window.confirm('Abandon your current career and start a new game?')) return;
    }
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
    if (career?.options?.confirmBeforeDeleteSlot !== false) {
      if (!window.confirm(`Delete save in slot ${slot}? This cannot be undone.`)) return;
    }
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
      staffTasks: DEFAULT_STAFF_TASKS(),
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
      draftPool: [],
      draftOrder: [],
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

  const sortedLadderRows = useMemo(
    () => (career?.ladder?.length ? sortedLadder(career.ladder) : []),
    [career?.ladder],
  );
  const myLadderPos = useMemo(() => {
    if (!career?.clubId) return 0;
    const i = sortedLadderRows.findIndex((r) => r.id === career.clubId);
    return i >= 0 ? i + 1 : 0;
  }, [sortedLadderRows, career?.clubId]);

  const slotMetaSnapshot = useMemo(() => readSlotMeta(), [slotMetaTick]);

  // ============== CAREER SETUP ==============
  if (!career) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <CareerSetup onStart={(c) => {
          const meta = readSlotMeta();
          let slot = activeSlot;
          if (!slot) {
            slot = SLOT_IDS.find(s => !meta[s]) || 'A';
          }
          setActiveSlot(slot);
          setActiveSlotState(slot);
          const initialised = {
            ...c,
            saveVersion: SAVE_VERSION,
            options: {
              autosave: true,
              confirmBeforeNewCareer: true,
              confirmBeforeDeleteSlot: true,
              uiDensity: 'comfortable',
              reduceMotion: false,
              ...(c.options || {}),
            },
          };
          writeSlot(slot, initialised);
          sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
          sessionStorage.removeItem(SETUP_SS_KEY);
          setCareer(initialised);
          setScreen("hub");
        }} existingSlots={readSlotMeta()} onResume={(slot) => { handleSwitchSlot(slot); }} />
      </AppMotionConfig>
    );
  }

  const club = findClub(career.clubId);
  const league = PYRAMID[career.leagueKey];
  const myLineup = career.lineup;

  // ============== UPDATER ==============
  const updateCareer = (patch) => setCareer((c) => mergeCareerPatchWithInboxSync(c, patch));
  const updateField = (field, value) => setCareer(c => ({ ...c, [field]: value }));

  const tutorialActive = career && !career.tutorialComplete;

  // ============== RENDER ==============
  const globalStyle = <GlobalStyle />;

  // ============== GAME OVER (sacking) ==============
  // Sacking sequence (Spec Section 3F) — runs whenever isSacked is true.
  // Drives the 5-step narrative, then a Job Market screen for the new club.
  if (career.isSacked) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
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
      </AppMotionConfig>
    );
  }

  // Legacy game-over (kept as a no-op fallback so older saves with gameOver but no isSacked don't crash)
  if (career.gameOver && !career.isSacked) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
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
      </AppMotionConfig>
    );
  }

  if (career.showSeasonSummary && career.seasonSummary) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
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
      </AppMotionConfig>
    );
  }

  if (career.inMatchDay && career.currentMatchResult) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
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
            onReview={() => setShowPostMatch(false)}
            onContinue={() => {
              setShowPostMatch(false);
              updateCareer({ inMatchDay: false, currentMatchResult: null, lastMatchSummary: null });
            }}
          />
        )}
        </div>
      </AppMotionConfig>
    );
  }

  if (career.boardCrisis?.phase === 'active') {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
          {globalStyle}
          <VoteOfConfidenceFlow
          career={career}
          club={club}
          league={league}
          onComplete={({ survived, pitchBonus }) => {
            if (survived) {
              const next = cloneSerializable(career);
              const { newsLine } = applyVoteSurvivalMutate(next, league, pitchBonus);
              const catchUp = catchUpBoardMeetingForCurrentWeek(next);
              if (catchUp) next.boardMeetingBlocking = catchUp;
              next.news = [{ week: next.week, type: 'board', text: newsLine }, ...(next.news || [])].slice(0, 20);
              updateCareer(next);
            } else {
              const next = cloneSerializable(career);
              if (next.gameMode === 'sandbox') {
                next.boardCrisis = null;
                next.boardWarning = 0;
                next.finance = { ...next.finance, boardConfidence: Math.max(next.finance.boardConfidence ?? 0, 48) };
                next.news = [{ week: next.week, type: 'info', text: '🧪 Sandbox: board vote waived — confidence steadied.' }, ...(next.news || [])].slice(0, 20);
                updateCareer(next);
              } else {
                triggerSackState(next, club.name, career.week);
                updateCareer(next);
              }
            }
          }}
        />
        </div>
      </AppMotionConfig>
    );
  }

  if (career.boardMeetingBlocking) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
          {globalStyle}
          <BoardMeetingScreen
          career={career}
          blocking={career.boardMeetingBlocking}
          onChoose={(choiceId) => {
            const draft = cloneSerializable(career);
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
      </AppMotionConfig>
    );
  }

  if (career.arrivalBriefing?.pending) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <div className={`${themeWrapperClass()} font-sans min-h-screen`}>
          {globalStyle}
          <ArrivalBriefingFlow
          career={career}
          club={club}
          league={league}
          onComplete={(patch) => {
            const next = cloneSerializable({ ...career, ...patch });
            ensureCareerBoard(next, findClub(next.clubId), PYRAMID[next.leagueKey]);
            alignBoardMembersToTarget(next.board, next.finance.boardConfidence);
            recalcBoardConfidence(next);
            setCareer(next);
          }}
        />
        </div>
      </AppMotionConfig>
    );
  }

  return (
    <AppMotionConfig reducedMotion={motionReduced}>
    <div className={`${themeWrapperClass()} min-h-screen font-sans text-atext flex w-full flex-col md:flex-row`}>
      {globalStyle}
      <Sidebar screen={screen} onNavigate={onNavScreen} club={club} league={league} career={career} myLadderPos={myLadderPos} />
      <main className="flex-1 overflow-y-auto min-w-0">
        <TopBar
          career={career}
          club={club}
          league={league}
          myLadderPos={myLadderPos}
          onAdvance={advanceToNextEvent}
          advanceDisabled={
            tutorialLocksAdvanceButton(career) || advanceBlockedByCareerNeeds(career)
          }
          advanceDisabledReason={
            tutorialLocksAdvanceButton(career)
              ? undefined
              : advanceBlockedByCareerNeeds(career)
                ? "Finish Club → Board inbox replies, resolve trade-period offers (Recruit → Trades), or clear other blocking inbox items before advancing."
                : undefined
          }
          tutorialSpotlightAdvance={!!tutorialActive && (career.tutorialStep ?? 0) === 6}
        />
        <InboxBanner
          career={career}
          updateCareer={updateCareer}
          onGoRecruit={() => {
            setScreen("recruit");
            setTab("trade");
          }}
          onGoClubBoard={() => {
            setScreen("club");
            setTab("board");
          }}
        />
        <div className="p-3 md:p-6 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={screen}
              className="min-w-0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              {screen === "hub" && (
                <HubScreen
                  career={career}
                  club={club}
                  league={league}
                  myLadderPos={myLadderPos}
                  sortedLadderRows={sortedLadderRows}
                  setScreen={onNavScreen}
                  setTab={setTab}
                  onAdvance={advanceToNextEvent}
                />
              )}
              {screen === "squad" && (
                <Suspense fallback={<LazyRouteFallback label="Loading squad…" reducedMotion={motionReduced} />}>
                  <SquadScreenLazy
                    career={career}
                    club={club}
                    updateCareer={updateCareer}
                    tab={tab}
                    setTab={setTab}
                    tutorialActive={tutorialActive}
                    onOpenClubStaff={() => {
                      setScreen('club');
                      setTab('staff');
                    }}
                  />
                </Suspense>
              )}
              {screen === "schedule" && (
                <Suspense fallback={<LazyRouteFallback label="Loading calendar…" reducedMotion={motionReduced} />}>
                  <ScheduleScreenLazy career={career} club={club} league={league} onOpenCompetition={() => onNavScreen("compete")} />
                </Suspense>
              )}
              {screen === "club" && (
                <Suspense fallback={<LazyRouteFallback label="Loading club…" reducedMotion={motionReduced} />}>
                  <ClubScreenLazy
                    career={career}
                    club={club}
                    updateCareer={updateCareer}
                    tab={tab}
                    setTab={setTab}
                    tutorialActive={tutorialActive}
                  />
                </Suspense>
              )}
              {screen === "recruit" && (
                <Suspense fallback={<LazyRouteFallback label="Loading recruit…" reducedMotion={motionReduced} />}>
                  <RecruitScreenLazy career={career} club={club} updateCareer={updateCareer} tab={tab} setTab={setTab} />
                </Suspense>
              )}
              {screen === "compete" && (
                <Suspense fallback={<LazyRouteFallback label="Loading competition…" reducedMotion={motionReduced} />}>
                  <CompetitionScreenLazy career={career} club={club} league={league} tab={tab} setTab={setTab} onOpenCalendar={() => onNavScreen("schedule")} />
                </Suspense>
              )}
              {screen === "settings" && (
                <Suspense fallback={<LazyRouteFallback label="Loading settings…" reducedMotion={motionReduced} />}>
                  <SettingsScreenLazy
                    career={career}
                    updateCareer={updateCareer}
                    activeSlot={activeSlot}
                    onExportCareer={handleExportCareer}
                    onImportCareerFile={handleImportCareerFile}
                    onSaveNow={handleSaveNow}
                    onNewGame={handleNewGame}
                    slotMeta={slotMetaSnapshot}
                    slotMetaTick={slotMetaTick}
                    showSlotPicker={showSlotPicker}
                    onTogglePicker={() => setShowSlotPicker((s) => !s)}
                    onSwitchSlot={handleSwitchSlot}
                    onDeleteSlot={handleDeleteSlot}
                  />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>
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
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
    </AppMotionConfig>
  );
}
