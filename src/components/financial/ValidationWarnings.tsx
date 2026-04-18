import type { ValidationFlag } from '../../lib/financialTypes';

interface ValidationWarningsProps {
  flags: ValidationFlag[];
}

function formatVal(n: number | undefined): string {
  if (n === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export function ValidationWarnings({ flags }: ValidationWarningsProps) {
  if (flags.length === 0) return null;

  const errors = flags.filter((f) => f.severity === 'error');
  const warnings = flags.filter((f) => f.severity === 'warning');

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="bg-[rgba(184,69,31,0.05)] border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-widest mb-3">
            Errors ({errors.length})
          </p>
          <ul className="space-y-2.5">
            {errors.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-[var(--rust)] font-bold text-sm shrink-0 mt-0.5">
                  ✕
                </span>
                <div className="min-w-0">
                  <span className="font-mono text-xs text-[var(--rust)] bg-[rgba(184,69,31,0.10)] px-1.5 py-0.5 rounded">
                    {f.field}
                  </span>
                  <p className="text-sm text-red-800 mt-0.5">{f.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-[rgba(176,122,26,0.05)] border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-3">
            Validation Warnings ({warnings.length})
          </p>
          <ul className="space-y-3">
            {warnings.map((f, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-[var(--ochre)] font-bold text-sm shrink-0 mt-0.5">
                  ⚠
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    {f.field}
                  </span>
                  <p className="text-sm text-amber-900 mt-0.5">{f.message}</p>
                  {f.calculated !== undefined && f.reported !== undefined && (
                    <div className="mt-1 flex gap-4 text-xs text-amber-700 tabular-nums">
                      <span>Calculated: <strong>{formatVal(f.calculated)}</strong></span>
                      <span>Reported: <strong>{formatVal(f.reported)}</strong></span>
                      <span>Diff: <strong>{formatVal(Math.abs(f.calculated - f.reported))}</strong></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
