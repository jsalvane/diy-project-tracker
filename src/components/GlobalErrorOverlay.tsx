import { useEffect, useState } from 'react';

type Captured = {
  kind: 'error' | 'unhandledrejection';
  message: string;
  stack: string;
  source: string;
  ts: number;
};

function stackOf(err: unknown): string {
  if (err && typeof err === 'object' && 'stack' in err) {
    const s = (err as { stack?: unknown }).stack;
    if (typeof s === 'string') return s;
  }
  return '';
}

function messageOf(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  try { return JSON.stringify(err); } catch { return String(err); }
}

// A last-resort visible reporter for errors React's ErrorBoundary can't catch:
// async handlers, effect callbacks, event listeners, and unhandled promise
// rejections. Surfaces them as a dismissible overlay so blank screens become
// actionable instead of silent.
export function GlobalErrorOverlay() {
  const [captured, setCaptured] = useState<Captured | null>(null);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      // Don't double-report errors that React's ErrorBoundary already surfaces.
      // Suppressing here would hide bugs, so we report everything but de-dupe by message+ts window.
      setCaptured({
        kind: 'error',
        message: messageOf(e.error) || e.message || 'Unknown error',
        stack: stackOf(e.error),
        source: `${e.filename ?? ''}${e.lineno ? `:${e.lineno}` : ''}${e.colno ? `:${e.colno}` : ''}`,
        ts: Date.now(),
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      setCaptured({
        kind: 'unhandledrejection',
        message: messageOf(e.reason),
        stack: stackOf(e.reason),
        source: '',
        ts: Date.now(),
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!captured) return null;

  const title = captured.kind === 'unhandledrejection' ? 'Unhandled promise rejection' : 'Runtime error';

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        right: 12,
        maxWidth: 720,
        margin: '0 auto',
        zIndex: 9999,
        background: '#1a1612',
        color: '#f0eee9',
        border: '1px solid #e31937',
        borderRadius: 10,
        padding: '14px 16px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
        fontFamily: 'inherit',
        fontSize: 13,
        lineHeight: 1.45,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ letterSpacing: '0.18em', fontSize: 11, color: '#e31937', marginBottom: 6, textTransform: 'uppercase' }}>
            {title}
          </div>
          <div style={{ fontWeight: 600, marginBottom: 6, wordBreak: 'break-word' }}>
            {captured.message}
          </div>
          {captured.source && (
            <div style={{ opacity: 0.75, fontSize: 11, marginBottom: 6, wordBreak: 'break-all' }}>
              {captured.source}
            </div>
          )}
          {captured.stack && (
            <details style={{ marginTop: 4 }}>
              <summary style={{ cursor: 'pointer', fontSize: 11, opacity: 0.75 }}>Stack</summary>
              <pre style={{
                marginTop: 6,
                maxHeight: 180,
                overflow: 'auto',
                fontSize: 11,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'rgba(255,255,255,0.04)',
                padding: 8,
                borderRadius: 6,
              }}>{captured.stack}</pre>
            </details>
          )}
        </div>
        <button
          onClick={() => setCaptured(null)}
          aria-label="Dismiss"
          style={{
            background: 'transparent',
            border: '1px solid rgba(240,238,233,0.3)',
            color: '#f0eee9',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
