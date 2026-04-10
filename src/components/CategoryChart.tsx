import type { Entry } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface Props {
  entries: Entry[];
}

// Palette: minimal, single-family color ramp
const COLORS = [
  '#FF4D5C', // indigo-400
  '#a78bfa', // violet-400
  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#fb923c', // orange-400
  '#f472b6', // pink-400
  '#4ade80', // green-400
  '#facc15', // yellow-400
];

export function CategoryChart({ entries }: Props) {
  const map = new Map<string, number>();
  for (const e of entries) {
    const cat = e.category.trim() || 'Uncategorized';
    map.set(cat, (map.get(cat) ?? 0) + e.price);
  }

  const items = [...map.entries()]
    .map(([cat, total]) => ({ cat, total }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] text-center text-[13px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] py-12 bg-white dark:bg-[#111118]">
        No expense data yet.
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111118] overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.04)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)]">
          By Category
        </span>
        <span className="text-[13px] font-bold tracking-[-0.02em] text-[#0a0a14] dark:text-[#e2e2f0]">
          {formatCurrency(grandTotal)}
        </span>
      </div>

      {/* Bars */}
      <div className="px-5 pb-5 space-y-3.5">
        {items.map(({ cat, total }, i) => {
          const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
          const color = COLORS[i % COLORS.length];
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[13px] font-medium text-[#0a0a14] dark:text-[#e2e2f0] truncate">
                    {cat}
                  </span>
                </div>
                <div className="shrink-0 flex items-baseline gap-1.5 ml-3">
                  <span className="text-[13px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">
                    {formatCurrency(total)}
                  </span>
                  <span className="text-[10px] font-medium text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)]">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              {/* Bar track */}
              <div className="h-[6px] rounded-full bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.06)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
