import { describe, it, expect } from 'vitest';
import { pushNews } from '../news.js';

describe('pushNews', () => {
  it('returns the career unchanged if no entry provided', () => {
    const career = { week: 1, news: [] };
    expect(pushNews(career, null)).toBe(career);
    expect(pushNews(career, {})).toBe(career); // no .text
    expect(pushNews(null, { text: 'hello' })).toBeNull();
  });

  it('prepends news entry to the career.news array', () => {
    const career = { week: 5, news: [] };
    pushNews(career, { text: 'First news item' });
    expect(career.news).toHaveLength(1);
    expect(career.news[0].text).toBe('First news item');
  });

  it('initialises career.news if missing', () => {
    const career = { week: 3 };
    pushNews(career, { text: 'Breaking news' });
    expect(Array.isArray(career.news)).toBe(true);
    expect(career.news[0].text).toBe('Breaking news');
  });

  it('newest entry goes to index 0', () => {
    const career = { week: 2, news: [{ week: 1, type: 'info', text: 'Old news' }] };
    pushNews(career, { text: 'New news', week: 2 });
    expect(career.news[0].text).toBe('New news');
    expect(career.news[1].text).toBe('Old news');
  });

  it('uses career.week when entry.week is not provided', () => {
    const career = { week: 7, news: [] };
    pushNews(career, { text: 'Week inferred' });
    expect(career.news[0].week).toBe(7);
  });

  it('uses entry.week when provided', () => {
    const career = { week: 7, news: [] };
    pushNews(career, { text: 'Explicit week', week: 12 });
    expect(career.news[0].week).toBe(12);
  });

  it('defaults type to info when not provided', () => {
    const career = { week: 1, news: [] };
    pushNews(career, { text: 'Info item' });
    expect(career.news[0].type).toBe('info');
  });

  it('preserves custom type', () => {
    const career = { week: 1, news: [] };
    pushNews(career, { text: 'Board item', type: 'board' });
    expect(career.news[0].type).toBe('board');
  });

  it('caps news to the default 20 items', () => {
    const career = { week: 1, news: Array.from({ length: 20 }, (_, i) => ({ week: i, type: 'info', text: `Item ${i}` })) };
    pushNews(career, { text: 'New item' });
    expect(career.news).toHaveLength(20);
    expect(career.news[0].text).toBe('New item');
  });

  it('caps news to a custom max', () => {
    const career = { week: 1, news: [{ week: 1, type: 'info', text: 'A' }, { week: 1, type: 'info', text: 'B' }] };
    pushNews(career, { text: 'C' }, 2);
    expect(career.news).toHaveLength(2);
    expect(career.news[0].text).toBe('C');
    expect(career.news[1].text).toBe('A');
  });

  it('returns the mutated career object', () => {
    const career = { week: 1, news: [] };
    const result = pushNews(career, { text: 'Test' });
    expect(result).toBe(career);
  });
});
