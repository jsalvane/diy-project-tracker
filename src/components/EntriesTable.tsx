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
      <div className="overflow-x-auto border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] rounded-xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[rgba(0,0,20,0.025)] dark:bg-[rgba(255,255,255,0.025)] sticky top-0 z-10">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`text-[10px] font-semibold text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] uppercase tracking-[0.07em] px-3 py-3 border-b border-r border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)] ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-10 px-2 py-3 border-b border-r border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)] text-[10px] font-semibold text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] uppercase tracking-[0.07em]" title="Pending charge" />
              <th className="w-8 px-2 py-3 border-b border-r border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]" title="Receipt" />
              <th className="w-8 px-2 py-3 border-b border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]" />
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
                      ? 'bg-amber-50/50 dark:bg-amber-950/15 hover:bg-amber-50 dark:hover:bg-amber-950/25'
                      : 'hover:bg-[rgba(227,25,55,0.03)] dark:hover:bg-[rgba(255,77,92,0.04)]'
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
                  <td className="px-1 py-2 border-b border-[rgba(0,0,20,0.04)] dark:border-[rgba(255,255,255,0.04)] text-center">
                    <div className={isPending ? '' : 'table-row-actions'}>
                      <button
                        onClick={() => handleTogglePending(entry)}
                        className={`p-0.5 transition-colors rounded ${
                          isPending
                            ? 'text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
                            : 'text-[rgba(10,10,20,0.25)] dark:text-[rgba(226,226,240,0.2)] hover:text-amber-400 dark:hover:text-amber-500'
                        }`}
                        title={isPending ? 'Mark as purchased' : 'Mark as pending (future charge)'}
                      >
                        <ClockIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {/* Receipt button */}
                  <td className="px-1 py-2 border-b border-[rgba(0,0,20,0.04)] dark:border-[rgba(255,255,255,0.04)] text-center">
                    <div className={hasReceipt ? '' : 'table-row-actions'}>
                      <button
                        onClick={() => setReceiptEntryId(entry.id)}
                        className={`p-0.5 transition-colors ${
                          hasReceipt
                            ? 'text-[#E31937] dark:text-[#FF4D5C] hover:text-[#C41230] dark:hover:text-[#a5b4fc]'
                            : 'text-[rgba(10,10,20,0.25)] dark:text-[rgba(226,226,240,0.2)] hover:text-[rgba(10,10,20,0.5)] dark:hover:text-[rgba(226,226,240,0.5)]'
                        }`}
                        title={hasReceipt ? 'View receipt' : 'Add receipt'}
                      >
                        <CameraIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {/* Delete button */}
                  <td className="px-1 py-2 border-b border-[rgba(0,0,20,0.04)] dark:border-[rgba(255,255,255,0.04)] text-center">
                    <div className="table-row-actions">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-sm text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.2)] hover:text-red-500 dark:hover:text-red-400 p-0.5 transition-colors"
                        title="Delete entry"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={cols.length + 3}
                  className="text-center text-[13px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] py-10"
                >
                  No entries yet. Add one below or press{' '}
                  <kbd className="px-1.5 py-0.5 bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.07)] rounded text-xs font-mono">N</kbd>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => handleAddRow(false)}
          className="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-dashed border-[rgba(0,0,20,0.12)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:border-[#E31937] hover:text-[#E31937] dark:hover:border-[#FF4D5C] dark:hover:text-[#FF4D5C] transition-colors"
        >
          + Add Entry
        </button>
        <button
          onClick={() => handleAddRow(true)}
          className="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-dashed border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-500 hover:border-amber-400 hover:text-amber-700 dark:hover:border-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
        >
          <ClockIcon className="w-3.5 h-3.5" />
          Add Pending
        </button>
        <span className="text-[11px] text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]">
          Press <kbd className="px-1.5 py-0.5 bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.07)] rounded font-mono">N</kbd> to add a row
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
