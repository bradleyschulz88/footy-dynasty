// Executive board (staged MVP): weighted members drive finance.boardConfidence.
import { pick, rand, rng } from "./rng.js";
import { FIRST_NAMES, LAST_NAMES } from "./playerGen.js";
import { clamp } from "./format.js";
import { sortedLadder, competitionClubsForCareer } from "./leagueEngine.js";
import { findClub, PYRAMID } from "../data/pyramid.js";
import { getDifficultyConfig } from "./difficulty.js";

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

export function migrateSaveBoardV10(save) {
  if (save.boardCrisis === undefined) save.boardCrisis = null;
  save.boardMeetingSlots = Array.isArray(save.boardMeetingSlots) ? save.boardMeetingSlots : [];
  if (save.boardMeetingBlocking === undefined) save.boardMeetingBlocking = null;
  if (save.boardMeetingSeasonPlanned === undefined) save.boardMeetingSeasonPlanned = null;
}

export function migrateSaveBoardV11(save) {
  if (save.boardVotePrepBonus === undefined) save.boardVotePrepBonus = 0;
  if (save.jobMarketRerolls === undefined) save.jobMarketRerolls = 0;
  if (save.arrivalBriefing === undefined) save.arrivalBriefing = null;
}

/** Schedule two blocking board meetings per season from fixture length. */
export function planSeasonBoardMeetings(career) {
  const season = career.season ?? 2026;
  if (career.boardMeetingSeasonPlanned === season && career.boardMeetingSlots?.length) return;
  const rounds = (career.eventQueue || []).filter((e) => e.type === "round" && e.phase === "season");
  const n = rounds.length || 18;
  const maxR = rounds.length ? Math.max(...rounds.map((e) => e.round ?? 0)) : n;
  const span = maxR > 0 ? maxR : n;
  const r1 = Math.max(3, Math.ceil(span / 3));
  const r2 = Math.max(r1 + 2, Math.ceil((2 * span) / 3));
  career.boardMeetingSlots = [
    { id: `bms_${season}_1`, dueRound: Math.min(r1, span || r1), kind: "review", title: "Mid-season football review", resolved: false },
    { id: `bms_${season}_2`, dueRound: Math.min(r2, span || r2), kind: "finance", title: "Finance & facilities checkpoint", resolved: false },
  ];
  career.boardMeetingSeasonPlanned = season;
}

export function findDueBoardMeetingSlot(career, completedSeasonRound) {
  const slots = career.boardMeetingSlots;
  if (!slots?.length) return null;
  return slots.find((s) => !s.resolved && s.dueRound === completedSeasonRound) || null;
}

const ROUTINE_MEETING_COPY = {
  review: {
    intro:
      "The football sub-committee wants an honest read on where the game plan is working — and where the list is fraying.",
    choices: [
      { id: "direct", label: "Be direct about weaknesses and the fix", memberDeltas: { "Football Director": 5, Chairman: 2 } },
      { id: "steady", label: "Stress patience — it's a year-long project", memberDeltas: { Chairman: 4, "Football Director": -1 } },
    ],
  },
  finance: {
    intro:
      "Finance wants visibility on cash runway and whether facility spend stays inside the plan you sold them in pre-season.",
    choices: [
      { id: "tighten", label: "Commit to a tighter spend line this quarter", memberDeltas: { "Finance Director": 6, Chairman: 1 } },
      { id: "invest", label: "Push for one investment exception (youth / medical)", memberDeltas: { "Finance Director": -3, "Football Director": 4 } },
    ],
  },
};

/** Tier-3 community clubs: volunteer committee roundtable (same mechanical deltas, different story). */
const COMMITTEE_MEETING_COPY = {
  review: {
    intro:
      "The football working group — president, football manager, and a few life members — want plain language on the game plan and the kids coming through.",
    choices: [
      { id: "direct", label: "Be straight about list gaps and how you'll fix them", memberDeltas: { "Football Director": 5, Chairman: 2 } },
      { id: "steady", label: "Ask for patience — it's a rebuild in a small town", memberDeltas: { Chairman: 4, "Football Director": -1 } },
    ],
  },
  finance: {
    intro:
      "Treasurer and volunteers want to know discretionary spend stays under what the AGM approved — no surprises before finals.",
    choices: [
      { id: "tighten", label: "Promise visible belt-tightening on non-essentials", memberDeltas: { Chairman: 2 } },
      { id: "invest", label: "Pitch one junior pathway spend that grows gate and merch", memberDeltas: { Chairman: 1 } },
    ],
  },
};

export function openBoardMeetingBlockingFromSlot(slot, leagueTier = 2) {
  const table = leagueTier === 3 ? COMMITTEE_MEETING_COPY : ROUTINE_MEETING_COPY;
  const copy = table[slot.kind];
  if (!copy) return null;
  return {
    slotId: slot.id,
    kind: slot.kind,
    title: leagueTier === 3 ? slot.title.replace("Board", "Committee") : slot.title,
    intro: copy.intro,
    choices: copy.choices,
    step: 0,
    leagueTier,
  };
}

/** If a routine meeting was due this round but skipped (e.g. vote crisis), open it after vote resolves. */
export function catchUpBoardMeetingForCurrentWeek(career) {
  if (career.boardCrisis?.phase === "active") return null;
  const due = findDueBoardMeetingSlot(career, career.week ?? 0);
  if (!due) return null;
  const tier = career.leagueKey && PYRAMID[career.leagueKey] ? PYRAMID[career.leagueKey].tier : 2;
  return openBoardMeetingBlockingFromSlot(due, tier);
}

/**
 * @returns {{ ok: boolean, newsLine?: string }}
 */
export function resolveRoutineBoardMeeting(career, league, slotId, choiceId) {
  ensureCareerBoard(career, findClub(career.clubId), league);
  const slot = career.boardMeetingSlots?.find((s) => s.id === slotId);
  if (!slot || slot.resolved) return { ok: false };
  const tier = league?.tier ?? 2;
  const table = tier === 3 ? COMMITTEE_MEETING_COPY : ROUTINE_MEETING_COPY;
  const copy = table[slot.kind];
  if (!copy) return { ok: false };
  const ch = copy.choices.find((c) => c.id === choiceId);
  if (!ch) return { ok: false };
  slot.resolved = true;
  career.boardMeetingBlocking = null;
  const deltas = ch.memberDeltas || {};
  for (const [role, d] of Object.entries(deltas)) {
    applyMemberConfidenceDelta(career, role, d);
  }
  const labelWho = tier === 3 ? "Committee session" : "Board meeting";
  return { ok: true, newsLine: `📅 ${labelWho}: ${slot.title} — you ${ch.label.toLowerCase()}.` };
}

/** Survival probability before dice roll (0–1). Respects difficulty.voteSurvivalShift and inbox crisis prep. */
export function voteOfConfidenceSurvivalChance(career, pitchBonus = 0) {
  const conf = career.finance?.boardConfidence ?? 35;
  const cfg = getDifficultyConfig(career?.difficulty);
  const diffShift = cfg.voteSurvivalShift ?? 0;
  const prep = career?.boardVotePrepBonus ?? 0;
  let p = 0.22 + conf / 165 + (pitchBonus + prep) / 85 + diffShift;
  return clamp(p, 0.1, 0.9);
}

export function rollVoteOfConfidenceSurvival(career, pitchBonus = 0) {
  return rng() < voteOfConfidenceSurvivalChance(career, pitchBonus);
}

/**
 * Mutates `career` — use on a JSON clone in React handlers.
 * @returns {{ newsLine: string }}
 */
export function applyVoteSurvivalMutate(career, league, pitchBonus) {
  ensureCareerBoard(career, findClub(career.clubId), league);
  career.boardCrisis = null;
  career.boardWarning = 0;
  career.boardVotePrepBonus = 0;
  career.board = career.board || defaultBoardShell();
  career.board.voteScheduled = false;
  const bump = clamp(6 + Math.round(pitchBonus / 3), 4, 15);
  applyBoardConfidenceDelta(career, bump);
  career.finance = career.finance || {};
  career.finance.boardConfidence = Math.max(career.finance.boardConfidence ?? 0, 36);
  alignBoardMembersToTarget(career.board, career.finance.boardConfidence);
  recalcBoardConfidence(career);
  return { newsLine: "✅ Vote of confidence carried — you retain the senior coach role." };
}

function boardMemberFirstName(board, role) {
  const m = board?.members?.find((x) => x.role === role);
  if (!m?.name) return null;
  return m.name.split(/\s+/)[0];
}

/**
 * When you are one warning away from a vote, chairman may demand an on-record inbox reply that adjusts vote odds.
 * @returns {string|null} optional news line
 */
export function maybeEnqueueBoardCrisisPrep(career, league, sackPatience, boardWarning) {
  if (sackPatience <= 1) return null;
  if (boardWarning !== sackPatience - 1) return null;
  if ((career.finance?.boardConfidence ?? 100) > 18) return null;
  if (career.boardCrisis?.phase === "active") return null;
  ensureCareerBoard(career, findClub(career.clubId), league);
  const board = career.board;
  if (board.inbox.some((m) => String(m.id).startsWith("crisis_prep_"))) return null;
  const season = career.season ?? 2026;
  const week = career.week ?? 1;
  const fn = boardMemberFirstName(board, "Chairman") || "Chair";
  board.inbox.push({
    id: `crisis_prep_${season}_${week}`,
    fromRole: "Chairman",
    title: "On the record before the vote",
    body: `${fn} wants something documented before the confidence motion. How do you handle it?`,
    options: [
      { id: "data", label: "Quiet confidence — data, milestones, no panic", memberDeltas: { Chairman: 3, "Football Director": 2 }, votePrepBonus: 4 },
      { id: "heart", label: "Emotional appeal to the jumper and the members", memberDeltas: { Chairman: 1, "Community Director": 3 }, votePrepBonus: 2 },
      { id: "vague", label: "Keep it vague — buy time", memberDeltas: { Chairman: -3 }, votePrepBonus: -4 },
    ],
  });
  return `📩 ${fn}: statement before the vote — respond in Board → Inbox.`;
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
  if (typeof opt.votePrepBonus === "number") {
    career.boardVotePrepBonus = clamp((career.boardVotePrepBonus || 0) + opt.votePrepBonus, -12, 12);
  }
  board.inbox.splice(idx, 1);
  const label = opt.label.length > 48 ? `${opt.label.slice(0, 48)}…` : opt.label;
  return { ok: true, newsLine: `📋 Board: You chose "${label}".` };
}

export function generateSeasonObjectives(career, league) {
  if (!league?.clubs?.length) return;
  ensureCareerBoard(career, findClub(career.clubId), league);
  const season = career.season;
  const nPool = competitionClubsForCareer(career);
  const n = nPool.length || league.clubs.length;
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
