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

const tickEase = [0.22, 1, 0.36, 1];
const LIME = "#C8FF3D";
const LIME_ON = "#0A0D0C";

function barStatPct(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function TopBar({
  career,
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
  const ctx = getAdvanceContext(career, league);
  const timeTick = advanceTimeFingerprint(career);
  const boardTrend = useStatTrend(barStatPct(career.finance.boardConfidence), timeTick);
  const fansTrend = useStatTrend(barStatPct(career.finance.fanHappiness), timeTick);
  const blockedToBell = advanceDisabled && !!onBlockedAdvance;
  const nextEv = (career.eventQueue || []).find(e => !e.completed);
  const phaseColors = { preseason: LIME, season: "#86CEFF", finals: "#FF5A7C", offseason: "#A78BFA" };
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
      nextIcon = "⚽";
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
        background: "rgba(13, 17, 16, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(200,255,61,0.15)",
        boxShadow: "0 1px 0 rgba(200,255,61,0.06)",
      }}
    >
      {/* Lime progress flash on advance */}
      <motion.div
        key={timeTick}
        className="h-0.5 origin-left"
        style={{ background: `linear-gradient(90deg, ${LIME}, rgba(200,255,61,0.3), transparent)` }}
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
              style={{ borderRight: "1px solid rgba(255,255,255,0.08)" }}
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
                    color: "#F7FAF8",
                    letterSpacing: "0.03em",
                  }}
                >
                  {career.currentDate ? formatDate(career.currentDate) : "—"}
                </div>
              </motion.div>
            </div>

            {/* Finance stats */}
            {[
              { label: "Cash",   value: fmtK(career.finance.cash),           color: "#5EFFA8",  hideBelow: "sm" },
              { label: "Budget", value: fmtK(career.finance.transferBudget), color: LIME,       hideBelow: "lg" },
              { label: "Board",  value: board,  color: "#86CEFF", bar: true, hideBelow: "md", trend: boardTrend },
              { label: "Fans",   value: fans,   color: "#A78BFA", bar: true, hideBelow: "lg", trend: fansTrend },
            ].map(({ label, value, color, bar, hideBelow, trend }) => {
              const cls =
                hideBelow === "lg" ? "hidden lg:flex" :
                hideBelow === "md" ? "hidden md:flex" :
                hideBelow === "sm" ? "hidden sm:flex" : "flex";
              return (
                <motion.div
                  key={`${timeTick}-${label}`}
                  className={`${cls} items-center px-3 md:px-4 h-full flex-shrink-0`}
                  style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
                  initial={{ opacity: 0.45, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: tickEase }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.18em",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: "#5C6962",
                      }}
                    >
                      {label}
                    </div>
                    {bar ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div
                          className="rounded-full overflow-hidden"
                          style={{
                            width: 40, height: 4,
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
                          />
                        </div>
                        <span
                          style={{
                            fontFamily: "'Bebas Neue', Oswald, sans-serif",
                            fontSize: 17,
                            lineHeight: 1,
                            color,
                          }}
                        >
                          {value}
                        </span>
                        {trend ? (
                          <span style={{ fontSize: 10, color: trendColor(trend) }}>{trendGlyph(trend)}</span>
                        ) : null}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontFamily: "'Bebas Neue', Oswald, sans-serif",
                          fontSize: 18,
                          lineHeight: 1.05,
                          color,
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
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <NotificationBell onAction={onNotificationAction} open={notifOpen} onOpenChange={onNotifOpenChange} />

            <div className="text-right hidden lg:block max-w-[min(280px,40vw)] overflow-hidden">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#5C6962",
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
                style={{ color: "#9CA89F" }}
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
                border: "none",
                cursor: advanceDisabled && !blockedToBell ? "not-allowed" : "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                background: blockedToBell
                  ? "rgba(255,90,124,0.15)"
                  : advanceDisabled
                  ? "rgba(60,60,60,0.4)"
                  : LIME,
                color: blockedToBell
                  ? "#FF5A7C"
                  : advanceDisabled
                  ? "#5C6962"
                  : LIME_ON,
                border: blockedToBell
                  ? "1px solid rgba(255,90,124,0.4)"
                  : advanceDisabled
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "none",
                boxShadow: blockedToBell
                  ? "none"
                  : advanceDisabled
                  ? "none"
                  : `0 4px 20px rgba(200,255,61,0.35)`,
                opacity: advanceDisabled && !blockedToBell ? 0.5 : 1,
                outline: tutorialSpotlightAdvance ? `2px solid ${LIME}` : "none",
                outlineOffset: 2,
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
                    background: "rgba(255,90,124,0.25)",
                    color: "#FF5A7C",
                    border: "1px solid rgba(255,90,124,0.4)",
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
