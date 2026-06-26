import React, { useState, useMemo, useEffect } from "react";
import {
  Repeat, Target, ArrowRight,
  Sprout, Newspaper, GraduationCap,
  Map, Plane, Award, FileText, UserPlus, Send,
  Bookmark, Clock, Eye, X, Star,
} from "lucide-react";
import { seedRng, rand, rng } from '../../lib/rng.js';
import { STATES, PYRAMID, LEAGUES_BY_STATE, findClub, findLeagueOf } from '../../data/pyramid.js';
import { POSITIONS, generatePlayer, playerHasPosition, formatPositionSlash } from '../../lib/playerGen.js';
import { getCompetitionClubs } from '../../lib/leagueEngine.js';
import { fmtK } from '../../lib/format.js';
import { formatDate } from '../../lib/calendar.js';
import {
  playerBlockedFromTrade,
  playerFromTradeSnapshot,
  TRADE_PERIOD_DAYS,
} from '../../lib/tradePeriod.js';
import DeadlineDayBanner from '../../components/DeadlineDayBanner.jsx';
import RecruitPlayerProfile from '../../components/RecruitPlayerProfile.jsx';
import { css, Bar, RatingDot, Pill, Stat } from '../../components/primitives.jsx';
import TabNav from '../../components/TabNav.jsx';
import { ClubBadge } from '../../components/ClubBadge.jsx';
// --- Finance system rebuild ---
import {
  effectiveWageCap,
  currentPlayerWageBill,
  canAffordSigning, scoutedOverall,
  leagueTierOf,
  rookieDraftWage,
} from '../../lib/finance/engine.js';
import {
  tradeCapCheckListedWage,
  tradeCapCheckMaxDemandWage,
  negotiationDemandWage,
  recruitFocusIncrementalBonus,
  interstateScoutFee,
  ensureStaffTasks,
} from '../../lib/staffTasks.js';
import {
  COMBINE_SCOUT_COST,
  displayDraftOverall,
  displayDraftPotential,
  displayDraftWageEstimate,
  applyCombineScoutingRound,
  scoutRevealTier,
  regionalScoutQuality,
} from '../../lib/draftScouting.js';
import { findClubByShort } from '../../data/pyramid.js';
import {
  ensureDraftSeeded,
  needsDraftSeed,
  isPlayerDraftTurn,
  isDraftLive,
  isDraftScoutingPhase,
  nationalDraftDayDate,
  draftProspectOnClock,
  getPlayerNextPick,
  startDraftSessionPatch,
} from '../../lib/draftEngine.js';
import { useCareer, useUpdateCareer } from '../../lib/careerStore.js';
import {
  getRelationshipScore, getRelationshipTier, localLoyaltyModifier,
  bumpRelationship, createDeployment, generateWatchlistEntries,
  DEPLOYMENT_DURATION_WEEKS, tickWatchlistStaleness,
} from '../../lib/scoutingSystem.js';
import { resolveScoutLeadMember } from '../../lib/staffTasks.js';
import { gameToast } from '../../lib/toast.js';

// ── Position badge style helper ─────────────────────────────────────────────
function posBadgeStyle(pos) {
  if (pos === 'KF' || pos === 'HF') return {background:'color-mix(in srgb,#E84A6F 14%,transparent)',color:'#E84A6F',border:'1px solid color-mix(in srgb,#E84A6F 30%,transparent)'};
  if (pos === 'HB' || pos === 'KB') return {background:'color-mix(in srgb,#60A5FA 14%,transparent)',color:'#60A5FA',border:'1px solid color-mix(in srgb,#60A5FA 30%,transparent)'};
  if (pos === 'RU') return {background:'color-mix(in srgb,#A78BFA 14%,transparent)',color:'#A78BFA',border:'1px solid color-mix(in srgb,#A78BFA 30%,transparent)'};
  if (pos === 'C' || pos === 'R' || pos === 'WG') return {background:'color-mix(in srgb,var(--A-accent) 14%,transparent)',color:'var(--A-accent)',border:'1px solid color-mix(in srgb,var(--A-accent) 30%,transparent)'};
  return {background:'color-mix(in srgb,#9CA3AF 14%,transparent)',color:'#9CA3AF',border:'1px solid color-mix(in srgb,#9CA3AF 30%,transparent)'};
}

// ============================================================================
// RECRUIT SCREEN — Trade / Draft / Youth / Local
// ============================================================================
function RecruitOffSeasonStrip() {
  const career = useCareer();
  const tradeLive = career.postSeasonPhase === 'trade_period' && career.inTradePeriod;
  const draftPoolReady = isDraftScoutingPhase(career) || isDraftLive(career);
  if (!tradeLive && !draftPoolReady) return null;
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
        {draftPoolReady && (
          <div className="flex-1 min-w-[200px] rounded-xl border border-aline bg-apanel p-3 flex gap-3 items-center">
            <div className="text-2xl" aria-hidden>🎯</div>
            <div>
              <div className="font-display text-sm text-aaccent uppercase tracking-wide">
                {isDraftScoutingPhase(career) ? 'Draft scouting' : 'National draft live'}
              </div>
              <div className="text-xs text-atext-dim mt-0.5">
                {isDraftScoutingPhase(career) ? 'Scout the list before draft night.' : 'Resolve picks one at a time in the draft room.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecruitScreen({ club, tab, setTab, league, onOpenDraftRoom }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const offerCount = (career.pendingTradeOffers || []).filter(o => o.status === 'pending').length;
  const watchlistCount = (career.scoutWatchlist || []).filter(w => !w.isStale).length;
  const inTradePeriod = career.postSeasonPhase === 'trade_period' && career.inTradePeriod;
  const hasFaPool = career.postSeasonPhase === 'draft_waiting' && (career.freeAgentPool || []).length > 0;
  // National draft + youth academy are AFL (tier 1) institutions; local football scouting is for everyone.
  const isTopTier = (league?.tier ?? 1) === 1;
  const showPicks = isTopTier && !!career.draftPickBank;
  const t = tab || (offerCount > 0 ? "offers" : "trade");

  useEffect(() => {
    if (t !== "trade" && t !== "draft" && t !== "offers") return;
    const patch = {};
    if (t === "trade" || t === "offers") {
      if (!career.tradePeriodBriefingAck && inTradePeriod) patch.tradePeriodBriefingAck = true;
      if (!career.tradeWindowBriefingAck && career.tradeWindowBriefingPending) {
        patch.tradeWindowBriefingAck = true;
        patch.tradeWindowBriefingPending = false;
      }
    }
    if (t === "draft" && isDraftScoutingPhase(career) && !career.draftBriefingAck) {
      patch.draftBriefingAck = true;
    }
    if (Object.keys(patch).length > 0) updateCareer(patch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, career.tradePeriodBriefingAck, career.tradeWindowBriefingAck, career.tradeWindowBriefingPending, career.draftBriefingAck, inTradePeriod, updateCareer]);
  const tabs = [
    { key: "offers", label: `Offers${offerCount ? ` (${offerCount})` : ''}`, icon: Newspaper },
    ...(inTradePeriod ? [{ key: "freeagents", label: career.freeAgencyOpen ? "Free agents" : "Free agents (closed)", icon: UserPlus }] : []),
    ...(hasFaPool ? [{ key: "famarket", label: `FA Market (${(career.freeAgentPool || []).length})`, icon: UserPlus }] : []),
    ...(showPicks ? [{ key: "picks", label: "Draft picks", icon: FileText }] : []),
    { key: "trade", label: inTradePeriod ? "Player market" : "Trades", icon: Repeat },
    ...(isTopTier ? [{ key: "draft", label: "Draft", icon: Award }] : []),
    ...(isTopTier ? [{ key: "youth", label: "Youth Academy", icon: GraduationCap }] : []),
    { key: "local", label: "Local Football", icon: Map },
    { key: "watchlist", label: `Watchlist${watchlistCount ? ` (${watchlistCount})` : ''}`, icon: Bookmark },
  ];
  return (
    <div className="anim-in touch-manipulation">
      <RecruitOffSeasonStrip />
      <TabNav tabs={tabs} active={t} onChange={setTab} />
      {t === "offers" && <OffersTab />}
      {t === "freeagents" && (inTradePeriod ? <FreeAgentsTab /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>Free agency runs during the post-season Trade Period (after the grand final).</div>
      ))}
      {t === "famarket" && <FaMarketTab league={league} />}
      {t === "picks" && (showPicks ? <DraftPickBankTab /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>Draft capital is prepared when the Trade Period opens.</div>
      ))}
      {t === "trade" && <TradeTab />}
      {t === "draft" && (isTopTier ? <DraftTab club={club} league={league} onOpenDraftRoom={onOpenDraftRoom} /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>The National Draft is for AFL clubs only. Recruit through Local Football and trades at this level.</div>
      ))}
      {t === "youth" && (isTopTier ? <YouthTab club={club} /> : (
        <div className={`${css.panel} p-8 text-sm text-atext-dim`}>Youth academies are run by AFL clubs. Develop talent through Local Football scouting at this level.</div>
      ))}
      {t === "local" && <LocalTab club={club} />}
      {t === "watchlist" && <WatchlistTab club={club} />}
    </div>
  );
}

function DraftPickBankTab() {
  const career = useCareer();
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

function FreeAgentsTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ Cap won't fit ${fa.firstName} ${fa.lastName} at ${fmtK(fa.wageAsk)}/yr.` }, ...(career.news || [])].slice(0, 15) });
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
    gameToast.signing(`Signed ${fa.firstName} ${fa.lastName} to ${findClub(career.clubId)?.name || 'your club'}`);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{background:'var(--A-accent)'}} />
            <div className={`${css.h1} text-3xl`}>FREE AGENTS</div>
          </div>
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
              <div className="col-span-2"><span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap" style={posBadgeStyle(fa.position)}>{fa.position}</span></div>
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

function ProposeTradePanel() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [targetClubId, setTargetClubId] = useState('');
  const [theirPlayerId, setTheirPlayerId] = useState('');
  const [ourPlayerId, setOurPlayerId] = useState('');
  const [cashOffer, setCashOffer] = useState(0);
  const [offeredPicks, setOfferedPicks] = useState([]);
  const [result, setResult] = useState(null);

  // Reset result when selections change
  useEffect(() => { setResult(null); }, [targetClubId, theirPlayerId, ourPlayerId]);

  const clubs = Object.keys(career.aiSquads || {})
    .filter(id => (career.aiSquads[id]?.length ?? 0) > 0)
    .map(id => ({ id, club: findClub(id), squad: career.aiSquads[id] }))
    .sort((a, b) => (a.club?.short ?? a.id).localeCompare(b.club?.short ?? b.id));

  const theirSquad = [...(career.aiSquads?.[targetClubId] || [])].sort((a, b) => b.overall - a.overall);
  const ourSquad = [...career.squad.filter(p => p.contract > 0)].sort((a, b) => b.overall - a.overall);
  const theirPlayer = theirSquad.find(p => p.id === theirPlayerId);
  const ourPlayer = ourSquad.find(p => p.id === ourPlayerId);

  const sendProposal = () => {
    if (!theirPlayer || !ourPlayer) {
      setResult('Select a player from each side');
      return;
    }
    if ((career.finance?.cash ?? 0) < cashOffer) {
      setResult('Not enough cash for the cash component');
      return;
    }
    const picksToOffer = offeredPicks.map(i => (career.draftPickBank || [])[i]).filter(Boolean);
    // Estimate pick value: R1 ~ 120000, R2 ~ 60000, R3+ ~ 30000
    const pickValue = picksToOffer.reduce((sum, pk) => sum + (pk.round === 1 ? 120000 : pk.round === 2 ? 60000 : 30000), 0);
    const theirValue = theirPlayer.value ?? Math.round(theirPlayer.overall * 1500);
    const offerValue = (ourPlayer.value ?? Math.round(ourPlayer.overall * 1500)) + cashOffer + pickValue;
    const ratio = offerValue / theirValue;
    // Deadline day desperation: AI accepts offers worth 10% less (threshold drops 0.10)
    const desperationDiscount = career.deadlineDayActive ? 0.10 : 0;
    let acceptChance = 0;
    if (ratio >= 0.88 - desperationDiscount) acceptChance = 0.90;
    else if (ratio >= 0.72 - desperationDiscount) acceptChance = 0.55;
    else if (ratio >= 0.55 - desperationDiscount) acceptChance = 0.20;
    const accepted = rng() < acceptChance;
    const targetClubShort = findClub(targetClubId)?.short ?? targetClubId;
    if (accepted) {
      const wageDelta = (theirPlayer.wage ?? 0) - (ourPlayer.wage ?? 0);
      if (!canAffordSigning(career, wageDelta)) {
        setResult("Cap check failed — their player's wage would breach your salary cap.");
        return;
      }
      const newPlayer = {
        ...theirPlayer,
        id: 'trade_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
        receivedInTrade: career.season,
        seasonsAtClub: 0,
      };
      const picksSuffix = picksToOffer.length > 0
        ? ' + ' + picksToOffer.map(pk => `${pk.season} R${pk.round}`).join(', ')
        : '';
      const newsText = `🤝 Trade proposal accepted: ${ourPlayer.firstName} ${ourPlayer.lastName} → ${targetClubShort} for ${theirPlayer.firstName} ${theirPlayer.lastName}${cashOffer > 0 ? ' + ' + fmtK(cashOffer) + ' cash' : ''}${picksSuffix}`;
      // Remove traded picks from draftPickBank (array form)
      const remainingBank = (career.draftPickBank || []).filter((_, i) => !offeredPicks.includes(i));
      updateCareer({
        squad: [...career.squad.filter(p => p.id !== ourPlayerId), newPlayer],
        aiSquads: {
          ...career.aiSquads,
          [targetClubId]: [...career.aiSquads[targetClubId].filter(p => p.id !== theirPlayerId), ourPlayer],
        },
        lineup: (career.lineup || []).filter(id => id !== ourPlayerId),
        finance: {
          ...career.finance,
          cash: career.finance.cash - cashOffer,
        },
        draftPickBank: remainingBank,
        news: [{ week: career.week, type: 'win', text: newsText }, ...(career.news || [])].slice(0, 20),
        pendingTradeOffers: (career.pendingTradeOffers || []).map(o =>
          o.fromClubId === targetClubId && o.targetPlayerId === ourPlayerId && o.status === 'pending'
            ? { ...o, status: 'expired' }
            : o
        ),
      });
      setOfferedPicks([]);
      setResult('accepted');
      gameToast.trade(`Trade done: ${theirPlayer.firstName} ${theirPlayer.lastName} joins from ${targetClubShort}`);
    } else {
      const flavors = [
        `${targetClubShort} reviewed the offer but want more value — their recruiting panel passed.`,
        `${targetClubShort} declined. Their list managers don't see a fit at this time.`,
        `${targetClubShort} held firm — they aren't moving ${theirPlayer.firstName} ${theirPlayer.lastName} for this package.`,
      ];
      const flavor = flavors[Math.floor(rng() * flavors.length)];
      updateCareer({
        news: [{ week: career.week, type: 'info', text: `📵 Trade proposal rejected: ${flavor}` }, ...(career.news || [])].slice(0, 20),
      });
      setResult('rejected:' + flavor);
    }
  };

  return (
    <div className={`${css.panel} p-5 mt-6`}>
      <div className="flex items-center gap-2 mb-1">
        <Send className="w-4 h-4" style={{ color: 'var(--A-accent)' }} />
        <div className={`${css.h1} text-xl`}>INITIATE A TRADE</div>
      </div>
      <div className="text-xs mb-4" style={{ color: 'var(--A-text-dim)' }}>Make the first move — propose a swap to a rival club.</div>

      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className={`${css.label} text-[11px]`}>Target Club</label>
          <select
            value={targetClubId}
            onChange={e => { setTargetClubId(e.target.value); setTheirPlayerId(''); }}
            className="bg-apanel-2 border border-aline rounded-xl px-3 py-2 text-xs text-atext"
          >
            <option value="">Pick a club</option>
            {clubs.map(({ id, club }) => (
              <option key={id} value={id}>{club?.short ?? id}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className={`${css.label} text-[11px]`}>Their Player</label>
          <select
            value={theirPlayerId}
            onChange={e => setTheirPlayerId(e.target.value)}
            disabled={!targetClubId}
            className="bg-apanel-2 border border-aline rounded-xl px-3 py-2 text-xs text-atext disabled:opacity-50"
          >
            <option value="">Pick their player</option>
            {theirSquad.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.overall} {p.position} {p.age}A)</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className={`${css.label} text-[11px]`}>Your Player</label>
          <select
            value={ourPlayerId}
            onChange={e => setOurPlayerId(e.target.value)}
            className="bg-apanel-2 border border-aline rounded-xl px-3 py-2 text-xs text-atext"
          >
            <option value="">Pick your player</option>
            {ourSquad.map(p => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.overall} {p.position} {p.age}A)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className={`${css.label} text-[11px]`}>Add cash (optional)</label>
          <input
            type="number"
            min={0}
            step={10000}
            value={cashOffer}
            placeholder="$0"
            onChange={e => setCashOffer(Math.max(0, Number(e.target.value)))}
            className="bg-apanel-2 border border-aline rounded-xl px-3 py-2 text-xs text-atext w-36"
          />
        </div>
        <div className="text-xs self-end pb-2" style={{ color: 'var(--A-text-dim)' }}>
          Available: {fmtK(career.finance?.cash ?? 0)}
        </div>
      </div>

      {/* Draft picks */}
      <div className="mt-2 mb-4">
        <div className="text-[11px] font-mono uppercase text-atext-mute mb-2">Include draft picks</div>
        {(career.draftPickBank || []).length === 0 && (
          <div className="text-[11px] text-atext-dim">No picks in bank</div>
        )}
        {(career.draftPickBank || []).map((pick, idx) => {
          const key = `${pick.season}-R${pick.round}`;
          const selected = offeredPicks.includes(idx);
          return (
            <button
              key={key + idx}
              type="button"
              onClick={() => setOfferedPicks(prev => selected ? prev.filter(i => i !== idx) : [...prev, idx])}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded mr-1 mb-1 transition"
              style={{
                background: selected ? 'var(--A-accent)' : 'var(--A-panel-2)',
                color: selected ? '#000' : 'var(--A-text-mute)',
                border: '1px solid var(--A-line)',
              }}
            >
              {pick.season} R{pick.round}{pick.note ? ` (${pick.note})` : ''}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={sendProposal}
        disabled={!theirPlayerId || !ourPlayerId || result === 'accepted'}
        className={`${css.btnPrimary} text-sm px-5 py-2.5 min-h-[44px] disabled:opacity-40`}
      >
        Make Offer
      </button>

      {result && (
        <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{
          background: result === 'accepted'
            ? 'color-mix(in srgb, var(--A-pos) 12%, transparent)'
            : result.startsWith('rejected:')
              ? 'color-mix(in srgb, var(--A-neg) 10%, transparent)'
              : 'color-mix(in srgb, var(--A-accent) 8%, transparent)',
          border: `1px solid ${result === 'accepted' ? 'color-mix(in srgb, var(--A-pos) 30%, transparent)' : result.startsWith('rejected:') ? 'color-mix(in srgb, var(--A-neg) 25%, transparent)' : 'color-mix(in srgb, var(--A-accent) 25%, transparent)'}`,
          color: result === 'accepted' ? 'var(--A-pos)' : result.startsWith('rejected:') ? 'var(--A-neg)' : 'var(--A-accent)',
        }}>
          {result === 'accepted'
            ? 'Deal done! Check your squad.'
            : result.startsWith('rejected:')
              ? result.slice('rejected:'.length)
              : result}
        </div>
      )}
    </div>
  );
}

function OffersTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const offers = (career.pendingTradeOffers || []).filter(o => o.status === 'pending');
  const finance = career.finance;
  const [inspectOffer, setInspectOffer] = useState(null);

  const resolveIncomingPlayer = (offer) => {
    const aiSq = career.aiSquads?.[offer.fromClubId] || [];
    const live = offer.offerPlayerId
      ? aiSq.find((p) => p.id === offer.offerPlayerId)
      : null;
    if (live) {
      return {
        ...live,
        id: `incoming_${Date.now()}_${rand(1, 1e6)}`,
        receivedInTrade: career.season,
        seasonsAtClub: 0,
      };
    }
    return playerFromTradeSnapshot(offer.offerPlayerSnapshot, {
      id: `incoming_${Date.now()}_${rand(1, 1e6)}`,
      receivedInTrade: career.season,
      seasonsAtClub: 0,
    });
  };

  // Mark an offer no longer doable and drop it from the pending list, always
  // with a visible reason so an accept never just silently does nothing.
  const expireOffer = (offer, text) => {
    updateCareer({
      pendingTradeOffers: (career.pendingTradeOffers || []).map(o => o.id === offer.id ? { ...o, status: 'expired' } : o),
      news: [{ week: career.week, type: 'loss', text }, ...(career.news || [])].slice(0, 20),
    });
    setInspectOffer(null);
  };

  const acceptOffer = (offer) => {
    const targetPlayer = career.squad.find(p => p.id === offer.targetPlayerId);
    if (!targetPlayer) {
      expireOffer(offer, `⌛ That trade lapsed — the player involved is no longer on your list.`);
      return;
    }
    if (playerBlockedFromTrade(targetPlayer, career.season)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ ${targetPlayer.firstName} ${targetPlayer.lastName} can't be traded until next season (recently arrived).` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    const swapPromised = !!(offer.offerPlayerId || offer.offerPlayerSnapshot);
    const incomingPlayer = swapPromised ? resolveIncomingPlayer(offer) : null;
    // A swap was promised but the player they offered has since moved on — don't
    // silently complete this as a cash-only deal (which would rob the user).
    if (swapPromised && !incomingPlayer) {
      expireOffer(offer, `⌛ ${offer.fromClubName} pulled the player from the deal — offer withdrawn.`);
      return;
    }
    // Cap check: if a swap player is incoming, ensure their wage fits after target leaves
    if (incomingPlayer) {
      const wageDelta = Number(incomingPlayer.wage ?? 0) - Number(targetPlayer.wage ?? 0);
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
    const acceptNews = [{
      week: career.week,
      type: 'info',
      text: `🤝 Trade complete: ${targetPlayer.firstName} ${targetPlayer.lastName} → ${offer.fromClubName} for ${fmtK(offer.offerCash)}${incomingPlayer ? ` + ${incomingPlayer.firstName} ${incomingPlayer.lastName}` : ''}`,
    }];
    if (offer.rivalClubId) {
      acceptNews.push({
        week: career.week,
        type: 'info',
        text: `👀 ${offer.rivalClubName} was also chasing ${targetPlayer.firstName} ${targetPlayer.lastName} — you got in first.`,
      });
    }
    updateCareer({
      squad: newSquad,
      lineup: career.lineup.filter(id => id !== offer.targetPlayerId),
      aiSquads: newAiSquads,
      finance: { ...finance, cash: finance.cash + offer.offerCash, transferBudget: finance.transferBudget + Math.round(offer.offerCash * 0.4) },
      pendingTradeOffers: (career.pendingTradeOffers || []).map(o => o.id === offer.id ? { ...o, status: 'accepted' } : o),
      news: [...acceptNews, ...(career.news || [])].slice(0, 20),
    });
    setInspectOffer(null);
    gameToast.trade(
      incomingPlayer
        ? `Trade complete: ${incomingPlayer.firstName} ${incomingPlayer.lastName} in from ${offer.fromClubName}`
        : `Trade complete: ${targetPlayer.firstName} ${targetPlayer.lastName} → ${offer.fromClubName} for ${fmtK(offer.offerCash)}`
    );
  };

  const rejectOffer = (offer) => {
    const lines = [
      `${offer.fromClubName} notes your stance — they may circle back with a different angle.`,
      `${offer.fromClubName} respects the call for now and shifts focus to another club.`,
      `List managers at ${offer.fromClubName} wanted more movement — you held firm.`,
    ];
    const text = lines[Math.floor(rng() * lines.length)];
    const updatedOffers = (career.pendingTradeOffers || []).map(o => o.id === offer.id ? { ...o, status: 'rejected' } : o);
    const newsItems = [{ week: career.week, type: 'info', text: `📵 Trade declined: ${text}` }];

    // Bidding war escalation: if a rival club was circling and this is bid round 1,
    // the rival immediately submits a slightly sweeter counter-offer.
    if (offer.rivalClubId && offer.bidRound === 1) {
      const escalatedCash = Math.round((offer.offerCash || 0) * (1.12 + rng() * 0.18));
      const counterId = `tp_counter_${Date.now()}`;
      updatedOffers.push({
        ...offer,
        id: counterId,
        fromClubId: offer.rivalClubId,
        fromClubName: offer.rivalClubName,
        offerCash: escalatedCash,
        // No swap player — bidding war is cash-only escalation
        offerPlayerId: null,
        offerPlayerSnapshot: null,
        status: 'pending',
        createdAt: `postseason-${career.tradePeriodDay ?? 1}`,
        tradePeriod: true,
        rivalClubId: null,
        rivalClubName: null,
        bidRound: 2,
        isCounter: true,
      });
      newsItems.push({
        week: career.week,
        type: 'info',
        text: `⚡ ${offer.rivalClubName} pounced — they've tabled a counter-bid of ${fmtK(escalatedCash)} for the same player.`,
      });
    }

    updateCareer({
      pendingTradeOffers: updatedOffers,
      news: [...newsItems, ...(career.news || [])].slice(0, 20),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{background:'var(--A-accent)'}} />
            <div className={`${css.h1} text-3xl`}>TRADE OFFERS</div>
          </div>
          <div className="text-xs text-atext-dim">Rival clubs are circling. Accept, reject — or let the window close.</div>
        </div>
        <Stat label="Pending" value={offers.length} accent="var(--A-accent-2)" />
      </div>

      {offers.length === 0 ? (
        <div className={`${css.panel} p-12 text-center text-sm text-atext-dim`}>
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          {(PYRAMID[career.leagueKey]?.tier ?? 1) === 3
            ? "Local footy has no trade market. Players come and go by word of mouth — recruit through the notifications bell (recommendations & walk-ups) and by developing your own in Training."
            : "No active offers right now. Wait for the trade window or check back after key events."}
        </div>
      ) : (
        <div className="grid xl:grid-cols-[1fr_minmax(280px,360px)] gap-4 items-start">
          <div className="space-y-3">
          {offers.map(offer => {
            const player = career.squad.find(p => p.id === offer.targetPlayerId);
            if (!player) return null;
            const incomingPreview = offer.offerPlayerSnapshot;
            return (
              <div key={offer.id} className={`${css.panel} p-5 cursor-pointer transition-colors ${inspectOffer?.id === offer.id ? 'ring-2 ring-aaccent' : ''}`}
                onClick={() => setInspectOffer(inspectOffer?.id === offer.id ? null : offer)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setInspectOffer(inspectOffer?.id === offer.id ? null : offer); }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-aaccent">{offer.fromClubName} offers</div>
                      {offer.rivalClubName && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(251,191,36,0.2)', color: '#FBBF24' }}>
                          ⚡ {offer.rivalClubName} also interested
                        </span>
                      )}
                      {offer.isCounter && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#EF4444' }}>
                          🔥 Counter-bid
                        </span>
                      )}
                    </div>
                    <div className="font-display text-2xl text-atext mt-1">{fmtK(offer.offerCash)}{incomingPreview ? ` + ${incomingPreview.firstName} ${incomingPreview.lastName}` : ''}</div>
                    {incomingPreview && (
                      <div className="text-xs text-atext-dim mt-1">{incomingPreview.position} · {incomingPreview.overall} OVR · age {incomingPreview.age} · {incomingPreview.gamesPlayed ?? 0} gp</div>
                    )}
                    {offer.offeredPick && (
                      <div className="text-[11px] text-aaccent mt-1">+ {offer.offeredPick.season} Round {offer.offeredPick.round} pick</div>
                    )}
                  </div>
                  <ArrowRight className="w-6 h-6 text-aaccent" />
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-atext-dim">For</div>
                    <div className="font-display text-2xl text-atext mt-1">{player.firstName} {player.lastName}</div>
                    <div className="text-xs text-atext-dim mt-1">{player.position} · {player.overall} OVR · age {player.age} · {fmtK(player.wage)}/yr · {player.gamesPlayed ?? 0} gp</div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => rejectOffer(offer)} className="px-4 py-2 rounded-lg text-xs font-bold bg-apanel-2 text-atext-dim hover:bg-aline">Reject</button>
                  <button onClick={() => acceptOffer(offer)} className={`${css.btnPrimary} text-xs px-4 py-2`}>Accept Trade</button>
                </div>
              </div>
            );
          })}
          </div>
          {inspectOffer && (
            <div className="space-y-3 xl:sticky xl:top-20">
              {inspectOffer.offerPlayerSnapshot && (
                <RecruitPlayerProfile
                  player={inspectOffer.offerPlayerSnapshot}
                  onClose={() => setInspectOffer(null)}
                  subtitle={`Incoming from ${inspectOffer.fromClubName}`}
                />
              )}
              {(() => {
                const out = career.squad.find(p => p.id === inspectOffer.targetPlayerId);
                return out ? (
                  <RecruitPlayerProfile
                    player={out}
                    subtitle={`Your player — offered to ${inspectOffer.fromClubName}`}
                  />
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}
      {career.inTradePeriod && <ProposeTradePanel />}
    </div>
  );
}

function TradeTab() {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [filter, setFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("overall");
  /** off | listed | maxDemand — maxDemand uses upper-bound opening ask vs cap */
  const [capFilter, setCapFilter] = useState("off");
  const [negotiating, setNegotiating] = useState(null); // { playerId, wage, years, counterUsed }
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const pool = career.tradePool || [];
  const wageCap = effectiveWageCap(career);
  const currentWages = currentPlayerWageBill(career);
  const headroom = Math.max(0, wageCap - currentWages);
  const staffTasksForTrade = ensureStaffTasks(career);

  const capCheckAmount = (p) => {
    const listed = tradeCapCheckListedWage(p);
    if (capFilter === 'listed') return listed;
    if (capFilter === 'maxDemand') return tradeCapCheckMaxDemandWage(p, career.staff, staffTasksForTrade);
    return 0;
  };

  const filtered = pool.filter(p => {
    if (filter !== "ALL" && !playerHasPosition(p, filter)) return false;
    if (capFilter !== 'off' && wageCap > 0 && !canAffordSigning(career, capCheckAmount(p))) return false;
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
    const demandedWage = negotiationDemandWage(p.wage, career.staff, staffTasksForTrade);
    const demandedYears = rand(1, 3);
    setNegotiating({ playerId: p.id, wage: demandedWage, years: demandedYears, counterUsed: false });
  };

  const acceptDeal = (p) => {
    // Signing fee = 30% of market value (agent fee + player incentive), not full transfer fee.
    const signingFee = Math.round(p.value * 0.30);
    if ((career.finance.transferBudget ?? 0) < signingFee) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⛔ Transfer budget too low to sign ${p.firstName} ${p.lastName} (need ${fmtK(signingFee)}).` }, ...(career.news || [])].slice(0, 15),
      });
      return;
    }
    if (career.squad.length >= 40) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⛔ List full — cannot sign ${p.firstName} ${p.lastName} (40 player limit).` }, ...(career.news || [])].slice(0, 15),
      });
      return;
    }
    if (!canAffordSigning(career, negotiating.wage)) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⛔ Player list cap won't fit ${p.firstName} ${p.lastName} at ${fmtK(negotiating.wage)}/yr.` }, ...(career.news || [])].slice(0, 15),
      });
      return;
    }
    if ((career.finance.cash ?? 0) < signingFee) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⛔ Cash too low for signing fee (${fmtK(signingFee)}) on ${p.firstName} ${p.lastName}.` }, ...(career.news || [])].slice(0, 15),
      });
      return;
    }
    const signedPlayer = { ...p, id: `trade_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage: negotiating.wage, contract: negotiating.years, receivedInTrade: null, seasonsAtClub: 0 };
    updateCareer({
      squad: [...career.squad, signedPlayer],
      tradePool: pool.filter(x => x.id !== p.id),
      finance: { ...career.finance, transferBudget: career.finance.transferBudget - signingFee, cash: career.finance.cash - signingFee },
      news: [{ week: career.week, type: "win", text: `🤝 Signed ${p.firstName} ${p.lastName} (${p.overall} OVR) — ${negotiating.years}yr @ ${fmtK(negotiating.wage)}/yr` }, ...career.news].slice(0,15),
    });
    setNegotiating(null);
    gameToast.signing(`Signed ${p.firstName} ${p.lastName} (${p.overall} OVR) — ${negotiating.years}yr @ ${fmtK(negotiating.wage)}/yr`);
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
      <DeadlineDayBanner tradePeriodDay={career.tradePeriodDay} totalDays={TRADE_PERIOD_DAYS} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{background:'var(--A-accent)'}} />
            <div className={`${css.h1} text-3xl`}>TRADE MARKET</div>
          </div>
          <div className="text-xs text-atext-dim">Players currently available across the league pyramid.</div>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          <Stat label="Transfer Budget" value={fmtK(career.finance.transferBudget)} accent="var(--A-accent)" />
          <Stat label="Cap headroom" value={fmtK(headroom)} accent={headroom > 0 ? "var(--A-pos)" : "var(--A-neg)"} />
          <Stat label="Squad Size" value={`${career.squad.length}/40`} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-atext-dim uppercase tracking-wider">Position:</span>
        {["ALL", ...POSITIONS].map(pos => (
          <button key={pos} type="button" onClick={()=>setFilter(pos)} className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold touch-manipulation ${filter===pos ? "bg-aaccent text-[var(--fd-on-accent,#0A0D0C)]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{pos}</button>
        ))}
        <label className="flex items-center gap-2 text-[11px] text-atext-dim ml-2">
          <span className="uppercase tracking-wider shrink-0">Cap:</span>
          <select
            value={capFilter}
            onChange={(e) => setCapFilter(e.target.value)}
            className="bg-apanel-2 border border-aline rounded-lg px-2 py-1.5 text-xs text-atext max-w-[220px]"
          >
            <option value="off">Show all</option>
            <option value="listed">Fits listed wage</option>
            <option value="maxDemand">Fits worst-case opening ask</option>
          </select>
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

      <div className="grid xl:grid-cols-[1fr_minmax(280px,360px)] gap-4 items-start">
      <div className="space-y-4 min-w-0">

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
            const lw = tradeCapCheckListedWage(p);
            const maxAsk = tradeCapCheckMaxDemandWage(p, career.staff, staffTasksForTrade);
            const okListed = wageCap <= 0 || canAffordSigning(career, lw);
            const okMax = wageCap <= 0 || canAffordSigning(career, maxAsk);
            let capPill;
            if (wageCap <= 0) capPill = <Pill color="#64748B">—</Pill>;
            else if (okMax) capPill = <Pill color="var(--A-pos)">OK</Pill>;
            else if (okListed) capPill = <Pill color="#FFB347" title={`Worst-case opening ask ~${fmtK(maxAsk)}/yr — tighten recruiter staff or counter.`}>Listed</Pill>;
            else capPill = <Pill color="var(--A-neg)" title={`Listed ${fmtK(lw)} · upper ask ~${fmtK(maxAsk)}/yr`}>No</Pill>;
            return (
              <div key={p.id}>
                <div className={`gap-2 px-4 py-3 items-center transition-colors grid min-w-[720px] cursor-pointer ${selectedPlayer?.id === p.id ? 'bg-aaccent/10' : ''}`} style={{borderBottom: isNeg ? "none" : "1px solid var(--A-line)", gridTemplateColumns:"minmax(120px,1.1fr) 2.5rem 2rem 2.5rem 2.5rem minmax(56px,0.7fr) minmax(64px,0.9fr) minmax(56px,0.7fr) 4rem 3.5rem"}} onClick={() => setSelectedPlayer(p)} onMouseEnter={e=>{ if (selectedPlayer?.id !== p.id) e.currentTarget.style.background="color-mix(in srgb, var(--A-accent) 5%, transparent)"; }} onMouseLeave={e=>{ if (selectedPlayer?.id !== p.id) e.currentTarget.style.background="transparent"; }}>
                  <div>
                    <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-atext-dim">{p.gamesPlayed ?? 0} gp · Ask {fmtK(p.wage)}/yr</div>
                  </div>
                  <div><Pill color="var(--A-accent)">{formatPositionSlash(p)}</Pill></div>
                  <div className="text-sm text-center">{p.age}</div>
                  <div className="flex justify-center"><RatingDot value={p.overall} /></div>
                  <div className="text-sm text-center text-apos">{p.potential}</div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {sellerClub ? <ClubBadge club={sellerClub} size="xs" /> : null}
                    <span className="text-[10px] text-atext-dim truncate" title={p.fromClub}>{p.fromClub}</span>
                  </div>
                  <div className="text-right text-sm font-mono font-bold" style={{color: canAfford ? "var(--A-pos)" : "var(--A-neg)"}}>{fmtK(p.value)}</div>
                  <div className="text-right text-xs font-mono text-atext-dim">{fmtK(p.wage)}</div>
                  <div className="flex justify-center">
                    {capPill}
                  </div>
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    {isNeg
                      ? <button onClick={()=>setNegotiating(null)} className="text-xs text-atext-mute hover:text-atext-dim px-2 py-1">✕</button>
                      : <button onClick={()=>canAfford ? openNegotiation(p) : null} disabled={!canAfford} className={canAfford ? `${css.btnPrimary} text-xs px-3 py-1.5` : "px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute"}>{canAfford ? "Negotiate" : "Too dear"}</button>
                    }
                  </div>
                </div>
                {isNeg && (
                  <div className="mx-4 mb-3 rounded-xl p-4" style={{background:"color-mix(in srgb, var(--A-pos) 8%, transparent)", border:"1px solid color-mix(in srgb, var(--A-pos) 25%, transparent)"}}>

                    <div className="text-xs font-bold mb-2" style={{color:"var(--A-pos)"}}>📋 {p.firstName} {p.lastName}'s demands</div>
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
                        <div className={`font-display text-xl ${capBlock ? 'text-aneg' : 'text-apos'}`}>{fmtK(capRoom - negotiating.wage)}</div>
                      </div>
                    </div>
                    {capBlock && <div className="text-xs text-aneg mb-2">⚠️ Signing this player would exceed your salary cap.</div>}
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
          const lw = tradeCapCheckListedWage(p);
          const maxAsk = tradeCapCheckMaxDemandWage(p, career.staff, staffTasksForTrade);
          const okListed = wageCap <= 0 || canAffordSigning(career, lw);
          const okMax = wageCap <= 0 || canAffordSigning(career, maxAsk);
          let capMob;
          if (wageCap <= 0) capMob = <Pill color="#64748B">—</Pill>;
          else if (okMax) capMob = <Pill color="var(--A-pos)">Cap OK</Pill>;
          else if (okListed) capMob = <Pill color="#FFB347">Listed only</Pill>;
          else capMob = <Pill color="var(--A-neg)">Cap no</Pill>;
          return (
            <div key={p.id} className="rounded-2xl border border-[var(--A-line)] bg-[var(--A-panel)] p-4">
              <div className="flex gap-3">
                {sellerClub ? <ClubBadge club={sellerClub} size="md" /> : <div className="w-10 h-10 rounded-lg bg-apanel-2 flex items-center justify-center text-[10px] text-atext-mute">?</div>}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-atext">{p.firstName} {p.lastName}</div>
                  <div className="text-xs text-atext-dim mt-1">{formatPositionSlash(p)} · age {p.age} · {p.fromClub}</div>
                  <div className="flex flex-wrap gap-2 mt-3 items-center">
                    <RatingDot value={p.overall} size="sm" />
                    <span className="text-xs text-apos font-bold">Pot {p.potential}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: canAfford ? "var(--A-pos)" : "var(--A-neg)" }}>{fmtK(p.value)}</span>
                    <span className="text-xs font-mono text-atext-dim">{fmtK(p.wage)}/yr</span>
                    {capMob}
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
                <div className="mt-3 rounded-xl p-4" style={{ background: "color-mix(in srgb, var(--A-pos) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--A-pos) 25%, transparent)" }}>
                  <div className="text-xs font-bold mb-2" style={{color:"var(--A-pos)"}}>📋 {p.firstName} {p.lastName}&apos;s demands</div>
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
                      <div className={`font-display text-xl ${capBlock ? "text-aneg" : "text-apos"}`}>{fmtK(capRoom - negotiating.wage)}</div>
                    </div>
                  </div>
                  {capBlock && <div className="text-xs text-aneg mb-2">⚠️ Signing this player would exceed your salary cap.</div>}
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
      {selectedPlayer && (
        <div className="xl:sticky xl:top-20">
          <RecruitPlayerProfile
            player={selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
            listedFee={selectedPlayer.value}
            fromClub={selectedPlayer.fromClub}
            subtitle="Select Negotiate to open contract talks."
          />
        </div>
      )}
      </div>
    </div>
  );
}

function DraftTab({ club, league, onOpenDraftRoom }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [posFilter, setPosFilter] = useState("ALL");
  const [poolSort, setPoolSort] = useState("overall");
  const clubState = findClub(career.clubId)?.state ?? club?.state ?? null;
  const baseScoutRating = career.staff?.find(s => s.id === 's3')?.rating ?? 70;

  useEffect(() => {
    if (!league) return;
    if (needsDraftSeed(career)) {
      const patch = ensureDraftSeeded(career, league);
      if (patch) updateCareer(patch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const draftOrder = career.draftOrder || [];
  const scoutingPhase = isDraftScoutingPhase(career);
  const draftLive = isDraftLive(career);
  const myNextPick = getPlayerNextPick(career);
  const isMyTurn = isPlayerDraftTurn(career);
  const draftDayLabel = formatDate(nationalDraftDayDate(career));
  const dTier = leagueTierOf(career);

  const runCombineScout = () => {
    const pool = career.draftPool || [];
    if (!pool.length) return;
    if ((career.finance?.cash ?? 0) < COMBINE_SCOUT_COST) return;
    updateCareer({
      finance: { ...career.finance, cash: career.finance.cash - COMBINE_SCOUT_COST },
      draftPool: applyCombineScoutingRound(pool),
      news: [
        {
          week: career.week,
          type: "info",
          text: `🔭 Combine scouting (−${fmtK(COMBINE_SCOUT_COST)}) — sharper readings on draft-eligible prospects.`,
        },
        ...(career.news || []),
      ].slice(0, 20),
    });
  };

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

  const draftPlayer = (p) => {
    if (!draftLive || !isMyTurn) return;
    if (career.squad.length >= 40) return;
    const result = draftProspectOnClock(career, club, p);
    if (result.error === 'cap') {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot draft ${p.firstName} ${p.lastName} — over salary cap` }, ...(career.news || [])].slice(0, 20) });
      return;
    }
    if (result.error) return;
    updateCareer(result.patch);
  };

  const statusLine = needsDraftSeed(career)
    ? 'No draft loaded — open the draft room to generate the pool.'
    : scoutingPhase
      ? `Combine scouting open — draft begins ${draftDayLabel}. Your first pick: #${myNextPick?.pick ?? '—'}.`
      : draftLive
        ? (isMyTurn
          ? `On the clock: pick #${myNextPick?.pick}.`
          : myNextPick
            ? `Draft live — your next pick: #${myNextPick.pick}. Use Next pick in the draft room.`
            : 'No remaining picks for your club.')
        : career.draftPhase === 'complete'
          ? 'National draft complete for this season.'
          : 'Draft pool ready.';

  return (
    <div className="space-y-4">

      <div className={`${css.panel} p-4 flex flex-wrap items-center justify-between gap-3`} style={{ background: 'color-mix(in srgb, var(--A-accent) 6%, transparent)' }}>
        <div>
          <div className="font-display text-xl text-aaccent">Draft room</div>
          <p className="text-xs text-atext-dim mt-1">{scoutingPhase ? 'Scout the list before draft night.' : 'One pick at a time — on-the-clock banner in the draft room.'}</p>
        </div>
        <button type="button" onClick={() => { if (needsDraftSeed(career) && league) updateCareer(startDraftSessionPatch(career, league)); onOpenDraftRoom?.(); }} className={`${css.btnPrimary} text-sm px-5 py-2.5 min-h-[44px]`}>
          {scoutingPhase ? 'Open draft board' : isMyTurn ? 'Enter draft room — on the clock' : 'Enter draft room'}
        </button>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{background:'var(--A-accent)'}} />
            <div className={`${css.h1} text-3xl`}>NATIONAL DRAFT</div>
          </div>
          <div className="text-xs text-atext-dim">{statusLine}</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Pool" value={basePool.length} accent="var(--A-pos)" />
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
                    background: isMe ? 'color-mix(in srgb, var(--A-accent) 12%, transparent)' : 'var(--A-panel-2)',
                    border: `1px solid ${onClock ? 'var(--A-accent)' : 'var(--A-line)'}`,
                    minWidth: 112,
                    minHeight: 76,
                    boxShadow: onClock ? '0 0 10px color-mix(in srgb,var(--A-accent) 40%,transparent)' : undefined,
                  }}>
                  <div className="flex items-start gap-2">
                    {c ? <ClubBadge club={c} size="sm" /> : <div className="w-9 h-9 rounded-lg bg-apanel shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] text-atext-mute">#{d.pick}</div>
                      <div className={`font-display text-sm leading-tight ${isMe ? 'text-aaccent' : 'text-atext'}`}>{c?.short || d.clubId}</div>
                      {d.used && d.prospectName && <div className="text-[9px] text-atext-dim truncate mt-0.5 max-w-[7rem]">{d.prospectName} ({d.prospectOverall})</div>}
                    </div>
                  </div>
                  {onClock && !d.used && <div className="text-[8px] font-black uppercase tracking-wider mt-0.5" style={{color:'var(--A-accent)'}}>On clock</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {draftOrder.length > 0 && basePool.length > 0 && (
        <div className={`${css.panel} p-4 flex flex-wrap items-center gap-3 justify-between`}>
          <div className="text-[11px] text-atext-dim max-w-xl leading-snug">
            Each run reveals the next scouting tier on a batch of prospects (0 = hidden, 3 = fully exposed). AI clubs draft using true ratings regardless.
          </div>
          <button
            type="button"
            onClick={runCombineScout}
            disabled={(career.finance?.cash ?? 0) < COMBINE_SCOUT_COST}
            className={`${css.btnPrimary} text-xs px-4 py-2.5 min-h-[44px] touch-manipulation shrink-0 disabled:opacity-40`}
          >
            Combine scouting (−{fmtK(COMBINE_SCOUT_COST)})
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-atext-dim uppercase tracking-wider">Position:</span>
        {["ALL", ...POSITIONS].map(pos => (
          <button key={pos} type="button" onClick={() => setPosFilter(pos)} className={`px-3 py-2 min-h-[40px] rounded-lg text-xs font-bold touch-manipulation ${posFilter === pos ? "bg-aaccent text-[var(--fd-on-accent,#0A0D0C)]" : "bg-apanel-2 text-atext-dim hover:text-atext"}`}>{pos}</button>
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
          <div className="col-span-4 flex items-center gap-2">
            <span>Prospect</span>
            {clubState && <span className="text-[9px] font-normal normal-case tracking-normal text-atext-dim">🏠 Home state bonus active</span>}
          </div>
          <div className="col-span-1">Pos</div>
          <div className="col-span-1">OVR</div>
          <div className="col-span-2">Potential</div>
          <div className="col-span-2 text-right">Rookie Wage</div>
          <div className="col-span-1"></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {basePool.slice(0, 50).map((p, i) => {
            const st = scoutRevealTier(p);
            const rw = rookieDraftWage(p.overall, dTier);
            const capOk = canAffordSigning(career, rw);
            const scoutQuality = regionalScoutQuality(baseScoutRating, clubState, p.state ?? 'VIC');
            const oDisp = displayDraftOverall(p, scoutQuality);
            const potDisp = displayDraftPotential(p, scoutQuality);
            const wageDisp = displayDraftWageEstimate(rw, st);
            const wageAccurate = st >= 2;
            return (
              <div key={p.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors" style={{borderBottom:"1px solid var(--A-line)"}} onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb, var(--A-accent) 5%, transparent)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div className="col-span-1 font-bold text-aaccent">#{i+1}</div>
                <div className="col-span-4 font-semibold text-sm">{p.firstName} {p.lastName} <span className="text-[10px] text-atext-dim ml-1">(draft age ~17–19)</span></div>
                <div className="col-span-1"><Pill color="var(--A-accent)">{formatPositionSlash(p)}</Pill></div>
                <div className="col-span-1">
                  {st >= 3 ? (
                    <RatingDot value={p.overall} />
                  ) : (
                    <div className="font-display font-bold text-sm tabular-nums">{oDisp.label}</div>
                  )}
                  {oDisp.hint && <div className="text-[9px] text-atext-mute leading-tight">{oDisp.hint}</div>}
                </div>
                <div className="col-span-2 flex flex-col gap-0.5 min-h-[2rem] justify-center">
                  {st >= 3 ? (
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-apos">{p.potential}</div>
                      {p.potential > p.overall && (
                        <span className="text-[9px] font-black" style={{color:'var(--A-pos)'}}>
                          +{p.potential - p.overall}↑
                        </span>
                      )}
                      <Bar value={p.potential} color="var(--A-pos)" small />
                    </div>
                  ) : (
                    <span className="font-bold text-atext-dim">{potDisp.label}</span>
                  )}
                  {potDisp.hint && <span className="text-[9px] text-atext-mute">{potDisp.hint}</span>}
                </div>
                <div className="col-span-2 text-right text-sm font-mono">
                  <span style={{
                    color: wageAccurate ? (capOk ? 'var(--A-pos)' : 'var(--A-neg)') : 'var(--A-accent)',
                  }}>{wageDisp.label}</span>
                  <span className="text-[10px] text-atext-dim block">{wageDisp.hint || 'est. rookie'}</span>
                </div>
                <div className="col-span-1 flex justify-end">
                  {draftLive && isMyTurn && (
                    <button type="button" onClick={()=>draftPlayer(p)} className={`${css.btnPrimary} text-xs px-4 py-2.5 min-h-[44px] touch-manipulation`}>Draft</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="xl:hidden space-y-3">
        {clubState && (
          <div className="text-[10px] text-atext-dim px-1">🏠 Home state bonus active</div>
        )}
        {basePool.slice(0, 50).map((p, i) => {
          const st = scoutRevealTier(p);
          const rw = rookieDraftWage(p.overall, dTier);
          const capOk = canAffordSigning(career, rw);
          const scoutQuality = regionalScoutQuality(baseScoutRating, clubState, p.state ?? 'VIC');
          const oDisp = displayDraftOverall(p, scoutQuality);
          const potDisp = displayDraftPotential(p, scoutQuality);
          const wageDisp = displayDraftWageEstimate(rw, st);
          const wageAccurate = st >= 2;
          return (
            <div key={p.id} className="rounded-2xl border border-[var(--A-line)] bg-[var(--A-panel)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-aaccent text-sm">Pool #{i + 1}</div>
                  <div className="font-semibold text-atext mt-1">{p.firstName} {p.lastName}</div>
                  <div className="text-[10px] text-atext-dim">Draft age ~17–19</div>
                </div>
                <Pill color="var(--A-accent)">{formatPositionSlash(p)}</Pill>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 items-center">
                {st >= 3 ? (
                  <RatingDot value={p.overall} size="sm" />
                ) : (
                  <div className="font-display font-bold text-lg">{oDisp.label}</div>
                )}
                {st >= 3 ? (
                  <>
                    <div className="font-bold text-apos">Pot {p.potential}</div>
                    <Bar value={p.potential} color="var(--A-pos)" small />
                  </>
                ) : (
                  <div className="font-bold text-atext-dim">Pot {potDisp.label}</div>
                )}
                <span
                  className="text-sm font-mono"
                  style={{
                    color: wageAccurate ? (capOk ? "var(--A-pos)" : "var(--A-neg)") : "var(--A-accent)",
                  }}
                >
                  {wageDisp.label}
                </span>
                <span className="text-[10px] text-atext-dim">{wageDisp.hint || "rookie est."}</span>
              </div>
              {draftLive && isMyTurn && (
                <button type="button" onClick={() => draftPlayer(p)} className={`${css.btnPrimary} text-xs px-4 py-2.5 min-h-[44px] touch-manipulation`}>
                  Draft
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent font-bold">TIP:</span> Bottom-of-ladder clubs pick first. Combine scouting reveals ratings before you commit picks; AI still drafts using true grades.
      </div>
    </div>
  );
}

function YouthTab({ club }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
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
    if ((p.age ?? 0) < 18) {
      updateCareer({
        news: [{ week: career.week, type: 'info', text: `📋 ${p.firstName} ${p.lastName} cannot join the rookie list until they turn 18.` }, ...career.news].slice(0, 15),
      });
      return;
    }
    if (career.squad.length >= 40) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `⛔ List full — cannot add ${p.firstName} ${p.lastName} from the academy (40 player limit).` }, ...career.news].slice(0, 15),
      });
      return;
    }
    const youthTier = leagueTierOf(career);
    const wage = youthTier === 1 ? 100_000 : youthTier === 2 ? 35_000 : 8_000;
    if (!canAffordSigning(career, wage)) {
      updateCareer({ news: [{ week: career.week, type: 'loss', text: `⚖️ Cannot promote ${p.firstName} ${p.lastName} — over salary cap` }, ...career.news].slice(0, 15) });
      return;
    }
    const rookie = { ...p, id: `draft_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage, contract: 2, rookie: true };
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
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{background:'var(--A-accent)'}} />
            <div className={`${css.h1} text-3xl`}>YOUTH ACADEMY</div>
          </div>
          <div className="text-xs text-atext-dim">Develop talent from the {club.state} zone. Build the next generation.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Program Level" value={`${youth.programLevel}/5`} accent="var(--A-pos)" />
          <Stat label="Zone" value={youth.zone} accent="var(--A-accent)" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${css.panel} p-5 lg:col-span-1 space-y-4`}>
          <div className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-apos" /><div className="font-bold tracking-wide">Academy Settings</div></div>
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
            <div className="flex items-center gap-2"><Sprout className="w-5 h-5 text-apos" /><div className="font-bold tracking-wide">Current Intake</div></div>
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
                  <div className="col-span-1"><Pill color="var(--A-accent)">{formatPositionSlash(p)}</Pill></div>
                  <div className="col-span-2"><RatingDot value={p.overall} /></div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-atext-dim">Potential</div>
                    <div className="flex items-center gap-1"><span className="text-xs font-bold text-apos">{p.potential}</span><Bar value={p.potential} color="var(--A-pos)" small /></div>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button
                      type="button"
                      disabled={(p.age ?? 0) < 18}
                      title={(p.age ?? 0) < 18 ? 'Must be 18 to join the rookie list' : ''}
                      onClick={()=>promote(p)}
                      className={(p.age ?? 0) < 18 ? 'px-3 py-1.5 rounded-lg text-xs bg-apanel-2 text-atext-mute' : `${css.btnPrimary} text-xs px-3 py-1.5`}
                    >
                      Promote
                    </button>
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

function LocalTab({ club }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [scoutedPlayers, setScoutedPlayers] = useState([]);
  const [scoutingLeague, setScoutingLeague] = useState(null);
  const homeState = club.state;
  const otherStates = useMemo(() => STATES.filter((s) => s !== homeState), [homeState]);
  const [interState, setInterState] = useState(() => otherStates[0] ?? 'VIC');

  // ── Emergency trialists (semi-pro/amateur tiers, in-season or preseason) ───
  const localTierCheck = leagueTierOf(career);
  const isInSeason = career.phase === 'season' || career.phase === 'preseason';
  const injuredCount = (career.squad || []).filter((p) => (p.injured || 0) > 0).length;
  const showEmergencyPool = localTierCheck >= 2 && isInSeason;

  const emergencyPool = useMemo(() => {
    if (!showEmergencyPool) return [];
    seedRng((career.season ?? 2026) * 1000 + (career.week ?? 1) * 7 + 3);
    return Array.from({ length: 4 }, (_, i) => {
      const p = generatePlayer(localTierCheck, 99000 + i + (career.week ?? 1) * 13, { clubId: 'local', season: career.season });
      return { ...p, id: `emerg_${career.season}_${career.week}_${i}`, fromLocal: club.state, fromClubId: null, emergencyFree: true };
    });
  }, [showEmergencyPool, localTierCheck, career.season, career.week, club.state]);

  const signEmergency = (p) => {
    const wage = localTierCheck >= 3 ? 12_000 : 25_000;
    if ((career.squad || []).length >= 40) return;
    if (!canAffordSigning(career, wage)) return;
    const newPlayer = { ...p, id: `emerg_signed_${Date.now()}_${rand(1e6, 9e6)}`, wage, contract: 1 };
    updateCareer({
      squad: [...(career.squad || []), newPlayer],
      news: [{ week: career.week, type: 'info', text: `🚨 Emergency signing: ${p.firstName} ${p.lastName} (${p.position}) — 1yr deal, ${(wage/1000).toFixed(0)}k/yr` }, ...(career.news || [])].slice(0, 15),
    });
  };

  useEffect(() => {
    const pool = STATES.filter((s) => s !== homeState);
    setInterState((prev) => (pool.includes(prev) ? prev : (pool[0] ?? 'VIC')));
  }, [homeState]);

  const myLeague = findLeagueOf(career.clubId);
  const localPool = LEAGUES_BY_STATE(club.state) || [];
  const localLeagues = !myLeague
    ? []
    : localPool
        .filter((l) => l.key !== myLeague.key)
        .slice()
        .sort((a, b) => {
          const da = Math.abs(a.tier - myLeague.tier);
          const db = Math.abs(b.tier - myLeague.tier);
          if (da !== db) return da - db;
          return a.tier - b.tier;
        });

  const interstateLeagues = useMemo(() => {
    const pool = LEAGUES_BY_STATE(interState) || [];
    return pool.slice().sort((a, b) => a.tier - b.tier || (a.short || '').localeCompare(b.short || ''));
  }, [interState]);

  const staffTasks = ensureStaffTasks(career);
  const nextInterFee =
    interState && interState !== homeState ? interstateScoutFee(career.staff, staffTasks, interState, homeState) : 0;

  const activeDeployments = useMemo(
    () => (career.scoutDeployments || []).filter(d => d.status === 'active'),
    [career.scoutDeployments]
  );

  const runScout = (leagueKey, fromInterstate) => {
    const league = PYRAMID[leagueKey];
    if (!league) return;
    const leagueSt = league.state || homeState;
    const isInter = !!fromInterstate || leagueSt !== homeState;
    const fee = isInter ? interstateScoutFee(career.staff, staffTasks, leagueSt, homeState) : 0;
    if (fee > 0 && (career.finance?.cash ?? 0) < fee) {
      updateCareer({
        news: [{ week: career.week, type: 'loss', text: `✈️ Interstate scouting blocked — need ${fmtK(fee)} cash for flights & comps.` }, ...(career.news || [])].slice(0, 15),
      });
      return;
    }
    seedRng(Date.now() % 88888);
    const scoutPool = getCompetitionClubs(leagueKey, career.regionState ?? leagueSt, null);
    const poolRaw = scoutPool.length ? [...scoutPool] : [...league.clubs];
    for (let i = poolRaw.length - 1; i > 0; i--) {
      const j = rand(0, i);
      const tmp = poolRaw[i]; poolRaw[i] = poolRaw[j]; poolRaw[j] = tmp;
    }
    const focusBonus = recruitFocusIncrementalBonus(staffTasks, { interstate: isInter, leagueState: leagueSt });
    const found = Array.from({ length: 6 }, (_, i) => {
      const sourceClub = poolRaw[i % poolRaw.length];
      const cid = sourceClub.id || `local:${leagueKey}:${i}`;
      const p = generatePlayer(league.tier, 13000 + i + Date.now() % 500, { clubId: cid, season: career.season });
      const shortLabel = sourceClub.short || sourceClub.name?.slice(0, 4)?.toUpperCase() || '?';
      return {
        ...p,
        fromLocal: shortLabel,
        fromClubId: sourceClub.id || null,
        fromLeagueKey: leagueKey,
        localLoyalty: rand(30, 90),
        scoutedOverall: scoutedOverall(p, career, { focusBonus }),
      };
    });
    setScoutedPlayers(found);
    setScoutingLeague(leagueKey);
    // Bump relationship + deduct fee
    const patch = {
      leagueRelationships: bumpRelationship(career.leagueRelationships, leagueKey, career, 5),
    };
    if (fee > 0) {
      patch.finance = { ...career.finance, cash: career.finance.cash - fee };
      patch.news = [{ week: career.week, type: 'info', text: `✈️ Scout pack (${leagueSt} · ${league.short}) · −${fmtK(fee)}` }, ...(career.news || [])].slice(0, 15);
    }
    updateCareer(patch);
  };

  const handleDeploy = (leagueKey, fromInterstate) => {
    const league = PYRAMID[leagueKey];
    if (!league) return;
    if (activeDeployments.some(d => d.leagueKey === leagueKey)) {
      gameToast('Scout already deployed to this area');
      return;
    }
    const leagueSt = league.state || homeState;
    const isInter = !!fromInterstate || leagueSt !== homeState;
    const fee = isInter ? interstateScoutFee(career.staff, staffTasks, leagueSt, homeState) : 0;
    if (fee > 0 && (career.finance?.cash ?? 0) < fee) {
      gameToast(`Need ${fmtK(fee)} for interstate scout travel`);
      return;
    }
    const scoutLead = resolveScoutLeadMember(career.staff, staffTasks);
    const deployment = createDeployment(career, leagueKey, scoutLead?.id || 'auto');
    const patch = {
      scoutDeployments: [...(career.scoutDeployments || []), deployment],
      leagueRelationships: bumpRelationship(career.leagueRelationships, leagueKey, career, 3),
      news: [{ week: career.week, type: 'info', text: `🔍 Scout dispatched to ${league.name} — report expected in ${DEPLOYMENT_DURATION_WEEKS} weeks.` }, ...(career.news || [])].slice(0, 15),
    };
    if (fee > 0) patch.finance = { ...career.finance, cash: career.finance.cash - fee };
    updateCareer(patch);
    gameToast(`Scout deployed to ${league.name} · returns week ${deployment.returnsWeek}`);
  };

  const handleWatch = (p) => {
    const lKey = p.fromLeagueKey || scoutingLeague;
    if (!lKey) return;
    const wlId = `wl_${lKey}_${p.firstName}${p.lastName}_${career.season || 0}`;
    const existing = career.scoutWatchlist || [];
    if (existing.some(w => w.id === wlId)) { gameToast('Already on watchlist'); return; }
    const entry = {
      ...p,
      id: wlId,
      fromLeagueKey: lKey,
      fromLeagueShort: PYRAMID[lKey]?.short || lKey,
      fromClubName: p.fromLocal,
      fromClubShort: p.fromLocal,
      localLoyalty: p.localLoyalty ?? 50,
      interestLevel: (p.potential || 0) >= 75 ? 3 : (p.potential || 0) >= 65 ? 2 : 1,
      flaggedWeek: career.week || 0,
      lastRefreshedWeek: career.week || 0,
      rivalInterest: 0,
      isStale: false,
    };
    updateCareer({ scoutWatchlist: [...existing, entry] });
    gameToast(`${p.firstName} ${p.lastName} added to watchlist`);
  };

  const localTierHead = leagueTierOf(career);
  const baseFee = localTierHead === 1 ? 75_000 : localTierHead === 2 ? 30_000 : 8_000;
  const baseWage = localTierHead === 1 ? 200_000 : localTierHead === 2 ? 80_000 : 18_000;
  const feeLabel = localTierHead === 1 ? '$75k' : localTierHead === 2 ? '$30k' : '$8k';

  const sign = (p) => {
    const relScore = getRelationshipScore(career, p.fromLeagueKey || scoutingLeague);
    const loyaltyMod = localLoyaltyModifier(p.localLoyalty ?? 50, relScore);
    const fee = Math.round(baseFee * loyaltyMod);
    if ((career.finance?.cash ?? 0) < fee || (career.squad || []).length >= 40) return;
    if (!canAffordSigning(career, baseWage)) return;
    const newPlayer = { ...p, id: `local_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage: baseWage, contract: 2 };
    setScoutedPlayers(s => s.filter(x => x.id !== p.id));
    updateCareer({
      squad: [...(career.squad || []), newPlayer],
      finance: { ...career.finance, cash: career.finance.cash - fee },
      news: [{ week: career.week, type: 'info', text: `📍 Signed ${p.firstName} ${p.lastName} from ${p.fromLocal} — ${fmtK(fee)} fee, ${fmtK(baseWage)}/yr` }, ...(career.news || [])].slice(0, 15),
    });
  };

  const signWalkOn = (p) => {
    if ((career.squad || []).length >= 40 || !canAffordSigning(career, baseWage)) return;
    const newPlayer = { ...p, id: `walkon_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage: baseWage, contract: 2 };
    setScoutedPlayers(s => s.filter(x => x.id !== p.id));
    updateCareer({
      squad: [...(career.squad || []), newPlayer],
      news: [{ week: career.week, type: 'info', text: `📍 Walk-on: ${p.firstName} ${p.lastName} from ${p.fromLocal} — no fee, ${fmtK(baseWage)}/yr` }, ...(career.news || [])].slice(0, 15),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{background:'var(--A-accent)'}} />
            <div className={`${css.h1} text-3xl`}>LOCAL FOOTBALL</div>
          </div>
          <div className="text-xs text-atext-dim">Scout other {club.state} competitions. <span className="text-aaccent font-semibold">Scout Now</span> for instant reports. <span className="text-apos font-semibold">Deploy</span> a scout for 2 weeks to build your watchlist and grow league relationships.</div>
        </div>
        <div className="flex items-center gap-3">
          <Stat label="Listed signing" value={feeLabel} sub="base fee + wages" accent="var(--A-accent)" />
          <Stat label="Walk-on" value="$0" sub="same wages" accent="var(--A-pos)" />
        </div>
      </div>

      {/* Active deployments strip */}
      {activeDeployments.length > 0 && (
        <div className="rounded-xl px-4 py-3 space-y-1.5" style={{ background: 'color-mix(in srgb, var(--A-accent) 8%, var(--A-panel))', border: '1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Send className="w-3.5 h-3.5 text-aaccent" />
            <div className="text-[10px] font-black uppercase tracking-widest text-aaccent">Scout{activeDeployments.length > 1 ? 's' : ''} Deployed</div>
          </div>
          {activeDeployments.map(d => (
            <div key={d.id} className="flex items-center justify-between text-xs gap-3">
              <span className="text-atext font-medium">{d.leagueName}</span>
              <span className="text-atext-mute font-mono text-[10px]">returns week {d.returnsWeek}</span>
            </div>
          ))}
        </div>
      )}

      {showEmergencyPool && emergencyPool.length > 0 && (
        <div className="rounded-2xl p-4 border" style={{ background: 'color-mix(in srgb, var(--A-neg) 8%, var(--A-panel))', borderColor: 'color-mix(in srgb, var(--A-neg) 40%, transparent)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--A-neg) 20%, transparent)', color: 'var(--A-neg)' }}>Emergency Pool</span>
            {injuredCount > 0 && <span className="text-[10px] text-atext-mute">{injuredCount} player{injuredCount !== 1 ? 's' : ''} injured</span>}
          </div>
          <div className="text-xs text-atext-dim mb-3">Players who've fronted up to training — available for immediate 1-year walk-on deals. Pool refreshes each round.</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {emergencyPool.map((p) => {
              const wage = localTierCheck >= 3 ? 12_000 : 25_000;
              const canSign = (career.squad || []).length < 40 && canAffordSigning(career, wage);
              return (
                <div key={p.id} className={`${css.panel} p-3 flex items-center gap-3`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-atext truncate">{p.firstName} {p.lastName}</div>
                    <div className="text-[10px] text-atext-mute">{formatPositionSlash(p)} · Age {p.age} · OVR {p.overall} · {fmtK(wage)}/yr</div>
                  </div>
                  <button type="button" disabled={!canSign} onClick={() => signEmergency(p)}
                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition ${canSign ? 'bg-aaccent text-[var(--fd-on-accent,#0A0D0C)] hover:opacity-90 cursor-pointer' : 'opacity-40 bg-apanel-2 text-atext-mute cursor-not-allowed'}`}>
                    Sign
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          {/* Local leagues */}
          <div className={`${css.panel} p-5`}>
            <div className="flex items-center gap-2 mb-3"><Map className="w-5 h-5 text-aaccent" /><div className="font-bold tracking-wide">{club.state} leagues</div></div>
            {localLeagues.length === 0 ? (
              <div className="text-sm text-atext-dim py-4">No other leagues listed for {club.state}.</div>
            ) : (
              <div className="space-y-2">
                {localLeagues.map(l => {
                  const relScore = getRelationshipScore(career, l.key);
                  const relTier = getRelationshipTier(relScore);
                  const isDeployed = activeDeployments.some(d => d.leagueKey === l.key);
                  const dep = activeDeployments.find(d => d.leagueKey === l.key);
                  return (
                    <div key={l.key} className={`px-3 py-2.5 rounded-lg border transition ${scoutingLeague === l.key ? 'border-aaccent bg-aaccent/10' : 'border-aline bg-apanel'}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-atext truncate">{l.name}</div>
                          <div className="text-[10px] text-atext-mute font-mono">{l.short} · {l.clubs.length} clubs</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {relScore > 0 && <span className="text-[9px] font-bold" style={{ color: relTier.color }}>{relTier.label}</span>}
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--A-accent) 12%, transparent)', color: 'var(--A-accent)', border: '1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)' }}>T{l.tier}</span>
                        </div>
                      </div>
                      {relScore > 0 && (
                        <div className="w-full h-0.5 rounded-full bg-aline mb-2 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${relScore}%`, background: relTier.color }} />
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => runScout(l.key, false)}
                          className="flex-1 text-[10px] font-bold py-1.5 rounded-lg cursor-pointer transition"
                          style={{ background: 'color-mix(in srgb, var(--A-accent) 12%, transparent)', color: 'var(--A-accent)', border: '1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)' }}>
                          Scout Now
                        </button>
                        <button type="button" onClick={() => handleDeploy(l.key, false)} disabled={isDeployed}
                          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition ${isDeployed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          style={isDeployed
                            ? { background: 'var(--A-panel-2)', color: 'var(--A-text-mute)', border: '1px solid var(--A-line)' }
                            : { background: 'color-mix(in srgb, var(--A-pos) 12%, transparent)', color: 'var(--A-pos)', border: '1px solid color-mix(in srgb, var(--A-pos) 25%, transparent)' }}>
                          {isDeployed ? `Out · wk${dep?.returnsWeek}` : 'Deploy (2wk)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interstate */}
          <div className={`${css.panel} p-5`}>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-aaccent" aria-hidden />
                <div className="font-bold tracking-wide">Interstate</div>
              </div>
              <div className="text-[10px] text-atext-dim font-mono">≈ {fmtK(nextInterFee)} fee</div>
            </div>
            <label className="block text-[10px] uppercase tracking-wide text-atext-mute font-bold mb-1">State</label>
            <select value={interState} onChange={(e) => setInterState(e.target.value)}
              className="w-full mb-3 rounded-lg border border-aline bg-apanel px-2 py-2 text-sm">
              {otherStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {interstateLeagues.length === 0 ? (
              <div className="text-sm text-atext-dim py-2">No leagues in pyramid for {interState}.</div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {interstateLeagues.map((l) => {
                  const relScore = getRelationshipScore(career, l.key);
                  const relTier = getRelationshipTier(relScore);
                  const isDeployed = activeDeployments.some(d => d.leagueKey === l.key);
                  const dep = activeDeployments.find(d => d.leagueKey === l.key);
                  return (
                    <div key={l.key} className={`px-3 py-2.5 rounded-lg border transition ${scoutingLeague === l.key ? 'border-aaccent bg-aaccent/10' : 'border-aline bg-apanel'}`}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-atext truncate">{l.name}</div>
                          <div className="text-[10px] text-atext-mute font-mono">{l.short} · {l.clubs.length} clubs · {fmtK(interstateScoutFee(career.staff, staffTasks, interState, homeState))} fee</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {relScore > 0 && <span className="text-[9px] font-bold" style={{ color: relTier.color }}>{relTier.label}</span>}
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'color-mix(in srgb, #F59E0B 12%, transparent)', color: '#F59E0B', border: '1px solid color-mix(in srgb, #F59E0B 25%, transparent)' }}>T{l.tier}</span>
                        </div>
                      </div>
                      {relScore > 0 && (
                        <div className="w-full h-0.5 rounded-full bg-aline mb-2 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${relScore}%`, background: relTier.color }} />
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => runScout(l.key, true)}
                          className="flex-1 text-[10px] font-bold py-1.5 rounded-lg cursor-pointer transition"
                          style={{ background: 'color-mix(in srgb, #F59E0B 12%, transparent)', color: '#F59E0B', border: '1px solid color-mix(in srgb, #F59E0B 25%, transparent)' }}>
                          Scout Now
                        </button>
                        <button type="button" onClick={() => handleDeploy(l.key, true)} disabled={isDeployed}
                          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg transition ${isDeployed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          style={isDeployed
                            ? { background: 'var(--A-panel-2)', color: 'var(--A-text-mute)', border: '1px solid var(--A-line)' }
                            : { background: 'color-mix(in srgb, var(--A-pos) 12%, transparent)', color: 'var(--A-pos)', border: '1px solid color-mix(in srgb, var(--A-pos) 25%, transparent)' }}>
                          {isDeployed ? `Out · wk${dep?.returnsWeek}` : 'Deploy (2wk)'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Scouting results */}
        <div className={`${css.panel} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-aaccent" /><div className="font-bold tracking-wide">Scouting Reports</div></div>
            {scoutingLeague && (() => {
              const relScore = getRelationshipScore(career, scoutingLeague);
              const relTier = getRelationshipTier(relScore);
              return (
                <div className="flex items-center gap-2 text-[10px] text-atext-dim">
                  <span>{PYRAMID[scoutingLeague]?.short} · 6 prospects</span>
                  {relScore > 0 && <span className="font-bold" style={{ color: relTier.color }}>{relTier.label} ({relScore})</span>}
                </div>
              );
            })()}
          </div>
          {scoutedPlayers.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Eye className="w-8 h-8 mx-auto opacity-20" />
              <div className="text-sm text-atext-dim">Pick a league to dispatch your scouts.</div>
              <div className="text-xs text-atext-mute">Or Deploy a scout to auto-populate your Watchlist over 2 weeks.</div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {scoutedPlayers.map(p => {
                const relScore = getRelationshipScore(career, p.fromLeagueKey || scoutingLeague);
                const loyaltyMod = localLoyaltyModifier(p.localLoyalty ?? 50, relScore);
                const fee = Math.round(baseFee * loyaltyMod);
                const canCash = (career.finance?.cash ?? 0) >= fee;
                const canCap = canAffordSigning(career, baseWage);
                const can = canCash && canCap;
                const sourceClubVisual = p.fromClubId ? findClub(p.fromClubId) : findClubByShort(p.fromLocal);
                const loyaltyPct = p.localLoyalty ?? 50;
                const loyaltyColor = loyaltyPct > 65 ? 'var(--A-neg)' : loyaltyPct > 40 ? 'var(--A-accent-2)' : 'var(--A-pos)';
                return (
                  <div key={p.id} className={`${css.inset} p-3 grid grid-cols-12 gap-2 items-center`}>
                    <div className="col-span-4 flex items-start gap-2 min-w-0">
                      {sourceClubVisual ? <ClubBadge club={sourceClubVisual} size="sm" className="flex-shrink-0 mt-0.5" /> : null}
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{p.firstName} {p.lastName}</div>
                        <div className="text-[10px] text-atext-dim">From {p.fromLocal} · Age {p.age}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="text-[9px] text-atext-mute">Loyalty</div>
                          <div className="w-10 h-1 rounded-full bg-aline overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${loyaltyPct}%`, background: loyaltyColor }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1"><Pill color="var(--A-accent)">{formatPositionSlash(p)}</Pill></div>
                    <div className="col-span-2"><RatingDot value={p.scoutedOverall ?? p.overall} /></div>
                    <div className="col-span-2">
                      <div className="text-[10px] text-atext-dim">Potential</div>
                      <div className="flex items-center gap-1"><span className="text-xs font-bold text-apos">{p.potential}</span><Bar value={p.potential} color="var(--A-pos)" small /></div>
                    </div>
                    <div className="col-span-3 flex flex-col gap-1 items-stretch">
                      <button type="button" onClick={() => sign(p)} disabled={!can}
                        className={can ? `${css.btnPrimary} text-[10px] px-2 py-1.5 leading-tight` : 'px-2 py-1.5 rounded-lg text-[10px] bg-apanel-2 text-atext-mute leading-tight'}
                        title={!canCap ? 'Over salary cap' : !canCash ? 'Insufficient cash' : ''}>
                        {fmtK(fee)} · Sign
                      </button>
                      <button type="button" onClick={() => signWalkOn(p)} disabled={!canCap}
                        className={canCap ? `${css.btnGhost} text-[10px] px-2 py-1.5 font-bold leading-tight border border-aline` : 'px-2 py-1.5 rounded-lg text-[10px] bg-apanel-2 text-atext-mute leading-tight'}
                        title={!canCap ? 'Over salary cap' : 'No transfer fee'}>
                        Walk-on ($0)
                      </button>
                      <button type="button" onClick={() => handleWatch(p)}
                        className="text-[10px] px-2 py-1.5 rounded-lg font-bold leading-tight cursor-pointer transition"
                        style={{ background: 'color-mix(in srgb, var(--A-accent-2) 12%, transparent)', color: 'var(--A-accent-2)', border: '1px solid color-mix(in srgb, var(--A-accent-2) 25%, transparent)' }}>
                        Watch
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
        <span className="text-aaccent font-bold">TIP:</span> Build league relationships by scouting regularly — higher relationship means better accuracy and lower loyalty barriers. <span className="text-apos font-semibold">Deploy</span> scouts early in the season to have prospects lined up before the signing window.
      </div>
    </div>
  );
}

// ── Watchlist Tab ────────────────────────────────────────────────────────────
const INTEREST_LABELS = { 3: 'Priority', 2: 'Watching', 1: 'Casual' };
const INTEREST_COLORS = { 3: 'var(--A-neg)', 2: 'var(--A-accent)', 1: 'var(--A-text-mute)' };

function WatchlistTab({ club }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const watchlist = career.scoutWatchlist || [];
  const localTier = leagueTierOf(career);
  const baseWage = localTier === 1 ? 200_000 : localTier === 2 ? 80_000 : 18_000;
  const baseFee = localTier === 1 ? 75_000 : localTier === 2 ? 30_000 : 8_000;

  const dismiss = (id) => updateCareer({ scoutWatchlist: watchlist.filter(w => w.id !== id) });

  const signFromWatchlist = (w) => {
    if ((career.squad || []).length >= 40 || !canAffordSigning(career, baseWage)) return;
    const relScore = getRelationshipScore(career, w.fromLeagueKey);
    const loyaltyMod = localLoyaltyModifier(w.localLoyalty, relScore);
    const fee = Math.round(baseFee * loyaltyMod);
    if ((career.finance?.cash ?? 0) < fee) return;
    // Strip watchlist metadata before adding to squad
    const { fromLeagueKey, fromLeagueShort, fromClubName, fromClubShort, localLoyalty,
      interestLevel, flaggedWeek, lastRefreshedWeek, rivalInterest, isStale,
      scoutedOverall: _so, ...playerBase } = w;
    const newPlayer = { ...playerBase, id: `wl_signed_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage: baseWage, contract: 2 };
    updateCareer({
      squad: [...(career.squad || []), newPlayer],
      scoutWatchlist: watchlist.filter(x => x.id !== w.id),
      finance: { ...career.finance, cash: (career.finance?.cash ?? 0) - fee },
      news: [{ week: career.week, type: 'info', text: `📍 Signed ${w.firstName} ${w.lastName} (${w.fromLeagueShort}) from watchlist — ${fmtK(fee)} fee, ${fmtK(baseWage)}/yr` }, ...(career.news || [])].slice(0, 15),
    });
  };

  const walkOnFromWatchlist = (w) => {
    if ((career.squad || []).length >= 40 || !canAffordSigning(career, baseWage)) return;
    const { fromLeagueKey, fromLeagueShort, fromClubName, fromClubShort, localLoyalty,
      interestLevel, flaggedWeek, lastRefreshedWeek, rivalInterest, isStale,
      scoutedOverall: _so, ...playerBase } = w;
    const newPlayer = { ...playerBase, id: `wl_walkon_${Date.now()}_${rand(1e9, 2e9 - 1)}`, wage: baseWage, contract: 2 };
    updateCareer({
      squad: [...(career.squad || []), newPlayer],
      scoutWatchlist: watchlist.filter(x => x.id !== w.id),
      news: [{ week: career.week, type: 'info', text: `📍 Walk-on from watchlist: ${w.firstName} ${w.lastName} (${w.fromLeagueShort}) — no fee, ${fmtK(baseWage)}/yr` }, ...(career.news || [])].slice(0, 15),
    });
  };

  if (watchlist.length === 0) {
    return (
      <div className={`${css.panel} p-12 flex flex-col items-center gap-3 text-center`}>
        <Bookmark className="w-9 h-9 opacity-20" />
        <div className="text-sm font-medium text-atext-dim">Watchlist is empty</div>
        <div className="text-xs text-atext-mute max-w-xs">Deploy a scout to a league and they'll flag prospects automatically. Or hit <span className="text-aaccent-2 font-semibold">Watch</span> on any player in Local Football reports.</div>
      </div>
    );
  }

  const sorted = [...watchlist].sort((a, b) => {
    if (a.isStale !== b.isStale) return a.isStale ? 1 : -1;
    if ((b.interestLevel || 1) !== (a.interestLevel || 1)) return (b.interestLevel || 1) - (a.interestLevel || 1);
    return (b.potential || 0) - (a.potential || 0);
  });

  const activeCount = watchlist.filter(w => !w.isStale).length;
  const staleCount = watchlist.filter(w => w.isStale).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{background:'var(--A-accent-2)'}} />
            <div className={`${css.h1} text-3xl`}>WATCHLIST</div>
          </div>
          <div className="text-xs text-atext-dim">{activeCount} active · {staleCount} stale — Updated by scout deployments and manual pins</div>
        </div>
        <Stat label="Tracked" value={activeCount} sub={staleCount ? `${staleCount} stale` : 'all fresh'} accent="var(--A-accent-2)" />
      </div>

      <div className="space-y-2">
        {sorted.map(w => {
          const relScore = getRelationshipScore(career, w.fromLeagueKey);
          const loyaltyMod = localLoyaltyModifier(w.localLoyalty, relScore);
          const adjustedFee = Math.round(baseFee * loyaltyMod);
          const canSign = !w.isStale && (career.squad || []).length < 40 && canAffordSigning(career, baseWage) && (career.finance?.cash ?? 0) >= adjustedFee;
          const canWalkOn = !w.isStale && (career.squad || []).length < 40 && canAffordSigning(career, baseWage);
          const effectiveLoyalty = Math.max(0, Math.min(100, (w.localLoyalty || 50) - relScore * 0.4));
          const loyaltyColor = effectiveLoyalty > 60 ? 'var(--A-neg)' : effectiveLoyalty > 30 ? 'var(--A-accent-2)' : 'var(--A-pos)';
          const interestColor = INTEREST_COLORS[w.interestLevel || 1];
          return (
            <div key={w.id} className={`${css.inset} p-3 ${w.isStale ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Name, interest, club */}
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
                      style={{ background: `color-mix(in srgb, ${interestColor} 15%, transparent)`, color: interestColor }}>
                      {INTEREST_LABELS[w.interestLevel || 1]}
                    </span>
                    {(w.rivalInterest || 0) > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: 'var(--A-neg)' }}>⚡{w.rivalInterest}</span>
                    )}
                    {w.isStale && <span className="text-[9px] text-aaccent-2 font-bold">STALE</span>}
                  </div>
                  <div className="font-semibold text-sm truncate">{w.firstName} {w.lastName}</div>
                  <div className="text-[10px] text-atext-dim">{w.fromLeagueShort} · {w.fromClubShort} · Age {w.age}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] text-atext-mute">Loyalty</span>
                    <div className="w-10 h-1 rounded-full bg-aline overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${effectiveLoyalty}%`, background: loyaltyColor }} />
                    </div>
                  </div>
                </div>
                {/* Position */}
                <div className="col-span-1"><Pill color="var(--A-accent)">{w.position}</Pill></div>
                {/* Scouted OVR */}
                <div className="col-span-2"><RatingDot value={w.scoutedOverall ?? w.overall} /></div>
                {/* Potential */}
                <div className="col-span-2">
                  <div className="text-[10px] text-atext-dim">POT</div>
                  <div className="text-xs font-bold text-apos">{w.potential}</div>
                  {relScore > 0 && (
                    <div className="text-[9px] font-bold mt-0.5" style={{ color: getRelationshipTier(relScore).color }}>
                      {getRelationshipTier(relScore).label}
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="col-span-3 flex flex-col gap-1">
                  <button type="button" onClick={() => signFromWatchlist(w)} disabled={!canSign}
                    className={`text-[10px] font-bold px-2 py-1.5 rounded-lg leading-tight ${canSign ? css.btnPrimary : 'bg-apanel-2 text-atext-mute cursor-not-allowed'}`}>
                    {fmtK(adjustedFee)} · Sign
                  </button>
                  <button type="button" onClick={() => walkOnFromWatchlist(w)} disabled={!canWalkOn}
                    className={`text-[10px] font-bold px-2 py-1.5 rounded-lg leading-tight border ${canWalkOn ? `${css.btnGhost} border-aline cursor-pointer` : 'bg-apanel-2 text-atext-mute border-aline cursor-not-allowed'}`}>
                    Walk-on
                  </button>
                  <button type="button" onClick={() => dismiss(w.id)}
                    className="text-[10px] px-2 py-1 rounded-lg text-atext-mute hover:text-aneg transition cursor-pointer leading-tight">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`${css.inset} p-4 text-xs text-atext-dim`}>
        <span className="text-aaccent-2 font-bold">HOW IT WORKS:</span> Scout deployments auto-flag prospects. Intel goes <span className="font-semibold text-atext">stale</span> after {8} weeks without a refresh. Higher league relationship = better intel accuracy + lower loyalty barrier on signing.
      </div>
    </div>
  );
}

// ─── FA Market (post-trade-period signing window) ────────────────────────────
function FaMarketTab({ league }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const pool = career.freeAgentPool || [];
  const [offering, setOffering] = useState(null); // { player, wage, years }

  const openOffer = (player) => {
    setOffering({ player, wage: player.askingWage, years: player.contractYearsWanted });
  };

  const submitOffer = () => {
    if (!offering) return;
    const { player, wage, years } = offering;
    const isRFA = player.faType === 'RFA';
    // RFA: needs 10% premium on asking wage to beat the match threshold
    const effectiveAsk = isRFA ? Math.round(player.askingWage * 1.1) : player.askingWage;
    const wageScore = wage >= effectiveAsk ? 1 : wage / effectiveAsk;
    const clubScore = Math.min(1, (career.finance?.boardConfidence ?? 50) / 100);
    const acceptChance = wageScore * 0.7 + clubScore * 0.3;
    const accepted = Math.random() < acceptChance;

    if (accepted) {
      if (career.squad.length >= 40) {
        updateCareer({ news: [{ week: career.week, type: 'loss', text: `⛔ List full — can't sign ${player.firstName} ${player.lastName}.` }, ...(career.news || [])].slice(0, 20) });
        setOffering(null);
        return;
      }
      const newPlayer = {
        id: `fa_mkt_${Date.now()}_${rand(1e6, 9e6)}`,
        firstName: player.firstName,
        lastName: player.lastName,
        age: player.age,
        position: player.position,
        overall: player.overall,
        potential: player.overall + rand(0, 8),
        trueRating: player.overall,
        tier: league?.tier ?? 1,
        wage,
        contract: years,
        fitness: player.fitness ?? 85,
        morale: player.morale ?? 70,
        form: player.form ?? 65,
        gamesPlayed: 0, goals: 0, disposals: 0, marks: 0, tackles: 0,
        careerGames: player.careerGames ?? 0,
        injured: 0, suspended: 0,
        receivedInTrade: null, seasonsAtClub: 0,
        attrs: {},
      };
      updateCareer({
        squad: [...career.squad, newPlayer],
        freeAgentPool: pool.filter(p => p.id !== player.id),
        finance: { ...career.finance, cash: (career.finance?.cash ?? 0) - wage },
        news: [{ week: career.week, type: 'win', text: `✍️ FA signed: ${player.firstName} ${player.lastName} (${player.faType}) — ${years}yr @ ${fmtK(wage)}/yr` }, ...(career.news || [])].slice(0, 20),
      });
      gameToast.signing(`Signed ${player.firstName} ${player.lastName} (${player.faType})`);
    } else {
      updateCareer({
        news: [{ week: career.week, type: 'info', text: `📵 ${player.firstName} ${player.lastName} (${player.faType}) rejected your offer — try a higher wage or better terms.` }, ...(career.news || [])].slice(0, 20),
      });
    }
    setOffering(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-1 h-7 rounded-full" style={{ background: 'var(--A-accent)' }} />
          <div className={`${css.h1} text-3xl`}>FA MARKET</div>
        </div>
        <div className="text-xs text-atext-dim">Out-of-contract players available after the trade period. Make an offer — UFA is open; RFA requires beating the asking wage by 10%.</div>
      </div>

      {pool.length === 0 ? (
        <div className={`${css.panel} p-12 text-center text-sm text-atext-dim`}>
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          No free agents available this off-season.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--A-line)', background: 'var(--A-panel)' }}>
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.15em] text-atext-mute font-black border-b" style={{ borderColor: 'var(--A-line)', background: 'var(--A-panel-2)' }}>
            <div className="col-span-4">Player</div>
            <div className="col-span-2">Pos</div>
            <div className="col-span-2">OVR</div>
            <div className="col-span-2 text-right">Ask / Yrs</div>
            <div className="col-span-2 text-right"></div>
          </div>
          {pool.map(player => (
            <div key={player.id} className="border-b last:border-0" style={{ borderColor: 'var(--A-line)' }}>
              <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm">
                <div className="col-span-4">
                  <div className="font-semibold">{player.firstName} {player.lastName}</div>
                  <div className="text-[10px] text-atext-dim flex items-center gap-1.5">
                    <span style={{ color: player.faType === 'UFA' ? 'var(--A-pos)' : 'var(--A-accent-2)' }}>{player.faType}</span>
                    <span>· age {player.age}</span>
                    {player.faType === 'RFA' && <span title="Former club can match — need 10% above asking wage">⚠️ Restricted</span>}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap" style={posBadgeStyle(player.position)}>{player.position}</span>
                </div>
                <div className="col-span-2"><RatingDot value={player.overall} /></div>
                <div className="col-span-2 text-right font-mono text-xs">{fmtK(player.askingWage)}/yr · {player.contractYearsWanted}y</div>
                <div className="col-span-2 text-right">
                  <button
                    type="button"
                    onClick={() => openOffer(player)}
                    className={`${css.btnPrimary} text-xs px-3 py-1.5`}
                  >
                    Offer
                  </button>
                </div>
              </div>
              {offering?.player.id === player.id && (
                <div className="mx-4 mb-4 rounded-xl p-4 space-y-3" style={{ background: 'color-mix(in srgb, var(--A-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--A-accent) 25%, transparent)' }}>
                  {player.faType === 'RFA' && (
                    <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--A-accent-2) 12%, transparent)', color: 'var(--A-accent-2)' }}>
                      ⚠️ Restricted FA — former club can match your offer. Offer at least {fmtK(Math.round(player.askingWage * 1.1))}/yr to beat the match threshold.
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[160px]">
                      <label className={`${css.label} text-[11px] mb-1 block`}>Wage offer: {fmtK(offering.wage)}/yr</label>
                      <input
                        type="range"
                        min={Math.round(player.askingWage * 0.6)}
                        max={Math.round(player.askingWage * 1.8)}
                        step={5000}
                        value={offering.wage}
                        onChange={e => setOffering(o => ({ ...o, wage: Number(e.target.value) }))}
                        className="w-full accent-[var(--A-accent)]"
                      />
                      <div className="flex justify-between text-[10px] text-atext-mute mt-0.5">
                        <span>{fmtK(Math.round(player.askingWage * 0.6))}</span>
                        <span className="text-aaccent">Ask: {fmtK(player.askingWage)}</span>
                        <span>{fmtK(Math.round(player.askingWage * 1.8))}</span>
                      </div>
                    </div>
                    <div>
                      <label className={`${css.label} text-[11px] mb-1 block`}>Years</label>
                      <select
                        value={offering.years}
                        onChange={e => setOffering(o => ({ ...o, years: Number(e.target.value) }))}
                        className="bg-apanel-2 border border-aline rounded-xl px-3 py-2 text-xs text-atext"
                      >
                        {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y} yr</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setOffering(null)} className="px-4 py-2 rounded-lg text-xs font-bold bg-apanel-2 text-atext-dim hover:bg-aline">Cancel</button>
                    <button type="button" onClick={submitOffer} className={`${css.btnPrimary} text-xs px-4 py-2`}>Submit Offer</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


