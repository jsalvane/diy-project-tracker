import { useState, useEffect } from 'react';
import type { BudgetItem, CreditCard } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { SimpleFinState } from './CreditCardsTab';

type BudgetProps = {
  budgetItems: BudgetItem[];
  addBudgetItem: (data: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudgetItem: (item: BudgetItem) => void;
  deleteBudgetItem: (id: string) => void;
  creditCards: CreditCard[];
  updateCreditCard: (card: CreditCard) => void;
  simpleFin: SimpleFinState;
};

function useIncome(key: string) {
  const settingsKey = `income_${key}`;
  const [income, setIncomeState] = useState<number>(0);

  useEffect(() => {
    supabase
      .from('budget_settings')
      .select('value')
      .eq('key', settingsKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIncomeState(parseFloat(data.value) || 0);
      });
  }, [settingsKey]);

  async function setIncome(val: number) {
    setIncomeState(val);
    await supabase
      .from('budget_settings')
      .upsert({ key: settingsKey, value: String(val), updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }

  return [income, setIncome] as const;
}

type EditCell = { id: string; field: 'name' | 'payment' } | null;

const STATUS_CYCLE: BudgetItem['status'][] = ['auto', 'manual'];

const STATUS_STYLES: Record<BudgetItem['status'], string> = {
  auto: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  manual: 'bg-[rgba(227,25,55,0.1)] text-[#E31937] dark:bg-[rgba(255,77,92,0.1)] dark:text-[#FF4D5C]',
};

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

function IncomeSummary({ income, bills, onIncomeChange }: { income: number; bills: number; onIncomeChange: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const surplus = income - bills;

  function startEdit() {
    setEditing(true);
    setEditValue(String(income));
  }

  function commit() {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) onIncomeChange(val);
    setEditing(false);
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
      <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-3">
        <div className="text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-1">Income</div>
        {editing ? (
          <input
            autoFocus
            type="number"
            min="0"
            step="0.01"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onFocus={e => e.target.select()}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
            className="w-full bg-[#ffffff] dark:bg-[#161626] border border-[#E31937] dark:border-[#FF4D5C] rounded px-2 py-0.5 text-lg font-bold text-[#0a0a14] dark:text-[#e2e2f0] outline-none"
          />
        ) : (
          <div
            className="text-xl font-bold text-[#0a0a14] dark:text-[#e2e2f0] cursor-pointer hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors"
            onClick={startEdit}
            title="Click to edit income"
          >
            {formatCurrency(income)}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-3">
        <div className="text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-1">Bills</div>
        <div className="text-xl font-bold text-[#0a0a14] dark:text-[#e2e2f0]">{formatCurrency(bills)}</div>
      </div>
      <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] p-3">
        <div className="text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-1">Surplus</div>
        <div className={`text-xl font-bold ${surplus >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(surplus)}
        </div>
      </div>
    </div>
  );
}

const CC_STATUS_CYCLE: CreditCard['billStatus'][] = ['auto', 'manual'];

function getFreshness(lastSynced: string | null): 'fresh' | 'stale' | 'unknown' {
  if (!lastSynced) return 'unknown';
  const diffHrs = (Date.now() - new Date(lastSynced).getTime()) / 3600000;
  return diffHrs < 24 ? 'fresh' : 'stale';
}

function Section({
  title,
  items,
  ccBills,
  income,
  onIncomeChange,
  onUpdate,
  onDelete,
  onAdd,
  onCcUpdate,
  simpleFin,
}: {
  title: string;
  items: BudgetItem[];
  ccBills: CreditCard[];
  income: number;
  onIncomeChange: (v: number) => void;
  onUpdate: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onCcUpdate: (card: CreditCard) => void;
  simpleFin: SimpleFinState;
}) {
  const [editing, setEditing] = useState<EditCell>(null);
  const [editValue, setEditValue] = useState('');
  const [editingCcId, setEditingCcId] = useState<string | null>(null);
  const [editCcValue, setEditCcValue] = useState('');

  const totalBill = items.reduce((s, i) => s + i.payment, 0) + ccBills.reduce((s, c) => s + c.balance, 0);
  const totalPaid = items.reduce((s, i) => s + i.payment, 0);
  const remaining = totalBill - totalPaid;

  function startCcEdit(card: CreditCard) {
    setEditingCcId(card.id);
    setEditCcValue(String(card.balance));
  }

  function commitCcEdit(card: CreditCard) {
    const val = parseFloat(editCcValue);
    if (!isNaN(val) && val >= 0) onCcUpdate({ ...card, balance: val });
    setEditingCcId(null);
  }

  function startEdit(item: BudgetItem, field: 'name' | 'payment') {
    setEditing({ id: item.id, field });
    setEditValue(field === 'name' ? item.name : String(item.payment));
  }

  function commitEdit(item: BudgetItem) {
    if (!editing) return;
    const field = editing.field;
    const updated = { ...item };
    if (field === 'name') {
      updated.name = editValue.trim() || item.name;
    } else {
      const val = parseFloat(editValue);
      if (!isNaN(val) && val >= 0) updated.payment = val;
    }
    onUpdate(updated);
    setEditing(null);
  }

  function cycleStatus(item: BudgetItem) {
    const idx = STATUS_CYCLE.indexOf(item.status);
    onUpdate({ ...item, status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
  }

  const inputCls =
    'bg-[#ffffff] dark:bg-[#161626] border border-[#E31937] dark:border-[#FF4D5C] rounded px-2 py-0.5 text-sm text-[#0a0a14] dark:text-[#e2e2f0] outline-none';

  return (
    <div>
      <h2 className="text-base font-bold text-[#0a0a14] dark:text-[#e2e2f0] mb-3">
        Due {title === '15' ? '15th' : '30th'}
      </h2>

      <IncomeSummary income={income} bills={totalBill} onIncomeChange={onIncomeChange} />

      <div className="rounded-xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f6f6fb] dark:bg-[#0f0f1a] text-xs uppercase tracking-wider text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-right px-4 py-3 font-medium">Payment</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,20,0.05)] dark:divide-[rgba(255,255,255,0.04)]">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">
                  No bills yet
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="group hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)]">
                {/* Name */}
                <td className="px-4 py-2.5">
                  {editing?.id === item.id && editing.field === 'name' ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(item)}
                      className={`w-full ${inputCls}`}
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-gray-800 dark:text-gray-200 hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors"
                      onClick={() => startEdit(item, 'name')}
                    >
                      {item.name}
                    </span>
                  )}
                </td>

                {/* Payment */}
                <td className="px-4 py-2.5 text-right">
                  {editing?.id === item.id && editing.field === 'payment' ? (
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      step="0.01"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onFocus={e => e.target.select()}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(item)}
                      className={`w-28 text-right ${inputCls}`}
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-gray-800 dark:text-gray-200 hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors"
                      onClick={() => startEdit(item, 'payment')}
                    >
                      {formatCurrency(item.payment)}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => cycleStatus(item)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-opacity hover:opacity-80 ${STATUS_STYLES[item.status]}`}
                  >
                    {item.status}
                  </button>
                </td>

                {/* Delete */}
                <td className="px-2 py-2.5 text-center">
                  <button
                    onClick={() => onDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] hover:text-red-500 transition-all"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {ccBills.length > 0 && (
              <>
                <tr className="bg-[#f6f6fb] dark:bg-[#0f0f1a] border-t border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]">
                  <td colSpan={4} className="px-4 py-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">Credit Cards</span>
                  </td>
                </tr>
                {ccBills.map(card => {
                  const isLinked = simpleFin.connected && Object.values(simpleFin.mappings).includes(card.id);
                  const freshness = isLinked ? getFreshness(simpleFin.lastSynced) : null;

                  return (
                    <tr key={card.id} className="hover:bg-[rgba(0,0,20,0.02)] dark:hover:bg-[rgba(255,255,255,0.03)] border-t border-[rgba(0,0,20,0.05)] dark:border-[rgba(255,255,255,0.04)]">
                      <td className="px-4 py-2.5 pl-7">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 dark:text-gray-200">{card.name}</span>
                          {isLinked && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                freshness === 'fresh'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : freshness === 'stale'
                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}
                              title={
                                freshness === 'fresh'
                                  ? `Synced ${new Date(simpleFin.lastSynced!).toLocaleString()}`
                                  : freshness === 'stale'
                                    ? `Last synced ${new Date(simpleFin.lastSynced!).toLocaleString()} — data may be outdated`
                                    : 'SimpleFin linked but never synced'
                              }
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                freshness === 'fresh' ? 'bg-green-500' : freshness === 'stale' ? 'bg-amber-500' : 'bg-zinc-400'
                              }`} />
                              auto
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {editingCcId === card.id ? (
                          <input
                            autoFocus
                            type="number"
                            min="0"
                            step="0.01"
                            value={editCcValue}
                            onChange={e => setEditCcValue(e.target.value)}
                            onBlur={() => commitCcEdit(card)}
                            onKeyDown={e => e.key === 'Enter' && commitCcEdit(card)}
                            className={`w-28 text-right ${inputCls}`}
                          />
                        ) : (
                          <span
                            className="cursor-pointer text-gray-800 dark:text-gray-200 hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors"
                            onClick={() => startCcEdit(card)}
                          >
                            {formatCurrency(card.balance)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => {
                            const idx = CC_STATUS_CYCLE.indexOf(card.billStatus);
                            onCcUpdate({ ...card, billStatus: CC_STATUS_CYCLE[(idx + 1) % CC_STATUS_CYCLE.length] });
                          }}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-opacity hover:opacity-80 ${STATUS_STYLES[card.billStatus]}`}
                        >
                          {card.billStatus}
                        </button>
                      </td>
                      <td />
                    </tr>
                  );
                })}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[#f6f6fb] dark:bg-[#0f0f1a] border-t border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] text-sm font-semibold">
              <td className="px-4 py-3 text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)]">Total</td>
              <td className="px-4 py-3 text-right text-[#0a0a14] dark:text-[#e2e2f0]">{formatCurrency(totalBill)}</td>
              <td colSpan={2} className="px-4 py-3 text-right">
                <span className={remaining > 0.005 ? 'text-[#E31937] dark:text-[#FF4D5C]' : 'text-green-500'}>
                  {remaining > 0.005 ? `${formatCurrency(remaining)} left` : 'Fully paid'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#E31937] dark:text-[#FF4D5C] hover:text-[#C41230] transition-colors"
      >
        <span className="text-lg leading-none">+</span> Add bill
      </button>
    </div>
  );
}

export function MonthlyBudget({ budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem, creditCards, updateCreditCard, simpleFin }: BudgetProps) {
  const due15 = budgetItems.filter(i => i.dueGroup === '15').sort((a, b) => a.sortOrder - b.sortOrder);
  const due30 = budgetItems.filter(i => i.dueGroup === '30').sort((a, b) => a.sortOrder - b.sortOrder);

  const activeCards = creditCards.filter(c => c.status === 'active' && c.billDueGroup);
  const ccDue15 = activeCards.filter(c => c.billDueGroup === '15').sort((a, b) => (a.servicer || '').localeCompare(b.servicer || ''));
  const ccDue30 = activeCards.filter(c => c.billDueGroup === '30').sort((a, b) => (a.servicer || '').localeCompare(b.servicer || ''));

  const [income15, setIncome15] = useIncome('15');
  const [income30, setIncome30] = useIncome('30');

  function handleAdd(dueGroup: '15' | '30') {
    const items = dueGroup === '15' ? due15 : due30;
    addBudgetItem({
      name: 'New bill',
      dueGroup,
      billAmount: 0,
      payment: 0,
      status: 'auto',
      sortOrder: items.length,
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
      <Section
        title="15"
        items={due15}
        ccBills={ccDue15}
        income={income15}
        onIncomeChange={setIncome15}
        onUpdate={updateBudgetItem}
        onDelete={deleteBudgetItem}
        onAdd={() => handleAdd('15')}
        onCcUpdate={updateCreditCard}
        simpleFin={simpleFin}
      />
      <Section
        title="30"
        items={due30}
        ccBills={ccDue30}
        income={income30}
        onIncomeChange={setIncome30}
        onUpdate={updateBudgetItem}
        onDelete={deleteBudgetItem}
        onAdd={() => handleAdd('30')}
        onCcUpdate={updateCreditCard}
        simpleFin={simpleFin}
      />
    </div>
  );
}
