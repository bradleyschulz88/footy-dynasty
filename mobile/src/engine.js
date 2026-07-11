// Facade over the shared game engine (synced from ../footy-dynasty/src into
// mobile/engine by scripts/sync-engine.mjs). All engine imports go through here.
import { generateSquad, POSITION_NAMES } from "../engine/lib/playerGen.js";
import { PYRAMID } from "../engine/data/pyramid.js";
import { fmtK } from "../engine/lib/format.js";
import { seedRng, rng, rand } from "../engine/lib/rng.js";

export { generateSquad, POSITION_NAMES, PYRAMID, fmtK };

function findClubAndLeague(clubId) {
  for (const key of Object.keys(PYRAMID)) {
    const league = PYRAMID[key];
    const club = (league.clubs || []).find((c) => c.id === clubId);
    if (club) return { club, league, leagueKey: key };
  }
  return null;
}

// A deterministic, plausible early-season demo state built entirely from the
// shared engine — enough to populate the native Hub + Squad screens. (The full
// career sim lives in the engine too; this is a lightweight bootstrap for now.)
export function buildDemoCareer(clubId = "car", season = 2026) {
  const found = findClubAndLeague(clubId) || { club: { id: clubId, name: "Footy Dynasty", short: "FD", colors: ["#0091DA", "#001E3C", "#fff"] }, league: { clubs: [] }, leagueKey: "afl" };
  const { club, league } = found;
  const tier = league.tier || 1;

  const squad = generateSquad(clubId, tier, 26, season)
    .slice()
    .sort((a, b) => b.overall - a.overall);
  const squadRating = squad.length
    ? Math.round(squad.reduce((a, p) => a + p.overall, 0) / squad.length)
    : 0;
  const wages = squad.reduce((a, p) => a + (p.wage || 0), 0);
  const cash = tier === 1 ? 3_600_000 : tier === 2 ? 620_000 : 150_000;

  // Deterministic early-season ladder for the club's league.
  seedRng(season * 31 + 7);
  const rounds = 5;
  const ladder = (league.clubs || [])
    .map((c) => {
      const w = Math.max(0, Math.min(rounds, Math.round(rounds * (0.35 + rng() * 0.5))));
      const l = rounds - w;
      const pct = 85 + Math.round(rng() * 40); // 85–125
      return { id: c.id, name: c.name, short: c.short, colors: c.colors, w, l, pts: w * 4, pct };
    })
    .sort((a, b) => b.pts - a.pts || b.pct - a.pct);
  ladder.forEach((r, i) => (r.pos = i + 1));

  const myRow = ladder.find((r) => r.id === clubId) || { pos: null, w: 0, l: 0 };
  const myIdx = ladder.findIndex((r) => r.id === clubId);
  // Next opponent = a nearby club on the ladder.
  const opp = ladder[myIdx >= 0 ? (myIdx + 1) % ladder.length : 0] || ladder[0] || null;

  return {
    season, club, tier, squad, squadRating, wages, cash, ladder, myRow,
    nextOpponent: opp,
    board: { confidence: 55, objective: tier === 1 ? "Play finals." : "Finish top 4." },
  };
}

export { rand };
