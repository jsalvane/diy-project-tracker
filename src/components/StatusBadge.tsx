import type { ProjectStatus } from '../lib/types';
import { STATUS_COLORS, STATUS_OPTIONS } from '../lib/constants';

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status]}`}>
      {label}
    </span>
  );
}
