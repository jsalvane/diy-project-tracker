import { useNavigate } from 'react-router-dom';
import type { Project, Entry, Task } from '../lib/types';
import { STATUS_META } from '../lib/constants';
import { formatCurrency } from '../lib/utils';
import { StatusPill } from './ui';

interface Props {
  project: Project;
  entries: Entry[];
  tasks: Task[];
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, entries, tasks, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const meta = STATUS_META[project.status] || STATUS_META.planned;

  const confirmedTotal = entries.filter(e => !e.isPending).reduce((s, e) => s + e.price, 0);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.completed).length;
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const category = 'Project';

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="group flex items-start gap-4 py-4 cursor-pointer transition-colors duration-150 hover:bg-[var(--paper-2)] rounded-[10px] -mx-2 px-2"
      style={{ background: 'transparent' }}
    >
      {/* Thumb */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 10,
          flexShrink: 0,
          background: `linear-gradient(135deg, ${meta.bg.replace('0.10', '0.6')} 0%, ${meta.color}44 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          border: `1px solid ${meta.color}30`,
        }}
      >
        {false ? null : (
          <span className="font-serif" style={{ fontSize: 22, color: meta.color, fontStyle: 'italic', lineHeight: 1 }}>
            {project.name[0]}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tape-label">{category.toUpperCase()}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {project.name}
          </h3>
          <StatusPill status={project.status} />
        </div>

        {project.notes && (
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.notes}
          </p>
        )}

        {/* Progress + meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          {totalTasks > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{ flex: 1, height: 4, background: 'var(--ink-line)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${taskPct}%`, background: taskPct === 100 ? 'var(--moss)' : 'var(--ochre)', borderRadius: 2, transition: 'width 0.5s' }} />
              </div>
              <span className="tape-label">{taskPct}%</span>
            </div>
          )}
          <span className="font-mono-label" style={{ fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>
            {formatCurrency(confirmedTotal)}
          </span>
        </div>
      </div>

      {/* Edit / Delete — reveal on hover */}
      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="tape-label px-2 py-1 rounded transition-colors hover:bg-[var(--paper-3)]"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)' }}
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="tape-label px-2 py-1 rounded transition-colors"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--rust)' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
