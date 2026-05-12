/** Tactical / training flavour tied to coaching staff ratings (IDs from defaults.STAFF_BLUEPRINT). */

/** Match-preview flavour line from midfield / tactics-linked roles (s4 = midfield coach blueprint id). */
export function matchPrepStaffLine(staff) {
  const row = (staff || []).find((s) => s.id === "s4");
  if (!row) return null;
  const r = Number(row.rating);
  if (!Number.isFinite(r)) return null;
  if (r >= 78) return "Staff prep: sharp midfield unit — structures hold under heavier contested loads.";
  if (r >= 65) return "Staff prep: solid weekly planning vs typical opponents.";
  return "Staff prep: lightweight midfield dept — harder to squeeze extra tactical upside.";
}

/** Training-tab hint: how much staff quality amplifies the tactics slider narrative. */
export function trainingStaffSupportLine(staff, tacticsFocusPct = 25) {
  const avg =
    (staff || []).reduce((a, s) => a + (Number(s.rating) || 0), 0) / Math.max(1, (staff || []).length);
  const emphasis = tacticsFocusPct >= 28 ? "High tactics emphasis asks more of your coaches." : null;
  if (avg >= 72)
    return emphasis
      ? `${emphasis} Strong department across the board — you should see cleaner weekly gains.`
      : "Strong coaching roster — weekly loads translate reliably into player improvement.";
  if (avg >= 58)
    return emphasis
      ? `${emphasis} Adequate staff — keep recovery high if you're stacking tactical workload.`
      : "Staff bench is workable — gains remain dependable at moderate intensity.";
  return emphasis
    ? `${emphasis} Thin staff depth — watch fatigue spikes when tactics share stays elevated.`
    : "Volunteer-heavy bench — favour conservative intensity unless you invest off-field.";
}
