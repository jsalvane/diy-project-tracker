interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center animate-fade-in"
      style={{ background: 'rgba(26,22,18,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-[14px] p-6 max-w-sm w-full mx-4 mb-4 sm:mb-0 animate-scale-in"
        style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(184,69,31,0.1)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--rust)' }}>
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 6 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 20 }}>{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost btn-sm">Cancel</button>
          <button onClick={onConfirm} className="btn-danger btn-sm">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
