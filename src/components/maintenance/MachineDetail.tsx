import { useState } from 'react';
import type { Machine, MaintenanceTask, MaintenanceCompletion } from '../../lib/types';
import { CATEGORY_META } from '../../lib/maintenancePresets';
import { computeDueStatus, formatDueInfo, formatRecurrence } from '../../lib/maintenanceCalc';
import { formatCurrency, todayStr } from '../../lib/utils';
import { MachineForm } from './MachineForm';
import { CompletionModal } from './CompletionModal';

interface Props {
  machine: Machine;
  tasks: MaintenanceTask[];
  completions: MaintenanceCompletion[];
  onUpdate: (machine: Machine) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onSelectTask: (id: string) => void;
  onCompleteTask: (taskId: string, data: { notes: string; cost: number; usageReading: number }) => void;
  onAddTask: (machineId: string) => void;
}

const STATUS_STYLES: Record<string, { pill: string }> = {
  overdue:         { pill: 'bg-[rgba(220,38,38,0.1)] text-[#dc2626] dark:text-[#f87171]' },
  'due-today':     { pill: 'bg-[rgba(217,119,6,0.1)] text-[#d97706] dark:text-[#fbbf24]' },
  'due-this-week': { pill: 'bg-[rgba(202,138,4,0.1)] text-[#ca8a04] dark:text-[#facc15]' },
  upcoming:        { pill: 'bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.05)] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]' },
  'no-date':       { pill: 'bg-[rgba(0,0,20,0.04)] text-[rgba(10,10,20,0.3)]' },
};

const STATUS_LABELS: Record<string, string> = {
  overdue: 'Overdue', 'due-today': 'Due Today', 'due-this-week': 'This Week', upcoming: 'Upcoming', 'no-date': 'No Date',
};

export function MachineDetail({
  machine, tasks, completions,
  onUpdate, onDelete, onBack, onSelectTask, onCompleteTask, onAddTask,
}: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [completingTask, setCompletingTask] = useState<MaintenanceTask | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const today = todayStr();
  const meta = CATEGORY_META[machine.category];
  const machineTasks = tasks.filter(t => t.machineId === machine.id);
  const machineCompletions = completions.filter(c =>
    machineTasks.some(t => t.id === c.taskId)
  ).slice(0, historyExpanded ? undefined : 10);

  const totalCost = completions
    .filter(c => machineTasks.some(t => t.id === c.taskId))
    .reduce((sum, c) => sum + c.cost, 0);

  if (showEdit) {
    return (
      <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
        <MachineForm
          machine={machine}
          onSave={(data) => {
            onUpdate({ ...machine, ...data, updatedAt: new Date().toISOString() });
            setShowEdit(false);
          }}
          onCancel={() => setShowEdit(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors"
      >
        <span>←</span> All Machines
      </button>

      {/* Machine info card */}
      <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[rgba(227,25,55,0.08)] dark:bg-[rgba(255,77,92,0.08)] flex items-center justify-center text-2xl shrink-0">
              {machine.icon || meta.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">{machine.name}</h2>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[rgba(227,25,55,0.08)] dark:bg-[rgba(255,77,92,0.08)] text-[#E31937] dark:text-[#FF4D5C]">
                {meta.icon} {meta.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.6)] dark:text-[rgba(226,226,240,0.5)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)]"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[rgba(220,38,38,0.2)] text-[#dc2626] dark:text-[#f87171] hover:bg-[rgba(220,38,38,0.05)]"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {machine.manufacturer && (
            <InfoField label="Manufacturer" value={machine.manufacturer} />
          )}
          {machine.model && (
            <InfoField label="Model" value={machine.model} />
          )}
          {machine.year && (
            <InfoField label="Year" value={machine.year} />
          )}
          {machine.serialNumber && (
            <InfoField label="Serial #" value={machine.serialNumber} />
          )}
          {machine.purchaseDate && (
            <InfoField
              label="Purchased"
              value={new Date(machine.purchaseDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
          )}
          {totalCost > 0 && (
            <InfoField label="Total Maintenance Cost" value={formatCurrency(totalCost)} />
          )}
        </div>

        {/* Manual link */}
        {machine.manualUrl && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] mb-1.5">Manual / Reference</div>
            <a
              href={machine.manualUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[#E31937] dark:text-[#FF4D5C] hover:underline"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Open Manual
            </a>
          </div>
        )}

        {/* Notes */}
        {machine.notes && (
          <div className="p-3 rounded-lg bg-[rgba(0,0,20,0.02)] dark:bg-[rgba(255,255,255,0.02)] border border-[rgba(0,0,20,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] mb-1">Notes</div>
            <div className="text-sm text-[rgba(10,10,20,0.7)] dark:text-[rgba(226,226,240,0.6)] whitespace-pre-wrap">{machine.notes}</div>
          </div>
        )}
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)]">
            Maintenance Tasks ({machineTasks.length})
          </h3>
          <button
            onClick={() => onAddTask(machine.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E31937] text-white hover:bg-[#C41230] transition-colors"
          >
            + Add Task
          </button>
        </div>

        {machineTasks.length === 0 ? (
          <p className="text-sm text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.25)]">
            No tasks yet. Add a maintenance task for this machine.
          </p>
        ) : (
          <div className="space-y-2">
            {machineTasks.map(task => {
              const status = computeDueStatus(task, today);
              const style = STATUS_STYLES[status];
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[rgba(0,0,20,0.05)] dark:border-[rgba(255,255,255,0.05)] hover:border-[rgba(227,25,55,0.2)] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-base shrink-0">{task.icon}</span>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => onSelectTask(task.id)}
                        className="text-sm font-medium text-[#0a0a14] dark:text-[#e2e2f0] hover:text-[#E31937] dark:hover:text-[#FF4D5C] truncate block text-left"
                      >
                        {task.name}
                      </button>
                      <div className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
                        {formatDueInfo(task)} · {formatRecurrence(task)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${style.pill}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <button
                      onClick={() => setCompletingTask(task)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[rgba(22,163,74,0.1)] text-[#16a34a] dark:text-[#4ade80] hover:bg-[rgba(22,163,74,0.18)] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      {machineCompletions.length > 0 && (
        <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
          <h3 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-3">
            Maintenance History
          </h3>
          <div className="space-y-0 divide-y divide-[rgba(0,0,20,0.04)] dark:divide-[rgba(255,255,255,0.04)]">
            {machineCompletions.map(c => {
              const task = machineTasks.find(t => t.id === c.taskId);
              return (
                <div key={c.id} className="flex items-start justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium text-[#0a0a14] dark:text-[#e2e2f0]">
                      {task?.name ?? 'Unknown Task'}
                    </div>
                    <div className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5">
                      {new Date(c.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {c.usageAtCompletion > 0 && task && ` · ${c.usageAtCompletion.toLocaleString()} ${task.recurrenceUnit}`}
                    </div>
                    {c.notes && (
                      <div className="text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mt-0.5 line-clamp-1">{c.notes}</div>
                    )}
                  </div>
                  {c.cost > 0 && (
                    <span className="text-sm font-semibold text-[#0a0a14] dark:text-[#e2e2f0] tabular-nums shrink-0 ml-3">
                      {formatCurrency(c.cost)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {completions.filter(c => machineTasks.some(t => t.id === c.taskId)).length > 10 && (
            <button
              onClick={() => setHistoryExpanded(e => !e)}
              className="mt-3 text-xs text-[#E31937] dark:text-[#FF4D5C] hover:underline"
            >
              {historyExpanded ? 'Show less' : 'Show all history'}
            </button>
          )}
        </div>
      )}

      {/* Complete task modal */}
      {completingTask && (
        <CompletionModal
          task={completingTask}
          onSave={(data) => { onCompleteTask(completingTask.id, data); setCompletingTask(null); }}
          onClose={() => setCompletingTask(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] shadow-xl p-5">
            <h3 className="text-base font-semibold text-[#0a0a14] dark:text-[#e2e2f0] mb-2">Delete Machine?</h3>
            <p className="text-sm text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.5)] mb-4">
              This will delete "{machine.name}". Maintenance tasks linked to this machine will remain but lose their machine association. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.5)]"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(machine.id); onBack(); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] mb-0.5">{label}</div>
      <div className="text-sm text-[#0a0a14] dark:text-[#e2e2f0]">{value}</div>
    </div>
  );
}
