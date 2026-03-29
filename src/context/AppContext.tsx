import { createContext, useContext, useReducer, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { AppState, Project, Entry, Task, ToastItem } from '../lib/types';
import { loadState, saveState } from '../lib/storage';
import { generateId, now } from '../lib/utils';
import { useState } from 'react';

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

interface AppContextValue {
  state: AppState;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced save to localStorage
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveState(state), 300);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [state]);

  // Sync dark mode class
  useEffect(() => {
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
    dispatch({ type: 'ADD_PROJECT', payload: project });
    return project;
  }, []);

  const updateProject = useCallback((project: Project) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, updatedAt: now() } });
  }, []);

  const deleteProject = useCallback((id: string) => {
    const project = state.projects.find((p) => p.id === id);
    const projectEntries = state.entries.filter((e) => e.projectId === id);
    const projectTasks = state.tasks.filter((t) => t.projectId === id);
    dispatch({ type: 'DELETE_PROJECT', payload: id });
    if (project) {
      showToast(`Deleted "${project.name}"`, () => {
        dispatch({ type: 'RESTORE_PROJECT', payload: { project, entries: projectEntries, tasks: projectTasks } });
      });
    }
  }, [state.projects, state.entries, state.tasks, showToast]);

  const addEntry = useCallback((data: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const entry: Entry = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    dispatch({ type: 'ADD_ENTRY', payload: entry });
    return entry;
  }, []);

  const updateEntry = useCallback((entry: Entry) => {
    dispatch({ type: 'UPDATE_ENTRY', payload: { ...entry, updatedAt: now() } });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    const entry = state.entries.find((e) => e.id === id);
    dispatch({ type: 'DELETE_ENTRY', payload: id });
    if (entry) {
      showToast('Entry deleted', () => {
        dispatch({ type: 'RESTORE_ENTRY', payload: entry });
      });
    }
  }, [state.entries, showToast]);

  const addTask = useCallback((data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task: Task = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    dispatch({ type: 'ADD_TASK', payload: task });
    return task;
  }, []);

  const toggleTask = useCallback((task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: { ...task, completed: !task.completed, updatedAt: now() } });
  }, []);

  const deleteTask = useCallback((id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    dispatch({ type: 'DELETE_TASK', payload: id });
    if (task) {
      showToast('Task deleted', () => {
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
