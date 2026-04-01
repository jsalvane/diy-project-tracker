import { useState, useEffect } from 'react';
import type { BudgetItem, CreditCard } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { supabase } from '../lib/supabase';

type BudgetProps = {
  budgetItems: BudgetItem[];
  addBudgetItem: (data: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudgetItem: (item: BudgetItem) => void;
  deleteBudgetItem: (id: string) => void;
  creditCards: CreditCard[];
  updateCreditCard: (card: CreditCard) => void;
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
  manual: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
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
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3">
        <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Income</div>
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
            className="w-full bg-white dark:bg-zinc-800 border border-orange-400 rounded px-2 py-0.5 text-lg font-bold text-gray-900 dark:text-white outline-none"
          />
        ) : (
          <div
            className="text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-orange-400 transition-colors"
            onClick={startEdit}
            title="Click to edit income"
          >
            {formatCurrency(income)}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3">
        <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Bills</div>
        <div className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(bills)}</div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3">
        <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">Surplus</div>
        <div className={`text-xl font-bold ${surplus >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(surplus)}
        </div>
      </div>
    </div>
  );
}

const CC_STATUS_CYCLE: CreditCard['billStatus'][] = ['auto', 'manual'];

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
    'bg-white dark:bg-zinc-800 border border-orange-400 rounded px-2 py-0.5 text-sm text-gray-900 dark:text-white outline-none';

  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
        Due {title === '15' ? '15th' : '30th'}
      </h2>

      <IncomeSummary income={income} bills={totalBill} onIncomeChange={onIncomeChange} />

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-900 text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-right px-4 py-3 font-medium">Payment</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
                  No bills yet
                </td>
              </tr>
            )}
            {items.map(item => (
              <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-zinc-900/40">
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
                      className="cursor-pointer text-gray-800 dark:text-gray-200 hover:text-orange-400 transition-colors"
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
                      className="cursor-pointer text-gray-800 dark:text-gray-200 hover:text-orange-400 transition-colors"
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
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {ccBills.length > 0 && (
              <>
                <tr className="bg-gray-50 dark:bg-zinc-900/60 border-t border-gray-200 dark:border-zinc-800">
                  <td colSpan={4} className="px-4 py-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Credit Cards</span>
                  </td>
                </tr>
                {ccBills.map(card => (
                  <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 border-t border-gray-100 dark:border-zinc-800/60">
                    <td className="px-4 py-2.5 pl-7 text-gray-800 dark:text-gray-200">{card.name}</td>
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
                          className="cursor-pointer text-gray-800 dark:text-gray-200 hover:text-orange-400 transition-colors"
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
                ))}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 text-sm font-semibold">
              <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">Total</td>
              <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(totalBill)}</td>
              <td colSpan={2} className="px-4 py-3 text-right">
                <span className={remaining > 0.005 ? 'text-orange-400' : 'text-green-500'}>
                  {remaining > 0.005 ? `${formatCurrency(remaining)} left` : 'Fully paid'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button
        onClick={onAdd}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
      >
        <span className="text-lg leading-none">+</span> Add bill
      </button>
    </div>
  );
}

export function MonthlyBudget({ budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem, creditCards, updateCreditCard }: BudgetProps) {
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
    <div className="grid grid-cols-2 gap-8">
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
      />
    </div>
  );
}
