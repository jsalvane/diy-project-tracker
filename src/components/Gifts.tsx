import { useState } from 'react';
import { useGifts } from '../hooks/useGifts';
import type { Gift, GiftRecipient, GiftStatus, GiftPriority } from '../lib/types';
import { formatCurrency } from '../lib/utils';

// ─── Color palette ─────────────────────────────────────────────────────────────
const COLORS = [
  { key: 'orange', bar: 'bg-orange-400', text: 'text-orange-500 dark:text-orange-400', dot: 'bg-orange-400' },
  { key: 'blue',   bar: 'bg-blue-400',   text: 'text-blue-500 dark:text-blue-400',     dot: 'bg-blue-400'   },
  { key: 'emerald',bar: 'bg-emerald-400',text: 'text-emerald-500 dark:text-emerald-400',dot:'bg-emerald-400' },
  { key: 'violet', bar: 'bg-violet-400', text: 'text-violet-500 dark:text-violet-400', dot: 'bg-violet-400' },
  { key: 'rose',   bar: 'bg-rose-400',   text: 'text-rose-500 dark:text-rose-400',     dot: 'bg-rose-400'   },
  { key: 'amber',  bar: 'bg-amber-400',  text: 'text-amber-500 dark:text-amber-400',   dot: 'bg-amber-400'  },
  { key: 'cyan',   bar: 'bg-cyan-400',   text: 'text-cyan-500 dark:text-cyan-400',     dot: 'bg-cyan-400'   },
  { key: 'pink',   bar: 'bg-pink-400',   text: 'text-pink-500 dark:text-pink-400',     dot: 'bg-pink-400'   },
];

function getColor(key: string) { return COLORS.find(c => c.key === key) ?? COLORS[0]; }

const STATUS_CONFIG: Record<GiftStatus, { label: string; cls: string }> = {
  want:      { label: 'Want',      cls: 'text-[#6366f1] dark:text-[#818cf8] bg-[rgba(99,102,241,0.1)] dark:bg-[rgba(129,140,248,0.1)]' },
  purchased: { label: 'Purchased', cls: 'text-[#16a34a] dark:text-[#22c55e] bg-[rgba(22,163,74,0.1)] dark:bg-[rgba(34,197,94,0.1)]' },
  cancelled: { label: 'Cancelled', cls: 'text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.05)]' },
};

const PRIORITY_DOT: Record<GiftPriority, string> = {
  high:   'bg-rose-400',
  medium: 'bg-amber-400',
  low:    'bg-[rgba(0,0,20,0.18)] dark:bg-[rgba(255,255,255,0.18)]',
};

const OCCASIONS = [
  'Christmas', 'Birthday', 'Anniversary', "Mother's Day", "Father's Day",
  "Valentine's Day", 'Graduation', 'Wedding', 'Baby Shower', 'Housewarming', 'Other',
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1.5">
      {children}
    </label>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-4">
      <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] mb-1.5">{label}</div>
      <div className="text-[18px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.025em] tabular-nums">{value}</div>
    </div>
  );
}

// ─── Person Tile ───────────────────────────────────────────────────────────────
function PersonTile({
  recipient, gifts, isSelected, colorIndex, onSelect, onEdit,
}: {
  recipient: GiftRecipient;
  gifts: Gift[];
  isSelected: boolean;
  colorIndex: number;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const color = getColor(recipient.color) ?? COLORS[colorIndex % COLORS.length];
  const purchased = gifts.filter(g => g.status === 'purchased');
  const want = gifts.filter(g => g.status === 'want');
  const spent = purchased.reduce((s, g) => s + g.cost, 0);
  const budgetPct = recipient.budget > 0 ? Math.min(100, (spent / recipient.budget) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
        isSelected
          ? 'border-[rgba(99,102,241,0.3)] dark:border-[rgba(129,140,248,0.25)] bg-[rgba(99,102,241,0.05)] dark:bg-[rgba(129,140,248,0.06)] shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
          : 'border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] bg-[#ffffff] dark:bg-[#0f0f1a] hover:border-[rgba(0,0,20,0.13)] dark:hover:border-[rgba(255,255,255,0.1)]'
      }`}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] truncate tracking-[-0.01em]">
            {recipient.name}
          </div>
          {recipient.occasion && (
            <div className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5 truncate">
              {recipient.occasion}
            </div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)] hover:text-[rgba(10,10,20,0.6)] dark:hover:text-[rgba(226,226,240,0.55)] p-0.5 rounded transition-colors ml-1.5 shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H2v-3L11.5 2.5z"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {want.length > 0 && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-md font-medium text-[#6366f1] dark:text-[#818cf8] bg-[rgba(99,102,241,0.1)] dark:bg-[rgba(129,140,248,0.1)]">
            {want.length} want
          </span>
        )}
        {purchased.length > 0 && (
          <span className="text-[11px] px-1.5 py-0.5 rounded-md font-medium text-[#16a34a] dark:text-[#22c55e] bg-[rgba(22,163,74,0.1)] dark:bg-[rgba(34,197,94,0.1)]">
            {purchased.length} bought
          </span>
        )}
        {gifts.length === 0 && (
          <span className="text-[11px] text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]">No gifts yet</span>
        )}
      </div>

      {recipient.budget > 0 ? (
        <div>
          <div className="flex justify-between text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mb-1.5 tabular-nums">
            <span>{formatCurrency(spent)}</span>
            <span>{formatCurrency(recipient.budget)}</span>
          </div>
          <div className="h-1 bg-[rgba(0,0,20,0.07)] dark:bg-[rgba(255,255,255,0.07)] rounded-full overflow-hidden">
            <div className={`h-full ${color.bar} rounded-full transition-all`} style={{ width: `${budgetPct}%` }} />
          </div>
        </div>
      ) : spent > 0 ? (
        <div className={`text-[12px] font-semibold tabular-nums ${color.text}`}>{formatCurrency(spent)}</div>
      ) : null}
    </button>
  );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div
        className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.6)] w-full max-w-md border border-[rgba(0,0,20,0.08)] dark:border-[rgba(255,255,255,0.07)] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]">
          <h2 className="text-[14px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.015em]">{title}</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] hover:text-[rgba(10,10,20,0.65)] dark:hover:text-[rgba(226,226,240,0.6)] hover:bg-[rgba(0,0,20,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14"/>
              <line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Person Modal ──────────────────────────────────────────────────────────────
function PersonModal({ recipient, defaultColorKey, onSave, onClose }: {
  recipient?: GiftRecipient;
  defaultColorKey: string;
  onSave: (data: Omit<GiftRecipient, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(recipient?.name ?? '');
  const [budget, setBudget] = useState(recipient?.budget ? String(recipient.budget) : '');
  const [occasion, setOccasion] = useState(recipient?.occasion ?? '');
  const [color, setColor] = useState(recipient?.color ?? defaultColorKey);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), budget: parseFloat(budget) || 0, occasion, color });
  }

  return (
    <ModalShell title={recipient ? 'Edit Person' : 'Add Person'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel>Name</FieldLabel>
          <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="Person's name" autoFocus required />
        </div>
        <div>
          <FieldLabel>Occasion</FieldLabel>
          <select className="field" value={occasion} onChange={e => setOccasion(e.target.value)}>
            <option value="">No occasion</option>
            {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Gift Budget ($)</FieldLabel>
          <input type="number" min="0" step="0.01" className="field" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <FieldLabel>Color</FieldLabel>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c.key} type="button" onClick={() => setColor(c.key)}
                className={`w-6 h-6 rounded-full ${c.bar} transition-transform ${color === c.key ? 'ring-2 ring-offset-2 ring-[#6366f1] dark:ring-[#818cf8] dark:ring-offset-[#0f0f1a] scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                title={c.key}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={!name.trim()} className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            {recipient ? 'Save Changes' : 'Add Person'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Gift Modal ────────────────────────────────────────────────────────────────
function GiftModal({ gift, recipientId, onSave, onClose }: {
  gift?: Gift;
  recipientId: string;
  onSave: (data: Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [idea, setIdea] = useState(gift?.idea ?? '');
  const [cost, setCost] = useState(gift?.cost ? String(gift.cost) : '');
  const [status, setStatus] = useState<GiftStatus>(gift?.status ?? 'want');
  const [priority, setPriority] = useState<GiftPriority>(gift?.priority ?? 'medium');
  const [notes, setNotes] = useState(gift?.notes ?? '');
  const [link, setLink] = useState(gift?.link ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    onSave({ recipientId, idea: idea.trim(), cost: parseFloat(cost) || 0, status, priority, notes: notes.trim(), link: link.trim() });
  }

  const priorityConfig: Record<GiftPriority, { label: string; active: string; inactive: string }> = {
    high:   { label: 'High',   active: 'bg-rose-500 border-rose-500 text-white',   inactive: 'border-[rgba(0,0,20,0.13)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] hover:border-rose-300 dark:hover:border-rose-700' },
    medium: { label: 'Medium', active: 'bg-amber-500 border-amber-500 text-white', inactive: 'border-[rgba(0,0,20,0.13)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] hover:border-amber-300 dark:hover:border-amber-700' },
    low:    { label: 'Low',    active: 'bg-[rgba(0,0,20,0.25)] dark:bg-[rgba(255,255,255,0.2)] border-transparent text-white', inactive: 'border-[rgba(0,0,20,0.13)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)]' },
  };

  return (
    <ModalShell title={gift ? 'Edit Gift' : 'Add Gift'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FieldLabel>Gift Idea</FieldLabel>
          <input className="field" value={idea} onChange={e => setIdea(e.target.value)} placeholder="What's the gift?" autoFocus required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Cost ($)</FieldLabel>
            <input type="number" min="0" step="0.01" className="field" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select className="field" value={status} onChange={e => setStatus(e.target.value as GiftStatus)}>
              <option value="want">Want</option>
              <option value="purchased">Purchased</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div>
          <FieldLabel>Priority</FieldLabel>
          <div className="flex gap-2">
            {(['high', 'medium', 'low'] as GiftPriority[]).map(p => (
              <button
                key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 py-1.5 rounded-[8px] text-[12px] font-medium border transition-colors ${priority === p ? priorityConfig[p].active : priorityConfig[p].inactive}`}
              >
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Link</FieldLabel>
          <input className="field" value={link} onChange={e => setLink(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <FieldLabel>Notes</FieldLabel>
          <input className="field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Size, color, style…" />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button type="submit" disabled={!idea.trim()} className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed">
            {gift ? 'Save Changes' : 'Add Gift'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ─── Confirm Delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ type, onConfirm, onCancel }: {
  type: 'person' | 'gift';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div
        className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 max-w-sm w-full border border-[rgba(0,0,20,0.08)] dark:border-[rgba(255,255,255,0.07)] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 className="text-[14px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.01em] mb-1.5">
          Delete {type === 'person' ? 'Person' : 'Gift'}?
        </h3>
        <p className="text-[12.5px] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.45)] leading-relaxed mb-5">
          {type === 'person'
            ? 'This will also delete all their gifts. This cannot be undone.'
            : 'This gift will be permanently deleted.'}
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className="btn-danger flex-1 justify-center">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function Gifts() {
  const { recipients, gifts, loading, addRecipient, updateRecipient, deleteRecipient, addGift, updateGift, deleteGift } = useGifts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [personModal, setPersonModal] = useState<{ open: boolean; editing?: GiftRecipient }>({ open: false });
  const [giftModal, setGiftModal] = useState<{ open: boolean; editing?: Gift }>({ open: false });
  const [statusFilter, setStatusFilter] = useState<GiftStatus | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'person' | 'gift'; id: string } | null>(null);
  const [purchasedExpanded, setPurchasedExpanded] = useState(false);

  const selectedRecipient = recipients.find(r => r.id === selectedId) ?? null;
  const personGifts = gifts.filter(g => g.recipientId === selectedId);

  const filteredGifts = (statusFilter === 'all' ? personGifts : personGifts.filter(g => g.status === statusFilter))
    .slice().sort((a, b) => {
      const sOrder = { want: 0, purchased: 1, cancelled: 2 };
      const pOrder = { high: 0, medium: 1, low: 2 };
      if (sOrder[a.status] !== sOrder[b.status]) return sOrder[a.status] - sOrder[b.status];
      return pOrder[a.priority] - pOrder[b.priority];
    });

  const totalPurchased = gifts.filter(g => g.status === 'purchased').reduce((s, g) => s + g.cost, 0);
  const totalWishlist  = gifts.filter(g => g.status === 'want').reduce((s, g) => s + g.cost, 0);
  const totalBudget    = recipients.reduce((s, r) => s + r.budget, 0);
  const personSpent = personGifts.filter(g => g.status === 'purchased').reduce((s, g) => s + g.cost, 0);
  const personWant  = personGifts.filter(g => g.status === 'want').reduce((s, g) => s + g.cost, 0);

  function handleSelectPerson(id: string) {
    setSelectedId(prev => prev === id ? null : id);
    setStatusFilter('all');
    setPurchasedExpanded(false);
  }

  function handleDeleteConfirmed() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'person') {
      if (selectedId === confirmDelete.id) setSelectedId(null);
      deleteRecipient(confirmDelete.id);
    } else {
      deleteGift(confirmDelete.id);
    }
    setConfirmDelete(null);
  }

  const nextColorKey = COLORS[recipients.length % COLORS.length].key;

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.035em]">Gifts</h1>
          {recipients.length > 0 && (
            <p className="text-[12px] font-medium text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] mt-0.5 tracking-[0.01em]">
              {recipients.length} {recipients.length === 1 ? 'person' : 'people'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPersonModal({ open: true })} className="btn-primary">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
            </svg>
            Add Person
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {recipients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="People" value={recipients.length} />
          <StatCard label="Total Budget" value={totalBudget > 0 ? formatCurrency(totalBudget) : '—'} />
          <StatCard label="Purchased" value={formatCurrency(totalPurchased)} />
          <StatCard label="Wish List" value={formatCurrency(totalWishlist)} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#6366f1]/20" />
            <div className="absolute inset-0 rounded-full border-t border-[#6366f1] animate-spin" />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && recipients.length === 0 && (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(99,102,241,0.1)] dark:bg-[rgba(129,140,248,0.1)] flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1] dark:text-[#818cf8]">
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5" rx="1"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] mb-1.5 tracking-[-0.015em]">No people yet</h3>
          <p className="text-[13px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mb-6">
            Track gift ideas, budgets, and purchases for everyone on your list.
          </p>
          <button onClick={() => setPersonModal({ open: true })} className="btn-primary mx-auto">
            Add First Person
          </button>
        </div>
      )}

      {/* Person tiles grid */}
      {!loading && recipients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {recipients.map((r, i) => (
            <PersonTile
              key={r.id}
              recipient={r}
              gifts={gifts.filter(g => g.recipientId === r.id)}
              isSelected={selectedId === r.id}
              colorIndex={i}
              onSelect={() => handleSelectPerson(r.id)}
              onEdit={e => { e.stopPropagation(); setPersonModal({ open: true, editing: r }); }}
            />
          ))}
        </div>
      )}

      {/* Selected person gift panel */}
      {selectedRecipient && (
        <div className="border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] rounded-2xl bg-[#ffffff] dark:bg-[#0f0f1a] overflow-hidden">

          {/* Panel header */}
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5 border-b border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h2 className="text-[15px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.02em]">
                  {selectedRecipient.name}
                </h2>
                {selectedRecipient.occasion && (
                  <span className="text-[11px] font-medium text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.38)] bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-md">
                    {selectedRecipient.occasion}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">
                <span>{personGifts.filter(g => g.status === 'want').length} on wish list</span>
                <span className="text-[rgba(0,0,20,0.2)] dark:text-[rgba(255,255,255,0.15)]">·</span>
                <span>{personGifts.filter(g => g.status === 'purchased').length} purchased</span>
                {selectedRecipient.budget > 0 && (
                  <>
                    <span className="text-[rgba(0,0,20,0.2)] dark:text-[rgba(255,255,255,0.15)]">·</span>
                    <span className="tabular-nums">{formatCurrency(personSpent)} / {formatCurrency(selectedRecipient.budget)}</span>
                  </>
                )}
                {selectedRecipient.budget === 0 && personSpent > 0 && (
                  <span className="tabular-nums">{formatCurrency(personSpent)} spent</span>
                )}
                {personWant > 0 && (
                  <span className="tabular-nums text-[#6366f1] dark:text-[#818cf8]">{formatCurrency(personWant)} in wishlist</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPersonModal({ open: true, editing: selectedRecipient })}
                className="btn-ghost text-[12px] px-3 py-1.5"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmDelete({ type: 'person', id: selectedRecipient.id })}
                className="text-[12px] font-medium px-3 py-1.5 rounded-[8px] border border-[rgba(220,38,38,0.2)] dark:border-[rgba(248,113,113,0.2)] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                Delete
              </button>
              <button onClick={() => setGiftModal({ open: true })} className="btn-primary text-[12px] px-3 py-1.5">
                + Add Gift
              </button>
            </div>
          </div>

          {/* Budget bar */}
          {selectedRecipient.budget > 0 && (
            <div className="px-6 py-3 border-b border-[rgba(0,0,20,0.05)] dark:border-[rgba(255,255,255,0.04)]">
              <div className="flex justify-between text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mb-1.5 tabular-nums">
                <span>Budget progress</span>
                <span className={personSpent > selectedRecipient.budget ? 'text-red-500 font-medium' : ''}>
                  {formatCurrency(personSpent)} / {formatCurrency(selectedRecipient.budget)}
                  {personSpent > selectedRecipient.budget && ' — over budget'}
                </span>
              </div>
              <div className="h-1.5 bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${personSpent > selectedRecipient.budget ? 'bg-red-400' : getColor(selectedRecipient.color).bar}`}
                  style={{ width: `${Math.min(100, (personSpent / selectedRecipient.budget) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Status filter */}
          {personGifts.length > 0 && (
            <div className="flex gap-1 px-6 py-3 border-b border-[rgba(0,0,20,0.05)] dark:border-[rgba(255,255,255,0.04)]">
              {(['all', 'want', 'purchased', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[11.5px] font-medium px-3 py-1 rounded-[7px] transition-colors ${
                    statusFilter === s
                      ? 'bg-[rgba(99,102,241,0.1)] dark:bg-[rgba(129,140,248,0.1)] text-[#6366f1] dark:text-[#818cf8]'
                      : 'text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.38)] hover:bg-[rgba(0,0,20,0.04)] dark:hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  {s === 'all'
                    ? `All (${personGifts.length})`
                    : `${STATUS_CONFIG[s].label} (${personGifts.filter(g => g.status === s).length})`}
                </button>
              ))}
            </div>
          )}

          {/* Gift list */}
          {filteredGifts.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)]">
              {personGifts.length === 0 ? 'No gifts yet — click "+ Add Gift" to get started.' : 'No gifts match this filter.'}
            </div>
          ) : (() => {
            const activeGifts = filteredGifts.filter(g => g.status !== 'purchased');
            const purchasedGifts = filteredGifts.filter(g => g.status === 'purchased');

            function GiftRow({ gift }: { gift: Gift }) {
              return (
                <div className={`flex items-center gap-3 px-6 py-3 hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors group ${gift.status === 'cancelled' ? 'opacity-45' : ''}`}>
                  <div className={`w-[5px] h-[5px] rounded-full shrink-0 ${PRIORITY_DOT[gift.priority]}`} title={`${gift.priority} priority`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] font-medium text-[#0a0a14] dark:text-[#e2e2f0] ${gift.status === 'cancelled' ? 'line-through' : ''}`}>
                      {gift.idea}
                    </div>
                    {gift.notes && (
                      <div className="text-[11.5px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] truncate">{gift.notes}</div>
                    )}
                  </div>
                  <div className="text-[13px] font-semibold text-[rgba(10,10,20,0.65)] dark:text-[rgba(226,226,240,0.6)] w-16 text-right shrink-0 tabular-nums">
                    {gift.cost > 0 ? formatCurrency(gift.cost) : '—'}
                  </div>
                  <button
                    onClick={() => {
                      const cycle: GiftStatus[] = ['want', 'purchased', 'cancelled'];
                      updateGift({ ...gift, status: cycle[(cycle.indexOf(gift.status) + 1) % cycle.length] });
                    }}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md transition-opacity hover:opacity-75 shrink-0 ${STATUS_CONFIG[gift.status].cls}`}
                    title="Click to cycle status"
                  >
                    {STATUS_CONFIG[gift.status].label}
                  </button>
                  {gift.link && (
                    <a
                      href={gift.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)] hover:text-[#6366f1] dark:hover:text-[#818cf8] transition-colors shrink-0"
                      title="Open link"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9"/>
                        <polyline points="11 1 15 1 15 5"/>
                        <line x1="7" y1="9" x2="15" y2="1"/>
                      </svg>
                    </a>
                  )}
                  <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setGiftModal({ open: true, editing: gift })}
                      className="text-[11.5px] font-medium px-2 py-0.5 rounded-md text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] hover:text-[#6366f1] dark:hover:text-[#818cf8] hover:bg-[rgba(99,102,241,0.08)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ type: 'gift', id: gift.id })}
                      className="text-[11.5px] font-medium px-2 py-0.5 rounded-md text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="divide-y divide-[rgba(0,0,20,0.05)] dark:divide-[rgba(255,255,255,0.04)]">
                {activeGifts.map(gift => <GiftRow key={gift.id} gift={gift} />)}
                {purchasedGifts.length > 0 && (
                  <>
                    <button
                      onClick={() => setPurchasedExpanded(e => !e)}
                      className="w-full flex items-center gap-2 px-6 py-2.5 bg-[rgba(0,0,20,0.02)] dark:bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] transition-colors text-left"
                    >
                      <svg
                        width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)] transition-transform ${purchasedExpanded ? 'rotate-90' : ''}`}
                      >
                        <polyline points="4 2 10 6 4 10"/>
                      </svg>
                      <span className="text-[11.5px] font-medium text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.38)]">
                        Purchased ({purchasedGifts.length})
                      </span>
                    </button>
                    {purchasedExpanded && purchasedGifts.map(gift => <GiftRow key={gift.id} gift={gift} />)}
                  </>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modals */}
      {personModal.open && (
        <PersonModal
          recipient={personModal.editing}
          defaultColorKey={nextColorKey}
          onSave={async data => {
            if (personModal.editing) {
              updateRecipient({ ...personModal.editing, ...data });
            } else {
              const r = await addRecipient(data);
              setSelectedId(r.id);
            }
            setPersonModal({ open: false });
          }}
          onClose={() => setPersonModal({ open: false })}
        />
      )}

      {giftModal.open && selectedRecipient && (
        <GiftModal
          gift={giftModal.editing}
          recipientId={selectedRecipient.id}
          onSave={data => {
            if (giftModal.editing) updateGift({ ...giftModal.editing, ...data });
            else addGift(data);
            setGiftModal({ open: false });
          }}
          onClose={() => setGiftModal({ open: false })}
        />
      )}

      {confirmDelete && (
        <ConfirmDelete
          type={confirmDelete.type}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
