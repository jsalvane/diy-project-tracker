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
  isPending: boolean; // true = future/anticipated charge, not yet spent
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
  status: 'auto' | 'manual';
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
  balance: number;
  billDueGroup: '15' | '30' | '';
  billStatus: 'auto' | 'manual';
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
  balanceDate: string;
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

export type GiftStatus = 'want' | 'purchased' | 'cancelled';
export type GiftPriority = 'high' | 'medium' | 'low';

export interface GiftRecipient {
  id: string;
  name: string;
  budget: number; // 0 = unset
  occasion: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Gift {
  id: string;
  recipientId: string;
  idea: string;
  cost: number;
  status: GiftStatus;
  priority: GiftPriority;
  notes: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

// ── Price Alerts ─────────────────────────────────────────────────────────

export interface PriceAlert {
  id: string;
  giftId: string;
  url: string;
  label: string;
  targetPrice: number;
  currentPrice: number | null;
  lowestPrice: number | null;
  lastChecked: string | null;
  lastAlerted: string | null;
  consecutiveFailures: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Subscriptions ────────────────────────────────────────────────────────

export type SubscriptionFrequency = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type SubscriptionCategory =
  | 'streaming' | 'software' | 'fitness' | 'news' | 'gaming'
  | 'utilities' | 'food' | 'shopping' | 'finance' | 'other';

export interface Subscription {
  id: string;
  name: string;
  amount: number;          // actual charge per billing cycle
  frequency: SubscriptionFrequency;
  renewalDay: number;      // 1-30 if monthly (day of month); 1-12 if annual (month number)
  freeTrial: boolean;
  trialExpiration: string; // YYYY-MM-DD or ''
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Scratchpad ───────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// ── Maintenance ─────────────────────────────────────────────────────────

export type MaintenanceGroup = 'home' | 'machines';

export interface Machine {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  year: string;
  serialNumber: string;
  purchaseDate: string;
  manualUrl: string;
  notes: string;
  icon: string;
  category: MaintenanceCategory;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceCategory =
  | 'hvac' | 'electrical' | 'plumbing' | 'exterior' | 'interior'
  | 'appliances' | 'safety' | 'windows-doors'
  | 'vehicles' | 'power-tools' | 'lawn-garden' | 'snow-winter'
  | 'generator' | 'recreational' | 'other';

export type RecurrenceType = 'date' | 'usage' | 'seasonal' | 'custom';

export type RecurrenceUnit =
  | 'days' | 'months' | 'years'
  | 'miles' | 'hours' | 'uses'
  | 'pre-season' | 'post-season' | 'winter' | 'spring'
  | 'summer' | 'fall' | 'season-end' | 'post-salt';

export type MaintenanceDueStatus =
  | 'overdue' | 'due-today' | 'due-this-week' | 'upcoming' | 'no-date';

export interface MaintenanceTask {
  id: string;
  name: string;
  group: MaintenanceGroup;
  category: MaintenanceCategory;
  machineId: string; // '' = not linked to a specific machine
  instructions: string;
  recurrenceType: RecurrenceType;
  recurrenceUnit: RecurrenceUnit | '';
  recurrenceValue: number;
  nextDueDate: string;
  currentUsage: number;
  lastCompletionUsage: number;
  isPreset: boolean;
  icon: string;
  snoozedUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceCompletion {
  id: string;
  taskId: string;
  completedAt: string;
  notes: string;
  cost: number;
  photoUrl: string;
  usageAtCompletion: number;
  createdAt: string;
}
