// Real-world AFL club training bases & facility flavour.
//
// Sources (verified July 2026): club/AFL sites and Wikipedia — Collingwood's
// AIA Centre, Essendon's The Hangar, Brisbane's Brighton Homes Arena, West
// Coast's Mineral Resources Park (Lathlain Park), Hawthorn's Kennedy Community
// Centre (opened 2025), Adelaide's Thebarton Oval HQ, the Western Bulldogs'
// $78M Whitten Oval redevelopment, and the long-standing suburban bases
// (Ikon Park, Punt Road, RSEA Park, Arden Street, Alberton, Moorabbin...).
// Logos remain procedural (real marks are trademarked); names/places are fact.

export const AFL_CLUB_FACILITIES = {
  ade: { base: "Adelaide Crows HQ", ground: "Thebarton Oval", suburb: "Thebarton, SA" },
  bri: { base: "Brighton Homes Arena", ground: "Springfield Central Stadium", suburb: "Springfield, QLD" },
  car: { base: "Ikon Park", ground: "Princes Park", suburb: "Carlton North, VIC" },
  col: { base: "AIA Centre", ground: "Olympic Park Oval", suburb: "Olympic Park, VIC" },
  ess: { base: "The Hangar", ground: "The Hangar Oval", suburb: "Melbourne Airport, VIC" },
  fre: { base: "Walyalup Centre", ground: "Cockburn ARC", suburb: "Cockburn Central, WA" },
  gee: { base: "GMHBA Stadium", ground: "Kardinia Park", suburb: "South Geelong, VIC" },
  gcs: { base: "Austworld Centre", ground: "Carrara Oval", suburb: "Carrara, QLD" },
  gws: { base: "GIANTS HQ", ground: "Tom Wills Oval", suburb: "Sydney Olympic Park, NSW" },
  haw: { base: "Kennedy Community Centre", ground: "Dingley Oval", suburb: "Dingley Village, VIC" },
  mel: { base: "AAMI Park", ground: "Gosch's Paddock", suburb: "Melbourne, VIC" },
  nor: { base: "Arden Street Oval", ground: "Arden Street Oval", suburb: "North Melbourne, VIC" },
  pad: { base: "Alberton Oval", ground: "Alberton Oval", suburb: "Alberton, SA" },
  ric: { base: "Punt Road Oval", ground: "Swinburne Centre", suburb: "Richmond, VIC" },
  stk: { base: "RSEA Park", ground: "Moorabbin Oval", suburb: "Moorabbin, VIC" },
  syd: { base: "Sydney Swans HQ", ground: "Lakeside Oval", suburb: "Moore Park, NSW" },
  tas: { base: "Kingston Training Centre", ground: "Twin Ovals", suburb: "Kingston, TAS" },
  wce: { base: "Mineral Resources Park", ground: "Lathlain Park", suburb: "Lathlain, WA" },
  wbd: { base: "Whitten Oval", ground: "Whitten Oval", suburb: "Footscray, VIC" },
};

/** Real base for AFL clubs; honest tier descriptors below that (we don't
 *  invent fake "elite centres" for community clubs). */
export function facilityBaseFor(clubId, tier) {
  if (tier === 1 && AFL_CLUB_FACILITIES[clubId]) return AFL_CLUB_FACILITIES[clubId];
  if (tier === 2) return { base: "State-league training base", suburb: null };
  return { base: "Community club facilities", suburb: null };
}

// What each facility level actually looks like on the ground — used as the
// descriptor line under every facility card. Index = level - 1 (max 5).
export const FACILITY_LEVEL_LABELS = {
  trainingGround: [
    "Council oval, shared changerooms",
    "Dedicated oval and club rooms",
    "Two ovals with full-time surface staff",
    "MCG-size oval plus indoor training field",
    "Elite multi-oval high-performance campus",
  ],
  gym: [
    "Weights in the storage shed",
    "Fitted-out club gym",
    "Strength & conditioning suite",
    "Pro-grade gym with altitude room",
    "Elite S&C centre with sports-science lab",
  ],
  medical: [
    "Visiting physio on match days",
    "On-site physio rooms",
    "Medical suite with imaging partner",
    "Full medical wing, club doctors on staff",
    "Elite sports-medicine department",
  ],
  academy: [
    "Local juniors pathway",
    "Development squad program",
    "Regional academy network",
    "Elite talent academy",
    "National-benchmark academy program",
  ],
  stadium: [
    "Suburban ground, temporary seating",
    "Grandstand and basic amenities",
    "Redeveloped home ground",
    "Modern boutique-stadium standard",
    "Elite stadium partnership",
  ],
  recovery: [
    "Ice baths in the sheds",
    "Plunge pools and sauna",
    "Wet and dry recovery rooms",
    "Hydrotherapy and recovery centre",
    "Full altitude/hydro recovery complex",
  ],
};

export function facilityLevelLabel(key, level) {
  const labels = FACILITY_LEVEL_LABELS[key];
  if (!labels) return "";
  return labels[Math.min(Math.max(1, level), labels.length) - 1];
}

// Starting facility levels by league tier — an AFL club walks in with
// near-elite infrastructure; a community club starts from the council oval.
export const TIER_START_LEVELS = {
  1: { trainingGround: 4, gym: 4, medical: 4, academy: 3, stadium: 4, recovery: 4 },
  2: { trainingGround: 3, gym: 2, medical: 2, academy: 2, stadium: 2, recovery: 2 },
  3: { trainingGround: 1, gym: 1, medical: 1, academy: 1, stadium: 1, recovery: 1 },
};

export function startLevelsForTier(tier) {
  return TIER_START_LEVELS[tier] ?? TIER_START_LEVELS[3];
}
