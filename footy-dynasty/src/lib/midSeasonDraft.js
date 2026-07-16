// Mid-season draft — the AFL's in-season top-up (introduced 2019). Around the
// bye rounds, clubs may add one player to cover long-term injuries or a thin
// list. The player is offered a small pool and signs one or passes.

import { generatePlayer } from "./playerGen.js";
import { seedRng, rand } from "./rng.js";
import { MAX_SQUAD_SIZE } from "./listRules.js";

// The round the mid-season draft opens (mid-year, around the byes).
export const MID_SEASON_DRAFT_ROUND = 12;

/** Longest-term injuries suggest a real need for a top-up. */
function seasonEndingInjuries(squad) {
  return (squad || []).filter((p) => (p.injured ?? 0) >= 6).length;
}

/**
 * Decide whether to open the mid-season draft for tier-1 careers and, if so,
 * build a small pool. Returns a blocking descriptor or null. Deterministic per
 * season so it's stable across re-renders.
 */
export function maybeOpenMidSeasonDraft(career, league) {
  if ((league?.tier ?? 2) !== 1) return null;
  if (career.midSeasonDraftDone) return null;
  const squad = career.squad || [];
  // Always available (like the real thing), but only worth surfacing when the
  // list has room to actually add a player.
  if (squad.length >= MAX_SQUAD_SIZE) return null;

  seedRng((career.season || 2026) * 613 + 29);
  const poolSize = 4;
  const injuries = seasonEndingInjuries(squad);
  const pool = Array.from({ length: poolSize }, (_, i) => {
    const p = generatePlayer(1, 15000 + i + (career.season || 0) * 41, {
      clubId: "midSeasonDraft",
      season: career.season,
    });
    // Mid-season pool = fringe/depth talent (overrides high generated overalls).
    const target = rand(58, 74);
    const scale = target / Math.max(1, p.overall);
    const attrs = {};
    Object.entries(p.attrs || {}).forEach(([k, v]) => {
      attrs[k] = Math.max(30, Math.min(99, Math.round(v * scale)));
    });
    const overall = Math.round(Object.values(attrs).reduce((a, b) => a + b, 0) / 8);
    return { ...p, attrs, overall, trueRating: overall, contract: 1, rookie: p.age <= 21 };
  });

  return {
    round: MID_SEASON_DRAFT_ROUND,
    season: career.season,
    reason: injuries > 0
      ? `${injuries} player${injuries === 1 ? "" : "s"} out long-term — a mid-season top-up is available.`
      : "The mid-season draft window is open — you can add depth to the list.",
    pool,
  };
}

/**
 * Resolve the mid-season draft: sign one prospect (by id) or pass (null).
 * Returns a career patch. Marks the window done either way.
 * @returns {{ squad?: object[], midSeasonDraftDone: boolean, news: object[], signedName?: string }}
 */
export function resolveMidSeasonDraft(career, prospectId) {
  const blocking = career.midSeasonDraftBlocking;
  const week = career.week ?? MID_SEASON_DRAFT_ROUND;
  if (!blocking) return { midSeasonDraftDone: true, news: career.news || [] };

  const chosen = prospectId ? (blocking.pool || []).find((p) => p.id === prospectId) : null;
  if (!chosen || (career.squad || []).length >= MAX_SQUAD_SIZE) {
    return {
      midSeasonDraftDone: true,
      midSeasonDraftBlocking: null,
      news: [{ week, type: "info", text: "📋 Passed on the mid-season draft — no additions this window." }, ...(career.news || [])].slice(0, 20),
    };
  }
  const signed = { ...chosen, receivedInTrade: career.season, gamesPlayed: 0 };
  return {
    midSeasonDraftDone: true,
    midSeasonDraftBlocking: null,
    signedName: `${signed.firstName} ${signed.lastName}`,
    squad: [...(career.squad || []), signed],
    news: [{ week, type: "win", text: `📋 Mid-season draft: signed ${signed.firstName} ${signed.lastName} (${signed.position}, ${signed.overall}).` }, ...(career.news || [])].slice(0, 20),
  };
}
