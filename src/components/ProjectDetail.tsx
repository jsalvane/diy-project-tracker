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
      <div className="max-w-6xl mx-auto px-6 py-12 text-center">
        <p className="text-sm text-gray-500 dark:text-zinc-500">Project not found.</p>
        <button onClick={() => navigate('/')} className="text-sm text-orange-500 dark:text-orange-400 hover:underline mt-2">
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
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.notes && (
            <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-xl">{project.notes}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:border-gray-400 dark:hover:border-zinc-600 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        <SummaryCard label="Total Spent" value={formatCurrency(grandTotal)} />
        <SummaryCard label="Entries" value={String(projectEntries.length)} />
        <SummaryCard
          label="Duration"
          value={duration !== null ? `${duration} day${duration !== 1 ? 's' : ''}` : '—'}
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
        <div className="text-sm text-gray-600 dark:text-zinc-400 mb-3 flex gap-5">
          <span>
            Filtered: <strong className="text-gray-900 dark:text-white font-semibold">{formatCurrency(filteredTotal)}</strong>
            <span className="text-gray-400 dark:text-zinc-600 ml-1">({filteredEntries.length} of {projectEntries.length})</span>
          </span>
          <span className="text-gray-400 dark:text-zinc-600">
            Total: {formatCurrency(grandTotal)}
          </span>
        </div>
      )}

      {/* Table */}
      <EntriesTable entries={filteredEntries} projectId={project.id} />

      {/* Last updated */}
      <p className="text-xs text-gray-400 dark:text-zinc-600 mt-5">
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
    <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3.5">
      <div className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">{sub}</div>}
    </div>
  );
}
