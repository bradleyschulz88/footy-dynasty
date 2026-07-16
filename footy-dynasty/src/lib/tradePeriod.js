// Post-season trade period & off-season free agency (spec from FootyDynasty_TradePeriod).
import { seedRng, rand, rng, pick } from './rng.js';
import { generatePlayer, FIRST_NAMES, LAST_NAMES } from './playerGen.js';
import { generateTradePool } from './defaults.js';
import { sortedLadder, competitionClubsForCareer } from './leagueEngine.js';
import { syncRecruitPhaseInboxRows } from './inbox.js';
import { LINEUP_FIELD_COUNT } from './lineupHelpers.js';
import { draftPickPositionForClub } from './draftSeed.js';
import { clubFinalsGrudgeTowardPlayer } from './finalsRivalry.js';
import { squadPositionNeeds } from './draftEngine.js';

/** Rich snapshot for trade offers / UI (attrs, status, career log). */
export function tradePlayerSnapshot(p) {
  if (!p) return null;
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    name: p.name,
    overall: p.overall,
    trueRating: p.trueRating ?? p.overall,
    potential: p.potential,
    position: p.position,
    secondaryPosition: p.secondaryPosition ?? null,
    age: p.age,
    wage: p.wage,
    contract: p.contract,
    value: p.value,
    tier: p.tier,
    attrs: p.attrs ? { ...p.attrs } : undefined,
    form: p.form,
    fitness: p.fitness,
    morale: p.morale,
    gamesPlayed: p.gamesPlayed ?? 0,
    goals: p.goals ?? 0,
    behinds: p.behinds ?? 0,
    disposals: p.disposals ?? 0,
    marks: p.marks ?? 0,
    tackles: p.tackles ?? 0,
    injured: p.injured ?? 0,
    careerLog: Array.isArray(p.careerLog) ? [...p.careerLog] : [],
    fromClub: p.fromClub ?? null,
  };
}

/** Rehydrate a full squad player from snapshot when AI squad lookup fails. */
export function playerFromTradeSnapshot(snap, overrides = {}) {
  if (!snap) return null;
  return {
    ...snap,
    attrs: snap.attrs || {},
    fitness: snap.fitness ?? 88,
    form: snap.form ?? 65,
    morale: snap.morale ?? 70,
    contract: snap.contract ?? 2,
    goals: snap.goals ?? 0,
    behinds: snap.behinds ?? 0,
    disposals: snap.disposals ?? 0,
    marks: snap.marks ?? 0,
    tackles: snap.tackles ?? 0,
    gamesPlayed: snap.gamesPlayed ?? 0,
    injured: snap.injured ?? 0,
    suspended: 0,
    careerLog: snap.careerLog || [],
    ...overrides,
  };
}

export const TRADE_PERIOD_DAYS = 14;
export const FREE_AGENCY_END_DAY = 8;
export const POST_TRADE_DRAFT_COUNTDOWN_DAYS = 7;
// Deadline day fires on the last step before the window closes.
export const DEADLINE_DAY = TRADE_PERIOD_DAYS - 1;

/** AI trade offers use the same shape as pre-season pendingTradeOffers. */
// Convert squadPositionNeeds (object of {pos: boostAmount}) into a Set of
// position strings for the trade-targeting check. Returns an empty Set when
// the squad is uninitialised so that gaps.size === 0 and seedAiTradeOffers
// falls back to random targeting rather than flagging every position as a gap.
function aiSquadPositionGaps(aiSq) {
  if (!aiSq || aiSq.length === 0) return new Set();
  return new Set(Object.keys(squadPositionNeeds(aiSq)));
}

function seedAiTradeOffers(c, league) {
  // Tier 3 is local/community footy — there's no trade market. Players come and
  // go by word of mouth (see the tier-3 recruitment notifications), so no rival
  // club ever tables a formal trade offer.
  if ((league?.tier ?? 1) === 3) return;
  const fieldIds = new Set(
    (c.lineup || [])
      .slice(0, LINEUP_FIELD_COUNT)
      .filter((id) => id != null && id !== '')
      .map((id) => String(id)),
  );
  const tradableSquad = (c.squad || []).filter(
    (p) =>
      p.contract > 0 &&
      p.overall >= 58 &&
      !fieldIds.has(String(p.id)) &&
      p.receivedInTrade !== c.season,
  );
  const offerCount = Math.min(tradableSquad.length, rand(2, 4));
  const pool = competitionClubsForCareer(c);
  const offerClubs = (pool.length ? pool : (league.clubs || [])).filter((cl) => cl.id !== c.clubId);
  const offers = [];
  for (let i = 0; i < offerCount; i++) {
    const offeringClub = pick(offerClubs);
    if (!offeringClub) continue;

    // AI REALISM: The offering club should prioritise players who fill its own
    // positional gaps rather than picking completely at random.
    const aiSq = c.aiSquads?.[offeringClub.id] || [];
    const gaps = aiSquadPositionGaps(aiSq);

    // Split tradable players into those who fill a gap vs the rest.
    const fillsGap = tradableSquad.filter((p) => gaps.has(p.position));
    const others = tradableSquad.filter((p) => !gaps.has(p.position));
    // 70% chance to target a gap-filling player when the club has clear needs.
    const targetPool = gaps.size > 0 && fillsGap.length > 0 && rng() < 0.70
      ? fillsGap
      : (others.length ? others : tradableSquad);
    const targetPlayer = pick(targetPool);

    if (!targetPlayer || offers.find((o) => o.targetPlayerId === targetPlayer.id)) continue;

    const grudge = clubFinalsGrudgeTowardPlayer(c, offeringClub.id);
    if (grudge > 0 && rng() < 0.22 + Math.min(3, grudge) * 0.11) continue;

    // AI REALISM: Swap candidates should ideally come from positions where the
    // player club has surplus (player wants what we have too many of), not just
    // any player within an overall range.
    const swapCandidates = aiSq.filter((ap) => Math.abs(ap.overall - targetPlayer.overall) <= 12).slice(0, 8);
    const swapPlayer = swapCandidates.length ? pick(swapCandidates) : null;
    // AFL trades are players + picks; cash is only a small value-smoothing
    // top-up, never the consideration.
    let cashOffer = Math.round(targetPlayer.value * (0.05 + rng() * 0.12));
    if (grudge > 0) cashOffer = Math.round(cashOffer * (1 - 0.09 * Math.min(grudge, 2)));
    cashOffer = Math.max(0, cashOffer);
    // Draft-pick component — always present when no player is offered back, so
    // the deal is real draft capital rather than cash-for-nothing.
    const targetVal = targetPlayer.value ?? Math.round(targetPlayer.overall * 1500);
    const offeredPick = (!swapPlayer || targetVal > 400000 || rng() < 0.4)
      ? { season: (c.season ?? 2026) + 1, round: targetVal > 700000 ? 1 : targetVal > 400000 ? rand(1, 2) : rand(2, 4) }
      : null;
    // Bidding war: 35% chance a second club is also circling this player.
    // Stored as metadata on the offer — escalates on reject.
    const rivalClubs = offerClubs.filter(cl => cl.id !== offeringClub.id);
    const rival = targetVal > 200_000 && rng() < 0.35 && rivalClubs.length > 0 ? pick(rivalClubs) : null;
    offers.push({
      id: `tp_offer_${Date.now()}_${i}`,
      fromClubId: offeringClub.id,
      fromClubName: offeringClub.name,
      targetPlayerId: targetPlayer.id,
      offerCash: cashOffer,
      offerPlayerId: swapPlayer?.id || null,
      offerPlayerSnapshot: swapPlayer ? tradePlayerSnapshot(swapPlayer) : null,
      offeredPick,
      status: 'pending',
      createdAt: `postseason-${c.tradePeriodDay}`,
      tradePeriod: true,
      // Bidding war metadata
      rivalClubId:   rival?.id   ?? null,
      rivalClubName: rival?.name ?? null,
      bidRound: 1,
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
  syncRecruitPhaseInboxRows(c);
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
  const fromSnapshot = draftPickPositionForClub(c, clubId);
  let approxR1;
  if (fromSnapshot != null) {
    approxR1 = fromSnapshot;
  } else {
    const pool = competitionClubsForCareer(c);
    const rows = pool.length ? pool : (league.clubs || []);
    const ladderRows = (c.ladder?.length ? c.ladder : rows.map((cl) => ({
      id: cl.id, W: 0, L: 0, D: 0, pts: 0, pct: 0, F: 0, A: 0,
    })));
    const sorted = sortedLadder(ladderRows);
    const ladderPos = Math.max(1, sorted.findIndex((r) => r.id === clubId) + 1);
    approxR1 = Math.max(1, sorted.length - ladderPos + 1);
  }
  const approxR2 = Math.min(18, approxR1 + 6);
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

const FA_POSITIONS = ['MID', 'FWD', 'DEF', 'RUC', 'CHF', 'CHB', 'FB', 'HB', 'HF'];

/** Generate a synthetic FA pool after trade period closes. Seeded per season. */
export function generateFreeAgentPool(c, league) {
  seedRng((c.season || 2026) * 503 + 37);
  const tier = league?.tier ?? 1;
  // ponytail: fixed count per tier — upgrade to count based on OOC players if needed
  const count = tier <= 2 ? 4 : 2;
  const pool = [];
  for (let i = 0; i < count; i++) {
    const age = 24 + Math.floor(rng() * 8); // 24–31
    const rating = Math.round(60 + rng() * 20); // 60–80
    const pos = pick(FA_POSITIONS);
    const faType = age >= 28 ? 'UFA' : 'RFA';
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    pool.push({
      id: `fa_pool_${c.season}_${i}`,
      firstName,
      lastName,
      age,
      position: pos,
      overall: rating,
      faType,
      askingWage: Math.round((40000 + rating * 1000) * (tier <= 1 ? 3 : tier <= 2 ? 1.5 : 0.8)),
      contractYearsWanted: age < 28 ? 3 : 2,
      fitness: 85,
      morale: 70,
      form: 65,
      gamesPlayed: 0, goals: 0, disposals: 0, marks: 0, tackles: 0, careerGames: 0,
    });
  }
  return pool;
}

export function buildOffSeasonFreeAgents(c, generatePlayerFn = generatePlayer) {
  seedRng((c.season || 2026) * 401 + 19);
  const out = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const tier = rand(1, 3);
    const p = generatePlayerFn(tier, 12000 + i + (c.season || 0) * 13, {
      clubId: 'freeAgent',
      season: c.season || 2026,
    });
    const ask = Math.round((p.wage || 0) * (0.92 + rng() * 0.2));
    const years = rand(1, 3);
    out.push({
      id: `fa_${c.season}_${i}`,
      source: 'free_agent',
      freeAgentType: p.age >= 28 && (p.gamesPlayed || 0) >= 80 ? 'UFA' : 'RFA',
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
  // Draft pick capital only exists at AFL level — the national draft is tier-1 only.
  c.draftPickBank = league?.tier === 1 ? buildDraftPickBank(c, league) : null;
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
  syncRecruitPhaseInboxRows(c);
  c.news = [
    {
      week: c.week,
      type: 'info',
      text: '📣 Trade period is open — 14 steps to reshape the list. Open Recruit → Trades before advancing (free agency through Day 7).',
    },
    ...(c.news || []),
  ].slice(0, 20);
}

export function closeTradePeriodStartDraftCountdown(c, league) {
  c.inTradePeriod = false;
  c.freeAgencyOpen = false;
  c.postSeasonPhase = 'draft_waiting';
  c.postSeasonDraftCountdown = POST_TRADE_DRAFT_COUNTDOWN_DAYS;
  c.freeAgentPool = generateFreeAgentPool(c, league);
  // Compensation picks — awarded for OOC players (contract=0) who walked out unsigned.
  // ponytail: tier-1 only (draftPickBank is null otherwise); ceiling is 4 comp picks per season.
  if (c.draftPickBank) {
    const lostUFAs = (c.squad || [])
      .filter((p) => (p.contract ?? 1) <= 0 && (p.overall ?? 0) >= 65 && (p.age ?? 99) <= 36)
      .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
      .slice(0, 4);
    if (lostUFAs.length > 0) {
      const ys = String(c.season);
      const arr = [...(c.draftPickBank[ys] || [])];
      lostUFAs.forEach((p, i) => {
        const ovr = p.overall ?? 65;
        const pickRound = ovr >= 82 ? 1 : ovr >= 74 ? 2 : 3;
        const forPlayer = `${p.firstName} ${p.lastName}`;
        const pick = makePick({
          id: `comp_${c.season}_${i}_${Date.now()}`,
          season: c.season,
          round: pickRound,
          selection: 38 + i * 4,
          clubId: c.clubId,
          type: 'compensation',
          tradeable: false,
        });
        pick.forPlayer = forPlayer;
        arr.push(pick);
        c.news = [
          {
            week: c.week,
            type: 'info',
            text: `📋 Compensation pick awarded: Round ${pickRound} pick for losing ${forPlayer} to free agency.`,
          },
          ...(c.news || []),
        ].slice(0, 25);
      });
      c.draftPickBank[ys] = arr;
    }
  }
  c.pendingTradeOffers = (c.pendingTradeOffers || []).filter((o) => o.status !== 'pending');
  syncRecruitPhaseInboxRows(c);
  // Deadline passed drama — dramatic news summary
  const tradesCompleted = (c.tradeHistory || []).filter((t) => t.season === c.season).length;
  const deadlineLines = [
    `🔔 Trade deadline has passed. The window is shut — ${tradesCompleted} trade${tradesCompleted !== 1 ? 's' : ''} completed this period.`,
    `🔔 Deadline Day is done. ${tradesCompleted > 0 ? `Your club got ${tradesCompleted} deal${tradesCompleted !== 1 ? 's' : ''} over the line.` : 'No trades completed — the list stays as is.'}`,
    `🔔 The trade siren has sounded. What's done is done — clubs must now work with what they have until the mid-season period.`,
  ];
  c.news = [{ week: c.week, type: 'info', text: pick(deadlineLines) }, ...(c.news || [])].slice(0, 25);
  c.deadlineDayActive = false;
  c.news = [
    {
      week: c.week,
      type: 'info',
      text: `✅ Trade Period closed. ${c.draftPickBank ? 'National Draft / list reset' : 'List reset'} in ${POST_TRADE_DRAFT_COUNTDOWN_DAYS} steps — keep advancing from the Hub.`,
    },
    ...(c.news || []),
  ].slice(0, 20);
}

export function advanceTradePeriodDay(c, league, _leagueKey) {
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
  if (day === DEADLINE_DAY) {
    c.deadlineDayActive = true;
    c.news = [
      { week: c.week ?? 0, type: 'warning', text: '🚨 DEADLINE DAY — the trade window closes tonight. Clubs are getting desperate. Act fast or lose your targets.' },
      ...(c.news ?? [])
    ].slice(0, 25);
    // Last-minute collapse: 20% chance a deal-that-fell-through headline fires
    if (rng() < 0.20) {
      const collapseLines = [
        '📰 BREAKING: A last-minute trade involving a key forward has reportedly collapsed — both clubs walked away.',
        '📰 Shock development: A three-way deal between rival clubs fell apart at the 11th hour. The players involved will stay put.',
        '📰 Sources confirm a late push to land a star midfielder failed — the club\'s offer was rejected minutes before the deadline.',
      ];
      c.news = [{ week: c.week, type: 'press', text: pick(collapseLines) }, ...(c.news || [])].slice(0, 25);
    }
  }
  if (day >= TRADE_PERIOD_DAYS) {
    closeTradePeriodStartDraftCountdown(c, league);
    return;
  }
  // AI offer frequency: 30% higher on deadline day (clubs desperate to get deals done)
  const aiOfferChance = c.deadlineDayActive ? 0.62 * 1.30 : 0.62;
  if (rng() < aiOfferChance) seedAiTradeOffers(c, league);
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
  c.freeAgentPool = [];
  c.draftPickBank = null;
  c.deadlineDayActive = false;
}

export function playerBlockedFromTrade(player, season) {
  return player && player.receivedInTrade != null && player.receivedInTrade === season;
}
