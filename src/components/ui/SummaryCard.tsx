/** KPI summary card — tape label header, Instrument Serif value, hairline border */
export function SummaryCard({ label, value, sub, accent, large }: {
  icon?: React.ReactNode;
  iconColor?: string;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-[14px] border border-[var(--ink-line)] bg-[var(--paper)] p-4"
    >
      <div className="tape-label truncate">{label}</div>
      <div>
        <div
          className={large ? 'display-md' : 'font-serif'}
          style={{
            fontSize: large ? undefined : 22,
            lineHeight: large ? undefined : '28px',
            fontWeight: 400,
            color: accent ? 'var(--ochre)' : 'var(--ink)',
          }}
        >
          {value}
        </div>
        {sub && (
          <div className="tape-label mt-1 truncate normal-case" style={{ color: 'var(--ink-4)' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
