import { toast } from 'sonner';

export const gameToast = {
  win:  (msg) => toast.success(msg, { duration: 4000 }),
  loss: (msg) => toast.error(msg,   { duration: 4000 }),
  info: (msg) => toast(msg,         { duration: 3500 }),
  milestone: (msg) => toast.success(msg, { duration: 6000, icon: '🏆' }),
  signing: (msg) => toast.success(msg, { duration: 4000, icon: '✍️' }),
  trade: (msg) => toast.success(msg, { duration: 4000, icon: '🔁' }),
  injury: (msg) => toast.error(msg, { duration: 4500, icon: '🚑' }),
  board: (msg) => toast(msg, { duration: 4500, icon: '📋' }),
  promotion: (msg) => toast.success(msg, { duration: 6000, icon: '⬆️' }),
};
