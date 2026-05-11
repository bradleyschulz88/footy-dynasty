// ---------------------------------------------------------------------------
// AI club squads — generation, ageing, mid-season rotation
// ---------------------------------------------------------------------------
import { generateSquad, generatePlayer } from './playerGen.js';
import { rand, rng, TIER_SCALE } from './rng.js';
import { selectBalancedLineup } from './lineupBalance.js';
import { competitionClubsForCareer } from './leagueEngine.js';
import { LINEUP_CAP } from './lineupHelpers.js';

const SQUAD_SIZE = 32;

// Build initial squads for every club in a league
export function ensureSquadsForLeague(career, league) {
  const out = { ...(career.aiSquads || {}) };
  let changed = false;
  const pool = competitionClubsForCareer(career);
  const iter = pool.length ? pool : (league.clubs || []);
  for (const c of iter) {
    if (c.id === career.clubId) continue;
    if (!out[c.id] || out[c.id].length === 0) {
      out[c.id] = generateSquad(c.id, league.tier, SQUAD_SIZE, career.season || 2026);
      changed = true;
    }
  }
  return changed ? out : career.aiSquads || out;
}

// Compute an AI club's match-day rating from its real squad
export function aiClubRatingFromSquad(squad) {
  if (!squad || squad.length === 0) return null;
  const topForClub = [...squad].sort((a, b) => (b.trueRating || b.overall) - (a.trueRating || a.overall)).slice(0, LINEUP_CAP);
  const avgOverall = topForClub.reduce((a, b) => a + (b.trueRating || b.overall), 0) / topForClub.length;
  const avgForm    = topForClub.reduce((a, b) => a + (b.form ?? 70), 0) / topForClub.length;
  const avgFitness = topForClub.reduce((a, b) => a + (b.fitness ?? 90), 0) / topForClub.length;
  return avgOverall + (avgForm - 70) * 0.10 + (avgFitness - 90) * 0.06;
}

// Light weekly tick — recover fitness, decay form, occasionally roll injury
export function tickAiSquads(aiSquads) {
  const out = {};
  for (const [id, squad] of Object.entries(aiSquads || {})) {
    out[id] = squad.map(p => {
      let fitness = Math.min(100, (p.fitness ?? 90) + rand(2, 6));
      let injured = Math.max(0, (p.injured ?? 0) - 1);
      const form = Math.max(40, Math.min(95, (p.form ?? 70) + rand(-3, 3)));
      // Small chance of a knock during the week
      if (rng() < 0.02 && injured === 0) {
        injured = rand(1, 3);
        fitness = Math.min(fitness, 70);
      }
      return { ...p, fitness, injured, form };
    });
  }
  return out;
}

// End-of-season ageing for AI clubs
export function ageAiSquads(aiSquads, newLeagueTier, season = 2026) {
  const out = {};
  const tierScale = TIER_SCALE[newLeagueTier] || 1.0;
  for (const [id, squad] of Object.entries(aiSquads || {})) {
    const aged = squad
      .map(p => {
        const newAge = (p.age ?? 24) + 1;
        const baseTrue = p.trueRating || p.overall;
        const decline = newAge >= 30 ? rand(2, 6) : newAge >= 27 ? rand(0, 3) : newAge <= 22 ? -rand(2, 6) : 0;
        const newTrue = Math.max(25, Math.min(99, baseTrue - Math.round(decline * (TIER_SCALE[p.tier || 2] || 1.0))));
        const newOverall = Math.max(30, Math.min(99, Math.round(newTrue / tierScale)));
        return {
          ...p,
          age: newAge,
          overall: newOverall,
          trueRating: newTrue,
          tier: newLeagueTier,
          contract: Math.max(0, (p.contract ?? 1) - 1),
          form: rand(50, 80),
          fitness: rand(85, 100),
          goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0,
        };
      })
      .filter(p => p.age <= 36 && p.contract > 0);

    // Top up squad to SQUAD_SIZE with younger talent
    while (aged.length < SQUAD_SIZE) {
      const slot = Math.floor(rng() * 1e6);
      const p = generatePlayer(newLeagueTier, slot, { clubId: id, season });
      aged.push({ ...p, age: rand(18, 22) });
    }
    out[id] = aged;
  }
  return out;
}

// AI clubs rotate their match squad (23) each round (balanced primary lines, then rating)
export function selectAiLineup(squad) {
  return selectBalancedLineup(squad, LINEUP_CAP);
}
