import { getClubGround } from "../data/grounds.js";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function getWeatherTag(career, week) {
  const w = career?.weeklyWeather?.[week];
  return typeof w === "string" ? w : "fine";
}

function weatherHomeEffect(weather, roofed) {
  if (roofed) return 0;
  if (weather === "rain") return -0.9;
  if (weather === "wind") return -0.45;
  return 0;
}

/**
 * Expected attendance for display / fill rate (heuristic — no membership table yet).
 */
export function calculateExpectedCrowd(career, league, ground) {
  const cap = Math.max(ground.capacity || 3000, 800);
  const tier = league?.tier ?? 2;
  const tierFill =
    tier === 1 ? 0.68 + (career.coachReputation ?? 30) / 500
      : tier === 2 ? 0.38 + (career.coachReputation ?? 30) / 600
        : 0.22 + (career.coachReputation ?? 30) / 700;
  const fan = (career.finance?.fanHappiness ?? 55) / 100;
  const board = (career.finance?.boardConfidence ?? 55) / 100;
  const mood = clamp((fan + board) / 2, 0.35, 1.15);
  const streak = career.winStreak ?? 0;
  const formFactor = streak >= 3 ? 1.08 : streak <= -3 ? 0.88 : 1;
  const finals = career.inFinals ? 1.14 : 1;
  const w = getWeatherTag(career, career.week ?? 0);
  const weatherPenalty = w === "rain" ? 0.82 : w === "wind" ? 0.92 : 1;
  const raw = cap * tierFill * mood * formFactor * finals * weatherPenalty;
  return Math.min(Math.round(raw), cap);
}

/**
 * Dynamic home-ground advantage (rating points) when the human hosts.
 */
export function homeAdvantagePlayerCareer(career, league, ground) {
  const tier = league?.tier ?? 2;
  const base =
    ground.homeAdvantageBase ?? (tier === 1 ? 8 : tier === 2 ? 5 : 3);
  const expected = calculateExpectedCrowd(career, league, ground);
  const fillRate = clamp(expected / Math.max(ground.capacity, 1), 0.08, 1);
  const crowdBonus = fillRate * 4;
  const homeStreak = career.homeWinStreak ?? 0;
  const fortressBonus =
    homeStreak >= 10 ? 3 : homeStreak >= 5 ? 2 : homeStreak >= 3 ? 1 : 0;
  const gc = career.groundCondition ?? 85;
  const conditionPenalty = gc < 50 ? -2 : gc < 70 ? -1 : 0;
  const finalsBonus = career.inFinals ? 2 : 0;
  const w = getWeatherTag(career, career.week ?? 0);
  const wx = weatherHomeEffect(w, !!ground.roofed);
  return clamp(
    base + crowdBonus + fortressBonus + conditionPenalty + finalsBonus + wx,
    1,
    14,
  );
}

/**
 * Home advantage when an AI club hosts (no career object).
 */
export function homeAdvantageAiHome(league, ground, inFinals = false, weather = "fine") {
  const tier = league?.tier ?? 2;
  const base =
    ground.homeAdvantageBase ?? (tier === 1 ? 8 : tier === 2 ? 5 : 3);
  const fillRate = tier === 1 ? 0.64 : tier === 2 ? 0.48 : 0.35;
  const crowdBonus = fillRate * 4;
  const finalsBonus = inFinals ? 2 : 0;
  const wx = weatherHomeEffect(weather, !!ground.roofed);
  const conditionPenalty = -0.5; // neutral slight wear for AI deck
  return clamp(base + crowdBonus + finalsBonus + conditionPenalty + wx, 1, 12);
}

/**
 * @param {import('../data/pyramid.js').ClubLike|null} playerClub
 * @param {import('../data/pyramid.js').ClubLike|null} oppClub
 */
export function resolveHomeAdvantageForFixture(
  career,
  league,
  isPlayerHome,
  playerClub,
  oppClub,
) {
  const stadiumLevel = career?.facilities?.stadium?.level ?? 1;
  const week = career?.week ?? 0;
  const weather =
    typeof career?.weeklyWeather?.[week] === "string"
      ? career.weeklyWeather[week]
      : "fine";

  if (isPlayerHome) {
    const ground =
      career.clubGround ||
      getClubGround(playerClub, stadiumLevel, league?.tier);
    return homeAdvantagePlayerCareer(career, league, ground);
  }
  const oppGround = getClubGround(oppClub, 3, league?.tier);
  return homeAdvantageAiHome(league, oppGround, !!career.inFinals, weather);
}
