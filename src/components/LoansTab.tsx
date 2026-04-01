import { useState } from 'react';
import type { Loan, LoanPayment } from '../lib/types';
import { formatCurrency, formatDate, todayStr } from '../lib/utils';

type Props = {
  loans: Loan[];
  loanPayments: LoanPayment[];
  addLoan: (data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLoan: (loan: Loan) => void;
  deleteLoan: (id: string) => void;
  addLoanPayment: (data: Omit<LoanPayment, 'id' | 'createdAt'>) => void;
  deleteLoanPayment: (id: string) => void;
};

interface LoanForm {
  name: string;
  owner: string;
  balance: string;
  interestRate: string;
}

interface PaymentForm {
  loanId: string;
  paymentDate: string;
  amount: string;
}

const DEFAULT_LOAN_FORM: LoanForm = { name: '', owner: '', balance: '', interestRate: '' };

function monthsToPayoff(balance: number, annualRatePct: number, monthlyPayment: number): number | null {
  if (monthlyPayment <= 0 || balance <= 0) return null;
  const r = annualRatePct / 100 / 12;
  if (r < 0.000001) return Math.ceil(balance / monthlyPayment);
  const ratio = (balance * r) / monthlyPayment;
  if (ratio >= 1) return null; // payment doesn't cover interest
  return Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r));
}

function accrueToDate(balance: number, annualRatePct: number, fromDate: string, toDate: string): number {
  const dailyRate = annualRatePct / 100 / 365;
  if (dailyRate < 1e-10) return balance;
  const from = new Date(fromDate + 'T00:00:00');
  const to   = new Date(toDate   + 'T00:00:00');
  const days = Math.round((to.getTime() - from.getTime()) / 86400000);
  if (days <= 0) return balance;
  return balance + balance * dailyRate * days;
}

function addMonthsLabel(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 transition-colors';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1';

function LoanModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Loan;
  onSave: (form: LoanForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<LoanForm>(
    initial
      ? { name: initial.name, owner: initial.owner, balance: String(initial.balance), interestRate: String(initial.interestRate) }
      : DEFAULT_LOAN_FORM
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{initial ? 'Edit Loan' : 'Add Loan'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Loan Name *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Joe - SL 1" required />
          </div>
          <div>
            <label className={labelCls}>Owner</label>
            <input className={inputCls} value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} placeholder="e.g. Joe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Current Balance ($)</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} onFocus={e => e.target.select()} placeholder="0.00" required />
            </div>
            <div>
              <label className={labelCls}>Interest Rate (%)</label>
              <input className={inputCls} type="number" min="0" step="0.001" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} onFocus={e => e.target.select()} placeholder="5.00" required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors">
              {initial ? 'Save Changes' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({
  loans,
  onSave,
  onClose,
}: {
  loans: Loan[];
  onSave: (form: PaymentForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PaymentForm>({
    loanId: loans[0]?.id ?? '',
    paymentDate: todayStr(),
    amount: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.loanId || !form.amount) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Log Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Loan *</label>
            <select className={inputCls} value={form.loanId} onChange={e => setForm(f => ({ ...f, loanId: e.target.value }))} required>
              {loans.map(l => (
                <option key={l.id} value={l.id}>{l.name}{l.owner ? ` (${l.owner})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Payment Date *</label>
            <input className={inputCls} type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>Amount ($) *</label>
            <input className={inputCls} type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} onFocus={e => e.target.select()} placeholder="0.00" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors">
              Log Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoansTab({ loans, loanPayments, addLoan, updateLoan, deleteLoan, addLoanPayment, deleteLoanPayment }: Props) {
  const [loanModal, setLoanModal] = useState<null | 'add' | Loan>(null);
  const [paymentModal, setPaymentModal] = useState(false);

  const today = todayStr();
  const totalBalance = loans.reduce((s, l) =>
    s + accrueToDate(l.balance, l.interestRate, l.balanceDate, today), 0
  );
  const totalPaidThisYear = loanPayments
    .filter(p => p.paymentDate.startsWith(new Date().getFullYear().toString()))
    .reduce((s, p) => s + p.amount, 0);

  function avgRecentPayment(loanId: string): number {
    const payments = loanPayments.filter(p => p.loanId === loanId).slice(0, 3);
    if (payments.length === 0) return 0;
    return payments.reduce((s, p) => s + p.amount, 0) / payments.length;
  }

  // Latest projected payoff across all loans
  const projections = loans.map(l => {
    const avg = avgRecentPayment(l.id);
    const months = monthsToPayoff(l.balance, l.interestRate, avg);
    return months;
  }).filter((m): m is number => m !== null);
  const maxMonths = projections.length > 0 ? Math.max(...projections) : null;

  function handleLoanSave(form: LoanForm) {
    const data = {
      name: form.name.trim(),
      owner: form.owner.trim(),
      balance: parseFloat(form.balance) || 0,
      interestRate: parseFloat(form.interestRate) || 0,
      sortOrder: loans.length,
      balanceDate: todayStr(),
    };
    if (loanModal && typeof loanModal === 'object') {
      updateLoan({ ...loanModal, ...data });
    } else {
      addLoan(data);
    }
    setLoanModal(null);
  }

  function handlePaymentSave(form: PaymentForm) {
    addLoanPayment({
      loanId: form.loanId,
      paymentDate: form.paymentDate,
      amount: parseFloat(form.amount) || 0,
    });
    setPaymentModal(false);
  }

  const thCls = 'text-left px-4 py-3 font-medium text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500';
  const tdCls = 'px-4 py-3 text-sm text-gray-800 dark:text-gray-200';

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Total Balance</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalBalance)}</div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{loans.length} loan{loans.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Paid This Year</div>
          <div className="text-2xl font-bold text-green-500">{formatCurrency(totalPaidThisYear)}</div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{new Date().getFullYear()}</div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Est. Debt-Free</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {maxMonths !== null ? addMonthsLabel(maxMonths) : '—'}
          </div>
          <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">based on recent payments</div>
        </div>
      </div>

      {/* Loans table header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Loans</h2>
        <button
          onClick={() => setLoanModal('add')}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
        >
          <span className="text-base leading-none">+</span> Add Loan
        </button>
      </div>

      {/* Loans table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-900">
              <th className={thCls}>Loan</th>
              <th className={thCls}>Owner</th>
              <th className={`${thCls} text-right`}>Balance</th>
              <th className={`${thCls} text-right`}>Rate</th>
              <th className={`${thCls} text-right`}>Avg Payment</th>
              <th className={`${thCls} text-right`}>Payoff</th>
              <th className="w-16 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {loans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-500">
                  No loans yet
                </td>
              </tr>
            )}
            {loans.map(loan => {
              const currentBalance = accrueToDate(loan.balance, loan.interestRate, loan.balanceDate, today);
              const avg = avgRecentPayment(loan.id);
              const months = monthsToPayoff(currentBalance, loan.interestRate, avg);
              const payoffLabel = months !== null ? addMonthsLabel(months) : avg > 0 ? 'Interest > payment' : '—';
              const paymentCount = loanPayments.filter(p => p.loanId === loan.id).length;

              return (
                <tr key={loan.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-900/40">
                  <td className={`${tdCls} font-medium`}>{loan.name}</td>
                  <td className={tdCls}>{loan.owner || '—'}</td>
                  <td className={`${tdCls} text-right font-semibold`}>{formatCurrency(currentBalance)}</td>
                  <td className={`${tdCls} text-right`}>{loan.interestRate.toFixed(3)}%</td>
                  <td className={`${tdCls} text-right`}>
                    {avg > 0 ? (
                      <span title={`Based on last ${Math.min(paymentCount, 3)} payment${paymentCount !== 1 ? 's' : ''}`}>
                        {formatCurrency(avg)}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-zinc-500 text-xs">No history</span>
                    )}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <span className={months !== null ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-zinc-500'}>
                      {payoffLabel}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setLoanModal(loan)} className="p-1 text-gray-400 hover:text-orange-400 transition-colors">
                        <PencilIcon />
                      </button>
                      <button onClick={() => deleteLoan(loan.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment History */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Payment History</h2>
        <button
          onClick={() => setPaymentModal(true)}
          disabled={loans.length === 0}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border border-orange-400 text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-base leading-none">+</span> Log Payment
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-900">
              <th className={thCls}>Date</th>
              <th className={thCls}>Loan</th>
              <th className={`${thCls} text-right`}>Amount</th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {loanPayments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-zinc-500">
                  No payments logged yet
                </td>
              </tr>
            )}
            {loanPayments.map(payment => {
              const loan = loans.find(l => l.id === payment.loanId);
              return (
                <tr key={payment.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-900/40">
                  <td className={tdCls}>{formatDate(payment.paymentDate)}</td>
                  <td className={tdCls}>
                    {loan ? (
                      <span>
                        {loan.name}
                        {loan.owner && <span className="text-gray-400 dark:text-zinc-500 ml-1">({loan.owner})</span>}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-zinc-500">Unknown</span>
                    )}
                  </td>
                  <td className={`${tdCls} text-right font-semibold text-green-600 dark:text-green-400`}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => deleteLoanPayment(payment.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {loanPayments.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 font-semibold text-sm">
                <td colSpan={2} className="px-4 py-3 text-gray-500 dark:text-zinc-400">
                  Total ({loanPayments.length} payment{loanPayments.length !== 1 ? 's' : ''})
                </td>
                <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                  {formatCurrency(loanPayments.reduce((s, p) => s + p.amount, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {loanModal && (
        <LoanModal
          initial={typeof loanModal === 'object' ? loanModal : undefined}
          onSave={handleLoanSave}
          onClose={() => setLoanModal(null)}
        />
      )}
      {paymentModal && (
        <PaymentModal
          loans={loans}
          onSave={handlePaymentSave}
          onClose={() => setPaymentModal(false)}
        />
      )}
    </div>
  );
}
