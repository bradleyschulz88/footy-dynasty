import { describe, it, expect } from 'vitest';
import {
  addDays, formatDate, formatMonth, getMonth, getYear, getDayOfMonth, getDayOfWeek,
  isSameMonth, startOfMonth, daysInMonth, prevMonth, nextMonth,
  applyTraining, generateSeasonCalendar,
} from '../calendar.js';
import { generateFixtures } from '../leagueEngine.js';

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------
describe('addDays', () => {
  it('adds 7 days within same month', () => {
    expect(addDays('2025-12-01', 7)).toBe('2025-12-08');
  });

  it('crosses a month boundary', () => {
    expect(addDays('2025-12-28', 5)).toBe('2026-01-02');
  });

  it('adding 0 returns the same date', () => {
    expect(addDays('2025-12-01', 0)).toBe('2025-12-01');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string containing a day number and month string', () => {
    const result = formatDate('2025-12-01');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/1/);
    expect(result).toMatch(/Dec/i);
  });
});

describe('getMonth', () => {
  it('extracts the month number', () => {
    expect(getMonth('2025-12-01')).toBe(12);
  });
});

describe('getYear', () => {
  it('extracts the year', () => {
    expect(getYear('2026-03-21')).toBe(2026);
  });
});

describe('getDayOfMonth', () => {
  it('extracts the day of month', () => {
    expect(getDayOfMonth('2026-03-21')).toBe(21);
  });
});

describe('getDayOfWeek', () => {
  it('returns 1 for Monday Dec 1 2025', () => {
    expect(getDayOfWeek('2025-12-01')).toBe(1);
  });
});

describe('isSameMonth', () => {
  it('returns true for two dates in the same month', () => {
    expect(isSameMonth('2025-12-01', '2025-12-31')).toBe(true);
  });

  it('returns false for dates in different months', () => {
    expect(isSameMonth('2025-12-31', '2026-01-01')).toBe(false);
  });
});

describe('startOfMonth', () => {
  it('returns the first day of the month', () => {
    expect(startOfMonth('2025-12-15')).toBe('2025-12-01');
  });
});

describe('daysInMonth', () => {
  it('returns 28 for February 2026 (non-leap year)', () => {
    expect(daysInMonth('2026-02-01')).toBe(28);
  });

  it('returns 31 for January 2026', () => {
    expect(daysInMonth('2026-01-01')).toBe(31);
  });
});

describe('prevMonth', () => {
  it('moves back from January to December of previous year', () => {
    expect(prevMonth('2026-01-01')).toBe('2025-12-01');
  });
});

describe('nextMonth', () => {
  it('advances from December 2025 to January 2026', () => {
    expect(nextMonth('2025-12-01')).toBe('2026-01-01');
  });

  it('crosses a year boundary', () => {
    expect(nextMonth('2026-12-01')).toBe('2027-01-01');
  });
});

// ---------------------------------------------------------------------------
// applyTraining
// ---------------------------------------------------------------------------
describe('applyTraining', () => {
  const makePlayer = (id, overrides = {}) => ({
    id,
    overall: 70,
    attrs: { kicking: 70, marking: 70, handball: 70 },
    ...overrides,
  });

  it('returns correct shape', () => {
    const squad = [makePlayer('p1'), makePlayer('p2')];
    const result = applyTraining(squad, ['p1'], 'ball_drill', []);
    expect(result).toHaveProperty('squad');
    expect(result).toHaveProperty('gains');
    expect(result).toHaveProperty('staffName');
    expect(result).toHaveProperty('staffRating');
  });

  it('empty lineup returns squad unchanged and empty gains', () => {
    const squad = [makePlayer('p1'), makePlayer('p2')];
    const result = applyTraining(squad, [], 'ball_drill', []);
    expect(result.squad).toBe(squad);
    expect(result.gains).toEqual({});
  });

  it('unknown subtype returns squad unchanged', () => {
    const squad = [makePlayer('p1')];
    const result = applyTraining(squad, ['p1'], 'nonexistent_subtype', []);
    expect(result.squad).toBe(squad);
    expect(result.gains).toEqual({});
  });

  it('only lineup players are affected', () => {
    const p1 = makePlayer('p1');
    const p2 = makePlayer('p2');
    const squad = [p1, p2];
    const { squad: newSquad } = applyTraining(squad, ['p1'], 'ball_drill', []);
    const unchanged = newSquad.find(p => p.id === 'p2');
    expect(unchanged.attrs).toEqual(p2.attrs);
  });

  it('attrs in ball_drill can increase over many iterations', () => {
    const attrIncreased = Array.from({ length: 20 }).some(() => {
      const squad = [makePlayer('p1')];
      const { squad: newSquad } = applyTraining(squad, ['p1'], 'ball_drill', []);
      const updated = newSquad.find(p => p.id === 'p1');
      return (
        updated.attrs.kicking > 70 ||
        updated.attrs.marking > 70 ||
        updated.attrs.handball > 70
      );
    });
    expect(attrIncreased).toBe(true);
  });

  it('staffName matches the staff member name when id matches', () => {
    const staff = [{ id: 's2', name: 'Jane Smith', rating: 75 }];
    const squad = [makePlayer('p1')];
    const { staffName } = applyTraining(squad, ['p1'], 'ball_drill', staff);
    expect(staffName).toBe('Jane Smith');
  });

  it('staffRating matches the staff member rating', () => {
    const staff = [{ id: 's2', name: 'Jane Smith', rating: 80 }];
    const squad = [makePlayer('p1')];
    const { staffRating } = applyTraining(squad, ['p1'], 'ball_drill', staff);
    expect(staffRating).toBe(80);
  });

  it('gains are all non-negative', () => {
    const staff = [{ id: 's2', name: 'Coach', rating: 75 }];
    const squad = [makePlayer('p1'), makePlayer('p2')];
    const { gains } = applyTraining(squad, ['p1', 'p2'], 'ball_drill', staff);
    Object.values(gains).forEach(g => expect(g).toBeGreaterThanOrEqual(0));
  });
});

// ---------------------------------------------------------------------------
// generateSeasonCalendar
// ---------------------------------------------------------------------------
describe('generateSeasonCalendar', () => {
  const clubs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const fixtures = generateFixtures(clubs);
  const events = generateSeasonCalendar(2026, clubs, fixtures, 'a');

  it('returns a non-empty array', () => {
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  it('all events are sorted in ascending date order', () => {
    for (let i = 1; i < events.length; i++) {
      expect(events[i].date >= events[i - 1].date).toBe(true);
    }
  });

  it('all events start with completed: false', () => {
    events.forEach(ev => expect(ev.completed).toBe(false));
  });

  it('all events have a unique id field', () => {
    const ids = events.map(ev => ev.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('training events only fall on Mon/Wed/Fri', () => {
    const training = events.filter(ev => ev.type === 'training');
    expect(training.length).toBeGreaterThan(0);
    training.forEach(ev => {
      const dow = getDayOfWeek(ev.date);
      expect([1, 3, 5]).toContain(dow);
    });
  });

  it('training events all have dates between 2025-12-01 and 2026-02-28', () => {
    const training = events.filter(ev => ev.type === 'training');
    training.forEach(ev => {
      expect(ev.date >= '2025-12-01').toBe(true);
      expect(ev.date <= '2026-02-28').toBe(true);
    });
  });

  it('exactly 3 key_event events exist', () => {
    const keyEvents = events.filter(ev => ev.type === 'key_event');
    expect(keyEvents.length).toBe(3);
  });

  it('key events have the correct dates', () => {
    const keyEvents = events.filter(ev => ev.type === 'key_event');
    const dates = keyEvents.map(ev => ev.date).sort();
    expect(dates).toEqual(['2025-12-15', '2026-01-10', '2026-02-15']);
  });

  it('exactly 2 preseason_match events exist', () => {
    const preMatches = events.filter(ev => ev.type === 'preseason_match');
    expect(preMatches.length).toBe(2);
  });

  it('both preseason_match events have homeId equal to the clubId', () => {
    const preMatches = events.filter(ev => ev.type === 'preseason_match');
    preMatches.forEach(ev => expect(ev.homeId).toBe('a'));
  });

  it('round events exist (one per fixture round)', () => {
    const rounds = events.filter(ev => ev.type === 'round');
    expect(rounds.length).toBe(fixtures.length);
  });

  it('round events all have phase season', () => {
    const rounds = events.filter(ev => ev.type === 'round');
    rounds.forEach(ev => expect(ev.phase).toBe('season'));
  });

  it('round dates are correct', () => {
    const rounds = events.filter(ev => ev.type === 'round').sort((a, b) => a.round - b.round);
    expect(rounds[0].date).toBe('2026-03-21');
    expect(rounds[1].date).toBe('2026-03-28');
    expect(rounds[2].date).toBe('2026-04-04');
  });

  it('no duplicate event ids', () => {
    const ids = events.map(ev => ev.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
