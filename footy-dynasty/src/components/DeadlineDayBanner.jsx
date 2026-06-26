import { motion } from 'motion/react';

export default function DeadlineDayBanner({ tradePeriodDay, totalDays = 14 }) {
  const daysLeft = Math.max(0, totalDays - (tradePeriodDay ?? 0));
  // Not in trade period
  if (daysLeft >= totalDays) return null;

  // Deadline day: prominent red banner
  if (daysLeft <= 1) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3 animate-pulse"
        style={{ background: 'color-mix(in srgb, var(--A-neg) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--A-neg) 40%, transparent)' }}
      >
        <span className="text-lg">🚨</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--A-neg)' }}>
            DEADLINE DAY
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--A-text-mute)' }}>
            {daysLeft === 0
              ? 'The trade window closes tonight — any unsigned deals expire at midnight.'
              : 'Trade window closes tonight — clubs are getting desperate'}
          </div>
        </div>
      </motion.div>
    );
  }

  // More than 1 day remaining: subtle muted indicator
  return (
    <div className="text-xs font-mono text-center mb-3" style={{ color: 'var(--A-text-mute)' }}>
      Trade Window: {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
    </div>
  );
}
