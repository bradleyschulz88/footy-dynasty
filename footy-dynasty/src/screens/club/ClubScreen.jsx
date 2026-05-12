import React, { useState, useEffect } from "react";
import {
  Trophy, Users, DollarSign, Dumbbell, Building2, Handshake, Shirt,
  UserCog,   Repeat, Sprout, BarChart3, Calendar, ChevronRight, ChevronLeft,
  Home, Play, Pause, Save, ArrowUp, ArrowDown, ArrowRight,
  Star, Zap, Heart, Target, Activity, Flame, Sparkles, Crown,
  TrendingUp, TrendingDown, Plus, Minus, X, Check, Clock, MapPin,
  Newspaper, ShieldCheck, Gauge, Palette, Briefcase, GraduationCap,
  Map, Award, AlertCircle, ChevronsUp, FileText, RefreshCw, UserPlus,
  Landmark, GripVertical, LayoutDashboard, Wrench, MessageCircle,
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
import { ContractsTab, StaffRenewalsPanel } from '../contracts/ContractRenewals.jsx';
import GameOverScreen from '../../screens/GameOverScreen.jsx';
import SackingSequence from '../../screens/SackingSequence.jsx';
import VoteOfConfidenceFlow from '../../screens/VoteOfConfidenceFlow.jsx';
import BoardMeetingScreen from '../../screens/BoardMeetingScreen.jsx';
import ArrivalBriefingFlow from '../../screens/ArrivalBriefingFlow.jsx';
import { getDifficultyConfig } from '../../lib/difficulty.js';
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
import {
  clubEffectiveTab,
  tutorialHighlightTab,
} from "../../components/TutorialOverlay.jsx";

function clubLeafSection(leaf, showCommittee) {
  if (leaf === "overview") return "overview";
  if (["finances", "board", "sponsors", "contracts"].includes(leaf)) return "commercial";
  const ops = ["facilities", "staff"];
  if (showCommittee) ops.push("committee");
  if (ops.includes(leaf)) return "operations";
  if (["kits", "honours", "rookies"].includes(leaf)) return "identity";
  return "overview";
}

/** Hub landing for Club — jump-off tiles instead of a single long tab strip. */
function ClubOverviewTab({ career, club, setTab }) {
  const cash = career.finance?.cash ?? 0;
  const boardConf = career.finance?.boardConfidence ?? 0;
  const sponsorsN = (career.sponsors || []).length;
  const sponsorsAnnual = (career.sponsors || []).reduce((a, s) => a + (s.annualValue || 0), 0);
  const facAvg = avgFacilities(career.facilities);
  const staffAvg = avgStaff(career.staff);
  const rookies = (career.squad || []).filter((p) => p.rookie).length;

  const tile = (title, sublines, Icon, accent, go) => (
    <button
      type="button"
      key={title}
      onClick={go}
      className={`${css.panel} p-4 text-left rounded-xl border border-aline hover:border-aaccent/45 transition w-full`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18`, border: `1px solid ${accent}40` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-atext text-sm tracking-wide">{title}</div>
          <div className="text-[11px] text-atext-dim mt-1 space-y-0.5 leading-snug">
            {sublines.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-atext-dim flex-shrink-0 mt-1" />
      </div>
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <div className={`${css.h1} text-2xl md:text-3xl`}>CLUB OVERVIEW</div>
        <div className="text-xs text-atext-dim mt-1">
          {club.name} · Pick an area below or use the sections above
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {tile(
          "Commercial",
          [`Cash ${fmtK(cash)}`, `Board confidence ${boardConf}%`, `${sponsorsN} sponsors · contracts & cap`],
          Briefcase,
          "#4ADBE8",
          () => setTab("contracts"),
        )}
        {tile(
          "Operations",
          [`Facilities avg ${facAvg.toFixed(1)}`, `Staff avg ${Math.round(staffAvg)} rating`, "Venue, medical, coaches"],
          Wrench,
          "#4AE89A",
          () => setTab("facilities"),
        )}
        {tile(
          "Club & list",
          [`${rookies} rookies on list`, "Kits, honours & rookie list"],
          Shirt,
          "#A78BFA",
          () => setTab("kits"),
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CLUB SCREEN — grouped navigation + overview hub
// ============================================================================
export default function ClubScreen({ career, club, updateCareer, tab, setTab, tutorialActive }) {
  const t = clubEffectiveTab(tab);
  const tutStep = career.tutorialStep ?? 0;
  const clubTutorialTab = tutorialActive && (tutStep === 3 || tutStep === 4) ? tutorialHighlightTab(tutStep) : null;
  const primaryLockedToCommercial = !!clubTutorialTab;
  const leagueTier = (() => {
    const lg = findLeagueOf(career.clubId);
    return lg ? lg.tier : 1;
  })();
  const showCommittee = leagueTier <= 3 && Array.isArray(career.committee) && career.committee.length > 0;
  const activePrimary = clubLeafSection(t, showCommittee);

  useEffect(() => {
    if (t === "committee" && !showCommittee) setTab("facilities");
  }, [t, showCommittee, setTab]);

  useEffect(() => {
    if (t === "settings") setTab("kits");
  }, [t, setTab]);

  const primarySections = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "commercial", label: "Commercial", icon: Briefcase },
    { key: "operations", label: "Operations", icon: Wrench },
    { key: "identity", label: "Club & list", icon: Shirt },
  ];

  function goPrimary(sectionKey) {
    if (primaryLockedToCommercial && sectionKey !== "commercial") return;
    if (sectionKey === "overview") {
      setTab("overview");
      return;
    }
    if (activePrimary === sectionKey) return;
    if (sectionKey === "commercial") setTab("finances");
    else if (sectionKey === "operations") setTab("facilities");
    else setTab("kits");
  }

  let subTabs = [];
  if (activePrimary === "commercial") {
    subTabs = [
      { key: "finances", label: "Finances", icon: DollarSign },
      { key: "contracts", label: "Contracts", icon: FileText },
      { key: "board", label: "Board", icon: Landmark },
      { key: "sponsors", label: "Sponsors", icon: Handshake },
    ];
  } else if (activePrimary === "operations") {
    subTabs = [
      { key: "facilities", label: "Facilities", icon: Building2 },
      { key: "staff", label: "Staff", icon: UserCog },
    ];
    if (showCommittee) subTabs.push({ key: "committee", label: "Committee", icon: Users });
  } else if (activePrimary === "identity") {
    subTabs = [
      { key: "kits", label: "Kits", icon: Shirt },
      { key: "honours", label: "Honours", icon: Award },
      { key: "rookies", label: "Rookie List", icon: Sprout },
    ];
  }

  return (
    <div className="anim-in">
      {(career.gameMode === 'sandbox' || career.gameMode === 'challenge') && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-lg border"
            style={{
              borderColor: career.gameMode === 'sandbox' ? '#4AE89A' : '#E84A6F',
              color: career.gameMode === 'sandbox' ? '#4AE89A' : '#E84A6F',
              background: career.gameMode === 'sandbox' ? 'rgba(74,232,154,0.12)' : 'rgba(232,74,111,0.1)',
            }}
          >
            {career.gameMode === 'sandbox' ? 'Sandbox mode' : `Challenge${career.challengeId ? ` · ${String(career.challengeId).replace(/_/g, ' ')}` : ''}`}
          </span>
        </div>
      )}
      <div
        className="flex flex-wrap gap-2 p-1 rounded-xl mb-3"
        style={{ background: "var(--A-panel-2)", border: "1px solid var(--A-line)" }}
      >
        {primarySections.map((s) => {
          const Icon = s.icon;
          const isAct = activePrimary === s.key;
          const locked = primaryLockedToCommercial && s.key !== "commercial";
          return (
            <button
              key={s.key}
              type="button"
              disabled={locked}
              onClick={() => goPrimary(s.key)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-none ${
                locked ? "opacity-35 cursor-not-allowed" : ""
              } ${isAct ? "ring-2 ring-[var(--A-accent)] ring-offset-1 ring-offset-[var(--A-panel-2)]" : ""}`}
              style={
                isAct
                  ? {
                      background: "linear-gradient(135deg, var(--A-accent), #0099b0)",
                      color: "#001520",
                      boxShadow: "0 2px 8px rgba(0, 224, 255, 0.2)",
                    }
                  : { color: locked ? "var(--A-text-mute)" : "var(--A-text-dim)" }
              }
            >
              <Icon className="w-4 h-4" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {subTabs.length > 0 && (
        <TabNav
          tabs={subTabs}
          active={t}
          onChange={setTab}
          tutorialAllowOnly={clubTutorialTab}
          tutorialHighlightKey={clubTutorialTab}
          growButtons={false}
        />
      )}

      {t === "overview" && <ClubOverviewTab career={career} club={club} setTab={setTab} />}
      {t === "finances" && <FinancesTab career={career} />}
      {t === "contracts" && <ContractsTab career={career} updateCareer={updateCareer} />}
      {t === "board" && <BoardTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "sponsors" && <SponsorsTab career={career} updateCareer={updateCareer} />}
      {t === "kits" && <KitsTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "facilities" && <FacilitiesTab career={career} updateCareer={updateCareer} />}
      {t === "staff" && <StaffTab career={career} updateCareer={updateCareer} />}
      {t === "committee" && showCommittee && <CommitteeTab career={career} club={club} updateCareer={updateCareer} />}
      {t === "honours" && <HonoursTab career={career} club={club} />}
      {t === "rookies" && <RookieListTab career={career} updateCareer={updateCareer} />}
    </div>
  );
}

function BoardTab({ career, club, updateCareer }) {
  const [directorChatRole, setDirectorChatRole] = useState(null);
  const league = findLeagueOf(career.clubId);
  const members = career.board?.members ?? [];
  const objectives = career.board?.objectives ?? [];
  const inbox = career.board?.inbox ?? [];
  const overallRaw = career.finance?.boardConfidence ?? 0;
  const overallPct = Math.round(clamp(overallRaw, 0, 100));

  const boardPct = (v) => Math.round(clamp(v ?? 0, 0, 100));

  const runDirectorChat = (role, delta, newsLine) => {
    const draft = JSON.parse(JSON.stringify(career));
    applyMemberConfidenceDelta(draft, role, delta);
    updateCareer({
      board: draft.board,
      finance: draft.finance,
      news: [{ week: career.week, type: 'board', text: newsLine }, ...(career.news || [])].slice(0, 20),
    });
    setDirectorChatRole(null);
  };

  const respondInbox = (messageId, optionId) => {
    if (!league) return;
    const draft = {
      ...career,
      inbox: [...(career.inbox || [])],
      board: {
        ...career.board,
        members: (career.board?.members || []).map((m) => ({ ...m })),
        inbox: [...(career.board?.inbox || [])],
        objectives: [...(career.board?.objectives || [])],
      },
      finance: { ...career.finance },
    };
    const result = resolveBoardInboxChoice(draft, league, messageId, optionId);
    if (!result.ok) return;
    updateCareer({
      board: draft.board,
      finance: draft.finance,
      inbox: draft.inbox,
      news: result.newsLine
        ? [{ week: career.week, type: 'board', text: result.newsLine }, ...(career.news || [])].slice(0, 20)
        : career.news,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className={`${css.h1} text-3xl`}>EXECUTIVE BOARD</div>
        <div className="text-xs text-atext-dim max-w-2xl leading-snug">
          Club directors and weighted confidence — separate from the volunteer committee at lower tiers. Overall score feeds into finances and match-day systems.
        </div>
      </div>

      {inbox.length > 0 && (
        <div>
          <div className={`${css.h1} text-lg mb-2`}>Inbox</div>
          <div className="space-y-3">
            {inbox.map((msg) => (
              <div key={msg.id} className={`${css.panel} p-4`} style={{ borderColor: 'var(--A-accent)' }}>
                <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-1">{msg.fromRole}</div>
                <div className="font-bold text-atext mb-2">{msg.title}</div>
                <p className="text-sm text-atext-dim leading-snug mb-3">{msg.body}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {(msg.options || []).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => respondInbox(msg.id, o.id)}
                      className={`${css.btnPrimary} text-xs px-3 py-2 flex-1 text-left`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${css.panel} p-4`}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <span className={css.label}>Overall board confidence</span>
          <span className="font-display text-2xl text-aaccent">{overallPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
          <div className="h-full" style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, var(--A-accent-2), var(--A-accent))' }} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {(members.length ? members : []).map((m) => {
          const pct = boardPct(m.confidence);
          const col = pct >= 70 ? '#4AE89A' : pct >= 40 ? 'var(--A-accent-2)' : '#E84A6F';
          const moodLabel = (m.mood || 'neutral').toUpperCase();
          return (
            <div key={m.role} className={`${css.panel} p-4`}>
              <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-0.5">{m.role}</div>
              <div className="font-bold text-atext leading-tight mb-1">{m.name}</div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] text-atext-dim">Priority: {m.priority}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ border: `1px solid ${col}`, color: col }}>{moodLabel}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
                <div className="h-full transition-all" style={{ width: `${pct}%`, background: col }} />
              </div>
              <div className="flex justify-between text-[11px] text-atext-dim mb-2">
                <span>Confidence</span>
                <span>{pct}%</span>
              </div>
              <button
                type="button"
                onClick={() => setDirectorChatRole(m.role)}
                className={`${css.btnGhost} w-full text-[10px] py-2 font-bold inline-flex items-center justify-center gap-1 min-h-[40px]`}
              >
                <MessageCircle className="w-3.5 h-3.5 opacity-80" />
                Quick chat
              </button>
            </div>
          );
        })}
      </div>

      {directorChatRole && (() => {
        const m = members.find((x) => x.role === directorChatRole);
        if (!m) return null;
        const first = m.name?.split(' ')[0] || 'Director';
        return (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            role="presentation"
            onClick={() => setDirectorChatRole(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="board-chat-title"
              className={`${css.panel} max-w-md w-full p-5 space-y-3`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div id="board-chat-title" className={`${css.h1} text-lg`}>Check-in · {m.role}</div>
                  <div className="text-xs text-atext-dim mt-1">{m.name}</div>
                </div>
                <button type="button" className={`${css.btnGhost} text-[10px] px-2 py-1`} onClick={() => setDirectorChatRole(null)}>Close</button>
              </div>
              <p className="text-[11px] text-atext-dim leading-snug">
                Short conversation — mirrors how desktop sports sims keep board drama mostly in objectives and inbox mail, with occasional face-time when you need to steer tone.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className={`${css.btnPrimary} text-xs py-2.5 text-left px-3`}
                  onClick={() =>
                    runDirectorChat(
                      m.role,
                      5,
                      `📋 You aligned priorities with ${first} (${m.role}) — they sound steadier.`,
                    )
                  }
                >
                  Align on season priorities (+5 confidence)
                </button>
                <button
                  type="button"
                  className={`${css.btnGhost} text-xs py-2.5 text-left px-3 border border-aline`}
                  onClick={() =>
                    runDirectorChat(
                      m.role,
                      3,
                      `🤝 You thanked ${first} for backing the football program.`,
                    )
                  }
                >
                  Thank them for patience (+3)
                </button>
                <button
                  type="button"
                  className="text-xs py-2.5 text-left px-3 rounded-lg border border-[#E84A6F]/55 text-[#E84A6F] hover:bg-[#E84A6F]/10 font-bold"
                  onClick={() =>
                    runDirectorChat(
                      m.role,
                      -4,
                      `⚠️ You challenged ${first} on spend — useful tension, but confidence dipped.`,
                    )
                  }
                >
                  Push back on budget (−4)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div>
        <div className={`${css.h1} text-lg mb-2`}>Season objectives</div>
        <div className="grid gap-3 md:grid-cols-2">
          {objectives.length === 0 && (
            <div className={`${css.panel} p-6 text-sm text-atext-dim`}>Objectives are set at the start of each season.</div>
          )}
          {objectives.map((obj) => {
            const st = boardObjectiveUiStatus(obj, career);
            const stColor = st === 'MET' || st === 'ON TRACK' ? '#4AE89A' : st === 'MISSED' ? '#E84A6F' : 'var(--A-accent-2)';
            return (
              <div key={obj.id} className={`${css.panel} p-4`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-[11px] text-atext-mute uppercase tracking-wide">{obj.setBy}</div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0" style={{ color: stColor, border: `1px solid ${stColor}` }}>{st}</span>
                </div>
                <p className="text-sm text-atext leading-snug mb-2">{obj.description}</p>
                <div className="text-[11px] text-atext-dim">
                  {obj.type === 'ladder_position' && obj.current != null && <>Ladder position: <strong className="text-atext">{obj.current}</strong> (target ≤ {obj.target})<br /></>}
                  {obj.type === 'premiership' && <>Premiership: {career.premiership === career.season ? 'Leading — won flag this year' : 'Need to win the grand final'}<br /></>}
                  {obj.type === 'budget_discipline' && obj.current != null && <>Cash: <strong className="text-atext">{fmtK(obj.current)}</strong> (target ≥ $0)<br /></>}
                  {obj.type === 'youth_promoted' && obj.current != null && <>Youth (≤22, 5+ games): <strong className="text-atext">{obj.current}</strong> (need {obj.target})<br /></>}
                  Reward {obj.confidenceReward >= 0 ? '+' : ''}{obj.confidenceReward} / penalty {obj.confidencePenalty} to {obj.setBy}&apos;s confidence.
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-atext-mute leading-snug">
        Playing as <strong className="text-atext">{club?.short}</strong>
        {league ? ` · ${league.short} (Tier ${league.tier})` : ''}. Directors may message you after games — respond here. Formal meetings and votes are still to come.
        {' '}Inspired by games like Football Manager: pressure usually arrives through objectives and inbox notes; optional quick chats above add light FM-style relationship tuning without spamming you every week.
      </p>
    </div>
  );
}

function CommitteeTab({ career, club, updateCareer }) {
  const committee = career.committee || [];
  if (committee.length === 0) {
    return (
      <div className={`${css.panel} p-12 text-center`}>
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
        <div className="text-sm text-atext-dim">{club.name} runs with a professional board, not a volunteer committee.</div>
      </div>
    );
  }
  const avg = committeeMoodAverage(committee);
  const accent = avg >= 70 ? '#4AE89A' : avg >= 40 ? 'var(--A-accent-2)' : '#E84A6F';
  const tripUsed = career.footyTripUsed;
  const tripAvailable = career.footyTripAvailable && !tripUsed;
  const cash = career.finance?.cash ?? 0;

  const thankVolunteers = () => {
    const cost = 2000;
    if (cash < cost) return;
    const committeeNext = committee.map((m) => ({ ...m, mood: clamp((m.mood ?? 55) + 4, 0, 100) }));
    updateCareer({
      committee: committeeNext,
      finance: { ...career.finance, cash: cash - cost },
      news: [{ week: career.week, type: 'committee', text: '☕ Coffee shout for the volunteers — everyone walks a little taller.' }, ...(career.news || [])].slice(0, 25),
    });
  };

  const raffleNight = () => {
    const cost = 4000;
    if (cash < cost) return;
    let com = bumpCommitteeMood(committee, 'Social Coordinator', 12);
    com = bumpCommitteeMood(com, 'Treasurer', -6);
    updateCareer({
      committee: com,
      finance: { ...career.finance, cash: cash - cost },
      news: [{ week: career.week, type: 'committee', text: '🎟 Extra raffle night locked in — huge win with Social, Treasurer watches the petty cash.' }, ...(career.news || [])].slice(0, 25),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>VOLUNTEER COMMITTEE</div>
          <div className="text-xs text-atext-dim">Five locals who keep the club running. They have opinions — and they&apos;ll tell you about them. Drop into the shed with quick actions below — same flavour as community boards in lower-tier sim career modes.</div>
        </div>
        <Stat label="Avg Mood" value={avg} accent={accent} icon={Users} />
      </div>

      {tripAvailable && (
        <FootyTripCard career={career} updateCareer={updateCareer} />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {committee.map(m => {
          const trait = COMMITTEE_TRAIT_INFO[m.trait] || {};
          const moodColor = m.mood >= 70 ? '#4AE89A' : m.mood >= 40 ? 'var(--A-accent-2)' : '#E84A6F';
          return (
            <div key={m.role} className={`${css.panel} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={css.label}>{m.role}</div>
                  <div className="font-bold text-atext leading-tight">{m.name}</div>
                </div>
                <div className="font-display text-2xl" style={{ color: moodColor }}>{m.mood}</div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
                <div className="h-full" style={{ width: `${m.mood}%`, background: `linear-gradient(90deg, ${moodColor}88, ${moodColor})` }} />
              </div>
              <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-1 font-mono">Loves</div>
              <div className="text-[11px] text-atext-dim mb-2 leading-snug">{trait.loves || ''}</div>
              <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-1 font-mono">Hates</div>
              <div className="text-[11px] text-atext-dim leading-snug">{trait.hates || ''}</div>
            </div>
          );
        })}
      </div>

      <div className={`${css.panel} p-4`}>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-mute mb-2">Quick interactions</div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <button
            type="button"
            disabled={cash < 2000}
            onClick={thankVolunteers}
            className={cash >= 2000 ? `${css.btnPrimary} text-xs px-3 py-2.5 flex-1 min-h-[44px]` : 'text-xs px-3 py-2.5 rounded-lg bg-apanel-2 text-atext-mute flex-1 min-h-[44px]'}
          >
            Coffee shout (−$2k · +4 mood each)
          </button>
          <button
            type="button"
            disabled={cash < 4000}
            onClick={raffleNight}
            className={cash >= 4000 ? `${css.btnGhost} text-xs px-3 py-2.5 flex-1 min-h-[44px] font-bold border border-aline` : 'text-xs px-3 py-2.5 rounded-lg bg-apanel-2 text-atext-mute flex-1 min-h-[44px]'}
          >
            Bonus raffle night (−$4k · Social up, Treasurer down)
          </button>
        </div>
      </div>
    </div>
  );
}

const COMMITTEE_TRAIT_INFO = {
  old_school: { loves: 'Hard-nosed defenders, loyalty, tradition',                 hates: 'Spending money on unknowns, dropping veterans' },
  cautious:   { loves: 'Sponsor deals, budget discipline, cost control',           hates: 'Overspending, expensive facilities, footy trips' },
  community:  { loves: 'Footy trips, post-match functions, community events',      hates: 'Being ignored, low crowd games' },
  loyal:      { loves: 'Players staying healthy, fitness drills, being consulted', hates: 'Medical-facility upgrades that make him feel replaced' },
  connected:  { loves: 'Local signings, youth development, community ties',        hates: 'Signing players from outside the zone, ignored tips' },
};

function FootyTripCard({ career, updateCareer }) {
  const social = (career.committee || []).find(m => m.role === 'Social Coordinator');
  const acceptTrip = (optionId) => {
    const result = applyFootyTrip(career, optionId);
    if (!result) return;
    const option = FOOTY_TRIP_OPTIONS.find(o => o.id === optionId);
    const news = [
      { week: career.week, type: 'committee', text: `🚌 Footy trip approved: ${option.label}. Cash -$${option.cost.toLocaleString()}, morale +${option.moraleGain}.` },
      ...result.news.map(n => ({ week: career.week, ...n })),
      ...(career.news || []),
    ].slice(0, 25);
    updateCareer({
      squad: result.squad,
      committee: result.committee,
      finance: { ...career.finance, cash: career.finance.cash - option.cost },
      footyTripUsed: true,
      footyTripAvailable: false,
      news,
    });
  };
  const declineTrip = () => {
    const committee = bumpCommitteeMood(career.committee, 'Social Coordinator', -8);
    updateCareer({
      committee,
      footyTripUsed: true,
      footyTripAvailable: false,
      news: [{ week: career.week, type: 'committee', text: `🚫 Footy trip cancelled this year due to budget constraints. ${social ? social.name + ' is disappointed.' : 'The players are disappointed.'}` }, ...(career.news || [])].slice(0, 25),
    });
  };
  return (
    <div className={`${css.panel} p-4`} style={{ borderColor: 'var(--A-accent)' }}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <div className={css.label}>Footy Trip Proposal</div>
          <div className="font-bold text-atext leading-tight">{social ? social.name : 'The Social Coordinator'} is proposing this year&apos;s footy trip.</div>
        </div>
        <button onClick={declineTrip} className={`${css.btnGhost} text-[10px] py-1.5 px-3`}>DECLINE</button>
      </div>
      <div className="grid sm:grid-cols-3 gap-2 mt-3">
        {FOOTY_TRIP_OPTIONS.map(opt => (
          <button key={opt.id} onClick={() => acceptTrip(opt.id)}
            className="text-left p-3 rounded-xl transition hover:border-aaccent"
            style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
            <div className="font-display text-lg text-aaccent">{opt.label.toUpperCase()}</div>
            <div className="text-[11px] text-atext-dim mb-2 leading-snug">{opt.blurb}</div>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="text-atext-mute">Cost</div><div className="text-aneg font-mono text-right">${opt.cost.toLocaleString()}</div>
              <div className="text-atext-mute">Morale</div><div className="text-[#4AE89A] font-mono text-right">+{opt.moraleGain}</div>
              <div className="text-atext-mute">Treasurer</div><div className="text-aneg font-mono text-right">{opt.treasurerHit}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HonoursTab({ career, club }) {
  const history = career.history || [];
  const titles  = history.filter(h => h.champion).length;
  const promotions = history.filter(h => h.promoted).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>HONOURS</div>
          <div className="text-xs text-atext-dim">Your career story, season by season.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Premierships" value={titles} accent="#FFD200" icon={Trophy} />
          <Stat label="Promotions" value={promotions} accent="#4AE89A" icon={ChevronsUp} />
          <Stat label="Seasons" value={history.length} accent="var(--A-accent)" icon={Calendar} />
        </div>
      </div>

      {history.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">Your career honour roll fills up after each season ends. Get to work.</div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
          <div className="overflow-x-auto">
          <div className="grid gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b min-w-[680px]"
            style={{gridTemplateColumns:"5rem 1fr 4rem 4rem 4rem 4rem 1fr 1fr",borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
            <div>Season</div>
            <div>League</div>
            <div className="text-center">Pos</div>
            <div className="text-center">W-L-D</div>
            <div className="text-center">Pts</div>
            <div className="text-center">%</div>
            <div>Top Scorer</div>
            <div>Brownlow</div>
          </div>
          {[...history].reverse().map((h, i) => (
            <div key={i} className="grid gap-2 px-4 py-3 text-sm items-center min-w-[680px]"
              style={{gridTemplateColumns:"5rem 1fr 4rem 4rem 4rem 4rem 1fr 1fr",borderBottom:"1px solid var(--A-line)"}}>
              <div className="font-display text-lg text-aaccent">{h.season}</div>
              <div>
                <span className="font-semibold">{h.leagueShort}</span>
                {h.champion && <Pill color="#FFD200">🏆 Premiers</Pill>}
                {h.promoted && <Pill color="#4AE89A">⬆ Promoted</Pill>}
                {h.relegated && <Pill color="#E84A6F">⬇ Relegated</Pill>}
              </div>
              <div className="text-center font-bold">{h.position}</div>
              <div className="text-center font-mono text-xs">{h.W}-{h.L}-{h.D}</div>
              <div className="text-center font-mono">{h.pts}</div>
              <div className="text-center font-mono text-xs">{h.pct}%</div>
              <div className="text-xs text-atext-dim truncate">{h.topScorer ? `${h.topScorer.name} · ${h.topScorer.goals}g` : '—'}</div>
              <div className="text-xs text-atext-dim truncate">{h.brownlow ? `${h.brownlow.name} · ${h.brownlow.votes}v` : '—'}</div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RookieListTab({ career, updateCareer }) {
  const rookies = career.squad.filter(p => p.rookie || p.age <= 19);
  const promote = (p) => {
    const newWage = Math.round((p.wage || 0) * 1.4);
    const wageDelta = newWage - (p.wage || 0);
    if (!canAffordSigning(career, wageDelta)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot promote ${p.firstName} ${p.lastName} — would breach the salary cap` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    updateCareer({
      squad: career.squad.map(x => x.id === p.id ? { ...x, rookie: false, wage: newWage } : x),
      news: [{ week: career.week, type: 'info', text: `📈 Promoted ${p.firstName} ${p.lastName} to senior list (${fmtK(newWage)}/yr)` }, ...(career.news || [])].slice(0, 20),
    });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>ROOKIE LIST</div>
          <div className="text-xs text-atext-dim">Track your young talent. Promote when ready — wage rises 40% on elevation.</div>
        </div>
        <Stat label="Rookies" value={rookies.length} accent="#4ADBE8" icon={Sprout} />
      </div>
      {rookies.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Sprout className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">No rookies on your list. Draft or sign academy talent to start your pipeline.</div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
          {rookies.map((p, i) => (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center" style={{borderBottom:"1px solid var(--A-line)"}}>
              <div className="col-span-4 font-semibold text-sm">{p.firstName} {p.lastName} <span className="text-[10px] text-atext-dim ml-1">age {p.age}</span></div>
              <div className="col-span-1"><Pill color="#4ADBE8">{formatPositionSlash(p)}</Pill></div>
              <div className="col-span-1"><RatingDot value={p.overall} /></div>
              <div className="col-span-2 flex items-center gap-1 text-[11px]">
                <span className="text-atext-mute">POT</span>
                <span className="font-bold text-[#4AE89A]">{p.potential}</span>
              </div>
              <div className="col-span-2 text-xs text-atext-dim">{p.contract}yr · {fmtK(p.wage)}/yr</div>
              <div className="col-span-2 flex justify-end">
                {p.rookie
                  ? <button onClick={() => promote(p)} className={`${css.btnPrimary} text-xs px-3 py-1.5`}>Promote</button>
                  : <span className="text-[10px] text-atext-mute uppercase tracking-widest">Senior</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FinancesTab({ career }) {
  const inc = incomeBreakdown(career);
  const exp = expenseBreakdown(career);
  const net = inc.grandTotal - exp.grandTotal;
  const wageCap = effectiveWageCap(career);
  const playerWages = currentPlayerWageBill(career);
  const wagePct = wageCap > 0 ? Math.min(150, Math.round((playerWages / wageCap) * 100)) : 0;
  const wageCapColor = wagePct >= 100 ? "#E84A6F" : wagePct >= 90 ? "var(--A-accent-2)" : wagePct >= 80 ? "var(--A-accent)" : "#4AE89A";
  const cfg = getDifficultyConfig(career.difficulty);
  const overflowPct = Math.round((cfg.capOverflow ?? 0) * 100);
  const crisis = career.cashCrisisLevel ?? 0;

  return (
    <div className="space-y-4">
      <div className="text-xs text-atext-dim -mt-1">
        Commercial income (broadcast, memberships, merch) tracks your ladder spot, fan mood, and stadium. Cash ticks on each new calendar day as you advance the schedule.
      </div>
      {/* Cash crisis banner */}
      {crisis > 0 && (
        <div className={`${css.panel} p-4 flex items-start gap-3`} style={{ borderColor: '#E84A6F', background: 'rgba(232,74,111,0.06)' }}>
          <AlertCircle className="w-5 h-5 text-[#E84A6F] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-[#E84A6F] text-sm">CASH CRISIS · LEVEL {crisis}/4</div>
            <div className="text-xs text-atext-dim mt-1">{
              crisis === 1 ? 'Cash is in the red. Get back to black before the board steps in.' :
              crisis === 2 ? 'Emergency board meeting — a forced player sale is on the table.' :
              crisis === 3 ? 'Bank loan accepted. Sponsor pressure mounting.' :
                              'Insolvent. The board is preparing your termination.'
            }</div>
          </div>
        </div>
      )}

      {/* Top-line stats */}
      <div className="grid md:grid-cols-4 gap-3">
        <Stat label="Cash" value={fmtK(career.finance.cash)} accent={career.finance.cash >= 0 ? "#4AE89A" : "#E84A6F"} icon={DollarSign} />
        <Stat label="Annual Net (proj)" value={fmtK(net)} accent={net > 0 ? "#4AE89A" : "#E84A6F"} />
        <Stat label="Wage Bill" value={fmtK(playerWages + exp.staffWages)} sub="players + staff" accent="var(--A-accent)" />
        <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="#4ADBE8" />
      </div>

      {/* Salary cap with overflow indicator */}
      {wageCap > 0 && (
        <div className={`${css.panel} p-5`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className={`${css.h1} text-2xl`}>SALARY CAP</h3>
            <div className="flex items-center gap-3">
              {overflowPct !== 0 && (
                <Pill color={overflowPct > 0 ? '#4AE89A' : '#E84A6F'}>
                  {overflowPct > 0 ? `+${overflowPct}% headroom` : `${overflowPct}% tighter`}
                </Pill>
              )}
              <span className="text-xs font-bold" style={{ color: wageCapColor }}>{wagePct}% used</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-atext-dim mb-2">
            <span>Player wages: <span className="font-bold text-atext">{fmtK(playerWages)}</span></span>
            <span>Effective cap: <span className="font-bold text-atext">{fmtK(wageCap)}</span></span>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--A-panel-2)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, wagePct)}%`, background: wageCapColor }} />
          </div>
          <div className="text-xs text-atext-dim mt-2">
            {wagePct >= 100 ? '⚠️ Over the effective cap — board pressure rising' :
             wagePct >= 90  ? 'Cap stretched — careful with new signings' :
             wagePct >= 80  ? 'Cap tightening — plan ahead' :
                              `${fmtK(wageCap - playerWages)} of cap headroom available`}
          </div>
          {wagePct >= 88 && wagePct < 100 && (
            <div className="mt-3 p-3 rounded-xl text-[11px] leading-relaxed border border-[#FFB347]/40 bg-[#FFB347]/08 text-atext-dim">
              <span className="font-semibold text-atext">Tip:</span> Renewals and player-card extensions share this cap. Use <span className="text-atext font-medium">Club → Contracts</span> in pre-season so the queue does not surprise you when Round 1 starts.
            </div>
          )}
        </div>
      )}

      {/* Income / Expenses split */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>INCOME (ANNUAL)</h3>
          {[
            { label: "Broadcast / TV Rights", value: inc.broadcast,   color: "var(--A-accent)" },
            { label: "Gate Revenue",          value: inc.gate,        color: "#4ADBE8" },
            { label: "Membership",            value: inc.membership,  color: "#4AE89A" },
            { label: "Merchandise",           value: inc.merchandise, color: "var(--A-accent-2)" },
            { label: "Sponsorship",           value: inc.sponsors,    color: "#A78BFA" },
          ].map(r => (
            <div key={r.label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-atext">{r.label}</span>
                <span className="font-display text-lg" style={{ color: r.color }}>{fmtK(r.value)}</span>
              </div>
              <Bar value={inc.grandTotal > 0 ? (r.value / inc.grandTotal) * 100 : 0} color={r.color} />
            </div>
          ))}
          <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
            <span>Total income</span><span className="text-[#4AE89A]">{fmtK(inc.grandTotal)}</span>
          </div>
        </div>
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>EXPENSES (ANNUAL)</h3>
          {[
            { label: "Player Wages",      value: exp.playerWages, color: "#E84A6F" },
            { label: "Staff Wages",       value: exp.staffWages,  color: "var(--A-accent)" },
            { label: "Facilities Upkeep", value: exp.facilities,  color: "#4ADBE8" },
          ].map(r => (
            <div key={r.label} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-atext">{r.label}</span>
                <span className="font-display text-lg" style={{ color: r.color }}>{fmtK(r.value)}</span>
              </div>
              <Bar value={exp.grandTotal > 0 ? (r.value / exp.grandTotal) * 100 : 0} color={r.color} />
            </div>
          ))}
          <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
            <span>Total expenses</span><span className="text-[#E84A6F]">{fmtK(exp.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Bank loan card */}
      {career.bankLoan && (
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-2`}>BANK LOAN</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div><div className={css.label}>Principal</div><div className="font-display text-2xl">{fmtK(career.bankLoan.principal)}</div></div>
            <div><div className={css.label}>Weeks left</div><div className="font-display text-2xl">{career.bankLoan.weeksRemaining}</div></div>
            <div><div className={css.label}>Interest / wk</div><div className="font-display text-2xl text-[#E84A6F]">{fmtK(career.bankLoan.interestPerWeek)}</div></div>
          </div>
        </div>
      )}

      {/* Weekly cashflow chart */}
      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>CASH FLOW (BY CALENDAR WEEK)</h3>
        {(career.weeklyHistory || []).length === 0 ? (
          <div className="text-sm text-atext-dim py-8 text-center">No ledger entries yet — advance the schedule (each new day accrues operating cash).</div>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {career.weeklyHistory.map((w, i) => {
              const max = Math.max(...career.weeklyHistory.map(x => Math.abs(x.profit ?? 0)));
              const h = max === 0 ? 0 : (Math.abs(w.profit ?? 0) / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`Week ${w.week}: ${fmtK(w.profit)}`}>
                  <div className="w-full rounded-t" style={{ height: `${h}%`, background: (w.profit ?? 0) >= 0 ? "#4AE89A" : "#E84A6F", opacity: 0.85 }} />
                  <div className="text-[9px] text-atext-dim">R{w.week}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SponsorsTab({ career, updateCareer }) {
  const sponsorList = career.sponsors || [];
  const totalAnnual = sponsorList.reduce((a, s) => a + s.annualValue, 0);
  const proposals = career.sponsorRenewalProposals || [];
  const offers    = career.sponsorOffers || [];
  const expiredLastSeason = career.expiredSponsorsLastSeason || [];
  const cfg = getDifficultyConfig(career.difficulty);

  const drop = (sp) => updateCareer({ sponsors: sponsorList.filter(s => s.id !== sp.id) });
  const acceptRenewal = (proposal) => {
    const patch = applyRenewalAcceptance(career, proposal);
    updateCareer({
      ...patch,
      sponsorRenewalProposals: proposals.filter(p => p.sponsorId !== proposal.sponsorId),
      news: [{ week: career.week, type: 'win', text: `🤝 Renewed ${proposal.name} for ${proposal.proposedYears}y @ ${fmtK(proposal.proposedValue)}/yr` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const declineRenewal = (proposal) => {
    const patch = applyRenewalDecline(career, proposal);
    updateCareer({
      ...patch,
      sponsorRenewalProposals: proposals.filter(p => p.sponsorId !== proposal.sponsorId),
      news: [{ week: career.week, type: 'loss', text: `📉 Let ${proposal.name} walk — sponsor expired` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const acceptOffer = (offer) => {
    const patch = applySponsorOfferAcceptance(career, offer);
    updateCareer({
      ...patch,
      sponsorOffers: offers.filter(o => o.offerId !== offer.offerId),
      news: [{ week: career.week, type: 'win', text: `📈 New sponsor: ${offer.name} (${fmtK(offer.annualValue)}/yr, ${offer.yearsLeft}y)` }, ...(career.news || [])].slice(0, 25),
    });
  };
  const declineOffer = (offer) => {
    updateCareer({ sponsorOffers: offers.filter(o => o.offerId !== offer.offerId) });
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="Total Annual" value={fmtK(totalAnnual)} accent="#4AE89A" />
        <Stat label="Active Deals" value={sponsorList.length} accent="var(--A-accent)" />
        <Stat label="Avg Deal" value={sponsorList.length ? fmtK(Math.round(totalAnnual/sponsorList.length)) : "—"} accent="#4ADBE8" />
        <Stat label="Sponsor x" value={`${cfg.sponsorMultiplier.toFixed(2)}×`} sub="difficulty" accent="var(--A-accent-2)" />
      </div>

      {expiredLastSeason.length > 0 && (
        <div className={`${css.panel} p-4`} style={{borderColor: '#E84A6F'}}>
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-[#E84A6F]" /><div className="font-bold text-sm">Lost last season</div></div>
          <div className="flex flex-wrap gap-2">
            {expiredLastSeason.map(s => (
              <Pill key={s.id} color="#E84A6F">{s.name} · {fmtK(s.annualValue)}/yr</Pill>
            ))}
          </div>
        </div>
      )}

      {proposals.length > 0 && (
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>RENEWAL PROPOSALS</h3>
          <p className="text-xs text-atext-dim mb-3">These deals expire at season end. Renew now or let them walk.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {proposals.map(p => {
              const delta = (p.proposedValue ?? 0) - (p.currentValue ?? 0);
              return (
                <div key={p.sponsorId} className={`${css.inset} p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-display text-xl">{p.name}</div>
                      <div className="text-[10px] text-atext-dim uppercase tracking-widest">{p.category} · {p.perf}</div>
                    </div>
                    <Pill color={delta >= 0 ? '#4AE89A' : '#E84A6F'}>{delta >= 0 ? '+' : ''}{fmtK(delta)}</Pill>
                  </div>
                  <div className="text-[11px] text-atext-dim mb-2">
                    Was {fmtK(p.currentValue)}/yr → propose <span className="font-bold text-atext">{fmtK(p.proposedValue)}/yr</span> for {p.proposedYears}y
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => declineRenewal(p)} className="text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10">Decline</button>
                    <button onClick={() => acceptRenewal(p)} className={`${css.btnPrimary} text-xs px-3 py-2`}>Accept Renewal</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {offers.length > 0 && (
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>NEW OFFERS</h3>
          <p className="text-xs text-atext-dim mb-3">Brands knocking on the door — performance-weighted by your finish.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {offers.map(o => (
              <div key={o.offerId} className={`${css.inset} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-display text-xl">{o.name}</div>
                    <div className="text-[10px] text-atext-dim uppercase tracking-widest">{o.category} · {o.type}</div>
                  </div>
                  <Pill color="var(--A-accent)">{o.yearsLeft}y</Pill>
                </div>
                <div className="text-[11px] text-atext-dim mb-2">Offer: <span className="font-bold text-[#4AE89A]">{fmtK(o.annualValue)}/yr</span></div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => declineOffer(o)} className="text-xs px-3 py-2 rounded-lg text-atext-mute hover:text-atext">Pass</button>
                  <button onClick={() => acceptOffer(o)} className={`${css.btnPrimary} text-xs px-3 py-2`}>Accept Deal</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${css.panel} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${css.h1} text-2xl`}>ACTIVE PARTNERS</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {sponsorList.length === 0 && (
            <div className="text-sm text-atext-dim md:col-span-2 text-center py-6">
              {offers.length > 0
                ? 'No signed sponsors yet — see NEW OFFERS below.'
                : 'No active sponsors. More offers arrive after results and at season end.'}
            </div>
          )}
          {sponsorList.map(s => (
            <div key={s.id} className={`${css.inset} p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-2xl">{s.name}</div>
                  <div className="text-[10px] text-atext-dim uppercase tracking-widest">{s.category} • {s.type}</div>
                </div>
                <Pill color={s.yearsLeft <= 1 ? '#FFB347' : 'var(--A-accent)'}>{s.yearsLeft}y left</Pill>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div>
                  <div className="text-[10px] text-atext-dim uppercase tracking-widest">Annual Value</div>
                  <div className="font-display text-3xl text-[#4AE89A]">{fmtK(s.annualValue)}</div>
                </div>
                <button onClick={()=>drop(s)} className="text-xs px-3 py-2 rounded-lg text-[#E84A6F] hover:bg-[#E84A6F]/10">Drop</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// KITS TAB
// ============================================================================
function KitsTab({ career, club, updateCareer }) {
  const [editing, setEditing] = useState("home");
  const kit = career.kits[editing];
  const PATTERNS = [
    { key: "solid", label: "Solid" },
    { key: "stripes", label: "Stripes" },
    { key: "v", label: "V-Yoke" },
    { key: "sash", label: "Sash" },
    { key: "yoke", label: "Yoke" },
  ];
  const updateKit = (field, value) => {
    updateCareer({ kits: { ...career.kits, [editing]: { ...career.kits[editing], [field]: value } } });
  };
  const resetToClubColors = () => {
    updateCareer({ kits: { ...career.kits, [editing]: defaultKits(club.colors)[editing] } });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>KIT DESIGNER</div>
          <div className="text-xs text-atext-dim">Customise your club's three jerseys. Live preview updates as you tweak.</div>
        </div>
        <div className="flex gap-2">
          {["home","away","clash"].map(k => (
            <button key={k} onClick={()=>setEditing(k)} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${editing===k ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{k}</button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* PREVIEW */}
        <div className={`${css.panel} p-6 flex flex-col items-center justify-center lg:col-span-1`}>
          <div className={css.label}>Preview · {editing}</div>
          <div className="my-4 p-4 bg-gradient-to-br from-apanel-2 to-apanel rounded-2xl">
            <Jersey kit={kit} size={220} />
          </div>
          <div className="flex gap-2 text-[10px] uppercase tracking-wider text-atext-dim">
            <span>{kit.pattern}</span>·
            <span style={{color: kit.primary}}>●</span>
            <span style={{color: kit.secondary}}>●</span>
            <span style={{color: kit.accent}}>●</span>
          </div>
          <button onClick={resetToClubColors} className={`${css.btnGhost} mt-4 text-xs`}>Reset to club colours</button>
        </div>

        {/* CONTROLS */}
        <div className={`${css.panel} p-6 lg:col-span-2 space-y-5`}>
          <div>
            <div className={css.label}>Pattern</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {PATTERNS.map(p => (
                <button key={p.key} onClick={()=>updateKit("pattern", p.key)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${kit.pattern===p.key ? "bg-aaccent text-[#001520]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{p.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {field:"primary", label:"Primary"},
              {field:"secondary", label:"Secondary"},
              {field:"accent", label:"Accent"},
              {field:"numberColor", label:"Number"},
            ].map(c => (
              <div key={c.field}>
                <div className={css.label}>{c.label}</div>
                <div className="flex items-center gap-3 mt-2">
                  <input type="color" value={kit[c.field]} onChange={e=>updateKit(c.field, e.target.value)} className="w-14 h-14 rounded-lg border border-aline bg-transparent cursor-pointer" />
                  <input type="text" value={kit[c.field]} onChange={e=>updateKit(c.field, e.target.value)} className="flex-1 bg-apanel border border-aline rounded-lg px-3 py-2 text-sm font-mono text-atext" />
                </div>
              </div>
            ))}
          </div>

          <div className={`${css.inset} p-4`}>
            <div className={css.label}>Quick Palettes</div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                ["#0E1A40","#FFFFFF","#FFD200"],
                ["#7A0019","#FDB930","#003E80"],
                ["#000000","#FFD200","#FF0000"],
                ["#003F87","#FFFFFF","#E21937"],
                ["#4D2004","#FBBF15","#FFFFFF"],
                ["#2A0D54","#FFFFFF","var(--A-accent)"],
                ["#008AAB","#000000","#FFFFFF"],
                ["#0F1131","#CC2031","#FFFFFF"],
              ].map((pal,i) => (
                <button key={i} onClick={()=>updateCareer({kits:{...career.kits,[editing]:{...career.kits[editing], primary:pal[0], secondary:pal[1], accent:pal[2]}}})} className="h-10 rounded-lg overflow-hidden flex border border-aline hover:border-[var(--A-accent)] transition">
                  <div style={{background:pal[0]}} className="flex-1" />
                  <div style={{background:pal[1]}} className="flex-1" />
                  <div style={{background:pal[2]}} className="flex-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All three kits row */}
      <div className={`${css.panel} p-6`}>
        <div className={css.label}>Full kit set</div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          {["home","away","clash"].map(k => (
            <div key={k} className={`${css.inset} p-4 flex flex-col items-center cursor-pointer hover:border-[var(--A-accent)] transition`} onClick={()=>setEditing(k)}>
              <Jersey kit={career.kits[k]} size={120} />
              <div className="mt-2 text-xs uppercase tracking-wider text-atext-dim">{k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FACILITIES TAB
// ============================================================================
function FacilitiesTab({ career, updateCareer }) {
  const FAC_INFO = {
    trainingGround: { name: "Training Ground", icon: Activity, desc: "Improves training effectiveness and skill development", color: "#4ADBE8" },
    gym: { name: "Strength & Conditioning", icon: Dumbbell, desc: "Boosts player strength, speed and endurance gains", color: "var(--A-accent)" },
    medical: { name: "Medical Centre", icon: Heart, desc: "Reduces injury rate, faster recovery from knocks", color: "#E84A6F" },
    academy: { name: "Youth Academy", icon: GraduationCap, desc: "Better youth recruits and development progression", color: "#4AE89A" },
    stadium: { name: "Stadium", icon: Building2, desc: "Higher capacity = bigger gate revenue & sponsor pull", color: "#FFD200" },
    recovery: { name: "Recovery Centre", icon: Sparkles, desc: "Faster fitness recovery between matches", color: "#A78BFA" },
  };
  const upgrade = (key) => {
    const f = career.facilities[key];
    if (f.level >= f.max) return;
    const cost = f.cost * f.level;
    if (career.finance.cash < cost) return;
    const nextLevel = f.level + 1;
    const payload = {
      facilities: { ...career.facilities, [key]: { ...f, level: nextLevel } },
      finance: { ...career.finance, cash: career.finance.cash - cost },
      news: [{ week: career.week, type: "info", text: `📈 Upgraded ${FAC_INFO[key].name} to Level ${nextLevel}` }, ...career.news].slice(0, 15),
    };
    if (key === "stadium") {
      const lg = findLeagueOf(career.clubId);
      const cg = getClubGround(findClub(career.clubId), nextLevel, lg?.tier ?? 2);
      payload.clubGround = cg;
      payload.groundName = cg.shortName;
    }
    updateCareer(payload);
  };
  const totalLevel = Object.values(career.facilities).reduce((a,b)=>a+b.level,0);
  const maxTotal = Object.values(career.facilities).reduce((a,b)=>a+b.max,0);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>FACILITIES</div>
          <div className="text-xs text-atext-dim">Long-term investment. Effects compound across the season.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Overall Rating" value={`${totalLevel}/${maxTotal}`} accent="#4ADBE8" />
          <Stat label="Cash" value={fmtK(career.finance.cash)} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(career.facilities).map(([key, f]) => {
          const info = FAC_INFO[key];
          const Icon = info.icon;
          const cost = f.cost * f.level;
          const canAfford = career.finance.cash >= cost;
          const maxed = f.level >= f.max;
          return (
            <div key={key} className={`${css.panel} p-5`}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${info.color}1A`, border: `1px solid ${info.color}44` }}>
                  <Icon className="w-7 h-7" style={{ color: info.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold tracking-wide">{info.name}</div>
                    <div className={`${css.num} text-2xl`} style={{color: info.color}}>{f.level}<span className="text-sm text-atext-dim">/{f.max}</span></div>
                  </div>
                  <div className="text-[11px] text-atext-dim mt-1">{info.desc}</div>
                  <div className="flex gap-1 mt-3">
                    {Array.from({length: f.max}).map((_,i) => (
                      <div key={i} className="flex-1 h-2 rounded-full" style={{ background: i < f.level ? info.color : "var(--A-line)" }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-atext-dim">
                      {maxed ? <span className="text-[#4AE89A]">⭐ Max level</span> : <>Upgrade: <span className={canAfford ? "text-atext font-bold" : "text-[#E84A6F] font-bold"}>${(cost/1000).toFixed(0)}k</span></>}
                    </div>
                    <button onClick={()=>upgrade(key)} disabled={maxed||!canAfford} className={maxed||!canAfford ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-xs px-3 py-1.5`}>
                      {maxed ? "Maxed" : "Upgrade"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// STAFF TAB
// ============================================================================
function StaffTab({ career, updateCareer }) {
  const leagueTier = PYRAMID[career.leagueKey]?.tier || 1;
  const replaceStaff = (idx) => {
    const old = career.staff[idx];
    seedRng(Date.now() % 100000 + idx);
    const newRating = clamp(old.rating + rand(-8, 14), 35, 95);
    let newWage;
    if (old.volunteer) newWage = 0;
    else if (leagueTier === 3 && old.id === 's1') newWage = Math.round((newRating / 75) * 35000);
    else newWage = Math.round((newRating / 75) * 80000);
    const newStaff = [...career.staff];
    newStaff[idx] = {
      ...old,
      name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      rating: newRating,
      wage: newWage,
      volunteer: !!old.volunteer,
      contract: rand(1, 3),
    };
    updateCareer({
      staff: newStaff,
      news: [{ week: career.week, type: "info", text: `🤝 Hired new ${old.role}: ${newStaff[idx].name} (${newRating} OVR)` }, ...career.news].slice(0,15),
    });
  };
  const totalWage = career.staff.reduce((a,s)=>a+s.wage,0);
  const avgRating = Math.round(career.staff.reduce((a,s)=>a+s.rating,0) / career.staff.length);
  return (
    <div className="space-y-4">
      <StaffRenewalsPanel career={career} updateCareer={updateCareer} leagueTier={leagueTier} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>STAFF</div>
          <div className="text-xs text-atext-dim">Your support team shapes training outcomes, recruitment quality and player development.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Avg Rating" value={avgRating} accent="#4AE89A" />
          <Stat label="Annual Wages" value={fmtK(totalWage)} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Rating</div>
          <div className="col-span-1 text-center">Years</div>
          <div className="col-span-2 text-right">Wage</div>
          <div className="col-span-1"></div>
        </div>
        {career.staff.map((s, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid var(--A-line)"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(0,224,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div className="col-span-3 font-semibold text-sm">{s.name}</div>
            <div className="col-span-3 text-sm text-atext-dim">{s.role}</div>
            <div className="col-span-2 flex items-center gap-2">
              <RatingDot value={s.rating} />
              <Bar value={s.rating} small />
            </div>
            <div className="col-span-1 text-center text-sm">{s.contract}y</div>
            <div className="col-span-2 text-right text-sm font-mono">{s.volunteer ? <span className="text-[#4AE89A]">Volunteer</span> : `$${(s.wage/1000).toFixed(0)}k`}</div>
            <div className="col-span-1 flex justify-end">
              <button onClick={()=>replaceStaff(idx)} className="text-xs px-3 py-1.5 rounded-lg border border-aline hover:border-[var(--A-accent)] hover:text-aaccent transition">Replace</button>
            </div>
          </div>
        ))}
      </div>

      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Replacing a staff member rolls a new candidate. Volunteers at local level are unpaid; senior coach is usually a small part-time stipend. Higher ratings still improve training.
      </div>
    </div>
  );
}

