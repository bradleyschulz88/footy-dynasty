import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useCareer } from '../lib/careerStore.js';

const COMMANDS = [
  { id: 'hub',      label: 'Go to Hub',        section: 'Navigate', key: 'hub' },
  { id: 'squad',    label: 'Go to Squad',       section: 'Navigate', key: 'squad' },
  { id: 'schedule', label: 'Go to Schedule',    section: 'Navigate', key: 'schedule' },
  { id: 'club',     label: 'Go to Club',        section: 'Navigate', key: 'club' },
  { id: 'draft',    label: 'Go to Draft Room',  section: 'Navigate', key: 'draft' },
];

export default function CommandPalette({ onNavigate, open, onClose }) {
  const [search, setSearch] = useState('');
  const career = useCareer();

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }}
        onClick={e => e.stopPropagation()}
      >
        <Command>
          <div style={{ borderBottom: '1px solid var(--A-line)' }}>
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search commands…"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--A-text)',
                fontSize: '14px',
              }}
            />
          </div>
          <Command.List style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px' }}>
            <Command.Empty style={{ padding: '16px', textAlign: 'center', color: 'var(--A-text-mute)', fontSize: '13px' }}>
              No results
            </Command.Empty>
            {['Navigate'].map(section => (
              <Command.Group key={section} heading={section}
                style={{ padding: '4px 0' }}>
                {COMMANDS.filter(c => c.section === section).map(cmd => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.label}
                    onSelect={() => { onNavigate(cmd.key); onClose(); }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--A-text)',
                    }}
                  >
                    {cmd.label}
                    {career?.team && cmd.id === 'hub' ? ` · ${career.team}` : ''}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--A-line)', fontSize: '11px', color: 'var(--A-text-mute)' }}>
            ↑↓ navigate · ↵ select · esc close
          </div>
        </Command>
      </div>
    </div>
  );
}
