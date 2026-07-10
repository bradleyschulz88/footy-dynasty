// Board hook - handles board meetings, confidence votes, objectives
// Extracted from AFLManager.jsx and careerAdvance.js

import { useCallback, useRef } from 'react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';
import { PYRAMID, findClub } from '../data/pyramid.js';
import { 
  ensureCareerBoard, 
  recalcBoardConfidence, 
  applyVoteSurvivalMutate, 
  resolveRoutineBoardMeeting,
  alignBoardMembersToTarget,
  applyMemberConfidenceDelta,
} from '../lib/board.js';
import { triggerSackState } from '../lib/careerAdvance.js';

interface UseBoardOptions {
  setScreen: (screen: string) => void;
  setTab: (tab: string | null) => void;
}

export function useBoard({ setScreen, setTab }: UseBoardOptions) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();

  const shellRef = useRef({ career: null, setCareer: updateCareer, setScreen, setTab });
  shellRef.current = { career, setCareer: updateCareer, setScreen, setTab };

  // Handle board meeting resolution
  const resolveBoardMeeting = useCallback((outcome: 'survive' | 'sacked') => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c || !c.boardMeetingBlocking) return;
    
    const club = findClub(c.clubId);
    const league = PYRAMID[c.leagueKey];
    
    if (outcome === 'sacked') {
      applyVoteSurvivalMutate(c, { sacked: true });
      triggerSackState(c, club?.name || 'Club', c.week ?? 0);
    } else {
      applyVoteSurvivalMutate(c, { sacked: false });
    }
    
    sc(c);
    setScreen('hub');
    setTab(null);
  }, [setScreen, setTab]);

  // Handle routine board meeting
  const handleRoutineMeeting = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c || !c.boardMeetingBlocking) return;
    
    const club = findClub(c.clubId);
    const league = PYRAMID[c.leagueKey];
    resolveRoutineBoardMeeting(c, club, league);
    sc(c);
    setScreen('hub');
    setTab(null);
  }, [setScreen, setTab]);

  // Recalculate board confidence
  const recalculateConfidence = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    
    recalcBoardConfidence(c);
    sc(c);
  }, []);

  // Apply confidence delta
  const applyConfidenceDelta = useCallback((delta: number) => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c) return;
    
    applyMemberConfidenceDelta(c, delta);
    sc(c);
  }, []);

  return {
    resolveBoardMeeting,
    handleRoutineMeeting,
    recalculateConfidence,
    applyConfidenceDelta,
  };
}