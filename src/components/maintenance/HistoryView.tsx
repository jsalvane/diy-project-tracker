import { useMemo, useState } from 'react';
import type { MaintenanceTask, MaintenanceCompletion, MaintenanceCategory } from '../../lib/types';
import { CATEGORY_META } from '../../lib/maintenancePresets';
import { exportCompletionsCsv, downloadCsv } from '../../lib/maintenanceCalc';
import { formatCurrency } from '../../lib/utils';

interface Props {
  tasks: MaintenanceTask[];
  completions: MaintenanceCompletion[];
}

const inputCls = 'px-3 py-2 rounded-lg border border-[var(--ink-line)] bg-[var(--paper)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--rust)]';

export function HistoryView({ tasks, completions }: Props) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');

  const tasksById = useMemo(() => {
    const map: Record<string, MaintenanceTask> = {};
    tasks.forEach(t => { map[t.id] = t; });
    return map;
  }, [tasks]);

  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category));
    return Array.from(cats).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    return completions.filter(c => {
      const date = c.completedAt.slice(0, 10);
      if (dateFrom && date < dateFrom) return false;
      if (dateTo && date > dateTo) return false;
      if (catFilter !== 'all') {
        const task = tasksById[c.taskId];
        if (task && task.category !== catFilter) return false;
      }
      return true;
    });
  }, [completions, dateFrom, dateTo, catFilter, tasksById]);

  const totalCost = useMemo(() => filtered.reduce((s, c) => s + c.cost, 0), [filtered]);

  function handleExport() {
    const csv = exportCompletionsCsv(filtered, tasksById);
    downloadCsv(csv, `maintenance-history-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)] mb-1.5">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)] mb-1.5">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)] mb-1.5">Category</label>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={inputCls}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_META[cat as MaintenanceCategory]?.label ?? cat}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--rust)] text-white hover:bg-[var(--rust-ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-[var(--ink-3)]">
        <span>{filtered.length} completion{filtered.length !== 1 ? 's' : ''}</span>
        {totalCost > 0 && <span>Total cost: {formatCurrency(totalCost)}</span>}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--ink-4)]">
          <p className="text-sm">No completions found.</p>
        </div>
      ) : (
        <div className="bg-[var(--paper)] rounded-[14px] border border-[var(--ink-line)] divide-y divide-[var(--ink-line)]">
          {filtered.map(c => {
            const task = tasksById[c.taskId];
            const meta = task ? CATEGORY_META[task.category] : null;
            return (
              <div key={c.id} className="flex items-start gap-3 p-4">
                <span className="text-base shrink-0">{task?.icon || meta?.icon || '🔧'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-[var(--ink)] truncate">
                      {task?.name ?? 'Unknown Task'}
                    </h4>
                    <span className="shrink-0 text-xs text-[var(--ink-4)] tabular-nums">
                      {new Date(c.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {meta && (
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[rgba(227,25,55,0.08)] text-[var(--rust)]">
                      {meta.label}
                    </span>
                  )}
                  {c.notes && (
                    <p className="text-xs text-[var(--ink-3)] mt-1 line-clamp-2">{c.notes}</p>
                  )}
                  {c.usageAtCompletion > 0 && task && (
                    <p className="text-[11px] text-[var(--ink-4)] mt-0.5">
                      at {c.usageAtCompletion.toLocaleString()} {task.recurrenceUnit}
                    </p>
                  )}
                </div>
                {c.cost > 0 && (
                  <span className="shrink-0 text-sm font-semibold text-[var(--ink)] tabular-nums">
                    {formatCurrency(c.cost)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
