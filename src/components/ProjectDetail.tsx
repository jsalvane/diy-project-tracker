import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFilters } from '../hooks/useFilters';
import { StatusBadge } from './StatusBadge';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { Filters } from './Filters';
import { EntriesTable } from './EntriesTable';
import { formatCurrency, formatDate, calcDuration, todayStr } from '../lib/utils';
import type { Project } from '../lib/types';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, updateProject, deleteProject } = useApp();

  const project = state.projects.find((p) => p.id === id);
  const projectEntries = state.entries.filter((e) => e.projectId === id);

  const {
    filters, setFilter, clearFilters, isFiltered,
    filteredEntries, filteredTotal, grandTotal,
    uniqueStores, uniqueCategories,
  } = useFilters(projectEntries);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Project not found.</p>
        <button onClick={() => navigate('/')} className="text-sm text-teal-600 dark:text-teal-400 hover:underline mt-2">
          Back to projects
        </button>
      </div>
    );
  }

  const endDate = project.finishDate || (project.status === 'active' ? todayStr() : '');
  const duration = calcDuration(project.startDate, endDate);
  const isInProgress = project.status === 'active' && !project.finishDate;

  const handleSave = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateProject({ ...project, ...data });
    setShowEdit(false);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl">{project.notes}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Total Spent" value={formatCurrency(grandTotal)} />
        <SummaryCard label="Entries" value={String(projectEntries.length)} />
        <SummaryCard
          label="Duration"
          value={
            duration !== null
              ? `${duration} day${duration !== 1 ? 's' : ''}`
              : '—'
          }
          sub={isInProgress ? 'in progress' : undefined}
        />
        <SummaryCard
          label="Dates"
          value={formatDate(project.startDate)}
          sub={project.finishDate ? `to ${formatDate(project.finishDate)}` : 'no end date'}
        />
      </div>

      {/* Filters */}
      <Filters
        filters={filters}
        setFilter={setFilter}
        clearFilters={clearFilters}
        isFiltered={isFiltered}
        uniqueStores={uniqueStores}
        uniqueCategories={uniqueCategories}
      />

      {/* Filtered totals */}
      {isFiltered && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 flex gap-4">
          <span>
            Filtered: <strong className="text-gray-900 dark:text-gray-100">{formatCurrency(filteredTotal)}</strong>
            {' '}({filteredEntries.length} of {projectEntries.length} entries)
          </span>
          <span className="text-gray-400 dark:text-gray-500">
            Grand total: {formatCurrency(grandTotal)}
          </span>
        </div>
      )}

      {/* Table */}
      <EntriesTable entries={filteredEntries} projectId={project.id} />

      {/* Last updated */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-4">
        Last updated {new Date(project.updatedAt).toLocaleString()}
      </p>

      {showEdit && (
        <ProjectForm
          project={project}
          onSave={handleSave}
          onCancel={() => setShowEdit(false)}
        />
      )}
      {showDelete && (
        <ConfirmDialog
          title="Delete project?"
          message={`Delete "${project.name}" and all its entries?`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5">
      <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
      {sub && <div className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  );
}
