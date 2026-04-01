import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { TOOLTIP_STYLE, fmtCurrency } from './chartTheme';

interface Props {
  data: { label: string; netWorth: number }[];
  activeLabel?: string;
}

export function NetWorthTrend({ data, activeLabel }: Props) {
  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-4">
        Net Worth Trend
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
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
            formatter={(value) => [fmtCurrency(Number(value)), 'Net Worth']}
            {...TOOLTIP_STYLE}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#f97316"
            strokeWidth={2.5}
            fill="url(#nwGradient)"
            dot={{ r: 4, fill: '#f97316', stroke: '#18181b', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#f97316', stroke: '#fff', strokeWidth: 2 }}
          />
          {activeLabel && data.length > 1 && (() => {
            const pt = data.find((d) => d.label === activeLabel);
            if (!pt) return null;
            return (
              <ReferenceDot
                x={pt.label}
                y={pt.netWorth}
                r={8}
                fill="#f97316"
                stroke="#fff"
                strokeWidth={2}
              />
            );
          })()}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
