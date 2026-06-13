// ---------------------------------------------------------------------------
// Half-time coaching calls — the one decision the coach makes mid-match.
// Each call maps to strength deltas applied to Q3 + Q4 of the live sim.
// Magnitudes are tuned against the engine's momentum tilt (±9 rating points
// at full swing): a call should matter, not decide the game on its own.
// ---------------------------------------------------------------------------
import { rng } from './rng.js';

export const COACHING_CALLS = [
  {
    id: 'attack_surge',
    icon: '⚡',
    label: 'Unleash the forwards',
    desc: 'Push numbers ahead of the ball. More scoring at both ends — best when you need to chase.',
    playerStrengthDelta: 3,
    oppStrengthDelta: 1.5,
  },
  {
    id: 'defensive_lock',
    icon: '🛡️',
    label: 'Lock down the defence',
    desc: 'Flood back and strangle their scoring — at the cost of your own attack. Protects a lead.',
    playerStrengthDelta: -1,
    oppStrengthDelta: -3,
  },
  {
    id: 'midfield_grind',
    icon: '💪',
    label: 'Win the contested ball',
    desc: 'Send your best runners to the coalface. A steady edge with no downside.',
    playerStrengthDelta: 2,
    oppStrengthDelta: 0,
  },
  {
    id: 'spray',
    icon: '🔥',
    label: 'Half-time spray',
    desc: 'Light a fire under them. Big lift if the group responds — risk they tighten up instead.',
    volatile: true,
  },
  {
    id: 'steady',
    icon: '🤝',
    label: 'Trust the plan',
    desc: 'No changes. Composure, structure, and belief in the work done all week.',
    playerStrengthDelta: 0.5,
    oppStrengthDelta: 0,
  },
];

export function getCoachingCall(id) {
  return COACHING_CALLS.find((c) => c.id === id) || COACHING_CALLS[COACHING_CALLS.length - 1];
}

/**
 * Resolve a call into per-quarter sim mods. Volatile calls (the spray) roll
 * once here: ~60% the rooms responds (+4), otherwise the group tightens (-1.5).
 * @returns {{ playerStrengthDelta: number, oppStrengthDelta: number, note: string }}
 */
export function resolveCoachingCall(callId) {
  const call = getCoachingCall(callId);
  if (call.volatile) {
    const responded = rng() < 0.6;
    return responded
      ? { playerStrengthDelta: 4, oppStrengthDelta: 0, note: 'The rooms responded — they came out flying.' }
      : { playerStrengthDelta: -1.5, oppStrengthDelta: 0, note: 'The spray fell flat — a few heads dropped.' };
  }
  return {
    playerStrengthDelta: call.playerStrengthDelta ?? 0,
    oppStrengthDelta: call.oppStrengthDelta ?? 0,
    note: null,
  };
}
