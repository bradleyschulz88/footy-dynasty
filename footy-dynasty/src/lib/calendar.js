// ---------------------------------------------------------------------------
// Date utilities — all dates stored as 'YYYY-MM-DD' strings
// ---------------------------------------------------------------------------

import { rng } from './rng.js';

export function addDays(dateStr, n) {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const mo = parseInt(dateStr.slice(5, 7), 10) - 1;
  const day = parseInt(dateStr.slice(8, 10), 10);
  const d = new Date(y, mo, day);
  d.setDate(d.getDate() + n);
  const y2 = d.getFullYear();
  const m2 = String(d.getMonth() + 1).padStart(2, '0');
  const d2 = String(d.getDate()).padStart(2, '0');
  return `${y2}-${m2}-${d2}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatMonth(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}

export function getMonth(dateStr) { return parseInt(dateStr.slice(5, 7), 10); }
export function getYear(dateStr)  { return parseInt(dateStr.slice(0, 4), 10); }
export function getDayOfMonth(dateStr) { return parseInt(dateStr.slice(8, 10), 10); }
export function getDayOfWeek(dateStr)  { return new Date(dateStr + 'T00:00:00').getDay(); } // 0=Sun

export function isSameMonth(d1, d2) { return d1.slice(0, 7) === d2.slice(0, 7); }

export function startOfMonth(dateStr) { return dateStr.slice(0, 7) + '-01'; }

export function daysInMonth(dateStr) {
  const y = getYear(dateStr), m = getMonth(dateStr);
  return new Date(y, m, 0).getDate();
}

export function prevMonth(dateStr) {
  const y = getYear(dateStr), m = getMonth(dateStr);
  return m === 1
    ? `${y - 1}-12-01`
    : `${y}-${String(m - 1).padStart(2, '0')}-01`;
}

export function nextMonth(dateStr) {
  const y = getYear(dateStr), m = getMonth(dateStr);
  return m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, '0')}-01`;
}

// ---------------------------------------------------------------------------
// Training session definitions
// ---------------------------------------------------------------------------

export const TRAINING_INFO = {
  ball_drill: {
    name:     'Ball Skills',
    icon:     '🏈',
    color:    '#4ADE80',
    attrs:    ['kicking', 'marking', 'handball'],
    staffId:  's2',
    staffRole:'Assistant Coach (Forwards)',
    description: 'Sharpen your players\' core ball-handling across kicking, marking and handball.',
  },
  run: {
    name:     'Running Drills',
    icon:     '🏃',
    color:    '#60A5FA',
    attrs:    ['speed', 'endurance'],
    staffId:  's5',
    staffRole:'Head of Strength & Conditioning',
    description: 'High-intensity running work to build speed and endurance.',
  },
  tactics: {
    name:     'Tactics Clinic',
    icon:     '📋',
    color:    '#A78BFA',
    attrs:    ['decision'],
    staffId:  's4',
    staffRole:'Midfield Coach',
    description: 'Whiteboard session improving in-game decision making.',
  },
  gym: {
    name:     'Gym Session',
    icon:     '💪',
    color:    '#F97316',
    attrs:    ['strength'],
    staffId:  's5',
    staffRole:'Head of Strength & Conditioning',
    description: 'Strength and conditioning work in the gym.',
  },
};

export const TRAINING_ROTATION = [
  'ball_drill', 'run', 'tactics', 'ball_drill', 'gym', 'run', 'ball_drill',
];

// ---------------------------------------------------------------------------
// applyTraining — returns { squad, gains, staffName, staffRating, devNotes }
// gains     = { attrName: totalGain } summed across all lineup players
// devNotes  = string[] notable development events (youth boost, near cap, etc.)
// ---------------------------------------------------------------------------
function ageMult(age) {
  if (age <= 21) return 1.5;
  if (age <= 25) return 1.2;
  if (age <= 29) return 1.0;
  if (age <= 32) return 0.6;
  return 0.3;
}

// Training focus profile — biases attribute gain by the focus distribution
// the player set in the Training tab. focus = { skills, fitness, tactics, recovery } (totals 100)
const FOCUS_ATTR_WEIGHTS = {
  skills:   ['kicking', 'marking', 'handball'],
  fitness:  ['speed', 'endurance', 'strength'],
  tactics:  ['decision', 'tackling'],
  recovery: [], // no direct gain — boosts fitness recovery / injury resistance
};

function focusBoostFor(attr, focus) {
  if (!focus) return 1.0;
  let boost = 0.7; // baseline when an attribute isn't a primary focus target
  for (const [key, attrs] of Object.entries(FOCUS_ATTR_WEIGHTS)) {
    if (attrs.includes(attr)) {
      const share = (focus[key] ?? 25) / 25; // 25% = neutral, 50% = double
      boost = Math.max(boost, share);
    }
  }
  return boost;
}

/** @public UI / preview — same multiplier as applyTraining uses for attribute gains */
export function trainingAttrFocusBoost(attr, focus) {
  return focusBoostFor(attr, focus);
}

// Intensity 20–100 acts as a multiplier on raw attribute gain (with diminishing returns above 80)
export function intensityScale(intensity) {
  const i = Math.max(20, Math.min(100, intensity ?? 60));
  if (i <= 80) return 0.6 + (i - 20) * (0.6 / 60); // 20→0.6, 80→1.2
  return 1.2 + (i - 80) * 0.005;                   // 80→1.2, 100→1.3
}

export function applyTraining(squad, lineup, subtype, staff, opts = {}) {
  const info = TRAINING_INFO[subtype];
  if (!info || !lineup?.length) {
    return { squad, gains: {}, staffName: 'Unknown', staffRating: 60, devNotes: [] };
  }

  const focus     = opts.focus     ?? null;
  const intensity = opts.intensity ?? 60;
  const intScale  = intensityScale(intensity);

  const staffMember = (staff || []).find(s => s.id === info.staffId);
  const staffRating = staffMember?.rating ?? 60;
  const staffName   = staffMember?.name   ?? 'Unknown Coach';
  const baseScale   = staffRating / 75;

  const gains    = {};
  const devNotes = [];

  const newSquad = squad.map(p => {
    if (!lineup.includes(p.id)) return p;

    const age       = p.age      ?? 24;
    const fitness   = p.fitness  ?? 90;
    const potential = p.potential ?? 99;
    const overall   = p.overall  ?? 60;

    const ageScale     = ageMult(age);
    const fitnessScale = fitness / 90;

    const nearCap = overall >= potential - 3;
    const capScale = nearCap ? 0.5 : 1.0;

    const scale = baseScale * ageScale * fitnessScale * capScale * intScale;

    const updated = { ...p, attrs: { ...p.attrs } };
    info.attrs.forEach(attr => {
      if (attr in updated.attrs) {
        const focusBoost = focusBoostFor(attr, focus);
        const raw = Math.max(0, Math.round((rng() * 1.5 + 0.5) * scale * focusBoost));
        const g   = Math.min(raw, Math.max(0, potential - updated.attrs[attr]));
        updated.attrs[attr] = Math.min(potential, updated.attrs[attr] + g);
        gains[attr] = (gains[attr] || 0) + g;
      }
    });

    const vals = Object.values(updated.attrs);
    updated.overall = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

    const lastName = p.lastName || p.name?.split(' ').slice(-1)[0] || 'Player';
    if (age <= 21)  devNotes.push(`${lastName} (age ${age}) — youth boost`);
    else if (nearCap) devNotes.push(`${lastName} — near potential cap`);

    return updated;
  });

  if (focus && focus.recovery >= 35) {
    devNotes.push(`Recovery focus (${focus.recovery}%) — squad fitness boost`);
  }

  return { squad: newSquad, gains, staffName, staffRating, devNotes, intensity };
}

// ---------------------------------------------------------------------------
// generateSeasonCalendar
// Produces a sorted event queue for one full season.
// season = year of the competition (e.g. 2026)
// Pre-season: Dec 1 of (season-1) through Feb 28 of season
// Regular season: from Mar 21 of season, one round per week
// ---------------------------------------------------------------------------
export function generateSeasonCalendar(season, leagueClubs, fixtures, clubId) {
  const events = [];
  let counter  = 0;
  const eid    = () => `ev_${++counter}`;

  const preseasonStart = `${season - 1}-12-01`;
  const preseasonEnd   = `${season}-02-28`;

  // Training sessions — Mon/Wed/Fri during pre-season
  let cursor  = preseasonStart;
  let rotIdx  = 0;
  while (cursor <= preseasonEnd) {
    const dow = getDayOfWeek(cursor); // 0=Sun
    if (dow === 1 || dow === 3 || dow === 5) {
      events.push({
        id:       eid(),
        date:     cursor,
        type:     'training',
        subtype:  TRAINING_ROTATION[rotIdx % TRAINING_ROTATION.length],
        phase:    'preseason',
        completed: false,
        result:   null,
      });
      rotIdx++;
    }
    cursor = addDays(cursor, 1);
  }

  // Key events
  events.push({
    id: eid(), date: `${season - 1}-12-15`, type: 'key_event',
    name: 'Transfer Window Opens',
    description: 'The trade and free-agent market is now open. Approach players and negotiate deals.',
    action: 'recruit', phase: 'preseason', completed: false,
  });
  events.push({
    id: eid(), date: `${season}-01-10`, type: 'key_event',
    name: 'National Draft Day',
    description: 'Select the best young talent from this year\'s draft pool to build your future.',
    action: 'recruit', phase: 'preseason', completed: false,
  });
  events.push({
    id: eid(), date: `${season}-02-15`, type: 'key_event',
    name: 'Transfer Window Closes',
    description: 'The final opportunity to sign or trade players before the season begins.',
    action: 'recruit', phase: 'preseason', completed: false,
  });

  // Pre-season matches (use first 2 opponents in the league)
  const preOpp = leagueClubs.filter(c => c.id !== clubId).slice(0, 2);
  const preMatchDates = [`${season}-02-08`, `${season}-02-22`];
  preOpp.forEach((opp, i) => {
    events.push({
      id:      eid(),
      date:    preMatchDates[i],
      type:    'preseason_match',
      homeId:  clubId,
      awayId:  opp.id,
      label:   `Practice Match ${i + 1}`,
      phase:   'preseason',
      completed: false,
      result:  null,
    });
  });

  // Regular season — one round event per round, starting Mar 21
  const seasonStart = `${season}-03-21`;
  fixtures.forEach((round, roundIdx) => {
    const roundDate = addDays(seasonStart, roundIdx * 7);
    events.push({
      id:        eid(),
      date:      roundDate,
      type:      'round',
      round:     roundIdx + 1,
      matches:   round,
      phase:     'season',
      completed: false,
      result:    null,
    });
  });

  return events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
