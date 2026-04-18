export function EmptyState({ message, children }: { icon?: React.ReactNode; message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 animate-fade-in">
      <p className="font-serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)', textAlign: 'center', maxWidth: 320 }}>
        {message}<em style={{ color: 'var(--rust)' }}>.</em>
      </p>
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}
