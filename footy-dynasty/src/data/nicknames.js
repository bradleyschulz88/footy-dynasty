// Traditional club nicknames for the state leagues, keyed by pyramid club id.
// AFL clubs already carry their nickname in the club name ("Adelaide Crows");
// the state-league clubs are stored bare ("Norwood"), so this restores the
// real identity the crowds actually use. Additive only — nothing in the
// auto-generated pyramid changes, so saves and matching are untouched.

export const NICKNAME_BY_CLUB_ID = /** @type {Record<string,string>} */ ({
  // ── SANFL ──────────────────────────────────────────────
  sanfl_adelaide: "Crows",
  sanfl_central_district: "Bulldogs",
  sanfl_glenelg: "Tigers",
  sanfl_north_adelaide: "Roosters",
  sanfl_norwood: "Redlegs",
  sanfl_port_adelaide: "Magpies",
  sanfl_south_adelaide: "Panthers",
  sanfl_sturt: "Double Blues",
  sanfl_west_adelaide: "Bloods",
  sanfl_woodville_west_torre: "Eagles",
  // ── WAFL ───────────────────────────────────────────────
  wafl_claremont: "Tigers",
  wafl_east_fremantle: "Sharks",
  wafl_east_perth: "Royals",
  wafl_peel_thunder: "Thunder",
  wafl_perth: "Demons",
  wafl_south_fremantle: "Bulldogs",
  wafl_subiaco: "Lions",
  wafl_swan_districts: "Swans",
  wafl_west_coast_eagles: "Eagles",
  wafl_west_perth: "Falcons",
  // ── VFL (bare sides; clubs already carrying a nickname in their name,
  //    e.g. "Box Hill Hawks", are intentionally omitted) ──
  vfl_carlton: "Blues",
  vfl_collingwood: "Magpies",
  vfl_essendon: "Bombers",
  vfl_frankston: "Dolphins",
  vfl_geelong: "Cats",
  vfl_north_melbourne: "Kangaroos",
  vfl_port_melbourne: "Borough",
  vfl_richmond: "Tigers",
  vfl_sandringham: "Zebras",
  vfl_st_kilda: "Saints",
  vfl_williamstown: "Seagulls",
  // ── TSL ────────────────────────────────────────────────
  tsl_clarence: "Roos",
  tsl_glenorchy: "Magpies",
  tsl_launceston: "Blues",
  tsl_north_hobart: "Demons",
  // ── QAFL ───────────────────────────────────────────────
  qafl_aspley: "Hornets",
  qafl_broadbeach: "Cats",
  qafl_labrador: "Tigers",
  qafl_morningside: "Panthers",
  qafl_mt_gravatt: "Vultures",
  qafl_palm_beach_currumbin: "Lions",
  qafl_surfers_paradise: "Demons",
  qafl_wilston_grange: "Gorillas",
});

/**
 * The club's traditional nickname (e.g. "Redlegs"), or null if none is known.
 * @param {{ id?: string } | string | null | undefined} clubOrId
 * @returns {string | null}
 */
export function clubNickname(clubOrId) {
  const id = typeof clubOrId === "string" ? clubOrId : clubOrId?.id;
  return (id && NICKNAME_BY_CLUB_ID[id]) || null;
}
