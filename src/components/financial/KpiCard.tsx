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
  if (format === 'pct') return sign + Math.round(delta) + '%';
  return sign + delta.toLocaleString();
}

const highlightBorder: Record<string, string> = {
  positive: 'border-l-[3px] border-l-[#16a34a] dark:border-l-[#22c55e]',
  negative: 'border-l-[3px] border-l-red-500 dark:border-l-red-400',
  warning:  'border-l-[3px] border-l-amber-500 dark:border-l-amber-400',
  neutral:  'border-l-[3px] border-l-[#E31937] dark:border-l-[#FF4D5C]',
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
      ? 'text-[#16a34a] dark:text-[#22c55e]'
      : delta < 0
      ? 'text-red-600 dark:text-red-400'
      : 'text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]';

  return (
    <div className={`bg-[#ffffff] dark:bg-[#0f0f1a] border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3.5 ${borderClass}`}>
      <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] mb-1">
        {label}
      </p>
      <p className="text-[19px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tabular-nums tracking-[-0.02em]">
        {value}
      </p>
      {delta !== undefined && (
        <p className={`text-[11px] font-medium tabular-nums mt-0.5 ${deltaColor}`}>
          {formatDelta(delta, deltaFormat)} vs prior
        </p>
      )}
      {sub && !delta && (
        <p className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5">{sub}</p>
      )}
    </div>
  );
}
