import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TOOLTIP_STYLE, fmtCurrency } from './chartTheme';

interface Props {
  data: { label: string; assets: number; liabilities: number }[];
}

export function AssetsLiabilitiesTrend({ data }: Props) {
  return (
    <div className="border border-[var(--ink-line)] rounded-xl p-5">
      <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
        Assets vs Liabilities
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="assetsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="liabGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
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
              name === 'assets' ? 'Assets' : 'Liabilities',
            ]}
            {...TOOLTIP_STYLE}
          />
          <Legend
            formatter={(v) => (v === 'assets' ? 'Assets' : 'Liabilities')}
            wrapperStyle={{ fontSize: 12, color: '#a1a1aa' }}
          />
          <Area
            type="monotone"
            dataKey="assets"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#assetsGrad)"
            dot={{ r: 3, fill: '#22c55e', stroke: '#18181b', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="liabilities"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#liabGrad)"
            dot={{ r: 3, fill: '#ef4444', stroke: '#18181b', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
