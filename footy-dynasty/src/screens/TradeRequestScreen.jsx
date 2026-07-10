import { useState } from 'react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';

export default function TradeRequestScreen({ onComplete }) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();
  const [idx, setIdx] = useState(0);

  const requests = career.pendingTradeRequests || [];
  const current = requests[idx];

  if (!current) {
    onComplete();
    return null;
  }

  function resolve(choice) {
    updateCareer(c => {
      const reqs = c.pendingTradeRequests || [];
      let updatedSquad = c.squad || [];
      let newsText = '';

      if (choice === 'grant') {
        updatedSquad = updatedSquad.map(p =>
          p.id === current.playerId ? { ...p, hasTradeRequest: false, tradeRequested: true } : p
        );
        newsText = `✅ Club grants ${current.playerName}'s trade request. They will be available for trade.`;
      } else if (choice === 'negotiate') {
        updatedSquad = updatedSquad.map(p =>
          p.id === current.playerId ? { ...p, hasTradeRequest: false, morale: Math.min(100, (p.morale ?? 70) + 8) } : p
        );
        newsText = `🤝 ${current.playerName} agrees to stay after contract talks. Cost the club $20k in goodwill payments.`;
      } else {
        updatedSquad = updatedSquad.map(p =>
          p.id === current.playerId
            ? { ...p, hasTradeRequest: false, morale: Math.max(20, (p.morale ?? 70) - 15), form: Math.max(30, (p.form ?? 65) - 5) }
            : p
        );
        newsText = `❌ Club refuses ${current.playerName}'s trade request. Expect tension.`;
      }

      const newsType = choice === 'grant' ? 'info' : choice === 'negotiate' ? 'win' : 'warning';
      return {
        ...c,
        squad: updatedSquad,
        pendingTradeRequests: reqs.filter((_, i) => i !== idx),
        finance: choice === 'negotiate'
          ? { ...c.finance, cash: (c.finance?.cash ?? 0) - 20000 }
          : c.finance,
        news: [{ week: c.week, type: newsType, text: newsText }, ...(c.news || [])].slice(0, 25),
      };
    });

    if (idx + 1 >= requests.length) {
      onComplete();
    } else {
      setIdx(i => i + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="w-full max-w-md mx-4 rounded-2xl p-6"
        style={{ background: 'var(--A-panel)', border: '1px solid var(--A-line)' }}
      >
        <div
          className="text-xs font-mono uppercase tracking-widest mb-4"
          style={{ color: 'var(--A-neg)' }}
        >
          Trade Request
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--A-text)' }}>
          {current.playerName}
        </h2>
        <p className="text-sm mb-2" style={{ color: 'var(--A-text-dim)' }}>
          {current.position} · Rating {current.overall}
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--A-text-mute)' }}>
          They are {current.reason}.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => resolve('grant')}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: 'color-mix(in srgb, var(--A-accent) 15%, transparent)',
              color: 'var(--A-accent)',
              border: '1px solid color-mix(in srgb, var(--A-accent) 30%, transparent)',
            }}
          >
            Grant Trade Request — list them as available
          </button>
          <button
            onClick={() => resolve('negotiate')}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: 'color-mix(in srgb, var(--A-pos) 15%, transparent)',
              color: 'var(--A-pos)',
              border: '1px solid color-mix(in srgb, var(--A-pos) 30%, transparent)',
            }}
          >
            Negotiate — $20k, player stays (+8 morale)
          </button>
          <button
            onClick={() => resolve('refuse')}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              background: 'color-mix(in srgb, var(--A-neg) 15%, transparent)',
              color: 'var(--A-neg)',
              border: '1px solid color-mix(in srgb, var(--A-neg) 30%, transparent)',
            }}
          >
            Refuse — player stays, but very unhappy
          </button>
        </div>
        {requests.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-5">
            {requests.map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: i === idx ? 16 : 6,
                  height: 6,
                  background: i === idx ? 'var(--A-neg)' : 'rgba(255,255,255,0.18)',
                  transition: 'width 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
