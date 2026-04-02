type FormatType = 'currency' | 'pct' | 'plain';

interface ComparisonRowProps {
  label: string;
  prior?: number;
  current: number;
  format: FormatType;
  invertDelta?: boolean; // true = lower is better (expenses, liabilities)
  isHeader?: boolean;
  indent?: boolean;
}

function fmt(n: number | undefined, format: FormatType): string {
  if (n === undefined) return '—';
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);
  }
  if (format === 'pct') return Math.round(n) + '%';
  return n.toLocaleString();
}

export function ComparisonRow({
  label,
  prior,
  current,
  format,
  invertDelta = false,
  isHeader = false,
  indent = false,
}: ComparisonRowProps) {
  if (isHeader) {
    return (
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 py-1.5 border-b border-gray-100 dark:border-zinc-800">
        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest w-28 text-right">
          Prior
        </span>
        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest w-28 text-right">
          Current
        </span>
        <span className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest w-20 text-right">
          Change
        </span>
      </div>
    );
  }

  const delta = prior !== undefined ? current - prior : undefined;

  let deltaColor = 'text-gray-400 dark:text-zinc-500';
  if (delta !== undefined && delta !== 0) {
    const isGood = invertDelta ? delta < 0 : delta > 0;
    deltaColor = isGood
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-500 dark:text-red-400';
  }

  const deltaStr =
    delta === undefined
      ? '—'
      : delta === 0
      ? '—'
      : (delta > 0 ? '+' : '') + fmt(delta, format);

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 py-2 border-b border-gray-50 dark:border-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-900/50 -mx-1 px-1 rounded">
      <span
        className={`text-sm text-gray-700 dark:text-zinc-300 truncate ${
          indent ? 'pl-3 text-gray-500 dark:text-zinc-400' : 'font-medium'
        }`}
      >
        {label}
      </span>
      <span className="text-sm tabular-nums text-gray-500 dark:text-zinc-400 w-28 text-right">
        {fmt(prior, format)}
      </span>
      <span className="text-sm tabular-nums font-semibold text-gray-900 dark:text-gray-100 w-28 text-right">
        {fmt(current, format)}
      </span>
      <span className={`text-sm tabular-nums font-medium w-20 text-right ${deltaColor}`}>
        {deltaStr}
      </span>
    </div>
  );
}
