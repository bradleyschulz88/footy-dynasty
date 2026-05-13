import { describe, it, expect } from 'vitest';
import { aiPersonalityForClub, resolveAiOppTactic } from '../aiPersonality.js';

describe('aiPersonalityForClub', () => {
  it('is stable for the same club id', () => {
    const a = aiPersonalityForClub('carlton');
    const b = aiPersonalityForClub('carlton');
    expect(a.preferredTactic).toBe(b.preferredTactic);
    expect(a.tradeAggression).toBe(b.tradeAggression);
  });

  it('differs across club ids usually', () => {
    const ids = ['col', 'gee', 'ess', 'haw', 'ric'];
    const tactics = new Set(ids.map((id) => aiPersonalityForClub(id).preferredTactic));
    expect(tactics.size).toBeGreaterThan(1);
  });
});

describe('resolveAiOppTactic', () => {
  it('returns a known tactic string', () => {
    const t = resolveAiOppTactic('carlton', 72, 70);
    expect(['defensive', 'balanced', 'attack', 'flood', 'press', 'run']).toContain(t);
  });
});
