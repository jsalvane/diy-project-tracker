import type { ProjectStatus } from '../lib/types';
import { STATUS_COLORS, STATUS_DOT, STATUS_OPTIONS } from '../lib/constants';

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.02em] ${STATUS_COLORS[status]}`}>
      <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${STATUS_DOT[status]} ${isActive ? 'animate-pulse-dot' : ''}`} />
      {label}
    </span>
  );
}
