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

const STATUS_STYLES: Record<string, { pill: string; badge: string }> = {
  overdue:         { pill: 'bg-[rgba(220,38,38,0.1)] text-[#dc2626] dark:text-[#f87171]', badge: 'bg-[#dc2626]' },
  'due-today':     { pill: 'bg-[rgba(217,119,6,0.1)] text-[#d97706] dark:text-[#fbbf24]', badge: 'bg-[#d97706]' },
  'due-this-week': { pill: 'bg-[rgba(202,138,4,0.1)] text-[#ca8a04] dark:text-[#facc15]', badge: 'bg-[#ca8a04]' },
  upcoming:        { pill: 'bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.05)] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]', badge: 'bg-[rgba(10,10,20,0.2)]' },
  'no-date':       { pill: 'bg-[rgba(0,0,20,0.04)] text-[rgba(10,10,20,0.3)]', badge: 'bg-[rgba(10,10,20,0.15)]' },
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
        <div className="text-center py-12 text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.25)]">
          <div className="text-3xl mb-2">🔧</div>
          <p className="text-sm">No tasks found. Add tasks from the Library or create your own.</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: 'danger' }) {
  return (
    <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-4">
      <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] mb-1.5">{label}</div>
      <div className={`text-[18px] font-bold tracking-[-0.025em] tabular-nums ${
        accent === 'danger' ? 'text-[#dc2626] dark:text-[#f87171]' : 'text-[#0a0a14] dark:text-[#e2e2f0]'
      }`}>{value}</div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active
          ? 'bg-[#E31937] dark:bg-[#FF4D5C] text-white'
          : 'bg-[rgba(0,0,20,0.04)] dark:bg-[rgba(255,255,255,0.04)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.45)] hover:bg-[rgba(0,0,20,0.07)] dark:hover:bg-[rgba(255,255,255,0.07)]'
      }`}
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
        <h3 className="text-sm font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">{STATUS_LABELS[status]}</h3>
        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white ${style.badge}`}>
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
      className="w-full text-left bg-[#ffffff] dark:bg-[#0f0f1a] rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-4 transition-all duration-150 hover:border-[rgba(227,25,55,0.25)] hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">{task.icon || meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-[#0a0a14] dark:text-[#e2e2f0] truncate">{task.name}</h4>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.pill}`}>
              {STATUS_LABELS[status]}
            </span>
          </div>
          {machine && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(227,25,55,0.07)] dark:bg-[rgba(255,77,92,0.07)] text-[#E31937] dark:text-[#FF4D5C] font-medium truncate max-w-[140px]">
                {machine.icon || CATEGORY_META[machine.category].icon} {machine.name}
              </span>
            </div>
          )}
          <div className="text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mb-1">
            {formatDueInfo(task)}
          </div>
          <div className="text-[11px] text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]">
            {formatRecurrence(task)}
          </div>
          {task.recurrenceType === 'usage' && (
            <div className="mt-2 h-1.5 rounded-full bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.06)]">
              <div
                className={`h-full rounded-full transition-all ${progress >= 1 ? 'bg-[#dc2626]' : progress >= 0.9 ? 'bg-[#d97706]' : 'bg-[#E31937]'}`}
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
