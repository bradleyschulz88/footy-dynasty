import { toast } from 'sonner';

export const gameToast = {
  win:  (msg) => toast.success(msg, { duration: 4000 }),
  loss: (msg) => toast.error(msg,   { duration: 4000 }),
  info: (msg) => toast(msg,         { duration: 3500 }),
  milestone: (msg) => toast.success(msg, { duration: 6000, icon: '🏆' }),
};
