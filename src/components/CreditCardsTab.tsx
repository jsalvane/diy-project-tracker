import { useState } from 'react';
import type { CreditCard } from '../lib/types';
import { formatCurrency, formatDate, todayStr } from '../lib/utils';

type Props = {
  creditCards: CreditCard[];
  addCreditCard: (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCreditCard: (card: CreditCard) => void;
  deleteCreditCard: (id: string) => void;
};

interface CardForm {
  name: string;
  servicer: string;
  creditLimit: string;
  annualFee: string;
  openDate: string;
  status: 'active' | 'closed';
  closedDate: string;
  inquiries: string;
  inquiryNote: string;
  isChargeCard: boolean;
}

const DEFAULT_FORM: CardForm = {
  name: '',
  servicer: '',
  creditLimit: '',
  annualFee: '0',
  openDate: '',
  status: 'active',
  closedDate: '',
  inquiries: '0',
  inquiryNote: '',
  isChargeCard: false,
};

function monthsBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

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
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1';

function CardModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: CreditCard;
  onSave: (form: CardForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CardForm>(
    initial
      ? {
          name: initial.name,
          servicer: initial.servicer,
          creditLimit: String(initial.creditLimit),
          annualFee: String(initial.annualFee),
          openDate: initial.openDate,
          status: initial.status,
          closedDate: initial.closedDate,
          inquiries: String(initial.inquiries),
          inquiryNote: initial.inquiryNote,
          isChargeCard: initial.isChargeCard,
        }
      : DEFAULT_FORM
  );

  function set(field: keyof CardForm, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
            {initial ? 'Edit Card' : 'Add Card'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Card Name *</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Chase Sapphire Preferred" required />
            </div>
            <div>
              <label className={labelCls}>Servicer</label>
              <input className={inputCls} value={form.servicer} onChange={e => set('servicer', e.target.value)} placeholder="Chase" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value as 'active' | 'closed')}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Credit Limit ($)</label>
              <input className={inputCls} type="number" min="0" step="100" value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Annual Fee ($)</label>
              <input className={inputCls} type="number" min="0" step="1" value={form.annualFee} onChange={e => set('annualFee', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Date Opened</label>
              <input className={inputCls} type="date" value={form.openDate} onChange={e => set('openDate', e.target.value)} />
            </div>
            {form.status === 'closed' && (
              <div>
                <label className={labelCls}>Date Closed</label>
                <input className={inputCls} type="date" value={form.closedDate} onChange={e => set('closedDate', e.target.value)} />
              </div>
            )}
            <div>
              <label className={labelCls}>Recent Inquiries</label>
              <input className={inputCls} type="number" min="0" value={form.inquiries} onChange={e => set('inquiries', e.target.value)} placeholder="0" />
            </div>
            <div className={form.status === 'closed' ? '' : 'col-span-2'}>
              <label className={labelCls}>Inquiry Note</label>
              <input className={inputCls} value={form.inquiryNote} onChange={e => set('inquiryNote', e.target.value)} placeholder="e.g. AF due 5/1" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="charge-card"
                type="checkbox"
                checked={form.isChargeCard}
                onChange={e => set('isChargeCard', e.target.checked)}
                className="w-4 h-4 accent-orange-400"
              />
              <label htmlFor="charge-card" className="text-sm text-gray-700 dark:text-zinc-300">Charge card (no preset limit)</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors">
              {initial ? 'Save Changes' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreditCardsTab({ creditCards, addCreditCard, updateCreditCard, deleteCreditCard }: Props) {
  const [modal, setModal] = useState<null | 'add' | CreditCard>(null);
  const [closedOpen, setClosedOpen] = useState(false);

  const today = todayStr();
  const cutoff = addMonthsToDate(today, -24);

  const activeCards = creditCards
    .filter(c => c.status === 'active')
    .sort((a, b) => b.creditLimit - a.creditLimit);

  const closedCards = creditCards
    .filter(c => c.status === 'closed')
    .sort((a, b) => (b.closedDate || '').localeCompare(a.closedDate || ''));

  // 5/24 calculation
  const cards524 = activeCards
    .filter(c => c.openDate && c.openDate > cutoff)
    .sort((a, b) => a.openDate.localeCompare(b.openDate));
  const count524 = cards524.length;
  const slotsRemaining = Math.max(0, 5 - count524);
  const nextSlotDate = cards524.length > 0 ? addMonthsToDate(cards524[0].openDate, 24) : null;

  const totalLimit = activeCards.filter(c => !c.isChargeCard).reduce((s, c) => s + c.creditLimit, 0);
  const totalAnnualFees = creditCards.filter(c => c.status === 'active').reduce((s, c) => s + c.annualFee, 0);

  function handleSave(form: CardForm) {
    const data = {
      name: form.name.trim(),
      servicer: form.servicer.trim(),
      creditLimit: parseFloat(form.creditLimit) || 0,
      annualFee: parseFloat(form.annualFee) || 0,
      openDate: form.openDate,
      status: form.status,
      closedDate: form.status === 'closed' ? form.closedDate : '',
      inquiries: parseInt(form.inquiries) || 0,
      inquiryNote: form.inquiryNote.trim(),
      isChargeCard: form.isChargeCard,
      sortOrder: creditCards.length,
    };

    if (modal && typeof modal === 'object') {
      updateCreditCard({ ...modal, ...data });
    } else {
      addCreditCard(data);
    }
    setModal(null);
  }

  const thCls = 'text-left px-4 py-3 font-medium text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500';
  const tdCls = 'px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200';

  return (
    <div>
      {/* 5/24 Status Banner */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Chase 5/24 Status</h2>
          <span className={`text-sm font-bold ${count524 >= 5 ? 'text-red-500' : count524 >= 4 ? 'text-orange-400' : 'text-green-500'}`}>
            {count524} / 5 slots used
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${count524 >= 5 ? 'bg-red-500' : count524 >= 4 ? 'bg-orange-400' : 'bg-green-500'}`}
            style={{ width: `${Math.min(100, (count524 / 5) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
          <span>
            {slotsRemaining > 0
              ? `${slotsRemaining} slot${slotsRemaining !== 1 ? 's' : ''} remaining`
              : 'No slots — Chase will deny new applications'}
          </span>
          {nextSlotDate && (
            <span>
              Next slot opens <span className="font-semibold text-gray-700 dark:text-zinc-200">{formatDate(nextSlotDate)}</span>
              {' '}({cards524[0].name})
            </span>
          )}
        </div>
        {cards524.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {cards524.map(c => (
              <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium">
                {c.name} ({formatDate(c.openDate)})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Total Credit</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalLimit)}</div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{activeCards.filter(c => !c.isChargeCard).length} cards</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Annual Fees</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalAnnualFees)}</div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">per year</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Avg Account Age</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeCards.length > 0
              ? (() => {
                  const avgMonths = Math.round(
                    activeCards.reduce((s, c) => s + (c.openDate ? monthsBetween(c.openDate, today) : 0), 0) /
                      activeCards.length
                  );
                  return avgMonths >= 12
                    ? `${(avgMonths / 12).toFixed(1)}y`
                    : `${avgMonths}mo`;
                })()
              : '—'}
          </div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{activeCards.length} active cards</div>
        </div>
      </div>

      {/* Active cards header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Active Cards</h2>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Card
        </button>
      </div>

      {/* Active cards table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-900">
              <th className={thCls}>Card</th>
              <th className={thCls}>Servicer</th>
              <th className={`${thCls} text-right`}>Limit</th>
              <th className={`${thCls} text-right`}>Ann Fee</th>
              <th className={thCls}>Opened</th>
              <th className={`${thCls} text-right`}>Age</th>
              <th className={`${thCls} text-right`}>Inquiries</th>
              <th className="w-16 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {activeCards.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-500">
                  No active cards yet
                </td>
              </tr>
            )}
            {activeCards.map(card => {
              const ageMonths = card.openDate ? monthsBetween(card.openDate, today) : null;
              const ageLabel = ageMonths === null ? '—' : ageMonths >= 12 ? `${(ageMonths / 12).toFixed(1)}y` : `${ageMonths}mo`;
              const counts524 = card.openDate && card.openDate > cutoff;

              return (
                <tr key={card.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-900/40">
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{card.name}</span>
                      {card.isChargeCard && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">charge</span>
                      )}
                      {counts524 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400">5/24</span>
                      )}
                    </div>
                  </td>
                  <td className={tdCls}>{card.servicer || '—'}</td>
                  <td className={`${tdCls} text-right`}>
                    {card.isChargeCard ? <span className="text-gray-400 dark:text-zinc-500 text-xs">No preset</span> : formatCurrency(card.creditLimit)}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    {card.annualFee > 0 ? formatCurrency(card.annualFee) : <span className="text-gray-400 dark:text-zinc-500">—</span>}
                  </td>
                  <td className={tdCls}>{card.openDate ? formatDate(card.openDate) : '—'}</td>
                  <td className={`${tdCls} text-right`}>{ageLabel}</td>
                  <td className={`${tdCls} text-right`}>
                    <span>{card.inquiries}</span>
                    {card.inquiryNote && (
                      <span className="ml-1.5 text-xs text-gray-400 dark:text-zinc-500">({card.inquiryNote})</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(card)} className="p-1 text-gray-400 hover:text-orange-400 transition-colors">
                        <PencilIcon />
                      </button>
                      <button onClick={() => deleteCreditCard(card.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Closed cards collapsible */}
      <button
        onClick={() => setClosedOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors mb-3"
      >
        <ChevronIcon open={closedOpen} />
        Closed Cards ({closedCards.length})
      </button>

      {closedOpen && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-900">
                <th className={thCls}>Card</th>
                <th className={thCls}>Servicer</th>
                <th className={thCls}>Opened</th>
                <th className={thCls}>Closed</th>
                <th className={`${thCls} text-right`}>Age at Close</th>
                <th className="w-16 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {closedCards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
                    No closed cards
                  </td>
                </tr>
              )}
              {closedCards.map(card => {
                const ageAtClose =
                  card.openDate && card.closedDate
                    ? monthsBetween(card.openDate, card.closedDate)
                    : null;
                const ageLabel =
                  ageAtClose === null ? '—' : ageAtClose >= 12 ? `${(ageAtClose / 12).toFixed(1)}y` : `${ageAtClose}mo`;

                return (
                  <tr key={card.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-900/40 opacity-70">
                    <td className={tdCls}>{card.name}</td>
                    <td className={tdCls}>{card.servicer || '—'}</td>
                    <td className={tdCls}>{card.openDate ? formatDate(card.openDate) : '—'}</td>
                    <td className={tdCls}>{card.closedDate ? formatDate(card.closedDate) : '—'}</td>
                    <td className={`${tdCls} text-right`}>{ageLabel}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(card)} className="p-1 text-gray-400 hover:text-orange-400 transition-colors">
                          <PencilIcon />
                        </button>
                        <button onClick={() => deleteCreditCard(card.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <CardModal
          initial={typeof modal === 'object' ? modal : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
