// Match Engine Worker Client
// Uses Web Worker for match simulation, falls back to sync for tests/SSR

type MatchSimConfig = {
  isPlayerHome: boolean;
  tactic: string;
  oppTactic: string;
  playerLineup: any[];
  oppLineup: any[];
  groundScoring: number;
  groundAccuracy: number;
  homeAccMod: number;
  awayAccMod: number;
  hAdv: number;
  homeRating: number;
  awayRating: number;
  playerStrength: number;
  playerStrengthByQuarter?: number[];
  oppStrengthByQuarter?: number[];
};

type MatchSimResult = {
  homeGoals: number;
  homeBehinds: number;
  homeTotal: number;
  awayGoals: number;
  awayBehinds: number;
  awayTotal: number;
  winner: 'home' | 'away' | 'draw';
  quarters: any[];
  events: any[];
  keyMoments: any[];
  votes: any[];
  goalAttribution: Record<string, any>;
  injuredPlayerIds: string[];
  reportedPlayerIds: string[];
};

type WorkerMessage = 
  | { type: 'INIT'; payload: MatchSimConfig }
  | { type: 'QUARTER'; payload: { playerStrengthDelta?: number; oppStrengthDelta?: number } }
  | { type: 'FINISH' };

type WorkerResponse = 
  | { type: 'INIT_DONE' }
  | { type: 'QUARTER_DONE'; payload: any }
  | { type: 'FINISH_DONE'; payload: MatchSimResult }
  | { type: 'ERROR'; payload: string };

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./matchEngineWorker.ts', import.meta.url), { type: 'module' });
  }
  return worker;
}

function send<T>(message: WorkerMessage): Promise<T> {
  const w = getWorker();
  return new Promise((resolve, reject) => {
    const handler = (e: MessageEvent) => {
      const resp = e.data as WorkerResponse;
      if (resp.type === 'ERROR') reject(new Error(resp.payload));
      else if (resp.type === 'INIT_DONE' || resp.type === 'QUARTER_DONE' || resp.type === 'FINISH_DONE') {
        w.removeEventListener('message', handler);
        resolve((resp as any).payload);
      }
    };
    w.addEventListener('message', handler);
    w.postMessage(message);
  });
}

export async function initMatchSimWorker(config: MatchSimConfig): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = send<void>({ type: 'INIT', payload: config });
  return initPromise;
}

export async function simMatchQuarterWorker(mods?: { playerStrengthDelta?: number; oppStrengthDelta?: number }): Promise<any> {
  if (!initPromise) throw new Error('Match sim not initialized');
  await initPromise;
  return send({ type: 'QUARTER', payload: mods || {} });
}

export async function finishMatchSimWorker(): Promise<MatchSimResult> {
  if (!initPromise) throw new Error('Match sim not initialized');
  await initPromise;
  const result = await send<MatchSimResult>({ type: 'FINISH' });
  initPromise = null;
  worker?.terminate();
  worker = null;
  return result;
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    initPromise = null;
  }
}

// Check if we're in an environment that supports workers
export function supportsWorker(): boolean {
  return typeof Worker !== 'undefined' && !import.meta.env.SSR;
}