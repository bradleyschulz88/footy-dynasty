// Motion presets — single source of truth for all animations
// Import: import { motionPresets, useStagger, usePageTransition } from './motionPresets';

import { Variants, Transition } from 'motion/react';

// ============================================================================
// Easing curves
// ============================================================================
export const easings = {
  // Standard material-style
  standard: [0.22, 1, 0.36, 1] as const,
  // Snappy entrance
  snappy: [0.2, 0, 0, 1] as const,
  // Smooth deceleration
  easeOut: [0, 0, 0.2, 1] as const,
  // Sharp acceleration
  easeIn: [0.4, 0, 1, 1] as const,
  // Bouncy (for celebrations)
  spring: { type: 'spring', stiffness: 260, damping: 20 } as const,
  // Gentle spring
  springGentle: { type: 'spring', stiffness: 180, damping: 18 } as const,
};

// ============================================================================
// Duration tokens (ms)
// ============================================================================
export const durations = {
  instant: 50,
  fast: 120,
  normal: 200,
  slow: 320,
  slower: 480,
  page: 350,
};

// ============================================================================
// Core variants
// ============================================================================
export const motionPresets = {
  // Page/screen transitions
  pageEnter: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: durations.page / 1000, ease: easings.standard },
  } as Variants,

  // Modal/drawer slide up
  modalEnter: {
    initial: { opacity: 0, y: 40, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.98 },
    transition: { duration: durations.normal / 1000, ease: easings.standard },
  } as Variants,

  // Fade only
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: durations.fast / 1000, ease: easings.easeOut },
  } as Variants,

  // Slide from direction
  slideFromLeft: (px = 20) => ({
    initial: { opacity: 0, x: -px },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: px },
    transition: { duration: durations.normal / 1000, ease: easings.standard },
  }),

  slideFromRight: (px = 20) => ({
    initial: { opacity: 0, x: px },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -px },
    transition: { duration: durations.normal / 1000, ease: easings.standard },
  }),

  slideFromBottom: (px = 20) => ({
    initial: { opacity: 0, y: px },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -px },
    transition: { duration: durations.normal / 1000, ease: easings.standard },
  }),

  // Scale pop
  popIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: durations.fast / 1000, ease: easings.snappy },
  } as Variants,

  // List item stagger
  staggerContainer: {
    initial: {},
    animate: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
  } as Variants,

  staggerItem: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: durations.normal / 1000, ease: easings.standard },
  } as Variants,

  // Card hover
  cardHover: {
    rest: { y: 0, boxShadow: '0 4px 20px color-mix(in srgb, var(--A-accent) 15%, transparent)' },
    hover: { y: -4, boxShadow: '0 12px 40px color-mix(in srgb, var(--A-accent) 25%, transparent), 0 0 0 1px color-mix(in srgb, var(--A-accent) 40%, transparent)' },
    transition: { duration: durations.fast / 1000, ease: easings.easeOut },
  },

  // Button press
  buttonTap: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    transition: { duration: durations.instant / 1000, ease: easings.snappy },
  },

  // Score count-up
  countUp: (duration = 800) => ({
    initial: { opacity: 0 },
    animate: (value: number) => ({ opacity: 1 }),
    transition: { duration: duration / 1000, ease: easings.easeOut },
  }),

  // Progress ring
  ringDraw: {
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: { duration: durations.slow / 1000, ease: easings.standard },
  } as Variants,

  // Pulse (for live indicators)
  pulse: {
    animate: { opacity: [1, 0.5, 1] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  } as Variants,

  // Shimmer (skeleton loading)
  shimmer: {
    animate: { backgroundPosition: ['-200% 0', '200% 0'] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'linear' },
  } as Variants,

  // Badge appear
  badgePop: {
    initial: { opacity: 0, scale: 0.6, rotate: -12 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    transition: { duration: durations.fast / 1000, ease: easings.snappy },
  } as Variants,

  // Toast/snackbar
  toastEnter: {
    initial: { opacity: 0, y: 100, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 50, scale: 0.95 },
    transition: { duration: durations.normal / 1000, ease: easings.standard },
  } as Variants,
};

// ============================================================================
// Helper hooks
// ============================================================================

/** Generate stagger delay for index */
export function staggerDelay(index: number, base = 40, start = 60): number {
  return start + index * base;
}

/** Create a stagger container variant with custom timing */
export function createStaggerContainer(
  staggerMs = 40,
  delayChildrenMs = 60
): Variants {
  return {
    initial: {},
    animate: {
      transition: { staggerChildren: staggerMs / 1000, delayChildren: delayChildrenMs / 1000 },
    },
  };
}

/** Create a stagger item variant */
export function createStaggerItem(
  y = 12,
  duration = durations.normal
): Variants {
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration / 1000, ease: easings.standard },
  };
}

// ============================================================================
// Page transition hook
// ============================================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTransition() {
  const location = useLocation();
  const key = location.pathname + location.search;
  return key; // Use as key on AnimatePresence wrapper
}

// ============================================================================
// Reduced motion hook
// ============================================================================
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}