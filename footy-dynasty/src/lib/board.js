// Executive board (staged MVP): weighted members drive finance.boardConfidence.
import { pick, rand } from "./rng.js";
import { FIRST_NAMES, LAST_NAMES } from "./playerGen.js";
import { clamp } from "./format.js";
import { sortedLadder } from "./leagueEngine.js";
import { findClub, PYRAMID } from "../data/pyramid.js";

const BOARD_ROLE_DEFS = [
  { role: "Chairman", weight: 2.0, priority: "results", personality: "demanding" },
  { role: "Football Director", weight: 1.5, priority: "football", personality: "analytical" },
  { role: "Finance Director", weight: 1.5, priority: "finance", personality: "conservative" },
  { role: "Community Director", weight: 1.0, priority: "community", personality: "enthusiastic" },
  { role: "Player Relations Director", weight: 1.0, priority: "players", personality: "empathetic" },
];

export function defaultBoardShell() {
  return {
    members: [],
    objectives: [],
    contractYears: 2,
    contractSalary: 120_000,
    lastReviewSeason: null,
    warningIssued: false,
    voteScheduled: false,
  };
}

/** Generate named executive board members for a club. */
export function generateBoardMembers(_club, _league) {
  return BOARD_ROLE_DEFS.map((r) => ({
    ...r,
    name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    confidence: rand(55, 75),
    mood: "neutral",
    lastMessage: null,
  }));
}

export function weightedBoardConfidence(members) {
  if (!members?.length) return 55;
  const tw = members.reduce((a, m) => a + m.weight, 0);
  const ws = members.reduce((a, m) => a + m.confidence * m.weight, 0);
  return clamp(Math.round(ws / tw), 0, 100);
}

/** Shift all member confidences so weighted average matches `target` (0–100). */
export function alignBoardMembersToTarget(board, target) {
  const members = board?.members;
  if (!members?.length) return;
  const tw = members.reduce((a, m) => a + m.weight, 0);
  const cur = members.reduce((a, m) => a + m.confidence * m.weight, 0) / tw;
  const delta = clamp(target, 0, 100) - cur;
  members.forEach((m) => {
    m.confidence = clamp(m.confidence + delta, 0, 100);
  });
}

export function recalcBoardConfidence(career) {
  const members = career.board?.members;
  if (!members?.length) return;
  career.finance = career.finance || {};
  career.finance.boardConfidence = weightedBoardConfidence(members);
  members.forEach((m) => {
    m.mood = m.confidence >= 70 ? "warm" : m.confidence >= 40 ? "neutral" : "critical";
  });
}

export function applyBoardConfidenceDelta(career, delta) {
  if (!delta) return;
  if (!career.board?.members?.length) {
    career.finance = career.finance || {};
    career.finance.boardConfidence = clamp((career.finance.boardConfidence ?? 55) + delta, 0, 100);
    return;
  }
  const members = career.board.members;
  members.forEach((m) => {
    m.confidence = clamp(m.confidence + delta, 0, 100);
  });
  recalcBoardConfidence(career);
}

export function applyMemberConfidenceDelta(career, role, delta) {
  if (!delta || !career.board?.members?.length) return;
  const m = career.board.members.find((x) => x.role === role);
  if (!m) return;
  m.confidence = clamp(m.confidence + delta, 0, 100);
  recalcBoardConfidence(career);
}

export function ensureCareerBoard(career, club, league) {
  if (!career.board || !Array.isArray(career.board.members)) {
    career.board = defaultBoardShell();
  }
  if (!career.board.members.length && club && league) {
    career.board.members = generateBoardMembers(club, league);
    alignBoardMembersToTarget(career.board, career.finance?.boardConfidence ?? 55);
  }
  if (career.board.members.length) {
    recalcBoardConfidence(career);
  }
}

/** Full reset (new job / game-over continue): new names, align to confidence. */
export function resetExecutiveBoard(career, club, league, boardConfidence = 55) {
  career.board = {
    ...defaultBoardShell(),
    members: club && league ? generateBoardMembers(club, league) : [],
  };
  career.finance = { ...career.finance, boardConfidence: clamp(boardConfidence, 0, 100) };
  if (career.board.members.length) {
    alignBoardMembersToTarget(career.board, career.finance.boardConfidence);
    recalcBoardConfidence(career);
  }
}

export function migrateSaveBoardV8(save) {
  const club = save.clubId ? findClub(save.clubId) : null;
  const league = save.leagueKey && PYRAMID[save.leagueKey] ? PYRAMID[save.leagueKey] : null;
  const target = save.finance?.boardConfidence ?? 55;
  if (!save.board || !Array.isArray(save.board.members)) {
    save.board = defaultBoardShell();
  }
  if (save.board.members.length < 5 && club && league) {
    save.board.members = generateBoardMembers(club, league);
    alignBoardMembersToTarget(save.board, target);
  }
  save.finance = save.finance || {};
  save.finance.boardConfidence = save.board.members.length
    ? weightedBoardConfidence(save.board.members)
    : clamp(target, 0, 100);
  if (club && league && !save.board.objectives?.length) {
    generateSeasonObjectives(save, league);
  }
}

export function generateSeasonObjectives(career, league) {
  if (!league?.clubs?.length) return;
  ensureCareerBoard(career, findClub(career.clubId), league);
  const season = career.season;
  const n = league.clubs.length;
  const seasonsManaged = career.coachStats?.seasonsManaged || 1;
  /** @type {object[]} */
  const raw = [];
  if (seasonsManaged >= 3 && league.tier === 1) {
    raw.push({
      setBy: "Chairman",
      type: "premiership",
      description: "Bring home the premiership.",
      target: 1,
      confidenceReward: 25,
      confidencePenalty: -8,
    });
  } else {
    const pos = league.tier === 1 ? 8 : league.tier === 2 ? 4 : Math.ceil(n / 2);
    raw.push({
      setBy: "Chairman",
      type: "ladder_position",
      description: `Finish in position ${pos} or better.`,
      target: pos,
      confidenceReward: 15,
      confidencePenalty: -10,
    });
  }
  raw.push({
    setBy: "Finance Director",
    type: "budget_discipline",
    description: "End the season with positive cash balance.",
    target: 0,
    confidenceReward: 12,
    confidencePenalty: -8,
  });
  raw.push({
    setBy: "Football Director",
    type: "youth_promoted",
    description: "At least two players aged 22 or under play 5+ senior games each.",
    target: 2,
    confidenceReward: 10,
    confidencePenalty: -6,
  });
  career.board.objectives = raw.map((o, i) => ({
    id: `obj_${season}_${i}`,
    met: null,
    current: null,
    ...o,
  }));
}

export function youthSeniorGameCount(squad) {
  return (squad || []).filter((p) => (p.age ?? 99) <= 22 && (p.gamesPlayed || 0) >= 5).length;
}

export function updateBoardObjectiveProgress(career, league) {
  if (!career.board?.objectives?.length) return;
  const sorted = sortedLadder(career.ladder || []);
  const myPos = sorted.findIndex((r) => r.id === career.clubId) + 1;
  const youthN = youthSeniorGameCount(career.squad);
  career.board.objectives.forEach((obj) => {
    if (obj.type === "ladder_position") obj.current = myPos;
    else if (obj.type === "premiership") obj.current = career.premiership === career.season ? 1 : 0;
    else if (obj.type === "budget_discipline") obj.current = career.finance?.cash ?? 0;
    else if (obj.type === "youth_promoted") obj.current = youthN;
  });
}

/**
 * Call at end of season before squad stats reset. Applies per-member objective rewards/penalties.
 * @returns {string[]} news lines
 */
export function resolveBoardObjectivesAtSeasonEnd(career, ctx) {
  const { myPos, cash, youthCount, champion } = ctx;
  const lines = [];
  const objs = career.board?.objectives;
  if (!objs?.length) return lines;
  objs.forEach((obj) => {
    let met = false;
    if (obj.type === "ladder_position") met = myPos <= (obj.target ?? 99);
    else if (obj.type === "premiership") met = !!champion;
    else if (obj.type === "budget_discipline") met = cash >= 0;
    else if (obj.type === "youth_promoted") met = youthCount >= (obj.target ?? 2);
    obj.met = met;
    const delta = met ? obj.confidenceReward : obj.confidencePenalty;
    if (delta) applyMemberConfidenceDelta(career, obj.setBy, delta);
    const status = met ? "met" : "missed";
    lines.push(
      `${status === "met" ? "✅" : "❌"} Board objective (${obj.setBy}): ${obj.description.slice(0, 60)}${obj.description.length > 60 ? "…" : ""} — ${met ? "MET" : "MISSED"}.`,
    );
  });
  return lines;
}

/** UI: rough status label for an objective card */
export function boardObjectiveUiStatus(obj, career) {
  if (obj.met === true) return "MET";
  if (obj.met === false) return "MISSED";
  if (obj.type === "ladder_position") {
    const cur = obj.current;
    if (cur == null) return "—";
    return cur <= obj.target ? "ON TRACK" : "AT RISK";
  }
  if (obj.type === "premiership") {
    return career.premiership === career.season ? "ON TRACK" : "AT RISK";
  }
  if (obj.type === "budget_discipline") {
    const cur = obj.current ?? 0;
    return cur >= 0 ? "ON TRACK" : "AT RISK";
  }
  if (obj.type === "youth_promoted") {
    const cur = obj.current ?? 0;
    return cur >= (obj.target ?? 2) ? "ON TRACK" : "AT RISK";
  }
  return "—";
}
