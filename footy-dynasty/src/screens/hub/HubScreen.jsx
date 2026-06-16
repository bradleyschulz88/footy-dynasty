import React from "react";
import { motion } from "motion/react";
import {
  Users,
  DollarSign,
  Handshake,
  Trophy,
  Play,
  FastForward,
  FileText,
  Newspaper,
  Building2,
  Dumbbell,
  Repeat,
  ChevronRight,
} from "lucide-react";
import { TaskList } from "../../components/TaskList.jsx";
import { findClub } from "../../data/pyramid.js";
import { finalsRoundLabel, playerFinalsOpponent, finalsSeedFor } from "../../lib/finalsBracket.js";
import { fmtK } from "../../lib/format.js";
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
import { css, Pill, Stat, CollapsibleSection } from "../../components/primitives.jsx";
import MatchPreviewPanel from "../../components/MatchPreviewPanel.jsx";
import { finalsMagicNumber } from "../../lib/magicNumber.js";
import { seasonNarrative } from "../../lib/seasonNarrative.js";

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

function weatherEmoji(condition) {
  if (!condition) return '🌤️';
  const c = condition.toLowerCase();
  if (c === 'sunny' || c === 'fine') return '☀️';
  if (c === 'cloudy' || c === 'overcast') return '⛅️';
  if (c === 'windy' || c === 'wind') return '💨';
  if (c === 'rainy' || c === 'wet' || c === 'rain') return '🌧️';
  if (c === 'stormy') return '⛈️';
  return '🌤️';
}

// ---------------------------------------------------------------------------
// Hub strip showing ground conditions + footy trip prompt + committee mood.
// Spec Sections 3A, 3B, 3D.
// ---------------------------------------------------------------------------
function HubGroundStrip({ career, club, league, setScreen, setTab }) {
  const cfg = getDifficultyConfig(career.difficulty);
  const showCommunity = league.tier <= 3 && Array.isArray(career.committee) && career.committee.length > 0;
  const band = groundConditionBand(career.groundCondition ?? 85);
  const stadiumLevel = career.facilities?.stadium?.level ?? 1;
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
  const accent = avg >= 70 ? 'var(--A-pos)' : avg >= 40 ? 'var(--A-accent-2)' : 'var(--A-neg)';
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

export function HubScreen({ career, club, league, myLadderPos, sortedLadderRows, setScreen, setTab, onAdvance, onQuickAdvance, updateCareer }) {
  const cc1 = club?.colors?.[0] ?? '#334155';
  const cc2 = club?.colors?.[1] ?? '#0f172a';
  const cc3 = club?.colors?.[2] ?? cc1;
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
    const totalTeams = sorted.length || 18;
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
      const status = boardObjectiveUiStatus(synthetic, career);
      let pct;
      if (obj.type === "ladder_position" && current != null && obj.target != null) {
        const target = obj.target;
        pct = Math.min(100, Math.max(0, ((totalTeams - current) / Math.max(1, totalTeams - target)) * 100));
      } else if (status === "ON TRACK" || status === "MET") {
        pct = 75;
      } else if (status === "AT RISK") {
        pct = 30;
      } else if (status === "MISSED") {
        pct = 10;
      }
      return {
        id: obj.id,
        description: obj.description,
        setBy: obj.setBy,
        status,
        pct,
      };
    });
  }, [career, sorted]);

  const handleTaskNavigate = (screen, tab) => {
    setScreen(screen);
    if (tab) setTab(tab);
  };

  return (
    <motion.div className="space-y-5" variants={hubContainer} initial="hidden" animate="show">
      {/* Hero — club identity + advance CTA */}
      <motion.div variants={hubItem} className="panel rounded-2xl overflow-hidden border border-aline">
        {/* Club color stripe — thicker, more dramatic */}
        <div className="h-1" style={{background:`linear-gradient(90deg, ${cc1}, ${cc2}, ${cc1}88)`}} />
        <div className="p-4 md:p-5">
          {/* Club identity row */}
          <div className="flex items-center gap-3 mb-4">
            {/* Club badge */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl flex-shrink-0"
              style={{
                background:`linear-gradient(145deg,${cc1},${cc2})`,
                color:cc3,
                boxShadow:`0 6px 20px ${cc1}55, 0 0 0 1px ${cc1}33`,
              }}>
              {club.short}
            </div>
            {/* Club name + meta */}
            <div className="min-w-0 flex-1">
              <h1 className="display text-[clamp(1.6rem,6vw,2.5rem)] tracking-wide text-atext leading-none truncate">{club.name.toUpperCase()}</h1>
              <div className="text-[11px] text-atext-dim mt-0.5 truncate font-mono">
                {league.name} · Season {career.season}
                {hubRoundTheme?.short && <> · <span style={{color:'var(--A-accent-2)'}}>{hubRoundTheme.short}</span></>}
              </div>
            </div>
            {/* Position number — dramatic */}
            <div className="text-center flex-shrink-0">
              <div
                className="font-display leading-none"
                style={{
                  fontSize: 'clamp(3rem,10vw,4rem)',
                  color: posColor,
                  textShadow: myLadderPos <= 4 ? `0 0 32px ${posColor}66, 0 0 64px ${posColor}33` : 'none',
                }}>
                {myLadderPos || '—'}
              </div>
              <div className="text-[9px] text-atext-mute uppercase tracking-widest font-mono">Pos</div>
            </div>
          </div>
          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-2 mb-4 rounded-xl p-3" style={{background:'color-mix(in srgb, var(--A-accent) 4%, var(--A-panel-2))', border:'1px solid var(--A-line)'}}>
            <div className="text-center">
              <div className="font-display text-2xl leading-none text-atext">{hubTotals.squadAvg || '—'}</div>
              <div className="text-[9px] text-atext-mute uppercase tracking-widest font-mono mt-0.5">OVR</div>
            </div>
            <div className="text-center border-x border-aline">
              <div className="font-display text-2xl leading-none text-atext">{myRow ? `${myRow.W}W ${myRow.L}L` : '—'}</div>
              <div className="text-[9px] text-atext-mute uppercase tracking-widest font-mono mt-0.5">Record</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl leading-none" style={{color:'var(--A-accent)'}}>{myRow?.pts ?? '—'}</div>
              <div className="text-[9px] text-atext-mute uppercase tracking-widest font-mono mt-0.5">Pts</div>
            </div>
          </div>
          {/* Pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Pill color="var(--A-accent)">Tier {league.tier}</Pill>
            {career.phase === 'preseason'
              ? <Pill color="var(--A-accent)">Pre-Season</Pill>
              : career.inFinals
                ? <Pill color="var(--A-neg)">Finals</Pill>
                : <Pill color="var(--A-accent)">Round {career.week}</Pill>}
            {league.tier === 1 && !career.inFinals && career.phase !== 'preseason' && (() => {
              const mn = finalsMagicNumber(career);
              return mn ? <Pill color={mn.clinched ? 'var(--A-pos)' : 'var(--A-accent-2)'}>{mn.label}</Pill> : null;
            })()}
            {career.clubCulture && (() => {
              const cultureColor = career.clubCulture.tier === 'Elite' ? 'var(--A-accent-2)' : career.clubCulture.tier === 'Strong' ? 'var(--A-pos)' : career.clubCulture.tier === 'Developing' ? 'var(--A-accent)' : 'var(--A-text-mute)';
              return <Pill color={cultureColor}>Culture: {career.clubCulture.tier}</Pill>;
            })()}
          </div>
          {/* Advance CTA */}
          <button
            type="button"
            onClick={onAdvance}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-display text-lg uppercase tracking-[0.14em] transition-all active:scale-[0.98] advance-breathe"
            style={{
              background: 'var(--A-accent)',
              color: 'var(--fd-on-accent, #0A0D0C)',
              boxShadow: '0 4px 24px color-mix(in srgb, var(--A-accent) 35%, transparent), 0 0 0 1px color-mix(in srgb, var(--A-accent) 40%, transparent)',
            }}
          >
            <Play className="w-5 h-5" fill="currentColor" />
            {advanceCtx.buttonLabel.toUpperCase()}
          </button>
          {onQuickAdvance && (
            <button
              type="button"
              onClick={onQuickAdvance}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.16em] text-atext-dim hover:text-atext transition-colors"
              style={{ border: '1px solid var(--A-line)' }}
              title="Batch through training days and stop at the next match, key event or decision"
            >
              <FastForward className="w-3.5 h-3.5" />
              Sim to next key moment
            </button>
          )}
        </div>
      </motion.div>

      {cap > 0 && (
        <motion.div variants={hubItem} className="flex flex-wrap items-center gap-2 px-0.5">
          <button
            type="button"
            onClick={() => { setScreen('club'); setTab('finances'); }}
            className="text-left"
          >
            <Pill color={capPctHub >= 100 ? 'var(--A-neg)' : capPctHub >= 90 ? 'var(--A-accent-2)' : 'var(--A-text-mute)'}>
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

      {/* Season narrative arc */}
      {(() => {
        const narr = seasonNarrative(career, sorted, league);
        if (!narr) return null;
        const toneColor = narr.tone === 'positive' ? 'var(--A-pos)'
          : narr.tone === 'negative' ? 'var(--A-neg)'
          : narr.tone === 'tense' ? 'var(--A-accent-2)'
          : 'var(--A-accent)';
        const toneEmoji = narr.tone === 'positive' ? '📈'
          : narr.tone === 'negative' ? '📉'
          : narr.tone === 'tense' ? '⚡'
          : '📰';
        return (
          <motion.div variants={hubItem}
            className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ background: `color-mix(in srgb, ${toneColor} 6%, var(--A-panel))`, border: `1px solid color-mix(in srgb, ${toneColor} 22%, var(--A-line))` }}>
            <span className="text-xl flex-shrink-0 mt-0.5">{toneEmoji}</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest font-mono mb-1" style={{ color: toneColor }}>{narr.headline}</div>
              <div className="text-sm text-atext leading-relaxed">{narr.body}</div>
            </div>
          </motion.div>
        );
      })()}

      {/* Match preview — moved up so it's the first thing after the hero */}
      <motion.div variants={hubItem}>
        <MatchPreviewPanel career={career} league={league} onUpdateCareer={updateCareer} />
      </motion.div>

      {/* Action board + coaching suggestions */}
      <motion.div variants={hubItem}>
        <TaskList career={career} onNavigate={handleTaskNavigate} myLadderPos={myLadderPos} league={league} />
      </motion.div>

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
        <motion.div variants={hubItem}>
        <CollapsibleSection
          id="dynasty_goals"
          title="Dynasty goals"
          right={<span className="text-[10px] font-mono text-atext-mute uppercase tracking-wider shrink-0">{(career.dynasty?.lifetimeGoals ?? 0)} done</span>}
        >
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
                    q.complete ? "text-apos" : "text-atext-dim"
                  }`}
                >
                  {q.complete ? "Done" : q.kind === "ladder_pos" ? "EoS" : "Active"}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
        </motion.div>
      )}

      {career.dynasty?.milestones?.length > 0 && (
        <motion.div variants={hubItem}>
        <CollapsibleSection
          id="legacy_milestones"
          title="Legacy milestones"
          right={<span className="text-[10px] font-mono text-atext-mute uppercase tracking-wider shrink-0">career-long</span>}
        >
          <ul className="space-y-2">
            {(career.dynasty.milestones || []).map((m) => {
              const hasCount = m.kind === "career_wins" || m.kind === "premierships" || m.kind === "seasons_managed";
              const pct = hasCount && m.target > 0 ? Math.min(100, Math.round(((m.progress ?? 0) / m.target) * 100)) : 0;
              return (
                <li key={m.id} className="rounded-xl border border-aline bg-apanel-2/80 px-3 py-2 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-xs text-atext leading-snug min-w-0 flex-1">{m.label}</div>
                    <span className={`text-[10px] font-black font-mono uppercase tracking-wider shrink-0 px-2 py-1 rounded-md border border-aline ${m.complete ? "text-apos" : "text-atext-dim"}`}>
                      {m.complete ? "Done" : hasCount ? `${m.progress ?? 0}/${m.target}` : "Active"}
                    </span>
                  </div>
                  {hasCount && !m.complete && (
                    <div className="h-1 rounded-full bg-apanel overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--A-accent)" }} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CollapsibleSection>
        </motion.div>
      )}

      {boardObjectiveRows.length > 0 && (
        <motion.div variants={hubItem}>
        <CollapsibleSection
          id="board_objectives"
          title="Board objectives"
          right={(
            <button
              type="button"
              onClick={() => { setScreen("club"); setTab?.("board"); }}
              className={`${css.btnGhost} text-[10px] py-1.5 px-2.5 shrink-0`}
            >
              Open board tab →
            </button>
          )}
        >
          <ul className="space-y-2">
            {boardObjectiveRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-aline bg-apanel-2/80 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">{row.setBy}</div>
                  <div className="text-sm text-atext leading-snug">{row.description}</div>
                  {row.pct !== undefined && (
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{background:'var(--A-line)'}}>
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${Math.min(100, row.pct ?? 0)}%`,
                        background: row.status === 'MET' || row.status === 'ON TRACK' ? 'var(--A-pos)' : row.status === 'AT RISK' ? '#FFB347' : 'var(--A-neg)'
                      }} />
                    </div>
                  )}
                </div>
                <span
                  className={`text-[10px] font-black font-mono uppercase tracking-wider shrink-0 px-2 py-1 rounded-md border border-aline ${
                    row.status === "ON TRACK"
                      ? "text-apos"
                      : row.status === "AT RISK" || row.status === "MISSED"
                        ? "text-aneg"
                        : row.status === "MET"
                          ? "text-apos"
                          : "text-atext-dim"
                  }`}
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
        </motion.div>
      )}

      {(() => {
        const playerQ = (career.pendingRenewals || []).filter((r) => !r._handled).length;
        const staffQ = (career.pendingStaffRenewals || []).filter((r) => !r._handled).length;
        if (career.renewalsClosed || (!playerQ && !staffQ)) return null;
        return (
          <motion.div variants={hubItem} className={`${css.panel} p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`} style={{ borderColor: '#FFB347', background: 'rgba(255,179,71,0.06)' }}>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-aaccent-2 flex-shrink-0 mt-0.5" />
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

      {/* Last Event Result Card */}
      {lastEv && (
        <motion.div variants={hubItem} className={`${css.panel} p-4`}>
          {lastEv.type === 'training' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'color-mix(in srgb, var(--A-pos) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--A-pos) 25%, transparent)'}}>
                {TRAINING_INFO[lastEv.subtype]?.icon || '🏋️'}
              </div>
              <div className="flex-1">
                <div className={css.label}>Last Session</div>
                <div className="font-bold text-atext">{lastEv.name} <span className="text-atext-dim font-normal text-sm">· {formatDate(lastEv.date)}</span></div>
                <div className="text-xs text-atext-dim mt-1">Led by {lastEv.staffName} (Rating: {lastEv.staffRating}) · Gains:&nbsp;
                  {Object.entries(lastEv.gains || {}).map(([k, v]) => `${k} +${v}`).join(', ') || '—'}
                </div>
                {lastEv.devNotes && lastEv.devNotes.length > 0 && (
                  <div className="text-xs text-apos mt-1 leading-relaxed">
                    {lastEv.devNotes.join(' · ')}
                  </div>
                )}
              </div>
            </div>
          )}
          {lastEv.type === 'key_event' && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{background:'color-mix(in srgb, var(--A-accent) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)'}}>📅</div>
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
                style={{background: lastEv.won ? 'color-mix(in srgb, var(--A-pos) 10%, transparent)' : lastEv.drew ? 'color-mix(in srgb, var(--A-accent-2) 10%, transparent)' : 'color-mix(in srgb, var(--A-neg) 10%, transparent)', border: `1px solid ${lastEv.won ? 'color-mix(in srgb, var(--A-pos) 25%, transparent)' : lastEv.drew ? 'color-mix(in srgb, var(--A-accent-2) 25%, transparent)' : 'color-mix(in srgb, var(--A-neg) 25%, transparent)'}`}}>
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
                  <span className="ml-3 font-display text-xl" style={{color: lastEv.won ? 'var(--A-pos)' : lastEv.drew ? 'var(--A-accent-2)' : 'var(--A-neg)'}}>
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
      <motion.div variants={hubItem}>
      <CollapsibleSection
        id="upcoming_strip"
        title="Upcoming"
        right={<button type="button" onClick={() => setScreen('schedule')} className="text-[11px] font-bold text-aaccent uppercase tracking-wider hover:text-aaccent-2 shrink-0">Full calendar →</button>}
      >
        {upcoming7.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-[11px] text-atext-dim leading-relaxed flex-1">
              No events on this strip yet — advance time or open the calendar to line up training, fixtures, and off-field weeks.
            </p>
            <button
              type="button"
              onClick={onAdvance}
              className="rounded-xl px-3 py-2 text-[11px] font-bold inline-flex items-center gap-2 shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--A-accent),var(--A-accent-2))', color: 'var(--fd-on-accent)' }}
            >
              <Play className="w-4 h-4" />
              <span>{advanceCtx.buttonLabel}</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto">
            {upcoming7.map((ev) => {
              const isMatch = ev.type === 'round' || ev.type === 'preseason_match';
              const isTraining = ev.type === 'training';
              const isKey = ev.type === 'key_event';
              const info = isTraining ? TRAINING_INFO[ev.subtype] : null;
              const color = isMatch ? 'var(--A-accent)' : isKey ? 'var(--A-accent)' : (info?.color || 'var(--A-text-mute)');
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
              const matchWeather = isMatch && ev.round
                ? (career.weeklyWeather || {})[ev.round]
                : null;
              return (
                <div key={ev.id} className="flex-shrink-0 rounded-xl p-3 text-center min-w-[88px]" style={{background:`${color}10`, border:`1px solid ${color}30`}}>
                  <div className="text-[9px] font-bold uppercase tracking-wider" style={{color}}>{formatDate(ev.date).split(' ').slice(0,-1).join(' ')}</div>
                  <div className="text-lg mt-1">{isTraining ? (info?.icon || '🏋️') : isKey ? '📅' : '🏉'}</div>
                  <div className="text-[10px] font-semibold text-atext mt-1 leading-tight">{evLabel}</div>
                  {matchWeather && (
                    <div className="text-[9px] text-atext-dim mt-1 leading-tight">{weatherEmoji(matchWeather)} {matchWeather}</div>
                  )}
                </div>
              );
            })}
            <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[90px] gap-1">
              <div className="text-[10px] font-mono text-atext-mute uppercase tracking-widest mb-1">Next up</div>
              <div className="text-xs font-semibold text-atext mb-1">{advanceCtx.nextEventShort}</div>
              <button type="button" onClick={onAdvance} className="rounded-xl px-3 py-2 text-[11px] font-bold flex flex-col items-center gap-1"
                style={{background:'linear-gradient(135deg,var(--A-accent),var(--A-accent-2))', color:'var(--fd-on-accent)'}}>
                <Play className="w-4 h-4" />
                <span>{advanceCtx.buttonLabel}</span>
              </button>
            </div>
          </div>
        )}
      </CollapsibleSection>
      </motion.div>

      {/* Finals Banner */}
      <motion.div variants={hubItem} className="space-y-3">
      {career.inFinals && (() => {
        const alive = career.finalsAlive || [];
        const stillIn = alive.includes(career.clubId);
        const oppId = stillIn ? playerFinalsOpponent(career) : null;
        const opp = oppId ? findClub(oppId) : null;
        const roundName = finalsRoundLabel(alive.length, league?.tier ?? 1);
        const seed = finalsSeedFor(career.clubId, career.finalsBracket);
        return (
<div className="rounded-2xl p-4 flex items-center justify-between" style={{background:"color-mix(in srgb, var(--A-accent) 8%, transparent)", border:"2px solid color-mix(in srgb, var(--A-accent) 35%, transparent)"}}>
<div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
<div>
<div className="font-display text-2xl text-aaccent">FINALS</div>
<div className="text-sm text-atext-dim">
                {stillIn
                  ? <>Seed #{seed} · {roundName}{opp ? <> vs <span className="font-bold text-atext">{opp.short}</span></> : null}</>
                  : `${alive.length} clubs remain · season over for you`}
</div>
</div>
</div>
<div className="text-right">
<div className="font-display text-xl text-aaccent">{stillIn ? "STILL ALIVE" : "ELIMINATED"}</div>
<div className="text-[10px] text-atext-mute">{alive.length} in contention</div>
</div>
</div>
        );
      })()}

      {career.postSeasonPhase === 'trade_period' && career.inTradePeriod && (
        <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3" style={{background:"color-mix(in srgb, var(--A-pos) 8%, transparent)", border:"2px solid color-mix(in srgb, var(--A-pos) 35%, transparent)"}}>
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
        <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3" style={{background:"color-mix(in srgb, var(--A-accent-2) 8%, transparent)", border:"2px solid color-mix(in srgb, var(--A-accent-2) 30%, transparent)"}}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <div className="font-display text-xl text-aaccent">{career.draftPickBank ? 'NATIONAL DRAFT COUNTDOWN' : 'OFF-SEASON COUNTDOWN'}</div>
              <div className="text-xs text-atext-dim">{career.postSeasonDraftCountdown ?? POST_TRADE_DRAFT_COUNTDOWN_DAYS} step{(career.postSeasonDraftCountdown ?? POST_TRADE_DRAFT_COUNTDOWN_DAYS) === 1 ? '' : 's'} until list reset &amp; new pre-season</div>
            </div>
          </div>
          <div className="text-[10px] text-atext-dim">Keep using <strong>Next</strong> — when this hits zero, the off-season rolls (contracts, draft pool, new calendar).</div>
        </div>
      )}

      {/* Premiership Banner */}
      {career.premiership === career.season && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"color-mix(in srgb, var(--A-accent-2) 12%, transparent)", border:"2px solid color-mix(in srgb, var(--A-accent-2) 45%, transparent)"}}>
          <span className="text-3xl">🎉</span>
                    <div>
            <div className="font-display text-2xl text-aaccent">REIGNING PREMIERS!</div>
            <div className="text-sm text-atext-dim">You won the {career.season} flag — defend it this season.</div>
          </div>
        </div>
      )}
      {career.premiership === career.season - 1 && career.premiership !== career.season && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:"color-mix(in srgb, var(--A-accent-2) 8%, transparent)", border:"2px solid color-mix(in srgb, var(--A-accent-2) 30%, transparent)"}}>
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
          <Stat label="Cash" value={fmtK(career.finance.cash)} sub={`Wages ${fmtK(wagesAnnual)}/yr`} accent="var(--A-pos)" icon={DollarSign} />
          <Stat label="Sponsors" value={fmtK(sponsorsAnnual)} sub={`${(career.sponsors || []).length} active deals`} accent="var(--A-accent)" icon={Handshake} />
          <Stat label="Ladder Pos" value={`#${myLadderPos||"—"}`} sub={`${myRow?.W ?? 0}W / ${myRow?.L ?? 0}L`} accent={posColor} icon={Trophy} />
      </motion.div>

      <motion.div variants={hubItem} className="grid md:grid-cols-5 gap-5">
        {/* Ladder */}
        <div className={`${css.panel} md:col-span-3`}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="font-display text-xl tracking-wide text-atext">LADDER</h3>
            <button onClick={()=>setScreen("compete")} className="text-[11px] font-bold text-aaccent uppercase tracking-wider hover:text-aaccent-2">Full table →</button>
          </div>
          <div>
            {top5.map((row, i) => {
              const c = findClub(row.id);
              if (!c) return null;
              const isMe = row.id === career.clubId;
              const rankColor = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#94A3B8";
              return (
                <React.Fragment key={row.id}>
                  <div className={`flex items-center gap-4 px-5 py-3 transition-colors ${isMe ? "" : "hover:bg-aaccent/5"}`}
                    style={isMe ? {background:"linear-gradient(90deg, color-mix(in srgb, var(--A-accent) 8%, transparent), transparent)", borderLeft:"3px solid var(--A-accent)"} : {borderLeft:"3px solid transparent"}}>
                    <div className="font-display text-2xl w-6 text-center flex-shrink-0" style={{color: rankColor}}>{i+1}</div>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm flex-shrink-0"
                      style={{background:`linear-gradient(135deg,${c.colors?.[0] ?? '#334155'},${c.colors?.[1] ?? '#0f172a'})`, color:c.colors?.[2] ?? c.colors?.[0] ?? '#fff'}}>
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
                  {league.tier >= 2 && i === 0 && (
                    <div className="flex items-center gap-2 mx-5 my-0.5">
                      <div className="flex-1 border-t border-dashed border-apos/50" />
                      <span className="text-[9px] text-apos font-mono uppercase tracking-wider">Promotion zone</span>
                      <div className="flex-1 border-t border-dashed border-apos/50" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {myLadderPos > 5 && myRow && (
              <>
                <div className="px-5 py-1 text-atext-mute text-xs">· · ·</div>
                <div className="flex items-center gap-4 px-5 py-3"
                  style={{background:"linear-gradient(90deg, color-mix(in srgb, var(--A-accent) 8%, transparent), transparent)", borderLeft:"3px solid var(--A-accent)"}}>
                  <div className="font-display text-2xl w-6 text-center text-aaccent">{myLadderPos}</div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm"
                    style={{background:`linear-gradient(135deg,${cc1},${cc2})`, color:cc3}}>
                    {club?.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-aaccent">{club?.name}</div>
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
              const borderColor = n.type === "win" ? "var(--A-pos)" : n.type === "loss" ? "var(--A-neg)" : n.type === "board" ? "#FFB347" : n.type === "info" ? "var(--A-accent-2)" : "var(--A-text-mute)";
              const emoji = n.type === "win" ? "🏆" : n.type === "loss" ? "📉" : n.type === "board" ? "🏛️" : n.type === "info" ? "ℹ️" : "•";
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl" style={{background:"var(--A-panel-2)", border:"1px solid var(--A-line)", borderLeft:`3px solid ${borderColor}`}}>
                  <div className="flex-shrink-0 text-sm leading-snug mt-0.5">{emoji}</div>
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

      {/* Media Panel */}
      {(() => {
        const pressItems = (career.news || []).filter(n => n.type === 'press').slice(0, 3);
        const toneAccent = (tone) =>
          tone === 'positive' ? 'var(--A-pos)'
          : tone === 'critical' ? 'var(--A-neg)'
          : tone === 'negative' ? 'var(--A-accent-2)'
          : 'var(--A-accent)';
        const satPct = career.journalist ? Math.round(career.journalist.satisfaction ?? 50) : null;
        const satColor = satPct == null ? 'var(--A-text-mute)' : satPct >= 65 ? 'var(--A-pos)' : satPct <= 35 ? 'var(--A-neg)' : 'var(--A-accent-2)';
        return (
          <motion.div variants={hubItem}>
            <CollapsibleSection
              id="media_panel"
              title="Media"
              right={
                satPct != null ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider shrink-0" style={{ color: satColor }}>
                    Press mood {satPct}
                  </span>
                ) : null
              }
            >
              {pressItems.length === 0 ? (
                <div className="text-sm text-atext-dim py-2 text-center leading-relaxed">
                  No press coverage yet — results will generate headlines
                </div>
              ) : (
                <div className="space-y-3">
                  {pressItems.map((n, i) => {
                    const accent = toneAccent(n.tone);
                    return (
                      <div key={i} className="rounded-xl p-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)', borderLeft: `3px solid ${accent}` }}>
                        <div className="font-display text-base leading-tight tracking-wide mb-1" style={{ color: accent }}>{n.text}</div>
                        {n.subtext && <div className="text-[11px] text-atext-dim leading-snug">{n.subtext}</div>}
                        <div className="text-[9px] text-atext-mute uppercase tracking-widest mt-1.5 font-bold">
                          {n.week === 0 ? 'Pre-Season' : `Round ${n.week}`}
                          {n.tone && <span className="ml-2 opacity-70">{n.tone}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>
          </motion.div>
        );
      })()}

      {/* Form Watch */}
      {(() => {
        const hotPlayers = [...career.squad].sort((a,b) => (b.form||50) - (a.form||50)).slice(0,1).filter(p => (p.form||50) >= 78);
        const coldPlayers = [...career.squad].sort((a,b) => (a.form||50) - (b.form||50)).slice(0,1).filter(p => (p.form||50) <= 42);
        const formWatch = [...hotPlayers.map(p=>({...p,hot:true})), ...coldPlayers.map(p=>({...p,hot:false}))];
        if (formWatch.length === 0) return null;
        return (
          <motion.div variants={hubItem}>
            <CollapsibleSection id="form_watch" title="Form Watch">
              <div className="space-y-1.5">
                {formWatch.map((p, i) => {
                  const name = p.firstName ? `${p.firstName[0]}. ${p.lastName}` : (p.name || 'Player');
                  return (
                    <div key={p.id || i} className="text-sm text-atext leading-snug">
                      {p.hot ? '🔥' : '❄️'} <span className="font-semibold">{name}</span> <span className="text-atext-dim">(form {p.form || 50})</span> — {p.hot ? 'on fire' : 'struggling'}
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          </motion.div>
        );
      })()}

      {/* Development Watch — Tier 4 (junior/grassroots) only */}
      {league.tier === 4 && (() => {
        const youngest = [...career.squad]
          .sort((a, b) => (a.age || 99) - (b.age || 99))
          .slice(0, 3);
        if (youngest.length === 0) return null;
        return (
          <motion.div variants={hubItem}>
            <CollapsibleSection id="dev_watch" title="Development Watch">
              <div className="space-y-1.5">
                {youngest.map((p, i) => {
                  const name = p.firstName ? `${p.firstName[0]}. ${p.lastName}` : (p.name || 'Player');
                  const pos = p.position || (p.positions && p.positions[0]) || '—';
                  return (
                    <div key={p.id || i} className="flex flex-wrap items-center gap-2 text-sm text-atext leading-snug">
                      <span className="font-semibold">{name}</span>
                      <span className="text-atext-dim">age {p.age} · {pos} · OVR {p.overall}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--A-accent) 14%, transparent)', color: 'var(--A-accent)' }}>developing</span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleSection>
          </motion.div>
        );
      })()}

      {/* Board Pressure */}
      <motion.div variants={hubItem} className="space-y-3">
      {career.finance.boardConfidence < 35 && (
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:'color-mix(in srgb, var(--A-neg) 10%, transparent)', border:'1.5px solid color-mix(in srgb, var(--A-neg) 30%, transparent)'}}>
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-sm text-aneg">Board On Notice — Confidence {career.finance.boardConfidence}%</div>
            <div className="text-xs text-atext-dim">Win your next match or face consequences. The board is watching closely.</div>
          </div>
        </div>
      )}

      {/* Contract Expiry Warnings */}
      {(() => {
        const expiring = career.squad.filter(p => (career.lineup || []).includes(p.id) && p.contract <= 1);
        if (!expiring.length) return null;
        return (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{background:"rgba(232,212,74,0.1)", border:"1.5px solid rgba(232,212,74,0.3)"}}>
            <span className="text-2xl flex-shrink-0">📋</span>
            <div>
              <div className="font-bold text-sm" style={{color:"var(--A-accent-2)"}}>Contracts Expiring — Act Now</div>
              <div className="text-xs text-atext-dim mt-1">
                {expiring.map(p => `${p.firstName} ${p.lastName} (${p.contract === 0 ? 'Out of contract' : '1 year left'})`).join(' · ')}
              </div>
              <button onClick={() => setScreen('squad')} className="mt-2 text-xs font-bold hover:opacity-80" style={{color:"var(--A-accent-2)"}}>Manage contracts →</button>
            </div>
          </div>
        );
      })()}

      {/* Injury Report */}
      {(() => {
        const injuredPlayers = career.squad.filter(p => p.injured > 0);
        if (!injuredPlayers.length) return null;
        const top2 = injuredPlayers.sort((a, b) => b.injured - a.injured).slice(0, 2);
        const names = top2.map(p => `${p.firstName ? p.firstName[0] + '.' : ''} ${p.lastName} (${p.injured}w)`).join(', ');
        return (
          <div className="rounded-2xl p-4 flex items-start gap-3" style={{background:'color-mix(in srgb, var(--A-neg) 7%, transparent)', border:'1.5px solid color-mix(in srgb, var(--A-neg) 30%, transparent)'}}>
            <span className="text-2xl flex-shrink-0">🤕</span>
            <div>
              <div className="font-bold text-sm text-aneg">Injury Report — {injuredPlayers.length} player{injuredPlayers.length !== 1 ? 's' : ''} out</div>
              <div className="text-xs text-atext-dim mt-1">Out: {names}{injuredPlayers.length > 2 ? ` +${injuredPlayers.length - 2} more` : ''}</div>
            </div>
          </div>
        );
      })()}
      </motion.div>

      {career.coachStats && (
        <motion.div variants={hubItem}>
        <CollapsibleSection id="coaching_record" title="Coaching record">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
            <div><div className="font-display text-2xl text-apos">{career.coachStats.totalWins ?? 0}</div><div className={css.label}>Wins</div></div>
            <div><div className="font-display text-2xl text-aneg">{career.coachStats.totalLosses ?? 0}</div><div className={css.label}>Losses</div></div>
            <div><div className="font-display text-2xl text-atext">{career.coachStats.totalDraws ?? 0}</div><div className={css.label}>Draws</div></div>
            <div><div className="font-display text-2xl text-aaccent-2">{career.coachStats.premierships ?? 0}</div><div className={css.label}>Flags</div></div>
            <div><div className="font-display text-2xl text-aaccent">{career.coachStats.promotions ?? 0}</div><div className={css.label}>Promotions</div></div>
            <div><div className="font-display text-2xl text-atext-dim">{career.coachStats.seasonsManaged ?? 1}</div><div className={css.label}>Seasons</div></div>
          </div>
          {career.history && career.history.length > 0 && (
            <div className="mt-3 space-y-1">
              {[...career.history].reverse().slice(0, 3).map((h, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-atext-dim border-t border-aline pt-1">
                  <span>{h.season} · {h.leagueShort || h.leagueKey}</span>
                  <span>#{h.position} · {h.W}W {h.L}L {h.D}D</span>
                  <span>{h.champion ? '🏆' : h.promoted ? '⬆️' : h.relegated ? '⬇️' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
        </motion.div>
      )}

      {/* Quick links */}
      <motion.div variants={hubItem} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users,    label: "Manage Squad",  sub: "Players & lineup", screen: "squad", color: "var(--A-accent)" },
          { icon: Dumbbell, label: "Set Training",  sub: "Intensity & focus", screen: "squad", color: "var(--A-accent-2)" },
          { icon: Building2,label: "Upgrade Club",  sub: "Facilities & staff", screen: "club",  color: "var(--A-pos)" },
          { icon: Repeat,   label: "Trade & Draft", sub: "Signings & youth",   screen: "recruit",color: "var(--A-neg)" },
        ].map(q => {
          const Icon = q.icon;
          return (
            <button key={q.label} onClick={()=>setScreen(q.screen)}
              className="rounded-2xl p-4 text-left flex items-center gap-4 transition-all group"
              style={{background:"var(--A-panel)", border:"1px solid var(--A-line)"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=q.color; e.currentTarget.style.background="color-mix(in srgb, var(--A-accent) 5%, var(--A-panel))";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--A-line)"; e.currentTarget.style.background="var(--A-panel)";}}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:`color-mix(in srgb, ${q.color} 12%, transparent)`, color:q.color}}>
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
