import { useMemo } from 'react';
import type { Machine, MaintenanceTask } from '../../lib/types';
import { CATEGORY_META } from '../../lib/maintenancePresets';
import { computeDueStatus } from '../../lib/maintenanceCalc';
import { todayStr } from '../../lib/utils';

interface Props {
  machines: Machine[];
  tasks: MaintenanceTask[];
  onSelectMachine: (id: string) => void;
  onAddMachine: () => void;
}

export function MachineList({ machines, tasks, onSelectMachine, onAddMachine }: Props) {
  const today = todayStr();

  const machineStats = useMemo(() => {
    const stats: Record<string, { total: number; overdue: number; lastServiced: string }> = {};
    machines.forEach(m => {
      const machineTasks = tasks.filter(t => t.machineId === m.id);
      const overdue = machineTasks.filter(t => computeDueStatus(t, today) === 'overdue').length;
      stats[m.id] = {
        total: machineTasks.length,
        overdue,
        lastServiced: '',
      };
    });
    return stats;
  }, [machines, tasks, today]);

  if (machines.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="text-5xl mb-4">🔩</div>
        <h3 className="text-base font-semibold text-[var(--ink)] mb-2">No machines yet</h3>
        <p className="text-sm text-[var(--ink-3)] mb-6 max-w-xs mx-auto">
          Add your snowblower, lawnmower, vehicles, and other equipment to track their maintenance.
        </p>
        <button
          onClick={onAddMachine}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--rust)] text-[var(--paper)] hover:bg-[var(--rust-ink)] transition-colors"
        >
          Add First Machine
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--ink-4)]">
          {machines.length} machine{machines.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={onAddMachine}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--rust)] text-[var(--paper)] hover:bg-[var(--rust-ink)] transition-colors"
        >
          + Add Machine
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {machines.map(machine => {
          const meta = CATEGORY_META[machine.category];
          const stats = machineStats[machine.id] ?? { total: 0, overdue: 0, lastServiced: '' };
          return (
            <button
              key={machine.id}
              onClick={() => onSelectMachine(machine.id)}
              className="w-full text-left bg-[var(--paper)] rounded-[14px] border border-[var(--ink-line)] p-4 transition-all duration-150 hover:border-[rgba(227,25,55,0.3)] hover:shadow-md"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(227,25,55,0.08)] flex items-center justify-center text-xl shrink-0">
                  {machine.icon || meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--ink)] truncate">{machine.name}</h3>
                  <p className="text-[11px] text-[var(--ink-4)] truncate">
                    {[machine.manufacturer, machine.model, machine.year].filter(Boolean).join(' · ') || meta.label}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[var(--ink-4)]">
                  {stats.total} task{stats.total !== 1 ? 's' : ''}
                </span>
                {stats.overdue > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(220,38,38,0.1)] text-[#dc2626]">
                    {stats.overdue} overdue
                  </span>
                )}
                {stats.total > 0 && stats.overdue === 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(22,163,74,0.1)] text-[#16a34a]">
                    Up to date
                  </span>
                )}
              </div>

              {/* Manual link indicator */}
              {machine.manualUrl && (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--rust)]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Manual available
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
