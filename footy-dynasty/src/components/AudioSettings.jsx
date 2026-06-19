import { useState } from 'react';
import { audio } from '../lib/audio.js';

export default function AudioSettings() {
  const [vol, setVol] = useState(audio.getVolume());
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-atext-mute w-12">Sound</span>
      <input
        type="range" min={0} max={1} step={0.05}
        value={vol}
        onChange={e => { const v = parseFloat(e.target.value); setVol(v); audio.setVolume(v); }}
        className="flex-1 accent-[color:var(--A-accent)]"
      />
      <span className="text-[11px] text-atext-dim w-8 text-right">{Math.round(vol * 100)}%</span>
    </div>
  );
}
