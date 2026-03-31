import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import type { Project } from '../lib/types';

export function ProjectList() {
  const { state, addProject, updateProject, deleteProject } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(true);

  const handleSave = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      updateProject({ ...editingProject, ...data });
    } else {
      addProject(data);
    }
    setShowForm(false);
    setEditingProject(undefined);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteProject(deletingId);
      setDeletingId(null);
    }
  };

  const byUpdatedAt = (a: Project, b: Project) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  const activeProjects = state.projects.filter((p) => p.status === 'active').sort(byUpdatedAt);
  const otherProjects = state.projects.filter((p) => p.status !== 'active').sort(byUpdatedAt);

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
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          Projects
          <span className="text-gray-400 dark:text-zinc-600 font-normal ml-2 text-base">
            {state.projects.length}
          </span>
        </h1>
        <button
          onClick={() => { setEditingProject(undefined); setShowForm(true); }}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          + New Project
        </button>
      </div>

      {state.projects.length === 0 ? (
        <EmptyState message="No projects yet. Create one to get started.">
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-orange-500 dark:text-orange-400 hover:underline"
          >
            Create your first project
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {activeProjects.length > 0 ? (
            <>
              {/* Active projects — always visible */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map(renderCard)}
              </div>

              {/* Other projects — collapsible */}
              {otherProjects.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowOthers((v) => !v)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-zinc-500 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors mb-4"
                  >
                    <span className={`transition-transform duration-200 inline-block ${showOthers ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    Other Projects
                    <span className="text-gray-400 dark:text-zinc-600 font-normal">
                      {otherProjects.length}
                    </span>
                  </button>

                  {showOthers && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {otherProjects.map(renderCard)}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* No active projects — show all flat */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          message="This will delete the project and all its entries. You can undo this action briefly after deletion."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
