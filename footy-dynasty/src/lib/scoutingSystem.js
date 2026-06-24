import { generatePlayer } from './playerGen.js';
import { PYRAMID } from '../data/pyramid.js';
import { getCompetitionClubs } from './leagueEngine.js';
import { scoutedOverall } from './finance/engine.js';
import { recruitFocusIncrementalBonus, ensureStaffTasks } from './staffTasks.js';
import { rand, seedRng } from './rng.js';

export const WATCHLIST_STALE_WEEKS = 8;
export const DEPLOYMENT_DURATION_WEEKS = 2;

export function ensureScoutWatchlist(career) {
  return career.scoutWatchlist || [];
}

export function ensureLeagueRelationships(career) {
  return career.leagueRelationships || {};
}

export function ensureScoutDeployments(career) {
  return career.scoutDeployments || [];
}

export function getRelationshipScore(career, leagueKey) {
  if (!leagueKey) return 0;
  return (career.leagueRelationships || {})[leagueKey]?.score ?? 0;
}

export function getRelationshipTier(score) {
  if (score >= 80) return { label: 'Trusted', color: 'var(--A-pos)' };
  if (score >= 50) return { label: 'Known', color: 'var(--A-accent)' };
  if (score >= 25) return { label: 'Familiar', color: 'var(--A-accent-2)' };
  return { label: 'Unknown', color: 'var(--A-text-mute)' };
}

// Extra accuracy stacked on top of scout rating (0–4)
export function relationshipAccuracyBonus(score) {
  if (score >= 80) return 4;
  if (score >= 50) return 2;
  if (score >= 25) return 1;
  return 0;
}

// Fee multiplier from loyalty vs relationship strength: 1.0–1.5×
// High loyalty + no relationship = 50% more expensive
export function localLoyaltyModifier(loyalty, relationshipScore) {
  const diff = Math.max(0, (loyalty ?? 50) - (relationshipScore ?? 0) * 0.5);
  return 1 + (diff / 100) * 0.5;
}

// Bump relationship score after scouting a league; returns new leagueRelationships object
export function bumpRelationship(leagueRelationships, leagueKey, career, amount) {
  const existing = (leagueRelationships || {})[leagueKey] || { score: 0, contactCount: 0 };
  return {
    ...(leagueRelationships || {}),
    [leagueKey]: {
      ...existing,
      score: Math.min(100, (existing.score || 0) + amount),
      contactCount: (existing.contactCount || 0) + 1,
      lastScoutedSeason: career?.season ?? null,
      lastScoutedWeek: career?.week ?? null,
    },
  };
}

// Create a deployment record (does not mutate career)
export function createDeployment(career, leagueKey, scoutId) {
  const league = PYRAMID[leagueKey];
  return {
    id: `deploy_${career.week || 0}_${leagueKey}_${career.season || 0}`,
    scoutId: scoutId || 'auto',
    leagueKey,
    leagueName: league?.name || leagueKey,
    leagueShort: league?.short || leagueKey,
    deployedWeek: career.week || 0,
    returnsWeek: (career.week || 0) + DEPLOYMENT_DURATION_WEEKS,
    status: 'active',
  };
}

// Build watchlist entries from a league scout run (called on deployment return)
// Does NOT call seedRng — uses current RNG state from caller
export function generateWatchlistEntries(career, leagueKey, count, focusBonus, relScore) {
  const league = PYRAMID[leagueKey];
  if (!league) return [];
  const leagueSt = league.state || career.regionState || 'WA';
  const scoutPool = getCompetitionClubs(leagueKey, leagueSt, null);
  const poolRaw = scoutPool.length ? [...scoutPool] : [...(league.clubs || [])];
  if (!poolRaw.length) return [];

  // Deterministic shuffle per week+league combination
  const weekSeed = (career.week || 0) * 9973 + leagueKey.charCodeAt(0) * 317 + (career.season || 2026) * 41;
  seedRng(weekSeed);
  for (let i = poolRaw.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [poolRaw[i], poolRaw[j]] = [poolRaw[j], poolRaw[i]];
  }

  const existingIds = new Set((career.scoutWatchlist || []).map(w => w.id));
  const accBonus = (focusBonus || 0) + relationshipAccuracyBonus(relScore || 0);
  const entries = [];

  for (let i = 0; i < poolRaw.length && entries.length < (count || 2); i++) {
    const sourceClub = poolRaw[i];
    const cid = sourceClub.id || `local:${leagueKey}:${i}`;
    const pSeed = weekSeed + i * 77;
    const p = generatePlayer(league.tier, pSeed, { clubId: cid, season: career.season });
    const wlId = `wl_${leagueKey}_${p.firstName}${p.lastName}_${career.season || 0}`;
    if (existingIds.has(wlId)) continue;
    const shortLabel = sourceClub.short || (sourceClub.name || '').slice(0, 4).toUpperCase() || '?';
    const localLoyalty = rand(30, 90);
    entries.push({
      ...p,
      id: wlId,
      scoutedOverall: scoutedOverall(p, career, { focusBonus: accBonus }),
      fromLeagueKey: leagueKey,
      fromLeagueShort: league.short || leagueKey,
      fromClubId: sourceClub.id || null,
      fromClubName: sourceClub.name || shortLabel,
      fromClubShort: shortLabel,
      localLoyalty,
      interestLevel: (p.potential || 0) >= 75 ? 3 : (p.potential || 0) >= 65 ? 2 : 1,
      flaggedWeek: career.week || 0,
      lastRefreshedWeek: career.week || 0,
      rivalInterest: 0,
      isStale: false,
    });
  }
  return entries;
}

// Mark stale entries (not refreshed within WATCHLIST_STALE_WEEKS)
export function tickWatchlistStaleness(watchlist, currentWeek) {
  return (watchlist || []).map(w => ({
    ...w,
    isStale: (currentWeek - (w.lastRefreshedWeek || w.flaggedWeek || 0)) >= WATCHLIST_STALE_WEEKS,
  }));
}

// Grow rival interest on high-potential, non-stale players
export function tickRivalInterest(watchlist, rngFn) {
  const fn = rngFn || Math.random;
  return (watchlist || []).map(w => {
    if (w.isStale || (w.rivalInterest || 0) >= 3) return w;
    const chance = (w.potential || 0) >= 75 ? 0.1 : (w.potential || 0) >= 65 ? 0.05 : 0.02;
    return fn() < chance ? { ...w, rivalInterest: Math.min(3, (w.rivalInterest || 0) + 1) } : w;
  });
}

// Process deployments that have returned this week — returns new watchlist entries + news
export function processReturningDeployments(career, currentWeek) {
  const deployments = career.scoutDeployments || [];
  const staffTasks = ensureStaffTasks(career);
  const focusBonus = recruitFocusIncrementalBonus(staffTasks, { interstate: false, leagueState: '' });
  const newEntries = [];
  const completedIds = [];
  const news = [];

  for (const d of deployments) {
    if (d.status !== 'active' || currentWeek < d.returnsWeek) continue;
    completedIds.push(d.id);
    const relScore = (career.leagueRelationships || {})[d.leagueKey]?.score ?? 0;
    const entries = generateWatchlistEntries(career, d.leagueKey, 2, focusBonus, relScore);
    newEntries.push(...entries);
    if (entries.length > 0) {
      const names = entries.map(e => `${e.firstName} ${e.lastName}`).join(' and ');
      news.push({ type: 'info', text: `Scout back from ${d.leagueName} — flagged ${names} for your watchlist.` });
    } else {
      news.push({ type: 'info', text: `Scout returned from ${d.leagueName} — no standout prospects this run, but the relationship is growing.` });
    }
  }

  return { newEntries, completedIds, news };
}
