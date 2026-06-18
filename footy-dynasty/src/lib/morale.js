// ---------------------------------------------------------------------------
// Transparent morale: every change is logged with a reason so the player can see
// cause and effect, plus helpers for unhappiness escalation and resolution.
//
// Mechanical impact of morale lives in matchEngine.js (moraleMult) — this module
// only adjusts/logs morale and exposes UI helpers. Keep swings modest: the win
// here is legibility, not volatility.
// ---------------------------------------------------------------------------

/** Apply a morale change to a player with a logged reason. Returns a new player object. */
export function adjustMorale(player, delta, reason, week) {
  const cur = player.morale ?? 75;
  const next = Math.max(0, Math.min(100, cur + delta));
  const log = [{ week, delta: Math.round(next - cur), reason }, ...(player.moraleLog || [])].slice(0, 6);
  return { ...player, morale: next, moraleLog: log };
}

/** Bucket morale into a label + color for UI. */
export function moraleBand(morale) {
  const m = morale ?? 75;
  if (m >= 80) return { label: 'Buzzing', tone: 'pos' };
  if (m >= 65) return { label: 'Content', tone: 'neutral' };
  if (m >= 45) return { label: 'Restless', tone: 'warn' };
  if (m >= 30) return { label: 'Unhappy', tone: 'neg' };
  return { label: 'Wants Out', tone: 'neg' };
}

/** Map a band tone to a CSS variable for pills/labels. */
export function moraleToneColor(tone) {
  switch (tone) {
    case 'pos': return 'var(--A-pos)';
    case 'warn': return '#FFB347';
    case 'neg': return 'var(--A-neg)';
    default: return 'var(--A-text-mute)';
  }
}

export const MORALE_REASONS = {
  win: 'Team won',
  loss: 'Team lost',
  bigWin: 'Big win',
  heavyLoss: 'Heavy defeat',
  dropped: 'Dropped from the 22',
  benched: 'Limited game time',
  recalled: 'Recalled to the side',
  bestOnGround: 'Starred on the weekend',
  renewed: 'Signed a new deal',
  rejected: 'Renewal knocked back',
  newSigning: 'Settling in at the club',
};

/** Manager promises more game time — lifts morale, clears the request if honored later. */
export function promiseGameTime(player, week) { return { ...adjustMorale(player, +10, 'Promised more game time', week), transferRequested: false, unhappySince: null, promiseWeek: week }; }
/** Manager publicly backs the player. Small lift. */
export function backPlayer(player, week) { return adjustMorale(player, +6, 'Backed by the coach', week); }
