import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Play, X } from "lucide-react";
import { css } from "./primitives.jsx";
import { collectFocusables } from "../lib/hotkeysHelpers.js";
import { advanceAgendaModalTitle } from "../lib/advanceAgenda.js";

export default function AdvanceAgendaModal({
  open,
  career,
  league,
  items,
  onClose,
  onAdvanceAnyway,
  onGoTo,
}) {
  const panelRef = useRef(null);
  const advanceRef = useRef(null);
  const [snoozeForEvent, setSnoozeForEvent] = useState(true);

  useEffect(() => {
    if (!open) return undefined;
    setSnoozeForEvent(true);
    const t = requestAnimationFrame(() => advanceRef.current?.focus());
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

  if (!open || !items?.length) return null;

  const title = advanceAgendaModalTitle(career, league);

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
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
        aria-labelledby="advance-agenda-title"
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden anim-in"
        style={{ background: "var(--A-panel)", border: "1px solid var(--A-line-2)" }}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-aline">
          <div>
            <h2 id="advance-agenda-title" className={`${css.h1} text-lg tracking-wide`}>
              {title.toUpperCase()}
            </h2>
            <p className="text-[11px] text-atext-dim mt-1 leading-relaxed">
              Optional checks — you can fix these now or advance anyway.
            </p>
          </div>
          <button
            type="button"
            className={`${css.btnGhost} p-2 rounded-lg shrink-0`}
            aria-label="Close"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="px-5 py-3 space-y-2 max-h-[min(50vh,360px)] overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border px-3 py-3 flex gap-3 items-start ${
                item.severity === "warn"
                  ? "border-[rgba(232,74,111,0.35)] bg-[rgba(232,74,111,0.05)]"
                  : "border-aline bg-apanel-2/50"
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${item.severity === "warn" ? "text-[#E84A6F]" : "text-atext-mute"}`}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-atext">{item.title}</div>
                <div className="text-[11px] text-atext-dim mt-0.5 leading-snug">{item.detail}</div>
              </div>
              <button
                type="button"
                className={`${css.btnGhost} text-[10px] shrink-0 flex items-center gap-1 uppercase tracking-wider font-bold`}
                onClick={() => onGoTo(item)}
              >
                Open <ArrowRight className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>

        <div className="px-5 py-4 border-t border-aline space-y-3 bg-apanel-2/30">
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--A-accent)]"
              checked={snoozeForEvent}
              onChange={(e) => setSnoozeForEvent(e.target.checked)}
            />
            <span className="text-[11px] text-atext-dim leading-snug">
              Don&apos;t remind me about these until the next calendar step
            </span>
          </label>
          <div className="flex flex-wrap gap-2 justify-end">
            <button type="button" className={`${css.btnGhost} text-xs`} onClick={onClose}>
              Cancel
            </button>
            <button
              ref={advanceRef}
              type="button"
              className={`${css.btnPrimary} text-xs flex items-center gap-2`}
              onClick={() => onAdvanceAnyway(snoozeForEvent, items.map((i) => i.id))}
            >
              <Play className="w-4 h-4" /> Advance anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
