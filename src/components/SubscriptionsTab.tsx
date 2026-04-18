import React, { useState, useMemo } from 'react';
import type { Subscription, SubscriptionCategory, SubscriptionFrequency, SubscriptionStatus } from '../lib/types';
import { formatCurrency, todayStr } from '../lib/utils';

type Props = {
  subscriptions: Subscription[];
  addSubscription: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubscription: (sub: Subscription) => void;
  deleteSubscription: (id: string) => void;
};

// ── Constants ────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  streaming: 'Streaming', software: 'Software', fitness: 'Fitness',
  news: 'News', gaming: 'Gaming', utilities: 'Utilities',
  food: 'Food', shopping: 'Shopping', finance: 'Finance', other: 'Other',
};

const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
  streaming:  'bg-purple-100 text-purple-700',
  software:   'bg-[rgba(176,122,26,0.1)] text-[var(--ochre)]',
  fitness:    'bg-[rgba(74,94,40,0.1)] text-green-700',
  news:       'bg-yellow-100 text-yellow-700',
  gaming:     'bg-[rgba(184,69,31,0.10)] text-red-700',
  utilities:  'bg-orange-100 text-orange-700',
  food:       'bg-lime-100 text-lime-700',
  shopping:   'bg-pink-100 text-pink-700',
  finance:    'bg-teal-100 text-teal-700',
  other:      'bg-gray-100 text-[var(--ink-3)]',
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active', paused: 'Paused', cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active:    'bg-[rgba(74,94,40,0.1)] text-green-700',
  paused:    'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-[rgba(184,69,31,0.10)] text-[var(--rust)]',
};

// ── Helpers ──────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function renewalLabel(sub: Subscription): string {
  if (sub.frequency === 'monthly') return `${ordinal(sub.renewalDay)} of month`;
  return MONTHS[(sub.renewalDay - 1) % 12];
}

/** Convert any subscription to monthly cost */
function toMonthlyCost(sub: Subscription): number {
  if (sub.status === 'cancelled') return 0;
  return sub.frequency === 'monthly' ? sub.amount : sub.amount / 12;
}

/** Convert any subscription to annual cost */
function toAnnualCost(sub: Subscription): number {
  if (sub.status === 'cancelled') return 0;
  return sub.frequency === 'annual' ? sub.amount : sub.amount * 12;
}

/** Days until a date string */
function daysUntil(dateStr: string): number {
  const today = new Date(todayStr() + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function trialStatus(sub: Subscription): { label: string; cls: string } | null {
  if (!sub.freeTrial) return null;
  if (!sub.trialExpiration) return { label: 'Yes', cls: 'text-[var(--ink-3)]' };
  const days = daysUntil(sub.trialExpiration);
  const date = new Date(sub.trialExpiration + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (days < 0) return { label: `Expired ${date}`, cls: 'text-[var(--rust)]' };
  if (days <= 7) return { label: `Expires ${date} (${days}d)`, cls: 'text-[var(--rust)] font-semibold' };
  if (days <= 30) return { label: `Expires ${date} (${days}d)`, cls: 'text-[var(--ochre)] font-medium' };
  return { label: `Expires ${date}`, cls: 'text-[var(--ink-3)]' };
}

// ── Form default ──────────────────────────────────────────────────────────

interface SubForm {
  name: string;
  amount: string;
  frequency: SubscriptionFrequency;
  renewalDay: string;
  freeTrial: boolean;
  trialExpiration: string;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
}

const DEFAULT_FORM: SubForm = {
  name: '', amount: '', frequency: 'monthly', renewalDay: '1',
  freeTrial: false, trialExpiration: '', category: 'other', status: 'active',
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

// ── Modal ────────────────────────────────────────────────────────────────

const inputCls = 'w-full rounded-lg field outline-none focus:border-[var(--rust)] transition-colors';
const labelCls = 'block text-xs font-medium text-[var(--ink-4)] mb-1';

function SubscriptionModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Subscription;
  onSave: (form: SubForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SubForm>(
    initial
      ? {
          name: initial.name,
          amount: String(initial.amount),
          frequency: initial.frequency,
          renewalDay: String(initial.renewalDay),
          freeTrial: initial.freeTrial,
          trialExpiration: initial.trialExpiration,
          category: initial.category,
          status: initial.status,
        }
      : DEFAULT_FORM
  );

  const set = <K extends keyof SubForm>(key: K, val: SubForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    onSave(form);
  }

  const renewalDayOptions = form.frequency === 'monthly'
    ? Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: ordinal(i + 1) }))
    : MONTHS.map((m, i) => ({ value: i + 1, label: m }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(26,22,18,0.5)]" onClick={onClose}>
      <div className="bg-[var(--paper)] rounded-[14px] shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--ink-line)]">
          <h2 className="font-semibold text-[var(--ink)] text-sm">
            {initial ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button onClick={onClose} className="text-[var(--ink-4)] hover:text-[var(--ink)] transition-colors text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Service Name *</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Netflix" required />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value as SubscriptionCategory)}>
                {(Object.keys(CATEGORY_LABELS) as SubscriptionCategory[]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value as SubscriptionStatus)}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Amount + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount ($) *</label>
              <input
                className={inputCls} type="number" min="0" step="0.01"
                value={form.amount} onChange={e => set('amount', e.target.value)}
                onFocus={e => e.target.select()} placeholder="0.00" required
              />
            </div>
            <div>
              <label className={labelCls}>Frequency</label>
              <select className={inputCls} value={form.frequency}
                onChange={e => { set('frequency', e.target.value as SubscriptionFrequency); set('renewalDay', '1'); }}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
          </div>

          {/* Renewal Day */}
          <div>
            <label className={labelCls}>
              {form.frequency === 'monthly' ? 'Renewal Day (of month)' : 'Renewal Month'}
            </label>
            <select className={inputCls} value={form.renewalDay}
              onChange={e => set('renewalDay', e.target.value)}>
              {renewalDayOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Free Trial */}
          <div className="rounded-lg border border-[var(--ink-line)] p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox" checked={form.freeTrial}
                onChange={e => { set('freeTrial', e.target.checked); if (!e.target.checked) set('trialExpiration', ''); }}
                className="w-4 h-4 rounded accent-[var(--rust)]"
              />
              <span className="text-sm text-[var(--ink)]">Free Trial</span>
            </label>
            {form.freeTrial && (
              <div>
                <label className={labelCls}>Trial Expiration Date</label>
                <input
                  className={inputCls} type="date"
                  value={form.trialExpiration} onChange={e => set('trialExpiration', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--rust)] hover:bg-[var(--rust-ink)] text-white transition-colors">
              {initial ? 'Save Changes' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

type StatusFilter = 'all' | SubscriptionStatus;

export function SubscriptionsTab({ subscriptions, addSubscription, updateSubscription, deleteSubscription }: Props) {
  const [modal, setModal] = useState<null | 'add' | Subscription>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | SubscriptionCategory>('all');

  // ── Metrics ──────────────────────────────────────────────────────────

  const active = subscriptions.filter(s => s.status === 'active');
  const totalMonthly = active.reduce((sum, s) => sum + toMonthlyCost(s), 0);
  const totalAnnual = active.reduce((sum, s) => sum + toAnnualCost(s), 0);

  const trialsExpiringSoon = subscriptions.filter(s => {
    if (!s.freeTrial || !s.trialExpiration) return false;
    const days = daysUntil(s.trialExpiration);
    return days >= 0 && days <= 30;
  });

  // ── Category breakdown for active subs ───────────────────────────────

  const categoryTotals = useMemo(() => {
    const map: Partial<Record<SubscriptionCategory, number>> = {};
    active.forEach(s => {
      map[s.category] = (map[s.category] ?? 0) + toMonthlyCost(s);
    });
    return Object.entries(map)
      .map(([cat, amt]) => ({ cat: cat as SubscriptionCategory, amt: amt ?? 0 }))
      .sort((a, b) => b.amt - a.amt);
  }, [subscriptions]);

  // ── Filtering ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return subscriptions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      return true;
    });
  }, [subscriptions, statusFilter, categoryFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleSave(form: SubForm) {
    const data = {
      name: form.name.trim(),
      amount: parseFloat(form.amount) || 0,
      frequency: form.frequency,
      renewalDay: parseInt(form.renewalDay, 10) || 1,
      freeTrial: form.freeTrial,
      trialExpiration: form.freeTrial ? form.trialExpiration : '',
      category: form.category,
      status: form.status,
      sortOrder: typeof modal === 'object' ? (modal as Subscription).sortOrder : subscriptions.length,
    };
    if (modal && typeof modal === 'object') {
      updateSubscription({ ...(modal as Subscription), ...data });
    } else {
      addSubscription(data);
    }
    setModal(null);
  }

  // ── Table classes ─────────────────────────────────────────────────────

  const thCls = 'text-left px-4 py-3 font-medium text-xs uppercase tracking-wider text-[var(--ink-4)]';
  const tdCls = 'px-4 py-3 text-sm text-[var(--ink)]';

  const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'paused', label: 'Paused' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div>
      {/* ── Dashboard Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-6">
        {/* Monthly Cost */}
        <div className="rounded-xl border border-[var(--ink-line)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-4)] mb-1">Monthly Cost</div>
          <div className="text-lg sm:text-2xl font-bold text-[var(--ink)] truncate">{formatCurrency(totalMonthly)}</div>
          <div className="text-[10px] sm:text-xs text-[var(--ink-4)] mt-0.5">active subscriptions</div>
        </div>

        {/* Annual Cost */}
        <div className="rounded-xl border border-[var(--ink-line)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-4)] mb-1">Annual Cost</div>
          <div className="text-lg sm:text-2xl font-bold text-[var(--rust)] truncate">{formatCurrency(totalAnnual)}</div>
          <div className="text-[10px] sm:text-xs text-[var(--ink-4)] mt-0.5">per year</div>
        </div>

        {/* Active Count */}
        <div className="rounded-xl border border-[var(--ink-line)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-4)] mb-1">Active</div>
          <div className="text-lg sm:text-2xl font-bold text-[var(--ink)]">{active.length}</div>
          <div className="text-[10px] sm:text-xs text-[var(--ink-4)] mt-0.5">
            of {subscriptions.length} total
          </div>
        </div>

        {/* Free Trials */}
        <div className={`rounded-xl border p-3 sm:p-4 ${
          trialsExpiringSoon.length > 0
            ? 'border-[rgba(176,122,26,0.3)] bg-[rgba(176,122,26,0.05)]/50'
            : 'border-[var(--ink-line)]'
        }`}>
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--ink-4)] mb-1">Free Trials</div>
          <div className={`text-lg sm:text-2xl font-bold ${trialsExpiringSoon.length > 0 ? 'text-[var(--ochre)]' : 'text-[var(--ink)]'}`}>
            {subscriptions.filter(s => s.freeTrial && s.status === 'active').length}
          </div>
          <div className="text-[10px] sm:text-xs mt-0.5">
            {trialsExpiringSoon.length > 0
              ? <span className="text-[var(--ochre)] font-medium">{trialsExpiringSoon.length} expiring within 30d</span>
              : <span className="text-[var(--ink-4)]">none expiring soon</span>
            }
          </div>
        </div>
      </div>

      {/* ── Category Breakdown Bar ── */}
      {categoryTotals.length > 0 && (
        <div className="mb-5 sm:mb-6 rounded-xl border border-[var(--ink-line)] p-4">
          <div className="text-xs font-medium text-[var(--ink-4)] mb-3 uppercase tracking-wider">Monthly by Category</div>
          <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
            {categoryTotals.map(({ cat, amt }) => (
              <div
                key={cat}
                style={{ width: `${(amt / totalMonthly) * 100}%` }}
                className={`h-full ${CATEGORY_COLORS[cat].split(' ')[0]}`}
                title={`${CATEGORY_LABELS[cat]}: ${formatCurrency(amt)}/mo`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {categoryTotals.map(({ cat, amt }) => (
              <div key={cat} className="flex items-center gap-1.5 text-xs">
                <span className={`inline-block w-2.5 h-2.5 rounded-sm ${CATEGORY_COLORS[cat].split(' ')[0]}`} />
                <span className="text-[var(--ink-3)]">{CATEGORY_LABELS[cat]}</span>
                <span className="font-medium text-[var(--ink)]">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table Header Row ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide">
          {statusFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.id
                  ? 'bg-[var(--rust)] text-white'
                  : 'bg-[var(--paper-2)] text-[var(--ink-3)] hover:bg-[rgba(0,0,20,0.07)]'
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="ml-1 rounded-full border border-[var(--ink-line)] bg-transparent px-2.5 py-1 text-xs text-[var(--ink-3)] outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {(Object.keys(CATEGORY_LABELS) as SubscriptionCategory[]).map(c => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--rust)] hover:bg-[var(--rust-ink)] text-white transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Subscription
        </button>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-[var(--ink-line)] overflow-x-auto scrollbar-hide -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[540px]">
          <thead>
            <tr className="bg-[var(--paper-2)]">
              <th className={thCls}>Subscription</th>
              <th className={`${thCls} text-right`}>Amount</th>
              <th className={thCls}>Frequency</th>
              <th className={thCls}>Renewal</th>
              <th className={thCls}>Free Trial</th>
              <th className={thCls}>Status</th>
              <th className="w-16 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--ink-line)]">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--ink-4)]">
                  {subscriptions.length === 0 ? 'No subscriptions yet — add one above.' : 'No subscriptions match the current filter.'}
                </td>
              </tr>
            )}
            {filtered.map(sub => {
              const trial = trialStatus(sub);
              const monthlyCost = sub.frequency === 'monthly' ? sub.amount : sub.amount / 12;

              return (
                <tr
                  key={sub.id}
                  className={`group hover:bg-[var(--paper-2)] ${
                    sub.status === 'cancelled' ? 'opacity-50' : ''
                  }`}
                >
                  {/* Name + category */}
                  <td className={`${tdCls} font-medium`}>
                    <div className="flex flex-col gap-0.5">
                      <span>{sub.name}</span>
                      <span className={`self-start text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[sub.category]}`}>
                        {CATEGORY_LABELS[sub.category]}
                      </span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className={`${tdCls} text-right`}>
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{formatCurrency(sub.amount)}</span>
                      {sub.frequency === 'annual' && (
                        <span className="text-[10px] text-[var(--ink-4)]">
                          {formatCurrency(monthlyCost)}/mo
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Frequency */}
                  <td className={tdCls}>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      sub.frequency === 'monthly'
                        ? 'bg-[rgba(227,25,55,0.1)] text-[var(--rust)]'
                        : 'bg-[rgba(90,77,66,0.1)] text-[var(--ink-2)]'
                    }`}>
                      {sub.frequency === 'monthly' ? 'Monthly' : 'Annual'}
                    </span>
                  </td>

                  {/* Renewal date */}
                  <td className={`${tdCls} text-[var(--ink-3)]`}>
                    {renewalLabel(sub)}
                  </td>

                  {/* Free trial */}
                  <td className={tdCls}>
                    {trial ? (
                      <span className={`text-xs ${trial.cls}`}>{trial.label}</span>
                    ) : (
                      <span className="text-xs text-[var(--ink-4)]">No</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className={tdCls}>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[sub.status]}`}>
                      {STATUS_LABELS[sub.status]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setModal(sub)}
                        className="p-1 text-[var(--ink-4)] hover:text-[var(--rust)] transition-colors"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="p-1 text-[var(--ink-4)] hover:text-[var(--rust)] transition-colors"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer totals for filtered view */}
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-[var(--paper-2)] border-t border-[var(--ink-line)] font-semibold text-sm">
                <td className="px-4 py-3 text-[var(--ink-4)]">
                  {filtered.length} subscription{filtered.length !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[var(--ink)]">
                      {formatCurrency(filtered.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + toMonthlyCost(s), 0))}/mo
                    </span>
                    <span className="text-[10px] font-normal text-[var(--ink-4)]">
                      {formatCurrency(filtered.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + toAnnualCost(s), 0))}/yr
                    </span>
                  </div>
                </td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {modal && (
        <SubscriptionModal
          initial={typeof modal === 'object' ? modal as Subscription : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
