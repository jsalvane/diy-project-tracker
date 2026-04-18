/** Ledger line: mono label left, dotted leader, mono amount right */
export function MoneyRow({
  label,
  amount,
  bold,
  className,
}: {
  label: string;
  amount: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-baseline ${className ?? ''}`}
      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
    >
      <span style={{ color: 'var(--ink-2)', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          flex: 1,
          borderBottom: '1px dotted var(--ink-line-2)',
          margin: '0 8px 4px',
          minWidth: 16,
        }}
      />
      <span
        style={{
          color: 'var(--ink)',
          fontWeight: bold ? 600 : 400,
          flexShrink: 0,
        }}
      >
        {amount}
      </span>
    </div>
  );
}
