import React, { useEffect, useRef } from 'react';

export default function PlayerContextMenu({ player, pos, onClose, actions }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Clamp to viewport so menu doesn't go off-screen
  const menuWidth = 200;
  const menuMaxHeight = 280;
  const x = Math.min(pos.x, window.innerWidth - menuWidth - 8);
  const y = Math.min(pos.y, window.innerHeight - menuMaxHeight - 8);

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: menuWidth,
        zIndex: 9000,
        background: 'var(--A-panel)',
        border: '1px solid var(--A-line)',
        borderRadius: '12px',
        padding: '6px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      <div className="text-[10px] font-mono uppercase tracking-widest text-atext-mute px-2 py-1 mb-1 truncate">
        {player.firstName} {player.lastName}
      </div>
      <div style={{ borderTop: '1px solid var(--A-line)', marginBottom: 4 }} />
      {actions.map((a) => (
        <button
          key={a.id}
          role="menuitem"
          type="button"
          disabled={a.disabled}
          onClick={() => { a.onClick(); onClose(); }}
          className="w-full text-left px-3 py-2 rounded-lg text-[13px] transition flex items-center gap-2 disabled:opacity-40"
          style={{
            color: a.danger ? 'var(--A-neg)' : 'var(--A-text)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => { if (!a.disabled) e.currentTarget.style.background = 'var(--A-panel-2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {a.icon && <span>{a.icon}</span>}
          {a.label}
        </button>
      ))}
    </div>
  );
}
