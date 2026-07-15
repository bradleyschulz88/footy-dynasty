// League-wide season awards — Brownlow, Coleman, Rising Star.
//
// Real AFL honours are competition-wide, but AI clubs don't track a per-player
// season stat-line, so we MODEL a plausible season tally for every AI player
// from their rating, on-field role and team success, while using the user
// club's ACTUAL accrued votes/goals so their real season counts. Deterministic
// per player id (a local hash, so the global match RNG is never disturbed and
// results are stable across re-renders).

import { findClub } from "../data/pyramid.js";
import { sortedLadder } from "./leagueEngine.js";

// Stable 0..1 hash from an id + salt — no global RNG side-effects.
function hash01(id, salt) {
  let h = (2166136261 ^ salt) >>> 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Position groups (playerGen set: KF HF C HB KB R RU WG UT).
const MID = new Set(["C", "R", "WG"]);
const KEY_FWD = "KF";
const HALF_FWD = "HF";
const RUCK = "RU";

// Modelled Brownlow votes across a season (~0–33). Midfielders & rucks poll best.
function modelVotes(p, teamFactor) {
  const ovr = p.overall ?? 60;
  const roleW = MID.has(p.position) ? 1 : p.position === RUCK ? 0.78 : (p.position === KEY_FWD || p.position === HALF_FWD) ? 0.6 : 0.42;
  const base = Math.max(0, (ovr - 62) / 33); // 0 at 62 → ~1 at 95
  const noise = 0.7 + hash01(p.id, 101) * 0.6; // 0.7–1.3
  return Math.min(33, Math.round(base * roleW * teamFactor * 32 * noise));
}

// Modelled season goals (~0–75). Key forwards dominate the Coleman.
function modelGoals(p, teamFactor) {
  const ovr = p.overall ?? 60;
  const fwdW = p.position === KEY_FWD ? 1 : p.position === HALF_FWD ? 0.68 : MID.has(p.position) ? 0.2 : 0.05;
  const base = Math.max(0, (ovr - 55) / 40);
  const noise = 0.7 + hash01(p.id, 202) * 0.6;
  return Math.min(80, Math.round(base * fwdW * teamFactor * 70 * noise));
}

const nameOf = (p) => (p.firstName ? `${p.firstName} ${p.lastName}` : p.name || p.lastName || "Unknown");

/**
 * @param {object} c career (uses c.squad, c.brownlow, c.ladder, c.clubId, c.season)
 * @param {object} _league unused directly; kept for signature symmetry
 * @param {Record<string, object[]>} aiSquads squads keyed by club id
 * @returns {{ brownlow: object|null, coleman: object|null, risingStar: object|null }}
 */
export function computeLeagueAwards(c, _league, aiSquads) {
  const ladder = sortedLadder(c.ladder || []);
  const N = ladder.length || 1;
  const rankOf = {};
  ladder.forEach((r, i) => { rankOf[r.id] = i + 1; });
  // Better ladder finish → more team scoring/votes on offer. ~0.6 (bottom) → ~1.1 (top).
  const teamFactor = (clubId) => 0.6 + 0.5 * (1 - ((rankOf[clubId] ?? N) - 1) / Math.max(1, N - 1));

  const entries = [];
  const add = (p, clubId, real) => {
    if (!p?.id) return;
    const tf = teamFactor(clubId);
    entries.push({
      p,
      clubId,
      votes: real ? (c.brownlow?.[p.id] ?? 0) : modelVotes(p, tf),
      goals: real ? (p.goals ?? 0) : modelGoals(p, tf),
    });
  };
  (c.squad || []).forEach((p) => add(p, c.clubId, true));
  Object.entries(aiSquads || {}).forEach(([clubId, squad]) => {
    if (clubId === c.clubId) return; // user handled above with real tallies
    (squad || []).forEach((p) => add(p, clubId, false));
  });
  if (!entries.length) return { brownlow: null, coleman: null, risingStar: null };

  const clubShort = (id) => findClub(id)?.short || id;
  const mine = (id) => id === c.clubId;

  const bl = entries.reduce((a, b) => (b.votes > a.votes ? b : a));
  const brownlow = bl.votes > 0
    ? { name: nameOf(bl.p), club: clubShort(bl.clubId), votes: bl.votes, position: bl.p.position, isMine: mine(bl.clubId) }
    : null;

  const cm = entries.reduce((a, b) => (b.goals > a.goals ? b : a));
  const coleman = cm.goals > 0
    ? { name: nameOf(cm.p), club: clubShort(cm.clubId), goals: cm.goals, season: c.season, isMine: mine(cm.clubId) }
    : null;

  const rsPool = entries
    .filter((e) => (e.p.age ?? 30) <= 21)
    .map((e) => ({ ...e, score: (e.p.overall ?? 0) + e.votes * 2 }));
  const rs = rsPool.length ? rsPool.reduce((a, b) => (b.score > a.score ? b : a)) : null;
  const risingStar = rs
    ? { name: nameOf(rs.p), club: clubShort(rs.clubId), age: rs.p.age, overall: rs.p.overall, isMine: mine(rs.clubId) }
    : null;

  return { brownlow, coleman, risingStar };
}
