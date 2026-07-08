import React, { useState, useMemo, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import FloatingTooltip from '../../components/FloatingTooltip.jsx';
import { Virtuoso } from 'react-virtuoso';
import {
  Users, Dumbbell,
  Zap, Heart, Target, Activity, Flame,
  TrendingUp, X,
  ShieldCheck,
  FileText,
  UserPlus, Wand2, ListFilter,
  ChevronUp, ChevronDown, Search,
} from "lucide-react";
import { PYRAMID, findClub } from '../../data/pyramid.js';
import { POSITIONS, POSITION_NAMES, playerHasPosition, formatPositionSlash, PLAYER_TRAITS, LINE_FWD, LINE_MID, LINE_BACK, LINE_RUCK } from '../../lib/playerGen.js';
import { PLAYER_ROLES, roleFit } from '../../lib/playerRoles.js';
import { fmtK, clamp } from '../../lib/format.js';
import { footballDeptLevy } from '../../lib/finance/footballDept.js';
import { TRAINING_INFO, formatDate, intensityScale, trainingAttrFocusBoost } from '../../lib/calendar.js';
import { css, RatingDot, Pill } from '../../components/primitives.jsx';
import { SquadLineupBuilder, LineupSortablePanel } from '../../components/SquadLineupDnD.jsx';
import { formBorderColor } from '../../components/LineupOvalField.jsx';
import TabNav from '../../components/TabNav.jsx';
// --- Finance system rebuild ---
import { proposeRenewal, renewalExtensionStableKey, applyRenewal, canAffordRenewal } from '../../lib/finance/contracts.js';
import {
  ensureCareerBoard,
  recalcBoardConfidence,
  applyMemberConfidenceDelta,
} from '../../lib/board.js';
import { lineupPlayersOrdered, LINEUP_CAP, LINEUP_FIELD_COUNT, lineupPlayerCount, lineupHasPlayer, removeIdFromLineup, lineupRole, addToBench, hasFreeBenchSlot, slotRoleCode, playerFitsSlot, SLOT_ZONES, positionFitsZone, isPlayerAvailable, placeOrSwapLineupSlot, lineupToFixedSlots, fixedSlotsToLineup } from '../../lib/lineupHelpers.js';
import { trainingStaffSupportLine } from '../../lib/staffModifiers.js';
import { philosophyTacticFit } from '../../lib/matchEngine.js';
import { tutorialHighlightTab } from "../../components/TutorialOverlay.jsx";
import { RenewalsTab } from "../contracts/ContractRenewals.jsx";
import PlayerCard3D from "../../components/PlayerCard3D.jsx";
import { useCareer, useUpdateCareer } from "../../lib/careerStore.js";
import { moraleBand, moraleToneColor, promiseGameTime, backPlayer } from "../../lib/morale.js";
import { cloneSerializable } from "../../lib/save.js";
import PlayerContextMenu from "../../components/PlayerContextMenu.jsx";

/** Small morale-state pill for the player card / rows. */
function MoraleBandPill({ morale }) {
  const band = moraleBand(morale);
  return <Pill color={moraleToneColor(band.tone)}>{band.label}</Pill>;
}

/** Display name for a player row (shared by the squad views). */
const playerName = (p) => (p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || 'Player'));

function posBadgeStyle(pos) {
  if (pos === 'KF' || pos === 'HF') return {background:'color-mix(in srgb,#E84A6F 14%,transparent)',color:'#E84A6F',border:'1px solid color-mix(in srgb,#E84A6F 30%,transparent)'};
  if (pos === 'HB' || pos === 'KB') return {background:'color-mix(in srgb,#60A5FA 14%,transparent)',color:'#60A5FA',border:'1px solid color-mix(in srgb,#60A5FA 30%,transparent)'};
  if (pos === 'RU') return {background:'color-mix(in srgb,#A78BFA 14%,transparent)',color:'#A78BFA',border:'1px solid color-mix(in srgb,#A78BFA 30%,transparent)'};
  if (pos === 'C' || pos === 'R' || pos === 'WG') return {background:'color-mix(in srgb,var(--A-accent) 14%,transparent)',color:'var(--A-accent)',border:'1px solid color-mix(in srgb,var(--A-accent) 30%,transparent)'};
  return {background:'color-mix(in srgb,#9CA3AF 14%,transparent)',color:'#9CA3AF',border:'1px solid color-mix(in srgb,#9CA3AF 30%,transparent)'};
}

function ContractChip({ years }) {
  if (years == null) return null;
  const color = years <= 0 ? 'var(--A-neg)' : years === 1 ? '#F59E0B' : 'var(--A-pos)';
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-black px-1.5 py-0.5 rounded" style={{background:`color-mix(in srgb,${color} 14%,transparent)`,color,border:`1px solid color-mix(in srgb,${color} 30%,transparent)`}}>
      {years <= 0 ? 'OOC' : `${years}y`}
    </span>
  );
}

// ============================================================================
// SHARED TAB NAV
// ============================================================================

/** True on lg+ screens. Lets us show an inline side panel on desktop but pop a
 *  modal on phones so a tapped player card appears immediately, not below. */
function useIsLg() {
  const [isLg, setIsLg] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLg(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isLg;
}

/** Phone/tablet bottom-sheet that pops the player card immediately on tap. */
function PlayerCardModal({ player, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto bg-apanel rounded-t-2xl sm:rounded-2xl border border-aline anim-in"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <PlayerDetail player={player} onClose={onClose} />
      </div>
    </div>
  );
}

// ============================================================================
// SQUAD SCREEN — players, tactics, training
// ============================================================================
export default function SquadScreen({ club, tab, setTab, tutorialActive, onOpenClubStaff, onNavigate }) {
  const career = useCareer();
  const playerRenewals = (career.pendingRenewals || []).filter(r => !r._handled).length;
  const staffRenewals = (career.pendingStaffRenewals || []).filter((r) => !r._handled).length;
  const renewalCount = playerRenewals + staffRenewals;
  const t = tab || (renewalCount > 0 ? "renewals" : "players");
  const tutStep = career.tutorialStep ?? 0;
  const squadTutorialTab = tutorialActive && (tutStep === 1 || tutStep === 2 || tutStep === 5) ? tutorialHighlightTab(tutStep) : null;
  const renewalTabLabel =
    renewalCount > 0
      ? `Renewals${playerRenewals && staffRenewals ? ` (${playerRenewals}p/${staffRenewals}s)` : ` (${renewalCount})`}`
      : 'Renewals';
  const tabs = [
    { key: "players",  label: "Players",  icon: Users },
    { key: "all",      label: "All Players", icon: ListFilter },
    { key: "tactics",  label: "Tactics",  icon: Target },
    { key: "training", label: "Training", icon: Dumbbell },
    { key: "recruit",  label: "Recruit",  icon: UserPlus },
    ...(renewalCount > 0 || (career.pendingRenewals?.length ?? 0) > 0 || (career.pendingStaffRenewals?.length ?? 0) > 0
      ? [{ key: "renewals", label: renewalTabLabel, icon: FileText }]
      : []),
  ];
  const handleTabChange = (key) => {
    if (key === "recruit") { onNavigate?.("recruit"); return; }
    setTab(key);
  };

  return (
    <div className="anim-in space-y-6">
      <header className="space-y-1">
        <h2 className={`${css.h1} text-2xl md:text-3xl tracking-wide`}>Squad</h2>
        <p className="text-sm text-atext-dim max-w-2xl leading-relaxed">
          {club?.name ? `${club.name} · ` : ""}
          List, match-day 23, tactics and training — everything you run week to week.
        </p>
      </header>
      <TabNav
        tabs={tabs}
        active={t}
        onChange={handleTabChange}
        tutorialAllowOnly={squadTutorialTab}
        tutorialHighlightKey={squadTutorialTab}
        growButtons={false}
      />
      {t === "players"  && <PlayersTab onNavigate={onNavigate} />}
      {t === "all"      && <AllPlayersTab />}
      {t === "tactics"  && <TacticsTab onOpenClubStaff={onOpenClubStaff} />}
      {t === "training" && <TrainingTab onOpenClubStaff={onOpenClubStaff} />}
      {t === "renewals" && <RenewalsTab />}
    </div>
  );
}



function FormSparkline({ history, current }) {
  const vals = history?.length ? [...history, current] : [current];
  const lo = Math.min(...vals);
  const hi = Math.max(...vals, lo + 10);
  return (
    <span className="inline-flex items-end gap-px h-4 shrink-0" aria-hidden>
      {vals.map((v, i) => {
        const pct = Math.round(((v - lo) / (hi - lo)) * 100);
        const color = v >= 75 ? 'var(--A-pos)' : v >= 55 ? 'var(--A-accent)' : 'var(--A-neg)';
        return (
          <span key={i} style={{ display: 'block', width: 3, height: `${Math.max(20, pct)}%`, background: color, borderRadius: 1, opacity: i === vals.length - 1 ? 1 : 0.5 }} />
        );
      })}
    </span>
  );
}

function buildContextActions(player, career, updateCareer, onNavigate) {
  const inLineup = lineupHasPlayer(career.lineup, player.id);
  const morale = player.morale ?? 70;

  return [
    {
      id: 'lineup_toggle',
      label: inLineup ? 'Remove from lineup' : 'Add to lineup',
      icon: inLineup ? '−' : '+',
      // Adds land on the interchange (blind appends can overflow slot 22 on sparse lineups).
      disabled: !inLineup && !hasFreeBenchSlot(career.lineup),
      onClick: () => {
        if (inLineup) {
          updateCareer({ lineup: removeIdFromLineup(career.lineup, player.id) });
        } else {
          updateCareer({ lineup: addToBench(career.lineup, player.id) });
        }
      },
    },
    {
      id: 'promise_gametime',
      label: 'Promise game time',
      icon: '🤝',
      disabled: morale >= 75,
      onClick: () => {
        const next = cloneSerializable(career);
        const p = next.squad.find(sp => sp.id === player.id);
        if (p) {
          p.morale = Math.min(100, (p.morale ?? 70) + 10);
          p.transferRequested = false;
          p.unhappySince = null;
          next.news = [{ week: next.week, type: 'info', text: `🤝 Promised game time to ${p.firstName} ${p.lastName} — morale boosted.` }, ...(next.news || [])].slice(0, 20);
        }
        updateCareer(next);
      },
    },
    {
      id: 'back_player',
      label: 'Back player publicly',
      icon: '📢',
      disabled: morale >= 80,
      onClick: () => {
        const next = cloneSerializable(career);
        const p = next.squad.find(sp => sp.id === player.id);
        if (p) {
          p.morale = Math.min(100, (p.morale ?? 70) + 6);
          next.news = [{ week: next.week, type: 'info', text: `📢 Publicly backed ${p.firstName} ${p.lastName} — the dressing room noticed.` }, ...(next.news || [])].slice(0, 20);
        }
        updateCareer(next);
      },
    },
    {
      id: 'view_contract',
      label: 'View contract',
      icon: '📋',
      onClick: () => onNavigate?.('squad'),
    },
    {
      id: 'request_trade',
      label: player.listTeam === career.clubId ? 'List for trade' : 'Offer to clubs',
      icon: '↔',
      disabled: career.phase !== 'trade_period' && career.phase !== 'pre_season',
      onClick: () => onNavigate?.('recruit'),
    },
  ];
}

// Depth-chart view of the match-day side. Reads the same career.lineup / subPlayerId
// as the pitch builder, so promoting/dropping here shows on the Pitch tab instantly.
const DEPTH_COLUMNS = [
  { name: 'DEFENCE',  set: LINE_BACK },
  { name: 'MIDFIELD', set: LINE_MID, ut: true },
  { name: 'RUCK',     set: LINE_RUCK },
  { name: 'FORWARD',  set: LINE_FWD },
];
const inDepthCol = (pos, col) => !!pos && (col.set.has(pos) || (col.ut && pos === 'UT'));
const ROLE_TAG = {
  field: { label: 'FIELD', color: 'var(--A-pos)' },
  bench: { label: 'BENCH', color: 'var(--A-accent-2)' },
  sub:   { label: 'SUB',   color: 'var(--A-accent)' },
};

// Hoisted row (module scope so React reconciles instead of remounting per render).
function DepthRow({ p, cover, role, benchFree, onSelect, onPromote, onDrop, onSetSub }) {
  const tag = !cover && role !== 'out' ? ROLE_TAG[role] : null;
  const avail = isPlayerAvailable(p);
  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 mb-1 cursor-pointer ${cover ? 'border border-dashed opacity-70' : 'border'}`}
      style={{
        background: cover ? 'transparent' : 'var(--A-panel-2)',
        borderColor: 'var(--A-line)',
        borderLeft: `3px solid ${formBorderColor(p.form ?? 60)}`,
      }}
      onClick={() => onSelect?.(p)}
    >
      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider flex-shrink-0" style={posBadgeStyle(p.position)}>
        {formatPositionSlash(p)}
      </span>
      <span className="text-xs font-semibold text-atext truncate flex-1 min-w-0">{playerName(p)}</span>
      {cover && <span className="text-[8px] font-black px-1 py-0.5 rounded" style={{ color: 'var(--A-accent-2)', border: '1px solid color-mix(in srgb, var(--A-accent-2) 35%, transparent)' }}>2°</span>}
      {tag && <span className="text-[8px] font-black px-1 py-0.5 rounded" style={{ color: tag.color, background: `color-mix(in srgb, ${tag.color} 16%, transparent)` }}>{tag.label}</span>}
      {!avail && <span className="text-[8px] font-black px-1 py-0.5 rounded" style={{ color: 'var(--A-neg)' }}>{(p.suspended ?? 0) > 0 ? 'SUSP' : 'INJ'}</span>}
      {role === 'out' && p.lastReserves && (
        <span className="text-[9px] font-mono flex-shrink-0" style={{ color: 'var(--A-text-mute)' }} title="Latest reserves outing">
          {p.lastReserves.disposals}d{p.lastReserves.goals > 0 ? ` ${p.lastReserves.goals}g` : ''}
        </span>
      )}
      <RatingDot value={p.overall} size="sm" />
      <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {role === 'out'
          ? <button type="button" disabled={!avail || !benchFree} title={!benchFree ? 'Interchange full — free a bench slot first' : 'Add to the interchange'} onClick={() => onPromote(p.id)} className="text-[9px] font-black px-1.5 py-0.5 rounded-md disabled:opacity-30" style={{ color: 'var(--A-pos)', border: '1px solid color-mix(in srgb, var(--A-pos) 35%, transparent)' }}>＋</button>
          : cover
            ? null
            : <>
                {role === 'bench' && <button type="button" onClick={() => onSetSub(p.id)} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: 'var(--A-text-mute)', border: '1px solid var(--A-line)' }} title="Set as medical sub">sub</button>}
                <button type="button" onClick={() => onDrop(p.id)} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: 'var(--A-neg)', border: '1px solid color-mix(in srgb, var(--A-neg) 35%, transparent)' }} title="Drop to depth">✕</button>
              </>}
      </div>
    </div>
  );
}

function DepthChart({ onSelectPlayer }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [showCover, setShowCover] = useState(true);

  const lineup = career.lineup || [];
  const squad = career.squad || [];
  const subId = career.subPlayerId;

  const promoteToBench = (id) => updateCareer({ lineup: addToBench(lineup, id) });
  // Stale-sub clearing happens at the careerStore choke point (sanitizeSubPlayerId).
  const dropPlayer = (id) => updateCareer({ lineup: removeIdFromLineup(lineup, id) });
  const setSub = (id) => updateCareer({ subPlayerId: id });

  const nIn = lineupPlayerCount(lineup);
  const benchFree = hasFreeBenchSlot(lineup);

  // One pass to classify roles, then bucket/sort each column — memoized so
  // unrelated parent renders don't re-derive everything.
  const { columns, roleById } = useMemo(() => {
    const roleById = new Map(squad.map((p) => [p.id, lineupRole(lineup, subId, p.id)]));
    const roleRank = { field: 0, bench: 1, sub: 2, out: 3 };
    const byRoleThenOvr = (a, b) =>
      (roleRank[roleById.get(a.id)] - roleRank[roleById.get(b.id)]) || ((b.overall ?? 0) - (a.overall ?? 0));
    const byOvr = (a, b) => (b.overall ?? 0) - (a.overall ?? 0);
    const columns = DEPTH_COLUMNS.map((col) => {
      const primary = squad.filter((p) => inDepthCol(p.position, col));
      const sel = primary.filter((p) => roleById.get(p.id) !== 'out').sort(byRoleThenOvr);
      const dep = primary.filter((p) => roleById.get(p.id) === 'out').sort(byOvr);
      const cover = squad
        .filter((p) => !inDepthCol(p.position, col) && inDepthCol(p.secondaryPosition, col))
        .sort(byOvr);
      const nField = sel.filter((p) => roleById.get(p.id) === 'field').length;
      return { col, primary, sel, dep, cover, nField };
    });
    return { columns, roleById };
  }, [squad, lineup, subId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-atext-dim">
          {nIn}/{LINEUP_CAP} selected · <span style={{ color: 'var(--A-pos)' }}>FIELD</span> = on-ground · <span style={{ color: 'var(--A-accent-2)' }}>BENCH</span> = interchange · <span style={{ color: 'var(--A-accent)' }}>SUB</span> = medical sub.
        </p>
        <label className="text-[11px] text-atext-dim flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" checked={showCover} onChange={(e) => setShowCover(e.target.checked)} style={{ accentColor: 'var(--A-accent)' }} />
          Show secondary-position cover
        </label>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {columns.map(({ col, primary, sel, dep, cover, nField }) => {
          const rowProps = { benchFree, onSelect: onSelectPlayer, onPromote: promoteToBench, onDrop: dropPlayer, onSetSub: setSub };
          return (
            <div key={col.name} className="rounded-xl border border-aline bg-apanel p-2.5">
              <div className="text-[11px] font-black tracking-widest text-aaccent text-center">{col.name}</div>
              <div className="text-[8.5px] text-atext-mute text-center mb-2">
                {nField} field · {sel.length - nField} bench · {dep.length} depth{showCover ? ` · ${cover.length} cover` : ''}
              </div>
              {sel.map((p) => <DepthRow key={p.id} p={p} role={roleById.get(p.id)} {...rowProps} />)}
              <div className="flex items-center gap-1.5 my-1.5 text-[8px] tracking-widest text-atext-mute">
                <span className="flex-1 h-px bg-aline" />DEPTH<span className="flex-1 h-px bg-aline" />
              </div>
              {dep.map((p) => <DepthRow key={p.id} p={p} role="out" {...rowProps} />)}
              {primary.length < 2 && <div className="text-[9px] font-bold text-center" style={{ color: 'var(--A-neg)' }}>⚠ thin — recruit</div>}
              {showCover && cover.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 my-1.5 text-[8px] tracking-widest" style={{ color: 'var(--A-accent-2)' }}>
                    <span className="flex-1 h-px" style={{ background: 'color-mix(in srgb, var(--A-accent-2) 40%, var(--A-line))' }} />CAN COVER (2°)<span className="flex-1 h-px" style={{ background: 'color-mix(in srgb, var(--A-accent-2) 40%, var(--A-line))' }} />
                  </div>
                  {cover.map((p) => <DepthRow key={`cov-${p.id}`} p={p} cover role={roleById.get(p.id)} {...rowProps} />)}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Role-by-role line-up editor. Each on-ground slot maps to an AFL role; assigning
// a player here writes career.lineup (slot index = role), so it shows on the Pitch
// oval instantly. Picking a player auto-removes them from any other slot.
const POSITION_LINES = [
  { title: 'Back line',     slots: [0, 1, 2] },
  { title: 'Half-back',     slots: [3, 4, 5] },
  { title: 'Centre line',   slots: [6, 7, 8] },
  { title: 'Half-forward',  slots: [9, 10, 11] },
  { title: 'Forward line',  slots: [12, 13, 14] },
  { title: 'Followers',     slots: [15, 16, 17] },
  { title: 'Interchange',   slots: [18, 19, 20, 21, 22] },
];

// Hoisted slot row (module scope so selects reconcile — an inline component type
// would remount per render and drop focus mid-selection).
function PositionSlotRow({ slotIdx, player, options, onAssign }) {
  const code = slotRoleCode(slotIdx);
  const label = slotIdx >= LINEUP_FIELD_COUNT ? `I${slotIdx - LINEUP_FIELD_COUNT + 1}` : code;
  const fits = player ? playerFitsSlot(player, slotIdx) : true;
  const avail = player ? isPlayerAvailable(player) : true;
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[9px] font-black w-10 text-center py-1.5 rounded-md flex-shrink-0" style={{ background: 'var(--A-panel-2)', color: 'var(--A-accent-2)' }}>{label}</span>
      <select
        value={player?.id ?? ''}
        onChange={(e) => onAssign(slotIdx, e.target.value ? e.target.value : null)}
        className="flex-1 min-w-0 text-xs font-medium rounded-lg px-2 py-1.5"
        style={{ background: 'var(--A-bg)', color: 'var(--A-text)', border: '1px solid var(--A-line)' }}
      >
        <option value="">— empty —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {playerName(o)} · {formatPositionSlash(o)} · {o.overall}{(o.injured ?? 0) > 0 ? ' (inj)' : (o.suspended ?? 0) > 0 ? ' (susp)' : ''}
          </option>
        ))}
      </select>
      {!fits && <span title="Out of position" style={{ color: 'var(--A-accent-2)', fontSize: 12 }}>⚠</span>}
      {player && !avail && <span title="Injured / suspended" style={{ color: 'var(--A-neg)', fontSize: 10, fontWeight: 800 }}>{(player.suspended ?? 0) > 0 ? 'SUSP' : 'INJ'}</span>}
      {player ? <RatingDot value={player.overall} size="sm" /> : <span className="w-7 text-center text-[11px]" style={{ color: 'var(--A-text-mute)' }}>–</span>}
    </div>
  );
}

function PositionsTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const lineup = career.lineup || [];
  const squad = career.squad || [];

  const slots = useMemo(() => lineupToFixedSlots(lineup), [lineup]);
  const playerById = useMemo(() => new Map(squad.map((p) => [String(p.id), p])), [squad]);

  // One sorted option list per ground zone (7 sorts) instead of one per slot (23).
  const optionsByZone = useMemo(() => {
    const out = {};
    for (const zone of new Set(SLOT_ZONES)) {
      const score = (p) =>
        ((positionFitsZone(p.position, zone) || positionFitsZone(p.secondaryPosition, zone)) ? 2 : 0) +
        (isPlayerAvailable(p) ? 1 : 0);
      out[zone] = [...squad].sort((a, b) => (score(b) - score(a)) || ((b.overall ?? 0) - (a.overall ?? 0)));
    }
    return out;
  }, [squad]);

  const assign = (slotIdx, playerId) => {
    if (!playerId) {
      const next = [...slots];
      next[slotIdx] = null;
      updateCareer({ lineup: fixedSlotsToLineup(next) });
      return;
    }
    updateCareer({ lineup: placeOrSwapLineupSlot(lineup, playerId, slotIdx) });
  };

  const nIn = lineupPlayerCount(lineup);
  return (
    <div className="space-y-3">
      <p className="text-xs text-atext-dim">
        {nIn}/{LINEUP_CAP} selected · pick a player for each role — they're removed from their old slot automatically and shown on the Pitch oval. <span style={{ color: 'var(--A-accent-2)' }}>⚠</span> = out of position.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {POSITION_LINES.map((line) => (
          <div key={line.title} className="rounded-xl border border-aline bg-apanel p-3">
            <div className="text-[11px] font-black tracking-widest text-aaccent mb-2">{line.title.toUpperCase()}</div>
            {line.slots.map((slotIdx) => (
              <PositionSlotRow
                key={slotIdx}
                slotIdx={slotIdx}
                player={slots[slotIdx] != null ? playerById.get(String(slots[slotIdx])) : null}
                options={optionsByZone[SLOT_ZONES[slotIdx] ?? 'IC']}
                onAssign={assign}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersTab({ onNavigate }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [sort, setSort] = useState("overall");
  const [filterPos, setFilterPos] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [pitchView, setPitchView] = useState("pitch"); // 'pitch' | 'positions' | 'depth' — views of the same lineup
  const isLg = useIsLg();
  const rowHoverBg = 'color-mix(in srgb, var(--A-accent) 6%, transparent)';
  const rowSelectBg = 'color-mix(in srgb, var(--A-accent) 10%, transparent)';

  const handlePlayerRightClick = (e, player) => {
    e.preventDefault();
    setContextMenu({ player, pos: { x: e.clientX, y: e.clientY } });
  };
  const name = (p) => (p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || ""));

  const sortedFullSquad = useMemo(() => {
    const arr = [...(career.squad || [])];
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
  }, [career.squad, sort]);

  const players = useMemo(() => {
    let arr = [...sortedFullSquad];
    if (filterPos !== "ALL") arr = arr.filter(p => playerHasPosition(p, filterPos));
    if (filterStatus === "lineup") arr = arr.filter(p => lineupHasPlayer(career.lineup, p.id));
    if (filterStatus === "bench") arr = arr.filter(p => !lineupHasPlayer(career.lineup, p.id));
    if (filterStatus === "injured") arr = arr.filter(p => (p.injured || 0) > 0 || (p.suspended || 0) > 0);
    if (filterStatus === "rookies") arr = arr.filter(p => p.rookie);
    return arr;
  }, [sortedFullSquad, career.lineup, filterPos, filterStatus]);

  const benchPlayerIds = useMemo(
    () => sortedFullSquad.filter((p) => !lineupHasPlayer(career.lineup, p.id)).map((p) => p.id),
    [sortedFullSquad, career.lineup],
  );

  const pName = p => p.firstName ? p.firstName+" "+p.lastName : (p.name||"Player");
  const nLineup = lineupPlayerCount(career.lineup);

  const filterChip = (active) =>
    active
      ? "border-transparent"
      : "bg-apanel border border-aline text-atext-dim hover:border-aaccent/35";

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-4" aria-labelledby="match-day-title">
        <div className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 id="match-day-title" className={`${css.h1} text-xl md:text-2xl tracking-wide`}>
              Match-day {LINEUP_CAP}
            </h3>
            {/* Toggle buttons (aria-pressed), not a half-implemented ARIA tabs pattern —
                full tabs semantics need tabpanel wiring + arrow-key navigation. */}
            <div className="inline-flex rounded-xl border border-aline bg-apanel p-1 self-start" aria-label="Match-day view">
              {[
                { key: "pitch", label: "Pitch" },
                { key: "positions", label: "Positions" },
                { key: "depth", label: "Depth" },
              ].map(({ key, label }) => {
                const active = pitchView === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPitchView(key)}
                    className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-lg transition-all"
                    style={active
                      ? { background: "var(--A-accent)", color: "var(--fd-on-accent, #0A0D0C)" }
                      : { color: "var(--A-text-mute)" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-atext-dim max-w-2xl leading-relaxed">
            {pitchView === "pitch"
              ? "Build the 23 on the map and bench pool. The roster table below is for browsing — it does not hide players from the bench list."
              : pitchView === "positions"
                ? "Pick a player for each role on the ground. Assignments write straight to the line-up, so they show on the Pitch oval — and a player is auto-removed from their old slot."
                : "Squad by position. Promote from depth, drop, or set the sub — changes show on the Pitch view instantly. Players appear under their secondary position too, so you can see who can cover."}
          </p>
        </div>
        {pitchView === "pitch" ? (
          <SquadLineupBuilder
            benchPlayerIds={benchPlayerIds}
            stitch={false}
            onSelectPlayer={(player) => setSelected((prev) => (prev?.id === player.id ? null : player))}
          />
        ) : pitchView === "positions" ? (
          <PositionsTab />
        ) : (
          <DepthChart
            onSelectPlayer={(player) => setSelected((prev) => (prev?.id === player.id ? null : player))}
          />
        )}
      </section>

      <section className="space-y-4" aria-labelledby="roster-title">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h3 id="roster-title" className={`${css.h1} text-xl md:text-2xl tracking-wide`}>
              Roster
            </h3>
            <p className="text-xs text-atext-dim mt-0.5">
              {players.length} shown · {nLineup}/{LINEUP_CAP} in match-day · {(career.squad || []).length} total listed
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-aline bg-apanel-2/60 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col gap-3">
            <div>
              <div className={`${css.label} mb-1.5`}>Position</div>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", ...POSITIONS].map((pos) => {
                  const active = filterPos === pos;
                  return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFilterPos(pos)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--A-accent)] ${filterChip(active)}`}
                    style={active ? {
                      background: "var(--A-accent)",
                      color: "var(--fd-on-accent, #0A0D0C)",
                      boxShadow: "0 1px 6px color-mix(in srgb, var(--A-accent) 30%, transparent)",
                    } : {}}
                  >
                    {pos}
                  </button>
                );})}
              </div>
            </div>
            <div>
              <div className={`${css.label} mb-1.5`}>Status</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "ALL", label: "All" },
                  { key: "lineup", label: "In 23" },
                  { key: "bench", label: "Not in 23" },
                  { key: "injured", label: "Out" },
                  { key: "rookies", label: "Rookies" },
                ].map(({ key, label }) => {
                  const active = filterStatus === key;
                  return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterStatus(key)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--A-accent)] ${filterChip(active)}`}
                    style={active ? {
                      background: "var(--A-accent)",
                      color: "var(--fd-on-accent, #0A0D0C)",
                      boxShadow: "0 1px 6px color-mix(in srgb, var(--A-accent) 30%, transparent)",
                    } : {}}
                  >
                    {label}
                  </button>
                );})}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-aline/70">
              <span className={css.label}>Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="text-sm font-semibold rounded-lg px-3 py-2 w-full sm:w-auto max-w-xs border border-aline bg-apanel text-atext"
              >
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
        </div>

    <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
      <div className="flex-1 min-w-0">
        <>
        <div className="md:hidden px-0.5">
          <Virtuoso
            style={{ height: '420px' }}
            data={players}
            itemContent={(_, p) => {
              const inLineup = lineupHasPlayer(career.lineup, p.id);
              const isSelected = selected?.id === p.id;
              const formColor = p.form >= 75 ? "var(--A-pos)" : p.form >= 55 ? "var(--A-accent)" : "var(--A-neg)";
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : p)}
                  onContextMenu={(e) => handlePlayerRightClick(e, p)}
                  className="w-full text-left rounded-xl p-3 border transition-all touch-manipulation mb-2"
                  style={{
                    borderColor: isSelected ? "var(--A-accent)" : "var(--A-line)",
                    background: isSelected ? rowSelectBg : "var(--A-panel)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-atext truncate">{pName(p)}</div>
                      <div className="text-[10px] text-atext-mute flex items-center gap-1.5 flex-wrap"><span className="inline-flex items-center text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded whitespace-nowrap" style={posBadgeStyle(p.position)}>{formatPositionSlash(p)}</span> · {POSITION_NAMES[p.position]} · age {p.age}</div>
                    </div>
                    <RatingDot value={p.overall} size="sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                    <span className="font-bold" style={{ color: formColor }}>Form {p.form}</span>
                    {p.formHistory?.length > 0 && <FormSparkline history={p.formHistory} current={p.form} />}
                    <span className="text-atext-mute">Fitness {p.fitness}</span>
                    {inLineup && <Pill color="var(--A-pos)">23</Pill>}
                    {p.injured > 0 && <Pill color="var(--A-neg)">{p.injured}w</Pill>}
                    {p.transferRequested
                      ? <Pill color="var(--A-neg)">Trade request</Pill>
                      : (p.morale ?? 75) < 45 && <Pill color={moraleToneColor(moraleBand(p.morale).tone)}>{moraleBand(p.morale).label}</Pill>}
                  </div>
                </button>
              );
            }}
          />
        </div>
        <div className="hidden md:block rounded-2xl overflow-x-auto border border-aline shadow-sm">
          <div>
          <div className="grid px-4 py-3 min-w-[820px]" style={{gridTemplateColumns:"2rem minmax(140px,1fr) 4rem 3rem 3.5rem 5rem 5rem 4.5rem 3.5rem", gap:"0.5rem", background:"var(--A-panel-2)", borderBottom:"1px solid var(--A-line)"}}>
            {["#","Player","Pos","Age","OVR","Form","Fitness","Wage","Status"].map((h,i)=>(
              <div key={h} className={`text-[10px] font-black uppercase tracking-[0.15em] text-atext-mute ${i>1?"text-center":""} ${i===7?"text-right":""}`}>{h}</div>
            ))}
          </div>
          <div className="min-w-[820px]" style={{background:"var(--A-panel)"}}>
            <Virtuoso
              style={{ height: '420px' }}
              data={players}
              itemContent={(i, p) => {
                const inLineup = lineupHasPlayer(career.lineup, p.id);
                const isSelected = selected?.id === p.id;
                const formColor = p.form >= 75 ? "var(--A-pos)" : p.form >= 55 ? "var(--A-accent)" : "var(--A-neg)";
                const fitColor  = p.fitness >= 80 ? "var(--A-pos)" : p.fitness >= 60 ? "var(--A-accent)" : "var(--A-neg)";
                return (
                  <button key={p.id} onClick={()=>setSelected(isSelected ? null : p)}
                    onContextMenu={(e) => handlePlayerRightClick(e, p)}
                    type="button"
                    className="w-full grid px-4 py-3 transition-all text-left"
                    style={{
                      gridTemplateColumns:"2rem minmax(140px,1fr) 4rem 3rem 3.5rem 5rem 5rem 4.5rem 3.5rem", gap:"0.5rem",
                      borderBottom:"1px solid var(--A-line)",
                      background: isSelected ? rowSelectBg : "transparent",
                      borderLeft: isSelected ? "3px solid var(--A-accent)" : "3px solid transparent",
                    }}
                    onMouseEnter={e=>{if(!isSelected){e.currentTarget.style.background=rowHoverBg; e.currentTarget.style.borderLeft='3px solid color-mix(in srgb,var(--A-accent) 45%,transparent)';}}}
                    onMouseLeave={e=>{if(!isSelected){e.currentTarget.style.background='transparent'; e.currentTarget.style.borderLeft='3px solid transparent';}}}>
                    <div className="text-atext-mute text-sm font-bold text-left">{i+1}</div>
                    <div className="flex items-center gap-2 min-w-0 text-left">
                      {p.injured > 0 && <Heart className="w-3 h-3 flex-shrink-0 text-aneg" />}
                      {inLineup && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:"var(--A-pos)", boxShadow:"0 0 4px var(--A-pos)"}} />}
                      <span className="truncate text-sm font-semibold text-atext">{pName(p)}</span>
                      <span title={PLAYER_TRAITS[p.trait ?? 'grinder']?.label} className="text-[10px] flex-shrink-0">{PLAYER_TRAITS[p.trait ?? 'grinder']?.emoji}</span>
                      {p.rookie && <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0" style={{background:"color-mix(in srgb, var(--A-accent) 13%, transparent)",color:"var(--A-accent)"}}>R</span>}
                      {p.transferRequested
                        ? <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0 whitespace-nowrap" style={{background:"color-mix(in srgb, var(--A-neg) 14%, transparent)",color:"var(--A-neg)",border:"1px solid color-mix(in srgb, var(--A-neg) 30%, transparent)"}}>TRADE REQ</span>
                        : (p.morale ?? 75) < 45 && <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0 whitespace-nowrap" style={{background:`color-mix(in srgb, ${moraleToneColor(moraleBand(p.morale).tone)} 14%, transparent)`,color:moraleToneColor(moraleBand(p.morale).tone)}}>UNHAPPY</span>}
                    </div>
                    <div className="text-center" title={POSITION_NAMES[p.position] + (p.secondaryPosition ? ` / ${POSITION_NAMES[p.secondaryPosition]}` : '')}><span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap" style={posBadgeStyle(p.position)}>{formatPositionSlash(p)}</span></div>
                    <div className="text-center text-sm text-atext-dim">{p.age}</div>
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
                    <div className="text-center flex flex-col items-center gap-0.5">
                      {p.suspended > 0
                        ? <Pill color="#A78BFA">SUS {p.suspended}w</Pill>
                        : p.injured > 0
                          ? <Pill color="var(--A-neg)">{p.injured}w</Pill>
                          : inLineup
                            ? <Pill color="var(--A-pos)">23</Pill>
                            : <span className="text-atext-mute text-xs">—</span>}
                      <ContractChip years={p.contract} />
                    </div>
                  </button>
                );
              }}
            />
          </div>
          </div>
        </div>
        </>
      </div>

      {isLg && (
        <div className="w-80 xl:w-72 flex-shrink-0">
          {selected ? (
            <PlayerDetail player={selected} onClose={()=>setSelected(null)} />
          ) : (
            <div className="rounded-2xl p-8 text-center border border-aline bg-apanel-2/50 lg:sticky lg:top-20">
              <Users className="w-10 h-10 mx-auto mb-3 text-aline-2 opacity-80" />
              <div className="text-sm text-atext-mute font-medium">Select a player</div>
              <p className="text-[11px] text-atext-mute mt-2 leading-snug">
                Tap a row or a map slot to open their profile and contract actions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
      </section>
      {!isLg && selected && (
        <PlayerCardModal player={selected} onClose={() => setSelected(null)} />
      )}
      {contextMenu && (
        <PlayerContextMenu
          player={contextMenu.player}
          pos={contextMenu.pos}
          onClose={() => setContextMenu(null)}
          actions={buildContextActions(contextMenu.player, career, updateCareer, onNavigate)}
        />
      )}
    </div>
  );
}

const ALL_VIEWS = [
  { key: "overview",  label: "Overview" },
  { key: "condition", label: "Condition" },
  { key: "contracts", label: "Contracts" },
  { key: "stats",     label: "Season stats" },
];

function statColor(v) {
  return v >= 75 ? "var(--A-pos)" : v >= 55 ? "var(--A-accent)" : "var(--A-neg)";
}

const contractBadge = (out) => (
  <span
    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap"
    style={out
      ? { background: "rgba(232,74,111,0.16)", color: "#E84A6F", border: "1px solid rgba(232,74,111,0.4)" }
      : { background: "rgba(255,179,71,0.14)", color: "#FFB347", border: "1px solid rgba(255,179,71,0.4)" }}
  >
    {out ? "Out of contract" : "1y left"}
  </span>
);

/**
 * All Players — a single data-dense grid of the whole list. Toggle the column
 * group (Overview / Condition / Contracts / Season stats), sort any way, and
 * click any row to pop the full player card immediately.
 */
function AllPlayersTab() {
  const career = useCareer();
  const [view, setView] = useState("overview");
  const [sort, setSort] = useState("overall");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const nm = (p) => (p.firstName ? `${p.firstName} ${p.lastName}` : (p.name || "Player"));

  const rows = useMemo(() => {
    let arr = [...(career.squad || [])];
    arr.sort((a, b) => {
      switch (sort) {
        case "name": return nm(a).localeCompare(nm(b));
        case "age": return (a.age ?? 0) - (b.age ?? 0);
        case "form": return (b.form ?? 0) - (a.form ?? 0);
        case "fitness": return (b.fitness ?? 0) - (a.fitness ?? 0);
        case "morale": return (b.morale ?? 0) - (a.morale ?? 0);
        case "wage": return (b.wage ?? 0) - (a.wage ?? 0);
        case "contract": return (a.contract ?? 0) - (b.contract ?? 0);
        case "potential": return (b.potential ?? 0) - (a.potential ?? 0);
        case "goals": return (b.goals ?? 0) - (a.goals ?? 0);
        case "disposals": return (b.disposals ?? 0) - (a.disposals ?? 0);
        default: return (b.overall ?? 0) - (a.overall ?? 0);
      }
    });
    if (search.trim()) arr = arr.filter(p => nm(p).toLowerCase().includes(search.toLowerCase()));
    return arr;
  }, [career.squad, sort, search]);

  const statCell = (v) => <span className="font-bold" style={{ color: statColor(v ?? 0) }}>{v ?? "—"}</span>;
  const posCell = (p) => <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap" style={posBadgeStyle(p.position)}>{formatPositionSlash(p)}</span>;

  const columns = {
    overview: [
      { head: "Pos", render: posCell },
      { head: "Age", sortKey: "age", render: (p) => p.age, align: "center" },
      { head: "OVR", sortKey: "overall", tooltip: "Overall rating (1–99). Squad average shown in hub.", render: (p) => <RatingDot value={p.overall} size="sm" />, align: "center" },
      { head: "Pot", sortKey: "potential", tooltip: "Potential ceiling. Visible after scouting (approx. ±10).", render: (p) => p.potential ?? "—", align: "center" },
      { head: "Wage", sortKey: "wage", tooltip: "Weekly wage in $k.", render: (p) => fmtK(p.wage), align: "right" },
    ],
    condition: [
      { head: "Pos", render: posCell },
      { head: "Form", sortKey: "form", tooltip: "Recent form (0–100). Above 75 = in form. Below 50 = struggling.", render: (p) => statCell(p.form), align: "center" },
      { head: "Fitness", sortKey: "fitness", tooltip: "Match fitness (0–100). Below 70 risks injury.", render: (p) => statCell(p.fitness), align: "center" },
      { head: "Morale", sortKey: "morale", tooltip: "Morale (0–100). Below 38 may trigger a transfer request.", render: (p) => statCell(p.morale), align: "center" },
      { head: "Status", render: (p) => p.suspended > 0 ? <Pill color="#A78BFA">SUS {p.suspended}w</Pill> : p.injured > 0 ? <Pill color="var(--A-neg)">{p.injured}w</Pill> : <span className="text-atext-mute text-xs">Fit</span>, align: "center" },
    ],
    contracts: [
      { head: "Pos", render: posCell },
      { head: "Age", sortKey: "age", render: (p) => p.age, align: "center" },
      { head: "Wage", sortKey: "wage", tooltip: "Weekly wage in $k.", render: (p) => fmtK(p.wage), align: "right" },
      { head: "Yrs", sortKey: "contract", tooltip: "Years remaining on contract. 0 = out of contract (OOC).", render: (p) => `${p.contract ?? 0}y`, align: "center" },
      { head: "Status", render: (p) => (p.contract ?? 0) <= 1 ? contractBadge((p.contract ?? 0) <= 0) : <span className="text-atext-mute text-xs">Signed</span>, align: "right" },
    ],
    stats: [
      { head: "Pos", render: posCell },
      { head: "G", sortKey: "goals", tooltip: "Goals kicked this season.", render: (p) => p.goals ?? 0, align: "center" },
      { head: "B", render: (p) => p.behinds ?? 0, align: "center" },
      { head: "Disp", sortKey: "disposals", tooltip: "Disposals this season.", render: (p) => p.disposals ?? 0, align: "center" },
      { head: "Marks", render: (p) => p.marks ?? 0, align: "center" },
    ],
  }[view];

  const template = `2rem minmax(140px,1.4fr) ${columns.map(() => "minmax(56px,1fr)").join(" ")}`;
  const alignCls = (a) => (a === "right" ? "text-right justify-end" : a === "center" ? "text-center justify-center" : "text-left");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className={`${css.h1} text-xl md:text-2xl tracking-wide`}>All players</h3>
        <p className="text-xs text-atext-dim max-w-2xl leading-relaxed">
          The whole list in one grid. Switch the column group to compare ratings, condition, contracts or season output — then tap anyone to open their card.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-atext-mute pointer-events-none" />
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:max-w-xs pl-9 pr-4 py-2 rounded-xl border border-aline bg-apanel text-sm text-atext placeholder:text-atext-mute focus:outline-none focus:border-aaccent"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ALL_VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`text-[11px] px-3 py-1.5 rounded-lg font-bold border transition-all ${
                view === v.key
                  ? "border-transparent"
                  : "bg-apanel border-aline text-atext-dim hover:border-aaccent/35"
              }`}
              style={view === v.key ? { background: "var(--A-accent)", color: "var(--fd-on-accent, #0A0D0C)" } : {}}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-aline">
        <div className="overflow-x-auto">
          <div className="grid px-4 py-3 min-w-[640px]" style={{ gridTemplateColumns: template, gap: "0.5rem", background: "var(--A-panel-2)", borderBottom: "1px solid var(--A-line)" }}>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-atext-mute">#</div>
            <button
              type="button"
              onClick={() => setSort("name")}
              className={`flex items-center gap-0.5 text-[10px] font-black uppercase tracking-[0.15em] transition-colors text-left ${sort === "name" ? "text-aaccent" : "text-atext-mute hover:text-atext"}`}
            >
              Player
              {sort === "name" && <ChevronDown className="w-3 h-3 flex-shrink-0" />}
            </button>
            {columns.map((c) => (
              c.sortKey ? (
                <FloatingTooltip key={c.head} content={c.tooltip}>
                  <button
                    type="button"
                    onClick={() => setSort(c.sortKey)}
                    className={`flex items-center gap-0.5 text-[10px] font-black uppercase tracking-[0.15em] transition-colors ${alignCls(c.align)} ${sort === c.sortKey ? "text-aaccent" : "text-atext-mute hover:text-atext"}`}
                  >
                    {c.head}
                    {sort === c.sortKey && (
                      c.sortKey === "age" || c.sortKey === "contract"
                        ? <ChevronUp className="w-3 h-3 flex-shrink-0" />
                        : <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    )}
                  </button>
                </FloatingTooltip>
              ) : (
                <FloatingTooltip key={c.head} content={c.tooltip}>
                  <div className={`text-[10px] font-black uppercase tracking-[0.15em] text-atext-mute ${alignCls(c.align)}`}>{c.head}</div>
                </FloatingTooltip>
              )
            ))}
          </div>
          <div className="max-h-[68vh] overflow-y-auto min-w-[640px] [scrollbar-width:thin]" style={{ background: "var(--A-panel)" }}>
            {rows.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="w-full grid px-4 py-2.5 text-left transition-colors hover:bg-aaccent/5"
                style={{ gridTemplateColumns: template, gap: "0.5rem", borderBottom: "1px solid var(--A-line)" }}
              >
                <div className="text-atext-mute text-sm font-bold">{i + 1}</div>
                <div className="flex items-center gap-2 min-w-0">
                  {p.injured > 0 && <Heart className="w-3 h-3 flex-shrink-0 text-aneg" />}
                  <span className="truncate text-sm font-semibold text-atext">{nm(p)}</span>
                  {p.rookie && <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0" style={{ background: "color-mix(in srgb, var(--A-accent) 13%, transparent)", color: "var(--A-accent)" }}>R</span>}
                </div>
                {columns.map((c) => (
                  <div key={c.head} className={`flex items-center text-sm text-atext ${alignCls(c.align)}`}>{c.render(p)}</div>
                ))}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <PlayerCardModal player={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function PlayerDetail({ player, onClose }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const inLineup = lineupHasPlayer(career.lineup, player.id);
  const pName = player.firstName ? player.firstName+" "+player.lastName : (player.name||"Player");
  const renewalsLeague = PYRAMID[career.leagueKey];
  const extensionStableKey = renewalExtensionStableKey(career, player.id);
  const extensionPreview = useMemo(
    () => proposeRenewal(player, { stableKey: extensionStableKey }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extensionStableKey, player.id, player.wage, player.age, player.form, player.contract, player.overall, player.position],
  );
  const toggleLineup = () => {
    if (inLineup) updateCareer({ lineup: removeIdFromLineup(career.lineup, player.id) });
    // Adds land on the interchange — addToBench no-ops when it's full, never
    // appends past slot 22 (sparse lineups can be length-23 with count < 23).
    else updateCareer({ lineup: addToBench(career.lineup, player.id) });
  };
  const offerNewContract = () => {
    const proposal = proposeRenewal(player, { stableKey: extensionStableKey });
    if (!proposal) return;
    if (!canAffordRenewal(career, proposal)) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot extend ${pName} — would breach the salary cap` }, ...(career.news || [])].slice(0, 25),
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
      news: [{ week: career.week, type: 'win', text: `✍️ Extended ${pName}: +${proposal.proposedYears}y @ ${fmtK(proposal.proposedWage)}/yr (age/form weighted ask)` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const release = () => {
    updateCareer({ squad: career.squad.filter(p => p.id !== player.id), lineup: removeIdFromLineup(career.lineup, player.id) });
    onClose();
  };
  // Unhappiness resolution. promiseGameTime also clears any standing trade request
  // and the matching notification row; backPlayer is a smaller public vote of faith.
  const resolveUnhappiness = (fn, label) => {
    const week = career.week ?? 0;
    const updated = fn(player, week);
    const squad = career.squad.map((p) => (p.id === player.id ? updated : p));
    const patch = {
      squad,
      news: [{ week, type: 'info', text: `🤝 ${pName}: ${label}.` }, ...(career.news || [])].slice(0, 25),
    };
    // Clearing a trade request resolves the bell notification too.
    if (player.transferRequested && !updated.transferRequested) {
      patch.inbox = (career.inbox || []).map((m) =>
        m.id === `transfer_req_${player.id}` ? { ...m, resolved: true, resolvedAt: Date.now() } : m);
    }
    updateCareer(patch);
  };
  const onPromiseGameTime = () => resolveUnhappiness(promiseGameTime, 'promised more game time');
  const onBackPlayer = () => resolveUnhappiness(backPlayer, 'publicly backed by the coach');
  const ATTR_COLORS = { kicking:"#4ADBE8", marking:"#4AE89A", handball:"#A78BFA", tackling:"#E84A6F", speed:"var(--A-accent)", endurance:"#4AE89A", strength:"#E84A6F", decision:"#4ADBE8" };

  const detailClub = findClub(career.clubId);

  return (
    <div className="rounded-2xl overflow-hidden sticky top-20" style={{background:"var(--A-panel-2)", border:"1px solid var(--A-line)"}}>
      {/* Header */}
      <div className="p-3" style={{background:`linear-gradient(135deg, var(--A-panel), var(--A-panel-2))`}}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-dim truncate">
            {POSITION_NAMES[player.position]}{player.secondaryPosition ? ` · ${POSITION_NAMES[player.secondaryPosition]}` : ''}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {player.contract <= 1 && <Pill color="#FFB347">Renew soon</Pill>}
            {player.trueRating && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:"#4ADBE814",color:"#4ADBE8",border:"1px solid #4ADBE830"}}>
                Scout {player.trueRating}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-atext-mute hover:text-atext hover:bg-apanel-2 border border-transparent hover:border-aline transition-colors touch-manipulation"
              aria-label="Close profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mb-3">
          <PlayerCard3D player={player} club={detailClub} />
        </div>
        {/* Form / Fitness / Morale row */}
        <div className="grid grid-cols-3 gap-2">
          {[["Form", player.form, player.form>=75?"var(--A-pos)":player.form>=55?"var(--A-accent)":"var(--A-neg)"],
            ["Fitness", player.fitness, player.fitness>=80?"var(--A-pos)":player.fitness>=60?"var(--A-accent)":"var(--A-neg)"],
            ["Morale", player.morale, player.morale>=75?"var(--A-pos)":"var(--A-accent)"]].map(([l,v,c])=>(
            <div key={l} className="rounded-xl p-2.5 text-center" style={{background:"var(--A-panel-2)"}}>
              <div className="text-[8px] font-black uppercase tracking-widest text-atext-mute">{l}</div>
              <div className="font-display text-2xl leading-tight" style={{color:c}}>{v}</div>
              <div className="h-1 rounded-full mt-1 overflow-hidden" style={{background:"var(--A-line)"}}>
                <div className="h-full rounded-full" style={{width:`${v}%`,background:c}} />
              </div>
              {l === 'Form' && player.formHistory?.length > 0 && (
                <div className="flex justify-center mt-1.5">
                  <FormSparkline history={player.formHistory} current={player.form} />
                </div>
              )}
              {l === 'Morale' && (
                <div className="flex justify-center mt-1.5">
                  <MoraleBandPill morale={player.morale} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Morale event log — last few cause-and-effect changes */}
        {(player.moraleLog?.length > 0 || player.transferRequested) && (
          <div className="mt-3 rounded-xl p-2.5" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
            <div className="text-[8px] font-black uppercase tracking-widest text-atext-mute mb-1.5">Morale Log</div>
            {player.transferRequested && (
              <div className="text-[10px] font-bold text-aneg mb-1.5">🗣️ Has requested a trade — unsettled by limited opportunities.</div>
            )}
            {(player.moraleLog || []).slice(0, 4).map((e, i) => {
              const up = (e.delta ?? 0) >= 0;
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-[10px] leading-snug py-0.5">
                  <span className="text-atext-dim truncate">{e.reason || '—'}</span>
                  <span className="font-mono font-bold flex-shrink-0" style={{ color: up ? 'var(--A-pos)' : 'var(--A-neg)' }}>
                    {up ? '+' : ''}{e.delta ?? 0}
                  </span>
                </div>
              );
            })}
            {(player.moraleLog?.length ?? 0) === 0 && (
              <div className="text-[10px] text-atext-mute italic">No recent changes logged.</div>
            )}
          </div>
        )}
      </div>

      {/* Attributes */}
      <div className="p-4" style={{borderTop:"1px solid var(--A-line)"}}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-3">Attributes</div>
        {/* Radar chart */}
        <div style={{height:190}}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={Object.entries(player.attrs).map(([k, v]) => ({
                attr: k.slice(0,3).toUpperCase(),
                value: v,
                fullMark: 100,
              }))}
              margin={{top:8,right:16,bottom:8,left:16}}
            >
              <PolarGrid stroke="var(--A-line)" strokeOpacity={0.7} />
              <PolarAngleAxis
                dataKey="attr"
                tick={{ fontSize: 9, fill: 'var(--A-text-mute)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}
              />
              <Radar
                name="attrs"
                dataKey="value"
                stroke="var(--A-accent)"
                strokeWidth={1.5}
                fill="var(--A-accent)"
                fillOpacity={0.15}
                dot={{ r: 2.5, fill: 'var(--A-accent)', strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Compact numeric grid */}
        <div className="grid grid-cols-4 gap-1 mt-2">
          {Object.entries(player.attrs).map(([k, v]) => {
            const color = ATTR_COLORS[k] || "var(--A-accent)";
            return (
              <div key={k} className="rounded-lg px-1.5 py-1.5 text-center" style={{background:"var(--A-panel)"}}>
                <div className="text-[8px] font-black uppercase tracking-wider" style={{color:"var(--A-text-mute)"}}>{k.slice(0,3)}</div>
                <div className="text-[14px] font-black leading-tight tabular-nums" style={{color}}>{v}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Career Arc */}
      {(() => {
        const age = player.age;
        let stage, badgeColor, desc, delta;
        if (age <= 22) {
          stage = "DEVELOPING"; badgeColor = "#60A5FA";
          desc = "Expected to improve each season";
          delta = "+2 to +6 OVR";
        } else if (age <= 26) {
          stage = "PRIME"; badgeColor = "var(--A-accent)";
          desc = "Peak years — compete for selection";
          delta = "±1 OVR";
        } else if (age <= 29) {
          stage = "EXPERIENCED"; badgeColor = "#F59E0B";
          desc = "Natural decline starting — plan succession";
          delta = "−1 to −3 OVR";
        } else {
          stage = "VETERAN"; badgeColor = "#E84A6F";
          desc = "Significant decline likely each off-season";
          delta = "−2 to −6 OVR";
        }
        const MIN_AGE = 18, MAX_AGE = 37, SPAN = MAX_AGE - MIN_AGE;
        const zones = [
          { from: 18, to: 23, color: "#60A5FA" },
          { from: 23, to: 27, color: "var(--A-accent)" },
          { from: 27, to: 30, color: "#F59E0B" },
          { from: 30, to: 37, color: "#E84A6F" },
        ];
        const pct = (a) => `${Math.min(100, Math.max(0, ((a - MIN_AGE) / SPAN) * 100))}%`;
        const dotPct = Math.min(100, Math.max(0, ((age - MIN_AGE) / SPAN) * 100));
        return (
          <div className="px-4 pb-4" style={{borderTop:"1px solid var(--A-line)", paddingTop:"1rem"}}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute">Career Arc</div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{background:`color-mix(in srgb, ${badgeColor} 16%, transparent)`, color:badgeColor, border:`1px solid color-mix(in srgb, ${badgeColor} 30%, transparent)`}}>{stage}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-visible mb-1" style={{background:"var(--A-line)"}}>
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {zones.map((z, zi) => (
                  <div key={zi} className="absolute top-0 h-full opacity-70" style={{left:pct(z.from), width:`calc(${pct(z.to)} - ${pct(z.from)})`, background:z.color}} />
                ))}
              </div>
              <div className="absolute top-1/2 w-3 h-3 rounded-full border-2 z-10" style={{left:`${dotPct}%`, transform:"translate(-50%, -50%)", background:badgeColor, borderColor:"var(--A-bg)", boxShadow:`0 0 0 2px ${badgeColor}`}} />
            </div>
            <div className="flex justify-between text-[8px] text-atext-mute mb-2 mt-1.5">
              <span>18</span><span>26</span><span>30</span><span>37</span>
            </div>
            <div className="text-[10px] text-atext-dim leading-snug">{desc}</div>
            <div className="mt-1 text-[10px] font-bold" style={{color:badgeColor}}>Next season: {delta}</div>
          </div>
        );
      })()}

      {/* Season Stats */}
      <div className="px-4 pb-4" style={{borderTop:"1px solid var(--A-line)", paddingTop:"1rem"}}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-atext-mute mb-3">Season Stats</div>
        <div className="grid grid-cols-4 gap-2">
          {[["G", player.goals,"var(--A-pos)"],["B",player.behinds,"var(--A-accent)"],["DSP",player.disposals,"var(--A-accent)"],["M",player.marks,"#A78BFA"]].map(([l,v,c])=>(
            <div key={l} className="rounded-xl p-2.5 text-center" style={{background:"var(--A-panel-2)", border:"1px solid var(--A-line)"}}>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{color:c}}>{l}</div>
              <div className="font-display text-2xl leading-tight text-atext">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2" style={{borderTop:"1px solid var(--A-line)"}}>
        {(player.transferRequested || (player.morale ?? 75) < 45) && (
          <div className="rounded-xl p-2.5 mb-1 space-y-2" style={{ background: 'color-mix(in srgb, var(--A-neg) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--A-neg) 25%, transparent)' }}>
            <div className="text-[10px] font-bold text-aneg leading-snug">
              {player.transferRequested ? 'Wants a trade. Win him back:' : 'Mood is dropping — get ahead of it:'}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onPromiseGameTime} className={`flex-1 ${css.btnPrimary} text-xs py-2`}>Promise game time</button>
              <button type="button" onClick={onBackPlayer} className={`flex-1 ${css.btnGhost} text-xs py-2`}>Back publicly</button>
            </div>
          </div>
        )}
        <button onClick={toggleLineup} className={`w-full text-sm font-bold py-2.5 rounded-xl transition-all ${inLineup ? css.btnDanger : css.btnPrimary}`}>
          {inLineup ? "Remove from match squad" : lineupPlayerCount(career.lineup) >= LINEUP_CAP ? "Match squad full" : "Add to match squad"}
        </button>
        {extensionPreview && (
          <div className="text-[10px] text-atext-dim text-center leading-snug px-1">
            Ask this week: ~{fmtK(extensionPreview.proposedWage)}/yr · {extensionPreview.proposedYears}y (age + form weighted; stable until the round advances)
          </div>
        )}
        <button type="button" onClick={offerNewContract} className={`w-full ${css.btnGhost} text-sm`}>Offer contract extension (cap-checked)</button>
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

// Suggest the best tactic for a zone based on avg overall of players in that zone.
function autoSuggestTactic(avgOvr) {
  if (avgOvr >= 80) return 'press';
  if (avgOvr >= 74) return 'balanced';
  if (avgOvr >= 68) return 'flood';
  return 'defensive';
}

const PHILOSOPHY_COLORS = {
  attacking: 'var(--A-pos)',
  defensive: 'var(--A-accent)',
  balanced:  '#F59E0B',
  contested: '#E84A6F',
};
const PHILOSOPHY_LABELS = { attacking: 'Attacking', defensive: 'Defensive', balanced: 'Balanced', contested: 'Contested' };

function ZoneTacticPicker({ label, zoneColor, currentKey, onSelect, players, coachPhilosophy }) {
  const avgOvr = players.length
    ? Math.round(players.reduce((s, p) => s + (p.overall || 70), 0) / players.length)
    : null;

  return (
    <div className={`${css.panel} p-4`}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: zoneColor }} />
          <h4 className="font-display text-lg tracking-wide text-atext">{label.toUpperCase()}</h4>
        </div>
        <div className="flex items-center gap-2">
          {avgOvr && <span className="text-[10px] font-mono text-atext-mute">Avg OVR {avgOvr}</span>}
          <Pill color={zoneColor}>{TACTIC_CARDS.find(t => t.key === currentKey)?.label || 'Balanced'}</Pill>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {TACTIC_CARDS.map(tc => {
          const Icon = tc.icon;
          const active = currentKey === tc.key;
          const fit = coachPhilosophy ? philosophyTacticFit(coachPhilosophy, tc.key) : 0;
          const fitColor = fit >= 2 ? 'var(--A-pos)' : fit === 1 ? '#4AE89A' : fit === -1 ? '#F59E0B' : fit <= -2 ? 'var(--A-neg)' : null;
          return (
            <button key={tc.key} type="button" onClick={() => onSelect(tc.key)}
              className={`text-left p-3 rounded-xl border transition-all min-h-[44px] ${active ? 'ring-2 ring-aaccent' : 'hover:border-aaccent/30'}`}
              style={{ background: active ? `${tc.color}15` : 'var(--A-panel-2)', borderColor: active ? tc.color : 'var(--A-line)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tc.color }} />
                <span className="font-bold text-[11px] text-atext">{tc.label}</span>
                {fitColor && (
                  <span className="ml-auto text-[10px] font-mono font-bold" style={{ color: fitColor }}>
                    {fit > 0 ? `+${fit}` : fit}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-atext-dim leading-snug">{tc.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ROLE_GRADE_COLOR = { A: 'var(--A-pos)', B: '#64748B', C: 'var(--A-neg)' };

function PlayerRolesPanel({ lineup, playerRoles, onSet }) {
  const roleEntries = Object.entries(PLAYER_ROLES);
  return (
    <div className={`${css.panel} p-5`}>
      <h3 className={`${css.h1} text-2xl mb-1`}>PLAYER ROLES</h3>
      <p className="text-xs text-atext-dim mb-4 leading-snug">
        Assign roles to starters. <span className="text-atext font-semibold">A-grade</span> fits boost your team rating;{' '}
        <span className="text-atext font-semibold">C-grade</span> mismatches cost you.
      </p>
      {lineup.length === 0 ? (
        <div className="text-[11px] text-atext-dim">No players in your match squad yet.</div>
      ) : (
        <div className="space-y-1.5">
          {lineup.map((p) => {
            const roleKey = playerRoles[p.id] || 'none';
            const fit = roleFit(p, roleKey);
            const showFit = roleKey !== 'none' && PLAYER_ROLES[roleKey]?.attrs?.length;
            return (
              <div key={p.id} className={`${css.inset} flex items-center gap-2 p-2`}>
                <RatingDot value={p.overall} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-atext truncate">{p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()}</div>
                  <div className="text-[10px] text-atext-dim uppercase tracking-wide">{formatPositionSlash(p) || p.position}</div>
                </div>
                {showFit ? (
                  <Pill color={ROLE_GRADE_COLOR[fit.grade]}>{fit.grade}</Pill>
                ) : null}
                <select
                  value={roleKey}
                  onChange={(e) => onSet(p.id, e.target.value)}
                  className="bg-apanel border border-aline rounded-lg text-[11px] text-atext px-2 py-1.5 min-h-[36px] max-w-[150px]"
                >
                  {roleEntries.map(([key, r]) => (
                    <option key={key} value={key}>{r.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TacticsTab({ onOpenClubStaff }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const squad = career.squad || [];
  const rawLineup = career.lineup || [];
  const lineup = lineupPlayersOrdered(squad, rawLineup);
  const byPos = POSITIONS.reduce((acc, p) => ({ ...acc, [p]: lineup.filter(pl => pl.position === p) }), {});

  // Zone tactic keys — fall back to global tacticChoice for backward compat.
  const global = career.tacticChoice || 'balanced';
  const defTactic = career.defenceTactic || global;
  const midTactic = career.tacticChoice || 'balanced';
  const fwdTactic = career.forwardTactic || global;

  const setDefence  = (key) => updateCareer({ defenceTactic: key });
  const setMidfield = (key) => updateCareer({ tacticChoice: key });
  const setForward  = (key) => updateCareer({ forwardTactic: key });

  const backPlayers  = lineup.filter(p => ['KB','HB'].includes(p.position));
  const midPlayers   = lineup.filter(p => ['C','R','WG'].includes(p.position));
  const fwdPlayers   = lineup.filter(p => ['KF','HF'].includes(p.position));

  const headCoach = (career.staff || []).find(s => s.id === 's1');
  const coachPhilosophy = headCoach?.philosophy || null;

  const autoAssignTactics = () => {
    updateCareer({
      defenceTactic:  autoSuggestTactic(backPlayers.length ? backPlayers.reduce((s,p)=>s+p.overall,0)/backPlayers.length : 70),
      tacticChoice:   autoSuggestTactic(midPlayers.length  ? midPlayers.reduce((s,p)=>s+p.overall,0)/midPlayers.length  : 70),
      forwardTactic:  autoSuggestTactic(fwdPlayers.length  ? fwdPlayers.reduce((s,p)=>s+p.overall,0)/fwdPlayers.length  : 70),
    });
  };

  return (
    <div className="space-y-6 touch-manipulation">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className={`${css.h1} text-2xl`}>ZONE TACTICS</h3>
          <p className="text-xs text-atext-dim mt-1">Set the approach for each zone independently. Midfield tactic drives the overall match engine.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {coachPhilosophy && (
            <span className="text-[10px] font-mono px-2 py-1 rounded-lg font-bold"
              style={{ background: `color-mix(in srgb,${PHILOSOPHY_COLORS[coachPhilosophy]} 18%,transparent)`,
                       color: PHILOSOPHY_COLORS[coachPhilosophy],
                       border: `1px solid color-mix(in srgb,${PHILOSOPHY_COLORS[coachPhilosophy]} 35%,transparent)` }}>
              {headCoach.name?.split(' ')[1] || 'Coach'}: {PHILOSOPHY_LABELS[coachPhilosophy]}
            </span>
          )}
          <button type="button" onClick={autoAssignTactics}
            className={`${css.btnGhost} flex items-center gap-1.5 text-xs min-h-[44px]`}>
            <Wand2 className="w-4 h-4" /> Auto-suggest
          </button>
        </div>
      </div>

      <ZoneTacticPicker zone="defence"  label="Defence"  zoneColor="#4AE89A" currentKey={defTactic} onSelect={setDefence}  players={backPlayers} coachPhilosophy={coachPhilosophy} />
      <ZoneTacticPicker zone="midfield" label="Midfield" zoneColor="var(--A-accent)" currentKey={midTactic} onSelect={setMidfield} players={midPlayers} coachPhilosophy={coachPhilosophy} />
      <ZoneTacticPicker zone="forward"  label="Forward"  zoneColor="#E84A6F" currentKey={fwdTactic} onSelect={setForward}  players={fwdPlayers} coachPhilosophy={coachPhilosophy} />

      <div className={`${css.panel} p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
        <div className="text-xs text-atext-dim max-w-xl leading-snug">
          <span className="text-atext font-semibold">Coaching staff</span> amplify zone tactics — hire specialists under{' '}
          <span className="text-atext font-semibold">Club → Operations → Staff</span>.
        </div>
        {typeof onOpenClubStaff === 'function' && (
          <button type="button" className={`${css.btnPrimary} text-xs px-4 py-2.5 shrink-0 min-h-[44px]`} onClick={onOpenClubStaff}>
            Open Staff
          </button>
        )}
      </div>

      <PlayerRolesPanel lineup={lineup} playerRoles={career.playerRoles || {}}
        onSet={(playerId, roleKey) => updateCareer({ playerRoles: { ...(career.playerRoles || {}), [playerId]: roleKey } })} />

    <div className="grid md:grid-cols-2 gap-4">
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>POSITION DEPTH</h3>
        <div className="text-[11px] text-atext-dim mb-4">
          {lineupPlayerCount(rawLineup)}/{LINEUP_CAP} players in your match squad (bench included). Counts reflect everyone selected in the squad list — ordered in <span className="text-atext font-semibold">Selected squad</span> beside this panel.
        </div>
        <div className="grid grid-cols-3 gap-2">
          {POSITIONS.map(p => (
            <div key={p} className={`${css.inset} p-2 text-center`}>
              <div className="text-[9px] text-atext-dim uppercase">{p}</div>
              <div className="font-display text-2xl text-aaccent">{byPos[p]?.length || 0}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>SELECTED SQUAD (ORDER)</h3>
        <div className="text-[11px] text-atext-dim mb-4">
          Drag the grip to reorder. Remove with ✕. Add or swap players from <span className="text-atext font-semibold">Squad → Players</span>.
        </div>
        <LineupSortablePanel stitch={false} />
        <button
          type="button"
          className={`${css.btnGhost} mt-4 text-xs font-bold uppercase tracking-wider min-h-[44px]`}
          onClick={() => updateCareer({
            lineup: [...career.squad].sort((a,b)=>b.overall-a.overall).slice(0, LINEUP_CAP).map(p => p.id),
          })}
        >
          Auto-select match squad (by rating)
        </button>
      </div>
    </div>
    </div>
  );
}

function trainingPhaseAdvice(career, league) {
  const phase = career.phase ?? 'regular';
  const completedRounds = career.completedRounds ?? 0;
  const totalRounds = league?.rounds ?? 22;
  const roundsLeft = totalRounds - completedRounds;
  if (phase === 'pre_season' || phase === 'preseason')
    return { label: 'Pre-season', advice: 'Push intensity — fitness banks are built now. 75–90 recommended.', recommend: 82 };
  if (phase === 'finals')
    return { label: 'Finals block', advice: 'Taper down — freshen the legs, trust the system. 55–65 recommended.', recommend: 60 };
  if (roundsLeft <= 3)
    return { label: 'End of season', advice: 'Light work — preserve the list for finals. 50–60 recommended.', recommend: 55 };
  return { label: 'In-season', advice: 'Moderate load — match fitness over development. 65–75 recommended.', recommend: 70 };
}

function TrainingTab({ onOpenClubStaff }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const t = career.training;
  const focusSum = useMemo(() => Object.values(t.focus || {}).reduce((a, b) => a + b, 0), [t.focus]);

  const setIntensity = (v) => updateCareer({ training: { ...t, intensity: v } });
  const setFocus = (k, v) => {
    const clamped = Math.max(5, Math.min(80, v));
    const others = Object.keys(t.focus || {}).filter((x) => x !== k);
    const remain = 100 - clamped;
    const oldOthers = others.reduce((a, x) => a + t.focus[x], 0);
    const newFocus = { [k]: clamped };
    others.forEach((x) => {
      newFocus[x] =
        oldOthers === 0 ? Math.round(remain / others.length) : Math.round((t.focus[x] / oldOthers) * remain);
    });
    let sum = Object.values(newFocus).reduce((a, b) => a + b, 0);
    let drift = 100 - sum;
    if (drift !== 0 && others.length) {
      newFocus[others[0]] = Math.max(5, Math.min(80, newFocus[others[0]] + drift));
    }
    sum = Object.values(newFocus).reduce((a, b) => a + b, 0);
    drift = 100 - sum;
    if (drift !== 0) newFocus[k] = Math.max(5, Math.min(80, newFocus[k] + drift));
    updateCareer({ training: { ...t, focus: newFocus } });
  };

  const TRAINING_PRESETS = [
    { key: "preseason", label: "Pre-season load", intensity: 82, focus: { skills: 32, fitness: 32, tactics: 23, recovery: 13 } },
    { key: "balanced", label: "Balanced", intensity: 60, focus: { skills: 25, fitness: 25, tactics: 25, recovery: 25 } },
    { key: "maintenance", label: "In-season taper", intensity: 48, focus: { skills: 22, fitness: 22, tactics: 22, recovery: 34 } },
    { key: "youth", label: "Youth develop", intensity: 68, focus: { skills: 38, fitness: 28, tactics: 24, recovery: 10 } },
  ];

  const applyPreset = (preset) => {
    updateCareer({ training: { ...t, intensity: preset.intensity, focus: { ...preset.focus } } });
  };

  const recommendedPreset = () => {
    const phase = career.phase || 'preseason';
    const avgAge = (career.squad || []).reduce((s, p) => s + (p.age || 24), 0) / Math.max(1, (career.squad || []).length);
    if (phase === 'finals') return TRAINING_PRESETS.find(p => p.key === 'maintenance');
    if (phase === 'season') return TRAINING_PRESETS.find(p => p.key === 'maintenance');
    if (avgAge <= 23) return TRAINING_PRESETS.find(p => p.key === 'youth');
    return TRAINING_PRESETS.find(p => p.key === 'preseason');
  };

  const today = career.currentDate || `${career.season - 1}-11-01`;
  const nextTraining = (career.eventQueue || []).find((e) => e.type === "training" && !e.completed && e.date >= today);
  const nextTrainingInfo = nextTraining ? TRAINING_INFO[nextTraining.subtype] : null;

  const intMul = intensityScale(t.intensity ?? 60);
  const skillsBoost = trainingAttrFocusBoost("kicking", t.focus);
  const fitnessBoost = trainingAttrFocusBoost("speed", t.focus);
  const tacticsBoost = trainingAttrFocusBoost("decision", t.focus);
  const staffTrainingNote = trainingStaffSupportLine(career.staff, t.focus?.tactics ?? 25);

  const medLevel = career.facilities?.medical?.level ?? 1;
  const recoveryFocus = t?.focus?.recovery ?? 20;
  const intensity = t.intensity ?? 60;
  const matchInjuryProb = clamp(0.12 + (intensity - 50) * 0.002 - medLevel * 0.012 - (recoveryFocus - 20) * 0.001, 0.04, 0.28);
  const trainingInjuryProb = Math.max(
    0,
    (intensity - 50) * 0.0014 + 0.012 - medLevel * 0.005 - (recoveryFocus - 20) * 0.0008,
  );

  // Auto-assign: pick the highest-rated staff member as training lead.
  const autoAssignTrainingStaff = () => {
    const staff = career.staff || [];
    if (!staff.length) return;
    const best = [...staff].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    updateCareer({ staffTasks: { ...(career.staffTasks || {}), trainingLeadId: best.id } });
  };
  const currentTrainer = (career.staff || []).find(s => s.id === career.staffTasks?.trainingLeadId);

  return (
    <div className="space-y-6 touch-manipulation">
      <div className={`${css.panel} p-4 md:p-5`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-atext-mute mb-1">Training Lead</div>
            <div className="text-sm font-semibold text-atext">
              {currentTrainer ? `${currentTrainer.name} (${currentTrainer.role}) · ${currentTrainer.rating}` : 'Not assigned'}
            </div>
            <div className="text-[11px] text-atext-dim mt-0.5 leading-snug">
              {staffTrainingNote || 'Hire fitness/tactics coaches under Club → Staff to improve sessions.'}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={autoAssignTrainingStaff}
              className={`${css.btnGhost} flex items-center gap-1.5 text-xs min-h-[44px]`}>
              <Wand2 className="w-4 h-4" /> Auto-assign
            </button>
            {typeof onOpenClubStaff === 'function' && (
              <button type="button" className={`${css.btnPrimary} text-xs px-4 py-2.5 shrink-0 min-h-[44px]`} onClick={onOpenClubStaff}>
                Manage Staff
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={`${css.panel} p-4 md:p-5`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute">Quick presets</div>
          <button
            type="button"
            onClick={() => { const rec = recommendedPreset(); if (rec) applyPreset(rec); }}
            className={`${css.btnPrimary} flex items-center gap-1.5 text-xs px-3 py-2 min-h-[36px]`}
          >
            <Wand2 className="w-3.5 h-3.5" /> Recommended
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRAINING_PRESETS.map((pr) => (
            <button
              key={pr.key}
              type="button"
              onClick={() => applyPreset(pr)}
              className={`${css.btnGhost} text-xs px-3 py-2.5 min-h-[44px] font-semibold`}
            >
              {pr.label}
            </button>
          ))}
        </div>
        {nextTraining && nextTrainingInfo && (
          <div className="mt-3 text-[11px] text-atext-dim leading-snug rounded-xl border border-aline bg-apanel-2 px-3 py-2">
            <span className="text-aaccent font-bold">Next session:</span> {nextTrainingInfo.icon} {nextTrainingInfo.name} on{" "}
            <span className="text-atext font-medium">{formatDate(nextTraining.date)}</span> — targets {nextTrainingInfo.attrs?.join(", ") || "attributes"} (gains still scale with sliders below).
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>TRAINING INTENSITY</h3>
          <p className="text-xs text-atext-dim mb-4">
            Intensity scales raw attribute gains on training days — multiplier ≈{" "}
            <span className="text-atext font-mono font-bold">{intMul.toFixed(2)}×</span> (about 1.0 at intensity 60).
          </p>
          {(() => {
            const phaseAdvice = trainingPhaseAdvice(career, PYRAMID[career.leagueKey]);
            return (
              <div className="rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-2"
                style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-aaccent">{phaseAdvice.label}</div>
                  <div className="text-[11px] text-atext-mute mt-0.5 leading-tight">{phaseAdvice.advice}</div>
                </div>
                <button
                  onClick={() => updateCareer({ training: { ...t, intensity: phaseAdvice.recommend } })}
                  className="text-[11px] px-2 py-1 rounded-lg shrink-0 font-medium"
                  style={{ background: 'var(--A-accent)', color: 'var(--fd-on-accent)' }}>
                  Apply
                </button>
              </div>
            );
          })()}
          <div className="flex items-center gap-3 mb-2 py-1">
            <div className={`${css.h1} text-5xl text-aaccent w-20 text-center`}>{t.intensity}</div>
            <div className="flex-1 min-h-[48px] flex flex-col justify-center">
              <input
                type="range"
                min="20"
                max="100"
                value={t.intensity}
                onChange={(e) => setIntensity(+e.target.value)}
                className="w-full h-3 accent-[var(--A-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-atext-dim mt-1 uppercase tracking-widest">
                <span>Easy</span>
                <span>Hard</span>
              </div>
            </div>
          </div>
          <div className={`${css.inset} p-3 mt-4 space-y-2`}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-atext-dim uppercase tracking-widest font-mono">Match-day injury risk</span>
              <span
                className="font-display text-base"
                style={{
                  color: matchInjuryProb > 0.2 ? "#E84A6F" : matchInjuryProb > 0.13 ? "var(--A-accent)" : "#4AE89A",
                }}
              >
                {(matchInjuryProb * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-atext-dim uppercase tracking-widest font-mono">Training-day injury risk</span>
              <span
                className="font-display text-base"
                style={{
                  color: trainingInjuryProb > 0.04 ? "var(--A-neg)" : trainingInjuryProb > 0.02 ? "var(--A-accent)" : "var(--A-pos)",
                }}
              >
                {(trainingInjuryProb * 100).toFixed(2)}%
              </span>
            </div>
            <div className="text-[10px] text-atext-mute leading-relaxed">
              Medical Centre Lvl {medLevel} cuts injury rate
              {medLevel > 1 ? ` and recovery time by ${medLevel - 1}w` : ""}. Recovery focus ({recoveryFocus}%) further softens hits
              and adds fitness restoration after sessions when ≥35%.
            </div>
          </div>
        </div>
        <div className={`${css.panel} p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className={`${css.h1} text-2xl`}>TRAINING FOCUS</h3>
            <Pill color={focusSum === 100 ? "var(--A-pos)" : "var(--A-accent-2)"}>Total {focusSum}%</Pill>
          </div>
          <p className="text-xs text-atext-dim mb-2">
            Shares must total 100 — each slider redistributes the rest. Boost aligns with{" "}
            <span className="text-atext font-medium">skills / fitness / tactics</span> attribute families on the next training day (see{" "}
            <span className="font-mono">applyTraining</span>).
          </p>
          <div className={`${css.inset} p-3 mb-4 text-[11px] text-atext-dim space-y-1`}>
            <div>
              <span className="text-atext font-semibold">Skills</span> emphasis → ~×{skillsBoost.toFixed(2)} gain on kicking / marking / handball vs 25% baseline.
            </div>
            <div>
              <span className="text-atext font-semibold">Fitness</span> emphasis → ~×{fitnessBoost.toFixed(2)} on speed / endurance / strength.
            </div>
            <div>
              <span className="text-atext font-semibold">Tactics</span> emphasis → ~×{tacticsBoost.toFixed(2)} on decision / tackling.
            </div>
            <div className="text-[10px] text-atext-mute pt-1 border-t border-aline/60 mt-2">{staffTrainingNote}</div>
          </div>
          {Object.entries(t.focus || {}).map(([k, v]) => {
            const colors = { skills: "var(--A-accent)", fitness: "#4ADBE8", tactics: "#E84A6F", recovery: "#4AE89A" };
            const labels = { skills: "Skills", fitness: "Fitness", tactics: "Tactics", recovery: "Recovery" };
            return (
              <div key={k} className="mb-4 last:mb-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm capitalize font-semibold" style={{ color: colors[k] }}>
                    {labels[k] || k}
                  </span>
                  <span className="font-display text-lg">{v}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={v}
                  onChange={(e) => setFocus(k, +e.target.value)}
                  className="w-full h-3 cursor-pointer"
                  style={{ accentColor: colors[k] }}
                />
              </div>
            );
          })}
        </div>
      </div>
      {(() => {
        const hc = (career.staff || []).find(s => s.id === 's1');
        if (!hc) return null;
        const phil = hc.philosophy;
        const PHILOSOPHIES = ['attacking', 'defensive', 'balanced', 'contested'];
        const setPhilosophy = (newPhil) => {
          updateCareer(c => ({
            ...c,
            staff: (c.staff || []).map(s => s.id === 's1' ? { ...s, philosophy: newPhil } : s),
            // ponytail: morale cost — -5 to all staff mood; future upgrade: track this per-season
            squad: (c.squad || []).map(p => ({ ...p, morale: Math.max(30, (p.morale ?? 75) - 5) })),
          }));
        };
        return (
          <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-aaccent mb-0.5">Head Coach Philosophy</div>
                <div className="text-sm font-semibold text-atext">{hc.name}</div>
                {phil && (
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-lg font-bold"
                    style={{ background: `color-mix(in srgb,${PHILOSOPHY_COLORS[phil]} 18%,transparent)`,
                             color: PHILOSOPHY_COLORS[phil],
                             border: `1px solid color-mix(in srgb,${PHILOSOPHY_COLORS[phil]} 35%,transparent)` }}>
                    {PHILOSOPHY_LABELS[phil]}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <select value={phil || ''} onChange={(e) => setPhilosophy(e.target.value)}
                  className="bg-apanel border border-aline rounded-lg text-[11px] text-atext px-2 py-1.5 min-h-[36px]">
                  <option value="" disabled>Set philosophy…</option>
                  {PHILOSOPHIES.map(p => <option key={p} value={p}>{PHILOSOPHY_LABELS[p]}</option>)}
                </select>
                <span className="text-[10px] text-atext-mute">Changing costs −5 squad morale</span>
              </div>
            </div>
          </div>
        );
      })()}
      {career.staffMarket?.length > 0 && (
      <div className="mt-6">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-aaccent mb-2">Staff Market</h3>
        <div className="space-y-2">
          {career.staffMarket.map(candidate => (
            <div key={candidate.marketId}
              className="rounded-xl p-3 flex items-center justify-between gap-3"
              style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-atext truncate">{candidate.name}</div>
                <div className="text-[11px] text-atext-mute mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{candidate.roleLabel} · Rating {candidate.rating}
                  {candidate.currentRating ? ` (currently ${candidate.currentRating})` : ''}</span>
                  {candidate.philosophy && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `color-mix(in srgb,${PHILOSOPHY_COLORS[candidate.philosophy]} 18%,transparent)`,
                               color: PHILOSOPHY_COLORS[candidate.philosophy] }}>
                      {PHILOSOPHY_LABELS[candidate.philosophy]}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-atext-dim mt-0.5">
                  ${(candidate.wage / 1000).toFixed(0)}k/yr · Sign-on ${(candidate.signingFee / 1000).toFixed(0)}k
                </div>
                {(() => {
                  // Soft-cap impact of this hire (replaces the current holder) — informational only, never blocks.
                  const tier = PYRAMID[career.leagueKey]?.tier ?? 2;
                  const oldWage = (career.staff || []).find(s => s.id === candidate.staffId)?.wage || 0;
                  const spend = (career.staff || []).reduce((a, s) => a + (s.wage || 0), 0) - oldWage + candidate.wage;
                  const fd = footballDeptLevy({ tier, staffWages: spend });
                  if (fd.cap == null) return null;
                  return (
                    <div className="text-[10px] mt-0.5" style={{ color: fd.over > 0 ? 'var(--A-neg)' : 'var(--A-pos)' }}>
                      {fd.over > 0
                        ? `Takes football dept ${fmtK(fd.over)} over the soft cap → ~${fmtK(fd.levy)} season-end tax`
                        : 'Within the football-department soft cap'}
                    </div>
                  );
                })()}
              </div>
              <button
                disabled={(career.finance?.cash ?? 0) < candidate.signingFee}
                onClick={() => {
                  updateCareer(c => {
                    if ((c.finance?.cash ?? 0) < candidate.signingFee) return c;
                    const updatedStaff = (c.staff || []).map(s =>
                      s.id === candidate.staffId
                        ? { ...s, name: candidate.name, rating: candidate.rating, wage: candidate.wage, contractYears: candidate.contractYears,
                            ...(candidate.philosophy ? { philosophy: candidate.philosophy } : {}) }
                        : s
                    );
                    const newMarket = (c.staffMarket || []).filter(m => m.marketId !== candidate.marketId);
                    return {
                      ...c,
                      staff: updatedStaff,
                      staffMarket: newMarket,
                      finance: { ...c.finance, cash: (c.finance?.cash ?? 0) - candidate.signingFee },
                    };
                  });
                }}
                className="text-[11px] px-3 py-1.5 rounded-lg shrink-0 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--A-accent)', color: '#000' }}>
                Sign
              </button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
  );
}

