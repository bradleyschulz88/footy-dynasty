import { describe, it, expect, beforeEach } from 'vitest';
import {
  getJobInterviewQuestion,
  getJobFollowUpInterview,
} from '../coachReputation.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(99));

describe('getJobInterviewQuestion', () => {
  const makeOffer = (overrides = {}) => ({
    leagueTier: 2,
    minReputation: 40,
    ...overrides,
  });

  it('returns a question string and an array of options', () => {
    const career = { coachReputation: 55 };
    const offer = makeOffer();
    const result = getJobInterviewQuestion(offer, career);
    expect(typeof result.question).toBe('string');
    expect(Array.isArray(result.options)).toBe(true);
    expect(result.options.length).toBeGreaterThanOrEqual(1);
  });

  it('each option has id, label, and a numeric startingBoardBonus', () => {
    const career = { coachReputation: 60 };
    const offer = makeOffer();
    const result = getJobInterviewQuestion(offer, career);
    result.options.forEach(o => {
      expect(o.id).toBeTruthy();
      expect(typeof o.label).toBe('string');
      expect(typeof o.startingBoardBonus).toBe('number');
    });
  });

  it('warm path (rep well above minReputation) produces culture/list options', () => {
    const career = { coachReputation: 70 };
    const offer = makeOffer({ minReputation: 30 }); // warm: 70 >= 30 + 12
    const result = getJobInterviewQuestion(offer, career);
    const ids = result.options.map(o => o.id);
    expect(ids).toContain('culture');
    expect(ids).toContain('list');
  });

  it('cold path (rep below threshold) produces humble/bold options', () => {
    const career = { coachReputation: 30 };
    const offer = makeOffer({ minReputation: 50 }); // cold: 30 < 50 + 12
    const result = getJobInterviewQuestion(offer, career);
    const ids = result.options.map(o => o.id);
    expect(ids).toContain('humble');
    expect(ids).toContain('bold');
  });

  it('question mentions flag talk for tier-1 jobs', () => {
    const career = { coachReputation: 60 };
    const offer = makeOffer({ leagueTier: 1, minReputation: 40 });
    const result = getJobInterviewQuestion(offer, career);
    expect(result.question).toContain('flag');
  });

  it('question mentions member patience for tier-2 jobs', () => {
    const career = { coachReputation: 60 };
    const offer = makeOffer({ leagueTier: 2, minReputation: 40 });
    const result = getJobInterviewQuestion(offer, career);
    expect(result.question).toContain('member');
  });

  it('question mentions volunteers for tier-3 jobs', () => {
    const career = { coachReputation: 60 };
    const offer = makeOffer({ leagueTier: 3, minReputation: 20 });
    const result = getJobInterviewQuestion(offer, career);
    expect(result.question).toContain('volunteers');
  });

  it('handles missing career coachReputation (defaults to 30)', () => {
    const offer = makeOffer({ minReputation: 10 });
    const result = getJobInterviewQuestion(offer, {});
    expect(result.question).toBeTruthy();
    expect(result.options.length).toBeGreaterThan(0);
  });
});

describe('getJobFollowUpInterview', () => {
  const makeOffer = (tier = 2) => ({ leagueTier: tier });

  it('returns a question string and array of options', () => {
    const offer = makeOffer(2);
    const result = getJobFollowUpInterview(offer, {}, 0);
    expect(typeof result.question).toBe('string');
    expect(Array.isArray(result.options)).toBe(true);
    expect(result.options.length).toBeGreaterThanOrEqual(2);
  });

  it('each option has id, label, and numeric startingBoardBonus', () => {
    const offer = makeOffer(2);
    const result = getJobFollowUpInterview(offer, {}, 0);
    result.options.forEach(o => {
      expect(o.id).toBeTruthy();
      expect(typeof o.label).toBe('string');
      expect(typeof o.startingBoardBonus).toBe('number');
    });
  });

  it('aggressive path (tier 1) asks about losing streaks in papers', () => {
    const offer = makeOffer(1);
    const result = getJobFollowUpInterview(offer, {}, 0);
    expect(result.question).toContain('losing streak');
  });

  it('aggressive path also triggers when firstBonus >= 4', () => {
    const offer = makeOffer(3);
    const result = getJobFollowUpInterview(offer, {}, 4);
    expect(result.question).toContain('losing streak');
  });

  it('non-aggressive path asks about medical/conditioning spend', () => {
    const offer = makeOffer(3);
    const result = getJobFollowUpInterview(offer, {}, 0);
    expect(result.question).toContain('medical');
  });

  it('aggressive path options include shield and open', () => {
    const offer = makeOffer(1);
    const result = getJobFollowUpInterview(offer, {}, 0);
    const ids = result.options.map(o => o.id);
    expect(ids).toContain('shield');
    expect(ids).toContain('open');
  });

  it('non-aggressive path options include invest_med and hold', () => {
    const offer = makeOffer(3);
    const result = getJobFollowUpInterview(offer, {}, 0);
    const ids = result.options.map(o => o.id);
    expect(ids).toContain('invest_med');
    expect(ids).toContain('hold');
  });

  it('shield option has positive startingBoardBonus on aggressive path', () => {
    const offer = makeOffer(1);
    const result = getJobFollowUpInterview(offer, {}, 0);
    const shield = result.options.find(o => o.id === 'shield');
    expect(shield.startingBoardBonus).toBeGreaterThan(0);
  });

  it('open option has negative startingBoardBonus on aggressive path', () => {
    const offer = makeOffer(1);
    const result = getJobFollowUpInterview(offer, {}, 0);
    const open = result.options.find(o => o.id === 'open');
    expect(open.startingBoardBonus).toBeLessThan(0);
  });
});
