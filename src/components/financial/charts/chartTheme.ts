export const ASSET_COLORS = [
  '#f97316', // Cash – orange
  '#3b82f6', // 401k – blue
  '#8b5cf6', // Roth IRAs – purple
  '#06b6d4', // HSA – cyan
  '#10b981', // K1 Savings – emerald
  '#14b8a6', // K1 529 – teal
  '#6366f1', // Home Value – indigo
  '#a855f7', // Vehicles – violet
  '#64748b', // Other – slate
];

export const ASSET_LABELS = [
  'Cash',
  '401(k)',
  'Roth IRAs',
  'HSA',
  'K1 Savings',
  'K1 529',
  'Home Value',
  'Vehicles',
  'Other',
];

export const LIABILITY_COLORS = [
  '#ef4444', // Mortgage – red
  '#f97316', // Credit Cards – orange
  '#f59e0b', // Auto Loans – amber
  '#dc2626', // Student J – dark red
  '#ea580c', // Student K – dark orange
  '#64748b', // Other – slate
];

export const LIABILITY_LABELS = [
  'Mortgage',
  'Credit Cards',
  'Auto Loans',
  'Student Loans (J)',
  'Student Loans (K)',
  'Other Debt',
];

export const EXPENSE_LABELS: Record<string, string> = {
  mortgage: 'Mortgage',
  propertyTaxes: 'Property Taxes',
  homeAutoInsurance: 'Home/Auto Ins.',
  studentLoans: 'Student Loans',
  leaseMazda: 'Lease (Mazda)',
  electric: 'Electric',
  internet: 'Internet',
  phone: 'Phone',
  trash: 'Trash',
  cable: 'Cable',
  groceries: 'Groceries',
  miscSpending: 'Misc Spending',
  maineCabin: 'Maine Cabin',
  otherRecurring: 'Other Recurring',
};

export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#18181b',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#e4e4e7',
  },
  itemStyle: { color: '#e4e4e7' },
  labelStyle: { color: '#a1a1aa', fontWeight: 600 },
};

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtPct(n: number): string {
  return Math.round(n) + '%';
}
