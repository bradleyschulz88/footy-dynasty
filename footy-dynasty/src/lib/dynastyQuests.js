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

// ---------- Legacy (cross-season) milestones ----------

const LEGACY_MILESTONE_TEMPLATES = [
  { id: "legacy_wins_50",   kind: "career_wins",     label: "Win 50 career games",                  target: 50,  repAward: 8  },
  { id: "legacy_wins_100",  kind: "career_wins",     label: "Win 100 career games",                 target: 100, repAward: 15 },
  { id: "legacy_wins_200",  kind: "career_wins",     label: "Win 200 career games",                 target: 200, repAward: 25 },
  { id: "legacy_flag_1",    kind: "premierships",    label: "Win your first premiership",           target: 1,   repAward: 20 },
  { id: "legacy_flag_3",    kind: "premierships",    label: "Win 3 premierships",                   target: 3,   repAward: 30 },
  { id: "legacy_flag_5",    kind: "premierships",    label: "Build a dynasty — 5 premierships",     target: 5,   repAward: 50 },
  { id: "legacy_seasons_5", kind: "seasons_managed", label: "Coach for 5 seasons",                  target: 5,   repAward: 8  },
  { id: "legacy_seasons_10",kind: "seasons_managed", label: "Coach for 10 seasons",                 target: 10,  repAward: 15 },
];

/** Initialises milestones once per career (not reset each season). */
export function ensureLegacyMilestones(career, leagueTier) {
  ensureDynastyState(career);
  if (Array.isArray(career.dynasty.milestones)) return;
  const startTier = leagueTier ?? 3;
  career.dynasty.startTier = career.dynasty.startTier ?? startTier;
  career.dynasty.careerWins = career.dynasty.careerWins ?? 0;
  const templates = [...LEGACY_MILESTONE_TEMPLATES];
  if (startTier > 2) templates.push({ id: "legacy_tier2", kind: "tier_reached", label: "Rise to Tier 2 (state league)", target: 2, repAward: 12 });
  if (startTier > 1) templates.push({ id: "legacy_tier1", kind: "tier_reached", label: "Reach the AFL (Tier 1)",          target: 1, repAward: 25 });
  career.dynasty.milestones = templates.map((t) => ({ ...t, progress: 0, complete: false, announced: false }));
}

/** Call after every regular-season win (alongside dynastyRecordHomeAwayWin). */
export function recordCareerWin(career) {
  if (!Array.isArray(career.dynasty?.milestones)) return;
  career.dynasty.careerWins = (career.dynasty.careerWins ?? 0) + 1;
  const wins = career.dynasty.careerWins;
  for (const m of career.dynasty.milestones) {
    if (m.complete || m.kind !== "career_wins") continue;
    m.progress = wins;
    if (wins >= m.target) {
      m.complete = true;
      career.coachReputation = clamp((career.coachReputation ?? 30) + (m.repAward || 5), 0, 100);
      career.coachTier = coachTierFromScore(career.coachReputation);
      career.dynasty.lifetimeGoals += 1;
      pushDynastyNews(career, `Legacy milestone: "${m.label}" — reputation +${m.repAward}.`);
      m.announced = true;
    }
  }
}

/** Call at season end after coachStats has been updated. */
export function checkLegacyMilestonesAfterSeason(career, leagueTier) {
  if (!Array.isArray(career.dynasty?.milestones)) return;
  const premierships = career.coachStats?.premierships ?? 0;
  const seasons = career.coachStats?.seasonsManaged ?? 1;
  const tier = leagueTier ?? 3;
  for (const m of career.dynasty.milestones) {
    if (m.complete) continue;
    let shouldComplete = false;
    if (m.kind === "premierships") {
      m.progress = premierships;
      shouldComplete = premierships >= m.target;
    } else if (m.kind === "seasons_managed") {
      m.progress = seasons;
      shouldComplete = seasons >= m.target;
    } else if (m.kind === "tier_reached") {
      shouldComplete = tier <= m.target;
    }
    if (shouldComplete) {
      m.complete = true;
      career.coachReputation = clamp((career.coachReputation ?? 30) + (m.repAward || 5), 0, 100);
      career.coachTier = coachTierFromScore(career.coachReputation);
      career.dynasty.lifetimeGoals += 1;
      pushDynastyNews(career, `Legacy milestone: "${m.label}" — reputation +${m.repAward}.`);
      m.announced = true;
    }
  }
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
