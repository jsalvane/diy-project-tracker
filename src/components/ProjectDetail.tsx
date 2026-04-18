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
import { ReceiptStrip, TapeLabel, BlueprintCard, MoneyRow, StatusPill } from './ui';
import { Skeleton } from './ui/Skeleton';
import { formatCurrency, formatDate, calcDuration, todayStr } from '../lib/utils';
import type { Project } from '../lib/types';

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      <Skeleton w="w-48" h="h-10" />
      <Skeleton w="w-full" h="h-[200px]" className="rounded-none" />
      <Skeleton w="w-64" h="h-4" />
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, loading, updateProject, deleteProject } = useApp();

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

  if (loading) {
    return <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}><DetailSkeleton /></main>;
  }

  if (!project) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <p className="font-serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
          Project not found<em style={{ color: 'var(--rust)' }}>.</em>
        </p>
        <button onClick={() => navigate('/projects')} className="btn-ghost btn-sm" style={{ marginTop: 16 }}>
          Back to projects
        </button>
      </div>
    );
  }

  const endDate = project.finishDate || (project.status === 'active' ? todayStr() : '');
  const duration = calcDuration(project.startDate, endDate);
  const isInProgress = project.status === 'active' && !project.finishDate;
  const projectTasks = state.tasks.filter((t) => t.projectId === id);
  const openTaskCount = projectTasks.filter(t => !t.completed).length;
  const doneTasks = projectTasks.filter(t => t.completed).length;
  const taskPct = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

  const handleSave = (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateProject({ ...project, ...data });
    setShowEdit(false);
  };

  const handleDelete = () => {
    deleteProject(project.id);
    navigate('/projects');
  };

  // Build expense rows for MoneyRow display (top 5 by category)
  const byCategory = projectEntries.filter(e => !e.isPending).reduce((acc, e) => {
    acc[e.category || 'Other'] = (acc[e.category || 'Other'] || 0) + e.price;
    return acc;
  }, {} as Record<string, number>);
  const categoryRows = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', paddingBottom: 48 }}>

      {/* Tape label */}
      <TapeLabel>Project · {project.name}</TapeLabel>

      {/* Display title */}
      <div style={{ marginTop: 8, marginBottom: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <span className="display-lg" style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
          {project.name}<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
        </span>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 8 }}>
          <StatusPill status={project.status} />
          <button onClick={() => setShowEdit(true)} className="btn-ghost btn-sm">Edit</button>
          <button
            onClick={() => setShowDelete(true)}
            className="btn-sm"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 999, border: '1px solid var(--ink-line-2)',
              background: 'transparent', color: 'var(--rust)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* BlueprintCard cover */}
      <div style={{ marginTop: 20, marginBottom: 16 }}>
        <BlueprintCard style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {false ? null : (
            <div style={{ textAlign: 'center' }}>
              <span className="font-serif" style={{ fontSize: 64, fontStyle: 'italic', color: 'var(--ink-line-2)', lineHeight: 1 }}>
                {project.name[0]}
              </span>
              <div className="tape-label" style={{ marginTop: 8, letterSpacing: '0.16em' }}>
                {project.name}
              </div>
            </div>
          )}
        </BlueprintCard>
      </div>

      {/* Meta row */}
      <div className="tape-label" style={{ color: 'var(--ink-3)' }}>
        {project.startDate && `Started ${formatDate(project.startDate)}`}
        {taskPct > 0 && ` · ${taskPct}% complete`}
        {grandTotal > 0 && ` · ${formatCurrency(grandTotal)} spent`}
        {isInProgress && duration !== null && ` · ${duration}d running`}
      </div>

      <div style={{ marginTop: 20 }}>
        <ReceiptStrip />
      </div>

      {/* TASKS section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <TapeLabel>Tasks</TapeLabel>
          {openTaskCount > 0 && (
            <span className="tape-label" style={{ color: 'var(--ochre)' }}>{openTaskCount} open</span>
          )}
        </div>
        <TaskList projectId={project.id} />
      </div>

      <div style={{ marginTop: 24 }}>
        <ReceiptStrip />
      </div>

      {/* EXPENSES section */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <TapeLabel>Expenses</TapeLabel>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(['expenses', 'chart'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="tape-label"
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: `1px solid ${activeTab === tab ? 'var(--ink)' : 'var(--ink-line-2)'}`,
                  background: activeTab === tab ? 'var(--ink)' : 'transparent',
                  color: activeTab === tab ? 'var(--paper)' : 'var(--ink-3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'chart' ? 'Chart' : 'List'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'chart' ? (
          <CategoryChart entries={projectEntries} />
        ) : (
          <>
            {/* Category summary as MoneyRows */}
            {categoryRows.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categoryRows.map(([cat, amt]) => (
                  <MoneyRow key={cat} label={cat} amount={formatCurrency(amt)} />
                ))}
                <div style={{ borderTop: '2px solid var(--ink)', paddingTop: 8 }}>
                  <MoneyRow label="Total" amount={formatCurrency(grandTotal)} bold />
                  {pendingTotal > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <MoneyRow label="Pending" amount={formatCurrency(pendingTotal)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <Filters
              filters={filters}
              setFilter={setFilter}
              clearFilters={clearFilters}
              isFiltered={isFiltered}
              uniqueStores={uniqueStores}
              uniqueCategories={uniqueCategories}
            />
            {isFiltered && (
              <div className="tape-label" style={{ marginBottom: 12, color: 'var(--ink-4)' }}>
                Filtered: {formatCurrency(filteredTotal)} ({filteredEntries.length} of {projectEntries.length})
              </div>
            )}
            <EntriesTable entries={filteredEntries} projectId={project.id} />
          </>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <ReceiptStrip />
      </div>

      {/* NOTES section */}
      <div style={{ marginTop: 24 }}>
        <TapeLabel>Notes</TapeLabel>
        <textarea
          className="field"
          defaultValue={project.notes || ''}
          onBlur={(e) => updateProject({ ...project, notes: e.target.value })}
          placeholder="Project notes…"
          style={{
            marginTop: 12,
            minHeight: 140,
            resize: 'vertical',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--ink-line) 27px, var(--ink-line) 28px)',
            backgroundAttachment: 'local',
            lineHeight: '28px',
            paddingTop: 8,
          }}
        />
      </div>

      <div className="tape-label" style={{ marginTop: 24, color: 'var(--ink-4)' }}>
        Last updated {new Date(project.updatedAt).toLocaleString()}
      </div>

      {showEdit && (
        <ProjectForm project={project} onSave={handleSave} onCancel={() => setShowEdit(false)} />
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
