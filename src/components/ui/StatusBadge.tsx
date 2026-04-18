import type { ProjectStatus } from '../../lib/types';
import { STATUS_META } from '../../lib/constants';

/** Pill-style status badge — transparent bg, hairline border, mono uppercase */
export function StatusPill({ status }: { status: ProjectStatus }) {
  const meta = STATUS_META[status] || STATUS_META.planned;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 22,
        padding: '0 10px',
        borderRadius: 999,
        border: `1px solid ${meta.color}66`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        color: meta.color,
        background: 'transparent',
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}
    >
      <span
        className={meta.dotAnim ? 'animate-pulse-dot' : ''}
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: meta.color,
          flexShrink: 0,
          display: 'inline-block',
        }}
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: meta.color,
      }}
    >
      <span
        className={meta.dotAnim ? 'animate-pulse-dot' : ''}
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: meta.color,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      {meta.label}
    </span>
  );
}
