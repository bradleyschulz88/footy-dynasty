export const STATES = ["VIC", "SA", "WA", "TAS", "NT", "QLD", "NSW"];

export const PYRAMID = {
  // TIER 1 — National (AFL)
  AFL: {
    tier: 1, name: "Australian Football League", short: "AFL", state: "NAT",
    clubs: [
      { id: "ade", name: "Adelaide Crows", short: "ADE", state: "SA", colors: ["#002B5C", "#E21937", "#FFD200"] },
      { id: "bri", name: "Brisbane Lions", short: "BRI", state: "QLD", colors: ["#7A0019", "#003E80", "#FDB930"] },
      { id: "car", name: "Carlton Blues", short: "CAR", state: "VIC", colors: ["#0E1A40", "#FFFFFF", "#0E1A40"] },
      { id: "col", name: "Collingwood Magpies", short: "COL", state: "VIC", colors: ["#000000", "#FFFFFF", "#000000"] },
      { id: "ess", name: "Essendon Bombers", short: "ESS", state: "VIC", colors: ["#CC2031", "#000000", "#CC2031"] },
      { id: "fre", name: "Fremantle Dockers", short: "FRE", state: "WA", colors: ["#2A0D54", "#FFFFFF", "#2A0D54"] },
      { id: "gee", name: "Geelong Cats", short: "GEE", state: "VIC", colors: ["#002F6C", "#FFFFFF", "#002F6C"] },
      { id: "gcs", name: "Gold Coast Suns", short: "GCS", state: "QLD", colors: ["#D71920", "#FDB813", "#231F20"] },
      { id: "gws", name: "GWS Giants", short: "GWS", state: "NSW", colors: ["#F47920", "#231F20", "#FFFFFF"] },
      { id: "haw", name: "Hawthorn Hawks", short: "HAW", state: "VIC", colors: ["#4D2004", "#FBBF15", "#4D2004"] },
      { id: "mel", name: "Melbourne Demons", short: "MEL", state: "VIC", colors: ["#0F1131", "#CC2031", "#0F1131"] },
      { id: "nor", name: "North Melbourne", short: "NOR", state: "VIC", colors: ["#003F87", "#FFFFFF", "#003F87"] },
      { id: "pad", name: "Port Adelaide", short: "PAD", state: "SA", colors: ["#008AAB", "#000000", "#FFFFFF"] },
      { id: "ric", name: "Richmond Tigers", short: "RIC", state: "VIC", colors: ["#FFD200", "#000000", "#FFD200"] },
      { id: "stk", name: "St Kilda Saints", short: "STK", state: "VIC", colors: ["#ED1B2F", "#000000", "#FFFFFF"] },
      { id: "syd", name: "Sydney Swans", short: "SYD", state: "NSW", colors: ["#ED1B2F", "#FFFFFF", "#ED1B2F"] },
      { id: "wce", name: "West Coast Eagles", short: "WCE", state: "WA", colors: ["#003087", "#F2A900", "#003087"] },
      { id: "wbd", name: "Western Bulldogs", short: "WBD", state: "VIC", colors: ["#0039A6", "#E21937", "#FFFFFF"] },
    ],
  },
  // TIER 2 — State Leagues
  VFL: { tier: 2, name: "Victorian Football League", short: "VFL", state: "VIC",
    clubs: [
      { id: "boxhill", name: "Box Hill Hawks", short: "BHH", state: "VIC", colors: ["#4D2004", "#FBBF15", "#4D2004"] },
      { id: "casey", name: "Casey Demons", short: "CSY", state: "VIC", colors: ["#0F1131", "#CC2031", "#0F1131"] },
      { id: "coburg", name: "Coburg Lions", short: "COB", state: "VIC", colors: ["#FFD200", "#000080", "#FFD200"] },
      { id: "frankston", name: "Frankston Dolphins", short: "FRK", state: "VIC", colors: ["#003366", "#FFFFFF", "#0099CC"] },
      { id: "north_bull", name: "Northern Bullants", short: "NBT", state: "VIC", colors: ["#002A6C", "#FFFFFF", "#002A6C"] },
      { id: "port_melb", name: "Port Melbourne Borough", short: "PMB", state: "VIC", colors: ["#CC0000", "#0000CC", "#CC0000"] },
      { id: "sand", name: "Sandringham Zebras", short: "SAN", state: "VIC", colors: ["#FFFFFF", "#CC0000", "#000000"] },
      { id: "werribee", name: "Werribee FC", short: "WER", state: "VIC", colors: ["#CC0000", "#000000", "#FFD200"] },
      { id: "willy", name: "Williamstown Seagulls", short: "WIL", state: "VIC", colors: ["#003F87", "#FFD200", "#003F87"] },
    ],
  },
  SANFL: { tier: 2, name: "South Australian National FL", short: "SANFL", state: "SA",
    clubs: [
      { id: "central", name: "Central District Bulldogs", short: "CDB", state: "SA", colors: ["#002F6C", "#CC0000", "#FFFFFF"] },
      { id: "glenelg", name: "Glenelg Tigers", short: "GLG", state: "SA", colors: ["#000000", "#FFD200", "#000000"] },
      { id: "north_adel", name: "North Adelaide Roosters", short: "NAR", state: "SA", colors: ["#CC0000", "#FFFFFF", "#003F87"] },
      { id: "norwood", name: "Norwood Redlegs", short: "NWD", state: "SA", colors: ["#CC0000", "#000080", "#CC0000"] },
      { id: "port_mag", name: "Port Adelaide Magpies", short: "PAM", state: "SA", colors: ["#000000", "#FFFFFF", "#000000"] },
      { id: "south_adel", name: "South Adelaide Panthers", short: "SAP", state: "SA", colors: ["#000080", "#FFFFFF", "#000080"] },
      { id: "sturt", name: "Sturt Double Blues", short: "STU", state: "SA", colors: ["#002F6C", "#0099CC", "#002F6C"] },
      { id: "west_adel", name: "West Adelaide Bloods", short: "WAB", state: "SA", colors: ["#000000", "#CC0000", "#000000"] },
      { id: "wwt", name: "Woodville-West Torrens Eagles", short: "WWT", state: "SA", colors: ["#FFD200", "#000080", "#FFD200"] },
    ],
  },
  WAFL: { tier: 2, name: "West Australian Football League", short: "WAFL", state: "WA",
    clubs: [
      { id: "claremont", name: "Claremont Tigers", short: "CLA", state: "WA", colors: ["#FFD200", "#000000", "#FFD200"] },
      { id: "east_frem", name: "East Fremantle Sharks", short: "EFS", state: "WA", colors: ["#0033A0", "#FFFFFF", "#0033A0"] },
      { id: "east_perth", name: "East Perth Royals", short: "EPR", state: "WA", colors: ["#000080", "#CC0000", "#FFFFFF"] },
      { id: "peel", name: "Peel Thunder", short: "PEL", state: "WA", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "perth_dem", name: "Perth Demons", short: "PRD", state: "WA", colors: ["#CC0000", "#000080", "#CC0000"] },
      { id: "sth_frem", name: "South Fremantle Bulldogs", short: "SFB", state: "WA", colors: ["#CC0000", "#FFFFFF", "#CC0000"] },
      { id: "subiaco", name: "Subiaco Lions", short: "SUB", state: "WA", colors: ["#800020", "#FFD200", "#800020"] },
      { id: "swan_dist", name: "Swan Districts Swans", short: "SWD", state: "WA", colors: ["#000000", "#FFFFFF", "#CC0000"] },
      { id: "west_perth", name: "West Perth Falcons", short: "WPF", state: "WA", colors: ["#CC0000", "#000080", "#CC0000"] },
    ],
  },
  TSL: { tier: 2, name: "Tasmanian State League", short: "TSL", state: "TAS",
    clubs: [
      { id: "clarence", name: "Clarence Roos", short: "CLR", state: "TAS", colors: ["#003366", "#FFFFFF", "#003366"] },
      { id: "glenorchy", name: "Glenorchy Magpies", short: "GMP", state: "TAS", colors: ["#000000", "#FFFFFF", "#000000"] },
      { id: "lauder", name: "Lauderdale Bombers", short: "LDB", state: "TAS", colors: ["#CC0000", "#000000", "#CC0000"] },
      { id: "launc", name: "Launceston Blues", short: "LCB", state: "TAS", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "north_hob", name: "North Hobart Demons", short: "NHD", state: "TAS", colors: ["#CC0000", "#000080", "#CC0000"] },
      { id: "north_lau", name: "North Launceston Bombers", short: "NLB", state: "TAS", colors: ["#CC0000", "#000000", "#CC0000"] },
      { id: "tigers", name: "Kingborough Tigers", short: "KGT", state: "TAS", colors: ["#FFD200", "#000000", "#FFD200"] },
    ],
  },
  NTFL: { tier: 2, name: "Northern Territory FL", short: "NTFL", state: "NT",
    clubs: [
      { id: "darwin", name: "Darwin Buffaloes", short: "DWB", state: "NT", colors: ["#003366", "#FFFFFF", "#003366"] },
      { id: "nightcliff", name: "Nightcliff Tigers", short: "NCT", state: "NT", colors: ["#FFD200", "#000000", "#FFD200"] },
      { id: "palm_mag", name: "Palmerston Magpies", short: "PMG", state: "NT", colors: ["#000000", "#FFFFFF", "#000000"] },
      { id: "sth_dist", name: "Southern Districts Crocs", short: "SDC", state: "NT", colors: ["#006633", "#FFFFFF", "#006633"] },
      { id: "stmary", name: "St Mary's Saints", short: "SMS", state: "NT", colors: ["#CC0000", "#FFFFFF", "#000080"] },
      { id: "tiwi", name: "Tiwi Bombers", short: "TWB", state: "NT", colors: ["#CC0000", "#000000", "#CC0000"] },
      { id: "wand", name: "Wanderers Eagles", short: "WND", state: "NT", colors: ["#000080", "#FFD200", "#000080"] },
      { id: "wara", name: "Waratah Warriors", short: "WAR", state: "NT", colors: ["#CC0000", "#FFFFFF", "#CC0000"] },
    ],
  },
  QAFL: { tier: 2, name: "Queensland Australian FL", short: "QAFL", state: "QLD",
    clubs: [
      { id: "aspley", name: "Aspley Hornets", short: "ASP", state: "QLD", colors: ["#FFD200", "#000000", "#CC0000"] },
      { id: "broadbeach", name: "Broadbeach Cats", short: "BBC", state: "QLD", colors: ["#000080", "#FFFFFF", "#000080"] },
      { id: "labrador", name: "Labrador Tigers", short: "LBT", state: "QLD", colors: ["#FFD200", "#000000", "#FFD200"] },
      { id: "mt_grav", name: "Mt Gravatt Vultures", short: "MGV", state: "QLD", colors: ["#660066", "#FFD200", "#660066"] },
      { id: "palm_qld", name: "Palm Beach Currumbin", short: "PBC", state: "QLD", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "redland", name: "Redland Bombers", short: "RDB", state: "QLD", colors: ["#CC0000", "#000000", "#CC0000"] },
      { id: "southport", name: "Southport Sharks", short: "SPS", state: "QLD", colors: ["#003366", "#FFFFFF", "#003366"] },
      { id: "surf_para", name: "Surfers Paradise Demons", short: "SPD", state: "QLD", colors: ["#CC0000", "#000080", "#CC0000"] },
    ],
  },
  AFLSyd: { tier: 2, name: "AFL Sydney Premier", short: "AFLS", state: "NSW",
    clubs: [
      { id: "balmain", name: "Balmain Tigers", short: "BLT", state: "NSW", colors: ["#FFD200", "#000000", "#FFD200"] },
      { id: "east_swans", name: "East Coast Eagles", short: "ECE", state: "NSW", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "north_shore", name: "North Shore Bombers", short: "NSB", state: "NSW", colors: ["#CC0000", "#000000", "#CC0000"] },
      { id: "pennant_h", name: "Pennant Hills Demons", short: "PHD", state: "NSW", colors: ["#CC0000", "#000080", "#CC0000"] },
      { id: "st_george", name: "St George Dragons", short: "SGD", state: "NSW", colors: ["#CC0000", "#FFFFFF", "#CC0000"] },
      { id: "sydney_uni", name: "Sydney Uni Lions", short: "SUL", state: "NSW", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "uni_nsw", name: "UNSW-ES Bulldogs", short: "UNB", state: "NSW", colors: ["#003366", "#CC0000", "#003366"] },
      { id: "western_mag", name: "Western Magic", short: "WMG", state: "NSW", colors: ["#660066", "#FFFFFF", "#660066"] },
    ],
  },
  // TIER 3 — Community Leagues
  EFL: { tier: 3, name: "Eastern Football League", short: "EFL", state: "VIC",
    clubs: [
      { id: "balwyn", name: "Balwyn FC", short: "BAL", state: "VIC", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "bayswater", name: "Bayswater FC", short: "BAY", state: "VIC", colors: ["#CC0000", "#FFFFFF", "#000000"] },
      { id: "blackburn", name: "Blackburn FC", short: "BLK", state: "VIC", colors: ["#FFD200", "#000000", "#FFD200"] },
      { id: "boronia", name: "Boronia FC", short: "BOR", state: "VIC", colors: ["#000080", "#FFFFFF", "#000080"] },
      { id: "doncaster", name: "Doncaster FC", short: "DON", state: "VIC", colors: ["#CC0000", "#FFD200", "#CC0000"] },
      { id: "knox", name: "Knox FC", short: "KNX", state: "VIC", colors: ["#000080", "#FFFFFF", "#000080"] },
      { id: "noble_park", name: "Noble Park FC", short: "NBP", state: "VIC", colors: ["#CC0000", "#000000", "#CC0000"] },
      { id: "rowville", name: "Rowville FC", short: "ROW", state: "VIC", colors: ["#660066", "#FFD200", "#660066"] },
      { id: "vermont", name: "Vermont FC", short: "VRM", state: "VIC", colors: ["#000000", "#CC0000", "#000000"] },
    ],
  },
  EDFL: { tier: 3, name: "Essendon District FL", short: "EDFL", state: "VIC",
    clubs: [
      { id: "aberfeldie", name: "Aberfeldie FC", short: "ABF", state: "VIC", colors: ["#000080", "#CC0000", "#FFFFFF"] },
      { id: "airport_w", name: "Airport West FC", short: "AWE", state: "VIC", colors: ["#FFD200", "#000080", "#FFD200"] },
      { id: "greenvale", name: "Greenvale FC", short: "GRV", state: "VIC", colors: ["#006633", "#FFD200", "#006633"] },
      { id: "keilor", name: "Keilor FC", short: "KEI", state: "VIC", colors: ["#000080", "#FFD200", "#000080"] },
      { id: "pascoe_v", name: "Pascoe Vale FC", short: "PCV", state: "VIC", colors: ["#660066", "#FFFFFF", "#660066"] },
      { id: "strathmore", name: "Strathmore FC", short: "STR", state: "VIC", colors: ["#CC0000", "#000080", "#CC0000"] },
      { id: "tullamar", name: "Tullamarine FC", short: "TUL", state: "VIC", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "westmead", name: "Westmeadows FC", short: "WMD", state: "VIC", colors: ["#000080", "#FFFFFF", "#CC0000"] },
    ],
  },
  NFL: { tier: 3, name: "Northern Football League", short: "NFL", state: "VIC",
    clubs: [
      { id: "banyule", name: "Banyule FC", short: "BNY", state: "VIC", colors: ["#003366", "#FFFFFF", "#003366"] },
      { id: "bundoora", name: "Bundoora FC", short: "BND", state: "VIC", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "diamond_c", name: "Diamond Creek FC", short: "DCK", state: "VIC", colors: ["#FFD200", "#000000", "#FFD200"] },
      { id: "eltham", name: "Eltham FC", short: "ELT", state: "VIC", colors: ["#006633", "#FFFFFF", "#006633"] },
      { id: "greensb", name: "Greensborough FC", short: "GRB", state: "VIC", colors: ["#000080", "#FFFFFF", "#000080"] },
      { id: "heid", name: "Heidelberg FC", short: "HEI", state: "VIC", colors: ["#000000", "#FFFFFF", "#CC0000"] },
      { id: "macleod", name: "Macleod FC", short: "MAC", state: "VIC", colors: ["#660066", "#FFD200", "#660066"] },
      { id: "watsonia", name: "Watsonia FC", short: "WAT", state: "VIC", colors: ["#003366", "#FFD200", "#003366"] },
    ],
  },
  SFL: { tier: 3, name: "Southern Football League", short: "SFL", state: "VIC",
    clubs: [
      { id: "bentleigh", name: "Bentleigh FC", short: "BEN", state: "VIC", colors: ["#000080", "#FFD200", "#000080"] },
      { id: "cheltenham", name: "Cheltenham FC", short: "CHE", state: "VIC", colors: ["#006633", "#FFFFFF", "#006633"] },
      { id: "dingley", name: "Dingley FC", short: "DGL", state: "VIC", colors: ["#000000", "#FFD200", "#000000"] },
      { id: "frank_dol", name: "Frankston Dolphins (Sthn)", short: "FRD", state: "VIC", colors: ["#0099CC", "#FFFFFF", "#0099CC"] },
      { id: "highett", name: "Highett FC", short: "HGT", state: "VIC", colors: ["#CC0000", "#000000", "#CC0000"] },
      { id: "mordi", name: "Mordialloc FC", short: "MDL", state: "VIC", colors: ["#FFD200", "#000080", "#FFD200"] },
      { id: "skye", name: "Skye FC", short: "SKY", state: "VIC", colors: ["#0099CC", "#000000", "#0099CC"] },
      { id: "stkc", name: "St Kilda City FC", short: "SKC", state: "VIC", colors: ["#CC0000", "#FFFFFF", "#000000"] },
    ],
  },
  VAFA: { tier: 3, name: "Victorian Amateur FA", short: "VAFA", state: "VIC",
    clubs: [
      { id: "ajax", name: "AJAX FC", short: "AJX", state: "VIC", colors: ["#003366", "#FFFFFF", "#003366"] },
      { id: "beaumaris", name: "Beaumaris FC", short: "BEA", state: "VIC", colors: ["#FFD200", "#000080", "#FFD200"] },
      { id: "collegians", name: "Collegians FC", short: "COL2", state: "VIC", colors: ["#000080", "#FFD200", "#000080"] },
      { id: "fitzroy", name: "Fitzroy FC", short: "FTZ", state: "VIC", colors: ["#660066", "#FFD200", "#660066"] },
      { id: "old_brigh", name: "Old Brighton Grammarians", short: "OBG", state: "VIC", colors: ["#003366", "#FFD200", "#003366"] },
      { id: "old_mel", name: "Old Melburnians", short: "OLM", state: "VIC", colors: ["#000000", "#0099CC", "#000000"] },
      { id: "old_scotch", name: "Old Scotch", short: "OSC", state: "VIC", colors: ["#FFD200", "#000080", "#FFD200"] },
      { id: "uni_blacks", name: "University Blacks", short: "UBK", state: "VIC", colors: ["#000000", "#FFFFFF", "#000000"] },
    ],
  },
};

export const LEAGUES_BY_TIER = (tier) =>
  Object.entries(PYRAMID)
    .filter(([, l]) => l.tier === tier)
    .map(([k, v]) => ({ key: k, ...v }));

export const LEAGUES_BY_STATE = (state) =>
  Object.entries(PYRAMID)
    .filter(([, l]) => l.state === state || l.state === "NAT")
    .map(([k, v]) => ({ key: k, ...v }));

export const ALL_CLUBS = Object.entries(PYRAMID).flatMap(([lkey, league]) =>
  league.clubs.map(c => ({ ...c, league: lkey, leagueName: league.name, tier: league.tier }))
);

export const findClub = (id) => ALL_CLUBS.find(c => c.id === id);

export const findLeagueOf = (clubId) => {
  const c = findClub(clubId);
  return c ? PYRAMID[c.league] : null;
};
