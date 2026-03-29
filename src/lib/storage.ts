import type { AppState } from './types';
import { STORAGE_KEY, STORAGE_VERSION } from './constants';
import { createSeedData } from './seed';

interface StorageEnvelope {
  version: number;
  projects: AppState['projects'];
  entries: AppState['entries'];
  tasks: AppState['tasks'];
  darkMode: boolean;
}

const migrations: Record<number, (data: StorageEnvelope) => StorageEnvelope> = {
  1: (data) => ({ ...data, version: 2, tasks: [] }),
};

function migrate(data: StorageEnvelope): StorageEnvelope {
  let current = data;
  while (current.version < STORAGE_VERSION) {
    const migrateFn = migrations[current.version];
    if (!migrateFn) break;
    current = migrateFn(current);
  }
  return current;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw) as StorageEnvelope;
    if (!parsed || !Array.isArray(parsed.projects) || !Array.isArray(parsed.entries)) {
      return createInitialState();
    }

    const migrated = parsed.version < STORAGE_VERSION ? migrate(parsed) : parsed;

    return {
      projects: migrated.projects,
      entries: migrated.entries,
      tasks: migrated.tasks ?? [],
      darkMode: migrated.darkMode ?? false,
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  const envelope: StorageEnvelope = {
    version: STORAGE_VERSION,
    projects: state.projects,
    entries: state.entries,
    tasks: state.tasks,
    darkMode: state.darkMode,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

function createInitialState(): AppState {
  const seed = createSeedData();
  return {
    projects: seed.projects,
    entries: seed.entries,
    tasks: seed.tasks,
    darkMode: false,
  };
}
