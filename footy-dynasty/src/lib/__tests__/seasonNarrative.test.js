import { describe, it, expect } from 'vitest';
import { seasonNarrative } from '../seasonNarrative.js';

const makeCareer = (overrides = {}) => ({
  clubId: 'c1',
  clubName: 'Test FC',
  week: 10,
  phase: 'season',
  season: 2025,
  totalRounds: 23,
  inFinals: false,
  news: [],
  ...overrides,
});

const makeLadder = (clubId, pos, total = 12) => {
  return Array.from({ length: total }, (_, i) => ({
    id: i === pos - 1 ? clubId : `other_${i}`,
    pts: (total - i) * 4,
    played: 10,
  }));
};

describe('seasonNarrative — preseason', () => {
  it('returns preseason headline and neutral tone', () => {
    const career = makeCareer({ phase: 'preseason', week: 0 });
    const result = seasonNarrative(career, [], null);
    expect(result.headline).toBe('Preseason begins');
    expect(result.tone).toBe('neutral');
    expect(result.body).toContain('2025');
  });
});

describe('seasonNarrative — finals', () => {
  it('returns finals alive narrative when club is still in contention', () => {
    const career = makeCareer({
      inFinals: true,
      finalsAlive: ['c1', 'c2', 'c3', 'c4'],
    });
    const result = seasonNarrative(career, [], null);
    expect(result.headline).toContain('alive');
    expect(result.tone).toBe('tense');
    expect(result.body).toContain('4 teams remain');
  });

  it('returns season over when club is eliminated', () => {
    const career = makeCareer({
      inFinals: true,
      finalsAlive: ['c2', 'c3'],
    });
    const result = seasonNarrative(career, [], null);
    expect(result.headline).toBe('Season over');
    expect(result.tone).toBe('negative');
  });

  it('labels Grand Final when 2 finalists remain', () => {
    const career = makeCareer({
      inFinals: true,
      finalsAlive: ['c1', 'c2'],
    });
    const result = seasonNarrative(career, [], null);
    expect(result.headline).toContain('Grand Final');
  });

  it('labels Preliminary Final when 4 remain', () => {
    const career = makeCareer({
      inFinals: true,
      finalsAlive: ['c1', 'c2', 'c3', 'c4'],
    });
    const result = seasonNarrative(career, [], null);
    expect(result.headline).toContain('Preliminary Final');
  });
});

describe('seasonNarrative — season without ladder row', () => {
  it('returns round underway for missing ladder row', () => {
    const career = makeCareer({ week: 8 });
    const result = seasonNarrative(career, [], null);
    expect(result.headline).toContain('Round 8');
    expect(result.tone).toBe('neutral');
  });
});

describe('seasonNarrative — early season (rounds 1-4)', () => {
  it('returns early doors headline', () => {
    const career = makeCareer({ week: 2 });
    const ladder = makeLadder('c1', 3, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.headline).toContain('Early doors');
    expect(result.headline).toContain('2');
  });

  it('tone is positive when inside finals zone', () => {
    const career = makeCareer({ week: 3 });
    const ladder = makeLadder('c1', 2, 12); // top 8, position 2
    const result = seasonNarrative(career, ladder, null);
    expect(result.tone).toBe('positive');
  });

  it('tone is negative when losing record outside finals', () => {
    const career = makeCareer({
      week: 3,
      news: [
        { type: 'loss', week: 3 },
        { type: 'loss', week: 2 },
        { type: 'win', week: 1 },
      ],
    });
    const ladder = makeLadder('c1', 11, 12); // outside finals
    const result = seasonNarrative(career, ladder, null);
    expect(result.tone).toBe('negative');
  });
});

describe('seasonNarrative — mid season', () => {
  it('returns mid-season headline with round info', () => {
    const career = makeCareer({ week: 12, totalRounds: 23 });
    const ladder = makeLadder('c1', 4, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.headline).toContain('Mid-season');
    expect(result.headline).toContain('12');
  });

  it('mentions rounds left in body', () => {
    const career = makeCareer({ week: 12, totalRounds: 23 });
    const ladder = makeLadder('c1', 4, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.body).toContain('11 rounds');
  });

  it('mentions gap to finals when outside the zone', () => {
    const career = makeCareer({ week: 12, totalRounds: 23 });
    const ladder = makeLadder('c1', 10, 12); // outside top 8
    const result = seasonNarrative(career, ladder, null);
    expect(result.body).toContain('top');
  });

  it('includes flag encouragement when inside top 2', () => {
    const career = makeCareer({ week: 12, totalRounds: 23 });
    const ladder = makeLadder('c1', 1, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.body).toContain('flag');
  });

  it('includes hold position message when in finals 3-8', () => {
    const career = makeCareer({ week: 12, totalRounds: 23 });
    const ladder = makeLadder('c1', 5, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.body).toContain('Hold position');
  });
});

describe('seasonNarrative — run home (last 5 rounds)', () => {
  it('returns run home headline', () => {
    const career = makeCareer({ week: 20, totalRounds: 23 });
    const ladder = makeLadder('c1', 4, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.headline).toContain('Run home');
  });

  it('tone is tense when inside finals', () => {
    const career = makeCareer({ week: 20, totalRounds: 23 });
    const ladder = makeLadder('c1', 4, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.tone).toBe('tense');
  });

  it('tone is negative when outside finals', () => {
    const career = makeCareer({ week: 20, totalRounds: 23 });
    const ladder = makeLadder('c1', 11, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.tone).toBe('negative');
    expect(result.body).toContain('mathematical');
  });

  it('mentions last round correctly', () => {
    const career = makeCareer({ week: 22, totalRounds: 23 });
    const ladder = makeLadder('c1', 3, 12);
    const result = seasonNarrative(career, ladder, null);
    expect(result.body).toContain('One game');
  });
});
