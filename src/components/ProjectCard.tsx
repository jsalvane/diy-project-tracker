import { Link } from 'react-router-dom';
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
  const total = sumPrices(entries.map((e) => e.price));
  const endDate = project.finishDate || (project.status === 'active' ? todayStr() : '');
  const duration = calcDuration(project.startDate, endDate);
  const isInProgress = project.status === 'active' && !project.finishDate;

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5 bg-white dark:bg-zinc-900 hover:border-orange-300 dark:hover:border-orange-800/60 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link
          to={`/project/${project.id}`}
          className="text-base font-semibold text-gray-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors leading-snug"
        >
          {project.name}
        </Link>
        <StatusBadge status={project.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-600 dark:text-zinc-400 mb-4">
        <div>
          <span className="text-gray-400 dark:text-zinc-600">Start</span>{' '}
          {formatDate(project.startDate)}
        </div>
        <div>
          <span className="text-gray-400 dark:text-zinc-600">End</span>{' '}
          {project.finishDate ? formatDate(project.finishDate) : '—'}
        </div>
        <div>
          <span className="text-gray-400 dark:text-zinc-600">Duration</span>{' '}
          {duration !== null ? `${duration} day${duration !== 1 ? 's' : ''}` : '—'}
          {isInProgress && duration !== null && (
            <span className="text-orange-500 dark:text-orange-400 ml-1.5">in progress</span>
          )}
        </div>
        <div>
          <span className="text-gray-400 dark:text-zinc-600">Entries</span>{' '}
          {entries.length}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-zinc-800">
        <span className="text-base font-semibold text-gray-900 dark:text-white">
          {formatCurrency(total)}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(); }}
            className="text-sm px-2.5 py-1 text-gray-500 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-md transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="text-sm px-2.5 py-1 text-gray-500 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
