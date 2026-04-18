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
  active:   { label: 'Active',   color: '#556b2f', bg: 'rgba(85,107,47,0.10)',   dotAnim: true },
  planned:  { label: 'Planned',  color: '#c8922e', bg: 'rgba(200,146,46,0.10)'  },
  on_hold:  { label: 'On Hold',  color: '#9a8d7c', bg: 'rgba(154,141,124,0.10)' },
  complete: { label: 'Complete', color: '#6b5d4f', bg: 'rgba(107,93,79,0.10)'   },
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
