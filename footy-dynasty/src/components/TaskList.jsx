// ---------------------------------------------------------------------------
// TaskList — actionable agenda + comprehensive coaching suggestions.
//
// Priorities:
//   urgent     — blocking issues that directly hurt your next match
//   warning    — needs attention within the next few weeks
//   suggestion — coaching advice, squad insights, strategic tips
//
// Each item has an action() that deep-links to the exact screen + tab.
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import { css } from "./primitives.jsx";
import { lineupPlayerCount, lineupHasPlayer, LINEUP_CAP } from "../lib/lineupHelpers.js";
import { useCareer } from "../lib/careerStore.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pName(p) {
  return `${p.firstName ?? ""}${p.firstName ? " " : ""}${p.lastName ?? p.name ?? ""}`.trim() || "Player";
}

function avgOvrOf(players) {
  if (!players.length) return 70;
  return Math.round(players.reduce((s, p) => s + (p.overall ?? 70), 0) / players.length);
}

function avgFormOf(players) {
  if (!players.length) return 60;
  return Math.round(players.reduce((s, p) => s + (p.form ?? 60), 0) / players.length);
}

// ── Suggestion engine ─────────────────────────────────────────────────────────

export function buildTasks(career, navigate, myLadderPos, league) {
  const tasks = [];
  const squad   = career.squad  || [];
  const lineup  = career.lineup || [];
  const staff   = career.staff  || [];
  const finance = career.finance || {};
  const training = career.training || { intensity: 60, focus: {} };
  const phase   = career.phase  || "preseason";
  const tier    = league?.tier  ?? 1;
  const inFinals = !!career.inFinals;

  // helpers
  const inSquad = (p) => lineupHasPlayer(lineup, p.id);
  const starters = squad.filter(inSquad);
  const bench    = squad.filter(p => !inSquad(p));

  // ── URGENT ─────────────────────────────────────────────────────────────────

  const lineupCount = lineupPlayerCount(lineup);
  if (lineupCount < LINEUP_CAP) {
    tasks.push({
      id: "lineup-fill", priority: "urgent", icon: "🏉",
      title: `Fill match-day 23 (${lineupCount}/${LINEUP_CAP})`,
      detail: "An incomplete 23 weakens your substitution options and may cost match points.",
      action: () => navigate("squad", "players"),
    });
  }

  const injuredIn = starters.filter(p => (p.injured || 0) > 0);
  if (injuredIn.length) {
    tasks.push({
      id: "injured-lineup", priority: "urgent", icon: "🤕",
      title: `${injuredIn.length} injured player${injuredIn.length > 1 ? "s" : ""} in your 23`,
      detail: injuredIn.map(p => `${pName(p)} (${p.injured}w out)`).join(" · "),
      action: () => navigate("squad", "players"),
    });
  }

  const suspendedIn = starters.filter(p => (p.suspended || 0) > 0);
  if (suspendedIn.length) {
    tasks.push({
      id: "suspended-lineup", priority: "urgent", icon: "🚫",
      title: `${suspendedIn.length} suspended player${suspendedIn.length > 1 ? "s" : ""} still in 23`,
      detail: suspendedIn.map(p => `${pName(p)} (${p.suspended}w ban)`).join(" · "),
      action: () => navigate("squad", "players"),
    });
  }

  const hasRuck = starters.some(p => p.position === "RU");
  if (lineupCount >= 15 && !hasRuck) {
    tasks.push({
      id: "no-ruck", priority: "urgent", icon: "⬆️",
      title: "No ruck in your 23",
      detail: "Without a ruck you automatically lose the tap — your midfield will be under constant pressure.",
      action: () => navigate("squad", "players"),
    });
  }

  if ((finance.boardConfidence ?? 100) < 35) {
    tasks.push({
      id: "board-critical", priority: "urgent", icon: "⚠️",
      title: `Board confidence critical — ${finance.boardConfidence}%`,
      detail: "Win your next match or face a vote of no confidence.",
      action: () => navigate("club", "overview"),
    });
  }

  // ── WARNING ────────────────────────────────────────────────────────────────

  const expiringIn = starters.filter(p => (p.contract ?? 2) <= 1);
  if (expiringIn.length) {
    tasks.push({
      id: "contracts", priority: "warning", icon: "📋",
      title: `${expiringIn.length} contract${expiringIn.length > 1 ? "s" : ""} expiring in your 23`,
      detail: expiringIn.map(pName).join(" · "),
      action: () => navigate("squad", "renewals"),
    });
  }

  // Out-of-contract players not yet in lineup but still on books
  const ootcBench = bench.filter(p => (p.contract ?? 2) === 0);
  if (ootcBench.length) {
    tasks.push({
      id: "ootc-bench", priority: "warning", icon: "📋",
      title: `${ootcBench.length} player${ootcBench.length > 1 ? "s" : ""} out of contract on bench`,
      detail: ootcBench.map(pName).join(" · ") + " — they'll walk for free if not renewed.",
      action: () => navigate("squad", "renewals"),
    });
  }

  if (!career.defenceTactic && !career.forwardTactic && (career.tacticChoice === "balanced" || !career.tacticChoice)) {
    tasks.push({
      id: "tactics-default", priority: "warning", icon: "🎯",
      title: "Zone tactics still on defaults",
      detail: "Defence, Midfield and Forward are all 'Balanced'. Tailor each zone to your squad strengths.",
      action: () => navigate("squad", "tactics"),
    });
  }

  if (!career.staffTasks?.trainingLeadId && staff.length > 0) {
    tasks.push({
      id: "training-staff", priority: "warning", icon: "🏋️",
      title: "No training lead assigned",
      detail: "Auto-assign your best coach to lift session gains — takes 2 seconds in Squad → Training.",
      action: () => navigate("squad", "training"),
    });
  }

  if ((finance.cash ?? Infinity) < 50_000) {
    tasks.push({
      id: "cash-low", priority: "warning", icon: "💸",
      title: `Cash critically low — ${Math.round((finance.cash ?? 0) / 1000)}k remaining`,
      detail: "You may miss wage payments. Review outgoings under Club → Finances.",
      action: () => navigate("club", "finances"),
    });
  }

  const wageBill = squad.reduce((s, p) => s + (p.wage || 0), 0) + staff.reduce((s, st) => s + (st.wage || 0), 0);
  if ((finance.cash ?? Infinity) > 0 && wageBill > (finance.cash ?? 0) * 1.5 && wageBill > 200_000) {
    tasks.push({
      id: "wages-vs-cash", priority: "warning", icon: "📊",
      title: "Annual wages exceed cash on hand by 50%+",
      detail: `Wage bill ~${Math.round(wageBill / 1000)}k/yr vs ${Math.round((finance.cash ?? 0) / 1000)}k cash. Sign sponsors or cut salaries.`,
      action: () => navigate("club", "finances"),
    });
  }

  // ── SUGGESTIONS ────────────────────────────────────────────────────────────

  // — Squad depth —

  const posCount = squad.reduce((acc, p) => { acc[p.position] = (acc[p.position] || 0) + 1; return acc; }, {});
  const keyPositions = ["RU", "KF", "KB", "HB", "C"];
  const thin = keyPositions.filter(pos => (posCount[pos] || 0) < 2);
  if (thin.length) {
    tasks.push({
      id: "depth-thin", priority: "suggestion", icon: "🔍",
      title: `Thin cover at ${thin.join(", ")}`,
      detail: "One injury puts you in trouble. Target these positions in the next trade window.",
      action: () => navigate("recruit"),
    });
  }

  // — Rising talent —
  const risingStars = squad
    .filter(p => (p.age || 22) <= 22 && (p.potential || 0) - (p.overall || 70) >= 10)
    .sort((a, b) => ((b.potential || 0) - (b.overall || 70)) - ((a.potential || 0) - (a.overall || 70)))
    .slice(0, 2);
  if (risingStars.length) {
    const star = risingStars[0];
    tasks.push({
      id: "rising-talent", priority: "suggestion", icon: "⭐",
      title: `${pName(star)} has elite upside (now ${star.overall}, ceiling ${star.potential})`,
      detail: `Age ${star.age}. Boost Skills training focus and protect contract now — this is a future cornerstone.`,
      action: () => navigate("squad", "training"),
    });
  }

  // — Aging starters —
  const agingStarters = starters.filter(p => (p.age || 25) >= 32).slice(0, 2);
  if (agingStarters.length) {
    const old = agingStarters[0];
    tasks.push({
      id: "aging-core", priority: "suggestion", icon: "📅",
      title: `${pName(old)} is ${old.age} — plan for succession`,
      detail: `${old.position} · Rating ${old.overall}. Find a replacement before decline hits; ratings drop faster after 33.`,
      action: () => navigate("recruit"),
    });
  }

  // — Underutilised talent —
  const hiddenGems = bench
    .filter(p => (p.overall || 0) > avgOvrOf(starters) + 3)
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .slice(0, 1);
  if (hiddenGems.length) {
    const gem = hiddenGems[0];
    tasks.push({
      id: "hidden-gem", priority: "suggestion", icon: "💎",
      title: `${pName(gem)} (rated ${gem.overall}) is on your bench`,
      detail: `Better than your average starter (avg ${avgOvrOf(starters)}). Consider promoting them to your 23.`,
      action: () => navigate("squad", "players"),
    });
  }

  // — Individual form crisis —
  const formCrisis = starters
    .filter(p => (p.form ?? 60) < 35)
    .sort((a, b) => (a.form ?? 60) - (b.form ?? 60))
    .slice(0, 2);
  if (formCrisis.length) {
    const worst = formCrisis[0];
    tasks.push({
      id: "form-crisis", priority: "suggestion", icon: "📉",
      title: `${pName(worst)} is badly out of form (${worst.form ?? 0})`,
      detail: `${worst.position} · Rating ${worst.overall}. Drop them until form recovers, or increase recovery focus.`,
      action: () => navigate("squad", "players"),
    });
  }

  // — Squad form —
  const sqFormAvg = avgFormOf(starters);
  if (sqFormAvg < 48 && starters.length > 0) {
    tasks.push({
      id: "squad-form", priority: "suggestion", icon: "🌡️",
      title: `Starter form is below average — avg ${sqFormAvg}`,
      detail: "Cut training intensity to 45–55% and shift 10% focus to Recovery until form rebounds.",
      action: () => navigate("squad", "training"),
    });
  }

  // — Overpaid underperformer —
  const avgWage = squad.length ? squad.reduce((s, p) => s + (p.wage || 0), 0) / squad.length : 0;
  const bloatedContracts = squad
    .filter(p => (p.wage || 0) > avgWage * 2.2 && (p.overall || 70) < 72)
    .sort((a, b) => (b.wage || 0) - (a.wage || 0))
    .slice(0, 1);
  if (bloatedContracts.length) {
    const bloat = bloatedContracts[0];
    tasks.push({
      id: "bloated-wage", priority: "suggestion", icon: "💰",
      title: `${pName(bloat)} earns above their rating`,
      detail: `${Math.round((bloat.wage || 0) / 1000)}k/yr for rated ${bloat.overall}. Off-load in the next trade window to free cap space.`,
      action: () => navigate("recruit"),
    });
  }

  // — Training intensity vs phase —
  const intensity = training.intensity ?? 60;
  if (inFinals && intensity > 65) {
    tasks.push({
      id: "finals-intensity", priority: "suggestion", icon: "🏆",
      title: "Reduce training load for finals",
      detail: `${intensity}% intensity during finals week risks form drops and injury. Taper to 45–55%.`,
      action: () => navigate("squad", "training"),
    });
  }
  if (phase === "preseason" && intensity < 70) {
    tasks.push({
      id: "preseason-load", priority: "suggestion", icon: "💪",
      title: "Pre-season — load up training",
      detail: `Only ${intensity}% intensity in pre-season. Push to 75–85% while form penalties are low to bank attribute gains.`,
      action: () => navigate("squad", "training"),
    });
  }

  // — Training focus imbalance —
  const recoveryFocus = training.focus?.recovery ?? 25;
  const skillsFocus   = training.focus?.skills   ?? 25;
  if (intensity > 72 && recoveryFocus < 18) {
    tasks.push({
      id: "injury-risk-training", priority: "suggestion", icon: "🩹",
      title: `High intensity (${intensity}%) with low recovery focus (${recoveryFocus}%)`,
      detail: "Injury risk is elevated. Increase Recovery to ≥20% or lower intensity below 70%.",
      action: () => navigate("squad", "training"),
    });
  }
  if (skillsFocus < 15 && phase !== "finals") {
    tasks.push({
      id: "skills-neglect", priority: "suggestion", icon: "🎯",
      title: `Skills focus is only ${skillsFocus}%`,
      detail: "Technical attributes won't improve without skills work. Aim for ≥20% to develop players long-term.",
      action: () => navigate("squad", "training"),
    });
  }

  // — Tactic recommendation —
  const lineupOvr = avgOvrOf(starters);
  const suggestedMid = lineupOvr >= 80 ? "press" : lineupOvr >= 74 ? "balanced" : lineupOvr >= 68 ? "flood" : "defensive";
  const currentMid   = career.tacticChoice || "balanced";
  if (currentMid !== suggestedMid && starters.length >= 15) {
    const LABELS = { press: "Press", balanced: "Balanced", flood: "Flood", defensive: "Defensive" };
    tasks.push({
      id: "tactic-mid", priority: "suggestion", icon: "🧠",
      title: `Midfield tactic "${LABELS[suggestedMid]}" suits your current lineup rating (${lineupOvr})`,
      detail: `You're running "${LABELS[currentMid]}". Use Auto-suggest on the Tactics tab to apply zone recommendations in one tap.`,
      action: () => navigate("squad", "tactics"),
    });
  }

  // — Ladder / season context —
  if (myLadderPos && !inFinals) {
    const totalTeams = 12; // typical league size
    const relegZone  = tier > 1 ? 2 : null;
    const finalsZone = 8;

    if (myLadderPos === finalsZone) {
      tasks.push({
        id: "finals-edge", priority: "suggestion", icon: "🏅",
        title: `You're right on the finals line (#${myLadderPos})`,
        detail: "One win separates safety from the drop. Press tactics + full strength 23 for the next 3 rounds.",
        action: () => navigate("squad", "tactics"),
      });
    } else if (myLadderPos < finalsZone && myLadderPos >= finalsZone - 2) {
      tasks.push({
        id: "finals-push", priority: "suggestion", icon: "🚀",
        title: `Finals spot is on — you're #${myLadderPos}`,
        detail: "Protect form, renew key contracts, and avoid over-training to peak at the right time.",
        action: () => navigate("squad", "players"),
      });
    } else if (myLadderPos > finalsZone + 2) {
      tasks.push({
        id: "ladder-low", priority: "suggestion", icon: "📊",
        title: `Ladder position #${myLadderPos} — finals look unlikely`,
        detail: "Use this season to develop youth, clear aging wages, and build for next year.",
        action: () => navigate("squad", "training"),
      });
    }

    if (relegZone && myLadderPos >= totalTeams - relegZone + 1) {
      tasks.push({
        id: "relegation-risk", priority: "warning", icon: "⬇️",
        title: `Relegation risk — #${myLadderPos} in Tier ${tier}`,
        detail: "Defensive or Flood tactics recommended. Prioritise keeping your best 18 fit.",
        action: () => navigate("squad", "tactics"),
      });
    }
  }

  // — Fan happiness —
  if ((finance.fanHappiness ?? 100) < 40) {
    tasks.push({
      id: "fans-unhappy", priority: "suggestion", icon: "👎",
      title: `Fan happiness is low — ${finance.fanHappiness}%`,
      detail: "Winning and home crowd atmosphere lift this. Sponsor activations also help in Club → Finances.",
      action: () => navigate("club", "finances"),
    });
  }

  // — Transfer budget sitting idle in off-season —
  if (phase === "offseason" && (finance.transferBudget ?? 0) > 300_000) {
    tasks.push({
      id: "budget-idle", priority: "suggestion", icon: "🛒",
      title: `Transfer budget ${Math.round((finance.transferBudget ?? 0) / 1000)}k sitting unused`,
      detail: "Off-season is prime recruitment time. Sign targets before the window closes.",
      action: () => navigate("recruit"),
    });
  }

  return tasks;
}

// ── UI ─────────────────────────────────────────────────────────────────────────

const PRIORITY_META = {
  urgent:     { label: "Urgent",      color: "#E84A6F", border: "rgba(232,74,111,0.3)"  },
  warning:    { label: "Action",      color: "#E8D44A", border: "rgba(232,212,74,0.3)"  },
  suggestion: { label: "Suggestions", color: "var(--A-accent-2)", border: "color-mix(in srgb, var(--A-accent-2) 25%, transparent)"  },
};

function TaskRow({ task }) {
  return (
    <button
      type="button"
      onClick={task.action}
      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-apanel-2/70 active:bg-apanel-2 transition-colors rounded-xl min-h-[44px] group"
    >
      <span className="text-base leading-none flex-shrink-0 mt-0.5">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-atext leading-snug group-hover:text-aaccent transition-colors">
          {task.title}
        </div>
        {task.detail && (
          <div className="text-[11px] text-atext-dim mt-0.5 leading-snug line-clamp-2">{task.detail}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-atext-mute flex-shrink-0 mt-0.5 group-hover:text-aaccent transition-colors" />
    </button>
  );
}

export function TaskList({ onNavigate, myLadderPos, league }) {
  const career = useCareer();
  const [open, setOpen]     = useState(true);
  const [expanded, setExpanded] = useState({ urgent: true, warning: true, suggestion: false });

  const navigate = (screen, tab) => onNavigate?.(screen, tab);
  const tasks      = buildTasks(career, navigate, myLadderPos, league);
  const urgent     = tasks.filter(t => t.priority === "urgent");
  const warnings   = tasks.filter(t => t.priority === "warning");
  const suggestions = tasks.filter(t => t.priority === "suggestion");

  const sections = [
    { key: "urgent",     items: urgent,      meta: PRIORITY_META.urgent,     Icon: AlertTriangle },
    { key: "warning",    items: warnings,    meta: PRIORITY_META.warning,    Icon: AlertTriangle },
    { key: "suggestion", items: suggestions, meta: PRIORITY_META.suggestion, Icon: Lightbulb },
  ].filter(s => s.items.length > 0);

  const totalUrgent  = urgent.length;
  const totalWarning = warnings.length;

  if (tasks.length === 0) {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-3"
        style={{ background: "rgba(74,232,154,0.08)", border: "1px solid rgba(74,232,154,0.2)" }}
      >
        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#4AE89A" }} />
        <div>
          <div className="font-semibold text-sm" style={{ color: "#4AE89A" }}>All clear — great work</div>
          <div className="text-xs text-atext-dim mt-0.5">No urgent actions. Check back after your next match.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${css.panel} overflow-hidden`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-display text-lg tracking-wide text-atext whitespace-nowrap">ACTION BOARD</span>
          <div className="flex items-center gap-1.5">
            {totalUrgent > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                style={{ background: "#E84A6F", color: "#fff" }}>
                {totalUrgent} urgent
              </span>
            )}
            {totalWarning > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none"
                style={{ background: "rgba(232,212,74,0.2)", color: "#E8D44A", border: "1px solid rgba(232,212,74,0.4)" }}>
                {totalWarning} action
              </span>
            )}
            {suggestions.length > 0 && (
              <span className="text-[10px] font-mono text-atext-mute hidden sm:inline">
                +{suggestions.length} tip{suggestions.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-atext-mute flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-atext-mute flex-shrink-0" />}
      </button>

      {open && (
        <div className="pb-2">
          {sections.map(({ key, items, meta, Icon }) => {
            const isExpanded = expanded[key] !== false;
            return (
              <div key={key} className="mb-1">
                {/* Section header — collapsible */}
                <button
                  type="button"
                  onClick={() => setExpanded(e => ({ ...e, [key]: !isExpanded }))}
                  className="w-full flex items-center gap-2 px-5 py-1.5 hover:bg-apanel-2/40 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: meta.color }} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] font-mono text-atext-mute">({items.length})</span>
                  <div className="flex-1 h-px mx-1" style={{ background: meta.border }} />
                  {isExpanded
                    ? <ChevronUp className="w-3 h-3 text-atext-mute" />
                    : <ChevronDown className="w-3 h-3 text-atext-mute" />}
                </button>

                {isExpanded && (
                  <div className="px-1">
                    {items.map(task => <TaskRow key={task.id} task={task} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
