import { useEffect } from "react";
import { writeSlot } from "../lib/save.js";
import { SETUP_SS_KEY, SETUP_SS_KEY_LEGACY } from "../lib/setupConstants.js";

/** Autosave career to active slot when state changes (respects options.autosave). */
export function useCareerAutosaveEffect(career, activeSlot, onAfterWrite) {
  useEffect(() => {
    if (!career || !activeSlot) return;
    const opts = career.options || { autosave: true };
    if (!opts.autosave) return;
    writeSlot(activeSlot, career);
    sessionStorage.removeItem(SETUP_SS_KEY_LEGACY);
    sessionStorage.removeItem(SETUP_SS_KEY);
    onAfterWrite?.();
  }, [career, activeSlot, onAfterWrite]);
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
