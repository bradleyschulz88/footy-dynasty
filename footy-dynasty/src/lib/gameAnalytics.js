/**
 * Lightweight local funnel / debugging buffer (never sends to third parties).
 * Enabled when import.meta.env.DEV or career.options.sessionDiagnostics === true.
 */
const SESSION_KEY = "footy-dynasty-session-events";
const MAX_EVENTS = 40;

function allowRecord(career) {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return true;
  try {
    return !!(career && career.options && career.options.sessionDiagnostics === true);
  } catch {
    return false;
  }
}

/** Append one row to session ring buffer — useful when sharing bugs. */
export function recordGameEvent(career, event, payload = {}) {
  if (!allowRecord(career)) return;
  if (typeof sessionStorage === "undefined") return;
  try {
    const row = { t: Date.now(), event, payload };
    const prev = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    const next = [...(Array.isArray(prev) ? prev : []), row].slice(-MAX_EVENTS);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / serialization */
  }
}

export function peekSessionDiagnostics() {
  if (typeof sessionStorage === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearSessionDiagnostics() {
  try {
    sessionStorage?.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}
