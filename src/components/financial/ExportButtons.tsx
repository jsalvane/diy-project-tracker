import { useRef, useState } from 'react';
import { deriveMetrics, computeValidationFlags } from '../../lib/financialCalc';
import type { FinancialQuarter } from '../../lib/financialTypes';
import { todayStr } from '../../lib/utils';

interface ExportButtonsProps {
  quarters: FinancialQuarter[];
  activeQuarter: FinancialQuarter | null;
  onImport: (quarters: FinancialQuarter[]) => void;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

export function ExportButtons({ quarters, activeQuarter, onImport }: ExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleCsvExport() {
    if (!activeQuarter) return;
    const derived = deriveMetrics(activeQuarter);
    const flags = computeValidationFlags(activeQuarter, derived, quarters);
    const flagMap = new Map(flags.map((f) => [f.field, f]));

    const rows: string[][] = [
      ['Field', 'Calculated', 'Reported', 'Match', 'Note'],
      ['totalAssets', fmtCurrency(derived.totalAssets), fmtCurrency(activeQuarter.reportedSummaryValues.totalAssets), String(Math.abs(derived.totalAssets - activeQuarter.reportedSummaryValues.totalAssets) <= 0.01), flagMap.get('totalAssets')?.message ?? ''],
      ['totalLiabilities', fmtCurrency(derived.totalLiabilities), fmtCurrency(activeQuarter.reportedSummaryValues.totalLiabilities), String(Math.abs(derived.totalLiabilities - activeQuarter.reportedSummaryValues.totalLiabilities) <= 0.01), flagMap.get('totalLiabilities')?.message ?? ''],
      ['netWorth', fmtCurrency(derived.netWorth), fmtCurrency(activeQuarter.reportedSummaryValues.netWorth), String(Math.abs(derived.netWorth - activeQuarter.reportedSummaryValues.netWorth) <= 0.01), flagMap.get('netWorth')?.message ?? ''],
      ['homeEquity', fmtCurrency(derived.homeEquity), fmtCurrency(activeQuarter.reportedSummaryValues.homeEquity), String(Math.abs(derived.homeEquity - activeQuarter.reportedSummaryValues.homeEquity) <= 0.01), flagMap.get('homeEquity')?.message ?? ''],
      ['totalMonthlyIncome', fmtCurrency(derived.totalMonthlyIncome), fmtCurrency(activeQuarter.reportedSummaryValues.totalMonthlyIncome), String(Math.abs(derived.totalMonthlyIncome - activeQuarter.reportedSummaryValues.totalMonthlyIncome) <= 0.01), flagMap.get('totalMonthlyIncome')?.message ?? ''],
      ['totalMonthlyExpenses', fmtCurrency(derived.totalMonthlyExpenses), fmtCurrency(activeQuarter.reportedSummaryValues.totalMonthlyExpenses), String(Math.abs(derived.totalMonthlyExpenses - activeQuarter.reportedSummaryValues.totalMonthlyExpenses) <= 0.01), flagMap.get('totalMonthlyExpenses')?.message ?? ''],
      ['monthlySurplus', fmtCurrency(derived.monthlySurplus), fmtCurrency(activeQuarter.reportedSummaryValues.monthlySurplus), String(Math.abs(derived.monthlySurplus - activeQuarter.reportedSummaryValues.monthlySurplus) <= 0.01), flagMap.get('monthlySurplus')?.message ?? ''],
      ['cashOnHand', fmtCurrency(activeQuarter.assets.cash), fmtCurrency(activeQuarter.reportedSummaryValues.cashOnHand), String(Math.abs(activeQuarter.assets.cash - activeQuarter.reportedSummaryValues.cashOnHand) <= 0.01), flagMap.get('cashOnHand')?.message ?? ''],
      ['retirementAssets', fmtCurrency(derived.retirementAssets), fmtCurrency(activeQuarter.reportedSummaryValues.retirementAssets), String(Math.abs(derived.retirementAssets - activeQuarter.reportedSummaryValues.retirementAssets) <= 0.01), flagMap.get('retirementAssets')?.message ?? ''],
      ['kidsSavingsTotal', fmtCurrency(derived.kidsSavingsTotal), fmtCurrency(activeQuarter.reportedSummaryValues.kidsSavingsTotal), String(Math.abs(derived.kidsSavingsTotal - activeQuarter.reportedSummaryValues.kidsSavingsTotal) <= 0.01), flagMap.get('kidsSavingsTotal')?.message ?? ''],
      ['debtToAssetRatio', derived.debtToAssetRatio.toFixed(1) + '%', activeQuarter.reportedSummaryValues.debtToAssetRatio.toFixed(1) + '%', String(Math.abs(derived.debtToAssetRatio - activeQuarter.reportedSummaryValues.debtToAssetRatio) <= 0.01), flagMap.get('debtToAssetRatio')?.message ?? ''],
      ['housingCost', fmtCurrency(derived.housingCost), fmtCurrency(activeQuarter.reportedSummaryValues.housingCost), String(Math.abs(derived.housingCost - activeQuarter.reportedSummaryValues.housingCost) <= 0.01), flagMap.get('housingCost')?.message ?? ''],
      ['housingCostPct', derived.housingCostPctOfTakeHome.toFixed(1) + '%', activeQuarter.reportedSummaryValues.housingCostPctOfTakeHome.toFixed(1) + '%', String(Math.abs(derived.housingCostPctOfTakeHome - activeQuarter.reportedSummaryValues.housingCostPctOfTakeHome) <= 0.01), flagMap.get('housingCostPctOfTakeHome')?.message ?? ''],
      ['emergencyFundMonths', derived.emergencyFundMonths.toFixed(1) + ' mo', '', '', ''],
      ['emergencyFundStatus', derived.emergencyFundStatus, activeQuarter.reportedSummaryValues.emergencyFundStatus, '', ''],
    ];

    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadFile(csv, `financial-health-${activeQuarter.quarterLabel.replace(/\s/g, '-')}-${todayStr()}.csv`, 'text/csv');
  }

  function handleJsonExport() {
    const json = JSON.stringify(quarters, null, 2);
    downloadFile(json, `financial-health-export-${todayStr()}.json`, 'application/json');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of quarters');

        const required = ['id', 'quarterLabel', 'dateCaptured', 'assets', 'liabilities', 'income', 'expenses', 'savingsInvesting', 'reportedSummaryValues'];
        for (const item of parsed) {
          for (const field of required) {
            if (!(field in item)) throw new Error(`Missing field "${field}" in at least one quarter`);
          }
        }

        onImport(parsed as FinancialQuarter[]);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Invalid JSON file');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={handleCsvExport}
        disabled={!activeQuarter}
        title="Export current quarter summary as CSV"
        className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Export CSV
      </button>
      <button
        onClick={handleJsonExport}
        disabled={quarters.length === 0}
        title="Export all quarters as JSON"
        className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Export JSON
      </button>
      <button
        onClick={() => { setImportError(null); fileInputRef.current?.click(); }}
        title="Import all quarters from JSON"
        className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
      >
        Import JSON
      </button>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      {importError && (
        <span className="text-xs text-red-500 dark:text-red-400">{importError}</span>
      )}
    </div>
  );
}
