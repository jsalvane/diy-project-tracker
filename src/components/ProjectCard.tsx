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
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to={`/project/${project.id}`}
          className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400"
        >
          {project.name}
        </Link>
        <StatusBadge status={project.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
        <div>
          <span className="text-gray-400 dark:text-gray-500">Start:</span>{' '}
          {formatDate(project.startDate)}
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">End:</span>{' '}
          {project.finishDate ? formatDate(project.finishDate) : '—'}
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Duration:</span>{' '}
          {duration !== null ? `${duration} day${duration !== 1 ? 's' : ''}` : '—'}
          {isInProgress && duration !== null && (
            <span className="text-green-600 dark:text-green-400 ml-1">(in progress)</span>
          )}
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">Entries:</span> {entries.length}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(total)}
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.preventDefault(); onEdit(); }}
            className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="text-xs px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
