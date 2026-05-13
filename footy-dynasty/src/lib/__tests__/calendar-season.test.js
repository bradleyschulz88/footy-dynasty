import { describe, it, expect } from 'vitest';
import { generateSeasonCalendar, getDayOfWeek } from '../calendar.js';
import { generateFixtures } from '../leagueEngine.js';

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

  it('themed round tags attach to select home-and-away rounds', () => {
    const rounds = events.filter(ev => ev.type === 'round').sort((a, b) => a.round - b.round);
    expect(rounds[0].themedRound?.short).toBe('Opening Round');
    const rd8 = rounds.find((r) => r.round === 8);
    if (rd8) expect(rd8.themedRound?.short).toBe('Anzac Round');
  });

  it('no duplicate event ids', () => {
    const ids = events.map(ev => ev.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
