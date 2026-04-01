// ── Sub-interfaces ──────────────────────────────────────────────────

export interface Assets {
  cash: number;
  retirement401k: number;
  rothIras: number;
  hsa: number;
  k1Savings: number;
  k1529: number;
  homeValue: number;
  vehicles: number;
  otherAssets: number;
}

export interface Liabilities {
  mortgage: number;
  creditCards: number;
  autoLoans: number;
  studentLoansJ: number;
  studentLoansK: number;
  otherDebt: number;
}

export interface Income {
  yourTakeHome: number;
  wifeTakeHome: number;
}

export interface Expenses {
  mortgage: number;
  propertyTaxes: number;
  homeAutoInsurance: number;
  studentLoans: number;
  leaseMazda: number;
  electric: number;
  internet: number;
  phone: number;
  trash: number;
  cable: number;
  groceries: number;
  miscSpending: number;
  maineCabin: number;
  otherRecurring: number;
}

export interface SavingsInvesting {
  annualRetirementTarget: number;
  annualRetirementActualYtd: number;
  annualSurplusBeyondRetirement: number;
  combinedAnnualWealthBuilding: number;
}

export interface ReportedSummaryValues {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  homeEquity: number;
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  monthlySurplus: number;
  cashOnHand: number;
  retirementAssets: number;
  kidsSavingsTotal: number;
  debtToAssetRatio: number;
  housingCost: number;
  housingCostPctOfTakeHome: number;
  emergencyFundTargetLow: number;
  emergencyFundTargetHigh: number;
  emergencyFundStatus: string;
}

// ── Core record ─────────────────────────────────────────────────────

export interface FinancialQuarter {
  id: string;
  quarterLabel: string;
  dateCaptured: string; // YYYY-MM-DD
  assets: Assets;
  liabilities: Liabilities;
  income: Income;
  expenses: Expenses;
  savingsInvesting: SavingsInvesting;
  reportedSummaryValues: ReportedSummaryValues;
  notes: string;
  // derivedMetrics and validationFlags are computed at render time, never stored
}

// ── Computed types ──────────────────────────────────────────────────

export interface DerivedMetrics {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  homeEquity: number;
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  monthlySurplus: number;
  retirementAssets: number;
  kidsSavingsTotal: number;
  debtToAssetRatio: number;
  housingCost: number;
  housingCostPctOfTakeHome: number;
  emergencyFundMonths: number;
  emergencyFundStatus: 'below' | 'on_target' | 'above';
}

export interface ValidationFlag {
  field: string;
  severity: 'warning' | 'error';
  message: string;
  calculated?: number;
  reported?: number;
}

// ── Context / state ─────────────────────────────────────────────────

export interface FinancialState {
  quarters: FinancialQuarter[];
  activeQuarterId: string | null;
}

export type FinancialAction =
  | { type: 'LOAD_STATE'; payload: FinancialState }
  | { type: 'ADD_QUARTER'; payload: FinancialQuarter }
  | { type: 'UPDATE_QUARTER'; payload: FinancialQuarter }
  | { type: 'DELETE_QUARTER'; payload: string }
  | { type: 'SET_ACTIVE_QUARTER'; payload: string | null }
  | { type: 'REPLACE_ALL_QUARTERS'; payload: FinancialQuarter[] };
