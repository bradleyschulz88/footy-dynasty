/** Central career news feed helper — consistent caps and types. */

const DEFAULT_MAX = 20;

/**
 * @param {object} career
 * @param {{ week?: number, type?: string, text: string }} entry
 * @param {number} [max]
 */
export function pushNews(career, entry, max = DEFAULT_MAX) {
  if (!career || !entry?.text) return career;
  const row = {
    week: entry.week ?? career.week ?? 0,
    type: entry.type ?? 'info',
    text: entry.text,
  };
  career.news = [row, ...(career.news || [])].slice(0, max);
  return career;
}
