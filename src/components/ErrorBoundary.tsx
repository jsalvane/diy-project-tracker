import { Component, type ReactNode, type ErrorInfo } from 'react';

// Flag used to break infinite reload loops if the chunk is genuinely missing.
const RELOAD_KEY = 'toolbox-chunk-reload-attempted';

function isChunkLoadError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; message?: string };
  const name = e.name ?? '';
  const message = e.message ?? '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  private clearFlagTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidMount(): void {
    // After 5s of healthy operation, assume any prior reload worked and clear
    // the flag so a future deploy in this same session can trigger a reload too.
    this.clearFlagTimer = setTimeout(() => {
      sessionStorage.removeItem(RELOAD_KEY);
    }, 5000);
  }

  componentWillUnmount(): void {
    if (this.clearFlagTimer) clearTimeout(this.clearFlagTimer);
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
    if (isChunkLoadError(error)) {
      const attempted = sessionStorage.getItem(RELOAD_KEY) === '1';
      if (!attempted) {
        // Stale chunk after deploy — fetch fresh index.html with new chunk hashes.
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    sessionStorage.removeItem(RELOAD_KEY);
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (isChunkLoadError(error)) {
      // Reload is in flight (or already attempted). Show a brief loader.
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div className="tape-label" style={{ color: 'var(--ink-4)', letterSpacing: '0.18em' }}>Reloading</div>
        </div>
      );
    }

    return (
      <div style={{ padding: 40, maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <div className="font-serif" style={{ fontSize: 32, fontStyle: 'italic', marginBottom: 12, color: 'var(--ink)' }}>
          Something went wrong<em style={{ color: 'var(--rust)' }}>.</em>
        </div>
        <div className="tape-label" style={{ letterSpacing: '0.18em', marginBottom: 24, color: 'var(--ink-4)' }}>
          The page hit an error
        </div>
        <button
          onClick={this.handleReload}
          style={{
            padding: '12px 28px',
            border: '1px solid var(--ink-line-2)',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontFamily: 'inherit',
            fontSize: 14,
            cursor: 'pointer',
            borderRadius: 8,
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
