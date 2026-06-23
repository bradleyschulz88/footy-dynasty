// Home venue metadata (Tier-1 AFL from spec; Tier 2/3 synthesised).
// Pyramid club entries stay minimal — this map keys off `club.id`.

/** @typedef {{
 *   name: string,
 *   shortName: string,
 *   suburb: string,
 *   city: string,
 *   state: string,
 *   capacity: number,
 *   surfaceType: 'grass'|'synthetic',
 *   roofed: boolean,
 *   atmosphere: number,
 *   homeAdvantageBase: number,
 *   description: string,
 * }} GroundDef */

const g = (
  name,
  shortName,
  suburb,
  city,
  state,
  capacity,
  roofed,
  atmosphere,
  homeAdvantageBase,
  description,
  surfaceType = "grass",
) => ({
  name,
  shortName,
  suburb,
  city,
  state,
  capacity,
  surfaceType,
  roofed,
  tierHint: 1,
  atmosphere,
  homeAdvantageBase,
  description,
});

/** Tier-1 AFL venues (club id → ground). Shared venues repeated per club. */
export const GROUND_BY_CLUB_ID = {
  mel: g(
    "Melbourne Cricket Ground",
    "MCG",
    "Yarra Park",
    "Melbourne",
    "VIC",
    100_024,
    false,
    95,
    10,
    "The spiritual home of the game — 100,024 on the biggest days.",
  ),
  col: g(
    "Melbourne Cricket Ground",
    "MCG",
    "Yarra Park",
    "Melbourne",
    "VIC",
    100_024,
    false,
    95,
  10,
    "Collingwood share the MCG with Melbourne — massive crowds, big noise.",
  ),
  ric: g(
    "Melbourne Cricket Ground",
    "MCG",
    "Yarra Park",
    "Melbourne",
    "VIC",
    100_024,
    false,
    95,
    10,
    "Punt Road ends at the 'G — Tigerland when the stands fill.",
  ),
  ess: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 8, "Indoor Docklands deck — fast, modern, great for night footy."),
  car: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 8, "Blues home at Marvel — roof on, crowd roaring."),
  stk: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 8, "Saints pack Marvel on their home dates."),
  nor: g("Marvel Stadium", "Marvel", "Docklands", "Melbourne", "VIC", 56_347, true, 82, 7, "Kangaroos' Melbourne home — Marvel's closed roof."),
  wbd: g("Mars Stadium", "Mars", "Ballarat", "Ballarat", "VIC", 13_500, false, 80, 7, "Regional Ballarat venue — cold winds, honest footy.", "grass"),
  gee: g("GMHBA Stadium", "GMHBA", "South Geelong", "Geelong", "VIC", 36_000, false, 88, 9, "The Cattery — intimate, loud, can feel like ten goals."),
  haw: g("University of Tasmania Stadium", "UTAS", "Invermay", "Launceston", "TAS", 22_000, false, 85, 8, "Hawks' Tasmanian fortress — travel hits visitors."),
  bri: g("The Gabba", "Gabba", "Woolloongabba", "Brisbane", "QLD", 42_000, false, 87, 9, "Queensland sun sets on the Gabba — bouncing deck."),
  gcs: g("People First Stadium", "PFS", "Carrara", "Gold Coast", "QLD", 25_000, false, 72, 7, "Carrara oval — holiday strip footy."),
  gws: g("ENGIE Stadium", "ENGIE", "Homebush", "Sydney", "NSW", 24_000, false, 70, 7, "Western Sydney showground — still building tradition."),
  syd: g("Sydney Cricket Ground", "SCG", "Moore Park", "Sydney", "NSW", 48_000, false, 88, 9, "The SCG — short boundaries, long memories."),
  ade: g("Adelaide Oval", "AO", "North Adelaide", "Adelaide", "SA", 53_583, false, 90, 9, "The cathedral of sport — Crows' Adelaide home."),
  pad: g("Adelaide Oval", "AO", "North Adelaide", "Adelaide", "SA", 53_583, false, 90, 9, "Port's same deck — fierce Showdown crowds."),
  wce: g("Optus Stadium", "Optus", "Burswood", "Perth", "WA", 65_000, false, 91, 10, "The Palace — noisy, steep, West Coast stronghold."),
  fre: g("Optus Stadium", "Optus", "Burswood", "Perth", "WA", 65_000, false, 91, 9, "Dockers share Optus — Derby days are electric."),
  tas: g("Blundstone Arena", "Blundstone", "Bellerive", "Hobart", "TAS", 23_000, false, 83, 8, "Bellerive — Tassie devils hunting under the hill."),
};

// ─── NFNL (Northern Football Netball League, tier 3) ──────────────────────────
// Real community home grounds in Melbourne's north-east. Open suburban reserves:
// small/no seating, grass, modest home advantage. Entries marked "approx" use a
// plausible local venue where the exact senior ground couldn't be firmly verified.
GROUND_BY_CLUB_ID.nfnl_banyule = g("Yallambie Park", "Yallambie", "Yallambie", "Melbourne", "VIC", 3_000, false, 38, 3, "Quiet riverside reserve below the Plenty — locals ring the fence on a Saturday."); // approx (exact senior ground unconfirmed)
GROUND_BY_CLUB_ID.nfnl_bundoora = g("La Trobe Sports Park", "La Trobe", "Bundoora", "Melbourne", "VIC", 4_000, false, 42, 3, "Open university-precinct oval — wide wings and a cold northerly off the parkland.");
GROUND_BY_CLUB_ID.nfnl_diamond_creek = g("Coventry Oval", "Coventry", "Diamond Creek", "Melbourne", "VIC", 4_000, false, 46, 4, "Tidy creekside ground hemmed by gums — vocal Creekers crowd right on the boundary.");
GROUND_BY_CLUB_ID.nfnl_eltham = g("Eltham Central Park", "Central Park", "Eltham", "Melbourne", "VIC", 5_000, false, 48, 4, "Leafy Panther home by the trestle bridge — big banks, big noise on finals day.");
GROUND_BY_CLUB_ID.nfnl_epping = g("Epping Recreation Reserve", "Epping Rec", "Epping", "Melbourne", "VIC", 3_500, false, 40, 3, "Flat northern-suburbs reserve — exposed and windy, honest contested footy.");
GROUND_BY_CLUB_ID.nfnl_fitzroy_stars = g("Sir Doug Nicholls Oval", "Nicholls Oval", "Thornbury", "Melbourne", "VIC", 3_000, false, 50, 4, "Proud Indigenous club's home beside the Advancement League — tight, passionate crowd.");
GROUND_BY_CLUB_ID.nfnl_greensborough = g("War Memorial Park", "War Memorial", "Greensborough", "Melbourne", "VIC", 5_000, false, 48, 4, "The Boro's hilly home off Henry Street — steep grass banks pen the visitors in.");
GROUND_BY_CLUB_ID.nfnl_heidelberg = g("Warringal Park", "Warringal", "Heidelberg", "Melbourne", "VIC", 5_000, false, 48, 4, "Tigers' deck by the Yarra flats — long history, loud terrace under the gums.");
GROUND_BY_CLUB_ID.nfnl_heidelberg_west = g("Heidelberg Park", "Heidelberg Pk", "Heidelberg West", "Melbourne", "VIC", 2_500, false, 36, 3, "Modest flat reserve — tin-roof clubrooms and a hand-turned scoreboard.");
GROUND_BY_CLUB_ID.nfnl_hurstbridge = g("Ben Frilay Oval", "Ben Frilay", "Hurstbridge", "Melbourne", "VIC", 3_000, false, 42, 4, "Outer-fringe bush ground — gum-lined wings and a one-eyed home pocket.");
GROUND_BY_CLUB_ID.nfnl_ivanhoe = g("Ivanhoe Park", "Ivanhoe Pk", "Ivanhoe", "Melbourne", "VIC", 3_500, false, 42, 3, "Genteel reserve off The Boulevard — close fences, polite-but-pointed home crowd.");
GROUND_BY_CLUB_ID.nfnl_kilmore = g("J.J. Clancy Reserve", "Clancy", "Kilmore", "Kilmore", "VIC", 4_000, false, 44, 4, "Country-town oval an hour north — wide open, cold, and a long trip for visitors.");
GROUND_BY_CLUB_ID.nfnl_kinglake = g("Kinglake Memorial Oval", "Kinglake", "Kinglake", "Kinglake", "VIC", 2_500, false, 40, 4, "Ranges ground up in the cool air — misty, tight, the Lakers know every divot.");
GROUND_BY_CLUB_ID.nfnl_lalor = g("Lalor Recreation Reserve", "Lalor Rec", "Lalor", "Melbourne", "VIC", 3_500, false, 40, 3, "Honest suburban reserve — flat turf, canteen chips, fence-side regulars.");
GROUND_BY_CLUB_ID.nfnl_laurimar = g("Laurimar Reserve", "Laurimar", "Doreen", "Melbourne", "VIC", 3_500, false, 42, 3, "Newer estate ground on the growth fringe — open, breezy, a young Power crowd.");
GROUND_BY_CLUB_ID.nfnl_lower_plenty = g("Montmorency Park (upper oval)", "Para Road", "Montmorency", "Melbourne", "VIC", 3_000, false, 40, 3, "Bears share the Para Road green belt — Plenty River on one wing, gums on the other.");
GROUND_BY_CLUB_ID.nfnl_macleod = g("De Winton Park", "De Winton", "Rosanna", "Melbourne", "VIC", 4_000, false, 44, 4, "Long-standing Rosanna home — tight boundary and a fiercely local terrace.");
GROUND_BY_CLUB_ID.nfnl_mernda = g("Waterview Recreation Reserve", "Waterview", "Mernda", "Melbourne", "VIC", 3_500, false, 42, 3, "Growth-corridor reserve — open lakeside ground, fast-rising Demons support.");
GROUND_BY_CLUB_ID.nfnl_montmorency = g("Montmorency Park", "Monty Park", "Montmorency", "Melbourne", "VIC", 4_000, false, 46, 4, "Monty's green-belt home between Para Road and the river — gum trees right on the fence.");
GROUND_BY_CLUB_ID.nfnl_north_heidelberg = g("Shelley Reserve", "Shelley", "Heidelberg Heights", "Melbourne", "VIC", 3_500, false, 44, 4, "Bulldogs' tight Shelley Street deck — narrow ground, vocal crowd on top of you.");
GROUND_BY_CLUB_ID.nfnl_northcote_park = g("Bill Lawry Oval", "Bill Lawry", "Northcote", "Melbourne", "VIC", 4_000, false, 46, 4, "Cougars' home by Merri Creek off Westgarth Street — inner-north terrace noise.");
GROUND_BY_CLUB_ID.nfnl_old_eltham_collegian = g("Eltham College", "Eltham College", "Research", "Melbourne", "VIC", 2_500, false, 34, 3, "School-grounds home of the Turtles — modest fences, tight-knit old-collegian crowd."); // approx (school venue, exact senior oval unconfirmed)
GROUND_BY_CLUB_ID.nfnl_old_paradians = g("Garvey Oval", "Garvey", "Bundoora", "Melbourne", "VIC", 3_000, false, 36, 3, "Parade College oval — old-boys' home, manicured turf and a partisan pocket.");
GROUND_BY_CLUB_ID.nfnl_panton_hill = g("Panton Hill Recreation Reserve", "Panton Hill", "Panton Hill", "Melbourne", "VIC", 2_500, false, 40, 4, "Rural bush ground in the hills — gum-lined, remote, the Redbacks love the trek.");
GROUND_BY_CLUB_ID.nfnl_reservoir = g("Crispe Park", "Crispe", "Reservoir", "Melbourne", "VIC", 3_500, false, 42, 4, "Mustangs' long-time home off Gloucester Street — flat, fast, fence-side faithful.");
GROUND_BY_CLUB_ID.nfnl_south_morang = g("Mill Park Lakes Recreation Reserve", "Mill Park Lakes", "South Morang", "Melbourne", "VIC", 3_500, false, 42, 3, "Lakeside estate reserve — twin ovals, lights, an up-and-coming Lions crowd.");
GROUND_BY_CLUB_ID.nfnl_st_mary_s = g("Whatmough Park", "Whatmough", "Greensborough", "Melbourne", "VIC", 3_000, false, 38, 3, "Family club's hillside reserve off Kalparrin Avenue — small, friendly, loud."); // approx (exact senior ground unconfirmed)
GROUND_BY_CLUB_ID.nfnl_thomastown = g("Main Street Reserve", "Main Street", "Thomastown", "Melbourne", "VIC", 3_000, false, 40, 3, "Classic flat northern reserve on Main Street — chips, kelpies and a one-eyed pocket.");
GROUND_BY_CLUB_ID.nfnl_wallan = g("Greenhill Reserve", "Greenhill", "Wallan", "Wallan", "VIC", 3_500, false, 42, 4, "Country home off the Northern Highway — open, cold, a long haul for city sides.");
GROUND_BY_CLUB_ID.nfnl_watsonia = g("Binnak Park", "Binnak", "Watsonia", "Melbourne", "VIC", 3_500, false, 42, 4, "Saints' revamped reserve — new pavilion, electronic board, tight home terrace.");
GROUND_BY_CLUB_ID.nfnl_west_preston_lakesid = g("J.E. Moore Park", "J.E. Moore", "Reservoir", "Melbourne", "VIC", 3_500, false, 42, 4, "Roosters' home off Tyler Street — flat northern deck, raucous fence-side support.");
GROUND_BY_CLUB_ID.nfnl_whittlesea = g("Whittlesea Showgrounds", "Showgrounds", "Whittlesea", "Whittlesea", "VIC", 4_000, false, 44, 4, "Town showgrounds oval at the ranges' foot — Eagles fly on a long away trip.");

// ─── VFL (Victorian Football League, tier 2) ──────────────────────────────────
// Real home grounds for independent VFL clubs and AFL affiliate bases.
GROUND_BY_CLUB_ID.vfl_port_melbourne = g("North Port Oval", "N.Port Oval", "Port Melbourne", "Melbourne", "VIC", 17_000, false, 72, 7, "The spiritual home of VFL footy — old white fence, timber grandstand, packed bank on finals day.");
GROUND_BY_CLUB_ID.vfl_williamstown = g("Williamstown Football Ground", "Willy Ground", "Williamstown", "Melbourne", "VIC", 10_000, false, 68, 6, "Seagulls' bay-side home — sea breeze off Port Phillip, traditional timber stands, old-school atmosphere.");
GROUND_BY_CLUB_ID.vfl_werribee = g("Avalon Airport Oval", "Avalon Oval", "Hoppers Crossing", "Melbourne", "VIC", 8_500, false, 60, 5, "Wind-swept outer-west deck — the Hoppers Crossing heat builds late in the season, long trip for inner-city sides.");
GROUND_BY_CLUB_ID.vfl_frankston = g("Frankston Park", "Frk Park", "Frankston", "Melbourne", "VIC", 10_000, false, 64, 6, "Dolphins' bayside fortress — Nepean Hwy traffic stops on match day, vocal southern-suburban faithful.");
GROUND_BY_CLUB_ID.vfl_northern_bullants = g("Preston City Oval", "Preston CO", "Preston", "Melbourne", "VIC", 5_000, false, 60, 5, "Bullants' compact inner-north deck — old community feel inside a state-league competition.");
GROUND_BY_CLUB_ID.vfl_coburg_lions = g("Piranha Park", "Piranha Pk", "Coburg", "Melbourne", "VIC", 5_000, false, 58, 5, "Lions' inner-north home — tight boundary, fervent locals, small ground amplifies every roar.");
GROUND_BY_CLUB_ID.vfl_sandringham = g("Trevor Barker Beach Oval", "Beach Oval", "Black Rock", "Melbourne", "VIC", 8_000, false, 65, 6, "Zebras' bayside ground at Black Rock — sea views behind the goals, cool southerly off the bay.");
GROUND_BY_CLUB_ID.vfl_box_hill_hawks = g("Box Hill City Oval", "BH City Oval", "Box Hill", "Melbourne", "VIC", 16_000, false, 70, 7, "Hawks' eastern-suburbs base — two grandstands, quality turf, proper state-league standard.");
GROUND_BY_CLUB_ID.vfl_casey_demons = g("Casey Fields", "Casey Fields", "Cranbourne East", "Melbourne", "VIC", 12_000, false, 66, 6, "Demons' modern outer-east hub — two quality ovals, lights, growing Casey community crowd.");
GROUND_BY_CLUB_ID.vfl_carlton = g("Ikon Park", "Ikon Park", "Carlton", "Melbourne", "VIC", 14_000, false, 72, 7, "Princes Park rebuilt — one of the best suburban grounds in the country after its transformation.");
GROUND_BY_CLUB_ID.vfl_collingwood = g("AIA Centre Oval", "AIA Oval", "Port Melbourne", "Melbourne", "VIC", 8_000, false, 65, 6, "Pies' VFL base at the Port Melbourne precinct — slick surface, corporate hub on the bay.");
GROUND_BY_CLUB_ID.vfl_essendon = g("Windy Hill", "Windy Hill", "Essendon", "Melbourne", "VIC", 12_000, false, 68, 7, "The historic Essendon home — inner-north heartland, two grandstands, enormous club history.");
GROUND_BY_CLUB_ID.vfl_footscray_western_bu = g("Whitten Oval", "Whitten Oval", "Footscray", "Melbourne", "VIC", 18_000, false, 72, 7, "Footscray's legendary home — big old-fashioned grandstand, loud working-class terrace on three sides.");
GROUND_BY_CLUB_ID.vfl_richmond = g("Punt Road Oval", "Punt Rd", "Richmond", "Melbourne", "VIC", 10_000, false, 68, 6, "Richmond's original home reserve — tight, fast surface, sits in the MCG's shadow.");
GROUND_BY_CLUB_ID.vfl_st_kilda = g("RSEA Park", "RSEA Park", "Moorabbin", "Melbourne", "VIC", 10_000, false, 68, 6, "Saints' Moorabbin heartland — the club's spiritual home oval, passionate southern-suburbs faithful.");
GROUND_BY_CLUB_ID.vfl_north_melbourne = g("Ikon Park", "Ikon Park", "Carlton", "Melbourne", "VIC", 14_000, false, 70, 7, "Shared Princes Park venue — Kangaroos supporters pack the Carlton terrace on home nights.");
GROUND_BY_CLUB_ID.vfl_geelong = g("GMHBA Stadium", "GMHBA", "South Geelong", "Geelong", "VIC", 36_000, false, 80, 8, "Kardinia Park — one of the finest oval-football atmospheres in the country, near impossible to win here.");
GROUND_BY_CLUB_ID.vfl_gold_coast_suns = g("Fankhauser Reserve", "Fankhauser", "Southport", "Gold Coast", "QLD", 7_000, false, 60, 5, "Sharks' Southport base — Gold Coast heat, long flight north, small but noisy Queensland crowd.");
GROUND_BY_CLUB_ID.vfl_southport_sharks = g("Fankhauser Reserve", "Fankhauser", "Southport", "Gold Coast", "QLD", 7_000, false, 62, 6, "Sharks HQ — local QAFL/VFL crossover crowd knows every player, humidity adds to the toll.");
GROUND_BY_CLUB_ID.vfl_gws_giants = g("Blacktown International Sportspark", "BI Sportspark", "Blacktown", "Sydney", "NSW", 8_500, false, 58, 5, "Giants' western Sydney base — modern facilities, loyal football community in rugby league heartland.");
GROUND_BY_CLUB_ID.vfl_brisbane_lions = g("Morningside Park", "Morningside", "Morningside", "Brisbane", "QLD", 7_500, false, 60, 5, "Lions affiliate base — Brisbane footy devotees fill this charming community ground.");
GROUND_BY_CLUB_ID.vfl_sydney_swans = g("Henson Park", "Henson Pk", "Marrickville", "Sydney", "NSW", 7_000, false, 60, 5, "Swans' inner-west Sydney VFL home — steep banks at Marrickville, a loyal crowd defying the odds.");
GROUND_BY_CLUB_ID.vfl_tasmania_devils = g("UTAS Stadium", "UTAS", "Launceston", "Launceston", "TAS", 19_500, false, 74, 7, "Tassie footy heartland — Northern crowd packs UTAS, Devils are a genuine state-league force.");

// ─── WAFL (West Australian Football League, tier 2) ───────────────────────────
GROUND_BY_CLUB_ID.wafl_claremont = g("Claremont Oval", "Claremont Oval", "Claremont", "Perth", "WA", 15_000, false, 70, 7, "Tigers' grand old oval — blue-chip suburb, loyal crowd, heritage grandstand in the western suburbs.");
GROUND_BY_CLUB_ID.wafl_east_fremantle = g("East Fremantle Oval", "EF Oval", "East Fremantle", "Perth", "WA", 12_000, false, 68, 7, "Sharks' proud southern oval — heritage ground, passionate red-and-black faithful, strong community roots.");
GROUND_BY_CLUB_ID.wafl_east_perth = g("Leederville Oval", "Leederville", "Leederville", "Perth", "WA", 10_000, false, 65, 6, "Royals' inner-north venue — tight oval, noisy terrace, big derby feel when Subiaco visit.");
GROUND_BY_CLUB_ID.wafl_peel_thunder = g("Bendigo Bank Stadium", "Bendigo Bank", "Mandurah", "Mandurah", "WA", 12_000, false, 65, 6, "Thunder's Mandurah base — fast Peel turf, 90 minutes south of Perth, passionate local following.");
GROUND_BY_CLUB_ID.wafl_perth = g("Lathlain Park", "Lathlain Pk", "Lathlain", "Perth", "WA", 10_000, false, 63, 6, "Demons' inner-east oval — compact and loud, red-and-blue faithful turn out in force at Lathlain.");
GROUND_BY_CLUB_ID.wafl_south_fremantle = g("Fremantle Oval", "Freo Oval", "Fremantle", "Perth", "WA", 10_000, false, 67, 6, "Bulldogs' heritage port-city home — Fremantle's gritty vibe makes for a rough-and-ready contest.");
GROUND_BY_CLUB_ID.wafl_subiaco = g("Mineral Resources Park", "MRP Oval", "Lathlain", "Perth", "WA", 12_000, false, 65, 6, "Lions at the Eagles' state-of-the-art precinct — modern oval, strong WAFL standard in leafy Lathlain.");
GROUND_BY_CLUB_ID.wafl_swan_districts = g("Steel Blue Oval", "Steel Blue", "Bassendean", "Perth", "WA", 10_000, false, 65, 6, "Swans' Bassendean fortress — Swan River suburb, the duck army fills this tight little ground on match day.");
GROUND_BY_CLUB_ID.wafl_west_coast_eagles = g("Mineral Resources Park", "MRP Oval", "Lathlain", "Perth", "WA", 12_000, false, 65, 6, "Eagles' VFL/WAFL oval within their training precinct — quality surface, modern facilities.");
GROUND_BY_CLUB_ID.wafl_west_perth = g("Percy Doyle Reserve", "Percy Doyle", "Duncraig", "Perth", "WA", 8_000, false, 62, 6, "Falcons' northern heartland — compact oval in Duncraig, the loyal northern-suburbs faithful.");

// ─── SANFL (South Australian National Football League, tier 2) ────────────────
GROUND_BY_CLUB_ID.sanfl_adelaide = g("Thebarton Oval", "Thebarton", "Thebarton", "Adelaide", "SA", 8_500, false, 62, 5, "Inner-west oval steeped in SANFL history — tight, quick turf, tough to come here and win.");
GROUND_BY_CLUB_ID.sanfl_central_district = g("Elizabeth Oval", "Elizabeth", "Elizabeth", "Adelaide", "SA", 12_000, false, 67, 6, "Bulldogs' northern fortress — working-class pride in Elizabeth, big occasions pull the biggest local crowd.");
GROUND_BY_CLUB_ID.sanfl_glenelg = g("Glenelg Oval", "Glenelg Oval", "Glenelg", "Adelaide", "SA", 12_000, false, 70, 6, "Tigers' bayside home — orange-and-black faithful by the beach, one of SANFL's best atmospheres.");
GROUND_BY_CLUB_ID.sanfl_north_adelaide = g("Prospect Oval", "Prospect", "Prospect", "Adelaide", "SA", 10_000, false, 66, 6, "Roosters' inner-north home — proud SANFL heritage off Prospect Road, tight oval, vocal crowd.");
GROUND_BY_CLUB_ID.sanfl_norwood = g("Norwood Oval", "Norwood Oval", "Norwood", "Adelaide", "SA", 15_000, false, 72, 7, "Redlegs' fortress — one of SANFL's grandest grounds, east-side crowd roars, big-game oval.");
GROUND_BY_CLUB_ID.sanfl_port_adelaide = g("Alberton Oval", "Alberton", "Alberton", "Adelaide", "SA", 15_000, false, 74, 7, "Power's historic home — enormous tribal following, heritage grandstand, Port's true spiritual HQ.");
GROUND_BY_CLUB_ID.sanfl_south_adelaide = g("Hickinbotham Oval", "Hickinbotham", "Noarlunga Centre", "Adelaide", "SA", 14_000, false, 70, 7, "Panthers' southern fortress — big Noarlunga crowd on finals day, consistently one of SANFL's powers.");
GROUND_BY_CLUB_ID.sanfl_sturt = g("Unley Oval", "Unley Oval", "Unley", "Adelaide", "SA", 12_000, false, 68, 6, "Double Blues' leafy inner-south home — one of SANFL's oldest clubs, a fine suburban oval.");
GROUND_BY_CLUB_ID.sanfl_west_adelaide = g("Richmond Oval", "Richmond Oval", "Richmond", "Adelaide", "SA", 12_000, false, 67, 6, "Bloods' inner-west home — tight Richmond oval, generations of SANFL history from these stands.");
GROUND_BY_CLUB_ID.sanfl_woodville_west_torre = g("WWT Football Park", "WWT Park", "Woodville", "Adelaide", "SA", 10_000, false, 64, 6, "Eagles' north-west metropolitan base — Elizabeth/Woodville rivalry, committed yellow-and-red faithful.");

// ─── TSL (Tasmanian State League, tier 2) ─────────────────────────────────────
GROUND_BY_CLUB_ID.tsl_clarence = g("KGV Oval", "KGV", "Bellerive", "Hobart", "TAS", 10_000, false, 66, 6, "Roos' eastern shore ground — Derwent estuary behind the goals, vocal Clarence crowd on the hill.");
GROUND_BY_CLUB_ID.tsl_glenorchy = g("KGV Oval", "KGV", "Bellerive", "Hobart", "TAS", 10_000, false, 66, 6, "Magpies share the Bellerive precinct — fierce cross-river derby fuel, big TSL occasions.");
GROUND_BY_CLUB_ID.tsl_kingborough_tigers = g("Kingborough Sports Centre", "Kingborough SC", "Kingston", "Hobart", "TAS", 6_500, false, 60, 5, "Tigers' southern base — modern dual-oval facility, growing Kingston crowd backs the stripes.");
GROUND_BY_CLUB_ID.tsl_lauderdale = g("Lauderdale Oval", "Lauderdale", "Lauderdale", "Hobart", "TAS", 7_500, false, 62, 6, "Bombers' bayside ground — Seven Mile Beach sea breezes, devoted blue-and-gold faithful.");
GROUND_BY_CLUB_ID.tsl_launceston = g("Windsor Park", "Windsor Pk", "Launceston", "Launceston", "TAS", 15_000, false, 70, 7, "Blues' city home — Launceston's football heartland, packed northern crowd, heated TSL rivalry.");
GROUND_BY_CLUB_ID.tsl_north_hobart = g("North Hobart Oval", "NH Oval", "North Hobart", "Hobart", "TAS", 12_000, false, 68, 7, "Shinboners' inner-city home — North Hobart's heritage oval, devoted maroon-and-gold crowd.");
GROUND_BY_CLUB_ID.tsl_north_launceston = g("UTAS Stadium", "UTAS", "Launceston", "Launceston", "TAS", 19_500, false, 70, 7, "Robins share UTAS — big-capacity Launceston venue lights up on big TSL nights in the north.");

// ─── NTFL (Northern Territory Football League, tier 2) ────────────────────────
GROUND_BY_CLUB_ID.ntfl_darwin_buffaloes = g("Gardens Oval", "Gardens Oval", "Marrara", "Darwin", "NT", 8_000, false, 62, 6, "Buffaloes' Marrara home — compact dry-season crowd, humidity bites hard in the wet.");
GROUND_BY_CLUB_ID.ntfl_nightcliff = g("Nightcliff Oval", "Nightcliff", "Nightcliff", "Darwin", "NT", 6_000, false, 60, 5, "Dragons' beachside suburb oval — sea breeze and partisan red-and-black locals.");
GROUND_BY_CLUB_ID.ntfl_pint = g("PINT Oval", "PINT Oval", "Freds Pass", "Palmerston", "NT", 5_500, false, 58, 5, "Magpies' satellite suburb ground — Freds Pass dust and red soil, local devotion, tough track.");
GROUND_BY_CLUB_ID.ntfl_palmerston_magpies = g("Fong Lim Oval", "Fong Lim", "Palmerston", "Palmerston", "NT", 6_000, false, 58, 5, "Magpies' Palmerston home — fast open ground on the city fringe, humid home advantage.");
GROUND_BY_CLUB_ID.ntfl_southern_districts = g("Fox Oval", "Fox Oval", "Marrara", "Darwin", "NT", 5_500, false, 58, 5, "Districts' Marrara oval — multi-ground precinct, contested footy in the build-up season heat.");
GROUND_BY_CLUB_ID.ntfl_st_mary_s = g("St Mary's Oval", "St Mary's", "Tiwi", "Darwin", "NT", 5_500, false, 60, 5, "Saints' Tiwi suburb home — northern Darwin community, fierce NTFL rivalry with the Buffaloes.");
GROUND_BY_CLUB_ID.ntfl_tiwi_bombers = g("Nguiu Oval", "Nguiu", "Wurrumiyanga", "Bathurst Island", "NT", 4_000, false, 62, 6, "Bombers' island home — remote Tiwi Islands oval, electric atmosphere, a flying visit for opponents.");
GROUND_BY_CLUB_ID.ntfl_wanderers = g("Vince Fayad Oval", "Fayad Oval", "Palmerston", "Palmerston", "NT", 5_500, false, 58, 5, "Wanderers' Palmerston ground — flat open oval, small but fiercely partisan home crowd.");
GROUND_BY_CLUB_ID.ntfl_waratah = g("Waratah Oval", "Waratah Oval", "Coconut Grove", "Darwin", "NT", 6_000, false, 60, 5, "Eagles' northern Darwin home — coastal grove suburb, tight oval, vocal Waratah faithful.");

// ─── QAFL (Queensland Australian Football League, tier 2) ─────────────────────
GROUND_BY_CLUB_ID.qafl_aspley = g("Graham Road Oval", "Graham Rd", "Aspley", "Brisbane", "QLD", 8_000, false, 64, 6, "Hornets' northside stronghold — suburban grass oval, dedicated blue-and-gold community.");
GROUND_BY_CLUB_ID.qafl_broadbeach = g("Broadbeach Oval", "Broadbeach", "Broadbeach", "Gold Coast", "QLD", 7_000, false, 62, 6, "Cats' Gold Coast home — open sea-wind oval, tight loyal crowd, beach suburb atmosphere.");
GROUND_BY_CLUB_ID.qafl_coorparoo = g("Jack Speare Park", "Speare Pk", "Coorparoo", "Brisbane", "QLD", 7_500, false, 63, 6, "Kings' inner-south Brisbane home — Cavendish Road ground, old-school QAFL feel.");
GROUND_BY_CLUB_ID.qafl_labrador = g("Frank Clarke Oval", "Clarke Oval", "Labrador", "Gold Coast", "QLD", 6_500, false, 60, 5, "Tigers' northern Gold Coast oval — flat, open, river suburb, loyal blue-and-gold fans.");
GROUND_BY_CLUB_ID.qafl_maroochydore = g("Fishermans Road Oval", "Fishermans Rd", "Maroochydore", "Sunshine Coast", "QLD", 7_000, false, 62, 6, "Roos' Sunshine Coast home — holiday-town oval, big coastal crowd on finals weekend.");
GROUND_BY_CLUB_ID.qafl_morningside = g("Morningside Oval", "Morningside", "Morningside", "Brisbane", "QLD", 8_000, false, 64, 6, "Panthers' inner-east Brisbane home — tight terraces, famous red-and-white fight song.");
GROUND_BY_CLUB_ID.qafl_mt_gravatt = g("Dittmer Park", "Dittmer Pk", "Eight Mile Plains", "Brisbane", "QLD", 7_000, false, 60, 5, "Hawks' southside Brisbane base — pleasant Eight Mile Plains ground, loyal old-club support.");
GROUND_BY_CLUB_ID.qafl_noosa_tigers = g("Noosa Oval", "Noosa Oval", "Tewantin", "Noosa", "QLD", 5_500, false, 58, 5, "Tigers' tourist-town home — passionate local faithful defy the coastal visitors.");
GROUND_BY_CLUB_ID.qafl_palm_beach_currumbin = g("Keith Hunt Park", "Keith Hunt", "Palm Beach", "Gold Coast", "QLD", 6_500, false, 61, 5, "Lightning's southern Gold Coast fortress — palm-lined oval, committed blue-and-gold crowd.");
GROUND_BY_CLUB_ID.qafl_redland_victoria_point = g("Dalpura Oval", "Dalpura", "Victoria Point", "Brisbane", "QLD", 6_000, false, 60, 5, "Sharks' bayside home — Redland Bay sea breeze oval, passionate blue-and-red locals.");
GROUND_BY_CLUB_ID.qafl_sherwood_magpies = g("Latrobe Terrace", "Latrobe Tc", "Paddington", "Brisbane", "QLD", 6_500, false, 60, 5, "Magpies' inner-west Brisbane home — Latrobe Terrace ground, black-and-white inner-city faithful.");
GROUND_BY_CLUB_ID.qafl_surfers_paradise = g("Surfers Paradise Oval", "SP Oval", "Surfers Paradise", "Gold Coast", "QLD", 7_000, false, 61, 5, "Demons' iconic Gold Coast location — tourist strip backdrop, red-and-blue locals pack it out.");
GROUND_BY_CLUB_ID.qafl_wilston_grange = g("Grimwade Street Ground", "Grimwade St", "Newmarket", "Brisbane", "QLD", 7_000, false, 63, 6, "Gorillas' northside Brisbane home — Grange precinct, compact terrace, classic QAFL Saturday.");

// ─── Perth Football League (tier 3, WA) ───────────────────────────────────────
// Real Perth metro community grounds — grass reserves, small stands, fierce local pride.
GROUND_BY_CLUB_ID.perthfootballleague_mount_lawley = g("McGillivray Oval", "McGillivray", "Mount Lawley", "Perth", "WA", 6_000, false, 60, 5, "Hawks' inner-north oval — one of Perth FL's best suburban grounds, McGillivray Street faithful.");
GROUND_BY_CLUB_ID.perthfootballleague_north_beach = g("North Beach Reserve", "N.Beach Res", "North Beach", "Perth", "WA", 4_000, false, 52, 4, "Roosters' coastal reserve — sea breeze off the Indian Ocean, intimate ocean-suburb crowd.");
GROUND_BY_CLUB_ID.perthfootballleague_kingsway = g("Kingsway Reserve", "Kingsway", "Madeley", "Perth", "WA", 5_000, false, 56, 5, "Roos' northern suburban ground in Madeley — open grassy reserve, growing northern-corridor crowd.");
GROUND_BY_CLUB_ID.perthfootballleague_trinity_aquinas = g("Aquinas College Oval", "Aquinas Oval", "Salter Point", "Perth", "WA", 4_500, false, 54, 5, "Trinity Aquinas' riverside college ground on the Canning — old-boys atmosphere, tight community oval.");
GROUND_BY_CLUB_ID.perthfootballleague_fremantle_cb = g("Fremantle CBC Oval", "CBC Oval", "Fremantle", "Perth", "WA", 4_500, false, 55, 5, "CBC's south-of-the-river home — CBC old-boys faithful, tidy compact oval in the port city.");
GROUND_BY_CLUB_ID.perthfootballleague_curtin_unive = g("Curtin Stadium", "Curtin Stad", "Bentley", "Perth", "WA", 5_000, false, 56, 5, "Demons' Bentley university campus ground — student crowd adds energy, broad turf, coastal wind.");
GROUND_BY_CLUB_ID.perthfootballleague_university = g("UWA Oval", "UWA Oval", "Crawley", "Perth", "WA", 5_500, false, 58, 5, "Blues' campus oval on the Swan River — towpath beside the ground, academic crowd, fine Perth turf.");
GROUND_BY_CLUB_ID.perthfootballleague_collegians = g("Collegians Reserve", "Collegians", "South Perth", "Perth", "WA", 4_000, false, 52, 4, "South of the river reserve — old-school Collegians faithful, Swan River suburb, flat fast ground.");
GROUND_BY_CLUB_ID.perthfootballleague_kalamunda = g("Jorgensen Park", "Jorgensen Pk", "Kalamunda", "Perth", "WA", 4_500, false, 54, 5, "Roos' hills ground at Jorgensen Park — Darling Range backdrop, tight terrace, passionate hill crowd.");
GROUND_BY_CLUB_ID.perthfootballleague_kingsley = g("Kingsley Reserve", "Kingsley Res", "Kingsley", "Perth", "WA", 4_000, false, 52, 4, "Eagles' northern suburbs reserve — flat open oval, loyal Kingsley community faithful.");
GROUND_BY_CLUB_ID.perthfootballleague_whitford = g("Whitford Reserve", "Whitford Res", "Whitford", "Perth", "WA", 4_000, false, 52, 4, "Eagles' northern coastal reserve — Whitford suburb close to the ocean, family-club atmosphere.");
GROUND_BY_CLUB_ID.perthfootballleague_warnbro_swans = g("Warnbro Community Reserve", "Warnbro Res", "Port Kennedy", "Perth", "WA", 3_500, false, 48, 4, "Swans' southern corridor home — Port Kennedy growth area, passionate red-and-white community faithful.");
GROUND_BY_CLUB_ID.perthfootballleague_applecross = g("Applecross Reserve", "Applecross", "Ardross", "Perth", "WA", 4_000, false, 52, 4, "South of the river reserve — riverside suburb, tight ground, loyal Applecross community.");
GROUND_BY_CLUB_ID.perthfootballleague_scarborough = g("Abbett Park", "Abbett Park", "Scarborough", "Perth", "WA", 5_500, false, 58, 5, "Jets' beachside oval at Abbett Park — Scarborough strip backdrop, enthusiastic coastal crowd.");
GROUND_BY_CLUB_ID.perthfootballleague_wanneroo = g("Wanneroo Showgrounds", "Wann Showgrd", "Wanneroo", "Perth", "WA", 4_500, false, 53, 4, "Roos' northern outskirts home — open showgrounds oval, long trip from the city, passionate locals.");
GROUND_BY_CLUB_ID.perthfootballleague_melville = g("Melville Oval", "Melville Oval", "Melville", "Perth", "WA", 4_500, false, 54, 4, "Eagles' south-of-river home — Melville suburb oval, growing Cockburn corridor crowd.");
GROUND_BY_CLUB_ID.perthfootballleague_gosnells = g("Gosnells City Oval", "Gosnells CO", "Gosnells", "Perth", "WA", 4_000, false, 50, 4, "Hawks' south-east suburban oval — Gosnells community reserve, flat fast surface in the outer burbs.");
GROUND_BY_CLUB_ID.perthfootballleague_hamersley_ca = g("Hamersley Reserve", "Hamersley", "Hamersley", "Perth", "WA", 4_000, false, 50, 4, "Cougars' northern suburbs reserve — flat Hamersley oval, blue-and-gold community pride.");
GROUND_BY_CLUB_ID.perthfootballleague_baldivis = g("Settlers Hills Reserve", "Settlers Hills", "Baldivis", "Perth", "WA", 4_000, false, 50, 4, "Bombers' southern growth corridor ground — new estate suburb oval, young Baldivis community.");
GROUND_BY_CLUB_ID.perthfootballleague_cockburn_lak = g("Cockburn ARC Oval", "Cockburn ARC", "Success", "Perth", "WA", 5_000, false, 56, 5, "Bombers' modern Success suburb oval near the ARC — well-resourced facility, southern Perth crowd.");
GROUND_BY_CLUB_ID.perthfootballleague_brentwood_bo = g("Brentwood Reserve", "Brentwood", "Booragoon", "Perth", "WA", 4_000, false, 52, 4, "Bulls' south-of-river home — Garden City precinct, compact oval, local Booragoon faithful.");
GROUND_BY_CLUB_ID.perthfootballleague_bullcreek_le = g("Bullcreek Reserve", "Bullcreek", "Bull Creek", "Perth", "WA", 4_000, false, 50, 4, "Lions' southern suburbs reserve — Bull Creek quiet oval, dedicated green-and-gold crowd.");

// ─── Peel Football League (tier 3, WA) ────────────────────────────────────────
GROUND_BY_CLUB_ID.peelfootballleague_mandurah = g("Chris Doust Oval", "Chris Doust", "Mandurah", "Mandurah", "WA", 4_000, false, 52, 5, "Mandurah's Peel League home — canal-city oval, lively waterside-suburb community crowd.");
GROUND_BY_CLUB_ID.peelfootballleague_halls_head = g("Halls Head Reserve", "Halls Head", "Halls Head", "Mandurah", "WA", 3_500, false, 48, 4, "Falcons' coastal Peel home — Halls Head beach suburb, passionate community oval.");
GROUND_BY_CLUB_ID.peelfootballleague_baldivis = g("Baldivis Reserve", "Baldivis Res", "Baldivis", "Mandurah", "WA", 3_500, false, 46, 4, "Growth-area oval in Baldivis — newer Peel suburb reserve, family-club atmosphere.");

// ─── EDFL — Essendon District Football League (tier 3, VIC) ───────────────────
GROUND_BY_CLUB_ID.edfl_aberfeldie          = g("Aberfeldie Park", "Aberfeldie Pk", "Essendon North", "Melbourne", "VIC", 3_500, false, 58, 5, "Falcons' inner-north oval — tight Essendon North ground, vocal Aberfeldie faithful backing every goal.");
GROUND_BY_CLUB_ID.edfl_airport_west        = g("Dick Bryant Reserve", "Dick Bryant", "Airport West", "Melbourne", "VIC", 3_000, false, 54, 5, "Eagles' northwestern reserve — aircraft roar overhead as the crowd roars below at Dick Bryant.");
GROUND_BY_CLUB_ID.edfl_avondale_heights    = g("Asquith Reserve", "Asquith Res", "Avondale Heights", "Melbourne", "VIC", 3_000, false, 52, 4, "Dragons' hilltop home — Avondale Heights reserve with Maribyrnong River valley views.");
GROUND_BY_CLUB_ID.edfl_burnside_heights    = g("Burnside Heights Recreation Reserve", "Burnside Hts", "Burnside Heights", "Melbourne", "VIC", 2_500, false, 50, 4, "Panthers' outer-west home in the growth corridor — tight community oval, new suburb pride.");
GROUND_BY_CLUB_ID.edfl_coburg_districts    = g("Jack Stevens Oval", "Jack Stevens", "Coburg", "Melbourne", "VIC", 3_500, false, 56, 5, "Rebels' Coburg home — compact north-Melbourne oval, fierce inner-suburb local derbies.");
GROUND_BY_CLUB_ID.edfl_craigieburn         = g("Highgate Recreation Reserve", "Highgate Res", "Craigieburn", "Melbourne", "VIC", 3_000, false, 52, 4, "Saints' growth-corridor home — Craigieburn's broad reserve, passionate outer-north community.");
GROUND_BY_CLUB_ID.edfl_deer_park           = g("Conifer Reserve", "Conifer Res", "Deer Park", "Melbourne", "VIC", 3_000, false, 54, 5, "Stags' western home — Conifer Reserve in Deer Park, tight and passionate working-class oval.");
GROUND_BY_CLUB_ID.edfl_east_keilor         = g("Jack Roper Reserve", "Jack Roper", "East Keilor", "Melbourne", "VIC", 3_500, false, 56, 5, "Lions' classic western reserve — Jack Roper ground, hard turf and fierce East Keilor support.");
GROUND_BY_CLUB_ID.edfl_east_sunbury        = g("East Sunbury Recreation Reserve", "E Sunbury Res", "Sunbury", "Melbourne", "VIC", 2_500, false, 50, 4, "Sharks' rural-edge home — wind-swept Sunbury reserve, long trip from the city rewarded.");
GROUND_BY_CLUB_ID.edfl_essendon_doutta_star= g("Doutta Galla Reserve", "Doutta Galla", "Essendon", "Melbourne", "VIC", 4_500, false, 64, 6, "Stars' flagship EDFL ground — storied Doutta Galla reserve in Essendon, gallery crowd and history.");
GROUND_BY_CLUB_ID.edfl_glenroy             = g("Glenroy Recreation Reserve", "Glenroy Res", "Glenroy", "Melbourne", "VIC", 3_000, false, 54, 5, "Raiders' northern home — Glenroy oval, enthusiastic multicultural suburb crowd behind the goals.");
GROUND_BY_CLUB_ID.edfl_greenvale           = g("Greenvale Reserve", "Greenvale Res", "Greenvale", "Melbourne", "VIC", 2_500, false, 50, 4, "Raiders' far-north home — Greenvale's rolling reserve, cold winds and tight local derby feeling.");
GROUND_BY_CLUB_ID.edfl_hadfield            = g("Hadfield Reserve", "Hadfield Res", "Hadfield", "Melbourne", "VIC", 2_500, false, 50, 4, "Saints' pocket ground in Coburg North — Hadfield Reserve, passionate inner-north faithful.");
GROUND_BY_CLUB_ID.edfl_hillside            = g("Hillside Recreation Reserve", "Hillside Res", "Hillside", "Melbourne", "VIC", 2_500, false, 50, 4, "Falcons' outer-north oval — Hillside reserve in the growth corridor, community-focused crowd.");
GROUND_BY_CLUB_ID.edfl_jacana              = g("Jacana Oval", "Jacana Oval", "Jacana", "Melbourne", "VIC", 2_500, false, 50, 4, "Bears' compact industrial-suburb ground — Jacana Oval, tight crowd behind the fence.");
GROUND_BY_CLUB_ID.edfl_keilor              = g("George Andrews Reserve", "George Andrews", "Keilor", "Melbourne", "VIC", 4_500, false, 62, 6, "Falcons' classic western ground — George Andrews Reserve, one of the EDFL's proudest oval traditions.");
GROUND_BY_CLUB_ID.edfl_keilor_park         = g("Keilor Park Reserve", "Keilor Pk Res", "Keilor Park", "Melbourne", "VIC", 3_000, false, 54, 5, "Swans' western reserve — Keilor Park community oval, loyal north-western suburb faithful.");
GROUND_BY_CLUB_ID.edfl_maribyrnong_park    = g("Highpoint Reserve", "Highpoint Res", "Maribyrnong", "Melbourne", "VIC", 3_000, false, 52, 4, "Lions' river-precinct home — Maribyrnong oval, Highpoint precinct backdrop, family community.");
GROUND_BY_CLUB_ID.edfl_moonee_valley       = g("JA Doyle Reserve", "JA Doyle Res", "Moonee Ponds", "Melbourne", "VIC", 3_500, false, 56, 5, "Kings' inner-north reserve — Moonee Ponds/Ascot Vale ground, racetrack suburb atmosphere.");
GROUND_BY_CLUB_ID.edfl_northern_saints     = g("Westmeadows Reserve", "Westmeadows", "Westmeadows", "Melbourne", "VIC", 3_000, false, 52, 4, "Northern Saints' far-north suburban reserve — community oval, dedicated outer-north crowd.");
GROUND_BY_CLUB_ID.edfl_oak_park            = g("Oak Park Recreation Reserve", "Oak Park Res", "Oak Park", "Melbourne", "VIC", 3_000, false, 54, 5, "Cobras' compact reserve — Oak Park oval between Pascoe Vale Rd, lively northern suburb crowd.");
GROUND_BY_CLUB_ID.edfl_pascoe_vale         = g("Ben Kavanagh Reserve", "Ben Kavanagh", "Pascoe Vale", "Melbourne", "VIC", 3_500, false, 58, 5, "Cobras' established northern ground — Ben Kavanagh Reserve, vocal Pascoe Vale home support.");
GROUND_BY_CLUB_ID.edfl_roxburgh_park       = g("Roxburgh Park Recreation Reserve", "Roxburgh Pk", "Roxburgh Park", "Melbourne", "VIC", 2_500, false, 50, 4, "Eagles' growth-corridor reserve — Roxburgh Park community oval, young outer-north suburb crowd.");
GROUND_BY_CLUB_ID.edfl_rupertswood         = g("Rupertswood Oval", "Rupertswood", "Sunbury", "Melbourne", "VIC", 3_500, false, 56, 5, "Rupertswood's heritage Sunbury oval — historic ground at the old station estate grounds.");
GROUND_BY_CLUB_ID.edfl_st_albans          = g("St Albans Recreation Reserve", "St Albans Res", "St Albans", "Melbourne", "VIC", 3_000, false, 54, 5, "Cobras' western reserve — St Albans oval, multicultural western suburb crowd, strong home support.");
GROUND_BY_CLUB_ID.edfl_strathmore          = g("Eric Tweedale Reserve", "Eric Tweedale", "Strathmore", "Melbourne", "VIC", 3_500, false, 58, 5, "Strathmore's proud Moonee Valley reserve — Eric Tweedale Reserve, tight and vocal support.");
GROUND_BY_CLUB_ID.edfl_sunbury_kangaroos   = g("Jack Hawkins Reserve", "Jack Hawkins", "Sunbury", "Melbourne", "VIC", 4_000, false, 60, 5, "Kangaroos' Sunbury home — Jack Hawkins Reserve, largest outer-north oval, strong Kangaroos tradition.");
GROUND_BY_CLUB_ID.edfl_taylors_lakes       = g("Taylors Lakes Recreation Reserve", "Taylors Lakes", "Taylors Lakes", "Melbourne", "VIC", 2_500, false, 50, 4, "Roosters' outer-west reserve — Taylors Lakes community oval, newer suburb family crowd.");
GROUND_BY_CLUB_ID.edfl_tullamarine         = g("Tullamarine Recreation Reserve", "Tullamarine Res", "Tullamarine", "Melbourne", "VIC", 3_000, false, 52, 4, "Eagles' airport-suburb home — Tullamarine Reserve, planes on approach, loyal local faithful.");
GROUND_BY_CLUB_ID.edfl_west_coburg         = g("Coburg City Oval", "Coburg City", "Coburg", "Melbourne", "VIC", 4_000, false, 60, 5, "Magpies' inner-north home — Coburg City Oval, tight inner-suburb atmosphere, committed local crowd.");
GROUND_BY_CLUB_ID.edfl_westmeadows         = g("Westmeadows Recreation Reserve", "Westmeadows Rec", "Westmeadows", "Melbourne", "VIC", 2_500, false, 50, 4, "Jets' northern pocket ground — Westmeadows reserve, tight community oval between Tullamarine Fwy.");

// ─── EFNL — Eastern Football Netball League (tier 3, VIC) ─────────────────────
GROUND_BY_CLUB_ID.efnl_balwyn              = g("Koonung Reserve", "Koonung Res", "Balwyn North", "Melbourne", "VIC", 3_500, false, 56, 5, "Tigers' leafy-inner-east home — Koonung Reserve, Balwyn tree-lined suburb, dedicated amber-and-blue crowd.");
GROUND_BY_CLUB_ID.efnl_bayswater           = g("Sheffield Park", "Sheffield Pk", "Bayswater", "Melbourne", "VIC", 3_000, false, 54, 5, "Bayswater's home ground — Sheffield Park, compact eastern oval with tight family community.");
GROUND_BY_CLUB_ID.efnl_beaconsfield        = g("Beaconsfield Reserve", "Beaconsfield", "Beaconsfield", "Melbourne", "VIC", 3_000, false, 52, 4, "Beaconsfield's semi-rural oval — broad turf in the SE growth corridor, passionate local crowd.");
GROUND_BY_CLUB_ID.efnl_belgrave            = g("Belgrave Reserve", "Belgrave Res", "Belgrave", "Melbourne", "VIC", 3_000, false, 52, 4, "Lions' Dandenong Ranges oval — Belgrave Reserve nestled in the hills, tight community feel.");
GROUND_BY_CLUB_ID.efnl_berwick             = g("Arch Brown Reserve", "Arch Brown", "Berwick", "Melbourne", "VIC", 4_000, false, 60, 5, "Berwick's premier eastern oval — Arch Brown Reserve, major EFNL club with strong history.");
GROUND_BY_CLUB_ID.efnl_blackburn           = g("Kevin Shepherd Reserve", "Kevin Shepherd", "Blackburn", "Melbourne", "VIC", 3_500, false, 58, 5, "Hawks' leafy mid-east reserve — Kevin Shepherd Reserve, Blackburn suburb, proud club tradition.");
GROUND_BY_CLUB_ID.efnl_boronia             = g("Tormore Reserve", "Tormore Res", "Boronia", "Melbourne", "VIC", 3_000, false, 52, 4, "Lions' eastern reserve — Tormore Reserve, Boronia suburb, blue-and-gold community faithful.");
GROUND_BY_CLUB_ID.efnl_bulleen_templestowe = g("Bulleen Reserve", "Bulleen Res", "Bulleen", "Melbourne", "VIC", 3_000, false, 52, 4, "Bulleen Templestowe's Yarra valley-fringe oval — shaded reserve, growing eastern community.");
GROUND_BY_CLUB_ID.efnl_chirnside_park      = g("Chirnside Park Reserve", "Chirnside Pk", "Chirnside Park", "Melbourne", "VIC", 3_000, false, 52, 4, "Chirnside Park's broad Yarra Valley oval — open reserve, regional outer-east crowd.");
GROUND_BY_CLUB_ID.efnl_coldstream          = g("Coldstream Reserve", "Coldstream Res", "Coldstream", "Melbourne", "VIC", 2_500, false, 48, 4, "Coldstream's valley-floor oval — wine country fringe, tight community spirit.");
GROUND_BY_CLUB_ID.efnl_croydon             = g("Croydon Recreation Reserve", "Croydon Rec", "Croydon", "Melbourne", "VIC", 4_000, false, 60, 5, "Croydon's eastern hub oval — one of the EFNL's biggest clubs, loud home faithful at the Recreation Reserve.");
GROUND_BY_CLUB_ID.efnl_croydon_north_mloc  = g("Croydon North Reserve", "Croydon North", "Croydon North", "Melbourne", "VIC", 2_500, false, 48, 4, "MLOC's small Croydon North ground — compact community reserve, loyal junior feeder crowd.");
GROUND_BY_CLUB_ID.efnl_doncaster           = g("Zerbes Reserve", "Zerbes Res", "Doncaster", "Melbourne", "VIC", 3_500, false, 56, 5, "Hawks' leafy-east home — Zerbes Reserve in Doncaster, one of the EFNL's landmark grounds.");
GROUND_BY_CLUB_ID.efnl_doncaster_east      = g("Schramms Reserve", "Schramms Res", "Doncaster East", "Melbourne", "VIC", 3_000, false, 54, 5, "Doncaster East's tree-lined reserve — Schramms Reserve, Manningham suburb, tight local derbies.");
GROUND_BY_CLUB_ID.efnl_donvale             = g("Donvale Reserve", "Donvale Res", "Donvale", "Melbourne", "VIC", 3_000, false, 52, 4, "Tigers' Manningham oval — Donvale Reserve, quiet eastern suburb, passionate yellow-and-black faithful.");
GROUND_BY_CLUB_ID.efnl_east_burwood        = g("East Burwood Reserve", "E Burwood Res", "Burwood East", "Melbourne", "VIC", 3_000, false, 52, 4, "Burwood East's mid-eastern oval — compact reserve, blue-collar eastern suburb crowd.");
GROUND_BY_CLUB_ID.efnl_east_ringwood       = g("Jubilee Park", "Jubilee Pk", "Ringwood East", "Melbourne", "VIC", 3_500, false, 56, 5, "East Ringwood's heritage oval — Jubilee Park, classic Ringwood-area ground, vocal community.");
GROUND_BY_CLUB_ID.efnl_fairpark            = g("Fairpark Reserve", "Fairpark Res", "Mitcham", "Melbourne", "VIC", 3_000, false, 52, 4, "Fairpark's mid-eastern reserve — Whitehorse area oval, family-club atmosphere.");
GROUND_BY_CLUB_ID.efnl_ferntree_gully      = g("McCulloch Reserve", "McCulloch Res", "Ferntree Gully", "Melbourne", "VIC", 3_000, false, 54, 5, "Gully's ranges-foothills oval — McCulloch Reserve, Knox's proudest community ground.");
GROUND_BY_CLUB_ID.efnl_forest_hill         = g("Brandon Reserve", "Brandon Res", "Forest Hill", "Melbourne", "VIC", 3_000, false, 52, 4, "Sharks' mid-east home — Brandon Reserve in Forest Hill, Whitehorse's compact suburban oval.");
GROUND_BY_CLUB_ID.efnl_heathmont           = g("Heathmont Reserve", "Heathmont Res", "Heathmont", "Melbourne", "VIC", 3_000, false, 54, 5, "Eagles' eastern reserve — Heathmont oval, tight local derby atmosphere, passionate crowd.");
GROUND_BY_CLUB_ID.efnl_kilsyth             = g("Kilsyth Oval", "Kilsyth Oval", "Kilsyth", "Melbourne", "VIC", 3_000, false, 52, 4, "Falcons' outer-east oval — Kilsyth community reserve, foothills setting, devoted local faithful.");
GROUND_BY_CLUB_ID.efnl_knox                = g("Wantirna Reserve", "Wantirna Res", "Wantirna South", "Melbourne", "VIC", 3_000, false, 52, 4, "Knox's southeastern community reserve — broad Wantirna oval, family club atmosphere.");
GROUND_BY_CLUB_ID.efnl_lilydale            = g("Lilydale Reserve", "Lilydale Res", "Lilydale", "Melbourne", "VIC", 3_500, false, 56, 5, "Lilydale's Yarra Valley gateway oval — proud outer-east community club with loyal following.");
GROUND_BY_CLUB_ID.efnl_mitcham             = g("Whites Road Reserve", "Whites Road", "Mitcham", "Melbourne", "VIC", 3_000, false, 52, 4, "Sharks' Whitehorse ground — Whites Road Reserve, Mitcham suburb, tight eastern oval.");
GROUND_BY_CLUB_ID.efnl_montrose            = g("Montrose Recreation Reserve", "Montrose Res", "Montrose", "Melbourne", "VIC", 2_500, false, 50, 4, "Montrose's hilltop reserve — elevated Dandenong Ranges ground, tight community loyalty.");
GROUND_BY_CLUB_ID.efnl_mooroolbark         = g("Mooroolbark Reserve", "Mooroolbark Res", "Mooroolbark", "Melbourne", "VIC", 3_000, false, 54, 5, "Rovers' outer-east home — Mooroolbark oval, passionate foothills community crowd.");
GROUND_BY_CLUB_ID.efnl_mulgrave            = g("Wellington Road Reserve", "Wellington Rd", "Mulgrave", "Melbourne", "VIC", 3_000, false, 52, 4, "Lions' southeastern reserve — Wellington Road Mulgrave, growing outer-east community oval.");
GROUND_BY_CLUB_ID.efnl_noble_park          = g("Noble Park Recreation Reserve", "Noble Pk Res", "Noble Park", "Melbourne", "VIC", 3_000, false, 54, 5, "Eagles' southeastern oval — Noble Park reserve, diverse community suburb, loyal crowd.");
GROUND_BY_CLUB_ID.efnl_north_ringwood      = g("North Ringwood Reserve", "N Ringwood Res", "Ringwood North", "Melbourne", "VIC", 3_000, false, 52, 4, "Magpies' Ringwood North reserve — compact north-of-township oval, passionate local derbies.");
GROUND_BY_CLUB_ID.efnl_norwood             = g("Norwood Reserve", "Norwood Res", "Ringwood East", "Melbourne", "VIC", 2_500, false, 48, 4, "Norwood's quiet eastern reserve — compact Ringwood fringe oval, loyal black-and-gold crowd.");
GROUND_BY_CLUB_ID.efnl_nunawading          = g("Nunawading Reserve", "Nunawading Res", "Nunawading", "Melbourne", "VIC", 3_000, false, 52, 4, "Kangaroos' Whitehorse oval — Nunawading community ground, tight mid-eastern suburb derbies.");
GROUND_BY_CLUB_ID.efnl_oakleigh_district   = g("EE Gunn Reserve", "EE Gunn Res", "Oakleigh", "Melbourne", "VIC", 4_000, false, 60, 5, "Oaks' landmark eastern reserve — EE Gunn Reserve, Oakleigh, one of EFNL's grandest grounds.");
GROUND_BY_CLUB_ID.efnl_park_orchards       = g("Park Orchards Reserve", "Park Orchards", "Park Orchards", "Melbourne", "VIC", 2_000, false, 46, 4, "Park Orchards' leafy rural-edge ground — quiet Donvale/Ringwood fringe, small passionate crowd.");
GROUND_BY_CLUB_ID.efnl_ringwood            = g("Jubilee Park", "Jubilee Pk", "Ringwood", "Melbourne", "VIC", 4_500, false, 62, 5, "Magpies' flagship Ringwood oval — Jubilee Park, one of the EFNL's biggest and loudest grounds.");
GROUND_BY_CLUB_ID.efnl_rowville            = g("Stud Road Reserve", "Stud Rd Res", "Rowville", "Melbourne", "VIC", 3_000, false, 52, 4, "Hawks' outer-east reserve — Stud Road Rowville, growing outer-Knox suburb, family oval.");
GROUND_BY_CLUB_ID.efnl_scoresby            = g("Scoresby Reserve", "Scoresby Res", "Scoresby", "Melbourne", "VIC", 3_000, false, 52, 4, "Eagles' Knox oval — Scoresby community reserve, loyal south-eastern suburb crowd.");
GROUND_BY_CLUB_ID.efnl_silvan              = g("Silvan Reserve", "Silvan Res", "Silvan", "Melbourne", "VIC", 2_000, false, 46, 4, "Silvan's deep-hills oval — Dandenong Ranges farming community, tight knit faithful.");
GROUND_BY_CLUB_ID.efnl_south_belgrave      = g("South Belgrave Reserve", "S Belgrave", "South Belgrave", "Melbourne", "VIC", 2_000, false, 46, 4, "South Belgrave's ranges-fringe ground — tiny community oval at the edge of the Dandenongs.");
GROUND_BY_CLUB_ID.efnl_south_croydon       = g("South Croydon Reserve", "S Croydon Res", "South Croydon", "Melbourne", "VIC", 2_500, false, 48, 4, "South Croydon's pocket oval — compact reserve below Croydon, tight local community crowd.");
GROUND_BY_CLUB_ID.efnl_surrey_park         = g("Surrey Park Oval", "Surrey Pk Oval", "Surrey Hills", "Melbourne", "VIC", 3_500, false, 58, 5, "Surrey Park's leafy BoxHill-adjacent oval — one of the eastern suburbs' most picturesque grounds.");
GROUND_BY_CLUB_ID.efnl_templestowe         = g("Templestowe Reserve", "Templestowe Res", "Templestowe", "Melbourne", "VIC", 3_000, false, 52, 4, "Rovers' leafy Manningham oval — Templestowe reserve, quiet leafy suburb, dedicated crowd.");
GROUND_BY_CLUB_ID.efnl_the_basin           = g("The Basin Reserve", "The Basin", "The Basin", "Melbourne", "VIC", 2_500, false, 50, 4, "The Basin's foothills oval — compact Knox fringe ground, tight community beside the ranges.");
GROUND_BY_CLUB_ID.efnl_upper_ferntree_gully= g("Upper Ferntree Gully Reserve", "UFG Reserve", "Upper Ferntree Gully", "Melbourne", "VIC", 2_000, false, 46, 4, "High-altitude Dandenong Ranges oval — thin crowd, cold winds, tough conditions for visitors.");
GROUND_BY_CLUB_ID.efnl_vermont             = g("Vermont Reserve", "Vermont Res", "Vermont", "Melbourne", "VIC", 3_000, false, 54, 5, "Falcons' mid-eastern reserve — Vermont oval, Whitehorse suburb, competitive eastern derby ground.");
GROUND_BY_CLUB_ID.efnl_wantirna_south      = g("Wantirna South Reserve", "Wantirna S", "Wantirna South", "Melbourne", "VIC", 3_000, false, 52, 4, "Wantirna South's Knox community reserve — outer-east oval, passionate local crowd.");
GROUND_BY_CLUB_ID.efnl_warrandyte          = g("Warrandyte Oval", "Warrandyte Oval", "Warrandyte", "Melbourne", "VIC", 3_000, false, 54, 5, "Bloods' Yarra River oval — Warrandyte's famous bushland-fringe ground, one of the state's most scenic.");
GROUND_BY_CLUB_ID.efnl_waverley_blues      = g("Waverley Oval", "Waverley Oval", "Mulgrave", "Melbourne", "VIC", 3_000, false, 52, 4, "Waverley Blues' southeastern oval — compact Mulgrave ground, loyal blue-and-white community.");
GROUND_BY_CLUB_ID.efnl_whitehorse_pioneers = g("Whitehorse Oval", "Whitehorse Oval", "Box Hill", "Melbourne", "VIC", 3_500, false, 56, 5, "Pioneers' Box Hill-fringe home — Whitehorse community oval, proud founding EFNL club tradition.");

// ─── SFNL — Southern Football Netball League (tier 3, VIC) ────────────────────
GROUND_BY_CLUB_ID.sfnl_ashwood             = g("Ashwood Reserve", "Ashwood Res", "Ashwood", "Melbourne", "VIC", 3_000, false, 52, 4, "Ashwood's Monash-fringe oval — compact southeastern reserve, family community atmosphere.");
GROUND_BY_CLUB_ID.sfnl_bentleigh           = g("Bentleigh Reserve", "Bentleigh Res", "Bentleigh", "Melbourne", "VIC", 3_500, false, 58, 5, "Falcons' south-eastern home — Bentleigh Reserve, leafy inner-south suburb, vocal community crowd.");
GROUND_BY_CLUB_ID.sfnl_berwick_springs     = g("Berwick Springs Reserve", "Berwick Spgs", "Berwick", "Melbourne", "VIC", 2_500, false, 50, 4, "Berwick Springs' growth-corridor oval — outer-SE community reserve, newer suburb family crowd.");
GROUND_BY_CLUB_ID.sfnl_black_rock          = g("EM Milne Reserve", "EM Milne Res", "Black Rock", "Melbourne", "VIC", 3_000, false, 54, 5, "Sharks' bayside home — EM Milne Reserve, Black Rock cliff-top suburb, passionate coastal crowd.");
GROUND_BY_CLUB_ID.sfnl_carrum_patterson_lak= g("Carrum Patterson Lakes Reserve", "Carrum PL Res", "Patterson Lakes", "Melbourne", "VIC", 3_000, false, 52, 4, "Carrum PL's waterside reserve — Patterson Lakes canal suburb, tight oval, community crowd.");
GROUND_BY_CLUB_ID.sfnl_caulfield_bears     = g("Caulfield Park Oval", "Caulfield Pk", "Caulfield", "Melbourne", "VIC", 4_000, false, 60, 5, "Bears' inner-south home — Caulfield Park oval, leafy suburb setting, strong bears faithful.");
GROUND_BY_CLUB_ID.sfnl_cerberus            = g("Cerberus Oval", "Cerberus Oval", "Somers", "Melbourne", "VIC", 3_000, false, 52, 4, "Cerberus' HMAS-adjacent oval on the peninsula — naval suburb atmosphere, coastal reserve.");
GROUND_BY_CLUB_ID.sfnl_chelsea_heights     = g("Chelsea Heights Reserve", "Chelsea Hts Res", "Chelsea Heights", "Melbourne", "VIC", 3_000, false, 52, 4, "Chelsea Heights' bayside fringe reserve — tight community oval, outer-south suburb loyal crowd.");
GROUND_BY_CLUB_ID.sfnl_cheltenham          = g("Jack Barker Oval", "Jack Barker", "Cheltenham", "Melbourne", "VIC", 4_000, false, 60, 5, "Rosellas' inner-south premier oval — Jack Barker, one of SFNL's most recognised grounds.");
GROUND_BY_CLUB_ID.sfnl_clayton             = g("Clayton Reserve", "Clayton Res", "Clayton", "Melbourne", "VIC", 3_000, false, 52, 4, "Clays' Monash-suburb oval — Clayton reserve beside the university precinct, dedicated community.");
GROUND_BY_CLUB_ID.sfnl_cranbourne          = g("Cranbourne Recreation Reserve", "Cranbourne Rec", "Cranbourne", "Melbourne", "VIC", 3_500, false, 56, 5, "Cranbourne's growth-corridor oval — broad reserve in outer-SE, passionate red-and-white crowd.");
GROUND_BY_CLUB_ID.sfnl_dandenong_west      = g("Dandenong West Reserve", "Dandenong W Res", "Dandenong West", "Melbourne", "VIC", 3_000, false, 52, 4, "Dandenong West's inner-SE oval — tight suburb ground, passionate multicultural community crowd.");
GROUND_BY_CLUB_ID.sfnl_dingley             = g("Dingley Reserve", "Dingley Res", "Dingley Village", "Melbourne", "VIC", 3_000, false, 54, 5, "Dingley's village-feel oval — compact Kingston suburb reserve, dedicated community crowd.");
GROUND_BY_CLUB_ID.sfnl_doveton             = g("Doveton Reserve", "Doveton Res", "Doveton", "Melbourne", "VIC", 3_000, false, 52, 4, "Doves' SE corner oval — passionate Doveton community, strong home advantage in tight reserve.");
GROUND_BY_CLUB_ID.sfnl_doveton_eagles      = g("Doveton Eagles Reserve", "Doveton Eag Res", "Doveton", "Melbourne", "VIC", 2_500, false, 50, 4, "Eagles' Doveton pocket oval — compact SE community ground, blue-and-white faithful.");
GROUND_BY_CLUB_ID.sfnl_east_brighton       = g("Dendy Park", "Dendy Park", "Brighton East", "Melbourne", "VIC", 4_000, false, 62, 5, "East Brighton's bayside oval — Dendy Park, prestige Brighton East ground, strong inner-south support.");
GROUND_BY_CLUB_ID.sfnl_east_malvern        = g("Gardiners Road Reserve", "Gardiners Rd", "Malvern East", "Melbourne", "VIC", 3_500, false, 58, 5, "East Malvern's prestigious inner-south reserve — leafy Malvern East, genteel but passionate crowd.");
GROUND_BY_CLUB_ID.sfnl_endeavour_hills     = g("Endeavour Hills Reserve", "Endeavour Hls", "Endeavour Hills", "Melbourne", "VIC", 3_000, false, 52, 4, "Eagles' hilltop SE oval — Endeavour Hills reserve, growing Dandenong corridor community crowd.");
GROUND_BY_CLUB_ID.sfnl_frankston_dolphins  = g("Frankston Reserve", "Frankston Res", "Frankston", "Melbourne", "VIC", 3_500, false, 56, 5, "Dolphins' Frankston bayside reserve — peninsula gateway oval, passionate coastal community.");
GROUND_BY_CLUB_ID.sfnl_hallam              = g("Hallam Recreation Reserve", "Hallam Rec", "Hallam", "Melbourne", "VIC", 3_000, false, 52, 4, "Hallam's outer-SE reserve — Hallam oval in the Casey corridor, loyal community crowd.");
GROUND_BY_CLUB_ID.sfnl_hampton             = g("Embling Park", "Embling Park", "Hampton", "Melbourne", "VIC", 4_000, false, 62, 5, "Rovers' bayside jewel — Embling Park in Hampton, one of SFNL's finest and most loved ovals.");
GROUND_BY_CLUB_ID.sfnl_hampton_park        = g("Hampton Park Reserve", "Hampton Pk Res", "Hampton Park", "Melbourne", "VIC", 3_000, false, 52, 4, "Hampton Park's growth-area oval — Casey corridor reserve, young suburb community atmosphere.");
GROUND_BY_CLUB_ID.sfnl_heatherton          = g("Heatherton Reserve", "Heatherton Res", "Heatherton", "Melbourne", "VIC", 3_000, false, 52, 4, "Heatherton's Kingston-fringe reserve — compact oval, loyal community crowd near the bay.");
GROUND_BY_CLUB_ID.sfnl_highett             = g("Highett Reserve", "Highett Res", "Highett", "Melbourne", "VIC", 3_000, false, 54, 5, "Hawks' bayside-fringe oval — Highett Reserve, compact inner-south community ground.");
GROUND_BY_CLUB_ID.sfnl_keysborough         = g("Keysborough Reserve", "Keysborough Res", "Keysborough", "Melbourne", "VIC", 3_000, false, 52, 4, "Burra's SE suburban reserve — Keysborough community oval, growing southeast corridor crowd.");
GROUND_BY_CLUB_ID.sfnl_lyndale             = g("Lyndale Reserve", "Lyndale Res", "Lyndale", "Melbourne", "VIC", 2_500, false, 50, 4, "Lyndale's compact SE oval — tight suburb ground between Monash and Dandenong, loyal crowd.");
GROUND_BY_CLUB_ID.sfnl_lyndhurst           = g("Lyndhurst Recreation Reserve", "Lyndhurst Res", "Lyndhurst", "Melbourne", "VIC", 2_500, false, 50, 4, "Lyndhurst's growth-corridor reserve — outer Casey ground, new suburb community enthusiasm.");
GROUND_BY_CLUB_ID.sfnl_moorabbin_kangaroos = g("Moorabbin Reserve", "Moorabbin Res", "Moorabbin", "Melbourne", "VIC", 3_500, false, 58, 5, "Kangaroos' historic Kingston ground — old St Kilda VFL precinct, strong inner-south heritage.");
GROUND_BY_CLUB_ID.sfnl_mordialloc          = g("Mordialloc Reserve", "Mordialloc Res", "Mordialloc", "Melbourne", "VIC", 3_500, false, 58, 5, "Dragons' bayside reserve — Mordialloc creek-fringe oval, passionate coastal community crowd.");
GROUND_BY_CLUB_ID.sfnl_mount_waverley      = g("JM Thomas Reserve", "JM Thomas Res", "Mount Waverley", "Melbourne", "VIC", 3_500, false, 56, 5, "Blue Devils' Monash suburb oval — JM Thomas Reserve, leafy Mount Waverley, proud SFNL tradition.");
GROUND_BY_CLUB_ID.sfnl_murrumbeena         = g("Murrumbeena Reserve", "Murrumbeena Res", "Murrumbeena", "Melbourne", "VIC", 3_500, false, 58, 5, "Cardinals' inner-south home — Murrumbeena Reserve, prestigious leafy suburb, vocal support.");
GROUND_BY_CLUB_ID.sfnl_narre_south_saints  = g("Narre South Reserve", "Narre South", "Narre Warren South", "Melbourne", "VIC", 2_500, false, 50, 4, "Saints' outer-SE reserve — growth corridor oval, passionate community in the Casey corridor.");
GROUND_BY_CLUB_ID.sfnl_narre_warren        = g("Narre Warren Recreation Reserve", "Narre Warren Rec", "Narre Warren", "Melbourne", "VIC", 3_000, false, 52, 4, "Narre Warren's Casey suburb reserve — broad outer-SE oval, loyal community crowd.");
GROUND_BY_CLUB_ID.sfnl_port_melbourne_colts= g("Sandridge Oval", "Sandridge Oval", "Port Melbourne", "Melbourne", "VIC", 3_500, false, 58, 5, "Colts' Port Melbourne ground — Sandridge Oval near the bay, old docklands suburb, loyal crowd.");
GROUND_BY_CLUB_ID.sfnl_sandown_cobras      = g("Sandown Reserve", "Sandown Res", "Springvale South", "Melbourne", "VIC", 3_000, false, 52, 4, "Cobras' Springvale-fringe oval — Sandown precinct reserve, passionate outer-SE community.");
GROUND_BY_CLUB_ID.sfnl_skye                = g("Skye Recreation Reserve", "Skye Res", "Skye", "Melbourne", "VIC", 2_500, false, 50, 4, "Skye's Frankston-fringe reserve — compact outer-south community oval, loyal local crowd.");
GROUND_BY_CLUB_ID.sfnl_south_mornington    = g("South Mornington Reserve", "S Mornington Res", "Mornington", "Melbourne", "VIC", 2_500, false, 50, 4, "South Mornington's peninsula reserve — coastal community oval, passionate peninsula crowd.");
GROUND_BY_CLUB_ID.sfnl_south_yarra         = g("Albert Park Reserve", "Albert Pk Res", "South Melbourne", "Melbourne", "VIC", 4_000, false, 60, 5, "South Yarra's iconic inner-south oval — Albert Park precinct, storied inner-suburb tradition.");
GROUND_BY_CLUB_ID.sfnl_springvale_districts= g("Springvale Districts Reserve", "Springvale Dst", "Springvale", "Melbourne", "VIC", 3_000, false, 52, 4, "Springvale Districts' SE multicultural oval — vibrant community ground, passionate supporter base.");
GROUND_BY_CLUB_ID.sfnl_st_john_s_old_colleg= g("Old Collegians Reserve", "Old Colleg Res", "Brighton", "Melbourne", "VIC", 3_000, false, 52, 4, "St John's Old Collegians' bayside ground — Brighton-area reserve, old-school suburban club.");
GROUND_BY_CLUB_ID.sfnl_st_kilda_city       = g("Junction Oval", "Junction Oval", "St Kilda", "Melbourne", "VIC", 5_000, false, 68, 6, "St Kilda City's iconic Junction Oval — historic inner-city ground, strong atmosphere for SFNL clashes.");
GROUND_BY_CLUB_ID.sfnl_st_paul_s_mckinnon  = g("McKinnon Reserve", "McKinnon Res", "McKinnon", "Melbourne", "VIC", 3_500, false, 58, 5, "St Paul's leafy inner-south home — McKinnon Reserve, prestigious Glen Eira suburb, strong tradition.");

// ─── VAFA — Victorian Amateur Football Association (tier 3, VIC) ───────────────
GROUND_BY_CLUB_ID.vafa_ajax                = g("Caulfield Park Oval", "Caulfield Pk", "Caulfield", "Melbourne", "VIC", 3_500, false, 56, 5, "AJAX FC's inner-south home — Caulfield Park oval, strong Jewish community tradition and heritage.");
GROUND_BY_CLUB_ID.vafa_albert_park         = g("Albert Park Lake Oval", "Albert Pk Oval", "Albert Park", "Melbourne", "VIC", 4_000, false, 62, 5, "Albert Park's iconic lakeside ground — grandstand views over the Formula One circuit precinct.");
GROUND_BY_CLUB_ID.vafa_aquinas             = g("Aquinas Reserve", "Aquinas Res", "Ringwood East", "Melbourne", "VIC", 2_500, false, 48, 4, "Aquinas College OB's eastern reserve — school alumni oval, passionate old-collegians crowd.");
GROUND_BY_CLUB_ID.vafa_beaumaris           = g("Banksia Reserve", "Banksia Res", "Beaumaris", "Melbourne", "VIC", 3_000, false, 54, 5, "Sharks' bayside home — Banksia Reserve, prestigious Beaumaris cliff-top suburb, scenic oval.");
GROUND_BY_CLUB_ID.vafa_brunswick           = g("Gillon Oval", "Gillon Oval", "Brunswick", "Melbourne", "VIC", 5_000, false, 68, 6, "Brunswick's famous inner-north oval — Gillon Oval, one of VAFA's most storied and celebrated grounds.");
GROUND_BY_CLUB_ID.vafa_canterbury          = g("Maling Road Oval", "Maling Rd Oval", "Canterbury", "Melbourne", "VIC", 3_500, false, 58, 5, "Canterbury's leafy village oval — Maling Road ground, one of Melbourne's most charming community ovals.");
GROUND_BY_CLUB_ID.vafa_collegians          = g("Rushall Oval", "Rushall Oval", "Northcote", "Melbourne", "VIC", 3_000, false, 54, 5, "Collegians' inner-north reserve — Rushall Park, Northcote, compact oval with old-school VAFA feel.");
GROUND_BY_CLUB_ID.vafa_de_la_salle         = g("De La Salle Reserve", "De La Salle Res", "Malvern", "Melbourne", "VIC", 3_000, false, 52, 4, "De La Salle OB's inner-south school ground — Malvern suburb, alumni faithful, leafy oval.");
GROUND_BY_CLUB_ID.vafa_elsternwick         = g("Elsternwick Park", "Elsternwick Pk", "Elsternwick", "Melbourne", "VIC", 4_500, false, 64, 6, "Stars' prestigious inner-south oval — Elsternwick Park, one of VAFA's landmark venues.");
GROUND_BY_CLUB_ID.vafa_fitzroy             = g("Edinburgh Gardens Oval", "Edinburgh Gdn", "Fitzroy North", "Melbourne", "VIC", 4_500, false, 64, 6, "Fitzroy's iconic inner-north ground — Edinburgh Gardens, storied amateur club at a heritage oval.");
GROUND_BY_CLUB_ID.vafa_glen_eira           = g("Glen Eira Reserve", "Glen Eira Res", "Caulfield South", "Melbourne", "VIC", 3_000, false, 52, 4, "Glen Eira's inner-south community oval — Caulfield South, loyal VAFA amateur tradition.");
GROUND_BY_CLUB_ID.vafa_glen_eira_2         = g("Harold Ambrose Reserve", "Harold Ambrose", "Carnegie", "Melbourne", "VIC", 2_500, false, 48, 4, "Glen Eira Division 2 ground — Carnegie suburb oval, smaller oval for the second team.");
GROUND_BY_CLUB_ID.vafa_hampton_rovers      = g("Bay Road Reserve", "Bay Rd Res", "Sandringham", "Melbourne", "VIC", 4_000, false, 62, 5, "Rovers' iconic bayside home — Bay Road, Sandringham, one of VAFA's most prestigious grounds.");
GROUND_BY_CLUB_ID.vafa_hawthorn            = g("Valhalla Oval", "Valhalla Oval", "Hawthorn", "Melbourne", "VIC", 3_500, false, 58, 5, "VAFA Hawthorn's inner-east home — Valhalla Oval, leafy Hawthorn suburb, strong amateur tradition.");
GROUND_BY_CLUB_ID.vafa_kew                 = g("Stradbroke Park", "Stradbroke Pk", "Kew", "Melbourne", "VIC", 3_500, false, 58, 5, "Kew's prestigious riverside oval — Stradbroke Park, leafy Kew suburb, dedicated amateur faithful.");
GROUND_BY_CLUB_ID.vafa_la_trobe_university = g("La Trobe University Oval", "LaTrobe Oval", "Bundoora", "Melbourne", "VIC", 3_000, false, 50, 4, "LaTrobe's campus oval in Bundoora — university crowd, academic atmosphere, rolling Bundoora grounds.");
GROUND_BY_CLUB_ID.vafa_marcellin           = g("Marcellin College Oval", "Marcellin Oval", "Bulleen", "Melbourne", "VIC", 3_000, false, 52, 4, "Marcellin OB's Bulleen school ground — Yarra-fringe suburb, strong old-collegians support.");
GROUND_BY_CLUB_ID.vafa_mazenod             = g("Mazenod College Oval", "Mazenod Oval", "Mulgrave", "Melbourne", "VIC", 2_500, false, 48, 4, "Mazenod OB's southeastern school ground — Mulgrave alumni oval, dedicated community faithful.");
GROUND_BY_CLUB_ID.vafa_monash_blues        = g("Monash University Oval", "Monash Uni Oval", "Clayton", "Melbourne", "VIC", 3_000, false, 50, 4, "Monash Blues' Clayton campus oval — university crowd, academic precinct, eastern suburban setting.");
GROUND_BY_CLUB_ID.vafa_north_brunswick     = g("Brunswick Oval", "Brunswick Oval", "Brunswick", "Melbourne", "VIC", 4_000, false, 60, 5, "North Brunswick's inner-north home — Brunswick Oval shared precinct, passionate northern suburb.");
GROUND_BY_CLUB_ID.vafa_oakleigh            = g("Warrawee Park", "Warrawee Pk", "Oakleigh", "Melbourne", "VIC", 4_000, false, 62, 5, "Oakleigh's southeast landmark — Warrawee Park, one of VAFA's finest historical grounds.");
GROUND_BY_CLUB_ID.vafa_old_brighton        = g("Brighton Sports Ground", "Brighton Sports", "Brighton", "Melbourne", "VIC", 4_500, false, 64, 6, "Old Brighton Grammarians' prestigious bay oval — Brighton Sports Ground, elite VAFA heritage club.");
GROUND_BY_CLUB_ID.vafa_old_camberwell      = g("Sackville Street Reserve", "Sackville St", "Camberwell", "Melbourne", "VIC", 3_500, false, 58, 5, "Old Camberwell's leafy inner-east home — Sackville Street reserve, prestigious suburb oval.");
GROUND_BY_CLUB_ID.vafa_old_carey           = g("Carey Sports Ground", "Carey Sports", "Kew", "Melbourne", "VIC", 3_000, false, 52, 4, "Old Carey's Kew school ground — Carey Grammar alumni oval, leafy riverside suburb setting.");
GROUND_BY_CLUB_ID.vafa_old_geelong         = g("Geelong Grammar Oval", "GGS Oval", "Toorak", "Melbourne", "VIC", 3_000, false, 52, 4, "Old Geelong's Toorak-area school oval — prestigious alumni club, one of Melbourne's storied VAFA sides.");
GROUND_BY_CLUB_ID.vafa_old_ivanhoe         = g("Willinda Park", "Willinda Pk", "Ivanhoe East", "Melbourne", "VIC", 4_500, false, 64, 6, "Old Ivanhoe's iconic northeastern oval — Willinda Park, one of VAFA's grandest and best-loved grounds.");
GROUND_BY_CLUB_ID.vafa_old_melburnians     = g("Melbourne Grammar Oval", "MG Oval", "South Yarra", "Melbourne", "VIC", 4_000, false, 62, 5, "Old Melburnians' prestigious inner-south ground — Melbourne Grammar oval, heritage VAFA heavyweight.");
GROUND_BY_CLUB_ID.vafa_old_peninsula       = g("Peninsula Grammar Oval", "Peninsula Oval", "Frankston", "Melbourne", "VIC", 3_000, false, 52, 4, "Old Peninsula school ground — Frankston area alumni oval, peninsula community crowd.");
GROUND_BY_CLUB_ID.vafa_old_scotch          = g("Morrison Reserve", "Morrison Res", "Hawthorn East", "Melbourne", "VIC", 4_500, false, 64, 6, "Old Scotch AFC's premier ground — Morrison Reserve, one of VAFA's most famous and fierce clubs.");
GROUND_BY_CLUB_ID.vafa_old_xaverians       = g("Xavier College Oval", "Xavier Oval", "Kew", "Melbourne", "VIC", 4_500, false, 64, 6, "Old Xaverians' Kew school ground — one of VAFA's powerhouses, deep heritage, passionate alumni crowd.");
GROUND_BY_CLUB_ID.vafa_old_yarra_cobras    = g("Warrandyte Reserve", "Warrandyte Res", "Warrandyte", "Melbourne", "VIC", 3_000, false, 54, 5, "Old Yarra Cobras' Yarra Valley ground — Warrandyte oval, bushland river setting, tight community feel.");
GROUND_BY_CLUB_ID.vafa_ormond              = g("Ormond Reserve", "Ormond Res", "Bentleigh", "Melbourne", "VIC", 3_500, false, 58, 5, "Ormond's inner-south oval — Bentleigh reserve, proud VAFA club with passionate local following.");
GROUND_BY_CLUB_ID.vafa_pegs                = g("PEGS Sports Ground", "PEGS Ground", "Keilor East", "Melbourne", "VIC", 3_000, false, 52, 4, "Penleigh Essendon Grammar OB ground — Keilor East school campus oval, passionate alumni crowd.");
GROUND_BY_CLUB_ID.vafa_parkdale_vultures   = g("Lloyd Park", "Lloyd Park", "Parkdale", "Melbourne", "VIC", 3_500, false, 58, 5, "Vultures' bayside home — Lloyd Park Parkdale, one of VAFA's most active and well-attended clubs.");
GROUND_BY_CLUB_ID.vafa_parkside            = g("Parkside Reserve", "Parkside Res", "Moorabbin", "Melbourne", "VIC", 3_000, false, 52, 4, "Parkside's Kingston oval — Moorabbin reserve, strong suburban community, tight oval conditions.");
GROUND_BY_CLUB_ID.vafa_power_house         = g("Power House Reserve", "Power House Res", "Hawthorn East", "Melbourne", "VIC", 3_500, false, 56, 5, "Power House's inner-east reserve — former power station workers' club, Hawthorn precinct heritage.");
GROUND_BY_CLUB_ID.vafa_prahran             = g("Toorak Park", "Toorak Park", "Prahran", "Melbourne", "VIC", 4_000, false, 60, 5, "Assumption's prestigious inner-south ground — Toorak Park oval, elite suburban VAFA heritage.");
GROUND_BY_CLUB_ID.vafa_preston_bullants    = g("Preston City Oval", "Preston City", "Preston", "Melbourne", "VIC", 5_000, false, 68, 6, "Bullants' iconic northern oval — Preston City Oval, one of VAFA's most famous clubs and largest grounds.");
GROUND_BY_CLUB_ID.vafa_richmond_central    = g("Central Reserve", "Central Res", "Richmond", "Melbourne", "VIC", 3_500, false, 56, 5, "Richmond Central's inner-city ground — compact Richmond oval, strong local heritage amid the high-rises.");
GROUND_BY_CLUB_ID.vafa_south_melbourne_dist= g("Albert Park Lake Oval", "Albert Pk Oval", "Albert Park", "Melbourne", "VIC", 4_000, false, 62, 5, "South Melbourne Districts' iconic lakeside ground — Albert Park precinct, storied VAFA inner-south club.");
GROUND_BY_CLUB_ID.vafa_st_bernard_s        = g("St Bernard's Reserve", "St Bernard Res", "Essendon", "Melbourne", "VIC", 3_000, false, 52, 4, "St Bernard's OB's Essendon school ground — inner-northwest oval, strong old-collegians tradition.");
GROUND_BY_CLUB_ID.vafa_st_kevin_s          = g("Old Oly Oval", "Old Oly Oval", "Toorak", "Melbourne", "VIC", 4_000, false, 62, 5, "St Kevin's OB's Toorak oval — Old Olympic ground, elite inner-east heritage, one of VAFA's finest.");
GROUND_BY_CLUB_ID.vafa_st_mary_s_salesian  = g("Salesian Reserve", "Salesian Res", "Sunbury", "Melbourne", "VIC", 2_500, false, 48, 4, "St Mary's Salesian OB's outer-northwest school ground — Sunbury area alumni oval, community faithful.");
GROUND_BY_CLUB_ID.vafa_therry_penola       = g("Therry Penola Reserve", "Therry Penola", "Coburg", "Melbourne", "VIC", 3_000, false, 52, 4, "Therry Penola's inner-north community oval — Coburg suburb, strong Catholic school alumni tradition.");
GROUND_BY_CLUB_ID.vafa_uhs_vu              = g("Victoria University Oval", "VU Oval", "Footscray", "Melbourne", "VIC", 3_000, false, 52, 4, "UHS-VU's western campus oval — Footscray university precinct, diverse western community crowd.");
GROUND_BY_CLUB_ID.vafa_university_blacks   = g("University of Melbourne Oval", "Uni Melb Oval", "Parkville", "Melbourne", "VIC", 4_500, false, 64, 6, "University Blacks' Parkville home — Melbourne Uni's Oval 5, prestigious VAFA stalwart, strong tradition.");
GROUND_BY_CLUB_ID.vafa_university_blues    = g("Royal Park Oval", "Royal Park Oval", "Parkville", "Melbourne", "VIC", 4_500, false, 64, 6, "University Blues' Royal Park ground — prestigious inner-north oval, one of VAFA's great clubs.");
GROUND_BY_CLUB_ID.vafa_wattle_park         = g("Wattle Park Oval", "Wattle Pk Oval", "Surrey Hills", "Melbourne", "VIC", 3_500, false, 56, 5, "Wattle Park's leafy Surrey Hills oval — tram reserve adjacent, one of Melbourne's scenic community grounds.");
GROUND_BY_CLUB_ID.vafa_williamstown_cyms   = g("Williamstown CYMS Oval", "CYMS Oval", "Williamstown", "Melbourne", "VIC", 4_500, false, 64, 6, "Williamstown CYMS' famous bay-side oval — one of VAFA's great clubs, bayside tradition and proud history.");

// ─── WFNL — Western Football Netball League (tier 3, VIC) ─────────────────────
GROUND_BY_CLUB_ID.wfnl_albanvale           = g("Albanvale Reserve", "Albanvale Res", "Albanvale", "Melbourne", "VIC", 3_000, false, 52, 4, "Albanvale's outer-west reserve — growth corridor suburb, passionate community crowd.");
GROUND_BY_CLUB_ID.wfnl_albion             = g("Harvester Reserve", "Harvester Res", "Albion", "Melbourne", "VIC", 3_000, false, 54, 5, "Falcons' Albion home — Harvester Reserve, working-class western suburb, passionate oval culture.");
GROUND_BY_CLUB_ID.wfnl_altona             = g("Altona Recreation Reserve", "Altona Rec", "Altona", "Melbourne", "VIC", 4_000, false, 60, 5, "Altona's bayside oval — Altona Recreation Reserve, one of WFNL's marquee grounds and clubs.");
GROUND_BY_CLUB_ID.wfnl_braybrook          = g("Braybrook Reserve", "Braybrook Res", "Braybrook", "Melbourne", "VIC", 3_000, false, 54, 5, "Braybrook's inner-west reserve — tight multicultural suburb oval, passionate community crowd.");
GROUND_BY_CLUB_ID.wfnl_caroline_springs   = g("Caroline Springs Oval", "Caroline Spgs", "Caroline Springs", "Melbourne", "VIC", 3_500, false, 56, 5, "Bulls' modern growth-corridor oval — Caroline Springs, well-resourced new suburb facility.");
GROUND_BY_CLUB_ID.wfnl_glen_orden         = g("Glen Orden Reserve", "Glen Orden", "Werribee", "Melbourne", "VIC", 2_500, false, 50, 4, "Glen Orden's Werribee-fringe reserve — outer-west community oval, loyal compact local crowd.");
GROUND_BY_CLUB_ID.wfnl_hoppers_crossing   = g("Hoppers Crossing Reserve", "Hoppers Xing Res", "Hoppers Crossing", "Melbourne", "VIC", 3_500, false, 56, 5, "Tigers' outer-west oval — Hoppers Crossing reserve, Wyndham growth corridor, passionate community.");
GROUND_BY_CLUB_ID.wfnl_laverton           = g("Laverton Recreation Reserve", "Laverton Rec", "Laverton", "Melbourne", "VIC", 3_000, false, 52, 4, "Laverton's industrial-west oval — former RAAF precinct suburb, tight community tradition.");
GROUND_BY_CLUB_ID.wfnl_manor_lakes        = g("Manor Lakes Reserve", "Manor Lakes", "Manor Lakes", "Melbourne", "VIC", 2_500, false, 50, 4, "Manor Lakes' brand new growth oval — Wyndham outer-west, newest community in the corridor.");
GROUND_BY_CLUB_ID.wfnl_newport            = g("Newport Reserve", "Newport Res", "Newport", "Melbourne", "VIC", 3_500, false, 58, 5, "Newport's inner-west oval — bayside reserve, working-class suburb with strong WFNL tradition.");
GROUND_BY_CLUB_ID.wfnl_north_footscray    = g("North Footscray Reserve", "N Footscray", "North Footscray", "Melbourne", "VIC", 3_000, false, 54, 5, "North Footscray's inner-west reserve — compact Maribyrnong suburb oval, fierce local derbies.");
GROUND_BY_CLUB_ID.wfnl_north_sunshine     = g("North Sunshine Reserve", "N Sunshine Res", "Sunshine North", "Melbourne", "VIC", 3_000, false, 52, 4, "North Sunshine's western reserve — Brimbank suburb, passionate multicultural community oval.");
GROUND_BY_CLUB_ID.wfnl_parkside           = g("Parkside Reserve", "Parkside Res", "Werribee", "Melbourne", "VIC", 3_000, false, 52, 4, "Parkside's Werribee oval — community reserve in the Wyndham corridor, loyal club tradition.");
GROUND_BY_CLUB_ID.wfnl_point_cook         = g("Point Cook Reserve", "Point Cook Res", "Point Cook", "Melbourne", "VIC", 3_000, false, 52, 4, "Point Cook's coastal growth oval — bayside Wyndham suburb, new community, growing supporter base.");
GROUND_BY_CLUB_ID.wfnl_point_cook_centrals= g("Point Cook Centrals Reserve", "PC Centrals", "Point Cook", "Melbourne", "VIC", 2_500, false, 50, 4, "Point Cook Centrals' growth-area reserve — newer suburb oval, passionate young community crowd.");
GROUND_BY_CLUB_ID.wfnl_spotswood          = g("Paisley Park", "Paisley Pk", "Spotswood", "Melbourne", "VIC", 4_000, false, 62, 5, "Spotswood's riverside oval — Paisley Park, Yarra-junction suburb, one of WFNL's best-supported clubs.");
GROUND_BY_CLUB_ID.wfnl_sunshine           = g("Middle Footscray Reserve", "Middle Footscray", "Sunshine", "Melbourne", "VIC", 3_500, false, 56, 5, "Sunshine's western hub oval — proud Brimbank suburb, fierce WFNL local derbies, vocal crowd.");
GROUND_BY_CLUB_ID.wfnl_sunshine_heights   = g("Sunshine Heights Reserve", "Sunshine Hts", "Sunshine Heights", "Melbourne", "VIC", 3_000, false, 52, 4, "Sunshine Heights' outer-west reserve — Brimbank suburb, multicultural western community oval.");
GROUND_BY_CLUB_ID.wfnl_tarneit            = g("Tarneit Reserve", "Tarneit Res", "Tarneit", "Melbourne", "VIC", 2_500, false, 50, 4, "Tarneit's growth-corridor oval — outer Wyndham reserve, fast-growing suburb community crowd.");
GROUND_BY_CLUB_ID.wfnl_werribee_districts = g("Chirnside Park", "Chirnside Pk", "Werribee", "Melbourne", "VIC", 5_000, false, 66, 6, "Werribee Districts' flagship WFNL oval — Chirnside Park, the corridor's biggest and best ground.");
GROUND_BY_CLUB_ID.wfnl_west_footscray     = g("Banbury Reserve", "Banbury Res", "West Footscray", "Melbourne", "VIC", 3_500, false, 58, 5, "West Footscray's inner-west oval — Banbury Reserve, proud working-class suburb, vocal home crowd.");
GROUND_BY_CLUB_ID.wfnl_western_rams       = g("Western Rams Reserve", "Western Rams", "Werribee", "Melbourne", "VIC", 3_000, false, 52, 4, "Western Rams' Werribee community reserve — growth corridor oval, passionate new community crowd.");
GROUND_BY_CLUB_ID.wfnl_wyndham_suns       = g("Wyndham Suns Reserve", "Wyndham Suns", "Werribee", "Melbourne", "VIC", 2_500, false, 50, 4, "Wyndham Suns' outer-west growth oval — new suburb community reserve, enthusiastic young crowd.");
GROUND_BY_CLUB_ID.wfnl_wyndhamvale        = g("Wyndhamvale Reserve", "Wyndhamvale", "Wyndham Vale", "Melbourne", "VIC", 2_500, false, 50, 4, "Wyndhamvale's outermost growth-corridor oval — newest community in the Wyndham corridor.");
GROUND_BY_CLUB_ID.wfnl_yarraville_seddon  = g("JT Gray Reserve", "JT Gray Res", "Yarraville", "Melbourne", "VIC", 4_000, false, 62, 5, "Yarraville Seddon's inner-west oval — JT Gray Reserve, one of WFNL's most loved and vocal grounds.");

// ─── MPFNL — Mornington Peninsula Football Netball League (tier 3, VIC) ────────
GROUND_BY_CLUB_ID.mpfnl_bonbeach           = g("Bonbeach Reserve", "Bonbeach Res", "Bonbeach", "Melbourne", "VIC", 3_000, false, 52, 4, "Bonbeach's tidal-fringe reserve — shallow foreshore suburb, tight Kingston community oval.");
GROUND_BY_CLUB_ID.mpfnl_chelsea            = g("Chelsea Reserve", "Chelsea Res", "Chelsea", "Melbourne", "VIC", 3_500, false, 56, 5, "Gulls' beachside home — Chelsea Reserve, classic bayside suburb, passionate coastal crowd.");
GROUND_BY_CLUB_ID.mpfnl_crib_point         = g("Crib Point Recreation Reserve", "Crib Point Res", "Crib Point", "Melbourne", "VIC", 2_500, false, 48, 4, "Crib Point's sheltered peninsula reserve — Mornington Inlet suburb, tight community oval.");
GROUND_BY_CLUB_ID.mpfnl_devon_meadows      = g("Devon Meadows Reserve", "Devon Meadows", "Devon Meadows", "Melbourne", "VIC", 2_500, false, 48, 4, "Devon Meadows' semi-rural Casey fringe oval — community reserve, tight local peninsula crowd.");
GROUND_BY_CLUB_ID.mpfnl_dromana            = g("Pier Street Oval", "Pier St Oval", "Dromana", "Melbourne", "VIC", 3_500, false, 58, 5, "Dromana's seaside oval — Pier Street ground, bay views from the terrace, passionate coastal faithful.");
GROUND_BY_CLUB_ID.mpfnl_edithvale_aspendale= g("Edithvale Reserve", "Edithvale Res", "Edithvale", "Melbourne", "VIC", 3_500, false, 56, 5, "Edithvale-Aspendale's bayside reserve — Kingston beachside oval, loyal community crowd by the bay.");
GROUND_BY_CLUB_ID.mpfnl_frankston_bombers  = g("Pines Reserve", "Pines Res", "Frankston North", "Melbourne", "VIC", 3_500, false, 56, 5, "Frankston Bombers' northern reserve — Pines Reserve, passionate red-and-black peninsula community.");
GROUND_BY_CLUB_ID.mpfnl_frankston_ycw      = g("Frankston YCW Oval", "Frankston YCW", "Frankston", "Melbourne", "VIC", 4_000, false, 62, 5, "YCW's flagship peninsula oval — one of the MPFNL's most storied clubs, vocal Frankston faithful.");
GROUND_BY_CLUB_ID.mpfnl_hastings           = g("Hastings Recreation Reserve", "Hastings Rec", "Hastings", "Melbourne", "VIC", 3_000, false, 52, 4, "Hastings' harbour-suburb oval — Westernport bay fringe reserve, tight peninsula community crowd.");
GROUND_BY_CLUB_ID.mpfnl_karingal           = g("Karingal Reserve", "Karingal Res", "Frankston North", "Melbourne", "VIC", 3_000, false, 52, 4, "Bulls' outer Frankston reserve — Karingal community oval, passionate northern peninsula crowd.");
GROUND_BY_CLUB_ID.mpfnl_langwarrin         = g("Lloyd Park", "Lloyd Pk", "Langwarrin", "Melbourne", "VIC", 3_000, false, 52, 4, "Kangaroos' green-belt oval — Lloyd Park Langwarrin, semi-rural peninsula reserve, loyal local crowd.");
GROUND_BY_CLUB_ID.mpfnl_mornington         = g("Dunns Road Reserve", "Dunns Rd", "Mornington", "Melbourne", "VIC", 4_500, false, 64, 6, "Mornington's flagship MPFNL oval — Dunns Road, one of the peninsula's finest grounds and proudest clubs.");
GROUND_BY_CLUB_ID.mpfnl_mt_eliza          = g("Mt Eliza Reserve", "Mt Eliza Res", "Mount Eliza", "Melbourne", "VIC", 3_500, false, 58, 5, "Mt Eliza's prestigious hilltop oval — leafy prestige suburb, vocal community crowd with great views.");
GROUND_BY_CLUB_ID.mpfnl_pearcedale         = g("Pearcedale Reserve", "Pearcedale Res", "Pearcedale", "Melbourne", "VIC", 2_000, false, 46, 4, "Pearcedale's rural-fringe reserve — small far-south community oval, tight and loyal local crowd.");
GROUND_BY_CLUB_ID.mpfnl_pines              = g("Pines Reserve", "Pines Reserve", "Frankston North", "Melbourne", "VIC", 3_000, false, 52, 4, "Pines' Frankston North community oval — dedicated reserve, enthusiastic northern peninsula crowd.");
GROUND_BY_CLUB_ID.mpfnl_red_hill           = g("Red Hill Recreation Reserve", "Red Hill Res", "Red Hill", "Melbourne", "VIC", 2_000, false, 46, 4, "Red Hill's scenic rural oval — hilltop reserve in wine country, tight farming-community faithful.");
GROUND_BY_CLUB_ID.mpfnl_rosebud            = g("Rosebud Reserve", "Rosebud Res", "Rosebud", "Melbourne", "VIC", 3_500, false, 58, 5, "Rosebud's seaside oval — popular peninsula tourist town, vibrant community with holiday-day bonus crowds.");
GROUND_BY_CLUB_ID.mpfnl_rye                = g("Rye Recreation Reserve", "Rye Res", "Rye", "Melbourne", "VIC", 3_000, false, 52, 4, "Rye's coastal reserve — surf-coast peninsula community, tight oval, strong local peninsula identity.");
GROUND_BY_CLUB_ID.mpfnl_seaford            = g("Seaford Reserve", "Seaford Res", "Seaford", "Melbourne", "VIC", 3_500, false, 56, 5, "Sharks' bayside reserve — Seaford foreshore suburb, passionate coastal community crowd.");
GROUND_BY_CLUB_ID.mpfnl_somerville         = g("Somerville Recreation Reserve", "Somerville Res", "Somerville", "Melbourne", "VIC", 2_500, false, 50, 4, "Somerville's mid-peninsula community oval — Westernport hinterland, tight local faithful.");
GROUND_BY_CLUB_ID.mpfnl_sorrento           = g("Sorrento Reserve", "Sorrento Res", "Sorrento", "Melbourne", "VIC", 3_500, false, 60, 5, "Sharks' iconic tip-of-the-peninsula oval — Sorrento Reserve, one of Australia's most beautiful community grounds.");
GROUND_BY_CLUB_ID.mpfnl_tyabb              = g("Tyabb Recreation Reserve", "Tyabb Res", "Tyabb", "Melbourne", "VIC", 2_500, false, 48, 4, "Tyabb's semi-rural peninsula oval — compact agricultural community reserve, tight local crowd.");

// ─── OuterEastFNL — Outer East Football Netball League (tier 3, VIC) ──────────
GROUND_BY_CLUB_ID.outereastfnl_alexandra   = g("Alexandra Recreation Reserve", "Alexandra Rec", "Alexandra", "Alexandra", "VIC", 3_000, false, 52, 4, "Alexandra's high-country gateway oval — broad recreation reserve, local community support.");
GROUND_BY_CLUB_ID.outereastfnl_beaconsfield= g("Beaconsfield Reserve", "Beaconsfield", "Beaconsfield", "Melbourne", "VIC", 2_500, false, 50, 4, "Beaconsfield's compact SE reserve — outer-east growth suburb, passionate Casey community.");
GROUND_BY_CLUB_ID.outereastfnl_belgrave    = g("Belgrave Reserve", "Belgrave Res", "Belgrave", "Melbourne", "VIC", 2_500, false, 50, 4, "Belgrave's Dandenong Ranges foothills oval — compact ranges community, tight supporter crowd.");
GROUND_BY_CLUB_ID.outereastfnl_berwick     = g("Berwick Recreation Reserve", "Berwick Rec", "Berwick", "Melbourne", "VIC", 3_500, false, 56, 5, "Berwick's outer-east oval — established Casey suburb, passionate local crowd in the growth corridor.");
GROUND_BY_CLUB_ID.outereastfnl_broadford   = g("Broadford Recreation Reserve", "Broadford Rec", "Broadford", "Broadford", "VIC", 2_500, false, 48, 4, "Broadford's northern high-country oval — compact reserve, loyal rural-urban fringe community.");
GROUND_BY_CLUB_ID.outereastfnl_coldstream  = g("Coldstream Reserve", "Coldstream Res", "Coldstream", "Melbourne", "VIC", 2_500, false, 48, 4, "Coldstream's Yarra Valley wine-country reserve — semi-rural oval, tight community atmosphere.");
GROUND_BY_CLUB_ID.outereastfnl_emerald     = g("Emerald Recreation Reserve", "Emerald Rec", "Emerald", "Melbourne", "VIC", 2_500, false, 50, 4, "Emerald's Dandenong Ranges hilltop reserve — scenic outer-east ground, passionate hill community.");
GROUND_BY_CLUB_ID.outereastfnl_gembrook_cockatoo = g("Gembrook Reserve", "Gembrook Res", "Gembrook", "Melbourne", "VIC", 2_000, false, 46, 4, "Gembrook-Cockatoo's remote ranges oval — smallest outer-east ground, fiercely loyal rural crowd.");
GROUND_BY_CLUB_ID.outereastfnl_healesville = g("Healesville Recreation Reserve", "Healesville Rec", "Healesville", "Healesville", "VIC", 3_000, false, 54, 5, "Healesville's Yarra Valley gateway oval — tourist town with passionate local community behind the goals.");
GROUND_BY_CLUB_ID.outereastfnl_kinglake    = g("Kinglake Reserve", "Kinglake Res", "Kinglake", "Kinglake", "VIC", 2_000, false, 46, 4, "Kinglake's elevated ranges oval — resilient community rebuilt post-bushfire, deeply passionate crowd.");
GROUND_BY_CLUB_ID.outereastfnl_monbulk     = g("Monbulk Recreation Reserve", "Monbulk Rec", "Monbulk", "Melbourne", "VIC", 2_500, false, 50, 4, "Monbulk's lush ranges reserve — Dandenong Ranges berry-farming community, tight loyal crowd.");
GROUND_BY_CLUB_ID.outereastfnl_mount_evelyn= g("Mount Evelyn Reserve", "Mt Evelyn Res", "Mount Evelyn", "Melbourne", "VIC", 2_500, false, 50, 4, "Mount Evelyn's ridge-top oval — Yarra Valley fringe, tree-canopy setting, passionate outer-east crowd.");
GROUND_BY_CLUB_ID.outereastfnl_olinda_ferny_creek = g("Olinda Reserve", "Olinda Res", "Olinda", "Melbourne", "VIC", 2_000, false, 48, 4, "Olinda-Ferny Creek's Dandenong Ranges summit oval — one of Victoria's highest community grounds.");
GROUND_BY_CLUB_ID.outereastfnl_pakenham    = g("Pakenham Recreation Reserve", "Pakenham Rec", "Pakenham", "Melbourne", "VIC", 4_500, false, 64, 5, "Pakenham's booming outer-east oval — one of Outer East's biggest clubs, massive growth corridor crowd.");
GROUND_BY_CLUB_ID.outereastfnl_powelltown  = g("Powelltown Reserve", "Powelltown Res", "Powelltown", "Warburton", "VIC", 1_500, false, 44, 4, "Powelltown's tiny timber-country oval — one of Victoria's smallest community grounds, fierce loyalty.");
GROUND_BY_CLUB_ID.outereastfnl_seville     = g("Seville Reserve", "Seville Res", "Seville", "Melbourne", "VIC", 2_000, false, 46, 4, "Seville's Yarra Valley orchard-country reserve — small rural-fringe oval, tight community crowd.");
GROUND_BY_CLUB_ID.outereastfnl_thornton_eildon = g("Thornton Recreation Reserve", "Thornton Res", "Thornton", "Alexandra", "VIC", 2_000, false, 46, 4, "Thornton-Eildon's high-country reservoir oval — Lake Eildon backdrop, remote and passionate crowd.");
GROUND_BY_CLUB_ID.outereastfnl_upwey_tecoma= g("Upwey Reserve", "Upwey Res", "Upwey", "Melbourne", "VIC", 2_500, false, 50, 4, "Upwey-Tecoma's mid-ranges oval — Dandenong Ranges hillside reserve, tight community faithful.");
GROUND_BY_CLUB_ID.outereastfnl_wandin      = g("Wandin Recreation Reserve", "Wandin Rec", "Wandin North", "Melbourne", "VIC", 2_500, false, 50, 4, "Wandin's Yarra Valley farming-community oval — orchard country, tight loyal crowd in the valley.");
GROUND_BY_CLUB_ID.outereastfnl_warburton_millgrove = g("Warburton Reserve", "Warburton Res", "Warburton", "Warburton", "VIC", 2_500, false, 50, 4, "Warburton's upper-Yarra oval — river-valley timber community, passionate end-of-line crowd.");
GROUND_BY_CLUB_ID.outereastfnl_woori_yallock= g("Woori Yallock Reserve", "Woori Yallock", "Woori Yallock", "Melbourne", "VIC", 2_500, false, 50, 4, "Woori Yallock's orchard-valley oval — Yarra Valley fringe community, loyal tight-knit crowd.");
GROUND_BY_CLUB_ID.outereastfnl_yarra_glen  = g("Yarra Glen Reserve", "Yarra Glen Res", "Yarra Glen", "Melbourne", "VIC", 3_000, false, 54, 5, "Yarra Glen's picturesque valley oval — wine-and-horse country, passionate community crowd.");
GROUND_BY_CLUB_ID.outereastfnl_yarra_junction = g("Yarra Junction Recreation Reserve", "Yarra Jctn Rec", "Yarra Junction", "Warburton", "VIC", 2_500, false, 50, 4, "Yarra Junction's upper-valley oval — gateway to the ranges, loyal rural community crowd.");
GROUND_BY_CLUB_ID.outereastfnl_yea         = g("Yea Recreation Reserve", "Yea Rec", "Yea", "Yea", "VIC", 3_000, false, 52, 4, "Yea's high-country market-town oval — gateway to the Great Divide, passionate rural community.");

const GROUND_SUFFIXES = [
  "Oval",
  "Reserve",
  "Recreation Reserve",
  "Sports Ground",
  "Park",
  "Community Ground",
  "Recreation Oval",
  "Sports Reserve",
];

const STATE_CITY = {
  VIC: "Melbourne",
  SA: "Adelaide",
  WA: "Perth",
  TAS: "Hobart",
  NT: "Darwin",
  QLD: "Brisbane",
  NSW: "Sydney",
  ACT: "Canberra",
  NAT: "Melbourne",
};

/** Tier-3 community table: stadium facility level → capacity & home base. */
const COMMUNITY_BY_LEVEL = [
  { cap: 1_500, base: 3, atmos: 45, desc: "Local oval — tin shed change rooms and a hand-painted scoreboard." },
  { cap: 3_500, base: 4, atmos: 55, desc: "Decent community ground — small stand, canteen opens late morning." },
  { cap: 6_000, base: 5, atmos: 65, desc: "Suburban deck — electronic board, covered hill." },
  { cap: 10_000, base: 6, atmos: 73, desc: "Regional venue — grandstand, club rooms, media nook." },
  { cap: 18_000, base: 7, atmos: 80, desc: "Major community stadium — boxes, lights, big finals feel." },
];

/**
 * @param {import('./pyramid.js').ClubLike} club
 * @param {number} stadiumLevel 1–5 from career.facilities.stadium.level
 * @returns {GroundDef}
 */
export function synthesizeCommunityGround(club, stadiumLevel = 1) {
  const lvl = Math.max(1, Math.min(5, stadiumLevel || 1));
  const row = COMMUNITY_BY_LEVEL[lvl - 1];
  const prefix = (club.name || club.short || "Local").split(" ")[0];
  const h = (club.id || prefix).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const name = `${prefix} ${GROUND_SUFFIXES[h % GROUND_SUFFIXES.length]}`;
  const city = STATE_CITY[club.state] || "Regional";
  return {
    name,
    shortName: `${club.short} Ground`,
    suburb: city,
    city,
    state: club.state || "VIC",
    capacity: row.cap,
    surfaceType: "grass",
    roofed: false,
    tierHint: 3,
    atmosphere: row.atmos,
    homeAdvantageBase: row.base,
    description: row.desc,
  };
}

/**
 * Plausible state-league venue when not in AFL map.
 * @param {import('./pyramid.js').ClubLike} club
 * @param {number} leagueTier
 */
export function synthesizeStateLeagueGround(club, leagueTier = 2) {
  const city = STATE_CITY[club.state] || "Regional";
  const cap = club.state === "SA" || club.state === "WA" ? 9_500 : club.state === "TAS" ? 6_800 : 5_200;
  const atm = 68 + ((club.id || "").length % 8);
  return {
    name: `${club.name || club.short} Football Ground`,
    shortName: `${club.short} FG`,
    suburb: city,
    city,
    state: club.state || "VIC",
    capacity: cap,
    surfaceType: "grass",
    roofed: false,
    tierHint: leagueTier,
    atmosphere: Math.min(82, atm),
    homeAdvantageBase: leagueTier === 2 ? 5 : 4,
    description: `State-league home — hard turf, loyal locals, ~${cap.toLocaleString()} on a good day.`,
  };
}

/**
 * Resolved ground for any club in the pyramid.
 * @param {import('./pyramid.js').ClubLike|null|undefined} club
 * @param {number} [stadiumLevel] player stadium (tier 3 only)
 * @param {number} [leagueTier] current league tier (2 = state/community synthesised oval; 3+ = suburban)
 */
export function getClubGround(club, stadiumLevel = 3, leagueTier) {
  if (!club) {
    return synthesizeCommunityGround({ name: "Local", short: "LOC", state: "VIC" }, stadiumLevel);
  }
  const fixed = GROUND_BY_CLUB_ID[club.id];
  if (fixed) return { ...fixed };
  const tier = leagueTier ?? club.tier ?? 2;
  if (tier >= 3) return synthesizeCommunityGround(club, stadiumLevel);
  return synthesizeStateLeagueGround(club, 2);
}
