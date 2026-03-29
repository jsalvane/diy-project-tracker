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
    // Focus the first cell of the new row after render
    setTimeout(() => {
      // New entry will be sorted to top (today's date), find its index
      const newSorted = [...entries, entry].sort((a, b) => b.date.localeCompare(a.date));
      const idx = newSorted.findIndex((e) => e.id === entry.id);
      setFocusedCell({ row: idx >= 0 ? idx : 0, col: 0 });
    }, 0);
  }, [addEntry, projectId, entries]);

  // Keyboard shortcut: N for new row (when not editing)
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
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-2 border-b border-r border-gray-200 dark:border-gray-700 ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-10 px-2 py-2 border-b border-gray-200 dark:border-gray-700" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, rowIdx) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                <td className="px-1 py-1 border-b border-gray-200 dark:border-gray-700 text-center">
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-0.5"
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
                  className="text-center text-xs text-gray-400 dark:text-gray-500 py-8"
                >
                  No entries yet. Add one below or press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">N</kbd>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={handleAddRow}
          className="text-xs px-3 py-1.5 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400"
        >
          + Add Entry
        </button>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">N</kbd> to add a row
        </span>
      </div>
    </div>
  );
}
