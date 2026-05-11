import React, { useState, useMemo } from "react";
import {
  Trophy, Users, DollarSign, Dumbbell, Building2, Handshake, Shirt,
  UserCog,   Repeat, Sprout, BarChart3, Calendar, ChevronRight, ChevronLeft,
  Home, Settings, Play, Pause, Save, ArrowUp, ArrowDown, ArrowRight,
  Star, Zap, Heart, Target, Activity, Flame, Sparkles, Crown,
  TrendingUp, TrendingDown, Plus, Minus, X, Check, Clock, MapPin,
  Newspaper, ShieldCheck, Gauge, Palette, Briefcase, GraduationCap,
  Map, Award, AlertCircle, ChevronsUp, FileText, RefreshCw, UserPlus,
  Landmark, GripVertical, LayoutDashboard, Wrench,
} from "lucide-react";
import { seedRng, rand, pick, rng, TIER_SCALE } from '../../lib/rng.js';
import { STATES, PYRAMID, LEAGUES_BY_STATE, ALL_CLUBS, findClub, findLeagueOf, findClubByShort } from '../../data/pyramid.js';
import { pyramidNoteForLeague } from '../../data/pyramidMeta.js';
import { POSITIONS, POSITION_NAMES, FIRST_NAMES, LAST_NAMES, generatePlayer, generateSquad, playerHasPosition, formatPositionSlash, isForwardPreferred, isMidPreferred } from '../../lib/playerGen.js';
import { generateFixtures, blankLadder, sortedLadder, finalsLabel, pickPromotionLeague, pickRelegationLeague, getCompetitionClubs, localDivisionForClub, tier3DivisionCount, tier3DivisionTeamCounts, LOCAL_DIVISION_COUNT, TIER3_CLUBS_PER_DIVISION_TARGET, TIER3_MIN_CLUBS_PER_DIVISION } from '../../lib/leagueEngine.js';
import { DEFAULT_FACILITIES, DEFAULT_TRAINING, generateStaff, defaultKits, generateTradePool } from '../../lib/defaults.js';
import { fmt, fmtK, clamp, avgFacilities, avgStaff } from '../../lib/format.js';
import { generateSeasonCalendar, TRAINING_INFO, formatDate, intensityScale, trainingAttrFocusBoost } from '../../lib/calendar.js';
import { SAVE_VERSION, SLOT_IDS, readSlot, writeSlot, deleteSlot, readSlotMeta, getActiveSlot, setActiveSlot, migrateLegacy, migrate as migrateSave } from '../../lib/save.js';
import {
  playerBlockedFromTrade,
  TRADE_PERIOD_DAYS,
  POST_TRADE_DRAFT_COUNTDOWN_DAYS,
} from '../../lib/tradePeriod.js';
import { css, Bar, RatingDot, Pill, Stat, Jersey, GlobalStyle } from '../../components/primitives.jsx';
import { SquadLineupBuilder, LineupSortablePanel } from '../../components/SquadLineupDnD.jsx';
import TabNav from '../../components/TabNav.jsx';
import { ClubBadge } from '../../components/ClubBadge.jsx';
import GameOverScreen from '../../screens/GameOverScreen.jsx';
import PostMatchSummary from '../../screens/PostMatchSummary.jsx';
import SackingSequence from '../../screens/SackingSequence.jsx';
import VoteOfConfidenceFlow from '../../screens/VoteOfConfidenceFlow.jsx';
import BoardMeetingScreen from '../../screens/BoardMeetingScreen.jsx';
import ArrivalBriefingFlow from '../../screens/ArrivalBriefingFlow.jsx';
import { DIFFICULTY_IDS, DIFFICULTY_META, getDifficultyConfig, getDifficultyProfile, shouldShowTutorial } from '../../lib/difficulty.js';
import {
  generateCommittee, getCommitteeMember, bumpCommitteeMood, committeeMoodAverage,
  committeeMessage, FOOTY_TRIP_OPTIONS, applyFootyTrip, postMatchFundraiser,
  ensureWeatherForWeek, applyGroundDegradation, recoverGroundPreseason,
  groundConditionBand, stadiumDescription, generateJournalist, journalistMatchLine,
  rollPlayerTrait,
} from '../../lib/community.js';
import {
  generateJobMarket, takeSeasonOff,
} from '../../lib/coachReputation.js';
// --- Finance system rebuild ---
import {
  effectiveWageCap, capHeadroom,
  currentPlayerWageBill,
  canAffordSigning, makeStartingFinance, scoutedOverall,
  incomeBreakdown, expenseBreakdown,
  annualWageBill, leagueTierOf,
  scaledSquadToFitCap, rookieDraftWage,
} from '../../lib/finance/engine.js';
import {
  tickSponsorYears, proposalForRenewal, generateSponsorOffers,
  applyRenewalAcceptance, applyRenewalDecline, applySponsorOfferAcceptance,
  buildInitialSponsorOffers,
} from '../../lib/finance/sponsors.js';
import { proposeRenewal, renewalExtensionStableKey, applyRenewal, applyRenewalRejection, canAffordRenewal } from '../../lib/finance/contracts.js';
import { applyStaffRenewalAccept, applyStaffRenewalReject, canAffordStaffRenewal } from '../../lib/staffRenewals.js';
import { getAdvanceContext } from '../../lib/advanceContext.js';
import {
  ensureCareerBoard,
  resetExecutiveBoard,
  applyBoardConfidenceDelta,
  generateSeasonObjectives,
  updateBoardObjectiveProgress,
  resolveBoardObjectivesAtSeasonEnd,
  youthSeniorGameCount,
  boardObjectiveUiStatus,
  maybeEnqueueBoardMessage,
  maybeEnqueueBoardCrisisPrep,
  resolveBoardInboxChoice,
  planSeasonBoardMeetings,
  findDueBoardMeetingSlot,
  openBoardMeetingBlockingFromSlot,
  catchUpBoardMeetingForCurrentWeek,
  applyVoteSurvivalMutate,
  resolveRoutineBoardMeeting,
  alignBoardMembersToTarget,
  recalcBoardConfidence,
  applyMemberConfidenceDelta,
} from '../../lib/board.js';
import { getClubGround } from '../../data/grounds.js';
import { advanceCareerNextEvent, triggerSackState, primeSeasonStoryState } from '../../lib/careerAdvance.js';
import { assignDefaultCaptains, defaultClubCulture, turningPointRibbon } from '../../lib/gameDepth.js';
import { lineupPlayersOrdered, LINEUP_CAP, lineupPlayerCount, lineupHasPlayer, LINEUP_FIELD_COUNT, LINEUP_OVAL_SLOT_COUNT, removeIdFromLineup } from '../../lib/lineupHelpers.js';

// ============================================================================
// RECRUIT SCREEN — Trade / Draft / Youth / Local
// ============================================================================
function RecruitOffSeasonStrip({ career }) {
  const tradeLive = career.postSeasonPhase === 'trade_period' && career.inTradePeriod;
  const draftLive = (career.draftOrder || []).length > 0 && (career.draftPool || []).length > 0;
  if (!tradeLive && !draftLive) return null;
  return (
    <div
      className="mb-4 rounded-2xl border border-[var(--A-line)] p-4 flex flex-col gap-3"
      style={{ background: 'var(--A-panel-2)' }}
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute">Off-season focus</div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {tradeLive && (
          <div className="flex-1 min-w-[200px] rounded-xl border border-aline bg-apanel p-3 flex gap-3 items-center">
            <div className="text-2xl" aria-hidden>🤝</div>
            <div>
              <div className="font-display text-sm text-aaccent uppercase tracking-wide">Trade period</div>
              <div className="text-xs text-atext-dim mt-0.5">Player market and incoming offers — use large tiles below on phones.</div>
            </div>
          </div>
        )}
        {draftLive && (
          <div className="flex-1 min-w-[200px] rounded-xl border border-aline bg-apanel p-3 flex gap-3 items-center">
            <div className="text-2xl" aria-hidden>🎯</div>
            <div>
              <div className="font-display text-sm text-aaccent uppercase tracking-wide">National draft live</div>
              <div className="text-xs text-atext-dim mt-0.5">Pick order bar shows club colours; draft board is card-first on small screens.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecruitScreen({ career, club, updateCareer, tab, setTab }) {
  const offerCount = (career.pendingTradeOffers || []).filter(o => o.status === 'pending').length;
  const inTradePeriod = career.postSeasonPhase === 'trade_period' && career.inTradePeriod;
  const showPicks = !!career.draftPickBank;
  const t = tab || (offerCount > 0 ? "offers" : "trade");
  const tabs = [
    { key: "offers", label: `Offers${offerCount ? ` (${offerCount})` : ''}`, icon: Newspaper },
    ...(inTradePeriod ? [{ key: "freeagents", label: career.freeAgencyOpen ? "Free agents" : "Free agents (closed)", icon: UserPlus }] : []),
    ...(showPicks ? [{ key: "picks", label: "Draft picks", icon: FileText }] : []),
    { key: "trade", label: inTradePeriod ? "Player market" : "Trades", icon: Repeat },
    { key: "draft", label: "Draft", icon: Award },
    { key: "youth", label: "Youth Academy", icon: GraduationCap },
    { key: "local", label: "Local Football", icon: Map },
  ];
  return (
    <div className="anim-in touch-manipulation">
      <RecruitOffSeasonStrip career={career} />
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "offers" && <OffersTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "freeagents" && (inTradePeriod ? <FreeAgentsTab career={career} club={club} updateCareer={updateCareer} /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>Free agency runs during the post-season Trade Period (after the grand final).</div>
      ))}
      {t === "picks" && (showPicks ? <DraftPickBankTab career={career} /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>Draft capital is prepared when the Trade Period opens.</div>
      ))}
      {t === "trade" && <TradeTab career={career} updateCareer={updateCareer} />}
      {t === "draft" && <DraftTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "youth" && <YouthTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "local" && <LocalTab career={career} club={club} updateCareer={updateCareer} />}
    </div>
  );
}

function DraftPickBankTab({ career }) {
  const bank = career.draftPickBank || {};
  const years = Object.keys(bank).sort();
  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>DRAFT CAPITAL</div>
        <div className="text-xs text-atext-dim">Selections tied to your club for the next three national drafts. Compensation picks are not tradeable.</div>
      </div>
      {years.length === 0 ? (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>No pick bank loaded.</div>
      ) : (
        years.map((y) => (
          <div key={y} className={`${css.panel} p-4`}>
            <div className="font-display text-lg text-aaccent mb-2">Season {y}</div>
            <div className="space-y-2">
              {(bank[y] || []).map((p) => (
                <div key={p.id} className="flex flex-wrap justify-between gap-2 text-sm border-b border-aline pb-2 last:border-0">
                  <span>Round {p.round} · pick #{p.selection}</span>
                  <span className="text-atext-dim">{p.type === 'compensation' ? 'Compensation (NT)' : 'Tradeable'}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FreeAgentsTab({ career, updateCareer }) {
  const pool = career.offSeasonFreeAgents || [];
  const wageCap = effectiveWageCap(career);
  const sign = (fa) => {
    if (!career.freeAgencyOpen) return;
    if (career.squad.length >= 40) return;
    if (career.finance.transferBudget < fa.value * 0.35) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ Not enough transfer budget to sign ${fa.firstName} ${fa.lastName}.` }, ...(career.news || [])].slice(0, 15) });
      return;
    }
    if (!canAffordSigning(career, fa.wageAsk)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ Cap won’t fit ${fa.firstName} ${fa.lastName} at ${fmtK(fa.wageAsk)}/yr.` }, ...(career.news || [])].slice(0, 15) });
      return;
    }
    const fee = Math.round(fa.value * 0.35);
    const signingBonus = Math.round(fa.value * 0.05);
    const newPlayer = {
      id: `fa_sign_${Date.now()}_${rand(1e9, 2e9 - 1)}`,
      firstName: fa.firstName,
      lastName: fa.lastName,
      position: fa.position,
      age: fa.age,
      overall: fa.overall,
      potential: fa.potential ?? fa.overall + 5,
      value: fa.value,
      wage: fa.wageAsk,
      contract: fa.contractYearsAsk,
      attrs: fa.attrs,
      trueRating: fa.trueRating ?? fa.overall,
      tier: fa.tier ?? leagueTierOf(career),
      fitness: 92,
      form: 72,
      goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0, suspended: 0, morale: 78,
      receivedInTrade: null,
      seasonsAtClub: 0,
    };
    const bal = { ...(career.freeAgentBalance || { gained: 0, lost: 0 }), gained: (career.freeAgentBalance?.gained || 0) + 1 };
    updateCareer({
      squad: [...career.squad, newPlayer],
      offSeasonFreeAgents: pool.filter((x) => x.id !== fa.id),
      finance: {
        ...career.finance,
        transferBudget: career.finance.transferBudget - fee,
        cash: career.finance.cash - signingBonus,
      },
      freeAgentBalance: bal,
      news: [{ week: career.week, type: 'win', text: `✍️ Free agency: signed ${fa.firstName} ${fa.lastName} — ${fa.contractYearsAsk}yr @ ${fmtK(fa.wageAsk)}/yr` }, ...(career.news || [])].slice(0, 20),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>FREE AGENTS</div>
          <div className="text-xs text-atext-dim">Out-of-contract players movement through Day 7 of the Trade Period.</div>
        </div>
        {!career.freeAgencyOpen && (
          <Pill color="#64748B">Window closed — list-only trades until Day 14</Pill>
        )}
      </div>
      <div className={`${css.panel} p-4 text-xs text-atext-dim`}>
        Cap room: {wageCap > 0 ? fmtK(Math.max(0, wageCap - currentPlayerWageBill(career))) : '—'} · Transfer budget {fmtK(career.finance.transferBudget)}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--A-line)', background: 'var(--A-panel)' }}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{ borderColor: 'var(--A-line)', background: 'var(--A-panel-2)' }}>
          <div className="col-span-4">Player</div>
          <div className="col-span-2">Pos</div>
          <div className="col-span-2">OVR</div>
          <div className="col-span-2 text-right">Ask</div>
          <div className="col-span-2 text-right"></div>
        </div>
        {pool.length === 0 ? (
          <div className="p-8 text-center text-sm text-atext-dim">No listings left this off-season.</div>
        ) : (
          pool.map((fa) => (
            <div key={fa.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm" style={{ borderBottom: '1px solid var(--A-line)' }}>
              <div className="col-span-4">
                <div className="font-semibold">{fa.firstName} {fa.lastName}</div>
                <div className="text-[10px] text-atext-dim">{fa.freeAgentType || 'UFA'} · age {fa.age}</div>
              </div>
              <div className="col-span-2"><Pill color="#4ADBE8">{fa.position}</Pill></div>
              <div className="col-span-2"><RatingDot value={fa.overall} /></div>
              <div className="col-span-2 text-right font-mono text-xs">{fmtK(fa.wageAsk)}/yr · {fa.contractYearsAsk}y</div>
              <div className="col-span-2 text-right">
                <button
                  type="button"
                  disabled={!career.freeAgencyOpen}
                  onClick={() => sign(fa)}
                  className={career.freeAgencyOpen ? `${css.btnPrimary} text-xs px-3 py-1.5` : 'px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute'}
                >
                  Sign
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function OffersTab({ career, club, updateCareer }) {
  const offers = (career.pendingTradeOffers || []).filter(o => o.status === 'pending');
  const finance = career.finance;

  const acceptOffer = (offer) => {
    const targetPlayer = career.squad.find(p => p.id === offer.targetPlayerId);
    if (!targetPlayer) return;
    if (playerBlockedFromTrade(targetPlayer, career.season)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ ${targetPlayer.firstName} ${targetPlayer.lastName} can't be traded until next season (recently arrived).` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    const incomingPlayer = offer.offerPlayerSnapshot
      ? { ...offer.offerPlayerSnapshot, id: `incoming_${Date.now()}`, fitness: 90, form: 70, contract: 2, attrs: targetPlayer.attrs, potential: offer.offerPlayerSnapshot.overall + 4, trueRating: offer.offerPlayerSnapshot.overall, goals: 0, behinds: 0, disposals: 0, marks: 0, tackles: 0, gamesPlayed: 0, injured: 0, suspended: 0, morale: 75,
          receivedInTrade: career.season, seasonsAtClub: 0 }
      : null;
    // Cap check: if a swap player is incoming, ensure their wage fits after target leaves
    if (incomingPlayer) {
      const wageDelta = (incomingPlayer.wage ?? 0) - (targetPlayer.wage ?? 0);
      if (!canAffordSigning(career, wageDelta)) {
        updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Trade rejected — bringing in ${incomingPlayer.firstName} ${incomingPlayer.lastName} would breach the cap` }, ...(career.news || [])].slice(0, 20) });
        return;
      }
    }
    const newSquad = career.squad.filter(p => p.id !== offer.targetPlayerId);
    if (incomingPlayer) newSquad.push(incomingPlayer);
    // Remove swap player from AI squad (if any)
    const newAiSquads = { ...(career.aiSquads || {}) };
    if (offer.offerPlayerId && newAiSquads[offer.fromClubId]) {
      newAiSquads[offer.fromClubId] = newAiSquads[offer.fromClubId].filter(p => p.id !== offer.offerPlayerId);
      // Add the player we sold to their squad
      newAiSquads[offer.fromClubId] = [...newAiSquads[offer.fromClubId], targetPlayer];
    }
    updateCareer({
      squad: newSquad,
      lineup: career.lineup.filter(id => id !== offer.targetPlayerId),
      aiSquads: newAiSquads,
      finance: { ...finance, cash: finance.cash + offer.offerCash, transferBudget: finance.transferBudget + Math.round(offer.offerCash * 0.4) },
      pendingTradeOffers: (career.pendingTradeOffers || []).map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o),
      news: [{
        week: career.week,
        type: 'info',
        text: `🤝 Trade complete: ${targetPlayer.firstName} ${targetPlayer.lastName} → ${offer.fromClubName} for ${fmtK(offer.offerCash)}${incomingPlayer ? ` + ${incomingPlayer.firstName} ${incomingPlayer.lastName}` : ''}`,
      }, ...(career.news || [])].slice(0, 20),
    });
  };

  const rejectOffer = (offer) => {
    updateCareer({
      pendingTradeOffers: (career.pendingTradeOffers || []).map(o => o.id === offer.id ? { ...o, status: 'rejected' } : o),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>TRADE OFFERS</div>
          <div className="text-xs text-atext-dim">Rival clubs are circling. Accept, reject — or let the window close.</div>
        </div>
        <Stat label="Pending" value={offers.length} accent="var(--A-accent-2)" />
      </div>

      {offers.length === 0 ? (
        <div className={`${css.panel} p-12 text-center text-sm text-atext-dim`}>
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No active offers right now. Wait for the trade window or check back after key events.
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => {
            const player = career.squad.find(p => p.id === offer.targetPlayerId);
            if (!player) return null;
            return (
              <div key={offer.id} className={`${css.panel} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-aaccent">{offer.fromClubName} offers</div>
                    <div className="font-display text-2xl text-atext mt-1">{fmtK(offer.offerCash)}{offer.offerPlayerSnapshot ? ` + ${offer.offerPlayerSnapshot.firstName} ${offer.offerPlayerSnapshot.lastName}` : ''}</div>
                    {offer.offerPlayerSnapshot && (
                      <div className="text-xs text-atext-dim mt-1">{offer.offerPlayerSnapshot.position} · {offer.offerPlayerSnapshot.overall} OVR · age {offer.offerPlayerSnapshot.age}</div>
                    )}
                  </div>
                  <ArrowRight className="w-6 h-6 text-aaccent" />
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-dim">For</div>
                    <div className="font-display text-2xl text-atext mt-1">{player.firstName} {player.lastName}</div>
                    <div className="text-xs text-atext-dim mt-1">{player.position} · {player.overall} OVR · age {player.age} · {fmtK(player.wage)}/yr</div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => rejectOffer(offer)} className="px-4 py-2 rounded-lg text-xs font-bold bg-apanel-2 text-atext-dim hover:bg-aline">Reject</button>
                  <button onClick={() => acceptOffer(offer)} className={`${css.btnPrimary} text-xs px-4 py-2`}>Accept Trade</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TradeTab({ career, updateCareer }) {
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("overall");
  const [capOnly, setCapOnly] = useState(false);
  const [negotiating, setNegotiating] = useState(null); // { playerId, wage, years, counterUsed }
  const pool = career.tradePool || [];
  const wageCap = effectiveWageCap(career);
  const currentWages = currentPlayerWageBill(career);
  const headroom = Math.max(0, wageCap - currentWages);

  const filtered = pool.filter(p => {
    if (filter !== "ALL" && !playerHasPosition(p, filter)) return false;
    if (capOnly && wageCap > 0 && !canAffordSigning(career, p.wage)) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "overall") return b.overall - a.overall;
    if (sortBy === "value") return b.value - a.value;
    if (sortBy === "age") return a.age - b.age;
    if (sortBy === "wage") return (a.wage || 0) - (b.wage || 0);
    if (sortBy === "potential") return (b.potential || 0) - (a.potential || 0);
    return 0;
  });

  const openNegotiation = (p) => {
    const demandedWage  = Math.round(p.wage * (1.05 + rng() * 0.2));
    const demandedYears = rand(1, 3);
    setNegotiating({ playerId: p.id, wage: demandedWage, years: demandedYears, counterUsed: false });
  };

  const acceptDeal = (p) => {
    if (career.finance.transferBudget < p.value) return;
    if (career.squad.length >= 40) return;
    if (!canAffordSigning(career, negotiating.wage)) return;
    const signedPlayer = { ...p, id: Date.now() + rand(0, 999_999), wage: negotiating.wage, contract: negotiating.years, receivedInTrade: null, seasonsAtClub: 0 };
    // Spec Phase 2: trades come out of the transfer budget only; signing-on bonus = 5% of value from cash.
    const signingBonus = Math.round(p.value * 0.05);
    updateCareer({
      squad: [...career.squad, signedPlayer],
      tradePool: pool.filter(x => x.id !== p.id),
      finance: { ...career.finance, transferBudget: career.finance.transferBudget - p.value, cash: career.finance.cash - signingBonus },
      news: [{ week: career.week, type: "win", text: `🤝 Signed ${p.firstName} ${p.lastName} (${p.overall} OVR) — ${negotiating.years}yr @ ${fmtK(negotiating.wage)}/yr` }, ...career.news].slice(0,15),
    });
    setNegotiating(null);
  };

  const counterOffer = (p) => {
    if (negotiating.counterUsed) return;
    const counterWage = Math.round(negotiating.wage * 0.88);
    const success = rng() < 0.65;
    if (success) {
      setNegotiating({ ...negotiating, wage: counterWage, counterUsed: true });
    } else {
      setNegotiating(null);
      updateCareer({ news: [{ week: career.week, type: "info", text: `❌ ${p.firstName} ${p.lastName} rejected your counter-offer and walked away` }, ...career.news].slice(0,15) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>TRADE MARKET</div>
          <div className="text-xs text-atext-dim">Players currently available across the league pyramid.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="#4ADBE8" />
          <Stat label="Cap headroom" value={fmtK(headroom)} accent={headroom > 0 ? "#4AE89A" : "#E84A6F"} />
          <Stat label="Squad Size" value={`${career.squad.length}/40`} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-atext-dim uppercase tracking-wider">Position:</span>
        {["ALL", ...POSITIONS].map(pos => (
          <button key={pos} type="button" onClick={()=>setFilter(pos)} className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold touch-manipulation ${filter===pos ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{pos}</button>
        ))}
        <label className="flex items-center gap-2 text-[11px] text-atext-dim cursor-pointer ml-2">
          <input type="checkbox" checked={capOnly} onChange={e => setCapOnly(e.target.checked)} className="rounded border-aline" />
          Fits cap (listed wage)
        </label>
        <span className="ml-4 text-xs text-atext-dim uppercase tracking-wider">Sort:</span>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="bg-apanel-2 border border-aline rounded-lg px-3 py-1.5 text-xs text-atext">
          <option value="overall">Overall</option>
          <option value="value">Value</option>
          <option value="age">Age</option>
          <option value="wage">Listed wage</option>
          <option value="potential">Potential</option>
        </select>
      </div>

      <div className="hidden xl:block rounded-2xl overflow-x-auto" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b grid min-w-[720px]" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)", gridTemplateColumns:"minmax(120px,1.1fr) 2.5rem 2rem 2.5rem 2.5rem minmax(56px,0.7fr) minmax(64px,0.9fr) minmax(56px,0.7fr) 4rem 3.5rem"}}>
          <div>Player</div>
          <div>Ps</div>
          <div>Ag</div>
          <div>OVR</div>
          <div>Pot</div>
          <div>Club</div>
          <div className="text-right">Fee</div>
          <div className="text-right">Wage</div>
          <div className="text-center">Cap</div>
          <div></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto min-w-[720px]">
          {sorted.map(p => {
            const sellerClub = findClubByShort(p.fromClub);
            const canAfford = career.finance.transferBudget >= p.value;
            const capRoom = wageCap - currentWages;
            const isNeg = negotiating?.playerId === p.id;
            const capBlock = negotiating && isNeg && (currentWages + negotiating.wage > wageCap);
            const fitsListWage = wageCap <= 0 || canAffordSigning(career, p.wage);
            return (
              <div key={p.id}>
                <div className="gap-2 px-4 py-3 items-center transition-colors grid min-w-[720px]" style={{borderBottom: isNeg ? "none" : "1px solid var(--A-line)", gridTemplateColumns:"minmax(120px,1.1fr) 2.5rem 2rem 2.5rem 2.5rem minmax(56px,0.7fr) minmax(64px,0.9fr) minmax(56px,0.7fr) 4rem 3.5rem"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,224,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div>
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-atext-dim">Ask · {fmtK(p.wage)}/yr</div>
                  </div>
                  <div><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                  <div className="text-sm text-center">{p.age}</div>
                  <div className="flex justify-center"><RatingDot value={p.overall} /></div>
                  <div className="text-sm text-center text-[#4AE89A]">{p.potential}</div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {sellerClub ? <ClubBadge club={sellerClub} size="xs" /> : null}
                    <span className="text-[10px] text-atext-dim truncate" title={p.fromClub}>{p.fromClub}</span>
                  </div>
                  <div className="text-right text-sm font-mono font-bold" style={{color: canAfford ? "#4AE89A" : "#E84A6F"}}>{fmtK(p.value)}</div>
                  <div className="text-right text-xs font-mono text-atext-dim">{fmtK(p.wage)}</div>
                  <div className="flex justify-center">
                    {wageCap <= 0 ? (
                      <Pill color="#64748B">—</Pill>
                    ) : fitsListWage ? (
                      <Pill color="#4AE89A">OK</Pill>
                    ) : (
                      <Pill color="#E84A6F">No</Pill>
                    )}
                  </div>
                  <div className="flex justify-end">
                    {isNeg
                      ? <button onClick={()=>setNegotiating(null)} className="text-xs text-atext-mute hover:text-atext-dim px-2 py-1">✕</button>
                      : <button onClick={()=>canAfford ? openNegotiation(p) : null} disabled={!canAfford} className={canAfford ? `${css.btnPrimary} text-xs px-3 py-1.5` : "px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute"}>{canAfford ? "Negotiate" : "Too dear"}</button>
                    }
                  </div>
                </div>
                {isNeg && (
                  <div className="mx-4 mb-3 rounded-xl p-4" style={{background:"#F0FDF4", border:"1px solid #BBF7D0"}}>
                    <div className="text-xs font-bold text-[#166534] mb-2">📋 {p.firstName} {p.lastName}'s demands</div>
                    <div className="flex gap-6 mb-3">
                      <div>
                        <div className="text-[10px] text-atext-dim uppercase tracking-wider">Wage demand</div>
                        <div className="font-display text-xl text-atext">{fmtK(negotiating.wage)}<span className="text-sm font-sans">/yr</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-atext-dim uppercase tracking-wider">Contract length</div>
                        <div className="font-display text-xl text-atext">{negotiating.years}<span className="text-sm font-sans"> yr</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-atext-dim uppercase tracking-wider">Cap room after</div>
                        <div className={`font-display text-xl ${capBlock ? 'text-[#E84A6F]' : 'text-[#4AE89A]'}`}>{fmtK(capRoom - negotiating.wage)}</div>
                      </div>
                    </div>
                    {capBlock && <div className="text-xs text-[#E84A6F] mb-2">⚠️ Signing this player would exceed your salary cap.</div>}
                    <div className="flex gap-2">
                      <button onClick={()=>acceptDeal(p)} disabled={capBlock} className={capBlock ? "px-4 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-xs px-4 py-2`}>
                        ✅ Accept deal
                      </button>
                      {!negotiating.counterUsed && (
                        <button onClick={()=>counterOffer(p)} className="px-4 py-2 rounded-lg text-xs font-bold border" style={{background:"rgba(255,179,71,0.10)", color:"var(--A-accent-2)", borderColor:"rgba(255,179,71,0.30)"}}>
                          🔄 Counter (−12%)
                        </button>
                      )}
                      {negotiating.counterUsed && (
                        <span className="px-4 py-2 text-xs text-atext-mute">Counter used — accept or walk away</span>
                      )}
                      <button onClick={()=>setNegotiating(null)} className="px-4 py-2 rounded-lg text-xs font-bold bg-apanel-2 text-atext-dim hover:bg-aline">
                        Walk away
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {sorted.length === 0 && <div className="p-8 text-center text-sm text-atext-dim">No players match the filter. Try widening your search.</div>}
        </div>
      </div>

      <div className="xl:hidden space-y-3">
        {sorted.map((p) => {
          const sellerClub = findClubByShort(p.fromClub);
          const canAfford = career.finance.transferBudget >= p.value;
          const capRoom = wageCap - currentWages;
          const isNeg = negotiating?.playerId === p.id;
          const capBlock = negotiating && isNeg && currentWages + negotiating.wage > wageCap;
          const fitsListWage = wageCap <= 0 || canAffordSigning(career, p.wage);
          return (
            <div key={p.id} className="rounded-2xl border border-[var(--A-line)] bg-[var(--A-panel)] p-4">
              <div className="flex gap-3">
                {sellerClub ? <ClubBadge club={sellerClub} size="md" /> : <div className="w-10 h-10 rounded-lg bg-apanel-2 flex items-center justify-center text-[10px] text-atext-mute">?</div>}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-atext">{p.firstName} {p.lastName}</div>
                  <div className="text-xs text-atext-dim mt-1">{formatPositionSlash(p)} · age {p.age} · {p.fromClub}</div>
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <RatingDot value={p.overall} size="sm" />
                    <span className="text-xs text-[#4AE89A] font-bold">Pot {p.potential}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: canAfford ? "#4AE89A" : "#E84A6F" }}>{fmtK(p.value)}</span>
                    <span className="text-xs font-mono text-atext-dim">{fmtK(p.wage)}/yr</span>
                    {wageCap <= 0 ? (
                      <Pill color="#64748B">—</Pill>
                    ) : fitsListWage ? (
                      <Pill color="#4AE89A">Cap OK</Pill>
                    ) : (
                      <Pill color="#E84A6F">Cap</Pill>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {isNeg ? (
                  <button type="button" onClick={() => setNegotiating(null)} className="text-xs text-atext-mute px-3 py-2 min-h-[44px] rounded-lg border border-aline">
                    Close
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => (canAfford ? openNegotiation(p) : null)}
                    disabled={!canAfford}
                    className={
                      canAfford
                        ? `${css.btnPrimary} text-xs px-4 py-2.5 min-h-[44px]`
                        : "px-4 py-2.5 min-h-[44px] rounded-lg text-xs bg-apanel-2 text-atext-mute"
                    }
                  >
                    {canAfford ? "Negotiate" : "Too dear"}
                  </button>
                )}
              </div>
              {isNeg && (
                <div className="mt-3 rounded-xl p-4" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <div className="text-xs font-bold text-[#166534] mb-2">📋 {p.firstName} {p.lastName}&apos;s demands</div>
                  <div className="flex flex-wrap gap-4 mb-3">
                    <div>
                      <div className="text-[10px] text-atext-dim uppercase tracking-wider">Wage demand</div>
                      <div className="font-display text-xl text-atext">
                        {fmtK(negotiating.wage)}
                        <span className="text-sm font-sans">/yr</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-atext-dim uppercase tracking-wider">Contract length</div>
                      <div className="font-display text-xl text-atext">
                        {negotiating.years}
                        <span className="text-sm font-sans"> yr</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-atext-dim uppercase tracking-wider">Cap room after</div>
                      <div className={`font-display text-xl ${capBlock ? "text-[#E84A6F]" : "text-[#4AE89A]"}`}>{fmtK(capRoom - negotiating.wage)}</div>
                    </div>
                  </div>
                  {capBlock && <div className="text-xs text-[#E84A6F] mb-2">⚠️ Signing this player would exceed your salary cap.</div>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => acceptDeal(p)} disabled={capBlock} className={capBlock ? "px-4 py-2 rounded-lg text-xs bg-apanel-2 text-atext-mute min-h-[44px]" : `${css.btnPrimary} text-xs px-4 py-2 min-h-[44px]`}>
                      Accept deal
                    </button>
                    {!negotiating.counterUsed && (
                      <button type="button" onClick={() => counterOffer(p)} className="px-4 py-2 rounded-lg text-xs font-bold border min-h-[44px]" style={{ background: "rgba(255,179,71,0.10)", color: "var(--A-accent-2)", borderColor: "rgba(255,179,71,0.30)" }}>
                        Counter (−12%)
                      </button>
                    )}
                    {negotiating.counterUsed && <span className="px-2 py-2 text-xs text-atext-mute self-center">Counter used</span>}
                    <button type="button" onClick={() => setNegotiating(null)} className="px-4 py-2 rounded-lg text-xs font-bold bg-apanel-2 text-atext-dim hover:bg-aline min-h-[44px]">
                      Walk away
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="p-8 text-center text-sm text-atext-dim rounded-2xl border border-[var(--A-line)] bg-[var(--A-panel)]">
            No players match the filter. Try widening your search.
          </div>
        )}
      </div>
    </div>
  );
}

function DraftTab({ career, club, updateCareer }) {
  const [posFilter, setPosFilter] = useState("ALL");
  const [poolSort, setPoolSort] = useState("overall");
  const draftOrder = career.draftOrder || [];
  const myPickIndex = draftOrder.findIndex(d => d.clubId === career.clubId && !d.used);
  const myNextPick = myPickIndex >= 0 ? draftOrder[myPickIndex] : null;
  const isMyTurn = myPickIndex !== -1 && myPickIndex === draftOrder.findIndex(d => !d.used);
  const dTier = leagueTierOf(career);

  const basePool = useMemo(() => {
    let arr = [...(career.draftPool || [])];
    if (posFilter !== "ALL") arr = arr.filter(p => playerHasPosition(p, posFilter));
    arr.sort((a, b) => {
      if (poolSort === "overall") return b.overall - a.overall;
      if (poolSort === "potential") return (b.potential || 0) - (a.potential || 0);
      if (poolSort === "wageFit") return rookieDraftWage(a.overall, dTier) - rookieDraftWage(b.overall, dTier);
      return b.overall - a.overall;
    });
    return arr;
  }, [career.draftPool, posFilter, poolSort, dTier]);

  const aiPickFromPool = (clubId, currentPool) => {
    if (!currentPool.length) return null;
    const ranked = [...currentPool].sort((a, b) => b.overall - a.overall);
    if (rng() < 0.72) return ranked[0];
    const k = Math.min(5, ranked.length);
    return ranked[rand(0, k - 1)];
  };

  const draftPlayer = (p) => {
    if (!isMyTurn) {
      // Sim AI picks until our slot
      let order = [...draftOrder];
      let currentPool = [...career.draftPool];
      let currentAiSquads = { ...(career.aiSquads || {}) };
      const newsItems = [];
      while (true) {
        const next = order.findIndex(d => !d.used);
        if (next === -1) break;
        const pickEntry = order[next];
        if (pickEntry.clubId === career.clubId) break;
        const aiPick = aiPickFromPool(pickEntry.clubId, currentPool);
        if (!aiPick) break;
        currentPool = currentPool.filter(x => x.id !== aiPick.id);
        currentAiSquads[pickEntry.clubId] = currentAiSquads[pickEntry.clubId] || [];
        currentAiSquads[pickEntry.clubId] = [...currentAiSquads[pickEntry.clubId], { ...aiPick, age: rand(17, 19) }];
        order = order.map((d, i) => i === next ? { ...d, used: true, prospectName: `${aiPick.firstName} ${aiPick.lastName}`, prospectOverall: aiPick.overall, prospectPos: aiPick.position } : d);
        const oppClub = findClub(pickEntry.clubId);
        newsItems.push({ week: career.week, type: 'info', text: `📋 #${pickEntry.pick}: ${oppClub?.short || pickEntry.clubId} → ${aiPick.firstName} ${aiPick.lastName} (${aiPick.overall})` });
      }
      updateCareer({
        draftPool: currentPool,
        draftOrder: order,
        aiSquads: currentAiSquads,
        news: [...newsItems.slice(-5), ...(career.news || [])].slice(0, 20),
      });
      return;
    }
    if (career.squad.length >= 40) return;
    const rw = rookieDraftWage(p.overall, dTier);
    if (!canAffordSigning(career, rw)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot draft ${p.firstName} ${p.lastName} — over salary cap` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    const rookie = { ...p, id: `r_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage: rw, contract: 2, age: rand(17, 19), rookie: true };
    let order = draftOrder.map((d, i) => i === myPickIndex ? { ...d, used: true, prospectName: `${p.firstName} ${p.lastName}`, prospectOverall: p.overall, prospectPos: p.position } : d);
    let currentPool = career.draftPool.filter(x => x.id !== p.id);
    let currentAiSquads = { ...(career.aiSquads || {}) };
    const newsItems = [{ week: career.week, type: 'win', text: `🎯 #${myNextPick.pick}: ${club.short} draft ${p.firstName} ${p.lastName} (${p.overall} OVR)` }];
    // Auto-run AI picks until next player turn
    while (true) {
      const nextIdx = order.findIndex(d => !d.used);
      if (nextIdx === -1) break;
      const pickEntry = order[nextIdx];
      if (pickEntry.clubId === career.clubId) break;
      const aiPick = aiPickFromPool(pickEntry.clubId, currentPool);
      if (!aiPick) break;
      currentPool = currentPool.filter(x => x.id !== aiPick.id);
      currentAiSquads[pickEntry.clubId] = currentAiSquads[pickEntry.clubId] || [];
      currentAiSquads[pickEntry.clubId] = [...currentAiSquads[pickEntry.clubId], { ...aiPick, age: rand(17, 19) }];
      order = order.map((d, i) => i === nextIdx ? { ...d, used: true, prospectName: `${aiPick.firstName} ${aiPick.lastName}`, prospectOverall: aiPick.overall, prospectPos: aiPick.position } : d);
      const oppClub = findClub(pickEntry.clubId);
      newsItems.push({ week: career.week, type: 'info', text: `📋 #${pickEntry.pick}: ${oppClub?.short || pickEntry.clubId} → ${aiPick.firstName} ${aiPick.lastName}` });
    }
    updateCareer({
      squad: [...career.squad, rookie],
      draftPool: currentPool,
      draftOrder: order,
      aiSquads: currentAiSquads,
      news: [...newsItems.slice(0, 6), ...(career.news || [])].slice(0, 20),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>NATIONAL DRAFT</div>
          <div className="text-xs text-atext-dim">{draftOrder.length === 0 ? 'Draft order is set after each season ends.' : isMyTurn ? `On the clock: pick #${myNextPick.pick}.` : myNextPick ? `Your next pick: #${myNextPick.pick}` : 'You have no remaining picks.'}</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Pool" value={basePool.length} accent="#4AE89A" />
          <Stat label="Squad" value={`${career.squad.length}/40`} accent="var(--A-accent)" />
        </div>
      </div>

      {draftOrder.length > 0 && (
        <div className={`${css.panel} p-4`}>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute mb-2">Pick Order — next 12</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {draftOrder.slice(0, 12).map(d => {
              const c = findClub(d.clubId);
              const isMe = d.clubId === career.clubId;
              const onClock = !d.used && d.clubId === draftOrder.find(x => !x.used)?.clubId;
              return (
                <div key={d.pick} className={`flex-shrink-0 px-2 py-2 rounded-lg text-xs touch-manipulation ${d.used ? 'opacity-40' : ''}`}
                  style={{
                    background: isMe ? 'rgba(0,224,255,0.12)' : 'var(--A-panel-2)',
                    border: `1px solid ${onClock ? 'var(--A-accent)' : 'var(--A-line)'}`,
                    minWidth: 112,
                    minHeight: 76,
                  }}>
                  <div className="flex items-start gap-2">
                    {c ? <ClubBadge club={c} size="sm" /> : <div className="w-9 h-9 rounded-lg bg-apanel shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] text-atext-mute">#{d.pick}</div>
                      <div className={`font-display text-sm leading-tight ${isMe ? 'text-aaccent' : 'text-atext'}`}>{c?.short || d.clubId}</div>
                      {d.used && d.prospectName && <div className="text-[9px] text-atext-dim truncate mt-0.5 max-w-[7rem]">{d.prospectName} ({d.prospectOverall})</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-atext-dim uppercase tracking-wider">Position:</span>
        {["ALL", ...POSITIONS].map(pos => (
          <button key={pos} type="button" onClick={() => setPosFilter(pos)} className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold touch-manipulation ${posFilter === pos ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{pos}</button>
        ))}
        <span className="ml-3 text-xs text-atext-dim uppercase tracking-wider">Sort pool:</span>
        <select value={poolSort} onChange={e => setPoolSort(e.target.value)} className="bg-apanel-2 border border-aline rounded-lg px-3 py-1.5 text-xs text-atext">
          <option value="overall">Overall</option>
          <option value="potential">Potential</option>
          <option value="wageFit">Rookie wage (low first)</option>
        </select>
      </div>

      <div className="hidden xl:block rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
          <div className="col-span-1">#</div>
          <div className="col-span-4">Prospect</div>
          <div className="col-span-1">Pos</div>
          <div className="col-span-1">OVR</div>
          <div className="col-span-2">Potential</div>
          <div className="col-span-2 text-right">Rookie Wage</div>
          <div className="col-span-1"></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {basePool.slice(0, 50).map((p, i) => {
            const rw = rookieDraftWage(p.overall, dTier);
            const capOk = canAffordSigning(career, rw);
            return (
              <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid var(--A-line)"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,224,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div className="col-span-1 font-bold text-aaccent">#{i+1}</div>
                <div className="col-span-4 font-semibold text-sm">{p.firstName} {p.lastName} <span className="text-[10px] text-atext-dim ml-1">(draft age ~17–19)</span></div>
                <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                <div className="col-span-1"><RatingDot value={p.overall} /></div>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="font-bold text-[#4AE89A]">{p.potential}</div>
                  <Bar value={p.potential} color="#4AE89A" small />
                </div>
                <div className="col-span-2 text-right text-sm font-mono">
                  <span style={{ color: capOk ? '#4AE89A' : '#E84A6F' }}>${(rw/1000).toFixed(0)}k</span>
                  <span className="text-[10px] text-atext-dim block">est. rookie</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={()=>draftPlayer(p)} className={`${css.btnPrimary} text-xs px-4 py-2.5 min-h-[44px] touch-manipulation`}>{isMyTurn ? 'Draft' : 'Sim →'}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="xl:hidden space-y-3">
        {basePool.slice(0, 50).map((p, i) => {
          const rw = rookieDraftWage(p.overall, dTier);
          const capOk = canAffordSigning(career, rw);
          return (
            <div key={p.id} className="rounded-2xl border border-[var(--A-line)] bg-[var(--A-panel)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-aaccent text-sm">Pool #{i + 1}</div>
                  <div className="font-semibold text-atext mt-1">{p.firstName} {p.lastName}</div>
                  <div className="text-[10px] text-atext-dim">Draft age ~17–19</div>
                </div>
                <Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 items-center">
                <RatingDot value={p.overall} size="sm" />
                <div className="font-bold text-[#4AE89A]">Pot {p.potential}</div>
                <Bar value={p.potential} color="#4AE89A" small />
                <span className="text-sm font-mono" style={{ color: capOk ? "#4AE89A" : "#E84A6F" }}>
                  ${(rw / 1000).toFixed(0)}k
                </span>
                <span className="text-[10px] text-atext-dim">rookie est.</span>
              </div>
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => draftPlayer(p)} className={`${css.btnPrimary} text-xs px-4 py-2.5 min-h-[44px] touch-manipulation`}>
                  {isMyTurn ? "Draft" : "Sim →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Bottom-of-ladder clubs pick first. Hit "Sim →" to fast-forward AI selections to your slot. Higher potential = bigger growth ceiling but slower start.
      </div>
    </div>
  );
}

function YouthTab({ career, club, updateCareer }) {
  const youth = career.youth;
  const [generated, setGenerated] = useState(youth.recruits || []);

  // Map scout focus to position bias + attribute bias
  const FOCUS_BIAS = {
    'All-rounders':    { positions: null,                    attrBoost: {} },
    'Key Forwards':    { positions: ['KF', 'HF'],            attrBoost: { marking: 4, strength: 3, kicking: 2 } },
    'Midfielders':     { positions: ['C', 'R', 'WG'],        attrBoost: { decision: 3, endurance: 4, handball: 3 } },
    'Key Defenders':   { positions: ['KB', 'HB'],            attrBoost: { marking: 4, tackling: 3, strength: 3 } },
    'Ruckmen':         { positions: ['RU'],                  attrBoost: { strength: 5, marking: 3 } },
    'Small Forwards':  { positions: ['HF', 'UT'],            attrBoost: { speed: 4, kicking: 2, decision: 2 } },
  };

  const generateRecruits = () => {
    seedRng(Date.now() % 99999);
    const count = 4 + youth.programLevel * 2;
    const bias = FOCUS_BIAS[youth.scoutFocus] || FOCUS_BIAS['All-rounders'];
    const recruits = [];
    let i = 0;
    while (recruits.length < count) {
      const p = generatePlayer(2 + Math.floor(youth.programLevel / 3), 12000 + i + Date.now() % 1000, {
        clubId: career.clubId,
        season: career.season,
      });
      i++;
      // Reroll up to 3 times if position doesn't match the focus
      let attempts = 0;
      let cand = p;
      while (bias.positions && !bias.positions.includes(cand.position) && !(cand.secondaryPosition && bias.positions.includes(cand.secondaryPosition)) && attempts < 3) {
        cand = generatePlayer(2 + Math.floor(youth.programLevel / 3), 12000 + i + Date.now() % 1000, {
          clubId: career.clubId,
          season: career.season,
        });
        i++;
        attempts++;
      }
      // Apply attribute bias
      if (bias.attrBoost && Object.keys(bias.attrBoost).length) {
        const newAttrs = { ...cand.attrs };
        Object.entries(bias.attrBoost).forEach(([attr, boost]) => {
          if (attr in newAttrs) newAttrs[attr] = Math.min(99, newAttrs[attr] + boost);
        });
        const overall = Math.round(Object.values(newAttrs).reduce((a, b) => a + b, 0) / Object.keys(newAttrs).length);
        cand = { ...cand, attrs: newAttrs, overall };
      }
      recruits.push(cand);
    }
    setGenerated(recruits);
    updateCareer({ youth: { ...youth, recruits } });
  };
  const upgradeProgram = () => {
    const cost = youth.programLevel * 80000;
    if (career.finance.cash < cost || youth.programLevel >= 5) return;
    updateCareer({
      youth: { ...youth, programLevel: youth.programLevel + 1 },
      finance: { ...career.finance, cash: career.finance.cash - cost },
      news: [{ week: career.week, type: "info", text: `⭐ Youth program upgraded to Level ${youth.programLevel+1}` }, ...career.news].slice(0,15),
    });
  };
  const promote = (p) => {
    if (career.squad.length >= 40) return;
    const youthTier = leagueTierOf(career);
    const wage = youthTier === 1 ? 100_000 : youthTier === 2 ? 35_000 : 8_000;
    if (!canAffordSigning(career, wage)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot promote ${p.firstName} ${p.lastName} — over salary cap` }, ...career.news].slice(0, 15) });
      return;
    }
    const rookie = { ...p, id: Date.now() + rand(0, 999_999), wage, contract: 2, rookie: true };
    const remaining = generated.filter(x => x.id !== p.id);
    setGenerated(remaining);
    updateCareer({
      squad: [...career.squad, rookie],
      youth: { ...youth, recruits: remaining },
      news: [{ week: career.week, type: "info", text: `🌱 Promoted academy talent ${p.firstName} ${p.lastName} to rookie list (${fmtK(wage)}/yr)` }, ...career.news].slice(0,15),
    });
  };
  const focusOptions = ["All-rounders", "Key Forwards", "Midfielders", "Key Defenders", "Ruckmen", "Small Forwards"];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>YOUTH ACADEMY</div>
          <div className="text-xs text-atext-dim">Develop talent from the {club.state} zone. Build the next generation.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Program Level" value={`${youth.programLevel}/5`} accent="#4AE89A" />
          <Stat label="Zone" value={youth.zone} accent="#4ADBE8" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${css.panel} p-5 lg:col-span-1 space-y-4`}>
          <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-[#4AE89A]" /><div className="font-bold tracking-wide">Academy Settings</div></div>
          <div>
            <div className={css.label}>Recruitment Zone</div>
            <select value={youth.zone} onChange={e=>updateCareer({ youth: { ...youth, zone: e.target.value }})} className="w-full mt-2 bg-apanel border border-aline rounded-lg px-3 py-2 text-sm text-atext">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className={css.label}>Scout Focus</div>
            <select value={youth.scoutFocus} onChange={e=>updateCareer({ youth: { ...youth, scoutFocus: e.target.value }})} className="w-full mt-2 bg-apanel border border-aline rounded-lg px-3 py-2 text-sm text-atext">
              {focusOptions.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <div className={css.label}>Program Level</div>
            <div className="flex gap-1 mt-2">
              {Array.from({length:5}).map((_,i) => <div key={i} className="flex-1 h-3 rounded-full" style={{background: i < youth.programLevel ? "var(--A-pos)" : "var(--A-line)"}} />)}
            </div>
            <button onClick={upgradeProgram} disabled={youth.programLevel>=5||career.finance.cash<youth.programLevel*80000} className={`${css.btnPrimary} mt-3 text-xs w-full`}>
              {youth.programLevel >= 5 ? "Maxed" : `Upgrade Program · $${(youth.programLevel*80).toFixed(0)}k`}
            </button>
          </div>
          <button onClick={generateRecruits} className={`${css.btnGhost} text-xs w-full`}>Scout New Intake</button>
        </div>

        <div className={`${css.panel} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Sprout className="w-5 h-5 text-[#4AE89A]" /><div className="font-bold tracking-wide">Current Intake</div></div>
            <div className="text-xs text-atext-dim">{generated.length} recruit{generated.length !== 1 ? "s" : ""}</div>
          </div>
          {generated.length === 0 ? (
            <div className="text-center py-12 text-sm text-atext-dim">No recruits yet. Click "Scout New Intake" to find prospects from {youth.zone}.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {generated.map(p => (
                <div key={p.id} className={`${css.inset} p-3 grid grid-cols-12 gap-2 items-center`}>
                  <div className="col-span-4">
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-atext-dim">Age {rand(16,18)} · From {youth.zone}</div>
                  </div>
                  <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                  <div className="col-span-2"><RatingDot value={p.overall} /></div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-atext-dim">Potential</div>
                    <div className="flex items-center gap-1"><span className="text-xs font-bold text-[#4AE89A]">{p.potential}</span><Bar value={p.potential} color="#4AE89A" small /></div>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button onClick={()=>promote(p)} className={`${css.btnPrimary} text-xs px-3 py-1.5`}>Promote</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LocalTab({ career, club, updateCareer }) {
  const [scoutedPlayers, setScoutedPlayers] = useState([]);
  const [scoutingLeague, setScoutingLeague] = useState(null);
  // Find tier-3 leagues in same state, or tier-2 if at tier-1
  const myLeague = findLeagueOf(career.clubId);
  const localPool = LEAGUES_BY_STATE(club.state) || [];
  const localLeagues = localPool.filter(l => l.tier > myLeague.tier);

  const scout = (leagueKey) => {
    seedRng(Date.now() % 88888);
    const league = PYRAMID[leagueKey];
    const scoutPool = getCompetitionClubs(leagueKey, career.regionState ?? club.state, null);
    const poolRaw = scoutPool.length ? [...scoutPool] : [...league.clubs];
    for (let i = poolRaw.length - 1; i > 0; i--) {
      const j = rand(0, i);
      const tmp = poolRaw[i];
      poolRaw[i] = poolRaw[j];
      poolRaw[j] = tmp;
    }
    const found = Array.from({ length: 6 }, (_, i) => {
      const sourceClub = poolRaw[i % poolRaw.length];
      const cid = sourceClub.id || `local:${leagueKey}:${i}`;
      const p = generatePlayer(league.tier, 13000 + i + Date.now() % 500, {
        clubId: cid,
        season: career.season,
      });
      const shortLabel = sourceClub.short || sourceClub.name?.slice(0, 4)?.toUpperCase() || "?";
      return {
        ...p,
        fromLocal: shortLabel,
        fromClubId: sourceClub.id || null,
        scoutedOverall: scoutedOverall(p, career),
      };
    });
    setScoutedPlayers(found);
    setScoutingLeague(leagueKey);
  };

  const sign = (p) => {
    const localTier = leagueTierOf(career);
    const wage = localTier === 1 ? 200_000 : localTier === 2 ? 80_000 : 18_000;
    const fee  = localTier === 1 ? 75_000  : localTier === 2 ? 30_000 : 8_000;
    if (career.finance.cash < fee || career.squad.length >= 40) return;
    if (!canAffordSigning(career, wage)) return;
    const newPlayer = { ...p, id: Date.now() + rand(0, 999_999), wage, contract: 2 };
    setScoutedPlayers(s => s.filter(x => x.id !== p.id));
    updateCareer({
      squad: [...career.squad, newPlayer],
      finance: { ...career.finance, cash: career.finance.cash - fee },
      news: [{ week: career.week, type: "info", text: `📍 Signed local talent ${p.firstName} ${p.lastName} from ${p.fromLocal} ($${(fee/1000).toFixed(0)}k fee, ${(wage/1000).toFixed(0)}k/yr)` }, ...career.news].slice(0,15),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>LOCAL FOOTBALL</div>
          <div className="text-xs text-atext-dim">Scout lower-tier {club.state} leagues — each run cycles through local clubs so reports show names from rival sides, not just random noise.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Scout Cost" value="$30k" sub="per signing" accent="var(--A-accent)" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${css.panel} p-5 lg:col-span-1`}>
          <div className="flex items-center gap-2 mb-3"><Map className="w-5 h-5 text-aaccent" /><div className="font-bold tracking-wide">Lower {club.state} Leagues</div></div>
          {localLeagues.length === 0 ? (
            <div className="text-sm text-atext-dim py-4">No lower-tier leagues available in {club.state} from your current level.</div>
          ) : (
            <div className="space-y-2">
              {localLeagues.map(l => (
                <button key={l.key} onClick={()=>scout(l.key)} className={`w-full text-left p-3 rounded-lg border transition ${scoutingLeague===l.key ? "border-aaccent bg-aaccent/10" : "border-aline hover:border-aline-2 bg-apanel"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{l.short}</div>
                      <div className="text-[10px] text-atext-dim">{l.name}</div>
                    </div>
                    <Pill color="#4ADBE8">T{l.tier}</Pill>
                  </div>
                  <div className="text-[10px] text-atext-dim mt-1">{l.clubs.length} clubs · Scout for hidden talent</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`${css.panel} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-aaccent" /><div className="font-bold tracking-wide">Scouting Reports</div></div>
            {scoutingLeague && (
              <div className="text-[10px] text-atext-dim max-w-md text-right leading-snug">
                {PYRAMID[scoutingLeague].short} · six prospects, round-robin from league clubs
              </div>
            )}
          </div>
          {scoutedPlayers.length === 0 ? (
            <div className="text-center py-12 text-sm text-atext-dim">Pick a league to dispatch your scouts.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {scoutedPlayers.map(p => {
                const localTier = leagueTierOf(career);
                const wage = localTier === 1 ? 200_000 : localTier === 2 ? 80_000 : 18_000;
                const fee  = localTier === 1 ? 75_000  : localTier === 2 ? 30_000 : 8_000;
                const canCash = career.finance.cash >= fee;
                const canCap  = canAffordSigning(career, wage);
                const can     = canCash && canCap;
                const sourceClubVisual = p.fromClubId ? findClub(p.fromClubId) : findClubByShort(p.fromLocal);
                return (
                  <div key={p.id} className={`${css.inset} p-3 grid grid-cols-12 gap-2 items-center`}>
                    <div className="col-span-4 flex items-start gap-2 min-w-0">
                      {sourceClubVisual ? <ClubBadge club={sourceClubVisual} size="sm" className="flex-shrink-0 mt-0.5" /> : null}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                        <div className="text-[10px] text-atext-dim">From {p.fromLocal} · Age {p.age}</div>
                      </div>
                    </div>
                    <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
                    <div className="col-span-2"><RatingDot value={p.scoutedOverall ?? p.overall} /></div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-atext-dim">Potential</div>
                      <div className="flex items-center gap-1"><span className="text-xs font-bold text-[#4AE89A]">{p.potential}</span><Bar value={p.potential} color="#4AE89A" small /></div>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <button onClick={()=>sign(p)} disabled={!can}
                        className={can ? `${css.btnPrimary} text-xs px-3 py-1.5` : "px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute"}
                        title={!canCap ? 'Over salary cap' : !canCash ? 'Insufficient cash' : ''}>
                        Sign · ${(fee/1000).toFixed(0)}k
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Local scouting often unearths late bloomers and gritty depth players. They sign at modest wages but can develop dramatically with the right training program and game time.
      </div>
    </div>
  );
}
