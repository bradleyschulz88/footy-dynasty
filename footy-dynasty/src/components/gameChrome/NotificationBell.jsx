import React, { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { notificationItems } from "../../lib/notifications.js";

const KIND_ICON = {
  job_offer: "📞",
  player_transfer_request: "✈️",
  staff_leave: "👋",
  volunteer_join: "🙌",
  staff_poach: "🎯",
};

/**
 * Top-bar notification bell + dropdown. Renders the actionable items in
 * `career.inbox` (staff/player/club approaches) with inline action buttons.
 * `onAction(item, actionId)` is dispatched by the app shell.
 */
export function NotificationBell({ career, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const items = notificationItems(career);
  const count = items.length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Auto-close once everything is handled.
  useEffect(() => {
    if (count === 0) setOpen(false);
  }, [count]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={count > 0 ? `${count} notification${count === 1 ? "" : "s"}` : "No notifications"}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-aline hover:border-[var(--A-accent)] transition text-atext"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-center"
            style={{ background: "#E84A6F", color: "#fff", border: "1px solid var(--A-panel)" }}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[min(92vw,360px)] max-h-[70vh] overflow-y-auto rounded-2xl border border-aline shadow-2xl z-50"
          style={{ background: "var(--A-panel)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-aline sticky top-0" style={{ background: "var(--A-panel)" }}>
            <div className="font-display text-base tracking-wide text-atext">Notifications</div>
            <button type="button" onClick={() => setOpen(false)} className="text-atext-mute hover:text-atext" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {count === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-atext-mute">You're all caught up.</div>
          ) : (
            <ul className="divide-y divide-[var(--A-line)]">
              {items.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="text-base leading-5">{KIND_ICON[item.kind] || "•"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm text-atext truncate">{item.title}</div>
                        {item.blocking && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(232,74,111,0.18)", color: "#E84A6F" }}>
                            Action
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-atext-dim mt-0.5">{item.detail}</div>
                      {Array.isArray(item.actions) && item.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.actions.map((a, i) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => onAction?.(item, a.id)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border transition whitespace-nowrap ${
                                i === 0
                                  ? "border-[var(--A-accent)] text-aaccent hover:bg-[rgba(0,224,255,0.08)]"
                                  : "border-aline text-atext-dim hover:text-atext hover:border-[var(--A-accent)]"
                              }`}
                            >
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
