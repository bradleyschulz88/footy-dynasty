// Post-season trade period & off-season free agency (spec from FootyDynasty_TradePeriod).
import { seedRng, rand, rng, pick } from './rng.js';
import { generatePlayer } from './playerGen.js';
import { generateTradePool } from './defaults.js';
import { sortedLadder } from './leagueEngine.js';

export const TRADE_PERIOD_DAYS = 14;
export const FREE_AGENCY_END_DAY = 8;
export const POST_TRADE_DRAFT_COUNTDOWN_DAYS = 7;

/** AI trade offers use the same shape as pre-season pendingTradeOffers. */
function seedAiTradeOffers(c, league) {
  const tradableSquad = (c.squad || []).filter(
    (p) =>
      p.contract > 0 &&
      p.overall >= 65 &&
      !(c.lineup || []).slice(0, 5).includes(p.id) &&
      p.receivedInTrade !== c.season,
  );
  const offerCount = Math.min(tradableSquad.length, rand(1, 3));
  const offerClubs = (league.clubs || []).filter((cl) => cl.id !== c.clubId);
  const offers = [];
  for (let i = 0; i < offerCount; i++) {
    const targetPlayer = pick(tradableSquad);
    const offeringClub = pick(offerClubs);
    if (!targetPlayer || !offeringClub || offers.find((o) => o.targetPlayerId === targetPlayer.id)) continue;
    const cashOffer = Math.round(targetPlayer.value * (0.5 + rng() * 0.6));
    const aiSq = c.aiSquads?.[offeringClub.id] || [];
    const swapCandidates = aiSq.filter((ap) => Math.abs(ap.overall - targetPlayer.overall) <= 8).slice(0, 5);
    const swapPlayer = swapCandidates.length ? pick(swapCandidates) : null;
    offers.push({
      id: `tp_offer_${Date.now()}_${i}`,
      fromClubId: offeringClub.id,
      fromClubName: offeringClub.name,
      targetPlayerId: targetPlayer.id,
      offerCash: cashOffer,
      offerPlayerId: swapPlayer?.id || null,
      offerPlayerSnapshot: swapPlayer
        ? {
            id: swapPlayer.id,
            firstName: swapPlayer.firstName,
            lastName: swapPlayer.lastName,
            overall: swapPlayer.overall,
            position: swapPlayer.position,
            age: swapPlayer.age,
            wage: swapPlayer.wage,
          }
        : null,
      status: 'pending',
      createdAt: `postseason-${c.tradePeriodDay}`,
      tradePeriod: true,
    });
  }
  if (offers.length) {
    c.pendingTradeOffers = [...(c.pendingTradeOffers || []), ...offers];
    c.news = [
      {
        week: c.week,
        type: 'info',
        text: `📨 ${offers.length} trade offer${offers.length > 1 ? 's' : ''} landed during the Trade Period.`,
      },
      ...(c.news || []),
    ].slice(0, 20);
  }
}

function makePick({ id, season, round, selection, clubId, type = 'standard', tradeable = true }) {
  return {
    id,
    season,
    round,
    selection,
    ownerClubId: clubId,
    originalOwnerClubId: clubId,
    type,
    tradeable,
  };
}

export function buildDraftPickBank(c, league) {
  const clubId = c.clubId;
  const y0 = c.season;
  const years = [y0, y0 + 1, y0 + 2];
  const bank = {};
  const ladderRows = sortedLadder(c.ladder?.length ? c.ladder : league.clubs.map((cl) => ({ id: cl.id, W: 0, L: 0, D: 0, pts: 0, pct: 0, F: 0, A: 0 })));
  const myPos = Math.max(1, ladderRows.findIndex((r) => r.id === clubId) + 1);
  const approxR1 = myPos;
  const approxR2 = Math.min(18, myPos + 6);
  for (const y of years) {
    const ys = String(y);
    bank[ys] = [
      makePick({
        id: `pick_${y}_r1_${clubId}`,
        season: y,
        round: 1,
        selection: approxR1,
        clubId,
        type: 'standard',
        tradeable: true,
      }),
      makePick({
        id: `pick_${y}_r2_${clubId}`,
        season: y,
        round: 2,
        selection: approxR2,
        clubId,
        type: 'standard',
        tradeable: true,
      }),
    ];
  }
  return bank;
}

export function buildOffSeasonFreeAgents(c, generatePlayerFn = generatePlayer) {
  seedRng((c.season || 2026) * 401 + 19);
  const out = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const tier = rand(1, 3);
    const p = generatePlayerFn(tier, 12000 + i + (c.season || 0) * 13);
    const ask = Math.round((p.wage || 0) * (0.92 + rng() * 0.2));
    const years = rand(1, 3);
    out.push({
      id: `fa_${c.season}_${i}`,
      source: 'free_agent',
      freeAgentType: p.age >= 28 && (p.gamesPlayed || 0) >= 80 ? 'UFA' : 'UFA',
      firstName: p.firstName,
      lastName: p.lastName,
      position: p.position,
      age: p.age,
      overall: p.overall,
      potential: p.potential,
      value: p.value,
      wageAsk: ask,
      contractYearsAsk: years,
      attrs: p.attrs,
      trueRating: p.trueRating ?? p.overall,
      tier: p.tier ?? tier,
    });
  }
  return out;
}

/**
 * Start the 14-day post-season window (after Grand Final or if there is no finals series).
 * Does not increment season — finishSeason runs after the draft countdown.
 */
export function beginPostSeasonTradePeriod(c, league, leagueKey) {
  c.postSeasonPhase = 'trade_period';
  c.inTradePeriod = true;
  c.tradePeriodDay = 0;
  c.freeAgencyOpen = true;
  c.freeAgentBalance = { gained: 0, lost: 0 };
  c.tradeHistory = c.tradeHistory || [];
  c.draftPickBank = buildDraftPickBank(c, league);
  c.offSeasonFreeAgents = buildOffSeasonFreeAgents(c);
  seedRng(c.season * 911 + 3);
  c.tradePool = generateTradePool(leagueKey, c.season);
  const stale = (c.pendingTradeOffers || []).filter((o) => o.status === 'pending');
  if (stale.length) {
    c.pendingTradeOffers = (c.pendingTradeOffers || []).filter((o) => o.status !== 'pending');
    c.news = [
      { week: c.week, type: 'info', text: `📨 ${stale.length} older trade offer${stale.length > 1 ? 's' : ''} expired at season’s end.` },
      ...(c.news || []),
    ].slice(0, 20);
  }
  seedAiTradeOffers(c, league);
  c.news = [
    {
      week: c.week,
      type: 'info',
      text: '📣 Trade Period is open — 14 steps to reshape the list. Free agency through Day 7; trades-only Days 8–14. Use Recruit → advance time on the Hub.',
    },
    ...(c.news || []),
  ].slice(0, 20);
}

export function closeTradePeriodStartDraftCountdown(c) {
  c.inTradePeriod = false;
  c.freeAgencyOpen = false;
  c.postSeasonPhase = 'draft_waiting';
  c.postSeasonDraftCountdown = POST_TRADE_DRAFT_COUNTDOWN_DAYS;
  const net = (c.freeAgentBalance?.lost || 0) - (c.freeAgentBalance?.gained || 0);
  if (net > 0 && c.draftPickBank) {
    const ys = String(c.season);
    const arr = [...(c.draftPickBank[ys] || [])];
    for (let i = 0; i < Math.min(net, 4); i++) {
      arr.push(
        makePick({
          id: `comp_${c.season}_${i}_${Date.now()}`,
          season: c.season,
          round: 2,
          selection: 38 + i * 4,
          clubId: c.clubId,
          type: 'compensation',
          tradeable: false,
        }),
      );
    }
    c.draftPickBank[ys] = arr;
    c.news = [
      {
        week: c.week,
        type: 'info',
        text: `📋 League awarded ${Math.min(net, 4)} compensation pick(s) for net free-agent losses.`,
      },
      ...(c.news || []),
    ].slice(0, 20);
  }
  c.pendingTradeOffers = (c.pendingTradeOffers || []).filter((o) => o.status !== 'pending');
  c.news = [
    {
      week: c.week,
      type: 'info',
      text: `✅ Trade Period closed. National Draft / list reset in ${POST_TRADE_DRAFT_COUNTDOWN_DAYS} steps — keep advancing from the Hub.`,
    },
    ...(c.news || []),
  ].slice(0, 20);
}

export function advanceTradePeriodDay(c, league, leagueKey) {
  const day = (c.tradePeriodDay || 0) + 1;
  c.tradePeriodDay = day;
  if (day === FREE_AGENCY_END_DAY) {
    c.freeAgencyOpen = false;
    c.news = [
      {
        week: c.week,
        type: 'info',
        text: '🔒 Free agency closed — player swaps and cash deals only until the Trade Period ends.',
      },
      ...(c.news || []),
    ].slice(0, 20);
  }
  if (day === 11) {
    c.news = [
      { week: c.week, type: 'info', text: '⏳ Trade Period: 3 steps left to complete deals.' },
      ...(c.news || []),
    ].slice(0, 20);
  }
  if (day >= TRADE_PERIOD_DAYS) {
    closeTradePeriodStartDraftCountdown(c);
    return;
  }
  if (rng() < 0.45) seedAiTradeOffers(c, league);
}

/** @returns {'finish_season' | 'continue'} */
export function advanceDraftCountdown(c) {
  const left = (c.postSeasonDraftCountdown ?? POST_TRADE_DRAFT_COUNTDOWN_DAYS) - 1;
  c.postSeasonDraftCountdown = left;
  if (left <= 0) return 'finish_season';
  c.news = [
    { week: c.week, type: 'info', text: `📅 ${left} step${left === 1 ? '' : 's'} until list reset and the new pre-season.` },
    ...(c.news || []),
  ].slice(0, 15);
  return 'continue';
}

export function clearPostSeasonTransient(c) {
  c.postSeasonPhase = 'none';
  c.inTradePeriod = false;
  c.tradePeriodDay = 0;
  c.freeAgencyOpen = false;
  c.postSeasonDraftCountdown = null;
  c.offSeasonFreeAgents = [];
  c.draftPickBank = null;
}

export function playerBlockedFromTrade(player, season) {
  return player && player.receivedInTrade != null && player.receivedInTrade === season;
}
