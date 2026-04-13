import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { formatCurrency } from '../lib/utils';
import type { Project } from '../lib/types';

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14"/>
      <line x1="2" y1="8" x2="14" y2="8"/>
    </svg>
  );
}

function ChevronRight({ open }: { open: boolean }) {
  return (
    <svg
      width="11" height="11"
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function StatStrip({ projects, totalSpent, pendingSpend }: { projects: Project[]; totalSpent: number; pendingSpend: number }) {
  const active = projects.filter(p => p.status === 'active').length;
  const planned = projects.filter(p => p.status === 'planned').length;
  const complete = projects.filter(p => p.status === 'complete').length;

  const stats = [
    { label: 'Active', value: String(active), color: '#10b981' },
    { label: 'Planned', value: String(planned), color: '#E31937' },
    { label: 'Complete', value: String(complete), color: '#64748b' },
    { label: 'Total Spent', value: formatCurrency(totalSpent), color: '#0a0a14' },
    ...(pendingSpend > 0 ? [{ label: 'Pending', value: formatCurrency(pendingSpend), color: '#f59e0b' }] : []),
  ];

  return (
    <div className="flex items-stretch gap-0 rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] overflow-hidden bg-white dark:bg-[#111118] mb-6"
      style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.04)' }}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex-1 px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col gap-1 min-w-0 ${i < stats.length - 1 ? 'border-r border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)]' : ''}`}
        >
          <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.04em] uppercase text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] truncate">
            {stat.label}
          </div>
          <div
            className="text-[18px] sm:text-[22px] font-bold tracking-[-0.04em] truncate"
            style={{ color: stat.label === 'Total Spent' ? undefined : stat.color }}
          >
            <span className={stat.label === 'Total Spent' ? 'text-[#0a0a14] dark:text-[#e2e2f0]' : ''}>
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectList() {
  const { state, addProject, updateProject, deleteProject } = useApp();
  const [showForm, setShowForm]     = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(true);

  const handleSave = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) updateProject({ ...editingProject, ...data });
    else addProject(data);
    setShowForm(false);
    setEditingProject(undefined);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) { deleteProject(deletingId); setDeletingId(null); }
  };

  const byUpdatedAt = (a: Project, b: Project) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  const activeProjects = state.projects.filter((p) => p.status === 'active').sort(byUpdatedAt);
  const otherProjects  = state.projects.filter((p) => p.status !== 'active').sort(byUpdatedAt);

  const totalSpent = state.entries.filter(e => !e.isPending).reduce((s, e) => s + e.price, 0);
  const pendingSpend = state.entries.filter(e => e.isPending).reduce((s, e) => s + e.price, 0);

  const renderCard = (project: Project) => (
    <ProjectCard
      key={project.id}
      project={project}
      entries={state.entries.filter((e) => e.projectId === project.id)}
      onEdit={() => handleEdit(project)}
      onDelete={() => setDeletingId(project.id)}
    />
  );

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.05em] text-[#0a0a14] dark:text-[#f0f0fa]">
            Projects
          </h1>
          <p className="mt-1 text-[13px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
            {state.projects.length > 0
              ? `Track spending, tasks & progress across ${state.projects.length} project${state.projects.length !== 1 ? 's' : ''}.`
              : 'Create your first project to start tracking.'}
          </p>
        </div>
        <button
          onClick={() => { setEditingProject(undefined); setShowForm(true); }}
          className="btn-primary shrink-0 mt-1"
        >
          <PlusIcon />
          New Project
        </button>
      </div>

      {state.projects.length === 0 ? (
        <EmptyState message="No projects yet. Create one to get started.">
          <button
            onClick={() => setShowForm(true)}
            className="text-[13px] font-medium text-[#E31937] dark:text-[#FF4D5C] hover:underline"
          >
            Create your first project
          </button>
        </EmptyState>
      ) : (
        <>
          {/* Stat strip */}
          <StatStrip projects={state.projects} totalSpent={totalSpent} pendingSpend={pendingSpend} />

          <div className="space-y-6 sm:space-y-8">
            {activeProjects.length > 0 ? (
              <>
                {/* Active section */}
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.18)', color: '#10b981' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                      </svg>
                    </div>
                    <span className="text-[12px] font-semibold tracking-[-0.01em] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] uppercase tracking-[0.04em]">
                      Active
                    </span>
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[rgba(16,185,129,0.12)] text-[10px] font-bold text-[#10b981] dark:text-[#34d399]">
                      {activeProjects.length}
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {activeProjects.map(renderCard)}
                  </div>
                </div>

                {/* Other section */}
                {otherProjects.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowOthers((v) => !v)}
                      className="flex items-center gap-2.5 mb-4 group"
                    >
                      <div className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0 bg-[rgba(100,116,139,0.12)] text-[#64748b] dark:text-[rgba(226,226,240,0.4)] group-hover:bg-[rgba(100,116,139,0.18)] transition-colors">
                        <ChevronRight open={showOthers} />
                      </div>
                      <span className="text-[12px] font-semibold tracking-[-0.01em] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] uppercase tracking-[0.04em] group-hover:text-[rgba(10,10,20,0.65)] dark:group-hover:text-[rgba(226,226,240,0.55)] transition-colors">
                        Other
                      </span>
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[rgba(100,116,139,0.1)] text-[10px] font-bold text-[#64748b] dark:text-[rgba(226,226,240,0.4)]">
                        {otherProjects.length}
                      </span>
                    </button>

                    {showOthers && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                        {otherProjects.map(renderCard)}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherProjects.map(renderCard)}
              </div>
            )}
          </div>
        </>
      )}

      {showForm && (
        <ProjectForm
          project={editingProject}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingProject(undefined); }}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          title="Delete project?"
          message="This will permanently delete the project and all its entries. You can undo briefly after deletion."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </main>
  );
}
