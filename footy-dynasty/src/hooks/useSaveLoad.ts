// Save/Load hook - handles save slots, import/export, quick save
// Extracted from AFLManager.jsx

import { useCallback, useRef } from 'react';
import { useCareer, useUpdateCareer } from '../lib/careerStore.js';
import { 
  SAVE_VERSION, 
  SLOT_IDS, 
  LAST_EXPORT_STORAGE_KEY, 
  readSlot, 
  writeSlot, 
  deleteSlot, 
  readSlotMeta, 
  setActiveSlot, 
  migrate as migrateSave, 
  cloneSerializable 
} from '../lib/save.js';
import { recordGameEvent } from '../lib/gameAnalytics.js';

interface UseSaveLoadOptions {
  setScreen: (screen: string) => void;
  setTab: (tab: string | null) => void;
  activeSlot: string | null;
  setActiveSlot: (slot: string) => void;
  bumpSlotMeta: () => void;
}

export function useSaveLoad({
  setScreen,
  setTab,
  activeSlot,
  setActiveSlot,
  bumpSlotMeta,
}: UseSaveLoadOptions) {
  const career = useCareer();
  const updateCareer = useUpdateCareer();

  const shellRef = useRef({ career: null, setCareer: updateCareer, setScreen, setTab });
  shellRef.current = { career, setCareer: updateCareer, setScreen, setTab };

  // Quick save (Ctrl+S)
  const handleQuickSave = useCallback(() => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (!c || !activeSlot) return;
    
    try {
      writeSlot(activeSlot, c);
      bumpSlotMeta();
      sc({
        news: [{ week: c.week, type: 'info', text: '\u1F4BE Game saved.' }, ...(c.news || [])].slice(0, 25),
      });
    } catch {
      // ignore - manual save should never break the app
    }
  }, [activeSlot, bumpSlotMeta]);

  // Export career to file
  const handleExportCareer = useCallback(() => {
    const { career: c } = shellRef.current;
    if (!c || !activeSlot) return;
    
    const payload = {
      game: 'footy-dynasty',
      exportedAt: new Date().toISOString(),
      saveVersion: SAVE_VERSION,
      slot: activeSlot,
      career: c,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `footy-dynasty-${activeSlot}-season-${c.season}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    try {
      localStorage.setItem(LAST_EXPORT_STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore quota / private mode
    }
    bumpSlotMeta();
  }, [activeSlot, bumpSlotMeta]);

  // Import career from file
  const handleImportCareer = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const raw = data.career ?? data;
      if (!raw || typeof raw !== 'object') throw new Error('Invalid save file structure.');
      
      const migrated = migrateSave(raw);
      if (!migrated?.clubId) throw new Error('Missing club \u2014 not a Footy Dynasty career.');
      
      const suggested = activeSlot && SLOT_IDS.includes(activeSlot) ? activeSlot : 'A';
      const slotAns = window.prompt(`Import into slot A, B, or C?`, suggested);
      const slot = String(slotAns || '').trim().toUpperCase();
      if (!SLOT_IDS.includes(slot)) return;
      
      if (!window.confirm(`Overwrite slot ${slot} with this imported career? This cannot be undone.`)) return;
      
      writeSlot(slot, migrated);
      setActiveSlot(slot);
      setScreen('hub');
      setTab(null);
      bumpSlotMeta();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not import save.');
    }
  }, [activeSlot, setActiveSlot, bumpSlotMeta]);

  // Start new game
  const handleNewGame = useCallback((confirmBeforeNewCareer = true) => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (confirmBeforeNewCareer && c?.options?.confirmBeforeNewCareer !== false) {
      if (!window.confirm('Abandon your current career and start a new game?')) return;
    }
    
    sc(null);
    setScreen('hub');
    setTab(null);
    setActiveSlot(null);
  }, [setScreen, setTab, setActiveSlot]);

  // Save now (manual save)
  const handleSaveNow = useCallback(() => {
    const { career: c } = shellRef.current;
    if (!c || !activeSlot) return;
    
    writeSlot(activeSlot, c);
    bumpSlotMeta();
  }, [activeSlot, bumpSlotMeta]);

  // Switch save slot
  const handleSwitchSlot = useCallback((slot: string) => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (slot === activeSlot) return;
    
    if (c && activeSlot) writeSlot(activeSlot, c);
    const loaded = readSlot(slot);
    setActiveSlot(slot);
    sc(loaded);
    setScreen('hub');
    setTab(null);
  }, [activeSlot, setActiveSlot, setScreen, setTab]);

  // Delete save slot
  const handleDeleteSlot = useCallback((slot: string, confirmBeforeDeleteSlot = true) => {
    const { career: c, setCareer: sc } = shellRef.current;
    if (confirmBeforeDeleteSlot && c?.options?.confirmBeforeDeleteSlot !== false) {
      if (!window.confirm(`Delete save in slot ${slot}? This cannot be undone.`)) return;
    }
    
    deleteSlot(slot);
    if (slot === activeSlot) {
      setActiveSlot(null);
      sc(null);
    }
    bumpSlotMeta();
  }, [activeSlot, setActiveSlot, bumpSlotMeta]);

  return {
    handleQuickSave,
    handleExportCareer,
    handleImportCareer,
    handleNewGame,
    handleSaveNow,
    handleSwitchSlot,
    handleDeleteSlot,
  };
}