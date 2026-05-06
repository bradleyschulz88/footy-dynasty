// ---------------------------------------------------------------------------
// Coach Reputation, Tier, Job Market (Spec Section 3F)
// ---------------------------------------------------------------------------
import { ALL_CLUBS, findLeagueOf } from '../data/pyramid.js';
import { clamp } from './format.js';
import { rand, pick, rng } from './rng.js';

export const COACH_TIERS = ['Rookie', 'Journeyman', 'Respected', 'Elite', 'Legend'];

export function coachTierFromScore(score) {
  if (score >= 80) return 'Legend';
  if (score >= 60) return 'Elite';
  if (score >= 40) return 'Respected';
  if (score >= 20) return 'Journeyman';
  return 'Rookie';
}

// End-of-season reputation adjustment.
// args: { premiership, finals, relegated, promoted, winRate }
export function applyEndOfSeasonReputation(rep, args) {
  let r = rep ?? 30;
  if (args.premiership)            r += 15;
  else if (args.finals)            r += 5;
  if (args.promoted)               r += 4;
  if (args.relegated)              r -= 8;
  if (args.winRate != null) {
    if (args.winRate > 0.6)        r += 3;
    else if (args.winRate < 0.35)  r -= 4;
  }
  return clamp(r, 0, 100);
}

// Sacking reputation cost. Worse if you were highly rated previously.
export function applySackingReputation(rep) {
  const r = clamp((rep ?? 30) - 12, 0, 100);
  return r;
}

// Build a job listing for a single club. Returns a structured offer.
function buildJobListing(club, league, career) {
  // Synthesize plausible flavour from club id hash
  const hash = club.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const ladderPos = (hash % 10) + 1;
  const formChars = 'WLD';
  const recentForm = Array.from({ length: 5 }, (_, i) => formChars[(hash + i) % 3]);
  const finance = ['Tight', 'Moderate', 'Good'][hash % 3];
  const expectations = league.tier === 1
    ? ['Premiership in 3 seasons', 'Finals every year', 'Full rebuild — patience guaranteed', 'Top-4 inside 2 seasons']
    : league.tier === 2
    ? ['Promotion to AFL within 4 seasons', 'Finals appearance this year', 'Stabilise the club after a turbulent decade', 'Develop home-grown stars']
    : ['Restore community pride', 'Win the local flag', 'Bring in young talent', 'Rebuild the senior list from scratch'];
  const tierWageBase = league.tier === 1 ? 480000 : league.tier === 2 ? 180000 : 65000;
  const wage = Math.round(tierWageBase * (0.85 + (hash % 30) / 100));
  const chairmanLine = league.tier === 3
    ? `"We're a small club with big heart. We'd love to have you on board."`
    : league.tier === 2
    ? `"This club's got history and ambition. We need a coach who can match it."`
    : `"You've earned a shot at this level. Help us build something special."`;
  return {
    clubId: club.id,
    leagueKey: league.key,
    leagueShort: league.short,
    leagueTier: league.tier,
    clubName: club.name,
    clubShort: club.short,
    color: club.colors?.[0] || '#64748B',
    ladderPos,
    recentForm,
    finance,
    expectations: pick(expectations),
    wage,
    chairmanLine,
  };
}

// Generate available jobs filtered by the coach's tier + current club exclusion.
export function generateJobMarket(career) {
  const tier = coachTierFromScore(career.coachReputation ?? 30);
  const wantTiers = {
    Rookie:      [3, 3, 3, 3, 2],
    Journeyman:  [3, 3, 2, 2, 2, 1],
    Respected:   [2, 2, 2, 1, 1],
    Elite:       [1, 1, 1, 1, 2],
    Legend:      [1, 1, 1, 1, 1, 2],
  }[tier] || [3, 3];

  const excludeIds = new Set([career.clubId, ...((career.previousClubs || []).slice(-2).map(p => p.clubId))]);
  const offers = [];
  const seenIds = new Set();
  for (const wantTier of wantTiers) {
    const candidates = ALL_CLUBS.filter(c => {
      if (excludeIds.has(c.id) || seenIds.has(c.id)) return false;
      const lg = findLeagueOf(c.id);
      return lg && lg.tier === wantTier;
    });
    if (!candidates.length) continue;
    const club = pick(candidates);
    seenIds.add(club.id);
    const lg = findLeagueOf(club.id);
    offers.push(buildJobListing(club, lg, career));
  }
  return offers;
}

// Take-a-season-off recovery: reputation +5, no offers this round.
export function takeSeasonOff(career) {
  return {
    coachReputation: clamp((career.coachReputation ?? 30) + 5, 0, 100),
    coachTier: coachTierFromScore((career.coachReputation ?? 30) + 5),
  };
}
