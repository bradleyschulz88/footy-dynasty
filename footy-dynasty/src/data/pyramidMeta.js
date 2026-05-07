// Optional flavour text for Competition → Pyramid (leagueKey matches PYRAMID keys).
// Extend anytime without touching the generated pyramid data file.

export const LEAGUE_PYRAMID_NOTE = {
  AFL: "National premiership — the summit of the pyramid.",
  VFL: "Victorian second tier: AFL-aligned reserves and stand-alone state clubs.",
  SANFL: "South Australia's major state league — suburban grounds and old rivalries.",
  WAFL: "Western Australia's top state competition.",
  SFL: "Southern Tasmania senior league — island footy heartland.",
  NTFA: "Northern Tasmania football — cold nights and loud pavilion crowds.",
  NTFL: "Darwin & Top End footy — tropical lights and travel legs.",
  TalentLeague: "National under-age talent pathway — tomorrow's draft crop.",
  AFLCanberra: "ACT & southern NSW community league — long bus trips, big-hearted clubs.",
  AFLHCC: "Hunter & Central Coast — coastal leagues feeding regional ambition.",
};

export function pyramidNoteForLeague(leagueKey, tier) {
  if (LEAGUE_PYRAMID_NOTE[leagueKey]) return LEAGUE_PYRAMID_NOTE[leagueKey];
  if (tier === 1) return "Premier national or top-flight competition.";
  if (tier === 2) return "State or regional senior league — one step from the summit.";
  return "Community football — volunteers, rain, and a pie at three-quarter time.";
}
