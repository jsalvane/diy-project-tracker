import type {
  FinancialQuarter,
  DerivedMetrics,
  ValidationFlag,
} from './financialTypes';

export function deriveMetrics(q: FinancialQuarter): DerivedMetrics {
  const { assets, liabilities, income, expenses } = q;

  const totalAssets =
    assets.cash +
    assets.retirement401k +
    assets.rothIras +
    assets.hsa +
    assets.k1Savings +
    assets.k1529 +
    assets.homeValue +
    assets.vehicles +
    assets.otherAssets;

  const totalLiabilities =
    liabilities.mortgage +
    liabilities.creditCards +
    liabilities.autoLoans +
    liabilities.studentLoansJ +
    liabilities.studentLoansK +
    liabilities.otherDebt;

  const netWorth = totalAssets - totalLiabilities;
  const homeEquity = assets.homeValue - liabilities.mortgage;

  const totalMonthlyIncome = income.yourTakeHome + income.wifeTakeHome;

  const totalMonthlyExpenses =
    expenses.mortgage +
    expenses.propertyTaxes +
    expenses.homeAutoInsurance +
    expenses.studentLoans +
    expenses.leaseMazda +
    expenses.electric +
    expenses.internet +
    expenses.phone +
    expenses.trash +
    expenses.cable +
    expenses.groceries +
    expenses.miscSpending +
    expenses.maineCabin +
    expenses.otherRecurring;

  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;

  const retirementAssets = assets.retirement401k + assets.rothIras + assets.hsa;
  const kidsSavingsTotal = assets.k1Savings + assets.k1529;

  const debtToAssetRatio =
    totalAssets === 0 ? 0 : (totalLiabilities / totalAssets) * 100;

  const housingCost =
    expenses.mortgage + expenses.propertyTaxes + expenses.homeAutoInsurance;

  const housingCostPctOfTakeHome =
    totalMonthlyIncome === 0 ? 0 : (housingCost / totalMonthlyIncome) * 100;

  const emergencyFundMonths =
    totalMonthlyExpenses === 0 ? 0 : assets.cash / totalMonthlyExpenses;

  let emergencyFundStatus: DerivedMetrics['emergencyFundStatus'];
  if (emergencyFundMonths < 3) {
    emergencyFundStatus = 'below';
  } else if (emergencyFundMonths <= 6) {
    emergencyFundStatus = 'on_target';
  } else {
    emergencyFundStatus = 'above';
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    homeEquity,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlySurplus,
    retirementAssets,
    kidsSavingsTotal,
    debtToAssetRatio,
    housingCost,
    housingCostPctOfTakeHome,
    emergencyFundMonths,
    emergencyFundStatus,
  };
}

interface MismatchCheck {
  field: string;
  label: string;
  calculated: number;
  reported: number;
  isPct?: boolean;
}

export function computeValidationFlags(
  q: FinancialQuarter,
  derived: DerivedMetrics,
  allQuarters: FinancialQuarter[]
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  // ── Mismatch checks ──────────────────────────────────────────────
  const mismatches: MismatchCheck[] = [
    { field: 'totalAssets', label: 'Total Assets', calculated: derived.totalAssets, reported: q.reportedSummaryValues.totalAssets },
    { field: 'totalLiabilities', label: 'Total Liabilities', calculated: derived.totalLiabilities, reported: q.reportedSummaryValues.totalLiabilities },
    { field: 'netWorth', label: 'Net Worth', calculated: derived.netWorth, reported: q.reportedSummaryValues.netWorth },
    { field: 'homeEquity', label: 'Home Equity', calculated: derived.homeEquity, reported: q.reportedSummaryValues.homeEquity },
    { field: 'totalMonthlyIncome', label: 'Total Monthly Income', calculated: derived.totalMonthlyIncome, reported: q.reportedSummaryValues.totalMonthlyIncome },
    { field: 'totalMonthlyExpenses', label: 'Total Monthly Expenses', calculated: derived.totalMonthlyExpenses, reported: q.reportedSummaryValues.totalMonthlyExpenses },
    { field: 'monthlySurplus', label: 'Monthly Surplus', calculated: derived.monthlySurplus, reported: q.reportedSummaryValues.monthlySurplus },
    { field: 'cashOnHand', label: 'Cash on Hand', calculated: q.assets.cash, reported: q.reportedSummaryValues.cashOnHand },
    { field: 'retirementAssets', label: 'Retirement Assets', calculated: derived.retirementAssets, reported: q.reportedSummaryValues.retirementAssets },
    { field: 'kidsSavingsTotal', label: 'Kids Savings Total', calculated: derived.kidsSavingsTotal, reported: q.reportedSummaryValues.kidsSavingsTotal },
    { field: 'debtToAssetRatio', label: 'Debt-to-Asset Ratio', calculated: derived.debtToAssetRatio, reported: q.reportedSummaryValues.debtToAssetRatio, isPct: true },
    { field: 'housingCost', label: 'Housing Cost', calculated: derived.housingCost, reported: q.reportedSummaryValues.housingCost },
    { field: 'housingCostPctOfTakeHome', label: 'Housing Cost % of Take-Home', calculated: derived.housingCostPctOfTakeHome, reported: q.reportedSummaryValues.housingCostPctOfTakeHome, isPct: true },
  ];

  for (const m of mismatches) {
    if (Math.abs(m.calculated - m.reported) > 0.01) {
      flags.push({
        field: m.field,
        severity: 'warning',
        message: `${m.label}: reported ${m.isPct ? Math.round(m.reported) + '%' : formatNum(m.reported)} but calculated ${m.isPct ? Math.round(m.calculated) + '%' : formatNum(m.calculated)}`,
        calculated: m.calculated,
        reported: m.reported,
      });
    }
  }

  // ── Negative value checks ─────────────────────────────────────────
  const numericSections: Array<[string, Record<string, number>]> = [
    ['assets', q.assets as unknown as Record<string, number>],
    ['liabilities', q.liabilities as unknown as Record<string, number>],
    ['income', q.income as unknown as Record<string, number>],
    ['expenses', q.expenses as unknown as Record<string, number>],
    ['savingsInvesting', q.savingsInvesting as unknown as Record<string, number>],
  ];

  for (const [section, obj] of numericSections) {
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'number' && val < 0) {
        flags.push({
          field: `${section}.${key}`,
          severity: 'error',
          message: `${section}.${key} has a negative value (${val}). Negative values are not expected here.`,
        });
      }
    }
  }

  // ── Duplicate quarter label ───────────────────────────────────────
  const duplicates = allQuarters.filter(
    (other) => other.id !== q.id && other.quarterLabel === q.quarterLabel
  );
  if (duplicates.length > 0) {
    flags.push({
      field: 'quarterLabel',
      severity: 'error',
      message: `Month label "${q.quarterLabel}" is used by another entry. Labels must be unique.`,
    });
  }

  // ── Required fields ───────────────────────────────────────────────
  if (!q.quarterLabel.trim()) {
    flags.push({
      field: 'quarterLabel',
      severity: 'error',
      message: 'Month label is required.',
    });
  }
  if (!q.dateCaptured) {
    flags.push({
      field: 'dateCaptured',
      severity: 'error',
      message: 'Date captured is required.',
    });
  }

  // Sort errors first
  return flags.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === 'error' ? -1 : 1;
  });
}

// ── Auto-sync helper ─────────────────────────────────────────────────
// Fills all calculable fields in reportedSummaryValues and
// combinedAnnualWealthBuilding from the entered input values.
// Call this on every form change so no manual re-entry is needed.
export function syncDerivedValues(q: FinancialQuarter): FinancialQuarter {
  const d = deriveMetrics(q);
  return {
    ...q,
    savingsInvesting: {
      ...q.savingsInvesting,
      combinedAnnualWealthBuilding:
        q.savingsInvesting.annualRetirementTarget +
        q.savingsInvesting.annualSurplusBeyondRetirement,
    },
    reportedSummaryValues: {
      ...q.reportedSummaryValues,
      totalAssets: d.totalAssets,
      totalLiabilities: d.totalLiabilities,
      netWorth: d.netWorth,
      homeEquity: d.homeEquity,
      totalMonthlyIncome: d.totalMonthlyIncome,
      totalMonthlyExpenses: d.totalMonthlyExpenses,
      monthlySurplus: d.monthlySurplus,
      retirementAssets: d.retirementAssets,
      kidsSavingsTotal: d.kidsSavingsTotal,
      debtToAssetRatio: d.debtToAssetRatio,
      housingCost: d.housingCost,
      housingCostPctOfTakeHome: d.housingCostPctOfTakeHome,
      cashOnHand: q.assets.cash,
    },
  };
}

function formatNum(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
