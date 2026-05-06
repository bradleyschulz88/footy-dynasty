// ---------------------------------------------------------------------------
// TabNav — pill-style tab bar used across the secondary screens.
// Pure leaf component, no internal state.
// ---------------------------------------------------------------------------
import React from "react";

export default function TabNav({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-5 overflow-x-auto" style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}>
      {tabs.map(tb => {
        const Icon = tb.icon;
        const isActive = active === tb.key;
        return (
          <button key={tb.key} onClick={() => onChange(tb.key)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 justify-center whitespace-nowrap"
            style={isActive
              ? { background: "linear-gradient(135deg, var(--A-accent), #0099b0)", color: "#001520", boxShadow: "0 2px 8px rgba(0, 224, 255, 0.25)" }
              : { color: "var(--A-text-dim)" }}>
            <Icon className="w-4 h-4" /><span>{tb.label}</span>
          </button>
        );
      })}
    </div>
  );
}
