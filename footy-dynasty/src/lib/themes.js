// Theme registry — single source of truth for the app's theme direction
// classes. Previously this list was hard-coded in three places (AFLManager,
// ThemeProvider, clubTheme.css) and drifted; centralise it here.
//
// A "direction class" (dirX) is applied to the app shell and remaps the shared
// --A-* / --fd-* CSS custom properties in tokens.css. dirA/dirB are legacy dark
// variants; dirV4/dirV5 are the two designed, user-facing kits.

export const DEFAULT_THEME = 'dirV4';

export const THEME_CLASSES = ['dirA', 'dirB', 'dirV4', 'dirV5', 'dirV6', 'dirV7'];

// The kits offered in the pre-game theme picker, and their human labels.
export const THEME_META = {
  dirV4: { label: 'Broadcast Deck', mode: 'dark' },
  dirV5: { label: 'Day Match', mode: 'light' },
  dirV6: { label: 'Night Finals', mode: 'dark' },
  dirV7: { label: 'Ember', mode: 'dark' },
};

// Order the picker cycles through.
export const SWITCHABLE_THEMES = ['dirV4', 'dirV5', 'dirV6', 'dirV7'];

export function isValidTheme(t) {
  return typeof t === 'string' && THEME_CLASSES.includes(t);
}

// Cycle to the next switchable kit. Anything unrecognised resolves to the
// default's counterpart so the toggle always makes visible progress.
export function nextTheme(current) {
  const i = SWITCHABLE_THEMES.indexOf(current);
  if (i === -1) return SWITCHABLE_THEMES[0] === DEFAULT_THEME ? SWITCHABLE_THEMES[1] : SWITCHABLE_THEMES[0];
  return SWITCHABLE_THEMES[(i + 1) % SWITCHABLE_THEMES.length];
}

export function themeMode(t) {
  return THEME_META[t]?.mode ?? 'dark';
}
