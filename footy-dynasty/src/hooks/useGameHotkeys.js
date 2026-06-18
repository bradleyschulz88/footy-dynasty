import { useEffect, useRef } from "react";
import { isTypingTarget } from "../lib/hotkeysHelpers.js";
import { tutorialAllowsNavigation } from "../components/TutorialOverlay.jsx";

const SCREEN_KEYS = ["hub", "squad", "schedule", "club", "recruit", "compete", "settings"];

/**
 * Global shortcuts when the main chrome is active (not match day / flows).
 * Space = advance time, ? = help, 1–7 = sidebar screens (when tutorial allows).
 */
export function useGameHotkeys({
  enabled,
  advanceDisabled,
  onAdvance,
  onOpenShortcuts,
  onNavigateScreen,
  onQuickSave,
  tutorialStep,
  tutorialComplete,
}) {
  const advanceRef = useRef(onAdvance);
  const navRef = useRef(onNavigateScreen);
  const openHelpRef = useRef(onOpenShortcuts);
  const quickSaveRef = useRef(onQuickSave);
  const disabledRef = useRef(advanceDisabled);

  useEffect(() => {
    advanceRef.current = onAdvance;
  }, [onAdvance]);
  useEffect(() => {
    quickSaveRef.current = onQuickSave;
  }, [onQuickSave]);
  useEffect(() => {
    navRef.current = onNavigateScreen;
  }, [onNavigateScreen]);
  useEffect(() => {
    openHelpRef.current = onOpenShortcuts;
  }, [onOpenShortcuts]);
  useEffect(() => {
    disabledRef.current = advanceDisabled;
  }, [advanceDisabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (ev) => {
      if (ev.defaultPrevented) return;

      // Ctrl/Cmd+S — quick-save to the active slot. Handled before the
      // modifier guard below (and works even while typing) so the browser's
      // own save dialog never opens.
      if ((ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === "s" || ev.key === "S")) {
        ev.preventDefault();
        try {
          quickSaveRef.current?.();
        } catch (_) {
          /* never let a save failure throw out of the key handler */
        }
        return;
      }

      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      const target = ev.target;
      if (isTypingTarget(target)) return;

      const step = tutorialStep ?? 0;
      const tutDone = !!tutorialComplete;

      if (ev.key === "?" || (ev.key === "/" && ev.shiftKey)) {
        ev.preventDefault();
        openHelpRef.current?.();
        return;
      }

      if (ev.key === " " || ev.code === "Space") {
        if (disabledRef.current) return;
        ev.preventDefault();
        advanceRef.current?.();
        return;
      }

      const digit = ev.key >= "1" && ev.key <= "7" ? Number(ev.key) - 1 : -1;
      if (digit >= 0) {
        const next = SCREEN_KEYS[digit];
        if (!next) return;
        if (!tutDone && !tutorialAllowsNavigation(step, next)) return;
        ev.preventDefault();
        navRef.current?.(next);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, tutorialStep, tutorialComplete]);
}
