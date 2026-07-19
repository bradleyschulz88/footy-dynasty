import { PYRAMID, findClub } from '../data/pyramid.js';
import { isDerbyMatch } from './derbies.js';

/** Cap on parallel local ladders in one tier-3 competition pool. */
export const LOCAL_DIVISION_COUNT = 5;

/** ~This many clubs per ladder before adding another division (ceil(n / this), capped at LOCAL_DIVISION_COUNT). */
export const TIER3_CLUBS_PER_DIVISION_TARGET = 10;

/** Avoid splitting tier-3 pools so finely that a division would drop below this many clubs (when avoidable). */
export const TIER3_MIN_CLUBS_PER_DIVISION = 4;

/** Returns true if every club in this league+state has an explicit `division` property. */
function leagueHasExplicitDivisions(leagueKey, regionState) {
  const league = PYRAMID[leagueKey];
  if (!league?.clubs) return false;
  const clubs = regionState ? league.clubs.filter((c) => c.state === regionState) : league.clubs;
  return clubs.length > 0 && clubs.every((c) => c.division != null);
}

/** Sorted club ids in this league that belong to `regionState` (deterministic split). */
export function tier3RegionSortedIds(leagueKey, regionState) {
  const league = PYRAMID[leagueKey];
  if (!league?.clubs || !regionState) return [];
  return league.clubs.filter((c) => c.state === regionState).map((c) => c.id).sort();
}

/** How many parallel divisions exist for this pool. Uses explicit `division` props when available. */
export function tier3DivisionCount(leagueKey, regionState) {
  const league = PYRAMID[leagueKey];
  if (!league?.clubs) return 1;
  if (leagueHasExplicitDivisions(leagueKey, regionState)) {
    const clubs = regionState ? league.clubs.filter((c) => c.state === regionState) : league.clubs;
    const maxDiv = Math.max(...clubs.map((c) => c.division));
    return Math.max(1, maxDiv);
  }
  const n = tier3RegionSortedIds(leagueKey, regionState).length;
  if (n <= 0) return 1;
  const kByTarget = Math.ceil(n / TIER3_CLUBS_PER_DIVISION_TARGET);
  const kMaxForMinSize = Math.max(1, Math.floor(n / TIER3_MIN_CLUBS_PER_DIVISION));
  return Math.min(LOCAL_DIVISION_COUNT, Math.max(1, kByTarget), kMaxForMinSize);
}

/** Team counts per division index [div1, div2, …] — useful for setup UI. */
export function tier3DivisionTeamCounts(leagueKey, regionState) {
  const K = tier3DivisionCount(leagueKey, regionState);
  const league = PYRAMID[leagueKey];
  if (leagueHasExplicitDivisions(leagueKey, regionState)) {
    const clubs = regionState ? league.clubs.filter((c) => c.state === regionState) : league.clubs;
    const counts = Array.from({ length: K }, () => 0);
    clubs.forEach((c) => { counts[(c.division ?? 1) - 1] += 1; });
    return counts;
  }
  const counts = Array.from({ length: K }, () => 0);
  const n = tier3RegionSortedIds(leagueKey, regionState).length;
  for (let i = 0; i < n; i++) counts[i % K] += 1;
  return counts;
}

/**
 * Which local ladder (1..K) a club sits in.
 * Uses explicit `division` property when present; falls back to round-robin on sorted ids.
 */
export function localDivisionForClub(clubId, leagueKey, regionState) {
  const club = findClub(clubId);
  if (club?.division != null) return club.division;
  const st = regionState ?? club?.state;
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
export function getCompetitionClubs(leagueKey, regionState, localDivision, season) {
  const league = PYRAMID[leagueKey];
  if (!league?.clubs) return [];
  if (league.tier === 1) {
    const clubs = season != null
      ? league.clubs.filter(c => !c.joinsYear || c.joinsYear <= season)
      : league.clubs;
    return [...clubs];
  }
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
  return getCompetitionClubs(c.leagueKey, region, div, c.season);
}

// Cap on a single competition's home-and-away rounds. Real AFL/state leagues
// play ~22-23 games, NOT a full 34-round double round-robin — so big comps are
// trimmed (the base single round-robin plus a partial return set = an authentic
// *unbalanced* fixture where you meet some clubs twice and others once). Small
// community comps fall under the cap and play a full, balanced home-and-away.
export const MAX_SEASON_ROUNDS = 23;

// Full home-and-away season: a double round-robin. The base single round-robin
// (circle method) is generated with the venue alternated per round/game so no
// club gets a long home or away run; then a mirror set of rounds replays every
// pairing with the venue reversed. Large comps are trimmed to MAX_SEASON_ROUNDS
// (override with { maxRounds }). Pass { homeAndAway: false } for a single
// round-robin.
export function generateFixtures(leagueClubs, { homeAndAway = true, maxRounds = MAX_SEASON_ROUNDS } = {}) {
  const ids = leagueClubs.map(c => c.id);
  const arr = [...ids];
  if (arr.length % 2 !== 0) arr.push(null);
  const teams = arr.length;
  const half = teams / 2;
  let rotation = arr.slice(1);
  const baseRounds = [];
  for (let r = 0; r < teams - 1; r++) {
    const round = [];
    const left  = [arr[0], ...rotation.slice(0, half - 1)];
    const right = rotation.slice(half - 1).reverse();
    for (let i = 0; i < half; i++) {
      const h = left[i], a = right[i];
      if (!h || !a) continue;
      // Alternate which side hosts so venues don't streak across the season.
      round.push((r + i) % 2 === 0 ? { home: h, away: a } : { home: a, away: h });
    }
    baseRounds.push(round);
    rotation = [rotation[rotation.length - 1], ...rotation.slice(0, -1)];
  }
  if (!homeAndAway) return baseRounds;
  const returnRounds = baseRounds.map(round => round.map(m => ({ home: m.away, away: m.home })));
  const full = [...baseRounds, ...returnRounds];
  return maxRounds && full.length > maxRounds ? full.slice(0, maxRounds) : full;
}

/**
 * Assign one bye per team across rounds 12–19 for semi-pro/pro competitions
 * (≥14 teams, ≥22 rounds). Returns { [teamId]: roundNumber } or {} if byes
 * don't apply.
 * ponytail: greedy spread — fills rounds in order, each round capped at
 * floor(n/2) byes. Works for 14–20 teams without backtracking; upgrade path
 * is a constraint solver if more exotic distributions are ever needed.
 */
export function generateByeRounds(teamIds, totalRounds) {
  const n = teamIds.length;
  if (n < 14 || totalRounds < 22) return {};
  const BYE_START = 12;
  const BYE_END = 19;
  const maxPerRound = Math.floor(n / 2);
  const byeMap = {};
  const roundCounts = {};
  let roundIdx = BYE_START;
  for (const id of teamIds) {
    // Advance to a round that still has capacity within the bye window.
    while (roundIdx <= BYE_END && (roundCounts[roundIdx] ?? 0) >= maxPerRound) roundIdx++;
    if (roundIdx > BYE_END) break; // shouldn't happen for ≤20 teams but be safe
    byeMap[id] = roundIdx;
    roundCounts[roundIdx] = (roundCounts[roundIdx] ?? 0) + 1;
  }
  return byeMap;
}

/**
 * Weighted double-ups: in a capped season some opponents are played twice and
 * some once. A full double round-robin is the single round-robin (first n-1
 * rounds) followed by its mirror; keeping the single RR plus the mirror rounds
 * with the MOST established rivalries means the "play twice" games skew to real
 * derbies (Showdown, Western Derby, Anzac Day…) instead of being an arbitrary
 * artefact of circle-method ordering. Falls back to the plain fixture when the
 * comp is small enough to play a full home-and-away.
 */
export function generateWeightedFixtures(leagueClubs, targetRounds = MAX_SEASON_ROUNDS) {
  const n = leagueClubs.length;
  const full = generateFixtures(leagueClubs, { maxRounds: 2 * Math.max(1, n - 1) });
  if (full.length <= targetRounds) return full;
  const singleCount = n - 1; // first leg = a complete single round-robin
  const single = full.slice(0, singleCount);
  const reverse = full.slice(singleCount);
  const keepReverse = targetRounds - single.length;
  if (keepReverse <= 0) return full.slice(0, targetRounds);
  const scored = reverse.map((r, i) => ({
    r,
    i,
    score: r.reduce((a, m) => a + (isDerbyMatch(m.home, m.away) ? 1 : 0), 0),
  }));
  // Most-rivalry rounds first; stable on original order for ties.
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  const kept = scored.slice(0, keepReverse).sort((a, b) => a.i - b.i).map((s) => s.r);
  return [...single, ...kept];
}

/**
 * Turn overlay byes into REAL fixture byes: remove one game per team (in the
 * rounds 12–19 window, ≤3 games / 6 teams resting per round, like the AFL) so
 * bye rounds actually have fewer games and each team plays 22, not 23. The two
 * teams in each removed game share that bye round.
 *
 * Returns `{ fixtures, byeMap }`. Byes only apply for even, ≥14-team, ≥22-round
 * competitions (real AFL/state-league seasons); otherwise the fixtures pass
 * through untouched with an empty byeMap.
 * ponytail: greedy matching over the bye window — picks the first game whose
 * both teams are still un-byed. For 14–20 even teams this always covers every
 * team; any team it can't place (shouldn't happen) simply keeps its 23rd game.
 */
export function applyByesToFixtures(fixtures, teamIds) {
  const n = teamIds.length;
  if (n < 14 || n % 2 !== 0 || (fixtures?.length ?? 0) < 22) {
    return { fixtures, byeMap: {} };
  }
  const BYE_START = 12; // 1-based round numbers
  const BYE_END = 19;
  const MAX_BYE_GAMES_PER_ROUND = 3; // 6 teams rest — the AFL bye-round shape
  const byed = new Set();
  const byeMap = {};
  const byeGames = []; // {r, game} to drop after selection
  // Work on a shallow copy so callers' arrays aren't mutated.
  const out = fixtures.map((round) => round.slice());

  // Candidate bye games = every game in the bye window. A game byes both teams.
  const candidates = [];
  for (let r = BYE_START - 1; r <= BYE_END - 1 && r < out.length; r++) {
    for (const game of out[r]) candidates.push({ r, home: game.home, away: game.away, game });
  }
  // Round-usage cap for a natural AFL spread (≤3 byes / 6 teams per round).
  const roundUse = {};
  const assign = (cand) => {
    byeMap[cand.home] = cand.r + 1;
    byeMap[cand.away] = cand.r + 1;
    byed.add(cand.home);
    byed.add(cand.away);
    roundUse[cand.r] = (roundUse[cand.r] ?? 0) + 1;
    byeGames.push({ r: cand.r, game: cand.game });
  };

  // Minimum-degree-first matching: repeatedly bye the un-byed team with the
  // FEWEST remaining partners (most constrained), pairing it with its partner
  // that is itself most constrained. This finds a perfect matching where a
  // naive left-to-right sweep strands the last couple of teams.
  const partnersOf = (team, capped) => candidates.filter(
    (c) => (c.home === team || c.away === team) &&
      !byed.has(c.home) && !byed.has(c.away) &&
      (!capped || (roundUse[c.r] ?? 0) < MAX_BYE_GAMES_PER_ROUND),
  );
  const step = (capped) => {
    const unbyed = teamIds.filter((t) => !byed.has(t));
    let best = null;
    for (const t of unbyed) {
      const opts = partnersOf(t, capped);
      if (opts.length === 0) continue;
      if (best === null || opts.length < best.count) best = { team: t, opts, count: opts.length };
    }
    if (!best) return false;
    // Pair with the partner that itself has the fewest options (tightest).
    let chosen = best.opts[0];
    let chosenDeg = Infinity;
    for (const c of best.opts) {
      const other = c.home === best.team ? c.away : c.home;
      const deg = partnersOf(other, capped).length;
      if (deg < chosenDeg) { chosenDeg = deg; chosen = c; }
    }
    assign(chosen);
    return true;
  };
  // Prefer the spread (capped) while it works; drop the cap only to finish
  // covering any stragglers.
  while (byed.size < n && step(true)) { /* spread pass */ }
  while (byed.size < n && step(false)) { /* coverage pass */ }

  // Drop the selected bye games from their rounds.
  const dropByRound = new Map();
  for (const { r, game } of byeGames) {
    if (!dropByRound.has(r)) dropByRound.set(r, new Set());
    dropByRound.get(r).add(game);
  }
  for (const [r, drop] of dropByRound) out[r] = out[r].filter((g) => !drop.has(g));
  return { fixtures: out, byeMap };
}

export function blankLadder(leagueClubs) {
  return leagueClubs.map(c => ({
    id: c.id, name: c.name, short: c.short,
    P: 0, W: 0, L: 0, D: 0, F: 0, A: 0, pts: 0, pct: 0, form: [],
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
    const resultChar = fr > ag ? 'W' : fr < ag ? 'L' : 'D';
    const form = [...(row.form ?? []), resultChar].slice(-5);
    return { ...row, P: row.P + 1, W, L, D, F, A, pts, pct, form };
  });
}

export function sortedLadder(ladder) {
  return [...ladder].sort((a, b) => b.pts - a.pts || b.pct - a.pct || b.F - a.F);
}

export function getFinalsTeams(ladder, leagueTier) {
  const sorted = sortedLadder(ladder);
  // Tier 1 = AFL final 8; tiers 2 & 3 = final 6 (week 1: 1v6, 2v5, 3v4, top 3 host).
  const n = leagueTier === 1 ? 8 : 6;
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
    if (league.state === "TAS") return "TSL";
    if (league.state === "NT")  return "NTFL";
    if (league.state === "NSW") return "AFLSyd";
    if (league.state === "ACT") return "AFLCanberra";
    if (league.state === "QLD") return "QAFL";
  }
  return null;
}

export function pickRelegationLeague(league) {
  if (league.tier === 1) {
    if (league.state === "VIC") return "VFL";
    if (league.state === "SA")  return "SANFL";
    if (league.state === "WA")  return "WAFL";
    if (league.state === "TAS") return "TSL";
    if (league.state === "NT")  return "NTFL";
    return null;
  }
  if (league.tier === 2) {
    if (league.state === "VIC") return "EFNL";
    if (league.state === "SA")  return "AdelFL";
    if (league.state === "WA")  return "PerthFootballLeague";
    if (league.state === "TAS") return null;
    if (league.state === "NT")  return null;
    return null;
  }
  return null;
}
