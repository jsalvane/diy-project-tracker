import { useState } from 'react';
import type { BudgetItem } from '../lib/types';
import { formatCurrency } from '../lib/utils';

type BudgetProps = {
  budgetItems: BudgetItem[];
  addBudgetItem: (data: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudgetItem: (item: BudgetItem) => void;
  deleteBudgetItem: (id: string) => void;
};

type EditCell = { id: string; field: 'name' | 'billAmount' | 'payment' } | null;

const STATUS_CYCLE: BudgetItem['status'][] = ['pending', 'paid', 'partial'];

const STATUS_STYLES: Record<BudgetItem['status'], string> = {
  pending: 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  partial: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
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

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
      <div className="text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Section({
  title,
  items,
  onUpdate,
  onDelete,
  onAdd,
}: {
  title: string;
  items: BudgetItem[];
  onUpdate: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const [editing, setEditing] = useState<EditCell>(null);
  const [editValue, setEditValue] = useState('');

  const totalBill = items.reduce((s, i) => s + i.billAmount, 0);
  const totalPaid = items.reduce((s, i) => s + i.payment, 0);
  const remaining = totalBill - totalPaid;

  function startEdit(item: BudgetItem, field: 'name' | 'billAmount' | 'payment') {
    setEditing({ id: item.id, field });
    setEditValue(
      field === 'name' ? item.name : String(field === 'billAmount' ? item.billAmount : item.payment)
    );
  }

  function commitEdit(item: BudgetItem) {
    if (!editing) return;
    const field = editing.field;
    const updated = { ...item };
    if (field === 'name') {
      updated.name = editValue.trim() || item.name;
    } else {
      const val = parseFloat(editValue);
      if (!isNaN(val) && val >= 0) {
        if (field === 'billAmount') updated.billAmount = val;
        else updated.payment = val;
      }
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
    <div className="mb-10">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
        Due {title === '15' ? '15th' : '30th'}
      </h2>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-900 text-xs uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-right px-4 py-3 font-medium">Bill</th>
              <th className="text-right px-4 py-3 font-medium">Payment</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="w-8 px-2 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
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

                {/* Bill Amount */}
                <td className="px-4 py-2.5 text-right">
                  {editing?.id === item.id && editing.field === 'billAmount' ? (
                    <input
                      autoFocus
                      type="number"
                      min="0"
                      step="0.01"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(item)}
                      onKeyDown={e => e.key === 'Enter' && commitEdit(item)}
                      className={`w-28 text-right ${inputCls}`}
                    />
                  ) : (
                    <span
                      className="cursor-pointer text-gray-800 dark:text-gray-200 hover:text-orange-400 transition-colors"
                      onClick={() => startEdit(item, 'billAmount')}
                    >
                      {formatCurrency(item.billAmount)}
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
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700 text-sm font-semibold">
              <td className="px-4 py-3 text-gray-500 dark:text-zinc-400">Total</td>
              <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(totalBill)}</td>
              <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(totalPaid)}</td>
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

export function MonthlyBudget({ budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem }: BudgetProps) {
  const due15 = budgetItems.filter(i => i.dueGroup === '15').sort((a, b) => a.sortOrder - b.sortOrder);
  const due30 = budgetItems.filter(i => i.dueGroup === '30').sort((a, b) => a.sortOrder - b.sortOrder);

  const totalBill = budgetItems.reduce((s, i) => s + i.billAmount, 0);
  const totalPaid = budgetItems.reduce((s, i) => s + i.payment, 0);
  const remaining = totalBill - totalPaid;

  function handleAdd(dueGroup: '15' | '30') {
    const items = dueGroup === '15' ? due15 : due30;
    addBudgetItem({
      name: 'New bill',
      dueGroup,
      billAmount: 0,
      payment: 0,
      status: 'pending',
      sortOrder: items.length,
    });
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard label="Total Bills" value={formatCurrency(totalBill)} />
        <SummaryCard label="Total Paid" value={formatCurrency(totalPaid)} />
        <SummaryCard
          label="Remaining"
          value={formatCurrency(Math.max(0, remaining))}
          sub={remaining <= 0.005 ? 'All clear!' : undefined}
        />
      </div>

      <Section
        title="15"
        items={due15}
        onUpdate={updateBudgetItem}
        onDelete={deleteBudgetItem}
        onAdd={() => handleAdd('15')}
      />
      <Section
        title="30"
        items={due30}
        onUpdate={updateBudgetItem}
        onDelete={deleteBudgetItem}
        onAdd={() => handleAdd('30')}
      />
    </div>
  );
}
