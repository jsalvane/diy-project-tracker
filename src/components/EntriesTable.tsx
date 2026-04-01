import { useState, useCallback, useEffect } from 'react';
import type { Entry } from '../lib/types';
import { ENTRY_COLUMNS } from '../lib/constants';
import { EditableCell } from './EditableCell';
import { ReceiptModal } from './ReceiptModal';
import { useApp } from '../context/AppContext';
import { uploadReceipt, deleteReceipt } from '../lib/receipts';
import { todayStr } from '../lib/utils';

interface Props {
  entries: Entry[];
  projectId: string;
}

export function EntriesTable({ entries, projectId }: Props) {
  const { addEntry, updateEntry, deleteEntry } = useApp();
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [receiptEntryId, setReceiptEntryId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Sort: pending first, then newest date first
  const sorted = [...entries].sort((a, b) => {
    if (a.isPending !== b.isPending) return a.isPending ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  const cols = ENTRY_COLUMNS;
  const editableKeys = cols.map((c) => c.key);

  const handleUploadReceipt = useCallback(async (entry: Entry, file: File) => {
    setUploading(true);
    try {
      const url = await uploadReceipt(entry.id, file);
      updateEntry({ ...entry, receiptUrl: url });
    } finally {
      setUploading(false);
    }
  }, [updateEntry]);

  const handleRemoveReceipt = useCallback(async (entry: Entry) => {
    await deleteReceipt(entry.id);
    updateEntry({ ...entry, receiptUrl: '' });
    setReceiptEntryId(null);
  }, [updateEntry]);

  const handleDeleteEntry = useCallback((id: string) => {
    deleteReceipt(id).catch(() => {});
    deleteEntry(id);
  }, [deleteEntry]);

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

  const handleAddRow = useCallback((isPending = false) => {
    const entry = addEntry({
      projectId,
      date: todayStr(),
      store: '',
      category: '',
      description: '',
      price: 0,
      isPending,
    });
    setTimeout(() => {
      const newSorted = [...entries, entry].sort((a, b) => {
        if (a.isPending !== b.isPending) return a.isPending ? -1 : 1;
        return b.date.localeCompare(a.date);
      });
      const idx = newSorted.findIndex((e) => e.id === entry.id);
      setFocusedCell({ row: idx >= 0 ? idx : 0, col: 0 });
    }, 0);
  }, [addEntry, projectId, entries]);

  const handleTogglePending = useCallback((entry: Entry) => {
    updateEntry({ ...entry, isPending: !entry.isPending });
  }, [updateEntry]);

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

  const activeReceiptEntry = receiptEntryId
    ? sorted.find((e) => e.id === receiptEntryId) ?? null
    : null;

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
                {/* Pending column */}
              <th className="w-10 px-2 py-3 border-b border-r border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest" title="Pending charge" />
              {/* Receipt column */}
              <th className="w-8 px-2 py-3 border-b border-r border-gray-200 dark:border-zinc-800" title="Receipt" />
              {/* Delete column */}
              <th className="w-8 px-2 py-3 border-b border-gray-200 dark:border-zinc-800" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, rowIdx) => {
              const hasReceipt = Boolean(entry.receiptUrl);
              const isPending = entry.isPending;
              return (
                <tr
                  key={entry.id}
                  className={`transition-colors ${
                    isPending
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                      : 'hover:bg-orange-50/40 dark:hover:bg-orange-950/10'
                  }`}
                >
                  {cols.map((col, colIdx) => (
                    <EditableCell
                      key={col.key}
                      value={entry[col.key] as string | number}
                      column={col}
                      isFocused={focusedCell?.row === rowIdx && focusedCell?.col === colIdx}
                      onSave={(val) => handleSave(entry, editableKeys[colIdx], val)}
                      onNavigate={(dir) => handleNavigate(rowIdx, colIdx, dir)}
                      onFocus={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                      dimmed={isPending}
                    />
                  ))}
                  {/* Pending toggle */}
                  <td className="px-1 py-2 border-b border-gray-100 dark:border-zinc-800 text-center">
                    <button
                      onClick={() => handleTogglePending(entry)}
                      className={`p-0.5 transition-colors rounded ${
                        isPending
                          ? 'text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                          : 'text-gray-200 dark:text-zinc-700 hover:text-amber-400 dark:hover:text-amber-600'
                      }`}
                      title={isPending ? 'Mark as purchased' : 'Mark as pending (future charge)'}
                    >
                      <ClockIcon className="w-4 h-4" />
                    </button>
                  </td>
                  {/* Receipt button */}
                  <td className="px-1 py-2 border-b border-gray-100 dark:border-zinc-800 text-center">
                    <button
                      onClick={() => setReceiptEntryId(entry.id)}
                      className={`p-0.5 transition-colors ${
                        hasReceipt
                          ? 'text-orange-400 dark:text-orange-500 hover:text-orange-600 dark:hover:text-orange-300'
                          : 'text-gray-200 dark:text-zinc-700 hover:text-gray-400 dark:hover:text-zinc-500'
                      }`}
                      title={hasReceipt ? 'View receipt' : 'Add receipt'}
                    >
                      <CameraIcon className="w-4 h-4" />
                    </button>
                  </td>
                  {/* Delete button */}
                  <td className="px-1 py-2 border-b border-gray-100 dark:border-zinc-800 text-center">
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-sm text-gray-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-400 p-0.5 transition-colors"
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={cols.length + 3}
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
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => handleAddRow(false)}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-zinc-500 hover:border-orange-400 hover:text-orange-500 dark:hover:border-orange-700 dark:hover:text-orange-400 transition-colors"
        >
          + Add Entry
        </button>
        <button
          onClick={() => handleAddRow(true)}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border border-dashed border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-500 hover:border-amber-400 hover:text-amber-700 dark:hover:border-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
        >
          <ClockIcon className="w-3.5 h-3.5" />
          Add Pending
        </button>
        <span className="text-xs text-gray-400 dark:text-zinc-600">
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded font-mono">N</kbd> to add a row
        </span>
      </div>

      {activeReceiptEntry && (
        <ReceiptModal
          description={activeReceiptEntry.description}
          receiptUrl={activeReceiptEntry.receiptUrl ?? null}
          uploading={uploading}
          onUpload={(file) => handleUploadReceipt(activeReceiptEntry, file)}
          onRemove={() => handleRemoveReceipt(activeReceiptEntry)}
          onClose={() => setReceiptEntryId(null)}
        />
      )}
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
