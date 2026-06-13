import { describe, it, expect, beforeEach } from 'vitest';
import { seedRng } from '../rng.js';
import {
  NOTIFICATION_KINDS,
  isNotificationKind,
  isBlockingNotificationKind,
  notificationItems,
  notificationCount,
  buildStaffLeaveNotice,
  buildVolunteerJoinNotice,
  buildPlayerTransferRequestNotice,
  buildPlayerJoinNotice,
  buildPlayerDepartureNotice,
  generateOffseasonNotifications,
} from '../notifications.js';
import { autoAssignStaffTasks } from '../staffTasks.js';

beforeEach(() => seedRng(11));

describe('notification kind helpers', () => {
  it('club approaches and transfer requests block advance; staff/volunteer do not', () => {
    expect(isBlockingNotificationKind('job_offer')).toBe(true);
    expect(isBlockingNotificationKind('player_transfer_request')).toBe(true);
    expect(isBlockingNotificationKind('staff_leave')).toBe(false);
    expect(isBlockingNotificationKind('volunteer_join')).toBe(false);
  });

  it('isNotificationKind matches the published list', () => {
    for (const k of NOTIFICATION_KINDS) expect(isNotificationKind(k)).toBe(true);
    expect(isNotificationKind('board')).toBe(false);
    expect(isNotificationKind('trade_period')).toBe(false);
  });

  it('notificationItems excludes resolved rows and internal mirrors', () => {
    const career = {
      inbox: [
        { id: 'a', kind: 'job_offer', resolved: false },
        { id: 'b', kind: 'staff_leave', resolved: true },
        { id: 'c', kind: 'board', resolved: false },
      ],
    };
    expect(notificationItems(career).map((m) => m.id)).toEqual(['a']);
    expect(notificationCount(career)).toBe(1);
  });
});

describe('notification builders', () => {
  it('staff leave vs poach produce the right kind and actions', () => {
    const s = { id: 's2', name: 'Jo Bloggs', role: 'Midfield Coach' };
    expect(buildStaffLeaveNotice(s).kind).toBe('staff_leave');
    expect(buildStaffLeaveNotice(s).actions.map((a) => a.id)).toEqual(['renew', 'let_go']);
    expect(buildStaffLeaveNotice(s, { poach: true }).kind).toBe('staff_poach');
    expect(buildStaffLeaveNotice(s, { poach: true }).actions.map((a) => a.id)).toEqual(['match', 'let_go']);
  });

  it('volunteer notice carries a ready-to-add staff member', () => {
    const n = buildVolunteerJoinNotice(3);
    expect(n.kind).toBe('volunteer_join');
    expect(n.payload.staff.wage).toBe(0);
    expect(n.payload.staff.volunteer).toBe(true);
    expect(n.payload.staff.id).toMatch(/^vol_/);
  });

  it('transfer request is blocking and names the player', () => {
    const n = buildPlayerTransferRequestNotice({ id: 'p1', firstName: 'Sam', lastName: 'Walsh', overall: 84 });
    expect(n.kind).toBe('player_transfer_request');
    expect(n.blocking).toBe(true);
    expect(n.detail).toContain('Sam Walsh');
  });

  it('tier-3 player join carries a ready-to-sign player and a recommender line', () => {
    const n = buildPlayerJoinNotice(3, { recommenderName: 'Jack Smith' });
    expect(n.kind).toBe('player_join');
    expect(n.blocking).toBe(false);
    expect(n.payload.player).toBeTruthy();
    expect(n.payload.player.gamesPlayed).toBe(0); // fresh, no inflated stats
    expect(n.detail).toContain('Jack Smith');
    expect(n.actions.map((a) => a.id)).toEqual(['sign', 'decline']);
  });

  it('tier-3 player departure names the player and offers to talk them round', () => {
    const n = buildPlayerDepartureNotice({ id: 'p9', firstName: 'Mo', lastName: 'Lane', overall: 71 });
    expect(n.kind).toBe('player_leave');
    expect(n.payload.playerId).toBe('p9');
    expect(n.detail).toContain('Mo Lane');
    expect(n.actions.map((a) => a.id)).toEqual(['convince', 'let_go']);
  });

  it('tier-3 off-season can surface a player join; tier 1 never does', () => {
    const career = { squad: [{ id: 'p1', firstName: 'A', lastName: 'B', age: 24, morale: 70 }], staff: [] };
    let found = false;
    for (let s = 1; s <= 12 && !found; s++) {
      seedRng(s);
      if (generateOffseasonNotifications(career, 3).some((n) => n.kind === 'player_join')) found = true;
    }
    expect(found).toBe(true);

    for (let s = 1; s <= 12; s++) {
      seedRng(s);
      expect(generateOffseasonNotifications(career, 1).some((n) => n.kind === 'player_join' || n.kind === 'player_leave')).toBe(false);
    }
  });
});

describe('generateOffseasonNotifications', () => {
  it('raises a transfer request for a deeply unhappy fringe player', () => {
    const career = {
      squad: [{ id: 'p1', firstName: 'A', lastName: 'B', overall: 70, morale: 20, gamesPlayed: 2 }],
      staff: [],
    };
    // Several seeds: the 60% roll should fire at least once and target the player.
    let found = false;
    for (let s = 1; s <= 10 && !found; s++) {
      seedRng(s);
      const out = generateOffseasonNotifications(career, 3);
      if (out.some((n) => n.kind === 'player_transfer_request' && n.payload.playerId === 'p1')) found = true;
    }
    expect(found).toBe(true);
  });

  it('never targets a happy, established player', () => {
    const career = {
      squad: [{ id: 'p1', overall: 80, morale: 85, gamesPlayed: 20 }],
      staff: [],
    };
    for (let s = 1; s <= 20; s++) {
      seedRng(s);
      const out = generateOffseasonNotifications(career, 3);
      expect(out.some((n) => n.kind === 'player_transfer_request')).toBe(false);
    }
  });
});

describe('autoAssignStaffTasks', () => {
  const career = {
    regionState: 'VIC',
    staff: [
      { id: 's1', role: 'Senior Coach', rating: 80 },
      { id: 's5', role: 'Head of Strength & Conditioning', rating: 70 },
      { id: 's7', role: 'Head Recruiter', rating: 75 },
      { id: 's8', role: 'Senior Scout', rating: 68 },
      { id: 's10', role: 'Performance Analyst', rating: 74 },
    ],
  };

  it('assigns the best-rated coach to training and recruiter to trades', () => {
    const t = autoAssignStaffTasks(career);
    expect(t.trainingLeadId).toBe('s1');     // highest-rated coach
    expect(t.tradeNegotiatorId).toBe('s7');  // recruiter
    expect(t.scoutLeadId).toBe('s7');        // best of scout/recruit by rating
    expect(t.recruitPriorityState).toBe('VIC');
  });

  it('scales match prep with the analyst rating', () => {
    expect(autoAssignStaffTasks(career).matchPrepTier).toBe(2); // analyst 74 >= 72
    const weak = { ...career, staff: career.staff.map((s) => s.id === 's10' ? { ...s, rating: 50 } : s) };
    expect(autoAssignStaffTasks(weak).matchPrepTier).toBe(0);
  });

  it('does not crash on a thin volunteer roster', () => {
    const thin = { regionState: 'SA', staff: [{ id: 's1', role: 'Senior Coach (part-time)', rating: 58 }] };
    const t = autoAssignStaffTasks(thin);
    expect(t.trainingLeadId).toBe('s1');
  });
});
