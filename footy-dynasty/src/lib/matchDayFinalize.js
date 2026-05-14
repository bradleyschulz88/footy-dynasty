// Apply deferred ladder / fixture result after the player finishes MatchDayScreen.
import { applyResultToLadder } from "./leagueEngine.js";

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
