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

  const sortedProjects = [...state.projects].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Projects
          <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">
            {state.projects.length}
          </span>
        </h1>
        <button
          onClick={() => { setEditingProject(undefined); setShowForm(true); }}
          className="text-sm px-3 py-1.5 rounded bg-teal-600 text-white hover:bg-teal-700"
        >
          + New Project
        </button>
      </div>

      {sortedProjects.length === 0 ? (
        <EmptyState message="No projects yet. Create one to get started.">
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
          >
            Create your first project
          </button>
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              entries={state.entries.filter((e) => e.projectId === project.id)}
              onEdit={() => handleEdit(project)}
              onDelete={() => setDeletingId(project.id)}
            />
          ))}
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
