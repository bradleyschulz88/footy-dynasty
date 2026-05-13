import { useEffect, useRef } from "react";
import { writeSlot } from "../lib/save.js";
import { nextAutosaveDelayMs } from "../lib/autosaveTiming.js";
import { SETUP_SS_KEY, SETUP_SS_KEY_LEGACY } from "../lib/setupConstants.js";

/** Idle delay before autosave batches rapid `career` updates (main-thread stringify cost). */
const AUTOSAVE_DEBOUNCE_MS = 450;
/** Hard cap on time between disk writes while `career` keeps changing. */
const AUTOSAVE_MAX_WAIT_MS = 4000;

/** Autosave career to active slot when state stabilizes (respects options.autosave). */
export function useCareerAutosaveEffect(career, activeSlot, onAfterWrite) {
  const careerRef = useRef(career);
  const slotRef = useRef(activeSlot);
  const afterRef = useRef(onAfterWrite);
  const burstStartRef = useRef(0);
  careerRef.current = career;
  slotRef.current = activeSlot;
  afterRef.current = onAfterWrite;

  useEffect(() => {
    if (!career || !activeSlot) {
      burstStartRef.current = 0;
      return;
    }
    const opts = career.options || { autosave: true };
    if (!opts.autosave) {
      burstStartRef.current = 0;
      return;
    }

    const now = Date.now();
    if (!burstStartRef.current) burstStartRef.current = now;

    const delay = nextAutosaveDelayMs(
      now,
      burstStartRef.current,
      AUTOSAVE_DEBOUNCE_MS,
      AUTOSAVE_MAX_WAIT_MS,
    );

    const tid = window.setTimeout(() => {
      const c = careerRef.current;
      const slot = slotRef.current;
      if (!c || !slot || c.options?.autosave === false) return;
      burstStartRef.current = 0;
      writeSlot(slot, c);
      try {
        sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
        sessionStorage.removeItem(SETUP_SS_KEY);
      } catch (_) {
        /* ignore */
      }
      afterRef.current?.();
    }, delay);

    return () => {
      window.clearTimeout(tid);
    };
  }, [career, activeSlot]);
}

/** Flush save when tab hides (respects options.autosave). */
export function useCareerVisibilityFlushEffect(career, activeSlot, onAfterWrite) {
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "hidden" || !career || !activeSlot) return;
      if (career.options?.autosave === false) return;
      writeSlot(activeSlot, career);
      onAfterWrite?.();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [career, activeSlot, onAfterWrite]);
}

/** Mirrors density / reduce-motion prefs onto `<html>` data attributes for CSS. */
export function useCareerHtmlDatasetEffect(career) {
  useEffect(() => {
    if (!career) {
      delete document.documentElement.dataset.uiDensity;
      delete document.documentElement.dataset.reduceMotion;
      return undefined;
    }
    const density = career.options?.uiDensity === "compact" ? "compact" : "comfortable";
    document.documentElement.dataset.uiDensity = density;
    document.documentElement.dataset.reduceMotion = career.options?.reduceMotion ? "1" : "0";
    return () => {
      delete document.documentElement.dataset.uiDensity;
      delete document.documentElement.dataset.reduceMotion;
    };
  }, [career?.options?.uiDensity, career?.options?.reduceMotion, career]);
}
