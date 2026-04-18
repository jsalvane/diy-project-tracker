import { Link } from 'react-router-dom';

/** Dashboard quick-link card — hairline border, paper bg, no shadow */
export function Card({
  to, children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-4 rounded-[14px] border border-[var(--ink-line)] bg-[var(--paper)] p-5 overflow-hidden transition-colors duration-150 hover:bg-[var(--paper-2)] h-full"
    >
      {children}
    </Link>
  );
}

/** Tape-style label row — mono uppercase */
export function CardLabel({ title }: { title: string }) {
  return (
    <span className="tape-label">{title}</span>
  );
}

/** Small colored icon in rounded square — kept for compat, now uses ink tint */
export function IconBadge({ color, icon, size = 'sm' }: { color: string; icon: React.ReactNode; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-6 h-6 rounded-[7px]' : 'w-7 h-7 rounded-[8px]';
  return (
    <div
      className={`${dim} flex items-center justify-center shrink-0`}
      style={{ background: `${color}18`, color }}
    >
      {icon}
    </div>
  );
}
