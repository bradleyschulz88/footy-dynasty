// ---------------------------------------------------------------------------
// TabNav — pill-style tab bar used across the secondary screens.
// Pure leaf component, no internal state.
// ---------------------------------------------------------------------------
import React from "react";

export default function TabNav({ tabs, active, onChange, tutorialAllowOnly, tutorialHighlightKey }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-5 overflow-x-auto" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
      {tabs.map((tb) => {
        const Icon = tb.icon;
        const isActive = active === tb.key;
        const locked = tutorialAllowOnly && tb.key !== tutorialAllowOnly;
        const spotlight = tutorialHighlightKey && tb.key === tutorialHighlightKey;
        return (
          <button
            key={tb.key}
            type="button"
            disabled={locked}
            onClick={() => {
              if (locked) return;
              onChange(tb.key);
            }}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 justify-center whitespace-nowrap ${spotlight ? "ring-2 ring-[var(--A-accent)] ring-offset-2 ring-offset-[var(--A-panel-2)] animate-pulse" : ""} ${locked ? "opacity-35 cursor-not-allowed" : ""}`}
            style={isActive
              ? { background: "linear-gradient(135deg, var(--A-accent), #0099b0)", color: "#001520", boxShadow: "0 2px 8px rgba(0, 224, 255, 0.25)" }
              : { color: locked ? "var(--A-text-mute)" : "var(--A-text-dim)" }}
            title={locked ? "Complete the tutorial step to use this tab (or skip tutorial)" : undefined}
          >
            <Icon className="w-4 h-4" /><span>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}
