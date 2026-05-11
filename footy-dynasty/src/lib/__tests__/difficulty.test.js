import { describe, it, expect } from 'vitest';
import { DIFFICULTY_IDS, getDifficultyConfig, getDifficultyProfile, shouldShowTutorial } from '../difficulty.js';

describe('getDifficultyProfile', () => {
  it('merges display and mechanics for each id', () => {
    DIFFICULTY_IDS.forEach((id) => {
      const p = getDifficultyProfile(id);
      expect(p.id).toBe(id);
      expect(p.label).toBeTruthy();
      expect(p.summary).toBeTruthy();
      expect(typeof p.boardPatienceSeasons).toBe('number');
      expect(p).toMatchObject(getDifficultyConfig(id));
    });
  });
});

describe('getDifficultyConfig', () => {
  it('returns a config for every known difficulty', () => {
    DIFFICULTY_IDS.forEach(id => {
      const cfg = getDifficultyConfig(id);
      expect(cfg).toBeTruthy();
      expect(typeof cfg.boardLossConfidence).toBe('number');
    });
  });

  it('grassroots is more forgiving than legend on every axis', () => {
    const g = getDifficultyConfig('grassroots');
    const l = getDifficultyConfig('legend');
    expect(g.boardPatienceSeasons).toBeGreaterThan(l.boardPatienceSeasons);
    expect(g.cashMultiplier).toBeGreaterThan(l.cashMultiplier);
    expect(g.injuryMultiplier).toBeLessThan(l.injuryMultiplier);
    expect(g.scoutAccuracyBonus).toBeGreaterThan(l.scoutAccuracyBonus);
    expect(g.transferBudgetMultiplier).toBeGreaterThan(l.transferBudgetMultiplier);
    expect(g.moraleFloor).toBeGreaterThan(l.moraleFloor);
    expect(g.sponsorMultiplier).toBeGreaterThan(l.sponsorMultiplier);
  });

  it('contender keeps current balance (1.0× cash, 1.0× sponsor)', () => {
    const c = getDifficultyConfig('contender');
    expect(c.cashMultiplier).toBe(1.0);
    expect(c.sponsorMultiplier).toBe(1.0);
    expect(c.injuryMultiplier).toBe(1.0);
  });

  it('falls back to contender for an unknown difficulty', () => {
    expect(getDifficultyConfig('chaos')).toEqual(getDifficultyConfig('contender'));
  });

  it('legend hides assistant tips', () => {
    expect(getDifficultyConfig('legend').showAssistantTips).toBe(false);
    expect(getDifficultyConfig('grassroots').showAssistantTips).toBe(true);
  });

  it('vote survival shift nudges confidence votes on grassroots vs legend', () => {
    expect(getDifficultyConfig('grassroots').voteSurvivalShift).toBeGreaterThan(0);
    expect(getDifficultyConfig('legend').voteSurvivalShift).toBeLessThan(0);
    expect(getDifficultyConfig('contender').voteSurvivalShift).toBe(0);
  });
});

describe('shouldShowTutorial', () => {
  it('always shows on grassroots', () => {
    expect(shouldShowTutorial({ difficulty: 'grassroots', isFirstCareer: false })).toBe(true);
  });
  it('only shows on contender for the first career', () => {
    expect(shouldShowTutorial({ difficulty: 'contender', isFirstCareer: true })).toBe(true);
    expect(shouldShowTutorial({ difficulty: 'contender', isFirstCareer: false })).toBe(false);
  });
  it('never shows on legend', () => {
    expect(shouldShowTutorial({ difficulty: 'legend',     isFirstCareer: true })).toBe(false);
    expect(shouldShowTutorial({ difficulty: 'legend',     isFirstCareer: false })).toBe(false);
  });
});
