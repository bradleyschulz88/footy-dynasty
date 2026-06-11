// ---------------------------------------------------------------------------
// Difficulty Settings (Spec Section 2)
// Single source of truth for every system that should bend to difficulty.
// ---------------------------------------------------------------------------

export const DIFFICULTY_IDS = ['grassroots', 'contender', 'legend'];

export const DIFFICULTY_META = {
  grassroots: {
    label: 'Grassroots',
    color: '#4AE89A',
    audience: 'New to footy management',
    tagline: 'Learn the ropes without losing your job.',
    summary: 'Generous budgets, patient board, lower injury rate. Focus on learning the game without constant pressure.',
    bullets: [
      'Board gives you 3 full seasons before acting',
      '+25% starting cash · +50% trade budget',
      'Half the injury rate — depth matters less',
      'Scout reports are sharper (+15% accuracy)',
      'Morale floor at 50 — squad stays motivated',
    ],
    statsBar: [
      { label: 'Board patience', value: 1, max: 3, display: '3 seasons' },
      { label: 'Starting cash', value: 1, max: 1, display: '+25%' },
      { label: 'Injury rate', value: 0.5, max: 2, display: '×0.5' },
    ],
  },
  contender: {
    label: 'Contender',
    color: 'var(--A-accent)',
    audience: 'Experienced players — the default',
    tagline: 'Every decision counts. No hand-holding.',
    summary: 'The game as intended. Balanced across the board — tough but fair, with no safety net.',
    bullets: [
      'Board patience: 2 seasons to prove yourself',
      'Standard budget · standard cap · standard injuries',
      'AI clubs compete smartly for your best players',
      'Scout reports accurate — no bonuses or penalties',
      'Tutorial available on your first career only',
    ],
    statsBar: [
      { label: 'Board patience', value: 0.67, max: 3, display: '2 seasons' },
      { label: 'Starting cash', value: 0.67, max: 1, display: 'Standard' },
      { label: 'Injury rate', value: 0.5, max: 2, display: '×1.0' },
    ],
  },
  legend: {
    label: 'Coaching Legend',
    color: '#E84A6F',
    audience: 'FM veterans — every detail matters',
    tagline: 'One bad season and you\'re out. No second chances.',
    summary: 'Ruthless from day one. Tighter money, double injuries, and a board that won\'t wait.',
    bullets: [
      'Board patience: 1 season — lose badly and you\'re gone',
      '−15% starting cash · −30% trade budget',
      'Double injury rate — squad depth is survival',
      'Scout reports obscured (−15% accuracy)',
      'Ruthless AI poaches your best players first',
    ],
    statsBar: [
      { label: 'Board patience', value: 0.33, max: 3, display: '1 season' },
      { label: 'Starting cash', value: 0.33, max: 1, display: '−15%' },
      { label: 'Injury rate', value: 1, max: 2, display: '×2.0' },
    ],
  },
};

export function getDifficultyConfig(difficulty) {
  const configs = {
    grassroots: {
      boardPatienceSeasons:  3,
      boardLossConfidence:  -1,
      cashMultiplier:        1.25,
      capOverflow:           0.20,
      injuryMultiplier:      0.5,
      scoutAccuracyBonus:    15,
      aiQuality:             'poor',
      showAssistantTips:     true,
      transferBudgetMultiplier: 1.5,
      moraleFloor:           50,
      sponsorMultiplier:     1.20,
      tutorialPolicy:        'always',
      voteSurvivalShift:     0.04,
    },
    contender: {
      boardPatienceSeasons:  2,
      boardLossConfidence:  -3,
      cashMultiplier:        1.0,
      capOverflow:           0,
      injuryMultiplier:      1.0,
      scoutAccuracyBonus:    0,
      aiQuality:             'normal',
      showAssistantTips:     true,
      transferBudgetMultiplier: 1.0,
      moraleFloor:           30,
      sponsorMultiplier:     1.0,
      tutorialPolicy:        'first_career_only',
      voteSurvivalShift:     0,
    },
    legend: {
      boardPatienceSeasons:  1,
      boardLossConfidence:  -5,
      cashMultiplier:        0.85,
      capOverflow:          -0.10,
      injuryMultiplier:      2.0,
      scoutAccuracyBonus:   -15,
      aiQuality:             'smart',
      showAssistantTips:     false,
      transferBudgetMultiplier: 0.7,
      moraleFloor:           10,
      sponsorMultiplier:     0.85,
      tutorialPolicy:        'never',
      voteSurvivalShift:     -0.045,
    },
  };
  return configs[difficulty] || configs.contender;
}

/** UI + mechanics in one object (wizard, Settings, hub). */
export function getDifficultyProfile(difficulty) {
  const id = DIFFICULTY_IDS.includes(difficulty) ? difficulty : 'contender';
  return { ...DIFFICULTY_META[id], ...getDifficultyConfig(id), id };
}

// Helper: should a tutorial run for this career?
export function shouldShowTutorial(career) {
  const cfg = getDifficultyConfig(career?.difficulty);
  if (cfg.tutorialPolicy === 'never') return false;
  if (cfg.tutorialPolicy === 'always') return true;
  // first_career_only
  return !!career?.isFirstCareer;
}
