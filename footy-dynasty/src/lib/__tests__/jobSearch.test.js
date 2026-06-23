import { describe, it, expect } from 'vitest';
import {
  MAX_APPLICATIONS_PER_SEASON,
  applicationsState,
  applicationsRemaining,
  applicationStatus,
  canApply,
  evaluateApplication,
  recordApplication,
} from '../jobSearch.js';

const offer = (over = {}) => ({ clubId: 'c1', clubName: 'Test FC', minReputation: 40, ...over });

describe('applications ledger', () => {
  it('starts empty and resets when the season rolls over', () => {
    const fresh = applicationsState({ season: 5 });
    expect(fresh).toEqual({ season: 5, used: 0, results: {} });

    const stale = { season: 6, jobApplications: { season: 5, used: 2, results: { c1: 'rejected' } } };
    expect(applicationsState(stale).used).toBe(0); // last season's ledger ignored
    expect(applicationsRemaining(stale)).toBe(MAX_APPLICATIONS_PER_SEASON);
  });

  it('tracks remaining budget and per-club status', () => {
    const career = { season: 5, jobApplications: { season: 5, used: 1, results: { c1: 'rejected' } } };
    expect(applicationsRemaining(career)).toBe(MAX_APPLICATIONS_PER_SEASON - 1);
    expect(applicationStatus(career, 'c1')).toBe('rejected');
    expect(applicationStatus(career, 'c2')).toBeUndefined();
  });
});

describe('canApply', () => {
  it('blocks re-applying to the same club and when out of budget', () => {
    const applied = { season: 5, jobApplications: { season: 5, used: 1, results: { c1: 'rejected' } } };
    expect(canApply(applied, offer())).toBe(false); // already applied to c1
    expect(canApply(applied, offer({ clubId: 'c2' }))).toBe(true);

    const spent = { season: 5, jobApplications: { season: 5, used: MAX_APPLICATIONS_PER_SEASON, results: {} } };
    expect(canApply(spent, offer({ clubId: 'c9' }))).toBe(false);
  });
});

describe('evaluateApplication', () => {
  it('grants an interview at or above the reputation bar', () => {
    expect(evaluateApplication({ coachReputation: 40 }, offer()).outcome).toBe('interview');
    expect(evaluateApplication({ coachReputation: 55 }, offer()).outcome).toBe('interview');
  });

  it('rejects below the bar with named feedback', () => {
    const res = evaluateApplication({ coachReputation: 30 }, offer());
    expect(res.outcome).toBe('rejected');
    expect(res.reason).toContain('Test FC');
    expect(res.reason).toContain('40+');
  });
});

describe('recordApplication', () => {
  it('decrements budget and records the result', () => {
    const career = { season: 5 };
    const patch = recordApplication(career, offer(), 'rejected');
    expect(patch.jobApplications.season).toBe(5);
    expect(patch.jobApplications.used).toBe(1);
    expect(patch.jobApplications.results.c1).toBe('rejected');
  });
});
