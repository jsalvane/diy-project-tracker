import { useState } from 'react';
import type { Project, ProjectStatus } from '../lib/types';
import { STATUS_OPTIONS } from '../lib/constants';
import { todayStr } from '../lib/utils';

interface Props {
  project?: Project;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export function ProjectForm({ project, onSave, onCancel }: Props) {
  const [name, setName] = useState(project?.name ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'planned');
  const [startDate, setStartDate] = useState(project?.startDate ?? todayStr());
  const [finishDate, setFinishDate] = useState(project?.finishDate ?? '');
  const [notes, setNotes] = useState(project?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), status, startDate, finishDate, notes: notes.trim() });
  };

  const inputCls =
    'w-full text-sm px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {project ? 'Edit Project' : 'New Project'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Project Name *</label>
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kitchen Remodel"
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select
                className={inputCls}
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
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                className={inputCls}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Finish Date</label>
              <input
                type="date"
                className={inputCls}
                value={finishDate}
                onChange={(e) => setFinishDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</label>
            <textarea
              className={inputCls + ' resize-none'}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded bg-teal-600 text-white hover:bg-teal-700"
            >
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
