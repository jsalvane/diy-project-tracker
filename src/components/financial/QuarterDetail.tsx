import { useState, useEffect } from 'react';
import { deriveMetrics, computeValidationFlags, syncDerivedValues } from '../../lib/financialCalc';
import type { FinancialQuarter } from '../../lib/financialTypes';
import { useFinancial } from '../../context/FinancialContext';
import { KpiCard } from './KpiCard';
import { ValidationWarnings } from './ValidationWarnings';
import { ComparisonRow } from './ComparisonRow';
import { QuarterForm } from './QuarterForm';

interface QuarterDetailProps {
  quarter: FinancialQuarter;
  priorQuarter?: FinancialQuarter;
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtPct(n: number): string {
  return Math.round(n) + '%';
}

const EF_STATUS_HIGHLIGHT = {
  above: 'positive',
  on_target: 'neutral',
  below: 'negative',
} as const;

export function QuarterDetail({ quarter, priorQuarter }: QuarterDetailProps) {
  const { updateQuarter, deleteQuarter } = useFinancial();
  const [mode, setMode] = useState<'summary' | 'edit'>('summary');
  const [draft, setDraft] = useState<FinancialQuarter>(quarter);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset draft when the selected quarter changes
  useEffect(() => {
    setDraft(quarter);
    setMode('summary');
  }, [quarter.id]);

  const derived = deriveMetrics(quarter);
  const { quarters } = useFinancial().state;
  const flags = computeValidationFlags(quarter, derived, quarters);

  const priorDerived = priorQuarter ? deriveMetrics(priorQuarter) : undefined;

  function handleSave() {
    // Always sync derived values before persisting
    updateQuarter(syncDerivedValues(draft));
    setMode('summary');
  }

  function handleCancel() {
    setDraft(quarter);
    setMode('summary');
  }

  function handleDelete() {
    deleteQuarter(quarter.id);
    setShowDeleteConfirm(false);
  }

  if (mode === 'edit') {
    return (
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[var(--ink)]">
            Editing {quarter.quarterLabel}
          </h2>
        </div>
        <QuarterForm
          quarter={draft}
          onChange={setDraft}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)]">
            {quarter.quarterLabel}
          </h2>
          <p className="text-sm text-[var(--ink-4)]">
            Captured {quarter.dateCaptured}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setDraft(syncDerivedValues(quarter)); setMode('edit'); }}
            className="px-4 py-2 text-sm font-medium bg-black text-[var(--paper)] rounded-lg hover:bg-gray-800 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-sm font-medium border border-[var(--ink-line)] text-[var(--rust)] rounded-lg hover:bg-[rgba(184,69,31,0.05)] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="border border-red-200 bg-[rgba(184,69,31,0.05)] rounded-xl p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-red-800">
            Delete <strong>{quarter.quarterLabel}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 text-xs font-medium border border-[var(--ink-line)] text-[var(--ink-2)] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-[var(--paper)] rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
          sub={derived.emergencyFundStatus === 'above' ? 'Above target' : derived.emergencyFundStatus === 'on_target' ? 'On target' : 'Below target'}
          highlight={EF_STATUS_HIGHLIGHT[derived.emergencyFundStatus]}
        />
        <KpiCard
          label="Debt-to-Asset Ratio"
          value={fmtPct(derived.debtToAssetRatio)}
          delta={priorDerived ? derived.debtToAssetRatio - priorDerived.debtToAssetRatio : undefined}
          deltaFormat="pct"
          highlight={derived.debtToAssetRatio < 50 ? 'positive' : 'warning'}
        />
        <KpiCard
          label="Retirement Assets"
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

      {/* Validation warnings */}
      {flags.length > 0 && <ValidationWarnings flags={flags} />}

      {/* Comparison table */}
      <div className="border border-[var(--ink-line)] rounded-xl p-5">
        <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
          {priorQuarter ? `vs ${priorQuarter.quarterLabel}` : 'Metrics Summary'}
        </p>

        <div className="space-y-0.5">
          <ComparisonRow label="Balance Sheet" current={0} format="currency" isHeader />
          <ComparisonRow label="Total Assets" prior={priorDerived?.totalAssets} current={derived.totalAssets} format="currency" />
          <ComparisonRow label="Total Liabilities" prior={priorDerived?.totalLiabilities} current={derived.totalLiabilities} format="currency" invertDelta />
          <ComparisonRow label="Net Worth" prior={priorDerived?.netWorth} current={derived.netWorth} format="currency" />
          <ComparisonRow label="Home Equity" prior={priorDerived?.homeEquity} current={derived.homeEquity} format="currency" indent />
          <ComparisonRow label="Retirement Assets" prior={priorDerived?.retirementAssets} current={derived.retirementAssets} format="currency" indent />
          <ComparisonRow label="Kids Savings" prior={priorDerived?.kidsSavingsTotal} current={derived.kidsSavingsTotal} format="currency" indent />

          <ComparisonRow label="Cash Flow" current={0} format="currency" isHeader />
          <ComparisonRow label="Total Monthly Income" prior={priorDerived?.totalMonthlyIncome} current={derived.totalMonthlyIncome} format="currency" />
          <ComparisonRow label="Total Monthly Expenses" prior={priorDerived?.totalMonthlyExpenses} current={derived.totalMonthlyExpenses} format="currency" invertDelta />
          <ComparisonRow label="Monthly Surplus" prior={priorDerived?.monthlySurplus} current={derived.monthlySurplus} format="currency" />
          <ComparisonRow label="Housing Cost" prior={priorDerived?.housingCost} current={derived.housingCost} format="currency" indent invertDelta />

          <ComparisonRow label="Key Ratios" current={0} format="currency" isHeader />
          <ComparisonRow label="Debt-to-Asset Ratio" prior={priorDerived?.debtToAssetRatio} current={derived.debtToAssetRatio} format="pct" invertDelta />
          <ComparisonRow label="Housing Cost % of Take-Home" prior={priorDerived?.housingCostPctOfTakeHome} current={derived.housingCostPctOfTakeHome} format="pct" invertDelta />
          <ComparisonRow label="Emergency Fund Months" prior={priorDerived?.emergencyFundMonths} current={derived.emergencyFundMonths} format="plain" />
        </div>
      </div>

      {/* Notes */}
      {quarter.notes && (
        <div className="border border-[var(--ink-line)] rounded-xl p-5">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-2">
            Notes
          </p>
          <p className="text-sm text-[var(--ink-2)] whitespace-pre-wrap">
            {quarter.notes}
          </p>
        </div>
      )}
    </div>
  );
}
