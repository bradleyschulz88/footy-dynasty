/** Tactical / training flavour tied to coaching staff ratings (IDs from defaults.STAFF_BLUEPRINT). */

/** Match-preview flavour from midfield coach + optional analyst depth (staffTasks.matchPrepTier). */
export function matchPrepStaffLine(staff, career) {
  const row = (staff || []).find((s) => s.id === "s4");
  let mids = "";
  if (row) {
    const r = Number(row.rating);
    if (Number.isFinite(r)) {
      if (r >= 78) mids = "Staff prep: sharp midfield unit — structures hold under heavier contested loads.";
      else if (r >= 65) mids = "Staff prep: solid weekly planning vs typical opponents.";
      else mids = "Staff prep: lightweight midfield dept — harder to squeeze extra tactical upside.";
    }
  }
  const tier = Number(career?.staffTasks?.matchPrepTier) || 0;
  const analyst = (staff || []).find((s) => s.id === "s10");
  const ar = analyst ? Number(analyst.rating) : 0;
  let extra = "";
  if (tier >= 2 && analyst && ar >= 58) {
    extra =
      " Analyst bundle: opponent tendencies tagged — midfield exits and fwd entries mapped on the whiteboard.";
  } else if (tier >= 1 && analyst && ar >= 52) {
    extra = " Analyst desk: baseline opponent tape cut-ups ready for match committee.";
  } else if (tier >= 1) {
    extra = " Match prep depth raised — analyst capacity is stretched; lean on coaches’ gut calls.";
  }
  const chunks = [mids.trim(), extra.trim()].filter(Boolean);
  return chunks.length ? chunks.join(' ') : null;
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
