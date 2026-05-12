import React from "react";
import {
  Home,
  Users,
  Calendar,
  Building2,
  Repeat,
  Trophy,
  ChevronRight,
  Settings,
} from "lucide-react";
import {
  tutorialAllowsNavigation,
  tutorialHighlightScreen,
} from "../TutorialOverlay.jsx";

export function Sidebar({ screen, onNavigate, club, league, career, myLadderPos }) {
  const season = career.season;
  const week   = career.week;
  const phase  = career.phase || 'preseason';
  const tutorialOn = career && !career.tutorialComplete;
  const tutStep = career?.tutorialStep ?? 0;
  const highlightNav = tutorialOn ? tutorialHighlightScreen(tutStep) : null;
  const items = [
    { key: "hub",      label: "Hub",         icon: Home,      desc: "Dashboard & match preview" },
    { key: "squad",    label: "Squad",       icon: Users,     desc: "Line-up & player lists" },
    { key: "schedule", label: "Schedule",    icon: Calendar,  desc: "Month calendar & upcoming queue" },
    { key: "club",     label: "Club",        icon: Building2, desc: "Contracts, finances & board" },
    { key: "recruit",  label: "Recruit",     icon: Repeat,    desc: "Trade period & draft" },
    { key: "compete",  label: "Competition", icon: Trophy,    desc: "Ladder, fixtures & pyramid" },
    { key: "settings", label: "Settings",    icon: Settings,   desc: "Save slots & preferences" },
  ];
  return (
    <aside className="w-full md:w-64 md:flex flex-col md:sticky md:top-0 md:h-screen shrink-0 bg-apanel border-b md:border-b-0 md:border-r border-aline">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-aline hidden md:block">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{background:"linear-gradient(135deg, var(--A-accent), #0f766e)", boxShadow:"0 4px 12px rgba(13,148,136,0.2)"}}>
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-[26px] tracking-[0.1em] leading-none text-atext">DYNASTY</div>
            <div className="text-[9px] text-atext-mute uppercase tracking-[0.25em] mt-0.5">Footy Manager</div>
          </div>
        </div>
      </div>

      {/* Club identity card */}
      <div className="px-4 py-3 border-b border-aline hidden md:block">
        <div className="panel rounded-xl overflow-hidden">
          <div className="h-1.5 w-full" style={{background:`linear-gradient(90deg, ${club.colors[0]}, ${club.colors[1]})`}} />
          <div className="p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display text-xl flex-shrink-0"
                style={{background:`linear-gradient(135deg,${club.colors[0]},${club.colors[1]})`, color:club.colors[2], boxShadow:`0 4px 12px ${club.colors[0]}44`}}>
                {club.short}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm truncate text-atext leading-tight">{club.name}</div>
                <div className={`text-[10px] mt-0.5 font-mono ${club.colors[0] === '#FFFFFF' ? 'text-aaccent' : ''}`} style={club.colors[0] === '#FFFFFF' ? undefined : { color: club.colors[0] }}>{league.short}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-center">
              {[["SEASON", season], [phase === 'preseason' ? "PHASE" : "ROUND", phase === 'preseason' ? "PRE" : week], ["POS", myLadderPos||"—"]].map(([l,v])=>(
                <div key={l} className="rounded-lg py-1.5 bg-apanel/60 border border-aline/80">
                  <div className="text-[8px] text-atext-mute uppercase tracking-widest font-bold font-mono">{l}</div>
                  <div className="font-display text-xl text-aaccent leading-tight">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-2 md:p-3 flex md:flex-col gap-1 md:gap-0.5 md:flex-1 overflow-x-auto md:overflow-y-auto md:overflow-x-visible">
        {items.map(it => {
          const Icon = it.icon;
          const active = screen === it.key;
          const navLocked = tutorialOn && !tutorialAllowsNavigation(tutStep, it.key);
          const spotlight = tutorialOn && highlightNav === it.key;
          return (
            <button
              key={it.key}
              type="button"
              aria-current={active ? "page" : undefined}
              disabled={navLocked} onClick={() => { if (!navLocked) onNavigate(it.key); }}
              title={navLocked ? 'Complete the current tutorial step or skip the tutorial.' : undefined}
              className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:py-3 rounded-xl transition-all group border whitespace-nowrap md:w-full ${spotlight ? "ring-2 ring-[var(--A-accent)] ring-offset-2 ring-offset-apanel animate-pulse" : ""} ${navLocked ? "opacity-35 cursor-not-allowed border-transparent" : ""} ${active ? "bg-aaccent/10 border-aaccent/40 text-aaccent" : !navLocked ? "border-transparent text-atext-dim hover:bg-aaccent/5 hover:text-atext" : "border-transparent text-atext-mute"}`}>
              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${active ? "bg-aaccent/15 text-aaccent" : "text-atext-mute"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0 hidden sm:block">
                <div className={`text-sm font-bold leading-tight ${active ? "text-aaccent" : "text-atext-dim group-hover:text-atext"}`}>{it.label}</div>
                <div className={`text-[9px] truncate hidden md:block ${active ? "text-aaccent/80" : "text-atext-mute"}`}>{it.desc}</div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-aaccent hidden md:inline" />}
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-2 border-t border-aline md:hidden">
        <div className="text-[9px] text-atext-mute text-center uppercase tracking-widest font-mono">Save · Slots · New career → Settings</div>
      </div>
    </aside>
  );
}
