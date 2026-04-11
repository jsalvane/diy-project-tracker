import { createContext, useContext, useReducer, useEffect, useCallback, useState, type ReactNode } from 'react';
import type { AppState, Project, Entry, Task, ToastItem } from '../lib/types';
import { loadState } from '../lib/storage';
import { generateId, now } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { createSeedData } from '../lib/seed';

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_ENTRY'; payload: Entry }
  | { type: 'UPDATE_ENTRY'; payload: Entry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'RESTORE_ENTRY'; payload: Entry }
  | { type: 'RESTORE_PROJECT'; payload: { project: Project; entries: Entry[]; tasks: Task[] } }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'RESTORE_TASK'; payload: Task }
  | { type: 'TOGGLE_DARK_MODE' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        entries: state.entries.filter((e) => e.projectId !== action.payload),
        tasks: state.tasks.filter((t) => t.projectId !== action.payload),
      };
    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload),
      };
    case 'RESTORE_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };
    case 'RESTORE_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload.project],
        entries: [...state.entries, ...action.payload.entries],
        tasks: [...state.tasks, ...action.payload.tasks],
      };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case 'RESTORE_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    default:
      return state;
  }
}

// --- Row mappers (DB snake_case <-> app camelCase) ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    startDate: row.start_date,
    finishDate: row.finish_date,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEntry(row: any): Entry {
  return {
    id: row.id,
    projectId: row.project_id,
    date: row.date,
    store: row.store ?? '',
    category: row.category ?? '',
    description: row.description ?? '',
    price: row.price ?? 0,
    isPending: row.is_pending ?? false,
    receiptUrl: row.receipt_url ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTask(row: any): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectToRow(p: Project) {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    start_date: p.startDate,
    finish_date: p.finishDate,
    notes: p.notes,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

function entryToRow(e: Entry) {
  return {
    id: e.id,
    project_id: e.projectId,
    date: e.date,
    store: e.store,
    category: e.category,
    description: e.description,
    price: e.price,
    is_pending: e.isPending ?? false,
    receipt_url: e.receiptUrl || null,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

function taskToRow(t: Task) {
  return {
    id: t.id,
    project_id: t.projectId,
    text: t.text,
    completed: t.completed,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

// ---

const DARK_MODE_KEY = 'diy-dark-mode';

interface AppContextValue {
  state: AppState;
  loading: boolean;
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addEntry: (data: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => Entry;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  toggleTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleDarkMode: () => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Track our own change IDs to skip echoed realtime events
const localChangeIds = new Set<string>();

export function AppProvider({ children }: { children: ReactNode }) {
  // Default to dark mode for new users (null key = first visit)
  const storedDark = localStorage.getItem(DARK_MODE_KEY);
  const initialDarkMode = storedDark === null ? true : storedDark === 'true';
  const [state, dispatch] = useReducer(reducer, {
    projects: [],
    entries: [],
    tasks: [],
    darkMode: initialDarkMode,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount; migrate localStorage data if DB is empty
  useEffect(() => {
    async function load() {
      try {
        const [{ data: projects }, { data: entries }, { data: tasks }] = await Promise.all([
          supabase.from('projects').select('*').order('created_at'),
          supabase.from('entries').select('*').order('created_at'),
          supabase.from('tasks').select('*').order('created_at'),
        ]);

        const mappedProjects = (projects ?? []).map(mapProject);
        const mappedEntries = (entries ?? []).map(mapEntry);
        const mappedTasks = (tasks ?? []).map(mapTask);

        if (mappedProjects.length === 0) {
          // Try to migrate existing localStorage data, otherwise seed
          const local = loadState();
          const source = local.projects.length > 0 ? local : createSeedData();
          const sourceEntries = source.entries.map((e) => ({ ...e, receiptUrl: e.receiptUrl ?? '' }));

          await supabase.from('projects').insert(source.projects.map(projectToRow));
          if (sourceEntries.length) {
            await supabase.from('entries').insert(sourceEntries.map(entryToRow));
          }
          if (source.tasks.length) {
            await supabase.from('tasks').insert(source.tasks.map(taskToRow));
          }

          dispatch({
            type: 'LOAD_STATE',
            payload: { ...source, entries: sourceEntries, darkMode: initialDarkMode },
          });
        } else {
          dispatch({
            type: 'LOAD_STATE',
            payload: {
              projects: mappedProjects,
              entries: mappedEntries,
              tasks: mappedTasks,
              darkMode: initialDarkMode,
            },
          });
        }
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
      } finally {
        // Minimum display time so the loading screen is always visible
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 1500 - elapsed);
        setTimeout(() => setLoading(false), remaining);
      }
    }
    const start = Date.now();
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime subscriptions for cross-device sync
  useEffect(() => {
    const channel = supabase
      .channel('db-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        const id = (payload.new as { id?: string })?.id ?? (payload.old as { id?: string })?.id;
        if (id && localChangeIds.has(id)) return;
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_PROJECT', payload: mapProject(payload.new) });
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_PROJECT', payload: mapProject(payload.new) });
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_PROJECT', payload: (payload.old as { id: string }).id });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entries' }, (payload) => {
        const id = (payload.new as { id?: string })?.id ?? (payload.old as { id?: string })?.id;
        if (id && localChangeIds.has(id)) return;
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_ENTRY', payload: mapEntry(payload.new) });
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_ENTRY', payload: mapEntry(payload.new) });
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_ENTRY', payload: (payload.old as { id: string }).id });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const id = (payload.new as { id?: string })?.id ?? (payload.old as { id?: string })?.id;
        if (id && localChangeIds.has(id)) return;
        if (payload.eventType === 'INSERT') {
          dispatch({ type: 'ADD_TASK', payload: mapTask(payload.new) });
        } else if (payload.eventType === 'UPDATE') {
          dispatch({ type: 'UPDATE_TASK', payload: mapTask(payload.new) });
        } else if (payload.eventType === 'DELETE') {
          dispatch({ type: 'DELETE_TASK', payload: (payload.old as { id: string }).id });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync dark mode to localStorage + DOM
  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, String(state.darkMode));
    document.documentElement.classList.toggle('dark', state.darkMode);
  }, [state.darkMode]);

  const showToast = useCallback((message: string, undoAction?: () => void) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, undoAction }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addProject = useCallback((data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const project: Project = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    localChangeIds.add(project.id);
    dispatch({ type: 'ADD_PROJECT', payload: project });
    supabase.from('projects').insert(projectToRow(project))
      .then(({ error }) => {
        if (error) console.error('addProject error:', error);
        setTimeout(() => localChangeIds.delete(project.id), 3000);
      });
    return project;
  }, []);

  const updateProject = useCallback((project: Project) => {
    const oldProject = state.projects.find((p) => p.id === project.id);
    const updated = { ...project, updatedAt: now() };
    localChangeIds.add(updated.id);
    dispatch({ type: 'UPDATE_PROJECT', payload: updated });
    supabase.from('projects').update(projectToRow(updated)).eq('id', updated.id)
      .then(({ error }) => {
        if (error) console.error('updateProject error:', error);
        setTimeout(() => localChangeIds.delete(updated.id), 3000);
      });
    if (oldProject && oldProject.status !== 'complete' && project.status === 'complete') {
      fetch('/api/project-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      }).catch((err) => console.error('Failed to send completion email:', err));
    }
  }, [state.projects]);

  const deleteProject = useCallback((id: string) => {
    const project = state.projects.find((p) => p.id === id);
    const projectEntries = state.entries.filter((e) => e.projectId === id);
    const projectTasks = state.tasks.filter((t) => t.projectId === id);
    localChangeIds.add(id);
    dispatch({ type: 'DELETE_PROJECT', payload: id });
    supabase.from('projects').delete().eq('id', id)
      .then(({ error }) => {
        if (error) console.error('deleteProject error:', error);
        setTimeout(() => localChangeIds.delete(id), 3000);
      });
    if (project) {
      showToast(`Deleted "${project.name}"`, async () => {
        await supabase.from('projects').insert(projectToRow(project));
        if (projectEntries.length) await supabase.from('entries').insert(projectEntries.map(entryToRow));
        if (projectTasks.length) await supabase.from('tasks').insert(projectTasks.map(taskToRow));
        dispatch({ type: 'RESTORE_PROJECT', payload: { project, entries: projectEntries, tasks: projectTasks } });
      });
    }
  }, [state.projects, state.entries, state.tasks, showToast]);

  const addEntry = useCallback((data: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const entry: Entry = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    localChangeIds.add(entry.id);
    dispatch({ type: 'ADD_ENTRY', payload: entry });
    supabase.from('entries').insert(entryToRow(entry))
      .then(({ error }) => {
        if (error) console.error('addEntry error:', error);
        setTimeout(() => localChangeIds.delete(entry.id), 3000);
      });
    return entry;
  }, []);

  const updateEntry = useCallback((entry: Entry) => {
    const updated = { ...entry, updatedAt: now() };
    localChangeIds.add(updated.id);
    dispatch({ type: 'UPDATE_ENTRY', payload: updated });
    supabase.from('entries').update(entryToRow(updated)).eq('id', updated.id)
      .then(({ error }) => {
        if (error) console.error('updateEntry error:', error);
        setTimeout(() => localChangeIds.delete(updated.id), 3000);
      });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    const entry = state.entries.find((e) => e.id === id);
    localChangeIds.add(id);
    dispatch({ type: 'DELETE_ENTRY', payload: id });
    supabase.from('entries').delete().eq('id', id)
      .then(({ error }) => {
        if (error) console.error('deleteEntry error:', error);
        setTimeout(() => localChangeIds.delete(id), 3000);
      });
    if (entry) {
      showToast('Entry deleted', async () => {
        await supabase.from('entries').insert(entryToRow(entry));
        dispatch({ type: 'RESTORE_ENTRY', payload: entry });
      });
    }
  }, [state.entries, showToast]);

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task: Task = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    localChangeIds.add(task.id);
    dispatch({ type: 'ADD_TASK', payload: task });
    supabase.from('tasks').insert(taskToRow(task))
      .then(({ error }) => {
        if (error) console.error('addTask error:', error);
        setTimeout(() => localChangeIds.delete(task.id), 3000);
      });
    return task;
  }, []);

  const toggleTask = useCallback((task: Task) => {
    const updated = { ...task, completed: !task.completed, updatedAt: now() };
    localChangeIds.add(updated.id);
    dispatch({ type: 'UPDATE_TASK', payload: updated });
    supabase.from('tasks').update(taskToRow(updated)).eq('id', updated.id)
      .then(({ error }) => {
        if (error) console.error('toggleTask error:', error);
        setTimeout(() => localChangeIds.delete(updated.id), 3000);
      });
  }, []);

  const deleteTask = useCallback((id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    localChangeIds.add(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
    supabase.from('tasks').delete().eq('id', id)
      .then(({ error }) => {
        if (error) console.error('deleteTask error:', error);
        setTimeout(() => localChangeIds.delete(id), 3000);
      });
    if (task) {
      showToast('Task deleted', async () => {
        await supabase.from('tasks').insert(taskToRow(task));
        dispatch({ type: 'RESTORE_TASK', payload: task });
      });
    }
  }, [state.tasks, showToast]);

  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        loading,
        addProject,
        updateProject,
        deleteProject,
        addEntry,
        updateEntry,
        deleteEntry,
        addTask,
        toggleTask,
        deleteTask,
        toggleDarkMode,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
