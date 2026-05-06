// Shared mock data for Footy Dynasty redesign mockups.
// Mirrors the shapes from the source AFLManager.jsx but trimmed for display.

const CLUB = {
  id: "balwyn",
  name: "Balwyn FC",
  short: "BAL",
  league: "Eastern Football League",
  leagueShort: "EFL",
  tier: 3,
  state: "VIC",
  colors: ["#1B3B7A", "#FFD200", "#FFFFFF"],
  founded: 1922,
  ground: "Balwyn Park",
  manager: "You",
  season: 2,
  week: 8,
  totalRounds: 18,
};

const LADDER = [
  { rank: 1, club: "Vermont FC",     short: "VRM", w: 7, l: 1, d: 0, pf: 712, pa: 488, pct: 145.9, pts: 28, form: "WWWWW" },
  { rank: 2, club: "Balwyn FC",      short: "BAL", w: 6, l: 2, d: 0, pf: 678, pa: 521, pct: 130.1, pts: 24, form: "WWLWW", me: true },
  { rank: 3, club: "Blackburn FC",   short: "BLK", w: 6, l: 2, d: 0, pf: 644, pa: 540, pct: 119.3, pts: 24, form: "LWWWW" },
  { rank: 4, club: "Doncaster FC",   short: "DON", w: 5, l: 3, d: 0, pf: 605, pa: 552, pct: 109.6, pts: 20, form: "WLWLW" },
  { rank: 5, club: "Knox FC",        short: "KNX", w: 4, l: 4, d: 0, pf: 581, pa: 588, pct:  98.8, pts: 16, form: "LWLWL" },
  { rank: 6, club: "Rowville FC",    short: "ROW", w: 4, l: 4, d: 0, pf: 562, pa: 595, pct:  94.5, pts: 16, form: "WLLWL" },
  { rank: 7, club: "Boronia FC",     short: "BOR", w: 3, l: 5, d: 0, pf: 532, pa: 612, pct:  86.9, pts: 12, form: "LLWLW" },
  { rank: 8, club: "Bayswater FC",   short: "BAY", w: 2, l: 6, d: 0, pf: 498, pa: 658, pct:  75.7, pts:  8, form: "LLLWL" },
  { rank: 9, club: "Noble Park FC",  short: "NBP", w: 2, l: 6, d: 0, pf: 471, pa: 689, pct:  68.4, pts:  8, form: "LLLLW" },
];

const SQUAD = [
  { num:  1, name: "Lachie Walsh",     pos: "C",  age: 24, ovr: 86, pot: 89, fit: 96, form: 82, mor: 78, kick: 88, mark: 81, hand: 90, tack: 79, speed: 84, end: 88, str: 76, dec: 87, wage: 24400, contract: 2, status: "captain" },
  { num:  4, name: "Marcus Petracca",  pos: "HF", age: 26, ovr: 84, pot: 84, fit: 92, form: 88, mor: 84, kick: 86, mark: 82, hand: 80, tack: 70, speed: 81, end: 79, str: 78, dec: 85, wage: 21600, contract: 3 },
  { num:  9, name: "Tom Heeney",       pos: "R",  age: 22, ovr: 81, pot: 90, fit: 100,form: 76, mor: 90, kick: 80, mark: 76, hand: 84, tack: 88, speed: 85, end: 92, str: 74, dec: 79, wage: 18200, contract: 2 },
  { num: 12, name: "Sam Daicos",       pos: "WG", age: 21, ovr: 80, pot: 92, fit: 94, form: 79, mor: 86, kick: 84, mark: 73, hand: 81, tack: 71, speed: 90, end: 86, str: 64, dec: 82, wage: 15800, contract: 4 },
  { num: 15, name: "Will Bontempelli", pos: "RU", age: 28, ovr: 83, pot: 83, fit: 88, form: 81, mor: 74, kick: 71, mark: 89, hand: 76, tack: 78, speed: 56, end: 80, str: 95, dec: 79, wage: 22100, contract: 1, status: "expiring" },
  { num: 18, name: "Charlie Curnow",   pos: "KF", age: 25, ovr: 82, pot: 86, fit: 90, form: 86, mor: 80, kick: 82, mark: 90, hand: 71, tack: 65, speed: 76, end: 73, str: 88, dec: 79, wage: 20400, contract: 2 },
  { num: 22, name: "Patrick Cripps",   pos: "C",  age: 27, ovr: 81, pot: 82, fit: 84, form: 74, mor: 70, kick: 80, mark: 76, hand: 84, tack: 87, speed: 70, end: 82, str: 86, dec: 84, wage: 19800, contract: 3 },
  { num: 27, name: "Riley Sicily",     pos: "KB", age: 24, ovr: 79, pot: 83, fit: 92, form: 80, mor: 82, kick: 78, mark: 87, hand: 74, tack: 82, speed: 70, end: 78, str: 85, dec: 80, wage: 16400, contract: 2 },
  { num: 31, name: "Jed Anderson",     pos: "HB", age: 23, ovr: 78, pot: 85, fit: 95, form: 73, mor: 88, kick: 81, mark: 76, hand: 79, tack: 80, speed: 82, end: 84, str: 70, dec: 76, wage: 14200, contract: 1, status: "expiring" },
  { num: 34, name: "Bailey Smith",     pos: "WG", age: 22, ovr: 76, pot: 87, fit: 86, form: 71, mor: 76, kick: 78, mark: 70, hand: 76, tack: 72, speed: 88, end: 85, str: 65, dec: 73, wage: 12100, contract: 3 },
  { num: 38, name: "Hudson Naughton",  pos: "KF", age: 19, ovr: 71, pot: 88, fit: 100,form: 68, mor: 92, kick: 73, mark: 84, hand: 64, tack: 58, speed: 72, end: 68, str: 80, dec: 66, wage:  4800, contract: 2, status: "rookie" },
  { num: 41, name: "Eli Templeton",    pos: "UT", age: 18, ovr: 68, pot: 86, fit: 100,form: 65, mor: 90, kick: 71, mark: 68, hand: 72, tack: 65, speed: 78, end: 76, str: 62, dec: 64, wage:  3200, contract: 3, status: "rookie" },
];

const FIXTURES = [
  { rd:  6, opp: "Knox FC",       short: "KNX", home: true,  result: "W", score: "12.9 (81) – 9.7 (61)" },
  { rd:  7, opp: "Doncaster FC",  short: "DON", home: false, result: "W", score: "11.6 (72) – 8.10 (58)" },
  { rd:  8, opp: "Vermont FC",    short: "VRM", home: true,  result: null, status: "live" },
  { rd:  9, opp: "Blackburn FC",  short: "BLK", home: false, result: null },
  { rd: 10, opp: "Bayswater FC",  short: "BAY", home: true,  result: null },
  { rd: 11, opp: "Rowville FC",   short: "ROW", home: false, result: null },
];

const NEWS = [
  { tag: "BOARD",   text: "Board confidence rises to 78 after back-to-back wins.", time: "2d", positive: true },
  { tag: "INJURY",  text: "Bontempelli (knock) listed as TEST for Vermont clash.",  time: "3d" },
  { tag: "MEDIA",   text: "Walsh named in EFL Team of the Round (Round 7).",        time: "4d", positive: true },
  { tag: "FANS",    text: "Membership ticks past 2,400 — first time since 2019.",   time: "5d", positive: true },
  { tag: "SCOUT",   text: "Local scout flags 17yo from Camberwell Storm — see Recruit.", time: "6d" },
];

const TACTICS = [
  { key: "attack",    name: "Attack",    diff: "+6", note: "More inside-50s, riskier in transition", color: "neg" },
  { key: "balanced",  name: "Balanced",  diff:  "0", note: "Standard team setup",                    color: "accent", active: true },
  { key: "defensive", name: "Defensive", diff: "−4", note: "Limit opposition scoring",               color: "dim" },
  { key: "flood",     name: "Flood",     diff: "−2", note: "Pack defensive 50, grind down",          color: "dim" },
];

const FACILITIES = [
  { name: "Training Ground", level: 3, max: 5, cost: 80000, sub: "Main oval + change rooms" },
  { name: "Gym",             level: 2, max: 5, cost: 60000, sub: "Strength & conditioning" },
  { name: "Medical",         level: 2, max: 5, cost: 50000, sub: "Physio + recovery suite" },
  { name: "Academy",         level: 1, max: 5, cost: 120000,sub: "Local junior pathway" },
  { name: "Clubrooms",       level: 4, max: 5, cost: 40000, sub: "Members' bar + function" },
  { name: "Scoreboard",      level: 2, max: 5, cost: 35000, sub: "Replay screen upgrade" },
];

const SPONSORS = [
  { name: "Camberwell Toyota",  tier: "Major",   value: 48000, expires: 2 },
  { name: "Whitehorse Council", tier: "Civic",   value: 22000, expires: 3 },
  { name: "Patties Pies",       tier: "Match",   value: 14000, expires: 1 },
  { name: "Box Hill Brewing",   tier: "Bar",     value:  9500, expires: 2 },
];

const STAFF = [
  { name: "Brett Ratten",   role: "Senior Coach",       rating: 78, wage: 32000, contract: 2 },
  { name: "Sam Mitchell",   role: "Midfield Coach",     rating: 72, wage: 18000, contract: 1 },
  { name: "Leigh Tudor",    role: "Forwards Coach",     rating: 68, wage: 14000, contract: 3 },
  { name: "Jess Dempsey",   role: "Backs Coach",        rating: 70, wage: 15000, contract: 2 },
  { name: "Dr. Nguyen",     role: "Head Physio",        rating: 75, wage: 22000, contract: 2 },
  { name: "Marko Tasic",    role: "S&C Lead",           rating: 71, wage: 16000, contract: 3 },
];

const DRAFT = [
  { rank:  1, name: "Finn Hocking",     pos: "C",  age: 18, ovr: 72, pot: 91, club: "Sandringham U18", note: "Elite endurance, clean hands" },
  { rank:  2, name: "Brodie Witts",     pos: "RU", age: 18, ovr: 70, pot: 89, club: "Geelong Falcons", note: "200cm, raw but agile" },
  { rank:  3, name: "Jye Worrell",      pos: "KF", age: 18, ovr: 71, pot: 88, club: "Calder Cannons",  note: "Goal sense, strong overhead" },
  { rank:  4, name: "Connor Ah Chee",   pos: "WG", age: 17, ovr: 67, pot: 90, club: "Tassie Devils U18", note: "Burst speed, work in progress" },
  { rank:  5, name: "Reuben Black",     pos: "HB", age: 18, ovr: 70, pot: 86, club: "Oakleigh Chargers",note: "Reads the play well" },
];

const TRADES = [
  { name: "Touk Pickett",    pos: "HF", age: 25, ovr: 80, club: "Boronia FC",  ask:  78000, fit: "high" },
  { name: "Kai Treloar",     pos: "C",  age: 28, ovr: 79, club: "Knox FC",     ask:  62000, fit: "med" },
  { name: "Hayden Long",     pos: "WG", age: 23, ovr: 76, club: "Bayswater",   ask:  44000, fit: "high" },
  { name: "Joel Holmes",     pos: "KB", age: 30, ovr: 81, club: "Vermont FC",  ask:  92000, fit: "low" },
];

const FINANCE = {
  cash: 142800,
  transferBudget: 38000,
  wageBudget: 240000,
  income: 412000,
  expenses: 358200,
  boardConf: 78,
  fans: 71,
  members: 2412,
  membersDelta: +186,
};

const MATCH_FEED = [
  { q: 1, t: "5:12",  type: "goal-h", text: "Walsh threads it from 45 — gettable shot, never in doubt." },
  { q: 1, t: "8:44",  type: "goal-a", text: "Vermont reply quickly through Stengle on the run." },
  { q: 1, t: "12:01", type: "behind", text: "Curnow rushed in the goalsquare — pressure tells." },
  { q: 1, t: "17:22", type: "neutral",text: "End of Q1 · BAL 2.3 (15) – VRM 2.1 (13)" },
  { q: 2, t: "2:08",  type: "goal-h", text: "Heeney centre-clearance to Petracca who finishes truly." },
  { q: 2, t: "6:51",  type: "moment", text: "Momentum: Balwyn winning the contested ball 18–11." },
  { q: 2, t: "11:34", type: "goal-a", text: "Vermont's Rioli snaps a beauty from the boundary." },
  { q: 2, t: "14:08", type: "goal-h", text: "Daicos with the dare — long bomb from 55, GOAL." },
  { q: 2, t: "19:55", type: "neutral",text: "Half time · BAL 5.5 (35) – VRM 4.3 (27)" },
  { q: 3, t: "1:44",  type: "goal-h", text: "Curnow takes a strong contested grab, converts." },
  { q: 3, t: "7:12",  type: "behind", text: "Smith from outside 50 — falls just short, behind." },
  { q: 3, t: "12:38", type: "goal-a", text: "Vermont fight back through Naughton in front." },
];

// Season trend — ladder position, weekly score, opp score, attendance
const SEASON_TREND = [
  { rd: 1, pos: 8, for: 64, agst: 78, att: 1820, result: "L" },
  { rd: 2, pos: 7, for: 71, agst: 70, att: 1640, result: "W" },
  { rd: 3, pos: 5, for: 88, agst: 62, att: 1980, result: "W" },
  { rd: 4, pos: 4, for: 79, agst: 81, att: 2040, result: "L" },
  { rd: 5, pos: 3, for: 92, agst: 64, att: 2210, result: "W" },
  { rd: 6, pos: 3, for: 81, agst: 61, att: 2080, result: "W" },
  { rd: 7, pos: 2, for: 72, agst: 58, att: 2150, result: "W" },
  { rd: 8, pos: 2, for: 43, agst: 34, att: 2140, result: "live" },
];

// Cash trend (last 12 weeks, $K)
const CASH_TREND = [78, 82, 80, 84, 92, 88, 96, 110, 124, 130, 138, 142.8];

// Revenue breakdown for chart
const REVENUE_BREAKDOWN = [
  { label: "MEMBR", value: 96.4, highlight: true },
  { label: "SPNSR", value: 93.5 },
  { label: "GATE",  value: 61.0 },
  { label: "MERCH", value: 42.2 },
  { label: "GRANT", value: 22.0 },
  { label: "OTHER", value: 8.5  },
];

// Player career history (for detail panel)
const PLAYER_HISTORY = {
  walsh: [
    { season: "S1 R1", form: 72, ovr: 80 },
    { season: "S1 R6", form: 78, ovr: 82 },
    { season: "S1 R12", form: 74, ovr: 83 },
    { season: "S1 R18", form: 80, ovr: 84 },
    { season: "S2 R1", form: 76, ovr: 84 },
    { season: "S2 R4", form: 84, ovr: 85 },
    { season: "S2 R6", form: 82, ovr: 85 },
    { season: "S2 R8", form: 82, ovr: 86 },
  ],
};

// Scout reports (deeper detail per draft prospect)
const SCOUT_REPORTS = {
  1: {
    strengths: ["Endurance (94)", "Clean hands (88)", "Footy IQ (87)", "Leadership"],
    weaknesses: ["Aerial contests (62)", "Body strength (64)"],
    comparable: "Lachie Neale at 19 — undersized, unrelenting",
    riskFactor: "Low",
    nationalRank: 1,
    weeksScouted: 14,
    interestedClubs: ["Carlton", "Sydney", "Geelong"],
  },
  2: {
    strengths: ["Tap work (84)", "Wingspan", "Mobility for height"],
    weaknesses: ["Body still developing", "Hands under pressure"],
    comparable: "Tim English profile",
    riskFactor: "Medium",
    nationalRank: 2,
    weeksScouted: 11,
    interestedClubs: ["Brisbane", "Adelaide"],
  },
  3: {
    strengths: ["Goal sense", "Overhead marking (88)", "Set-shot accuracy"],
    weaknesses: ["One-paced", "Lateral movement"],
    comparable: "Charlie Curnow archetype",
    riskFactor: "Low",
    nationalRank: 3,
    weeksScouted: 12,
    interestedClubs: ["Hawthorn", "St Kilda", "Essendon"],
  },
  4: {
    strengths: ["Top-end speed (92)", "Kicking on the run"],
    weaknesses: ["Decision making (61)", "Defensive work"],
    comparable: "Bailey Smith — burst player, raw",
    riskFactor: "High",
    nationalRank: 7,
    weeksScouted: 8,
    interestedClubs: ["Western Bulldogs", "Port Adelaide"],
  },
  5: {
    strengths: ["Reading the play", "Intercept marking (82)"],
    weaknesses: ["Pace", "Foot skills under pressure"],
    comparable: "Sam Taylor lite",
    riskFactor: "Low",
    nationalRank: 6,
    weeksScouted: 10,
    interestedClubs: ["Sydney", "Fremantle"],
  },
};

// Premade kit options for kit designer
const KIT_PRESETS = [
  { id: "stripes",    name: "Stripes",    pattern: "stripes" },
  { id: "yoke",       name: "Yoke",       pattern: "yoke" },
  { id: "sash",       name: "Sash",       pattern: "sash" },
  { id: "solid",      name: "Solid",      pattern: "solid" },
  { id: "hoops",      name: "Hoops",      pattern: "hoops" },
  { id: "panel",      name: "Side panel", pattern: "panel" },
];

const KIT_PALETTES = [
  { name: "Heritage Navy",   colors: ["#1B3B7A", "#FFD200", "#FFFFFF"] },
  { name: "Royal Crimson",   colors: ["#7B1F1F", "#1A1A1A", "#FFFFFF"] },
  { name: "Forest Gold",     colors: ["#0F4D2A", "#E0C468", "#FFFFFF"] },
  { name: "Midnight Sky",    colors: ["#0D1B3D", "#5BB8E6", "#FFFFFF"] },
  { name: "Sand Stone",      colors: ["#C9A36B", "#3A2F25", "#FFFFFF"] },
  { name: "Black Ember",     colors: ["#0A0A0A", "#FF5A1F", "#FFFFFF"] },
];

window.FD = { CLUB, LADDER, SQUAD, FIXTURES, NEWS, TACTICS, FACILITIES, SPONSORS, STAFF, DRAFT, TRADES, FINANCE, MATCH_FEED, SEASON_TREND, CASH_TREND, REVENUE_BREAKDOWN, PLAYER_HISTORY, SCOUT_REPORTS, KIT_PRESETS, KIT_PALETTES };
