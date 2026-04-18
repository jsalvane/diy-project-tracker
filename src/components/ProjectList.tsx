import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProjectCard } from './ProjectCard';
import { ProjectForm } from './ProjectForm';
import { ConfirmDialog } from './ConfirmDialog';
import { formatCurrency } from '../lib/utils';
import { ReceiptStrip, TapeLabel } from './ui';
import { Skeleton } from './ui/Skeleton';
import type { Project } from '../lib/types';

type FilterStatus = 'all' | 'active' | 'planned' | 'complete';

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14"/>
      <line x1="2" y1="8" x2="14" y2="8"/>
    </svg>
  );
}

function ProjectListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {[0, 1, 2].map(i => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0' }}>
            <Skeleton w="w-14" h="h-14" className="rounded-[10px]" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton w="w-24" h="h-3" />
              <Skeleton w="w-40" h="h-5" />
              <Skeleton w="w-32" h="h-3" />
            </div>
          </div>
          {i < 2 && <ReceiptStrip />}
        </div>
      ))}
    </div>
  );
}

export function ProjectList() {
  const { state, loading, addProject, updateProject, deleteProject } = useApp();
  const [showForm, setShowForm]     = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter]         = useState<FilterStatus>('all');

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

  const allProjects = [...state.projects].sort(byUpdatedAt);
  const filteredProjects = filter === 'all'
    ? allProjects
    : allProjects.filter(p =>
        filter === 'complete' ? p.status === 'complete' : p.status === filter
      );

  const totalSpent = state.entries.filter(e => !e.isPending).reduce((s, e) => s + e.price, 0);
  const inProgress = state.projects.filter(p => p.status === 'active').length;
  const planned    = state.projects.filter(p => p.status === 'planned').length;
  const done       = state.projects.filter(p => p.status === 'complete').length;

  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: 'all',      label: 'All' },
    { key: 'active',   label: 'Active' },
    { key: 'planned',  label: 'Planned' },
    { key: 'complete', label: 'Done' },
  ];

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', paddingBottom: 40 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
        <TapeLabel>The Workshop · {monthLabel}</TapeLabel>
        <button
          onClick={() => { setEditingProject(undefined); setShowForm(true); }}
          className="btn-primary btn-sm"
        >
          <PlusIcon />
          New Project
        </button>
      </div>

      {/* Display title */}
      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <span className="display-lg">
          Projects<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
        </span>
      </div>

      <ReceiptStrip />

      {loading ? (
        <div style={{ marginTop: 24 }}>
          <ProjectListSkeleton />
        </div>
      ) : (
        <>
          {/* Stat strip */}
          <div style={{ display: 'flex', gap: 0, margin: '24px 0', overflow: 'hidden' }}>
            {[
              { label: 'In Progress', value: String(inProgress) },
              { label: 'Planned',     value: String(planned) },
              { label: 'Done',        value: String(done) },
              { label: 'Spent YTD',   value: formatCurrency(totalSpent), accent: true },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingLeft: i === 0 ? 0 : 20,
                  paddingRight: 20,
                  borderLeft: i > 0 ? '1px solid var(--ink-line)' : 'none',
                }}
              >
                <div className="tape-label">{stat.label}</div>
                <div
                  className="display-md"
                  style={{ marginTop: 4, color: stat.accent ? 'var(--rust)' : 'var(--ink)' }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <ReceiptStrip />

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 24, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="tape-label"
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: `1px solid ${filter === f.key ? 'var(--ink)' : 'var(--ink-line-2)'}`,
                  background: filter === f.key ? 'var(--ink)' : 'transparent',
                  color: filter === f.key ? 'var(--paper)' : 'var(--ink-3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Project list */}
          {filteredProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p className="font-serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
                Nothing on the bench yet<em style={{ color: 'var(--rust)' }}>.</em>
              </p>
              <button onClick={() => setShowForm(true)} className="btn-ghost btn-sm" style={{ marginTop: 16 }}>
                Add your first project
              </button>
            </div>
          ) : (
            <div>
              {filteredProjects.map((project, i) => (
                <div key={project.id}>
                  <ProjectCard
                    project={project}
                    entries={state.entries.filter(e => e.projectId === project.id)}
                    tasks={state.tasks.filter(t => t.projectId === project.id)}
                    onEdit={() => handleEdit(project)}
                    onDelete={() => setDeletingId(project.id)}
                  />
                  {i < filteredProjects.length - 1 && <ReceiptStrip />}
                </div>
              ))}
            </div>
          )}
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
