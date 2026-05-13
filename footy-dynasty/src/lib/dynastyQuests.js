import { clamp } from "./format.js";
import { coachTierFromScore } from "./coachReputation.js";
import { dynastyLadderCutoff } from "./weeklyClubPulse.js";

export function ensureDynastyState(career) {
  if (!career.dynasty || typeof career.dynasty !== "object") {
    career.dynasty = { seasonKey: null, quests: [], lifetimeGoals: 0 };
  }
  if (!Array.isArray(career.dynasty.quests)) career.dynasty.quests = [];
  if (typeof career.dynasty.lifetimeGoals !== "number") career.dynasty.lifetimeGoals = 0;
}

/** Call on load / advance so migrated saves receive quests for the current season. */
export function ensureDynastyAssignments(career, leagueTier, teamCount) {
  ensureDynastyState(career);
  const t = leagueTier ?? 3;
  const tc = typeof teamCount === "number" && teamCount >= 4 ? teamCount : undefined;
  if (
    career.dynasty.seasonKey !== career.season ||
    career.dynasty.quests.length === 0
  ) {
    assignDynastyQuestsForSeason(career, t, tc);
  }
}

export function assignDynastyQuestsForSeason(career, leagueTier, teamCount) {
  ensureDynastyState(career);
  const tier = leagueTier ?? 3;
  const n = typeof teamCount === "number" && teamCount >= 4 ? Math.floor(teamCount) : tier === 1 ? 18 : tier === 2 ? 12 : 10;
  const winsTarget = tier === 1 ? 11 : tier === 2 ? 7 : tier === 3 ? 5 : 6;
  const rankCap = dynastyLadderCutoff(n, tier);
  career.dynasty.seasonKey = career.season;
  career.dynasty.quests = [
    {
      id: `dyn_win_${career.season}_${n}`,
      kind: "wins",
      label: tier === 1 ? `${winsTarget}+ HA wins this season` : tier === 2 ? `${winsTarget}+ competition wins` : `${winsTarget}+ wins locally`,
      target: winsTarget,
      progress: 0,
      complete: false,
      repAward: 5,
      announced: false,
    },
    {
      id: `dyn_ladder_${career.season}_${n}`,
      kind: "ladder_pos",
      label: `Finish regular season inside top ${rankCap} (${n} clubs)`,
      targetRank: rankCap,
      complete: false,
      repAward: 6,
      announced: false,
    },
  ];
}

export function dynastyRecordHomeAwayWin(career) {
  ensureDynastyState(career);
  let changed = false;
  for (const q of career.dynasty.quests) {
    if (q.complete || q.kind !== "wins") continue;
    q.progress = (q.progress || 0) + 1;
    changed = true;
    if (q.progress >= q.target) {
      q.complete = true;
      career.coachReputation = clamp((career.coachReputation ?? 30) + (q.repAward || 5), 0, 100);
      career.coachTier = coachTierFromScore(career.coachReputation);
      career.dynasty.lifetimeGoals += 1;
      pushDynastyNews(
        career,
        `Dynasty goal: "${q.label}" complete — reputation +${q.repAward}.`,
      );
      q.announced = true;
    }
  }
  return changed;
}

/** End of regular calendar year before season rollover (still on ended season ladder). */
export function finalizeDynastyLadderAtSeasonEnd(career, myPosition, totalTeams, leagueTier) {
  ensureDynastyState(career);
  for (const q of career.dynasty.quests) {
    if (q.complete || q.kind !== "ladder_pos") continue;
    const cap =
      typeof q.targetRank === "number" && q.targetRank > 0
        ? q.targetRank
        : dynastyLadderCutoff(totalTeams ?? 14, leagueTier ?? 3);
    if (typeof myPosition === "number" && myPosition > 0 && myPosition <= cap) {
      q.complete = true;
      career.coachReputation = clamp((career.coachReputation ?? 30) + (q.repAward || 6), 0, 100);
      career.coachTier = coachTierFromScore(career.coachReputation);
      career.dynasty.lifetimeGoals += 1;
      pushDynastyNews(
        career,
        `Dynasty goal: ladder placement sealed (you finished #${myPosition}) — reputation +${q.repAward}.`,
      );
      q.announced = true;
    }
  }
}

function pushDynastyNews(career, text) {
  career.news = [{ week: career.week ?? 0, type: "win", text: `⭐ ${text}` }, ...(career.news || [])].slice(0, 22);
}
