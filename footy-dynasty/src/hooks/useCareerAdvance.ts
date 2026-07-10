// Career advance hook - extracted from AFLManager.jsx
// Handles all career advancement logic: next event, quick advance, match day, etc.

import { useCallback, useRef } from 'react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';
import { 
  advanceCareerNextEvent, 
  resolveLiveMatchHalfTime, 
  resolveQ3Decision, 
  triggerSackState, 
  fastForwardFinals 
} from '../lib/careerAdvance.js';
import { getVisibleAdvanceAgenda, snoozeAdvanceAgendaItems } from '../lib/advanceAgenda.js';
import { advanceBlockedByCareerNeeds, applyCareerPatch, buildMatchDayExitPatch } from '../lib/inbox.js';
import { PYRAMID, findClub } from '../data/pyramid.js';

function resolveLeague(leagueKey: string) {
  return PYRAMID[leagueKey] ?? PYRAMID['AFL'] ?? Object.values(PYRAMID).find((l) => l?.tier);
}

interface UseCareerAdvanceOptions {
  setScreen: (screen: string) => void;
  setTab: (tab: string | null) => void;
  setShowPostMatch: (show: boolean) => void;
  setAdvanceAgendaOpen: (open: boolean) => void;
  setAdvanceAgendaItems: (items: any[]) => void;
  acceptNewJob: (offer: any) => void;
}

export function useCareerAdvance({
  setScreen,
  setTab,
  setShowPostMatch,
  setAdvanceAgendaOpen,
  setAdvanceAgendaItems,
  acceptNewJob,
}: UseCareerAdvanceOptions) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();

  // Ref to avoid stale closures in callbacks
  const shellRef = useRef({ career: null, setCareer: updateCareer, setScreen, setTab });
  shellRef.current = { career, setCareer: updateCareer, setScreen, setTab };

  // Main advance function - advances to next event
  const advanceToNextEvent = useCallback(() => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!c?.clubId) return;
    
    const advClub = findClub(c.clubId);
    const advLeague = resolveLeague(c.leagueKey);
    advanceCareerNextEvent({ career: c, league: advLeague, club: advClub, setCareer: sc, setScreen: ss, setTab: st });
  }, []);

  // Quick advance - batches through training days
  const quickAdvance = useCallback(() => {
    const { career: start, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!start?.clubId) return;
    
    let cur = start;
    let navScreen = null;
    for (let i = 0; i < 30; i++) {
      const nextEv = (cur.eventQueue || []).find((e: any) => !e.completed);
      if (!nextEv) {
        if (i === 0) advanceToNextEvent();
        return;
      }
      
      let result: any = null;
      advanceCareerNextEvent({
        career: cur,
        league: resolveLeague(cur.leagueKey),
        club: findClub(cur.clubId),
        setCareer: (c) => { result = c; },
        setScreen: (s) => { if (s !== 'hub') navScreen = s; },
        setTab: st,
      });
      
      if (!result) break;
      cur = result;
      
      const stop = navScreen ||
        cur.inMatchDay || cur.liveMatch || cur.isSacked || cur.gameOver ||
        cur.showSeasonSummary || cur.boardCrisis?.phase === 'active' ||
        cur.boardMeetingBlocking || cur.inFinals ||
        (cur.postSeasonPhase === 'trade_period' && cur.inTradePeriod) ||
        advanceBlockedByCareerNeeds(cur) ||
        nextEv.type !== 'training';
      
      if (stop) break;
    }
    sc(cur);
    if (navScreen) ss(navScreen);
  }, [advanceToNextEvent]);

  // Request advance with agenda check
  const requestAdvance = useCallback(() => {
    const { career: c } = shellRef.current;
    if (!c?.clubId) return;
    if (advanceBlockedByCareerNeeds(c)) return;
    
    const advLeague = resolveLeague(c.leagueKey);
    const items = getVisibleAdvanceAgenda(c, advLeague);
    if (items.length > 0) {
      setAdvanceAgendaItems(items);
      setAdvanceAgendaOpen(true);
      return;
    }
    advanceToNextEvent();
  }, [advanceToNextEvent, setAdvanceAgendaItems, setAdvanceAgendaOpen]);

  // Handle agenda close
  const handleAdvanceAgendaClose = useCallback(() => {
    setAdvanceAgendaOpen(false);
    setAdvanceAgendaItems([]);
  }, [setAdvanceAgendaOpen, setAdvanceAgendaItems]);

  // Handle agenda "advance anyway"
  const handleAdvanceAgendaAnyway = useCallback((snooze: boolean, itemIds: string[]) => {
    setAdvanceAgendaOpen(false);
    setAdvanceAgendaItems([]);
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!c?.clubId) return;
    
    const nextCareer = snooze && itemIds?.length 
      ? { ...c, ...snoozeAdvanceAgendaItems(c, itemIds) } 
      : c;
    const advClub = findClub(nextCareer.clubId);
    const advLeague = resolveLeague(nextCareer.leagueKey);
    advanceCareerNextEvent({
      career: nextCareer,
      league: advLeague,
      club: advClub,
      setCareer: sc,
      setScreen: ss,
      setTab: st,
    });
  }, [setAdvanceAgendaOpen, setAdvanceAgendaItems]);

  // Handle agenda item navigation
  const handleAdvanceAgendaGoTo = useCallback((item: any) => {
    setAdvanceAgendaOpen(false);
    setAdvanceAgendaItems([]);
    setScreen(item.screen);
    setTab(item.tab ?? null);
  }, [setAdvanceAgendaOpen, setAdvanceAgendaItems, setScreen, setTab]);

  // Complete match day
  const completeMatchDay = useCallback((autoAdvanceCalendar = false) => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!c?.clubId || c.liveMatch) return;
    
    const patched = applyCareerPatch(c, buildMatchDayExitPatch);
    const isPreseason = !!c.currentMatchResult?.isPreseason;
    const isFinals = !!c.currentMatchResult?.isFinals;
    
    if (!autoAdvanceCalendar || isPreseason || isFinals) {
      let next = patched;
      if (isFinals && patched.finalsEliminated) {
        next = { ...next, showFinalsEliminated: true };
      }
      if (isFinals && (patched.finalsAlive || []).length === 1) {
        const advClub = findClub(patched.clubId);
        const advLeague = resolveLeague(patched.leagueKey);
        advanceCareerNextEvent({
          career: next,
          league: advLeague,
          club: advClub,
          setCareer: sc,
          setScreen: ss,
          setTab: st,
        });
        return;
      }
      sc(next);
      return;
    }
    
    const advClub = findClub(patched.clubId);
    const advLeague = resolveLeague(patched.leagueKey);
    advanceCareerNextEvent({
      career: patched,
      league: advLeague,
      club: advClub,
      setCareer: sc,
      setScreen: ss,
      setTab: st,
    });
  }, []);

  // Handle half-time coaching call
  const handleHalfTimeCall = useCallback((callId: string) => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c?.liveMatch) return;
    resolveLiveMatchHalfTime({
      career: c,
      league: resolveLeague(c.leagueKey),
      club: findClub(c.clubId),
      callId,
      setCareer: sc,
    });
  }, []);

  // Handle Q3 decision
  const handleQ3Decision = useCallback(({ callId, subOutId, subInId }: { callId: string; subOutId: string; subInId: string }) => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c?.liveMatch || c.liveMatch.matchPhase !== 'after_q3') return;
    resolveQ3Decision({
      career: c,
      league: resolveLeague(c.leagueKey),
      club: findClub(c.clubId),
      callId,
      subOutId,
      subInId,
      setCareer: sc,
    });
  }, []);

  // Handle post-match continue
  const handlePostMatchContinue = useCallback(() => {
    setShowPostMatch(false);
    const isFinals = career.currentMatchResult?.isFinals;
    completeMatchDay(!isFinals);
  }, [career, setShowPostMatch, completeMatchDay]);

  // Trigger sacking sequence
  const handleSacking = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c?.clubId) return;
    triggerSackState(c, findClub(c.clubId)?.name || 'Club', c.week ?? 0);
  }, []);

  // Accept new job after sacking
  const handleAcceptJob = useCallback((offer: any) => {
    acceptNewJob(offer);
  }, [acceptNewJob]);

  // Fast-forward finals
  const handleFastForwardFinals = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c?.clubId) return;
    const next = fastForwardFinals(c, resolveLeague(c.leagueKey));
    sc(next);
  }, []);

  return {
    advanceToNextEvent,
    quickAdvance,
    requestAdvance,
    completeMatchDay,
    handleHalfTimeCall,
    handleQ3Decision,
    handlePostMatchContinue,
    handleSacking,
    handleFastForwardFinals,
    handleAcceptJob,
    handleAdvanceAgendaClose,
    handleAdvanceAgendaAnyway,
    handleAdvanceAgendaGoTo,
  };
}