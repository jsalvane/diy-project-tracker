import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { EXPENSE_LABELS, TOOLTIP_STYLE, fmtCurrency } from './chartTheme';
import type { Expenses } from '../../../lib/financialTypes';

interface Props {
  expenses: Expenses;
}

export function ExpenseBreakdown({ expenses }: Props) {
  const entries = Object.entries(expenses) as [keyof Expenses, number][];
  const data = entries
    .map(([key, value]) => ({
      name: EXPENSE_LABELS[key] ?? key,
      value,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const maxVal = data[0]?.value ?? 1;

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-4">
        Expense Breakdown
      </p>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32 + 20)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtCurrency(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#d4d4d8', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            formatter={(value) => [fmtCurrency(Number(value)), 'Amount']}
            {...TOOLTIP_STYLE}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill="#f97316"
                fillOpacity={0.4 + 0.6 * (d.value / maxVal)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
