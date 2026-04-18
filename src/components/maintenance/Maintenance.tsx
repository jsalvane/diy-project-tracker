import { useState } from 'react';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useMachines } from '../../hooks/useMachines';
import type { MaintenanceTask } from '../../lib/types';
import { MaintenanceDashboard } from './MaintenanceDashboard';
import { TaskDetail } from './TaskDetail';
import { TaskForm } from './TaskForm';
import { LibraryModal } from './LibraryModal';
import { HistoryView } from './HistoryView';
import { MachineList } from './MachineList';
import { MachineDetail } from './MachineDetail';
import { MachineForm } from './MachineForm';

type Tab = 'dashboard' | 'add' | 'history' | 'machines';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'machines',  label: 'Machines'  },
  { key: 'history',   label: 'History'   },
  { key: 'add',       label: 'Add Task'  },
];

export function Maintenance() {
  const {
    tasks, completions, loading: tasksLoading, needsOnboarding,
    addTask, updateTask, deleteTask, completeTask, snoozeTask, importFromLibrary,
  } = useMaintenance();

  const {
    machines, loading: machinesLoading, addMachine, updateMachine, deleteMachine,
  } = useMachines();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [editTask, setEditTask] = useState<MaintenanceTask | undefined>(undefined);
  const [showAddMachine, setShowAddMachine] = useState(false);
  // machineId to pre-fill when adding a task from machine detail
  const [addTaskForMachineId, setAddTaskForMachineId] = useState('');

  const loading = tasksLoading || machinesLoading;
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
  const selectedMachine = selectedMachineId ? machines.find(m => m.id === selectedMachineId) : null;

  function handleAddTaskForMachine(machineId: string) {
    setAddTaskForMachineId(machineId);
    setEditTask(undefined);
    setTab('add');
    setSelectedMachineId(null);
  }

  function handleSelectTask(id: string) {
    setSelectedMachineId(null); // leave machine detail
    setSelectedTaskId(id);
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-t-2 rounded-full animate-spin" style={{ borderColor: 'var(--rust)', borderTopColor: 'var(--rust)', borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent' }} />
        </div>
      </main>
    );
  }

  // Add machine form (shown before onboarding check so it can be triggered from onboarding)
  if (showAddMachine) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
        <div className="max-w-2xl">
          <button
            onClick={() => { setShowAddMachine(false); }}
            className="tape-label flex items-center gap-1.5 mb-5 transition-colors"
              style={{ color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            <span>←</span> Back
          </button>
          <div style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)', borderRadius: 14, padding: 20 }}>
            <MachineForm
              onSave={async (data) => {
                await addMachine(data);
                setShowAddMachine(false);
                setTab('machines');
              }}
              onCancel={() => { setShowAddMachine(false); }}
            />
          </div>
        </div>
      </main>
    );
  }

  // Onboarding overlay
  if (needsOnboarding && tasks.length === 0 && machines.length === 0) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
        <div className="max-w-lg mx-auto text-center py-16 px-4">
          <p className="font-serif mb-4" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
            Nothing on the maintenance bench yet<em style={{ color: 'var(--rust)' }}>.</em>
          </p>
          <p className="mb-6 tape-label" style={{ color: 'var(--ink-4)' }}>
            Add your equipment, then create maintenance tasks with reminders and history.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => { setTab('machines'); setShowAddMachine(true); }} className="btn-primary">
              Add a Machine
            </button>
            <button onClick={() => setShowLibrary(true)} className="btn-ghost">
              Browse Task Library
            </button>
          </div>

          {showLibrary && (
            <LibraryModal
              existingTasks={tasks}
              onImport={importFromLibrary}
              onClose={() => setShowLibrary(false)}
            />
          )}
        </div>
      </main>
    );
  }

  // Task detail view
  if (selectedTask) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
        <TaskDetail
          task={selectedTask}
          completions={completions}
          machines={machines}
          onComplete={completeTask}
          onUpdate={updateTask}
          onSnooze={snoozeTask}
          onDelete={deleteTask}
          onBack={() => setSelectedTaskId(null)}
        />
      </main>
    );
  }

  // Machine detail view
  if (selectedMachine) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
        <MachineDetail
          machine={selectedMachine}
          tasks={tasks}
          completions={completions}
          onUpdate={updateMachine}
          onDelete={deleteMachine}
          onBack={() => setSelectedMachineId(null)}
          onSelectTask={handleSelectTask}
          onCompleteTask={completeTask}
          onAddTask={handleAddTaskForMachine}
        />
      </main>
    );
  }

  // Add machine modal (within machines tab)
  if (showAddMachine) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
        <div className="max-w-2xl">
          <button
            onClick={() => { setShowAddMachine(false); setTab('machines'); }}
            className="tape-label flex items-center gap-1.5 mb-5 transition-colors"
              style={{ color: 'var(--ink-3)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            <span>←</span> Back to Machines
          </button>
          <div style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)', borderRadius: 14, padding: 20 }}>
            <MachineForm
              onSave={async (data) => {
                await addMachine(data);
                setShowAddMachine(false);
                setTab('machines');
              }}
              onCancel={() => { setShowAddMachine(false); setTab('machines'); }}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-5 py-8">
      <div className="space-y-5">
        {/* Tab navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: '1px solid var(--ink-line)', paddingBottom: 0 }}>
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setEditTask(undefined); setAddTaskForMachineId(''); }}
                className="tape-label px-4 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
                style={{
                  borderColor: tab === t.key ? 'var(--rust)' : 'transparent',
                  color: tab === t.key ? 'var(--rust)' : 'var(--ink-3)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {t.label}
                {t.key === 'machines' && machines.length > 0 && (
                  <span className="ml-1.5 tape-label px-1.5 py-0.5 rounded-full" style={{ fontSize: 8, background: 'rgba(184,69,31,0.12)', color: 'var(--rust)' }}>
                    {machines.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {tab !== 'machines' && (
            <button
              onClick={() => setShowLibrary(true)}
              className="tape-label px-3 py-1.5 rounded-full transition-colors shrink-0"
              style={{ fontSize: 9, background: 'rgba(184,69,31,0.10)', color: 'var(--rust)', border: '1px solid rgba(184,69,31,0.2)', cursor: 'pointer' }}
            >
              + Library
            </button>
          )}
        </div>

        {/* Tab content */}
        {tab === 'dashboard' && (
          <MaintenanceDashboard
            tasks={tasks}
            completions={completions}
            machines={machines}
            onSelectTask={setSelectedTaskId}
          />
        )}

        {tab === 'machines' && (
          <MachineList
            machines={machines}
            tasks={tasks}
            onSelectMachine={setSelectedMachineId}
            onAddMachine={() => setShowAddMachine(true)}
          />
        )}

        {tab === 'add' && (
          <div style={{ background: 'var(--paper)', border: '1px solid var(--ink-line)', borderRadius: 14, padding: 20 }}>
            <TaskForm
              task={editTask}
              machines={machines}
              defaultMachineId={addTaskForMachineId}
              onSave={async (data) => {
                if (editTask) {
                  await updateTask({ ...editTask, ...data, updatedAt: new Date().toISOString() });
                } else {
                  await addTask(data);
                }
                setTab('dashboard');
                setEditTask(undefined);
                setAddTaskForMachineId('');
              }}
              onCancel={() => {
                setTab(addTaskForMachineId ? 'machines' : 'dashboard');
                setEditTask(undefined);
                setAddTaskForMachineId('');
              }}
            />
          </div>
        )}

        {tab === 'history' && (
          <HistoryView tasks={tasks} completions={completions} />
        )}

        {/* Library modal */}
        {showLibrary && (
          <LibraryModal
            existingTasks={tasks}
            onImport={importFromLibrary}
            onClose={() => setShowLibrary(false)}
          />
        )}
      </div>
    </main>
  );
}
