// Opposition scouting — pre-match intel for next fixture.

import { findClub } from '../data/pyramid.js';
import { teamRating, aiClubRating } from './matchEngine.js';
import { selectAiLineup, ensureSquadsForLeague } from './aiSquads.js';
import { resolveAiOppTactic, aiPersonalityForClub } from './aiPersonality.js';
import { sortedLadder } from './leagueEngine.js';
import { isDerbyMatch } from './derbies.js';

const SCOUT_COST = 15_000;
const NEUTRAL_TRAINING = { intensity: 60, focus: {} };

function nextRoundMatch(career) {
  const ev = (career.eventQueue || []).find((e) => !e.completed && e.type === 'round');
  if (!ev?.matches) return null;
  const m = ev.matches.find((m2) => m2.home === career.clubId || m2.away === career.clubId);
  if (!m) return null;
  const isHome = m.home === career.clubId;
  const oppId = isHome ? m.away : m.home;
  return { ev, m, isHome, oppId, opp: findClub(oppId) };
}

function formLastN(ladderRow, n = 5) {
  const rec = ladderRow?.form || '';
  return rec.slice(-n) || '—';
}

function keyPlayers(squad, n = 3) {
  return [...(squad || [])]
    .sort((a, b) => (b.overall ?? 0) - (a.overall ?? 0))
    .slice(0, n)
    .map((p) => `${p.firstName?.[0] || ''}. ${p.lastName || 'Player'} (${p.position}, ${p.overall})`);
}

/**
 * Build opposition report for match preview (no spend required for basic tier).
 * @param {object} career
 * @param {object} league
 * @param {{ tier?: number }} [opts] tier 0=basic, 1=scout paid, 2=analyst max
 */
export function buildOppositionReport(career, league, opts = {}) {
  const fx = nextRoundMatch(career);
  if (!fx) return null;

  const { oppId, opp, isHome, ev } = fx;
  const aiSquads = ensureSquadsForLeague(career, league);
  const oppSquad = aiSquads?.[oppId] || [];
  const oppLineup = oppSquad.length ? selectAiLineup(oppSquad) : [];
  const oppRating = oppSquad.length
    ? teamRating(oppSquad, oppLineup.map((p) => p.id), NEUTRAL_TRAINING, 1, 60)
    : aiClubRating(oppId, league.tier);

  const myRating = teamRating(
    career.squad,
    career.lineup,
    career.training,
    1,
    60,
  );

  const ladder = sortedLadder(career.ladder || []);
  const oppRow = ladder.find((r) => r.id === oppId);
  const myRow = ladder.find((r) => r.id === career.clubId);
  const oppTactic = resolveAiOppTactic(oppId, oppRating, myRating);
  const personality = aiPersonalityForClub(oppId);

  const scoutTier = opts.tier ?? (career.opponentScout?.[oppId]?.tier ?? 0);
  const injured = oppSquad.filter((p) => (p.injured ?? 0) > 0).length;

  const report = {
    oppId,
    oppShort: opp?.short || oppId,
    round: ev.round,
    isHome,
    isDerby: isDerbyMatch(isHome ? career.clubId : oppId, isHome ? oppId : career.clubId),
    ladderPos: ladder.findIndex((r) => r.id === oppId) + 1,
    oppRating: scoutTier >= 1 ? oppRating.toFixed(1) : `${Math.round(oppRating / 5) * 5}±`,
    oppTactic,
    preferredTactic: personality.preferredTactic,
    form: formLastN(oppRow),
    myForm: formLastN(myRow),
    injuredCount: scoutTier >= 1 ? injured : null,
    keyPlayers: scoutTier >= 2 ? keyPlayers(oppSquad) : null,
    matchupNote:
      oppRating > myRating + 5
        ? 'They rate stronger on paper — consider defensive shape.'
        : oppRating < myRating - 5
          ? 'You hold the edge — press or run could exploit gaps.'
          : 'Even matchup — tactics and home ground may decide it.',
  };
  return report;
}

/** Spend cash to deepen scout intel on next opponent. Returns patch or null. */
export function runOppositionScoutPatch(career, league) {
  const fx = nextRoundMatch(career);
  if (!fx) return null;
  const cash = career.cash ?? 0;
  if (cash < SCOUT_COST) return null;

  const prev = career.opponentScout?.[fx.oppId]?.tier ?? 0;
  const nextTier = Math.min(2, prev + 1);
  if (nextTier === prev) return null;

  return {
    cash: cash - SCOUT_COST,
    opponentScout: {
      ...(career.opponentScout || {}),
      [fx.oppId]: { tier: nextTier, season: career.season, round: fx.ev.round },
    },
    news: [{
      week: career.week,
      type: 'info',
      text: `🔍 Opposition scout filed on ${fx.opp?.short || fx.oppId} (tier ${nextTier}/2).`,
    }, ...(career.news || [])].slice(0, 20),
  };
}

export { SCOUT_COST };
