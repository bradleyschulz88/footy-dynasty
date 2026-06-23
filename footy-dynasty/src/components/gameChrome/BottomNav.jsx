// ---------------------------------------------------------------------------
// BottomNav — mobile Stitch-direction 5-tab bar: Hub · Squad · [ADVANCE] · Recruit · Club
// Active tab: animated sliding pill indicator (motion/react layoutId) + lime icon.
// Glass background with backdrop-blur.
// More sheet for Schedule, Competition, Careers, Settings.
// Hidden on md+ where the Sidebar takes over.
// ---------------------------------------------------------------------------
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Home, Users, Building2, Trophy, Calendar, Settings, Play, MoreHorizontal, X, Bell, Briefcase, Search,
} from "lucide-react";
import { getAdvanceContext } from "../../lib/advanceContext.js";
import { tutorialAllowsNavigation } from "../TutorialOverlay.jsx";
import { useCareer } from "../../lib/careerStore.js";

const PRIMARY = [
  { key: "hub",     label: "Hub",     icon: Home },
  { key: "squad",   label: "Squad",   icon: Users },
  null, // centre ADVANCE slot
  { key: "recruit", label: "Recruit", icon: Search },
  { key: "club",    label: "Club",    icon: Building2 },
];

const MORE = [
  { key: "schedule", label: "Schedule",    icon: Calendar,  desc: "Calendar & upcoming events" },
  { key: "compete",  label: "Competition", icon: Trophy,    desc: "Ladder, fixtures & pyramid" },
  { key: "careers",  label: "Careers",     icon: Briefcase, desc: "Coach jobs & reputation" },
  { key: "settings", label: "Settings",    icon: Settings,  desc: "Save slots & preferences" },
];

// Theme-driven accent — resolves to the active theme's --A-accent (teal in
// the light "Daylight" theme) so the nav matches the rest of the app shell.
const ACCENT = "var(--A-accent)";
const ACCENT_ON = "var(--fd-on-accent)";

export function BottomNav({
  screen,
  onNavigate,
  league,
  onAdvance,
  advanceDisabled,
  advanceDisabledReason,
  onShowNotifications,
  advanceAgendaCount = 0,
}) {
  const career = useCareer();
  const [sheetOpen, setSheetOpen] = useState(false);
  const ctx = getAdvanceContext(career, league);
  const blockedToBell = advanceDisabled && !!onShowNotifications;
  const tutorialOn = career && !career.tutorialComplete;
  const tutStep = career?.tutorialStep ?? 0;

  const navLocked = (key) => tutorialOn && !tutorialAllowsNavigation(tutStep, key);
  const go = (key) => {
    if (navLocked(key)) return;
    setSheetOpen(false);
    onNavigate(key);
  };

  const moreActive = MORE.some((m) => m.key === screen);

  return (
    <>
      {/* More sheet */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl p-4"
            style={{
              background: "var(--A-panel)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderTop: `1px solid var(--A-line)`,
              boxShadow: "0 -8px 30px rgba(12, 28, 52, 0.12)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
            }}
          >
            <div className="flex items-center justify-between px-1 py-1 mb-3">
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.24em", color: "var(--A-text-mute)", textTransform: "uppercase", fontWeight: 700 }}>
                More
              </span>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close" style={{ color: "var(--A-text-mute)", padding: 4 }}>
                <X size={18} />
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
                    className="flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      opacity: locked ? 0.35 : 1,
                      background: active ? "color-mix(in srgb, var(--A-accent) 8%, transparent)" : "var(--A-panel-2)",
                      border: active ? `1px solid color-mix(in srgb, var(--A-accent) 40%, transparent)` : "1px solid var(--A-line)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: active ? "color-mix(in srgb, var(--A-accent) 12%, transparent)" : "var(--A-bg-2)", color: active ? ACCENT : "var(--A-text-dim)" }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold leading-tight" style={{ color: active ? ACCENT : "var(--A-text)" }}>{item.label}</div>
                      <div className="text-[10px] truncate" style={{ color: "var(--A-text-mute)" }}>{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30"
        style={{
          background: "color-mix(in srgb, var(--A-panel) 92%, transparent)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1px solid var(--A-line)",
          boxShadow: "0 -4px 24px rgba(12, 28, 52, 0.10), 0 -1px 0 var(--A-line)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Next-event hint strip */}
        <div
          className="flex items-center justify-center gap-1.5 h-[22px] border-b"
          style={{ borderColor: "var(--A-line)", overflow: "hidden" }}
        >
          {advanceDisabled && advanceDisabledReason ? (
            <>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "0.22em", color: "var(--A-neg)", textTransform: "uppercase", fontWeight: 700 }}>Hold</span>
              <span style={{ fontSize: 10, color: "var(--A-neg)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72vw" }}>{advanceDisabledReason}</span>
            </>
          ) : (
            <>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: "0.22em", color: "var(--A-text-mute)", textTransform: "uppercase", fontWeight: 700 }}>Next</span>
              <span style={{ fontSize: 10, color: "var(--A-text-dim)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60vw" }}>
                {ctx.nextEventShort}{ctx.mode === "finals" ? " 🏆" : ""}
              </span>
            </>
          )}
        </div>

        {/* Tab row */}
        <div className="flex items-stretch" style={{ height: 58, paddingLeft: 4, paddingRight: 4 }}>
          {PRIMARY.map((item, _i) => {
            if (!item) {
              // Centre ADVANCE button
              return (
                <div key="advance" className="flex-1 flex justify-center items-center">
                  <button
                    type="button"
                    onClick={blockedToBell ? onShowNotifications : onAdvance}
                    disabled={advanceDisabled && !blockedToBell}
                    aria-label={blockedToBell ? "Decision waiting — open notifications" : `Advance: ${ctx.buttonLabel}`}
                    className="relative flex flex-col items-center justify-center transition-transform active:scale-95"
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      marginTop: -14,
                      background: blockedToBell
                        ? "linear-gradient(135deg,#FF5A7C,#a32a47)"
                        : advanceDisabled
                        ? "var(--A-bg-2)"
                        : ACCENT,
                      color: advanceDisabled && !blockedToBell ? "var(--A-text-mute)" : blockedToBell ? "#fff" : ACCENT_ON,
                      boxShadow: blockedToBell
                        ? "0 6px 20px rgba(255,90,124,0.45)"
                        : advanceDisabled
                        ? "none"
                        : `0 6px 24px color-mix(in srgb, var(--A-accent) 45%, transparent), 0 0 0 2px color-mix(in srgb, var(--A-accent) 20%, transparent)`,
                      border: advanceDisabled && !blockedToBell ? "1px solid var(--A-line-2)" : "none",
                    }}
                  >
                    {blockedToBell ? <Bell size={22} /> : <Play size={22} fill="currentColor" />}
                    {!advanceDisabled && advanceAgendaCount > 0 && (
                      <span
                        className="absolute flex items-center justify-center"
                        style={{
                          top: -2, right: -2,
                          minWidth: 18, height: 18,
                          paddingLeft: 4, paddingRight: 4,
                          borderRadius: 9999,
                          background: "#FF5A7C",
                          color: "#fff",
                          fontSize: 9,
                          fontFamily: "'JetBrains Mono',monospace",
                          fontWeight: 700,
                          border: "2px solid var(--A-panel)",
                        }}
                      >
                        {advanceAgendaCount}
                      </span>
                    )}
                  </button>
                </div>
              );
            }
            if (item.key === "club") {
              // Rightmost: Club + More
              const active = screen === item.key;
              const locked = navLocked(item.key);
              return (
                <React.Fragment key={item.key}>
                  <TabCell
                    item={item}
                    active={active}
                    locked={locked}
                    onPress={() => go(item.key)}
                  />
                  {/* More button — rightmost */}
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={sheetOpen}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative"
                    style={{ color: moreActive || sheetOpen ? ACCENT : "var(--A-text-mute)" }}
                  >
                    {(moreActive || sheetOpen) && (
                      <motion.span
                        layoutId="bottomnav-pill"
                        className="absolute inset-x-1 rounded-full"
                        style={{
                          top: 0,
                          height: 3,
                          background: ACCENT,
                          boxShadow: `0 0 10px color-mix(in srgb, var(--A-accent) 80%, transparent)`,
                        }}
                        transition={{ type: "spring", stiffness: 480, damping: 36 }}
                      />
                    )}
                    <MoreHorizontal size={22} />
                    <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1, letterSpacing: "0.02em" }}>More</span>
                  </button>
                </React.Fragment>
              );
            }
            const active = screen === item.key;
            const locked = navLocked(item.key);
            return (
              <TabCell
                key={item.key}
                item={item}
                active={active}
                locked={locked}
                onPress={() => go(item.key)}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}

function TabCell({ item, active, locked, onPress }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={locked}
      aria-current={active ? "page" : undefined}
      className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative"
      style={{ opacity: locked ? 0.35 : 1, color: active ? ACCENT : "var(--A-text-mute)" }}
    >
      {active && (
        <motion.span
          layoutId="bottomnav-pill"
          className="absolute inset-x-1 rounded-full"
          style={{
            top: 0,
            height: 3,
            background: ACCENT,
            boxShadow: `0 0 10px color-mix(in srgb, var(--A-accent) 80%, transparent)`,
          }}
          transition={{ type: "spring", stiffness: 480, damping: 36 }}
        />
      )}
      {/* Active backdrop glow */}
      {active && (
        <span
          className="absolute inset-x-0 bottom-0 rounded-lg"
          style={{
            top: 4,
            background: "radial-gradient(ellipse 60% 70% at 50% 0%, color-mix(in srgb, var(--A-accent) 12%, transparent), transparent 80%)",
            pointerEvents: "none",
          }}
        />
      )}
      <Icon size={active ? 23 : 22} strokeWidth={active ? 2.2 : 1.8} />
      <span
        style={{
          fontSize: 10,
          fontWeight: active ? 800 : 600,
          lineHeight: 1,
          letterSpacing: active ? "0.04em" : "0.02em",
        }}
      >
        {item.label}
      </span>
    </button>
  );
}
