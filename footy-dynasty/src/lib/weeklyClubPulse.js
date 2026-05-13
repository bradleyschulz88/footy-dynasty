import { rng, pick } from "./rng.js";
import { clamp, avgFacilities, avgStaff } from "./format.js";

/** Ladder/table position goal for dynasty arc (exclusive of finals). */
export function dynastyLadderCutoff(totalTeams, leagueTier) {
  if (!totalTeams || totalTeams < 1) return 1;
  if (leagueTier === 1) return Math.min(8, totalTeams);
  if (leagueTier === 2) return Math.min(6, totalTeams);
  return Math.max(1, Math.ceil(totalTeams / 2));
}

/**
 * Once per finance day tick: ties staff development to infrastructure and nags when infra lags salaries.
 */
export function weeklyClubOperationsPulse(career, leagueTier) {
  if (!career?.facilities || !Array.isArray(career.staff)) return;

  let facAvg = 1;
  try {
    facAvg = avgFacilities(career.facilities);
  } catch {
    facAvg = 1;
  }

  let staffAvg = 60;
  try {
    staffAvg = career.staff.length ? avgStaff(career.staff) : 60;
  } catch {
    staffAvg = 60;
  }

  const gap = facAvg - staffAvg / 28;

  const paidStaff = career.staff.filter((s) => !s.volunteer && typeof s.rating === "number");
  if (paidStaff.length > 0 && gap > 1.05 && rng() < 0.085) {
    const target = [...paidStaff].sort((a, b) => a.rating - b.rating)[0];
    const next = clamp(target.rating + 1, 30, Math.min(82, target.rating + 6));
    if (next > target.rating) {
      career.staff = career.staff.map((s) => (s.id === target.id ? { ...s, rating: next } : s));
      career.news = [
        {
          week: career.week ?? 0,
          type: "info",
          text: `📈 Facilities are carrying sessions — ${target.role.split("(")[0].trim()} sharpens drills (+1 staff rating).`,
        },
        ...(career.news || []),
      ].slice(0, 20);
      return;
    }
  }

  if (gap < -0.35 && rng() < 0.055) {
    const line =
      leagueTier <= 2
        ? "⚙️ High-performance staff are stretched — recovery pods and gyms need dollars if you want the edge."
        : "⚙️ Volunteers covering pro workloads — clubhouse wiring and sheds are creaking.";
    career.news = [{ week: career.week ?? 0, type: "info", text: line }, ...(career.news || [])].slice(0, 20);
    return;
  }

  if (facAvg >= 4 && rng() < 0.04) {
    career.groundCondition = clamp((career.groundCondition ?? 85) + 1, 50, 100);
    career.news = [
      {
        week: career.week ?? 0,
        type: "info",
        text: `🏟 Ground staff leaned on irrigation and turf budgets — oval edges up (${career.groundCondition}).`,
      },
      ...(career.news || []),
    ].slice(0, 20);
  } else if (facAvg <= 2.2 && rng() < 0.04) {
    const name = paidStaff.length ? pick(paidStaff).name : "committee";
    career.news = [
      {
        week: career.week ?? 0,
        type: "info",
        text: `🌧 Drainage grunt work falls to ${name} — low-tier facilities make wet weeks heavier.`,
      },
      ...(career.news || []),
    ].slice(0, 20);
  }
}
