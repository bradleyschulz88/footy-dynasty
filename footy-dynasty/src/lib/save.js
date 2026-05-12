// ---------------------------------------------------------------------------
// Save versioning, slots, autosave
// ---------------------------------------------------------------------------

import { PYRAMID, findClub } from '../data/pyramid.js';
import { getClubGround } from '../data/grounds.js';

import { migrateSaveBoardV8, migrateSaveBoardV9, migrateSaveBoardV10, migrateSaveBoardV11 } from './board.js';
import { migrateSaveGameDepthV12 } from './gameDepth.js';
import { localDivisionForClub, tier3DivisionCount } from './leagueEngine.js';
import { migrateDraftPoolScouting } from './draftScouting.js';
import { pushManagerInboxBoardMirror, syncTradePeriodManagerInboxRow } from './inbox.js';
import { DEFAULT_STAFF_TASKS, ensureStaffTasks } from './staffTasks.js';
import { SLOT_IDS, getLatestSavedSlotMeta } from './setupConstants.js';

export const SAVE_VERSION = 21;
export const LEGACY_KEY = 'footy-dynasty-career';
const SLOT_KEY = (slot) => `footy-dynasty-career-slot-${slot}`;
const SLOT_META_KEY = 'footy-dynasty-slots';
const ACTIVE_SLOT_KEY = 'footy-dynasty-active-slot';

export { SLOT_IDS };

/** Updated when the player exports JSON — used for backup reminders in Settings. */
export const LAST_EXPORT_STORAGE_KEY = 'footy-dynasty-last-export-at';

/** Slot id with the newest `savedAt` in meta, or null. */
export function getLatestSavedSlot(meta = readSlotMeta()) {
  return getLatestSavedSlotMeta(meta);
}

export function migrate(save) {
  if (!save) return save;
  let s = { ...save };
  const v = s.saveVersion ?? 1;

  if (v < 2) {
    // v1 -> v2: introduce new fields with safe defaults
    s.saveVersion = 2;
    s.aiSquads = s.aiSquads || {};
    s.draftOrder = s.draftOrder || [];
    s.history = s.history || [];
    s.brownlow = s.brownlow || {};
    s.boardWarning = s.boardWarning || 0;
    s.gameOver = s.gameOver || null;
    s.themeMode = s.themeMode || 'A';
    s.options = s.options || { autosave: true };
  }

  if (v < 3) {
    // v2 -> v3: gameplay systems spec (difficulty, tutorial, community culture, sacking + job market)
    s.saveVersion = 3;

    // --- Tutorial (Section 1) ---
    s.tutorialStep      = s.tutorialStep ?? 6;     // existing saves skip tutorial
    s.tutorialComplete  = s.tutorialComplete ?? true;
    s.isFirstCareer     = s.isFirstCareer ?? false;

    // --- Difficulty (Section 2) ---
    s.difficulty = s.difficulty || 'contender';

    // --- Volunteer Committee (Section 3A) ---
    s.committee = s.committee || [];

    // --- Footy Trip (Section 3B) ---
    s.footyTripAvailable = s.footyTripAvailable ?? false;
    s.footyTripUsed      = s.footyTripUsed ?? false;

    // --- Ground Conditions (Section 3D) + weekly weather ---
    s.groundCondition = s.groundCondition ?? 85;
    s.groundName      = s.groundName || (s.clubId ? `${s.clubId.toUpperCase()} Oval` : 'Home Oval');
    s.weeklyWeather   = s.weeklyWeather || {};

    // Stadium facility default (level 1) for ground-condition floor.
    // NOTE: pre-v4 saves stamped a bare integer here, breaking facility upgrades
    // and ground conditions. v4 migrator below repairs that.
    s.facilities = s.facilities || {};
    if (!s.facilities.stadium) s.facilities.stadium = { level: 1, cost: 350_000, max: 5 };

    // --- Coach reputation + sacking persistence (Section 3F) ---
    s.coachReputation = s.coachReputation ?? 30;
    s.coachTier       = s.coachTier || 'Journeyman';
    s.coachStats      = s.coachStats || {
      totalWins: 0, totalLosses: 0, totalDraws: 0,
      premierships: 0, promotions: 0, relegations: 0,
      clubsManaged: 1, seasonsManaged: 1,
    };
    s.previousClubs    = s.previousClubs || [];
    s.isSacked         = s.isSacked ?? false;
    s.jobMarketOpen    = s.jobMarketOpen ?? false;
    s.sackingStep      = s.sackingStep ?? null;     // 0..4 during sacking flow

    // --- Stub "Section 8" deps: journalist + per-player traits ---
    s.journalist = s.journalist || { name: '', satisfaction: 50, tone: 'neutral' };
    if (Array.isArray(s.squad)) {
      s.squad = s.squad.map(p => p.traits ? p : { ...p, traits: [] });
    }
  }

  if (v < 4) {
    // v3 -> v4: finance system rebuild
    s.saveVersion = 4;

    // Repair the broken stadium schema some v3 saves stamped as a bare integer.
    if (s.facilities && (typeof s.facilities.stadium === 'number' || !s.facilities.stadium?.level)) {
      s.facilities.stadium = { level: 1, cost: 350_000, max: 5 };
    }

    // Weekly cashflow tick state
    s.lastFinanceTickWeek = s.lastFinanceTickWeek ?? null;
    s.lastFinanceTickDay = s.lastFinanceTickDay ?? null;
    if (!Array.isArray(s.weeklyHistory)) s.weeklyHistory = [];

    // Insolvency tracking
    s.cashCrisisStartWeek = s.cashCrisisStartWeek ?? null;
    s.cashCrisisLevel     = s.cashCrisisLevel ?? 0;
    s.bankLoan            = s.bankLoan || null; // { principal, weeksRemaining, interestPerWeek }

    // Sponsor lifecycle queues
    s.sponsorRenewalProposals = s.sponsorRenewalProposals || [];
    s.sponsorOffers           = s.sponsorOffers || [];
    s.expiredSponsorsLastSeason = s.expiredSponsorsLastSeason || [];

    // Player contract renewals queue
    s.pendingRenewals = s.pendingRenewals || [];
    s.renewalsClosed  = s.renewalsClosed ?? false;

    // Fundraisers (Tier-3 pressure valve)
    s.fundraisersUsed   = s.fundraisersUsed || {};
    s.communityGrantUsed = s.communityGrantUsed ?? false;

    // Last EOS finance summary (rendered in SeasonSummaryScreen)
    s.lastEosFinance = s.lastEosFinance || null;
  }

  if (v < 5) {
    s.saveVersion = 5;
    s.postSeasonPhase = s.postSeasonPhase ?? 'none';
    s.inTradePeriod = s.inTradePeriod ?? false;
    s.tradePeriodDay = s.tradePeriodDay ?? 0;
    s.freeAgencyOpen = s.freeAgencyOpen ?? false;
    s.postSeasonDraftCountdown = s.postSeasonDraftCountdown ?? null;
    s.freeAgentBalance = s.freeAgentBalance ?? { gained: 0, lost: 0 };
    s.tradeHistory = s.tradeHistory ?? [];
    s.draftPickBank = s.draftPickBank ?? null;
    s.offSeasonFreeAgents = s.offSeasonFreeAgents ?? [];
    if (Array.isArray(s.squad)) {
      s.squad = s.squad.map((p) => ({
        ...p,
        receivedInTrade: p.receivedInTrade ?? null,
        seasonsAtClub: p.seasonsAtClub ?? 0,
      }));
    }
  }

  if (v < 6) {
    s.saveVersion = 6;
    if (Array.isArray(s.squad)) {
      s.squad = s.squad.map((p) => ({
        ...p,
        secondaryPosition: p.secondaryPosition ?? null,
      }));
    }
    if (s.aiSquads && typeof s.aiSquads === 'object') {
      const next = {};
      for (const [cid, squad] of Object.entries(s.aiSquads)) {
        next[cid] = Array.isArray(squad)
          ? squad.map((p) => ({ ...p, secondaryPosition: p.secondaryPosition ?? null }))
          : squad;
      }
      s.aiSquads = next;
    }
  }

  if (v < 7) {
    s.saveVersion = 7;
    s.homeWinStreak = s.homeWinStreak ?? 0;
    s.winStreak = s.winStreak ?? 0;
    if (!s.clubGround && s.clubId) {
      const cl = findClub(s.clubId);
      const st = s.facilities?.stadium?.level ?? 1;
      const tier = (s.leagueKey && PYRAMID[s.leagueKey]?.tier) ?? 2;
      s.clubGround = getClubGround(cl, st, tier);
    }
  }

  if (v < 8) {
    s.saveVersion = 8;
    migrateSaveBoardV8(s);
  }

  if (v < 9) {
    s.saveVersion = 9;
    migrateSaveBoardV9(s);
  }

  if (v < 10) {
    s.saveVersion = 10;
    migrateSaveBoardV10(s);
  }

  if (v < 11) {
    s.saveVersion = 11;
    migrateSaveBoardV11(s);
  }

  if (v < 12) {
    s.saveVersion = 12;
    migrateSaveGameDepthV12(s);
  }

  if (v < 13) {
    s.saveVersion = 13;
    const cl = s.clubId ? findClub(s.clubId) : null;
    s.regionState = s.regionState ?? cl?.state ?? null;
    const tier = (s.leagueKey && PYRAMID[s.leagueKey]?.tier) ?? null;
    if (tier === 3 && s.leagueKey && s.clubId) {
      s.localDivision = s.localDivision ?? localDivisionForClub(s.clubId, s.leagueKey, s.regionState);
    } else {
      s.localDivision = s.localDivision ?? null;
    }
  }

  if (v < 14) {
    s.saveVersion = 14;
    const tier = (s.leagueKey && PYRAMID[s.leagueKey]?.tier) ?? null;
    if (tier === 3 && s.leagueKey && s.clubId && s.regionState) {
      const K = tier3DivisionCount(s.leagueKey, s.regionState);
      const inferred = localDivisionForClub(s.clubId, s.leagueKey, s.regionState);
      const prev = s.localDivision ?? inferred;
      s.localDivision = Math.max(1, Math.min(K, prev));
    }
  }

  if (v < 15) {
    s.saveVersion = 15;
    s.themeMode = 'A';
  }

  if (v < 16) {
    s.saveVersion = 16;
    s.pendingStaffRenewals = s.pendingStaffRenewals || [];
    const tier = (s.leagueKey && PYRAMID[s.leagueKey]?.tier) ?? null;
    if (tier === 3 && s.leagueKey && s.clubId && s.regionState) {
      const K = tier3DivisionCount(s.leagueKey, s.regionState);
      const inferred = localDivisionForClub(s.clubId, s.leagueKey, s.regionState);
      const prev = s.localDivision ?? inferred;
      s.localDivision = Math.max(1, Math.min(K, prev));
    }
  }

  if (v < 17) {
    s.saveVersion = 17;
    s.gameMode = s.gameMode ?? 'normal';
    if (s.gameMode === 'challenge' && !s.challengeId) s.challengeId = 'under_the_pump';
    if (!s.options || typeof s.options !== 'object') s.options = {};
    if (s.options.confirmBeforeNewCareer === undefined) s.options.confirmBeforeNewCareer = true;
    if (s.options.confirmBeforeDeleteSlot === undefined) s.options.confirmBeforeDeleteSlot = true;
    if (!s.options.uiDensity) s.options.uiDensity = 'comfortable';
    if (s.options.reduceMotion === undefined) s.options.reduceMotion = false;
  }

  if (v < 18) {
    s.saveVersion = 18;
    s.inbox = Array.isArray(s.inbox) ? s.inbox : [];
    s.draftPool = migrateDraftPoolScouting(s.draftPool || []);
  }

  if (v < 19) {
    s.saveVersion = 19;
    s.inbox = Array.isArray(s.inbox) ? s.inbox : [];
    for (const msg of s.board?.inbox || []) {
      pushManagerInboxBoardMirror(s, msg);
    }
  }

  if (v < 20) {
    s.saveVersion = 20;
    s.staffTasks =
      s.staffTasks && typeof s.staffTasks === 'object'
        ? {
            recruitPriorityState:
              s.staffTasks.recruitPriorityState == null || s.staffTasks.recruitPriorityState === ''
                ? null
                : String(s.staffTasks.recruitPriorityState),
            matchPrepTier: [0, 1, 2].includes(Number(s.staffTasks.matchPrepTier))
              ? Number(s.staffTasks.matchPrepTier)
              : 0,
            trainingLeadId:
              s.staffTasks.trainingLeadId == null || s.staffTasks.trainingLeadId === ''
                ? null
                : String(s.staffTasks.trainingLeadId),
          }
        : DEFAULT_STAFF_TASKS();
    const tier = (s.leagueKey && PYRAMID[s.leagueKey]?.tier) ?? null;
    if (tier === 3 && Array.isArray(s.staff) && !s.staff.some((st) => st.id === 's6')) {
      s.staff.push({
        id: 's6',
        role: 'Club medic / first aid (volunteer)',
        name: 'Volunteer Medic',
        rating: 58,
        wage: 0,
        volunteer: true,
        contract: 2,
      });
    }
  }

  if (v < 21) {
    s.saveVersion = 21;
    const prev = s.staffTasks && typeof s.staffTasks === 'object' ? s.staffTasks : {};
    s.staffTasks = ensureStaffTasks({
      staff: s.staff,
      staffTasks: {
        recruitPriorityState:
          prev.recruitPriorityState == null || prev.recruitPriorityState === ''
            ? null
            : String(prev.recruitPriorityState),
        matchPrepTier: [0, 1, 2].includes(Number(prev.matchPrepTier))
          ? Number(prev.matchPrepTier)
          : 0,
        trainingLeadId:
          prev.trainingLeadId == null || prev.trainingLeadId === ''
            ? null
            : String(prev.trainingLeadId),
        scoutLeadId:
          prev.scoutLeadId == null || prev.scoutLeadId === '' ? null : String(prev.scoutLeadId),
        tradeNegotiatorId:
          prev.tradeNegotiatorId == null || prev.tradeNegotiatorId === ''
            ? null
            : String(prev.tradeNegotiatorId),
      },
    });
  }

  return s;
}

export function readSlot(slot) {
  try {
    const raw = localStorage.getItem(SLOT_KEY(slot));
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch { return null; }
}

export function writeSlot(slot, save) {
  try {
    const out = { ...save, saveVersion: SAVE_VERSION, savedAt: new Date().toISOString() };
    localStorage.setItem(SLOT_KEY(slot), JSON.stringify(out));
    bumpSlotMeta(slot, out);
    return true;
  } catch (err) {
    console.warn('[save] writeSlot failed:', err?.message);
    return false;
  }
}

export function deleteSlot(slot) {
  try {
    localStorage.removeItem(SLOT_KEY(slot));
    const meta = readSlotMeta();
    delete meta[slot];
    localStorage.setItem(SLOT_META_KEY, JSON.stringify(meta));
  } catch {}
}

export function readSlotMeta() {
  try {
    return JSON.parse(localStorage.getItem(SLOT_META_KEY) || '{}');
  } catch { return {}; }
}

export function bumpSlotMeta(slot, save) {
  try {
    const meta = readSlotMeta();
    const prev = meta[slot] || {};
    const label = save.options?.slotLabel;
    meta[slot] = {
      managerName: save.managerName,
      clubId: save.clubId,
      leagueKey: save.leagueKey,
      season: save.season,
      week: save.week,
      phase: save.phase,
      currentDate: save.currentDate,
      premiership: save.premiership,
      savedAt: save.savedAt || new Date().toISOString(),
      slotLabel: label != null && String(label).trim() !== '' ? String(label).trim() : (prev.slotLabel ?? null),
      gameMode: save.gameMode ?? prev.gameMode ?? null,
    };
    localStorage.setItem(SLOT_META_KEY, JSON.stringify(meta));
  } catch {}
}

export function getActiveSlot() {
  try { return localStorage.getItem(ACTIVE_SLOT_KEY) || null; }
  catch { return null; }
}

export function setActiveSlot(slot) {
  try {
    if (slot) localStorage.setItem(ACTIVE_SLOT_KEY, slot);
    else localStorage.removeItem(ACTIVE_SLOT_KEY);
  } catch {}
}

// One-time migration of legacy single-key save into Slot A
export function migrateLegacy() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const parsed = migrate(JSON.parse(legacy));
    writeSlot('A', parsed);
    setActiveSlot('A');
    localStorage.removeItem(LEGACY_KEY);
    return parsed;
  } catch { return null; }
}
