// Pre-advance reminders — soft warnings before calendar time moves (FM-style agenda).
import { getAdvanceContext } from "./advanceContext.js";
import {
  effectiveWageCap,
  currentPlayerWageBill,
  cashCrisisLevel,
} from "./finance/engine.js";
import { LINEUP_CAP, LINEUP_FIELD_COUNT, lineupPlayerCount } from "./lineupHelpers.js";
import { ensureStaffTasks } from "./staffTasks.js";

/** @typedef {'warn' | 'info'} AgendaSeverity */
/** @typedef {'match' | 'training' | 'general'} AgendaScope */

/**
 * @typedef {{
 *   id: string,
 *   severity: AgendaSeverity,
 *   scope: AgendaScope,
 *   title: string,
 *   detail: string,
 *   screen: string,
 *   tab: string | null,
 * }} AdvanceAgendaItem
 */

export const ADVANCE_REMINDER_MODES = ["before_matches", "all_events", "minimal"];

/** @param {object} career */
export function advanceReminderMode(career) {
  const m = career?.options?.advanceReminders;
  return ADVANCE_REMINDER_MODES.includes(m) ? m : "before_matches";
}

/** Stable id for the next incomplete calendar event (snooze target). */
export function nextEventAgendaSignature(career) {
  const ev = (career?.eventQueue || []).find((e) => !e.completed);
  if (!ev) return "calendar:none";
  return [
    ev.type,
    ev.subtype ?? "",
    String(ev.round ?? ""),
    ev.date ?? "",
    ev.name ?? "",
    ev.label ?? "",
  ].join(":");
}

function lineupFieldFilled(lineup) {
  return (lineup || [])
    .slice(0, LINEUP_FIELD_COUNT)
    .filter((id) => id != null && id !== "").length;
}

function pendingRenewalCount(career) {
  const players = (career.pendingRenewals || []).filter((r) => !r._handled).length;
  const staff = (career.pendingStaffRenewals || []).filter((r) => !r._handled).length;
  return players + staff;
}

function isSnoozedForNextEvent(career, itemId, sig) {
  const snooze = career?.advanceAgendaSnooze;
  if (!snooze || typeof snooze !== "object") return false;
  return snooze[itemId] === sig;
}

function nextIncompleteEvent(career) {
  return (career?.eventQueue || []).find((e) => !e.completed) ?? null;
}

function isMatchLikeEvent(ev) {
  return ev?.type === "round" || ev?.type === "preseason_match";
}

function isTrainingEvent(ev) {
  return ev?.type === "training";
}

/**
 * Raw agenda items (before snooze / preference filtering).
 * @param {object} career
 * @param {object} [league]
 * @returns {AdvanceAgendaItem[]}
 */
export function getAdvanceAgenda(career, league) {
  if (!career?.clubId) return [];

  const ctx = getAdvanceContext(career, league);
  if (ctx.mode === "trade_period" || ctx.mode === "draft_countdown" || ctx.mode === "finals") {
    return buildOffSeasonAgenda(career);
  }

  const nextEv = nextIncompleteEvent(career);
  const items = [];

  if (nextEv && isMatchLikeEvent(nextEv)) {
    const nLineup = lineupPlayerCount(career.lineup);
    const nField = lineupFieldFilled(career.lineup);
    if (nField < LINEUP_FIELD_COUNT) {
      items.push({
        id: "lineup_field",
        severity: nField < Math.floor(LINEUP_FIELD_COUNT * 0.6) ? "warn" : "info",
        scope: "match",
        title: "On-field lineup incomplete",
        detail: `${nField}/${LINEUP_FIELD_COUNT} on-field slots filled — match strength drops with a short XVIII.`,
        screen: "squad",
        tab: null,
      });
    } else if (nLineup < LINEUP_CAP) {
      items.push({
        id: "lineup_bench",
        severity: "info",
        scope: "match",
        title: "Match squad short on bench",
        detail: `${nLineup}/${LINEUP_CAP} in match squad — interchange depth may hurt late quarters.`,
        screen: "squad",
        tab: null,
      });
    }

    const tasks = ensureStaffTasks(career);
    if ((tasks.matchPrepTier ?? 0) === 0) {
      items.push({
        id: "match_prep",
        severity: "info",
        scope: "match",
        title: "No extra match prep set",
        detail: "Staff → match prep tier is baseline. Raise it before a big fixture for analyst-driven edges.",
        screen: "club",
        tab: "staff",
      });
    }
  }

  if (nextEv && isTrainingEvent(nextEv)) {
    const tasks = ensureStaffTasks(career);
    if (!tasks.trainingLeadId) {
      items.push({
        id: "training_lead",
        severity: "info",
        scope: "training",
        title: "No training lead assigned",
        detail: "Assign a training lead on Club → Staff so weekly loads get coaching bonuses.",
        screen: "club",
        tab: "staff",
      });
    }
  }

  const renewals = pendingRenewalCount(career);
  if (renewals > 0) {
    items.push({
      id: "renewals",
      severity: renewals >= 3 ? "warn" : "info",
      scope: "general",
      title: `${renewals} renewal${renewals === 1 ? "" : "s"} pending`,
      detail: "Contract queue still open — pre-season windows lock once the season starts.",
      screen: "club",
      tab: "contracts",
    });
  }

  const cap = effectiveWageCap(career);
  const bill = currentPlayerWageBill(career);
  if (cap > 0) {
    const pct = bill / cap;
    if (pct > 1) {
      items.push({
        id: "cap_over",
        severity: "warn",
        scope: "general",
        title: "Player wages over cap",
        detail: `List at ${Math.round(pct * 100)}% of cap — board pressure after matches until you trim.`,
        screen: "club",
        tab: "contracts",
      });
    } else if (pct >= 0.9) {
      items.push({
        id: "cap_tight",
        severity: "info",
        scope: "general",
        title: "Salary cap is tight",
        detail: `${Math.round(pct * 100)}% of player cap used — little headroom for renewals or trades.`,
        screen: "club",
        tab: "finances",
      });
    }
  }

  const crisis = cashCrisisLevel(career);
  if (crisis >= 1 || (career.finance?.cash ?? 0) < 0) {
    items.push({
      id: "cash_crisis",
      severity: crisis >= 2 ? "warn" : "info",
      scope: "general",
      title: crisis >= 2 ? "Cash emergency" : "Operating in the red",
      detail:
        crisis >= 3
          ? "Deep cash crisis — board may force sales or sack if weeks drag on."
          : "Negative cash — check income, sponsors, and wage bill before you advance.",
      screen: "club",
      tab: "finances",
    });
  }

  return items;
}

function buildOffSeasonAgenda(career) {
  const items = [];
  const renewals = pendingRenewalCount(career);
  if (renewals > 0) {
    items.push({
      id: "renewals",
      severity: "warn",
      scope: "general",
      title: `${renewals} renewal${renewals === 1 ? "" : "s"} pending`,
      detail: "Clear the contract queue before list rules tighten for the new season.",
      screen: "club",
      tab: "contracts",
    });
  }
  return items;
}

function shouldShowAgendaModal(career, nextEv) {
  const mode = advanceReminderMode(career);
  if (mode === "minimal") return false;
  if (mode === "all_events") return true;
  // before_matches
  if (!nextEv) return false;
  return isMatchLikeEvent(nextEv) || isTrainingEvent(nextEv);
}

/**
 * Agenda after snooze + user preference (what the modal should list).
 * @param {object} career
 * @param {object} [league]
 * @returns {AdvanceAgendaItem[]}
 */
export function getVisibleAdvanceAgenda(career, league) {
  if (advanceReminderMode(career) === "minimal") return [];
  const sig = nextEventAgendaSignature(career);
  const nextEv = nextIncompleteEvent(career);
  if (!shouldShowAgendaModal(career, nextEv)) return [];

  return getAdvanceAgenda(career, league).filter((item) => !isSnoozedForNextEvent(career, item.id, sig));
}

/** Modal title tied to next calendar step. */
export function advanceAgendaModalTitle(career, league) {
  const ctx = getAdvanceContext(career, league);
  const short = ctx.nextEventShort || "next step";
  return `Before ${short}`;
}

/**
 * Merge snooze keys for visible items (don't remind for this upcoming event).
 * @param {object} career
 * @param {string[]} itemIds
 */
export function snoozeAdvanceAgendaItems(career, itemIds) {
  const sig = nextEventAgendaSignature(career);
  const prev = career.advanceAgendaSnooze && typeof career.advanceAgendaSnooze === "object"
    ? { ...career.advanceAgendaSnooze }
    : {};
  for (const id of itemIds) prev[id] = sig;
  return { advanceAgendaSnooze: prev };
}
