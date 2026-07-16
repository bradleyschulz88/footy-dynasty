import React, { useState } from "react";
import { POSITION_NAMES } from "../lib/playerGen.js";

// Blocking mid-season draft decision: sign one prospect from the pool or pass.
export default function MidSeasonDraftScreen({ blocking, onChoose }) {
  const [selected, setSelected] = useState(null);
  const pool = blocking?.pool || [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="panel w-full max-w-lg p-5 md:p-6">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-aaccent mb-1">
          📋 Mid-Season Draft
        </div>
        <h2 className="font-display text-2xl text-atext tracking-wide mb-1">Top up the list</h2>
        <p className="text-sm text-atext-dim mb-4">{blocking?.reason}</p>

        <div className="space-y-2 mb-5">
          {pool.map((p) => {
            const isSel = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(isSel ? null : p.id)}
                className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                style={{
                  background: isSel ? "color-mix(in srgb, var(--A-accent) 14%, transparent)" : "var(--A-panel-2)",
                  border: `1px solid ${isSel ? "var(--A-accent)" : "var(--A-line)"}`,
                }}
              >
                <div className="font-display text-2xl w-10 text-center" style={{ color: p.overall >= 72 ? "var(--A-pos)" : "var(--A-accent-2)" }}>
                  {p.overall}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-atext truncate">{p.firstName} {p.lastName}</div>
                  <div className="text-[11px] text-atext-mute font-mono">
                    {POSITION_NAMES[p.position] || p.position} · age {p.age}{p.rookie ? " · rookie" : ""}
                  </div>
                </div>
                {isSel && <div className="text-[11px] font-bold uppercase tracking-wide text-aaccent">Selected</div>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChoose(null)}
            className="flex-1 rounded-xl py-3 font-bold uppercase tracking-wide text-sm"
            style={{ background: "var(--A-panel-2)", color: "var(--A-text-mute)", border: "1px solid var(--A-line)" }}
          >
            Pass
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={() => onChoose(selected)}
            className="flex-[2] btn-primary rounded-xl py-3 text-sm disabled:opacity-40"
          >
            {selected ? "Sign Player" : "Select a player"}
          </button>
        </div>
      </div>
    </div>
  );
}
