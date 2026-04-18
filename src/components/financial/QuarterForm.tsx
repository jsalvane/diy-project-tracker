import { deriveMetrics, syncDerivedValues } from '../../lib/financialCalc';
import type { FinancialQuarter } from '../../lib/financialTypes';
import { FieldGroup } from './FieldGroup';

interface QuarterFormProps {
  quarter: FinancialQuarter;
  onChange: (q: FinancialQuarter) => void;
  onSave: () => void;
  onCancel: () => void;
}


export function QuarterForm({ quarter, onChange, onSave, onCancel }: QuarterFormProps) {
  const derived = deriveMetrics(quarter);

  // Every patch auto-syncs all calculable derived values before calling onChange
  function emit(updated: FinancialQuarter) {
    onChange(syncDerivedValues(updated));
  }

  function patchAssets(patch: Partial<typeof quarter.assets>) {
    emit({ ...quarter, assets: { ...quarter.assets, ...patch } });
  }
  function patchLiabilities(patch: Partial<typeof quarter.liabilities>) {
    emit({ ...quarter, liabilities: { ...quarter.liabilities, ...patch } });
  }
  function patchIncome(patch: Partial<typeof quarter.income>) {
    emit({ ...quarter, income: { ...quarter.income, ...patch } });
  }
  function patchExpenses(patch: Partial<typeof quarter.expenses>) {
    emit({ ...quarter, expenses: { ...quarter.expenses, ...patch } });
  }
  function patchSavings(patch: Partial<typeof quarter.savingsInvesting>) {
    emit({ ...quarter, savingsInvesting: { ...quarter.savingsInvesting, ...patch } });
  }
  function patchReported(patch: Partial<typeof quarter.reportedSummaryValues>) {
    // reportedSummaryValues patches don't need full re-derive
    onChange({ ...quarter, reportedSummaryValues: { ...quarter.reportedSummaryValues, ...patch } });
  }

  const INPUT_CLASS =
    'w-full text-sm px-3 py-2 rounded-lg border border-[var(--ink-line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

  return (
    <div className="space-y-5">
      {/* Header fields */}
      <div className="border border-[var(--ink-line)] rounded-xl p-5">
        <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
          Month Info
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
              Month Label
            </label>
            <input
              type="text"
              value={quarter.quarterLabel}
              onChange={(e) => emit({ ...quarter, quarterLabel: e.target.value })}
              placeholder="Apr 2026"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
              Date Captured
            </label>
            <input
              type="date"
              value={quarter.dateCaptured}
              onChange={(e) => emit({ ...quarter, dateCaptured: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {/* Assets */}
      <FieldGroup
        title="Assets"
        highlighted
        columns={3}
        fields={[
          { key: 'cash', label: 'Cash (incl. emergency fund)', prefix: '$', value: quarter.assets.cash, onChange: (v) => patchAssets({ cash: v }) },
          { key: 'retirement401k', label: '401K', prefix: '$', value: quarter.assets.retirement401k, onChange: (v) => patchAssets({ retirement401k: v }) },
          { key: 'rothIras', label: 'Roth IRAs', prefix: '$', value: quarter.assets.rothIras, onChange: (v) => patchAssets({ rothIras: v }) },
          { key: 'hsa', label: 'HSA', prefix: '$', value: quarter.assets.hsa, onChange: (v) => patchAssets({ hsa: v }) },
          { key: 'k1Savings', label: 'K1 Savings', prefix: '$', value: quarter.assets.k1Savings, onChange: (v) => patchAssets({ k1Savings: v }) },
          { key: 'k1529', label: 'K1 529', prefix: '$', value: quarter.assets.k1529, onChange: (v) => patchAssets({ k1529: v }) },
          { key: 'homeValue', label: 'Home Value', prefix: '$', value: quarter.assets.homeValue, onChange: (v) => patchAssets({ homeValue: v }) },
          { key: 'vehicles', label: 'Vehicles', prefix: '$', value: quarter.assets.vehicles, onChange: (v) => patchAssets({ vehicles: v }) },
          { key: 'otherAssets', label: 'Other Assets', prefix: '$', value: quarter.assets.otherAssets, onChange: (v) => patchAssets({ otherAssets: v }) },
        ]}
        totalLabel="Total Assets"
        totalValue={derived.totalAssets}
      />

      {/* Liabilities */}
      <FieldGroup
        title="Liabilities"
        highlighted
        columns={2}
        fields={[
          { key: 'mortgage', label: 'Mortgage Balance', prefix: '$', value: quarter.liabilities.mortgage, onChange: (v) => patchLiabilities({ mortgage: v }) },
          { key: 'creditCards', label: 'Credit Cards', prefix: '$', value: quarter.liabilities.creditCards, onChange: (v) => patchLiabilities({ creditCards: v }) },
          { key: 'autoLoans', label: 'Auto Loans', prefix: '$', value: quarter.liabilities.autoLoans, onChange: (v) => patchLiabilities({ autoLoans: v }) },
          { key: 'studentLoansJ', label: 'Student Loans (J)', prefix: '$', value: quarter.liabilities.studentLoansJ, onChange: (v) => patchLiabilities({ studentLoansJ: v }) },
          { key: 'studentLoansK', label: 'Student Loans (K)', prefix: '$', value: quarter.liabilities.studentLoansK, onChange: (v) => patchLiabilities({ studentLoansK: v }) },
          { key: 'otherDebt', label: 'Other Debt', prefix: '$', value: quarter.liabilities.otherDebt, onChange: (v) => patchLiabilities({ otherDebt: v }) },
        ]}
        totalLabel="Total Liabilities"
        totalValue={derived.totalLiabilities}
      />

      {/* Income */}
      <FieldGroup
        title="Monthly Income"
        highlighted
        columns={2}
        fields={[
          { key: 'yourTakeHome', label: 'Your Take-Home', prefix: '$', value: quarter.income.yourTakeHome, onChange: (v) => patchIncome({ yourTakeHome: v }) },
          { key: 'wifeTakeHome', label: "Wife's Take-Home", prefix: '$', value: quarter.income.wifeTakeHome, onChange: (v) => patchIncome({ wifeTakeHome: v }) },
        ]}
        totalLabel="Total Monthly Income"
        totalValue={derived.totalMonthlyIncome}
      />

      {/* Expenses */}
      <FieldGroup
        title="Monthly Expenses"
        columns={3}
        fields={[
          { key: 'mortgage', label: 'Mortgage', prefix: '$', value: quarter.expenses.mortgage, onChange: (v) => patchExpenses({ mortgage: v }) },
          { key: 'propertyTaxes', label: 'Property Taxes', prefix: '$', value: quarter.expenses.propertyTaxes, onChange: (v) => patchExpenses({ propertyTaxes: v }) },
          { key: 'homeAutoInsurance', label: 'Home + Auto Insurance', prefix: '$', value: quarter.expenses.homeAutoInsurance, onChange: (v) => patchExpenses({ homeAutoInsurance: v }) },
          { key: 'studentLoans', label: 'Student Loans', prefix: '$', value: quarter.expenses.studentLoans, onChange: (v) => patchExpenses({ studentLoans: v }) },
          { key: 'leaseMazda', label: 'Lease (Mazda)', prefix: '$', value: quarter.expenses.leaseMazda, onChange: (v) => patchExpenses({ leaseMazda: v }) },
          { key: 'electric', label: 'Electric', prefix: '$', value: quarter.expenses.electric, onChange: (v) => patchExpenses({ electric: v }) },
          { key: 'internet', label: 'Internet', prefix: '$', value: quarter.expenses.internet, onChange: (v) => patchExpenses({ internet: v }) },
          { key: 'phone', label: 'Phone', prefix: '$', value: quarter.expenses.phone, onChange: (v) => patchExpenses({ phone: v }) },
          { key: 'trash', label: 'Trash', prefix: '$', value: quarter.expenses.trash, onChange: (v) => patchExpenses({ trash: v }) },
          { key: 'cable', label: 'Cable', prefix: '$', value: quarter.expenses.cable, onChange: (v) => patchExpenses({ cable: v }) },
          { key: 'groceries', label: 'Groceries', prefix: '$', value: quarter.expenses.groceries, onChange: (v) => patchExpenses({ groceries: v }) },
          { key: 'miscSpending', label: 'Miscellaneous Spending', prefix: '$', value: quarter.expenses.miscSpending, onChange: (v) => patchExpenses({ miscSpending: v }) },
          { key: 'maineCabin', label: 'Maine Cabin', prefix: '$', value: quarter.expenses.maineCabin, onChange: (v) => patchExpenses({ maineCabin: v }) },
          { key: 'otherRecurring', label: 'Other Recurring', prefix: '$', value: quarter.expenses.otherRecurring, onChange: (v) => patchExpenses({ otherRecurring: v }) },
        ]}
        totalLabel="Total Monthly Expenses"
        totalValue={derived.totalMonthlyExpenses}
      />

      {/* Savings & Investing — combinedAnnualWealthBuilding is auto-calculated */}
      <FieldGroup
        title="Savings & Investing"
        columns={2}
        fields={[
          { key: 'annualRetirementTarget', label: 'Annual Retirement Savings Target', prefix: '$', value: quarter.savingsInvesting.annualRetirementTarget, onChange: (v) => patchSavings({ annualRetirementTarget: v }) },
          { key: 'annualRetirementActualYtd', label: 'Annual Retirement Actual YTD', prefix: '$', value: quarter.savingsInvesting.annualRetirementActualYtd, onChange: (v) => patchSavings({ annualRetirementActualYtd: v }) },
          { key: 'annualSurplusBeyondRetirement', label: 'Annual Surplus Beyond Retirement', prefix: '$', value: quarter.savingsInvesting.annualSurplusBeyondRetirement, onChange: (v) => patchSavings({ annualSurplusBeyondRetirement: v }) },
          {
            key: 'combinedAnnualWealthBuilding',
            label: 'Combined Annual Wealth-Building (auto)',
            prefix: '$',
            value: quarter.savingsInvesting.annualRetirementTarget + quarter.savingsInvesting.annualSurplusBeyondRetirement,
            onChange: () => {},
            readOnly: true,
          },
        ]}
      />

      {/* Cash on Hand + Emergency Fund overrides */}
      <div className="border border-[var(--ink-line)] rounded-xl p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest">
            Emergency Fund Targets
          </p>
          <p className="text-xs text-[var(--ink-4)] mt-1">
            Cash on Hand is auto-calculated from the Cash asset above. Set your emergency fund target range and status note here.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Emergency fund targets */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
              Emergency Fund Target — Low
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-4)] pointer-events-none">$</span>
              <input
                type="number"
                step="0.01"
                value={quarter.reportedSummaryValues.emergencyFundTargetLow}
                onChange={(e) => { const v = parseFloat(e.target.value); patchReported({ emergencyFundTargetLow: isNaN(v) ? 0 : v }); }}
                onFocus={(e) => e.target.select()}
                className="w-full text-sm pl-6 pr-3 py-2 rounded-lg border border-[var(--ink-line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
              Emergency Fund Target — High
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-4)] pointer-events-none">$</span>
              <input
                type="number"
                step="0.01"
                value={quarter.reportedSummaryValues.emergencyFundTargetHigh}
                onChange={(e) => { const v = parseFloat(e.target.value); patchReported({ emergencyFundTargetHigh: isNaN(v) ? 0 : v }); }}
                onFocus={(e) => e.target.select()}
                className="w-full text-sm pl-6 pr-3 py-2 rounded-lg border border-[var(--ink-line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent tabular-nums"
              />
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-[var(--ink-3)] mb-1">
              Emergency Fund Status Note
            </label>
            <input
              type="text"
              value={quarter.reportedSummaryValues.emergencyFundStatus}
              onChange={(e) => patchReported({ emergencyFundStatus: e.target.value })}
              placeholder="e.g. Above target, assuming savings is not heavily earmarked"
              className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--ink-line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border border-[var(--ink-line)] rounded-xl p-5">
        <label className="block text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-3">
          Notes
        </label>
        <textarea
          value={quarter.notes}
          onChange={(e) => emit({ ...quarter, notes: e.target.value })}
          rows={4}
          placeholder="Any observations, context, or reminders for this month..."
          className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--ink-line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium border border-[var(--ink-line)] text-[var(--ink-2)] rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-5 py-2 text-sm font-medium bg-black text-[var(--paper)] rounded-lg hover:bg-gray-800 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
