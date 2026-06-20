import { motion } from 'motion/react';

export default function DeadlineDayBanner({ tradePeriodDay, totalDays = 14 }) {
  const daysLeft = Math.max(0, totalDays - (tradePeriodDay ?? 0));
  if (daysLeft > 1) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl px-4 py-3 mb-3 flex items-center gap-3"
      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)' }}
    >
      <span className="text-lg">🚨</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>
          Deadline Day
        </div>
        <div className="text-[12px] text-atext-mute mt-0.5">
          {daysLeft === 0
            ? 'The trade window closes tonight — any unsigned deals expire at midnight.'
            : 'One day left in the trade window. Wrap up any deals.'}
        </div>
      </div>
    </motion.div>
  );
}
