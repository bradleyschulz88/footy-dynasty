// Client-side wrapper for Match Engine Web Worker
// Provides the same interface as matchEngine.ts but offloads to worker

type MatchWorkerState = {
  worker: Worker;
  resolve: (value: SimResult) => void;
  reject: (reason: Error) => void;
  quarterResolves: ((q: QuarterResult) => void)[];
  simState: MatchSimState | null;
};

type WorkerRequest = 
  | { type: 'INIT'; payload: MatchConfig }
  | { type: 'QUARTER'; payload: QuarterMods }
  | { type: 'FINISH' };

type WorkerResponse = 
  | { type: 'INIT_DONE'; payload: { state: MatchSimState } }
  | { type: 'QUARTER_DONE'; payload: { state: MatchSimState; quarter: QuarterResult } }
  | { type: 'FINISH_DONE'; payload: SimResult }
  | { type: 'ERROR'; payload: string };

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

type QuarterMods = { playerStrengthDelta?: number; oppStrengthDelta?: number };

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

let workerInstance: MatchWorkerState | null = null;

function getWorker(): Worker {
  if (!workerInstance) {
    const worker = new Worker(new URL('./matchEngineWorker.ts', import.meta.url), { type: 'module' });
    workerInstance = { worker, resolve: () => {}, reject: () => {}, quarterResolves: [], simState: null };
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => handleWorkerMessage(e.data);
    worker.onerror = (err) => {
      workerInstance?.reject(new Error(`Worker error: ${err.message}`));
      workerInstance = null;
    };
  }
  return workerInstance.worker;
}

function handleWorkerMessage(msg: WorkerResponse) {
  if (!workerInstance) return;
  switch (msg.type) {
    case 'INIT_DONE':
      workerInstance.simState = msg.payload.state;
      workerInstance.resolve({} as SimResult); // Will be overwritten
      break;
    case 'QUARTER_DONE':
      workerInstance.simState = msg.payload.state;
      const qResolve = workerInstance.quarterResolves.shift();
      if (qResolve) qResolve(msg.payload.quarter);
      break;
    case 'FINISH_DONE':
      workerInstance.resolve(msg.payload);
      workerInstance = null;
      break;
    case 'ERROR':
      workerInstance.reject(new Error(msg.payload));
      workerInstance = null;
      break;
  }
}

export async function initMatchSimWorker(opts: {
  home: { rating: number };
  away: { rating: number };
  isPlayerHome: boolean;
  playerStrength: number;
  tactic?: string;
  oppTactic?: string;
  playerLineup?: Player[];
  oppLineup?: Player[];
  groundScoringMod?: number;
  groundAccuracyMod?: number;
  weather?: string | null;
  homeFixtureAdvantage?: number;
}): Promise<void> {
  const config: MatchConfig = {
    isPlayerHome: opts.isPlayerHome,
    tactic: opts.tactic || 'balanced',
    oppTactic: opts.oppTactic || 'balanced',
    playerLineup: opts.playerLineup || [],
    oppLineup: opts.oppLineup || [],
    groundScoring: CLAMP(opts.groundScoringMod ?? 1.0, 0.5, 1.1),
    groundAccuracy: CLAMP(opts.groundAccuracyMod ?? 1.0, 0.5, 1.1),
    homeAccMod: 1,
    awayAccMod: 1,
    hAdv: opts.homeFixtureAdvantage ?? 4,
    homeRating: opts.home.rating ?? 60,
    awayRating: opts.away.rating ?? 60,
    playerStrength: opts.playerStrength,
    playerStrengthByQuarter: null,
    oppStrengthByQuarter: null,
  };

  getWorker().postMessage({ type: 'INIT', payload: config });
  
  await new Promise<void>((resolve, reject) => {
    if (!workerInstance) return reject(new Error('Worker not initialized'));
    workerInstance.resolve = resolve;
    workerInstance.reject = reject;
  });
}

export async function simMatchQuarterWorker(mods: QuarterMods = {}): Promise<QuarterResult> {
  if (!workerInstance) throw new Error('Worker not initialized');
  
  getWorker().postMessage({ type: 'QUARTER', payload: mods });
  
  return new Promise<QuarterResult>((resolve, reject) => {
    workerInstance!.quarterResolves.push(resolve);
    // Timeout fallback
    setTimeout(() => {
      const idx = workerInstance!.quarterResolves.indexOf(resolve);
      if (idx >= 0) {
        workerInstance!.quarterResolves.splice(idx, 1);
        reject(new Error('Quarter sim timeout'));
      }
    }, 5000);
  });
}

export async function finishMatchSimWorker(): Promise<SimResult> {
  if (!workerInstance) throw new Error('Worker not initialized');
  
  getWorker().postMessage({ type: 'FINISH' });
  
  return new Promise<SimResult>((resolve, reject) => {
    workerInstance!.resolve = resolve;
    workerInstance!.reject = reject;
  });
}

// Compatibility layer - maintains the same API as matchEngine.ts
export function simMatchEvents(
  home: { rating: number },
  away: { rating: number },
  isPlayerHome: boolean,
  playerStrength: number,
  opts: {
    tactic?: string;
    oppTactic?: string;
    playerLineup?: Player[];
    oppLineup?: Player[];
    groundScoringMod?: number;
    groundAccuracyMod?: number;
    weather?: string | null;
    homeFixtureAdvantage?: number;
  } = {}
): Promise<SimResult> {
  return (async () => {
    await initMatchSimWorker({ home, away, isPlayerHome, playerStrength, ...opts });
    for (let q = 0; q < 4; q++) {
      await simMatchQuarterWorker();
    }
    return finishMatchSimWorker();
  })();
}

function CLAMP(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}