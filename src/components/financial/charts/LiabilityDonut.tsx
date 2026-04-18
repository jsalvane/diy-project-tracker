import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LIABILITY_COLORS, LIABILITY_LABELS, TOOLTIP_STYLE, fmtCurrency } from './chartTheme';
import type { Liabilities } from '../../../lib/financialTypes';

interface Props {
  liabilities: Liabilities;
  totalLiabilities: number;
}

export function LiabilityDonut({ liabilities, totalLiabilities }: Props) {
  const raw = [
    liabilities.mortgage,
    liabilities.creditCards,
    liabilities.autoLoans,
    liabilities.studentLoansJ,
    liabilities.studentLoansK,
    liabilities.otherDebt,
  ];

  const data = raw
    .map((value, i) => ({ name: LIABILITY_LABELS[i], value, color: LIABILITY_COLORS[i] }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="border border-[var(--ink-line)] rounded-xl p-5 flex flex-col items-center justify-center" style={{ minHeight: 320 }}>
        <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-4">
          Liability Breakdown
        </p>
        <p className="text-lg font-bold text-[var(--moss)]">Debt Free</p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--ink-line)] rounded-xl p-5">
      <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-2">
        Liability Breakdown
      </p>
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              dataKey="value"
              stroke="#18181b"
              strokeWidth={2}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => fmtCurrency(Number(value))}
              {...TOOLTIP_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--ink)] tabular-nums">
              {fmtCurrency(totalLiabilities)}
            </p>
            <p className="text-[10px] text-[var(--ink-4)] uppercase">Total</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--ink-4)]">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
