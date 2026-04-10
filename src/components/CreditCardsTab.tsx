import { useState } from 'react';
import type { CreditCard } from '../lib/types';
import { formatCurrency, formatDate, todayStr } from '../lib/utils';
import type { AccountMapping } from '../hooks/useSimpleFin';
import type { SimpleFinAccount } from '../lib/simplefin';
// formatDate used in closed cards table

export type SimpleFinState = {
  connected: boolean;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  accounts: SimpleFinAccount[];
  mappings: AccountMapping;
  lastSynced: string | null;
  connect: (token: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  saveMapping: (m: AccountMapping) => Promise<void>;
  sync: (cards: CreditCard[], update: (card: CreditCard) => void) => Promise<{ synced: number; fetched: number; error?: string }>;
  fetchAccounts: () => Promise<boolean>;
};

type Props = {
  creditCards: CreditCard[];
  addCreditCard: (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCreditCard: (card: CreditCard) => void;
  deleteCreditCard: (id: string) => void;
  simpleFin: SimpleFinState;
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

const inputCls = 'w-full rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] bg-[#ffffff] dark:bg-[#161626] px-3 py-2 text-sm text-[#0a0a14] dark:text-[#e2e2f0] outline-none focus:border-[#E31937] transition-colors';
const labelCls = 'block text-xs font-medium text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mb-1';

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
        className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]">
          <h2 className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0] text-sm">
            {initial ? 'Edit Card' : 'Add Card'}
          </h2>
          <button onClick={onClose} className="text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] transition-colors text-lg leading-none">✕</button>
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
              <input className={inputCls} type="number" min="0" step="100" value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} onFocus={e => e.target.select()} placeholder="0" />
            </div>
            <div>
              <label className={labelCls}>Annual Fee ($)</label>
              <input className={inputCls} type="number" min="0" step="1" value={form.annualFee} onChange={e => set('annualFee', e.target.value)} onFocus={e => e.target.select()} placeholder="0" />
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
              <input className={inputCls} type="number" min="0" value={form.inquiries} onChange={e => set('inquiries', e.target.value)} onFocus={e => e.target.select()} placeholder="0" />
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
                className="w-4 h-4 accent-[#E31937]"
              />
              <label htmlFor="charge-card" className="text-sm text-[rgba(10,10,20,0.7)] dark:text-[rgba(226,226,240,0.65)]">Charge card (no preset limit)</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.55)] dark:text-[rgba(226,226,240,0.65)] hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-[#E31937] hover:bg-[#C41230] text-white transition-colors">
              {initial ? 'Save Changes' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SimpleFin sub-components ──────────────────────────────────────────────

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${spin ? 'animate-spin' : ''}`}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}

/** Panel shown when SimpleFin is NOT yet connected */
function SimpleFinConnectPanel({
  onConnect,
  error,
  syncing,
}: {
  onConnect: (token: string) => Promise<boolean>;
  error: string | null;
  syncing: boolean;
}) {
  const [token, setToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [showInput, setShowInput] = useState(false);

  async function handleConnect() {
    if (!token.trim()) return;
    setConnecting(true);
    await onConnect(token.trim());
    setConnecting(false);
  }

  return (
    <div className="rounded-xl border border-dashed border-[rgba(0,0,20,0.12)] dark:border-[rgba(255,255,255,0.1)] p-5 mb-5 sm:mb-8">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[rgba(0,0,20,0.04)] dark:bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
          <LinkIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h3 className="text-sm font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">
              Auto-sync balances with SimpleFin
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
              ~$15/yr
            </span>
          </div>
          <p className="text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mb-3">
            Connect your Chase, Amex, Discover, Citi, and Apple Card accounts to pull live balances into your budget automatically.
          </p>
          {!showInput ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInput(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E31937] hover:bg-[#C41230] text-white transition-colors"
              >
                Connect SimpleFin
              </button>
              <a
                href="https://beta-bridge.simplefin.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors underline underline-offset-2"
              >
                Get a setup token →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">
                1. Go to{' '}
                <a href="https://beta-bridge.simplefin.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors">
                  beta-bridge.simplefin.org
                </a>
                , connect your banks, then copy the setup token here.
              </p>
              <div className="flex gap-2">
                <input
                  className={inputCls + ' font-mono text-xs flex-1'}
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Paste setup token…"
                  autoFocus
                />
                <button
                  onClick={handleConnect}
                  disabled={connecting || syncing || !token.trim()}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E31937] hover:bg-[#C41230] disabled:opacity-50 text-white transition-colors whitespace-nowrap"
                >
                  {connecting ? 'Connecting…' : 'Connect'}
                </button>
                <button
                  onClick={() => { setShowInput(false); setToken(''); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.55)] dark:text-[rgba(226,226,240,0.65)] hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  Cancel
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Panel shown when SimpleFin IS connected */
function SimpleFinSyncPanel({
  lastSynced,
  syncing,
  error,
  onSync,
  onMapAccounts,
  onDisconnect,
}: {
  lastSynced: string | null;
  syncing: boolean;
  error: string | null;
  onSync: () => void;
  onMapAccounts: () => void;
  onDisconnect: () => void;
}) {
  function formatSynced(ts: string | null) {
    if (!ts) return 'Never';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return formatDate(ts.slice(0, 10));
  }

  return (
    <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-4 mb-5 sm:mb-8 bg-[rgba(0,200,100,0.03)] dark:bg-[rgba(0,200,100,0.04)]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <div>
            <span className="text-sm font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">SimpleFin connected</span>
            <span className="text-xs text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] ml-2">
              Last synced: {formatSynced(lastSynced)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#E31937] hover:bg-[#C41230] disabled:opacity-60 text-white transition-colors"
          >
            <RefreshIcon spin={syncing} />
            {syncing ? 'Syncing…' : 'Sync Balances'}
          </button>
          <button
            onClick={onMapAccounts}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.55)] dark:text-[rgba(226,226,240,0.65)] hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            Map Accounts
          </button>
          <button
            onClick={onDisconnect}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-red-500 hover:border-red-300 dark:hover:text-red-400 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

/** Modal: pair each SimpleFin account with a credit card */
function MapAccountsModal({
  sfAccounts,
  creditCards,
  mappings,
  onSave,
  onClose,
  onFetch,
  fetching,
}: {
  sfAccounts: SimpleFinAccount[];
  creditCards: CreditCard[];
  mappings: AccountMapping;
  onSave: (m: AccountMapping) => void;
  onClose: () => void;
  onFetch: () => Promise<boolean>;
  fetching: boolean;
}) {
  const [draft, setDraft] = useState<AccountMapping>({ ...mappings });
  const activeCards = creditCards.filter(c => c.status === 'active');

  async function handleFetch() {
    await onFetch();
  }

  function handleSave() {
    onSave(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]">
          <div>
            <h2 className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0] text-sm">Map SimpleFin Accounts</h2>
            <p className="text-xs text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5">
              Match each SimpleFin account to a card in your list
            </p>
          </div>
          <button onClick={onClose} className="text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {sfAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mb-3">
                No accounts loaded yet.
              </p>
              <button
                onClick={handleFetch}
                disabled={fetching}
                className="flex items-center gap-1.5 mx-auto text-sm font-semibold px-4 py-2 rounded-lg bg-[#E31937] hover:bg-[#C41230] disabled:opacity-60 text-white transition-colors"
              >
                <RefreshIcon spin={fetching} />
                {fetching ? 'Loading…' : 'Load Accounts from SimpleFin'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {sfAccounts.map(acct => {
                const orgName = acct.org?.name || '';
                const balanceDate = acct['balance-date']
                  ? new Date(acct['balance-date'] * 1000).toLocaleDateString()
                  : '';
                const bal = parseFloat(acct.balance);
                const displayBal = isNaN(bal) ? acct.balance : formatCurrency(Math.abs(bal));
                const availBal = acct['available-balance'] ? parseFloat(acct['available-balance']) : null;
                const impliedLimit = availBal !== null && !isNaN(bal) && !isNaN(availBal)
                  ? Math.abs(bal) + Math.abs(availBal)
                  : null;
                const recentTxns = (acct.transactions ?? []).slice(0, 3);

                return (
                  <div key={acct.id} className="rounded-lg border border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.06)] overflow-hidden">
                    {/* Account header */}
                    <div className="p-3 bg-[rgba(0,0,20,0.02)] dark:bg-[rgba(255,255,255,0.03)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {orgName && (
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-0.5">
                              {orgName}
                            </div>
                          )}
                          <div className="text-sm font-medium text-[#0a0a14] dark:text-[#e2e2f0]">
                            {acct.name !== orgName ? acct.name : 'Account'}
                          </div>
                        </div>
                        {/* Card selector */}
                        <select
                          className={inputCls + ' w-48 flex-shrink-0 text-xs'}
                          value={draft[acct.id] ?? ''}
                          onChange={e => setDraft(prev => {
                            const next = { ...prev };
                            if (e.target.value) {
                              next[acct.id] = e.target.value;
                            } else {
                              delete next[acct.id];
                            }
                            return next;
                          })}
                        >
                          <option value="">— not linked —</option>
                          {activeCards.map(card => (
                            <option key={card.id} value={card.id}>
                              {card.servicer ? `${card.servicer} — ` : ''}{card.name}
                              {card.creditLimit > 0 ? ` (${formatCurrency(card.creditLimit)})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Balance details */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs">
                        <span>
                          <span className="text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">Balance: </span>
                          <span className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">{displayBal}</span>
                        </span>
                        {availBal !== null && (
                          <span>
                            <span className="text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">Available: </span>
                            <span className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">{formatCurrency(Math.abs(availBal))}</span>
                          </span>
                        )}
                        {impliedLimit !== null && impliedLimit > 0 && (
                          <span>
                            <span className="text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">Limit: </span>
                            <span className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">~{formatCurrency(impliedLimit)}</span>
                          </span>
                        )}
                        {balanceDate && (
                          <span className="text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">
                            as of {balanceDate}
                          </span>
                        )}
                      </div>

                      {/* Full account ID */}
                      <div className="mt-1.5 font-mono text-[10px] text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.2)] break-all select-all">
                        ID: {acct.id}
                      </div>
                    </div>

                    {/* Recent transactions to help identify the account */}
                    {recentTxns.length > 0 && (
                      <div className="px-3 py-2 border-t border-[rgba(0,0,20,0.04)] dark:border-[rgba(255,255,255,0.04)]">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.2)] mb-1">
                          Recent transactions
                        </div>
                        {recentTxns.map((txn, i) => (
                          <div key={txn.id || i} className="flex items-center justify-between text-[11px] py-0.5">
                            <span className="text-[rgba(10,10,20,0.55)] dark:text-[rgba(226,226,240,0.5)] truncate mr-2">
                              {txn.description}
                            </span>
                            <span className="font-medium text-[#0a0a14] dark:text-[#e2e2f0] flex-shrink-0">
                              {formatCurrency(Math.abs(parseFloat(txn.amount)))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sfAccounts.length > 0 && (
          <div className="flex gap-3 px-5 py-4 border-t border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]">
            <button onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.55)] dark:text-[rgba(226,226,240,0.65)] hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-[#E31937] hover:bg-[#C41230] text-white transition-colors">
              Save Mapping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────

export function CreditCardsTab({ creditCards, addCreditCard, updateCreditCard, deleteCreditCard, simpleFin: sf }: Props) {
  const [modal, setModal] = useState<null | 'add' | CreditCard>(null);
  const [closedOpen, setClosedOpen] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  async function handleSync() {
    setSyncResult(null);
    const result = await sf.sync(creditCards, updateCreditCard);
    if (result.error) {
      setSyncResult(null); // error shown in panel
    } else {
      setSyncResult(
        result.synced > 0
          ? `Updated ${result.synced} card balance${result.synced !== 1 ? 's' : ''}.`
          : `Balances already up to date (${result.fetched} accounts checked).`
      );
      setTimeout(() => setSyncResult(null), 4000);
    }
  }

  async function handleMapOpen() {
    setShowMapModal(true);
    if (sf.accounts.length === 0) await sf.fetchAccounts();
  }

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
    const existing = typeof modal === 'object' ? modal : null;
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
      balance: existing?.balance ?? 0,
      billDueGroup: existing?.billDueGroup ?? '',
      billStatus: existing?.billStatus ?? 'manual' as const,
    };

    if (modal && typeof modal === 'object') {
      updateCreditCard({ ...modal, ...data });
    } else {
      addCreditCard(data);
    }
    setModal(null);
  }

  const thCls = 'text-left px-4 py-3 font-medium text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]';
  const tdCls = 'px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200';

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5 sm:mb-8">
        <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-1">Total Credit</div>
          <div className="text-lg sm:text-2xl font-bold text-[#0a0a14] dark:text-[#e2e2f0] truncate">{formatCurrency(totalLimit)}</div>
          <div className="text-[10px] sm:text-xs text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mt-0.5">{activeCards.filter(c => !c.isChargeCard).length} cards</div>
        </div>
        <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-1">Annual Fees</div>
          <div className="text-lg sm:text-2xl font-bold text-[#0a0a14] dark:text-[#e2e2f0] truncate">{formatCurrency(totalAnnualFees)}</div>
          <div className="text-[10px] sm:text-xs text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mt-0.5">per year</div>
        </div>
        <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-1">Avg Account Age</div>
          <div className="text-lg sm:text-2xl font-bold text-[#0a0a14] dark:text-[#e2e2f0]">
            {activeCards.length > 0
              ? (() => {
                  const avgMonths = Math.round(
                    activeCards.reduce((s, c) => s + (c.openDate ? monthsBetween(c.openDate, today) : 0), 0) /
                      activeCards.length
                  );
                  return avgMonths >= 12
                    ? `${Math.round(avgMonths / 12)}y`
                    : `${avgMonths}mo`;
                })()
              : '—'}
          </div>
          <div className="text-[10px] sm:text-xs text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mt-0.5">{activeCards.length} active cards</div>
        </div>
      </div>

      {/* SimpleFin sync */}
      {!sf.loading && (
        sf.connected ? (
          <>
            <SimpleFinSyncPanel
              lastSynced={sf.lastSynced}
              syncing={sf.syncing}
              error={sf.error}
              onSync={handleSync}
              onMapAccounts={handleMapOpen}
              onDisconnect={sf.disconnect}
            />
            {syncResult && (
              <div className="mb-4 text-xs font-medium text-green-600 dark:text-green-400 text-center">
                {syncResult}
              </div>
            )}
          </>
        ) : (
          <SimpleFinConnectPanel
            onConnect={sf.connect}
            error={sf.error}
            syncing={sf.syncing}
          />
        )
      )}

      {/* Active cards header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-[#0a0a14] dark:text-[#e2e2f0]">Active Cards</h2>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-[#E31937] hover:bg-[#C41230] text-white transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Card
        </button>
      </div>

      {/* Active cards table — grouped by servicer */}
      {(() => {
        // Build servicer groups sorted by total limit desc
        const servicerMap = new Map<string, typeof activeCards>();
        for (const card of activeCards) {
          const key = card.servicer?.toUpperCase() || 'OTHER';
          if (!servicerMap.has(key)) servicerMap.set(key, []);
          servicerMap.get(key)!.push(card);
        }
        const servicerGroups = [...servicerMap.entries()].sort(
          ([, a], [, b]) =>
            b.reduce((s, c) => s + (c.isChargeCard ? 0 : c.creditLimit), 0) -
            a.reduce((s, c) => s + (c.isChargeCard ? 0 : c.creditLimit), 0)
        );

        return (
          <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] overflow-x-auto mb-5 sm:mb-8">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[#f6f6fb] dark:bg-[#0f0f1a]">
                  <th className={thCls}>Card</th>
                  <th className={`${thCls} text-right`}>Limit</th>
                  <th className={`${thCls} text-right`}>Ann Fee</th>
                  <th className={thCls}>Opened</th>
                  <th className={`${thCls} text-right`}>Age</th>
                  <th className={`${thCls} text-center`}>Due</th>
                  <th className="w-16 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {activeCards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">
                      No active cards yet
                    </td>
                  </tr>
                )}
                {servicerGroups.map(([servicer, cards]) => {
                  const groupLimit = cards.filter(c => !c.isChargeCard).reduce((s, c) => s + c.creditLimit, 0);
                  const groupFees = cards.reduce((s, c) => s + c.annualFee, 0);
                  return (
                    <>
                      {/* Servicer header row */}
                      <tr key={`hdr-${servicer}`} className="bg-[#f6f6fb] dark:bg-[#0f0f1a] border-t border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]">
                        <td className="px-4 py-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">{servicer}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-semibold text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">
                          {groupLimit > 0 ? formatCurrency(groupLimit) : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-semibold text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">
                          {groupFees > 0 ? formatCurrency(groupFees) : '—'}
                        </td>
                        <td colSpan={4} />
                      </tr>
                      {/* Card rows */}
                      {cards.map(card => {
                        const ageMonths = card.openDate ? monthsBetween(card.openDate, today) : null;
                        const ageLabel = ageMonths === null ? '—' : ageMonths >= 12 ? `${Math.round(ageMonths / 12)}y` : `${ageMonths}mo`;
                        const counts524 = card.openDate && card.openDate > cutoff;
                        return (
                          <tr key={card.id} className="group hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] border-t border-[rgba(0,0,20,0.05)] dark:border-[rgba(255,255,255,0.04)]">
                            <td className={tdCls}>
                              <div className="flex items-center gap-2 pl-3">
                                <span className="font-medium">{card.name}</span>
                                {card.isChargeCard && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[rgba(255,255,255,0.1)] text-zinc-500 dark:text-[rgba(226,226,240,0.3)]">charge</span>
                                )}
                                {counts524 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-[rgba(227,25,55,0.1)] dark:bg-[rgba(255,77,92,0.1)] text-[#E31937] dark:text-[#FF4D5C]">5/24</span>
                                )}
                                {sf.connected && Object.values(sf.mappings).includes(card.id) && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">auto</span>
                                )}
                              </div>
                            </td>
                            <td className={`${tdCls} text-right`}>
                              {card.isChargeCard ? <span className="text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] text-xs">No preset</span> : formatCurrency(card.creditLimit)}
                            </td>
                            <td className={`${tdCls} text-right`}>
                              {card.annualFee > 0 ? formatCurrency(card.annualFee) : <span className="text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">—</span>}
                            </td>
                            <td className={tdCls}>{card.openDate ? formatDate(card.openDate) : '—'}</td>
                            <td className={`${tdCls} text-right`}>{ageLabel}</td>
                            <td className="px-4 py-2.5 text-center">
                              <div className="inline-flex rounded-lg border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.1)] overflow-hidden text-xs font-semibold">
                                {(['15', '30'] as const).map(g => (
                                  <button
                                    key={g}
                                    onClick={() => updateCreditCard({ ...card, billDueGroup: card.billDueGroup === g ? '' : g })}
                                    className={`px-2.5 py-1 transition-colors ${
                                      card.billDueGroup === g
                                        ? 'bg-[#E31937] text-white'
                                        : 'text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:bg-[rgba(0,0,20,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]'
                                    }`}
                                  >
                                    {g}th
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td className="px-2 py-2.5">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setModal(card)} className="p-1 text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors">
                                  <PencilIcon />
                                </button>
                                <button onClick={() => deleteCreditCard(card.id)} className="p-1 text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-red-500 transition-colors">
                                  <TrashIcon />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* Closed cards collapsible */}
      <button
        onClick={() => setClosedOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[rgba(10,10,20,0.7)] dark:hover:text-[rgba(226,226,240,0.65)] transition-colors mb-3"
      >
        <ChevronIcon open={closedOpen} />
        Closed Cards ({closedCards.length})
      </button>

      {closedOpen && (
        <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] overflow-x-auto">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="bg-[#f6f6fb] dark:bg-[#0f0f1a]">
                <th className={thCls}>Card</th>
                <th className={thCls}>Servicer</th>
                <th className={thCls}>Opened</th>
                <th className={thCls}>Closed</th>
                <th className={`${thCls} text-right`}>Age at Close</th>
                <th className="w-16 px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,20,0.05)] dark:divide-[rgba(255,255,255,0.04)]">
              {closedCards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">
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
                  ageAtClose === null ? '—' : ageAtClose >= 12 ? `${Math.round(ageAtClose / 12)}y` : `${ageAtClose}mo`;

                return (
                  <tr key={card.id} className="group hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] opacity-70">
                    <td className={tdCls}>{card.name}</td>
                    <td className={tdCls}>{card.servicer || '—'}</td>
                    <td className={tdCls}>{card.openDate ? formatDate(card.openDate) : '—'}</td>
                    <td className={tdCls}>{card.closedDate ? formatDate(card.closedDate) : '—'}</td>
                    <td className={`${tdCls} text-right`}>{ageLabel}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(card)} className="p-1 text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors">
                          <PencilIcon />
                        </button>
                        <button onClick={() => deleteCreditCard(card.id)} className="p-1 text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-red-500 transition-colors">
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

      {/* 5/24 Status Banner */}
      <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-4 sm:p-5 mt-5 sm:mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#0a0a14] dark:text-[#e2e2f0] uppercase tracking-wider">Chase 5/24 Status</h2>
          <span className={`text-sm font-bold ${count524 >= 5 ? 'text-red-500' : count524 >= 4 ? 'text-[#E31937] dark:text-[#FF4D5C]' : 'text-green-500'}`}>
            {count524} / 5 slots used
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${count524 >= 5 ? 'bg-red-500' : count524 >= 4 ? 'bg-[#E31937]' : 'bg-green-500'}`}
            style={{ width: `${Math.min(100, (count524 / 5) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">
          <span>
            {slotsRemaining > 0
              ? `${slotsRemaining} slot${slotsRemaining !== 1 ? 's' : ''} remaining`
              : 'No slots — Chase will deny new applications'}
          </span>
          {nextSlotDate && (
            <span>
              Next slot opens <span className="font-semibold text-[rgba(10,10,20,0.7)] dark:text-[rgba(226,226,240,0.65)]">{formatDate(nextSlotDate)}</span>
              {' '}({cards524[0].name})
            </span>
          )}
        </div>
        {cards524.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {cards524.map(c => (
              <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-[rgba(227,25,55,0.1)] text-[#E31937] dark:bg-[rgba(255,77,92,0.1)] dark:text-[#FF4D5C] font-medium">
                {c.name} ({formatDate(c.openDate)})
              </span>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <CardModal
          initial={typeof modal === 'object' ? modal : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {showMapModal && (
        <MapAccountsModal
          sfAccounts={sf.accounts}
          creditCards={creditCards}
          mappings={sf.mappings}
          onSave={sf.saveMapping}
          onClose={() => setShowMapModal(false)}
          onFetch={sf.fetchAccounts}
          fetching={sf.syncing}
        />
      )}
    </div>
  );
}
