import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFilters } from '../hooks/useFilters';
import { StatusBadge } from './StatusBadge';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { Filters } from './Filters';
import { EntriesTable } from './EntriesTable';
import { TaskList } from './TaskList';
import { CategoryChart } from './CategoryChart';
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
    filteredEntries, filteredTotal, grandTotal, pendingTotal,
    uniqueStores, uniqueCategories,
  } = useFilters(projectEntries);

  const [activeTab, setActiveTab] = useState<'expenses' | 'tasks' | 'chart'>('expenses');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (!project) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-12 text-center">
        <p className="text-[13px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">Project not found.</p>
        <button onClick={() => navigate('/')} className="text-[13px] font-medium text-[#E31937] dark:text-[#FF4D5C] hover:underline mt-2">
          Back to projects
        </button>
      </div>
    );
  }

  const endDate = project.finishDate || (project.status === 'active' ? todayStr() : '');
  const duration = calcDuration(project.startDate, endDate);
  const isInProgress = project.status === 'active' && !project.finishDate;
  const openTaskCount = state.tasks.filter((t) => t.projectId === id && !t.completed).length;

  const handleSave = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateProject({ ...project, ...data });
    setShowEdit(false);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[22px] font-bold tracking-[-0.035em] text-[#0a0a14] dark:text-[#e2e2f0]">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          {project.notes && (
            <p className="text-[13px] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.45)] max-w-xl">{project.notes}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="btn-ghost"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="text-[13px] font-medium px-3 py-1.5 rounded-lg border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.45)] hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800/60 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-7">
        <SummaryCard label="Total Spent" value={formatCurrency(grandTotal)} />
        <SummaryCard
          label="Pending"
          value={formatCurrency(pendingTotal)}
          sub={pendingTotal > 0 ? `projected: ${formatCurrency(grandTotal + pendingTotal)}` : undefined}
          accent={pendingTotal > 0}
        />
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

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] mb-5">
        {(['expenses', 'tasks', 'chart'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-[#E31937] dark:border-[#FF4D5C] text-[#E31937] dark:text-[#FF4D5C]'
                : 'border-transparent text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0]'
            }`}
          >
            {tab === 'expenses' ? 'Expenses'
              : tab === 'chart' ? 'By Category'
              : (
                <span className="flex items-center gap-1.5">
                  Tasks
                  {openTaskCount > 0 && (
                    <span className="text-[10px] font-semibold bg-[rgba(227,25,55,0.1)] text-[#E31937] dark:bg-[rgba(255,77,92,0.12)] dark:text-[#FF4D5C] px-1.5 py-0.5 rounded-full leading-none">
                      {openTaskCount}
                    </span>
                  )}
                </span>
              )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'expenses' ? (
        <>
          <Filters
            filters={filters}
            setFilter={setFilter}
            clearFilters={clearFilters}
            isFiltered={isFiltered}
            uniqueStores={uniqueStores}
            uniqueCategories={uniqueCategories}
          />
          {isFiltered && (
            <div className="text-[12px] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.45)] mb-3 flex gap-5">
              <span>
                Filtered: <strong className="text-[#0a0a14] dark:text-[#e2e2f0] font-semibold">{formatCurrency(filteredTotal)}</strong>
                <span className="text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)] ml-1">({filteredEntries.length} of {projectEntries.length})</span>
              </span>
              <span className="text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]">
                Total: {formatCurrency(grandTotal)}
              </span>
            </div>
          )}
          <EntriesTable entries={filteredEntries} projectId={project.id} />
        </>
      ) : activeTab === 'tasks' ? (
        <TaskList projectId={project.id} />
      ) : (
        <CategoryChart entries={projectEntries} />
      )}

      {/* Last updated */}
      <p className="text-[11px] text-[rgba(10,10,20,0.28)] dark:text-[rgba(226,226,240,0.22)] mt-5">
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

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`border rounded-xl px-4 py-3.5 ${
      accent
        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40'
        : 'bg-white dark:bg-[#111118] border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]'
    }`}>
      <div className="text-[10px] font-semibold tracking-[0.07em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] mb-1">{label}</div>
      <div className={`text-[18px] font-bold tracking-[-0.025em] ${accent ? 'text-amber-700 dark:text-amber-400' : 'text-[#0a0a14] dark:text-[#e2e2f0]'}`}>{value}</div>
      {sub && <div className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5">{sub}</div>}
    </div>
  );
}
