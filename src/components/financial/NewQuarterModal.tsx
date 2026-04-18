import { useState } from 'react';
import { todayStr } from '../../lib/utils';
import type { FinancialQuarter } from '../../lib/financialTypes';

interface NewQuarterModalProps {
  previousQuarter: FinancialQuarter | null;
  onConfirm: (draft: Omit<FinancialQuarter, 'id'>) => void;
  onCancel: () => void;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function nextMonthLabel(label: string): string {
  const match = label.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i);
  if (!match) return '';
  const idx = MONTHS.findIndex((m) => m.toLowerCase() === match[1].toLowerCase());
  if (idx === -1) return '';
  const year = parseInt(match[2], 10);
  return idx < 11 ? `${MONTHS[idx + 1]} ${year}` : `${MONTHS[0]} ${year + 1}`;
}

function suggestNextMonth(previousLabel: string): string {
  const fromPrev = nextMonthLabel(previousLabel);
  if (fromPrev) return fromPrev;
  const now = new Date();
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold tracking-[0.06em] uppercase text-[var(--ink-4)] mb-1.5">
      {children}
    </label>
  );
}

export function NewQuarterModal({ previousQuarter, onConfirm, onCancel }: NewQuarterModalProps) {
  const suggested = previousQuarter ? suggestNextMonth(previousQuarter.quarterLabel) : '';
  const [label, setLabel] = useState(suggested);
  const [date, setDate] = useState(todayStr());

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(26,22,18,0.45)]  animate-fade-in p-4">
      <div
        className="bg-[var(--paper)] border border-[var(--ink-line)] rounded-[14px] shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-md animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ink-line)]">
          <h2 className="text-[14px] font-semibold text-[var(--ink)] tracking-[-0.015em]">New Month</h2>
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--ink-4)] hover:text-[var(--ink-3)] hover:bg-[var(--paper-2)] transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          {previousQuarter ? (
            <p className="text-[12.5px] text-[var(--ink-3)] mb-5 leading-relaxed">
              Cloning from <strong className="text-[var(--ink)]">{previousQuarter.quarterLabel}</strong>. All values are carried forward — update any that changed. Retirement YTD is reset to 0.
            </p>
          ) : (
            <p className="text-[12.5px] text-[var(--ink-3)] mb-5">
              No previous month to clone from. Starting with blank values.
            </p>
          )}

          <div className="space-y-4">
            <div>
              <FieldLabel>Month Label</FieldLabel>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Apr 2026"
                className="field"
                autoFocus
              />
            </div>
            <div>
              <FieldLabel>Date Captured</FieldLabel>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={onCancel} className="btn-ghost">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={!label.trim()}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Month
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
