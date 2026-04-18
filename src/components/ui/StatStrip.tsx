export interface StatItem {
  label: string;
  value: string;
  color?: string;
}

/** Horizontal stat strip — flat, Instrument Serif numerals, mono labels */
export function StatStrip({ stats, className = '' }: { stats: StatItem[]; className?: string }) {
  return (
    <div className={`flex items-stretch overflow-x-auto scrollbar-hide ${className}`}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex-1 min-w-[90px] flex flex-col gap-1 py-4"
          style={{
            paddingLeft: i === 0 ? 0 : 20,
            paddingRight: 20,
            borderLeft: i > 0 ? '1px solid var(--ink-line)' : 'none',
          }}
        >
          <div className="tape-label truncate">{stat.label}</div>
          <div
            className="display-md"
            style={stat.color ? { color: stat.color } : { color: 'var(--ink)' }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
