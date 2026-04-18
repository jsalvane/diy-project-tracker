import { useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Entry } from '../lib/types';
import { ENTRY_COLUMNS } from '../lib/constants';
import { EditableCell } from './EditableCell';
import { ReceiptModal } from './ReceiptModal';
import { useApp } from '../context/AppContext';
import { uploadReceipt, deleteReceipt } from '../lib/receipts';
import { todayStr, formatCurrency, formatDate } from '../lib/utils';
import { useEscapeKey } from '../lib/useEscapeKey';

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

function EntryFormModal({
  initial,
  onSave,
  onClose,
  storeOptions = [],
  categoryOptions = [],
}: {
  initial?: Entry;
  onSave: (data: EntryFormData) => void;
  onClose: () => void;
  storeOptions?: string[];
  categoryOptions?: string[];
}) {
  useEscapeKey(onClose);
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,22,18,0.45)' }}
      onClick={onClose}
    >
      <div
        className="rounded-[14px] w-full max-w-md overflow-hidden animate-scale-in"
        style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <span className="tape-label">{initial ? 'Edit Expense' : 'Add Expense'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="tape-label block mb-1.5">Date</label>
              <input type="date" className="field" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
            <div>
              <label className="tape-label block mb-1.5">Price</label>
              <input type="number" step="0.01" min="0" className="field" value={form.price} onChange={e => set('price', e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" inputMode="decimal" required />
            </div>
          </div>
          <div>
            <label className="tape-label block mb-1.5">Store</label>
            <input className="field" value={form.store} onChange={e => set('store', e.target.value)} placeholder="e.g. Home Depot" list="store-options" autoComplete="off" />
            <datalist id="store-options">
              {storeOptions.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="tape-label block mb-1.5">Category</label>
            <input className="field" value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Materials" list="category-options" autoComplete="off" />
            <datalist id="category-options">
              {categoryOptions.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className="tape-label block mb-1.5">Description</label>
            <input className="field" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What was this for?" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox" checked={form.isPending}
              onChange={e => set('isPending', e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--ochre)' }}
            />
            <span className="tape-label" style={{ color: 'var(--ochre)', textTransform: 'none', fontSize: 13 }}>Pending charge</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost btn-sm">Cancel</button>
            <button type="submit" className="btn-primary btn-sm flex-1">{initial ? 'Save' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
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
      className="rounded-xl px-4 py-3 cursor-pointer"
      style={{
        background: entry.isPending ? 'rgba(176,122,26,0.06)' : 'var(--paper)',
        border: entry.isPending ? '1px solid rgba(176,122,26,0.3)' : '1px solid var(--ink-line)',
      }}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
          <div className="flex flex-wrap gap-x-2 mt-0.5" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
            <span>{formatDate(entry.date)}</span>
            {entry.category && <span>&middot; {entry.category}</span>}
            {entry.isPending && <span style={{ color: 'var(--ochre)', fontWeight: 600 }}>Pending</span>}
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>
          {formatCurrency(entry.price)}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid var(--ink-line)' }} onClick={e => e.stopPropagation()}>
        <button onClick={onTogglePending} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: entry.isPending ? 'var(--ochre)' : 'var(--ink-4)' }} title={entry.isPending ? 'Mark purchased' : 'Mark pending'}>
          <ClockIcon className="w-4 h-4" />
        </button>
        <button onClick={onReceipt} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: hasReceipt ? 'var(--rust)' : 'var(--ink-4)' }} title={hasReceipt ? 'View receipt' : 'Add receipt'}>
          <CameraIcon className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--ink-4)' }} title="Delete">
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

  const storeOptions = useMemo(() => [...new Set(entries.map(e => e.store).filter(Boolean))].sort(), [entries]);
  const categoryOptions = useMemo(() => [...new Set(entries.map(e => e.category).filter(Boolean))].sort(), [entries]);

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

  const borderCls = { borderBottom: '1px solid var(--ink-line)', borderRight: '1px solid var(--ink-line)' };
  const borderClsNoR = { borderBottom: '1px solid var(--ink-line)' };

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
          <div className="tape-label text-center py-10" style={{ color: 'var(--ink-4)' }}>
            No entries yet — tap below to add one.
          </div>
        )}
      </div>

      {/* ── Desktop: table layout ── */}
      <div className="hidden sm:block overflow-x-auto scrollbar-hide rounded-xl" style={{ border: '1px solid var(--ink-line)' }}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ background: 'var(--paper-2)' }}>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`tape-label px-3 py-3 ${col.width}`}
                  style={{ ...borderCls }}
                >
                  {col.label}
                </th>
              ))}
              <th className="w-10 px-2 py-3 tape-label" style={{ ...borderCls }} title="Pending charge" />
              <th className="w-8 px-2 py-3" style={{ ...borderCls }} title="Receipt" />
              <th className="w-8 px-2 py-3" style={{ ...borderClsNoR }} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, rowIdx) => {
              const hasReceipt = Boolean(entry.receiptUrl);
              const isPending = entry.isPending;
              return (
                <tr
                  key={entry.id}
                  className="transition-colors"
                  style={{ background: isPending ? 'rgba(176,122,26,0.04)' : 'transparent' }}
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
                  <td className="px-1 py-2 text-center" style={{ ...borderCls }}>
                    <div className={isPending ? '' : 'table-row-actions'}>
                      <button
                        onClick={() => handleTogglePending(entry)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: isPending ? 'var(--ochre)' : 'var(--ink-4)' }}
                        title={isPending ? 'Mark as purchased' : 'Mark as pending (future charge)'}
                      >
                        <ClockIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {/* Receipt button */}
                  <td className="px-1 py-2 text-center" style={{ ...borderCls }}>
                    <div className={hasReceipt ? '' : 'table-row-actions'}>
                      <button
                        onClick={() => setReceiptEntryId(entry.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: hasReceipt ? 'var(--rust)' : 'var(--ink-4)' }}
                        title={hasReceipt ? 'View receipt' : 'Add receipt'}
                      >
                        <CameraIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  {/* Delete button */}
                  <td className="px-1 py-2 text-center" style={{ ...borderClsNoR }}>
                    <div className="table-row-actions">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 14, color: 'var(--ink-4)' }}
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
                  className="tape-label text-center py-10"
                  style={{ color: 'var(--ink-4)' }}
                >
                  No entries yet. Add one below or press{' '}
                  <kbd style={{ padding: '2px 6px', background: 'var(--paper-2)', border: '1px solid var(--ink-line)', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>N</kbd>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add buttons ── */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => {
            if (window.innerWidth < 640) setMobileFormEntry('add');
            else handleAddRow(false);
          }}
          className="tape-label px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px dashed var(--ink-line-2)', color: 'var(--ink-3)', background: 'transparent', cursor: 'pointer', textTransform: 'none', fontSize: 13 }}
        >
          + Add Entry
        </button>
        <button
          onClick={() => handleAddRow(true)}
          className="hidden sm:flex items-center gap-1.5 tape-label px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px dashed rgba(176,122,26,0.4)', color: 'var(--ochre)', background: 'transparent', cursor: 'pointer', textTransform: 'none', fontSize: 13 }}
        >
          <ClockIcon className="w-3.5 h-3.5" />
          Add Pending
        </button>
        <span className="hidden sm:inline tape-label" style={{ color: 'var(--ink-4)' }}>
          Press <kbd style={{ padding: '2px 6px', background: 'var(--paper-2)', border: '1px solid var(--ink-line)', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>N</kbd> to add a row
        </span>
      </div>

      {/* ── Mobile form modal ── */}
      {mobileFormEntry && (
        <EntryFormModal
          initial={mobileFormEntry !== 'add' ? mobileFormEntry : undefined}
          onSave={handleMobileFormSave}
          onClose={() => setMobileFormEntry(null)}
          storeOptions={storeOptions}
          categoryOptions={categoryOptions}
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
