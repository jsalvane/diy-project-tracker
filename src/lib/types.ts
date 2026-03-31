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
  receiptUrl?: string; // URL to receipt file in Supabase Storage
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface Task {
  id: string;
  projectId: string;
  text: string;
  completed: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface AppState {
  projects: Project[];
  entries: Entry[];
  tasks: Task[];
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

export interface BudgetItem {
  id: string;
  name: string;
  dueGroup: '15' | '30';
  billAmount: number;
  payment: number;
  status: 'pending' | 'paid' | 'partial';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  servicer: string;
  creditLimit: number;
  annualFee: number;
  openDate: string;
  status: 'active' | 'closed';
  closedDate: string;
  inquiries: number;
  inquiryNote: string;
  isChargeCard: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  name: string;
  owner: string;
  balance: number;
  interestRate: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  paymentDate: string;
  amount: number;
  createdAt: string;
}
