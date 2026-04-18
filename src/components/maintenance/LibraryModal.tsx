import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { MAINTENANCE_PRESETS, CATEGORY_META, type PresetTask } from '../../lib/maintenancePresets';
import type { MaintenanceCategory, MaintenanceTask } from '../../lib/types';
import { useEscapeKey } from '../../lib/useEscapeKey';

interface Props {
  existingTasks: MaintenanceTask[];
  onImport: (presets: PresetTask[]) => void;
  onClose: () => void;
}

export function LibraryModal({ existingTasks, onImport, onClose }: Props) {
  useEscapeKey(onClose);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<MaintenanceCategory>>(new Set());

  const existingNames = useMemo(
    () => new Set(existingTasks.map(t => `${t.category}:${t.name}`)),
    [existingTasks],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return MAINTENANCE_PRESETS;
    const q = search.toLowerCase();
    return MAINTENANCE_PRESETS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      CATEGORY_META[p.category].label.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<MaintenanceCategory, { preset: PresetTask; index: number }[]>();
    filtered.forEach((p) => {
      const origIndex = MAINTENANCE_PRESETS.indexOf(p);
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push({ preset: p, index: origIndex });
    });
    return map;
  }, [filtered]);

  function togglePreset(index: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleCategory(cat: MaintenanceCategory) {
    const items = grouped.get(cat) ?? [];
    const selectableItems = items.filter(i => !existingNames.has(`${i.preset.category}:${i.preset.name}`));
    const allSelected = selectableItems.every(i => selected.has(i.index));
    setSelected(prev => {
      const next = new Set(prev);
      selectableItems.forEach(i => {
        if (allSelected) next.delete(i.index);
        else next.add(i.index);
      });
      return next;
    });
  }

  function toggleCollapse(cat: MaintenanceCategory) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function handleImport() {
    const presets = Array.from(selected).map(i => MAINTENANCE_PRESETS[i]);
    onImport(presets);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(26,22,18,0.4)] " onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-[var(--paper)] rounded-[14px] border border-[var(--ink-line)]  animate-[scale-in_0.28s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--ink-line)] shrink-0">
          <h3 className="text-base font-semibold text-[var(--ink)]">Task Library</h3>
          <button onClick={onClose} className="text-[var(--ink-4)] hover:text-[var(--ink)] text-lg leading-none">&times;</button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2 shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="field"
          />
        </div>

        {/* Preset list */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {Array.from(grouped.entries()).map(([cat, items]) => {
            const meta = CATEGORY_META[cat];
            const isCollapsed = collapsed.has(cat);
            const selectableItems = items.filter(i => !existingNames.has(`${i.preset.category}:${i.preset.name}`));
            const allSelected = selectableItems.length > 0 && selectableItems.every(i => selected.has(i.index));

            return (
              <div key={cat} className="mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    onClick={() => toggleCollapse(cat)}
                    className="text-xs text-[var(--ink-4)] hover:text-[var(--ink)]"
                  >
                    {isCollapsed ? '▸' : '▾'}
                  </button>
                  <span className="text-sm">{meta.icon}</span>
                  <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)]">
                    {meta.label}
                  </span>
                  {selectableItems.length > 0 && (
                    <button
                      onClick={() => toggleCategory(cat)}
                      className="ml-auto text-[11px] font-medium text-[var(--rust)] hover:underline"
                    >
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>
                {!isCollapsed && items.map(({ preset, index }) => {
                  const alreadyAdded = existingNames.has(`${preset.category}:${preset.name}`);
                  return (
                    <label
                      key={index}
                      className={`flex items-center gap-3 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-[var(--paper-2)] ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={alreadyAdded || selected.has(index)}
                        disabled={alreadyAdded}
                        onChange={() => togglePreset(index)}
                        className="rounded border-[rgba(0,0,20,0.2)] text-[var(--rust)] focus:ring-[var(--rust)]"
                      />
                      <span className="text-sm text-[var(--ink)]">{preset.name}</span>
                      {alreadyAdded && (
                        <span className="ml-auto text-[10px] font-medium text-[var(--ink-4)]">Added</span>
                      )}
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--ink-line)] shrink-0">
          <button
            onClick={handleImport}
            disabled={selected.size === 0}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--rust)] text-[var(--paper)] hover:bg-[var(--rust-ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add Selected ({selected.size})
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
