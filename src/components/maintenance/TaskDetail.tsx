import { useState } from 'react';
import type { MaintenanceTask, MaintenanceCompletion, Machine } from '../../lib/types';
import { CATEGORY_META } from '../../lib/maintenancePresets';
import { formatRecurrence, formatDueInfo, computeDueStatus, usageProgress } from '../../lib/maintenanceCalc';
import { formatCurrency, todayStr } from '../../lib/utils';
import { CompletionModal } from './CompletionModal';
import { TaskForm } from './TaskForm';

interface Props {
  task: MaintenanceTask;
  completions: MaintenanceCompletion[];
  machines?: Machine[];
  onComplete: (taskId: string, data: { notes: string; cost: number; usageReading: number }) => void;
  onUpdate: (task: MaintenanceTask) => void;
  onSnooze: (taskId: string, days: number) => void;
  onDelete: (taskId: string) => void;
  onBack: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  overdue:       'bg-[rgba(220,38,38,0.1)] text-[#dc2626] dark:text-[#f87171]',
  'due-today':   'bg-[rgba(217,119,6,0.1)] text-[#d97706] dark:text-[#fbbf24]',
  'due-this-week': 'bg-[rgba(202,138,4,0.1)] text-[#ca8a04] dark:text-[#facc15]',
  upcoming:      'bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.05)] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]',
  'no-date':     'bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.05)] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]',
};

const STATUS_LABELS: Record<string, string> = {
  overdue: 'Overdue', 'due-today': 'Due Today', 'due-this-week': 'This Week', upcoming: 'Upcoming', 'no-date': 'No Date',
};

const SNOOZE_OPTIONS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
];

export function TaskDetail({ task, completions, machines = [], onComplete, onUpdate, onSnooze, onDelete, onBack }: Props) {
  const [showComplete, setShowComplete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = computeDueStatus(task, todayStr());
  const meta = CATEGORY_META[task.category];
  const progress = usageProgress(task);
  const taskCompletions = completions.filter(c => c.taskId === task.id);
  const linkedMachine = task.machineId ? machines.find(m => m.id === task.machineId) : null;

  if (showEdit) {
    return (
      <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
        <TaskForm
          task={task}
          machines={machines}
          onSave={(data) => {
            onUpdate({ ...task, ...data, updatedAt: new Date().toISOString() });
            setShowEdit(false);
          }}
          onCancel={() => setShowEdit(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors"
      >
        <span>←</span> Back to Dashboard
      </button>

      {/* Header card */}
      <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{task.icon || meta.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">{task.name}</h2>
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-[rgba(227,25,55,0.08)] dark:bg-[rgba(255,77,92,0.08)] text-[#E31937] dark:text-[#FF4D5C]">
                  {meta.icon} {meta.label}
                </span>
                {linkedMachine && (
                  <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-[rgba(227,25,55,0.06)] dark:bg-[rgba(255,77,92,0.06)] text-[#E31937] dark:text-[#FF4D5C]">
                    {linkedMachine.icon || CATEGORY_META[linkedMachine.category].icon} {linkedMachine.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* Due info */}
        <div className="space-y-2 mb-4">
          <div className="text-sm text-[#0a0a14] dark:text-[#e2e2f0]">
            <span className="font-medium">Next:</span> {formatDueInfo(task)}
          </div>
          <div className="text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">
            {formatRecurrence(task)}
          </div>
          {task.recurrenceType === 'usage' && (
            <div className="mt-2">
              <div className="flex justify-between text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.3)] mb-1">
                <span>{task.currentUsage.toLocaleString()} {task.recurrenceUnit}</span>
                <span>{(task.lastCompletionUsage + task.recurrenceValue).toLocaleString()} {task.recurrenceUnit}</span>
              </div>
              <div className="h-2 rounded-full bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.06)]">
                <div
                  className={`h-full rounded-full transition-all ${progress >= 1 ? 'bg-[#dc2626]' : progress >= 0.9 ? 'bg-[#d97706]' : 'bg-[#E31937]'}`}
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
            </div>
          )}
          {task.snoozedUntil && task.snoozedUntil > todayStr() && (
            <div className="text-xs text-[#d97706] dark:text-[#fbbf24]">
              Snoozed until {new Date(task.snoozedUntil + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* Instructions */}
        {task.instructions && (
          <div className="mb-4 p-3 rounded-lg bg-[rgba(0,0,20,0.02)] dark:bg-[rgba(255,255,255,0.02)] border border-[rgba(0,0,20,0.04)] dark:border-[rgba(255,255,255,0.04)]">
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] mb-1">Instructions</div>
            <div className="text-sm text-[rgba(10,10,20,0.7)] dark:text-[rgba(226,226,240,0.6)] whitespace-pre-wrap">{task.instructions}</div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowComplete(true)}
            className="flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors"
          >
            Complete Now
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.6)] dark:text-[rgba(226,226,240,0.5)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)]"
          >
            Edit
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSnooze(!showSnooze)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.6)] dark:text-[rgba(226,226,240,0.5)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)]"
            >
              Snooze
            </button>
            {showSnooze && (
              <div className="absolute top-full mt-1 right-0 z-10 bg-[#ffffff] dark:bg-[#0f0f1a] rounded-xl border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] shadow-lg py-1 min-w-[120px]">
                {SNOOZE_OPTIONS.map(opt => (
                  <button
                    key={opt.days}
                    onClick={() => { onSnooze(task.id, opt.days); setShowSnooze(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-[#0a0a14] dark:text-[#e2e2f0] hover:bg-[rgba(0,0,20,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(220,38,38,0.2)] text-[#dc2626] dark:text-[#f87171] hover:bg-[rgba(220,38,38,0.05)]"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Completion history */}
      <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
        <h3 className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-3">
          Completion History ({taskCompletions.length})
        </h3>
        {taskCompletions.length === 0 ? (
          <p className="text-sm text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.25)]">No completions yet</p>
        ) : (
          <div className="space-y-2">
            {taskCompletions.map(c => (
              <div key={c.id} className="flex items-start justify-between py-2 border-b border-[rgba(0,0,20,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0">
                <div>
                  <div className="text-sm text-[#0a0a14] dark:text-[#e2e2f0]">
                    {new Date(c.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {c.notes && (
                    <div className="text-xs text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mt-0.5 line-clamp-2">{c.notes}</div>
                  )}
                  {c.usageAtCompletion > 0 && (
                    <div className="text-[11px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mt-0.5">
                      at {c.usageAtCompletion.toLocaleString()} {task.recurrenceUnit}
                    </div>
                  )}
                </div>
                {c.cost > 0 && (
                  <span className="text-sm font-medium text-[#0a0a14] dark:text-[#e2e2f0] tabular-nums">{formatCurrency(c.cost)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showComplete && (
        <CompletionModal
          task={task}
          onSave={(data) => { onComplete(task.id, data); setShowComplete(false); }}
          onClose={() => setShowComplete(false)}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] shadow-xl p-5 animate-[scale-in_0.28s_ease]">
            <h3 className="text-base font-semibold text-[#0a0a14] dark:text-[#e2e2f0] mb-2">Delete Task?</h3>
            <p className="text-sm text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.5)] mb-4">
              This will delete "{task.name}" and all its completion history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.5)]"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(task.id); setConfirmDelete(false); onBack(); }}
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
