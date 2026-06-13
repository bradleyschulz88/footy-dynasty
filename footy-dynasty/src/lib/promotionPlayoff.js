// ---------------------------------------------------------------------------
// Tier 3 → Tier 2 promotion playoff.
//
// A community (tier 3) club that dominates its top local division does NOT get
// automatically lifted into a state league — winning Division 1 keeps you in
// Division 1. To actually step up a level the club must prove sustained
// dominance: win four consecutive Division 1 flags, then have the club apply
// for (and win) a state-body promotion playoff — a four-team group round-robin
// against the champions of neighbouring regions.
// ---------------------------------------------------------------------------
import { rand, rng, pick } from './rng.js';
import { ALL_CLUBS, findLeagueOf, findClub } from '../data/pyramid.js';

/** Consecutive Division 1 premierships required before the club can apply. */
export const TIER3_PROMOTION_TITLE_REQ = 4;
/** Board confidence needed for the club to back a promotion application. */
export const TIER3_PROMOTION_BOARD_REQ = 55;

/** True when the manager has met the on-field bar to apply for promotion. */
export function isPromotionPlayoffEligible(career) {
  return (career?.tier3Div1Titles || 0) >= TIER3_PROMOTION_TITLE_REQ;
}

/** True when the club (board) will back the application this year. */
export function clubBacksPromotion(career) {
  return (career?.finance?.boardConfidence ?? 0) >= TIER3_PROMOTION_BOARD_REQ;
}

// Average overall of a club's best 22 — used as playoff strength.
function squadStrength(squad) {
  const ovr = (squad || []).map((p) => p.overall ?? 0).sort((a, b) => b - a).slice(0, 22);
  if (ovr.length === 0) return 55;
  return ovr.reduce((a, b) => a + b, 0) / ovr.length;
}

// Strength band of a rival regional champion entering the playoff — roughly the
// quality you need to hold your own at the bottom of a state league. Independent
// of the manager's own strength, so a genuinely dominant squad has a real edge.
const RIVAL_CHAMPION_MIN = 60;
const RIVAL_CHAMPION_MAX = 70;

// Three rival regional champions to fill out the group.
function rivalChampions(career) {
  const used = new Set([career.clubId]);
  const names = [];
  const pool = ALL_CLUBS.filter((c) => {
    const lg = findLeagueOf(c.id);
    return lg && lg.tier === 3 && !used.has(c.id);
  });
  for (let i = 0; i < 3; i++) {
    if (!pool.length) break;
    const c = pick(pool.filter((x) => !used.has(x.id)));
    if (!c) break;
    used.add(c.id);
    names.push(c.short || c.name);
  }
  while (names.length < 3) names.push(`Region ${String.fromCharCode(66 + names.length)} Champions`);
  return names;
}

// Simulate one playoff fixture from two strength ratings. 4 / 2 / 0 points.
function playGame(a, b) {
  const margin = (a - b) + (rng() - 0.5) * 16;
  if (margin > 2.5) return [4, 0];
  if (margin < -2.5) return [0, 4];
  return [2, 2];
}

/**
 * Run the four-team group round-robin. The manager's club is index 0.
 * Returns { won, promoted, table, myPts, summary }.
 */
export function runPromotionPlayoff(career) {
  const myName = career.clubName || findClub(career.clubId)?.short || 'Your club';
  const myStrength = squadStrength(career.squad);
  // Opponents sit at a fixed state-league-entry band — a dominant squad has a
  // genuine edge, a thin one is in for a real fight.
  const opponents = rivalChampions(career).map((name) => ({
    name,
    strength: RIVAL_CHAMPION_MIN + rng() * (RIVAL_CHAMPION_MAX - RIVAL_CHAMPION_MIN),
  }));
  const teams = [{ name: myName, strength: myStrength, isMe: true }, ...opponents]
    .map((t) => ({ ...t, pts: 0, w: 0, l: 0, d: 0 }));

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const [pa, pb] = playGame(teams[i].strength, teams[j].strength);
      teams[i].pts += pa; teams[j].pts += pb;
      if (pa > pb) { teams[i].w++; teams[j].l++; }
      else if (pb > pa) { teams[j].w++; teams[i].l++; }
      else { teams[i].d++; teams[j].d++; }
    }
  }

  const table = teams
    .map((t) => ({ name: t.name, pts: t.pts, w: t.w, l: t.l, d: t.d, isMe: !!t.isMe }))
    .sort((a, b) => b.pts - a.pts || (b.w - a.w));
  const myRow = table.find((t) => t.isMe);
  const myPos = table.findIndex((t) => t.isMe) + 1;
  const won = myPos === 1; // only the group winner is promoted

  const summary = won
    ? `🏆 Promotion playoff won! ${myName} top the group (${myRow.w}-${myRow.d}-${myRow.l}) and are promoted to the state league.`
    : `Promotion playoff: ${myName} finished ${myPos}/4 (${myRow.w}-${myRow.d}-${myRow.l}). Another year in Division 1 — go again.`;

  return { won, promoted: won, table, myPts: myRow.pts, myPos, summary };
}
