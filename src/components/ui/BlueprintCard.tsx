import type { ReactNode } from 'react';

/** Blueprint grid backdrop card — for project covers and sketch surfaces */
export function BlueprintCard({
  children,
  className,
  style,
}: {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`blueprint-grid border border-[var(--ink-line)] ${className ?? ''}`}
      style={{ padding: 20, borderRadius: 0, ...style }}
    >
      {children}
    </div>
  );
}
