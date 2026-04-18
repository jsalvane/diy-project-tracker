import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferred) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 animate-scale-in"
      style={{
        bottom: 'max(calc(80px + env(safe-area-inset-bottom, 0px)), 96px)',
        background: 'var(--ink)',
        color: 'var(--paper)',
        borderRadius: 999,
        padding: '10px 14px 10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 12px 32px rgba(26,22,18,0.35)',
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>Install Toolbox</span>
      <button
        onClick={handleInstall}
        style={{
          background: 'var(--paper)', color: 'var(--ink)', border: 'none',
          borderRadius: 999, padding: '6px 14px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', color: 'var(--paper)', border: 'none',
          cursor: 'pointer', padding: 4, opacity: 0.7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
        </svg>
      </button>
    </div>
  );
}
