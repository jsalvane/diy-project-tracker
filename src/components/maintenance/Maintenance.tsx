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
          <div className="w-6 h-6 border-2 border-[#E31937] border-t-transparent rounded-full animate-spin" />
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
            className="flex items-center gap-1.5 text-sm text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors mb-5"
          >
            <span>←</span> Back
          </button>
          <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
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
          <div className="text-5xl mb-4">🔧</div>
          <h2 className="text-xl font-bold text-[#0a0a14] dark:text-[#e2e2f0] mb-2">
            Welcome to Maintenance
          </h2>
          <p className="text-sm text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.45)] mb-6">
            Track maintenance for your home and machines. Add your equipment, then create maintenance tasks with reminders and history.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => { setTab('machines'); setShowAddMachine(true); }}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#E31937] text-white hover:bg-[#C41230] transition-colors"
            >
              Add a Machine
            </button>
            <button
              onClick={() => setShowLibrary(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.6)] dark:text-[rgba(226,226,240,0.5)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)]"
            >
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
            className="flex items-center gap-1.5 text-sm text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors mb-5"
          >
            <span>←</span> Back to Machines
          </button>
          <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 bg-[rgba(0,0,20,0.03)] dark:bg-[rgba(255,255,255,0.03)] rounded-lg p-1 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setEditTask(undefined); setAddTaskForMachineId(''); }}
                className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  tab === t.key
                    ? 'bg-[#ffffff] dark:bg-[#0f0f1a] text-[#0a0a14] dark:text-[#e2e2f0] shadow-sm'
                    : 'text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0]'
                }`}
              >
                {t.label}
                {t.key === 'machines' && machines.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(227,25,55,0.12)] dark:bg-[rgba(255,77,92,0.12)] text-[#E31937] dark:text-[#FF4D5C]">
                    {machines.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          {tab !== 'machines' && (
            <button
              onClick={() => setShowLibrary(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgba(227,25,55,0.08)] dark:bg-[rgba(255,77,92,0.08)] text-[#E31937] dark:text-[#FF4D5C] hover:bg-[rgba(227,25,55,0.15)] dark:hover:bg-[rgba(255,77,92,0.15)] transition-colors shrink-0"
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
          <div className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-5">
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
