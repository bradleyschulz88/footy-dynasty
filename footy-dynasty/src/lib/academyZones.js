// Academy zone partnerships — AFL club id → zone/talent league club id
// Based on real-world NAB AFL Academy / Next Generation Academies zone areas.
// Club can match any bid on a prospect whose academyClub matches their zoneClub.
// AFL has 19 clubs but TalentLeague has 13 clubs — some clubs share zones,
// and clubs without a Victorian zone partner return null.
export const ACADEMY_ZONES = {
  // Victorian clubs — each zones one TalentLeague region
  car: 'tl_northern_knights',       // Carlton → Northern Knights (north/west metro)
  col: 'tl_oakleigh_chargers',      // Collingwood → Oakleigh Chargers (south-east metro)
  ess: 'tl_northern_knights',       // Essendon → Northern Knights (shared northern metro)
  haw: 'tl_eastern_ranges',         // Hawthorn → Eastern Ranges (outer east)
  mel: 'tl_sandringham_dragons',    // Melbourne → Sandringham Dragons (bay-side south)
  nor: 'tl_calder_cannons',         // North Melbourne → Calder Cannons (north-west)
  ric: 'tl_eastern_ranges',         // Richmond → Eastern Ranges (shared east)
  stk: 'tl_sandringham_dragons',    // St Kilda → Sandringham Dragons (shared bay-side)
  wbd: 'tl_western_jets',           // Western Bulldogs → Western Jets (west metro)
  gee: 'tl_geelong_falcons',        // Geelong → Geelong Falcons (Geelong region)

  // Country / regional Victorian clubs
  // (no dedicated AFL club in pyramid for these — mapped for completeness)

  // Interstate clubs zone Victorian regions by historic arrangement / Next Gen Academies
  ade: 'tl_dandenong_stingrays',    // Adelaide → Dandenong Stingrays (south-east VIC)
  bri: 'tl_murray_bushrangers',     // Brisbane → Murray Bushrangers (north-east VIC)
  fre: 'tl_western_jets',           // Fremantle → Western Jets (shared west)
  gcs: 'tl_gwv_rebels',             // Gold Coast → GWV Rebels (Grampians/Western VIC)
  gws: 'tl_gippsland_power',        // GWS → Gippsland Power (east Gippsland)
  pad: 'tl_bendigo_pioneers',       // Port Adelaide → Bendigo Pioneers (central VIC)
  syd: 'tl_gippsland_power',        // Sydney → Gippsland Power (shared)
  wce: 'tl_calder_cannons',         // West Coast → Calder Cannons (shared north-west)
  tas: 'tl_tasmania_devils',        // Tasmania → Tasmania Devils (TAS pathway)
};

/**
 * Returns the zone/academy club id for a given AFL club, or null if unmapped.
 * @param {string} aflClubId
 * @returns {string|null}
 */
export function getZoneClub(aflClubId) {
  return ACADEMY_ZONES[aflClubId] ?? null;
}

/**
 * Returns true if the AFL club has zone rights to match a bid on this prospect.
 * Null-safe: returns false if prospect is missing or has no academyClub.
 * @param {string} aflClubId
 * @param {{ academyClub?: string }} prospect
 * @returns {boolean}
 */
export function canMatchBid(aflClubId, prospect) {
  if (!aflClubId || !prospect?.academyClub) return false;
  const zone = getZoneClub(aflClubId);
  if (!zone) return false;
  return prospect.academyClub === zone;
}
