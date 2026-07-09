// ---------------------------------------------------------------------------
// Steam-facing achievements. A FIXED, enumerated catalog with STABLE ids — each
// id is the achievement's API name in the Steamworks schema, so once shipped an
// id must never change. evaluateAchievements() derives the earned set purely
// from already-persisted career state (coachStats, season history, aflw,
// finance/board), adding no new per-event tracking; syncAchievements() diffs it
// against the stored unlocked set and returns the ids newly earned this call —
// exactly what a Steam binding hands to SetAchievement(), and what we surface as
// news. Deterministic: no rng, no clock.
// ponytail: unlock-at-the-moment semantics (Steam-native). Achievements derived
// from persisted counters/history back-fill on any later evaluate; one derived
// from a purely transient season flag unlocks the next time that event recurs,
// not retroactively. Upgrade path: stamp the new signal into c.history (as
// woodenSpoon/debtFree are below) or a persisted counter, and it back-fills too.
// ---------------------------------------------------------------------------
import { PYRAMID } from '../data/pyramid.js';

const tierOfLeagueKey = (key) => PYRAMID[key]?.tier ?? null;

export const ACHIEVEMENTS = [
  { id: 'FIRST_FLAG',     name: 'Premiers',      desc: 'Win your first premiership.' },
  { id: 'BACK_TO_BACK',   name: 'Back-to-Back',  desc: 'Win the flag in two consecutive seasons.' },
  { id: 'DYNASTY',        name: 'Dynasty',       desc: 'Win five premierships.' },
  { id: 'ON_THE_RISE',    name: 'On the Rise',   desc: 'Earn promotion to a higher division.' },
  { id: 'THE_BIG_TIME',   name: 'The Big Time',  desc: 'Reach the AFL (Tier 1).' },
  { id: 'FROM_THE_ASHES', name: 'From the Ashes',desc: 'Win a premiership after a wooden-spoon season.' },
  { id: 'AFLW_FLAG',      name: 'AFLW Premiers', desc: 'Win an AFLW premiership.' },
  { id: 'CENTURION',      name: 'Centurion',     desc: 'Coach 100 games.' },
  { id: 'CLUB_LEGEND',    name: 'Club Legend',   desc: 'Coach for ten seasons.' },
  { id: 'SOUND_BOOKS',    name: 'Sound Books',   desc: 'Win a flag with the club debt-free and in the black.' },
  { id: 'BLOODLINE',      name: 'Bloodline',     desc: 'Recruit a father-son prospect.' },
  { id: 'VISIONARY',      name: 'Visionary',     desc: 'Fulfil the board’s multi-year vision.' },
];

export const ACHIEVEMENT_IDS = ACHIEVEMENTS.map((a) => a.id);

/** Pure: the Set of achievement ids currently earned from persisted state. */
export function evaluateAchievements(career) {
  const c = career || {};
  const earned = new Set();
  const stats = c.coachStats || {};
  const history = Array.isArray(c.history) ? c.history : [];

  const flags = stats.premierships ?? 0;
  if (flags >= 1) earned.add('FIRST_FLAG');
  if (flags >= 5) earned.add('DYNASTY');

  // Back-to-back: two consecutive seasons both won by us.
  const champSeasons = history.filter((h) => h.champion).map((h) => h.season).sort((a, b) => a - b);
  if (champSeasons.some((s, i) => i > 0 && s - champSeasons[i - 1] === 1)) earned.add('BACK_TO_BACK');

  if ((stats.promotions ?? 0) >= 1) earned.add('ON_THE_RISE');

  // Reached the top tier — from the current league or any past season's league.
  if (tierOfLeagueKey(c.leagueKey) === 1 || history.some((h) => tierOfLeagueKey(h.leagueKey) === 1)) {
    earned.add('THE_BIG_TIME');
  }

  // Spoon → flag: a wooden-spoon season strictly before a premiership season.
  const firstSpoon = history.filter((h) => h.woodenSpoon).map((h) => h.season).sort((a, b) => a - b)[0];
  if (firstSpoon != null && champSeasons.some((s) => s > firstSpoon)) earned.add('FROM_THE_ASHES');

  if ((c.aflw?.premierships ?? 0) >= 1) earned.add('AFLW_FLAG');

  const games = (stats.totalWins ?? 0) + (stats.totalLosses ?? 0) + (stats.totalDraws ?? 0);
  if (games >= 100) earned.add('CENTURION');
  if ((stats.seasonsManaged ?? 0) >= 10) earned.add('CLUB_LEGEND');

  if (history.some((h) => h.champion && h.debtFree)) earned.add('SOUND_BOOKS');
  if ((c.fatherSonPipeline?.length ?? 0) > 0) earned.add('BLOODLINE');
  if ((c.board?.visionsAchieved ?? 0) >= 1) earned.add('VISIONARY');

  return earned;
}

/**
 * Reconcile persisted unlocks with the current state. Stores the full unlocked
 * id list (in catalog order) on `career.achievements` and returns the ids newly
 * earned this call — the ones a Steam binding should push, surfaced as news.
 */
export function syncAchievements(career) {
  if (!career) return [];
  const already = new Set(Array.isArray(career.achievements) ? career.achievements : []);
  const earned = evaluateAchievements(career);
  const newly = [];
  for (const id of earned) {
    if (!already.has(id)) { already.add(id); newly.push(id); }
  }
  career.achievements = ACHIEVEMENT_IDS.filter((id) => already.has(id)); // stable catalog order
  if (newly.length) {
    const byId = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
    career.news = [
      ...newly.map((id) => ({
        week: career.week ?? 0,
        type: 'win',
        text: `🏅 Achievement unlocked: ${byId[id].name} — ${byId[id].desc}`,
      })),
      ...(career.news || []),
    ].slice(0, 25);
  }
  return newly;
}
