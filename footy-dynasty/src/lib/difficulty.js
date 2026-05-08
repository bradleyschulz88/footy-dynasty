// ---------------------------------------------------------------------------
// Difficulty Settings (Spec Section 2)
// Single source of truth for every system that should bend to difficulty.
// ---------------------------------------------------------------------------

export const DIFFICULTY_IDS = ['grassroots', 'contender', 'legend'];

export const DIFFICULTY_META = {
  grassroots: {
    label: 'Grassroots',
    color: '#4AE89A',
    audience: 'Casual players, new to footy management',
    summary: 'Forgiving. The game explains itself. Mistakes don\'t end careers.',
    bullets: [
      '3 seasons of board patience',
      '1.25× starting cash & 1.5× transfer budget',
      'Half the injury rate, friendlier scouts',
    ],
  },
  contender: {
    label: 'Premiership Contender',
    color: 'var(--A-accent)',
    audience: 'Experienced players who like a balanced challenge',
    summary: 'Balanced. No hand-holding but no brutality.',
    bullets: [
      '2 seasons of board patience',
      'Standard cash, standard cap, standard injuries',
      'Smart but fair AI clubs',
    ],
  },
  legend: {
    label: 'Coaching Legend',
    color: '#E84A6F',
    audience: 'FM veterans who want every decision to matter',
    summary: 'Unforgiving. Information is scarce. The board has no patience.',
    bullets: [
      '1 season of board patience — sack-quick',
      'Tighter cap, less cash, double injuries',
      'Ruthless AI poaches your best players',
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

// Helper: should a tutorial run for this career?
export function shouldShowTutorial(career) {
  const cfg = getDifficultyConfig(career?.difficulty);
  if (cfg.tutorialPolicy === 'never') return false;
  if (cfg.tutorialPolicy === 'always') return true;
  // first_career_only
  return !!career?.isFirstCareer;
}
