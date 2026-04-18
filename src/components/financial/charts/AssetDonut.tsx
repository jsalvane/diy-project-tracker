import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ASSET_COLORS, ASSET_LABELS, TOOLTIP_STYLE, fmtCurrency } from './chartTheme';
import type { Assets } from '../../../lib/financialTypes';

interface Props {
  assets: Assets;
  totalAssets: number;
}

export function AssetDonut({ assets, totalAssets }: Props) {
  const raw = [
    assets.cash,
    assets.retirement401k,
    assets.rothIras,
    assets.hsa,
    assets.k1Savings,
    assets.k1529,
    assets.homeValue,
    assets.vehicles,
    assets.otherAssets,
  ];

  const data = raw
    .map((value, i) => ({ name: ASSET_LABELS[i], value, color: ASSET_COLORS[i] }))
    .filter((d) => d.value > 0);

  return (
    <div className="border border-[var(--ink-line)] rounded-xl p-5">
      <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-widest mb-2">
        Asset Allocation
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
              {fmtCurrency(totalAssets)}
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
