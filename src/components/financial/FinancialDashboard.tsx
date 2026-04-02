import { deriveMetrics, computeValidationFlags } from '../../lib/financialCalc';
import type { FinancialQuarter } from '../../lib/financialTypes';
import { KpiCard } from './KpiCard';
import { ValidationWarnings } from './ValidationWarnings';
import { NetWorthTrend } from './charts/NetWorthTrend';
import { AssetDonut } from './charts/AssetDonut';
import { LiabilityDonut } from './charts/LiabilityDonut';
import { IncomeVsExpenses } from './charts/IncomeVsExpenses';
import { ExpenseBreakdown } from './charts/ExpenseBreakdown';
import { HealthGauge } from './charts/HealthGauge';
import { AssetsLiabilitiesTrend } from './charts/AssetsLiabilitiesTrend';
import { RetirementProgress } from './charts/RetirementProgress';
import { useFinancial } from '../../context/FinancialContext';
import { fmtCurrency, fmtPct } from './charts/chartTheme';

interface Props {
  quarter: FinancialQuarter;
  priorQuarter?: FinancialQuarter;
  allQuarters: FinancialQuarter[]; // sorted ascending
  onEdit: () => void;
  onDelete: () => void;
}

const EF_STATUS_HIGHLIGHT = {
  above: 'positive',
  on_target: 'neutral',
  below: 'negative',
} as const;

export function FinancialDashboard({ quarter, priorQuarter, allQuarters, onEdit, onDelete }: Props) {
  const { state } = useFinancial();
  const derived = deriveMetrics(quarter);
  const flags = computeValidationFlags(quarter, derived, state.quarters);
  const priorDerived = priorQuarter ? deriveMetrics(priorQuarter) : undefined;

  // Build trend data from all quarters
  const trendData = allQuarters.map((q) => {
    const d = deriveMetrics(q);
    return {
      label: q.quarterLabel,
      netWorth: d.netWorth,
      assets: d.totalAssets,
      liabilities: d.totalLiabilities,
      income: d.totalMonthlyIncome,
      expenses: d.totalMonthlyExpenses,
      retirement: d.retirementAssets,
    };
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {quarter.quarterLabel}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Captured {quarter.dateCaptured}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-zinc-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Validation warnings */}
      {flags.length > 0 && <ValidationWarnings flags={flags} />}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Net Worth"
          value={fmtCurrency(derived.netWorth)}
          delta={priorDerived ? derived.netWorth - priorDerived.netWorth : undefined}
          deltaFormat="currency"
          highlight="neutral"
        />
        <KpiCard
          label="Monthly Surplus"
          value={fmtCurrency(derived.monthlySurplus)}
          delta={priorDerived ? derived.monthlySurplus - priorDerived.monthlySurplus : undefined}
          deltaFormat="currency"
          highlight={derived.monthlySurplus >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          label="Emergency Fund"
          value={Math.round(derived.emergencyFundMonths) + ' mo'}
          sub={
            derived.emergencyFundStatus === 'above'
              ? 'Above target'
              : derived.emergencyFundStatus === 'on_target'
              ? 'On target'
              : 'Below target'
          }
          highlight={EF_STATUS_HIGHLIGHT[derived.emergencyFundStatus]}
        />
        <KpiCard
          label="Debt-to-Asset"
          value={fmtPct(derived.debtToAssetRatio)}
          delta={priorDerived ? derived.debtToAssetRatio - priorDerived.debtToAssetRatio : undefined}
          deltaFormat="pct"
          highlight={derived.debtToAssetRatio < 50 ? 'positive' : 'warning'}
        />
        <KpiCard
          label="Retirement"
          value={fmtCurrency(derived.retirementAssets)}
          delta={priorDerived ? derived.retirementAssets - priorDerived.retirementAssets : undefined}
          deltaFormat="currency"
        />
        <KpiCard
          label="Housing Cost %"
          value={fmtPct(derived.housingCostPctOfTakeHome)}
          delta={priorDerived ? derived.housingCostPctOfTakeHome - priorDerived.housingCostPctOfTakeHome : undefined}
          deltaFormat="pct"
          highlight={derived.housingCostPctOfTakeHome <= 33 ? 'positive' : 'warning'}
        />
      </div>

      {/* Net Worth Trend — full width */}
      <NetWorthTrend data={trendData} activeLabel={quarter.quarterLabel} />

      {/* Asset + Liability Donuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <AssetDonut assets={quarter.assets} totalAssets={derived.totalAssets} />
        <LiabilityDonut liabilities={quarter.liabilities} totalLiabilities={derived.totalLiabilities} />
      </div>

      {/* Health Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <HealthGauge
          label="Emergency Fund"
          value={derived.emergencyFundMonths}
          max={12}
          displayValue={Math.round(derived.emergencyFundMonths) + ' mo'}
          zones={{ green: 50, amber: 25 }} // 6mo / 12mo = 50%, 3mo = 25%
        />
        <HealthGauge
          label="Debt-to-Asset Ratio"
          value={derived.debtToAssetRatio}
          max={100}
          displayValue={fmtPct(derived.debtToAssetRatio)}
          zones={{ green: 30, amber: 50 }}
          invertColor
        />
        <HealthGauge
          label="Housing Cost %"
          value={derived.housingCostPctOfTakeHome}
          max={60}
          displayValue={fmtPct(derived.housingCostPctOfTakeHome)}
          zones={{ green: 33, amber: 45 }}
          invertColor
        />
      </div>

      {/* Income vs Expenses */}
      <IncomeVsExpenses data={trendData} />

      {/* Expense Breakdown */}
      <ExpenseBreakdown expenses={quarter.expenses} />

      {/* Assets vs Liabilities Trend */}
      <AssetsLiabilitiesTrend data={trendData} />

      {/* Retirement Progress */}
      <RetirementProgress
        trendData={trendData}
        annualTarget={quarter.savingsInvesting.annualRetirementTarget}
        annualYtd={quarter.savingsInvesting.annualRetirementActualYtd}
      />

      {/* Notes */}
      {quarter.notes && (
        <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
            Notes
          </p>
          <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">
            {quarter.notes}
          </p>
        </div>
      )}
    </div>
  );
}
