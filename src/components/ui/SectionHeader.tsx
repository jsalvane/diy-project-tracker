/** Section header with uppercase label and count pill */
export function SectionHeader({ title, count }: {
  color?: string;
  icon?: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="tape-label">{title}</span>
      {count !== undefined && (
        <span
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full tape-label"
          style={{ background: 'var(--paper-2)', color: 'var(--ink-3)' }}
        >
          {count}
        </span>
      )}
    </div>
  );
}
