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

  // Reset to view mode when active quarter changes
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 dark:text-zinc-500">Loading financial data…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Financial Health
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
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
            className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
          >
            + New Month
          </button>
        </div>
      </div>

      {/* Mobile quarter picker */}
      <div className="sm:hidden mb-4">
        {sortedDesc.length > 0 && (
          <select
            value={state.activeQuarterId ?? ''}
            onChange={(e) => {
              setActiveQuarter(e.target.value || null);
              setMode('view');
            }}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
        <aside className="w-48 shrink-0 hidden sm:block">
          <div className="space-y-1">
            {sortedDesc.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500 px-2 py-4 text-center">
                No quarters yet.
                <br />
                Create one to get started.
              </p>
            ) : (
              sortedDesc.map((q) => {
                const d = deriveMetrics(q);
                const isActive = q.id === state.activeQuarterId;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setActiveQuarter(q.id);
                      setMode('view');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40'
                        : 'hover:bg-gray-50 dark:hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold leading-tight ${
                        isActive
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      {q.quarterLabel}
                    </p>
                    <p className="text-xs tabular-nums text-gray-500 dark:text-zinc-400 mt-0.5">
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
            <div className="text-center py-20 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
              <div className="text-4xl mb-3 opacity-30">📊</div>
              <p className="text-base font-semibold text-gray-700 dark:text-zinc-300">
                No months yet
              </p>
              <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1 mb-4">
                Create your first month to start tracking your financial health.
              </p>
              <button
                onClick={() => setShowNewQuarterModal(true)}
                className="px-5 py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Create First Month
              </button>
            </div>
          ) : mode === 'edit' && draft ? (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Editing {activeQuarter.quarterLabel} snapshot
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
              {/* Delete confirm banner */}
              {showDeleteConfirm && (
                <div className="border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 rounded-xl p-4 flex items-center justify-between gap-4 mb-5">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Delete <strong>{activeQuarter.quarterLabel}</strong>? This cannot be undone.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirmed}
                      className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
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
