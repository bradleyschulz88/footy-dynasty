// Save Migration Test Harness
// Tests that save files from previous versions can be loaded correctly

import { describe, it, expect, beforeEach } from 'vitest';
import { migrate as migrateSave, SAVE_VERSION, writeSlot, readSlot, deleteSlot, SLOT_IDS } from '../save.js';

// Mock localStorage for testing
const mockStorage = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  },
  writable: true,
});

// Test fixtures - saved careers from different versions
const V1_CAREER = {
  managerName: 'Test Coach',
  clubId: 'ess',
  leagueKey: 'AFL',
  regionState: 'VIC',
  season: 2026,
  week: 5,
  currentDate: '2026-03-15',
  phase: 'season',
  eventQueue: [],
  squad: [],
  lineup: [],
  training: { intensity: 60, focus: {} },
  facilities: { stadium: { level: 1 }, training: { level: 1 }, medical: { level: 1 }, youth: { level: 1 } },
  finance: { cash: 5000000, boardConfidence: 55, transferBudget: 2000000, wageBill: 0, salaryCap: 13000000 },
  sponsors: [],
  staff: [],
  staffTasks: [],
  kits: { home: { primary: '#CC2031', secondary: '#000000', tertiary: '#CC2031' }, away: { primary: '#FFFFFF', secondary: '#CC2031', tertiary: '#FFFFFF' }, clash: { primary: '#000000', secondary: '#CC2031', tertiary: '#FFFFFF' } },
  ladder: [],
  fixtures: [],
  byeMap: {},
  tradePool: [],
  draftPool: [],
  youth: { recruits: [], zone: 'VIC', programLevel: 1, scoutFocus: 'All-rounders' },
  news: [],
  weeklyHistory: [],
  inFinals: false,
  finalsRound: 0,
  finalsFixtures: [],
  finalsResults: [],
  premiership: null,
  tacticChoice: 'balanced',
  seasonHistory: [],
  saveVersion: 1,
  aiSquads: {},
  draftOrder: [],
  history: [],
  brownlow: {},
  boardWarning: 0,
  gameOver: null,
  themeMode: 'A',
  options: { autosave: true, confirmBeforeNewCareer: true, confirmBeforeDeleteSlot: true, uiDensity: 'comfortable', reduceMotion: false, theme: 'light' },
  pendingTradeOffers: [],
  inbox: [],
  retiredThisSeason: [],
  difficulty: 'contender',
  gameMode: 'normal',
  challengeId: null,
  challengeGoal: null,
  tutorialStep: 6,
  tutorialComplete: true,
  isFirstCareer: false,
  committee: [],
  footyTripAvailable: false,
  footyTripUsed: false,
  groundCondition: 85,
  clubGround: { id: 'ess_home', name: 'Windy Hill', shortName: 'Windy Hill', capacity: 10000, surface: 'grass', condition: 85 },
  groundName: 'Windy Hill',
  weeklyWeather: {},
  winStreak: 0,
  homeWinStreak: 0,
  coachReputation: 30,
  coachTier: 'Journeyman',
  coachAccreditation: 1,
  tier3Div1Titles: 0,
  lastPromotionPlayoff: null,
  coachStats: { totalWins: 0, totalLosses: 0, totalDraws: 0, premierships: 0, promotions: 0, relegations: 0, clubsManaged: 1, seasonsManaged: 1 },
  previousClubs: [],
  isSacked: false,
  jobMarketOpen: false,
  sackingStep: null,
  jobOffers: [],
  boardVotePrepBonus: 0,
  jobMarketRerolls: 0,
  arrivalBriefing: null,
  journalist: { name: 'Test Journalist', outlet: 'Test Media', satisfaction: 50, hostility: 0 },
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
  clubCulture: { identity: 'balanced', fanExpectation: 'finals', loyalty: 50, stability: 50, ruthlessness: 50 },
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

const V2_CAREER = {
  ...V1_CAREER,
  saveVersion: 2,
  // Added in v2: localDivision for tier 3
  localDivision: 1,
  // Added in v2: regionState might be different key
};

describe('Save Migration', () => {
  beforeEach(() => {
    // Clear mock storage
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
    // Clear slots
    SLOT_IDS.forEach(slot => deleteSlot(slot));
  });

it('should migrate v1 save to current version', () => {
    localStorage.setItem('footy-dynasty-career-slot-A', JSON.stringify(V1_CAREER));
    const loaded = readSlot('A');
    expect(loaded.saveVersion).toBe(SAVE_VERSION);
    expect(loaded.managerName).toBe('Test Coach');
    expect(loaded.clubId).toBe('ess');
  });

  it('should preserve all required fields after migration', () => {
    localStorage.setItem('footy-dynasty-career-slot-A', JSON.stringify(V1_CAREER));
    const loaded = readSlot('A');
    
    // Core fields
    expect(loaded.managerName).toBeDefined();
    expect(loaded.clubId).toBeDefined();
    expect(loaded.leagueKey).toBeDefined();
    expect(loaded.season).toBeDefined();
    expect(loaded.week).toBeDefined();
    expect(loaded.squad).toBeInstanceOf(Array);
    expect(loaded.lineup).toBeInstanceOf(Array);
    expect(loaded.finance).toBeDefined();
    expect(loaded.staff).toBeInstanceOf(Array);
    expect(loaded.ladder).toBeInstanceOf(Array);
    expect(loaded.news).toBeInstanceOf(Array);
  });

it('should add default values for missing fields', () => {
    const minimalV1 = {
      ...V1_CAREER,
    };
    // Remove some fields that might be missing in very old saves
    delete minimalV1.gameMode;
    delete minimalV1.challengeId;
    delete minimalV1.coachTier;
    delete minimalV1.coachAccreditation;
    
    // Write directly to localStorage to simulate an old save file
    localStorage.setItem('footy-dynasty-career-slot-A', JSON.stringify(minimalV1));
    const loaded = readSlot('A');
    
    expect(loaded.gameMode).toBe('normal');
    expect(loaded.challengeId).toBeUndefined(); // Not set in normal mode
    expect(loaded.coachTier).toBeDefined();
    expect(loaded.coachAccreditation).toBeUndefined(); // Set at career creation, not in migration
  });

  it('should handle v2 saves correctly', () => {
    localStorage.setItem('footy-dynasty-career-slot-A', JSON.stringify(V2_CAREER));
    const loaded = readSlot('A');
    expect(loaded.saveVersion).toBe(SAVE_VERSION);
    expect(loaded.localDivision).toBe(1);
  });

  it('should handle corrupted saves gracefully', () => {
    const corrupted = { ...V1_CAREER, clubId: null };
    localStorage.setItem('footy-dynasty-career-slot-A', JSON.stringify(corrupted));
    const loaded = readSlot('A');
    // Migration should handle null clubId
    expect(loaded.clubId).toBeNull();
  });

  it('should migrate multiple slots independently', () => {
    localStorage.setItem('footy-dynasty-career-slot-A', JSON.stringify(V1_CAREER));
    localStorage.setItem('footy-dynasty-career-slot-B', JSON.stringify(V2_CAREER));
    localStorage.setItem('footy-dynasty-career-slot-C', JSON.stringify({ ...V1_CAREER, managerName: 'Coach C' }));
    
    expect(readSlot('A').managerName).toBe('Test Coach');
    expect(readSlot('B').managerName).toBe('Test Coach');
    expect(readSlot('C').managerName).toBe('Coach C');
    expect(readSlot('A').saveVersion).toBe(SAVE_VERSION);
    expect(readSlot('B').saveVersion).toBe(SAVE_VERSION);
    expect(readSlot('C').saveVersion).toBe(SAVE_VERSION);
  });
});