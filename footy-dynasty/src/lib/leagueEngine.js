import { PYRAMID, findClub } from '../data/pyramid.js';

/** Cap on parallel local ladders in one tier-3 competition pool. */
export const LOCAL_DIVISION_COUNT = 5;

/** ~This many clubs per ladder before adding another division (ceil(n / this), capped at LOCAL_DIVISION_COUNT). */
export const TIER3_CLUBS_PER_DIVISION_TARGET = 10;

/** Avoid splitting tier-3 pools so finely that a division would drop below this many clubs (when avoidable). */
export const TIER3_MIN_CLUBS_PER_DIVISION = 4;

/** Sorted club ids in this league that belong to `regionState` (deterministic split). */
export function tier3RegionSortedIds(leagueKey, regionState) {
  const league = PYRAMID[leagueKey];
  if (!league?.clubs || !regionState) return [];
  return league.clubs.filter((c) => c.state === regionState).map((c) => c.id).sort();
}

/** How many parallel divisions exist for this pool (1 for tiny lists, up to 5 for large ones). */
export function tier3DivisionCount(leagueKey, regionState) {
  const n = tier3RegionSortedIds(leagueKey, regionState).length;
  if (n <= 0) return 1;
  const kByTarget = Math.ceil(n / TIER3_CLUBS_PER_DIVISION_TARGET);
  const kMaxForMinSize = Math.max(1, Math.floor(n / TIER3_MIN_CLUBS_PER_DIVISION));
  return Math.min(LOCAL_DIVISION_COUNT, Math.max(1, kByTarget), kMaxForMinSize);
}

/** Team counts per division index [div1, div2, …] — useful for setup UI. */
export function tier3DivisionTeamCounts(leagueKey, regionState) {
  const K = tier3DivisionCount(leagueKey, regionState);
  const counts = Array.from({ length: K }, () => 0);
  const n = tier3RegionSortedIds(leagueKey, regionState).length;
  for (let i = 0; i < n; i++) counts[i % K] += 1;
  return counts;
}

/**
 * Which local ladder (1..K) a club sits in. Round-robin on sorted ids keeps divisions even.
 * @param {string|null} regionState – pass `regionState` from career/setup; otherwise uses the club's `.state`.
 */
export function localDivisionForClub(clubId, leagueKey, regionState) {
  const st = regionState ?? findClub(clubId)?.state;
  const ids = tier3RegionSortedIds(leagueKey, st);
  const K = tier3DivisionCount(leagueKey, st);
  const idx = ids.indexOf(clubId);
  if (idx < 0) return 1;
  return (idx % K) + 1;
}

/**
 * Clubs that share a season ladder / fixture with the player.
 * Tier 1: full national league. Tier 2–3: same `club.state` as `regionState`; tier 3 also same local division.
 */
export function getCompetitionClubs(leagueKey, regionState, localDivision) {
  const league = PYRAMID[leagueKey];
  if (!league?.clubs) return [];
  if (league.tier === 1) return [...league.clubs];
  // Tier 2/3 without a state would incorrectly pool every club nationally — refuse and let callers fall back (e.g. club.state).
  if (!regionState) return [];
  let clubs = league.clubs.filter((c) => c.state === regionState);
  if (league.tier === 3 && localDivision != null) {
    const K = tier3DivisionCount(leagueKey, regionState);
    const d = Math.max(1, Math.min(K, Number(localDivision) || 1));
    clubs = clubs.filter((c) => localDivisionForClub(c.id, leagueKey, regionState) === d);
  }
  return clubs;
}

/** Uses career.regionState, career.localDivision, and PYRAMID tiers. */
export function competitionClubsForCareer(c) {
  const league = PYRAMID[c.leagueKey];
  if (!league) return [];
  const region = c.regionState ?? findClub(c.clubId)?.state;
  let div = null;
  if (league.tier === 3) {
    const K = tier3DivisionCount(c.leagueKey, region);
    const raw = c.localDivision ?? localDivisionForClub(c.clubId, c.leagueKey, region);
    div = Math.max(1, Math.min(K, raw));
  }
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
