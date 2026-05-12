import React from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { getAdvanceContext, advanceTimeFingerprint } from "../../lib/advanceContext.js";
import { TRAINING_INFO, formatDate } from "../../lib/calendar.js";
import { findClub } from "../../data/pyramid.js";
import { fmtK } from "../../lib/format.js";
import { css } from "../primitives.jsx";
import SeasonStrip from "../SeasonStrip.jsx";

const tickEase = [0.22, 1, 0.36, 1];

export function TopBar({ career, club, league, myLadderPos, onAdvance, advanceDisabled, tutorialSpotlightAdvance }) {
  const ctx = getAdvanceContext(career, league);
  const timeTick = advanceTimeFingerprint(career);
  const nextEv = (career.eventQueue || []).find(e => !e.completed);
  const phaseColors = { preseason: 'var(--A-accent)', season: 'var(--A-accent-2)', finals: 'var(--A-neg)', offseason: '#A78BFA' };
  const phaseLabel  = { preseason: 'Pre-Season', season: 'Season', finals: 'Finals', offseason: 'Off-Season' };
  const phase = career.phase || 'preseason';

  let nextLabel = 'End of Season';
  let nextIcon  = null;
  if (career.inFinals) {
    nextLabel = 'Finals Match';
    nextIcon  = '🏆';
  } else if (nextEv) {
    if (nextEv.type === 'training') {
      const info = TRAINING_INFO[nextEv.subtype] || {};
      nextLabel = info.name || 'Training';
      nextIcon  = info.icon || '🏋️';
    } else if (nextEv.type === 'key_event') {
      nextLabel = nextEv.name;
      nextIcon  = '📅';
    } else if (nextEv.type === 'preseason_match') {
      nextLabel = nextEv.label;
      nextIcon  = '⚽';
    } else if (nextEv.type === 'round') {
      const myMatch = (nextEv.matches || []).find(m => m.home === career.clubId || m.away === career.clubId);
      if (myMatch) {
        const isHome = myMatch.home === career.clubId;
        const opp = findClub(isHome ? myMatch.away : myMatch.home);
        nextLabel = `Rd ${nextEv.round}: ${isHome ? 'vs' : '@'} ${opp?.short || ''}`;
        nextIcon  = '🏉';
      } else {
        nextLabel = `Round ${nextEv.round}`;
        nextIcon  = '🏉';
      }
    }
  }

  const showRichNext = ctx.mode === 'calendar' && nextEv;
  const headerNextLabel = showRichNext ? `${nextIcon ? nextIcon + ' ' : ''}${nextLabel}` : `${ctx.nextEventShort}${ctx.mode === 'finals' ? ' 🏆' : ''}`;

  return (
    <header className="sticky top-0 z-20 bg-apanel/90 backdrop-blur-md border-b border-aline shadow-[0_1px_0_rgba(0,224,255,0.06)] overflow-hidden">
      <motion.div
        key={timeTick}
        className="h-0.5 origin-left bg-gradient-to-r from-[var(--A-accent)] via-[#4ADBE8] to-transparent"
        initial={{ scaleX: 0, opacity: 0.9 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.55, ease: tickEase }}
      />
      <div className="px-3 md:px-6 py-0">
      <div className="flex items-center justify-between gap-2 max-w-[1400px] mx-auto h-16">
        {/* Left: date + phase + finance stats */}
        <div className="flex items-center gap-0 min-w-0 overflow-hidden">
          {/* Date + phase */}
          <div className="pr-3 mr-2 md:pr-4 md:mr-2 border-r border-aline flex-shrink-0 overflow-hidden">
            <motion.div
              key={timeTick}
              initial={{ opacity: 0.35, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: tickEase }}
            >
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest" style={{color: phaseColors[phase]}}>{phaseLabel[phase]}</div>
              <div className="font-display text-base md:text-lg leading-tight text-atext">{career.currentDate ? formatDate(career.currentDate) : '—'}</div>
            </motion.div>
          </div>
          {[
            { label: "Cash",     value: fmtK(career.finance.cash),           color: "var(--A-pos)",       hideBelow: 'sm' },
            { label: "Transfer", value: fmtK(career.finance.transferBudget), color: "var(--A-accent)",    hideBelow: 'lg' },
            { label: "Board",    value: career.finance.boardConfidence,       color: "var(--A-accent-2)", bar: true, hideBelow: 'md' },
            { label: "Fans",     value: career.finance.fanHappiness,          color: "#A78BFA",           bar: true, hideBelow: 'lg' },
          ].map(({ label, value, color, bar, hideBelow }) => {
            const cls = hideBelow === 'lg' ? 'hidden lg:flex' : hideBelow === 'md' ? 'hidden md:flex' : hideBelow === 'sm' ? 'hidden sm:flex' : 'flex';
            return (
              <div key={label} className={`${cls} items-center px-3 md:px-4 h-full border-r border-aline last:border-r-0 flex-shrink-0`}>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-atext-mute">{label}</div>
                  {bar ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-12 lg:w-16 h-1.5 rounded-full overflow-hidden bg-apanel border border-aline">
                        <div className="h-full rounded-full" style={{width:`${value}%`, background:`linear-gradient(90deg,${color}88,${color})`}} />
                      </div>
                      <span className="font-display text-lg leading-none" style={{color}}>{value}</span>
                    </div>
                  ) : (
                    <div className="font-display text-lg md:text-xl leading-tight" style={{color}}>{value}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: next event + advance button */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="text-right hidden lg:block max-w-[min(280px,40vw)] overflow-hidden">
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-atext-mute">Next</div>
            <motion.div
              key={`${timeTick}-${headerNextLabel}`}
              initial={{ opacity: 0.25, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.26, ease: tickEase }}
              className="text-sm font-semibold text-atext truncate"
              title={ctx.detail}
            >
              {headerNextLabel}
            </motion.div>
          </div>
          <motion.button
            type="button"
            onClick={onAdvance}
            disabled={advanceDisabled}
            title={advanceDisabled ? "Finish the tutorial step in the card (or skip) before advancing time." : undefined}
            whileTap={advanceDisabled ? undefined : { scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 520, damping: 28 }}
            className={`${css.btnPrimary} flex items-center gap-1.5 md:gap-2 glow text-[11px] md:text-xs px-3 md:px-5 ${tutorialSpotlightAdvance ? "ring-2 ring-[var(--A-accent)] ring-offset-2 ring-offset-apanel animate-pulse" : ""} ${advanceDisabled ? "opacity-45 cursor-not-allowed" : ""}`}
          >
            <Play className="w-4 h-4" /> {ctx.buttonLabel.toUpperCase()}
          </motion.button>
        </div>
      </div>
      </div>
      <SeasonStrip career={career} league={league} club={club} timeTick={timeTick} />
    </header>
  );
}
