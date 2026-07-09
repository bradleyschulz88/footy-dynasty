import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  evaluateAchievements,
  syncAchievements,
} from '../achievements.js';

const has = (career, id) => evaluateAchievements(career).has(id);

describe('achievements catalog', () => {
  it('has unique, non-empty stable ids and descriptions', () => {
    expect(ACHIEVEMENT_IDS.length).toBe(ACHIEVEMENTS.length);
    expect(new Set(ACHIEVEMENT_IDS).size).toBe(ACHIEVEMENT_IDS.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toMatch(/^[A-Z0-9_]+$/); // Steam API-name shape
      expect(a.name && a.desc).toBeTruthy();
    }
  });
});

describe('evaluateAchievements — derivation from persisted state', () => {
  it('counts premierships for FIRST_FLAG and DYNASTY', () => {
    expect(has({ coachStats: { premierships: 1 } }, 'FIRST_FLAG')).toBe(true);
    expect(has({ coachStats: { premierships: 1 } }, 'DYNASTY')).toBe(false);
    expect(has({ coachStats: { premierships: 5 } }, 'DYNASTY')).toBe(true);
  });

  it('BACK_TO_BACK needs consecutive champion seasons', () => {
    const gap = { history: [{ champion: true, season: 3 }, { champion: true, season: 5 }] };
    const run = { history: [{ champion: true, season: 3 }, { champion: true, season: 4 }] };
    expect(has(gap, 'BACK_TO_BACK')).toBe(false);
    expect(has(run, 'BACK_TO_BACK')).toBe(true);
  });

  it('FROM_THE_ASHES needs a wooden spoon strictly before a flag', () => {
    const before = { history: [{ woodenSpoon: true, season: 2 }, { champion: true, season: 4 }] };
    const after = { history: [{ champion: true, season: 2 }, { woodenSpoon: true, season: 4 }] };
    expect(has(before, 'FROM_THE_ASHES')).toBe(true);
    expect(has(after, 'FROM_THE_ASHES')).toBe(false);
  });

  it('reads promotions, AFLW flags, games, seasons, debt-free flag, bloodline, vision', () => {
    expect(has({ coachStats: { promotions: 1 } }, 'ON_THE_RISE')).toBe(true);
    expect(has({ aflw: { premierships: 2 } }, 'AFLW_FLAG')).toBe(true);
    expect(has({ coachStats: { totalWins: 60, totalLosses: 39, totalDraws: 1 } }, 'CENTURION')).toBe(true);
    expect(has({ coachStats: { totalWins: 50, totalLosses: 40 } }, 'CENTURION')).toBe(false);
    expect(has({ coachStats: { seasonsManaged: 10 } }, 'CLUB_LEGEND')).toBe(true);
    expect(has({ history: [{ champion: true, debtFree: true, season: 1 }] }, 'SOUND_BOOKS')).toBe(true);
    expect(has({ history: [{ champion: true, debtFree: false, season: 1 }] }, 'SOUND_BOOKS')).toBe(false);
    expect(has({ fatherSonPipeline: [{ id: 'x' }] }, 'BLOODLINE')).toBe(true);
    expect(has({ board: { visionsAchieved: 1 } }, 'VISIONARY')).toBe(true);
  });

  it('empty/undefined career earns nothing and does not throw', () => {
    expect(evaluateAchievements(undefined).size).toBe(0);
    expect(evaluateAchievements({}).size).toBe(0);
  });
});

describe('syncAchievements — persist + newly-unlocked diff', () => {
  it('returns each unlock once, persists in catalog order, and pushes news', () => {
    const career = { coachStats: { premierships: 1, promotions: 1 } };

    const first = syncAchievements(career);
    expect(first.sort()).toEqual(['FIRST_FLAG', 'ON_THE_RISE'].sort());
    expect(career.achievements).toEqual(
      ACHIEVEMENT_IDS.filter((id) => id === 'FIRST_FLAG' || id === 'ON_THE_RISE'),
    );
    expect((career.news || []).filter((n) => /Achievement unlocked/.test(n.text))).toHaveLength(2);

    // Idempotent: nothing new on a repeat call.
    expect(syncAchievements(career)).toEqual([]);

    // A later flag adds only the new one.
    career.coachStats.premierships = 5;
    expect(syncAchievements(career)).toEqual(['DYNASTY']);
    expect(career.achievements).toContain('DYNASTY');
  });
});
