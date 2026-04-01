import { generateId } from './utils';
import type { FinancialQuarter, FinancialState } from './financialTypes';

export function createFinancialSeedData(): FinancialState {
  const quarter: FinancialQuarter = {
    id: generateId(),
    quarterLabel: 'Mar 2026',
    dateCaptured: '2026-03-31',
    assets: {
      cash: 62000,
      retirement401k: 230000,
      rothIras: 30000,
      hsa: 6500,
      k1Savings: 2200,
      k1529: 5600,
      homeValue: 691000,
      vehicles: 30000,
      otherAssets: 0,
    },
    liabilities: {
      mortgage: 391000,
      creditCards: 0,
      autoLoans: 0,
      studentLoansJ: 13700,
      studentLoansK: 64400,
      otherDebt: 0,
    },
    income: {
      yourTakeHome: 7200,
      wifeTakeHome: 2800,
    },
    expenses: {
      mortgage: 1835,
      propertyTaxes: 917,
      homeAutoInsurance: 295,
      studentLoans: 1320,
      leaseMazda: 530,
      electric: 200,
      internet: 110,
      phone: 88,
      trash: 55,
      cable: 50,
      groceries: 400,
      miscSpending: 1500,
      maineCabin: 100,
      otherRecurring: 0,
    },
    savingsInvesting: {
      annualRetirementTarget: 27000,
      annualRetirementActualYtd: 0,
      annualSurplusBeyondRetirement: 30000,
      combinedAnnualWealthBuilding: 57000,
    },
    // Intentional mismatch: cashOnHand 62500 vs assets.cash 62000
    // This demonstrates validation discrepancy detection on first load.
    reportedSummaryValues: {
      totalAssets: 1057800,
      totalLiabilities: 469100,
      netWorth: 588700,
      homeEquity: 300000,
      totalMonthlyIncome: 9800,
      totalMonthlyExpenses: 7400,
      monthlySurplus: 2400,
      cashOnHand: 62500,
      retirementAssets: 266000,
      kidsSavingsTotal: 7800,
      debtToAssetRatio: 44.3,
      housingCost: 3047,
      housingCostPctOfTakeHome: 31.1,
      emergencyFundTargetLow: 35000,
      emergencyFundTargetHigh: 40000,
      emergencyFundStatus: 'Above target, assuming savings is not heavily earmarked',
    },
    notes: '',
  };

  return {
    quarters: [quarter],
    activeQuarterId: quarter.id,
  };
}
