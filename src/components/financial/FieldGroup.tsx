interface FieldDef {
  key: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  prefix?: string;
}

interface FieldGroupProps {
  title: string;
  fields: FieldDef[];
  columns?: 2 | 3;
  totalLabel?: string;
  totalValue?: number;
  calculatedNote?: string; // shown below total
  highlighted?: boolean; // orange border = update every quarter
}

const INPUT_CLASS =
  'w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent tabular-nums';

const READ_ONLY_CLASS =
  'w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 tabular-nums cursor-default';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function FieldGroup({
  title,
  fields,
  columns = 2,
  totalLabel,
  totalValue,
  calculatedNote,
  highlighted = false,
}: FieldGroupProps) {
  const gridClass =
    columns === 3
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-3';

  const borderClass = highlighted
    ? 'border-2 border-orange-400 dark:border-orange-500'
    : 'border border-gray-200 dark:border-zinc-800';

  return (
    <div className={`${borderClass} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <p className={`text-xs font-semibold uppercase tracking-widest ${highlighted ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-zinc-500'}`}>
          {title}
        </p>
        {highlighted && (
          <span className="text-xs font-medium text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 px-2 py-0.5 rounded-full">
            update each quarter
          </span>
        )}
      </div>
      <div className={gridClass}>
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1">
              {f.label}
            </label>
            <div className="relative">
              {f.prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-zinc-500 pointer-events-none">
                  {f.prefix}
                </span>
              )}
              {f.readOnly ? (
                <div className={`${READ_ONLY_CLASS} ${f.prefix ? 'pl-6' : ''}`}>
                  {f.prefix === '$' ? formatCurrency(f.value) : f.value.toLocaleString()}
                </div>
              ) : (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={f.value}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    f.onChange(isNaN(parsed) ? 0 : parsed);
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`${INPUT_CLASS} ${f.prefix ? 'pl-6' : ''}`}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {totalLabel !== undefined && totalValue !== undefined && (
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-3 mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
            {totalLabel}
          </span>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {formatCurrency(totalValue)}
            </span>
            {calculatedNote && (
              <p className="text-xs text-gray-400 dark:text-zinc-500">{calculatedNote}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
