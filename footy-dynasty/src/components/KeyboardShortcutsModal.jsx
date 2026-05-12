import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { css } from "./primitives.jsx";
import { collectFocusables } from "../lib/hotkeysHelpers.js";

const ROWS = [
  ["Advance time", "Space"],
  ["Keyboard shortcuts", "? or Shift + /"],
  ["Hub", "1"],
  ["Squad", "2"],
  ["Schedule (calendar)", "3"],
  ["Club", "4"],
  ["Recruit", "5"],
  ["Competition (ladder)", "6"],
  ["Settings", "7"],
];

export default function KeyboardShortcutsModal({ open, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const t = requestAnimationFrame(() => closeRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        onClose();
      }
      if (ev.key === "Tab" && panelRef.current) {
        const nodes = collectFocusables(panelRef.current);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(7, 16, 31, 0.88)", backdropFilter: "blur(8px)" }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kbd-shortcuts-title"
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden anim-in"
        style={{ background: "var(--A-panel)", border: "1px solid var(--A-line-2)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-aline">
          <h2 id="kbd-shortcuts-title" className={`${css.h1} text-lg tracking-wide`}>
            SHORTCUTS
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={`${css.btnGhost} p-2 rounded-lg`}
            aria-label="Close shortcuts"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2 max-h-[min(70vh,420px)] overflow-y-auto">
          <p className="text-[11px] text-atext-dim leading-relaxed mb-3">
            Disabled while typing in a field. Tutorial may lock navigation until the current step is done.
          </p>
          {ROWS.map(([label, keys]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 py-2 border-b border-aline/80 last:border-0"
            >
              <span className="text-sm text-atext">{label}</span>
              <kbd className="font-mono text-[11px] px-2 py-1 rounded-md bg-apanel-2 border border-aline text-aaccent whitespace-nowrap">
                {keys}
              </kbd>
            </div>
          ))}
          <p className="text-[10px] text-atext-mute pt-2 leading-relaxed">
            Post-match: Enter confirms “Next week”; Escape returns to match review.
          </p>
        </div>
      </div>
    </div>
  );
}
