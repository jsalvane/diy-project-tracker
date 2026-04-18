import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey } from '../lib/useEscapeKey';
import { useGoals } from '../hooks/useGoals';
import type { Goal, GoalType } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { ReceiptStrip, TapeLabel } from './ui';

const TYPE_LABEL: Record<GoalType, string> = {
  savings: 'Savings',
  payoff: 'Debt Payoff',
  retirement: 'Retirement',
  emergency: 'Emergency Fund',
  custom: 'Custom',
};

const TYPE_COLOR: Record<GoalType, string> = {
  savings: 'var(--moss)',
  payoff: 'var(--rust)',
  retirement: 'var(--ochre)',
  emergency: 'var(--ink-2)',
  custom: 'var(--ink-3)',
};

function monthsBetween(fromISO: string, toISO: string): number {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(toISO + 'T00:00:00');
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function projectMonthsToGoal(remaining: number, monthly: number): number | null {
  if (remaining <= 0) return 0;
  if (monthly <= 0) return null;
  return Math.ceil(remaining / monthly);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Projection math ────────────────────────────────────────────────────────

type Projection = {
  progressPct: number;
  remaining: number;
  monthsToGoal: number | null;
  paceDate: Date | null;
  onTrack: boolean | null;
};

function computeProjection(g: Goal, overrideMonthly?: number): Projection {
  const remaining = Math.max(0, g.targetAmount - g.currentAmount);
  const monthly = overrideMonthly ?? g.monthlyContribution;
  const monthsToGoal = projectMonthsToGoal(remaining, monthly);
  const paceDate = monthsToGoal != null ? addMonths(new Date(), monthsToGoal) : null;
  const progressPct = g.targetAmount > 0
    ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
    : 0;

  let onTrack: boolean | null = null;
  if (g.targetDate && monthsToGoal != null) {
    const targetMonths = monthsBetween(new Date().toISOString().slice(0, 10), g.targetDate);
    onTrack = monthsToGoal <= targetMonths;
  }

  return { progressPct, remaining, monthsToGoal, paceDate, onTrack };
}

// ── Modal ──────────────────────────────────────────────────────────────────

interface GoalFormProps {
  initial?: Goal;
  onSave: (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
  onDelete?: () => void;
}

function GoalForm({ initial, onSave, onClose, onDelete }: GoalFormProps) {
  useEscapeKey(onClose);
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<GoalType>(initial?.type ?? 'savings');
  const [targetAmount, setTargetAmount] = useState(String(initial?.targetAmount ?? ''));
  const [currentAmount, setCurrentAmount] = useState(String(initial?.currentAmount ?? ''));
  const [monthlyContribution, setMonthlyContribution] = useState(String(initial?.monthlyContribution ?? ''));
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type,
      targetAmount: parseFloat(targetAmount) || 0,
      currentAmount: parseFloat(currentAmount) || 0,
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      targetDate,
      notes,
      sortOrder: initial?.sortOrder ?? 0,
    });
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,22,18,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[14px] overflow-hidden"
        style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <TapeLabel>{initial ? 'Edit Goal' : 'New Goal'}</TapeLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <div>
              <label className="tape-label block mb-1">Name</label>
              <input className="field w-full" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="tape-label block mb-1">Type</label>
              <select className="field w-full" value={type} onChange={(e) => setType(e.target.value as GoalType)}>
                {(Object.keys(TYPE_LABEL) as GoalType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="tape-label block mb-1">Target $</label>
                <input type="number" step="0.01" className="field w-full" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
              </div>
              <div>
                <label className="tape-label block mb-1">Current $</label>
                <input type="number" step="0.01" className="field w-full" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="tape-label block mb-1">Monthly $</label>
                <input type="number" step="0.01" className="field w-full" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
              </div>
              <div>
                <label className="tape-label block mb-1">Target Date</label>
                <input type="date" className="field w-full" style={{ minWidth: 0 }} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="tape-label block mb-1">Notes</label>
              <textarea className="field w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2" style={{ marginTop: 20 }}>
            {initial && onDelete ? (
              <button type="button" onClick={() => { if (confirm('Delete this goal?')) { onDelete(); onClose(); } }}
                className="tape-label" style={{ color: 'var(--rust)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Delete
              </button>
            ) : <span />}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Goal row ───────────────────────────────────────────────────────────────

function GoalRow({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const [whatIf, setWhatIf] = useState<number | null>(null);
  const proj = useMemo(() => computeProjection(goal, whatIf ?? undefined), [goal, whatIf]);
  const baseline = useMemo(() => computeProjection(goal), [goal]);
  const typeColor = TYPE_COLOR[goal.type];

  const barColor = proj.onTrack === false ? 'var(--rust)' : proj.onTrack === true ? 'var(--moss)' : 'var(--ink)';

  return (
    <div style={{ padding: '20px 0' }}>
      <div className="flex items-start justify-between gap-3" style={{ marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <span className="tape-label" style={{ color: typeColor }}>{TYPE_LABEL[goal.type]}</span>
          <div className="font-serif" style={{ fontSize: 26, lineHeight: '30px', color: 'var(--ink)', marginTop: 2 }}>
            {goal.name}<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
          </div>
        </div>
        <button onClick={onEdit} className="tape-label"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}>
          Edit
        </button>
      </div>

      {/* Amounts */}
      <div className="flex items-baseline justify-between" style={{ marginBottom: 6 }}>
        <span className="font-mono-label" style={{ fontSize: 13, color: 'var(--ink)' }}>
          {formatCurrency(goal.currentAmount)}
        </span>
        <span className="font-mono-label" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          of {formatCurrency(goal.targetAmount)}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--ink-line)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${proj.progressPct}%`, background: barColor, transition: 'width 0.5s' }} />
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
        <span className="tape-label">{proj.progressPct}% · {formatCurrency(proj.remaining)} to go</span>
        <span className="tape-label" style={{ color: proj.onTrack === false ? 'var(--rust)' : 'var(--ink-3)' }}>
          {proj.monthsToGoal == null
            ? 'No contribution set'
            : proj.monthsToGoal === 0
              ? 'Complete'
              : `${proj.monthsToGoal}mo · ${proj.paceDate ? formatMonthYear(proj.paceDate) : ''}`}
        </span>
      </div>

      {goal.targetDate && (
        <div className="tape-label" style={{ marginTop: 4, color: 'var(--ink-4)' }}>
          Target {formatMonthYear(new Date(goal.targetDate + 'T00:00:00'))}
          {proj.onTrack != null && (
            <> · {proj.onTrack ? 'on track' : 'behind pace'}</>
          )}
        </div>
      )}

      {/* What-if slider */}
      {goal.targetAmount > 0 && (
        <div style={{ marginTop: 14, padding: 12, background: 'var(--paper-2)', borderRadius: 10 }}>
          <div className="flex items-baseline justify-between" style={{ marginBottom: 6 }}>
            <TapeLabel>What if</TapeLabel>
            <span className="font-mono-label" style={{ fontSize: 12, color: 'var(--ink)' }}>
              {formatCurrency(whatIf ?? goal.monthlyContribution)}/mo
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(goal.monthlyContribution * 3, 500)}
            step={25}
            value={whatIf ?? goal.monthlyContribution}
            onChange={(e) => setWhatIf(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--ink)' }}
          />
          {whatIf != null && whatIf !== goal.monthlyContribution && baseline.monthsToGoal != null && proj.monthsToGoal != null && (
            <div className="tape-label" style={{ marginTop: 6, color: 'var(--ink-3)' }}>
              {proj.monthsToGoal < baseline.monthsToGoal
                ? `${baseline.monthsToGoal - proj.monthsToGoal}mo sooner`
                : proj.monthsToGoal > baseline.monthsToGoal
                  ? `${proj.monthsToGoal - baseline.monthsToGoal}mo later`
                  : 'same pace'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export function Goals() {
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const sorted = useMemo(() => [...goals].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)), [goals]);

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    const current = goals.reduce((s, g) => s + g.currentAmount, 0);
    const monthly = goals.reduce((s, g) => s + g.monthlyContribution, 0);
    return { target, current, monthly };
  }, [goals]);

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(g: Goal) {
    setEditing(g);
    setShowForm(true);
  }

  return (
    <div>
      {/* Stat strip */}
      <div className="grid grid-cols-3" style={{ borderTop: '1px solid var(--ink-line)', borderBottom: '1px solid var(--ink-line)', marginBottom: 20 }}>
        <div style={{ padding: '14px 12px', borderRight: '1px solid var(--ink-line)' }}>
          <TapeLabel>Saved</TapeLabel>
          <div className="font-serif" style={{ fontSize: 28, lineHeight: '32px', color: 'var(--ink)', marginTop: 2 }}>
            {formatCurrency(totals.current)}
          </div>
        </div>
        <div style={{ padding: '14px 12px', borderRight: '1px solid var(--ink-line)' }}>
          <TapeLabel>Target</TapeLabel>
          <div className="font-serif" style={{ fontSize: 28, lineHeight: '32px', color: 'var(--ink)', marginTop: 2 }}>
            {formatCurrency(totals.target)}
          </div>
        </div>
        <div style={{ padding: '14px 12px' }}>
          <TapeLabel>Monthly</TapeLabel>
          <div className="font-serif" style={{ fontSize: 28, lineHeight: '32px', color: 'var(--ink)', marginTop: 2 }}>
            {formatCurrency(totals.monthly)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <TapeLabel>All Goals</TapeLabel>
        <button onClick={openNew} className="btn-primary btn-sm">+ New Goal</button>
      </div>

      {loading ? (
        <div className="tape-label" style={{ padding: '32px 0', textAlign: 'center' }}>Loading…</div>
      ) : sorted.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p className="font-serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
            No goals yet<em style={{ color: 'var(--rust)' }}>.</em>
          </p>
          <button onClick={openNew} className="btn-ghost" style={{ marginTop: 16 }}>Add your first goal</button>
        </div>
      ) : (
        <div>
          {sorted.map((g, i) => (
            <div key={g.id}>
              <GoalRow goal={g} onEdit={() => openEdit(g)} />
              {i < sorted.length - 1 && <ReceiptStrip />}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <GoalForm
          initial={editing ?? undefined}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing) {
              updateGoal({ ...editing, ...data });
            } else {
              addGoal(data);
            }
          }}
          onDelete={editing ? () => deleteGoal(editing.id) : undefined}
        />
      )}
    </div>
  );
}
