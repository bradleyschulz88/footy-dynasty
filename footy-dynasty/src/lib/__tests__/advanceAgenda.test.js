import { describe, it, expect } from 'vitest';
import {
  getAdvanceAgenda,
  getVisibleAdvanceAgenda,
  advanceReminderMode,
  nextEventAgendaSignature,
  snoozeAdvanceAgendaItems,
  advanceAgendaModalTitle,
} from '../advanceAgenda.js';
import { LINEUP_FIELD_COUNT } from '../lineupHelpers.js';

const league = { tier: 2, name: 'Test League' };

function baseCareer(overrides = {}) {
  return {
    clubId: 'c1',
    leagueKey: 'vic',
    lineup: [],
    squad: [{ id: 'p1', wage: 50_000, overall: 70 }],
    staff: [{ id: 's4', rating: 70, wage: 20_000 }],
    staffTasks: { matchPrepTier: 0, trainingLeadId: null },
    finance: { cash: 500_000, boardConfidence: 60 },
    pendingRenewals: [],
    pendingStaffRenewals: [],
    options: { advanceReminders: 'before_matches' },
    advanceAgendaSnooze: {},
    eventQueue: [
      { type: 'round', round: 3, completed: false, matches: [{ home: 'c1', away: 'c2' }] },
    ],
    ...overrides,
  };
}

describe('advanceAgenda', () => {
  it('defaults reminder mode to before_matches', () => {
    expect(advanceReminderMode({ options: {} })).toBe('before_matches');
  });

  it('flags thin on-field lineup before a round', () => {
    const items = getAdvanceAgenda(baseCareer(), league);
    expect(items.some((i) => i.id === 'lineup_field')).toBe(true);
  });

  it('flags pending renewals', () => {
    const career = baseCareer({
      pendingRenewals: [{ playerId: 'p1', _handled: false }],
    });
    const items = getAdvanceAgenda(career, league);
    expect(items.some((i) => i.id === 'renewals')).toBe(true);
  });

  it('flags cap pressure at 90%+', () => {
    const career = baseCareer({
      finance: { cash: 500_000, boardConfidence: 60, wageBudget: 1_000_000 },
      squad: Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, wage: 50_000, overall: 70 })),
    });
    const items = getAdvanceAgenda(career, league);
    expect(items.some((i) => i.id === 'cap_tight' || i.id === 'cap_over')).toBe(true);
  });

  it('flags training lead before training event', () => {
    const career = baseCareer({
      eventQueue: [{ type: 'training', subtype: 'skills', completed: false }],
    });
    const items = getAdvanceAgenda(career, league);
    expect(items.some((i) => i.id === 'training_lead')).toBe(true);
  });

  it('flags national draft day milestone on calendar', () => {
    const career = baseCareer({
      eventQueue: [
        {
          type: 'key_event',
          name: 'National Draft Day',
          completed: false,
          date: '2026-01-10',
        },
      ],
      draftOrder: [{ pick: 1, clubId: 'c1', used: false }],
      draftPool: [{ id: 'd1' }],
    });
    const items = getAdvanceAgenda(career, league);
    expect(items.some((i) => i.id === 'milestone_draft_day')).toBe(true);
  });

  it('includes trade period open in off-season agenda', () => {
    const career = {
      clubId: 'c1',
      postSeasonPhase: 'trade_period',
      inTradePeriod: true,
      tradePeriodDay: 0,
      eventQueue: [],
      squad: [],
      staff: [],
      finance: { cash: 0 },
      pendingRenewals: [],
      pendingStaffRenewals: [],
    };
    const items = getAdvanceAgenda(career, league);
    expect(items.some((i) => i.id === 'trade_period_open')).toBe(true);
  });

  it('flags match prep tier zero before round', () => {
    const items = getAdvanceAgenda(baseCareer(), league);
    expect(items.some((i) => i.id === 'match_prep')).toBe(true);
  });

  it('hides snoozed items for the same upcoming event', () => {
    const career = baseCareer({
      lineup: Array.from({ length: LINEUP_FIELD_COUNT }, (_, i) => `p${i}`),
    });
    const sig = nextEventAgendaSignature(career);
    career.advanceAgendaSnooze = { lineup_field: sig };
    const visible = getVisibleAdvanceAgenda(career, league);
    expect(visible.some((i) => i.id === 'lineup_field')).toBe(false);
  });

  it('returns no visible items when reminders are minimal', () => {
    const career = baseCareer({ options: { advanceReminders: 'minimal' } });
    expect(getVisibleAdvanceAgenda(career, league)).toEqual([]);
  });

  it('snoozeAdvanceAgendaItems stamps event signature', () => {
    const career = baseCareer();
    const patch = snoozeAdvanceAgendaItems(career, ['renewals']);
    expect(patch.advanceAgendaSnooze.renewals).toBe(nextEventAgendaSignature(career));
  });

  it('modal title uses next event short label', () => {
    const title = advanceAgendaModalTitle(baseCareer(), league);
    expect(title.toLowerCase()).toContain('round');
  });
});
