import React, { useMemo } from 'react';
import { Shirt, Dumbbell, UserSearch } from 'lucide-react';
import { findClub, findLeagueOf } from '../../data/pyramid.js';
import { getClubGround } from '../../data/grounds.js';
import { formatDate, TRAINING_INFO } from '../../lib/calendar.js';
import { getAdvanceContext } from '../../lib/advanceContext.js';
import { Jersey } from '../primitives.jsx';

function nextMatchEvent(career) {
  return (career.eventQueue || []).find(
    (e) => !e.completed && (e.type === 'round' || e.type === 'preseason_match'),
  );
}

function ladderOrdinal(n) {
  if (!n || n <= 0) return '—';
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}ST`;
  if (j === 2 && k !== 12) return `${n}ND`;
  if (j === 3 && k !== 13) return `${n}RD`;
  return `${n}TH`;
}

function resolveNextMatch(career) {
  const ev = nextMatchEvent(career);
  if (!ev) return null;
  const selfClub = findClub(career.clubId);
  const league = findLeagueOf(career.clubId);
  const tier = league?.tier ?? 2;
  const stadiumLevel = typeof career.facilities?.stadium === 'object'
    ? (career.facilities?.stadium?.level ?? 1)
    : (career.facilities?.stadium ?? 1);

  if (ev.type === 'round') {
    const m = (ev.matches || []).find((m2) => m2.home === career.clubId || m2.away === career.clubId);
    if (!m) return null;
    const isHome = m.home === career.clubId;
    const opp = findClub(isHome ? m.away : m.home);
    if (!opp) return null;
    const groundClub = isHome ? selfClub : opp;
    const g = groundClub ? getClubGround(groundClub, stadiumLevel, tier) : null;
    const venue = isHome ? (g?.shortName || g?.name || 'Home') : (g?.shortName || g?.name || `${opp.short}`);
    return {
      opp,
      isHome,
      vsLabel: `VS ${opp.name.toUpperCase()}`,
      metaLine: `${venue.toUpperCase()} · ${formatDate(ev.date).toUpperCase()}`,
      event: ev,
    };
  }

  const isHome = ev.homeId === career.clubId;
  const oppId = isHome ? ev.awayId : ev.homeId;
  const opp = findClub(oppId);
  if (!opp) return null;
  const groundClub = isHome ? selfClub : opp;
  const g = groundClub ? getClubGround(groundClub, stadiumLevel, tier) : null;
  const venue = g?.shortName || g?.name || (isHome ? 'Home' : 'Away');
  return {
    opp,
    isHome,
    vsLabel: `VS ${opp.name.toUpperCase()}`,
    metaLine: `${venue.toUpperCase()} · ${formatDate(ev.date).toUpperCase()}`,
    event: ev,
  };
}

/**
 * Layout aligned with `stitch/club_dashboard/screen.png` — centred hub title,
 * club row, NEXT MATCH hero card, action rows, primary advance CTA.
 */
export default function StitchClubDashboard({
  career,
  club,
  league,
  myLadderPos,
  myRow,
  setScreen,
  setTab,
  onAdvance,
}) {
  const advanceCtx = getAdvanceContext(career, league);
  const next = useMemo(() => resolveNextMatch(career), [career]);

  const nextTrain = (career.eventQueue || []).find((e) => !e.completed && e.type === 'training');
  const trainSub = nextTrain
    ? (TRAINING_INFO[nextTrain.subtype]?.name || 'SESSION').toUpperCase()
    : 'NO SESSION SCHEDULED';

  const lineupN = (career.lineup || []).length;
  const teamReady = lineupN >= 18;

  const recruitN = (career.tradePool || []).length;
  const showRecruitBadge = recruitN > 0;

  const ladderLine = myRow
    ? `LADDER: ${ladderOrdinal(myLadderPos)} (${myRow.W}W-${myRow.L}L)`
    : 'LADDER: —';

  const primaryCta = next ? 'PLAY MATCH' : advanceCtx.buttonLabel.toUpperCase();

  return (
    <div className="space-y-4">
      <div className="stitch-mock-hub-heading">CLUB DASHBOARD</div>
      <div className="stitch-mock-hub-line" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border border-[rgba(200,255,61,0.35)]"
            style={{ background: 'linear-gradient(135deg, rgba(200,255,61,0.12), transparent)' }}
          >
            <Jersey kit={career.kits.home} size={52} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-2xl sm:text-3xl md:text-4xl text-atext tracking-wide leading-none uppercase truncate">
              {club.name}
            </div>
            <div className="text-xs text-atext-mute font-mono mt-1.5 tracking-wide uppercase">{ladderLine}</div>
          </div>
        </div>
      </div>

      {next && (
        <div className="stitch-mock-next-card">
          <div className="stitch-mock-next-title">NEXT MATCH</div>
          <div className="flex items-center justify-center gap-4 md:gap-8 mb-3">
            <div className="flex flex-col items-center gap-1">
              <div className="rounded-lg border border-[rgba(200,255,61,0.35)] p-1 bg-[rgba(0,0,0,0.25)]">
                <Jersey kit={career.kits.home} size={48} />
              </div>
              <span className="text-[10px] font-mono text-atext-mute uppercase">{club.short}</span>
            </div>
            <div className="text-center min-w-0 flex-1">
              <div className="font-display text-xl md:text-2xl text-atext tracking-wide leading-tight">
                {next.vsLabel}
              </div>
              <div className="text-[11px] text-atext-mute font-mono mt-1 uppercase tracking-wider">{next.metaLine}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-display text-sm border border-[rgba(200,255,61,0.35)]"
                style={{
                  background: `linear-gradient(135deg,${next.opp.colors[0]},${next.opp.colors[1]})`,
                  color: next.opp.colors[2],
                }}
              >
                {next.opp.short}
              </div>
              <span className="text-[10px] font-mono text-atext-mute uppercase">{next.opp.short}</span>
            </div>
          </div>
          <button type="button" className="stitch-mock-btn-primary" onClick={onAdvance}>
            {primaryCta}
          </button>
        </div>
      )}

      {!next && (
        <div className="stitch-mock-next-card">
          <div className="stitch-mock-next-title">SCHEDULE</div>
          <p className="text-sm text-atext-dim text-center mb-4 font-mono uppercase tracking-wider">
            No fixture queued · advance the calendar
          </p>
          <button type="button" className="stitch-mock-btn-primary" onClick={onAdvance}>
            {primaryCta}
          </button>
        </div>
      )}

      <div className="mt-2 space-y-0">
        <div className="stitch-mock-action-card">
          <div className="stitch-mock-action-icon">
            <Shirt className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-atext uppercase tracking-wide">Team selection</div>
            <div className={`text-[11px] font-mono uppercase mt-0.5 ${teamReady ? 'text-aaccent' : 'text-atext-mute'}`}>
              Status: {teamReady ? 'Ready' : `Need ${Math.max(0, 18 - lineupN)} more`}
            </div>
          </div>
          <button
            type="button"
            className="stitch-mock-btn-ghost"
            onClick={() => {
              setScreen('squad');
              setTab('players');
            }}
          >
            Manage
          </button>
        </div>

        <div className="stitch-mock-action-card">
          <div className="stitch-mock-action-icon">
            <Dumbbell className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-atext uppercase tracking-wide">Training</div>
            <div className="text-[11px] text-atext-mute font-mono uppercase mt-0.5">{trainSub}</div>
          </div>
          <button
            type="button"
            className="stitch-mock-btn-ghost"
            onClick={() => {
              setScreen('squad');
              setTab('training');
            }}
          >
            View schedule
          </button>
        </div>

        <div className="stitch-mock-action-card relative">
          {showRecruitBadge && (
            <div className="absolute -top-2 right-4 stitch-mock-badge">
              {recruitN > 99 ? '99+' : recruitN} ON MARKET
            </div>
          )}
          <div className="stitch-mock-action-icon">
            <UserSearch className="w-5 h-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-atext uppercase tracking-wide">Recruitment</div>
            <div className="text-[11px] text-atext-mute font-mono uppercase mt-0.5">Trades &amp; list</div>
          </div>
          <button type="button" className="stitch-mock-btn-ghost" onClick={() => setScreen('recruit')}>
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}
