import { PYRAMID, findClub } from '../data/pyramid.js';

/** How many parallel ladders exist in tier-3 (local) leagues. */
export const LOCAL_DIVISION_COUNT = 5;

/** Stable bucket 1..LOCAL_DIVISION_COUNT for suburban draw splitting (no pyramid data edits). */
export function localDivisionForClub(clubId, leagueKey) {
  let h = 0;
  const s = `${leagueKey}\0${clubId}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return (Math.abs(h) % LOCAL_DIVISION_COUNT) + 1;
}

/**
 * Clubs that share a season ladder / fixture with the player.
 * Tier 1: full national league. Tier 2–3: same `club.state` as `regionState`; tier 3 also same local division.
 */
export function getCompetitionClubs(leagueKey, regionState, localDivision) {
  const league = PYRAMID[leagueKey];
  if (!league?.clubs) return [];
  if (league.tier === 1) return [...league.clubs];
  if (!regionState) return [...league.clubs];
  let clubs = league.clubs.filter((c) => c.state === regionState);
  if (league.tier === 3 && localDivision != null) {
    const d = Math.max(1, Math.min(LOCAL_DIVISION_COUNT, Number(localDivision) || 1));
    clubs = clubs.filter((c) => localDivisionForClub(c.id, leagueKey) === d);
  }
  return clubs;
}

/** Uses career.regionState, career.localDivision, and PYRAMID tiers. */
export function competitionClubsForCareer(c) {
  const league = PYRAMID[c.leagueKey];
  if (!league) return [];
  const region = c.regionState ?? findClub(c.clubId)?.state;
  const div = league.tier === 3
    ? (c.localDivision ?? localDivisionForClub(c.clubId, c.leagueKey))
    : null;
  return getCompetitionClubs(c.leagueKey, region, div);
}

export function generateFixtures(leagueClubs) {
  const ids = leagueClubs.map(c => c.id);
  const rounds = [];
  const n = ids.length;
  const arr = [...ids];
  if (n % 2 !== 0) arr.push(null);
  const teams = arr.length;
  const half = teams / 2;
  let rotation = arr.slice(1);
  for (let r = 0; r < teams - 1; r++) {
    const round = [];
    const left  = [arr[0], ...rotation.slice(0, half - 1)];
    const right = rotation.slice(half - 1).reverse();
    for (let i = 0; i < half; i++) {
      const h = left[i], a = right[i];
      if (h && a) round.push({ home: h, away: a });
    }
    rounds.push(round);
    rotation = [rotation[rotation.length - 1], ...rotation.slice(0, -1)];
  }
  return rounds;
}

export function blankLadder(leagueClubs) {
  return leagueClubs.map(c => ({
    id: c.id, name: c.name, short: c.short,
    P: 0, W: 0, L: 0, D: 0, F: 0, A: 0, pts: 0, pct: 0,
  }));
}

export function applyResultToLadder(ladder, homeId, awayId, hScore, aScore) {
  return ladder.map(row => {
    if (row.id !== homeId && row.id !== awayId) return row;
    const isHome = row.id === homeId;
    const fr = isHome ? hScore : aScore;
    const ag = isHome ? aScore : hScore;
    const W   = row.W + (fr > ag ? 1 : 0);
    const L   = row.L + (fr < ag ? 1 : 0);
    const D   = row.D + (fr === ag ? 1 : 0);
    const F   = row.F + fr;
    const A   = row.A + ag;
    const pts = W * 4 + D * 2;
    const pct = A === 0 ? 0 : (F / A) * 100;
    return { ...row, P: row.P + 1, W, L, D, F, A, pts, pct };
  });
}

export function sortedLadder(ladder) {
  return [...ladder].sort((a, b) => b.pts - a.pts || b.pct - a.pct || b.F - a.F);
}

export function getFinalsTeams(ladder, leagueTier) {
  const sorted = sortedLadder(ladder);
  const n = leagueTier === 1 ? 8 : leagueTier === 2 ? 6 : 4;
  return sorted.slice(0, Math.min(n, sorted.length));
}

export function generateFinalsFixtures(finalists, round) {
  const n = finalists.length;
  if (round === 0) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      pairs.push({ home: finalists[i].id, away: finalists[n - 1 - i].id, label: "Elimination Final" });
    }
    return pairs;
  }
  return [];
}

export function finalsLabel(round, totalRounds) {
  const remaining = totalRounds - round;
  if (remaining === 0) return "Grand Final";
  if (remaining === 1) return "Preliminary Final";
  if (remaining === 2) return "Semi Final";
  return "Elimination Final";
}

export function pickPromotionLeague(league) {
  if (league.tier === 1) return null;
  if (league.tier === 2) return "AFL";
  if (league.tier === 3) {
    if (league.state === "VIC") return "VFL";
    if (league.state === "SA")  return "SANFL";
    if (league.state === "WA")  return "WAFL";
    if (league.state === "TAS") return "SFL";
    if (league.state === "NT")  return "NTFL";
    if (league.state === "NSW") return "AFLSyd";
    if (league.state === "ACT") return "AFLCanberra";
    if (league.state === "QLD") return "VFL";
  }
  return null;
}

export function pickRelegationLeague(league) {
  if (league.tier === 1) {
    if (league.state === "VIC") return "VFL";
    if (league.state === "SA")  return "SANFL";
    if (league.state === "WA")  return "WAFL";
    if (league.state === "TAS") return "SFL";
    if (league.state === "NT")  return "NTFL";
    return null;
  }
  if (league.tier === 2) {
    if (league.state === "VIC") return "EFNL";
    if (league.state === "SA")  return "AdelFL";
    if (league.state === "WA")  return "PerthFL";
    if (league.state === "TAS") return null;
    if (league.state === "NT")  return null;
    return null;
  }
  return null;
}
