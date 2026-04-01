import { useState } from 'react';
import { useGifts } from '../hooks/useGifts';
import type { Gift, GiftRecipient, GiftStatus, GiftPriority } from '../lib/types';
import { formatCurrency } from '../lib/utils';

// ─── Color palette ─────────────────────────────────────────────────────────────
const COLORS = [
  { key: 'orange', border: 'border-orange-300 dark:border-orange-700/60', bar: 'bg-orange-400', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', ring: 'ring-orange-400' },
  { key: 'blue',    border: 'border-blue-300 dark:border-blue-700/60',    bar: 'bg-blue-400',    text: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/30',    ring: 'ring-blue-400' },
  { key: 'emerald', border: 'border-emerald-300 dark:border-emerald-700/60', bar: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', ring: 'ring-emerald-400' },
  { key: 'violet',  border: 'border-violet-300 dark:border-violet-700/60',  bar: 'bg-violet-400',  text: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-950/30',  ring: 'ring-violet-400' },
  { key: 'rose',    border: 'border-rose-300 dark:border-rose-700/60',    bar: 'bg-rose-400',    text: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/30',    ring: 'ring-rose-400' },
  { key: 'amber',   border: 'border-amber-300 dark:border-amber-700/60',   bar: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30',   ring: 'ring-amber-400' },
  { key: 'cyan',    border: 'border-cyan-300 dark:border-cyan-700/60',    bar: 'bg-cyan-400',    text: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-950/30',    ring: 'ring-cyan-400' },
  { key: 'pink',    border: 'border-pink-300 dark:border-pink-700/60',    bar: 'bg-pink-400',    text: 'text-pink-600 dark:text-pink-400',    bg: 'bg-pink-50 dark:bg-pink-950/30',    ring: 'ring-pink-400' },
];

function getColor(key: string) {
  return COLORS.find(c => c.key === key) ?? COLORS[0];
}

const STATUS_CONFIG: Record<GiftStatus, { label: string; badge: string }> = {
  want:      { label: 'Want',      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  purchased: { label: 'Purchased', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  cancelled: { label: 'Cancelled', badge: 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-500' },
};

const PRIORITY_CONFIG: Record<GiftPriority, { label: string; dot: string }> = {
  high:   { label: 'High',   dot: 'bg-rose-400' },
  medium: { label: 'Medium', dot: 'bg-amber-400' },
  low:    { label: 'Low',    dot: 'bg-gray-300 dark:bg-zinc-600' },
};

const OCCASIONS = [
  'Christmas', 'Birthday', 'Anniversary', "Mother's Day", "Father's Day",
  "Valentine's Day", 'Graduation', 'Wedding', 'Baby Shower', 'Housewarming', 'Other',
];

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
      <div className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
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
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        isSelected
          ? `${color.border} ${color.bg} ring-2 ${color.ring}`
          : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{recipient.name}</div>
          {recipient.occasion && (
            <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">{recipient.occasion}</div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 text-xs p-0.5 rounded transition-colors ml-1 flex-shrink-0"
        >
          ✎
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {want.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {want.length} Want
          </span>
        )}
        {purchased.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {purchased.length} Bought
          </span>
        )}
        {gifts.length === 0 && (
          <span className="text-xs text-gray-400 dark:text-zinc-500">No gifts yet</span>
        )}
      </div>

      {recipient.budget > 0 ? (
        <div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1">
            <span>{formatCurrency(spent)}</span>
            <span>{formatCurrency(recipient.budget)}</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${color.bar} rounded-full transition-all`}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      ) : spent > 0 ? (
        <div className={`text-sm font-semibold ${color.text}`}>{formatCurrency(spent)} spent</div>
      ) : null}
    </button>
  );
}

// ─── Person Modal ──────────────────────────────────────────────────────────────
function PersonModal({
  recipient, defaultColorKey, onSave, onClose,
}: {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">{recipient ? 'Edit Person' : 'Add Person'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Person's name"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Occasion</label>
            <select
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">No occasion</option>
              {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Gift Budget ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full ${c.bar} transition-transform ${color === c.key ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-zinc-900 scale-110' : 'hover:scale-105'}`}
                  title={c.key}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {recipient ? 'Save Changes' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Gift Modal ────────────────────────────────────────────────────────────────
function GiftModal({
  gift, recipientId, onSave, onClose,
}: {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 w-full max-w-md shadow-xl">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">{gift ? 'Edit Gift' : 'Add Gift'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Gift Idea *</label>
            <input
              value={idea}
              onChange={e => setIdea(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="What's the gift?"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as GiftStatus)}
                className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="want">Want</option>
                <option value="purchased">Purchased</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as GiftPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    priority === p
                      ? p === 'high'   ? 'bg-rose-500 border-rose-500 text-white'
                      : p === 'medium' ? 'bg-amber-500 border-amber-500 text-white'
                      :                  'bg-gray-400 border-gray-400 text-white'
                      : 'border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Link (optional)</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Notes (optional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Size, color, style, etc."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!idea.trim()} className="flex-1 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {gift ? 'Save Changes' : 'Add Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDelete({
  type, onConfirm, onCancel,
}: {
  type: 'person' | 'gift';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 max-w-sm w-full shadow-xl">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Delete {type === 'person' ? 'Person' : 'Gift'}?
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
          {type === 'person'
            ? 'This will also delete all their gifts. This cannot be undone.'
            : 'This gift will be permanently deleted.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
            Delete
          </button>
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
    .slice()
    .sort((a, b) => {
      const sOrder = { want: 0, purchased: 1, cancelled: 2 };
      const pOrder = { high: 0, medium: 1, low: 2 };
      if (sOrder[a.status] !== sOrder[b.status]) return sOrder[a.status] - sOrder[b.status];
      return pOrder[a.priority] - pOrder[b.priority];
    });

  // Overall summary
  const totalPurchased = gifts.filter(g => g.status === 'purchased').reduce((s, g) => s + g.cost, 0);
  const totalWishlist  = gifts.filter(g => g.status === 'want').reduce((s, g) => s + g.cost, 0);
  const totalBudget    = recipients.reduce((s, r) => s + r.budget, 0);

  // Selected person stats
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
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gifts</h1>
        <button
          onClick={() => setPersonModal({ open: true })}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Person
        </button>
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
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && recipients.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
          <div className="text-5xl mb-4">🎁</div>
          <div className="text-lg font-medium text-gray-500 dark:text-zinc-400 mb-1">No people added yet</div>
          <div className="text-sm mb-6">Track gift ideas, budgets, and purchases for everyone on your list.</div>
          <button
            onClick={() => setPersonModal({ open: true })}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add First Person
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
        <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden">

          {/* Panel header */}
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRecipient.name}</h2>
                {selectedRecipient.occasion && (
                  <span className="text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {selectedRecipient.occasion}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-500 dark:text-zinc-400">
                <span>{personGifts.filter(g => g.status === 'want').length} on wish list</span>
                <span>{personGifts.filter(g => g.status === 'purchased').length} purchased</span>
                {selectedRecipient.budget > 0 && (
                  <span>{formatCurrency(personSpent)} of {formatCurrency(selectedRecipient.budget)} budget used</span>
                )}
                {selectedRecipient.budget === 0 && personSpent > 0 && (
                  <span>{formatCurrency(personSpent)} spent</span>
                )}
                {personWant > 0 && (
                  <span>{formatCurrency(personWant)} on wish list</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setPersonModal({ open: true, editing: selectedRecipient })}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Edit Person
              </button>
              <button
                onClick={() => setConfirmDelete({ type: 'person', id: selectedRecipient.id })}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setGiftModal({ open: true })}
                className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
              >
                + Add Gift
              </button>
            </div>
          </div>

          {/* Budget bar (if set) */}
          {selectedRecipient.budget > 0 && (
            <div className="px-6 py-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
                <span>Budget progress</span>
                <span className={personSpent > selectedRecipient.budget ? 'text-red-500 font-medium' : ''}>
                  {formatCurrency(personSpent)} / {formatCurrency(selectedRecipient.budget)}
                  {personSpent > selectedRecipient.budget && ' — over budget!'}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    personSpent > selectedRecipient.budget ? 'bg-red-400' : getColor(selectedRecipient.color).bar
                  }`}
                  style={{ width: `${Math.min(100, (personSpent / selectedRecipient.budget) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Status filter tabs */}
          {personGifts.length > 0 && (
            <div className="flex gap-1 px-6 py-3 border-b border-gray-100 dark:border-zinc-800">
              {(['all', 'want', 'purchased', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors capitalize ${
                    statusFilter === s
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
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
            <div className="py-12 text-center text-sm text-gray-400 dark:text-zinc-500">
              {personGifts.length === 0 ? 'No gifts yet — click "+ Add Gift" to get started!' : 'No gifts match this filter.'}
            </div>
          ) : (() => {
            const activeGifts = filteredGifts.filter(g => g.status !== 'purchased');
            const purchasedGifts = filteredGifts.filter(g => g.status === 'purchased');

            function GiftRow({ gift }: { gift: Gift }) {
              return (
                <div
                  key={gift.id}
                  className={`flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors group ${gift.status === 'cancelled' ? 'opacity-50' : ''}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_CONFIG[gift.priority].dot}`}
                    title={`${PRIORITY_CONFIG[gift.priority].label} priority`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium text-gray-900 dark:text-white ${gift.status === 'cancelled' ? 'line-through' : ''}`}>
                      {gift.idea}
                    </div>
                    {gift.notes && (
                      <div className="text-xs text-gray-400 dark:text-zinc-500 truncate">{gift.notes}</div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300 w-20 text-right flex-shrink-0">
                    {gift.cost > 0 ? formatCurrency(gift.cost) : '—'}
                  </div>
                  <button
                    onClick={() => {
                      const cycle: GiftStatus[] = ['want', 'purchased', 'cancelled'];
                      const next = cycle[(cycle.indexOf(gift.status) + 1) % cycle.length];
                      updateGift({ ...gift, status: next });
                    }}
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-opacity hover:opacity-75 flex-shrink-0 ${STATUS_CONFIG[gift.status].badge}`}
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
                      className="text-gray-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex-shrink-0 text-sm"
                      title="Open link"
                    >
                      ↗
                    </a>
                  )}
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setGiftModal({ open: true, editing: gift })}
                      className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 px-1.5 py-0.5 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ type: 'gift', id: gift.id })}
                      className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {activeGifts.map(gift => <GiftRow key={gift.id} gift={gift} />)}

                {purchasedGifts.length > 0 && (
                  <>
                    <button
                      onClick={() => setPurchasedExpanded(e => !e)}
                      className="w-full flex items-center gap-2 px-6 py-2.5 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <span className={`text-gray-400 dark:text-zinc-500 text-xs transition-transform ${purchasedExpanded ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
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
            if (giftModal.editing) {
              updateGift({ ...giftModal.editing, ...data });
            } else {
              addGift(data);
            }
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
