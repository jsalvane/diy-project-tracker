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
        @keyframes ls-icon-rise {
          from { opacity: 0; transform: scale(0.78) translateY(18px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ls-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ls-bar-fill {
          0%   { width: 0%; }
          55%  { width: 68%; }
          80%  { width: 84%; }
          100% { width: 94%; }
        }
        @keyframes ls-bar-shimmer {
          0%   { left: -40%; }
          100% { left: 110%; }
        }
        @keyframes ls-exit {
          0%   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.08) translateY(-18px); filter: blur(20px); }
        }
        @keyframes ls-bar-exit {
          0%   { opacity: 1; width: 94%; }
          60%  { opacity: 1; width: 100%; }
          100% { opacity: 0; width: 100%; }
        }

        .ls-icon-rise { animation: ls-icon-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both; }
        .ls-rise-1    { animation: ls-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.16s both; }
        .ls-rise-2    { animation: ls-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.26s both; }
        .ls-exit      { animation: ls-exit 0.8s cubic-bezier(0.4, 0, 1, 1) forwards; }
        .ls-bar-fill  { animation: ls-bar-fill 5s cubic-bezier(0.12, 0, 0.39, 0) 0.4s both; }
        .ls-bar-exit  { animation: ls-bar-exit 0.8s ease-out forwards; }
        .ls-shimmer   {
          position: absolute; top: 0; height: 100%; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
          animation: ls-bar-shimmer 1.8s ease-in-out 0.8s infinite;
        }
      `}</style>

      <div
        className={exiting ? 'ls-exit' : ''}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'linear-gradient(160deg, #232325 0%, #2a0a10 55%, #9b1020 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Center content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* App icon */}
          <div className="ls-icon-rise" style={{ marginBottom: 32 }}>
            <img
              src="/apple-touch-icon.png"
              alt="Toolbox"
              style={{
                width: 84, height: 84,
                borderRadius: 22,
                boxShadow: [
                  '0 28px 72px rgba(0,0,0,0.88)',
                  '0 0 0 1px rgba(255,255,255,0.08)',
                  '0 0 56px rgba(227,25,55,0.12)',
                ].join(', '),
                display: 'block',
              }}
            />
          </div>

          {/* App name — Tesla-style wide tracked caps */}
          <div
            className="ls-rise-1"
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.88)',
              letterSpacing: '0.42em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Toolbox
          </div>

          {/* Tagline */}
          <div
            className="ls-rise-2"
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.26)',
              letterSpacing: '0.08em',
            }}
          >
            Loading
          </div>
        </div>

        {/* Bottom progress bar — pinned to screen bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 2,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <div
            className={exiting ? 'ls-bar-exit' : 'ls-bar-fill'}
            style={{
              position: 'relative',
              height: '100%',
              background: 'rgba(255,255,255,0.55)',
              overflow: 'hidden',
            }}
          >
            {!exiting && <div className="ls-shimmer" />}
          </div>
        </div>

        {/* Subtle bottom line decoration */}
        <div style={{
          position: 'absolute',
          bottom: 2, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
        }} />
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
    <div className="min-h-screen bg-[#f5f5fa] dark:bg-[#08080f] text-[#0a0a14] dark:text-[#e2e2f0]">
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
