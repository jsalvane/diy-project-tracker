import { useState } from 'react';
import type { Project, ProjectStatus } from '../lib/types';
import { STATUS_OPTIONS } from '../lib/constants';
import { todayStr } from '../lib/utils';

interface Props {
  project?: Project;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1.5">
      {children}
    </label>
  );
}

export function ProjectForm({ project, onSave, onCancel }: Props) {
  const [name, setName]           = useState(project?.name ?? '');
  const [status, setStatus]       = useState<ProjectStatus>(project?.status ?? 'planned');
  const [startDate, setStartDate] = useState(project?.startDate ?? todayStr());
  const [finishDate, setFinishDate] = useState(project?.finishDate ?? '');
  const [notes, setNotes]         = useState(project?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), status, startDate, finishDate, notes: notes.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 max-w-md w-full mx-4 mb-4 sm:mb-0 border border-[rgba(0,0,20,0.08)] dark:border-[rgba(255,255,255,0.07)] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.02em]">
            {project ? 'Edit Project' : 'New Project'}
          </h3>
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] hover:text-[rgba(10,10,20,0.65)] dark:hover:text-[rgba(226,226,240,0.6)] hover:bg-[rgba(0,0,20,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14"/>
              <line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kitchen Remodel"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <select
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <input
                type="date"
                className="field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Finish Date</Label>
              <input
                type="date"
                className="field"
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <textarea
              className="field resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
