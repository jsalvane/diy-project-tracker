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
  positive: 'border-l-[3px] border-l-[#16a34a]',
  negative: 'border-l-[3px] border-l-red-500',
  warning:  'border-l-[3px] border-l-amber-500',
  neutral:  'border-l-[3px] border-l-[var(--rust)]',
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
      ? 'text-[#16a34a]'
      : delta < 0
      ? 'text-[var(--rust)]'
      : 'text-[var(--ink-4)]';

  return (
    <div className={`bg-[var(--paper)] border border-[var(--ink-line)] rounded-xl px-4 py-3.5 ${borderClass}`}>
      <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.38)] mb-1">
        {label}
      </p>
      <p className="text-[19px] font-bold text-[var(--ink)] tabular-nums tracking-[-0.02em]">
        {value}
      </p>
      {delta !== undefined && (
        <p className={`text-[11px] font-medium tabular-nums mt-0.5 ${deltaColor}`}>
          {formatDelta(delta, deltaFormat)} vs prior
        </p>
      )}
      {sub && !delta && (
        <p className="text-[11px] text-[var(--ink-4)] mt-0.5">{sub}</p>
      )}
    </div>
  );
}
