import React from "react";
import { motion } from "motion/react";
import { Play, Bell } from "lucide-react";
import { getAdvanceContext, advanceTimeFingerprint } from "../../lib/advanceContext.js";
import { TRAINING_INFO, formatDate } from "../../lib/calendar.js";
import { finalsRoundLabel, playerFinalsOpponent } from "../../lib/finalsBracket.js";
import { findClub } from "../../data/pyramid.js";
import { fmtK } from "../../lib/format.js";
import SeasonStrip from "../SeasonStrip.jsx";
import { NotificationBell } from "./NotificationBell.jsx";
import { useStatTrend, trendGlyph, trendColor } from "./useStatTrend.js";
import { useCareer } from "../../lib/careerStore.js";

const tickEase = [0.22, 1, 0.36, 1];
// Theme-driven accent (resolves to the active theme's --A-accent — teal in
// the light "Daylight" theme). Text colour to sit on top of the accent fill.
const ACCENT = "var(--A-accent)";
const ACCENT_ON = "var(--fd-on-accent)";

// Health colours for the board/fan bars — readable on both light and dark.
const HEALTH_GOOD = "var(--A-pos)";
const HEALTH_WARN = "#d97706";
const HEALTH_BAD = "var(--A-neg)";

function barStatPct(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Returns a gradient stop pair based on value threshold for bar fills.
 *  `semantic` bars (board/fans) shift green → amber → red with health;
 *  non-semantic bars (cash/budget) keep their own accent colour. */
function barGradient(value, color, semantic) {
  if (semantic) {
    const c = value >= 60 ? HEALTH_GOOD : value >= 30 ? HEALTH_WARN : HEALTH_BAD;
    return `linear-gradient(90deg, color-mix(in srgb, ${c} 35%, transparent), color-mix(in srgb, ${c} 80%, transparent), ${c})`;
  }
  return `linear-gradient(90deg, color-mix(in srgb, ${color} 35%, transparent), color-mix(in srgb, ${color} 80%, transparent), ${color})`;
}

/** Returns glow/text colour for active bar */
function barGlowColor(value, color, semantic) {
  if (semantic) {
    if (value >= 60) return HEALTH_GOOD;
    if (value >= 30) return HEALTH_WARN;
    return HEALTH_BAD;
  }
  return color;
}

export function TopBar({
  club,
  league,
  myLadderPos: _myLadderPos,
  onAdvance,
  advanceDisabled,
  advanceDisabledReason,
  advanceAgendaCount = 0,
  tutorialSpotlightAdvance,
  onNotificationAction,
  notifOpen,
  onNotifOpenChange,
  onBlockedAdvance,
}) {
  const career = useCareer();
  const ctx = getAdvanceContext(career, league);
  const timeTick = advanceTimeFingerprint(career);
  const boardTrend = useStatTrend(barStatPct(career.finance.boardConfidence), timeTick);
  const fansTrend = useStatTrend(barStatPct(career.finance.fanHappiness), timeTick);
  const blockedToBell = advanceDisabled && !!onBlockedAdvance;
  const nextEv = (career.eventQueue || []).find(e => !e.completed);
  const phaseColors = { preseason: "var(--A-accent)", season: "var(--A-accent-2)", finals: "var(--A-neg)", offseason: "#7c3aed" };
  const phaseLabel = { preseason: "PRE-SEASON", season: "SEASON", finals: "FINALS", offseason: "OFF-SEASON" };
  const phase = career.inFinals ? "finals" : (career.phase || "preseason");

  let nextLabel = "End of Season";
  let nextIcon = null;
  if (career.inFinals) {
    const alive = career.finalsAlive || [];
    const oppId = playerFinalsOpponent(career);
    const opp = oppId ? findClub(oppId) : null;
    const roundName = finalsRoundLabel(alive.length, league?.tier ?? 1);
    nextLabel = opp ? `${roundName}: vs ${opp.short}` : roundName;
    nextIcon = "🏆";
  } else if (nextEv) {
    if (nextEv.type === "training") {
      const info = TRAINING_INFO[nextEv.subtype] || {};
      nextLabel = info.name || "Training";
      nextIcon = info.icon || "🏋️";
    } else if (nextEv.type === "key_event") {
      nextLabel = nextEv.name;
      nextIcon = "📅";
    } else if (nextEv.type === "preseason_match") {
      nextLabel = nextEv.label;
      nextIcon = "🏉";
    } else if (nextEv.type === "round") {
      const myMatch = (nextEv.matches || []).find(m => m.home === career.clubId || m.away === career.clubId);
      if (myMatch) {
        const isHome = myMatch.home === career.clubId;
        const opp = findClub(isHome ? myMatch.away : myMatch.home);
        nextLabel = `Rd ${nextEv.round}: ${isHome ? "vs" : "@"} ${opp?.short || ""}`;
        nextIcon = "🏉";
      } else {
        nextLabel = `Round ${nextEv.round}`;
        nextIcon = "🏉";
      }
    }
  }

  const showRichNext = ctx.mode === "calendar" && nextEv;
  const headerNextLabel = showRichNext
    ? `${nextIcon ? nextIcon + " " : ""}${nextLabel}`
    : `${ctx.nextEventShort}${ctx.mode === "finals" ? " 🏆" : ""}`;

  const board = barStatPct(career.finance.boardConfidence);
  const fans = barStatPct(career.finance.fanHappiness);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "color-mix(in srgb, var(--A-panel) 88%, transparent)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--A-line)",
        boxShadow: "0 1px 2px rgba(12, 28, 52, 0.04)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      {/* Club-coloured identity strip — brands the whole in-game shell with the
          player's club (driven by runtime-injected --fd-club-* tokens). */}
      <div className="fd-club-strip" aria-hidden="true" />

      {/* Accent progress flash on advance */}
      <motion.div
        key={timeTick}
        className="h-0.5 origin-left"
        style={{ background: `linear-gradient(90deg, ${ACCENT}, color-mix(in srgb, ${ACCENT} 30%, transparent), transparent)` }}
        initial={{ scaleX: 0, opacity: 1 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.55, ease: tickEase }}
      />

      <div className="px-3 md:px-6 py-0">
        <div className="flex items-center justify-between gap-2 max-w-[1400px] mx-auto h-16">

          {/* Left: date + phase + finance stats */}
          <div className="flex items-center gap-0 min-w-0 overflow-hidden">
            {/* Date + phase block */}
            <div
              className="pr-3 mr-3 flex-shrink-0"
              style={{ borderRight: "1px solid var(--A-line)" }}
            >
              <motion.div
                key={timeTick}
                initial={{ opacity: 0.35, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: tickEase }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: phaseColors[phase],
                  }}
                >
                  {phaseLabel[phase]}
                </div>
                <div
                  style={{
                    fontFamily: "'Bebas Neue', Oswald, sans-serif",
                    fontSize: 18,
                    lineHeight: 1.1,
                    color: "var(--A-text)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {career.currentDate ? formatDate(career.currentDate) : "—"}
                </div>
              </motion.div>
            </div>

            {/* Finance stats */}
            {[
              { label: "Cash",   value: fmtK(career.finance.cash),           color: "var(--A-pos)",      hideBelow: "sm" },
              { label: "Budget", value: fmtK(career.finance.transferBudget), color: "var(--A-accent)",   hideBelow: "lg" },
              { label: "Board",  value: board,  color: "var(--A-accent-2)", bar: true, semantic: true, hideBelow: "md", trend: boardTrend },
              { label: "Fans",   value: fans,   color: "#7c3aed",           bar: true, semantic: true, hideBelow: "lg", trend: fansTrend },
            ].map(({ label, value, color, bar, semantic, hideBelow, trend }) => {
              const cls =
                hideBelow === "lg" ? "hidden lg:flex" :
                hideBelow === "md" ? "hidden md:flex" :
                hideBelow === "sm" ? "hidden sm:flex" : "flex";
              const glowColor = bar ? barGlowColor(value, color, semantic) : color;
              return (
                <motion.div
                  key={`${timeTick}-${label}`}
                  className={`${cls} items-center px-3 md:px-4 h-full flex-shrink-0`}
                  style={{ borderRight: "1px solid var(--A-line)" }}
                  initial={{ opacity: 0.45, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: tickEase }}
                >
                  <div>
                    {/* Label */}
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.18em",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "var(--A-text-mute)",
                        marginBottom: 1,
                      }}
                    >
                      {label}
                    </div>
                    {bar ? (
                      /* Bar stat: number + bar stacked tightly */
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontVariantNumeric: "tabular-nums",
                              fontSize: 15,
                              fontWeight: 700,
                              lineHeight: 1,
                              color: glowColor,
                              letterSpacing: "0.03em",
                            }}
                          >
                            {value}
                          </span>
                          {trend ? (
                            <span style={{ fontSize: 10, color: trendColor(trend), lineHeight: 1 }}>{trendGlyph(trend)}</span>
                          ) : null}
                        </div>
                        {/* Gradient bar with glow */}
                        <div
                          style={{
                            width: 52,
                            height: 4,
                            borderRadius: 9999,
                            background: "var(--A-bg-2)",
                            border: "1px solid var(--A-line)",
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${value}%`,
                              borderRadius: 9999,
                              background: barGradient(value, color, semantic),
                              boxShadow: `0 0 6px color-mix(in srgb, ${glowColor} 55%, transparent)`,
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Cash / Budget: monospace tabular number, slightly larger */
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontVariantNumeric: "tabular-nums",
                          fontSize: 17,
                          fontWeight: 700,
                          lineHeight: 1.05,
                          color,
                          letterSpacing: "0.02em",
                        }}
                      >
                        {value}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right: notifications + next event label + advance button */}
          <div
            className="flex items-center gap-2 md:gap-3 flex-shrink-0"
            style={{
              paddingLeft: 12,
              borderLeft: "1px solid var(--A-line)",
            }}
          >
            <NotificationBell onAction={onNotificationAction} open={notifOpen} onOpenChange={onNotifOpenChange} />

            <div className="text-right hidden lg:block max-w-[min(280px,40vw)] overflow-hidden">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--A-text-mute)",
                }}
              >
                Next
              </div>
              <motion.div
                key={`${timeTick}-${headerNextLabel}`}
                initial={{ opacity: 0.25, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.26, ease: tickEase }}
                className="text-sm font-semibold truncate"
                style={{ color: "var(--A-text-dim)" }}
                title={ctx.detail}
              >
                {headerNextLabel}
              </motion.div>
            </div>

            <motion.button
              type="button"
              onClick={blockedToBell ? onBlockedAdvance : onAdvance}
              disabled={advanceDisabled && !blockedToBell}
              title={advanceDisabled ? (advanceDisabledReason ?? "Finish tutorial step before advancing.") : undefined}
              whileTap={advanceDisabled && !blockedToBell ? undefined : { scale: 0.94 }}
              transition={{ type: "spring", stiffness: 520, damping: 28 }}
              className={`hidden md:flex items-center gap-2 ${tutorialSpotlightAdvance ? "animate-pulse" : ""}`}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                cursor: advanceDisabled && !blockedToBell ? "not-allowed" : "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                background: blockedToBell
                  ? "color-mix(in srgb, var(--A-neg) 15%, transparent)"
                  : advanceDisabled
                  ? "var(--A-bg-2)"
                  : ACCENT,
                color: blockedToBell
                  ? "var(--A-neg)"
                  : advanceDisabled
                  ? "var(--A-text-mute)"
                  : ACCENT_ON,
                border: blockedToBell
                  ? "1px solid color-mix(in srgb, var(--A-neg) 40%, transparent)"
                  : advanceDisabled
                  ? "1px solid var(--A-line-2)"
                  : "none",
                boxShadow: blockedToBell
                  ? "none"
                  : advanceDisabled
                  ? "none"
                  : `0 4px 20px color-mix(in srgb, var(--A-accent) 35%, transparent)`,
                opacity: advanceDisabled && !blockedToBell ? 0.5 : 1,
                outline: tutorialSpotlightAdvance ? `2px solid ${ACCENT}` : "none",
                outlineOffset: 2,
                marginLeft: 4,
              }}
            >
              {blockedToBell ? <Bell size={14} /> : <Play size={14} fill="currentColor" />}
              {blockedToBell ? "DECISION ▸" : ctx.buttonLabel.toUpperCase()}
              {!advanceDisabled && advanceAgendaCount > 0 && (
                <span
                  className="flex items-center justify-center"
                  style={{
                    minWidth: 18, height: 18,
                    padding: "0 4px",
                    borderRadius: 9999,
                    background: "color-mix(in srgb, var(--A-neg) 22%, transparent)",
                    color: "var(--A-neg)",
                    border: "1px solid color-mix(in srgb, var(--A-neg) 40%, transparent)",
                    fontSize: 9,
                    fontWeight: 700,
                    marginLeft: 2,
                  }}
                >
                  {advanceAgendaCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
      <SeasonStrip league={league} club={club} timeTick={timeTick} />
    </header>
  );
}
