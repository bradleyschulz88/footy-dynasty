import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trophy, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { STATES, PYRAMID, LEAGUES_BY_STATE, findClub } from "../data/pyramid.js";
import { generateSquad } from "../lib/playerGen.js";
import {
  generateFixtures,
  blankLadder,
  getCompetitionClubs,
  tier3DivisionCount,
  tier3DivisionTeamCounts,
  LOCAL_DIVISION_COUNT,
  TIER3_CLUBS_PER_DIVISION_TARGET,
  TIER3_MIN_CLUBS_PER_DIVISION,
} from "../lib/leagueEngine.js";
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits, generateTradePool } from "../lib/defaults.js";
import { seedNationalDraft } from "../lib/draftSeed.js";
import { generateSeasonCalendar } from "../lib/calendar.js";
import { DEFAULT_STAFF_TASKS } from "../lib/staffTasks.js";
import { getPlayerPrefs, setPlayerPrefs } from "../lib/playerPrefs.js";
import { DIFFICULTY_IDS, getDifficultyConfig, getDifficultyProfile } from "../lib/difficulty.js";
import { generateCommittee, generateJournalist, rollPlayerTrait } from "../lib/community.js";
import { makeStartingFinance, scaledSquadToFitCap } from "../lib/finance/engine.js";
import { buildInitialSponsorOffers } from "../lib/finance/sponsors.js";
import { getClubGround } from "../data/grounds.js";
import { assignDefaultCaptains, defaultClubCulture } from "../lib/gameDepth.js";
import {
  ensureCareerBoard,
  generateSeasonObjectives,
  planSeasonBoardMeetings,
} from "../lib/board.js";
import { primeSeasonStoryState } from "../lib/careerAdvance.js";
import { SETUP_SS_KEY, SLOT_IDS, getLatestSavedSlotMeta, SAVE_VERSION } from "../lib/setupConstants.js";
import { LINEUP_CAP } from "../lib/lineupHelpers.js";
import { Pill } from "../components/primitives.jsx";

// Per-state colour identity used on selection cards
const STATE_META = {
  VIC: { color: "#003087", emoji: "🏉", tagline: "The Heartland",       desc: "Most clubs in the country. The game's birthplace." },
  SA:  { color: "#E31837", emoji: "🦘", tagline: "SANFL Country",       desc: "Second oldest league. Rich, deep football culture." },
  WA:  { color: "#003D72", emoji: "🌅", tagline: "WAFL Territory",      desc: "WAFL roots with two AFL giants on the horizon." },
  TAS: { color: "#007A53", emoji: "🍎", tagline: "Apple Isle",          desc: "Tassie Devils incoming. History in the making." },
  NT:  { color: "#F58025", emoji: "🐊", tagline: "Top End Footy",       desc: "Remote grounds, passionate supporters, raw talent." },
  QLD: { color: "#7B1D41", emoji: "🌴", tagline: "North of the Border", desc: "Suns, Lions and a fast-growing local competition." },
  NSW: { color: "#009EE0", emoji: "🌉", tagline: "Swans Territory",     desc: "Sydney footy heartland. Swans & Giants country." },
  ACT: { color: "#002B5C", emoji: "🏛️", tagline: "Capital Territory",   desc: "Canberra footy — compact, competitive, community." },
};

function SetupPyramidHint({ state, tier, leagueKey }) {
  if (!state) return null;
  const nInState =
    leagueKey && PYRAMID[leagueKey]
      ? PYRAMID[leagueKey].clubs.filter((c) => c.state === state).length
      : 0;
  const k = tier === 3 && leagueKey ? tier3DivisionCount(leagueKey, state) : null;
  return (
    <div className="rounded-xl border border-aline/70 bg-apanel/45 px-4 py-3 max-w-2xl mb-6">
      <p className="text-[11px] text-atext-dim leading-relaxed">
        <span className="font-mono text-[10px] text-aaccent uppercase tracking-widest">Pyramid</span>{' '}
        AFL nationally, then your state league, then local clubs. When a league has enough teams in your state, it
        spans up to <strong className="text-atext">{LOCAL_DIVISION_COUNT}</strong> parallel ladders (roughly one new ladder
        per <strong className="text-atext">{TIER3_CLUBS_PER_DIVISION_TARGET}</strong> clubs, and never thinner than{' '}
        <strong className="text-atext">{TIER3_MIN_CLUBS_PER_DIVISION}</strong> teams per ladder when the pool is large enough).
        Division 1 is the promotion race; higher numbers are deeper suburban pools.
        {k != null && nInState > 0 ? (
          <>
            {' '}<strong className="text-atext">{PYRAMID[leagueKey]?.short}</strong> here:{' '}
            <strong className="text-aaccent">{k}</strong> division{k === 1 ? '' : 's'}, {nInState} clubs in {state}.
          </>
        ) : tier === 3 ? (
          <> Pick a league below to see how many divisions that pool uses.</>
        ) : null}
      </p>
      {k != null && k > 1 && (
        <div className="mt-3 flex items-end justify-center gap-1.5 h-11 px-2" aria-hidden>
          {Array.from({ length: k }, (_, i) => (
            <div key={i} title={`Division ${i + 1}`}
              className="flex-1 max-w-[56px] rounded-t border border-aaccent/30 bg-gradient-to-t from-aaccent/25 to-aaccent/40"
              style={{ height: `${36 + ((i + 1) / k) * 100}%`, minHeight: 22 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function loadSetup() {
  try { return JSON.parse(sessionStorage.getItem(SETUP_SS_KEY) || '{}'); } catch { return {}; }
}
function saveSetup(patch) {
  try { sessionStorage.setItem(SETUP_SS_KEY, JSON.stringify({ ...loadSetup(), ...patch })); } catch {}
}

function fmtSavedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
}

const CHALLENGE_SCENARIOS = [
  { id: 'under_the_pump', title: 'Under the Pump',  sub: 'Tight cash, nervous board — survive the season.' },
  { id: 'flag_or_sack',   title: 'Flag or Sack',    sub: 'Top-four required or the board pulls the pin.' },
  { id: 'rebuild',        title: 'Rebuild',          sub: 'Bottom-half list, youth focus, patient board.' },
  { id: 'local_hero',     title: 'Local Hero',       sub: 'Tier 3 only — promotion within three years.' },
];

// Shared motion transition
const slideIn = {
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -12 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

export function CareerSetup({ onStart, existingSlots = {}, onResume }) {
  const saved = loadSetup();
  const [gameMode, setGameMode] = useState(saved.gameMode ?? 'normal');
  const [challengeId, setChallengeId] = useState(saved.challengeId ?? 'under_the_pump');
  const [prefsUi, setPrefsUi] = useState(() => getPlayerPrefs());
  const [step, _setStep] = useState(saved.step ?? 0);
  const [state, _setSelState] = useState(saved.state ?? null);
  const [tier, _setTier] = useState(saved.tier ?? null);
  const [leagueKey, _setLeagueKey] = useState(saved.leagueKey ?? null);
  const [clubId, _setClubId] = useState(saved.clubId ?? null);
  const [localDivision, _setLocalDivision] = useState(saved.localDivision ?? 5);
  const [managerName, _setManagerName] = useState(saved.managerName ?? "");
  const [difficulty, _setDifficulty] = useState(saved.difficulty ?? 'contender');
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState(null);
  const slotsWithSaves = SLOT_IDS.filter(s => existingSlots && existingSlots[s]);

  const setStep          = (v) => { saveSetup({ step: v });        _setStep(v); };
  const setSelState      = (v) => { saveSetup({ state: v });       _setSelState(v); };
  const setTier          = (v) => { saveSetup({ tier: v });        _setTier(v); };
  const setLeagueKey     = (v) => { saveSetup({ leagueKey: v });   _setLeagueKey(v); };
  const setClubId        = (v) => { saveSetup({ clubId: v });      _setClubId(v); };
  const setManagerName   = (v) => { saveSetup({ managerName: v }); _setManagerName(v); };
  const setDifficulty    = (v) => { saveSetup({ difficulty: v });  _setDifficulty(v); };
  const setLocalDivision = (v) => {
    saveSetup({ localDivision: v, clubId: null });
    _setLocalDivision(v);
    _setClubId(null);
  };
  const setGameModePersist = (v) => { saveSetup({ gameMode: v });    setGameMode(v); };
  const setChallengePersist = (v) => { saveSetup({ challengeId: v }); setChallengeId(v); };

  useEffect(() => {
    if (tier !== 3 || !leagueKey || !state) return;
    const k = tier3DivisionCount(leagueKey, state);
    if (localDivision > k) setLocalDivision(k);
  }, [tier, leagueKey, state, localDivision]);

  const tier3K             = tier === 3 && leagueKey && state ? tier3DivisionCount(leagueKey, state) : 0;
  const effectiveTier3Div  = tier === 3 && tier3K ? Math.min(localDivision, tier3K) : localDivision;
  const availableClubs     = leagueKey ? getCompetitionClubs(leagueKey, state, tier === 3 ? effectiveTier3Div : null) : [];
  const availableLeagues   = state ? LEAGUES_BY_STATE(state).filter(l => tier ? l.tier === tier : true) : [];
  const tiersForState      = state ? [1, 2, 3].filter(t => LEAGUES_BY_STATE(state).some(l => l.tier === t)) : [1, 2, 3];

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
      const cfg = getDifficultyConfig(difficulty);
      let tunedFinance = makeStartingFinance(league.tier, difficulty, 55);
      if (gameMode === 'sandbox') {
        tunedFinance = {
          ...tunedFinance,
          cash: Math.round(tunedFinance.cash * 2),
          boardConfidence: Math.min(95, (tunedFinance.boardConfidence ?? 55) + 18),
        };
      } else if (gameMode === 'challenge') {
        const ch = challengeId || 'under_the_pump';
        if (ch === 'flag_or_sack') {
          tunedFinance = {
            ...tunedFinance,
            boardConfidence: Math.max(42, (tunedFinance.boardConfidence ?? 55) - 6),
          };
        } else if (ch === 'rebuild') {
          tunedFinance = {
            ...tunedFinance,
            cash: Math.round(tunedFinance.cash * 0.85),
            boardConfidence: Math.min(88, (tunedFinance.boardConfidence ?? 55) + 12),
          };
        } else {
          tunedFinance = {
            ...tunedFinance,
            cash: Math.round(tunedFinance.cash * 0.72),
            boardConfidence: Math.max(38, (tunedFinance.boardConfidence ?? 55) - 14),
          };
        }
      }
      const tier3KStart = league.tier === 3 ? tier3DivisionCount(leagueKey, state) : 0;
      const startDiv = league.tier === 3 ? Math.min(localDivision, tier3KStart) : null;
      const compClubs = getCompetitionClubs(leagueKey, state, startDiv);
      if (!compClubs.some((row) => row.id === clubId)) throw new Error('Selected club is not in this competition pool.');
      const ladder0 = blankLadder(compClubs);
      const squadRaw = generateSquad(clubId, league.tier, 32, SEASON).map(p => ({ ...p, traits: rollPlayerTrait() ? [rollPlayerTrait()] : [] }));
      const squad = scaledSquadToFitCap({ clubId, leagueKey, difficulty, finance: tunedFinance, squad: squadRaw });
      const lineup = squad.slice().sort((a, b) => b.overall - a.overall).slice(0, LINEUP_CAP).map(p => p.id);
      const fixtures = generateFixtures(compClubs);
      const eventQueue = generateSeasonCalendar(SEASON, compClubs, fixtures, clubId);
      const facilities = DEFAULT_FACILITIES();
      const clubGround = getClubGround(club, facilities.stadium.level, league.tier);
      const isFirstCareer = !existingSlots || Object.keys(existingSlots).length === 0;
      const startOffers = buildInitialSponsorOffers({ leagueTier: league.tier, difficulty, clubId, ladder: ladder0, coachReputation: 30 });
      const newCareer = {
        managerName: managerName || "Coach",
        clubId,
        leagueKey,
        regionState: state,
        localDivision: startDiv,
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
        staffTasks: DEFAULT_STAFF_TASKS(),
        kits: defaultKits(club.colors),
        ladder: ladder0,
        fixtures,
        tradePool: generateTradePool(leagueKey, SEASON),
        draftPool: [],
        youth: { recruits: [], zone: club.state, programLevel: 1, scoutFocus: "All-rounders" },
        news: [
          { week: 0, type: "draw", text: `${managerName || "Coach"} appointed at ${club.name}. Pre-season begins Dec 1.` },
          { week: 0, type: "info", text: "🤝 No sponsors locked in yet — visit Club → Sponsors to choose from incoming offers." },
          ...(gameMode === 'sandbox'
            ? [{ week: 0, type: 'info', text: '🧪 Sandbox: boosted treasury & board patience — sacks and confidence votes are disabled.' }]
            : []),
          ...(gameMode === 'challenge'
            ? [{ week: 0, type: 'board', text: '🔥 Challenge — Under the pump: leaner cash and a jumpy board from day one.' }]
            : []),
        ],
        weeklyHistory: [],
        inFinals: false,
        finalsRound: 0,
        finalsFixtures: [],
        finalsResults: [],
        premiership: null,
        tacticChoice: "balanced",
        seasonHistory: [],
        saveVersion: SAVE_VERSION,
        aiSquads: {},
        draftOrder: [],
        history: [],
        brownlow: {},
        boardWarning: 0,
        gameOver: null,
        themeMode: 'A',
        options: {
          autosave: true,
          confirmBeforeNewCareer: true,
          confirmBeforeDeleteSlot: true,
          uiDensity: 'comfortable',
          reduceMotion: false,
        },
        pendingTradeOffers: [],
        inbox: [],
        retiredThisSeason: [],
        difficulty,
        gameMode,
        challengeId: gameMode === 'challenge' ? (challengeId || 'under_the_pump') : null,
        challengeGoal: gameMode === 'challenge' ? challengeId : null,
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
        lastFinanceTickWeek: null,
        lastFinanceTickDay: null,
        cashCrisisStartWeek: null,
        cashCrisisLevel: 0,
        bankLoan: null,
        sponsorRenewalProposals: [],
        sponsorOffers: startOffers,
        expiredSponsorsLastSeason: [],
        pendingRenewals: [],
        renewalsClosed: false,
        pendingStaffRenewals: [],
        fundraisersUsed: {},
        communityGrantUsed: false,
        lastEosFinance: null,
        postSeasonPhase: 'none',
        inTradePeriod: false,
        tradePeriodDay: 0,
        freeAgencyOpen: false,
        postSeasonDraftCountdown: null,
        freeAgentBalance: { gained: 0, lost: 0 },
        tradeHistory: [],
        draftPickBank: null,
        offSeasonFreeAgents: [],
        clubCulture: defaultClubCulture(),
        headToHead: {},
        finalsRivalryLog: [],
        captainId: null,
        viceCaptainId: null,
        captainHistory: [],
        bogeyTeamId: null,
        dominatedTeamId: null,
        crucialFive: [],
        crisisFiredThisSeason: false,
        teamStats: null,
      };
      assignDefaultCaptains(newCareer);
      ensureCareerBoard(newCareer, club, league);
      generateSeasonObjectives(newCareer, league);
      planSeasonBoardMeetings(newCareer);
      primeSeasonStoryState(newCareer);
      seedNationalDraft(newCareer, league, { inaugural: true, force: true });
      onStart(newCareer);
    } catch (err) {
      setStartError(err.message);
      console.error('[start] career init error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Step labels reflect new order: State → Profile (coach+mode) → Tier → League → [Division] → Club
  const setupLabels =
    tier === 3
      ? ['State', 'Profile', 'Tier', 'League', 'Division', 'Club']
      : ['State', 'Profile', 'Tier', 'League', 'Club'];
  const setupVisualStep =
    tier === 3 ? step : step <= 3 ? step : step === 5 ? 4 : Math.min(step, 4);

  return (
    <div className="dirB min-h-screen font-sans text-atext flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-aline">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 60%, color-mix(in srgb, var(--A-accent) 10%, transparent) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,var(--A-line-2) 0,var(--A-line-2) 1px,transparent 1px,transparent 64px),repeating-linear-gradient(90deg,var(--A-line-2) 0,var(--A-line-2) 1px,transparent 1px,transparent 64px)' }} />
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 md:py-12 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))', boxShadow: '0 4px 16px color-mix(in srgb, var(--A-accent) 30%, transparent)' }}>
              <Trophy className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-aaccent font-mono font-bold">Manager 2026</span>
          </div>
          <h1 className="font-display text-6xl md:text-7xl tracking-wider leading-none text-atext">
            FOOTY <span style={{ color: 'var(--A-accent)' }}>DYNASTY</span>
          </h1>
          <p className="text-atext-dim mt-3 text-sm md:text-base max-w-xl leading-relaxed">
            Take a community side from the suburban grounds to the MCG. 7 states, full pyramid, every system you'd expect.
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-6 md:py-8">
        {/* Stepper */}
        <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-8">
          {setupLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5 md:gap-2">
              <div
                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-xs md:text-sm font-bold transition-all ${
                  setupVisualStep === i
                    ? 'text-[#0A0A0A]'
                    : i < setupVisualStep
                      ? 'border border-aaccent/50 text-aaccent'
                      : 'bg-apanel text-atext-mute border border-aline'
                }`}
                style={setupVisualStep === i ? { background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))' } : undefined}
              >
                {i < setupVisualStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs md:text-sm font-semibold hidden sm:inline ${setupVisualStep === i ? 'text-atext' : 'text-atext-mute'}`}>{label}</span>
              {i < setupLabels.length - 1 && <ChevronRight className="w-3 h-3 text-atext-mute mx-0.5" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {/* ── STEP 0: WHERE WILL YOUR STORY BEGIN? ─── */}
          {step === 0 && (
            <motion.div key="setup-step-0" className="space-y-8" {...slideIn}>

              {/* Resume saves — only shown when saves exist */}
              {slotsWithSaves.length > 0 && (() => {
                const latest = getLatestSavedSlotMeta(existingSlots);
                return (
                  <div>
                    <h2 className="font-display text-3xl tracking-wider text-atext mb-3">CONTINUE</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {slotsWithSaves.map(slot => {
                        const meta = existingSlots[slot];
                        const c = findClub(meta.clubId);
                        const isLatest = slot === latest;
                        return (
                          <motion.button key={slot} type="button"
                            onClick={() => onResume && onResume(slot)}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            className="panel rounded-xl overflow-hidden text-left group">
                            {c?.colors && (
                              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${c.colors[0]}, ${c.colors[1]})` }} />
                            )}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-aaccent">Slot {slot}</span>
                                {isLatest && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase"
                                    style={{ background: 'color-mix(in srgb, var(--A-accent) 15%, transparent)', color: 'var(--A-accent)', border: '1px solid color-mix(in srgb, var(--A-accent) 30%, transparent)' }}>
                                    Latest
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-atext">{meta.managerName || 'Coach'}</div>
                              <div className="text-xs text-atext-dim truncate">{c?.name || meta.clubId}</div>
                              <div className="text-[10px] text-atext-mute mt-1.5 font-mono">
                                Season {meta.season}{meta.week ? ` · Rd ${meta.week}` : ''}{meta.savedAt ? ` · ${fmtSavedAt(meta.savedAt)}` : ''}
                              </div>
                              {meta.premiership && <div className="text-[10px] text-aaccent mt-1.5 font-mono">🏆 {meta.premiership}</div>}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex-1 h-px bg-aline" />
                      <span className="text-[10px] text-atext-mute uppercase tracking-widest font-mono px-2">or start fresh</span>
                      <div className="flex-1 h-px bg-aline" />
                    </div>
                  </div>
                );
              })()}

              {/* State selection — the primary CTA */}
              <div>
                <h2 className="font-display text-4xl md:text-5xl tracking-wider leading-tight mb-1">
                  WHERE WILL YOUR{' '}
                  <span style={{ color: 'var(--A-accent)' }}>STORY BEGIN?</span>
                </h2>
                <p className="text-atext-dim text-sm mb-6">Each state has its own football culture, pyramid and clubs.</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {STATES.map(s => {
                    const meta = STATE_META[s];
                    const leagueCount = LEAGUES_BY_STATE(s).length;
                    return (
                      <motion.button key={s} type="button"
                        onClick={() => { setSelState(s); setStep(1); }}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className="panel rounded-xl overflow-hidden text-left cursor-pointer">
                        {/* State colour accent strip */}
                        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)` }} />
                        <div className="p-4">
                          <div className="text-3xl mb-2 leading-none">{meta.emoji}</div>
                          <div className="font-display text-2xl tracking-wide text-atext leading-none">{s}</div>
                          <div className="text-[10px] font-mono uppercase tracking-widest mt-1 font-bold" style={{ color: meta.color }}>
                            {meta.tagline}
                          </div>
                          <div className="text-[11px] text-atext-dim mt-2 leading-snug">{meta.desc}</div>
                          <div className="text-[10px] text-atext-mute font-mono mt-3">
                            {leagueCount} league{leagueCount === 1 ? '' : 's'}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Skip-setup preference — tucked away at bottom */}
              <label className="flex items-start gap-3 cursor-pointer panel rounded-xl p-4">
                <input type="checkbox"
                  className="mt-0.5"
                  style={{ accentColor: 'var(--A-accent)' }}
                  checked={!!prefsUi.skipSetupContinueLast}
                  onChange={(e) => {
                    const next = setPlayerPrefs({ skipSetupContinueLast: e.target.checked });
                    setPrefsUi(next);
                  }} />
                <div>
                  <div className="font-bold text-sm text-atext">Skip title when saves exist</div>
                  <div className="text-[11px] text-atext-mute mt-1">
                    Next visit loads your active slot, or the most recently saved slot, straight into the game.
                  </div>
                </div>
              </label>
            </motion.div>
          )}

          {/* ── STEP 1: YOUR PROFILE (coach + difficulty + game mode) ── */}
          {step === 1 && (
            <motion.div key="setup-step-1" className="max-w-3xl" {...slideIn}>
              <button type="button" onClick={() => setStep(0)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">YOUR PROFILE</h2>
              <p className="text-atext-dim text-sm mb-6">Starting in <strong className="text-atext">{state}</strong>. Name your manager and set how hard you want it.</p>

              {/* Manager name */}
              <div className="panel rounded-xl p-5 mb-4">
                <label className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">Manager Name</label>
                <input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Bluey McGee"
                  autoFocus
                  className="w-full mt-2 bg-apanel-2 border border-aline focus:border-aaccent outline-none rounded-lg px-4 py-3 text-atext text-lg font-semibold"
                />
              </div>

              {/* Difficulty */}
              <div className="panel rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-2xl tracking-wide text-atext">DIFFICULTY</h3>
                  <span className="text-[10px] text-atext-mute uppercase tracking-widest font-mono">Adjustable later</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {DIFFICULTY_IDS.map((id) => {
                    const meta = getDifficultyProfile(id);
                    const active = difficulty === id;
                    return (
                      <button key={id} type="button" onClick={() => setDifficulty(id)}
                        className={`text-left p-4 rounded-xl border transition-all ${active ? '' : 'hover:border-aaccent/30'}`}
                        style={{
                          background: active
                            ? `color-mix(in srgb, ${meta.color} 12%, var(--A-panel-2))`
                            : 'var(--A-panel-2)',
                          borderColor: active ? meta.color : 'var(--A-line)',
                          boxShadow: active ? `0 0 0 1px ${meta.color}44` : undefined,
                        }}>
                        <div className="font-display text-2xl mb-1" style={{ color: meta.color }}>
                          {meta.label.toUpperCase()}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-atext-mute mb-2 font-mono">{meta.audience}</div>
                        <div className="text-xs text-atext-dim mb-3 leading-snug">{meta.summary}</div>
                        <ul className="space-y-1">
                          {meta.bullets.map((b, i) => (
                            <li key={`${id}-${i}`} className="text-[11px] text-atext flex gap-1.5">
                              <span style={{ color: meta.color }}>•</span><span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Game mode — compact toggle */}
              <div className="panel rounded-xl p-5 mb-6">
                <h3 className="font-display text-xl tracking-wide text-atext mb-1">GAME MODE</h3>
                <p className="text-[11px] text-atext-mute mb-3">
                  Sandbox removes board pressure. Challenge cranks it up.
                </p>
                <div className="flex gap-2">
                  {[
                    { id: 'normal',    label: 'Career',    sub: 'Standard rules',   color: 'var(--A-accent)' },
                    { id: 'sandbox',   label: 'Sandbox',   sub: 'Relaxed board',    color: 'var(--A-pos)' },
                    { id: 'challenge', label: 'Challenge', sub: 'High stakes',      color: 'var(--A-neg)' },
                  ].map(m => (
                    <button key={m.id} type="button" onClick={() => setGameModePersist(m.id)}
                      className="flex-1 py-3 px-2 rounded-xl border text-center transition-all"
                      style={{
                        borderColor: gameMode === m.id ? m.color : 'var(--A-line)',
                        background: gameMode === m.id
                          ? `color-mix(in srgb, ${m.color} 12%, transparent)`
                          : 'transparent',
                      }}>
                      <div className="text-sm font-bold" style={{ color: gameMode === m.id ? m.color : 'var(--A-text-dim)' }}>
                        {m.label}
                      </div>
                      <div className="text-[10px] text-atext-mute mt-0.5">{m.sub}</div>
                    </button>
                  ))}
                </div>
                {gameMode === 'challenge' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {CHALLENGE_SCENARIOS.map((ch) => (
                      <button key={ch.id} type="button" onClick={() => setChallengePersist(ch.id)}
                        className="p-3 text-left rounded-lg border transition-all"
                        style={{
                          borderColor: challengeId === ch.id ? 'var(--A-neg)' : 'var(--A-line)',
                          background: challengeId === ch.id
                            ? 'color-mix(in srgb, var(--A-neg) 8%, transparent)'
                            : 'transparent',
                        }}>
                        <div className="font-bold text-sm text-atext">{ch.title}</div>
                        <div className="text-[10px] text-atext-mute mt-0.5 leading-snug">{ch.sub}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" onClick={() => setStep(2)}
                className="btn-primary w-full py-4 font-display text-xl tracking-widest">
                CHOOSE YOUR TIER →
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: TIER ─── */}
          {step === 2 && (
            <motion.div key="setup-step-2" {...slideIn}>
              <button type="button" onClick={() => setStep(1)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">CHOOSE YOUR PYRAMID LEVEL</h2>
              <p className="text-atext-dim text-sm mb-8">
                Start at the top, the middle, or the bottom. Tiers available in <strong className="text-atext">{state}</strong>.
              </p>
              <div className={`grid gap-4 ${tiersForState.length === 1 ? 'md:grid-cols-1 max-w-sm' : tiersForState.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
                {tiersForState.includes(3) && (
                  <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTier(3); setLeagueKey(null); setClubId(null); setStep(3); }}
                    className="panel rounded-xl p-6 text-left">
                    <Pill color="var(--A-accent)">Underdog</Pill>
                    <div className="font-display text-5xl mt-3 text-atext">TIER 3</div>
                    <div className="text-sm text-atext font-semibold mt-1">Community / Local</div>
                    <div className="text-[12px] text-atext-dim mt-3 leading-relaxed">
                      Suburban grounds. Tiny budgets. The long road. Most rewarding climb in the game.
                    </div>
                    <div className="text-aaccent text-xs mt-4 font-bold uppercase tracking-widest">3 Promotions to AFL</div>
                  </motion.button>
                )}
                {tiersForState.includes(2) && (
                  <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTier(2); setLeagueKey(null); setClubId(null); setStep(3); }}
                    className="panel rounded-xl p-6 text-left">
                    <Pill color="var(--A-accent-2)">Established</Pill>
                    <div className="font-display text-5xl mt-3 text-atext">TIER 2</div>
                    <div className="text-sm text-atext font-semibold mt-1">State League</div>
                    <div className="text-[12px] text-atext-dim mt-3 leading-relaxed">
                      VFL, SANFL, WAFL. Real budgets and media. One step from the big show.
                    </div>
                    <div className="text-xs mt-4 font-bold uppercase tracking-widest" style={{ color: 'var(--A-accent-2)' }}>
                      1 Promotion to AFL
                    </div>
                  </motion.button>
                )}
                {tiersForState.includes(1) && (
                  <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTier(1); setLeagueKey(null); setClubId(null); setStep(3); }}
                    className="panel rounded-xl p-6 text-left">
                    <Pill color="var(--A-neg)">Big Time</Pill>
                    <div className="font-display text-5xl mt-3 text-atext">TIER 1</div>
                    <div className="text-sm text-atext font-semibold mt-1">AFL</div>
                    <div className="text-[12px] text-atext-dim mt-3 leading-relaxed">
                      Premiership pressure. Salary caps. Trade weeks. Every game on national TV.
                    </div>
                    <div className="text-aneg text-xs mt-4 font-bold uppercase tracking-widest">Win the Cup</div>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: LEAGUE ─── */}
          {step === 3 && (
            <motion.div key="setup-step-3" {...slideIn}>
              <button type="button" onClick={() => setStep(2)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">PICK A LEAGUE</h2>
              <p className="text-atext-dim text-sm mb-2">{state} · Tier {tier}</p>
              {tier === 3 && <SetupPyramidHint state={state} tier={tier} leagueKey={null} />}
              {availableLeagues.length === 0 ? (
                <div className="panel rounded-xl p-8 text-center text-atext-dim">
                  No leagues at this tier in {state}.{' '}
                  <button type="button" className="text-aaccent underline" onClick={() => setStep(2)}>
                    Pick a different tier
                  </button>.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {availableLeagues.map((l) => {
                    const tier3Divs = tier === 3 && state ? tier3DivisionCount(l.key, state) : 0;
                    const inState = state ? l.clubs.filter((c) => c.state === state).length : l.clubs.length;
                    return (
                      <motion.button key={l.key} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setLeagueKey(l.key);
                          setClubId(null);
                          if (tier === 3 && state) setLocalDivision(tier3Divs);
                          setStep(tier === 3 ? 4 : 5);
                        }}
                        className="panel rounded-xl p-5 text-left flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-atext-mute uppercase tracking-widest font-mono">Tier {l.tier}</div>
                          <div className="font-display text-2xl mt-1 text-atext">{l.short}</div>
                          <div className="text-sm text-atext-dim">{l.name}</div>
                          <div className="text-[12px] text-atext-mute mt-1">
                            {tier === 3 && state
                              ? `${tier3Divs} local division${tier3Divs === 1 ? '' : 's'} · ${inState} clubs in ${state}`
                              : `${l.clubs.length} clubs`}
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-aaccent flex-shrink-0" />
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 4: LOCAL DIVISION (Tier 3 only) ─── */}
          {step === 4 && tier === 3 && leagueKey && state && (
            <motion.div key="setup-step-4" {...slideIn}>
              <button type="button" onClick={() => setStep(3)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">LOCAL DIVISION</h2>
              <p className="text-atext-dim text-sm mb-2">{PYRAMID[leagueKey]?.name}</p>
              <SetupPyramidHint state={state} tier={tier} leagueKey={leagueKey} />
              {(() => {
                const counts = tier3DivisionTeamCounts(leagueKey, state);
                const k = counts.length;
                if (k <= 1) {
                  return (
                    <div className="space-y-6">
                      <div className="panel rounded-xl p-4 text-[12px] text-atext-dim">
                        Single local ladder — all <strong className="text-atext">{counts[0]}</strong> clubs in {state} play in one division this season.
                      </div>
                      <button type="button" onClick={() => setStep(5)} className="btn-primary py-4 px-8 font-display text-lg tracking-widest">
                        CHOOSE YOUR CLUB →
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="panel rounded-xl p-5 mb-6">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">
                      Choose your local division
                    </label>
                    <p className="text-[11px] text-atext-dim mt-1 mb-4">
                      Lower division number = closer to promotion. Pick a pool to see clubs.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {counts.map((count, i) => {
                        const d = i + 1;
                        return (
                          <button key={d} type="button"
                            onClick={() => { setLocalDivision(d); setStep(5); }}
                            className={`px-4 py-3 rounded-xl border text-left min-w-[5rem] transition-all ${
                              effectiveTier3Div === d
                                ? 'text-[#0A0A0A]'
                                : 'border-aline hover:border-aaccent/40 text-atext'
                            }`}
                            style={effectiveTier3Div === d ? {
                              background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))',
                              borderColor: 'transparent',
                            } : undefined}>
                            <span className="block text-sm font-bold">Div {d}</span>
                            <span className={`block text-[10px] font-normal mt-0.5 ${effectiveTier3Div === d ? 'text-[#0A0A0A]/80' : 'text-atext-mute'}`}>
                              {count} clubs
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ── STEP 5: CHOOSE YOUR CLUB ─── */}
          {step === 5 && leagueKey && (
            <motion.div key="setup-step-5" className="max-w-5xl" {...slideIn}>
              <button type="button"
                onClick={() => { setClubId(null); setStep(tier === 3 ? 4 : 3); }}
                disabled={loading}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="font-display text-4xl md:text-5xl tracking-wider text-atext mb-1">CHOOSE YOUR CLUB</h2>
              <p className="text-atext-dim text-sm mb-5">{PYRAMID[leagueKey]?.name}</p>

              {/* Career summary strip */}
              {(() => {
                const dmeta = getDifficultyProfile(difficulty);
                const modeColors = { normal: 'var(--A-accent)', sandbox: 'var(--A-pos)', challenge: 'var(--A-neg)' };
                const modeLabels = { normal: 'Career', sandbox: 'Sandbox', challenge: 'Challenge' };
                return (
                  <div className="panel rounded-xl p-4 mb-6">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
                      {[
                        { label: 'Manager', value: managerName || 'Coach', color: 'var(--A-text)' },
                        { label: 'State', value: state, color: 'var(--A-text)' },
                        { label: 'Tier', value: `Tier ${tier}`, color: 'var(--A-text)' },
                        ...(tier === 3 && tier3K ? [{ label: 'Division', value: `Div ${effectiveTier3Div}`, color: 'var(--A-text)' }] : []),
                        { label: 'Difficulty', value: dmeta.label, color: dmeta.color },
                        { label: 'Mode', value: modeLabels[gameMode], color: modeColors[gameMode] },
                      ].map(({ label, value, color }, i, arr) => (
                        <React.Fragment key={label}>
                          <div>
                            <div className="text-[9px] font-mono uppercase tracking-widest text-atext-mute">{label}</div>
                            <div className="font-bold text-sm mt-0.5" style={{ color }}>{value}</div>
                          </div>
                          {i < arr.length - 1 && <div className="w-px h-7 bg-aline hidden sm:block" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {tier === 3 && leagueKey && state && <SetupPyramidHint state={state} tier={tier} leagueKey={leagueKey} />}

              {/* Club grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {availableClubs.map((c) => {
                  const isSelected = clubId === c.id;
                  return (
                    <motion.button key={c.id} type="button" onClick={() => setClubId(c.id)}
                      whileHover={!isSelected ? { y: -3, scale: 1.01 } : undefined}
                      whileTap={{ scale: 0.97 }}
                      className={`rounded-xl overflow-hidden text-left transition-all ${
                        isSelected ? 'ring-2 ring-aaccent ring-offset-2 ring-offset-abg' : ''
                      }`}>
                      {/* Club colour header */}
                      <div className="h-16 md:h-20 flex items-center justify-center relative"
                        style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})` }}>
                        <span className="font-display text-2xl md:text-3xl tracking-wide" style={{ color: c.colors[2] }}>
                          {c.short}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.95)' }}>
                            <Check className="w-3.5 h-3.5" style={{ color: c.colors[0] }} />
                          </div>
                        )}
                      </div>
                      {/* Club info */}
                      <div className={`px-3 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-aaccent/10'
                          : 'bg-apanel'
                      }`}>
                        <div className={`font-bold text-sm leading-tight ${isSelected ? 'text-aaccent' : 'text-atext'}`}>
                          {c.name}
                        </div>
                        <div className="text-[10px] text-atext-mute mt-0.5 font-mono">{c.state}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {startError && (
                <div className="mb-4 p-4 rounded-xl text-sm text-aneg flex items-start gap-2"
                  style={{ background: 'color-mix(in srgb, var(--A-neg) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--A-neg) 30%, transparent)' }}>
                  <span>⚠️</span> {startError}
                </div>
              )}

              <motion.button type="button" onClick={start}
                disabled={loading || !clubId}
                whileHover={(!loading && clubId) ? { scale: 1.01 } : undefined}
                whileTap={(!loading && clubId) ? { scale: 0.98 } : undefined}
                className={`w-full py-5 rounded-xl font-display text-2xl tracking-widest transition-all ${
                  loading || !clubId ? 'opacity-40 cursor-not-allowed' : 'glow'
                }`}
                style={{
                  background: (!loading && clubId)
                    ? 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))'
                    : 'var(--A-panel)',
                  color: (!loading && clubId) ? '#0A0A0A' : 'var(--A-text-mute)',
                  border: (!loading && clubId) ? 'none' : '1px solid var(--A-line)',
                  boxShadow: (!loading && clubId) ? '0 8px 24px color-mix(in srgb, var(--A-accent) 30%, transparent)' : 'none',
                }}>
                {loading
                  ? '⏳ STARTING CAREER…'
                  : clubId
                    ? `KICK OFF WITH ${findClub(clubId)?.short || ''} →`
                    : 'SELECT A CLUB ABOVE'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-aline p-4 text-center text-[9px] text-atext-mute uppercase tracking-widest font-mono">
        A football manager-style game for Australian rules
      </div>
    </div>
  );
}
