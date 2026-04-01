interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  deltaFormat?: 'currency' | 'pct' | 'plain';
  highlight?: 'positive' | 'negative' | 'neutral' | 'warning';
}

function formatDelta(delta: number, format: 'currency' | 'pct' | 'plain'): string {
  const sign = delta > 0 ? '+' : '';
  if (format === 'currency') {
    return (
      sign +
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(delta)
    );
  }
  if (format === 'pct') return sign + delta.toFixed(1) + '%';
  return sign + delta.toLocaleString();
}

const highlightBorder: Record<string, string> = {
  positive: 'border-l-4 border-l-green-500',
  negative: 'border-l-4 border-l-red-500',
  warning: 'border-l-4 border-l-amber-500',
  neutral: 'border-l-4 border-l-orange-500',
};

export function KpiCard({
  label,
  value,
  sub,
  delta,
  deltaFormat = 'plain',
  highlight,
}: KpiCardProps) {
  const borderClass = highlight ? highlightBorder[highlight] : '';
  const deltaColor =
    delta === undefined
      ? ''
      : delta > 0
      ? 'text-green-600 dark:text-green-400'
      : delta < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-500 dark:text-zinc-400';

  return (
    <div
      className={`bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 ${borderClass}`}
    >
      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
        {value}
      </p>
      {delta !== undefined && (
        <p className={`text-xs font-medium tabular-nums mt-0.5 ${deltaColor}`}>
          {formatDelta(delta, deltaFormat)} vs prior quarter
        </p>
      )}
      {sub && !delta && (
        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{sub}</p>
      )}
    </div>
  );
}
