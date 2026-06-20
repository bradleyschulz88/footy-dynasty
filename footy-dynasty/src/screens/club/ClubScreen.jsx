import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar as ReBar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import {
  Trophy, Users, DollarSign, Dumbbell, Building2, Handshake, Shirt,
  UserCog,   Sprout, Calendar,
  Heart, Activity, Sparkles,
  GraduationCap, Briefcase,
  Award, AlertCircle, ChevronsUp, FileText,
  Landmark, LayoutDashboard, Wrench, MessageCircle, BarChart3,
} from "lucide-react";
import { seedRng, rand, pick } from '../../lib/rng.js';
import { STATES, PYRAMID, findClub, findLeagueOf } from '../../data/pyramid.js';
import { FIRST_NAMES, LAST_NAMES, formatPositionSlash } from '../../lib/playerGen.js';
import { fmtK, clamp } from '../../lib/format.js';
import { defaultKits, STAFF_BLUEPRINT, EXPANDABLE_ROLE_IDS_BY_TIER } from '../../lib/defaults.js';
import { css, Bar, RatingDot, Pill, Stat, Jersey } from '../../components/primitives.jsx';
import TabNav from '../../components/TabNav.jsx';
import { ContractsTab, StaffRenewalsPanel } from '../contracts/ContractRenewals.jsx';
import { getDifficultyConfig } from '../../lib/difficulty.js';
import {
  bumpCommitteeMood, committeeMoodAverage,
  FOOTY_TRIP_OPTIONS, applyFootyTrip,
} from '../../lib/community.js';
// --- Finance system rebuild ---
import {
  effectiveWageCap,
  currentPlayerWageBill,
  canAffordSigning,
  incomeBreakdown, expenseBreakdown,
  annualWageBill, matchDayRevenue, expectedAttendance,
  grassrootsIncomeBreakdown, grassrootsExpenseBreakdown,
  gamingVenueAnnualRevenue, investInGamingVenue,
  leagueTierOf,
} from '../../lib/finance/engine.js';
import { BOARD_FINANCIAL_OBJECTIVES, GAMING_VENUE } from '../../lib/finance/constants.js';
import {
  applyRenewalAcceptance, applyRenewalDecline, applySponsorOfferAcceptance,
  evaluateSponsorCounter, sponsorCounterAcceptChance, sponsorClauseTerms,
} from '../../lib/finance/sponsors.js';
import {
  boardObjectiveUiStatus,
  resolveBoardInboxChoice,
  applyMemberConfidenceDelta,
} from '../../lib/board.js';
import { getClubGround } from '../../data/grounds.js';
import { ensureStaffTasks, autoAssignStaffTasks } from '../../lib/staffTasks.js';
import {
  listExpandableHires,
  hireBlueprintStaff,
  recruitVolunteerStaff,
  recruitRandomVolunteerStaff,
  professionalSigningFee,
  previewExpansionAnnualWage,
  VOLUNTEER_ROLE_TEMPLATES,
  MAX_STAFF_ROWS,
} from '../../lib/staffHiring.js';
import {
  clubEffectiveTab,
  tutorialHighlightTab,
} from "../../components/TutorialOverlay.jsx";
import { ClubOverviewTab, CommercialKpiStrip, ClubBreadcrumb } from "./ClubNavigationHub.jsx";
import AnalyticsTab from "./AnalyticsTab.jsx";
import { useCareer, useUpdateCareer } from "../../lib/careerStore.js";

function clubLeafSection(leaf, showCommittee) {
  if (leaf === "overview") return "overview";
  if (["finances", "board", "sponsors", "contracts"].includes(leaf)) return "commercial";
  const ops = ["facilities", "staff"];
  if (showCommittee) ops.push("committee");
  if (ops.includes(leaf)) return "operations";
  if (["kits", "honours", "rookies", "analytics"].includes(leaf)) return "identity";
  return "overview";
}

// ============================================================================
// CLUB SCREEN — grouped navigation + overview hub
// ============================================================================
export default function ClubScreen({ club, tab, setTab, tutorialActive }) {
  const career = useCareer();
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
      { key: "board", label: leagueTier === 4 ? "Committee" : "Board", icon: leagueTier === 4 ? Users : Landmark },
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
      { key: "analytics", label: "Analytics", icon: BarChart3 },
    ];
  }

  return (
    <div className="anim-in">
      {(career.gameMode === 'sandbox' || career.gameMode === 'challenge') && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span
            className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded-lg border"
            style={{
              borderColor: career.gameMode === 'sandbox' ? 'var(--A-pos)' : 'var(--A-neg)',
              color: career.gameMode === 'sandbox' ? 'var(--A-pos)' : 'var(--A-neg)',
              background: career.gameMode === 'sandbox' ? 'color-mix(in srgb, var(--A-pos) 12%, transparent)' : 'color-mix(in srgb, var(--A-neg) 10%, transparent)',
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
                      background: "linear-gradient(135deg, var(--A-accent), var(--A-accent-2))",
                      color: "var(--fd-on-accent, #0A0D0C)",
                      boxShadow: "0 2px 8px color-mix(in srgb, var(--A-accent) 20%, transparent)",
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

      <ClubBreadcrumb activePrimary={activePrimary} activeTab={t} />
      {activePrimary === "commercial" && t !== "overview" && (
        <CommercialKpiStrip />
      )}

      {t === "overview" && (
        <ClubOverviewTab club={club} setTab={setTab} showCommittee={showCommittee} />
      )}
      {t === "finances" && <FinancesTab />}
      {t === "contracts" && <ContractsTab />}
      {t === "board" && <BoardTab club={club} />}
      {t === "sponsors" && <SponsorsTab />}
      {t === "kits" && <KitsTab club={club} />}
      {t === "facilities" && <FacilitiesTab />}
      {t === "staff" && <StaffTab />}
      {t === "committee" && showCommittee && <CommitteeTab club={club} />}
      {t === "honours" && <HonoursTab club={club} />}
      {t === "rookies" && <RookieListTab />}
      {t === "analytics" && <AnalyticsTab />}
    </div>
  );
}

function BoardTab({ club }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [directorChatRole, setDirectorChatRole] = useState(null);
  const league = findLeagueOf(career.clubId);
  const isTier4 = league?.tier === 4;
  const committee = Array.isArray(career.committee) ? career.committee : [];
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
        <div className={`${css.h1} text-3xl`}>{isTier4 ? "PARENT COMMITTEE" : "EXECUTIVE BOARD"}</div>
        <div className="text-xs text-atext-dim max-w-2xl leading-snug">
          {isTier4
            ? "Volunteer-run by the parent committee — no director board at junior level. Their confidence reflects how the locals feel about your development focus."
            : "Club directors and weighted confidence — separate from the volunteer committee at lower tiers. Overall score feeds into finances and match-day systems."}
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
          <span className={css.label}>{isTier4 ? "Overall committee confidence" : "Overall board confidence"}</span>
          <span className="font-display text-2xl text-aaccent">{overallPct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
          <div className="h-full" style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, var(--A-accent-2), var(--A-accent))' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
          {[
            { label: "Budget access", value: overallPct >= 70 ? "Full" : overallPct >= 50 ? "Standard" : "Restricted", color: overallPct >= 70 ? "var(--A-pos)" : overallPct >= 50 ? "var(--A-accent)" : "var(--A-neg)" },
            { label: "Sack patience", value: overallPct >= 65 ? "High" : overallPct >= 40 ? "Moderate" : "Very low", color: overallPct >= 65 ? "var(--A-pos)" : overallPct >= 40 ? "var(--A-accent)" : "var(--A-neg)" },
            { label: "Contract offers", value: overallPct >= 60 ? "Competitive" : overallPct >= 35 ? "Average" : "Weak", color: overallPct >= 60 ? "var(--A-pos)" : overallPct >= 35 ? "var(--A-accent)" : "var(--A-neg)" },
            { label: "Fan relations", value: overallPct >= 75 ? "Positive" : overallPct >= 45 ? "Neutral" : "Negative", color: overallPct >= 75 ? "var(--A-pos)" : overallPct >= 45 ? "var(--A-accent)" : "var(--A-neg)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg p-2" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
              <div className="text-atext-mute uppercase tracking-wider font-bold mb-0.5">{label}</div>
              <div className="font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {isTier4 && members.length === 0 && committee.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {committee.map((m) => {
            const mood = boardPct(m.mood);
            const col = mood >= 70 ? 'var(--A-pos)' : mood >= 40 ? 'var(--A-accent-2)' : 'var(--A-neg)';
            return (
              <div key={m.role} className={`${css.panel} p-4`}>
                <div className="text-[10px] text-atext-mute uppercase tracking-widest mb-0.5">{m.role}</div>
                <div className="font-bold text-atext leading-tight mb-2">{m.name}</div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
                  <div className="h-full transition-all" style={{ width: `${mood}%`, background: col }} />
                </div>
                <div className="flex justify-between text-[11px] text-atext-dim">
                  <span>Mood</span>
                  <span>{mood}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {(members.length ? members : []).map((m) => {
          const pct = boardPct(m.confidence);
          const col = pct >= 70 ? 'var(--A-pos)' : pct >= 40 ? 'var(--A-accent-2)' : 'var(--A-neg)';
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
        const pct = Math.round(clamp(m.confidence ?? 0, 0, 100));
        const moodLabel = pct >= 70 ? 'upbeat' : pct >= 40 ? 'measured' : 'tense';
        const ROLE_SCRIPTS = {
          "Chairman": {
            context: (fn, mood) => `${fn} is ${mood}. He's watching the ladder closely and wants to know the club is heading in the right direction before next board meeting.`,
            opts: [
              { label: `Walk ${first} through your season plan and key milestones`, delta: 5, news: `📋 ${first} (Chairman) left the meeting nodding — clear plan goes a long way.` },
              { label: `Acknowledge recent results and your pathway to lift`, delta: 3, news: `🤝 ${first} appreciated the honesty. He'll give you a bit more rope.` },
              { label: `Challenge his expectations — push for more realistic targets`, delta: -4, news: `⚠️ Pushback on targets didn't land well with ${first} — he wants results, not rhetoric.` },
            ],
          },
          "Football Director": {
            context: (fn, mood) => `${fn} is ${mood}. He's analytical — he wants to see list balance data and a clear game-plan rationale, not spin.`,
            opts: [
              { label: `Share player development data and list projections`, delta: 5, news: `📊 ${first} (Football Director) was impressed with the data — feels like you have a plan.` },
              { label: `Discuss recent game highlights and what you're building toward`, delta: 3, news: `🏉 ${first} liked the football-first thinking. Confidence ticked up.` },
              { label: `Push back on his player selection views`, delta: -4, news: `⚠️ ${first} didn't appreciate the pushback — he's the football expert, he thinks.` },
            ],
          },
          "Finance Director": {
            context: (fn, mood) => `${fn} is ${mood}. Conservative by nature — any budget uncertainty makes her nervous. She wants to know wage commitments are under control.`,
            opts: [
              { label: `Walk through cash runway and next-quarter commitments`, delta: 5, news: `💰 ${first} (Finance) left reassured — she just needs to see the numbers.` },
              { label: `Reassure on wage discipline and transfer spend`, delta: 3, news: `🤝 ${first} settled down after the budget rundown.` },
              { label: `Argue for a capital exception — invest now, pay later`, delta: -4, news: `⚠️ ${first} hated the "invest now" pitch — she's not signing off on that.` },
            ],
          },
          "Community Director": {
            context: (fn, mood) => `${fn} is ${mood}. He's a true believer in the club's grassroots role and cares deeply about culture and local engagement.`,
            opts: [
              { label: `Talk about youth programs and community partnerships you're building`, delta: 5, news: `🌱 ${first} (Community) lit up at the grassroots talk — exactly what he wants to hear.` },
              { label: `Share good stories from training and fan engagement this week`, delta: 3, news: `🤝 ${first} appreciated the community-first framing.` },
              { label: `Redirect — on-field results drive community pride, not programs`, delta: -4, news: `⚠️ ${first} bristled at having his portfolio dismissed. Confidence down.` },
            ],
          },
          "Player Relations Director": {
            context: (fn, mood) => `${fn} is ${mood}. Empathetic and player-focused — she notices morale before anyone else does and will fight for the locker room.`,
            opts: [
              { label: `Discuss workload, recovery, and your approach to player welfare`, delta: 5, news: `💚 ${first} (Player Relations) is on your side — she can see you care about the list.` },
              { label: `Acknowledge specific players who've contributed positively`, delta: 3, news: `🤝 ${first} appreciated the individual recognition. Confidence up a little.` },
              { label: `Make clear performance trumps welfare concerns right now`, delta: -4, news: `⚠️ ${first} felt blindsided by the hard line — that's her territory.` },
            ],
          },
        };
        const script = ROLE_SCRIPTS[m.role] || ROLE_SCRIPTS["Chairman"];
        const opts = script.opts;
        return (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            role="presentation"
            onClick={() => setDirectorChatRole(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="board-chat-title"
              className={`${css.panel} max-w-md w-full p-5 space-y-4`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div id="board-chat-title" className={`${css.h1} text-lg`}>{m.role}</div>
                  <div className="text-xs text-atext-dim mt-0.5">{m.name} · Confidence {pct}%</div>
                </div>
                <button type="button" className={`${css.btnGhost} text-[10px] px-2 py-1`} onClick={() => setDirectorChatRole(null)}>Close</button>
              </div>
              <p className="text-sm text-atext-dim leading-snug italic border-l-2 border-aaccent/40 pl-3">
                {script.context(first, moodLabel)}
              </p>
              <div className="flex flex-col gap-2">
                {opts.map((o, i) => (
                  <button
                    key={o.label}
                    type="button"
                    className={i === 0 ? `${css.btnPrimary} text-xs py-2.5 text-left px-3 flex items-center justify-between gap-2` : i === 2 ? "text-xs py-2.5 text-left px-3 rounded-lg border border-aneg/55 text-aneg hover:bg-aneg/10 font-bold flex items-center justify-between gap-2" : `${css.btnGhost} text-xs py-2.5 text-left px-3 border border-aline flex items-center justify-between gap-2`}
                    onClick={() => runDirectorChat(m.role, o.delta, o.news)}
                  >
                    <span>{o.label}</span>
                    <span className="text-[10px] font-mono flex-shrink-0 opacity-70">{o.delta > 0 ? `+${o.delta}` : o.delta}</span>
                  </button>
                ))}
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
            const stColor = st === 'MET' || st === 'ON TRACK' ? 'var(--A-pos)' : st === 'MISSED' ? 'var(--A-neg)' : 'var(--A-accent-2)';
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
        {league ? ` · ${league.short} (Tier ${league.tier})` : ''}. {isTier4 ? 'The parent committee may raise things after games — respond here. Working bees and committee meetings are still to come.' : 'Directors may message you after games — respond here. Formal meetings and votes are still to come.'}
        {' '}Inspired by games like Football Manager: pressure usually arrives through objectives and inbox notes; optional quick chats above add light FM-style relationship tuning without spamming you every week.
      </p>
    </div>
  );
}

function CommitteeTab({ club }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
  const accent = avg >= 70 ? 'var(--A-pos)' : avg >= 40 ? 'var(--A-accent-2)' : 'var(--A-neg)';
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
        <FootyTripCard />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {committee.map(m => {
          const trait = COMMITTEE_TRAIT_INFO[m.trait] || {};
          const moodColor = m.mood >= 70 ? 'var(--A-pos)' : m.mood >= 40 ? 'var(--A-accent-2)' : 'var(--A-neg)';
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

function FootyTripCard() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
              <div className="text-atext-mute">Morale</div><div className="text-apos font-mono text-right">+{opt.moraleGain}</div>
              <div className="text-atext-mute">Treasurer</div><div className="text-aneg font-mono text-right">{opt.treasurerHit}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HonoursTab({ club: _club }) {
  const career = useCareer();
  const history = career.history || [];
  const titles       = history.filter(h => h.champion).length;
  const promotions   = history.filter(h => h.promoted).length;
  const premierships = history.filter(h => h.champion);
  const bafWinners   = history.filter(h => h.brownlow).map(h => ({ season: h.season, ...h.brownlow }));
  const topScorers   = history.filter(h => h.topScorer).map(h => ({ season: h.season, ...h.topScorer }));
  // Career best season (most wins in a single season)
  const bestSeason   = history.length > 0 ? [...history].sort((a, b) => (b.W || 0) - (a.W || 0))[0] : null;

  return (
    <div className="space-y-5">
      {/* Trophy count strip */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>HONOURS</div>
          <div className="text-xs text-atext-dim">Your career trophy room, season by season.</div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Stat label="Premierships" value={titles} accent="#FFD200" icon={Trophy} />
          <Stat label="Promotions" value={promotions} accent="var(--A-pos)" icon={ChevronsUp} />
          <Stat label="Seasons" value={history.length} accent="var(--A-accent)" icon={Calendar} />
        </div>
      </div>

      {/* Dynasty Record panel */}
      {(() => {
        const cs = career.coachStats || {};
        return (
          <div className={`${css.panel} p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📊</span>
              <h3 className="font-display text-base tracking-wider text-aaccent">DYNASTY RECORD</h3>
            </div>
            <div className="text-[11px] text-atext-mute mb-3">
              Career: {cs.totalWins ?? 0}W {cs.totalLosses ?? 0}L {cs.totalDraws ?? 0}D · {cs.seasonsManaged ?? 0} seasons{(cs.premierships ?? 0) > 0 ? ` · ${cs.premierships} Premiership${cs.premierships > 1 ? 's' : ''}` : ''}
            </div>
            {(career.history || []).length >= 2 && (() => {
              const posData = [...career.history].map(h => ({
                label: `'${String(h.season).slice(-2)}`,
                pos: h.position ?? null,
                champion: h.champion,
              }));
              const maxPos = Math.max(...posData.map(d => d.pos ?? 1), 8);
              return (
                <div className="mb-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-atext-mute mb-1">Ladder position by season</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart data={posData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.4} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        reversed
                        domain={[1, maxPos]}
                        ticks={[1, Math.round(maxPos / 2), maxPos]}
                        tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                        tickLine={false}
                        axisLine={false}
                        width={18}
                        tickFormatter={v => `#${v}`}
                      />
                      <Tooltip
                        contentStyle={{ background: 'var(--A-panel)', border: '1px solid var(--A-line)', borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: 'var(--A-text-mute)' }}
                        formatter={(v, _n, { payload }) => [`#${v}${payload.champion ? ' 🏆' : ''}`, 'Position']}
                      />
                      <ReferenceLine y={1} stroke="rgba(234,179,8,0.4)" strokeDasharray="4 3" strokeWidth={1} />
                      <Line
                        type="monotone"
                        dataKey="pos"
                        stroke="var(--A-accent)"
                        strokeWidth={2}
                        dot={(p) => p.payload.champion
                          ? <circle key={p.key} cx={p.cx} cy={p.cy} r={5} fill="#EAB308" stroke="var(--A-bg)" strokeWidth={1.5} />
                          : <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill="var(--A-accent)" />
                        }
                        activeDot={{ r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
            {(career.history || []).length > 0 && (
              <div className="space-y-0.5">
                {[...career.history].reverse().map(h => (
                  <div key={h.season} className="flex items-center gap-2 py-1.5 border-b text-[12px]"
                    style={{ borderColor: 'var(--A-line)' }}>
                    <span className="font-mono w-10 text-atext-mute text-[11px]">{h.season}</span>
                    <span className="w-14 text-atext-mute text-[10px] truncate">{h.leagueShort}</span>
                    <span className="w-5 text-center font-bold text-atext">#{h.position}</span>
                    <span className="flex-1 text-atext-dim text-[11px]">{h.W}W {h.L}L{h.D > 0 ? ` ${h.D}D` : ''}</span>
                    {h.champion  && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{background:'rgba(234,179,8,0.2)',color:'#EAB308'}}>Premiers</span>}
                    {h.promoted  && <span className="text-[9px] text-apos">↑ Up</span>}
                    {h.relegated && <span className="text-[9px] text-aneg">↓ Down</span>}
                  </div>
                ))}
              </div>
            )}
            {(career.history || []).length === 0 && (
              <p className="text-[11px] text-atext-dim">No completed seasons yet.</p>
            )}
          </div>
        );
      })()}

      {history.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">Your career honour roll fills up after each season ends. Get to work.</div>
        </div>
      ) : (
        <>
          {/* Roll of Honour: Premierships */}
          {premierships.length > 0 && (
            <div className={`${css.panel} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏆</span>
                <h3 className="font-display text-base tracking-wider text-aaccent-2">PREMIERSHIPS</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {premierships.map((h, i) => (
                  <div key={i} className="rounded-xl px-3 py-2 text-center min-w-[80px]"
                    style={{ background: 'rgba(255,210,0,0.08)', border: '1px solid rgba(255,210,0,0.35)' }}>
                    <div className="font-display text-xl text-yellow-400">{h.season}</div>
                    <div className="text-[10px] text-atext-dim mt-0.5">{h.leagueShort}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Club Legends */}
          {(career.retiredPlayers?.length > 0) && (
            <div className={`${css.panel} p-4`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🌟</span>
                <h3 className="font-display text-base tracking-wider text-aaccent">CLUB LEGENDS</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-atext-mute font-black mb-2">Most Games</div>
                  <div className="space-y-1.5">
                    {[...career.retiredPlayers]
                      .sort((a, b) => (b.career?.gamesPlayed || 0) - (a.career?.gamesPlayed || 0))
                      .slice(0, 5)
                      .map((p, i) => (
                        <div key={p.id ?? i} className="flex items-center justify-between text-sm">
                          <span className="text-atext font-semibold">{p.name}</span>
                          <span className="text-atext-dim font-mono text-xs">{p.career?.gamesPlayed ?? 0} g · {p.seasonsAtClub} seasons</span>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-atext-mute font-black mb-2">Top Goal Kickers</div>
                  <div className="space-y-1.5">
                    {[...career.retiredPlayers]
                      .sort((a, b) => (b.career?.goals || 0) - (a.career?.goals || 0))
                      .slice(0, 5)
                      .map((p, i) => (
                        <div key={p.id ?? i} className="flex items-center justify-between text-sm">
                          <span className="text-atext font-semibold">{p.name}</span>
                          <span className="text-atext-dim font-mono text-xs">{p.career?.goals ?? 0} gls · {p.seasonsAtClub} seasons</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roll of Honour: B&F + Top Scorer two-column grid */}
          {(bafWinners.length > 0 || topScorers.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {bafWinners.length > 0 && (
                <div className={`${css.panel} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🎖️</span>
                    <h3 className="font-display text-base tracking-wider text-aaccent">BEST & FAIREST</h3>
                  </div>
                  <div className="space-y-1.5">
                    {bafWinners.slice(0, 6).map((w, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-atext font-semibold">{w.name}</span>
                        <span className="text-atext-dim font-mono text-xs">{w.season} · {w.votes}v</span>
                      </div>
                    ))}
                    {bafWinners.length > 6 && <div className="text-[10px] text-atext-mute">+{bafWinners.length - 6} more</div>}
                  </div>
                </div>
              )}
              {topScorers.length > 0 && (
                <div className={`${css.panel} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">⚽</span>
                    <h3 className="font-display text-base tracking-wider text-aaccent">TOP GOAL KICKERS</h3>
                  </div>
                  <div className="space-y-1.5">
                    {topScorers.slice(0, 6).map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-atext font-semibold">{s.name}</span>
                        <span className="text-atext-dim font-mono text-xs">{s.season} · {s.goals}g</span>
                      </div>
                    ))}
                    {topScorers.length > 6 && <div className="text-[10px] text-atext-mute">+{topScorers.length - 6} more</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Best season callout */}
          {bestSeason && bestSeason.W >= 12 && (
            <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'color-mix(in srgb, var(--A-accent) 6%, var(--A-panel))', border: '1px solid color-mix(in srgb, var(--A-accent) 22%, var(--A-line))' }}>
              <span className="text-2xl flex-shrink-0">⭐</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest font-mono text-aaccent mb-0.5">Best season</div>
                <div className="text-sm text-atext">{bestSeason.season} · {bestSeason.leagueShort} · {bestSeason.W}W {bestSeason.L}L {bestSeason.D}D · #{bestSeason.position}</div>
              </div>
            </div>
          )}

          {/* Manager Record */}
          {(() => {
            const cs = career.coachStats;
            if (!cs) return null;
            const totalGames = (cs.totalWins || 0) + (cs.totalLosses || 0) + (cs.totalDraws || 0);
            if (totalGames === 0) return null;
            const winPct = Math.round((cs.totalWins / totalGames) * 100);
            const seasonsManaged = cs.seasonsManaged || history.length;
            return (
              <div className={`${css.panel} p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">📋</span>
                  <h3 className="font-display text-base tracking-wider text-aaccent">MANAGER RECORD</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <Stat label="Seasons" value={seasonsManaged} accent="var(--A-accent)" icon={Calendar} />
                  <Stat label="W-L-D" value={`${cs.totalWins}-${cs.totalLosses}-${cs.totalDraws}`} accent="var(--A-accent)" />
                  <Stat label="Win %" value={`${winPct}%`} accent={winPct >= 50 ? "var(--A-pos)" : "var(--A-neg)"} />
                  <Stat label="Premierships" value={cs.premierships || 0} accent="#FFD200" icon={Trophy} />
                  <Stat label="Promotions" value={cs.promotions || 0} accent="var(--A-pos)" icon={ChevronsUp} />
                </div>
                {(career.coachTier || career.coachReputation != null) && (
                  <div className="text-[11px] text-atext-dim font-mono border-t pt-2" style={{ borderColor: 'var(--A-line)' }}>
                    {career.coachTier && <span className="mr-3">Tier: {career.coachTier}</span>}
                    {career.coachReputation != null && <span>Reputation: {Math.round(career.coachReputation)}</span>}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Full season-by-season table */}
          <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
            <div className="overflow-x-auto">
            <div className="grid gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b min-w-[760px]"
              style={{gridTemplateColumns:"5rem 1fr 4rem 4rem 4rem 4rem 4rem 4rem 1fr 1fr",borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
              <div>Season</div>
              <div>League</div>
              <div className="text-center">Pos</div>
              <div className="text-center">W-L-D</div>
              <div className="text-center">Pts</div>
              <div className="text-center">%</div>
              <div className="text-center">F</div>
              <div className="text-center">A</div>
              <div>Top Scorer</div>
              <div>Best & Fairest</div>
            </div>
            {[...history].reverse().map((h, i) => (
              <div key={i} className="grid gap-2 px-4 py-3 text-sm items-center min-w-[760px]"
                style={{
                  gridTemplateColumns:"5rem 1fr 4rem 4rem 4rem 4rem 4rem 4rem 1fr 1fr",
                  borderBottom:"1px solid var(--A-line)",
                  background: h.champion ? 'rgba(255,210,0,0.04)' : 'transparent',
                }}>
                <div className="font-display text-lg" style={{ color: h.champion ? '#FFD200' : 'var(--A-accent)' }}>{h.season}</div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-semibold text-xs">{h.leagueShort}</span>
                  {h.champion && <Pill color="#FFD200">🏆</Pill>}
                  {h.promoted && <Pill color="var(--A-pos)">⬆</Pill>}
                  {h.relegated && <Pill color="var(--A-neg)">⬇</Pill>}
                </div>
                <div className="text-center font-bold">{h.position}</div>
                <div className="text-center font-mono text-xs">{h.W}-{h.L}-{h.D}</div>
                <div className="text-center font-mono">{h.pts}</div>
                <div className="text-center font-mono text-xs">{h.pct}%</div>
                <div className="text-center font-mono text-xs">{h.F != null ? h.F : '—'}</div>
                <div className="text-center font-mono text-xs">{h.A != null ? h.A : '—'}</div>
                <div className="text-xs text-atext-dim truncate">{h.topScorer ? `${h.topScorer.name} · ${h.topScorer.goals}g` : '—'}</div>
                <div className="text-xs text-atext-dim truncate">{h.brownlow ? `${h.brownlow.name} · ${h.brownlow.votes}v` : '—'}</div>
              </div>
            ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RookieListTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
        <Stat label="Rookies" value={rookies.length} accent="var(--A-accent)" icon={Sprout} />
      </div>
      {rookies.length === 0 ? (
        <div className={`${css.panel} p-12 text-center`}>
          <Sprout className="w-12 h-12 mx-auto mb-3 opacity-30 text-atext-mute" />
          <div className="text-sm text-atext-dim">No rookies on your list. Draft or sign academy talent to start your pipeline.</div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
          {rookies.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center" style={{borderBottom:"1px solid var(--A-line)"}}>
              <div className="col-span-4 font-semibold text-sm">{p.firstName} {p.lastName} <span className="text-[10px] text-atext-dim ml-1">age {p.age}</span></div>
              <div className="col-span-1"><Pill color="var(--A-accent)">{formatPositionSlash(p)}</Pill></div>
              <div className="col-span-1"><RatingDot value={p.overall} /></div>
              <div className="col-span-2 flex items-center gap-1 text-[11px]">
                <span className="text-atext-mute">POT</span>
                <span className="font-bold text-apos">{p.potential}</span>
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

function FinanceRow({ label, valueStr, color, sub, barPct }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-atext">{label}</span>
        <span className="font-display text-lg" style={{ color }}>{valueStr}</span>
      </div>
      {sub && <div className="text-[10px] text-atext-mute mb-1">{sub}</div>}
      <Bar value={barPct} color={color} />
    </div>
  );
}

function FinancesTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [finTab, setFinTab] = useState('overview');
  const tier = leagueTierOf(career);
  const isT4 = tier === 4;
  const crisis = career.cashCrisisLevel ?? 0;

  // ── Tier 4 community budget view ─────────────────────────────────────────
  if (isT4) {
    const inc = grassrootsIncomeBreakdown(career);
    const exp = grassrootsExpenseBreakdown(career);
    const net = inc.grandTotal - exp.grandTotal;
    const isShort = (career.finance?.cash ?? 0) < 0;
    return (
      <div className="space-y-4">
        <div className="text-xs text-atext-dim -mt-1">
          Junior clubs run on <span className="text-atext font-medium">registration fees, canteen takings, local sponsorship and grants</span> — no wages, no broadcast money. Keep the books balanced and the committee will keep turning up.
        </div>

        {/* Cash shortage banner */}
        {isShort && (
          <div className={`${css.panel} p-4 flex items-start gap-3`} style={{ borderColor: 'var(--A-neg)', background: 'color-mix(in srgb, var(--A-neg) 6%, transparent)' }}>
            <AlertCircle className="w-5 h-5 text-aneg flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-aneg text-sm">COMMITTEE EMERGENCY</div>
              <div className="text-xs text-atext-dim mt-1">
                {career.t4GrantApplicationPending
                  ? 'Grant application lodged — waiting on the council. Check back in a few weeks.'
                  : career.t4SponsorHuntActive
                  ? 'The committee needs a local sponsor to cover costs. Check the Sponsors tab and sign a deal.'
                  : 'The tin is empty. Find a sponsor or run a fundraiser before the committee panic.'}
              </div>
            </div>
          </div>
        )}

        {/* Top-line stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Club Funds" value={`$${(career.finance?.cash ?? 0).toLocaleString()}`} accent={(career.finance?.cash ?? 0) >= 0 ? "var(--A-pos)" : "var(--A-neg)"} icon={DollarSign} />
          <Stat label="Season Net (proj)" value={`${net >= 0 ? '+' : ''}$${net.toLocaleString()}`} accent={net >= 0 ? "var(--A-pos)" : "var(--A-neg)"} />
          <Stat label="Players on List" value={(career.squad || []).length} sub="× $200 rego" accent="var(--A-accent)" />
          <Stat label="Grants This Season" value={`$${(career.t4GrantsThisSeason ?? 0).toLocaleString()}`} accent="#A78BFA" />
        </div>

        {/* Income */}
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>INCOME (PROJECTED SEASON)</h3>
          {[
            { label: "Registration Fees",       value: inc.regFees,   color: "var(--A-accent)", sub: `${(career.squad||[]).length} players × $200` },
            { label: "Canteen / BBQ",            value: inc.canteen,   color: "var(--A-pos)",    sub: "home games avg" },
            { label: "Local Sponsorship",        value: inc.sponsors,  color: "#A78BFA",          sub: "signed deals" },
            { label: "Grants (received so far)", value: inc.grants,    color: "#4ADE80",          sub: "council / federation" },
          ].map(r => (
            <FinanceRow key={r.label} label={r.label} valueStr={`$${r.value.toLocaleString()}`} color={r.color} sub={r.sub} barPct={inc.grandTotal > 0 ? (r.value / inc.grandTotal) * 100 : 0} />
          ))}
          <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
            <span>Total income</span><span className="text-apos">${inc.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className={`${css.panel} p-5`}>
          <h3 className={`${css.h1} text-2xl mb-3`}>EXPENSES (PROJECTED SEASON)</h3>
          {[
            { label: "Ground Hire",        value: exp.groundHire,  color: "var(--A-neg)",     sub: "home games" },
            { label: "Umpire Fees",        value: exp.umpires,     color: "var(--A-accent)",  sub: "all games" },
            { label: "Affiliation / Ins.", value: exp.affiliation + exp.insurance, color: "var(--A-accent)", sub: "annual fixed" },
            { label: "Equipment / Kit",    value: exp.equipment,   color: "var(--A-accent-2)", sub: "est." },
            { label: "Facility Upkeep",    value: exp.facilities,  color: "var(--A-accent)",  sub: "annual" },
          ].map(r => (
            <FinanceRow key={r.label} label={r.label} valueStr={`$${r.value.toLocaleString()}`} color={r.color} sub={r.sub} barPct={exp.grandTotal > 0 ? (r.value / exp.grandTotal) * 100 : 0} />
          ))}
          <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
            <span>Total expenses</span><span className="text-aneg">${exp.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Cashflow chart */}
        <CashflowChart />
        <BoardConfidenceChart />
      </div>
    );
  }

  // ── Tiers 1–3 professional finance hub ───────────────────────────────────
  const inc = incomeBreakdown(career);
  const exp = expenseBreakdown(career);
  const net = inc.grandTotal - exp.grandTotal;
  const wageCap = effectiveWageCap(career);
  const playerWages = currentPlayerWageBill(career);
  const wagePct = wageCap > 0 ? Math.min(150, Math.round((playerWages / wageCap) * 100)) : 0;
  const wageCapColor = wagePct >= 100 ? "var(--A-neg)" : wagePct >= 90 ? "var(--A-accent-2)" : wagePct >= 80 ? "var(--A-accent)" : "var(--A-pos)";
  const cfg = getDifficultyConfig(career.difficulty);
  const overflowPct = Math.round((cfg.capOverflow ?? 0) * 100);
  const objKey = career.boardFinancialObjective;
  const objDef = BOARD_FINANCIAL_OBJECTIVES[objKey];
  const wagePctOfIncome = inc.grandTotal > 0 ? Math.round(((playerWages + exp.staffWages) / inc.grandTotal) * 100) : 0;
  const wageRatioColor = wagePctOfIncome >= 80 ? "var(--A-neg)" : wagePctOfIncome >= 70 ? "var(--A-accent-2)" : "var(--A-pos)";

  const FIN_TABS = [
    { id: 'overview',   label: 'Overview' },
    { id: 'income',     label: 'Income & Expenses' },
    { id: 'cashflow',   label: 'Cash Flow' },
    { id: 'debt',       label: 'Debt & Venues' },
  ];

  return (
    <div className="space-y-4">
      {/* Cash crisis banner */}
      {crisis > 0 && (
        <div className={`${css.panel} p-4 flex items-start gap-3`} style={{ borderColor: 'var(--A-neg)', background: 'color-mix(in srgb, var(--A-neg) 6%, transparent)' }}>
          <AlertCircle className="w-5 h-5 text-aneg flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-aneg text-sm">CASH CRISIS · LEVEL {crisis}/4</div>
            <div className="text-xs text-atext-dim mt-1">{
              crisis === 1 ? 'Cash is in the red. Get back to black before the board steps in.' :
              crisis === 2 ? 'Emergency board meeting — a forced player sale is on the table.' :
              crisis === 3 ? 'Bank loan accepted. Sponsor pressure mounting.' :
                              'Insolvent. The board is preparing your termination.'
            }</div>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {FIN_TABS.map(t => (
          <button key={t.id} type="button"
            onClick={() => setFinTab(t.id)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition ${finTab === t.id ? 'bg-aaccent text-black' : 'bg-apanel-2 text-atext-dim hover:text-atext'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {finTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <Stat label="Cash" value={fmtK(career.finance.cash)} accent={career.finance.cash >= 0 ? "var(--A-pos)" : "var(--A-neg)"} icon={DollarSign} />
            <Stat label="Annual Net (proj)" value={fmtK(net)} accent={net > 0 ? "var(--A-pos)" : "var(--A-neg)"} />
            <Stat label="Wage Bill" value={fmtK(playerWages + exp.staffWages)} sub="players + staff" accent="var(--A-accent)" />
            <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="var(--A-accent)" />
          </div>

          {/* Board financial objective */}
          {objDef && (
            <div className={`${css.panel} p-4`}>
              <div className="flex items-start gap-3">
                <Briefcase className="w-4 h-4 text-aaccent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-atext-mute font-bold mb-0.5">Board Financial Objective</div>
                  <div className="font-bold text-atext text-sm">{objDef.label}</div>
                  <div className="text-xs text-atext-dim mt-1">{objDef.description}</div>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span className="text-apos">✓ +{objDef.confidenceReward} board confidence</span>
                    <span className="text-aneg">✗ {objDef.confidencePenalty} if missed</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wage-to-revenue health */}
          <div className={`${css.panel} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`${css.h1} text-2xl`}>FINANCIAL HEALTH</h3>
              <span className="text-xs font-bold" style={{ color: wageRatioColor }}>Wages {wagePctOfIncome}% of income</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <div className={css.label}>Annual income</div>
                <div className="font-display text-2xl text-apos">{fmtK(inc.grandTotal)}</div>
              </div>
              <div>
                <div className={css.label}>Annual expenses</div>
                <div className="font-display text-2xl text-aneg">{fmtK(exp.grandTotal)}</div>
              </div>
              <div>
                <div className={css.label}>Net projection</div>
                <div className={`font-display text-2xl ${net >= 0 ? 'text-apos' : 'text-aneg'}`}>{fmtK(net)}</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-atext-dim mb-1">
                <span>Wage-to-revenue ratio</span>
                <span style={{ color: wageRatioColor }}>
                  {wagePctOfIncome < 60 ? 'Healthy' : wagePctOfIncome < 70 ? 'Acceptable' : wagePctOfIncome < 80 ? 'Stretched' : 'Danger zone'}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--A-panel-2)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, wagePctOfIncome)}%`, background: wageRatioColor }} />
              </div>
              <div className="text-[10px] text-atext-mute mt-1">FM / UEFA guidance: keep wages under 70% of turnover. Above 80% risks board pressure.</div>
            </div>
          </div>

          {/* Match-day income model */}
          <div className={`${css.panel} p-5`}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className={`${css.h1} text-2xl`}>MATCH-DAY INCOME</h3>
              {career.lastMatchRevenue && (
                <Pill color="var(--A-pos)">Last match +{fmtK(career.lastMatchRevenue.total)}</Pill>
              )}
            </div>
            {(() => {
              const home = matchDayRevenue(career, { isHome: true });
              const away = matchDayRevenue(career, { isHome: false });
              const att = expectedAttendance(career);
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className={`${css.inset} p-3`}>
                    <div className="text-[10px] uppercase tracking-widest text-atext-mute font-bold mb-1">Home game</div>
                    <div className="font-display text-2xl text-apos">{fmtK(home.total)}</div>
                    <div className="text-[11px] text-atext-dim mt-1 leading-relaxed">
                      Gate {fmtK(home.gate)}{home.broadcast > 0 ? ` · TV ${fmtK(home.broadcast)}` : ''}{home.bar > 0 ? ` · Bar ${fmtK(home.bar)}` : ''} · Sponsor {fmtK(home.sponsor)}
                    </div>
                    <div className="text-[10px] text-atext-mute mt-1">~{att.toLocaleString('en-AU')} crowd</div>
                  </div>
                  <div className={`${css.inset} p-3`}>
                    <div className="text-[10px] uppercase tracking-widest text-atext-mute font-bold mb-1">Away game</div>
                    <div className="font-display text-2xl text-aaccent">{fmtK(away.total)}</div>
                    <div className="text-[11px] text-atext-dim mt-1 leading-relaxed">
                      {away.broadcast > 0 ? `TV ${fmtK(away.broadcast)} · ` : ''}Sponsor {fmtK(away.sponsor)}
                    </div>
                    <div className="text-[10px] text-atext-mute mt-1">No gate share away</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Salary cap */}
          {wageCap > 0 && (
            <div className={`${css.panel} p-5`}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h3 className={`${css.h1} text-2xl`}>SALARY CAP</h3>
                <div className="flex items-center gap-3">
                  {overflowPct !== 0 && (
                    <Pill color={overflowPct > 0 ? 'var(--A-pos)' : 'var(--A-neg)'}>
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
                {wagePct >= 100 ? '⚠️ Over cap — board pressure rising' :
                 wagePct >= 90  ? 'Cap stretched — careful with new signings' :
                 wagePct >= 80  ? 'Cap tightening — plan ahead' :
                                  `${fmtK(wageCap - playerWages)} of cap headroom available`}
              </div>
            </div>
          )}

          {/* Membership health */}
          {(career.membershipBase ?? 1.0) !== 1.0 && (
            <div className={`${css.inset} p-4 text-xs`}>
              <span className="text-aaccent font-bold">Membership base: </span>
              <span className="text-atext">{Math.round((career.membershipBase ?? 1.0) * 100)}% of tier baseline</span>
              <span className="text-atext-mute ml-2">— grows with finals appearances &amp; flags, shrinks on relegation.</span>
            </div>
          )}
        </div>
      )}

      {/* ── INCOME & EXPENSES ── */}
      {finTab === 'income' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`${css.panel} p-5`}>
            <h3 className={`${css.h1} text-2xl mb-3`}>INCOME (ANNUAL)</h3>
            {[
              ...(inc.broadcast > 0 ? [{ label: "Broadcast / TV Rights", value: inc.broadcast, color: "var(--A-accent)" }] : []),
              { label: "Gate Revenue",            value: inc.gate,        color: "var(--A-accent)" },
              ...(inc.bar > 0    ? [{ label: "Bar & Social Club",         value: inc.bar,     color: "#F59E0B" }] : []),
              ...(inc.canteen > 0 ? [{ label: "Canteen / BBQ",            value: inc.canteen, color: "#F59E0B" }] : []),
              ...(inc.regFees > 0 ? [{ label: "Player Registrations",     value: inc.regFees, color: "var(--A-pos)" }] : []),
              { label: "Membership",              value: inc.membership,  color: "var(--A-pos)" },
              { label: inc.bar > 0 ? "Club Events & Merch" : "Merchandise", value: inc.merchandise, color: "var(--A-accent-2)" },
              { label: "Sponsorship",             value: inc.sponsors,    color: "#A78BFA" },
              ...(inc.gaming > 0 ? [{ label: "Gaming / Social Venue", value: inc.gaming, color: "#F59E0B" }] : []),
            ].map(r => (
              <FinanceRow key={r.label} label={r.label} valueStr={fmtK(r.value)} color={r.color} barPct={inc.grandTotal > 0 ? (r.value / inc.grandTotal) * 100 : 0} />
            ))}
            <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
              <span>Total income</span><span className="text-apos">{fmtK(inc.grandTotal)}</span>
            </div>
          </div>
          <div className={`${css.panel} p-5`}>
            <h3 className={`${css.h1} text-2xl mb-3`}>EXPENSES (ANNUAL)</h3>
            {[
              { label: "Player Wages",      value: exp.playerWages, color: "var(--A-neg)" },
              { label: "Staff Wages",       value: exp.staffWages,  color: "var(--A-accent)" },
              { label: "Facilities Upkeep", value: exp.facilities,  color: "var(--A-accent)" },
              ...(exp.groundHire  > 0 ? [{ label: "Ground Hire",              value: exp.groundHire,  color: "var(--A-accent)" }] : []),
              ...(exp.umpires     > 0 ? [{ label: "Umpires & Officials",      value: exp.umpires,     color: "var(--A-accent)" }] : []),
              ...(exp.affiliation > 0 ? [{ label: "Affiliation & Insurance",  value: exp.affiliation, color: "var(--A-accent)" }] : []),
            ].map(r => (
              <FinanceRow key={r.label} label={r.label} valueStr={fmtK(r.value)} color={r.color} barPct={exp.grandTotal > 0 ? (r.value / exp.grandTotal) * 100 : 0} />
            ))}
            <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
              <span>Total expenses</span><span className="text-aneg">{fmtK(exp.grandTotal)}</span>
            </div>
            <div className="mt-3 pt-3 flex justify-between text-sm font-bold" style={{ borderTop: '1px solid var(--A-line)' }}>
              <span className={net >= 0 ? 'text-apos' : 'text-aneg'}>Net projection</span>
              <span className={`font-display ${net >= 0 ? 'text-apos' : 'text-aneg'}`}>{fmtK(net)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CASH FLOW ── */}
      {finTab === 'cashflow' && (
        <div className="space-y-4">
          <CashflowChart />
          <BoardConfidenceChart />
        </div>
      )}

      {/* ── DEBT & VENUES ── */}
      {finTab === 'debt' && (
        <div className="space-y-4">
          {career.bankLoan ? (
            <div className={`${css.panel} p-5`}>
              <h3 className={`${css.h1} text-2xl mb-3`}>BANK LOAN</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><div className={css.label}>Principal</div><div className="font-display text-2xl">{fmtK(career.bankLoan.principal)}</div></div>
                <div><div className={css.label}>Weeks left</div><div className="font-display text-2xl">{career.bankLoan.weeksRemaining}</div></div>
                <div><div className={css.label}>Interest / wk</div><div className="font-display text-2xl text-aneg">{fmtK(career.bankLoan.interestPerWeek)}</div></div>
              </div>
            </div>
          ) : (
            <div className={`${css.inset} p-4 text-sm text-atext-dim`}>No outstanding loans.</div>
          )}

          {/* Gaming / social venue */}
          {(tier === 1 || tier === 2) && (
            <div className={`${css.panel} p-5`}>
              <div className="flex items-start gap-2 mb-3">
                <Landmark className="w-4 h-4 text-aaccent mt-0.5 flex-shrink-0" />
                <h3 className={`${css.h1} text-2xl`}>GAMING / SOCIAL VENUE</h3>
              </div>
              {career.gamingVenue ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <div className={css.label}>Current venue</div>
                      <div className="font-bold text-atext">{GAMING_VENUE.types[career.gamingVenue.type]?.label} · Level {career.gamingVenue.level}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className={css.label}>Annual revenue</div>
                      <div className="font-display text-2xl text-[#F59E0B]">{fmtK(gamingVenueAnnualRevenue(career))}</div>
                    </div>
                  </div>
                  <div className="text-xs text-atext-mute mb-3">Community rating impact: <span className="text-aneg">{GAMING_VENUE.types[career.gamingVenue.type]?.communityRatingHit} per level</span></div>
                  {career.gamingVenue.level < GAMING_VENUE.maxLevel && (
                    <button type="button"
                      onClick={() => { const patch = investInGamingVenue(career, career.gamingVenue.type); if (patch && updateCareer) updateCareer(patch); }}
                      className={`${css.btnPrimary} text-xs px-4 py-2`}>
                      Expand to Level {career.gamingVenue.level + 1} (${Math.round(GAMING_VENUE.types[career.gamingVenue.type]?.investmentCost * GAMING_VENUE.upgradeCostMultiplier).toLocaleString()})
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-atext-dim mb-4">Invest in a venue for large recurring annual revenue. A strategic — and somewhat controversial — choice. Pokies earn the most but take a significant community-reputation hit.</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(GAMING_VENUE.types).map(([type, def]) => (
                      <div key={type} className={`${css.inset} p-4`}>
                        <div className="font-bold text-atext mb-1">{def.label}</div>
                        <div className="text-xs text-atext-dim mb-2">{def.description}</div>
                        <div className="text-xs mb-1">Revenue: <span className="text-[#F59E0B] font-bold">{fmtK(def.annualRevenueBase)}/yr</span></div>
                        <div className="text-xs mb-3">Community hit: <span className="text-aneg font-bold">{def.communityRatingHit}</span></div>
                        <button type="button"
                          disabled={(career.finance?.cash ?? 0) < def.investmentCost}
                          onClick={() => { const patch = investInGamingVenue(career, type); if (patch && updateCareer) updateCareer(patch); }}
                          className={(career.finance?.cash ?? 0) >= def.investmentCost ? `${css.btnPrimary} w-full text-xs py-2` : 'w-full text-xs py-2 rounded-lg bg-apanel-2 text-atext-mute cursor-not-allowed'}>
                          Invest {fmtK(def.investmentCost)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FINANCE CHARTS — Recharts-based visualisations
// ============================================================================

/** Custom tooltip for the cashflow AreaChart. */
function CashflowTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const income   = payload.find(p => p.dataKey === 'income')?.value ?? 0;
  const expenses = payload.find(p => p.dataKey === 'expenses')?.value ?? 0;
  const cash     = payload.find(p => p.dataKey === 'cash')?.value ?? 0;
  return (
    <div
      className="text-[11px] rounded-xl p-3 space-y-1 shadow-lg"
      style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line)', minWidth: 140 }}
    >
      <div className="font-bold text-atext mb-1">{label}</div>
      <div style={{ color: 'var(--A-pos)' }}>Income: ${income}k</div>
      <div style={{ color: 'var(--A-neg)' }}>Expenses: ${expenses}k</div>
      <div className="pt-1 border-t font-bold" style={{ borderColor: 'var(--A-line)', color: 'var(--A-accent)' }}>
        Balance: ${cash}k
      </div>
    </div>
  );
}

/** Recharts-powered cash flow area chart using career.weeklyHistory. */
function CashflowChart() {
  const career = useCareer();
  const history = career.weeklyHistory || [];
  const chartData = history.map((w, i) => ({
    label: `Wk ${w.week || i + 1}`,
    income:   Math.round((w.income ?? 0) / 1000),
    expenses: Math.round((w.expenses ?? 0) / 1000),
    cash:     Math.round((w.cash ?? 0) / 1000),
    net:      Math.round((w.profit ?? 0) / 1000),
  }));

  return (
    <div className={`${css.panel} p-5`}>
      <h3 className={`${css.h1} text-2xl mb-1`}>CASH FLOW (BY CALENDAR WEEK)</h3>
      <p className="text-[11px] text-atext-dim mb-4">Weekly operating income vs expenses (thousands). Balance line tracks your cash at end of each week.</p>
      {chartData.length === 0 ? (
        <div className="text-sm text-atext-dim py-8 text-center">
          No ledger entries yet — advance the schedule (each new day accrues operating cash).
        </div>
      ) : (
        <>
          {/* Balance area chart */}
          <div className="mb-2">
            <div className="text-[10px] uppercase tracking-widest text-atext-mute mb-2 font-bold">Cash balance ($k)</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--A-accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--A-accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--A-line)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v}k`}
                  width={45}
                />
                <Tooltip content={<CashflowTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cash"
                  name="Balance"
                  stroke="var(--A-accent)"
                  strokeWidth={2}
                  fill="url(#cashGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--A-accent)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly net income/expense bar chart */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-atext-mute mb-2 font-bold">Weekly income vs expenses ($k)</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--A-line)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v}k`}
                  width={45}
                />
                <Tooltip content={<CashflowTooltip />} />
                <ReBar dataKey="income"   name="Income"   fill="var(--A-pos)" fillOpacity={0.75} radius={[2,2,0,0]} />
                <ReBar dataKey="expenses" name="Expenses" fill="var(--A-neg)" fillOpacity={0.75} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-4 mt-2 text-[10px] text-atext-mute">
            <span className="flex items-center gap-1"><span style={{ background: 'var(--A-pos)', borderRadius: 2, display: 'inline-block', width: 10, height: 10 }} /> Income</span>
            <span className="flex items-center gap-1"><span style={{ background: 'var(--A-neg)', borderRadius: 2, display: 'inline-block', width: 10, height: 10 }} /> Expenses</span>
            <span className="flex items-center gap-1"><span style={{ background: 'var(--A-accent)', borderRadius: 2, display: 'inline-block', width: 10, height: 10 }} /> Balance</span>
          </div>
        </>
      )}
    </div>
  );
}

/** Custom tooltip for the board confidence LineChart. */
function ConfidenceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const conf = payload[0]?.value ?? 0;
  const color = conf >= 70 ? 'var(--A-pos)' : conf >= 40 ? 'var(--A-accent-2)' : 'var(--A-neg)';
  return (
    <div
      className="text-[11px] rounded-xl p-3 shadow-lg"
      style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line)', minWidth: 130 }}
    >
      <div className="font-bold text-atext mb-1">{label}</div>
      <div style={{ color }}>Confidence: {conf}%</div>
    </div>
  );
}

/** Recharts-powered board confidence trend line. */
function BoardConfidenceChart() {
  const career = useCareer();
  const history = career.weeklyHistory || [];
  // Only include entries that have boardConfidence recorded
  const withConf = history.filter(w => w.boardConfidence != null);

  // Always show current confidence as the last data point even if no history exists
  const currentConf = Math.round(career.finance?.boardConfidence ?? 0);

  if (withConf.length < 2 && currentConf === 0) return null;

  // Build chart data — if only current data available, show a single-point
  // stub so the chart still renders meaningfully.
  const chartData = withConf.length > 0
    ? withConf.map((w, i) => ({
        label: `Wk ${w.week || i + 1}`,
        confidence: w.boardConfidence,
      }))
    : [{ label: 'Now', confidence: currentConf }];

  const confColor = (v) => v >= 70 ? 'var(--A-pos)' : v >= 40 ? 'var(--A-accent-2)' : 'var(--A-neg)';
  const latestConf = chartData[chartData.length - 1]?.confidence ?? currentConf;
  const lineColor = confColor(latestConf);

  return (
    <div className={`${css.panel} p-5`}>
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className={`${css.h1} text-2xl`}>BOARD CONFIDENCE</h3>
        <span className="font-display text-2xl" style={{ color: lineColor }}>{currentConf}%</span>
      </div>
      <p className="text-[11px] text-atext-dim mb-4">
        {currentConf >= 70 ? 'Board is firmly behind you — full budgets and competitive offers unlocked.'
          : currentConf >= 40 ? 'Board is watching carefully. Maintain results to avoid contract pressure.'
          : 'Board confidence is low. Sacking risk is elevated — results urgently needed.'}
      </p>
      {chartData.length < 2 ? (
        <div className="text-sm text-atext-dim py-4 text-center">
          Trend line builds as you advance weeks. Current confidence: <strong style={{ color: lineColor }}>{currentConf}%</strong>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--A-line)" strokeOpacity={0.5} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--A-line)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: 'var(--A-text-mute)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}%`}
                width={38}
              />
              <Tooltip content={<ConfidenceTooltip />} />
              <Line
                type="monotone"
                dataKey="confidence"
                name="Confidence"
                stroke={lineColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-atext-mute">
            <span style={{ color: 'var(--A-pos)' }}>70%+ Secure</span>
            <span style={{ color: 'var(--A-accent-2)' }}>40–69% Watched</span>
            <span style={{ color: 'var(--A-neg)' }}>&lt;40% At risk</span>
          </div>
        </>
      )}
    </div>
  );
}

// A single new-offer card with Accept / Counter / Decline + a top-4 clause toggle.
function SponsorOfferCard({ offer, onAccept, onDecline, onCounter, onSignWithClause }) {
  const base = offer.annualValue ?? 0;
  const minV = base;
  const maxV = Math.round(base * 1.5);
  const [mode, setMode] = useState(null); // null | 'counter'
  const [counter, setCounter] = useState(base);
  const [withClause, setWithClause] = useState(false);

  const clauseTerms = sponsorClauseTerms(offer);
  const odds = Math.round(sponsorCounterAcceptChance(offer, counter) * 100);
  const oddsColor = odds >= 66 ? 'var(--A-pos)' : odds >= 33 ? '#FFB347' : 'var(--A-neg)';

  const sendCounter = () => {
    onCounter(offer, counter, withClause ? sponsorClauseTerms(offer) : undefined);
    setMode(null);
  };
  const accept = () => {
    if (withClause) onSignWithClause(offer, clauseTerms);
    else onAccept(offer);
  };

  return (
    <div className={`${css.inset} p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-display text-xl">{offer.name}</div>
          <div className="text-[10px] text-atext-dim uppercase tracking-widest">{offer.category} · {offer.type}</div>
        </div>
        <Pill color="var(--A-accent)">{offer.yearsLeft}y</Pill>
      </div>
      <div className="text-[11px] text-atext-dim mb-2">
        Offer: <span className="font-bold text-apos">{fmtK(base)}/yr</span>
      </div>

      {/* Top-4 performance clause toggle */}
      <button
        onClick={() => setWithClause(v => !v)}
        className={`w-full text-left text-[11px] px-3 py-2 rounded-lg mb-2 border ${withClause ? 'border-aaccent bg-aaccent/10' : 'border-transparent bg-apanel-2 hover:bg-apanel-2/70'}`}
      >
        <span className="font-bold">{withClause ? '✓ ' : '+ '}Add a top-4 performance clause</span>
        <div className="text-atext-dim mt-0.5">
          {fmtK(clauseTerms.base)}/yr guaranteed · <span style={{color: 'var(--A-accent)'}}>+{fmtK(clauseTerms.bonus)} if you finish top 4</span>
        </div>
      </button>

      {mode === 'counter' && (
        <div className="mb-2 p-3 rounded-lg bg-apanel-2">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-atext-dim uppercase tracking-widest">Counter</span>
            <span className="font-bold text-atext">{fmtK(counter)}/yr</span>
          </div>
          <input
            type="range"
            min={minV}
            max={maxV}
            step={Math.max(1, Math.round(base * 0.01))}
            value={counter}
            onChange={e => setCounter(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-atext-dim">Acceptance odds</span>
            <span className="font-bold" style={{ color: oddsColor }}>{odds}%</span>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => setMode(null)} className="text-xs px-3 py-2 rounded-lg text-atext-mute hover:text-atext">Cancel</button>
            <button onClick={sendCounter} className={`${css.btnPrimary} text-xs px-3 py-2`}>Send counter</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end flex-wrap">
        <button onClick={() => onDecline(offer)} className="text-xs px-3 py-2 rounded-lg text-atext-mute hover:text-atext">Pass</button>
        <button
          onClick={() => { setCounter(base); setMode(mode === 'counter' ? null : 'counter'); }}
          className="text-xs px-3 py-2 rounded-lg text-aaccent hover:bg-aaccent/10"
        >
          Counter
        </button>
        <button onClick={accept} className={`${css.btnPrimary} text-xs px-3 py-2`}>
          {withClause ? 'Accept w/ Clause' : 'Accept Deal'}
        </button>
      </div>
    </div>
  );
}

function SponsorsTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
  // Sign an offer, optionally at a negotiated value and/or with a top-4 clause.
  const signOffer = (offer, { finalValue, clauseTerms } = {}) => {
    const base = { ...offer };
    if (finalValue != null) base.annualValue = finalValue;
    if (clauseTerms) {
      base.annualValue = clauseTerms.base;
      base.clause = clauseTerms.clause;
      base.bonus = clauseTerms.bonus;
    }
    const patch = applySponsorOfferAcceptance(career, base);
    const clauseNote = clauseTerms ? ` + ${fmtK(clauseTerms.bonus)} top-4 bonus` : '';
    updateCareer({
      ...patch,
      sponsorOffers: offers.filter(o => o.offerId !== offer.offerId),
      news: [{ week: career.week, type: 'win', text: `📈 New sponsor: ${base.name} (${fmtK(base.annualValue)}/yr${clauseNote}, ${base.yearsLeft}y)` }, ...(career.news || [])].slice(0, 25),
    });
  };
  // Send a counter-offer; the sponsor accepts probabilistically or walks.
  const counterOffer = (offer, counterValue, clauseTerms) => {
    const result = evaluateSponsorCounter(offer, counterValue);
    if (result.accepted) {
      signOffer(offer, { finalValue: result.finalValue, clauseTerms });
    } else {
      updateCareer({
        sponsorOffers: offers.filter(o => o.offerId !== offer.offerId),
        news: [{ week: career.week, type: 'loss', text: `🤝 ${offer.name} walked away — your counter was too steep` }, ...(career.news || [])].slice(0, 25),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <Stat label="Total Annual" value={fmtK(totalAnnual)} accent="var(--A-pos)" />
        <Stat label="Active Deals" value={sponsorList.length} accent="var(--A-accent)" />
        <Stat label="Avg Deal" value={sponsorList.length ? fmtK(Math.round(totalAnnual/sponsorList.length)) : "—"} accent="var(--A-accent)" />
        <Stat label="Sponsor x" value={`${cfg.sponsorMultiplier.toFixed(2)}×`} sub="difficulty" accent="var(--A-accent-2)" />
      </div>

      {expiredLastSeason.length > 0 && (
        <div className={`${css.panel} p-4`} style={{borderColor: 'var(--A-neg)'}}>
          <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-aneg" /><div className="font-bold text-sm">Lost last season</div></div>
          <div className="flex flex-wrap gap-2">
            {expiredLastSeason.map(s => (
              <Pill key={s.id} color="var(--A-neg)">{s.name} · {fmtK(s.annualValue)}/yr</Pill>
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
                    <Pill color={delta >= 0 ? 'var(--A-pos)' : 'var(--A-neg)'}>{delta >= 0 ? '+' : ''}{fmtK(delta)}</Pill>
                  </div>
                  <div className="text-[11px] text-atext-dim mb-2">
                    Was {fmtK(p.currentValue)}/yr → propose <span className="font-bold text-atext">{fmtK(p.proposedValue)}/yr</span> for {p.proposedYears}y
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => declineRenewal(p)} className="text-xs px-3 py-2 rounded-lg text-aneg hover:bg-aneg/10">Decline</button>
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
          <p className="text-xs text-atext-dim mb-3">Brands knocking on the door — accept, counter for more, or add a top-4 clause.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {offers.map(o => (
              <SponsorOfferCard
                key={o.offerId}
                offer={o}
                onAccept={acceptOffer}
                onDecline={declineOffer}
                onCounter={counterOffer}
                onSignWithClause={(offer, clauseTerms) => signOffer(offer, { clauseTerms })}
              />
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
                  <div className="font-display text-3xl text-apos">{fmtK(s.annualValue)}</div>
                  {s.clause === 'top4' && (
                    <div className="mt-1 text-[10px] text-aaccent uppercase tracking-widest">+{fmtK(s.bonus)} if top 4</div>
                  )}
                </div>
                <button onClick={()=>drop(s)} className="text-xs px-3 py-2 rounded-lg text-aneg hover:bg-aneg/10">Drop</button>
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
function KitsTab({ club }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
            <button key={k} onClick={()=>setEditing(k)} className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${editing===k ? "bg-aaccent text-[var(--fd-on-accent,#0A0D0C)]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{k}</button>
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
                <button key={p.key} onClick={()=>updateKit("pattern", p.key)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${kit.pattern===p.key ? "bg-aaccent text-[var(--fd-on-accent,#0A0D0C)]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{p.label}</button>
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
function FacilitiesTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const FAC_INFO = {
    trainingGround: { name: "Training Ground", icon: Activity, desc: "Improves training effectiveness and skill development", color: "var(--A-accent)" },
    gym: { name: "Strength & Conditioning", icon: Dumbbell, desc: "Boosts player strength, speed and endurance gains", color: "var(--A-accent)" },
    medical: { name: "Medical Centre", icon: Heart, desc: "Reduces injury rate, faster recovery from knocks", color: "var(--A-neg)" },
    academy: { name: "Youth Academy", icon: GraduationCap, desc: "Better youth recruits and development progression", color: "var(--A-pos)" },
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
  const financeUpgrade = (key) => {
    const f = career.facilities[key];
    if (f.level >= f.max) return;
    const cost = f.cost * f.level;
    const annualRepayment = Math.round(cost * 1.08 / 5);
    const nextLevel = f.level + 1;
    const payload = {
      facilities: { ...career.facilities, [key]: { ...f, level: nextLevel } },
      facilityLoans: [
        ...(career.facilityLoans || []),
        { facilityKey: key, originalCost: cost, annualRepayment, seasonsLeft: 5, takenSeason: career.season },
      ],
      news: [{ week: career.week, type: "info", text: `🏗️ ${FAC_INFO[key].name} upgraded on a 5-year facility loan ($${(annualRepayment / 1000).toFixed(0)}k/yr).` }, ...(career.news || [])].slice(0, 20),
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
          <Stat label="Overall Rating" value={`${totalLevel}/${maxTotal}`} accent="var(--A-accent)" />
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
          const hasActiveLoan = (career.facilityLoans || []).some(l => l.facilityKey === key);
          const annualRepayment = Math.round(cost * 1.08 / 5);
          const canFinance = !maxed && !hasActiveLoan;
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
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <div className="text-xs text-atext-dim">
                      {maxed ? <span className="text-apos">⭐ Max level</span> : <>Upgrade: <span className={canAfford ? "text-atext font-bold" : "text-aneg font-bold"}>${(cost/1000).toFixed(0)}k</span></>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={()=>upgrade(key)} disabled={maxed||!canAfford} className={maxed||!canAfford ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-apanel-2 text-atext-mute" : `${css.btnPrimary} text-xs px-3 py-1.5`}>
                        {maxed ? "Maxed" : "Upgrade"}
                      </button>
                      {!maxed && (
                        <button
                          type="button"
                          disabled={!canFinance}
                          onClick={() => financeUpgrade(key)}
                          className="text-[11px] px-3 py-1.5 rounded-xl transition"
                          style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)', color: canFinance ? 'var(--A-text-dim)' : 'var(--A-text-mute)', opacity: canFinance ? 1 : 0.5 }}
                        >
                          {hasActiveLoan ? 'Loan active' : `Finance (5yr · $${(annualRepayment / 1000).toFixed(0)}k/yr)`}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(career.facilityLoans || []).length > 0 && (
        <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}>
          <div className="text-[11px] font-mono uppercase tracking-widest text-atext-mute mb-2">Active facility loans</div>
          {(career.facilityLoans || []).map((loan, i) => (
            <div key={i} className="flex justify-between text-[12px] text-atext mb-1">
              <span>{FAC_INFO[loan.facilityKey]?.name ?? loan.facilityKey} — {loan.seasonsLeft} season{loan.seasonsLeft !== 1 ? 's' : ''} left</span>
              <span className="text-aaccent">${(loan.annualRepayment / 1000).toFixed(0)}k/yr</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StaffTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
  const avgRating = (career.staff?.length ?? 0)
    ? Math.round(career.staff.reduce((a,s)=>a+(s.rating||0),0) / career.staff.length)
    : 0;
  const tasks = ensureStaffTasks(career);
  const clubState = findClub(career.clubId)?.state ?? null;
  const patchStaffTasks = (partial) =>
    updateCareer({ staffTasks: { ...tasks, ...partial } });
  const roster = career.staff || [];
  const hasAnalyst = roster.some((s) => s.id === 's10');
  const hasHeadRecruiter = roster.some((s) => s.id === 's7');
  const hasSeniorScout = roster.some((s) => s.id === 's8');
  const expandablePool = EXPANDABLE_ROLE_IDS_BY_TIER[leagueTier] || [];
  const rosterHints = [];
  if (!hasSeniorScout && expandablePool.includes('s8')) {
    rosterHints.push({
      title: 'No Senior Scout on staff',
      body: 'Recruitment can sign one when offered — sharper scouting reports and better interstate pack value when they lead scouting.',
    });
  }
  if (!hasHeadRecruiter && expandablePool.includes('s7')) {
    rosterHints.push({
      title: 'No Head Recruiter on staff',
      body: 'Hire under Recruitment when available — trade opening asks default to their negotiation skill.',
    });
  }
  if (!hasAnalyst && expandablePool.includes('s10')) {
    rosterHints.push({
      title: 'No Performance Analyst on staff',
      body: 'Sign one under Recruitment to unlock Deep dive match prep and richer preview flavour.',
    });
  }
  const hirableIds = listExpandableHires(career);
  const wageBillAnnual = annualWageBill(career);

  const tryHireProfessional = (blueprintId) => {
    const fee = professionalSigningFee(leagueTier, blueprintId);
    const res = hireBlueprintStaff(career, blueprintId);
    if (!res.ok) {
      const msg =
        res.reason === 'insufficient_cash'
          ? `Cannot sign — need ${fmtK(fee)} cash for the hiring fee`
          : res.reason === 'roster_full'
            ? `Staff roster is full (${MAX_STAFF_ROWS} max)`
            : 'Signing blocked — check tier or duplicates';
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: msg }, ...(career.news || [])].slice(0, 15),
      });
      return;
    }
    updateCareer({
      staff: res.staff,
      finance: res.finance,
      news: [{ week: career.week, type: 'win', text: res.newsLine }, ...(career.news || [])].slice(0, 15),
    });
  };

  const tryRecruitVolunteer = (templateIndex) => {
    const res =
      templateIndex === 'random'
        ? recruitRandomVolunteerStaff(career)
        : recruitVolunteerStaff(career, templateIndex);
    if (!res.ok) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `Volunteer intake failed (${res.reason})` }, ...(career.news || [])].slice(0, 15),
      });
      return;
    }
    updateCareer({
      staff: res.staff,
      committee: res.committee ?? career.committee,
      news: [{ week: career.week, type: 'info', text: res.newsLine }, ...(career.news || [])].slice(0, 15),
    });
  };

  return (
    <div className="space-y-4">
      <StaffRenewalsPanel leagueTier={leagueTier} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className={`${css.h1} text-3xl`}>STAFF</div>
          <div className="text-xs text-atext-dim">Your support team shapes training outcomes, recruitment quality and player development.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Avg Rating" value={avgRating} accent="var(--A-pos)" />
          <Stat label="Staff headcount" value={`${roster.length}/${MAX_STAFF_ROWS}`} accent="#A78BFA" />
        </div>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-atext-mute">Staff priorities</div>
        <div className="text-xs text-atext-dim leading-snug">
          Assign people on your roster to football-office jobs. <span className="text-atext font-semibold">Scouting lead</span>{' '}
          drives report accuracy and interstate travel discounts (defaults to Senior Scout when unset).{' '}
          <span className="text-atext font-semibold">Trade negotiator</span> shapes opening wage asks (defaults to Head Recruiter).{' '}
          <span className="text-atext font-semibold">Training program lead</span> lifts every session using their rating +6 as a floor.
          Match-day depth still scales with match-prep tier when a performance analyst is employed.
        </div>
        {rosterHints.length > 0 && (
          <div className="space-y-2">
            {rosterHints.map((h) => (
              <div
                key={h.title}
                className="rounded-xl border border-aline bg-apanel-2/40 px-3 py-2 text-[11px] text-atext-dim leading-snug"
              >
                <span className="font-semibold text-atext">{h.title}</span>
                {' — '}
                {h.body}
              </div>
            ))}
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-1">Recruiting region focus</label>
            <select
              value={tasks.recruitPriorityState ?? ''}
              onChange={(e) =>
                patchStaffTasks({
                  recruitPriorityState: e.target.value === '' ? null : e.target.value,
                })
              }
              className="w-full rounded-lg border border-aline bg-apanel px-2 py-2 text-sm"
            >
              <option value="">Balanced (no fee discount)</option>
              {STATES.filter((s) => s !== 'NAT').map((s) => (
                <option key={s} value={s}>
                  {s}
                  {clubState && s === clubState ? ' (home)' : ''}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-atext-dim mt-1">Cheaper interstate scout packs into this state + clearer reports there.</p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-1">Scouting lead</label>
            <select
              value={tasks.scoutLeadId ?? ''}
              onChange={(e) =>
                patchStaffTasks({
                  scoutLeadId: e.target.value === '' ? null : e.target.value,
                })
              }
              className="w-full rounded-lg border border-aline bg-apanel px-2 py-2 text-sm"
            >
              <option value="">Auto — Senior Scout if on staff</option>
              {roster.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.role}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-atext-dim mt-1">Local / interstate reports and travel fees use their rating (volunteer coaches count at a softer curve).</p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-1">Trade negotiator</label>
            <select
              value={tasks.tradeNegotiatorId ?? ''}
              onChange={(e) =>
                patchStaffTasks({
                  tradeNegotiatorId: e.target.value === '' ? null : e.target.value,
                })
              }
              className="w-full rounded-lg border border-aline bg-apanel px-2 py-2 text-sm"
            >
              <option value="">Auto — Head Recruiter if on staff</option>
              {roster.map((s) => (
                <option key={`t-${s.id}`} value={s.id}>
                  {s.name} — {s.role}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-atext-dim mt-1">Opening trade asks use their negotiation skill (cap filter &quot;max demand&quot; follows the same band).</p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-1">Training program lead</label>
            <select
              value={tasks.trainingLeadId ?? ''}
              onChange={(e) =>
                patchStaffTasks({
                  trainingLeadId: e.target.value === '' ? null : e.target.value,
                })
              }
              className="w-full rounded-lg border border-aline bg-apanel px-2 py-2 text-sm"
            >
              <option value="">Rotate — specialists only</option>
              {roster.map((s) => (
                <option key={`tr-${s.id}`} value={s.id}>
                  {s.name} — {s.role}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-atext-dim mt-1">Every session uses the better of the specialist coach or your lead&apos;s rating +6.</p>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className="block text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-1">Match-prep depth</label>
            <div className="flex flex-wrap gap-2">
              {[
                { tier: 0, label: 'Standard' },
                { tier: 1, label: 'Extra tape' },
                { tier: 2, label: 'Deep dive' },
              ].map(({ tier, label }) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => patchStaffTasks({ matchPrepTier: tier })}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                    tasks.matchPrepTier === tier
                      ? 'border-aaccent bg-aaccent/15 text-aaccent'
                      : 'border-aline bg-apanel text-atext-dim hover:border-aline-2'
                  }`}
                  disabled={tier >= 2 && !hasAnalyst}
                  title={tier >= 2 && !hasAnalyst ? 'Requires Performance Analyst (s10) on staff' : ''}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-atext-dim mt-1">
              {hasAnalyst ? 'Analyst unlocks the deepest match-preview flavour.' : 'Hire a performance analyst to unlock Deep dive.'}
            </p>
          </div>
        </div>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-atext-mute">Recruitment</div>
        <p className="text-xs text-atext-dim leading-snug">
          Sign contract staff your tier doesn&apos;t start with (cash signing fee + wages). Add unpaid{' '}
          <span className="text-atext font-semibold">community volunteers</span> for depth — they boost committee mood at state/local levels and can lead scouting/training assignments like anyone else on the list.
        </p>
        {hirableIds.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-2">Contract hires</div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {hirableIds.map((bid) => {
                const meta = STAFF_BLUEPRINT.find((b) => b.id === bid);
                const fee = professionalSigningFee(leagueTier, bid);
                const wageEst = previewExpansionAnnualWage(leagueTier, bid);
                const cashNow = career.finance?.cash ?? 0;
                const canCash = cashNow >= fee;
                const room = roster.length < MAX_STAFF_ROWS;
                const projectedWageBill = wageBillAnnual + wageEst;
                const cashAfterFee = cashNow - fee;
                return (
                  <div key={bid} className={`${css.inset} p-3 flex flex-col gap-2`}>
                    <div className="font-bold text-sm text-atext">{meta?.role ?? bid}</div>
                    <div className="text-[10px] text-atext-dim font-mono">
                      Fee {fmtK(fee)} · from ~{fmtK(wageEst)}/yr
                    </div>
                    <div className="text-[10px] text-atext-dim leading-snug">
                      Proj. total wage bill ~{fmtK(projectedWageBill)}/yr · cash after fee ~{fmtK(cashAfterFee)}
                    </div>
                    <button
                      type="button"
                      disabled={!canCash || !room}
                      onClick={() => tryHireProfessional(bid)}
                      className={
                        canCash && room
                          ? `${css.btnPrimary} text-xs py-2`
                          : 'text-xs py-2 rounded-lg bg-apanel-2 text-atext-mute'
                      }
                      title={!room ? `Max ${MAX_STAFF_ROWS} staff` : !canCash ? 'Insufficient cash for signing fee' : ''}
                    >
                      Sign
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <div className="text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-2">Community volunteers</div>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              disabled={roster.length >= MAX_STAFF_ROWS}
              onClick={() => tryRecruitVolunteer('random')}
              className={
                roster.length < MAX_STAFF_ROWS
                  ? `${css.btnGhost} text-xs px-3 py-2 border border-aline font-bold`
                  : 'text-xs px-3 py-2 rounded-lg bg-apanel-2 text-atext-mute'
              }
            >
              Surprise volunteer
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {VOLUNTEER_ROLE_TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.role}
                type="button"
                disabled={roster.length >= MAX_STAFF_ROWS}
                onClick={() => tryRecruitVolunteer(idx)}
                className={`text-left p-3 rounded-lg border text-[11px] transition ${
                  roster.length >= MAX_STAFF_ROWS
                    ? 'border-aline bg-apanel-2 text-atext-mute'
                    : 'border-aline bg-apanel hover:border-aaccent/40'
                }`}
              >
                <span className="font-bold text-atext">{tpl.role}</span>
                <span className="block text-[10px] text-atext-dim mt-1">Unpaid · mood lift · assignable</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className={`${css.h1} text-base`}>Staff roster <span className="text-atext-mute text-xs font-normal">· avg {avgRating}</span></div>
        <button
          type="button"
          onClick={() => updateCareer({
            staffTasks: autoAssignStaffTasks(career),
            news: [{ week: career.week, type: 'info', text: '🧩 Staff roles auto-assigned to your best-rated people.' }, ...(career.news || [])].slice(0, 15),
          })}
          className="text-[11px] px-3 py-1.5 rounded-lg border border-aline hover:border-[var(--A-accent)] hover:text-aaccent transition whitespace-nowrap"
        >
          Auto-assign roles
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:"1px solid var(--A-line)", background:"var(--A-panel)"}}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{borderColor:"var(--A-line)",background:"var(--A-panel-2)"}}>
          <div className="col-span-4">Name</div>
          <div className="col-span-3">Rating</div>
          <div className="col-span-2 text-center">Yrs</div>
          <div className="col-span-3 text-right">Wage</div>
        </div>
        {career.staff.map((s, idx) => (
          <div key={`${s.id}-${idx}`} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid var(--A-line)"}} onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb, var(--A-accent) 5%, transparent)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div className="col-span-4 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm truncate">{s.name}</span>
                {(s.loyalty ?? 0) >= 1 && (() => {
                  const ly = s.loyalty ?? 0;
                  const filled = Math.min(3, ly);
                  const full = ly >= 3;
                  return (
                    <span className="flex items-center gap-1 flex-shrink-0" title={`${ly} season${ly === 1 ? '' : 's'} of service${full ? ' · loyal' : ''}`}>
                      <span className="flex items-center gap-[2px]">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="w-[5px] h-[5px] rounded-full" style={{ background: i < filled ? "#4AE89A" : "var(--A-line-2)" }} />
                        ))}
                      </span>
                      {full && <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded font-bold" style={{ background: "rgba(74,232,154,0.16)", color: "#4AE89A" }}>Loyal</span>}
                    </span>
                  );
                })()}
              </div>
              <div className="text-[11px] text-atext-dim truncate">{s.role}</div>
            </div>
            <div className="col-span-3 flex items-center gap-2 min-w-0">
              <RatingDot value={s.rating} />
              <Bar value={s.rating} small />
            </div>
            <div className="col-span-2 text-center text-sm">{s.contract}y</div>
            <div className="col-span-3 flex flex-col items-end gap-1.5 min-w-0">
              <span className="text-xs font-mono whitespace-nowrap text-atext-dim">{s.volunteer ? <span className="text-apos">Volunteer</span> : `$${(s.wage/1000).toFixed(0)}k`}</span>
              <button onClick={()=>replaceStaff(idx)} className="text-[11px] px-2.5 py-1 rounded-lg border border-aline hover:border-[var(--A-accent)] hover:text-aaccent transition whitespace-nowrap">Replace</button>
            </div>
          </div>
        ))}
      </div>

      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Replace rerolls the same seat. Recruitment adds new rows (cap {MAX_STAFF_ROWS}). Volunteers never draw a wage; contract hires include a one-off cash fee.
      </div>
    </div>
  );
}

