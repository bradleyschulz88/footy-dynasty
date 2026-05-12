import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trophy, ChevronRight, ChevronLeft } from "lucide-react";
import { seedRng, rand, pick } from "../lib/rng.js";
import { STATES, PYRAMID, LEAGUES_BY_STATE, ALL_CLUBS, findClub } from "../data/pyramid.js";
import { generatePlayer, generateSquad } from "../lib/playerGen.js";
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
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits } from "../lib/defaults.js";
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
import { css, Pill } from "../components/primitives.jsx";

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
        Division 1 is the promotion race;
        higher numbers are deeper suburban pools.
        {k != null && nInState > 0 ? (
          <>
            {' '}
            <strong className="text-atext">{PYRAMID[leagueKey]?.short}</strong> here: <strong className="text-aaccent">{k}</strong>
            {' '}
            division{k === 1 ? '' : 's'}, {nInState} clubs in {state}.
          </>
        ) : tier === 3 ? (
          <> Pick a league below to see how many divisions that pool uses.</>
        ) : null}
      </p>
      {k != null && k > 1 && (
        <div className="mt-3 flex items-end justify-center gap-1.5 h-11 px-2" aria-hidden>
          {Array.from({ length: k }, (_, i) => (
            <div
              key={i}
              title={`Division ${i + 1}`}
              className="flex-1 max-w-[56px] rounded-t border border-aaccent/30 bg-gradient-to-t from-[#4ADBE8]/25 to-aaccent/40"
              style={{ height: `${36 + ((i + 1) / k) * 100}%`, minHeight: 22 }}
            />
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

export function CareerSetup({ onStart, existingSlots = {}, onResume }) {
  const saved = loadSetup();
  const [gameMode, setGameMode] = useState(saved.gameMode ?? 'normal'); // normal | sandbox | challenge
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

  const setStep       = (v) => { saveSetup({ step: v });       _setStep(v); };
  const setSelState   = (v) => { saveSetup({ state: v });      _setSelState(v); };
  const setTier       = (v) => { saveSetup({ tier: v });       _setTier(v); };
  const setLeagueKey  = (v) => { saveSetup({ leagueKey: v });  _setLeagueKey(v); };
  const setClubId     = (v) => { saveSetup({ clubId: v });     _setClubId(v); };
  const setManagerName = (v) => { saveSetup({ managerName: v }); _setManagerName(v); };
  const setDifficulty = (v) => { saveSetup({ difficulty: v }); _setDifficulty(v); };
  const setLocalDivision = (v) => {
    saveSetup({ localDivision: v, clubId: null });
    _setLocalDivision(v);
    _setClubId(null);
  };
  const setGameModePersist = (v) => {
    saveSetup({ gameMode: v });
    setGameMode(v);
  };

  useEffect(() => {
    if (tier !== 3 || !leagueKey || !state) return;
    const k = tier3DivisionCount(leagueKey, state);
    if (localDivision > k) setLocalDivision(k);
  }, [tier, leagueKey, state, localDivision]);

  const tier3K = tier === 3 && leagueKey && state ? tier3DivisionCount(leagueKey, state) : 0;
  const effectiveTier3Div = tier === 3 && tier3K ? Math.min(localDivision, tier3K) : localDivision;
  const availableClubs = leagueKey
    ? getCompetitionClubs(leagueKey, state, tier === 3 ? effectiveTier3Div : null)
    : [];
  const availableLeagues = state ? LEAGUES_BY_STATE(state).filter(l => tier ? l.tier === tier : true) : [];
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
    const cfg = getDifficultyConfig(difficulty);
    let tunedFinance = makeStartingFinance(league.tier, difficulty, 55);
    if (gameMode === 'sandbox') {
      tunedFinance = {
        ...tunedFinance,
        cash: Math.round(tunedFinance.cash * 2),
        boardConfidence: Math.min(95, (tunedFinance.boardConfidence ?? 55) + 18),
      };
    } else if (gameMode === 'challenge') {
      tunedFinance = {
        ...tunedFinance,
        cash: Math.round(tunedFinance.cash * 0.72),
        boardConfidence: Math.max(38, (tunedFinance.boardConfidence ?? 55) - 14),
      };
    }
    const tier3KStart = league.tier === 3 ? tier3DivisionCount(leagueKey, state) : 0;
    const startDiv = league.tier === 3 ? Math.min(localDivision, tier3KStart) : null;
    const compClubs = getCompetitionClubs(leagueKey, state, startDiv);
    if (!compClubs.some((row) => row.id === clubId)) throw new Error('Selected club is not in this competition pool.');
    const ladder0 = blankLadder(compClubs);
    const squadRaw = generateSquad(clubId, league.tier, 32, SEASON).map(p => ({ ...p, traits: rollPlayerTrait() ? [rollPlayerTrait()] : [] }));
    const squad = scaledSquadToFitCap({
      clubId,
      leagueKey,
      difficulty,
      finance: tunedFinance,
      squad: squadRaw,
    });
    const lineup = squad.slice().sort((a,b)=>b.overall-a.overall).slice(0, LINEUP_CAP).map(p=>p.id);
    const fixtures = generateFixtures(compClubs);
    const eventQueue = generateSeasonCalendar(SEASON, compClubs, fixtures, clubId);
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
      tradePool: (() => {
        seedRng(SEASON * 4441 + 7777);
        return Array.from({ length: 25 }, (_, i) => {
          const p = generatePlayer(rand(1, 3), 5000 + i + SEASON * 50, { clubId: 'trade', season: SEASON });
          return { ...p, fromClub: pick(ALL_CLUBS).short };
        });
      })(),
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
      // v2 additions
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
      // v3 additions — Gameplay Systems Spec
      difficulty,
      gameMode,
      challengeId: gameMode === 'challenge' ? 'under_the_pump' : null,
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

  const setupLabels =
    tier === 3
      ? ['State', 'Coach', 'Tier', 'League', 'Division', 'Club']
      : ['State', 'Coach', 'Tier', 'League', 'Club'];
  const setupVisualStep =
    tier === 3 ? step : step <= 3 ? step : step === 5 ? 4 : Math.min(step, 4);

  return (
    <div className="dirA min-h-screen font-sans text-atext flex flex-col">
      <style>{`
        body, html { background:var(--A-bg); margin:0; color:var(--A-text); }
      `}</style>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-aline" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(13, 148, 136, 0.12) 0%, transparent 65%)' }}>
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--A-line-2) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="max-w-5xl mx-auto px-8 py-12 relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, var(--A-accent), #0f766e)' }}><Trophy className="w-6 h-6 text-white" /></div>
            <span className="text-[12px] uppercase tracking-[0.3em] text-aaccent font-mono font-bold">Manager 2026</span>
          </div>
          <h1 className="font-display text-7xl tracking-wider leading-none">FOOTY <span className="text-aaccent">DYNASTY</span></h1>
          <p className="text-atext-dim mt-3 text-lg max-w-2xl">Take a community side from the suburban grounds to the MCG. Real Australian rules football management — 7 states, full pyramid, every system you'd expect.</p>
        </div>
      </div>
      {/* Stepper */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {setupLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition ${setupVisualStep === i ? 'bg-aaccent text-white' : i < setupVisualStep ? 'bg-aaccent/15 text-aaccent border border-aaccent/40' : 'bg-apanel text-atext-mute border border-aline'}`}>{i + 1}</div>
              <span className={`text-sm font-semibold ${setupVisualStep === i ? 'text-atext' : 'text-atext-mute'}`}>{label}</span>
              {i < setupLabels.length - 1 && <ChevronRight className="w-4 h-4 text-atext-mute mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <motion.div
              key="setup-step-0"
              className="space-y-8"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
          <div className="space-y-4 mb-8">
            <div>
              <h2 className={`${css.h1} text-2xl mb-2`}>GAME MODE</h2>
              <p className="text-atext-dim text-sm mb-3">
                For <strong className="text-atext">new</strong> careers only. Resuming a save ignores this.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { id: 'normal', title: 'Career', sub: 'Standard rules — full board pressure and sacks.', color: 'var(--A-accent)' },
                  { id: 'sandbox', title: 'Sandbox', sub: 'Extra cash and steadier board. No sacks or confidence votes.', color: '#4AE89A' },
                  { id: 'challenge', title: 'Challenge', sub: 'Lean cash and nervous board — Under the pump.', color: '#E84A6F' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setGameModePersist(m.id)}
                    className={`${css.panelHover} p-4 text-left rounded-xl border-2 transition`}
                    style={{
                      borderColor: gameMode === m.id ? m.color : 'var(--A-line)',
                      boxShadow: gameMode === m.id ? `0 0 0 2px ${m.color}44` : undefined,
                    }}
                  >
                    <div className="font-bold text-atext">{m.title}</div>
                    <div className="text-[11px] text-atext-dim mt-2 leading-snug">{m.sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <label className={`flex items-start gap-3 cursor-pointer ${css.panel} p-4 rounded-xl`}>
              <input
                type="checkbox"
                className="mt-1 accent-teal-600"
                checked={!!prefsUi.skipSetupContinueLast}
                onChange={(e) => {
                  const next = setPlayerPrefs({ skipSetupContinueLast: e.target.checked });
                  setPrefsUi(next);
                }}
              />
              <div>
                <div className="font-bold text-sm text-atext">Skip title when saves exist</div>
                <div className="text-[11px] text-atext-dim mt-1 leading-relaxed">
                  Next visit loads your active slot, or the most recently saved slot, straight into the game.
                </div>
              </div>
            </label>
          </div>

        {slotsWithSaves.length > 0 && (() => {
          const latest = getLatestSavedSlotMeta(existingSlots);
          return latest ? (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => onResume && onResume(latest)}
                className={`${css.btnPrimary} w-full md:w-auto text-lg py-4 px-8`}
              >
                <span className="block">Continue last save · Slot {latest}</span>
                <span className="block text-[11px] font-normal opacity-90 mt-1 font-mono">
                  {fmtSavedAt(existingSlots[latest]?.savedAt)}
                </span>
              </button>
            </div>
          ) : null;
        })()}

        {slotsWithSaves.length > 0 && (
          <div className="mb-8">
            <h2 className={`${css.h1} text-3xl mb-3`}>RESUME A CAREER</h2>
            <p className="text-atext-dim mb-4 text-sm">Pick up where you left off, or scroll down to start a fresh career in another save slot.</p>
            <div className="grid md:grid-cols-3 gap-3">
              {slotsWithSaves.map(slot => {
                const meta = existingSlots[slot];
                const c = findClub(meta.clubId);
                return (
                  <button key={slot} onClick={() => onResume && onResume(slot)} className={`${css.panelHover} p-4 text-left`}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-aaccent">SLOT {slot}</span>
                      {meta.slotLabel ? (
                        <span className="text-[10px] text-atext truncate max-w-[10rem]" title={meta.slotLabel}>{meta.slotLabel}</span>
                      ) : null}
                      <span className="text-[10px] text-atext-mute">·</span>
                      <span className="text-[10px] text-atext-mute">Season {meta.season}{meta.week ? ` · R${meta.week}` : ''}</span>
                    </div>
                    <div className="text-[10px] font-mono text-atext-mute mb-1">{fmtSavedAt(meta.savedAt)}</div>
                    <div className="font-bold text-atext truncate">{meta.managerName || 'Coach'}</div>
                    <div className="text-xs text-atext-dim truncate">{c?.name || meta.clubId}</div>
                    {meta.gameMode && meta.gameMode !== 'normal' && (
                      <div className="text-[10px] text-aaccent mt-1 font-mono uppercase">{meta.gameMode}</div>
                    )}
                    {meta.premiership && <div className="text-[10px] text-aaccent mt-2 font-mono">🏆 {meta.premiership}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
          <div>
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
            </motion.div>
          )}

        {step === 1 && (
          <motion.div
            key="setup-step-1"
            className="max-w-3xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" onClick={() => setStep(0)} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>YOUR COACH</h2>
            <p className="text-atext-dim mb-6">Name your manager and pick a starting difficulty. You can change difficulty later in Settings.</p>
            <div className={`${css.panel} p-6 mb-4`}>
              <label className={css.label}>Manager name</label>
              <input
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="Bluey McGee"
                className="w-full mt-2 bg-apanel border border-aline focus:border-aaccent outline-none rounded-lg px-4 py-3 text-atext"
              />
            </div>
            <div className={`${css.panel} p-6 mb-6`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`${css.h1} text-2xl`}>DIFFICULTY</h3>
                <span className="text-[10px] text-atext-mute uppercase tracking-widest font-mono">Adjustable in Settings</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {DIFFICULTY_IDS.map((id) => {
                  const meta = getDifficultyProfile(id);
                  const active = difficulty === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDifficulty(id)}
                      className={`text-left p-4 rounded-xl border transition-all ${active ? 'ring-2' : 'hover:border-aaccent/40'}`}
                      style={{
                        background: active ? `${meta.color}15` : 'var(--A-panel-2)',
                        borderColor: active ? meta.color : 'var(--A-line)',
                        ringColor: meta.color,
                      }}
                    >
                      <div className="font-display text-2xl mb-1" style={{ color: meta.color }}>{meta.label.toUpperCase()}</div>
                      <div className="text-[10px] uppercase tracking-widest text-atext-mute mb-2 font-mono">{meta.audience}</div>
                      <div className="text-xs text-atext-dim mb-3 leading-snug">{meta.summary}</div>
                      <ul className="space-y-1">
                        {meta.bullets.map((b, i) => (
                          <li key={`${id}-${i}`} className="text-[11px] text-atext flex gap-1.5"><span style={{ color: meta.color }}>•</span><span>{b}</span></li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className={`${css.btnPrimary} text-lg py-3 px-6`}>
              Continue to pyramid →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="setup-step-2"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" onClick={() => setStep(1)} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>CHOOSE YOUR PYRAMID LEVEL</h2>
            <p className="text-atext-dim mb-8">Start at the top, the middle, or the bottom. Tiers available in <strong>{state}</strong>.</p>
            <div className={`grid gap-4 ${tiersForState.length === 1 ? 'md:grid-cols-1 max-w-sm' : tiersForState.length === 2 ? 'md:grid-cols-2 max-w-2xl' : 'md:grid-cols-3'}`}>
              {tiersForState.includes(3) && (
                <button type="button" onClick={() => { setTier(3); setLeagueKey(null); setClubId(null); setStep(3); }} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="#4ADBE8">Underdog</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 3</div>
                  <div className="text-sm text-atext font-semibold mt-1">Community / Local</div>
                  <div className="text-[12px] text-atext-dim mt-3">Suburban grounds. Tiny budgets. Long road. Most rewarding climb.</div>
                  <div className="text-[#4ADBE8] text-xs mt-4 font-bold uppercase tracking-widest">3 Promotions to AFL</div>
                </button>
              )}
              {tiersForState.includes(2) && (
                <button type="button" onClick={() => { setTier(2); setLeagueKey(null); setClubId(null); setStep(3); }} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="var(--A-accent)">Established</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 2</div>
                  <div className="text-sm text-atext font-semibold mt-1">State League</div>
                  <div className="text-[12px] text-atext-dim mt-3">VFL, SANFL, WAFL etc. Real budgets. One step from the big show.</div>
                  <div className="text-aaccent text-xs mt-4 font-bold uppercase tracking-widest">1 Promotion to AFL</div>
                </button>
              )}
              {tiersForState.includes(1) && (
                <button type="button" onClick={() => { setTier(1); setLeagueKey(null); setClubId(null); setStep(3); }} className={`${css.panelHover} p-6 text-left`}>
                  <Pill color="#E84A6F">Big Time</Pill>
                  <div className={`${css.h1} text-4xl mt-3`}>TIER 1</div>
                  <div className="text-sm text-atext font-semibold mt-1">AFL</div>
                  <div className="text-[12px] text-atext-dim mt-3">Premiership pressure. Salary caps. Trade weeks. Every game on TV.</div>
                  <div className="text-[#E84A6F] text-xs mt-4 font-bold uppercase tracking-widest">Win the Cup</div>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="setup-step-3"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" onClick={() => setStep(2)} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>PICK A LEAGUE</h2>
            <p className="text-atext-dim mb-2">{state} • Tier {tier}</p>
            {tier === 3 && <SetupPyramidHint state={state} tier={tier} leagueKey={null} />}
            {availableLeagues.length === 0 ? (
              <div className={`${css.panel} p-8 text-center text-atext-dim`}>No leagues at this tier in {state}. <button type="button" className="text-aaccent underline" onClick={() => setStep(2)}>Pick a different tier</button>.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {availableLeagues.map((l) => {
                  const tier3Divs = tier === 3 && state ? tier3DivisionCount(l.key, state) : 0;
                  const inState = state ? l.clubs.filter((c) => c.state === state).length : l.clubs.length;
                  return (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => {
                        setLeagueKey(l.key);
                        setClubId(null);
                        if (tier === 3 && state) setLocalDivision(tier3Divs);
                        setStep(tier === 3 ? 4 : 5);
                      }}
                      className={`${css.panelHover} p-5 text-left flex items-center justify-between`}
                    >
                      <div>
                        <div className="text-xs text-atext-dim uppercase tracking-widest">Tier {l.tier}</div>
                        <div className={`${css.h1} text-2xl mt-1`}>{l.short}</div>
                        <div className="text-sm text-atext">{l.name}</div>
                        <div className="text-[12px] text-atext-dim mt-1">
                          {tier === 3 && state
                            ? `${tier3Divs} local division${tier3Divs === 1 ? '' : 's'} · ${inState} clubs in ${state}`
                            : `${l.clubs.length} clubs`}
                        </div>
                      </div>
                      <ChevronRight className="w-6 h-6 text-aaccent" />
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {step === 4 && tier === 3 && leagueKey && state && (
          <motion.div
            key="setup-step-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" onClick={() => setStep(3)} className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Back</button>
            <h2 className={`${css.h1} text-4xl mb-4`}>LOCAL DIVISION</h2>
            <p className="text-atext-dim mb-2">{PYRAMID[leagueKey]?.name}</p>
            <SetupPyramidHint state={state} tier={tier} leagueKey={leagueKey} />
            {(() => {
              const counts = tier3DivisionTeamCounts(leagueKey, state);
              const k = counts.length;
              if (k <= 1) {
                return (
                  <div className="space-y-6">
                    <div className={`${css.panel} p-4 text-[12px] text-atext-dim`}>
                      Single local ladder — all <strong className="text-atext">{counts[0]}</strong> clubs in {state} play in one division this season.
                    </div>
                    <button type="button" onClick={() => setStep(5)} className={`${css.btnPrimary} text-lg py-3 px-6`}>
                      Choose your club →
                    </button>
                  </div>
                );
              }
              return (
                <div className={`${css.panel} p-4 mb-6`}>
                  <label className={css.label}>Choose your local division</label>
                  <p className="text-[11px] text-atext-dim mt-1 mb-3">Lower division number = closer to promotion. Pick a pool to see clubs.</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {counts.map((count, i) => {
                      const d = i + 1;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setLocalDivision(d);
                            setStep(5);
                          }}
                          className={`px-3 py-2 rounded-lg border text-left min-w-[4.5rem] transition ${effectiveTier3Div === d ? 'border-aaccent bg-aaccent/15 text-aaccent' : 'border-aline hover:border-aaccent/40'}`}
                        >
                          <span className="block text-sm font-bold">Div {d}</span>
                          <span className="block text-[10px] font-normal text-atext-mute">{count} clubs</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {step === 5 && leagueKey && (
          <motion.div
            key="setup-step-5"
            className="max-w-5xl"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => {
                setClubId(null);
                setStep(tier === 3 ? 4 : 3);
              }}
              disabled={loading}
              className="text-atext-dim text-sm mb-4 hover:text-atext flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />Back
            </button>
            <h2 className={`${css.h1} text-4xl mb-4`}>CHOOSE YOUR CLUB</h2>
            <p className="text-atext-dim mb-2">{PYRAMID[leagueKey]?.name}</p>
            {tier === 3 && leagueKey && state && <SetupPyramidHint state={state} tier={tier} leagueKey={leagueKey} />}
            {(() => {
              const dmeta = getDifficultyProfile(difficulty);
              return (
                <div className={`${css.panel} p-4 mb-6 text-[12px] text-atext-dim space-y-1`}>
                  <div>
                    <span className="text-atext-mute font-mono uppercase text-[10px]">Coach</span>{' '}
                    <strong className="text-atext">{managerName || 'Coach'}</strong>
                    {' · '}
                    <span style={{ color: dmeta.color }}>{dmeta.label}</span>
                  </div>
                  <div>
                    <span className="text-atext-mute font-mono uppercase text-[10px]">Path</span>{' '}
                    <strong className="text-atext">{state}</strong>
                    {' · '}Tier {tier}
                    {tier === 3 && tier3K ? ` · Division ${effectiveTier3Div}` : ''}
                  </div>
                </div>
              );
            })()}
            <div className="grid md:grid-cols-3 gap-4">
              {availableClubs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClubId(c.id)}
                  className={`${css.panelHover} p-5 text-left ring-2 transition ${clubId === c.id ? 'ring-aaccent' : 'ring-transparent'}`}
                >
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
            {startError && (
              <div className="mb-3 p-3 rounded-xl text-sm text-aneg bg-aneg/10 border border-aneg/30">
                ⚠️ {startError}
              </div>
            )}
            <button type="button" onClick={start} disabled={loading || !clubId} className={`${css.btnPrimary} w-full text-lg py-4 mt-6 ${loading ? 'opacity-70' : 'glow'}`}>
              {loading ? '⏳ Starting career…' : 'START CAREER →'}
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
      <div className="border-t border-aline p-4 text-center text-[10px] text-atext-mute uppercase tracking-widest font-mono">A Football Manager-style game for Australian rules</div>
    </div>
  );
}
