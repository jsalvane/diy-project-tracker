export interface StatItem {
  label: string;
  value: string;
  color?: string;       // value color (hex) — omit for default text color
}

/** Horizontal segmented stat bar. Scrolls horizontally on mobile if > 3 items */
export function StatStrip({ stats, className = '' }: { stats: StatItem[]; className?: string }) {
  return (
    <div
      className={`flex items-stretch gap-0 rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] overflow-x-auto bg-white dark:bg-[#111118] scrollbar-hide ${className}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.04)' }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex-1 min-w-[100px] px-4 sm:px-5 py-3.5 sm:py-4 flex flex-col gap-1 ${i < stats.length - 1 ? 'border-r border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)]' : ''}`}
        >
          <div className="text-[10px] sm:text-[11px] font-semibold tracking-[0.04em] uppercase text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] truncate">
            {stat.label}
          </div>
          <div
            className="text-[18px] sm:text-[22px] font-bold tracking-[-0.04em] truncate"
            style={stat.color ? { color: stat.color } : undefined}
          >
            <span className={!stat.color ? 'text-[#0a0a14] dark:text-[#e2e2f0]' : ''}>
              {stat.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
