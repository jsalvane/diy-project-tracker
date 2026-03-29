import { useState, useCallback, useEffect } from 'react';
import type { Entry } from '../lib/types';
import { ENTRY_COLUMNS } from '../lib/constants';
import { EditableCell } from './EditableCell';
import { useApp } from '../context/AppContext';
import { todayStr } from '../lib/utils';

interface Props {
  entries: Entry[];
  projectId: string;
}

export function EntriesTable({ entries, projectId }: Props) {
  const { addEntry, updateEntry, deleteEntry } = useApp();
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);

  // Sort: newest date first
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const cols = ENTRY_COLUMNS;
  const editableKeys = cols.map((c) => c.key);

  const handleSave = useCallback(
    (entry: Entry, key: keyof Entry, value: string | number) => {
      updateEntry({ ...entry, [key]: value });
    },
    [updateEntry]
  );

  const handleNavigate = useCallback(
    (row: number, col: number, direction: 'tab' | 'shift-tab' | 'enter' | 'escape') => {
      if (direction === 'escape') {
        setFocusedCell(null);
        return;
      }

      let nextRow = row;
      let nextCol = col;

      if (direction === 'tab') {
        nextCol++;
        if (nextCol >= cols.length) {
          nextCol = 0;
          nextRow++;
        }
      } else if (direction === 'shift-tab') {
        nextCol--;
        if (nextCol < 0) {
          nextCol = cols.length - 1;
          nextRow--;
        }
      } else if (direction === 'enter') {
        nextRow++;
      }

      if (nextRow < 0 || nextRow >= sorted.length) {
        setFocusedCell(null);
        return;
      }

      setFocusedCell({ row: nextRow, col: nextCol });
    },
    [cols.length, sorted.length]
  );

  const handleAddRow = useCallback(() => {
    const entry = addEntry({
      projectId,
      date: todayStr(),
      store: '',
      category: '',
      description: '',
      price: 0,
    });
    setTimeout(() => {
      const newSorted = [...entries, entry].sort((a, b) => b.date.localeCompare(a.date));
      const idx = newSorted.findIndex((e) => e.id === entry.id);
      setFocusedCell({ row: idx >= 0 ? idx : 0, col: 0 });
    }, 0);
  }, [addEntry, projectId, entries]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === 'n' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !focusedCell &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        handleAddRow();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedCell, handleAddRow]);

  return (
    <div>
      <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800 rounded-xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-10">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest px-3 py-3 border-b border-r border-gray-200 dark:border-zinc-800 ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-10 px-2 py-3 border-b border-gray-200 dark:border-zinc-800" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, rowIdx) => (
              <tr key={entry.id} className="hover:bg-orange-50/40 dark:hover:bg-orange-950/10 transition-colors">
                {cols.map((col, colIdx) => (
                  <EditableCell
                    key={col.key}
                    value={entry[col.key] as string | number}
                    column={col}
                    isFocused={focusedCell?.row === rowIdx && focusedCell?.col === colIdx}
                    onSave={(val) => handleSave(entry, editableKeys[colIdx], val)}
                    onNavigate={(dir) => handleNavigate(rowIdx, colIdx, dir)}
                    onFocus={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                  />
                ))}
                <td className="px-1 py-2 border-b border-gray-100 dark:border-zinc-800 text-center">
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-sm text-gray-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-400 p-0.5 transition-colors"
                    title="Delete entry"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={cols.length + 1}
                  className="text-center text-sm text-gray-400 dark:text-zinc-600 py-10"
                >
                  No entries yet. Add one below or press{' '}
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-xs font-mono">N</kbd>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleAddRow}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-500 hover:border-orange-400 hover:text-orange-500 dark:hover:border-orange-700 dark:hover:text-orange-400 transition-colors"
        >
          + Add Entry
        </button>
        <span className="text-xs text-gray-400 dark:text-zinc-600">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded font-mono">N</kbd> to add a row
        </span>
      </div>
    </div>
  );
}
