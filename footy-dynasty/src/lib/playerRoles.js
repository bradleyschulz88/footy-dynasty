// Positional player roles — an optional layer of tactical depth on top of zone
// tactics. Assign a role to a starter and they earn a small rating bonus when
// their attributes fit, or a penalty when they don't. Total swing is capped so
// roles matter without dominating other modifiers (≈ ±4 rating points).

export const PLAYER_ROLES = {
  none:        { label: 'No role',        desc: 'No special instruction.', attrs: [] },
  ball_winner: { label: 'Ball Winner',    desc: 'Wins contested ball in tight.', attrs: ['tackling','strength','decision'] },
  rebound_def: { label: 'Rebounding Defender', desc: 'Drives off half-back.', attrs: ['kicking','speed','decision'] },
  lockdown_def:{ label: 'Lockdown Defender', desc: 'Negates a dangerous opponent.', attrs: ['tackling','strength','marking'] },
  key_forward: { label: 'Key Forward',    desc: 'Marks and converts inside 50.', attrs: ['marking','strength','kicking'] },
  crumber:     { label: 'Crumbing Forward', desc: 'Wins ground ball at feet.', attrs: ['speed','handball','tackling'] },
  outside_run: { label: 'Outside Runner', desc: 'Carries and spreads with pace.', attrs: ['speed','endurance','kicking'] },
  ruck:        { label: 'Ruck',           desc: 'Controls hit-outs.', attrs: ['strength','marking','endurance'] },
  playmaker:   { label: 'Playmaker',      desc: 'Distributes by hand and foot.', attrs: ['handball','kicking','decision'] },
};

/**
 * Role fit for a player: 'A' (excellent), 'B' (solid), 'C' (poor).
 * Based on the average of the role's key attributes vs the player's overall.
 */
export function roleFit(player, roleKey) {
  const role = PLAYER_ROLES[roleKey];
  if (!role || !role.attrs.length || !player?.attrs) return { grade: 'B', delta: 0 };
  const vals = role.attrs.map((a) => player.attrs[a] ?? 60);
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  const ref = player.overall ?? 60;
  const gap = avg - ref; // positive = player is strong in the role's attributes
  if (gap >= 4) return { grade: 'A', delta: 2.0 };
  if (gap >= -2) return { grade: 'B', delta: 0.5 };
  return { grade: 'C', delta: -2.0 };
}

/**
 * Total role-fit rating modifier for a lineup.
 * career.playerRoles is a map of playerId -> roleKey.
 * Sums roleFit deltas for assigned starters, scaled so it stays in the same
 * noise band as other rating modifiers.
 */
export function lineupRoleModifier(squad, lineupIds, playerRoles) {
  if (!playerRoles || !lineupIds?.length) return 0;
  const byId = new Map((squad || []).map((p) => [p.id, p]));
  let total = 0;
  let count = 0;
  for (const id of lineupIds) {
    const roleKey = playerRoles[id];
    if (!roleKey || roleKey === 'none') continue;
    const p = byId.get(id);
    if (!p) continue;
    total += roleFit(p, roleKey).delta;
    count++;
  }
  if (count === 0) return 0;
  // Scale: sum of deltas, but cap the swing so roles matter without dominating.
  return Math.max(-4, Math.min(4, total * 0.5));
}
