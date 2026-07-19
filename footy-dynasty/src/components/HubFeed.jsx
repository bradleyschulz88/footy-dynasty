// Portal-style Hub feed (FM26 pattern): merges news + outstanding tasks into
// one scrollable feed with filter chips (All / New / Tasks). "New" = items from
// the current round. Pure presentational — data is passed in from the Hub.
import React, { useState } from "react";
import { Trophy, TrendingDown, Landmark, Info, Newspaper, ListTodo } from "lucide-react";
import { css } from "./primitives.jsx";

function newsMeta(type) {
  switch (type) {
    case "win":   return { color: "var(--A-pos)", Icon: Trophy };
    case "loss":  return { color: "var(--A-neg)", Icon: TrendingDown };
    case "board": return { color: "#E0A43B", Icon: Landmark };
    case "info":  return { color: "var(--A-accent-2)", Icon: Info };
    default:       return { color: "var(--A-text-mute)", Icon: Newspaper };
  }
}

/**
 * @param {Array} news  career.news items: { text, type, week }
 * @param {Array} tasks outstanding actions: { text, tone: 'pos'|'neg', sub }
 * @param {number} week current round (for the "New" filter)
 */
export function HubFeed({ news = [], tasks = [], week = 0 }) {
  const [filter, setFilter] = useState("all");

  const newsItems = news.map((n, i) => ({ kind: "news", id: `news_${i}`, ...n }));
  const taskItems = tasks.map((t, i) => ({ kind: "task", id: `task_${i}`, ...t }));
  const newThisRound = newsItems.filter((n) => n.week === week);
  const all = [...taskItems, ...newsItems]; // tasks surface first

  const counts = { all: all.length, new: newThisRound.length, tasks: taskItems.length };
  const shown = filter === "tasks" ? taskItems : filter === "new" ? newThisRound : all;
  const chips = [
    { key: "all", label: "All" },
    { key: "new", label: "New" },
    { key: "tasks", label: "Tasks" },
  ];

  return (
    <div className={`${css.panel} p-5`}>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-aaccent" />
          <h3 className="font-display text-xl tracking-wide text-atext">FEED</h3>
        </div>
        <div className="inline-flex rounded-xl border border-aline bg-apanel-2 p-1" role="tablist" aria-label="Feed filter">
          {chips.map((c) => {
            const active = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(c.key)}
                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
                style={active ? { background: "var(--A-accent)", color: "var(--fd-on-accent, #fff)" } : { color: "var(--A-text-mute)" }}
              >
                {c.label}
                <span className="ml-1 opacity-70 tabular-nums">{counts[c.key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        {shown.length === 0 && (
          <div className="text-sm text-atext-dim py-6 text-center">
            {filter === "tasks" ? "No outstanding tasks — you're on top of it." : "Nothing here yet."}
          </div>
        )}
        {shown.map((item) => {
          if (item.kind === "task") {
            const color = item.tone === "neg" ? "var(--A-neg)" : "var(--A-accent)";
            return (
              <div key={item.id} className="flex gap-3 p-3 rounded-xl items-center"
                style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)", borderLeft: `3px solid ${color}` }}>
                <ListTodo className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-atext leading-snug">{item.text}</div>
                  <div className="text-[9px] font-mono text-atext-mute uppercase tracking-widest mt-1">Task{item.sub ? ` · ${item.sub}` : ""}</div>
                </div>
              </div>
            );
          }
          const { color, Icon } = newsMeta(item.type);
          return (
            <div key={item.id} className="flex gap-3 p-3 rounded-xl"
              style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)", borderLeft: `3px solid ${color}` }}>
              <div className="shrink-0 mt-0.5"><Icon className="w-3.5 h-3.5" style={{ color }} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-atext leading-snug">{item.text}</div>
                <div className="text-[9px] font-mono text-atext-mute uppercase tracking-widest mt-1">{item.week === 0 ? "Pre-Season" : `Round ${item.week}`}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
