import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { FinancialProvider } from './context/FinancialContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { Toast } from './components/Toast';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { FinancialHealth } from './components/FinancialHealth';
import { Budget } from './components/Budget';
import { Money } from './components/Money';
import { Gifts } from './components/Gifts';
import { Maintenance } from './components/maintenance/Maintenance';
import { Scratchpad } from './components/Scratchpad';
import { Dashboard } from './components/Dashboard';
import { useApp } from './context/AppContext';
import { PinLock } from './components/PinLock';

// ── Page transition wrapper ───────────────────────────────────────────────────

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-page-in">
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/money" element={<Money />} />
        <Route path="/financial-health" element={<FinancialHealth />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/gifts" element={<Gifts />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/scratchpad" element={<Scratchpad />} />
      </Routes>
    </div>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────

function LoadingScreen({ exiting }: { exiting: boolean }) {
  return (
    <>
      <style>{`
        @keyframes ls-rise {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ls-bar-fill {
          0%   { width: 0%; }
          55%  { width: 68%; }
          80%  { width: 84%; }
          100% { width: 94%; }
        }
        @keyframes ls-exit {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes ls-bar-exit {
          0%   { opacity: 1; width: 94%; }
          60%  { opacity: 1; width: 100%; }
          100% { opacity: 0; width: 100%; }
        }

        .ls-rise-1 { animation: ls-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
        .ls-rise-2 { animation: ls-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.22s both; }
        .ls-exit   { animation: ls-exit 0.5s ease-out forwards; }
        .ls-bar-fill { animation: ls-bar-fill 5s cubic-bezier(0.12, 0, 0.39, 0) 0.3s both; }
        .ls-bar-exit { animation: ls-bar-exit 0.6s ease-out forwards; }
      `}</style>

      <div
        className={`blueprint-grid ${exiting ? 'ls-exit' : ''}`}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div className="ls-rise-1 font-serif" style={{ fontSize: 48, lineHeight: 1, color: 'var(--ink)', fontStyle: 'italic' }}>
            Toolbox<em style={{ color: 'var(--rust)' }}>.</em>
          </div>
          <div className="ls-rise-2 tape-label" style={{ letterSpacing: '0.18em' }}>
            Loading
          </div>
        </div>

        {/* Bottom progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--ink-line-2)', overflow: 'hidden' }}>
          <div
            className={exiting ? 'ls-bar-exit' : 'ls-bar-fill'}
            style={{ position: 'relative', height: '100%', background: 'var(--ink)' }}
          />
        </div>
      </div>
    </>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────

function AppShell() {
  const { loading } = useApp();
  const [showLoader, setShowLoader] = useState(() => loading);
  const [loaderExiting, setLoaderExiting] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const openCmd = useCallback(() => setCmdOpen(true), []);
  const closeCmd = useCallback(() => setCmdOpen(false), []);

  // Trigger loader exit animation when data finishes loading.
  // Only depends on `loading` — omitting showLoader/loaderExiting intentionally so that
  // setLoaderExiting(true) doesn't re-run the effect and cancel its own timeout.
  useEffect(() => {
    if (!loading) {
      setLoaderExiting(true);
      const t = setTimeout(() => setShowLoader(false), 820);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (showLoader) {
    return <LoadingScreen exiting={loaderExiting} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
      {/* Sidebar (desktop fixed + mobile bottom nav) */}
      <Sidebar onCmdK={openCmd} />

      {/* Main content — offset by sidebar on desktop, padded for bottom nav on mobile */}
      <div className="lg:pl-[220px] pb-[80px] lg:pb-0">
        {/* Simplified header (mobile-only for back button + branding) */}
        <Header onCmdK={openCmd} />

        {/* Routed pages with enter animation */}
        <AnimatedRoutes />
      </div>

      {/* Command palette overlay */}
      <CommandPalette open={cmdOpen} onClose={closeCmd} />

      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PinLock>
        <AppProvider>
          <FinancialProvider>
            <AppShell />
          </FinancialProvider>
        </AppProvider>
      </PinLock>
    </BrowserRouter>
  );
}
