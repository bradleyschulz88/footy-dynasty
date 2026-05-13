import { describe, it, expect } from 'vitest';
import { themedRoundForNumber } from '../themedRounds.js';

describe('themedRoundForNumber', () => {
  it('returns Opening Round for round 1', () => {
    expect(themedRoundForNumber(1)?.short).toBe('Opening Round');
  });

  it('returns Anzac Round for round 8', () => {
    expect(themedRoundForNumber(8)?.short).toBe('Anzac Round');
  });

  it('returns null for unknown rounds', () => {
    expect(themedRoundForNumber(99)).toBe(null);
  });
});
