/** Next delay (ms) for debounced autosave with a max dwell between writes. */
export function nextAutosaveDelayMs(nowMs, burstStartMs, debounceMs, maxWaitMs) {
  const sinceBurst = burstStartMs > 0 ? nowMs - burstStartMs : 0;
  return Math.min(debounceMs, Math.max(0, maxWaitMs - sinceBurst));
}
