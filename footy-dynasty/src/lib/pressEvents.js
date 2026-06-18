// Press moment catalogue — event-driven, no weekly ritual.

const PRESS_MOMENTS = [
  {
    id: 'pre_finals',
    label: 'Finals Countdown',
    eligible: (c) => c.finalsQualified && !c.finalsEliminated && c.pressFiredThisSeason?.includes?.('pre_finals') === false,
    prompt: '"The finals are a week away. What\'s the message to your players?"',
    responses: [
      { id: 'inspire',  label: 'Fire them up — this is what we trained for.', effect: { moraleAll: +4, pressRelations: +1 } },
      { id: 'process',  label: 'Stay calm. Back the process.', effect: { moraleAll: +2, pressRelations: +3 } },
      { id: 'deflect',  label: 'Let the footy do the talking.', effect: { moraleAll: +1, pressRelations: -1 } },
    ],
  },
  {
    id: 'heavy_loss_heat',
    label: 'Post-loss Heat',
    eligible: (c) => {
      const lastResult = (c.news || []).find(n => n.type === 'match');
      return lastResult?.text?.includes?.('lost') && (c.finance?.boardConfidence ?? 70) < 55;
    },
    prompt: '"You lost by 8 goals. The board is watching. What do you say?"',
    responses: [
      { id: 'own_it',    label: 'We were outplayed. No excuses.', effect: { boardConfidenceDelta: +4, pressRelations: +2 } },
      { id: 'system',   label: 'Trust the system — results follow.', effect: { boardConfidenceDelta: +1, pressRelations: -1 } },
      { id: 'blame_inj', label: 'Injuries cost us the structure.', effect: { boardConfidenceDelta: -1, pressRelations: -2 } },
    ],
  },
  {
    id: 'trade_deadline',
    label: 'Trade Deadline Buzz',
    eligible: (c) => c.phase === 'trade_period' && !c.pressFiredThisSeason?.includes?.('trade_deadline'),
    prompt: '"Rumours are swirling about your intentions at the trade table."',
    responses: [
      { id: 'coy',       label: 'We\'re always open to conversations that improve the club.', effect: { pressRelations: +1 } },
      { id: 'shut_down', label: 'No comment on player movements.', effect: { pressRelations: -2 } },
      { id: 'bold',      label: 'We\'re going all-in to add a missing piece.', effect: { pressRelations: +3, moraleAll: +2 } },
    ],
  },
  {
    id: 'rivalry_barb',
    label: 'Rivalry Barb',
    eligible: (c) => {
      const ev = (c.eventQueue || []).find(e => !e.completed && e.type === 'round');
      if (!ev?.matches) return false;
      const m = ev.matches.find(m2 => m2.home === c.clubId || m2.away === c.clubId);
      return !!m; // simplified — always eligible around a round
    },
    prompt: '"Your rival\'s coach took a dig at your defensive structure in the press. How do you respond?"',
    responses: [
      { id: 'laugh_off',  label: 'Ha — let them waste energy talking.', effect: { moraleAll: +3, pressRelations: +1 } },
      { id: 'fire_back',  label: 'We\'ll settle this on the field Saturday.', effect: { moraleAll: +5, pressRelations: -1 } },
      { id: 'diplomatic', label: 'We respect every opponent.', effect: { pressRelations: +2 } },
    ],
  },
  {
    id: 'milestone',
    label: 'Milestone Moment',
    eligible: (c) => {
      const p = (c.squad || []).find(pl => (pl.careerGames ?? 0) >= 100 && !c.pressFiredThisSeason?.includes?.('milestone'));
      return !!p;
    },
    prompt: (c) => {
      const p = (c.squad || []).find(pl => (pl.careerGames ?? 0) >= 100);
      return `"${p?.firstName || 'Your player'} ${p?.lastName || ''} just hit 100 games. What does this milestone mean to the club?"`;
    },
    responses: [
      { id: 'celebrate', label: 'It\'s a testament to their dedication and our culture.', effect: { moraleAll: +4, pressRelations: +3 } },
      { id: 'humble',    label: 'They\'d be the first to say the team made it possible.', effect: { moraleAll: +2, pressRelations: +2 } },
    ],
  },
  {
    id: 'season_launch',
    label: 'Season Launch',
    eligible: (c) => c.week <= 2 && c.season > 1 && !c.pressFiredThisSeason?.includes?.('season_launch'),
    prompt: '"The new season kicks off. What\'s the ambition this year?"',
    responses: [
      { id: 'finals',  label: 'Finals or bust — we\'re building for it.', effect: { moraleAll: +3, boardConfidenceDelta: +2 } },
      { id: 'growth',  label: 'Another step forward as a club.', effect: { moraleAll: +2, boardConfidenceDelta: +3 } },
      { id: 'process', label: 'Focus on our best football — results will come.', effect: { moraleAll: +1, boardConfidenceDelta: +1 } },
    ],
  },
  {
    id: 'sacking_pressure',
    label: 'Sacking Pressure',
    eligible: (c) => (c.boardWarning ?? 0) >= 2 && !c.pressFiredThisSeason?.includes?.('sacking_pressure'),
    prompt: '"Reports suggest your position is under pressure. Is your job safe?"',
    responses: [
      { id: 'confident', label: 'I\'m 100% focused on the next game.', effect: { boardConfidenceDelta: +3, pressRelations: +1 } },
      { id: 'honest',    label: 'I understand the scrutiny — we need better results.', effect: { boardConfidenceDelta: +5, pressRelations: +2 } },
      { id: 'defiant',   label: 'I\'ve got the support of the players. That\'s what matters.', effect: { boardConfidenceDelta: -2, moraleAll: +4 } },
    ],
  },
];

export { PRESS_MOMENTS };

/**
 * Pick one eligible press moment (max 6/season, min 2-week gap). Returns moment or null.
 */
export function pickPressMoment(career) {
  if ((career.pressFiredThisSeason || []).length >= 6) return null;
  const gapRequired = (career.journalist?.satisfaction ?? 50) < 30 ? 1 : 2;
  if (career.week - (career.lastPressWeek ?? -99) < gapRequired) return null;

  const fired = career.pressFiredThisSeason || [];
  const eligible = PRESS_MOMENTS.filter(m => {
    if (fired.includes(m.id)) return false;
    return typeof m.eligible === 'function' ? m.eligible(career) : false;
  });

  return eligible[0] ?? null;
}

/**
 * Apply a press response. Returns patch object (no mutation).
 */
export function applyPressResponse(career, momentId, responseId) {
  const moment = PRESS_MOMENTS.find(m => m.id === momentId);
  const response = moment?.responses?.find(r => r.id === responseId);

  const patch = {
    pendingPressMoment: null,
    lastPressWeek: career.week,
    pressFiredThisSeason: [...(career.pressFiredThisSeason || []), momentId],
  };

  if (!response?.effect) return patch;
  const { effect } = response;

  if (effect.moraleAll) {
    const delta = effect.moraleAll;
    patch.squad = (career.squad || []).map(p => ({
      ...p,
      morale: Math.min(100, Math.max(0, (p.morale ?? 75) + delta)),
    }));
  }

  if (effect.boardConfidenceDelta) {
    const current = career.finance?.boardConfidence ?? 50;
    patch.finance = {
      ...(career.finance || {}),
      boardConfidence: Math.min(100, Math.max(0, current + effect.boardConfidenceDelta)),
    };
  }

  if (effect.pressRelations) {
    const current = career.journalist?.satisfaction ?? 50;
    patch.journalist = {
      ...(career.journalist || {}),
      satisfaction: Math.min(100, Math.max(0, current + effect.pressRelations)),
    };
  }

  return patch;
}
