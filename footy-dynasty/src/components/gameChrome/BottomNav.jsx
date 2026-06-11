// ---------------------------------------------------------------------------
// BottomNav — mobile-only fixed bottom navigation + prominent ADVANCE action.
// Solves the mobile flow pain points: the core "what do I do next" loop lives
// in the centre (the raised PLAY button shows the next event + label), the four
// most-used destinations flank it, and everything else lives in a "More" sheet.
// Hidden on md+ where the left Sidebar takes over.
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import {
  Home, Users, Building2, Trophy, Repeat, Calendar, Settings, Play, MoreHorizontal, X,
} from "lucide-react";
import { getAdvanceContext } from "../../lib/advanceContext.js";
import { tutorialAllowsNavigation } from "../TutorialOverlay.jsx";

const PRIMARY = [
  { key: "hub",   label: "Hub",   icon: Home },
  { key: "squad", label: "Squad", icon: Users },
  { key: "club",  label: "Club",  icon: Building2 },
];

const MORE = [
  { key: "schedule", label: "Schedule",    icon: Calendar,  desc: "Calendar & upcoming events" },
  { key: "compete",  label: "Competition", icon: Trophy,    desc: "Ladder, fixtures & pyramid" },
  { key: "settings", label: "Settings",    icon: Settings,  desc: "Save slots & preferences" },
];

export function BottomNav({
  screen,
  onNavigate,
  career,
  league,
  onAdvance,
  advanceDisabled,
  advanceAgendaCount = 0,
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const ctx = getAdvanceContext(career, league);
  const tutorialOn = career && !career.tutorialComplete;
  const tutStep = career?.tutorialStep ?? 0;

  const navLocked = (key) => tutorialOn && !tutorialAllowsNavigation(tutStep, key);
  const go = (key) => {
    if (navLocked(key)) return;
    setSheetOpen(false);
    onNavigate(key);
  };

  const moreActive = MORE.some((m) => m.key === screen);

  const Cell = ({ item, active }) => {
    const Icon = item.icon;
    const locked = navLocked(item.key);
    return (
      <button
        type="button"
        onClick={() => go(item.key)}
        disabled={locked}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
          locked ? "opacity-35" : active ? "text-aaccent" : "text-atext-mute"
        }`}
      >
        <Icon className="w-[22px] h-[22px]" />
        <span className="text-[10px] font-bold tracking-wide leading-none">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      {/* More sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-apanel border-t border-aline rounded-t-2xl p-3 anim-in"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
          >
            <div className="flex items-center justify-between px-2 py-2 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-atext-mute">More</span>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close" className="text-atext-mute p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map((item) => {
                const Icon = item.icon;
                const active = screen === item.key;
                const locked = navLocked(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => go(item.key)}
                    disabled={locked}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      locked ? "opacity-35 border-transparent"
                        : active ? "bg-aaccent/10 border-aaccent/40" : "border-aline bg-apanel-2/40"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-aaccent/15 text-aaccent" : "text-atext-dim"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-bold leading-tight ${active ? "text-aaccent" : "text-atext"}`}>{item.label}</div>
                      <div className="text-[10px] text-atext-mute truncate">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-apanel/95 backdrop-blur-md border-t border-aline"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Next-step hint — always tells you what ADVANCE does */}
        <div className="flex items-center justify-center gap-1.5 h-5 text-[10px] text-atext-mute border-b border-aline/60">
          <span className="font-mono uppercase tracking-widest">Next</span>
          <span className="font-semibold text-atext-dim truncate max-w-[60vw]">{ctx.nextEventShort}{ctx.mode === "finals" ? " 🏆" : ""}</span>
        </div>

        <div className="flex items-stretch h-14 px-1">
          <Cell item={PRIMARY[0]} active={screen === "hub"} />
          <Cell item={PRIMARY[1]} active={screen === "squad"} />

          {/* Centre ADVANCE action — raised */}
          <div className="flex-1 flex justify-center">
            <button
              type="button"
              onClick={onAdvance}
              disabled={advanceDisabled}
              aria-label={`Advance: ${ctx.buttonLabel}`}
              className={`relative -mt-5 flex flex-col items-center justify-center w-16 h-16 rounded-full text-white shadow-lg transition-transform active:scale-95 ${
                advanceDisabled ? "opacity-45" : ""
              }`}
              style={{
                background: advanceDisabled
                  ? "linear-gradient(135deg,#3a3a3a,#242424)"
                  : "linear-gradient(135deg, var(--A-accent), var(--A-accent-2))",
                boxShadow: advanceDisabled ? "none" : "0 6px 20px color-mix(in srgb, var(--A-accent) 35%, transparent)",
              }}
            >
              <Play className="w-6 h-6" fill="currentColor" />
              {!advanceDisabled && advanceAgendaCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center"
                  style={{ background: "#E84A6F", color: "#fff", border: "2px solid var(--A-panel)" }}
                >
                  {advanceAgendaCount}
                </span>
              )}
            </button>
          </div>

          <Cell item={PRIMARY[2]} active={screen === "club"} />
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
              moreActive || sheetOpen ? "text-aaccent" : "text-atext-mute"
            }`}
          >
            <MoreHorizontal className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-bold tracking-wide leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
