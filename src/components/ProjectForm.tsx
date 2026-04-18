import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Project, ProjectStatus } from '../lib/types';
import { STATUS_OPTIONS } from '../lib/constants';
import { todayStr } from '../lib/utils';
import { useEscapeKey } from '../lib/useEscapeKey';

interface Props {
  project?: Project;
  onSave: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="tape-label block mb-1.5">{children}</label>;
}

export function ProjectForm({ project, onSave, onCancel }: Props) {
  useEscapeKey(onCancel);
  const [name, setName]             = useState(project?.name ?? '');
  const [status, setStatus]         = useState<ProjectStatus>(project?.status ?? 'planned');
  const [startDate, setStartDate]   = useState(project?.startDate ?? todayStr());
  const [finishDate, setFinishDate] = useState(project?.finishDate ?? '');
  const [notes, setNotes]           = useState(project?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), status, startDate, finishDate, notes: notes.trim() });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      style={{ background: 'rgba(26,22,18,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-[14px] p-6 max-w-md w-full my-auto animate-scale-in"
        style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="tape-label">{project ? 'Edit Project' : 'New Project'}</span>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', padding: 4 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen Remodel" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <select className="field" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {STATUS_OPTIONS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>
            <div />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date</Label>
              <input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Finish Date</Label>
              <input type="date" className="field" value={finishDate} onChange={(e) => setFinishDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <textarea className="field resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onCancel} className="btn-ghost btn-sm">Cancel</button>
            <button type="submit" className="btn-primary btn-sm">{project ? 'Save Changes' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
