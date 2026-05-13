import React from "react";
import { motion } from "motion/react";
import {
  Users,
  DollarSign,
  Handshake,
  Trophy,
  Play,
  FileText,
  Newspaper,
  Building2,
  Dumbbell,
  Repeat,
  ChevronRight,
  Medal,
} from "lucide-react";
import { findClub } from "../../data/pyramid.js";
import { finalsLabel } from "../../lib/leagueEngine.js";
import { fmtK, avgFacilities, avgStaff } from "../../lib/format.js";
import { TRAINING_INFO, formatDate } from "../../lib/calendar.js";
import { getAdvanceContext } from "../../lib/advanceContext.js";
import { effectiveWageCap, currentPlayerWageBill } from "../../lib/finance/engine.js";
import {
  TRADE_PERIOD_DAYS,
  POST_TRADE_DRAFT_COUNTDOWN_DAYS,
} from "../../lib/tradePeriod.js";
import { getDifficultyConfig, getDifficultyProfile } from "../../lib/difficulty.js";
import {
  groundConditionBand,
  stadiumDescription,
  committeeMoodAverage,
} from "../../lib/community.js";
import { ladderNeighbourClubs } from "../../lib/hubRivals.js";
import { boardObjectiveUiStatus, youthSeniorGameCount } from "../../lib/board.js";
import { themedRoundForNumber } from "../../lib/themedRounds.js";
import { css, Pill, Stat, Jersey } from "../../components/primitives.jsx";
import MatchPreviewPanel from "../../components/MatchPreviewPanel.jsx";

const hubContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.04 },
  },
};

const hubItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
};

// ============================================================================
// HUB SCREEN
// ============================================================================
// ---------------------------------------------------------------------------
// Hub strip showing ground conditions + footy trip prompt + committee mood.
// Spec Sections 3A, 3B, 3D.
// ---------------------------------------------------------------------------
function HubGroundStrip({ career, club, league, setScreen, setTab }) {
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
          <FootyTripPromoCard career={career} setScreen={setScreen} setTab={setTab} />
        ) : showCommunity ? (
          <CommitteeMiniSummary career={career} setScreen={setScreen} setTab={setTab} />
        ) : (
          <DifficultyMiniSummary career={career} cfg={cfg} />
        )}
      </div>
    </div>
  );
}

function FootyTripPromoCard({ career, setScreen, setTab }) {
  const social = (career.committee || []).find(m => m.role === 'Social Coordinator');
  return (
    <div>
      <div className={css.label}>Footy Trip</div>
      <div className="font-bold text-sm text-atext leading-tight mb-1">{social ? social.name : 'The Social Coordinator'} has a proposal</div>
      <div className="text-[11px] text-atext-dim mb-3 leading-snug">An annual footy trip is on the table. Approve a destination in the Club tab.</div>
      <button
        onClick={() => {
          setScreen('club');
          setTab?.('committee');
        }}
        className={`${css.btnPrimary} text-[10px] py-2 px-3`}
      >
        OPEN CLUB →
      </button>
    </div>
  );
}

function CommitteeMiniSummary({ career, setScreen, setTab }) {
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
      <button
        onClick={() => {
          setScreen('club');
          setTab?.('committee');
        }}
        className={`${css.btnGhost} text-[10px] py-1.5 px-2.5`}
      >
        VIEW COMMITTEE →
      </button>
    </div>
  );
}

function HubSimulationSnippet({ career }) {
  const cfg = getDifficultyConfig(career.difficulty);
  const profile = getDifficultyProfile(career.difficulty);
  let facAvg = null;
  try {
    const f = career.facilities;
    if (f && typeof f === "object" && Object.keys(f).length > 0) {
      facAvg = Math.round(avgFacilities(f) * 10) / 10;
    }
  } catch {
    facAvg = null;
  }
  let staffAvg = null;
  try {
    if (Array.isArray(career.staff) && career.staff.length > 0) {
      staffAvg = Math.round(avgStaff(career.staff) * 10) / 10;
    }
  } catch {
    staffAvg = null;
  }
  const phaseBits =
    career.phase === "preseason"
      ? "Pre-season"
      : career.inFinals
        ? "Finals"
        : `Round ${career.week ?? "—"}`;
  const roundTheme =
    career.phase === "season" && !career.inFinals && career.week
      ? themedRoundForNumber(career.week)
      : null;
  const focusLead =
    career.training?.focus &&
    Object.entries(career.training.focus).sort((a, b) => b[1] - a[1])[0]?.[0];
  return (
    <motion.div variants={hubItem} className={`${css.panel} p-3`}>
      <div className={css.label}>Simulation & club shape</div>
      <div className="text-sm text-atext mt-1 leading-snug">
        <span className="font-bold" style={{ color: profile.color }}>
          {profile.label}
        </span>
        <span className="text-atext-dim"> · </span>
        {phaseBits}
        {roundTheme?.short && (
          <>
            <span className="text-atext-dim"> · </span>
            <span className="text-amber-700/90 dark:text-amber-400/90">{roundTheme.short}</span>
          </>
        )}
        <span className="text-atext-dim"> · </span>
        {cfg.boardPatienceSeasons} season{cfg.boardPatienceSeasons === 1 ? "" : "s"} board patience · {cfg.injuryMultiplier}× injuries
      </div>
      {career.phase === "season" && !career.inFinals && (
        <div className="text-[11px] text-atext-dim mt-2 leading-relaxed">
          Match plan <span className="font-semibold text-atext">{career.tacticChoice || "balanced"}</span>
          {" · "}
          training ~{career.training?.intensity ?? 60}%
          {focusLead ? (
            <>
              {" "}
              · focus leans <span className="text-atext">{focusLead}</span>
            </>
          ) : null}
        </div>
      )}
      {(facAvg != null || staffAvg != null) && (
        <div className="text-[11px] text-atext-dim mt-2 leading-relaxed">
          {facAvg != null && <>Facilities ~{facAvg.toFixed(1)}</>}
          {facAvg != null && staffAvg != null && <span> · </span>}
          {staffAvg != null && <>Staff ~{staffAvg.toFixed(1)}</>}
        </div>
      )}
    </motion.div>
  );
}

function DifficultyMiniSummary({ career, cfg }) {
  const profile = getDifficultyProfile(career.difficulty);
  return (
    <div>
      <div className={css.label}>Difficulty</div>
      <div className="font-display text-2xl" style={{ color: profile.color }}>{profile.label.toUpperCase()}</div>
      <div className="text-[11px] text-atext-dim mb-2 leading-snug">{profile.summary}</div>
      <div className="text-[10px] text-atext-mute mb-2">
        {cfg.boardPatienceSeasons} season{cfg.boardPatienceSeasons === 1 ? "" : "s"} of board patience · {cfg.injuryMultiplier}× injuries · cash and expectations scale with this profile.
      </div>
    </div>
  );
}

export function HubScreen({ career, club, league, myLadderPos, sortedLadderRows, setScreen, setTab, onAdvance }) {
  const advanceCtx = getAdvanceContext(career, league);
  const hubRoundTheme =
    career.phase === "season" && !career.inFinals && career.week
      ? themedRoundForNumber(career.week)
      : null;
  const sorted = sortedLadderRows;
  const top5 = sorted.slice(0, 5);
  const myRow = sorted.find(r => r.id === career.clubId);
  const recentNews = (career.news || []).slice(0, 6);
  const hubTotals = React.useMemo(() => {
    const wagesAnnual =
      career.squad.reduce((a, p) => a + p.wage, 0) +
      career.staff.reduce((a, s) => a + s.wage, 0);
    const sponsorsAnnual = (career.sponsors || []).reduce((a, s) => a + s.annualValue, 0);
    const squadAvg = career.squad.length
      ? Math.round(career.squad.reduce((a, p) => a + p.overall, 0) / career.squad.length)
      : 0;
    return { wagesAnnual, sponsorsAnnual, squadAvg };
  }, [career.squad, career.staff, career.sponsors]);
  const { wagesAnnual, sponsorsAnnual, squadAvg } = hubTotals;
  const posColor = myLadderPos <= 2 ? "var(--A-pos)" : myLadderPos <= 5 ? "var(--A-accent)" : "var(--A-neg)";

  // Next 7 upcoming events
  const upcoming7 = (career.eventQueue || []).filter(e => !e.completed).slice(0, 7);

  // Last event display
  const lastEv = career.lastEvent;
  const cap = effectiveWageCap(career);
  const playerWagesHub = currentPlayerWageBill(career);
  const capPctHub = cap > 0 ? Math.round((playerWagesHub / cap) * 100) : 0;

  const boardObjectiveRows = React.useMemo(() => {
    const objs = career.board?.objectives;
    if (!objs?.length) return [];
    const order = sorted.findIndex((r) => r.id === career.clubId) + 1;
    const youthN = youthSeniorGameCount(career.squad);
    return objs.map((obj) => {
      let current = obj.current;
      if (obj.met == null) {
        if (obj.type === "ladder_position") current = order;
        else if (obj.type === "budget_discipline") current = career.finance?.cash ?? 0;
        else if (obj.type === "youth_promoted") current = youthN;
        else if (obj.type === "premiership") current = career.premiership === career.season ? 1 : 0;
      }
      const synthetic = { ...obj, current };
      return {
        id: obj.id,
        description: obj.description,
        setBy: obj.setBy,
        status: boardObjectiveUiStatus(synthetic, career),
      };
    });
  }, [career, sorted]);

  return (
    <motion.div className="space-y-5" variants={hubContainer} initial="hidden" animate="show">
      {/* Hero Banner */}
      <motion.div variants={hubItem} className="panel rounded-2xl overflow-hidden relative min-h-[160px] border border-aline">
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
              {hubRoundTheme?.short && (
                <Pill color="#B45309">{hubRoundTheme.short}</Pill>
              )}
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
      </motion.div>

      {cap > 0 && (
        <motion.div variants={hubItem} className="flex flex-wrap items-center gap-2 px-0.5">
          <button
            type="button"
            onClick={() => { setScreen('club'); setTab('finances'); }}
            className="text-left"
          >
            <Pill color={capPctHub >= 100 ? '#E84A6F' : capPctHub >= 90 ? '#FFB347' : '#64748B'}>
              Player cap {capPctHub}% · {fmtK(playerWagesHub)} / {fmtK(cap)}
            </Pill>
          </button>
          {capPctHub >= 88 && (
            <span className="text-[11px] text-atext-dim leading-snug max-w-xl">
              {capPctHub >= 100 ? 'Over the effective cap — expect board pressure after matches until you trim wages.' : 'Cap is tight — plan trades and renewals before offers blow the list up.'}
            </span>
          )}
        </motion.div>
      )}

      <HubSimulationSnippet career={career} />

      {/* Ground & Footy Trip strip — Spec 3D + 3B + Committee */}
      <motion.div variants={hubItem}>
        <HubGroundStrip career={career} club={club} league={league} setScreen={setScreen} setTab={setTab} />
      </motion.div>

      {(() => {
        const neigh = ladderNeighbourClubs(sorted, career.clubId);
        if (neigh.length === 0) return null;
        return (
          <motion.div variants={hubItem} className={`${css.panel} p-3`}>
            <div className={css.label}>Ladder neighbours</div>
            <div className="text-sm text-atext mt-1 leading-snug">
              {neigh.map(({ club: nc, pts }) => `${nc.short} (${pts} pts)`).join(" · ")}
              <span className="text-atext-dim"> — the ladder pack beside you shapes the run home.</span>
            </div>
          </motion.div>
        );
      })()}

      {career.dynasty?.quests?.length > 0 && (
        <motion.div variants={hubItem} className={`${css.panel} p-4`}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Medal className="w-4 h-4 text-[#E8C547]" aria-hidden />
            <h3 className="font-display text-lg text-atext tracking-wide">DYNASTY GOALS</h3>
            <span className="text-[10px] font-mono text-atext-mute uppercase tracking-wider">
              {(career.dynasty?.lifetimeGoals ?? 0)} lifetime completes
            </span>
          </div>
          <ul className="space-y-2">
            {(career.dynasty.quests || []).map((q) => (
              <li
                key={q.id}
                className="rounded-xl border border-aline bg-apanel-2/80 px-3 py-2 flex flex-wrap items-start justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-atext leading-snug">{q.label}</div>
                  {q.kind === "wins" && (
                    <div className="text-[10px] text-atext-dim mt-1 font-mono">
                      Wins {Math.min(q.progress ?? 0, q.target ?? 0)}/{q.target ?? "—"}
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-black font-mono uppercase tracking-wider shrink-0 px-2 py-1 rounded-md border border-aline ${
                    q.complete ? "text-[#4AE89A]" : "text-atext-dim"
                  }`}
                >
                  {q.complete ? "Done" : q.kind === "ladder_pos" ? "EoS" : "Active"}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {boardObjectiveRows.length > 0 && (
        <motion.div variants={hubItem} className={`${css.panel} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="font-display text-lg text-atext tracking-wide">BOARD OBJECTIVES</h3>
            <button
              type="button"
              onClick={() => {
                setScreen("club");
                setTab?.("board");
              }}
              className={`${css.btnGhost} text-[10px] py-1.5 px-2.5`}
            >
              Open board tab →
            </button>
          </div>
          <ul className="space-y-2">
            {boardObjectiveRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-aline bg-apanel-2/80 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">{row.setBy}</div>
                  <div className="text-sm text-atext leading-snug">{row.description}</div>
                </div>
                <span
                  className={`text-[10px] font-black font-mono uppercase tracking-wider shrink-0 px-2 py-1 rounded-md border border-aline ${
                    row.status === "ON TRACK"
                      ? "text-[#4AE89A]"
                      : row.status === "AT RISK" || row.status === "MISSED"
                        ? "text-[#E84A6F]"
                        : row.status === "MET"
                          ? "text-[#4AE89A]"
                          : "text-atext-dim"
                  }`}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {(() => {
        const playerQ = (career.pendingRenewals || []).filter((r) => !r._handled).length;
        const staffQ = (career.pendingStaffRenewals || []).filter((r) => !r._handled).length;
        if (career.renewalsClosed || (!playerQ && !staffQ)) return null;
        return (
          <motion.div variants={hubItem} className={`${css.panel} p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`} style={{ borderColor: '#FFB347', background: 'rgba(255,179,71,0.06)' }}>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#FFB347] flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-atext">Renewals need you</div>
                <div className="text-xs text-atext-dim mt-1 leading-relaxed">
                  {playerQ > 0 && <span>{playerQ} player{playerQ === 1 ? '' : 's'} </span>}
                  {playerQ > 0 && staffQ > 0 && <span>· </span>}
                  {staffQ > 0 && <span>{staffQ} staff role{staffQ === 1 ? '' : 's'} </span>}
                  <span className="block sm:inline sm:mt-0 mt-1">
                    Pre-season only for the formal queue — Club → Contracts or Squad → Renewals. Week-to-week you can still extend individuals from their player card (cap-checked).
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setScreen('club');
                setTab('contracts');
              }}
              className={`${css.btnPrimary} text-xs px-4 py-2 whitespace-nowrap`}
            >
              Open contracts →
            </button>
          </motion.div>
        );
      })()}

      <motion.div variants={hubItem}>
        <MatchPreviewPanel career={career} league={league} />
      </motion.div>

      {/* Last Event Result Card */}
      {lastEv && (
        <motion.div variants={hubItem} className={`${css.panel} p-4`}>
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
                <div className={css.label}>
                  {lastEv.type === 'preseason_match'
                    ? lastEv.label
                    : `Round ${lastEv.round}${lastEv.themedRound?.short ? ` (${lastEv.themedRound.short})` : ''}`}
                </div>
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
        </motion.div>
      )}

      {/* Upcoming Events Strip */}
      <motion.div variants={hubItem} className={css.panel}>
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="font-display text-lg text-atext tracking-wide">UPCOMING</h3>
          <button type="button" onClick={() => setScreen('schedule')} className="text-[11px] font-bold text-aaccent uppercase tracking-wider hover:text-[#F0A558]">Full calendar →</button>
        </div>
        {upcoming7.length === 0 ? (
          <div className="px-4 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-atext-dim leading-relaxed flex-1">
              No events on this strip yet — advance time or open the calendar to line up training, fixtures, and off-field weeks.
            </p>
            <button
              type="button"
              onClick={onAdvance}
              className="rounded-xl px-3 py-2 text-[11px] font-bold text-white inline-flex items-center gap-2 shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--A-accent),#D07A2A)' }}
            >
              <Play className="w-4 h-4" />
              <span>{advanceCtx.buttonLabel}</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
            {upcoming7.map((ev) => {
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
        )}
      </motion.div>

      {/* Finals Banner */}
      <motion.div variants={hubItem} className="space-y-3">
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
      </motion.div>

      {/* Stat Row */}
      <motion.div variants={hubItem} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Squad Rating" value={squadAvg} sub={`${career.squad.length} players`} accent="var(--A-accent)" icon={Users} />
          <Stat label="Cash" value={fmtK(career.finance.cash)} sub={`Wages ${fmtK(wagesAnnual)}/yr`} accent="#4AE89A" icon={DollarSign} />
          <Stat label="Sponsors" value={fmtK(sponsorsAnnual)} sub={`${(career.sponsors || []).length} active deals`} accent="#4ADBE8" icon={Handshake} />
          <Stat label="Ladder Pos" value={`#${myLadderPos||"—"}`} sub={`${myRow?.W ?? 0}W / ${myRow?.L ?? 0}L`} accent={posColor} icon={Trophy} />
      </motion.div>

      <motion.div variants={hubItem} className="grid md:grid-cols-5 gap-5">
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
      </motion.div>

      {/* Board Pressure */}
      <motion.div variants={hubItem} className="space-y-3">
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
      </motion.div>

      {/* Quick links */}
      <motion.div variants={hubItem} className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
      </motion.div>
    </motion.div>
  );
}
