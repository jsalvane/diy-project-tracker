import { useState, useEffect } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { deriveMetrics, syncDerivedValues } from '../lib/financialCalc';
import type { FinancialQuarter } from '../lib/financialTypes';
import { FinancialDashboard } from './financial/FinancialDashboard';
import { QuarterForm } from './financial/QuarterForm';
import { NewQuarterModal } from './financial/NewQuarterModal';
import { ExportButtons } from './financial/ExportButtons';

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function FinancialHealth() {
  const { state, loading, addQuarter, updateQuarter, deleteQuarter, setActiveQuarter, replaceAllQuarters } = useFinancial();
  const [showNewQuarterModal, setShowNewQuarterModal] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState<FinancialQuarter | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sortedDesc = [...state.quarters].sort((a, b) =>
    b.dateCaptured.localeCompare(a.dateCaptured)
  );
  const sortedAsc = [...state.quarters].sort((a, b) =>
    a.dateCaptured.localeCompare(b.dateCaptured)
  );

  const activeQuarter =
    state.quarters.find((q) => q.id === state.activeQuarterId) ?? null;

  const activeIdx = activeQuarter
    ? sortedAsc.findIndex((q) => q.id === activeQuarter.id)
    : -1;
  const priorQuarter = activeIdx > 0 ? sortedAsc[activeIdx - 1] : undefined;
  const mostRecentQuarter = sortedDesc[0] ?? null;

  useEffect(() => {
    setMode('view');
    setShowDeleteConfirm(false);
  }, [state.activeQuarterId]);

  function handleNewQuarter(d: Omit<FinancialQuarter, 'id'>) {
    addQuarter(d);
    setShowNewQuarterModal(false);
    setMode('view');
  }

  function handleEdit() {
    if (!activeQuarter) return;
    setDraft(syncDerivedValues(activeQuarter));
    setMode('edit');
  }

  function handleSave() {
    if (!draft) return;
    updateQuarter(syncDerivedValues(draft));
    setMode('view');
  }

  function handleCancel() {
    setMode('view');
    setDraft(null);
  }

  function handleDeleteConfirmed() {
    if (!activeQuarter) return;
    deleteQuarter(activeQuarter.id);
    setShowDeleteConfirm(false);
    setMode('view');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#6366f1]/20" />
            <div className="absolute inset-0 rounded-full border-t border-[#6366f1] animate-spin" />
          </div>
          <span className="text-[12px] font-medium tracking-[0.06em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)]">
            Loading
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-8">
        <div>
          <h1 className="text-[22px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.035em]">
            Financial Health
          </h1>
          <p className="text-[12px] font-medium text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] mt-0.5 tracking-[0.01em]">
            {state.quarters.length === 0
              ? 'No months tracked yet'
              : `${state.quarters.length} month${state.quarters.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons
            quarters={state.quarters}
            activeQuarter={activeQuarter}
            onImport={replaceAllQuarters}
          />
          <button
            onClick={() => setShowNewQuarterModal(true)}
            className="btn-primary"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
            </svg>
            New Month
          </button>
        </div>
      </div>

      {/* Mobile quarter picker */}
      <div className="sm:hidden mb-4">
        {sortedDesc.length > 0 && (
          <select
            value={state.activeQuarterId ?? ''}
            onChange={(e) => { setActiveQuarter(e.target.value || null); setMode('view'); }}
            className="field"
          >
            {sortedDesc.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quarterLabel} — {fmtCurrency(deriveMetrics(q).netWorth)}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-6">
        {/* Quarter sidebar — desktop only */}
        <aside className="w-44 shrink-0 hidden sm:block">
          <div className="space-y-0.5">
            {sortedDesc.length === 0 ? (
              <p className="text-[12px] text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] px-2 py-4 text-center">
                No months yet.<br />Create one to start.
              </p>
            ) : (
              sortedDesc.map((q) => {
                const d = deriveMetrics(q);
                const isActive = q.id === state.activeQuarterId;
                return (
                  <button
                    key={q.id}
                    onClick={() => { setActiveQuarter(q.id); setMode('view'); }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[rgba(99,102,241,0.08)] dark:bg-[rgba(129,140,248,0.08)] border border-[rgba(99,102,241,0.2)] dark:border-[rgba(129,140,248,0.15)]'
                        : 'hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
                    }`}
                  >
                    <p className={`text-[13px] font-semibold leading-tight tracking-[-0.01em] ${
                      isActive
                        ? 'text-[#6366f1] dark:text-[#818cf8]'
                        : 'text-[#0a0a14] dark:text-[#e2e2f0]'
                    }`}>
                      {q.quarterLabel}
                    </p>
                    <p className="text-[11px] tabular-nums text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5">
                      {fmtCurrency(d.netWorth)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {!activeQuarter ? (
            <div className="text-center py-20 border border-dashed border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(99,102,241,0.1)] dark:bg-[rgba(129,140,248,0.1)] flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366f1] dark:text-[#818cf8]">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.015em] mb-1.5">
                No months yet
              </p>
              <p className="text-[13px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mb-6">
                Create your first month to start tracking your financial health.
              </p>
              <button onClick={() => setShowNewQuarterModal(true)} className="btn-primary mx-auto">
                Create First Month
              </button>
            </div>
          ) : mode === 'edit' && draft ? (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[16px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.02em]">
                  Editing {activeQuarter.quarterLabel}
                </h2>
              </div>
              <QuarterForm
                quarter={draft}
                onChange={setDraft}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          ) : (
            <>
              {showDeleteConfirm && (
                <div className="border border-[rgba(220,38,38,0.2)] dark:border-[rgba(248,113,113,0.15)] bg-[rgba(220,38,38,0.04)] dark:bg-[rgba(248,113,113,0.05)] rounded-xl p-4 flex items-center justify-between gap-4 mb-5">
                  <p className="text-[13px] text-[rgba(10,10,20,0.7)] dark:text-[rgba(226,226,240,0.65)]">
                    Delete <strong>{activeQuarter.quarterLabel}</strong>? This cannot be undone.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost text-[12px] px-3 py-1.5">
                      Cancel
                    </button>
                    <button onClick={handleDeleteConfirmed} className="btn-danger text-[12px] px-3 py-1.5">
                      Delete
                    </button>
                  </div>
                </div>
              )}
              <FinancialDashboard
                quarter={activeQuarter}
                priorQuarter={priorQuarter}
                allQuarters={sortedAsc}
                onEdit={handleEdit}
                onDelete={() => setShowDeleteConfirm(true)}
              />
            </>
          )}
        </main>
      </div>

      {showNewQuarterModal && (
        <NewQuarterModal
          previousQuarter={mostRecentQuarter}
          onConfirm={handleNewQuarter}
          onCancel={() => setShowNewQuarterModal(false)}
        />
      )}
    </div>
  );
}
