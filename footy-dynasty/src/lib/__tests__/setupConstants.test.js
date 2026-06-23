import { describe, it, expect } from 'vitest';
import {
  SETUP_SS_KEY,
  SETUP_SS_KEY_LEGACY,
  SAVE_VERSION,
  SLOT_IDS,
  getLatestSavedSlotMeta,
} from '../setupConstants.js';

describe('constants', () => {
  it('SETUP_SS_KEY is a non-empty string', () => {
    expect(typeof SETUP_SS_KEY).toBe('string');
    expect(SETUP_SS_KEY.length).toBeGreaterThan(0);
  });

  it('SETUP_SS_KEY_LEGACY is a different non-empty string', () => {
    expect(typeof SETUP_SS_KEY_LEGACY).toBe('string');
    expect(SETUP_SS_KEY_LEGACY).not.toBe(SETUP_SS_KEY);
  });

  it('SAVE_VERSION is a positive integer', () => {
    expect(typeof SAVE_VERSION).toBe('number');
    expect(Number.isInteger(SAVE_VERSION)).toBe(true);
    expect(SAVE_VERSION).toBeGreaterThan(0);
  });

  it('SLOT_IDS has 8 entries (A–H)', () => {
    expect(SLOT_IDS).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  });
});

describe('getLatestSavedSlotMeta', () => {
  it('returns null for empty or invalid meta', () => {
    expect(getLatestSavedSlotMeta(null)).toBeNull();
    expect(getLatestSavedSlotMeta(undefined)).toBeNull();
    expect(getLatestSavedSlotMeta('string')).toBeNull();
    expect(getLatestSavedSlotMeta({})).toBeNull();
  });

  it('returns null when no slot has savedAt', () => {
    const meta = { A: { clubName: 'Test' }, B: null, C: undefined };
    expect(getLatestSavedSlotMeta(meta)).toBeNull();
  });

  it('returns the single slot with a savedAt timestamp', () => {
    const meta = {
      A: { savedAt: '2024-01-01T00:00:00Z' },
      B: null,
      C: null,
    };
    expect(getLatestSavedSlotMeta(meta)).toBe('A');
  });

  it('returns the most recently saved slot', () => {
    const meta = {
      A: { savedAt: '2024-01-01T10:00:00Z' },
      B: { savedAt: '2024-06-15T14:30:00Z' },
      C: { savedAt: '2024-03-10T08:00:00Z' },
    };
    expect(getLatestSavedSlotMeta(meta)).toBe('B');
  });

  it('handles when only C has a timestamp', () => {
    const meta = {
      A: {},
      B: { savedAt: '' },
      C: { savedAt: '2025-05-20T12:00:00Z' },
    };
    expect(getLatestSavedSlotMeta(meta)).toBe('C');
  });

  it('compares timestamps lexicographically (ISO 8601 ordering)', () => {
    const meta = {
      A: { savedAt: '2024-12-31T23:59:59Z' },
      B: { savedAt: '2025-01-01T00:00:00Z' },
      C: { savedAt: '2024-06-15T00:00:00Z' },
    };
    expect(getLatestSavedSlotMeta(meta)).toBe('B');
  });
});
