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

// Simulate the next match and return an advanced career (playable loop).
// Deterministic per (season, round) so replays are stable. Lightweight on
// purpose — a mobile-side sim over squad strength; the full match engine can be
// wired in later.
export function advanceMatch(career) {
  const { season, club, squadRating, ladder, myRow } = career;
  const opp = career.nextOpponent;
  const round = (myRow.w ?? 0) + (myRow.l ?? 0) + (myRow.d ?? 0) + 1;
  seedRng(season * 1000 + round * 17);

  const myStr = squadRating;
  const oppStr = opp ? Math.max(45, Math.min(95, 62 + (opp.pct - 100) * 0.3 + (opp.pts - 10) * 0.8)) : 62;

  const quarters = [];
  let myTotal = 0, oppTotal = 0;
  for (let q = 0; q < 4; q++) {
    const mg = Math.max(0, Math.round(3 + (myStr - 70) / 7 + (rng() - 0.5) * 4));
    const mb = Math.max(0, Math.round(2 + (rng() - 0.4) * 3));
    const og = Math.max(0, Math.round(3 + (oppStr - 70) / 7 + (rng() - 0.5) * 4));
    const ob = Math.max(0, Math.round(2 + (rng() - 0.4) * 3));
    myTotal += mg * 6 + mb;
    oppTotal += og * 6 + ob;
    quarters.push({ mg, mb, og, ob, myG: quarters.reduce((a, x) => a + x.mg, mg), myTotal, oppTotal });
  }
  const won = myTotal > oppTotal;
  const draw = myTotal === oppTotal;

  // Update my club + the opponent on the ladder, then re-sort.
  const next = ladder.map((r) => ({ ...r }));
  const me = next.find((r) => r.id === club.id);
  const them = opp ? next.find((r) => r.id === opp.id) : null;
  const bump = (row, isWin, isDraw, gf, ga) => {
    if (!row) return;
    if (isDraw) { row.d = (row.d || 0) + 1; row.pts += 2; }
    else if (isWin) { row.w += 1; row.pts += 4; }
    else { row.l += 1; }
    row.gf = (row.gf || row.pts * 25) + gf;
    row.ga = (row.ga || row.pts * 24) + ga;
    row.pct = Math.round((row.gf / Math.max(1, row.ga)) * 100);
  };
  bump(me, won, draw, myTotal, oppTotal);
  bump(them, !won && !draw, draw, oppTotal, myTotal);
  next.sort((a, b) => b.pts - a.pts || b.pct - a.pct);
  next.forEach((r, i) => (r.pos = i + 1));

  const newMyRow = next.find((r) => r.id === club.id) || myRow;
  const myIdx = next.findIndex((r) => r.id === club.id);
  const nextOpponent = next[myIdx >= 0 ? (myIdx + 1) % next.length : 0] || opp;
  const cash = career.cash + (won ? 95000 : draw ? 70000 : 55000) - Math.round(career.wages / 22);

  return {
    ...career,
    ladder: next,
    myRow: newMyRow,
    nextOpponent,
    cash,
    lastResult: { opp, myTotal, oppTotal, won, draw, quarters, round },
  };
}

export { rand };
