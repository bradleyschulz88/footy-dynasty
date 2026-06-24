// ---------------------------------------------------------------------------
// Post-Match Summary overlay (Spec Section 3E)
// Renders on top of MatchDayScreen after the score is revealed.
// CONTINUE → clears the match-day state and advances to the main app.
// "Show full report" toggle → expands detailed breakdown inline.
// ---------------------------------------------------------------------------
import React, { useState, useEffect, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { Award, Trophy, Newspaper, Users, ChevronRight, ChevronDown, ChevronUp, Banknote, Tv, Handshake, Ticket, BarChart2 } from "lucide-react";

import { collectFocusables } from "../lib/hotkeysHelpers.js";
import { fmtK } from "../lib/format.js";
import { gameToast } from "../lib/toast.js";

export default function PostMatchSummary({ summary, onContinue, leagueTier }) {
  const isTier4 = leagueTier === 4;
  const panelRef = useRef(null);
  const primaryRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'stats'

  const playerStatRows = Object.values(summary?.playerStats || {})
    .sort((a, b) => b.disposals - a.disposals);

  const handleContinue = useCallback(() => {
    onContinue?.();
  }, [onContinue]);

  useEffect(() => {
    if (!summary) return;
    if (summary.result === "WIN") {
      gameToast.win(`Victory by ${summary.margin} pts`);
      // Modest single burst on a win — celebratory but smaller than a premiership.
      confetti({ particleCount: 80, spread: 65, startVelocity: 45, origin: { x: 0.5, y: 0.65 } });
    } else if (summary.result === "LOSS") {
      gameToast.loss(`Defeated by ${summary.margin} pts`);
    } else {
      gameToast.info("Draw");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!summary) return undefined;
    const prev = document.activeElement;
    const id = requestAnimationFrame(() => primaryRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [summary]);

  useEffect(() => {
    if (!summary) return undefined;
    const onKeyDown = (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        handleContinue();
        return;
      }
      if (ev.key === "Escape") {
        ev.preventDefault();
        handleContinue();
        return;
      }
      if (ev.key === "Tab" && panelRef.current) {
        const nodes = collectFocusables(panelRef.current);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [summary, handleContinue]);

  if (!summary) return null;

  const titleId = "post-match-summary-title";

  // Result-based tint colour for banner background
  const resultBgTint =
    summary.result === "WIN"
      ? "color-mix(in srgb, var(--A-pos) 8%, var(--A-panel))"
      : summary.result === "LOSS"
        ? "color-mix(in srgb, var(--A-neg) 8%, var(--A-panel))"
        : "var(--A-panel)";

  const resultBorderColor =
    summary.result === "WIN"
      ? "color-mix(in srgb, var(--A-pos) 35%, var(--A-line-2))"
      : summary.result === "LOSS"
        ? "color-mix(in srgb, var(--A-neg) 35%, var(--A-line-2))"
        : "var(--A-line-2)";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
      style={{ background: "rgba(7, 16, 31, 0.92)", backdropFilter: "blur(8px)" }}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-w-3xl w-full anim-in outline-none overflow-hidden"
        style={{
          background: "var(--A-panel)",
          border: `1px solid ${resultBorderColor}`,
          borderRadius: 18,
          boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px ${summary.resultColor}22`,
        }}
        tabIndex={-1}
      >
        {/* Result banner — emotionally prominent top section */}
        <div
          className="px-6 py-5 flex items-center justify-between gap-4"
          style={{
            background: resultBgTint,
            borderBottom: `2px solid ${summary.resultColor}55`,
          }}
        >
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-aaccent mb-1">{summary.label} · Full Time</div>
            <div
              id={titleId}
              className="font-display leading-none"
              style={{
                fontSize: "clamp(2.5rem, 8vw, 4rem)",
                color: summary.resultColor,
                filter: `drop-shadow(0 0 18px color-mix(in srgb, ${summary.resultColor} 55%, transparent))`,
                letterSpacing: "0.04em",
              }}
            >
              {summary.result}
            </div>
            {summary.result !== "DRAW" && (
              <div className="text-[11px] font-mono text-atext-dim mt-1 uppercase tracking-widest">
                {summary.result === "WIN" ? `Won by` : `Lost by`}{" "}
                <span className="font-bold" style={{ color: summary.resultColor }}>
                  {summary.margin} {summary.margin === 1 ? "point" : "points"}
                </span>
              </div>
            )}
            {summary.result === "DRAW" && (
              <div className="text-[11px] font-mono text-atext-dim mt-1 uppercase tracking-widest">Match drawn</div>
            )}
          </div>
          <div
            className="text-right shrink-0 hidden sm:block"
            style={{
              borderLeft: "1px solid var(--A-line)",
              paddingLeft: "1.25rem",
            }}
          >
            <div className="text-[9px] font-mono uppercase tracking-widest text-atext-mute mb-1">Attendance</div>
            <div className="font-display text-xl text-atext tabular-nums">{summary.crowd.toLocaleString()}</div>
          </div>
        </div>

        {/* Scoreboard — visual hero */}
        <div className="px-6 py-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4" style={{ borderBottom: "1px solid var(--A-line)" }}>
          {/* My team */}
          <div className="text-center">
            <div
              className="w-18 h-18 mx-auto rounded-2xl flex items-center justify-center font-display text-2xl mb-2 shadow-lg"
              style={{
                width: 72,
                height: 72,
                background: `linear-gradient(135deg, ${summary.myColor}, ${summary.myColor}bb)`,
                color: "#fff",
                boxShadow: `0 4px 20px ${summary.myColor}44`,
              }}
            >
              {summary.myShortName}
            </div>
            <div
              className="font-display tabular-nums leading-none"
              style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", color: summary.result === "WIN" ? "var(--A-pos)" : "var(--A-text)" }}
            >
              {summary.myScore}
            </div>
          </div>

          {/* VS separator */}
          <div className="text-center px-2">
            <div className="font-mono text-[11px] uppercase tracking-widest text-atext-mute">vs</div>
          </div>

          {/* Opponent */}
          <div className="text-center">
            <div
              className="w-18 h-18 mx-auto rounded-2xl flex items-center justify-center font-display text-2xl mb-2 shadow-lg"
              style={{
                width: 72,
                height: 72,
                background: `linear-gradient(135deg, ${summary.oppColor}, ${summary.oppColor}bb)`,
                color: "#fff",
                boxShadow: `0 4px 20px ${summary.oppColor}44`,
              }}
            >
              {summary.oppShortName}
            </div>
            <div
              className="font-display tabular-nums leading-none"
              style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", color: summary.result === "LOSS" ? "var(--A-neg)" : "var(--A-text)" }}
            >
              {summary.oppScore}
            </div>
          </div>
        </div>

        {/* Match-day income — always visible */}
        {summary.revenue && (
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--A-line)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-apos" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute">Match-day income</span>
              </div>
              <span className="font-display text-2xl text-apos tabular-nums">+{fmtK(summary.revenue.total)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <RevenueChip icon={Ticket} label="Gate" value={summary.revenue.gate} color="var(--A-accent)" dim={!summary.isHome} dimLabel="Away" />
              <RevenueChip icon={Tv} label="TV rights" value={summary.revenue.broadcast} color="#A78BFA" />
              <RevenueChip icon={Handshake} label="Sponsors" value={summary.revenue.sponsor} color="var(--A-accent)" />
            </div>
          </div>
        )}

        {/* Board reaction — always visible */}
        <div className="px-6 py-3 flex items-start gap-3" style={{ borderBottom: "1px solid var(--A-line)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
          >
            {summary.boardReaction.emoji || <Users className="w-4 h-4 text-atext-dim" />}
          </div>
          <div className="flex-1 text-sm leading-snug">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute mr-2">{isTier4 ? "Committee" : "Board"}</span>
            <span className="text-atext">{summary.boardReaction.text}</span>
          </div>
        </div>

        {/* Tab bar — Summary / Stats */}
        {playerStatRows.length > 0 && (
          <div className="flex border-b" style={{ borderColor: "var(--A-line)" }}>
            {[{ id: 'summary', label: 'Match Report' }, { id: 'stats', label: 'Player Stats', icon: BarChart2 }].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-mono font-bold uppercase tracking-widest transition-colors"
                style={{
                  color: activeTab === tab.id ? 'var(--A-accent)' : 'var(--A-text-mute)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--A-accent)' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab.icon && <tab.icon className="w-3 h-3" />}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Player Stats tab */}
        {activeTab === 'stats' && playerStatRows.length > 0 && (
          <div style={{ borderBottom: "1px solid var(--A-line)" }}>
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest text-atext-mute pb-1 mb-1" style={{ borderBottom: "1px solid var(--A-line)" }}>
                <span className="w-7 text-center">POS</span>
                <span className="flex-1">Player</span>
                <span className="w-7 text-center">D</span>
                <span className="w-7 text-center">M</span>
                <span className="w-7 text-center">T</span>
                <span className="w-7 text-center">G</span>
              </div>
              <div className="space-y-0.5 max-h-52 overflow-y-auto">
                {playerStatRows.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs" style={{ borderBottom: "1px solid var(--A-line)", opacity: 0.9 }}>
                    <span className="w-7 text-center text-[10px] font-mono font-bold" style={{ color: 'var(--A-text-mute)' }}>{p.position}</span>
                    <span className="flex-1 font-medium text-atext truncate">{p.name}</span>
                    <span className="w-7 text-center font-mono tabular-nums text-atext">{p.disposals}</span>
                    <span className="w-7 text-center font-mono tabular-nums text-atext-dim">{p.marks}</span>
                    <span className="w-7 text-center font-mono tabular-nums text-atext-dim">{p.tackles}</span>
                    <span className="w-7 text-center font-mono tabular-nums font-bold" style={{ color: p.goals > 0 ? 'var(--A-accent-2)' : 'var(--A-text-mute)' }}>
                      {p.goals > 0 ? p.goals : '·'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-atext-mute font-mono pt-2 pb-1 text-center">D = disposals · M = marks · T = tackles · G = goals</div>
            </div>
          </div>
        )}

        {/* Toggleable full report (only shown on Summary tab) */}
        {activeTab === 'summary' && <div style={{ borderBottom: "1px solid var(--A-line)" }}>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="w-full px-6 py-2.5 flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-widest text-atext-dim hover:text-atext transition-colors"
          >
            <span>Full Match Report</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDetails && (
            <div className="px-6 pb-5 space-y-4">
              {/* Best on ground — featured hero card */}
              {summary.bog && (
                <div
                  className="rounded-2xl p-4 flex items-center gap-4"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, #FFD200 12%, var(--A-panel-2)), var(--A-panel-2))",
                    border: "1px solid color-mix(in srgb, #FFD200 35%, var(--A-line))",
                    boxShadow: "0 2px 12px color-mix(in srgb, #FFD200 10%, transparent)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "color-mix(in srgb, #FFD200 20%, transparent)", color: "#FFD200" }}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-atext-mute mb-0.5">Player of the Match</div>
                    <div className="font-display text-xl leading-tight" style={{ color: "#FFD200" }}>
                      {summary.bog.firstName} {summary.bog.lastName}
                    </div>
                    <div className="text-[11px] text-atext-dim mt-0.5">
                      {summary.bog.position} · OVR {summary.bog.overall}
                    </div>
                  </div>
                  <div
                    className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg uppercase tracking-widest"
                    style={{ background: "color-mix(in srgb, #FFD200 18%, transparent)", color: "#FFD200", border: "1px solid color-mix(in srgb, #FFD200 30%, transparent)" }}
                  >
                    BOG
                  </div>
                </div>
              )}

              {/* Top scorer + press/committee in a compact grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                <SummaryCard icon={Trophy} label="Top Scorer" accent="var(--A-accent)">
                  {summary.topScorer ? (
                    <div>
                      <div className="font-bold text-atext leading-tight">
                        {summary.topScorer.firstName} {summary.topScorer.lastName}
                      </div>
                      <div className="text-[11px] text-atext-dim">
                        {summary.topGoals} goal{summary.topGoals === 1 ? "" : "s"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-atext-dim text-sm">No goalkickers from your squad</div>
                  )}
                </SummaryCard>
                {!summary.bog && (
                  <SummaryCard icon={Award} label="Best on Ground" accent="#FFD200">
                    <div className="text-atext-dim text-sm">—</div>
                  </SummaryCard>
                )}
              </div>

              {/* Press + Committee */}
              <div className="space-y-2">
                <ReactionRow icon={Newspaper} label="Press">
                  {summary.journalistLine}
                </ReactionRow>
                {summary.committeeReaction && (
                  <ReactionRow icon={Users} label="Committee">
                    {summary.committeeReaction}
                  </ReactionRow>
                )}
              </div>
            </div>
          )}
        </div>}

        {/* Actions — Continue button */}
        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-[10px] text-atext-mute font-mono uppercase tracking-wider hidden sm:block">
            Enter · Esc · continue
          </p>
          <button
            ref={primaryRef}
            type="button"
            onClick={handleContinue}
            className="flex items-center gap-2 justify-center font-display text-base tracking-widest px-8 py-3 rounded-xl transition-all"
            style={{
              background: "linear-gradient(135deg, var(--A-accent), var(--A-accent-2))",
              color: "var(--fd-on-accent, #fff)",
              boxShadow: "0 4px 16px color-mix(in srgb, var(--A-accent) 35%, transparent)",
            }}
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RevenueChip({ icon: Icon, label, value, color, dim, dimLabel }) {
  return (
    <div
      className="rounded-xl px-3 py-2 flex items-center gap-2"
      style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)", opacity: dim ? 0.5 : 1 }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <div className="min-w-0">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-atext-mute leading-none">{label}</div>
        <div className="font-display text-base tabular-nums leading-tight" style={{ color: dim ? "var(--A-text-mute)" : "var(--A-text)" }}>
          {dim ? (dimLabel || "—") : fmtK(value)}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, accent, children }) {
  return (
    <div className="rounded-xl p-3 flex items-start gap-3" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15`, color: accent }}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute mb-1">{label}</div>
        {children}
      </div>
    </div>
  );
}

function ReactionRow({ icon: Icon, label, tone, children }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
      >
        {tone || <Icon className="w-4 h-4 text-atext-dim" />}
      </div>
      <div className="flex-1 text-sm leading-snug">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-atext-mute mr-2">{label}</span>
        <span className="text-atext">{children}</span>
      </div>
    </div>
  );
}
