import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGifts } from '../hooks/useGifts';
import type { Gift, GiftRecipient, GiftStatus, GiftPriority } from '../lib/types';
import { formatCurrency } from '../lib/utils';

// ─── Color palette ─────────────────────────────────────────────────────────────
const COLORS = [
  { key: 'orange', bar: 'bg-orange-400', text: 'text-orange-500', dot: 'bg-orange-400' },
  { key: 'blue',   bar: 'bg-blue-400',   text: 'text-[var(--ochre)]',     dot: 'bg-blue-400'   },
  { key: 'emerald',bar: 'bg-emerald-400',text: 'text-emerald-500',dot:'bg-emerald-400' },
  { key: 'violet', bar: 'bg-violet-400', text: 'text-violet-500', dot: 'bg-violet-400' },
  { key: 'rose',   bar: 'bg-rose-400',   text: 'text-rose-500',     dot: 'bg-rose-400'   },
  { key: 'amber',  bar: 'bg-amber-400',  text: 'text-[var(--ochre)]',   dot: 'bg-amber-400'  },
  { key: 'cyan',   bar: 'bg-cyan-400',   text: 'text-cyan-500',     dot: 'bg-cyan-400'   },
  { key: 'pink',   bar: 'bg-pink-400',   text: 'text-pink-500',     dot: 'bg-pink-400'   },
];


const STATUS_CONFIG: Record<GiftStatus, { label: string; color: string; bg: string }> = {
  want:      { label: 'Want',      color: 'var(--rust)',  bg: 'rgba(184,69,31,0.10)' },
  purchased: { label: 'Purchased', color: 'var(--moss)',  bg: 'rgba(85,107,47,0.10)' },
  cancelled: { label: 'Cancelled', color: 'var(--ink-4)', bg: 'rgba(154,141,124,0.10)' },
};

const PRIORITY_COLOR: Record<GiftPriority, string> = {
  high:   'var(--rust)',
  medium: 'var(--ochre)',
  low:    'var(--ink-4)',
};

const OCCASIONS = [
  'Christmas', 'Birthday', 'Anniversary', "Mother's Day", "Father's Day",
  "Valentine's Day", 'Graduation', 'Wedding', 'Baby Shower', 'Housewarming', 'Other',
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="tape-label block mb-1.5">
      {children}
    </label>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)', borderRadius: 12, padding: 16 }}>
      <div className="tape-label mb-1">{label}</div>
      <div className="display-md tabular-nums" style={{ color: 'var(--ink)' }}>{value}</div>
    </div>
  );
}

// ─── Person Tile ───────────────────────────────────────────────────────────────
function PersonTile({
  recipient, gifts, isSelected, onSelect, onEdit,
}: {
  recipient: GiftRecipient;
  gifts: Gift[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
}) {
  const purchased = gifts.filter(g => g.status === 'purchased');
  const want = gifts.filter(g => g.status === 'want');
  const spent = purchased.reduce((s, g) => s + g.cost, 0);
  const budgetPct = recipient.budget > 0 ? Math.min(100, (spent / recipient.budget) * 100) : 0;

  return (
    <div
      onClick={onSelect}
      className="w-full text-left p-4 transition-all duration-150 cursor-pointer"
      style={{
        borderRadius: 12,
        border: `1px solid ${isSelected ? 'var(--ink-line-2)' : 'var(--ink-line)'}`,
        background: isSelected ? 'var(--paper-2)' : 'var(--paper)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {recipient.name}
          </div>
          {recipient.occasion && (
            <div className="tape-label mt-0.5 truncate" style={{ fontSize: 9 }}>{recipient.occasion}</div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="p-0.5 rounded ml-1.5 shrink-0 transition-colors"
          style={{ color: 'var(--ink-4)' }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H2v-3L11.5 2.5z"/>
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-2.5">
        {want.length > 0 && (
          <span className="tape-label px-1.5 py-0.5 rounded" style={{ color: 'var(--rust)', background: 'rgba(184,69,31,0.10)', fontSize: 9 }}>
            {want.length} want
          </span>
        )}
        {purchased.length > 0 && (
          <span className="tape-label px-1.5 py-0.5 rounded" style={{ color: 'var(--moss)', background: 'rgba(85,107,47,0.10)', fontSize: 9 }}>
            {purchased.length} bought
          </span>
        )}
        {gifts.length === 0 && (
          <span className="tape-label" style={{ fontSize: 9 }}>No gifts yet</span>
        )}
      </div>

      {recipient.budget > 0 ? (
        <div>
          <div className="flex justify-between mb-1 tabular-nums" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
            <span>{formatCurrency(spent)}</span>
            <span>{formatCurrency(recipient.budget)}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--ink-line)' }}>
            <div style={{ width: `${budgetPct}%`, height: '100%', background: budgetPct > 90 ? 'var(--rust)' : 'var(--moss)', borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
        </div>
      ) : spent > 0 ? (
        <div className="tape-label tabular-nums" style={{ color: 'var(--ink-2)', fontSize: 9 }}>{formatCurrency(spent)} spent</div>
      ) : null}
    </div>
  );
}

// ─── Modal shell ───────────────────────────────────────────────────────────────
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4" style={{ background: 'rgba(26,22,18,0.45)' }}>
      <div
        style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)', borderRadius: 14, boxShadow: '0 24px 60px rgba(26,22,18,0.25)', width: '100%', maxWidth: 448 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <span className="tape-label">{title}</span>
          <button onClick={onClose} style={{ color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  ,
    document.body
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
                className={`w-6 h-6 rounded-full ${c.bar} transition-transform ${color === c.key ? 'ring-2 ring-offset-2 ring-[var(--rust)] scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
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
    high:   { label: 'High',   active: 'bg-rose-500 border-rose-500 text-[var(--paper)]',   inactive: 'border-[rgba(0,0,20,0.13)] text-[var(--ink-3)] hover:border-rose-300' },
    medium: { label: 'Medium', active: 'bg-[rgba(176,122,26,0.05)]0 border-amber-500 text-[var(--paper)]', inactive: 'border-[rgba(0,0,20,0.13)] text-[var(--ink-3)] hover:border-amber-300' },
    low:    { label: 'Low',    active: 'bg-[rgba(0,0,20,0.25)] border-transparent text-[var(--paper)]', inactive: 'border-[rgba(0,0,20,0.13)] text-[var(--ink-3)]' },
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
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4" style={{ background: 'rgba(26,22,18,0.45)' }}>
      <div
        style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)', borderRadius: 14, boxShadow: '0 24px 60px rgba(26,22,18,0.25)', padding: 24, maxWidth: 380, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="font-serif mb-2" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--ink)' }}>
          Delete {type === 'person' ? 'Person' : 'Gift'}<em style={{ color: 'var(--rust)' }}>?</em>
        </p>
        <p className="mb-5" style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          {type === 'person'
            ? 'This will also delete all their gifts. This cannot be undone.'
            : 'This gift will be permanently deleted.'}
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button
            onClick={onConfirm}
            className="flex-1 justify-center"
            style={{ background: 'var(--rust)', color: 'var(--paper)', border: 'none', borderRadius: 999, padding: '10px 18px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  ,
    document.body
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
          <span className="tape-label">Gifts · {new Date().getFullYear()}</span>
          <h1 className="display-lg mt-1" style={{ color: 'var(--ink)' }}>
            Gifts<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
          </h1>
        </div>
        <button onClick={() => setPersonModal({ open: true })} className="btn-primary btn-sm flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
          </svg>
          Add Person
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
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(184,69,31,0.2)' }} />
            <div className="absolute inset-0 rounded-full border-t animate-spin" style={{ borderColor: 'var(--rust)' }} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && recipients.length === 0 && (
        <div className="text-center py-20">
          <p className="font-serif mb-4" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
            No one on your list yet<em style={{ color: 'var(--rust)' }}>.</em>
          </p>
          <button onClick={() => setPersonModal({ open: true })} className="btn-ghost">
            Add First Person
          </button>
        </div>
      )}

      {/* Person tiles grid */}
      {!loading && recipients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {recipients.map((r) => (
            <PersonTile
              key={r.id}
              recipient={r}
              gifts={gifts.filter(g => g.recipientId === r.id)}
              isSelected={selectedId === r.id}

              onSelect={() => handleSelectPerson(r.id)}
              onEdit={e => { e.stopPropagation(); setPersonModal({ open: true, editing: r }); }}
            />
          ))}
        </div>
      )}

      {/* Selected person gift panel */}
      {selectedRecipient && (
        <div style={{ border: '1px solid var(--ink-line)', borderRadius: 14, background: 'var(--paper)', overflow: 'hidden' }}>

          {/* Panel header */}
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                  {selectedRecipient.name}
                </h2>
                {selectedRecipient.occasion && (
                  <span className="tape-label px-2 py-0.5 rounded" style={{ fontSize: 9, background: 'var(--paper-2)' }}>
                    {selectedRecipient.occasion}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 tape-label" style={{ fontSize: 9 }}>
                <span>{personGifts.filter(g => g.status === 'want').length} on wish list</span>
                <span>·</span>
                <span>{personGifts.filter(g => g.status === 'purchased').length} purchased</span>
                {selectedRecipient.budget > 0 && (
                  <span className="tabular-nums">{formatCurrency(personSpent)} / {formatCurrency(selectedRecipient.budget)}</span>
                )}
                {personWant > 0 && (
                  <span className="tabular-nums" style={{ color: 'var(--rust)' }}>{formatCurrency(personWant)} in wishlist</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setPersonModal({ open: true, editing: selectedRecipient })} className="btn-ghost btn-sm">Edit</button>
              <button
                onClick={() => setConfirmDelete({ type: 'person', id: selectedRecipient.id })}
                className="btn-sm"
                style={{ background: 'transparent', border: '1px solid rgba(184,69,31,0.3)', borderRadius: 999, color: 'var(--rust)', padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Delete
              </button>
              <button onClick={() => setGiftModal({ open: true })} className="btn-primary btn-sm">+ Add Gift</button>
            </div>
          </div>

          {/* Budget bar */}
          {selectedRecipient.budget > 0 && (
            <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--ink-line)' }}>
              <div className="flex justify-between mb-1.5 tabular-nums tape-label" style={{ fontSize: 9 }}>
                <span>Budget progress</span>
                <span style={{ color: personSpent > selectedRecipient.budget ? 'var(--rust)' : 'var(--ink-3)' }}>
                  {formatCurrency(personSpent)} / {formatCurrency(selectedRecipient.budget)}
                  {personSpent > selectedRecipient.budget && ' — over budget'}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--ink-line)' }}>
                <div
                  style={{
                    width: `${Math.min(100, (personSpent / selectedRecipient.budget) * 100)}%`,
                    height: '100%', borderRadius: 999, transition: 'width 0.3s',
                    background: personSpent > selectedRecipient.budget ? 'var(--rust)' : 'var(--moss)',
                  }}
                />
              </div>
            </div>
          )}

          {/* Status filter */}
          {personGifts.length > 0 && (
            <div className="flex gap-1 px-6 py-3" style={{ borderBottom: '1px solid var(--ink-line)' }}>
              {(['all', 'want', 'purchased', 'cancelled'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="tape-label px-3 py-1 rounded-full transition-colors"
                  style={{
                    fontSize: 9,
                    background: statusFilter === s ? 'var(--ink)' : 'transparent',
                    color: statusFilter === s ? 'var(--paper)' : 'var(--ink-3)',
                    border: `1px solid ${statusFilter === s ? 'var(--ink)' : 'var(--ink-line-2)'}`,
                    cursor: 'pointer',
                  }}
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
            <div className="py-12 text-center tape-label">
              {personGifts.length === 0 ? 'No gifts yet — click "+ Add Gift" to get started.' : 'No gifts match this filter.'}
            </div>
          ) : (() => {
            const activeGifts = filteredGifts.filter(g => g.status !== 'purchased');
            const purchasedGifts = filteredGifts.filter(g => g.status === 'purchased');

            function GiftRow({ gift }: { gift: Gift }) {
              return (
                <div
                  className="flex items-center gap-3 px-6 py-3 group transition-colors"
                  style={{ opacity: gift.status === 'cancelled' ? 0.5 : 1, borderBottom: '1px solid var(--ink-line)' }}
                >
                  <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: PRIORITY_COLOR[gift.priority] }} title={`${gift.priority} priority`} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', textDecoration: gift.status === 'cancelled' ? 'line-through' : 'none' }}>
                      {gift.idea}
                    </div>
                    {gift.notes && (
                      <div className="truncate" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{gift.notes}</div>
                    )}
                  </div>
                  <div className="w-16 text-right shrink-0 tabular-nums" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)' }}>
                    {gift.cost > 0 ? formatCurrency(gift.cost) : '—'}
                  </div>
                  <button
                    onClick={() => {
                      const cycle: GiftStatus[] = ['want', 'purchased', 'cancelled'];
                      updateGift({ ...gift, status: cycle[(cycle.indexOf(gift.status) + 1) % cycle.length] });
                    }}
                    className="tape-label px-2 py-0.5 rounded-full shrink-0"
                    style={{ fontSize: 9, color: STATUS_CONFIG[gift.status].color, background: STATUS_CONFIG[gift.status].bg, border: `1px solid ${STATUS_CONFIG[gift.status].color}40`, cursor: 'pointer' }}
                    title="Click to cycle status"
                  >
                    {STATUS_CONFIG[gift.status].label}
                  </button>
                  {gift.link && (
                    <a href={gift.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--ink-4)', flexShrink: 0 }} title="Open link">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9"/>
                        <polyline points="11 1 15 1 15 5"/><line x1="7" y1="9" x2="15" y2="1"/>
                      </svg>
                    </a>
                  )}
                  <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setGiftModal({ open: true, editing: gift })} className="tape-label px-2 py-0.5 rounded" style={{ fontSize: 9, color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 'none' }}>Edit</button>
                    <button onClick={() => setConfirmDelete({ type: 'gift', id: gift.id })} className="tape-label px-2 py-0.5 rounded" style={{ fontSize: 9, color: 'var(--rust)', cursor: 'pointer', background: 'none', border: 'none' }}>Del</button>
                  </div>
                </div>
              );
            }

            return (
              <div>
                {activeGifts.map(gift => <GiftRow key={gift.id} gift={gift} />)}
                {purchasedGifts.length > 0 && (
                  <>
                    <button
                      onClick={() => setPurchasedExpanded(e => !e)}
                      className="w-full flex items-center gap-2 px-6 py-2.5 text-left transition-colors"
                      style={{ background: 'var(--paper-2)', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--ink-line)' }}
                    >
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ color: 'var(--ink-4)', transform: purchasedExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                        <polyline points="4 2 10 6 4 10"/>
                      </svg>
                      <span className="tape-label" style={{ fontSize: 9 }}>Purchased ({purchasedGifts.length})</span>
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
