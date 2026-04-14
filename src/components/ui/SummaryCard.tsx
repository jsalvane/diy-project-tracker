import { IconBadge } from './Card';

/** KPI summary card with icon badge, label, value, and optional sub-text */
export function SummaryCard({ icon, iconColor, label, value, sub, accent, large }: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`relative flex flex-col gap-3 rounded-2xl border p-4 sm:p-5 overflow-hidden ${
      accent
        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40'
        : 'bg-white dark:bg-[#111118] border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)]'
    }`} style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.04)' }}>
      <div className="flex items-center gap-2">
        <IconBadge color={iconColor} icon={icon} />
        <span className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)]">
          {label}
        </span>
      </div>
      <div>
        <div className={`font-bold tracking-[-0.03em] ${
          large
            ? 'text-[24px] sm:text-[28px] text-[#10b981]'
            : accent
              ? 'text-[18px] sm:text-[22px] text-amber-700 dark:text-amber-400'
              : 'text-[18px] sm:text-[22px] text-[#0a0a14] dark:text-[#e2e2f0]'
        }`}>
          {value}
        </div>
        {sub && (
          <div className="text-[11px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] mt-0.5 truncate">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
