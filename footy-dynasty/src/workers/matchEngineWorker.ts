// Match Engine Web Worker
// Handles quarter-by-quarter match simulation off the main thread

import { rng, seedRng, pick, rand, randNorm } from './rng.ts';
import { TIER_SCALE } from './rng.ts';

type Player = {
  id: string;
  overall: number;
  trueRating?: number;
  position: string;
  secondaryPosition?: string;
  attrs: Record<string, number>;
  form: number;
  fitness: number;
  morale: number;
  trait?: string;
  injured?: number;
  suspended?: number;
};

type MatchSimState = {
  cfg: MatchConfig;
  momentum: number;
  runHomePts: number;
  runAwayPts: number;
  quarters: QuarterResult[];
  events: MatchEvent[];
  keyMoments: KeyMoment[];
  goalAttribution: Record<string, { goals: number; behinds: number; votesScore: number }>;
  injuredPlayerIds: string[];
  reportedPlayerIds: string[];
};

type MatchConfig = {
  isPlayerHome: boolean;
  tactic: string;
  oppTactic: string;
  playerLineup: Player[];
  oppLineup: Player[];
  groundScoring: number;
  groundAccuracy: number;
  homeAccMod: number;
  awayAccMod: number;
  hAdv: number;
  homeRating: number;
  awayRating: number;
  playerStrength: number;
  playerStrengthByQuarter: number[] | null;
  oppStrengthByQuarter: number[] | null;
};

type QuarterResult = {
  homeGoals: number;
  homeBehinds: number;
  homeTotal: number;
  awayGoals: number;
  awayBehinds: number;
  awayTotal: number;
  events: MatchEvent[];
  momentumEnd: number;
};

type MatchEvent = {
  q: number;
  minute: number;
  side: 'home' | 'away';
  kind: 'goal' | 'behind' | 'miss' | 'stoppage' | 'moment';
  scorer?: string;
  text?: string;
  moment?: string;
  playerId?: string;
};

type KeyMoment = MatchEvent & { moment: string };

type SimResult = {
  homeGoals: number;
  homeBehinds: number;
  homeTotal: number;
  awayGoals: number;
  awayBehinds: number;
  awayTotal: number;
  winner: 'home' | 'away' | 'draw';
  quarters: QuarterResult[];
  events: MatchEvent[];
  keyMoments: KeyMoment[];
  votes: { playerId: string; votes: number; score: number }[];
  goalAttribution: Record<string, { goals: number; behinds: number; votesScore: number }>;
  injuredPlayerIds: string[];
  reportedPlayerIds: string[];
};

// ---- Constants ----
const CLAMP = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const TACTIC_PROFILES: Record<string, { goalRateMod: number; oppRateMod: number; momentumGain: number; riskMod: number }> = {
  defensive: { goalRateMod: -0.12, oppRateMod: -0.16, momentumGain: 0.6, riskMod: 0.7 },
  balanced: { goalRateMod: 0.00, oppRateMod: 0.00, momentumGain: 1.0, riskMod: 1.0 },
  attack: { goalRateMod: 0.16, oppRateMod: 0.16, momentumGain: 1.3, riskMod: 1.25 },
  flood: { goalRateMod: -0.14, oppRateMod: -0.20, momentumGain: 0.6, riskMod: 0.72 },
  press: { goalRateMod: 0.00, oppRateMod: -0.04, momentumGain: 1.1, riskMod: 1.15 },
  run: { goalRateMod: 0.10, oppRateMod: 0.10, momentumGain: 1.2, riskMod: 1.15 },
};

const TACTIC_QUARTER_MULT: Record<string, number[]> = {
  defensive: [1.05, 1.03, 0.98, 0.94],
  balanced: [1, 1, 1, 1],
  attack: [0.96, 0.98, 1.02, 1.06],
  flood: [1.02, 1.04, 1.0, 0.96],
  press: [1.0, 1.02, 1.04, 0.98],
  run: [0.98, 0.99, 1.03, 1.05],
};

const KEY_MOMENT_KINDS = [
  { id: 'specky', text: 'Speccie of the year! Hanger over the pack.', weight: 4, posKey: ['KF', 'HF', 'KB', 'HB'], scoreImpact: 0, momentumImpact: 0.25, voteImpact: 1 },
  { id: 'fifty', text: '50m penalty paid downfield.', weight: 3, posKey: null, scoreImpact: 0, momentumImpact: 0.15, voteImpact: 0 },
  { id: 'comeback', text: 'Massive comeback brewing.', weight: 2, posKey: null, scoreImpact: 0, momentumImpact: 0.30, voteImpact: 0 },
  { id: 'shank', text: 'Shanked a set shot from 30m out.', weight: 3, posKey: null, scoreImpact: 0, momentumImpact: -0.15, voteImpact: 0 },
  { id: 'hammy', text: 'Pulled up sore — looks like a hamstring.', weight: 2, posKey: null, scoreImpact: 0, momentumImpact: -0.10, voteImpact: 0, injuryRisk: true },
  { id: 'report', text: 'Reported for a high bump. Tribunal looms.', weight: 1, posKey: null, scoreImpact: 0, momentumImpact: -0.10, voteImpact: 0, suspensionRisk: true },
  { id: 'goalrun', text: 'Run-down tackle saves a certain goal.', weight: 3, posKey: null, scoreImpact: 0, momentumImpact: 0.20, voteImpact: 1 },
];

const INJURY_TABLE = [
  { type: 'soft_tissue', label: 'Hamstring Strain', minWeeks: 2, maxWeeks: 5, chance: 0.30 },
  { type: 'soft_tissue', label: 'Calf Strain', minWeeks: 2, maxWeeks: 4, chance: 0.15 },
  { type: 'shoulder', label: 'Shoulder (AC)', minWeeks: 3, maxWeeks: 8, chance: 0.12 },
  { type: 'knee_minor', label: 'Knee (Meniscus)', minWeeks: 4, maxWeeks: 10, chance: 0.08 },
  { type: 'ankle', label: 'Ankle Sprain', minWeeks: 2, maxWeeks: 6, chance: 0.12 },
  { type: 'concussion', label: 'Concussion', minWeeks: 1, maxWeeks: 3, chance: 0.08 },
  { type: 'fracture', label: 'Foot Fracture', minWeeks: 5, maxWeeks: 12, chance: 0.05 },
  { type: 'knee_acl', label: 'ACL (Knee)', minWeeks: 20, maxWeeks: 28, chance: 0.03 },
  { type: 'soft_tissue', label: 'Quad Strain', minWeeks: 2, maxWeeks: 4, chance: 0.07 },
];

// ---- Core Functions ----

function playerEffectiveMatchRating(player: Player, quarter: number | null = null): number {
  if (!player) return 0;
  const base = player.trueRating ?? player.overall ?? 0;
  const form = player.form ?? 70;
  const fitness = player.fitness ?? 90;
  const morale = player.morale ?? 75;

  const formMult = CLAMP(1 + (form - 70) * 0.0035, 0.92, 1.1);
  const fitnessMult = CLAMP(0.88 + (fitness - 70) * 0.004, 0.78, 1.06);
  const moraleMult = CLAMP(1 + (morale - 75) * 0.0015, 0.955, 1.045);

  let fatigue = 1;
  if (quarter != null && Number.isFinite(quarter) && quarter >= 3) {
    const q = Math.min(4, Math.max(1, quarter));
    const u = q - 2;
    fatigue = 1 - u * (1 - fitnessMult) * 0.35;
    fatigue = CLAMP(fatigue, 0.72, 1);
  }

  const computed = base * formMult * fitnessMult * moraleMult * fatigue;

  const traitBonus = (() => {
    switch (player.trait) {
      case 'leader': return 1.5;
      case 'grinder': return 1.0;
      case 'hothead': return rng() < 0.45 ? 6 : -4;
      case 'drifter': return -2.0;
      case 'mentor': return 0.5;
      default: return 0;
    }
  })();

  return Math.max(1, computed + traitBonus);
}

function teamRating(
  squad: Player[],
  lineup: string[],
  training: { intensity: number; focus: Record<string, number> },
  facilitiesAvg: number,
  staffAvg: number,
  quarter: number | null = null,
  playerRoles: Record<string, string> | null = null
): number {
  const starterIds = (lineup && lineup.length)
    ? lineup.slice(0, 23).filter((id) => id != null && id !== '')
    : [];

  const topStarters = starterIds.length > 0
    ? (() => {
        const byId = new Map(squad.map((p) => [p.id, p]));
        return starterIds.map((id) => byId.get(id)).filter(Boolean) as Player[];
      })()
    : squad.slice().sort((a, b) => b.overall - a.overall).slice(0, 23);

  if (topStarters.length === 0) return 50;

  const lineupIdsForStructure = starterIds.length > 0 ? starterIds : topStarters.map((p) => p.id);
  const trainingBoost = (training.intensity - 50) * 0.04;

  const avgEff = topStarters.reduce((a, p) => a + playerEffectiveMatchRating(p, quarter), 0) / topStarters.length;

  return avgEff
    + trainingBoost
    + (facilitiesAvg - 1) * 1.2
    + (staffAvg - 60) * 0.15;
}

function adaptiveOppTactic(baseTactic: string, oppLead: number, quarterIndex: number): string {
  if (quarterIndex < 2) return baseTactic;
  if (oppLead >= 19) return 'flood';
  if (oppLead >= 10) return 'defensive';
  if (oppLead <= -19) return 'attack';
  if (oppLead <= -10) return 'run';
  return baseTactic;
}

function stoppageStrength(lineup: Player[]): number {
  if (!lineup?.length) return 50;
  const rucks = lineup.filter((p) => playerHasPosition(p, 'RU') || playerHasPosition(p, 'R'));
  const mids = lineup.filter((p) => isMidPreferred(p));
  const ruckAvg = rucks.length
    ? rucks.reduce((a, p) => a + (p.attrs?.strength ?? 60) + (p.attrs?.marking ?? 60), 0) / rucks.length
    : 50;
  const midAvg = mids.length
    ? mids.reduce((a, p) => a + (p.attrs?.decision ?? 60) + (p.attrs?.endurance ?? 60), 0) / mids.length
    : 50;
  return ruckAvg * 0.45 + midAvg * 0.55;
}

function resolveStoppageQuarter(
  playerLineup: Player[],
  oppLineup: Player[],
  tactic: string,
  oppTactic: string,
  isPlayerHome: boolean
): { margin: number; homeClearances: number; awayClearances: number } {
  const pressMod = tactic === 'press' ? 0.08 : tactic === 'flood' ? -0.04 : 0;
  const oppPressMod = oppTactic === 'press' ? 0.08 : oppTactic === 'flood' ? -0.04 : 0;
  const playerStop = stoppageStrength(playerLineup) * (1 + pressMod);
  const oppStop = stoppageStrength(oppLineup) * (1 + oppPressMod);
  const homeStop = isPlayerHome ? playerStop : oppStop;
  const awayStop = isPlayerHome ? oppStop : playerStop;
  const total = Math.max(1, homeStop + awayStop);
  const homeShare = homeStop / total;
  const chains = 3 + rand(0, 3);
  const homeClearances = Math.round(chains * homeShare);
  const awayClearances = chains - homeClearances;
  const margin = CLAMP((homeClearances - awayClearances) / Math.max(1, chains), -1, 1);
  return { margin, homeClearances, awayClearances };
}

function shotRates(diff: number): { home: number; away: number } {
  const baseTotal = 16;
  const split = CLAMP(0.5 + diff * 0.012, 0.20, 0.80);
  return { home: baseTotal * split, away: baseTotal * (1 - split) };
}

function poisson(mean: number): number {
  const L = Math.exp(-Math.max(0.001, mean));
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L && k < 30);
  return k - 1;
}

function goalFinishWeight(p: Player): number {
  const rating = p.trueRating ?? p.overall ?? 60;
  const kicking = p.attrs?.kicking ?? rating;
  const marking = p.attrs?.marking ?? rating;
  const quality = rating * 0.6 + kicking * 0.25 + marking * 0.15;
  return Math.pow(quality / 60, 3);
}

function pickScorerId(playerLineup: Player[]): string | null {
  if (!playerLineup?.length) return null;
  const fwd = playerLineup.filter((p) => isForwardPreferred(p));
  const mid = playerLineup.filter((p) => isMidPreferred(p));
  const all = playerLineup.filter(Boolean);
  const r = rng();
  let pool: Player[];
  if (r < 0.55 && fwd.length) pool = fwd;
  else if (r < 0.85 && mid.length) pool = mid;
  else pool = all;
  if (!pool.length) return null;
  // Weighted pick
  let total = 0;
  const weights = pool.map((p) => { const w = Math.max(0.01, goalFinishWeight(p)); total += w; return w; });
  let r2 = rng() * total;
  for (let i = 0; i < pool.length; i++) {
    r2 -= weights[i];
    if (r2 <= 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
}

function defensivePressureMod(defLineup: Player[], attLineup: Player[], defTactic: string = 'balanced'): number {
  const backs = (defLineup || []).filter((p) => p && isBackPreferred(p));
  const fwds = (attLineup || []).filter((p) => p && isForwardPreferred(p));
  if (!backs.length || !fwds.length) return 1;
  const defQuality = (p: Player) => (p.trueRating ?? p.overall ?? 60) * 0.5 + (p.attrs?.marking ?? 60) * 0.25 + (p.attrs?.tackling ?? 60) * 0.25;
  const attQuality = (p: Player) => (p.trueRating ?? p.overall ?? 60) * 0.6 + (p.attrs?.kicking ?? 60) * 0.2 + (p.attrs?.marking ?? 60) * 0.2;
  const backAvg = backs.reduce((a, p) => a + defQuality(p), 0) / backs.length;
  const fwdAvg = fwds.reduce((a, p) => a + attQuality(p), 0) / fwds.length;
  const lean = defTactic === 'defensive' ? 1.5 : defTactic === 'flood' ? 1.3 : 1;
  return CLAMP(1 - (backAvg - fwdAvg) * 0.003 * lean, 0.90, 1.10);
}

function weatherAccuracyMod(weather: string | null, tactic: string = 'balanced'): number {
  if (!weather) return 1;
  const w = String(weather).toLowerCase();
  const wet = w === 'rainy' || w === 'rain' || w === 'wet' || w === 'stormy';
  const windy = w === 'windy' || w === 'wind';
  if (!wet && !windy) return 1;
  const base = wet ? 0.92 : 0.96;
  const tacticLean: Record<string, number> = { attack: 0.95, run: 0.95, press: 0.98, balanced: 1.0, defensive: 1.04, flood: 1.04 };
  return CLAMP(base * (tacticLean[tactic] ?? 1.0), 0.8, 1.05);
}

function pickMoment(): typeof KEY_MOMENT_KINDS[0] {
  const total = KEY_MOMENT_KINDS.reduce((a, k) => a + k.weight, 0);
  let r = rng() * total;
  for (const k of KEY_MOMENT_KINDS) {
    r -= k.weight;
    if (r <= 0) return k;
  }
  return KEY_MOMENT_KINDS[0];
}

function pickInjury(): { type: string; label: string; severity: string; weeks: number } {
  const roll = rng();
  let cumulative = 0;
  let chosen = INJURY_TABLE[0];
  for (const entry of INJURY_TABLE) {
    cumulative += entry.chance;
    if (roll < cumulative) { chosen = entry; break; }
  }
  const mid = Math.round((chosen.minWeeks + chosen.maxWeeks) / 2);
  const r2 = rng();
  let severity: string, weeks: number;
  if (r2 < 0.33) { severity = 'mild'; weeks = chosen.minWeeks; }
  else if (r2 < 0.67) { severity = 'moderate'; weeks = mid; }
  else { severity = 'severe'; weeks = chosen.maxWeeks; }
  return { type: chosen.type, label: chosen.label, severity, weeks };
}

// ---- Position helpers ----
const LINE_FWD = new Set(['KF', 'HF']);
const LINE_MID = new Set(['C', 'R', 'WG']);
const LINE_BACK = new Set(['HB', 'KB']);
const LINE_RUCK = new Set(['RU']);

function playerHasPosition(p: Player | null | undefined, pos: string): boolean {
  if (!p || pos == null || pos === '' || pos === 'ALL') return false;
  return p.position === pos || p.secondaryPosition === pos;
}
function isForwardPreferred(p: Player | null | undefined): boolean {
  return !!p && (LINE_FWD.has(p.position) || LINE_FWD.has(p.secondaryPosition ?? ''));
}
function isMidPreferred(p: Player | null | undefined): boolean {
  if (!p) return false;
  if (p.position === 'UT' || p.secondaryPosition === 'UT') return true;
  return LINE_MID.has(p.position) || LINE_MID.has(p.secondaryPosition ?? '');
}
function isBackPreferred(p: Player | null | undefined): boolean {
  return !!p && (LINE_BACK.has(p.position) || LINE_BACK.has(p.secondaryPosition ?? ''));
}

// ---- Worker message handling ----

type WorkerRequest = 
  | { type: 'INIT'; payload: MatchConfig }
  | { type: 'QUARTER'; payload: { playerStrengthDelta?: number; oppStrengthDelta?: number } }
  | { type: 'FINISH' };

type WorkerResponse = 
  | { type: 'INIT_DONE'; payload: { state: MatchSimState } }
  | { type: 'QUARTER_DONE'; payload: { state: MatchSimState; quarter: QuarterResult } }
  | { type: 'FINISH_DONE'; payload: SimResult }
  | { type: 'ERROR'; payload: string };

let simState: MatchSimState | null = null;

function initMatchSim(cfg: MatchConfig): MatchSimState {
  const tactic = cfg.tactic || 'balanced';
  const oppTactic = cfg.oppTactic || 'balanced';
  const profile = TACTIC_PROFILES[tactic] || TACTIC_PROFILES.balanced;
  const oppProfile = TACTIC_PROFILES[oppTactic] || TACTIC_PROFILES.balanced;

  const groundScoring = CLAMP(cfg.groundScoring ?? 1.0, 0.5, 1.1);
  const groundAccuracy = CLAMP(cfg.groundAccuracy ?? 1.0, 0.5, 1.1);

  const weather = null; // not in config currently
  const playerSideAccMod = defensivePressureMod(cfg.oppLineup, cfg.playerLineup, oppTactic) * weatherAccuracyMod(weather, tactic) * (1 - (profile.riskMod - 1) * 0.15);
  const oppSideAccMod = defensivePressureMod(cfg.playerLineup, cfg.oppLineup, tactic) * weatherAccuracyMod(weather, oppTactic) * (1 - (oppProfile.riskMod - 1) * 0.15);

  return {
    cfg: {
      ...cfg,
      tactic,
      oppTactic,
      groundScoring,
      groundAccuracy,
      homeAccMod: cfg.isPlayerHome ? playerSideAccMod : oppSideAccMod,
      awayAccMod: cfg.isPlayerHome ? oppSideAccMod : playerSideAccMod,
    },
    momentum: 0,
    runHomePts: 0,
    runAwayPts: 0,
    quarters: [],
    events: [],
    keyMoments: [],
    goalAttribution: {},
    injuredPlayerIds: [],
    reportedPlayerIds: [],
  };
}

function simMatchQuarter(state: MatchSimState, mods: { playerStrengthDelta?: number; oppStrengthDelta?: number } = {}): MatchSimState {
  const { cfg } = state;
  const q = state.quarters.length;
  if (q >= 4) return state;

  const oppLeadNow = cfg.isPlayerHome
    ? (state.runAwayPts ?? 0) - (state.runHomePts ?? 0)
    : (state.runHomePts ?? 0) - (state.runAwayPts ?? 0);
  const effectiveOppTactic = adaptiveOppTactic(cfg.oppTactic, oppLeadNow, q);
  const profile = TACTIC_PROFILES[cfg.tactic] || TACTIC_PROFILES.balanced;
  const oppProfile = TACTIC_PROFILES[effectiveOppTactic] || TACTIC_PROFILES.balanced;

  let momentum = state.momentum;
  if (q > 0) {
    momentum *= 0.72;
    const marginPts = state.runHomePts - state.runAwayPts;
    const marginNudge = CLAMP(marginPts / 48, -1, 1) * 0.14;
    momentum = CLAMP(momentum + marginNudge, -1, 1);
  }
  const quarterNum = q + 1;

  const playerStrNow = (cfg.playerStrengthByQuarter ? cfg.playerStrengthByQuarter[q] : cfg.playerStrength) + (mods.playerStrengthDelta ?? 0);
  const oppStrBase = cfg.oppStrengthByQuarter ? cfg.oppStrengthByQuarter[q] : null;
  const oppStrNow = oppStrBase != null ? oppStrBase + (mods.oppStrengthDelta ?? 0) : null;
  const oppFallbackDelta = mods.oppStrengthDelta ?? 0;

  let hStr: number, aStr: number;
  if (cfg.isPlayerHome) {
    hStr = playerStrNow + cfg.hAdv;
    aStr = oppStrNow != null ? oppStrNow : cfg.awayRating + oppFallbackDelta;
  } else {
    hStr = (oppStrNow != null ? oppStrNow : cfg.homeRating + oppFallbackDelta) + cfg.hAdv;
    aStr = playerStrNow;
  }
  const diff = (hStr - aStr) + momentum * 9;

  const stop = resolveStoppageQuarter(cfg.playerLineup, cfg.oppLineup, cfg.tactic, effectiveOppTactic, cfg.isPlayerHome);
  const diffWithStop = diff + stop.margin * 6;
  const rates = shotRates(diffWithStop);

  const suppressScale = (oppMod: number, targetGoalMod: number) => oppMod < 0 ? 0.5 + Math.max(0, targetGoalMod) * 2 : 0.5;
  const homeSideMod = cfg.isPlayerHome ? profile.goalRateMod : oppProfile.goalRateMod;
  const awaySideMod = cfg.isPlayerHome ? oppProfile.goalRateMod : profile.goalRateMod;
  const homeOppPressure = cfg.isPlayerHome ? oppProfile.oppRateMod : profile.oppRateMod;
  const awayOppPressure = cfg.isPlayerHome ? profile.oppRateMod : oppProfile.oppRateMod;

  const homeShotMean = rates.home * (1 + homeSideMod) * (1 + homeOppPressure * suppressScale(homeOppPressure, homeSideMod));
  const awayShotMean = rates.away * (1 + awaySideMod) * (1 + awayOppPressure * suppressScale(awayOppPressure, awaySideMod));

  const plQ = TACTIC_QUARTER_MULT[cfg.tactic]?.[q] ?? 1;
  const opQ = TACTIC_QUARTER_MULT[effectiveOppTactic]?.[q] ?? 1;
  const homeQuarterMult = cfg.isPlayerHome ? plQ : opQ;
  const awayQuarterMult = cfg.isPlayerHome ? opQ : plQ;
  const homeShotMeanPhased = homeShotMean * homeQuarterMult;
  const awayShotMeanPhased = awayShotMean * awayQuarterMult;

  const homeShots = poisson(Math.max(2, homeShotMeanPhased * cfg.groundScoring));
  const awayShots = poisson(Math.max(2, awayShotMeanPhased * cfg.groundScoring));

  let hG = 0, hB = 0, aG = 0, aB = 0;
  const qEvents: MatchEvent[] = [];

  if (stop.homeClearances + stop.awayClearances > 0) {
    qEvents.push({
      q: quarterNum,
      minute: rand(q * 25, q * 25 + 8),
      side: stop.margin >= 0 ? 'home' : 'away',
      kind: 'stoppage',
      text: `Contested ball — ${stop.homeClearances}–${stop.awayClearances} clearances this quarter`,
    });
  }

  // Home shots
  for (let i = 0; i < homeShots; i++) {
    const accuracy = CLAMP((0.42 + diffWithStop * 0.004 + (rng() - 0.5) * 0.18) * cfg.groundAccuracy * cfg.homeAccMod, 0.10, 0.78);
    const minute = rand(q * 25, q * 25 + 24);
    const r = rng();
    if (r < accuracy) {
      hG++;
      const scorer = cfg.isPlayerHome ? pickScorerId(cfg.playerLineup) : null;
      if (scorer) {
        state.goalAttribution[scorer] = state.goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        state.goalAttribution[scorer].goals++;
        state.goalAttribution[scorer].votesScore += 8;
      }
      qEvents.push({ q: q + 1, minute, side: 'home', kind: 'goal', scorer });
      momentum = CLAMP(momentum + 0.05 * profile.momentumGain, -1, 1);
    } else if (r < accuracy + 0.30) {
      hB++;
      const scorer = cfg.isPlayerHome ? pickScorerId(cfg.playerLineup) : null;
      if (scorer) {
        state.goalAttribution[scorer] = state.goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        state.goalAttribution[scorer].behinds++;
        state.goalAttribution[scorer].votesScore += 1;
      }
      qEvents.push({ q: q + 1, minute, side: 'home', kind: 'behind', scorer });
    } else {
      qEvents.push({ q: q + 1, minute, side: 'home', kind: 'miss' });
    }
  }

  // Away shots
  for (let i = 0; i < awayShots; i++) {
    const accuracy = CLAMP((0.42 - diffWithStop * 0.004 + (rng() - 0.5) * 0.18) * cfg.groundAccuracy * cfg.awayAccMod, 0.10, 0.78);
    const minute = rand(q * 25, q * 25 + 24);
    const r = rng();
    if (r < accuracy) {
      aG++;
      const scorer = !cfg.isPlayerHome ? pickScorerId(cfg.playerLineup) : null;
      if (scorer) {
        state.goalAttribution[scorer] = state.goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        state.goalAttribution[scorer].goals++;
        state.goalAttribution[scorer].votesScore += 8;
      }
      qEvents.push({ q: q + 1, minute, side: 'away', kind: 'goal', scorer });
      momentum = CLAMP(momentum - 0.05 * oppProfile.momentumGain, -1, 1);
    } else if (r < accuracy + 0.30) {
      aB++;
      const scorer = !cfg.isPlayerHome ? pickScorerId(cfg.playerLineup) : null;
      if (scorer) {
        state.goalAttribution[scorer] = state.goalAttribution[scorer] || { goals: 0, behinds: 0, votesScore: 0 };
        state.goalAttribution[scorer].behinds++;
        state.goalAttribution[scorer].votesScore += 1;
      }
      qEvents.push({ q: q + 1, minute, side: 'away', kind: 'behind', scorer });
    } else {
      qEvents.push({ q: q + 1, minute, side: 'away', kind: 'miss' });
    }
  }

  // Key moments
  const numMoments = rng() < 0.45 ? 1 : rng() < 0.20 ? 2 : 0;
  for (let i = 0; i < numMoments; i++) {
    const moment = pickMoment();
    const side = rng() < 0.5 ? 'home' : 'away';
    let playerId: string | null = null;
    if (side === (cfg.isPlayerHome ? 'home' : 'away') && cfg.playerLineup.length) {
      const filtered = moment.posKey
        ? cfg.playerLineup.filter((p) => moment.posKey!.includes(p.position) || moment.posKey!.includes(p.secondaryPosition ?? ''))
        : cfg.playerLineup;
      playerId = filtered.length ? pick(filtered).id : pick(cfg.playerLineup).id;
    }
    const ke: KeyMoment = {
      q: q + 1,
      minute: rand(q * 25, q * 25 + 24),
      side,
      kind: 'moment',
      moment: moment.id,
      text: moment.text,
      playerId,
    };
    qEvents.push(ke);
    state.keyMoments.push(ke);
    if (moment.injuryRisk && playerId) state.injuredPlayerIds.push(playerId);
    if (moment.suspensionRisk && playerId) state.reportedPlayerIds.push(playerId);
    if (moment.voteImpact && playerId) {
      state.goalAttribution[playerId] = state.goalAttribution[playerId] || { goals: 0, behinds: 0, votesScore: 0 };
      state.goalAttribution[playerId].votesScore += 4 * moment.voteImpact;
    }
    momentum = CLAMP(momentum + (side === 'home' ? 1 : -1) * moment.momentumImpact, -1, 1);
  }

  qEvents.sort((a, b) => a.minute - b.minute);
  state.events.push(...qEvents);

  const qHomeTot = hG * 6 + hB;
  const qAwayTot = aG * 6 + aB;
  state.runHomePts += qHomeTot;
  state.runAwayPts += qAwayTot;
  state.momentum = momentum;

  state.quarters.push({
    homeGoals: hG, homeBehinds: hB, homeTotal: qHomeTot,
    awayGoals: aG, awayBehinds: aB, awayTotal: qAwayTot,
    events: qEvents,
    momentumEnd: momentum,
  });

  return state;
}

function finishMatchSim(state: MatchSimState): SimResult {
  const { quarters, events, keyMoments, goalAttribution, injuredPlayerIds, reportedPlayerIds } = state;
  const homeGoals = quarters.reduce((a, q) => a + q.homeGoals, 0);
  const homeBehinds = quarters.reduce((a, q) => a + q.homeBehinds, 0);
  const awayGoals = quarters.reduce((a, q) => a + q.awayGoals, 0);
  const awayBehinds = quarters.reduce((a, q) => a + q.awayBehinds, 0);
  const homeTotal = homeGoals * 6 + homeBehinds;
  const awayTotal = awayGoals * 6 + awayBehinds;

  // Brownlow votes
  const voteCandidates = Object.entries(goalAttribution)
    .map(([id, v]) => ({ playerId: id, score: v.votesScore }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const votes = voteCandidates.map((c, i) => ({ playerId: c.playerId, votes: 3 - i, score: c.score }));

  return {
    homeGoals, homeBehinds, homeTotal,
    awayGoals, awayBehinds, awayTotal,
    winner: homeTotal === awayTotal ? 'draw' : homeTotal > awayTotal ? 'home' : 'away',
    quarters,
    events,
    keyMoments,
    votes,
    goalAttribution,
    injuredPlayerIds,
    reportedPlayerIds,
  };
}

// ---- Message handler ----

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, payload } = e.data;
  try {
    switch (type) {
      case 'INIT': {
        seedRng(Date.now() % 100000);
        simState = initMatchSim(payload);
        const response: WorkerResponse = { type: 'INIT_DONE', payload: { state: simState } };
        self.postMessage(response);
        break;
      }
      case 'QUARTER': {
        if (!simState) throw new Error('Sim not initialized');
        simState = simMatchQuarter(simState, payload);
        const response: WorkerResponse = { 
          type: 'QUARTER_DONE', 
          payload: { state: simState, quarter: simState.quarters[simState.quarters.length - 1] } 
        };
        self.postMessage(response);
        break;
      }
      case 'FINISH': {
        if (!simState) throw new Error('Sim not initialized');
        const result = finishMatchSim(simState);
        const response: WorkerResponse = { type: 'FINISH_DONE', payload: result };
        self.postMessage(response);
        break;
      }
    }
  } catch (err) {
    const response: WorkerResponse = { type: 'ERROR', payload: err instanceof Error ? err.message : String(err) };
    self.postMessage(response);
  }
};