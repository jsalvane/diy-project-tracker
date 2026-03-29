import type { ColumnDef, ProjectStatus } from './types';

export const STORAGE_KEY = 'diy-project-tracker';
export const STORAGE_VERSION = 1;

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
  { value: 'on_hold', label: 'On Hold' },
];

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  complete: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export const ENTRY_COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Date', type: 'date', width: 'w-32' },
  { key: 'store', label: 'Store', type: 'text', width: 'w-36' },
  { key: 'category', label: 'Category', type: 'text', width: 'w-32' },
  { key: 'description', label: 'Description', type: 'text', width: 'min-w-48 flex-1' },
  { key: 'price', label: 'Price', type: 'currency', width: 'w-28' },
];

export const EMPTY_FILTER = {
  dateFrom: '',
  dateTo: '',
  store: '',
  category: '',
  search: '',
};
