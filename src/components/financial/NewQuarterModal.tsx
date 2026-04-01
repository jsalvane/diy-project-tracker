import { useState } from 'react';
import { todayStr } from '../../lib/utils';
import type { FinancialQuarter } from '../../lib/financialTypes';

interface NewQuarterModalProps {
  previousQuarter: FinancialQuarter | null;
  onConfirm: (draft: Omit<FinancialQuarter, 'id'>) => void;
  onCancel: () => void;
}

function nextQuarterLabel(label: string): string {
  const match = label.match(/Q([1-4])\s+(\d{4})/i);
  if (!match) return '';
  const q = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  if (q < 4) return `Q${q + 1} ${year}`;
  return `Q1 ${year + 1}`;
}

export function NewQuarterModal({ previousQuarter, onConfirm, onCancel }: NewQuarterModalProps) {
  const suggested = previousQuarter ? nextQuarterLabel(previousQuarter.quarterLabel) : '';
  const [label, setLabel] = useState(suggested);
  const [date, setDate] = useState(todayStr());

  const INPUT_CLASS =
    'w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

  function handleConfirm() {
    if (!label.trim()) return;

    let draft: Omit<FinancialQuarter, 'id'>;

    if (previousQuarter) {
      draft = {
        ...previousQuarter,
        quarterLabel: label.trim(),
        dateCaptured: date,
        notes: '',
        savingsInvesting: {
          ...previousQuarter.savingsInvesting,
          annualRetirementActualYtd: 0,
        },
      };
    } else {
      draft = {
        quarterLabel: label.trim(),
        dateCaptured: date,
        notes: '',
        assets: { cash: 0, retirement401k: 0, rothIras: 0, hsa: 0, k1Savings: 0, k1529: 0, homeValue: 0, vehicles: 0, otherAssets: 0 },
        liabilities: { mortgage: 0, creditCards: 0, autoLoans: 0, studentLoansJ: 0, studentLoansK: 0, otherDebt: 0 },
        income: { yourTakeHome: 0, wifeTakeHome: 0 },
        expenses: { mortgage: 0, propertyTaxes: 0, homeAutoInsurance: 0, studentLoans: 0, leaseMazda: 0, electric: 0, internet: 0, phone: 0, trash: 0, cable: 0, groceries: 0, miscSpending: 0, maineCabin: 0, otherRecurring: 0 },
        savingsInvesting: { annualRetirementTarget: 0, annualRetirementActualYtd: 0, annualSurplusBeyondRetirement: 0, combinedAnnualWealthBuilding: 0 },
        reportedSummaryValues: { totalAssets: 0, totalLiabilities: 0, netWorth: 0, homeEquity: 0, totalMonthlyIncome: 0, totalMonthlyExpenses: 0, monthlySurplus: 0, cashOnHand: 0, retirementAssets: 0, kidsSavingsTotal: 0, debtToAssetRatio: 0, housingCost: 0, housingCostPctOfTakeHome: 0, emergencyFundTargetLow: 0, emergencyFundTargetHigh: 0, emergencyFundStatus: '' },
      };
    }

    onConfirm(draft);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
          New Quarter
        </h2>
        {previousQuarter ? (
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
            Cloning from <strong>{previousQuarter.quarterLabel}</strong>. All values are carried forward as placeholders — update any that changed. Annual retirement YTD is reset to 0. Notes are cleared.
          </p>
        ) : (
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
            No previous quarter to clone from. Starting with blank values.
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">
              Quarter Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Q2 2026"
              className={INPUT_CLASS}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">
              Date Captured
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!label.trim()}
            className="px-5 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Quarter
          </button>
        </div>
      </div>
    </div>
  );
}
