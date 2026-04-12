import { useState, useCallback, useEffect } from 'react';
import type { Entry } from '../lib/types';
import { ENTRY_COLUMNS } from '../lib/constants';
import { EditableCell } from './EditableCell';
import { ReceiptModal } from './ReceiptModal';
import { useApp } from '../context/AppContext';
import { uploadReceipt, deleteReceipt } from '../lib/receipts';
import { todayStr, formatCurrency, formatDate } from '../lib/utils';

interface Props {
  entries: Entry[];
  projectId: string;
}

// ── Mobile entry form modal ──────────────────────────────────────────────

interface EntryFormData {
  date: string;
  store: string;
  category: string;
  description: string;
  price: string;
  isPending: boolean;
}

const DEFAULT_FORM: EntryFormData = {
  date: todayStr(),
  store: '',
  category: '',
  description: '',
  price: '',
  isPending: false,
};

const formInputCls = 'w-full rounded-lg border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#161626] px-3 py-2.5 text-sm text-[#0a0a14] dark:text-[#e2e2f0] outline-none focus:border-[#E31937] dark:focus:border-[#FF4D5C] transition-colors';
const formLabelCls = 'block text-[10px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1';

function EntryFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Entry;
  onSave: (data: EntryFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<EntryFormData>(
    initial
      ? { date: initial.date, store: initial.store, category: initial.category, description: initial.description, price: String(initial.price || ''), isPending: initial.isPending }
      : DEFAULT_FORM
  );

  const set = <K extends keyof EntryFormData>(key: K, val: EntryFormData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]">
          <h2 className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0] text-sm">
            {initial ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] transition-colors text-lg leading-none p-1">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={formLabelCls}>Date</label>
              <input type="date" className={formInputCls} value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div>
              <label className={formLabelCls}>Price</label>
              <input type="number" step="0.01" min="0" className={formInputCls} value={form.price} onChange={e => set('price', e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" inputMode="decimal" required />
            </div>
          </div>
          <div>
            <label className={formLabelCls}>Store</label>
            <input className={formInputCls} value={form.store} onChange={e => set('store', e.target.value)} placeholder="e.g. Home Depot" />
          </div>
          <div>
            <label className={formLabelCls}>Category</label>
            <input className={formInputCls} value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Materials" />
          </div>
          <div>
            <label className={formLabelCls}>Description</label>
            <input className={formInputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was this for?" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox" checked={form.isPending}
              onChange={e => set('isPending', e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500"
            />
            <span className="text-sm text-amber-600 dark:text-amber-400">Pending charge</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-semibold px-4 py-2.5 rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.55)] dark:text-[rgba(226,226,240,0.65)] hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-lg bg-[#E31937] hover:bg-[#C41230] text-white transition-colors">
              {initial ? 'Save' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Mobile entry card ─────────────────────────────────────────────────────

function EntryCard({
  entry,
  onEdit,
  onDelete,
  onTogglePending,
  onReceipt,
}: {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePending: () => void;
  onReceipt: () => void;
}) {
  const label = [entry.store, entry.description].filter(Boolean).join(' — ') || 'No description';
  const hasReceipt = Boolean(entry.receiptUrl);
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        entry.isPending
          ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-200/70 dark:border-amber-800/40'
          : 'bg-white dark:bg-[#111118] border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]'
      }`}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[#0a0a14] dark:text-[#e2e2f0] truncate">{label}</div>
          <div className="text-[11px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mt-0.5 flex flex-wrap gap-x-2">
            <span>{formatDate(entry.date)}</span>
            {entry.category && <span>&middot; {entry.category}</span>}
            {entry.isPending && <span className="text-amber-500 font-semibold">Pending</span>}
          </div>
        </div>
        <div className="text-[15px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] shrink-0">
          {formatCurrency(entry.price)}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[rgba(0,0,20,0.05)] dark:border-[rgba(255,255,255,0.04)]" onClick={e => e.stopPropagation()}>
        <button onClick={onTogglePending} className={`p-1.5 rounded-lg transition-colors ${entry.isPending ? 'text-amber-500' : 'text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]'}`} title={entry.isPending ? 'Mark purchased' : 'Mark pending'}>
          <ClockIcon className="w-4 h-4" />
        </button>
        <button onClick={onReceipt} className={`p-1.5 rounded-lg transition-colors ${hasReceipt ? 'text-[#E31937] dark:text-[#FF4D5C]' : 'text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]'}`} title={hasReceipt ? 'View receipt' : 'Add receipt'}>
          <CameraIcon className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button onClick={onDelete} className="p-1.5 rounded-lg text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)] hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function EntriesTable({ entries, projectId }: Props) {
  const { addEntry, updateEntry, deleteEntry } = useApp();
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [receiptEntryId, setReceiptEntryId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mobileFormEntry, setMobileFormEntry] = useState<Entry | null | 'add'>(null);

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

  const handleMobileFormSave = useCallback((data: EntryFormData) => {
    if (mobileFormEntry && mobileFormEntry !== 'add') {
      updateEntry({ ...mobileFormEntry, date: data.date, store: data.store, category: data.category, description: data.description, price: parseFloat(data.price) || 0, isPending: data.isPending });
    } else {
      addEntry({ projectId, date: data.date, store: data.store, category: data.category, description: data.description, price: parseFloat(data.price) || 0, isPending: data.isPending });
    }
    setMobileFormEntry(null);
  }, [mobileFormEntry, updateEntry, addEntry, projectId]);

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
      {/* ── Mobile: card layout ── */}
      <div className="sm:hidden space-y-2">
        {sorted.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={() => setMobileFormEntry(entry)}
            onDelete={() => handleDeleteEntry(entry.id)}
            onTogglePending={() => handleTogglePending(entry)}
            onReceipt={() => setReceiptEntryId(entry.id)}
          />
        ))}
        {sorted.length === 0 && (
          <div className="text-center text-[13px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] py-10">
            No entries yet — tap below to add one.
          </div>
        )}
      </div>

      {/* ── Desktop: table layout ── */}
      <div className="hidden sm:block overflow-x-auto scrollbar-hide border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] rounded-xl">
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

      {/* ── Add buttons ── */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {/* Mobile: opens form modal; Desktop: adds inline row */}
        <button
          onClick={() => {
            if (window.innerWidth < 640) setMobileFormEntry('add');
            else handleAddRow(false);
          }}
          className="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-dashed border-[rgba(0,0,20,0.12)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:border-[#E31937] hover:text-[#E31937] dark:hover:border-[#FF4D5C] dark:hover:text-[#FF4D5C] transition-colors"
        >
          + Add Entry
        </button>
        <button
          onClick={() => handleAddRow(true)}
          className="hidden sm:flex text-[13px] font-medium px-3 py-1.5 rounded-lg border border-dashed border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-500 hover:border-amber-400 hover:text-amber-700 dark:hover:border-amber-600 dark:hover:text-amber-400 transition-colors items-center gap-1.5"
        >
          <ClockIcon className="w-3.5 h-3.5" />
          Add Pending
        </button>
        <span className="hidden sm:inline text-[11px] text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]">
          Press <kbd className="px-1.5 py-0.5 bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.07)] rounded font-mono">N</kbd> to add a row
        </span>
      </div>

      {/* ── Mobile form modal ── */}
      {mobileFormEntry && (
        <EntryFormModal
          initial={mobileFormEntry !== 'add' ? mobileFormEntry : undefined}
          onSave={handleMobileFormSave}
          onClose={() => setMobileFormEntry(null)}
        />
      )}

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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
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
