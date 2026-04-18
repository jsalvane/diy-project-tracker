import React, { useState, useMemo, useRef } from 'react';
import type { HSAExpense, HSAPerson, HSACategory } from '../lib/types';
import { useHSA } from '../hooks/useHSA';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency, formatDate, todayStr } from '../lib/utils';
import { uploadReceipt, deleteReceipt } from '../lib/receipts';

// ── Constants ────────────────────────────────────────────────────────────

const PEOPLE: HSAPerson[] = ['Joe', 'Krysten', 'Jack', 'Daughter'];

const CATEGORY_LABELS: Record<HSACategory, string> = {
  medical: 'Medical', dental: 'Dental', vision: 'Vision',
  prescription: 'Rx', 'mental-health': 'Mental Health', other: 'Other',
};

const CATEGORY_COLORS: Record<HSACategory, string> = {
  medical:       'bg-[rgba(176,122,26,0.1)] text-[var(--ochre)]',
  dental:        'bg-teal-100 text-teal-700',
  vision:        'bg-purple-100 text-purple-700',
  prescription:  'bg-orange-100 text-orange-700',
  'mental-health': 'bg-pink-100 text-pink-700',
  other:         'bg-gray-100 text-[var(--ink-3)]',
};

// ── Form types ──────────────────────────────────────────────────────────

interface ExpenseForm {
  person: HSAPerson;
  provider: string;
  date: string;
  category: HSACategory;
  description: string;
  amount: string;
  reimbursed: boolean;
}

const DEFAULT_FORM: ExpenseForm = {
  person: 'Joe', provider: '', date: todayStr(),
  category: 'medical', description: '', amount: '', reimbursed: false,
};

// ── Icons ────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'w-4 h-4'}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

// ── Expense Modal ────────────────────────────────────────────────────────

const inputCls = 'field w-full';
const labelCls = 'tape-label block mb-1.5';

function ExpenseModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: HSAExpense;
  onSave: (form: ExpenseForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ExpenseForm>(
    initial
      ? {
          person: initial.person,
          provider: initial.provider,
          date: initial.date,
          category: initial.category,
          description: initial.description,
          amount: String(initial.amount),
          reimbursed: initial.reimbursed,
        }
      : DEFAULT_FORM
  );

  const set = <K extends keyof ExpenseForm>(key: K, val: ExpenseForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.provider.trim() || !form.amount) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,22,18,0.45)' }} onClick={onClose}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)', borderRadius: 14, boxShadow: '0 24px 60px rgba(26,22,18,0.25)', width: '100%', maxWidth: 448, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <span className="tape-label">{initial ? 'Edit Expense' : 'Add HSA Expense'}</span>
          <button onClick={onClose} style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Person + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Person *</label>
              <select className={inputCls} value={form.person} onChange={e => set('person', e.target.value as HSAPerson)}>
                {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Date *</label>
              <input className={inputCls} type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className={labelCls}>Provider *</label>
            <input className={inputCls} value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="e.g. Dr. Smith, CVS Pharmacy" required />
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value as HSACategory)}>
                {(Object.keys(CATEGORY_LABELS) as HSACategory[]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Amount ($) *</label>
              <input
                className={inputCls} type="number" min="0" step="0.01"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                onFocus={e => e.target.select()} placeholder="0.00" required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <input className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Annual eye exam" />
          </div>

          {/* Reimbursed */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={form.reimbursed}
              onChange={e => set('reimbursed', e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--rust)' }}
            />
            <span className="tape-label">Reimbursed</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center">{initial ? 'Save Changes' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Receipt Modal (inline) ──────────────────────────────────────────────

function ReceiptModal({
  expense,
  uploading,
  onUpload,
  onRemove,
  onClose,
}: {
  expense: HSAExpense;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isPdf = Boolean(expense.receiptUrl && expense.receiptUrl.toLowerCase().includes('.pdf'));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,22,18,0.45)' }} onClick={onClose}>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)', borderRadius: 14, boxShadow: '0 24px 60px rgba(26,22,18,0.25)', width: '100%', maxWidth: 380, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <span className="tape-label truncate pr-4">Receipt — {expense.provider}</span>
          <button onClick={onClose} style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
        <div className="p-5">
          {uploading ? (
            <div className="w-full flex flex-col items-center justify-center h-48 bg-[var(--paper-2)] rounded-xl">
              <div className="w-8 h-8 border-2 border-[var(--rust)] border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-sm text-[var(--ink-4)]">Uploading...</span>
            </div>
          ) : expense.receiptUrl ? (
            isPdf ? (
              <div className="w-full flex flex-col items-center justify-center h-48 bg-[var(--paper-2)] rounded-xl gap-3">
                <ReceiptIcon className="w-14 h-14 text-[var(--rust)]" />
                <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" download
                  className="text-sm font-medium text-[var(--rust)] hover:text-[var(--rust-ink)] underline underline-offset-2 transition-colors">
                  Download Receipt PDF
                </a>
              </div>
            ) : (
              <div className="relative group">
                <img src={expense.receiptUrl} alt="Receipt" className="w-full rounded-xl object-contain max-h-80 bg-[var(--paper-2)]" />
                <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" download
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium px-2.5 py-1 rounded-lg bg-[rgba(26,22,18,0.5)] text-[var(--paper)] hover:bg-black/80">
                  Download
                </a>
              </div>
            )
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center h-48 bg-[var(--paper-2)] rounded-xl border-2 border-dashed border-[var(--ink-line)] hover:border-[var(--rust)] transition-colors group">
              <ReceiptIcon className="w-8 h-8 text-[rgba(10,10,20,0.2)] group-hover:text-[var(--rust)] mb-2 transition-colors" />
              <span className="text-sm text-[var(--ink-4)] group-hover:text-[var(--rust)] transition-colors">
                Tap to add receipt (photo or PDF)
              </span>
            </button>
          )}
        </div>
        {expense.receiptUrl && !uploading && (
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 text-sm font-medium px-4 py-2 rounded-lg bg-[var(--rust)] hover:bg-[var(--rust-ink)] text-[var(--paper)] transition-colors">
              Replace
            </button>
            <button onClick={onRemove}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-[var(--ink-line)] text-[var(--rust)] hover:bg-[rgba(184,69,31,0.05)] transition-colors">
              Remove
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

type PersonFilter = 'all' | HSAPerson;
type CategoryFilter = 'all' | HSACategory;

export function HSA() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useHSA();
  const { state: financialState } = useFinancial();

  const [modal, setModal] = useState<null | 'add' | HSAExpense>(null);
  const [receiptModal, setReceiptModal] = useState<HSAExpense | null>(null);
  const [uploading, setUploading] = useState(false);
  const [personFilter, setPersonFilter] = useState<PersonFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // ── HSA Balance from most recent financial quarter ──────────────────

  const hsaBalance = useMemo(() => {
    if (!financialState.quarters.length) return 0;
    const sorted = [...financialState.quarters].sort(
      (a, b) => b.dateCaptured.localeCompare(a.dateCaptured)
    );
    return sorted[0].assets.hsa;
  }, [financialState.quarters]);

  // ── Metrics ─────────────────────────────────────────────────────────

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const unreimbursed = expenses.filter(e => !e.reimbursed).reduce((sum, e) => sum + e.amount, 0);

  // ── Filtering ───────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      if (personFilter !== 'all' && e.person !== personFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, personFilter, categoryFilter]);

  // ── Handlers ────────────────────────────────────────────────────────

  function handleSave(form: ExpenseForm) {
    const data = {
      person: form.person,
      provider: form.provider.trim(),
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: parseFloat(form.amount) || 0,
      reimbursed: form.reimbursed,
      receiptUrl: modal && typeof modal === 'object' ? modal.receiptUrl : '',
      sortOrder: modal && typeof modal === 'object' ? modal.sortOrder : expenses.length,
    };
    if (modal && typeof modal === 'object') {
      updateExpense({ ...modal, ...data });
    } else {
      addExpense(data);
    }
    setModal(null);
  }

  async function handleReceiptUpload(file: File) {
    if (!receiptModal) return;
    setUploading(true);
    try {
      const url = await uploadReceipt(receiptModal.id, file);
      const updated = { ...receiptModal, receiptUrl: url };
      await updateExpense(updated);
      setReceiptModal(updated);
    } catch (err) {
      console.error('Receipt upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleReceiptRemove() {
    if (!receiptModal) return;
    try {
      await deleteReceipt(receiptModal.id);
      const updated = { ...receiptModal, receiptUrl: '' };
      await updateExpense(updated);
      setReceiptModal(updated);
    } catch (err) {
      console.error('Receipt delete failed:', err);
    }
  }

  // ── Table classes ──────────────────────────────────────────────────

  const thCls = 'tape-label text-left px-4 py-3';
  const tdCls = 'px-4 py-3 text-[13px]';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[var(--rust)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Dashboard Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-6">
        <div style={{ borderRadius: 12, border: '1px solid var(--ink-line)', padding: '12px 16px' }}>
          <div className="tape-label mb-1">HSA Balance</div>
          <div className="display-md truncate tabular-nums" style={{ color: 'var(--ink)' }}>{formatCurrency(hsaBalance)}</div>
          <div className="tape-label mt-0.5" style={{ fontSize: 8 }}>from financial health</div>
        </div>

        <div style={{ borderRadius: 12, border: '1px solid var(--ink-line)', padding: '12px 16px' }}>
          <div className="tape-label mb-1">Total Expenses</div>
          <div className="display-md truncate tabular-nums" style={{ color: 'var(--rust)' }}>{formatCurrency(totalExpenses)}</div>
          <div className="tape-label mt-0.5" style={{ fontSize: 8 }}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</div>
        </div>

        <div style={{ borderRadius: 12, border: `1px solid ${unreimbursed > 0 ? 'rgba(200,146,46,0.3)' : 'var(--ink-line)'}`, padding: '12px 16px', background: unreimbursed > 0 ? 'rgba(200,146,46,0.06)' : 'transparent' }} className="col-span-2 sm:col-span-1">
          <div className="tape-label mb-1">Unreimbursed</div>
          <div className="display-md truncate tabular-nums" style={{ color: unreimbursed > 0 ? 'var(--ochre)' : 'var(--ink)' }}>
            {formatCurrency(unreimbursed)}
          </div>
          <div className="tape-label mt-0.5" style={{ fontSize: 8 }}>
            {expenses.filter(e => !e.reimbursed).length} pending
          </div>
        </div>
      </div>

      {/* ── Filter Row + Add Button ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide">
          {/* Person filter */}
          <select
            value={personFilter}
            onChange={e => setPersonFilter(e.target.value as PersonFilter)}
            className="rounded-full border border-[var(--ink-line)] bg-transparent px-2.5 py-1 text-xs text-[var(--ink-3)] outline-none cursor-pointer"
          >
            <option value="all">All People</option>
            {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as CategoryFilter)}
            className="rounded-full border border-[var(--ink-line)] bg-transparent px-2.5 py-1 text-xs text-[var(--ink-3)] outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as HSACategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setModal('add')} className="btn-primary btn-sm flex items-center gap-1.5">
          <span>+</span> Add Expense
        </button>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden sm:block overflow-x-auto scrollbar-hide" style={{ border: '1px solid var(--ink-line)', borderRadius: 12 }}>
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr style={{ background: 'var(--paper-2)' }}>
              <th className={thCls}>Person</th>
              <th className={thCls}>Provider</th>
              <th className={thCls}>Date</th>
              <th className={thCls}>Category</th>
              <th className={thCls}>Description</th>
              <th className={`${thCls} text-right`}>Amount</th>
              <th className={`${thCls} text-center`}>Reimb.</th>
              <th className={`${thCls} text-center`}>Receipt</th>
              <th className="w-16 px-2 py-3" />
            </tr>
          </thead>
          <tbody style={{ borderTop: '1px solid var(--ink-line)' }}>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-[var(--ink-4)]">
                  {expenses.length === 0 ? 'No HSA expenses yet — add one above.' : 'No expenses match the current filters.'}
                </td>
              </tr>
            )}
            {filtered.map(exp => (
              <tr key={exp.id} className="group hover:bg-[var(--paper-2)]">
                <td className={`${tdCls} font-medium`}>{exp.person}</td>
                <td className={tdCls}>{exp.provider}</td>
                <td className={`${tdCls} text-[var(--ink-3)]`}>{formatDate(exp.date)}</td>
                <td className={tdCls}>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[exp.category]}`}>
                    {CATEGORY_LABELS[exp.category]}
                  </span>
                </td>
                <td className={`${tdCls} text-[var(--ink-3)] max-w-[200px] truncate`}>{exp.description || '—'}</td>
                <td className={`${tdCls} text-right font-semibold`}>{formatCurrency(exp.amount)}</td>
                <td className={`${tdCls} text-center`}>
                  <input
                    type="checkbox"
                    checked={exp.reimbursed}
                    onChange={e => updateExpense({ ...exp, reimbursed: e.target.checked })}
                    className="w-4 h-4 rounded accent-[var(--rust)] cursor-pointer"
                  />
                </td>
                <td className={`${tdCls} text-center`}>
                  <button
                    onClick={() => setReceiptModal(exp)}
                    className={`p-1 transition-colors ${
                      exp.receiptUrl
                        ? 'text-[var(--moss)] hover:text-[var(--moss)]'
                        : 'text-[rgba(10,10,20,0.2)] hover:text-[var(--rust)]'
                    }`}
                    title={exp.receiptUrl ? 'View receipt' : 'Add receipt'}
                  >
                    <ReceiptIcon />
                  </button>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModal(exp)} className="p-1 text-[var(--ink-4)] hover:text-[var(--rust)] transition-colors">
                      <PencilIcon />
                    </button>
                    <button onClick={() => deleteExpense(exp.id)} className="p-1 text-[var(--ink-4)] hover:text-[var(--rust)] transition-colors">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-[var(--paper-2)] border-t border-[var(--ink-line)] font-semibold text-sm">
                <td className="px-4 py-3 text-[var(--ink-4)]" colSpan={5}>
                  {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 text-right text-[var(--ink)]">
                  {formatCurrency(filtered.reduce((sum, e) => sum + e.amount, 0))}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Mobile Card Layout ── */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-sm text-[var(--ink-4)]">
            {expenses.length === 0 ? 'No HSA expenses yet — add one above.' : 'No expenses match the current filters.'}
          </div>
        )}
        {filtered.map(exp => (
          <div key={exp.id} className="rounded-xl border border-[var(--ink-line)] p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-medium text-sm text-[var(--ink)] truncate">{exp.provider}</div>
                <div className="text-xs text-[var(--ink-4)] mt-0.5">
                  {exp.person} · {formatDate(exp.date)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-sm text-[var(--ink)]">{formatCurrency(exp.amount)}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[exp.category]}`}>
                  {CATEGORY_LABELS[exp.category]}
                </span>
              </div>
            </div>
            {exp.description && (
              <div className="text-xs text-[var(--ink-3)] mb-2 truncate">{exp.description}</div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--ink-line)]">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox" checked={exp.reimbursed}
                    onChange={e => updateExpense({ ...exp, reimbursed: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-[var(--rust)]"
                  />
                  <span className="text-xs text-[var(--ink-4)]">Reimbursed</span>
                </label>
                <button
                  onClick={() => setReceiptModal(exp)}
                  className={`flex items-center gap-1 text-xs ${
                    exp.receiptUrl
                      ? 'text-[var(--moss)]'
                      : 'text-[var(--ink-4)]'
                  }`}
                >
                  <ReceiptIcon className="w-3.5 h-3.5" />
                  {exp.receiptUrl ? 'View' : 'Add'}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setModal(exp)} className="p-1.5 text-[var(--ink-4)] hover:text-[var(--rust)] transition-colors">
                  <PencilIcon />
                </button>
                <button onClick={() => deleteExpense(exp.id)} className="p-1.5 text-[var(--ink-4)] hover:text-[var(--rust)] transition-colors">
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length > 0 && (
          <div className="text-center text-xs font-semibold text-[var(--ink-4)] pt-2">
            {filtered.length} expense{filtered.length !== 1 ? 's' : ''} · {formatCurrency(filtered.reduce((sum, e) => sum + e.amount, 0))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <ExpenseModal
          initial={typeof modal === 'object' ? modal : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {receiptModal && (
        <ReceiptModal
          expense={receiptModal}
          uploading={uploading}
          onUpload={handleReceiptUpload}
          onRemove={handleReceiptRemove}
          onClose={() => setReceiptModal(null)}
        />
      )}
    </div>
  );
}
