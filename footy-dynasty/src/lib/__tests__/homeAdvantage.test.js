import { describe, it, expect } from 'vitest';
import { homeAdvantagePlayerCareer, homeAdvantageAiHome } from '../homeAdvantage.js';
import { getClubGround } from '../../data/grounds.js';
import { findClub, findLeagueOf } from '../../data/pyramid.js';

describe('homeAdvantage', () => {
  it('player career home edge stays within engine band', () => {
    const club = findClub('mel');
    const league = findLeagueOf('mel');
    const ground = getClubGround(club, 2, league.tier);
    const career = {
      finance: { fanHappiness: 55, boardConfidence: 55 },
      coachReputation: 40,
      week: 1,
      weeklyWeather: {},
      groundCondition: 80,
      homeWinStreak: 0,
      inFinals: false,
    };
    const ha = homeAdvantagePlayerCareer(career, league, ground);
    expect(ha).toBeGreaterThanOrEqual(1);
    expect(ha).toBeLessThanOrEqual(14);
  });

  it('AI home edge stays within band for state league', () => {
    const league = { tier: 2, clubs: [] };
    const ground = { capacity: 12000, homeAdvantageBase: 5, roofed: false };
    const ha = homeAdvantageAiHome(league, ground, false, 'fine');
    expect(ha).toBeGreaterThanOrEqual(1);
    expect(ha).toBeLessThanOrEqual(12);
  });
});
