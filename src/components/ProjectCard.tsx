import { useNavigate } from 'react-router-dom';
import type { Project, Entry } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, formatDate, calcDuration, sumPrices, todayStr } from '../lib/utils';

interface Props {
  project: Project;
  entries: Entry[];
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, entries, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const total = sumPrices(entries.map((e) => e.price));
  const endDate = project.finishDate || (project.status === 'active' ? todayStr() : '');
  const duration = calcDuration(project.startDate, endDate);
  const isInProgress = project.status === 'active' && !project.finishDate;

  return (
    <div
      onClick={() => navigate(`/project/${project.id}`)}
      className="group relative bg-[#ffffff] dark:bg-[#0f0f1a] border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:border-[rgba(99,102,241,0.25)] dark:hover:border-[rgba(129,140,248,0.2)] hover:shadow-[0_4px_24px_rgba(99,102,241,0.08)] dark:hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] hover:-translate-y-px"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-[14px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] leading-snug tracking-[-0.015em]">
          {project.name}
        </h3>
        <StatusBadge status={project.status} />
      </div>

      {/* Meta rows */}
      <div className="space-y-1.5 mb-5">
        {project.status !== 'planned' && (
          <>
            <div className="flex items-center gap-0 text-[12px]">
              <span className="text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] w-[60px] shrink-0 font-medium tracking-[0.01em]">Start</span>
              <span className="text-[rgba(10,10,20,0.65)] dark:text-[rgba(226,226,240,0.6)]">{formatDate(project.startDate)}</span>
            </div>
            <div className="flex items-center gap-0 text-[12px]">
              <span className="text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] w-[60px] shrink-0 font-medium tracking-[0.01em]">End</span>
              <span className="text-[rgba(10,10,20,0.65)] dark:text-[rgba(226,226,240,0.6)]">
                {project.finishDate ? formatDate(project.finishDate) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-0 text-[12px]">
              <span className="text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] w-[60px] shrink-0 font-medium tracking-[0.01em]">Days</span>
              <span className="text-[rgba(10,10,20,0.65)] dark:text-[rgba(226,226,240,0.6)]">
                {duration !== null ? duration : '—'}
                {isInProgress && duration !== null && (
                  <span className="ml-1.5 text-[#6366f1] dark:text-[#818cf8] font-medium">running</span>
                )}
              </span>
            </div>
          </>
        )}
        <div className="flex items-center gap-0 text-[12px]">
          <span className="text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] w-[60px] shrink-0 font-medium tracking-[0.01em]">Items</span>
          <span className="text-[rgba(10,10,20,0.65)] dark:text-[rgba(226,226,240,0.6)]">{entries.length}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]">
        <span className="text-[15px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.02em] tabular-nums">
          {formatCurrency(total)}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-[11.5px] font-medium px-2.5 py-1 rounded-md text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.38)] hover:text-[#6366f1] dark:hover:text-[#818cf8] hover:bg-[rgba(99,102,241,0.08)] dark:hover:bg-[rgba(129,140,248,0.1)] transition-colors"
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

      {/* Active accent line */}
      {project.status === 'active' && (
        <div className="absolute top-0 left-5 right-5 h-[2px] bg-gradient-to-r from-[#6366f1]/0 via-[#6366f1] to-[#6366f1]/0 rounded-full" />
      )}
    </div>
  );
}
