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
    inbox: [],
    lastCommsTick: null,
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
  if (!Array.isArray(career.board.inbox)) career.board.inbox = [];
  if (career.board.lastCommsTick === undefined) career.board.lastCommsTick = null;
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

/** Throttle board inbox drops so one message is not spammed every round. */
export const BOARD_COMMS_THROTTLE_ROUNDS = 4;

export function seasonRoundTick(season, round) {
  return season * 100 + round;
}

export function migrateSaveBoardV9(save) {
  if (!save.board) return;
  save.board.inbox = Array.isArray(save.board.inbox) ? save.board.inbox : [];
  if (save.board.lastCommsTick === undefined) save.board.lastCommsTick = null;
}

function boardMemberFirstName(board, role) {
  const m = board?.members?.find((x) => x.role === role);
  if (!m?.name) return null;
  return m.name.split(/\s+/)[0];
}

function buildBoardMessage(career, kind) {
  const season = career.season ?? 2026;
  const round = career.week ?? 1;
  const board = career.board;
  const club = findClub(career.clubId);
  const short = club?.short ?? "the club";

  if (kind === "pressure") {
    const fn = boardMemberFirstName(board, "Chairman") || "The chairman";
    return {
      id: `bm_${season}_${round}_pressure`,
      fromRole: "Chairman",
      title: "Results under review",
      body: `${fn} wants a clear plan to lift ${short}'s form. The board is watching closely.`,
      options: [
        {
          id: "accountability",
          label: "Own the slide — present a turnaround plan",
          memberDeltas: { Chairman: 5, "Football Director": 2 },
        },
        {
          id: "deflect",
          label: "Cite injuries and draw as the main drivers",
          memberDeltas: { Chairman: -6, "Player Relations Director": -2 },
        },
      ],
    };
  }
  if (kind === "finance_cash") {
    const fn = boardMemberFirstName(board, "Finance Director") || "Finance";
    return {
      id: `bm_${season}_${round}_finance`,
      fromRole: "Finance Director",
      title: "Cash-flow pressure",
      body: `${fn} needs reassurance on how you'll stabilise the balance sheet this season.`,
      options: [
        {
          id: "cut_costs",
          label: "Commit to cost discipline and freeze extras",
          memberDeltas: { "Finance Director": 6, Chairman: 2 },
        },
        {
          id: "bet_on_overage",
          label: "Argue the playing list needs investment now",
          memberDeltas: { "Finance Director": -5, "Football Director": 3 },
        },
      ],
    };
  }
  if (kind === "momentum") {
    const fn = boardMemberFirstName(board, "Football Director") || "Football";
    return {
      id: `bm_${season}_${round}_momentum`,
      fromRole: "Football Director",
      title: "Stay ruthless",
      body: `${fn} wants to lock in standards so ${short} does not ease off while ahead.`,
      options: [
        {
          id: "double_down",
          label: "Tighten standards — no complacency",
          memberDeltas: { "Football Director": 5, Chairman: 3 },
        },
        {
          id: "lighten",
          label: "Ease the load — protect the list",
          memberDeltas: { "Football Director": -3, "Player Relations Director": 4 },
        },
      ],
    };
  }
  const fn = boardMemberFirstName(board, "Football Director") || "Football";
  return {
    id: `bm_${season}_${round}_process`,
    fromRole: "Football Director",
    title: "Football department check-in",
    body: `${fn} wants a read on list balance and injury management heading into the next block.`,
    options: [
      {
        id: "data_led",
        label: "Share a clear, list-led rationale",
        memberDeltas: { "Football Director": 4, Chairman: 1 },
      },
      {
        id: "keep_cards",
        label: "Keep detail internal for now",
        memberDeltas: { "Football Director": -2, Chairman: -2 },
      },
    ],
  };
}

/**
 * After a home-and-away round, optionally queue one inbox item (throttled, one active at a time).
 * @returns {string|null} news line when a message was queued
 */
export function maybeEnqueueBoardMessage(career, league) {
  ensureCareerBoard(career, findClub(career.clubId), league);
  const board = career.board;
  if (board.inbox.length > 0) return null;
  const season = career.season ?? 2026;
  const round = career.week ?? 1;
  const tick = seasonRoundTick(season, round);
  if (board.lastCommsTick != null && tick - board.lastCommsTick < BOARD_COMMS_THROTTLE_ROUNDS) return null;

  const overall = career.finance?.boardConfidence ?? 55;
  const ws = career.winStreak ?? 0;
  const cash = career.finance?.cash ?? 0;

  const candidates = [];
  if (overall <= 40 || ws <= -2) candidates.push("pressure");
  if (cash < 0) candidates.push("finance_cash");
  if (overall >= 70 && ws >= 3) candidates.push("momentum");
  if (candidates.length === 0 && rand(1, 100) <= 38) candidates.push("football_process");
  if (candidates.length === 0) return null;

  const kind = pick(candidates);
  const msg = buildBoardMessage(career, kind);
  board.inbox.push(msg);
  board.lastCommsTick = tick;
  return `📩 ${msg.fromRole}: ${msg.title} — open the Board tab to respond.`;
}

/**
 * @returns {{ ok: boolean, newsLine?: string }}
 */
export function resolveBoardInboxChoice(career, league, messageId, optionId) {
  ensureCareerBoard(career, findClub(career.clubId), league);
  const board = career.board;
  const idx = board.inbox?.findIndex((m) => m.id === messageId) ?? -1;
  if (idx < 0) return { ok: false };
  const msg = board.inbox[idx];
  const opt = msg.options?.find((o) => o.id === optionId);
  if (!opt) return { ok: false };
  const deltas = opt.memberDeltas || {};
  for (const [role, d] of Object.entries(deltas)) {
    applyMemberConfidenceDelta(career, role, d);
  }
  board.inbox.splice(idx, 1);
  const label = opt.label.length > 48 ? `${opt.label.slice(0, 48)}…` : opt.label;
  return { ok: true, newsLine: `📋 Board: You chose "${label}".` };
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
