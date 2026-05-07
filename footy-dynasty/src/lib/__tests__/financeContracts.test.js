import { describe, it, expect, beforeEach } from 'vitest';
import {
  proposeRenewal, buildRenewalQueue, applyRenewal, applyRenewalRejection, canAffordRenewal,
} from '../finance/contracts.js';
import { seedRng } from '../rng.js';

beforeEach(() => seedRng(123));

describe('proposeRenewal', () => {
  it('returns a structured proposal with positive demand for a young player', () => {
    const p = { id: 'p1', firstName: 'X', lastName: 'Y', age: 21, position: 'C', overall: 75, wage: 100_000, form: 75 };
    const out = proposeRenewal(p);
    expect(out.playerId).toBe('p1');
    expect(out.proposedWage).toBeGreaterThan(0);
    expect(out.proposedYears).toBeGreaterThanOrEqual(2);
    expect(out.band).toBe('young');
  });

  it('twilight band caps demand softer', () => {
    const p = { id: 'p2', firstName: 'X', lastName: 'Y', age: 35, position: 'C', overall: 70, wage: 100_000, form: 70 };
    const out = proposeRenewal(p);
    expect(out.band).toBe('twilight');
    expect(out.proposedYears).toBeLessThanOrEqual(2);
  });

  it('higher form yields a higher demand', () => {
    seedRng(99);
    const hot = proposeRenewal({ id: 'a', age: 26, wage: 100_000, form: 95 });
    seedRng(99);
    const flat = proposeRenewal({ id: 'a', age: 26, wage: 100_000, form: 50 });
    expect(hot.proposedWage).toBeGreaterThan(flat.proposedWage);
  });

  it('returns null for null input', () => {
    expect(proposeRenewal(null)).toBe(null);
  });
});

describe('buildRenewalQueue', () => {
  it('captures players whose contract <= 1', () => {
    const career = {
      squad: [
        { id: 'a', age: 24, wage: 100_000, form: 70, contract: 1 },
        { id: 'b', age: 24, wage: 100_000, form: 70, contract: 3 },
        { id: 'c', age: 24, wage: 100_000, form: 70, contract: 0 },
      ],
    };
    const queue = buildRenewalQueue(career);
    expect(queue.map(r => r.playerId).sort()).toEqual(['a', 'c']);
  });
});

describe('applyRenewal / Rejection', () => {
  it('accepting a renewal updates wage + extends contract years', () => {
    const career = { squad: [{ id: 'p1', wage: 100_000, contract: 1 }] };
    const proposal = { playerId: 'p1', proposedWage: 130_000, proposedYears: 3 };
    const patch = applyRenewal(career, proposal);
    expect(patch.squad[0].wage).toBe(130_000);
    expect(patch.squad[0].contract).toBe(4);
  });

  it('rejecting a renewal marks the player walking', () => {
    const career = { squad: [{ id: 'p1', wage: 100_000, contract: 1 }] };
    const patch = applyRenewalRejection(career, { playerId: 'p1' });
    expect(patch.squad[0]._walking).toBe(true);
  });

  it('canAffordRenewal returns false when proposal would breach the cap', () => {
    const career = {
      difficulty: 'contender',
      squad: [{ id: 'p1', wage: 1_000_000, contract: 1 }],
      finance: { wageBudget: 1_000_000 },
    };
    const proposal = { playerId: 'p1', proposedWage: 5_000_000, proposedYears: 3 };
    expect(canAffordRenewal(career, proposal)).toBe(false);
  });

  it('canAffordRenewal returns true when proposal fits within capOverflow', () => {
    const career = {
      difficulty: 'grassroots',
      squad: [{ id: 'p1', wage: 100_000, contract: 1 }],
      finance: { wageBudget: 1_000_000 },
    };
    const proposal = { playerId: 'p1', proposedWage: 150_000, proposedYears: 2 };
    expect(canAffordRenewal(career, proposal)).toBe(true);
  });
});
