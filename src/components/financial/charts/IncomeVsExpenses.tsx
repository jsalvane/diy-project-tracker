import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TOOLTIP_STYLE, fmtCurrency } from './chartTheme';

interface Props {
  data: { label: string; income: number; expenses: number }[];
}

export function IncomeVsExpenses({ data }: Props) {
  return (
    <div className="border border-[var(--ink-line)] rounded-xl p-5">
      <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
        Income vs Expenses
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
          <XAxis
            dataKey="label"
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            axisLine={{ stroke: '#3f3f46' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#a1a1aa', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtCurrency(v)}
            width={90}
          />
          <Tooltip
            formatter={(value, name) => [
              fmtCurrency(Number(value)),
              name === 'income' ? 'Income' : 'Expenses',
            ]}
            {...TOOLTIP_STYLE}
          />
          <Legend
            formatter={(value) => (value === 'income' ? 'Income' : 'Expenses')}
            wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
          />
          <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
