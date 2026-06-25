import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trophy, ChevronRight, ChevronLeft, Check, Zap, MapPin } from "lucide-react";
import { STATES, PYRAMID, LEAGUES_BY_STATE, findClub } from "../data/pyramid.js";
import { generateSquad } from "../lib/playerGen.js";
import {
  generateFixtures,
  generateByeRounds,
  blankLadder,
  getCompetitionClubs,
  tier3DivisionCount,
  tier3DivisionTeamCounts,
  LOCAL_DIVISION_COUNT,
  TIER3_CLUBS_PER_DIVISION_TARGET,
  TIER3_MIN_CLUBS_PER_DIVISION,
} from "../lib/leagueEngine.js";
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits, generateTradePool } from "../lib/defaults.js";
import { seedNationalDraft } from "../lib/draftSeed.js";
import { generateSeasonCalendar } from "../lib/calendar.js";
import { DEFAULT_STAFF_TASKS } from "../lib/staffTasks.js";
import { getPlayerPrefs, setPlayerPrefs } from "../lib/playerPrefs.js";
import { DIFFICULTY_IDS, getDifficultyConfig, getDifficultyProfile } from "../lib/difficulty.js";
import { generateCommittee, generateJournalist, rollPlayerTrait } from "../lib/community.js";
import { makeStartingFinance, scaledSquadToFitCap } from "../lib/finance/engine.js";
import { buildStartingSponsors } from "../lib/finance/sponsors.js";
import { getClubGround } from "../data/grounds.js";
import { assignDefaultCaptains, defaultClubCulture } from "../lib/gameDepth.js";
import {
  ensureCareerBoard,
  generateSeasonObjectives,
  planSeasonBoardMeetings,
} from "../lib/board.js";
import { primeSeasonStoryState } from "../lib/careerAdvance.js";
import { SETUP_SS_KEY, SLOT_IDS, getLatestSavedSlotMeta, SAVE_VERSION } from "../lib/setupConstants.js";
import { LINEUP_CAP } from "../lib/lineupHelpers.js";
import { startingAccreditationForTier } from "../lib/coachReputation.js";
import { Pill } from "../components/primitives.jsx";

// Per-state identity used on map + selection cards
const STATE_META = {
  VIC: { color: "#1D4ED8", tagline: "The Heartland",       desc: "The game's birthplace. More clubs, more leagues, more history than anywhere else in the country.",
         bullets: ["Most clubs of any state — hundreds at community level", "VFL: where Australian rules was invented in 1858", "MCG awaits at the top of the pyramid"] },
  SA:  { color: "#E31837", tagline: "SANFL Country",       desc: "Second oldest league in the world. The culture here runs bone-deep — footy isn't just a sport, it's identity.",
         bullets: ["SANFL — one of the world's oldest football leagues", "Adelaide Oval: a cathedral that doubles as a footy ground", "Passionate supporter culture stretching back generations"] },
  WA:  { color: "#003D72", tagline: "WAFL Territory",      desc: "WAFL roots with a proud independent culture. West Australians play their own way — physical, direct, relentless.",
         bullets: ["WAFL: 8 clubs with fierce Perth followings", "Optus Stadium is the game's most modern venue", "Remote communities produce elite athletes every generation"] },
  TAS: { color: "#007A53", tagline: "Apple Isle",          desc: "The only state without an AFL licence — until now. Tasmania is getting a team, and you could help build the culture.",
         bullets: ["Tasmania Devils: incoming AFL club from 2028", "History in the making — get in at the ground floor", "Tight communities, genuine passion, no corporate noise"] },
  NT:  { color: "#F58025", tagline: "Top End Footy",       desc: "Remote grounds, passionate supporters, raw talent. The Territory produces elite athletes at a rate that defies its population.",
         bullets: ["Highest per-capita AFL talent production in Australia", "NTFL: year-round competition unlike anywhere else", "Remote communities with extraordinary football culture"] },
  QLD: { color: "#7B1D41", tagline: "North of the Border", desc: "Suns, Lions and a fast-growing local competition. Queensland has become a genuine football state.",
         bullets: ["QAFL: competitive league spread from Brisbane to Gold Coast", "Two AFL clubs in the same state — Brisbane & Gold Coast", "Growing grassroots scene with massive recruitment potential"] },
  NSW: { color: "#009EE0", tagline: "Swans Territory",     desc: "Sydney footy has always had to fight for attention. That struggle built toughness — the Swans are proof.",
         bullets: ["Sydney Swans: one of the AFL's most iconic clubs", "Greater Western Sydney: fastest-growing AFL club", "NSW AFL: competitive state league with deep suburban roots"] },
  ACT: { color: "#002B5C", tagline: "Capital Territory",   desc: "Small by population, enormous in football heart. Canberra footy is compact, competitive, and community-driven.",
         bullets: ["ACTAFL: tight competition where every game matters", "GWS Giants cover the region — clear AFL pathway exists", "Capital ambition: punching above its weight for a century"] },
};

// Region classification for VIC tier-3 league filter chips.
// Other states have few enough leagues that filtering isn't needed.
function leagueRegion(l) {
  const n = (l.name || '').toLowerCase();
  const k = l.key || '';
  if (['EDFL','EFNL','NFNL','MPFNL','SFNL','WFNL','VAFA','OuterEastFNL','ERGFL'].includes(k)) return 'Metro';
  if (n.includes('gippsland') || n.includes('ellinbank') || k === 'AlbertonFL') return 'Gippsland';
  if (n.includes('geelong') || n.includes('bellarine') || n.includes('colac') || n.includes('hampden') || n.includes('warrnambool') || k === 'SouthWestDFL') return 'Geelong & South';
  if (n.includes('ballarat') || n.includes('wimmera') || n.includes('horsham') || n.includes('mininera') || n.includes('central highland') || k === 'RiddellDFNL') return 'Ballarat & West';
  if (n.includes('bendigo') || k === 'MaryboroughCastlemaineDFL' || n.includes('north central') || n.includes('loddon') || k === 'GoldenRiversFL' || k === 'HeathcoteDFL' || n.includes('kyabram') || n.includes('picola') || n.includes('goulburn')) return 'Bendigo & North';
  if (n.includes('murray') || n.includes('ovens') || n.includes('millewa') || n.includes('tallangatta') || n.includes('omeo') || n.includes('sunraysia')) return 'Murray & Border';
  return null;
}
const REGION_COLORS = {
  'Metro':          '#1D4ED8',
  'Gippsland':      '#16A34A',
  'Geelong & South':'#0891B2',
  'Ballarat & West':'#7C3AED',
  'Bendigo & North':'#DC2626',
  'Murray & Border':'#D97706',
};

// Real geographic SVG paths from react-australia-map (MIT license, pvoznyuk/react-australia-map)
// viewBox: "-0.4 -0.4 291 263"
const STATE_PATHS = {
  WA: "M 113.85,156.31875 L 113.85,117.35 L 113.85,33.81875 L 112.6,33.81875 L 112.19375,33.38125 L 111.35,33.19375 L 110.06875,33.38125 L 110.9125,34.0375 L 111.13125,34.88125 L 110.2875,33.81875 L 110.9125,34.88125 L 110.69375,34.6625 L 110.475,35.1 L 110.06875,34.6625 L 109.85,35.5375 L 109.4125,34.44375 L 109.00625,35.1 L 110.06875,38.06875 L 109.63125,38.06875 L 109.4125,37.00625 L 108.35,35.94375 L 108.35,37.6625 L 107.725,38.2875 L 108.13125,37.44375 L 107.725,36.7875 L 108.13125,36.6 L 107.9125,35.31875 L 108.56875,33.81875 L 108.13125,33.81875 L 109.00625,33.6 L 108.56875,32.975 L 109.00625,32.75625 L 107.50625,31.69375 L 107.2875,32.13125 L 105.38125,29.13125 L 103.88125,28.2875 L 103.6625,27.44375 L 103.0375,27.225 L 103.25625,27.85 L 102.6,27.225 L 102.1625,27.63125 L 102.1625,27.225 L 101.75625,27.63125 L 101.31875,26.56875 L 100.0375,26.1625 L 100.0375,26.56875 L 99.19375,26.38125 L 99.63125,27.44375 L 100.475,27.85 L 100.1,27.81875 L 98.975,27.63125 L 99.19375,28.2875 L 98.75625,28.725 L 98.56875,28.2875 L 98.35,29.56875 L 97.69375,28.2875 L 97.2875,28.50625 L 97.69375,27.44375 L 96.4125,28.2875 L 96.225,28.725 L 96.63125,29.13125 L 95.7875,29.56875 L 95.56875,28.50625 L 95.1625,28.50625 L 95.56875,28.06875 L 95.1625,28.06875 L 95.56875,27.63125 L 94.94375,28.06875 L 94.2875,27.85 L 94.2875,28.2875 L 94.1,27.85 L 94.1,28.2875 L 95.35,28.9125 L 94.50625,29.56875 L 94.725,30.19375 L 94.1,30.63125 L 94.50625,31.475 L 93.6625,31.475 L 93.6625,32.5375 L 93.00625,31.9125 L 93.225,31.06875 L 92.38125,31.25625 L 92.38125,30.63125 L 91.75625,32.31875 L 91.94375,30.4125 L 92.38125,29.7875 L 91.5375,29.35 L 91.5375,31.69375 L 90.88125,31.475 L 90.475,32.31875 L 90.25625,31.69375 L 89.81875,32.13125 L 90.0375,31.25625 L 89.19375,32.13125 L 89.6,32.31875 L 88.31875,32.975 L 88.975,33.81875 L 89.6,33.81875 L 88.75625,34.475 L 90.0375,34.88125 L 90.25625,34.475 L 90.6625,34.6625 L 89.81875,35.5375 L 90.88125,35.94375 L 89.81875,35.94375 L 89.4125,35.31875 L 88.5375,35.94375 L 87.9125,34.475 L 87.475,34.6625 L 87.69375,35.5375 L 86.4125,35.725 L 86.85,35.94375 L 86.63125,36.6 L 87.9125,35.725 L 86.63125,36.81875 L 87.06875,37.225 L 88.13125,36.6 L 88.13125,37.00625 L 88.5375,37.00625 L 87.9125,37.6625 L 89.19375,38.725 L 88.13125,37.88125 L 87.69375,38.2875 L 87.25625,37.44375 L 86.4125,37.225 L 86.4125,36.7875 L 85.7875,37.225 L 85.35,38.06875 L 85.13125,37.6625 L 84.9125,38.2875 L 84.06875,38.06875 L 84.2875,38.2875 L 83.44375,38.94375 L 83.85,39.13125 L 83.225,39.35 L 84.06875,41.69375 L 84.9125,40.19375 L 85.56875,39.7875 L 85.13125,40.19375 L 85.7875,40.19375 L 84.9125,40.85 L 84.725,42.35 L 85.13125,42.35 L 84.2875,42.75625 L 83.85,42.13125 L 83.44375,44.0375 L 84.9125,43.81875 L 83.85,44.475 L 83.44375,44.0375 L 83.00625,44.475 L 82.38125,44.475 L 81.725,43.63125 L 80.25625,42.975 L 80.88125,43.63125 L 80.0375,43.63125 L 78.975,43.4125 L 78.75625,42.5375 L 78.1,42.75625 L 77.9125,42.75625 L 78.75625,43.81875 L 77.475,44.475 L 78.5375,45.1 L 77.06875,45.1 L 77.475,45.75625 L 78.31875,45.5375 L 77.475,46.1625 L 78.975,46.6 L 79.38125,47.88125 L 80.25625,47.44375 L 80.6625,47.225 L 79.6,48.2875 L 80.0375,48.725 L 80.475,50.44375 L 78.5375,48.50625 L 77.9125,48.725 L 78.75625,50.225 L 77.9125,51.06875 L 77.9125,52.13125 L 76.63125,50.85 L 75.975,48.725 L 75.13125,48.1 L 75.13125,46.38125 L 74.50625,46.38125 L 73.85,45.75625 L 74.06875,44.88125 L 74.725,44.69375 L 74.2875,44.0375 L 73.63125,44.25625 L 72.38125,46.38125 L 73.00625,47.0375 L 71.2875,46.81875 L 71.1,47.44375 L 71.50625,48.2875 L 70.6625,47.88125 L 69.81875,48.50625 L 69.1625,49.38125 L 68.5375,50.44375 L 68.31875,52.35 L 68.94375,53.85 L 68.5375,55.31875 L 70.0375,55.5375 L 70.0375,56.38125 L 67.0375,58.5375 L 66.19375,58.725 L 65.5375,59.6 L 64.9125,60.44375 L 65.13125,61.2875 L 64.06875,63.225 L 61.50625,66.4125 L 55.5375,68.975 L 54.0375,69.1625 L 52.56875,69.1625 L 51.9125,69.6 L 51.06875,70.225 L 50.44375,69.6 L 48.50625,69.1625 L 47.88125,69.6 L 46.38125,71.50625 L 41.9125,72.38125 L 40.225,73.00625 L 39.35,74.2875 L 38.2875,74.50625 L 36.6,75.13125 L 35.31875,74.50625 L 35.1,73.85 L 33.6,74.725 L 32.5375,74.2875 L 33.19375,73.225 L 31.69375,74.50625 L 29.35,75.7875 L 28.50625,76.4125 L 26.7875,77.25625 L 26.1625,78.5375 L 25.1,78.75625 L 24.0375,80.475 L 19.975,81.5375 L 18.2875,82.6 L 18.06875,83.88125 L 17.4125,84.725 L 16.7875,85.7875 L 17.00625,86.4125 L 16.13125,87.475 L 15.725,86.85 L 14.6625,87.475 L 15.06875,86.00625 L 14.44375,84.94375 L 15.2875,82.38125 L 13.7875,82.81875 L 11.6625,87.9125 L 12.725,90.69375 L 12.31875,91.975 L 12.5375,94.50625 L 10.38125,97.50625 L 9.975,101.31875 L 11.6625,104.1 L 11.88125,106.225 L 12.725,106.88125 L 15.06875,111.56875 L 15.94375,112.81875 L 13.7875,122.19375 L 15.06875,125.6 L 15.06875,128.81875 L 17.4125,131.56875 L 18.06875,132.85 L 19.75625,136.25625 L 20.63125,139.25625 L 21.0375,146.9125 L 25.2875,155.85 L 25.2875,160.75625 L 24.6625,163.94375 L 25.2875,168.85 L 22.975,171.6 L 20.63125,170.75625 L 20.63125,175.225 L 21.475,177.56875 L 22.94375,176.94375 L 25.2875,178.225 L 27.225,181.19375 L 29.7875,182.0375 L 31.475,183.1 L 33.38125,183.1 L 36.38125,182.69375 L 38.06875,183.75625 L 40.4125,183.5375 L 42.13125,182.69375 L 43.4125,181.81875 L 43.63125,180.5375 L 45.5375,179.69375 L 46.81875,178.4125 L 49.1625,178.85 L 50.225,178.225 L 50.225,177.35 L 51.2875,177.56875 L 50.44375,176.725 L 53.4125,173.94375 L 56.81875,174.38125 L 57.88125,173.5375 L 63.225,172.88125 L 65.975,173.725 L 67.475,173.1 L 68.31875,174.6 L 69.81875,173.725 L 71.50625,173.5375 L 74.2875,173.31875 L 75.13125,174.6 L 76.63125,173.5375 L 77.69375,173.94375 L 80.6625,170.975 L 81.5375,167.56875 L 82.38125,166.69375 L 86.225,165.44375 L 93.88125,160.94375 L 98.7875,160.94375 L 102.38125,160.75625 L 109.225,158.63125 L 113.85,156.31875 Z",
  NT: "M 113.85,33.81875 L 113.85,117.35 L 173.4125,117.35 L 173.4125,44.19375 L 172.6625,43.19375 L 170.5375,42.5375 L 167.75625,40.63125 L 167.13125,40.85 L 167.35,41.2875 L 166.2875,40.85 L 165.63125,41.06875 L 165.63125,40.19375 L 163.2875,39.13125 L 162.44375,37.44375 L 159.0375,35.31875 L 158.81875,35.5375 L 158.81875,35.1 L 158.19375,35.31875 L 157.13125,34.25625 L 156.69375,32.75625 L 157.975,32.31875 L 159.0375,29.7875 L 160.31875,29.13125 L 160.5375,27.85 L 161.6,25.50625 L 160.31875,25.94375 L 160.1,24.0375 L 160.5375,24.225 L 160.94375,23.81875 L 160.31875,23.6 L 160.5375,22.975 L 161.1625,22.5375 L 161.38125,23.1625 L 162.00625,21.9125 L 162.225,22.975 L 162.44375,21.9125 L 163.06875,22.1 L 163.2875,21.475 L 163.725,22.5375 L 163.2875,23.1625 L 164.13125,22.75625 L 164.7875,21.475 L 164.13125,20.81875 L 165.4125,21.0375 L 164.13125,19.56875 L 164.7875,19.35 L 165.225,19.975 L 165.63125,19.13125 L 166.06875,18.06875 L 165.85,17.4125 L 166.2875,18.06875 L 167.56875,16.56875 L 166.2875,15.2875 L 165.63125,15.725 L 164.56875,14.225 L 164.7875,13.38125 L 162.225,15.2875 L 163.725,15.725 L 163.06875,17.00625 L 162.44375,17.4125 L 161.6,17.225 L 161.1625,17.63125 L 161.38125,15.94375 L 160.725,16.13125 L 160.5375,15.725 L 161.38125,14.6625 L 159.6625,15.50625 L 159.44375,16.1625 L 158.81875,15.725 L 160.5375,13.81875 L 158.19375,15.06875 L 157.975,14.6625 L 156.9125,14.88125 L 155.85,15.50625 L 156.69375,15.94375 L 155.4125,15.725 L 155.85,16.35 L 153.2875,15.2875 L 152.63125,13.81875 L 151.7875,14.88125 L 149.225,14.225 L 148.6,15.50625 L 148.6,13.6 L 148.1625,13.81875 L 147.94375,13.1625 L 147.1,13.81875 L 146.475,13.1625 L 147.1,12.5375 L 146.25625,12.31875 L 144.35,13.38125 L 144.13125,12.94375 L 143.69375,12.31875 L 143.06875,12.725 L 143.25625,12.1 L 142.00625,12.31875 L 140.50625,9.75625 L 140.2875,10.4125 L 139.85,10.19375 L 138.7875,11.0375 L 137.31875,8.9125 L 136.88125,9.5375 L 136.6625,8.25625 L 136.0375,8.69375 L 135.1625,8.25625 L 135.38125,9.5375 L 135.81875,9.75625 L 135.38125,10.4125 L 134.975,8.9125 L 134.1,8.25625 L 134.1,9.13125 L 133.0375,8.9125 L 133.25625,9.31875 L 132.85,9.75625 L 133.9125,9.5375 L 134.1,9.975 L 133.9125,10.19375 L 134.75625,10.4125 L 134.975,11.0375 L 135.81875,10.6 L 137.725,10.4125 L 138.1625,10.81875 L 137.725,11.0375 L 138.38125,11.25625 L 138.38125,11.475 L 137.94375,11.6625 L 139.00625,11.6625 L 138.1625,12.725 L 139.00625,13.38125 L 138.38125,14.88125 L 139.44375,15.2875 L 137.975,14.88125 L 137.31875,15.2875 L 137.1,16.56875 L 136.69375,15.50625 L 136.0375,15.94375 L 135.81875,15.2875 L 134.75625,16.35 L 133.69375,15.725 L 130.725,16.13125 L 129.88125,15.50625 L 129.6625,14.44375 L 129.225,15.725 L 127.5375,15.2875 L 127.94375,16.7875 L 126.88125,16.56875 L 126.475,17.00625 L 127.5375,17.85 L 126.6625,17.63125 L 127.06875,18.2875 L 126.6625,18.69375 L 126.25625,17.85 L 125.81875,18.2875 L 126.0375,17.19375 L 124.75625,17.00625 L 124.975,18.475 L 125.81875,19.13125 L 125.19375,19.13125 L 124.13125,18.475 L 123.475,18.69375 L 123.69375,19.13125 L 123.25625,18.69375 L 123.25625,20.19375 L 121.7875,20.6 L 121.7875,22.1 L 123.0375,23.6 L 120.9125,24.6625 L 120.2875,24.0375 L 119.63125,24.44375 L 119.44375,26.35 L 119.00625,26.7875 L 119.225,27.85 L 118.56875,28.2875 L 118.1625,27.85 L 118.56875,28.9125 L 117.725,29.35 L 117.50625,28.69375 L 116.6625,30.19375 L 116.6625,30.85 L 117.2875,31.475 L 117.725,31.69375 L 118.56875,31.475 L 118.7875,31.9125 L 119.63125,31.475 L 119.44375,31.9125 L 118.38125,32.5375 L 119.00625,32.5375 L 119.00625,32.975 L 119.63125,32.975 L 119.44375,33.6 L 120.9125,32.75625 L 120.9125,33.38125 L 120.06875,33.38125 L 120.50625,33.81875 L 119.44375,33.6 L 118.56875,33.6 L 119.00625,34.44375 L 118.56875,34.0375 L 118.7875,35.5375 L 118.1625,35.725 L 117.50625,34.25625 L 116.88125,34.0375 L 117.1,35.1 L 116.225,33.81875 L 116.0375,34.25625 L 115.81875,34.25625 L 116.225,34.88125 L 115.81875,35.31875 L 116.44375,35.5375 L 115.81875,35.5375 L 115.6,36.38125 L 115.6,35.725 L 115.1625,36.6 L 115.38125,35.31875 L 114.94375,34.88125 L 114.94375,34.0375 L 114.5375,34.6625 L 114.5375,33.81875 L 113.85,33.81875 Z",
  QLD: "M 204.81875,5.2875 L 203.31875,6.7875 L 202.06875,7.19375 L 202.25625,8.25625 L 201.63125,11.0375 L 201.19375,12.5375 L 200.7875,14.00625 L 200.56875,15.50625 L 200.35,14.00625 L 199.2875,15.725 L 198.44375,18.06875 L 199.50625,17.4125 L 199.9125,18.2875 L 199.9125,18.69375 L 200.7875,20.4125 L 199.50625,19.975 L 198.44375,20.81875 L 199.06875,22.75625 L 198.6625,23.6 L 197.56875,26.7875 L 198.6625,29.13125 L 198.00625,31.25625 L 198.85,35.1 L 197.56875,38.50625 L 196.94375,41.06875 L 197.38125,42.13125 L 195.88125,46.38125 L 194.1625,48.50625 L 193.75625,51.2875 L 191.81875,52.7875 L 188.225,53.63125 L 186.50625,52.56875 L 185.00625,52.35 L 184.1625,51.2875 L 182.6625,50.63125 L 182.25625,48.725 L 181.4125,47.88125 L 178.63125,47.0375 L 175.225,46.6 L 173.4125,44.19375 L 173.4125,117.35 L 194.1625,117.35 L 194.1625,134.2875 L 247.2875,134.35 L 248.1625,133.88125 L 248.1,133.35 L 248.81875,133.2875 L 248.9125,132.1625 L 250.00625,132.25625 L 250.7875,131.06875 L 252.6625,131.44375 L 253.94375,131.6625 L 255.38125,131.1625 L 256.50625,131.6 L 257.975,131.81875 L 258.56875,132.13125 L 260.19375,132.1625 L 261.31875,132.4125 L 261.975,133.25625 L 262.38125,133.75625 L 262.81875,134.44375 L 262.88125,135.1625 L 263.35,136.225 L 264.35,135.225 L 265.00625,134.4125 L 265.6625,133.63125 L 266.06875,134.31875 L 266.85,134.6 L 267.88125,134.13125 L 268.00625,133.56875 L 268.6625,132.7875 L 267.94375,132.85 L 267.6625,131.7875 L 267.75625,131.0375 L 268.6625,130.94375 L 270.4125,130.225 L 271.2875,129.6 L 272.225,129.88125 L 273.0375,130.69375 L 274.06875,130.225 L 276.06875,130.225 L 276.6,129.81875 L 277.50625,129.9125 L 278.475,129.88125 L 278.50625,129.44375 L 277.6625,128.6 L 277.06875,126.0375 L 276.6,124.13125 L 275.975,123.25625 L 275.75625,123.0375 L 274.88125,122.63125 L 275.5375,121.975 L 274.88125,121.35 L 275.75625,120.9125 L 275.1,120.2875 L 276.1625,120.9125 L 275.5375,119.00625 L 275.75625,117.94375 L 275.5375,115.81875 L 275.975,112.4125 L 275.1,111.5375 L 274.88125,111.75625 L 273.81875,110.69375 L 273.81875,109.4125 L 274.475,108.7875 L 274.25625,108.7875 L 274.0375,107.725 L 271.69375,107.06875 L 271.06875,105.1625 L 270.63125,103.88125 L 270.4125,104.31875 L 270.63125,103.6625 L 269.35,103.0375 L 268.2875,102.19375 L 267.225,99.4125 L 266.38125,99.19375 L 266.1625,98.35 L 265.5375,98.13125 L 265.1,98.56875 L 264.25625,98.56875 L 261.475,95.1625 L 260.85,96.00625 L 259.975,94.725 L 259.7875,93.225 L 260.19375,92.81875 L 259.56875,90.475 L 260.19375,88.75625 L 259.7875,87.69375 L 258.9125,87.2875 L 259.13125,86.225 L 258.9125,86.225 L 258.50625,86.00625 L 258.2875,86.63125 L 258.9125,87.69375 L 258.9125,88.56875 L 255.94375,86.4125 L 254.88125,84.725 L 254.0375,86.225 L 254.6625,87.69375 L 255.1,88.56875 L 253.38125,86.63125 L 252.1,88.13125 L 252.75625,86.63125 L 251.25625,86.225 L 252.1,85.7875 L 250.81875,82.81875 L 251.25625,80.475 L 250.19375,80.0375 L 249.975,78.5375 L 249.13125,78.975 L 249.5375,77.25625 L 248.69375,76.4125 L 248.06875,76.85 L 248.25625,76.00625 L 246.7875,76.00625 L 246.56875,75.35 L 245.94375,74.50625 L 245.50625,73.44375 L 246.13125,73.225 L 245.725,72.7875 L 246.56875,72.56875 L 247.63125,73.44375 L 246.35,71.31875 L 245.2875,70.88125 L 244.44375,70.0375 L 244.225,70.88125 L 242.725,69.81875 L 241.88125,68.75625 L 240.6,68.975 L 240.19375,67.475 L 239.975,68.5375 L 239.1,68.31875 L 237.85,67.0375 L 237.4125,64.69375 L 235.50625,65.75625 L 234.63125,63.85 L 233.7875,64.69375 L 233.1625,63.85 L 231.00625,63.00625 L 229.75625,61.50625 L 230.1625,59.1625 L 227.81875,56.6 L 228.88125,52.975 L 228.475,51.2875 L 227.19375,48.94375 L 226.5375,48.1 L 224.00625,44.69375 L 224.4125,43.63125 L 224.4125,42.13125 L 223.56875,41.06875 L 223.35,38.725 L 222.50625,37.88125 L 223.56875,36.6 L 222.725,35.5375 L 223.56875,34.475 L 222.725,33.6 L 221.44375,33.4125 L 220.56875,32.13125 L 219.1,31.69375 L 218.0375,28.9125 L 216.75625,29.975 L 215.9125,29.56875 L 215.475,30.85 L 214.19375,31.475 L 213.13125,30.63125 L 212.50625,27.85 L 211.4125,26.1625 L 211.85,24.0375 L 211.225,21.9125 L 210.7875,18.475 L 209.50625,17.63125 L 209.50625,16.7875 L 208.44375,16.56875 L 208.225,15.06875 L 209.50625,14.00625 L 208.44375,13.6 L 207.6,13.81875 L 206.94375,13.1625 L 206.94375,9.975 L 206.1,7.4125 L 205.475,7.4125 L 205.0375,6.56875 L 205.0375,6.975 L 204.19375,7.4125 L 205.25625,5.69375 L 204.81875,5.2875 Z",
  SA: "M 194.1625,207.7875 L 194.1625,179.38125 L 194.1625,134.2875 L 194.1625,117.35 L 173.4125,117.35 L 113.85,117.35 L 113.85,156.31875 L 114.31875,156.06875 L 120.9125,155.4125 L 121.975,155.19375 L 126.25625,155.63125 L 128.6,154.35 L 132.63125,156.475 L 135.63125,158.81875 L 137.5375,158.81875 L 139.225,158.19375 L 141.7875,160.31875 L 144.35,160.31875 L 144.975,159.25625 L 147.31875,161.6 L 146.69375,162.88125 L 147.975,162.225 L 148.81875,162.44375 L 149.6625,164.1625 L 149.0375,165.00625 L 148.19375,164.35 L 148.6,165.225 L 148.19375,165.85 L 149.0375,166.06875 L 148.6,166.69375 L 149.88125,167.975 L 150.1,167.975 L 150.725,167.56875 L 152.00625,168.4125 L 151.38125,167.7875 L 152.44375,167.975 L 153.2875,170.13125 L 153.2875,171.38125 L 155.63125,173.5375 L 156.9125,179.2875 L 157.75625,179.475 L 155.85,178.4125 L 155.19375,179.2875 L 158.63125,182.0375 L 159.69375,181.4125 L 160.75625,182.69375 L 161.1625,180.35 L 160.5375,178.85 L 161.38125,178.4125 L 161.81875,178.85 L 161.81875,177.35 L 165.00625,173.725 L 167.56875,172.44375 L 167.7875,172.25625 L 169.25625,171.81875 L 170.75625,167.56875 L 172.0375,166.06875 L 172.88125,166.50625 L 172.88125,162.225 L 173.94375,164.56875 L 174.1625,166.50625 L 174.7875,167.13125 L 173.1,168.63125 L 174.38125,170.975 L 171.81875,173.5375 L 171.19375,175.44375 L 171.19375,176.94375 L 170.5375,178.19375 L 171.19375,179.25625 L 170.75625,181.81875 L 170.31875,182.25625 L 167.7875,181.6 L 166.69375,184.81875 L 168.85,184.6 L 170.5375,183.31875 L 172.0375,183.94375 L 172.88125,183.5375 L 173.50625,180.75625 L 173.725,178.63125 L 175.00625,175.6625 L 178.00625,180.81875 L 177.35,185.44375 L 175.00625,187.56875 L 178.00625,187.7875 L 179.25625,186.725 L 180.35,186.94375 L 183.5375,189.475 L 184.9125,191.63125 L 184.6,190.35 L 185.88125,193.13125 L 186.94375,196.5375 L 185.6625,198.6625 L 186.50625,199.94375 L 187.7875,202.9125 L 190.25625,206.225 L 191.63125,207.6 L 194.1625,207.7875 Z M 172.887,189.499 L 173.1,188.433 L 171.608,188.433 L 172.035,187.156 L 165.007,188.646 L 164.581,189.711 L 165.86,191.202 L 167.777,190.989 L 169.267,190.563 L 170.97,191.415 L 171.822,190.776 L 172.035,189.923 L 174.804,189.923 L 175.229,189.072 L 173.738,188.433 L 172.887,189.499 Z",
  NSW: "M 271.2875,129.6 L 270.4125,130.225 L 269.75625,130.85 L 268.6625,130.94375 L 267.75625,131.0375 L 267.6625,131.7875 L 267.94375,132.85 L 268.6625,132.7875 L 268.00625,133.56875 L 267.88125,134.13125 L 266.85,134.6 L 266.06875,134.31875 L 265.6625,133.63125 L 265.00625,134.4125 L 264.35,135.225 L 264.0375,135.7875 L 263.35,136.225 L 262.88125,135.1625 L 262.81875,134.44375 L 262.38125,133.75625 L 261.975,133.25625 L 261.31875,132.4125 L 260.19375,132.1625 L 258.56875,132.13125 L 257.975,131.81875 L 257.225,131.5375 L 256.50625,131.6 L 256.2875,131.06875 L 255.38125,131.1625 L 253.94375,131.6625 L 252.6625,131.44375 L 251.35,131.0375 L 250.7875,131.06875 L 250.00625,132.25625 L 248.9125,132.1625 L 248.81875,133.2875 L 248.1,133.35 L 248.1625,133.88125 L 247.2875,134.35 L 194.1625,134.2875 L 194.1625,179.35 L 194.225,179.6 L 195.35,179.4125 L 197.19375,180.2875 L 198.225,179.56875 L 199.975,179.85 L 202.1,180.1 L 203.81875,181.5375 L 204.31875,183.56875 L 205.4125,184.5375 L 205.44375,183.56875 L 206.50625,183.0375 L 207.475,183.25625 L 209.19375,183.38125 L 210.19375,183.7875 L 210.81875,186.5375 L 212.25625,188.6 L 213.38125,188.63125 L 215.00625,189.31875 L 216.975,191.1 L 217.35,192.38125 L 218.63125,193.31875 L 220.25625,194.00625 L 221.56875,193.81875 L 221.31875,192.35 L 221.81875,191.69375 L 222.5375,191.6 L 223.38125,192.0375 L 225.225,191.75625 L 226.6625,192.475 L 227.56875,192.35 L 228.7875,192.9125 L 229.975,193.13125 L 230.63125,192.44375 L 231.50625,192.13125 L 232.56875,192.725 L 234.50625,193.19375 L 235.975,192.7875 L 237.0375,192.44375 L 237.7875,192.31875 L 238.50625,192.0375 L 239.4125,191.69375 L 240.81875,192.44375 L 240.63125,193.6 L 241.19375,194.81875 L 241.9125,195.85 L 242.25625,196.94375 L 242.1,198.2875 L 250.2875,202.35 L 252.00625,202.475 L 252.725,203.13125 L 253.38125,203.13125 L 254.44375,203.13125 L 254.225,201.4125 L 254.6625,201.19375 L 254.6625,200.13125 L 253.81875,199.9125 L 254.225,199.06875 L 253.81875,198.00625 L 254.6625,196.725 L 255.50625,193.31875 L 255.2875,191.19375 L 255.725,189.9125 L 256.35,189.06875 L 255.725,188.225 L 256.56875,188.4125 L 258.2875,184.38125 L 259.75625,183.94375 L 259.13125,182.6625 L 260.19375,183.1 L 259.75625,181.81875 L 260.19375,180.75625 L 260.63125,179.25625 L 260.19375,178.63125 L 260.85,178.4125 L 260.85,176.9125 L 262.5375,175.225 L 262.975,174.7875 L 261.69375,174.38125 L 263.1625,174.1625 L 263.38125,173.1 L 263.6,171.38125 L 263.6,171.1625 L 263.6,169.9125 L 264.44375,170.31875 L 264.6625,169.25625 L 265.1,168.85 L 265.725,167.13125 L 265.50625,167.13125 L 265.50625,166.2875 L 265.725,167.13125 L 266.6,165.63125 L 266.7875,165.225 L 266.7875,165.85 L 269.35,164.35 L 267.6625,164.7875 L 267.44375,164.56875 L 267.85,164.1625 L 267.6625,163.725 L 268.50625,164.1625 L 269.13125,163.725 L 270.19375,162.88125 L 271.69375,162.00625 L 271.9125,160.31875 L 271.25625,160.1 L 270.4125,160.1 L 271.475,160.1 L 271.69375,158.6 L 273.19375,157.35 L 275.1,151.1625 L 274.88125,146.9125 L 276.38125,143.06875 L 276.6,142.4125 L 277.225,138.81875 L 277.225,138.6 L 277.0375,137.75625 L 278.725,134.5375 L 278.725,134.35 L 278.94375,132.63125 L 278.2875,131.7875 L 278.475,129.88125 L 277.50625,129.9125 L 276.6,129.81875 L 276.06875,130.225 L 275.56875,130.44375 L 275.00625,130.50625 L 274.06875,130.225 L 273.0375,130.69375 L 272.225,129.88125 L 271.2875,129.6 Z",
  VIC: "M 253.1625,203.75625 L 252.5375,203.13125 L 252.725,203.13125 L 252.00625,202.475 L 250.2875,202.35 L 242.1,198.2875 L 242.25625,196.94375 L 241.9125,195.85 L 241.19375,194.81875 L 240.63125,193.6 L 240.81875,192.44375 L 239.4125,191.69375 L 238.50625,192.0375 L 237.7875,192.31875 L 237.0375,192.44375 L 235.975,192.7875 L 234.50625,193.19375 L 232.56875,192.725 L 231.50625,192.13125 L 230.63125,192.44375 L 229.975,193.13125 L 228.7875,192.9125 L 227.56875,192.35 L 226.6625,192.475 L 225.225,191.75625 L 223.38125,192.0375 L 222.5375,191.6 L 221.81875,191.69375 L 221.31875,192.35 L 221.56875,193.81875 L 220.25625,194.00625 L 218.63125,193.31875 L 217.35,192.38125 L 216.975,191.1 L 215.00625,189.31875 L 213.38125,188.63125 L 212.25625,188.6 L 210.81875,186.5375 L 210.19375,183.7875 L 209.19375,183.38125 L 207.475,183.25625 L 206.50625,183.0375 L 205.44375,183.56875 L 205.4125,184.5375 L 204.31875,183.56875 L 203.81875,181.5375 L 202.1,180.1 L 199.975,179.85 L 198.225,179.56875 L 197.19375,180.2875 L 195.35,179.4125 L 194.225,179.6 L 194.1625,179.38125 L 194.1625,207.7875 L 194.6,207.81875 L 196.94375,209.725 L 196.94375,210.7875 L 198.225,211.00625 L 199.50625,209.50625 L 202.06875,210.7875 L 203.75625,210.35 L 211.63125,214.63125 L 214.85,211.44375 L 217.38125,209.725 L 219.31875,208.44375 L 217.81875,208.88125 L 216.975,208.225 L 220.7875,206.1 L 222.06875,208.6625 L 220.7875,210.35 L 220.7875,211.63125 L 222.06875,210.7875 L 222.725,211.00625 L 222.9125,209.2875 L 224.4125,209.2875 L 224.85,210.56875 L 224.00625,210.7875 L 223.7875,212.06875 L 225.25625,213.13125 L 226.75625,212.9125 L 227.4125,215.0375 L 228.25625,214.4125 L 229.1,214.85 L 229.75625,215.9125 L 230.81875,216.975 L 231.225,214.19375 L 229.5375,213.35 L 231.6625,213.35 L 234.19375,212.50625 L 238.25625,208.225 L 241.0375,206.5375 L 237.63125,208.00625 L 239.5375,206.75625 L 238.9125,206.1 L 240.38125,206.5375 L 242.1,205.88125 L 251.25625,205.475 L 253.1625,203.75625 Z",
  TAS: "M 243.377,238.692 L 242.952,237.415 L 243.59,235.711 L 242.952,235.073 L 243.59,233.368 L 241.887,231.239 L 240.821,231.026 L 240.397,232.304 L 239.118,231.665 L 237.627,233.368 L 236.563,232.729 L 235.498,233.582 L 234.646,233.156 L 233.156,233.794 L 234.22,234.86 L 232.729,233.794 L 231.666,234.646 L 231.452,234.433 L 229.536,234.86 L 224.637,231.877 L 223.359,231.877 L 222.082,231.452 L 219.1,230.387 L 219.314,232.09 L 218.674,233.368 L 219.525,236.989 L 221.017,239.119 L 222.721,242.313 L 222.721,244.229 L 223.359,243.59 L 224.424,245.507 L 224.211,245.721 L 222.294,244.016 L 222.932,247.85 L 224.637,251.257 L 225.702,251.683 L 226.766,254.026 L 227.406,254.026 L 227.406,252.96 L 227.832,254.239 L 229.536,254.239 L 227.832,254.877 L 228.044,256.369 L 229.536,255.729 L 231.876,256.156 L 232.516,257.007 L 233.793,257.007 L 234.646,255.729 L 234.433,254.239 L 235.286,253.813 L 234.433,252.749 L 234.646,252.96 L 235.073,253.387 L 235.286,252.749 L 236.136,253.813 L 236.35,251.47 L 236.99,250.406 L 235.923,248.702 L 237.414,250.619 L 237.414,251.683 L 238.267,251.044 L 238.693,249.767 L 239.118,250.406 L 239.97,250.193 L 241.035,248.276 L 240.397,247.211 L 241.248,246.785 L 241.46,245.082 L 241.887,243.165 L 242.525,243.165 L 242.738,241.674 L 243.377,243.377 L 243.377,244.656 L 243.804,244.016 L 243.165,242.526 L 243.377,238.692 Z",
};
const NT_MELVILLE_ISLAND = "M 125.184,12.525 L 127.313,13.803 L 129.443,12.525 L 130.082,11.461 L 130.722,11.673 L 130.722,10.821 L 131.36,10.609 L 130.509,9.331 L 129.656,9.331 L 128.805,9.544 L 129.231,10.609 L 128.38,9.757 L 127.954,9.545 L 127.954,10.822 L 127.528,9.757 L 126.889,9.545 L 125.611,9.971 L 126.463,11.249 L 125.398,9.758 L 124.972,10.184 L 124.972,9.332 L 123.481,8.48 L 124.006,11.277 L 123.269,11.462 L 123.694,11.036 L 123.694,10.397 L 123.269,9.545 L 121.778,10.61 L 122.63,11.036 L 122.204,11.036 L 122.204,11.888 L 122.416,12.527 L 121.991,12.314 L 121.352,11.888 L 121.352,12.74 L 120.926,12.74 L 124.972,13.166 L 125.184,12.525 Z";

const STATE_LABELS = {
  WA:  { x: 65,  y: 112, fs: 10 },
  NT:  { x: 144, y: 70,  fs: 8  },
  QLD: { x: 215, y: 100, fs: 9  },
  SA:  { x: 155, y: 138, fs: 8  },
  NSW: { x: 230, y: 162, fs: 7  },
  VIC: { x: 220, y: 204, fs: 7  },
  TAS: { x: 230, y: 246, fs: 7  },
};

const STATE_BORDERS = [
  [113.85, 33.81875,  113.85, 156.31875 ],  // WA/NT/SA west vertical
  [113.85, 117.35,    173.4125, 117.35   ],  // NT/SA horizontal
  [173.4125, 44.19375, 173.4125, 117.35  ],  // NT/QLD vertical
  [173.4125, 117.35,  194.1625, 117.35   ],  // SA/QLD segment
  [194.1625, 117.35,  194.1625, 134.2875 ],  // SA/QLD/NSW transition
  [194.1625, 134.2875, 247.2875, 134.35  ],  // QLD/NSW border
  [194.1625, 179.38125, 253.1625, 203.75625], // NSW/VIC border
  [194.1625, 179.38125, 194.1625, 207.7875],  // SA/VIC border
];

function AustraliaMap({ hoveredState, selectedState, onHover, onSelect }) {
  const anySelected = !!selectedState;
  const mainStates = ['WA', 'NT', 'QLD', 'SA', 'NSW', 'VIC', 'TAS'];

  const getStateFill = (key) => {
    const meta = STATE_META[key];
    if (selectedState === key) return `${meta.color}BF`;
    if (hoveredState === key) return `${meta.color}88`;
    return '#EDE8DC';
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#4BBFBF' }}>
      <svg viewBox="-0.4 -0.4 291 263" className="w-full block"
        aria-label="Map of Australia — select a state to begin">
        <defs>
          <filter id="aus-veg-blur" x="-8%" y="-8%" width="116%" height="116%">
            <feGaussianBlur stdDeviation="2.8" />
          </filter>
          <filter id="aus-state-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Teal ocean */}
        <rect x="-1" y="-1" width="292" height="264" fill="#4BBFBF" />

        {/* Coastal vegetation halo — WA outline blurred green behind all fills */}
        <path d={STATE_PATHS.WA} fill="#9ECFBA" filter="url(#aus-veg-blur)" opacity="0.9"
          style={{ pointerEvents: 'none' }} />

        {/* State fills — each real geographic path, individually interactive */}
        {mainStates.map(key => {
          const meta = STATE_META[key];
          const isHov = hoveredState === key;
          const isSel = selectedState === key;
          const active = isHov || isSel;
          const isDimmed = anySelected && !active;
          return (
            <path key={key}
              d={STATE_PATHS[key]}
              style={{
                fill: getStateFill(key),
                stroke: active ? meta.color : '#8B8070',
                strokeWidth: active ? 1 : 0.4,
                opacity: isDimmed ? 0.45 : 1,
                cursor: 'pointer',
                transition: 'fill 0.2s ease, opacity 0.2s ease',
                filter: isSel ? 'url(#aus-state-glow)' : undefined,
              }}
              onClick={() => onSelect(key)}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })}

        {/* NT Melville Island — same click target as NT */}
        {(() => {
          const key = 'NT';
          const meta = STATE_META[key];
          const isHov = hoveredState === key;
          const isSel = selectedState === key;
          const active = isHov || isSel;
          const isDimmed = anySelected && !active;
          return (
            <path d={NT_MELVILLE_ISLAND}
              style={{
                fill: getStateFill(key),
                stroke: active ? meta.color : '#8B8070',
                strokeWidth: active ? 1 : 0.4,
                opacity: isDimmed ? 0.45 : 1,
                cursor: 'pointer',
                transition: 'fill 0.2s ease, opacity 0.2s ease',
              }}
              onClick={() => onSelect(key)}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
            />
          );
        })()}

        {/* Dashed internal state border lines */}
        {STATE_BORDERS.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            style={{ stroke: '#8B8070', strokeWidth: 0.7, strokeDasharray: '3,2.5', pointerEvents: 'none' }} />
        ))}

        {/* State abbreviation labels */}
        {mainStates.map(key => {
          const lbl = STATE_LABELS[key];
          const meta = STATE_META[key];
          const active = hoveredState === key || selectedState === key;
          const isDimmed = anySelected && !active;
          return (
            <text key={key} x={lbl.x} y={lbl.y} textAnchor="middle"
              style={{
                fontSize: lbl.fs,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: active ? 900 : 700,
                fill: active ? '#ffffff' : '#3D3830',
                opacity: isDimmed ? 0.3 : 1,
                pointerEvents: 'none',
                userSelect: 'none',
                transition: 'fill 0.2s ease, opacity 0.2s ease',
              }}>
              {key}
            </text>
          );
        })}

        {/* ACT — small circle marker within NSW */}
        {(() => {
          const key = 'ACT';
          const meta = STATE_META[key];
          const isHov = hoveredState === key;
          const isSel = selectedState === key;
          const active = isHov || isSel;
          const isDimmed = anySelected && !active;
          return (
            <g style={{ cursor: 'pointer' }}
              onClick={() => onSelect(key)}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}>
              <circle cx={245.9} cy={188} r={5}
                style={{
                  fill: isSel ? `${meta.color}BF` : isHov ? `${meta.color}88` : '#EDE8DC',
                  stroke: active ? meta.color : '#8B8070',
                  strokeWidth: active ? 1 : 0.6,
                  opacity: isDimmed ? 0.45 : 1,
                  transition: 'fill 0.2s ease, stroke 0.2s ease, opacity 0.2s ease',
                }} />
              <text x={252} y={191} textAnchor="start"
                style={{
                  fontSize: 5,
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 700,
                  fill: active ? '#ffffff' : '#3D3830',
                  opacity: isDimmed ? 0.3 : 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                ACT
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function StateDetailPanel({ state: activeState, selectedState, onContinue }) {
  if (!activeState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-center px-6 py-8">
        <MapPin className="w-7 h-7 mb-3 opacity-30" style={{ color: 'var(--A-text-mute)' }} />
        <div className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--A-text-mute)' }}>
          Hover a state to preview
        </div>
      </div>
    );
  }
  const meta = STATE_META[activeState];
  const leagueCount = LEAGUES_BY_STATE(activeState).length;
  return (
    <div className="px-5 py-6">
      <div className="font-display text-7xl leading-none tracking-wider" style={{ color: meta.color }}>
        {activeState}
      </div>
      <div className="text-[10px] uppercase tracking-widest font-mono font-bold mt-1" style={{ color: meta.color }}>
        {meta.tagline}
      </div>
      <p className="text-sm mt-4 leading-relaxed text-atext-dim">
        {meta.desc}
      </p>
      <ul className="mt-4 space-y-2">
        {meta.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-atext-dim">
            <span className="mt-0.5 flex-shrink-0" style={{ color: meta.color }}>▸</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 font-mono text-[11px] text-atext-mute">
        {leagueCount} league{leagueCount === 1 ? '' : 's'}
      </div>
      {selectedState === activeState && (
        <button type="button" onClick={onContinue}
          className="mt-6 w-full py-3 rounded-xl font-display text-lg tracking-widest transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))',
            color: '#0A0A0A',
            boxShadow: '0 4px 16px color-mix(in srgb, var(--A-accent) 30%, transparent)',
          }}>
          Start in {selectedState} →
        </button>
      )}
    </div>
  );
}

function SetupPyramidHint({ state, tier, leagueKey }) {
  if (!state) return null;
  const nInState =
    leagueKey && PYRAMID[leagueKey]
      ? PYRAMID[leagueKey].clubs.filter((c) => c.state === state).length
      : 0;
  const k = tier === 3 && leagueKey ? tier3DivisionCount(leagueKey, state) : null;
  return (
    <div className="rounded-xl border border-aline/70 bg-apanel/45 px-4 py-3 max-w-2xl mb-6">
      <p className="text-[11px] text-atext-dim leading-relaxed">
        <span className="font-mono text-[10px] text-aaccent uppercase tracking-widest">Pyramid</span>{' '}
        AFL nationally, then your state league, then local clubs. When a league has enough teams in your state, it
        spans up to <strong className="text-atext">{LOCAL_DIVISION_COUNT}</strong> parallel ladders (roughly one new ladder
        per <strong className="text-atext">{TIER3_CLUBS_PER_DIVISION_TARGET}</strong> clubs, and never thinner than{' '}
        <strong className="text-atext">{TIER3_MIN_CLUBS_PER_DIVISION}</strong> teams per ladder when the pool is large enough).
        Division 1 is the promotion race; higher numbers are deeper suburban pools.
        {k != null && nInState > 0 ? (
          <>
            {' '}<strong className="text-atext">{PYRAMID[leagueKey]?.short}</strong> here:{' '}
            <strong className="text-aaccent">{k}</strong> division{k === 1 ? '' : 's'}, {nInState} clubs in {state}.
          </>
        ) : tier === 3 ? (
          <> Pick a league below to see how many divisions that pool uses.</>
        ) : null}
      </p>
      {k != null && k > 1 && (
        <div className="mt-3 flex items-end justify-center gap-1.5 h-11 px-2" aria-hidden>
          {Array.from({ length: k }, (_, i) => (
            <div key={i} title={`Division ${i + 1}`}
              className="flex-1 max-w-[56px] rounded-t border border-aaccent/30 bg-gradient-to-t from-aaccent/25 to-aaccent/40"
              style={{ height: `${36 + ((i + 1) / k) * 100}%`, minHeight: 22 }} />
          ))}
        </div>
      )}
    </div>
  );
}

function loadSetup() {
  try { return JSON.parse(sessionStorage.getItem(SETUP_SS_KEY) || '{}'); } catch { return {}; }
}
function saveSetup(patch) {
  try { sessionStorage.setItem(SETUP_SS_KEY, JSON.stringify({ ...loadSetup(), ...patch })); } catch {}
}

function fmtSavedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
}

const CHALLENGE_SCENARIOS = [
  { id: 'under_the_pump', title: 'Under the Pump',  sub: 'Tight cash, nervous board — survive the season.' },
  { id: 'flag_or_sack',   title: 'Flag or Sack',    sub: 'Top-four required or the board pulls the pin.' },
  { id: 'rebuild',        title: 'Rebuild',          sub: 'Bottom-half list, youth focus, patient board.' },
  { id: 'local_hero',     title: 'Local Hero',       sub: 'Tier 3 only — promotion within three years.' },
];

// Shared motion transition
const slideIn = {
  initial:    { opacity: 0, y: 14 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -12 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

// ---------------------------------------------------------------------------
// Career construction — shared by the manual setup flow and Quick Start.
// Builds (but does not commit) a brand-new career object. Throws on invalid
// selections so callers can surface the error.
// ---------------------------------------------------------------------------
export function buildNewCareer({
  clubId,
  leagueKey,
  state,
  localDivision = 5,
  managerName = "",
  difficulty = "contender",
  gameMode = "normal",
  challengeId = null,
  existingSlots = {},
}) {
  const club = findClub(clubId);
  const league = PYRAMID[leagueKey];
  if (!club) throw new Error(`Club not found: ${clubId}`);
  if (!league) throw new Error(`League not found: ${leagueKey}`);
  const SEASON = 2026;
  const cfg = getDifficultyConfig(difficulty);
  let tunedFinance = makeStartingFinance(league.tier, difficulty, 55);
  if (gameMode === 'sandbox') {
    tunedFinance = {
      ...tunedFinance,
      cash: Math.round(tunedFinance.cash * 2),
      boardConfidence: Math.min(95, (tunedFinance.boardConfidence ?? 55) + 18),
    };
  } else if (gameMode === 'challenge') {
    const ch = challengeId || 'under_the_pump';
    if (ch === 'flag_or_sack') {
      tunedFinance = {
        ...tunedFinance,
        boardConfidence: Math.max(42, (tunedFinance.boardConfidence ?? 55) - 6),
      };
    } else if (ch === 'rebuild') {
      tunedFinance = {
        ...tunedFinance,
        cash: Math.round(tunedFinance.cash * 0.85),
        boardConfidence: Math.min(88, (tunedFinance.boardConfidence ?? 55) + 12),
      };
    } else {
      tunedFinance = {
        ...tunedFinance,
        cash: Math.round(tunedFinance.cash * 0.72),
        boardConfidence: Math.max(38, (tunedFinance.boardConfidence ?? 55) - 14),
      };
    }
  }
  const tier3KStart = league.tier === 3 ? tier3DivisionCount(leagueKey, state) : 0;
  const startDiv = league.tier === 3 ? Math.min(localDivision, tier3KStart) : null;
  const compClubs = getCompetitionClubs(leagueKey, state, startDiv);
  if (!compClubs.some((row) => row.id === clubId)) throw new Error('Selected club is not in this competition pool.');
  const ladder0 = blankLadder(compClubs);
  const squadRaw = generateSquad(clubId, league.tier, 32, SEASON).map(p => ({ ...p, traits: rollPlayerTrait() ? [rollPlayerTrait()] : [] }));
  const squad = scaledSquadToFitCap({ clubId, leagueKey, difficulty, finance: tunedFinance, squad: squadRaw });
  const lineup = squad.slice().sort((a, b) => b.overall - a.overall).slice(0, LINEUP_CAP).map(p => p.id);
  const fixtures = generateFixtures(compClubs);
  const byeMap = generateByeRounds(compClubs.map(cl => cl.id), fixtures.length);
  const eventQueue = generateSeasonCalendar(SEASON, compClubs, fixtures, clubId, {
    nationalDraft: league.tier === 1,
  });
  const facilities = DEFAULT_FACILITIES();
  const clubGround = getClubGround(club, facilities.stadium.level, league.tier);
  const isFirstCareer = !existingSlots || Object.keys(existingSlots).length === 0;
  const startingSponsors = buildStartingSponsors(league.tier);
  const newCareer = {
    managerName: managerName || "Coach",
    clubId,
    leagueKey,
    regionState: state,
    localDivision: startDiv,
    season: SEASON,
    week: 0,
    currentDate: `${SEASON - 1}-11-01`,
    phase: 'preseason',
    eventQueue,
    lastEvent: null,
    inMatchDay: false,
    currentMatchResult: null,
    squad,
    lineup,
    training: DEFAULT_TRAINING(),
    facilities,
    finance: tunedFinance,
    sponsors: startingSponsors,
    staff: generateStaff(league.tier),
    staffTasks: DEFAULT_STAFF_TASKS(),
    kits: defaultKits(club.colors),
    ladder: ladder0,
    fixtures,
    byeMap,
    tradePool: generateTradePool(leagueKey, SEASON),
    draftPool: [],
    youth: { recruits: [], zone: club.state, programLevel: 1, scoutFocus: "All-rounders" },
    news: [
      { week: 0, type: "draw", text: `${managerName || "Coach"} appointed at ${club.name}. Pre-season begins Dec 1.` },
      { week: 0, type: "info", text: "🤝 One local sponsor is on the books. Win games and build the club's reputation to attract bigger backers." },
      ...(gameMode === 'sandbox'
        ? [{ week: 0, type: 'info', text: '🧪 Sandbox: boosted treasury & board patience — sacks and confidence votes are disabled.' }]
        : []),
      ...(gameMode === 'challenge'
        ? [{ week: 0, type: 'board', text: '🔥 Challenge — Under the pump: leaner cash and a jumpy board from day one.' }]
        : []),
    ],
    weeklyHistory: [],
    inFinals: false,
    finalsRound: 0,
    finalsFixtures: [],
    finalsResults: [],
    premiership: null,
    tacticChoice: "balanced",
    seasonHistory: [],
    saveVersion: SAVE_VERSION,
    aiSquads: {},
    draftOrder: [],
    history: [],
    brownlow: {},
    boardWarning: 0,
    gameOver: null,
    themeMode: 'A',
    options: {
      autosave: true,
      confirmBeforeNewCareer: true,
      confirmBeforeDeleteSlot: true,
      uiDensity: 'comfortable',
      reduceMotion: false,
      theme: (() => { try { return localStorage.getItem('fd-theme') ?? 'light'; } catch { return 'light'; } })(),
    },
    pendingTradeOffers: [],
    inbox: [],
    retiredThisSeason: [],
    difficulty,
    gameMode,
    challengeId: gameMode === 'challenge' ? (challengeId || 'under_the_pump') : null,
    challengeGoal: gameMode === 'challenge' ? challengeId : null,
    tutorialStep: isFirstCareer && cfg.tutorialPolicy !== 'never' ? 0 : 6,
    tutorialComplete: !(isFirstCareer && cfg.tutorialPolicy !== 'never'),
    isFirstCareer,
    committee: generateCommittee(league.tier),
    footyTripAvailable: false,
    footyTripUsed: false,
    groundCondition: 85,
    clubGround,
    groundName: clubGround.shortName,
    weeklyWeather: {},
    winStreak: 0,
    homeWinStreak: 0,
    coachReputation: league.tier === 4 ? 5 : 30,
    coachTier: league.tier === 4 ? 'Grassroots' : 'Journeyman',
    coachAccreditation: startingAccreditationForTier(league.tier),
    tier3Div1Titles: 0,
    lastPromotionPlayoff: null,
    coachStats: {
      totalWins: 0, totalLosses: 0, totalDraws: 0,
      premierships: 0, promotions: 0, relegations: 0,
      clubsManaged: 1, seasonsManaged: 1,
    },
    previousClubs: [],
    isSacked: false,
    jobMarketOpen: false,
    sackingStep: null,
    jobOffers: [],
    boardVotePrepBonus: 0,
    jobMarketRerolls: 0,
    arrivalBriefing: null,
    journalist: generateJournalist(),
    lastBoardConfidenceDelta: 0,
    lastMatchSummary: null,
    lastFinanceTickWeek: null,
    lastFinanceTickDay: null,
    cashCrisisStartWeek: null,
    cashCrisisLevel: 0,
    bankLoan: null,
    sponsorRenewalProposals: [],
    sponsorOffers: [],
    expiredSponsorsLastSeason: [],
    pendingRenewals: [],
    renewalsClosed: false,
    pendingStaffRenewals: [],
    fundraisersUsed: {},
    communityGrantUsed: false,
    lastEosFinance: null,
    postSeasonPhase: 'none',
    inTradePeriod: false,
    tradePeriodDay: 0,
    freeAgencyOpen: false,
    postSeasonDraftCountdown: null,
    freeAgentBalance: { gained: 0, lost: 0 },
    tradeHistory: [],
    draftPickBank: null,
    offSeasonFreeAgents: [],
    clubCulture: defaultClubCulture(),
    headToHead: {},
    finalsRivalryLog: [],
    captainId: null,
    viceCaptainId: null,
    captainHistory: [],
    bogeyTeamId: null,
    dominatedTeamId: null,
    crucialFive: [],
    crisisFiredThisSeason: false,
    teamStats: null,
    retiredPlayers: [],
  };
  assignDefaultCaptains(newCareer);
  ensureCareerBoard(newCareer, club, league);
  generateSeasonObjectives(newCareer, league);
  planSeasonBoardMeetings(newCareer);
  primeSeasonStoryState(newCareer);
  // First-ever draft is fully scouted so new players can read the board.
  seedNationalDraft(newCareer, league, { inaugural: true, force: true, revealAll: true });
  return newCareer;
}

// Curated beginner default: a random Tier-3 community underdog in Victoria on
// Grassroots difficulty (patient board, low expectations). Picks from a live
// competition pool so the selection is always valid. Returns a ready career.
export function quickStartCareer({ existingSlots = {}, managerName = "" } = {}) {
  const state = "VIC";
  const tier3Leagues = LEAGUES_BY_STATE(state).filter(l => !l.isAcademy && l.tier === 3);
  const league = tier3Leagues[0];
  if (!league) throw new Error("No Tier 3 league available for Quick Start.");
  const k = tier3DivisionCount(league.key, state) || 1;
  // Deepest division = lowest pressure, the gentlest possible start.
  const localDivision = k;
  const pool = getCompetitionClubs(league.key, state, localDivision);
  if (!pool.length) throw new Error("No clubs available for Quick Start.");
  const club = pool[Math.floor(Math.random() * pool.length)];
  return buildNewCareer({
    clubId: club.id,
    leagueKey: league.key,
    state,
    localDivision,
    managerName,
    difficulty: "grassroots",
    gameMode: "normal",
    existingSlots,
  });
}

export function CareerSetup({ onStart, onQuickStart, existingSlots = {}, onResume, themeClass = 'dirV4' }) {
  const saved = loadSetup();
  const [gameMode, setGameMode] = useState(saved.gameMode ?? 'normal');
  const [challengeId, setChallengeId] = useState(saved.challengeId ?? 'under_the_pump');
  const [prefsUi, setPrefsUi] = useState(() => getPlayerPrefs());
  const [step, _setStep] = useState(saved.step ?? 0);
  const [state, _setSelState] = useState(saved.state ?? null);
  const [tier, _setTier] = useState(saved.tier ?? null);
  const [leagueKey, _setLeagueKey] = useState(saved.leagueKey ?? null);
  const [clubId, _setClubId] = useState(saved.clubId ?? null);
  const [localDivision, _setLocalDivision] = useState(saved.localDivision ?? 5);
  const [managerName, _setManagerName] = useState(saved.managerName ?? "");
  const [difficulty, _setDifficulty] = useState(saved.difficulty ?? 'contender');
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState(null);
  const slotsWithSaves = SLOT_IDS.filter(s => existingSlots && existingSlots[s]);
  const [hoveredState, setHoveredState] = useState(null);
  const [regionFilter, setRegionFilter] = useState(null);

  const setStep          = (v) => { saveSetup({ step: v });        _setStep(v); };
  const setSelState      = (v) => { saveSetup({ state: v });       _setSelState(v); };
  const setTier          = (v) => { saveSetup({ tier: v });        _setTier(v); };
  const setLeagueKey     = (v) => { saveSetup({ leagueKey: v });   _setLeagueKey(v); };
  const setClubId        = (v) => { saveSetup({ clubId: v });      _setClubId(v); };
  const setManagerName   = (v) => { saveSetup({ managerName: v }); _setManagerName(v); };
  const setDifficulty    = (v) => { saveSetup({ difficulty: v });  _setDifficulty(v); };
  const setLocalDivision = (v) => {
    saveSetup({ localDivision: v, clubId: null });
    _setLocalDivision(v);
    _setClubId(null);
  };
  const setGameModePersist = (v) => { saveSetup({ gameMode: v });    setGameMode(v); };
  const setChallengePersist = (v) => { saveSetup({ challengeId: v }); setChallengeId(v); };

  useEffect(() => {
    if (tier !== 3 || !leagueKey || !state) return;
    const k = tier3DivisionCount(leagueKey, state);
    if (localDivision > k) setLocalDivision(k);
  }, [tier, leagueKey, state, localDivision]);

  useEffect(() => { setRegionFilter(null); }, [state, tier]);

  const tier3K             = tier === 3 && leagueKey && state ? tier3DivisionCount(leagueKey, state) : 0;
  const effectiveTier3Div  = tier === 3 && tier3K ? Math.min(localDivision, tier3K) : localDivision;
  const availableClubs     = leagueKey ? getCompetitionClubs(leagueKey, state, tier === 3 ? effectiveTier3Div : null) : [];
  const availableLeagues   = state ? LEAGUES_BY_STATE(state).filter(l => !l.isAcademy && (tier ? l.tier === tier : true)) : [];
  const tiersForState      = state ? [1, 2, 3, 4].filter(t => LEAGUES_BY_STATE(state).some(l => l.tier === t && !l.isAcademy)) : [1, 2, 3, 4];
  const uniqueLeagueRegions = [...new Set(availableLeagues.map(leagueRegion).filter(Boolean))];
  const filteredLeagues     = regionFilter ? availableLeagues.filter(l => leagueRegion(l) === regionFilter) : availableLeagues;

  function start(e) {
    if (e) e.preventDefault();
    if (!clubId || !leagueKey || loading) return;
    setStartError(null);
    setLoading(true);
    try {
      const newCareer = buildNewCareer({
        clubId, leagueKey, state, localDivision,
        managerName, difficulty, gameMode, challengeId, existingSlots,
      });
      onStart(newCareer);
    } catch (err) {
      setStartError(err.message);
      console.error('[start] career init error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Step labels reflect new order: State → Profile (coach+mode) → Tier → League → [Division] → Club
  const setupLabels =
    tier === 3
      ? ['State', 'Profile', 'Tier', 'League', 'Division', 'Club']
      : ['State', 'Profile', 'Tier', 'League', 'Club'];
  const setupVisualStep =
    tier === 3 ? step : step <= 3 ? step : step === 5 ? 4 : Math.min(step, 4);

  return (
    <div className={`${themeClass} min-h-screen font-sans text-atext flex flex-col`}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-aline">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 60%, color-mix(in srgb, var(--A-accent) 10%, transparent) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,var(--A-line-2) 0,var(--A-line-2) 1px,transparent 1px,transparent 64px),repeating-linear-gradient(90deg,var(--A-line-2) 0,var(--A-line-2) 1px,transparent 1px,transparent 64px)' }} />
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 md:py-12 relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))', boxShadow: '0 4px 16px color-mix(in srgb, var(--A-accent) 30%, transparent)' }}>
              <Trophy className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-aaccent font-mono font-bold">Manager 2026</span>
          </div>
          <h1 className="font-display text-6xl md:text-7xl tracking-wider leading-none text-atext">
            FOOTY <span style={{ color: 'var(--A-accent)' }}>DYNASTY</span>
          </h1>
          <p className="text-atext-dim mt-3 text-sm md:text-base max-w-xl leading-relaxed">
            Take a community side from the suburban grounds to the MCG. 7 states, full pyramid, every system you'd expect.
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-6 md:py-8">
        {/* Step indicator — thin progress bar */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between mb-1.5">
            {setupLabels.map((label, i) => (
              <span key={label} className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: i <= setupVisualStep ? 'var(--A-accent)' : 'var(--A-text-mute)' }}>
                {label}
              </span>
            ))}
          </div>
          <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--A-line)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(setupVisualStep / Math.max(setupLabels.length - 1, 1)) * 100}%`,
                background: 'linear-gradient(90deg, var(--A-accent), var(--A-accent-2))',
              }} />
          </div>
          <div className="mt-1.5 text-right text-[10px] font-mono text-atext-mute">
            {setupVisualStep + 1} / {setupLabels.length}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {/* ── STEP 0: WHERE WILL YOUR STORY BEGIN? ─── */}
          {step === 0 && (
            <motion.div key="setup-step-0" className="space-y-6" {...slideIn}>

              {/* Quick Start — elevated fast-track banner */}
              {onQuickStart && (
                <motion.button type="button" onClick={onQuickStart}
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl p-4 flex items-center gap-4 text-left group cursor-pointer"
                  style={{
                    background: 'color-mix(in srgb, var(--A-accent) 8%, var(--A-panel))',
                    border: '1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)',
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))' }}>
                    <Zap className="w-5 h-5" style={{ color: '#0A0A0A' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-atext">Quick Start</div>
                    <div className="text-[11px] text-atext-dim mt-0.5">
                      Drop straight in, no setup — a community club on forgiving difficulty.
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-aaccent flex-shrink-0 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              )}

              {/* Resume saves — only shown when saves exist */}
              {slotsWithSaves.length > 0 && (() => {
                const latest = getLatestSavedSlotMeta(existingSlots);
                return (
                  <div>
                    <h2 className="font-display text-3xl tracking-wider text-atext mb-3">CONTINUE</h2>
                    <div className="grid md:grid-cols-3 gap-3">
                      {slotsWithSaves.map(slot => {
                        const meta = existingSlots[slot];
                        const c = findClub(meta.clubId);
                        const isLatest = slot === latest;
                        return (
                          <motion.button key={slot} type="button"
                            onClick={() => onResume && onResume(slot)}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                            className="panel rounded-xl overflow-hidden text-left group">
                            {c?.colors && (
                              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${c.colors[0]}, ${c.colors[1]})` }} />
                            )}
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-aaccent">Slot {slot}</span>
                                {isLatest && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase"
                                    style={{ background: 'color-mix(in srgb, var(--A-accent) 15%, transparent)', color: 'var(--A-accent)', border: '1px solid color-mix(in srgb, var(--A-accent) 30%, transparent)' }}>
                                    Latest
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-atext">{meta.managerName || 'Coach'}</div>
                              <div className="text-xs text-atext-dim truncate">{c?.name || meta.clubId}</div>
                              <div className="text-[10px] text-atext-mute mt-1.5 font-mono">
                                Season {meta.season}{meta.week ? ` · Rd ${meta.week}` : ''}{meta.savedAt ? ` · ${fmtSavedAt(meta.savedAt)}` : ''}
                              </div>
                              {meta.premiership && <div className="text-[10px] text-aaccent mt-1.5 font-mono">🏆 {meta.premiership}</div>}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                      <div className="flex-1 h-px bg-aline" />
                      <span className="text-[10px] text-atext-mute uppercase tracking-widest font-mono px-2">or start fresh</span>
                      <div className="flex-1 h-px bg-aline" />
                    </div>
                  </div>
                );
              })()}

              {/* State selection */}
              <div>
                <h2 className="font-display text-4xl md:text-5xl tracking-wider leading-tight mb-1">
                  WHERE WILL YOUR{' '}
                  <span style={{ color: 'var(--A-accent)' }}>STORY BEGIN?</span>
                </h2>
                <p className="text-atext-dim text-sm mb-5">Each state has its own football culture, pyramid and clubs. Hover to explore, click to choose.</p>

                {/* Map + detail panel — map visible on all screen sizes */}
                <div className="grid lg:grid-cols-5 gap-6 items-start">
                  <div className="lg:col-span-3">
                    <AustraliaMap
                      hoveredState={hoveredState}
                      selectedState={state}
                      onHover={setHoveredState}
                      onSelect={(s) => setSelState(s)}
                    />
                  </div>
                  <div className="lg:col-span-2 panel rounded-xl min-h-[320px]">
                    <StateDetailPanel
                      state={hoveredState || state}
                      selectedState={state}
                      onContinue={() => setStep(1)}
                    />
                  </div>
                </div>
              </div>

              {/* Skip-setup preference */}
              <label className="flex items-start gap-3 cursor-pointer panel rounded-xl p-4">
                <input type="checkbox"
                  className="mt-0.5"
                  style={{ accentColor: 'var(--A-accent)' }}
                  checked={!!prefsUi.skipSetupContinueLast}
                  onChange={(e) => {
                    const next = setPlayerPrefs({ skipSetupContinueLast: e.target.checked });
                    setPrefsUi(next);
                  }} />
                <div>
                  <div className="font-bold text-sm text-atext">Skip title when saves exist</div>
                  <div className="text-[11px] text-atext-mute mt-1">
                    Next visit loads your active slot, or the most recently saved slot, straight into the game.
                  </div>
                </div>
              </label>
            </motion.div>
          )}

          {/* ── STEP 1: YOUR PROFILE (coach + difficulty + game mode) ── */}
          {step === 1 && (
            <motion.div key="setup-step-1" className="max-w-3xl" {...slideIn}>
              <button type="button" onClick={() => setStep(0)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">YOUR PROFILE</h2>
              <p className="text-atext-dim text-sm mb-6">Starting in <strong className="text-atext">{state}</strong>. Name your manager and set how hard you want it.</p>

              {/* Manager name */}
              <div className="panel rounded-xl p-5 mb-4">
                <label className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">Manager Name</label>
                <input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Bluey McGee"
                  autoFocus
                  className="w-full mt-2 bg-apanel-2 border border-aline focus:border-aaccent outline-none rounded-lg px-4 py-3 text-atext text-lg font-semibold"
                />
              </div>

              {/* Difficulty */}
              <div className="panel rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-2xl tracking-wide text-atext">DIFFICULTY</h3>
                  <span className="text-[10px] text-atext-mute uppercase tracking-widest font-mono">Adjustable later</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {DIFFICULTY_IDS.map((id) => {
                    const meta = getDifficultyProfile(id);
                    const active = difficulty === id;
                    return (
                      <button key={id} type="button" onClick={() => setDifficulty(id)}
                        className="text-left p-4 rounded-xl border transition-all relative overflow-hidden group"
                        style={{
                          background: active
                            ? `linear-gradient(135deg, color-mix(in srgb, ${meta.color} 14%, var(--A-panel-2)), var(--A-panel-2))`
                            : 'var(--A-panel-2)',
                          borderColor: active ? meta.color : 'var(--A-line)',
                          boxShadow: active
                            ? `0 0 0 1px ${meta.color}33, 0 4px 16px color-mix(in srgb, ${meta.color} 15%, transparent)`
                            : undefined,
                          transform: active ? 'translateY(-1px)' : undefined,
                        }}>
                        {/* Active indicator strip */}
                        {active && (
                          <div
                            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                            style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)` }}
                          />
                        )}
                        <div className="font-display text-xl mb-0.5 mt-1" style={{ color: meta.color }}>
                          {meta.label.toUpperCase()}
                        </div>
                        <div className="text-[10px] text-atext-mute mb-2 italic leading-snug">{meta.tagline}</div>
                        <ul className="space-y-1.5 mb-3">
                          {meta.bullets.map((b, i) => (
                            <li key={`${id}-${i}`} className="text-[11px] text-atext flex gap-1.5 leading-snug">
                              <span className="shrink-0 mt-0.5" style={{ color: meta.color }}>▸</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        {active ? (
                          <div
                            className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-md inline-block"
                            style={{
                              color: meta.color,
                              background: `color-mix(in srgb, ${meta.color} 15%, transparent)`,
                              border: `1px solid color-mix(in srgb, ${meta.color} 30%, transparent)`,
                            }}
                          >
                            ✓ Selected
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-atext-mute uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to select
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Stat comparison table */}
                <div className="mt-4 rounded-xl border border-aline/40 overflow-hidden">
                  <div className="px-4 py-2 border-b border-aline/30">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">Key Differences</span>
                  </div>
                  {[
                    { label: 'Board patience', values: ['3 seasons', '2 seasons', '1 season'] },
                    { label: 'Starting cash',  values: ['+25%', 'Standard', '−15%'] },
                    { label: 'Trade budget',   values: ['+50%', 'Standard', '−30%'] },
                    { label: 'Injury rate',    values: ['Half', 'Normal', 'Double'] },
                    { label: 'Scout accuracy', values: ['+15%', 'Standard', '−15%'] },
                  ].map((row) => (
                    <div key={row.label} className="grid grid-cols-4 border-b border-aline/20 last:border-0">
                      <div className="px-4 py-2 text-[11px] text-atext-mute flex items-center">{row.label}</div>
                      {DIFFICULTY_IDS.map((id, i) => {
                        const m = getDifficultyProfile(id);
                        const active = difficulty === id;
                        return (
                          <div key={id}
                            className="py-2 text-center text-[11px] font-mono font-bold transition-colors"
                            style={{
                              color: active ? m.color : 'var(--A-text-mute)',
                              background: active ? `color-mix(in srgb, ${m.color} 6%, transparent)` : undefined,
                            }}>
                            {row.values[i]}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Game mode — compact toggle */}
              <div className="panel rounded-xl p-5 mb-6">
                <h3 className="font-display text-xl tracking-wide text-atext mb-1">GAME MODE</h3>
                <p className="text-[11px] text-atext-mute mb-3">
                  Sandbox removes board pressure. Challenge cranks it up.
                </p>
                <div className="flex gap-2">
                  {[
                    { id: 'normal',    label: 'Career',    sub: 'Standard rules',   color: 'var(--A-accent)' },
                    { id: 'sandbox',   label: 'Sandbox',   sub: 'Relaxed board',    color: 'var(--A-pos)' },
                    { id: 'challenge', label: 'Challenge', sub: 'High stakes',      color: 'var(--A-neg)' },
                  ].map(m => (
                    <button key={m.id} type="button" onClick={() => setGameModePersist(m.id)}
                      className="flex-1 py-3 px-2 rounded-xl border text-center transition-all"
                      style={{
                        borderColor: gameMode === m.id ? m.color : 'var(--A-line)',
                        background: gameMode === m.id
                          ? `color-mix(in srgb, ${m.color} 12%, transparent)`
                          : 'transparent',
                      }}>
                      <div className="text-sm font-bold" style={{ color: gameMode === m.id ? m.color : 'var(--A-text-dim)' }}>
                        {m.label}
                      </div>
                      <div className="text-[10px] text-atext-mute mt-0.5">{m.sub}</div>
                    </button>
                  ))}
                </div>
                {gameMode === 'challenge' && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {CHALLENGE_SCENARIOS.map((ch) => (
                      <button key={ch.id} type="button" onClick={() => setChallengePersist(ch.id)}
                        className="p-3 text-left rounded-lg border transition-all"
                        style={{
                          borderColor: challengeId === ch.id ? 'var(--A-neg)' : 'var(--A-line)',
                          background: challengeId === ch.id
                            ? 'color-mix(in srgb, var(--A-neg) 8%, transparent)'
                            : 'transparent',
                        }}>
                        <div className="font-bold text-sm text-atext">{ch.title}</div>
                        <div className="text-[10px] text-atext-mute mt-0.5 leading-snug">{ch.sub}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" onClick={() => setStep(2)}
                className="btn-primary w-full py-4 font-display text-xl tracking-widest">
                CHOOSE YOUR TIER →
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: TIER ─── */}
          {step === 2 && (
            <motion.div key="setup-step-2" {...slideIn}>
              <button type="button" onClick={() => setStep(1)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">CHOOSE YOUR PYRAMID LEVEL</h2>
              <p className="text-atext-dim text-sm mb-8">
                Start at the top, the middle, or the bottom. Tiers available in <strong className="text-atext">{state}</strong>.
              </p>
              <div className={`grid gap-4 ${tiersForState.length <= 1 ? 'md:grid-cols-1 max-w-sm' : tiersForState.length === 2 ? 'md:grid-cols-2 max-w-2xl' : tiersForState.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                {tiersForState.includes(4) && (
                  <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTier(4); setLeagueKey(null); setClubId(null); setStep(3); }}
                    className="panel rounded-xl p-6 text-left">
                    <Pill color="#60A5FA">Volunteer</Pill>
                    <div className="font-display text-5xl mt-3 text-atext">TIER 4</div>
                    <div className="text-sm text-atext font-semibold mt-1">Junior / Grassroots</div>
                    <div className="text-[12px] text-atext-dim mt-3 leading-relaxed">
                      Unpaid. Parent committee. Kids who love the game. The most honest start you can make.
                    </div>
                    <div className="text-xs mt-4 font-bold uppercase tracking-widest" style={{ color: '#60A5FA' }}>$0 salary · Grassroots coach</div>
                  </motion.button>
                )}
                {tiersForState.includes(3) && (
                  <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTier(3); setLeagueKey(null); setClubId(null); setStep(3); }}
                    className="panel rounded-xl p-6 text-left">
                    <Pill color="var(--A-accent)">Underdog</Pill>
                    <div className="font-display text-5xl mt-3 text-atext">TIER 3</div>
                    <div className="text-sm text-atext font-semibold mt-1">Community / Local</div>
                    <div className="text-[12px] text-atext-dim mt-3 leading-relaxed">
                      Suburban grounds. Tiny budgets. The long road. Most rewarding climb in the game.
                    </div>
                    <div className="text-aaccent text-xs mt-4 font-bold uppercase tracking-widest">3 Promotions to AFL</div>
                  </motion.button>
                )}
                {tiersForState.includes(2) && (
                  <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTier(2); setLeagueKey(null); setClubId(null); setStep(3); }}
                    className="panel rounded-xl p-6 text-left">
                    <Pill color="var(--A-accent-2)">Established</Pill>
                    <div className="font-display text-5xl mt-3 text-atext">TIER 2</div>
                    <div className="text-sm text-atext font-semibold mt-1">State League</div>
                    <div className="text-[12px] text-atext-dim mt-3 leading-relaxed">
                      VFL, SANFL, WAFL. Real budgets and media. One step from the big show.
                    </div>
                    <div className="text-xs mt-4 font-bold uppercase tracking-widest" style={{ color: 'var(--A-accent-2)' }}>
                      1 Promotion to AFL
                    </div>
                  </motion.button>
                )}
                {tiersForState.includes(1) && (
                  <motion.button type="button" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setTier(1); setLeagueKey(null); setClubId(null); setStep(3); }}
                    className="panel rounded-xl p-6 text-left">
                    <Pill color="var(--A-neg)">Big Time</Pill>
                    <div className="font-display text-5xl mt-3 text-atext">TIER 1</div>
                    <div className="text-sm text-atext font-semibold mt-1">AFL</div>
                    <div className="text-[12px] text-atext-dim mt-3 leading-relaxed">
                      Premiership pressure. Salary caps. Trade weeks. Every game on national TV.
                    </div>
                    <div className="text-aneg text-xs mt-4 font-bold uppercase tracking-widest">Win the Cup</div>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: LEAGUE ─── */}
          {step === 3 && (
            <motion.div key="setup-step-3" {...slideIn}>
              <button type="button" onClick={() => setStep(2)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">PICK A LEAGUE</h2>
              <p className="text-atext-dim text-sm mb-2">{state} · Tier {tier}</p>
              {tier === 3 && <SetupPyramidHint state={state} tier={tier} leagueKey={null} />}
              {availableLeagues.length === 0 ? (
                <div className="panel rounded-xl p-8 text-center text-atext-dim">
                  No leagues at this tier in {state}.{' '}
                  <button type="button" className="text-aaccent underline" onClick={() => setStep(2)}>
                    Pick a different tier
                  </button>.
                </div>
              ) : (
                <>
                  {/* Region filter chips — only shown when 2+ distinct regions exist (e.g. VIC tier 3) */}
                  {uniqueLeagueRegions.length >= 2 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {uniqueLeagueRegions.map(r => (
                        <button key={r} type="button"
                          onClick={() => setRegionFilter(prev => prev === r ? null : r)}
                          className="text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition-all"
                          style={regionFilter === r ? {
                            background: (REGION_COLORS[r] || 'var(--A-accent)') + '30',
                            color: REGION_COLORS[r] || 'var(--A-accent)',
                            border: `1px solid ${(REGION_COLORS[r] || 'var(--A-accent)')}60`,
                          } : {
                            background: 'var(--A-panel-2)',
                            color: 'var(--A-text-mute)',
                            border: '1px solid var(--A-line)',
                          }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-3">
                    {filteredLeagues.map((l) => {
                      const tier3Divs = tier === 3 && state ? tier3DivisionCount(l.key, state) : 0;
                      const inState = state ? l.clubs.filter((c) => c.state === state).length : l.clubs.length;
                      const region = leagueRegion(l);
                      const accentColor = region ? (REGION_COLORS[region] || 'var(--A-accent)') : (STATE_META[l.state]?.color || 'var(--A-accent)');
                      return (
                        <motion.button key={l.key} type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setLeagueKey(l.key);
                            setClubId(null);
                            if (tier === 3 && state) setLocalDivision(tier3Divs);
                            setStep(tier === 3 ? 4 : 5);
                          }}
                          className="panel rounded-xl overflow-hidden text-left flex items-stretch"
                          style={{ borderLeft: `4px solid ${accentColor}` }}>
                          <div className="p-4 flex-1 min-w-0">
                            {region && (
                              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: accentColor }}>
                                {region}
                              </div>
                            )}
                            <div className="font-display text-xl text-atext mt-0.5">{l.short}</div>
                            <div className="text-xs text-atext-dim truncate">{l.name}</div>
                            <div className="flex items-center gap-2 mt-2">
                              {tier === 3 && tier3Divs > 0 && (
                                <div className="flex gap-0.5 items-center">
                                  {Array.from({ length: Math.min(tier3Divs, 5) }).map((_, i) => (
                                    <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor, opacity: 0.7 }} />
                                  ))}
                                  {tier3Divs > 5 && <span className="text-[8px] text-atext-mute ml-0.5">+{tier3Divs - 5}</span>}
                                </div>
                              )}
                              <span className="text-[11px] text-atext-mute">
                                {tier === 3 && state
                                  ? `${tier3Divs} div${tier3Divs !== 1 ? 's' : ''} · ${inState} clubs`
                                  : `${l.clubs.length} clubs`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center px-3 flex-shrink-0" style={{ color: accentColor, opacity: 0.7 }}>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── STEP 4: LOCAL DIVISION (Tier 3 only) ─── */}
          {step === 4 && tier === 3 && leagueKey && state && (
            <motion.div key="setup-step-4" {...slideIn}>
              <button type="button" onClick={() => setStep(3)}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <h2 className="font-display text-4xl tracking-wider text-atext mb-1">LOCAL DIVISION</h2>
              <p className="text-atext-dim text-sm mb-2">{PYRAMID[leagueKey]?.name}</p>
              <SetupPyramidHint state={state} tier={tier} leagueKey={leagueKey} />
              {(() => {
                const counts = tier3DivisionTeamCounts(leagueKey, state);
                const k = counts.length;
                if (k <= 1) {
                  return (
                    <div className="space-y-6">
                      <div className="panel rounded-xl p-4 text-[12px] text-atext-dim">
                        Single local ladder — all <strong className="text-atext">{counts[0]}</strong> clubs in {state} play in one division this season.
                      </div>
                      <button type="button" onClick={() => setStep(5)} className="btn-primary py-4 px-8 font-display text-lg tracking-widest">
                        CHOOSE YOUR CLUB →
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="panel rounded-xl p-5 mb-6">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-atext-mute">
                      Choose your local division
                    </label>
                    <p className="text-[11px] text-atext-dim mt-1 mb-4">
                      Lower division number = closer to promotion. Pick a pool to see clubs.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {counts.map((count, i) => {
                        const d = i + 1;
                        return (
                          <button key={d} type="button"
                            onClick={() => { setLocalDivision(d); setStep(5); }}
                            className={`px-4 py-3 rounded-xl border text-left min-w-[5rem] transition-all ${
                              effectiveTier3Div === d
                                ? 'text-[#0A0A0A]'
                                : 'border-aline hover:border-aaccent/40 text-atext'
                            }`}
                            style={effectiveTier3Div === d ? {
                              background: 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))',
                              borderColor: 'transparent',
                            } : undefined}>
                            <span className="block text-sm font-bold">Div {d}</span>
                            <span className={`block text-[10px] font-normal mt-0.5 ${effectiveTier3Div === d ? 'text-[#0A0A0A]/80' : 'text-atext-mute'}`}>
                              {count} clubs
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ── STEP 5: CHOOSE YOUR CLUB ─── */}
          {step === 5 && leagueKey && (
            <motion.div key="setup-step-5" className="max-w-5xl" {...slideIn}>
              <button type="button"
                onClick={() => { setClubId(null); setStep(tier === 3 ? 4 : 3); }}
                disabled={loading}
                className="text-atext-mute text-sm mb-6 hover:text-atext flex items-center gap-1.5 transition-colors disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="font-display text-4xl md:text-5xl tracking-wider text-atext mb-1">CHOOSE YOUR CLUB</h2>
              <p className="text-atext-dim text-sm mb-5">{PYRAMID[leagueKey]?.name}</p>

              {/* Career summary strip */}
              {(() => {
                const dmeta = getDifficultyProfile(difficulty);
                const modeColors = { normal: 'var(--A-accent)', sandbox: 'var(--A-pos)', challenge: 'var(--A-neg)' };
                const modeLabels = { normal: 'Career', sandbox: 'Sandbox', challenge: 'Challenge' };
                return (
                  <div className="panel rounded-xl p-4 mb-6">
                    <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
                      {[
                        { label: 'Manager', value: managerName || 'Coach', color: 'var(--A-text)' },
                        { label: 'State', value: state, color: 'var(--A-text)' },
                        { label: 'Tier', value: `Tier ${tier}`, color: 'var(--A-text)' },
                        ...(tier === 3 && tier3K ? [{ label: 'Division', value: `Div ${effectiveTier3Div}`, color: 'var(--A-text)' }] : []),
                        { label: 'Difficulty', value: dmeta.label, color: dmeta.color },
                        { label: 'Mode', value: modeLabels[gameMode], color: modeColors[gameMode] },
                      ].map(({ label, value, color }, i, arr) => (
                        <React.Fragment key={label}>
                          <div>
                            <div className="text-[9px] font-mono uppercase tracking-widest text-atext-mute">{label}</div>
                            <div className="font-bold text-sm mt-0.5" style={{ color }}>{value}</div>
                          </div>
                          {i < arr.length - 1 && <div className="w-px h-7 bg-aline hidden sm:block" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {tier === 3 && leagueKey && state && <SetupPyramidHint state={state} tier={tier} leagueKey={leagueKey} />}

              {/* Club grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {availableClubs.map((c) => {
                  const isSelected = clubId === c.id;
                  return (
                    <motion.button key={c.id} type="button" onClick={() => setClubId(c.id)}
                      whileHover={!isSelected ? { y: -4, scale: 1.02 } : { scale: 1.01 }}
                      whileTap={{ scale: 0.96 }}
                      className="rounded-xl overflow-hidden text-left transition-all"
                      style={{
                        outline: isSelected ? `2px solid ${c.colors[0]}` : "2px solid transparent",
                        outlineOffset: 2,
                        boxShadow: isSelected
                          ? `0 0 0 4px color-mix(in srgb, ${c.colors[0]} 22%, transparent), 0 8px 24px color-mix(in srgb, ${c.colors[0]} 25%, transparent)`
                          : "0 2px 8px rgba(0,0,0,0.06)",
                      }}>
                      {/* Club colour header */}
                      <div className="h-16 md:h-20 flex items-center justify-center relative"
                        style={{ background: `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})` }}>
                        <span className="font-display text-2xl md:text-3xl tracking-wide" style={{ color: c.colors[2] }}>
                          {c.short}
                        </span>
                        {isSelected && (
                          <>
                            {/* Selection checkmark badge */}
                            <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                              style={{ background: "rgba(255,255,255,0.97)", boxShadow: `0 2px 8px rgba(0,0,0,0.3)` }}>
                              <Check className="w-4 h-4" style={{ color: c.colors[0] }} />
                            </div>
                            {/* Selected shimmer overlay */}
                            <div className="absolute inset-0 pointer-events-none"
                              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0))" }} />
                          </>
                        )}
                      </div>
                      {/* Club info */}
                      <div
                        className="px-3 py-2.5 transition-colors"
                        style={{
                          background: isSelected
                            ? `color-mix(in srgb, ${c.colors[0]} 10%, var(--A-panel))`
                            : "var(--A-panel)",
                          borderTop: isSelected ? `2px solid color-mix(in srgb, ${c.colors[0]} 40%, transparent)` : "2px solid transparent",
                        }}
                      >
                        <div
                          className="font-bold text-sm leading-tight"
                          style={{ color: isSelected ? c.colors[0] : "var(--A-text)" }}
                        >
                          {c.name}
                        </div>
                        <div className="text-[10px] text-atext-mute mt-0.5 font-mono">{c.state}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {startError && (
                <div className="mb-4 p-4 rounded-xl text-sm text-aneg flex items-start gap-2"
                  style={{ background: 'color-mix(in srgb, var(--A-neg) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--A-neg) 30%, transparent)' }}>
                  <span>⚠️</span> {startError}
                </div>
              )}

              <motion.button type="button" onClick={start}
                disabled={loading || !clubId}
                whileHover={(!loading && clubId) ? { scale: 1.01 } : undefined}
                whileTap={(!loading && clubId) ? { scale: 0.98 } : undefined}
                className={`w-full py-5 rounded-xl font-display text-2xl tracking-widest transition-all ${
                  loading || !clubId ? 'opacity-40 cursor-not-allowed' : 'glow'
                }`}
                style={{
                  background: (!loading && clubId)
                    ? 'linear-gradient(135deg, var(--A-accent), var(--A-accent-2))'
                    : 'var(--A-panel)',
                  color: (!loading && clubId) ? '#0A0A0A' : 'var(--A-text-mute)',
                  border: (!loading && clubId) ? 'none' : '1px solid var(--A-line)',
                  boxShadow: (!loading && clubId) ? '0 8px 24px color-mix(in srgb, var(--A-accent) 30%, transparent)' : 'none',
                }}>
                {loading
                  ? '⏳ STARTING CAREER…'
                  : clubId
                    ? `KICK OFF WITH ${findClub(clubId)?.short || ''} →`
                    : 'SELECT A CLUB ABOVE'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-aline p-4 text-center text-[9px] text-atext-mute uppercase tracking-widest font-mono">
        A football manager-style game for Australian rules
      </div>
    </div>
  );
}
