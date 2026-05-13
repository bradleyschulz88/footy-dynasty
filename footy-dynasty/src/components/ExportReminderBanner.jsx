import React from "react";
import { LAST_EXPORT_STORAGE_KEY } from "../lib/save.js";

const DISMISS_KEY = "footy-dynasty-export-banner-dismiss-session";
/** Nudge backups if exports are stale (complements Settings SAVE DATA reminder). */
const STALE_AFTER_DAYS = 10;

function daysSinceMs(ms) {
  if (!Number.isFinite(ms)) return null;
  return (Date.now() - ms) / 86400000;
}

export function ExportReminderBanner({ onGoSettings }) {
  const [, bump] = React.useReducer((n) => n + 1, 0);

  React.useEffect(() => {
    const onStorage = () => bump();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1") {
    return null;
  }

  let exportedMs = null;
  try {
    const raw = localStorage?.getItem(LAST_EXPORT_STORAGE_KEY);
    const n = raw != null ? Number(raw) : NaN;
    if (Number.isFinite(n)) exportedMs = n;
  } catch {
    /* ignore */
  }

  const stale = exportedMs == null || daysSinceMs(exportedMs) > STALE_AFTER_DAYS;

  if (!stale) return null;

  return (
    <div
      role="note"
      className="px-3 py-2 mx-3 mt-3 md:mx-6 md:mt-4 rounded-xl border border-[#FFB347]/35 text-[11px] text-atext-dim flex flex-wrap items-center justify-between gap-2 max-w-[1400px] md:mr-auto md:ml-auto"
      style={{ background: "rgba(255,179,71,0.08)" }}
    >
      <span className="min-w-[200px]">
        <strong className="text-atext font-bold">Backup tip:</strong>{" "}
        {exportedMs == null
          ? "Export a JSON copy in Settings occasionally — browser storage can be wiped."
          : `Last export ~${Math.max(1, Math.floor(daysSinceMs(exportedMs)))} days ago — grab another backup when you finish a session.`}
      </span>
      <span className="flex gap-2">
        <button
          type="button"
          onClick={() => onGoSettings?.()}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-apanel border border-aline hover:border-aaccent/50 text-aaccent"
        >
          Settings → Save data
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            bump();
          }}
          className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-atext-mute hover:text-atext"
        >
          Dismiss
        </button>
      </span>
    </div>
  );
}
