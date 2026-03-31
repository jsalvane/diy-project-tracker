import type { Entry } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface Props {
  entries: Entry[];
}

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
      <div className="border border-gray-200 dark:border-zinc-800 rounded-xl text-center text-sm text-gray-400 dark:text-zinc-600 py-10">
        No expense data to chart.
      </div>
    );
  }

  // Color palette cycling through orange shades + warm neutrals
  const colors = [
    'bg-orange-500',
    'bg-orange-400',
    'bg-amber-500',
    'bg-orange-300',
    'bg-amber-400',
    'bg-yellow-500',
    'bg-orange-200',
    'bg-amber-300',
  ];

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5">
      <div className="space-y-4">
        {items.map(({ cat, total }, i) => {
          const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
          const color = colors[i % colors.length];
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium truncate pr-4">
                  {cat}
                </span>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(total)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-zinc-600 ml-1.5">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${color} rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          Total
        </span>
        <span className="text-base font-bold text-gray-900 dark:text-white">
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  );
}
