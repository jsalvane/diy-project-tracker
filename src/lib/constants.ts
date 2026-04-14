import type { ColumnDef, ProjectStatus } from './types';

export const STORAGE_KEY = 'diy-project-tracker';
export const STORAGE_VERSION = 2;

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planned',  label: 'Planned'  },
  { value: 'active',   label: 'Active'   },
  { value: 'complete', label: 'Complete' },
  { value: 'on_hold',  label: 'On Hold'  },
];

/** Single source of truth for project status colors, labels, and backgrounds */
export const STATUS_META: Record<ProjectStatus, { label: string; color: string; bg: string; dotAnim?: boolean }> = {
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  dotAnim: true },
  planned:  { label: 'Planned',  color: '#E31937', bg: 'rgba(227,25,55,0.1)'  },
  on_hold:  { label: 'On Hold',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  complete: { label: 'Complete', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

// Legacy exports for backward compat (StatusBadge in old code)
export const STATUS_COLORS: Record<ProjectStatus, string> = {
  planned:  'text-[#E31937] dark:text-[#FF4D5C]',
  active:   'text-[#16a34a] dark:text-[#22c55e]',
  complete: 'text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]',
  on_hold:  'text-[#d97706] dark:text-[#f59e0b]',
};

export const STATUS_DOT: Record<ProjectStatus, string> = {
  planned:  'bg-[#E31937] dark:bg-[#FF4D5C]',
  active:   'bg-[#16a34a] dark:bg-[#22c55e]',
  complete: 'bg-[rgba(10,10,20,0.25)] dark:bg-[rgba(226,226,240,0.2)]',
  on_hold:  'bg-[#d97706] dark:bg-[#f59e0b]',
};

export const ENTRY_COLUMNS: ColumnDef[] = [
  { key: 'date',        label: 'Date',        type: 'date',     width: 'w-32'         },
  { key: 'store',       label: 'Store',       type: 'text',     width: 'w-36'         },
  { key: 'category',    label: 'Category',    type: 'text',     width: 'w-32'         },
  { key: 'description', label: 'Description', type: 'text',     width: 'min-w-48 flex-1' },
  { key: 'price',       label: 'Price',       type: 'currency', width: 'w-28'         },
];

export const EMPTY_FILTER = {
  dateFrom: '',
  dateTo: '',
  store: '',
  category: '',
  search: '',
};
