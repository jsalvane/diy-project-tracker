import type { ReactNode } from 'react';

type NumeralSize = 'xl' | 'lg' | 'md';

/** Instrument Serif display numeral */
export function Numeral({
  children,
  size = 'lg',
  color,
  className,
}: {
  children: ReactNode;
  size?: NumeralSize;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`display-${size} ${className ?? ''}`}
      style={color ? { color } : undefined}
    >
      {children}
    </span>
  );
}
