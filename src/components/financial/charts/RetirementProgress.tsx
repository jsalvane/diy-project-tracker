import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TOOLTIP_STYLE, fmtCurrency } from './chartTheme';

interface Props {
  trendData: { label: string; retirement: number }[];
  annualTarget: number;
  annualYtd: number;
}

export function RetirementProgress({ trendData, annualTarget, annualYtd }: Props) {
  const pct = annualTarget > 0 ? Math.min((annualYtd / annualTarget) * 100, 100) : 0;

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-4">
        Retirement Progress
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            formatter={(value) => [fmtCurrency(Number(value)), 'Retirement Assets']}
            {...TOOLTIP_STYLE}
          />
          <Line
            type="monotone"
            dataKey="retirement"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#3b82f6', stroke: '#18181b', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {annualTarget > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
            <span>Annual Retirement YTD</span>
            <span className="tabular-nums">
              {fmtCurrency(annualYtd)} / {fmtCurrency(annualTarget)} ({pct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                backgroundColor: pct >= 100 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#f59e0b',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
