import React, { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import {
  notificationItems,
  recentlyHandledNotifications,
  hasBlockingNotification,
} from "../../lib/notifications.js";

const KIND_ICON = {
  job_offer: "📞",
  player_transfer_request: "✈️",
  staff_leave: "👋",
  volunteer_join: "🙌",
  staff_poach: "🎯",
  player_join: "🤝",
  player_leave: "🚶",
};

function ratingChipColor(value) {
  return value >= 80 ? "#4AE89A" : value >= 68 ? "#4ADBE8" : value >= 56 ? "var(--A-accent)" : "#E8D44A";
}

/**
 * Top-bar notification bell + dropdown. Renders the actionable items in
 * `career.inbox` (staff/player/club approaches) with inline action buttons,
 * plus a collapsed "Recently handled" trail of past decisions.
 *
 * Open state may be controlled by the shell (`open` / `onOpenChange`) so the
 * mobile advance FAB can pop the bell when advance is blocked; falls back to
 * internal state when those props are omitted.
 *
 * `onAction(item, actionId)` is dispatched by the app shell.
 */
export function NotificationBell({ career, onAction, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (next) => {
    const value = typeof next === "function" ? next(open) : next;
    if (onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  };
  const [showHandled, setShowHandled] = useState(false);
  const ref = useRef(null);
  const items = notificationItems(career);
  const handled = recentlyHandledNotifications(career);
  const count = items.length;
  const blocking = hasBlockingNotification(career);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
    // setOpen is a stable wrapper; intentionally keyed on `open` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-close once everything is handled.
  useEffect(() => {
    if (count === 0) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Pop the dropdown automatically when a brand-new blocking item arrives so a
  // gated advance is never a mystery.
  const seenBlocking = useRef(new Set());
  useEffect(() => {
    const blockingIds = items.filter((m) => m.blocking).map((m) => m.id);
    const fresh = blockingIds.some((id) => !seenBlocking.current.has(id));
    seenBlocking.current = new Set(blockingIds);
    if (fresh) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((m) => m.id).join("|")]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={count > 0 ? `${count} notification${count === 1 ? "" : "s"}${blocking ? " · needs a decision" : ""}` : "No notifications"}
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition text-atext ${
          blocking && !open
            ? "border-[#E84A6F] animate-pulse"
            : "border-aline hover:border-[var(--A-accent)]"
        }`}
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
              {items.map((item) => {
                const rating = item.payload?.rating;
                return (
                  <li key={item.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <span className="text-base leading-5">{KIND_ICON[item.kind] || "•"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm text-atext truncate">{item.title}</div>
                          {rating != null && (
                            <span
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ background: `${ratingChipColor(rating)}22`, color: ratingChipColor(rating), border: `1px solid ${ratingChipColor(rating)}55` }}
                              title="Rating"
                            >
                              {rating}
                            </span>
                          )}
                          {item.blocking && (
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold flex-shrink-0" style={{ background: "rgba(232,74,111,0.18)", color: "#E84A6F" }}>
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
                                    ? "border-[var(--A-accent)] text-aaccent hover:bg-[color-mix(in srgb, var(--A-accent) 8%, transparent)]"
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
                );
              })}
            </ul>
          )}

          {/* Recently handled — a short trail so past decisions aren't lost. */}
          {handled.length > 0 && (
            <div className="border-t border-aline">
              <button
                type="button"
                onClick={() => setShowHandled((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-atext-mute hover:text-atext"
              >
                <span>Recently handled · {handled.length}</span>
                <span>{showHandled ? "−" : "+"}</span>
              </button>
              {showHandled && (
                <ul className="divide-y divide-[var(--A-line)] pb-1">
                  {handled.map((item) => (
                    <li key={`h-${item.id}`} className="px-4 py-2 flex items-start gap-2 opacity-70">
                      <span className="text-sm leading-5">{KIND_ICON[item.kind] || "•"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-atext-dim truncate">{item.title}</div>
                        {item.outcome && <div className="text-[11px] text-atext-mute truncate">{item.outcome}</div>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
