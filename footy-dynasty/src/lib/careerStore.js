// ---------------------------------------------------------------------------
// Zustand career store — single source of truth for the active career.
//
// Usage:
//   import { useCareer, useUpdateCareer } from './careerStore';
//   const career = useCareer();
//   const updateCareer = useUpdateCareer();
//
// Direct store access (outside React):
//   import { careerStore } from './careerStore';
//   careerStore.getState().setCareer(newCareer);
// ---------------------------------------------------------------------------
import { create } from 'zustand';
import { applyCareerPatch } from './inbox.js';

export const careerStore = create((set, get) => ({
  career: null,

  /** Replace the entire career (load, import, new game). Accepts a value or updater fn. */
  setCareer: (careerOrUpdater) => {
    if (typeof careerOrUpdater === 'function') {
      set({ career: careerOrUpdater(get().career) });
    } else {
      set({ career: careerOrUpdater });
    }
  },

  /** Merge a patch or apply an updater function — mirrors the old updateCareer helper. */
  updateCareer: (patchOrFn) => {
    set((state) => ({ career: applyCareerPatch(state.career, patchOrFn) }));
  },
}));

// ── Convenience hooks ───────────────────────────────────────────────────────
/** Returns the full career object. Re-renders on every career change. */
export const useCareer = () => careerStore((s) => s.career);

/**
 * Returns a single field from career. Only re-renders when that field changes.
 * Example: const week = useCareerField(c => c.week);
 */
export const useCareerField = (selector) => careerStore((s) => s.career ? selector(s.career) : undefined);

/** Returns the stable updateCareer action — safe to use as an effect dependency. */
export const useUpdateCareer = () => careerStore((s) => s.updateCareer);

/** Returns both career and updateCareer (common pair). */
export const useCareerWithUpdate = () => careerStore((s) => ({ career: s.career, updateCareer: s.updateCareer }));
