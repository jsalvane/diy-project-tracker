import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFilters } from '../hooks/useFilters';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { Filters } from './Filters';
import { EntriesTable } from './EntriesTable';
import { TaskList } from './TaskList';
import { CategoryChart } from './CategoryChart';
import { formatCurrency, formatDate, calcDuration, todayStr } from '../lib/utils';
import type { Project } from '../lib/types';

const STATUS_META: Record<string, { label: string; color: string; bg: string; dotAnim?: boolean }> = {
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  dotAnim: true },
  planned:  { label: 'Planned',  color: '#E31937', bg: 'rgba(227,25,55,0.1)'  },
  on_hold:  { label: 'On Hold',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  complete: { label: 'Complete', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

function DollarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
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
  const meta = STATUS_META[project.status] || STATUS_META.planned;

  const handleSave = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateProject({ ...project, ...data });
    setShowEdit(false);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    navigate('/');
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.05em] text-[#0a0a14] dark:text-[#f0f0fa] break-words">
              {project.name}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: meta.bg, color: meta.color }}
            >
              <span
                className={`w-[5px] h-[5px] rounded-full shrink-0 ${meta.dotAnim ? 'animate-pulse-dot' : ''}`}
                style={{ background: meta.color }}
              />
              {meta.label}
            </span>
          </div>
          {project.notes && (
            <p className="mt-1 text-[13px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] max-w-xl">
              {project.notes}
            </p>
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

      {/* Summary cards - Dashboard style */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-7">
        <SummaryCard
          icon={<DollarIcon />}
          iconColor="#10b981"
          label="Total Spent"
          value={formatCurrency(grandTotal)}
          large
        />
        <SummaryCard
          icon={<PendingIcon />}
          iconColor="#f59e0b"
          label="Pending"
          value={formatCurrency(pendingTotal)}
          sub={pendingTotal > 0 ? `projected: ${formatCurrency(grandTotal + pendingTotal)}` : undefined}
          accent={pendingTotal > 0}
        />
        <SummaryCard
          icon={<ListIcon />}
          iconColor="#3b82f6"
          label="Entries"
          value={String(projectEntries.length)}
        />
        <SummaryCard
          icon={<ClockIcon />}
          iconColor="#8b5cf6"
          label="Duration"
          value={duration !== null ? `${duration}d` : '—'}
          sub={isInProgress ? 'in progress' : undefined}
        />
        <SummaryCard
          icon={<CalendarIcon />}
          iconColor="#ec4899"
          label="Dates"
          value={formatDate(project.startDate)}
          sub={project.finishDate ? `to ${formatDate(project.finishDate)}` : 'no end date'}
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] mb-5 overflow-x-auto scrollbar-hide">
        {(['expenses', 'tasks', 'chart'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0 ${
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
    </main>
  );
}

function SummaryCard({ icon, iconColor, label, value, sub, accent, large }: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl border p-4 sm:p-5 overflow-hidden ${
      accent
        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40'
        : 'bg-white dark:bg-[#111118] border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]'
    }`} style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.04)' }}>
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}18`, color: iconColor }}
        >
          {icon}
        </div>
        <span className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)]">
          {label}
        </span>
      </div>
      <div>
        <div className={`font-bold tracking-[-0.03em] ${
          large
            ? 'text-[24px] sm:text-[28px] text-[#10b981]'
            : accent
              ? 'text-[18px] sm:text-[22px] text-amber-700 dark:text-amber-400'
              : 'text-[18px] sm:text-[22px] text-[#0a0a14] dark:text-[#e2e2f0]'
        }`}>
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5 truncate">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
