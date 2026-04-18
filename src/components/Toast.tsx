import { useApp } from '../context/AppContext';

export function Toast() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 animate-slide-up"
          style={{
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '10px 16px',
            borderRadius: 999,
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(26,22,18,0.3)',
            maxWidth: 360,
          }}
        >
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction!();
                dismissToast(toast.id);
              }}
              style={{
                fontWeight: 600,
                color: 'var(--ochre)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'inherit',
                textDecoration: 'underline',
                flexShrink: 0,
              }}
            >
              Undo
            </button>
          )}
          <button
            onClick={() => dismissToast(toast.id)}
            style={{
              color: 'var(--ink-4)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              flexShrink: 0,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
