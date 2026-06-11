import React, { useState, useMemo } from "react";
import {
  Users, Dumbbell,
  Zap, Heart, Target, Activity, Flame,
  TrendingUp, X,
  ShieldCheck,
  FileText,
  UserPlus, Wand2,
} from "lucide-react";
import { PYRAMID, findClub } from '../../data/pyramid.js';
import { POSITIONS, POSITION_NAMES, playerHasPosition, formatPositionSlash } from '../../lib/playerGen.js';
import { fmtK, clamp } from '../../lib/format.js';
import { TRAINING_INFO, formatDate, intensityScale, trainingAttrFocusBoost } from '../../lib/calendar.js';
import { css, RatingDot, Pill } from '../../components/primitives.jsx';
import { SquadLineupBuilder, LineupSortablePanel } from '../../components/SquadLineupDnD.jsx';
import TabNav from '../../components/TabNav.jsx';
// --- Finance system rebuild ---
import { proposeRenewal, renewalExtensionStableKey, applyRenewal, canAffordRenewal } from '../../lib/finance/contracts.js';
import {
  ensureCareerBoard,
  recalcBoardConfidence,
  applyMemberConfidenceDelta,
} from '../../lib/board.js';
import { lineupPlayersOrdered, LINEUP_CAP, lineupPlayerCount, lineupHasPlayer, removeIdFromLineup } from '../../lib/lineupHelpers.js';
import { trainingStaffSupportLine } from '../../lib/staffModifiers.js';
import { tutorialHighlightTab } from "../../components/TutorialOverlay.jsx";
import { RenewalsTab } from "../contracts/ContractRenewals.jsx";

// ============================================================================
// SHARED TAB NAV
// ============================================================================
// ============================================================================
// SQUAD SCREEN — players, tactics, training
// ============================================================================
export default function SquadScreen({ career, club, updateCareer, tab, setTab, tutorialActive, onOpenClubStaff, onNavigate }) {
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
      {t === "players"  && <PlayersTab career={career} updateCareer={updateCareer} />}
      {t === "tactics"  && <TacticsTab career={career} updateCareer={updateCareer} onOpenClubStaff={onOpenClubStaff} />}
      {t === "training" && <TrainingTab career={career} updateCareer={updateCareer} onOpenClubStaff={onOpenClubStaff} />}
      {t === "renewals" && <RenewalsTab career={career} updateCareer={updateCareer} />}
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

function PlayersTab({ career, updateCareer }) {
  const [sort, setSort] = useState("overall");
  const [filterPos, setFilterPos] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const rowHoverBg = 'rgba(13, 148, 136, 0.06)';
  const rowSelectBg = 'rgba(13, 148, 136, 0.1)';
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
      ? "bg-[linear-gradient(135deg,var(--A-accent),#0099b0)] text-[#001520] border-transparent shadow-[0_1px_6px_rgba(0,224,255,0.2)]"
      : "bg-apanel border border-aline text-atext-dim hover:border-aaccent/35";

  return (
    <div className="flex flex-col gap-10">
      <section className="space-y-4" aria-labelledby="match-day-title">
        <div className="space-y-1">
          <h3 id="match-day-title" className={`${css.h1} text-xl md:text-2xl tracking-wide`}>
            Match-day {LINEUP_CAP}
          </h3>
          <p className="text-xs text-atext-dim max-w-2xl leading-relaxed">
            Build the 23 on the map and bench pool. The roster table below is for browsing — it does not hide players from the bench list.
          </p>
        </div>
        <SquadLineupBuilder
          career={career}
          updateCareer={updateCareer}
          benchPlayerIds={benchPlayerIds}
          stitch={false}
          onSelectPlayer={(player) => setSelected((prev) => (prev?.id === player.id ? null : player))}
        />
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
                {["ALL", ...POSITIONS].map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFilterPos(pos)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all border ${filterChip(filterPos === pos)}`}
                  >
                    {pos}
                  </button>
                ))}
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
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilterStatus(key)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all border ${filterChip(filterStatus === key)}`}
                  >
                    {label}
                  </button>
                ))}
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
        <div className="md:hidden space-y-2 max-h-[65vh] overflow-y-auto px-0.5 [scrollbar-width:thin]">
          {players.map((p) => {
            const inLineup = lineupHasPlayer(career.lineup, p.id);
            const isSelected = selected?.id === p.id;
            const formColor = p.form >= 75 ? "var(--A-pos)" : p.form >= 55 ? "var(--A-accent)" : "var(--A-neg)";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(isSelected ? null : p)}
                className="w-full text-left rounded-xl p-3 border transition-all touch-manipulation"
                style={{
                  borderColor: isSelected ? "var(--A-accent)" : "var(--A-line)",
                  background: isSelected ? rowSelectBg : "var(--A-panel)",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-atext truncate">{pName(p)}</div>
                    <div className="text-[10px] text-atext-mute">{formatPositionSlash(p)} · age {p.age}</div>
                  </div>
                  <RatingDot value={p.overall} size="sm" />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                  <span className="font-bold" style={{ color: formColor }}>Form {p.form}</span>
                  {p.formHistory?.length > 0 && <FormSparkline history={p.formHistory} current={p.form} />}
                  <span className="text-atext-mute">Fitness {p.fitness}</span>
                  {inLineup && <Pill color="var(--A-pos)">23</Pill>}
                  {p.injured > 0 && <Pill color="var(--A-neg)">{p.injured}w</Pill>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="hidden md:block rounded-2xl overflow-hidden border border-aline shadow-sm">
          <div className="overflow-x-auto">
          <div className="grid px-4 py-3 min-w-[720px]" style={{gridTemplateColumns:"2rem minmax(140px,1fr) 4rem 3rem 3.5rem 5rem 5rem 4.5rem 3.5rem", gap:"0.5rem", background:"var(--A-panel-2)", borderBottom:"1px solid var(--A-line)"}}>
            {["#","Player","Pos","Age","OVR","Form","Fitness","Wage","Status"].map((h,i)=>(
              <div key={h} className={`text-[10px] font-black uppercase tracking-[0.15em] text-atext-mute ${i>1?"text-center":""} ${i===7?"text-right":""}`}>{h}</div>
            ))}
          </div>
          <div className="max-h-[65vh] overflow-y-auto min-w-[820px] [scrollbar-width:thin]" style={{background:"var(--A-panel)"}}>
            {players.map((p, i) => {
              const inLineup = lineupHasPlayer(career.lineup, p.id);
              const isSelected = selected?.id === p.id;
              const formColor = p.form >= 75 ? "var(--A-pos)" : p.form >= 55 ? "var(--A-accent)" : "var(--A-neg)";
              const fitColor  = p.fitness >= 80 ? "var(--A-pos)" : p.fitness >= 60 ? "var(--A-accent)" : "var(--A-neg)";
              return (
                <button key={p.id} onClick={()=>setSelected(isSelected ? null : p)}
                  type="button"
                  className="w-full grid px-4 py-3 transition-all text-left"
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
                    {p.injured > 0 && <Heart className="w-3 h-3 flex-shrink-0 text-aneg" />}
                    {inLineup && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:"var(--A-pos)", boxShadow:"0 0 4px var(--A-pos)"}} />}
                    <span className="truncate text-sm font-semibold text-atext">{pName(p)}</span>
                    {p.rookie && <span className="text-[9px] px-1.5 py-0.5 rounded font-black flex-shrink-0" style={{background:"color-mix(in srgb, var(--A-accent) 13%, transparent)",color:"var(--A-accent)"}}>R</span>}
                  </div>
                  <div className="text-center"><Pill color="var(--A-accent)">{formatPositionSlash(p)}</Pill></div>
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
                  <div className="text-center">
                    {p.suspended > 0
                      ? <Pill color="#A78BFA">SUS {p.suspended}w</Pill>
                      : p.injured > 0
                        ? <Pill color="var(--A-neg)">{p.injured}w</Pill>
                        : inLineup
                          ? <Pill color="var(--A-pos)">23</Pill>
                          : <span className="text-atext-mute text-xs">—</span>}
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        </div>
        </>
      </div>

      <div className="w-full lg:w-80 xl:w-72 flex-shrink-0">
        {selected ? (
          <PlayerDetail player={selected} career={career} updateCareer={updateCareer} onClose={()=>setSelected(null)} />
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
    </div>
      </section>
    </div>
  );
}

function PlayerDetail({ player, career, updateCareer, onClose }) {
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
    else if (lineupPlayerCount(career.lineup) < LINEUP_CAP) updateCareer({ lineup: [...(career.lineup || []), player.id] });
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
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-atext-mute hover:text-atext hover:bg-apanel-2 border border-transparent hover:border-aline transition-colors touch-manipulation"
              aria-label="Close profile"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center gap-1.5">
            <RatingDot value={player.overall} size="lg" />
            {player.trueRating && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:"#4ADBE814",color:"#4ADBE8",border:"1px solid #4ADBE830"}}>
                Scout {player.trueRating}
              </span>
            )}
            </div>
          </div>
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
                <div className="text-[11px] capitalize font-semibold text-atext-dim w-20 flex-shrink-0">{k}</div>
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

function ZoneTacticPicker({ zone, label, zoneColor, currentKey, onSelect, players }) {
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
          return (
            <button key={tc.key} type="button" onClick={() => onSelect(tc.key)}
              className={`text-left p-3 rounded-xl border transition-all min-h-[44px] ${active ? 'ring-2 ring-aaccent' : 'hover:border-aaccent/30'}`}
              style={{ background: active ? `${tc.color}15` : 'var(--A-panel-2)', borderColor: active ? tc.color : 'var(--A-line)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tc.color }} />
                <span className="font-bold text-[11px] text-atext">{tc.label}</span>
              </div>
              <div className="text-[10px] text-atext-dim leading-snug">{tc.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TacticsTab({ career, updateCareer, onOpenClubStaff }) {
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
        <button type="button" onClick={autoAssignTactics}
          className={`${css.btnGhost} flex items-center gap-1.5 text-xs min-h-[44px]`}>
          <Wand2 className="w-4 h-4" /> Auto-suggest
        </button>
      </div>

      <ZoneTacticPicker zone="defence"  label="Defence"  zoneColor="#4AE89A" currentKey={defTactic} onSelect={setDefence}  players={backPlayers} />
      <ZoneTacticPicker zone="midfield" label="Midfield" zoneColor="var(--A-accent)" currentKey={midTactic} onSelect={setMidfield} players={midPlayers} />
      <ZoneTacticPicker zone="forward"  label="Forward"  zoneColor="#E84A6F" currentKey={fwdTactic} onSelect={setForward}  players={fwdPlayers} />

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
        <LineupSortablePanel career={career} updateCareer={updateCareer} stitch={false} />
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

function TrainingTab({ career, updateCareer, onOpenClubStaff }) {
  const t = career.training;
  const focusSum = useMemo(() => Object.values(t.focus || {}).reduce((a, b) => a + b, 0), [t.focus]);

  const setIntensity = (v) => updateCareer({ training: { ...t, intensity: v } });
  const setFocus = (k, v) => {
    const clamped = Math.max(5, Math.min(80, v));
    const others = Object.keys(t.focus).filter((x) => x !== k);
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
  const recoveryFocus = t.focus.recovery ?? 20;
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
          {Object.entries(t.focus).map(([k, v]) => {
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
    </div>
  );
}

