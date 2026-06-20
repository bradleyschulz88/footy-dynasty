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
