export type ProjectStatus = 'planned' | 'active' | 'complete' | 'on_hold';

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string; // YYYY-MM-DD
  finishDate: string; // YYYY-MM-DD or ''
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Entry {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  store: string;
  category: string;
  description: string;
  price: number;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface AppState {
  projects: Project[];
  entries: Entry[];
  darkMode: boolean;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  store: string;
  category: string;
  search: string;
}

export interface ColumnDef {
  key: keyof Entry;
  label: string;
  type: 'date' | 'text' | 'currency' | 'select';
  width: string;
}

export interface ToastItem {
  id: string;
  message: string;
  undoAction?: () => void;
}
