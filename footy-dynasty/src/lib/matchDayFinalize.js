// Apply deferred ladder / fixture result after the player finishes MatchDayScreen.
import { applyResultToLadder } from "./leagueEngine.js";
import { clamp } from "./format.js";
import { rand } from "./rng.js";

/**
 * Commit `pendingPlayerMatchResult` to ladder + completed round fixture.
 * @returns {object | null} patch fields to merge into career, or null if nothing pending
 */
export function buildPendingPlayerMatchPatch(career) {
  const pending = career?.pendingPlayerMatchResult;
  if (!pending) return null;

  const { home, away, homeTotal, awayTotal, round } = pending;
  const patch = {
    pendingPlayerMatchResult: null,
    ladder: applyResultToLadder(career.ladder, home, away, homeTotal, awayTotal),
  };

  if (round != null && Array.isArray(career.eventQueue)) {
    patch.eventQueue = career.eventQueue.map((ev) => {
      if (ev.type !== "round" || ev.round !== round || !ev.matches) return ev;
      return {
        ...ev,
        matches: ev.matches.map((m) => {
          if (m.home === home && m.away === away) {
            return { ...m, result: { hScore: homeTotal, aScore: awayTotal } };
          }
          return m;
        }),
      };
    });
  }

  return patch;
}

/** Post-match rest — lineup players recover fitness after the match week. */
export function applyPostMatchSquadRecovery(career) {
  const squad = career?.squad;
  if (!Array.isArray(squad) || !squad.length) return {};

  const recoveryFocus = career.training?.focus?.recovery ?? 20;
  const medLevel = career.facilities?.medical?.level ?? 1;
  const recoveryFac = career.facilities?.recovery?.level ?? 1;
  const lineup = new Set(career.lineup || []);

  return {
    squad: squad.map((p) => {
      const played = lineup.has(p.id);
      const baseGain = played ? rand(8, 14) : rand(4, 8);
      const bonus = Math.round(recoveryFocus * 0.06) + medLevel * 2 + recoveryFac * 2;
      return {
        ...p,
        fitness: clamp((p.fitness ?? 90) + baseGain + bonus, 30, 100),
        injured: Math.max(0, (p.injured ?? 0) - (played ? 0 : 1)),
      };
    }),
  };
}

/** Full patch when leaving MatchDay / PostMatchSummary. */
export function buildMatchDayExitPatch(career) {
  return {
    ...(buildPendingPlayerMatchPatch(career) || {}),
    ...applyPostMatchSquadRecovery(career),
    inMatchDay: false,
    currentMatchResult: null,
    lastMatchSummary: null,
  };
}
