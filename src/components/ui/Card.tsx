import { Link } from 'react-router-dom';

/** Dashboard-style link card with hover lift and colored top accent */
export function Card({
  to, children, accent,
}: {
  to: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-5 rounded-2xl border border-[rgba(0,0,20,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111118] p-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,20,0.10)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.5)] h-full"
      style={{ boxShadow: '0 1px 4px rgba(0,0,20,0.06)' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: accent }}
      />
      {children}
    </Link>
  );
}

/** Colored icon + uppercase label row */
export function CardLabel({ color, icon, title }: { color: string; icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <IconBadge color={color} icon={icon} />
      <span className="text-[12px] font-semibold text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] uppercase tracking-[0.04em]">
        {title}
      </span>
    </div>
  );
}

/** Small colored icon in rounded square */
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
