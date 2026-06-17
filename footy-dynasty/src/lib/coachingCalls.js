// ---------------------------------------------------------------------------
// Half-time coaching calls — the one decision the coach makes mid-match.
// Each call maps to strength deltas applied to Q3 + Q4 of the live sim.
// Magnitudes are tuned against the engine's momentum tilt (±9 rating points
// at full swing): a call should matter, not decide the game on its own.
// ---------------------------------------------------------------------------
import { rng } from './rng.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

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
export function resolveCoachingCall(callId, staff = []) {
  const call = getCoachingCall(callId);
  const s1 = (staff || []).find((s) => s.id === 's1');
  const coachRating = Number(s1?.rating) || 70;
  // rating 55 → 0.88×, 70 → 1.0×, 88 → 1.15× — better coaches get more from their calls
  const coachScale = clamp(1 + (coachRating - 70) / 120, 0.75, 1.3);
  if (call.volatile) {
    // Elite coaches get the rooms going more reliably
    const threshold = Math.min(0.82, 0.6 + (coachRating - 70) * 0.004);
    const responded = rng() < threshold;
    return responded
      ? { playerStrengthDelta: 4 * coachScale, oppStrengthDelta: 0, note: 'The rooms responded — they came out flying.' }
      : { playerStrengthDelta: -1.5, oppStrengthDelta: 0, note: 'The spray fell flat — a few heads dropped.' };
  }
  return {
    playerStrengthDelta: (call.playerStrengthDelta ?? 0) * coachScale,
    oppStrengthDelta: (call.oppStrengthDelta ?? 0) * coachScale,
    note: null,
  };
}
