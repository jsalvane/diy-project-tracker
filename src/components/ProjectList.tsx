import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { formatCurrency } from '../lib/utils';
import { StatStrip } from './ui/StatStrip';
import { SectionHeader } from './ui/SectionHeader';
import { Skeleton } from './ui/Skeleton';
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

function BoltIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function ProjectListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat strip skeleton */}
      <div className="flex items-stretch gap-0 rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] overflow-hidden bg-white dark:bg-[#111118]" style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.04)' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`flex-1 px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col gap-2 ${i < 3 ? 'border-r border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)]' : ''}`}>
            <Skeleton w="w-14" h="h-3" />
            <Skeleton w="w-10" h="h-6" />
          </div>
        ))}
      </div>
      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111118] p-5 sm:p-6 flex flex-col gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.05)' }}>
            <div className="flex items-center gap-2.5">
              <Skeleton w="w-7" h="h-7" className="rounded-[8px]" />
              <Skeleton w="w-28" h="h-4" />
            </div>
            <Skeleton w="w-24" h="h-9" />
            <Skeleton w="w-full" h="h-3" />
            <div className="pt-3 border-t border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]">
              <Skeleton w="w-20" h="h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectList() {
  const { state, loading, addProject, updateProject, deleteProject } = useApp();
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

  const stats = [
    { label: 'Active', value: String(activeProjects.length), color: '#10b981' },
    { label: 'Planned', value: String(state.projects.filter(p => p.status === 'planned').length), color: '#E31937' },
    { label: 'Complete', value: String(state.projects.filter(p => p.status === 'complete').length), color: '#64748b' },
    { label: 'Total Spent', value: formatCurrency(totalSpent) },
    ...(pendingSpend > 0 ? [{ label: 'Pending', value: formatCurrency(pendingSpend), color: '#f59e0b' }] : []),
  ];

  const renderCard = (project: Project, index: number) => (
    <div key={project.id} style={{ '--i': index } as React.CSSProperties}>
      <ProjectCard
        project={project}
        entries={state.entries.filter((e) => e.projectId === project.id)}
        tasks={state.tasks.filter((t) => t.projectId === project.id)}
        onEdit={() => handleEdit(project)}
        onDelete={() => setDeletingId(project.id)}
      />
    </div>
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

      {loading ? (
        <ProjectListSkeleton />
      ) : state.projects.length === 0 ? (
        <EmptyState
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          }
          message="No projects yet. Create one to start tracking spending and tasks."
        >
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
          <StatStrip stats={stats} className="mb-6" />

          <div className="space-y-6 sm:space-y-8">
            {activeProjects.length > 0 ? (
              <>
                {/* Active section */}
                <div>
                  <SectionHeader color="#10b981" icon={<BoltIcon />} title="Active" count={activeProjects.length} />
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-grid">
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
                      <span className="text-[12px] font-semibold text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] uppercase tracking-[0.04em] group-hover:text-[rgba(10,10,20,0.65)] dark:group-hover:text-[rgba(226,226,240,0.55)] transition-colors">
                        Other
                      </span>
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[rgba(100,116,139,0.1)] text-[10px] font-bold text-[#64748b] dark:text-[rgba(226,226,240,0.4)]">
                        {otherProjects.length}
                      </span>
                    </button>

                    {showOthers && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-grid">
                        {otherProjects.map(renderCard)}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-grid">
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
