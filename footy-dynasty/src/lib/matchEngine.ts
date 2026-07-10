// Re-export all synchronous functions from matchEngine.js for backward compatibility
export * from './matchEngine.js';

// Worker-based async match simulation
export { 
  initMatchSimWorker, 
  simMatchQuarterWorker, 
  finishMatchSimWorker,
  terminateWorker,
  supportsWorker,
  type MatchSimConfig,
  type MatchSimResult
} from './matchEngineWorker.ts';