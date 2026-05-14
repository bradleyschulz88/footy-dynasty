// List size categories and salary-cap breach handling.

import { currentPlayerWageBill, effectiveWageCap } from './finance/engine.js';

export const MAX_SQUAD_SIZE = 40;
export const SENIOR_LIST_MAX = 38;
export const ROOKIE_LIST_MAX = 6;

/** Count players by list category. */
export function listCounts(squad) {
  const s = squad || [];
  const rookies = s.filter((p) => p.rookie || p.listCategory === 'rookie').length;
  const senior = s.length - rookies;
  return { total: s.length, senior, rookie: rookies };
}

/** Can add a player to the list? */
export function canAddToList(career, { rookie = false } = {}) {
  const { total, senior, rookie: rCount } = listCounts(career.squad);
  if (total >= MAX_SQUAD_SIZE) return { ok: false, reason: 'squad_full' };
  if (rookie) {
    if (rCount >= ROOKIE_LIST_MAX) return { ok: false, reason: 'rookie_full' };
  } else if (senior >= SENIOR_LIST_MAX) {
    return { ok: false, reason: 'senior_full' };
  }
  return { ok: true };
}

/** Cap usage ratio 0–1+. */
export function capUsageRatio(career, league) {
  const cap = effectiveWageCap(career, league);
  if (!cap) return 0;
  return currentPlayerWageBill(career.squad) / cap;
}

/**
 * If over cap at season checkpoint, return sanctions patch.
 * Preventive signing blocks remain primary; this handles drift.
 */
export function capBreachSanctionPatch(career, league) {
  const ratio = capUsageRatio(career, league);
  if (ratio <= 1.02) return null;

  const overPct = Math.round((ratio - 1) * 100);
  const squad = [...(career.squad || [])];
  const tradable = squad
    .filter((p) => !p.rookie && (p.overall ?? 99) < 72)
    .sort((a, b) => (b.wage ?? 0) - (a.wage ?? 0));
  const delist = tradable[0];
  if (!delist) return null;

  const nextSquad = squad.filter((p) => p.id !== delist.id);
  return {
    squad: nextSquad,
    news: [{
      week: career.week,
      type: 'board',
      text: `⚖️ Salary cap breach (${overPct}% over) — board forced delisting of ${delist.firstName} ${delist.lastName}.`,
    }, ...(career.news || [])].slice(0, 20),
    memberConfidence: Math.max(0, (career.memberConfidence ?? 60) - 8),
  };
}
