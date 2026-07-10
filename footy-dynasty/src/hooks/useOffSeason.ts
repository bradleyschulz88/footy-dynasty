// Off-season hook - handles trade period, draft, free agency, youth academy
// Extracted from AFLManager.jsx and RecruitScreen.jsx

import { useCallback, useRef } from 'react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';
import { PYRAMID, findClub } from '../data/pyramid.js';
import { beginPostSeasonTradePeriod, advanceTradePeriodDay, advanceDraftCountdown, clearPostSeasonTransient } from '../lib/tradePeriod.js';
import { seedNationalDraft, careerHasNationalDraft } from '../lib/draftSeed.js';
import { generateOffseasonNotifications } from '../lib/notifications.js';
import { applyLeagueTradeNews } from '../lib/tradeEngine.js';
import { playReservesRound } from '../lib/reserves.js';
import { generateTradePool } from '../lib/defaults.js';
import { getCompetitionClubs } from '../lib/leagueEngine.js';

interface UseOffSeasonOptions {
  setScreen: (screen: string) => void;
  setTab: (tab: string | null) => void;
}

export function useOffSeason({ setScreen, setTab }: UseOffSeasonOptions) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();

  const shellRef = useRef({ career: null, setCareer: updateCareer, setScreen, setTab });
  shellRef.current = { career, setCareer: updateCareer, setScreen, setTab };

  // Start the post-season trade period
  const startTradePeriod = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    
    const league = PYRAMID[c.leagueKey];
    const club = findClub(c.clubId);
    beginPostSeasonTradePeriod(c, league, club);
    sc(c);
  }, []);

  // Advance trade period by one day
  const advanceTradeDay = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c || !c.inTradePeriod) return;
    
    advanceTradePeriodDay(c);
    applyLeagueTradeNews(c, PYRAMID[c.leagueKey]);
    sc(c);
  }, []);

  // Advance draft countdown
  const advanceDraft = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    
    advanceDraftCountdown(c);
    sc(c);
  }, []);

  // Clear post-season transient state
  const clearPostSeason = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    
    clearPostSeasonTransient(c);
    sc(c);
  }, []);

  // Generate off-season notifications
  const generateNotifications = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    
    const notifications = generateOffseasonNotifications(c);
    if (notifications.length > 0) {
      c.inbox = [...(c.inbox || []), ...notifications].slice(0, 50);
      sc(c);
    }
  }, []);

  // Start national draft
  const startNationalDraft = useCallback(() => {
    const { career: c, setCareer: sc, setScreen: ss, setTab: st } = shellRef.current;
    if (!c) return;
    
    const league = PYRAMID[c.leagueKey];
    seedNationalDraft(c, league, { inaugural: false, force: true });
    ss('draft');
    st('draftRoom');
    sc(c);
  }, []);

  // Play reserves round
  const playReserves = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    
    const league = PYRAMID[c.leagueKey];
    playReservesRound(c, league);
    sc(c);
  }, []);

  return {
    startTradePeriod,
    advanceTradeDay,
    advanceDraft,
    clearPostSeason,
    generateNotifications,
    startNationalDraft,
    playReserves,
  };
}