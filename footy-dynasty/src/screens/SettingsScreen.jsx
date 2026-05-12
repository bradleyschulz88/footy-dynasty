import React, { useRef } from "react";
import { Save, ChevronsUp, RefreshCw, FileDown, Upload } from "lucide-react";
import { css } from "../components/primitives.jsx";
import { DIFFICULTY_IDS, getDifficultyConfig, getDifficultyProfile } from "../lib/difficulty.js";
import { SLOT_IDS } from "../lib/save.js";
import { findClub } from "../data/pyramid.js";

// ============================================================================
// SETTINGS — save slots, new career, difficulty & preferences (game-wide)
// ============================================================================
export default function SettingsScreen({
  career,
  updateCareer,
  activeSlot,
  onExportCareer,
  onImportCareerFile,
  onSaveNow,
  onNewGame,
  slotMeta,
  slotMetaTick,
  showSlotPicker,
  onTogglePicker,
  onSwitchSlot,
  onDeleteSlot,
}) {
  const importRef = useRef(null);
  const opts = career.options || {};
  const patchOpts = (p) => updateCareer({ options: { ...opts, ...p } });
  const autosave = opts.autosave !== false;
  const setAutosave = (v) => patchOpts({ autosave: v });
  const uiDensity = opts.uiDensity === 'compact' ? 'compact' : 'comfortable';
  const reduceMotion = !!opts.reduceMotion;
  const skipDestructiveConfirms = opts.confirmBeforeNewCareer === false && opts.confirmBeforeDeleteSlot === false;
  const slotLabel = opts.slotLabel ?? '';

  return (
    <div className="anim-in space-y-5 max-w-3xl">
      <div>
        <div className={`${css.h1} text-2xl md:text-3xl tracking-wide`}>SETTINGS</div>
        <p className="text-sm text-atext-dim mt-1 leading-relaxed">
          Saves, slots, and preferences — separate from Club operations.
        </p>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <h3 className={`${css.h1} text-xl md:text-2xl tracking-wide`}>SAVE GAME</h3>
        <p className="text-xs text-atext-dim leading-relaxed">
          Write the current career to the active slot. Use slots to switch careers or delete saves.
        </p>
        {onSaveNow && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onSaveNow}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-apanel-2 hover:bg-aaccent/10 hover:text-aaccent transition text-xs font-bold uppercase tracking-widest font-mono text-atext-dim border border-aline"
              >
                <Save className="w-4 h-4" /> Save now{activeSlot ? ` · Slot ${activeSlot}` : ''}
              </button>
              <button
                type="button"
                onClick={onTogglePicker}
                className="px-4 py-3 rounded-xl bg-apanel-2 hover:bg-aaccent/10 hover:text-aaccent transition border border-aline"
                title="Slots"
              >
                <ChevronsUp className="w-4 h-4 text-atext-dim" />
              </button>
            </div>
            {showSlotPicker && SLOT_IDS && (
              <div className="rounded-xl overflow-hidden text-[11px]" style={{ background: 'var(--A-panel-2)', border: '1px solid var(--A-line)' }} key={slotMetaTick}>
                {SLOT_IDS.map((s) => {
                  const meta = slotMeta?.[s];
                  const isActive = s === activeSlot;
                  return (
                    <div key={s} className={`flex items-center gap-2 px-3 py-2 ${isActive ? 'bg-aaccent/10' : ''}`} style={{ borderBottom: '1px solid var(--A-line)' }}>
                      <span className={`font-mono font-bold ${isActive ? 'text-aaccent' : 'text-atext-dim'}`}>{s}</span>
                      {meta ? (
                        <>
                          <span className="flex-1 text-atext-dim truncate">
                            {meta.slotLabel ? `${meta.slotLabel} · ` : ''}S{meta.season}{meta.week ? ` R${meta.week}` : ''} · {findClub(meta.clubId)?.short || meta.clubId}
                          </span>
                          {!isActive && (
                            <button type="button" onClick={() => onSwitchSlot?.(s)} className="text-aaccent hover:text-[#4ADBE8] font-bold shrink-0">
                              Load
                            </button>
                          )}
                          <button type="button" onClick={() => onDeleteSlot?.(s)} className="text-atext-mute hover:text-aneg shrink-0 px-1">
                            ×
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-atext-mute italic">Empty</span>
                          {career && !isActive && (
                            <button type="button" onClick={() => onSwitchSlot?.(s)} className="text-aaccent hover:text-[#4ADBE8] font-bold shrink-0">
                              Use
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onNewGame}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-aneg/25 text-atext-mute hover:text-aneg hover:bg-aneg/10 transition text-xs font-bold uppercase tracking-widest font-mono"
        >
          <RefreshCw className="w-4 h-4" /> Start new career
        </button>
        <p className="text-[10px] text-atext-mute uppercase tracking-widest font-mono text-center">Footy Dynasty</p>
      </div>

      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>DIFFICULTY</h3>
        <p className="text-xs text-atext-dim mb-4">Matches the career wizard — cash, injuries, board patience, and tutorials all follow this profile.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {DIFFICULTY_IDS.map((id) => {
            const profile = getDifficultyProfile(id);
            const active = career.difficulty === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => updateCareer({ difficulty: id })}
                className={`text-left p-4 rounded-xl border transition-all ${active ? 'ring-2' : 'hover:border-aaccent/40'}`}
                style={{
                  background: active ? `${profile.color}15` : 'var(--A-panel-2)',
                  borderColor: active ? profile.color : 'var(--A-line)',
                  ringColor: profile.color,
                }}
              >
                <div className="font-display text-lg mb-1" style={{ color: profile.color }}>{profile.label}</div>
                <div className="text-[11px] text-atext-dim leading-snug">{profile.summary}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <h3 className={`${css.h1} text-2xl`}>DISPLAY</h3>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-bold text-sm">UI density</div>
            <div className="text-[11px] text-atext-dim">Comfortable or compact base sizing.</div>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-aline">
            {(['comfortable', 'compact']).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => patchOpts({ uiDensity: d })}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${uiDensity === d ? 'bg-aaccent text-[#001520]' : 'bg-apanel-2 text-atext-dim'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-bold text-sm">Reduce motion</div>
            <div className="text-[11px] text-atext-dim">Cuts UI transitions where supported.</div>
          </div>
          <button
            type="button"
            onClick={() => patchOpts({ reduceMotion: !reduceMotion })}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition"
            style={{
              background: reduceMotion ? 'rgba(74,232,154,0.15)' : 'var(--A-panel-2)',
              color: reduceMotion ? '#4AE89A' : 'var(--A-text-dim)',
              border: `1px solid ${reduceMotion ? 'rgba(74,232,154,0.4)' : 'var(--A-line)'}`,
            }}
          >
            {reduceMotion ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <h3 className={`${css.h1} text-2xl`}>CONFIRMATIONS</h3>
        <p className="text-xs text-atext-dim">Destructive actions only. Keep on unless you really trust your clicks.</p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-bold text-sm">Skip double-checks</div>
            <div className="text-[11px] text-atext-dim">New career and deleting a save slot — no browser confirm.</div>
          </div>
          <button
            type="button"
            onClick={() =>
              patchOpts({
                confirmBeforeNewCareer: skipDestructiveConfirms ? true : false,
                confirmBeforeDeleteSlot: skipDestructiveConfirms ? true : false,
              })
            }
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition"
            style={{
              background: skipDestructiveConfirms ? 'rgba(232,74,111,0.12)' : 'var(--A-panel-2)',
              color: skipDestructiveConfirms ? '#E84A6F' : 'var(--A-text-dim)',
              border: `1px solid ${skipDestructiveConfirms ? 'rgba(232,74,111,0.35)' : 'var(--A-line)'}`,
            }}
          >
            {skipDestructiveConfirms ? 'Restore prompts' : 'Skip prompts'}
          </button>
        </div>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <h3 className={`${css.h1} text-2xl`}>ACTIVE SAVE SLOT</h3>
        <div>
          <div className={css.label}>Label (optional)</div>
          <input
            value={slotLabel}
            onChange={(e) => patchOpts({ slotLabel: e.target.value })}
            placeholder={`Slot ${activeSlot || '?'} — nickname this career`}
            className="w-full mt-2 bg-apanel border border-aline focus:border-aaccent outline-none rounded-lg px-3 py-2 text-sm text-atext"
          />
          <p className="text-[11px] text-atext-dim mt-2">Shown on the title screen and slot picker. Saves with your career.</p>
        </div>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <h3 className={`${css.h1} text-2xl`}>SAVE DATA</h3>
        <p className="text-xs text-atext-dim">Backup or move careers between browsers. Imported careers run through the same migration as loading a slot.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!activeSlot || typeof onExportCareer !== 'function'}
            onClick={() => onExportCareer && onExportCareer()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest ${activeSlot && onExportCareer ? `${css.btnPrimary}` : 'opacity-40 cursor-not-allowed bg-apanel-2'}`}
          >
            <FileDown className="w-4 h-4" /> Export JSON
          </button>
          <button
            type="button"
            disabled={typeof onImportCareerFile !== 'function'}
            onClick={() => importRef.current?.click()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-aline bg-apanel-2 hover:border-aaccent/40 ${!onImportCareerFile ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Upload className="w-4 h-4" /> Import JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && onImportCareerFile) onImportCareerFile(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <div className={`${css.panel} p-5 space-y-4`}>
        <h3 className={`${css.h1} text-2xl`}>TUTORIAL</h3>
        <button
          type="button"
          onClick={() => {
            const cfg = getDifficultyConfig(career.difficulty);
            const show = cfg.tutorialPolicy !== 'never';
            updateCareer({
              tutorialStep: show ? 0 : 6,
              tutorialComplete: !show,
            });
          }}
          className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-aline bg-apanel-2 hover:border-aaccent/40 text-atext"
        >
          Reset tutorial walkthrough
        </button>
        <p className="text-[11px] text-atext-dim">Difficulty policy may skip tutorials entirely — same rule as a new career.</p>
      </div>

      <div className={`${css.panel} p-5`}>
        <h3 className={`${css.h1} text-2xl mb-3`}>AUTOSAVE</h3>
        <p className="text-xs text-atext-dim mb-4">
          Autosave runs after advances and when you leave the game (browser permitting). Turn off to save only when you use Save now above.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-sm">Autosave on advance</div>
            <div className="text-[11px] text-atext-dim">Writes the active slot after event ticks.</div>
          </div>
          <button
            type="button"
            onClick={() => setAutosave(!autosave)}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition"
            style={{
              background: autosave ? 'rgba(74,232,154,0.15)' : 'var(--A-panel-2)',
              color: autosave ? '#4AE89A' : 'var(--A-text-dim)',
              border: `1px solid ${autosave ? 'rgba(74,232,154,0.4)' : 'var(--A-line)'}`,
            }}
          >
            {autosave ? 'On' : 'Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
