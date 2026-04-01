import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

interface Props {
  label: string;
  value: number;
  max: number;
  displayValue: string;
  zones?: { green: number; amber: number }; // thresholds
  invertColor?: boolean; // lower is better (e.g., debt ratio)
}

function getColor(value: number, max: number, zones?: { green: number; amber: number }, invert?: boolean): string {
  if (!zones) return '#f97316';
  const pct = (value / max) * 100;
  if (invert) {
    if (pct <= zones.green) return '#22c55e';
    if (pct <= zones.amber) return '#f59e0b';
    return '#ef4444';
  }
  if (pct >= zones.green) return '#22c55e';
  if (pct >= zones.amber) return '#f59e0b';
  return '#ef4444';
}

export function HealthGauge({ label, value, max, displayValue, zones, invertColor }: Props) {
  const pct = Math.min((value / max) * 100, 100);
  const color = getColor(value, max, zones, invertColor);

  const data = [{ value: pct, fill: color }];

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="relative w-full" style={{ maxWidth: 160 }}>
        <ResponsiveContainer width="100%" height={140}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="90%"
            startAngle={210}
            endAngle={-30}
            data={data}
            barSize={12}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              background={{ fill: '#27272a' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {displayValue}
          </p>
        </div>
      </div>
    </div>
  );
}
