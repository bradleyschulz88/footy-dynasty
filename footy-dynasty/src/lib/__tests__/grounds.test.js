import { describe, it, expect } from 'vitest';
import { getClubGround, GROUND_BY_CLUB_ID } from '../../data/grounds.js';

describe('getClubGround', () => {
  it('returns tier-1 AFL venue for mapped club ids', () => {
    const g = getClubGround({ id: 'mel', name: 'Melbourne', short: 'MEL', state: 'VIC' }, 1, 1);
    expect(g.shortName).toBe(GROUND_BY_CLUB_ID.mel.shortName);
    expect(g.capacity).toBe(GROUND_BY_CLUB_ID.mel.capacity);
  });

  it('uses leagueTier to pick community vs state-league synthesis when not in AFL map', () => {
    const club = { id: 'fictional_tier3_side', name: 'Example FC', short: 'EX', state: 'VIC', tier: 2 };
    const t3 = getClubGround(club, 2, 3);
    const t2 = getClubGround(club, 2, 2);
    expect(t3.capacity).not.toBe(t2.capacity);
    expect(t3.tierHint).toBe(3);
    expect(t2.tierHint).toBe(2);
    expect(t3.name).toMatch(/Ground$/);
    expect(t2.name).toContain('Football Ground');
  });
});
