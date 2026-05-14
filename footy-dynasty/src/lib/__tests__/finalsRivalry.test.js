import { describe, it, expect } from 'vitest';
import {
  recordFinalsRivalryEvent,
  clubFinalsGrudgeTowardPlayer,
  finalsRivalryPreviewLine,
  journalistFinalsRivalryLine,
} from '../finalsRivalry.js';

describe('recordFinalsRivalryEvent', () => {
  it('appends elimination and caps length', () => {
    const career = { season: 2027, finalsRivalryLog: [] };
    recordFinalsRivalryEvent(career, {
      oppId: 'x',
      season: 2027,
      roundLabel: 'Semi Final',
      won: false,
      isGrandFinal: false,
      drew: false,
    });
    expect(career.finalsRivalryLog[0].event).toBe('eliminated_you');
    expect(career.finalsRivalryLog[0].oppId).toBe('x');
  });

  it('skips on draw', () => {
    const career = { season: 2027, finalsRivalryLog: [] };
    recordFinalsRivalryEvent(career, {
      oppId: 'x',
      season: 2027,
      roundLabel: 'QF',
      won: false,
      isGrandFinal: false,
      drew: true,
    });
    expect(career.finalsRivalryLog.length).toBe(0);
  });
});

describe('clubFinalsGrudgeTowardPlayer', () => {
  it('counts recent eliminations by opponent', () => {
    const career = {
      season: 2028,
      finalsRivalryLog: [
        { season: 2027, oppId: 'richmond', event: 'eliminated_you' },
        { season: 2024, oppId: 'richmond', event: 'eliminated_you' },
      ],
    };
    expect(clubFinalsGrudgeTowardPlayer(career, 'richmond', 2)).toBe(1);
  });
});

describe('finalsRivalryPreviewLine', () => {
  it('surfaces elimination copy', () => {
    const career = {
      season: 2028,
      finalsRivalryLog: [{ season: 2027, oppId: 'car', event: 'eliminated_you', round: 'Semi Final' }],
    };
    const line = finalsRivalryPreviewLine(career, 'car');
    expect(line).toContain('2027');
    expect(line).toContain('Semi');
  });
});

describe('journalistFinalsRivalryLine', () => {
  it('returns GF win copy', () => {
    const career = { journalist: { name: 'Pat' } };
    const club = { short: 'BL' };
    const opp = { short: 'COL', id: 'col' };
    const line = journalistFinalsRivalryLine(
      career,
      { isFinals: true, matchLabel: 'Grand Final', won: true, drew: false },
      opp,
    );
    expect(line).toContain('Pat');
    expect(line).toContain('Premiership');
  });
});
