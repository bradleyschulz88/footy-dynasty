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
import { seedNationalDraft } from "./lib/draftSeed.js";
import { GlobalStyle } from "./components/primitives.jsx";
import LandingScreen from "./screens/LandingScreen.jsx";
import GameOverScreen from "./screens/GameOverScreen.jsx";
import PostMatchSummary from "./screens/PostMatchSummary.jsx";
import SeasonSummaryScreen from "./screens/SeasonSummaryScreen.jsx";
import PremiershipScreen from "./screens/PremiershipScreen.jsx";
import FinalsQualificationScreen from "./screens/FinalsQualificationScreen.jsx";
import FinalsEliminatedScreen from "./screens/FinalsEliminatedScreen.jsx";
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
import { advanceBlockedByCareerNeeds, applyCareerPatch } from './lib/inbox.js';
import { hasBlockingNotification, pruneHandledNotifications } from './lib/notifications.js';
import { HubScreen } from './screens/hub/HubScreen.jsx';
import AppErrorBoundary from './components/AppErrorBoundary.jsx';
import { CareerSetup } from './screens/CareerSetupScreen.jsx';
import { Sidebar } from './components/gameChrome/Sidebar.jsx';
import OvalBackdrop from './components/OvalBackdrop.jsx';
import { BottomNav } from './components/gameChrome/BottomNav.jsx';
import { TopBar } from './components/gameChrome/TopBar.jsx';
import { InboxBanner } from './components/InboxBanner.jsx';
import { ExportReminderBanner } from './components/ExportReminderBanner.jsx';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.jsx';
import AdvanceAgendaModal from './components/AdvanceAgendaModal.jsx';
import { getVisibleAdvanceAgenda, snoozeAdvanceAgendaItems } from './lib/advanceAgenda.js';
import { recordGameEvent } from './lib/gameAnalytics.js';
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
const DraftRoomScreenLazy = lazy(() => import('./screens/DraftRoomScreen.jsx'));
const SettingsScreenLazy = lazy(() => import('./screens/SettingsScreen.jsx'));
const CareersScreenLazy = lazy(() => import('./screens/careers/CareersScreen.jsx'));

// --- Gameplay systems spec (Sections 1-3) ---
import { getDifficultyConfig } from "./lib/difficulty.js";
import {
  generateCommittee,
  generateJournalist,
  rollPlayerTrait,
} from './lib/community.js';
import {
  generateJobMarket, takeSeasonOff,
} from './lib/coachReputation.js';
import { simulatePartialSeason } from './lib/jobMove.js';
// --- Finance system rebuild ---
import { makeStartingFinance, scaledSquadToFitCap } from './lib/finance/engine.js';
import { buildStartingSponsors } from './lib/finance/sponsors.js';
import {
  ensureCareerBoard,
  resetExecutiveBoard,
  generateSeasonObjectives,
  planSeasonBoardMeetings,
  catchUpBoardMeetingForCurrentWeek,
  applyVoteSurvivalMutate,
  resolveRoutineBoardMeeting,
  alignBoardMembersToTarget,
  recalcBoardConfidence,
} from './lib/board.js';
import { getClubGround } from './data/grounds.js';
import { buildMatchDayExitPatch } from './lib/matchDayFinalize.js';
import { advanceCareerNextEvent, resolveLiveMatchHalfTime, triggerSackState, fastForwardFinals } from './lib/careerAdvance.js';
import { assignDynastyQuestsForSeason } from './lib/dynastyQuests.js';
import { LINEUP_CAP } from './lib/lineupHelpers.js';

const THEME_STORAGE_KEY = 'fd-theme';

function resolveThemeClass(career) {
  try {
    const pref = career?.options?.theme ?? localStorage.getItem(THEME_STORAGE_KEY) ?? 'stitch';
    if (pref === 'light') return 'dirA';
    if (pref === 'dark') return 'dirB';
    return 'dirS';
  } catch {
    return 'dirS';
  }
}

function persistTheme(theme) {
  try { localStorage.setItem(THEME_STORAGE_KEY, theme ?? 'stitch'); } catch { /* ignore */ }
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
  const [showLanding, setShowLanding] = useState(() => !bootRef.career);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [slotMetaTick, setSlotMetaTick] = useState(0);
  const [showPostMatch, setShowPostMatch] = useState(false);
  const [career, setCareer] = useState(() => bootRef.career);
  const [screen, setScreen] = useState("hub");
  const [tab, setTab] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [advanceAgendaOpen, setAdvanceAgendaOpen] = useState(false);
  const [advanceAgendaItems, setAdvanceAgendaItems] = useState([]);
  const [pwaNeedsUpdate, setPwaNeedsUpdate] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const installPromptRef = useRef(null);

  const themeClass = resolveThemeClass(career);

  // Persist theme preference to localStorage so it applies before a career loads
  useEffect(() => {
    persistTheme(career?.options?.theme ?? 'light');
  }, [career?.options?.theme]);

  useEffect(() => {
    const handler = () => setPwaNeedsUpdate(true);
    window.addEventListener('pwa-need-refresh', handler);
    return () => window.removeEventListener('pwa-need-refresh', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      installPromptRef.current = e;
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const bumpSlotMeta = useCallback(() => setSlotMetaTick((t) => t + 1), []);

  const advanceShellRef = useRef({ career: null, setCareer, setScreen, setTab });
  useEffect(() => {
    advanceShellRef.current = { career, setCareer, setScreen, setTab };
  }, [career, setCareer, setScreen, setTab]);

  const performAdvance = useCallback(() => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = advanceShellRef.current;
    if (!c?.clubId) return;
    const advClub = findClub(c.clubId);
    const advLeague = PYRAMID[c.leagueKey];
    advanceCareerNextEvent({ career: c, league: advLeague, club: advClub, setCareer: sc, setScreen: ss, setTab: st });
  }, []);

  const requestAdvance = useCallback(() => {
    const { career: c } = advanceShellRef.current;
    if (!c?.clubId) return;
    if (tutorialLocksAdvanceButton(c) || advanceBlockedByCareerNeeds(c)) return;
    const advLeague = PYRAMID[c.leagueKey];
    const items = getVisibleAdvanceAgenda(c, advLeague);
    if (items.length > 0) {
      setAdvanceAgendaItems(items);
      setAdvanceAgendaOpen(true);
      return;
    }
    performAdvance();
  }, [performAdvance]);

  const advanceToNextEvent = requestAdvance;

  // "Sim to next key moment" — batch through uneventful training days and stop
  // at the first thing that needs the coach: a match, key event, blocker, or
  // phase change. Respects the same gates as a normal advance.
  const quickAdvance = useCallback(() => {
    const { career: start, setCareer: sc, setScreen: ss, setTab: st } = advanceShellRef.current;
    if (!start?.clubId) return;
    if (tutorialLocksAdvanceButton(start) || advanceBlockedByCareerNeeds(start)) return;
    let cur = start;
    let navScreen = null;
    for (let i = 0; i < 30; i++) {
      const nextEv = (cur.eventQueue || []).find((e) => !e.completed);
      if (!nextEv) {
        // Post-season phases advance one step at a time through the normal flow.
        if (i === 0) performAdvance();
        return;
      }
      let result = null;
      advanceCareerNextEvent({
        career: cur,
        league: PYRAMID[cur.leagueKey],
        club: findClub(cur.clubId),
        setCareer: (c) => { result = c; },
        // Training events nudge back to the hub — only a real navigation
        // (draft room, etc.) should interrupt the batch.
        setScreen: (s) => { if (s !== 'hub') navScreen = s; },
        setTab: st,
      });
      if (!result) break;
      cur = result;
      const stop =
        navScreen ||
        cur.inMatchDay || cur.liveMatch || cur.isSacked || cur.gameOver ||
        cur.showSeasonSummary || cur.boardCrisis?.phase === 'active' ||
        cur.boardMeetingBlocking || cur.inFinals ||
        (cur.postSeasonPhase === 'trade_period' && cur.inTradePeriod) ||
        advanceBlockedByCareerNeeds(cur) ||
        nextEv.type !== 'training';
      if (stop) break;
    }
    sc(cur);
    if (navScreen) ss(navScreen);
  }, [performAdvance]);

  const handleAdvanceAgendaClose = useCallback(() => {
    setAdvanceAgendaOpen(false);
    setAdvanceAgendaItems([]);
  }, []);

  const handleAdvanceAgendaAnyway = useCallback((snooze, itemIds) => {
    setAdvanceAgendaOpen(false);
    setAdvanceAgendaItems([]);
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = advanceShellRef.current;
    if (!c?.clubId) return;
    const nextCareer =
      snooze && itemIds?.length ? { ...c, ...snoozeAdvanceAgendaItems(c, itemIds) } : c;
    const advClub = findClub(nextCareer.clubId);
    const advLeague = PYRAMID[nextCareer.leagueKey];
    advanceCareerNextEvent({
      career: nextCareer,
      league: advLeague,
      club: advClub,
      setCareer: sc,
      setScreen: ss,
      setTab: st,
    });
  }, []);

  const completeMatchDay = useCallback((autoAdvanceCalendar = false) => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = advanceShellRef.current;
    if (!c?.clubId) return;
    if (c.liveMatch) return; // half-time pause — coach's call resolves the match first
    const patched = applyCareerPatch(c, buildMatchDayExitPatch);
    const isPreseason = !!c.currentMatchResult?.isPreseason;
    const isFinals = !!c.currentMatchResult?.isFinals;
    if (!autoAdvanceCalendar || isPreseason || isFinals) {
      let next = patched;
      if (isFinals && patched.finalsEliminated) {
        next = { ...next, showFinalsEliminated: true };
      }
      if (isFinals && (patched.finalsAlive || []).length === 1) {
        const advClub = findClub(patched.clubId);
        const advLeague = PYRAMID[patched.leagueKey];
        advanceCareerNextEvent({
          career: next,
          league: advLeague,
          club: advClub,
          setCareer: sc,
          setScreen: ss,
          setTab: st,
        });
        return;
      }
      sc(next);
      return;
    }
    const advClub = findClub(patched.clubId);
    const advLeague = PYRAMID[patched.leagueKey];
    advanceCareerNextEvent({
      career: patched,
      league: advLeague,
      club: advClub,
      setCareer: sc,
      setScreen: ss,
      setTab: st,
    });
  }, []);

  const handleAdvanceAgendaGoTo = useCallback((item) => {
    setAdvanceAgendaOpen(false);
    setAdvanceAgendaItems([]);
    setScreen(item.screen);
    setTab(item.tab ?? null);
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
    if (step <= 0 || step >= TUTORIAL_STEPS.length) return;
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
    !career.showPremiershipScreen &&
    !career.showFinalsQualification &&
    !career.showFinalsEliminated &&
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
    setShowLanding(true);
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
  // startMode: 'nextSeason' (default — fresh pre-season, season+1) ·
  //            'sameSeasonPreseason' (end-of-season move firing after rollover) ·
  //            'midSeason' (immediate vacancy takeover, this season already underway)
  function acceptNewJob(offer, opts = {}) {
    const startMode = opts.startMode || 'nextSeason';
    const newLeague = PYRAMID[offer.leagueKey];
    if (!newLeague) return;
    const newClub = newLeague.clubs.find(c => c.id === offer.clubId);
    if (!newClub) return;
    seedRng(Date.now() % 100000);
    const cfg = getDifficultyConfig(career.difficulty);
    // Mid-season + end-of-season moves keep the current season number; only a
    // plain next-season move advances the year.
    const SEASON = startMode === 'nextSeason' ? career.season + 1 : career.season;
    const newSquad = generateSquad(newClub.id, newLeague.tier, 32, SEASON).map(p => ({
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
    const eventQueue = generateSeasonCalendar(SEASON, compClubsNew, newFixtures, newClub.id, {
      nationalDraft: newLeague.tier === 1,
    });
    // Resolve the calendar position. Mid-season takeover fast-forwards the
    // calendar to "now" and seeds a believable ladder + record so far.
    let startWeek = 0;
    let startPhase = 'preseason';
    let startDate = `${SEASON - 1}-12-01`;
    let startLadder = blankLadder(compClubsNew);
    if (startMode === 'midSeason') {
      startDate = career.currentDate || startDate;
      const roundEvents = eventQueue.filter(e => e.type === 'round');
      const playedRounds = roundEvents.filter(e => e.date < startDate).length;
      eventQueue.forEach(e => { if (e.date < startDate) e.completed = true; });
      const sim = simulatePartialSeason(compClubsNew, newFixtures, playedRounds, newLeague.tier, newClub.id);
      startLadder = sim.ladder;
      const nextRound = roundEvents.find(e => !e.completed);
      startWeek = nextRound ? nextRound.round : (roundEvents.length ? roundEvents[roundEvents.length - 1].round : 0);
      startPhase = playedRounds > 0 ? 'season' : 'preseason';
    }
    const interviewBump = offer.interviewStartingBoardBonus ?? 0;
    const startingBoard = clamp(
      ((career.coachReputation ?? 30) >= 60 ? 65 : 55) + interviewBump,
      38,
      78,
    );
    const newFinance = makeStartingFinance(newLeague.tier, career.difficulty, startingBoard);
    const squadForCap = scaledSquadToFitCap({
      clubId: newClub.id,
      leagueKey: offer.leagueKey,
      difficulty: career.difficulty,
      finance: newFinance,
      squad: newSquad,
    });
    const newLineup = squadForCap.slice().sort((a,b)=>b.overall-a.overall).slice(0, LINEUP_CAP).map(p => p.id);
    const initialSponsors = buildStartingSponsors(newLeague.tier);
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
      week:      startWeek,
      winStreak: 0,
      homeWinStreak: 0,
      currentDate: startDate,
      phase:     startPhase,
      pendingJobOffer: null,
      eventQueue,
      squad:     squadForCap,
      lineup:    newLineup,
      kits:      defaultKits(newClub.colors),
      ladder:    startLadder,
      fixtures:  newFixtures,
      finance:   newFinance,
      sponsors:  initialSponsors,
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
      sponsorOffers:              [],
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
        { week: startWeek, type: 'win', text: `✍️ Welcome to ${newClub.name}, ${career.managerName}. ${offer.chairmanLine.replace(/&ldquo;|&rdquo;|&quot;|"/g, '').trim()}` },
        ...(startMode === 'midSeason'
          ? [{ week: startWeek, type: 'info', text: `🪑 You step in mid-season with the club sitting where they are on the ladder — pick up the run home.` }]
          : []),
        { week: startWeek, type: 'info', text: '🤝 No shirt sponsors signed yet — open the Club tab to review incoming offers.' },
      ],
    };
    resetExecutiveBoard(nextCareer, newClub, newLeague, newFinance.boardConfidence);
    generateSeasonObjectives(nextCareer, newLeague);
    planSeasonBoardMeetings(nextCareer);
    const dqN = compClubsNew.length || newLeague.clubs?.length || 12;
    assignDynastyQuestsForSeason(nextCareer, newLeague.tier, dqN);
    seedNationalDraft(nextCareer, newLeague, { inaugural: true, force: true });
    setCareer(nextCareer);
    setScreen('hub');
    setTab(null);
  }

  // Route a Job Centre signing by its start timing. Immediate vacancies take you
  // over now; end-of-season deals are agreed but wait until the season finishes.
  function handleAcceptJobFromCentre(offer, startType) {
    if (startType === 'endOfSeason') {
      updateCareer((c) => ({
        pendingJobOffer: { ...offer, agreedSeason: c.season },
        news: [{ week: c.week ?? 0, type: 'info', text: `🤝 You've agreed to take over ${offer.clubName} at season's end — finish strong with ${club?.short || 'your club'}.` }, ...(c.news || [])].slice(0, 20),
      }));
      setScreen('hub');
      setTab(null);
      return;
    }
    acceptNewJob(offer, { startMode: startType === 'immediate' ? 'midSeason' : 'nextSeason' });
  }

  // End-of-season move: once the agreed season has rolled into the new
  // pre-season, relocate to the club you committed to.
  useEffect(() => {
    const po = career?.pendingJobOffer;
    if (!po) return;
    if (career.season > (po.agreedSeason ?? career.season) && career.phase === 'preseason' && !career.isSacked) {
      acceptNewJob(po, { startMode: 'sameSeasonPreseason' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [career?.season, career?.phase, career?.pendingJobOffer]);

  const sortedLadderRows = useMemo(
    () => (career?.ladder?.length ? sortedLadder(career.ladder) : []),
    [career?.ladder],
  );
  const myLadderPos = useMemo(() => {
    if (!career?.clubId) return 0;
    const i = sortedLadderRows.findIndex((r) => r.id === career.clubId);
    return i >= 0 ? i + 1 : 0;
  }, [sortedLadderRows, career?.clubId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slotMetaSnapshot = useMemo(() => readSlotMeta(), [slotMetaTick]);
  const lastHubDiagSigRef = useRef("");

  useEffect(() => {
    if (!career || !activeSlot) return;
    const sig = `${activeSlot}:${career.clubId}:${career.season}`;
    if (lastHubDiagSigRef.current === sig) return;
    lastHubDiagSigRef.current = sig;
    recordGameEvent(career, "hub_career_active", {
      slot: activeSlot,
      clubId: career.clubId,
      leagueKey: career.leagueKey,
      season: career.season,
      week: career.week,
    });
  }, [career, activeSlot]);

  // ============== LANDING SCREEN ==============
  if (!career && showLanding) {
    const slotMeta = readSlotMeta();
    const hasSaves = SLOT_IDS.some((s) => slotMeta[s]);
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <LandingScreen
          hasSaves={hasSaves}
          themeClass={themeClass}
          onNewCareer={() => setShowLanding(false)}
          onLoadGame={() => setShowLanding(false)}
        />
      </AppMotionConfig>
    );
  }

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
              sessionDiagnostics: false,
              ...(c.options || {}),
            },
          };
          const initLeague = PYRAMID[initialised.leagueKey];
          const initClubCount =
            getCompetitionClubs(initialised.leagueKey, initialised.regionState, initialised.localDivision)?.length
            || initLeague?.clubs?.length
            || 12;
          assignDynastyQuestsForSeason(initialised, initLeague?.tier ?? 2, initClubCount);
          writeSlot(slot, initialised);
          sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
          sessionStorage.removeItem(SETUP_SS_KEY);
          recordGameEvent(initialised, 'career_started', {
            clubId: initialised.clubId,
            leagueKey: initialised.leagueKey,
            difficulty: initialised.difficulty,
            slot,
          });
          setCareer(initialised);
          setScreen("hub");
        }} existingSlots={readSlotMeta()} onResume={(slot) => { handleSwitchSlot(slot); }} themeClass={themeClass} />
      </AppMotionConfig>
    );
  }

  const club = findClub(career.clubId);
  const league = PYRAMID[career.leagueKey];

  // ============== UPDATER ==============
  const updateCareer = (patchOrFn) => setCareer((c) => applyCareerPatch(c, patchOrFn));

  // Dispatch an action from the notification bell (staff/player/club approaches).
  function handleNotificationAction(item, actionId) {
    if (!item) return;
    // Mark the item handled (with an outcome line) and keep it as history, then
    // prune so the resolved trail can't grow without bound.
    const resolve = (c, outcome) =>
      pruneHandledNotifications(
        (c.inbox || []).map((m) => (m.id === item.id ? { ...m, resolved: true, resolvedAt: Date.now(), outcome } : m))
      );

    // Club approach — accept jumps to the new club; decline just clears it.
    if (item.kind === "job_offer") {
      if (actionId === "accept") {
        const offer = item.payload?.offer || career.jobApproach;
        if (offer) { acceptNewJob(offer); return; }
      }
      updateCareer((c) => ({
        inbox: resolve(c, actionId === "accept" ? "Approach accepted" : "Declined — stayed put"),
        jobApproach: null,
        news: [{ week: c.week ?? 0, type: "info", text: actionId === "accept" ? "✅ Approach accepted." : "🤝 You turned down the approach and stayed put." }, ...(c.news || [])].slice(0, 20),
      }));
      return;
    }

    if (item.kind === "player_transfer_request") {
      const pid = item.payload?.playerId;
      updateCareer((c) => {
        const squad = (c.squad || []).map((p) => {
          if (p.id !== pid) return p;
          return actionId === "approve"
            ? { ...p, transferListed: true }
            : { ...p, morale: Math.max(0, Math.min(100, (p.morale ?? 70) - 4)) };
        });
        return {
          squad,
          inbox: resolve(c, actionId === "approve" ? `${item.payload?.playerName} transfer-listed` : `Talked ${item.payload?.playerName} round`),
          news: [{ week: c.week ?? 0, type: "info", text: actionId === "approve"
            ? `📋 ${item.payload?.playerName} added to the transfer list.`
            : `🗣️ You talked ${item.payload?.playerName} round — for now.` }, ...(c.news || [])].slice(0, 20),
        };
      });
      return;
    }

    if (item.kind === "staff_leave" || item.kind === "staff_poach") {
      const sid = item.payload?.staffId;
      updateCareer((c) => {
        const keep = actionId === "renew" || actionId === "match";
        const staff = keep
          ? (c.staff || []).map((s) => (s.id === sid ? { ...s, contract: (s.contract ?? 1) + (item.kind === "staff_poach" ? 1 : 2), loyalty: (s.loyalty ?? 0) + 1 } : s))
          : (c.staff || []).filter((s) => s.id !== sid);
        return {
          staff,
          inbox: resolve(c, keep ? `${item.payload?.staffName} stayed` : `${item.payload?.staffName} left`),
          news: [{ week: c.week ?? 0, type: "info", text: keep
            ? `🤝 ${item.payload?.staffName} stays at the club.`
            : `👋 ${item.payload?.staffName} (${item.payload?.role}) has left the club.` }, ...(c.news || [])].slice(0, 20),
        };
      });
      return;
    }

    if (item.kind === "volunteer_join") {
      updateCareer((c) => {
        const accept = actionId === "accept";
        const staff = accept && item.payload?.staff ? [...(c.staff || []), item.payload.staff] : (c.staff || []);
        return {
          staff,
          inbox: resolve(c, accept ? `${item.payload?.staff?.name} joined` : "Declined"),
          news: accept
            ? [{ week: c.week ?? 0, type: "info", text: `🙌 ${item.payload?.staff?.name} joins as ${item.payload?.staff?.role}.` }, ...(c.news || [])].slice(0, 20)
            : (c.news || []),
        };
      });
      return;
    }

    // Tier-3 recruitment: a local player wants to sign on.
    if (item.kind === "player_join") {
      updateCareer((c) => {
        const sign = actionId === "sign";
        const p = item.payload?.player;
        const full = (c.squad || []).length >= 40;
        const added = sign && p && !full ? [...(c.squad || []), p] : (c.squad || []);
        const name = p ? `${p.firstName} ${p.lastName}` : "the player";
        return {
          squad: added,
          inbox: resolve(c, sign && !full ? `${name} signed` : full ? "List full" : "Declined"),
          news: sign
            ? [{ week: c.week ?? 0, type: "info", text: full
                ? `📋 Couldn't sign ${name} — your list is full.`
                : `🤝 ${name} (${p?.overall} OVR) signs on at the club.` }, ...(c.news || [])].slice(0, 20)
            : (c.news || []),
        };
      });
      return;
    }

    // Tier-3 departure: a player is thinking of walking away.
    if (item.kind === "player_leave") {
      const pid = item.payload?.playerId;
      updateCareer((c) => {
        const keep = actionId === "convince";
        const squad = keep
          ? (c.squad || []).map((p) => (p.id === pid ? { ...p, morale: Math.min(100, (p.morale ?? 70) + 10) } : p))
          : (c.squad || []).filter((p) => p.id !== pid);
        return {
          squad,
          lineup: keep ? c.lineup : (c.lineup || []).filter((id) => id !== pid),
          inbox: resolve(c, keep ? `${item.payload?.playerName} stayed` : `${item.payload?.playerName} left`),
          news: [{ week: c.week ?? 0, type: "info", text: keep
            ? `🗣️ You talked ${item.payload?.playerName} into staying on.`
            : `🚶 ${item.payload?.playerName} has left the club.` }, ...(c.news || [])].slice(0, 20),
        };
      });
      return;
    }

    // Unknown kind — just mark it handled.
    updateCareer((c) => ({ inbox: resolve(c, "Handled") }));
  }

  const tutorialActive = career && !career.tutorialComplete;
  const visibleAdvanceAgendaCount =
    !tutorialLocksAdvanceButton(career) && !advanceBlockedByCareerNeeds(career)
      ? getVisibleAdvanceAgenda(career, league).length
      : 0;

  // ============== RENDER ==============
  const globalStyle = <GlobalStyle />;

  // ============== GAME OVER (sacking) ==============
  // Sacking sequence (Spec Section 3F) — runs whenever isSacked is true.
  // Drives the 5-step narrative, then a Job Market screen for the new club.
  if (career.isSacked) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <div className={`${themeClass} font-sans min-h-screen`}>
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
        <div className={`${themeClass} font-sans min-h-screen`}>
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

  if (career.showPremiershipScreen && career.premiershipMoment) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <motion.div className={`${themeClass} font-sans min-h-screen`}>
          {globalStyle}
          <PremiershipScreen
            moment={career.premiershipMoment}
            club={club}
            onContinue={() => updateCareer({ showPremiershipScreen: false, premiershipMoment: null })}
          />
        </motion.div>
      </AppMotionConfig>
    );
  }

  if (career.showFinalsQualification && career.finalsQualification) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <motion.div className={`${themeClass} font-sans min-h-screen`}>
          {globalStyle}
          <FinalsQualificationScreen
            qualification={career.finalsQualification}
            club={club}
            onContinue={() => updateCareer({ showFinalsQualification: false })}
          />
        </motion.div>
      </AppMotionConfig>
    );
  }

  if (career.showFinalsEliminated) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <motion.div className={`${themeClass} font-sans min-h-screen`}>
          {globalStyle}
          <FinalsEliminatedScreen
            career={career}
            league={league}
            onSimRemainder={() => {
              const next = fastForwardFinals(career, league);
              setCareer(next);
            }}
            onContinue={() => updateCareer({ showFinalsEliminated: false })}
          />
        </motion.div>
      </AppMotionConfig>
    );
  }

  if (career.showSeasonSummary && career.seasonSummary) {
    return (
      <AppMotionConfig reducedMotion={motionReduced}>
        <div className={`${themeClass} font-sans min-h-screen`}>
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
        <div className={`${themeClass} font-sans min-h-screen`}>
          {globalStyle}
          <MatchDayScreen
          result={career.currentMatchResult}
          league={league}
          career={career}
          club={club}
          onCoachCall={(callId) => {
            const { career: c, setCareer: sc } = advanceShellRef.current;
            if (!c?.liveMatch) return;
            resolveLiveMatchHalfTime({
              career: c,
              league: PYRAMID[c.leagueKey],
              club: findClub(c.clubId),
              callId,
              setCareer: sc,
            });
          }}
          onContinue={() => {
            if (career.lastMatchSummary && !career.currentMatchResult.isPreseason) {
              setShowPostMatch(true);
            } else {
              completeMatchDay(false);
            }
          }}
        />
        {showPostMatch && career.lastMatchSummary && (
          <PostMatchSummary
            summary={career.lastMatchSummary}
            onContinue={() => {
              setShowPostMatch(false);
              const isFinals = career.currentMatchResult?.isFinals;
              completeMatchDay(!isFinals);
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
        <div className={`${themeClass} font-sans min-h-screen`}>
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
        <div className={`${themeClass} font-sans min-h-screen`}>
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
        <div className={`${themeClass} font-sans min-h-screen`}>
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
    <div className={`${themeClass} min-h-screen font-sans text-atext flex w-full flex-col md:flex-row`}>
      {globalStyle}
      <OvalBackdrop />
      <Sidebar screen={screen} onNavigate={onNavScreen} club={club} league={league} career={career} myLadderPos={myLadderPos} />
      <main className="relative flex-1 overflow-y-auto min-w-0">
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
                ? "Respond to pending notifications (the bell), finish Club → Board inbox replies, or resolve trade-period offers (Recruit → Trades) before advancing."
                : undefined
          }
          advanceAgendaCount={visibleAdvanceAgendaCount}
          tutorialSpotlightAdvance={!!tutorialActive && (career.tutorialStep ?? 0) === TUTORIAL_STEPS.length - 1}
          onNotificationAction={handleNotificationAction}
          notifOpen={notifOpen}
          onNotifOpenChange={setNotifOpen}
          onBlockedAdvance={hasBlockingNotification(career) ? () => setNotifOpen(true) : undefined}
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
        <ExportReminderBanner onGoSettings={() => setScreen("settings")} />
        <div className="p-3 md:p-6 pb-28 md:pb-6 max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={screen}
              className="min-w-0"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
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
                  onQuickAdvance={quickAdvance}
                  updateCareer={updateCareer}
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
                    onNavigate={setScreen}
                    onOpenClubStaff={() => {
                      setScreen('club');
                      setTab('staff');
                    }}
                  />
                </Suspense>
              )}
              {screen === "schedule" && (
                <Suspense fallback={<LazyRouteFallback label="Loading calendar…" reducedMotion={motionReduced} />}>
                  <ScheduleScreenLazy career={career} club={club} league={league} onOpenCompetition={() => onNavScreen("compete")} onNavigate={onNavScreen} />
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
                  <RecruitScreenLazy
                    career={career}
                    club={club}
                    updateCareer={updateCareer}
                    tab={tab}
                    setTab={setTab}
                    league={league}
                    onOpenDraftRoom={() => setScreen("draft")}
                  />
                </Suspense>
              )}
              {screen === "draft" && (
                <Suspense fallback={<LazyRouteFallback label="Loading draft room…" reducedMotion={motionReduced} />}>
                  <DraftRoomScreenLazy
                    career={career}
                    club={club}
                    league={league}
                    updateCareer={updateCareer}
                    onExit={() => { setScreen("recruit"); setTab("draft"); }}
                  />
                </Suspense>
              )}
              {screen === "compete" && (
                <Suspense fallback={<LazyRouteFallback label="Loading competition…" reducedMotion={motionReduced} />}>
                  <CompetitionScreenLazy career={career} club={club} league={league} tab={tab} setTab={setTab} onOpenCalendar={() => onNavScreen("schedule")} />
                </Suspense>
              )}
              {screen === "careers" && (
                <Suspense fallback={<LazyRouteFallback label="Loading careers…" reducedMotion={motionReduced} />}>
                  <CareersScreenLazy career={career} club={club} league={league} updateCareer={updateCareer} onAcceptJob={handleAcceptJobFromCentre} />
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
      <BottomNav
        screen={screen}
        onNavigate={onNavScreen}
        career={career}
        league={league}
        onAdvance={advanceToNextEvent}
        advanceDisabled={
          tutorialLocksAdvanceButton(career) || advanceBlockedByCareerNeeds(career)
        }
        advanceDisabledReason={
          tutorialLocksAdvanceButton(career)
            ? "Finish the tutorial step first"
            : hasBlockingNotification(career)
              ? "Tap the bell — a decision is waiting"
              : advanceBlockedByCareerNeeds(career)
                ? "Resolve your inbox / trades first"
                : undefined
        }
        onShowNotifications={hasBlockingNotification(career) ? () => setNotifOpen(true) : undefined}
        advanceAgendaCount={visibleAdvanceAgendaCount}
      />
      {/* Tutorial Overlay (Spec Section 1) */}
      {!career.tutorialComplete && (career.tutorialStep ?? 0) < TUTORIAL_STEPS.length && (
        <TutorialOverlay
          step={career.tutorialStep ?? 0}
          onNext={() => {
            const cur = career.tutorialStep ?? 0;
            const next = cur + 1;
            updateCareer({ tutorialStep: next, tutorialComplete: next >= TUTORIAL_STEPS.length });
          }}
          onSkip={() => updateCareer({ tutorialStep: TUTORIAL_STEPS.length, tutorialComplete: true })}
        />
      )}
      {showInstallPrompt && (
        <div style={{
          position: 'fixed', bottom: `calc(env(safe-area-inset-bottom, 0px) + ${pwaNeedsUpdate ? '10rem' : '6.5rem'})`,
          left: '50%', transform: 'translateX(-50%)',
          background: 'var(--A-surface-2, #1e2a3a)',
          color: 'var(--A-text, #e8edf4)',
          border: '1px solid var(--A-accent-2, #06b6d4)',
          borderRadius: '0.5rem', padding: '0.75rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)', zIndex: 9998,
          fontSize: '0.875rem', whiteSpace: 'nowrap',
        }}>
          <span>📱 Add to Home Screen</span>
          <button
            onClick={async () => {
              if (installPromptRef.current) {
                await installPromptRef.current.prompt();
                installPromptRef.current = null;
              }
              setShowInstallPrompt(false);
              localStorage.setItem('pwa-install-dismissed', '1');
            }}
            style={{ background: 'var(--A-accent-2, #06b6d4)', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Install
          </button>
          <button
            onClick={() => { setShowInstallPrompt(false); localStorage.setItem('pwa-install-dismissed', '1'); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--A-text-dim, #8899aa)', fontSize: '1rem', lineHeight: 1 }}
            aria-label="Dismiss"
          >✕</button>
        </div>
      )}
      {pwaNeedsUpdate && (
        <div style={{
          position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--A-surface-2, #1e2a3a)', color: 'var(--A-text, #e8edf4)',
          border: '1px solid var(--A-accent, #3b82f6)',
          borderRadius: '0.5rem', padding: '0.75rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)', zIndex: 9999,
          fontSize: '0.875rem', whiteSpace: 'nowrap',
        }}>
          <span>New version available</span>
          <button
            onClick={() => { window.__pwaUpdateSW?.(); }}
            style={{
              background: 'var(--A-accent, #3b82f6)', color: '#fff',
              border: 'none', borderRadius: '0.375rem',
              padding: '0.375rem 0.75rem', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Reload
          </button>
          <button
            onClick={() => setPwaNeedsUpdate(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--A-text-dim, #8899aa)', fontSize: '1rem', lineHeight: 1 }}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AdvanceAgendaModal
        open={advanceAgendaOpen}
        career={career}
        league={league}
        items={advanceAgendaItems}
        onClose={handleAdvanceAgendaClose}
        onAdvanceAnyway={handleAdvanceAgendaAnyway}
        onGoTo={handleAdvanceAgendaGoTo}
      />
    </div>
    </AppMotionConfig>
  );
}
