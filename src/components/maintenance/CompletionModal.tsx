import { useState } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(26,22,18,0.4)] " onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--paper)] rounded-[14px] border border-[var(--ink-line)]  animate-[scale-in_0.28s_ease]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--ink-line)]">
          <h3 className="text-base font-semibold text-[var(--ink)]">
            Complete: {task.name}
          </h3>
          <button onClick={onClose} className="text-[var(--ink-4)] hover:text-[var(--ink)] text-lg leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4">
          {isUsageBased && (
            <div>
              <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)] mb-1.5">
                Current Reading ({task.recurrenceUnit})
              </label>
              <input
                type="number"
                value={usageStr}
                onChange={e => setUsageStr(e.target.value)}
                placeholder={`e.g. ${task.currentUsage + task.recurrenceValue}`}
                className="field"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)] mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this completion..."
              className="field resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)] mb-1.5">
              Cost ($)
            </label>
            <input
              type="text"
              value={costStr}
              onChange={e => setCostStr(e.target.value)}
              placeholder="0.00"
              className="field"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="btn-ghost btn-sm flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUsageBased && !usageStr}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#16a34a] text-[var(--paper)] hover:bg-[#15803d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Completion
          </button>
        </div>
      </div>
    </div>
  ,
    document.body
  );
}
