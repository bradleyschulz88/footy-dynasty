// ---------------------------------------------------------------------------
// TaskList — actionable agenda + contextual coaching suggestions.
// Each task has a navigateTo callback so clicking takes you straight to the
// right screen/tab to fix the issue.
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";
import { css } from "./primitives.jsx";
import { lineupPlayerCount, lineupHasPlayer } from "../lib/lineupHelpers.js";
import { LINEUP_CAP } from "../lib/lineupHelpers.js";

// ── Task builder ──────────────────────────────────────────────────────────────

export function buildTasks(career, navigate) {
  const tasks = [];
  const squad   = career.squad   || [];
  const lineup  = career.lineup  || [];
  const staff   = career.staff   || [];

  // --- URGENT (blocking or near-blocking) ---

  const lineupCount = lineupPlayerCount(lineup);
  if (lineupCount < LINEUP_CAP) {
    tasks.push({
      id: "lineup-fill",
      priority: "urgent",
      icon: "🏉",
      title: `Fill your match-day 23 (${lineupCount}/${LINEUP_CAP})`,
      detail: "You need a full 23 to field the best possible side.",
      action: () => navigate("squad", "players"),
    });
  }

  const injuredInLineup = squad.filter(p => (p.injured || 0) > 0 && lineupHasPlayer(lineup, p.id));
  if (injuredInLineup.length) {
    tasks.push({
      id: "injured-lineup",
      priority: "urgent",
      icon: "🤕",
      title: `${injuredInLineup.length} injured player${injuredInLineup.length > 1 ? "s" : ""} in your 23`,
      detail: injuredInLineup.map(p => `${p.firstName ?? ""} ${p.lastName ?? p.name ?? ""} (${p.injured}w)`).join(", "),
      action: () => navigate("squad", "players"),
    });
  }

  if ((career.finance?.boardConfidence ?? 100) < 35) {
    tasks.push({
      id: "board-pressure",
      priority: "urgent",
      icon: "⚠️",
      title: `Board confidence critical — ${career.finance.boardConfidence}%`,
      detail: "Win your next match or face a vote of confidence.",
      action: () => navigate("club", "overview"),
    });
  }

  // --- WARNINGS ---

  const expiringInLineup = squad.filter(
    p => lineupHasPlayer(lineup, p.id) && (p.contract ?? 2) <= 1
  );
  if (expiringInLineup.length) {
    tasks.push({
      id: "contracts",
      priority: "warning",
      icon: "📋",
      title: `${expiringInLineup.length} contract${expiringInLineup.length > 1 ? "s" : ""} expiring in your 23`,
      detail: expiringInLineup.map(p => `${p.firstName ?? ""} ${p.lastName ?? p.name ?? ""}`).join(", "),
      action: () => navigate("squad", "renewals"),
    });
  }

  const noTacticsSet = !career.defenceTactic && !career.forwardTactic && career.tacticChoice === "balanced";
  if (noTacticsSet) {
    tasks.push({
      id: "tactics",
      priority: "warning",
      icon: "🎯",
      title: "Zone tactics not customised",
      detail: "Defence, midfield and forward tactics are all on default. Tailor them to your squad.",
      action: () => navigate("squad", "tactics"),
    });
  }

  if (!career.staffTasks?.trainingLeadId && staff.length > 0) {
    tasks.push({
      id: "training-staff",
      priority: "warning",
      icon: "🏋️",
      title: "No training lead assigned",
      detail: "Auto-assign your best coach to maximise training gains.",
      action: () => navigate("squad", "training"),
    });
  }

  if ((career.finance?.cash ?? 999999) < 50000) {
    tasks.push({
      id: "cash",
      priority: "warning",
      icon: "💰",
      title: "Cash running low",
      detail: `Only ${(career.finance.cash / 1000).toFixed(0)}k remaining. Review finances.`,
      action: () => navigate("club", "finances"),
    });
  }

  // --- SUGGESTIONS ---

  const positionCounts = squad.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] || 0) + 1;
    return acc;
  }, {});

  const thinPositions = ["RU", "KF", "KB"].filter(pos => (positionCounts[pos] || 0) < 2);
  if (thinPositions.length) {
    tasks.push({
      id: "squad-depth",
      priority: "suggestion",
      icon: "💡",
      title: `Thin depth at ${thinPositions.join(", ")}`,
      detail: "Consider recruiting cover before the transfer window closes.",
      action: () => navigate("recruit"),
    });
  }

  const avgForm = squad.length
    ? Math.round(squad.reduce((s, p) => s + (p.form ?? 60), 0) / squad.length)
    : 60;
  if (avgForm < 50) {
    tasks.push({
      id: "form",
      priority: "suggestion",
      icon: "📉",
      title: `Squad form is low (avg ${avgForm})`,
      detail: "Reduce training intensity and increase recovery focus.",
      action: () => navigate("squad", "training"),
    });
  }

  const avgOvr = squad.length
    ? Math.round(squad.reduce((s, p) => s + (p.overall ?? 70), 0) / squad.length)
    : 70;
  const tacticsForOvr = avgOvr >= 78 ? "press" : avgOvr >= 72 ? "balanced" : "defensive";
  const currentMid = career.tacticChoice || "balanced";
  if (currentMid !== tacticsForOvr) {
    tasks.push({
      id: "tactic-tip",
      priority: "suggestion",
      icon: "🧠",
      title: `Suggested midfield tactic: ${tacticsForOvr}`,
      detail: `Based on your squad average (${avgOvr} OVR). Use Auto-suggest on Tactics tab.`,
      action: () => navigate("squad", "tactics"),
    });
  }

  return tasks;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PRIORITY_META = {
  urgent:     { label: "Urgent",      color: "#E84A6F", bg: "rgba(232,74,111,0.1)",  border: "rgba(232,74,111,0.3)"  },
  warning:    { label: "Action",      color: "#E8D44A", bg: "rgba(232,212,74,0.1)",  border: "rgba(232,212,74,0.3)"  },
  suggestion: { label: "Suggestions", color: "#4ADBE8", bg: "rgba(0,224,255,0.08)", border: "rgba(0,224,255,0.25)"  },
};

function TaskRow({ task }) {
  return (
    <button
      type="button"
      onClick={task.action}
      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-apanel-2/60 transition-colors rounded-xl min-h-[44px]"
    >
      <span className="text-base flex-shrink-0 mt-0.5">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-atext leading-snug">{task.title}</div>
        {task.detail && (
          <div className="text-[11px] text-atext-dim mt-0.5 leading-snug truncate">{task.detail}</div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-atext-mute flex-shrink-0 mt-0.5" />
    </button>
  );
}

export function TaskList({ career, onNavigate }) {
  const [open, setOpen] = useState(true);

  const navigate = (screen, tab) => {
    onNavigate?.(screen, tab);
  };

  const tasks = buildTasks(career, navigate);
  const urgent     = tasks.filter(t => t.priority === "urgent");
  const warnings   = tasks.filter(t => t.priority === "warning");
  const suggestions = tasks.filter(t => t.priority === "suggestion");

  if (tasks.length === 0) {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-3"
        style={{ background: "rgba(74,232,154,0.08)", border: "1px solid rgba(74,232,154,0.2)" }}
      >
        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#4AE89A" }} />
        <div>
          <div className="font-semibold text-sm" style={{ color: "#4AE89A" }}>All clear</div>
          <div className="text-xs text-atext-dim">No urgent actions — keep up the good work.</div>
        </div>
      </div>
    );
  }

  const sections = [
    { key: "urgent",     items: urgent,     meta: PRIORITY_META.urgent,     Icon: AlertTriangle },
    { key: "warning",    items: warnings,   meta: PRIORITY_META.warning,    Icon: AlertTriangle },
    { key: "suggestion", items: suggestions, meta: PRIORITY_META.suggestion, Icon: Lightbulb },
  ].filter(s => s.items.length > 0);

  const totalUrgent = urgent.length;

  return (
    <div className={`${css.panel} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg tracking-wide text-atext">ACTION BOARD</span>
            {totalUrgent > 0 && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: "#E84A6F", color: "#fff" }}
              >
                {totalUrgent}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-atext-mute">{tasks.length} items</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-atext-mute" /> : <ChevronDown className="w-4 h-4 text-atext-mute" />}
      </button>

      {open && (
        <div className="pb-2 space-y-1">
          {sections.map(({ key, items, meta, Icon }) => (
            <div key={key}>
              <div className="flex items-center gap-2 px-5 py-1.5">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: meta.color }} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: meta.color }}>
                  {meta.label}
                </span>
                <div className="flex-1 h-px" style={{ background: meta.border }} />
              </div>
              <div className="px-1">
                {items.map(task => <TaskRow key={task.id} task={task} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
