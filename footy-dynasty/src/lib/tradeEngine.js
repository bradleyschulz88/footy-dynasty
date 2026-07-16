// AI trade offer generation — personality-driven (extracted from tradePeriod / careerAdvance).

import { rand, rng, pick } from './rng.js';
import { findClub } from '../data/pyramid.js';
import { clubFinalsGrudgeTowardPlayer } from './finalsRivalry.js';
import { aiPersonalityForClub } from './aiPersonality.js';
import { sortedLadder, competitionClubsForCareer } from './leagueEngine.js';
import { LINEUP_FIELD_COUNT } from './lineupHelpers.js';
import { tradePlayerSnapshot } from './tradePeriod.js';
import { pushNews } from './news.js';

/**
 * Generate inbound trade offers for the player club.
 * @param {object} c career (mutated for news only if pushNews used externally)
 * @param {object} league
 * @returns {object[]}
 */
export function generateAiTradeOffers(c, league) {
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
  if (!tradableSquad.length) return [];

  const ladder = sortedLadder(c.ladder || []);
  const myPos = ladder.findIndex((r) => r.id === c.clubId) + 1;
  const rebuilding = myPos > Math.ceil(ladder.length * 0.6);

  const pool = competitionClubsForCareer(c);
  const offerClubs = (pool.length ? pool : league.clubs || []).filter((cl) => cl.id !== c.clubId);

  const baseCount = rand(2, 4);
  const offers = [];

  for (const offeringClub of offerClubs) {
    if (offers.length >= baseCount) break;
    const { tradeAggression } = aiPersonalityForClub(offeringClub.id);
    const grudge = clubFinalsGrudgeTowardPlayer(c, offeringClub.id);
    if (grudge > 0 && rng() < 0.22 + Math.min(3, grudge) * 0.11) continue;
    const aggMult = 0.6 + tradeAggression * 1.4;
    if (rng() > 0.35 * aggMult) continue;

    const targetPlayer = pick(tradableSquad);
    if (!targetPlayer || offers.find((o) => o.targetPlayerId === targetPlayer.id)) continue;

    const aiSq = c.aiSquads?.[offeringClub.id] || [];
    const swapCandidates = aiSq
      .filter((ap) => Math.abs(ap.overall - targetPlayer.overall) <= 10 + tradeAggression * 8)
      .slice(0, 8);
    const swapPlayer = swapCandidates.length ? pick(swapCandidates) : null;

    // AFL trades are players + picks — cash can't be the consideration. Keep a
    // small cash "top-up" only to smooth value gaps, and guarantee real draft
    // capital: any offer without a player swap must include a pick.
    let cashOffer = Math.round(targetPlayer.value * (0.05 + rng() * 0.10) * aggMult);
    if (grudge > 0) cashOffer = Math.round(cashOffer * (1 - 0.09 * Math.min(grudge, 2)));
    if (rebuilding && targetPlayer.age >= 30) cashOffer = Math.round(cashOffer * 1.10);

    // Draft-pick component: better pick for pricier targets; always present when
    // no player is offered in return, so it's never cash-for-nothing.
    const targetVal = targetPlayer.value ?? Math.round(targetPlayer.overall * 1500);
    const wantsPick = !swapPlayer || targetVal > 400000 || rng() < 0.4;
    const offeredPick = wantsPick
      ? { season: (c.season ?? 2026) + 1, round: targetVal > 700000 ? 1 : targetVal > 400000 ? rand(1, 2) : rand(2, 4) }
      : null;

    offers.push({
      id: `trade_${offeringClub.id}_${targetPlayer.id}_${c.season}`,
      fromClubId: offeringClub.id,
      fromClubShort: offeringClub.short || findClub(offeringClub.id)?.short,
      targetPlayerId: targetPlayer.id,
      targetPlayer: tradePlayerSnapshot(targetPlayer),
      offeredPlayer: swapPlayer ? tradePlayerSnapshot(swapPlayer) : null,
      cashOffer: Math.max(0, cashOffer),
      offeredPick,
      expiresWeek: (c.week ?? 0) + rand(2, 5),
    });
  }

  return offers;
}

/** League-wide AI-AI trade headline (flavour). */
export function maybeLeagueTradeNews(c, league) {
  const clubs = (league.clubs || []).filter((cl) => cl.id !== c.clubId);
  if (!clubs.length || rng() > 0.22) return null;
  const a = pick(clubs);
  let b = pick(clubs);
  if (b.id === a.id) b = clubs.find((cl) => cl.id !== a.id) || a;
  return {
    week: c.week,
    type: 'info',
    text: `📰 League: ${a.short} and ${b.short} reportedly negotiating a player swap.`,
  };
}

export function applyLeagueTradeNews(c, league) {
  const entry = maybeLeagueTradeNews(c, league);
  if (entry) pushNews(c, entry);
}
