import type { ProjectStatus } from '../lib/types';
import { STATUS_META, STATUS_OPTIONS } from '../lib/constants';

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
  const meta = STATUS_META[status];
  const isActive = status === 'active';
  return (
    <span
      className="inline-flex items-center gap-1.5 tape-label px-2 py-0.5 rounded-full"
      style={{
        fontSize: 9,
        color: meta.color,
        background: meta.bg,
        border: `1px solid ${meta.color}40`,
      }}
    >
      <span
        style={{
          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
          background: meta.color,
          animation: isActive ? 'pulse 2s infinite' : 'none',
        }}
      />
      {label}
    </span>
  );
}
