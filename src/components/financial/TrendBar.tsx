interface TrendBarProps {
  label: string;
  value: number;
  maxValue: number;
  formattedValue: string;
  color?: string;
  delta?: number;
  formattedDelta?: string;
}

export function TrendBar({
  label,
  value,
  maxValue,
  formattedValue,
  color = 'bg-orange-500',
  delta,
  formattedDelta,
}: TrendBarProps) {
  const isNegative = value < 0;
  const pct = maxValue === 0 ? 0 : Math.min(100, Math.abs(value) / Math.abs(maxValue) * 100);

  const deltaColor =
    delta === undefined
      ? ''
      : delta > 0
      ? 'text-[var(--moss)]'
      : delta < 0
      ? 'text-[var(--rust)]'
      : 'text-[var(--ink-4)]';

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="text-xs text-[var(--ink-4)] w-24 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          {!isNegative && (
            <div
              className={`h-full ${color} rounded-full transition-all duration-300`}
              style={{ width: `${pct}%` }}
            />
          )}
        </div>
      </div>
      <span
        className={`text-xs font-semibold tabular-nums w-24 text-right shrink-0 ${
          isNegative ? 'text-[var(--rust)]' : 'text-[var(--ink)]'
        }`}
      >
        {formattedValue}
      </span>
      {formattedDelta !== undefined && (
        <span className={`text-xs tabular-nums w-16 text-right shrink-0 ${deltaColor}`}>
          {formattedDelta}
        </span>
      )}
    </div>
  );
}
