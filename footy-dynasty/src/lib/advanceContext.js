// Labels for the primary time-advance control (calendar vs off-season pipeline).
import { TRADE_PERIOD_DAYS, POST_TRADE_DRAFT_COUNTDOWN_DAYS } from './tradePeriod.js';
import { TRAINING_INFO } from './calendar.js';

/** Stable string for UI animation keys when calendar / off-season time moves forward. */
export function advanceTimeFingerprint(career) {
  const nextEv = (career.eventQueue || []).find((e) => !e.completed);
  const evSig = nextEv
    ? `${nextEv.type}:${nextEv.round ?? ''}:${nextEv.date ?? ''}:${nextEv.subtype ?? ''}`
    : 'none';
  return [
    career.currentDate ?? '',
    String(career.week ?? ''),
    career.phase ?? '',
    career.inFinals ? `f${career.finalsRound ?? 0}` : '',
    career.postSeasonPhase ?? '',
    String(career.tradePeriodDay ?? ''),
    String(career.postSeasonDraftCountdown ?? ''),
    career.freeAgencyOpen ? 'fa' : '',
    evSig,
  ].join('|');
}

/**
 * @returns {{
 *   mode: 'trade_period' | 'draft_countdown' | 'finals' | 'calendar_done',
 *   buttonLabel: string,
 *   summary: string,
 *   detail: string,
 *   nextEventShort: string,
 * }}
 */
export function getAdvanceContext(career, league) {
  const nextEv = (career.eventQueue || []).find((e) => !e.completed);

  if (career.postSeasonPhase === 'trade_period' && career.inTradePeriod) {
    const day = career.tradePeriodDay || 0;
    const fa = career.freeAgencyOpen ? 'Free agency open' : 'Trades only';
    return {
      mode: 'trade_period',
      buttonLabel: 'Advance day',
      summary: `Trade period · day ${day}/${TRADE_PERIOD_DAYS}`,
      detail: `${fa}. Each press advances one off-season day.`,
      nextEventShort: day === 0 ? 'Start day 1' : `Day ${day}/${TRADE_PERIOD_DAYS}`,
    };
  }

  if (career.postSeasonPhase === 'draft_waiting') {
    const left = career.postSeasonDraftCountdown ?? POST_TRADE_DRAFT_COUNTDOWN_DAYS;
    return {
      mode: 'draft_countdown',
      buttonLabel: 'Count down',
      summary: `List reset · ${left} step${left === 1 ? '' : 's'} left`,
      detail: 'Advances toward the new season (contracts, calendar, ladder reset).',
      nextEventShort: `${left} until rollover`,
    };
  }

  if (career.inFinals) {
    return {
      mode: 'finals',
      buttonLabel: 'Play finals',
      summary: 'Finals week',
      detail: 'Sim the next finals fixture (or complete the series).',
      nextEventShort: 'Finals match',
    };
  }

  if (!nextEv) {
    return {
      mode: 'calendar_done',
      buttonLabel: 'Continue',
      summary: 'Season calendar complete',
      detail: league
        ? 'Opens finals or the post-season trade period (see Hub banner).'
        : 'Continue',
      nextEventShort: 'End of calendar',
    };
  }

  let nextLabel = 'Event';
  if (nextEv.type === 'training') {
    const info = TRAINING_INFO[nextEv.subtype] || {};
    nextLabel = info.name || 'Training';
  } else if (nextEv.type === 'key_event') nextLabel = nextEv.name;
  else if (nextEv.type === 'preseason_match') nextLabel = nextEv.label || 'Practice match';
  else if (nextEv.type === 'round') nextLabel = `Round ${nextEv.round}`;

  return {
    mode: 'calendar',
    buttonLabel: 'Advance',
    summary: 'Season flow',
    detail: 'Completes the next calendar event (training, match, or key date).',
    nextEventShort: nextLabel,
  };
}
