import type { ProjectStatus } from '../../lib/types';
import { STATUS_META } from '../../lib/constants';

/** Pill-style status badge with colored dot and background */
export function StatusPill({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status] || STATUS_META.planned;
  return (
    <span
      className="inline-flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: meta.bg, color: meta.color }}
    >
      <span
        className={`w-[5px] h-[5px] rounded-full shrink-0 ${meta.dotAnim ? 'animate-pulse-dot' : ''}`}
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}

/** Inline dot + text status badge (compact) */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status] || STATUS_META.planned;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.02em]"
      style={{ color: meta.color }}
    >
      <span
        className={`w-[5px] h-[5px] rounded-full shrink-0 ${meta.dotAnim ? 'animate-pulse-dot' : ''}`}
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}
