import { deriveMetrics } from '../../lib/financialCalc';
import type { FinancialQuarter } from '../../lib/financialTypes';
import { TrendBar } from './TrendBar';

interface HistoryViewProps {
  quarters: FinancialQuarter[];
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function HistoryView({ quarters }: HistoryViewProps) {
  if (quarters.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-medium text-[var(--ink-4)]">No history yet</p>
        <p className="text-sm text-[var(--ink-4)] mt-1">
          Create your first quarter to start tracking trends.
        </p>
      </div>
    );
  }

  const sorted = [...quarters].sort((a, b) =>
    a.dateCaptured.localeCompare(b.dateCaptured)
  );
  const derivedAll = sorted.map((q) => ({ q, d: deriveMetrics(q) }));

  const maxNetWorth = Math.max(...derivedAll.map((x) => x.d.netWorth), 1);
  const maxAssets = Math.max(...derivedAll.map((x) => x.d.totalAssets), 1);
  const maxLiabilities = Math.max(...derivedAll.map((x) => x.d.totalLiabilities), 1);
  const maxRetirement = Math.max(...derivedAll.map((x) => x.d.retirementAssets), 1);
  const maxSurplus = Math.max(...derivedAll.map((x) => Math.abs(x.d.monthlySurplus)), 1);

  return (
    <div className="space-y-6">
      {/* Summary table */}
      <div className="border border-[var(--ink-line)] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--ink-line)]">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest">
            Quarter-over-Quarter Summary
          </p>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-[var(--ink-line)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider">
                  Quarter
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider tabular-nums">
                  Net Worth
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider tabular-nums">
                  Total Assets
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider tabular-nums">
                  Total Liab.
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider tabular-nums">
                  Mo. Surplus
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider tabular-nums">
                  Debt/Asset
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider tabular-nums">
                  EF Months
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider tabular-nums">
                  Retirement
                </th>
              </tr>
            </thead>
            <tbody>
              {derivedAll.map(({ q, d }, i) => {
                const prevD = i > 0 ? derivedAll[i - 1].d : undefined;
                const nwDelta = prevD ? d.netWorth - prevD.netWorth : undefined;
                return (
                  <tr
                    key={q.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">
                      <div>{q.quarterLabel}</div>
                      <div className="text-xs font-normal text-[var(--ink-4)]">
                        {q.dateCaptured}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <div className="font-semibold text-[var(--ink)]">
                        {fmtCurrency(d.netWorth)}
                      </div>
                      {nwDelta !== undefined && (
                        <div
                          className={`text-xs tabular-nums ${
                            nwDelta >= 0
                              ? 'text-[var(--moss)]'
                              : 'text-[var(--rust)]'
                          }`}
                        >
                          {nwDelta >= 0 ? '+' : ''}
                          {fmtCurrency(nwDelta)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--ink-2)]">
                      {fmtCurrency(d.totalAssets)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--ink-2)]">
                      {fmtCurrency(d.totalLiabilities)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums font-medium ${
                        d.monthlySurplus >= 0
                          ? 'text-[var(--moss)]'
                          : 'text-[var(--rust)]'
                      }`}
                    >
                      {fmtCurrency(d.monthlySurplus)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--ink-2)]">
                      {Math.round(d.debtToAssetRatio)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--ink-2)]">
                      {Math.round(d.emergencyFundMonths)} mo
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--ink-2)]">
                      {fmtCurrency(d.retirementAssets)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Net Worth Trend */}
      <div className="border border-[var(--ink-line)] rounded-xl p-5">
        <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
          Net Worth Trend
        </p>
        <div className="space-y-2.5">
          {derivedAll.map(({ q, d }, i) => {
            const prevD = i > 0 ? derivedAll[i - 1].d : undefined;
            const delta = prevD ? d.netWorth - prevD.netWorth : undefined;
            return (
              <TrendBar
                key={q.id}
                label={q.quarterLabel}
                value={d.netWorth}
                maxValue={maxNetWorth}
                formattedValue={fmtCurrency(d.netWorth)}
                delta={delta}
                formattedDelta={
                  delta !== undefined
                    ? (delta >= 0 ? '+' : '') + fmtCurrency(delta)
                    : undefined
                }
                color="bg-orange-500"
              />
            );
          })}
        </div>
      </div>

      {/* Assets vs Liabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="border border-[var(--ink-line)] rounded-xl p-5">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
            Total Assets
          </p>
          <div className="space-y-2.5">
            {derivedAll.map(({ q, d }) => (
              <TrendBar
                key={q.id}
                label={q.quarterLabel}
                value={d.totalAssets}
                maxValue={maxAssets}
                formattedValue={fmtCurrency(d.totalAssets)}
                color="bg-green-500"
              />
            ))}
          </div>
        </div>
        <div className="border border-[var(--ink-line)] rounded-xl p-5">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
            Total Liabilities
          </p>
          <div className="space-y-2.5">
            {derivedAll.map(({ q, d }) => (
              <TrendBar
                key={q.id}
                label={q.quarterLabel}
                value={d.totalLiabilities}
                maxValue={maxLiabilities}
                formattedValue={fmtCurrency(d.totalLiabilities)}
                color="bg-[rgba(184,69,31,0.05)]0"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Retirement Assets + Monthly Surplus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="border border-[var(--ink-line)] rounded-xl p-5">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
            Retirement Assets
          </p>
          <div className="space-y-2.5">
            {derivedAll.map(({ q, d }) => (
              <TrendBar
                key={q.id}
                label={q.quarterLabel}
                value={d.retirementAssets}
                maxValue={maxRetirement}
                formattedValue={fmtCurrency(d.retirementAssets)}
                color="bg-blue-500"
              />
            ))}
          </div>
        </div>
        <div className="border border-[var(--ink-line)] rounded-xl p-5">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
            Monthly Surplus
          </p>
          <div className="space-y-2.5">
            {derivedAll.map(({ q, d }) => (
              <TrendBar
                key={q.id}
                label={q.quarterLabel}
                value={d.monthlySurplus}
                maxValue={maxSurplus}
                formattedValue={fmtCurrency(d.monthlySurplus)}
                color="bg-emerald-500"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Debt-to-Asset Ratio trend */}
      <div className="border border-[var(--ink-line)] rounded-xl p-5">
        <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
          Debt-to-Asset Ratio (lower is better)
        </p>
        <div className="space-y-2.5">
          {derivedAll.map(({ q, d }, i) => {
            const prevD = i > 0 ? derivedAll[i - 1].d : undefined;
            const delta = prevD ? d.debtToAssetRatio - prevD.debtToAssetRatio : undefined;
            return (
              <TrendBar
                key={q.id}
                label={q.quarterLabel}
                value={d.debtToAssetRatio}
                maxValue={100}
                formattedValue={Math.round(d.debtToAssetRatio) + '%'}
                delta={delta !== undefined ? -delta : undefined}
                formattedDelta={
                  delta !== undefined
                    ? (delta <= 0 ? '' : '+') + Math.round(delta) + '%'
                    : undefined
                }
                color="bg-[rgba(176,122,26,0.05)]0"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
