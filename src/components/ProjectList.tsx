import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
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
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-10">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5 sm:mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.035em]">
            Projects
          </h1>
          {state.projects.length > 0 && (
            <p className="text-[12px] font-medium text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] mt-0.5 tracking-[0.01em]">
              {state.projects.length} {state.projects.length === 1 ? 'project' : 'projects'} total
            </p>
          )}
        </div>
        <button
          onClick={() => { setEditingProject(undefined); setShowForm(true); }}
          className="btn-primary"
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
        <div className="space-y-5 sm:space-y-8">
          {activeProjects.length > 0 ? (
            <>
              {/* Active section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold tracking-[0.07em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)]">Active</span>
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(22,163,74,0.12)] dark:bg-[rgba(34,197,94,0.12)] text-[10px] font-bold text-[#16a34a] dark:text-[#22c55e]">
                    {activeProjects.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeProjects.map(renderCard)}
                </div>
              </div>

              {/* Other section */}
              {otherProjects.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowOthers((v) => !v)}
                    className="flex items-center gap-2 mb-3 group"
                  >
                    <span className="text-[11px] font-semibold tracking-[0.07em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] group-hover:text-[rgba(10,10,20,0.55)] dark:group-hover:text-[rgba(226,226,240,0.48)] transition-colors">
                      Other
                    </span>
                    <span className="text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)] group-hover:text-[rgba(10,10,20,0.5)] dark:group-hover:text-[rgba(226,226,240,0.4)] transition-colors">
                      <ChevronRight open={showOthers} />
                    </span>
                    <span className="text-[11px] font-medium text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]">
                      {otherProjects.length}
                    </span>
                  </button>

                  {showOthers && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                      {otherProjects.map(renderCard)}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherProjects.map(renderCard)}
            </div>
          )}
        </div>
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
    </div>
  );
}
