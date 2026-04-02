import { useState } from 'react';
import type { MaintenanceTask } from '../../lib/types';
import { parseCurrency } from '../../lib/utils';

interface Props {
  task: MaintenanceTask;
  onSave: (data: { notes: string; cost: number; usageReading: number }) => void;
  onClose: () => void;
}

export function CompletionModal({ task, onSave, onClose }: Props) {
  const [notes, setNotes] = useState('');
  const [costStr, setCostStr] = useState('');
  const [usageStr, setUsageStr] = useState(task.currentUsage > 0 ? String(task.currentUsage) : '');
  const isUsageBased = task.recurrenceType === 'usage';

  function handleSave() {
    const cost = parseCurrency(costStr) ?? 0;
    const usageReading = isUsageBased ? (parseInt(usageStr) || 0) : 0;
    onSave({ notes, cost, usageReading });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] shadow-xl animate-[scale-in_0.28s_ease]">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.06)]">
          <h3 className="text-base font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">
            Complete: {task.name}
          </h3>
          <button onClick={onClose} className="text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] text-lg leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          {isUsageBased && (
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1.5">
                Current Reading ({task.recurrenceUnit})
              </label>
              <input
                type="number"
                value={usageStr}
                onChange={e => setUsageStr(e.target.value)}
                placeholder={`e.g. ${task.currentUsage + task.recurrenceValue}`}
                className="w-full px-3 py-2 rounded-lg border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] bg-[#ffffff] dark:bg-[#0a0a14] text-[#0a0a14] dark:text-[#e2e2f0] text-sm focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this completion..."
              className="w-full px-3 py-2 rounded-lg border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] bg-[#ffffff] dark:bg-[#0a0a14] text-[#0a0a14] dark:text-[#e2e2f0] text-sm resize-none focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1.5">
              Cost ($)
            </label>
            <input
              type="text"
              value={costStr}
              onChange={e => setCostStr(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] bg-[#ffffff] dark:bg-[#0a0a14] text-[#0a0a14] dark:text-[#e2e2f0] text-sm focus:outline-none focus:border-[#6366f1] dark:focus:border-[#818cf8]"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.5)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUsageBased && !usageStr}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Completion
          </button>
        </div>
      </div>
    </div>
  );
}
