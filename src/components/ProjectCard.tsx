import { useNavigate } from 'react-router-dom';
import type { Project, Entry } from '../lib/types';
import { formatCurrency, formatDate, calcDuration, todayStr } from '../lib/utils';

interface Props {
  project: Project;
  entries: Entry[];
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; dotAnim?: boolean }> = {
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  dotAnim: true },
  planned:  { label: 'Planned',  color: '#E31937', bg: 'rgba(227,25,55,0.1)'  },
  on_hold:  { label: 'On Hold',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  complete: { label: 'Complete', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

function WrenchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}

export function ProjectCard({ project, entries, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const total = entries.reduce((s, e) => s + e.price, 0);
  const pendingTotal = entries.filter(e => e.isPending).reduce((s, e) => s + e.price, 0);
  const confirmedTotal = total - pendingTotal;
  const endDate = project.finishDate || (project.status === 'active' ? todayStr() : '');
  const duration = calcDuration(project.startDate, endDate);
  const isInProgress = project.status === 'active' && !project.finishDate;
  const meta = STATUS_META[project.status] || STATUS_META.planned;

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="group relative flex flex-col gap-4 rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111118] p-5 sm:p-6 cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,20,0.10)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.5)]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.05)' }}
    >
      {/* Colored top border on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: meta.color }}
      />

      {/* Active accent line (always visible) */}
      {project.status === 'active' && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: meta.color }} />
      )}

      {/* Header: icon + title + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
            style={{ background: `${meta.color}18`, color: meta.color }}
          >
            <WrenchIcon />
          </div>
          <h3 className="text-[14px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] leading-snug tracking-[-0.015em] truncate">
            {project.name}
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          style={{ background: meta.bg, color: meta.color }}
        >
          <span
            className={`w-[5px] h-[5px] rounded-full shrink-0 ${meta.dotAnim ? 'animate-pulse-dot' : ''}`}
            style={{ background: meta.color }}
          />
          {meta.label}
        </span>
      </div>

      {/* Big metric: total spent */}
      <div className="flex flex-col gap-1">
        <div className="text-[32px] sm:text-[36px] font-extrabold tracking-[-0.05em] leading-none text-[#0a0a14] dark:text-[#f0f0fa]">
          {formatCurrency(confirmedTotal)}
        </div>
        <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
          total spent{pendingTotal > 0 && (
            <span className="text-amber-500 dark:text-amber-400 ml-1.5">
              + {formatCurrency(pendingTotal)} pending
            </span>
          )}
        </div>
      </div>

      {/* Meta details row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)]">
        {project.status !== 'planned' && (
          <>
            <span className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {formatDate(project.startDate)}
              {project.finishDate && <span className="text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]">–</span>}
              {project.finishDate && formatDate(project.finishDate)}
            </span>
            {duration !== null && (
              <span className="flex items-center gap-1">
                {duration} day{duration !== 1 ? 's' : ''}
                {isInProgress && (
                  <span className="text-[#10b981] dark:text-[#34d399] font-medium">running</span>
                )}
              </span>
            )}
          </>
        )}
        <span>{entries.length} item{entries.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Footer: notes excerpt + actions */}
      <div className="flex items-center justify-between pt-3 border-t border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)] mt-auto">
        {project.notes ? (
          <p className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] truncate max-w-[200px]">
            {project.notes}
          </p>
        ) : (
          <span className="text-[11px] text-[rgba(10,10,20,0.25)] dark:text-[rgba(226,226,240,0.2)] italic">
            No notes
          </span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 ml-3">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-[11.5px] font-medium px-2.5 py-1 rounded-md text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.38)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] hover:bg-[rgba(227,25,55,0.08)] dark:hover:bg-[rgba(255,77,92,0.1)] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-[11.5px] font-medium px-2.5 py-1 rounded-md text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.38)] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
