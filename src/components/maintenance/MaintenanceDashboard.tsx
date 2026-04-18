import { useMemo, useState } from 'react';
import type { MaintenanceTask, MaintenanceCompletion, MaintenanceCategory, MaintenanceDueStatus, Machine } from '../../lib/types';
import { CATEGORY_META } from '../../lib/maintenancePresets';
import { computeDueStatus, formatDueInfo, formatRecurrence, usageProgress } from '../../lib/maintenanceCalc';
import { todayStr, formatCurrency } from '../../lib/utils';

interface Props {
  tasks: MaintenanceTask[];
  completions: MaintenanceCompletion[];
  machines: Machine[];
  onSelectTask: (id: string) => void;
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  overdue:         { color: 'var(--rust)',   bg: 'rgba(184,69,31,0.10)'  },
  'due-today':     { color: 'var(--rust)',   bg: 'rgba(184,69,31,0.08)'  },
  'due-this-week': { color: 'var(--ochre)',  bg: 'rgba(200,146,46,0.10)' },
  upcoming:        { color: 'var(--moss)',   bg: 'rgba(85,107,47,0.10)'  },
  'no-date':       { color: 'var(--ink-4)',  bg: 'rgba(154,141,124,0.10)'},
};

const STATUS_LABELS: Record<string, string> = {
  overdue: 'Overdue', 'due-today': 'Due Today', 'due-this-week': 'This Week', upcoming: 'Upcoming', 'no-date': 'No Date',
};

type FilterChip = 'all' | 'home' | 'machines' | MaintenanceCategory;

export function MaintenanceDashboard({ tasks, completions, machines, onSelectTask }: Props) {
  const [filter, setFilter] = useState<FilterChip>('all');
  const today = todayStr();

  const machinesById = useMemo(() => {
    const map: Record<string, Machine> = {};
    machines.forEach(m => { map[m.id] = m; });
    return map;
  }, [machines]);

  // Compute statuses
  const tasksWithStatus = useMemo(() =>
    tasks.map(t => ({ task: t, status: computeDueStatus(t, today) })),
    [tasks, today],
  );

  // Filter
  const filtered = useMemo(() => {
    if (filter === 'all') return tasksWithStatus;
    if (filter === 'home') return tasksWithStatus.filter(t => t.task.group === 'home');
    if (filter === 'machines') return tasksWithStatus.filter(t => t.task.group === 'machines');
    return tasksWithStatus.filter(t => t.task.category === filter);
  }, [tasksWithStatus, filter]);

  // Group by status
  const grouped = useMemo(() => {
    const groups: Record<MaintenanceDueStatus, typeof filtered> = {
      overdue: [], 'due-today': [], 'due-this-week': [], upcoming: [], 'no-date': [],
    };
    filtered.forEach(t => groups[t.status].push(t));
    return groups;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const thisMonth = today.slice(0, 7);
    const monthCompletions = completions.filter(c => c.completedAt.slice(0, 7) === thisMonth);
    return {
      total: tasks.length,
      overdue: tasksWithStatus.filter(t => t.status === 'overdue').length,
      completedMonth: monthCompletions.length,
      costMonth: monthCompletions.reduce((s, c) => s + c.cost, 0),
    };
  }, [tasks, tasksWithStatus, completions, today]);

  // Available category filters
  const categoryChips = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category));
    return Array.from(cats).sort();
  }, [tasks]);

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Tasks" value={stats.total} />
        <StatCard label="Overdue" value={stats.overdue} accent={stats.overdue > 0 ? 'danger' : undefined} />
        <StatCard label="Done This Month" value={stats.completedMonth} />
        <StatCard label="Cost This Month" value={formatCurrency(stats.costMonth)} />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <Chip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        <Chip label="Home" active={filter === 'home'} onClick={() => setFilter('home')} />
        <Chip label="Machines" active={filter === 'machines'} onClick={() => setFilter('machines')} />
        {categoryChips.map(cat => (
          <Chip
            key={cat}
            label={`${CATEGORY_META[cat as MaintenanceCategory]?.icon ?? ''} ${CATEGORY_META[cat as MaintenanceCategory]?.label ?? cat}`}
            active={filter === cat}
            onClick={() => setFilter(cat as FilterChip)}
          />
        ))}
      </div>

      {/* Sections */}
      {(['overdue', 'due-today', 'due-this-week', 'upcoming', 'no-date'] as MaintenanceDueStatus[]).map(status => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <Section key={status} status={status} count={items.length}>
            {items.map(({ task }) => (
              <TaskCard
                key={task.id}
                task={task}
                status={status}
                machine={task.machineId ? machinesById[task.machineId] : undefined}
                onClick={() => onSelectTask(task.id)}
              />
            ))}
          </Section>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="font-serif" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--ink-3)' }}>
            No tasks found<em style={{ color: 'var(--rust)' }}>.</em>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: 'danger' }) {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)', borderRadius: 12, padding: 16 }}>
      <div className="tape-label mb-1">{label}</div>
      <div className="display-md tabular-nums" style={{ color: accent === 'danger' ? 'var(--rust)' : 'var(--ink)' }}>{value}</div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="tape-label px-3 py-1.5 rounded-full transition-colors"
      style={{
        fontSize: 9,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink-3)',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--ink-line-2)'}`,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function Section({ status, count, children }: { status: MaintenanceDueStatus; count: number; children: React.ReactNode }) {
  const style = STATUS_STYLES[status];
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="tape-label" style={{ color: style.color }}>{STATUS_LABELS[status]}</span>
        <span className="tape-label px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, color: style.color, background: style.bg }}>
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
    </div>
  );
}

function TaskCard({ task, status, machine, onClick }: { task: MaintenanceTask; status: MaintenanceDueStatus; machine?: Machine; onClick: () => void }) {
  const meta = CATEGORY_META[task.category];
  const style = STATUS_STYLES[status];
  const progress = usageProgress(task);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 transition-all duration-150"
      style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)', borderRadius: 12, cursor: 'pointer' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">{task.icon || meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{task.name}</h4>
            <span className="tape-label shrink-0 px-2 py-0.5 rounded-full" style={{ fontSize: 9, color: style.color, background: style.bg }}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          {machine && (
            <div className="flex items-center gap-1 mb-1">
              <span className="tape-label px-1.5 py-0.5 rounded" style={{ fontSize: 9, background: 'var(--paper-2)', color: 'var(--ink-3)' }}>
                {machine.icon || CATEGORY_META[machine.category].icon} {machine.name}
              </span>
            </div>
          )}
          <div className="tape-label mb-0.5" style={{ fontSize: 9 }}>{formatDueInfo(task)}</div>
          <div className="tape-label" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{formatRecurrence(task)}</div>
          {task.recurrenceType === 'usage' && (
            <div className="mt-2 h-1 rounded-full" style={{ background: 'var(--ink-line)' }}>
              <div
                style={{
                  width: `${Math.min(100, progress * 100)}%`, height: '100%', borderRadius: 999,
                  background: progress >= 1 ? 'var(--rust)' : progress >= 0.9 ? 'var(--ochre)' : 'var(--moss)',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
