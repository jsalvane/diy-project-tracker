import type { ColumnDef, ProjectStatus } from './types';

export const STORAGE_KEY = 'diy-project-tracker';
export const STORAGE_VERSION = 2;

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planned',  label: 'Planned'  },
  { value: 'active',   label: 'Active'   },
  { value: 'complete', label: 'Complete' },
  { value: 'on_hold',  label: 'On Hold'  },
];

// dot color + text color pairs used by StatusBadge
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
