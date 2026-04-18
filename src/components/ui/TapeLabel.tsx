import type { ReactNode } from 'react';

/** JetBrains Mono uppercase label — the signature categorical label */
export function TapeLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`tape-label ${className ?? ''}`}>
      {children}
    </span>
  );
}
