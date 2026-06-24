import React from "react";
import { useCareer } from "../../lib/careerStore.js";
import {
  Home,
  Users,
  Calendar,
  Building2,
  Repeat,
  Trophy,
  Briefcase,
  Settings,
} from "lucide-react";
import {
  tutorialAllowsNavigation,
  tutorialHighlightScreen,
} from "../TutorialOverlay.jsx";

const NAV_GROUPS = [
  {
    items: [
      { key: "hub",      label: "Hub",         icon: Home,      desc: "Dashboard & match preview" },
      { key: "squad",    label: "Squad",       icon: Users,     desc: "Line-up & player lists" },
      { key: "schedule", label: "Schedule",    icon: Calendar,  desc: "Month calendar & upcoming queue" },
      { key: "club",     label: "Club",        icon: Building2, desc: "Contracts, finances & board" },
    ],
  },
  {
    items: [
      { key: "recruit",  label: "Recruit",     icon: Repeat,    desc: "Trade period & draft" },
      { key: "compete",  label: "Competition", icon: Trophy,    desc: "Ladder, fixtures & pyramid" },
      { key: "careers",  label: "Careers",     icon: Briefcase, desc: "Coach jobs & reputation" },
    ],
  },
  {
    items: [
      { key: "settings", label: "Settings",    icon: Settings,  desc: "Save slots & preferences" },
    ],
  },
];

export function Sidebar({ screen, onNavigate, club, league, myLadderPos }) {
  const career = useCareer();
  const season = career?.season;
  const week   = career?.week;
  const phase  = career?.phase || 'preseason';
  const c1 = club?.colors?.[0] ?? '#334155';
  const c2 = club?.colors?.[1] ?? '#0f172a';
  const c3 = club?.colors?.[2] ?? c1;
  const tutorialOn = career && !career.tutorialComplete;
  const tutStep = career?.tutorialStep ?? 0;
  const highlightNav = tutorialOn ? tutorialHighlightScreen(tutStep) : null;

  return (
    <aside
      className="hidden md:flex w-64 flex-col md:sticky md:top-0 md:h-screen shrink-0 backdrop-blur-xl md:border-r border-aline"
      style={{ background: "rgba(var(--A-panel-rgb, 16 26 46) / 0.82)" }}
    >
      {/* Brand */}
      <div className="px-5 py-4 border-b border-aline hidden md:block">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--A-accent), var(--A-accent-2))",
              boxShadow: "0 4px 14px color-mix(in srgb, var(--A-accent) 28%, transparent)",
            }}
          >
            <Trophy className="w-5 h-5" style={{ color: "var(--fd-on-accent, #0A0D0C)" }} />
          </div>
          <div>
            <div className="font-display text-[26px] tracking-[0.1em] leading-none text-atext">DYNASTY</div>
            <div className="text-[9px] text-atext-mute uppercase tracking-[0.25em] mt-0.5 font-mono">Footy Manager</div>
          </div>
        </div>
      </div>

      {/* Club identity card */}
      <div className="px-4 py-3 border-b border-aline hidden md:block">
        <div className="relative rounded-xl overflow-hidden" style={{
          background: `linear-gradient(135deg, ${c1}28 0%, ${c2}14 70%, var(--A-panel) 100%)`,
          border: '1px solid var(--A-line)',
        }}>
          {/* Club colour bar */}
          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              {/* Club crest badge */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-display flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${c1}, ${c2})`,
                  color: c3,
                  boxShadow: `0 4px 14px ${c1}50`,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                }}
              >
                {club?.short}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate text-atext leading-tight">{club?.name}</div>
                <div
                  className={`text-[10px] mt-0.5 font-mono font-semibold ${c1 === '#FFFFFF' ? 'text-aaccent' : ''}`}
                  style={c1 === '#FFFFFF' ? undefined : { color: c1 }}
                >
                  {league?.short}
                </div>
              </div>
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-1 text-center">
              {[
                ["SEASON", season],
                [phase === 'preseason' ? "PHASE" : "ROUND", phase === 'preseason' ? "PRE" : week],
                ["POS", myLadderPos || "—"],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg py-1.5 bg-apanel/60 border border-aline/80">
                  <div className="text-[8px] text-atext-mute uppercase tracking-widest font-bold font-mono">{l}</div>
                  <div className="font-display text-xl text-aaccent leading-tight">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav — grouped with dividers */}
      <nav className="p-2 md:p-3 flex md:flex-col gap-1 md:gap-0 md:flex-1 overflow-x-auto md:overflow-y-auto md:overflow-x-visible">
        {NAV_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {/* Divider between groups (not before the first) */}
            {gi > 0 && (
              <div
                className="hidden md:block my-1.5 mx-1"
                style={{ height: 1, background: "var(--A-line)" }}
              />
            )}
            {group.items.map((it) => {
              const Icon = it.icon;
              const active = screen === it.key;
              const navLocked = tutorialOn && !tutorialAllowsNavigation(tutStep, it.key);
              const spotlight = tutorialOn && highlightNav === it.key;
              return (
                <button
                  key={it.key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  disabled={navLocked}
                  onClick={() => { if (!navLocked) onNavigate(it.key); }}
                  title={navLocked ? 'Complete the current tutorial step or skip the tutorial.' : undefined}
                  className={[
                    "flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl transition-all group whitespace-nowrap md:w-full relative overflow-hidden",
                    spotlight ? "ring-2 ring-[var(--A-accent)] ring-offset-2 ring-offset-apanel animate-pulse" : "",
                    navLocked ? "opacity-35 cursor-not-allowed" : "",
                  ].filter(Boolean).join(" ")}
                  style={{
                    // Active: richer background + accent border
                    background: active
                      ? "color-mix(in srgb, var(--A-accent) 10%, transparent)"
                      : undefined,
                    border: active
                      ? "1px solid color-mix(in srgb, var(--A-accent) 35%, transparent)"
                      : "1px solid transparent",
                    color: active
                      ? "var(--A-accent)"
                      : navLocked
                      ? "var(--A-text-mute)"
                      : "var(--A-text-dim)",
                    marginBottom: 2,
                  }}
                >
                  {/* Left accent bar for active item */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        width: 3,
                        height: "60%",
                        background: "var(--A-accent)",
                        boxShadow: "0 0 8px color-mix(in srgb, var(--A-accent) 60%, transparent)",
                        borderRadius: "0 3px 3px 0",
                      }}
                    />
                  )}

                  {/* Icon container — slightly larger when active */}
                  <div
                    className={[
                      "rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      active ? "w-8 h-8 md:w-9 md:h-9" : "w-7 h-7 md:w-8 md:h-8",
                    ].join(" ")}
                    style={{
                      background: active
                        ? "color-mix(in srgb, var(--A-accent) 16%, transparent)"
                        : "transparent",
                      color: active ? "var(--A-accent)" : "var(--A-text-mute)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Icon
                      className={active ? "w-4.5 h-4.5" : "w-4 h-4"}
                      style={{ width: active ? 18 : 16, height: active ? 18 : 16 }}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                  </div>

                  <div className="text-left min-w-0 hidden sm:block flex-1">
                    <div
                      className="text-sm leading-tight"
                      style={{
                        fontWeight: active ? 700 : 500,
                        color: active ? "var(--A-accent)" : "var(--A-text-dim)",
                        transition: "color 0.15s ease",
                      }}
                    >
                      {it.label}
                    </div>
                    <div
                      className="text-[9px] truncate hidden md:block"
                      style={{
                        color: active
                          ? "color-mix(in srgb, var(--A-accent) 70%, transparent)"
                          : "var(--A-text-mute)",
                        marginTop: 1,
                      }}
                    >
                      {it.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </nav>
      <div className="px-4 py-2 border-t border-aline md:hidden">
        <div className="text-[9px] text-atext-mute text-center uppercase tracking-widest font-mono">Save · Slots · New career → Settings</div>
      </div>
    </aside>
  );
}
