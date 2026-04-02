import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { FinancialProvider } from './context/FinancialContext';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { FinancialHealth } from './components/FinancialHealth';
import { Budget } from './components/Budget';
import { Gifts } from './components/Gifts';
import { Maintenance } from './components/Maintenance';
import { useApp } from './context/AppContext';
import { PinLock } from './components/PinLock';

function AppShell() {
  const { loading } = useApp();

  if (loading) {
    return (
      <>
        <style>{`
          @keyframes ls-grid-drift {
            from { transform: translate(0, 0); }
            to   { transform: translate(40px, 40px); }
          }
          @keyframes ls-scan {
            0%   { top: -2px; opacity: 0; }
            4%   { opacity: 1; }
            96%  { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          @keyframes ls-orb-pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.6; }
            50%       { transform: translate(-50%, -50%) scale(1.15); opacity: 1;   }
          }
          @keyframes ls-logo-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(129,140,248,0), 0 0 30px 6px rgba(99,102,241,0.2); }
            50%       { box-shadow: 0 0 0 8px rgba(129,140,248,0.07), 0 0 50px 12px rgba(99,102,241,0.35); }
          }
          @keyframes ls-enter {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0)    scale(1); }
          }
          @keyframes ls-ring-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          @keyframes ls-ring-spin-rev {
            from { transform: rotate(0deg); }
            to   { transform: rotate(-360deg); }
          }
          @keyframes ls-dot-blink {
            0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
            40%            { opacity: 1;   transform: scale(1); }
          }
          .ls-content-enter { animation: ls-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        `}</style>
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: '#07070f',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Scrolling grid */}
          <div style={{
            position: 'absolute', inset: '-40px',
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.45) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.45) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.06,
            animation: 'ls-grid-drift 5s linear infinite',
          }} />

          {/* Center radial glow */}
          <div style={{
            position: 'absolute',
            width: 700, height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)',
            top: '50%', left: '50%',
            animation: 'ls-orb-pulse 4s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Scan line */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.5) 30%, rgba(129,140,248,0.8) 50%, rgba(99,102,241,0.5) 70%, transparent 100%)',
            animation: 'ls-scan 7s ease-in-out infinite',
            pointerEvents: 'none',
          }} />

          {/* Corner accents */}
          {[
            { top: 16, left: 16, borderTop: '1px solid rgba(129,140,248,0.3)', borderLeft: '1px solid rgba(129,140,248,0.3)' },
            { top: 16, right: 16, borderTop: '1px solid rgba(129,140,248,0.3)', borderRight: '1px solid rgba(129,140,248,0.3)' },
            { bottom: 16, left: 16, borderBottom: '1px solid rgba(129,140,248,0.3)', borderLeft: '1px solid rgba(129,140,248,0.3)' },
            { bottom: 16, right: 16, borderBottom: '1px solid rgba(129,140,248,0.3)', borderRight: '1px solid rgba(129,140,248,0.3)' },
          ].map((style, i) => (
            <div key={i} style={{ position: 'absolute', width: 20, height: 20, opacity: 0.5, ...style }} />
          ))}

          {/* Main content */}
          <div className="ls-content-enter" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 28,
            position: 'relative', zIndex: 1,
          }}>
            {/* Logo + spinner stack */}
            <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer ring */}
              <svg style={{ position: 'absolute', inset: 0, animation: 'ls-ring-spin 2.4s linear infinite' }} width="72" height="72" viewBox="0 0 72 72" fill="none">
                <circle cx="36" cy="36" r="34" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" />
                <path d="M36 2 A34 34 0 0 1 70 36" stroke="rgba(129,140,248,0.9)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {/* Inner ring reverse */}
              <svg style={{ position: 'absolute', inset: 8, animation: 'ls-ring-spin-rev 3.6s linear infinite' }} width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="26" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
                <path d="M28 2 A26 26 0 0 0 2 28" stroke="rgba(129,140,248,0.5)" strokeWidth="1" strokeLinecap="round" />
              </svg>
              {/* Logo icon */}
              <div style={{
                width: 40, height: 40,
                borderRadius: 10,
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(129,140,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'ls-logo-glow 3s ease-in-out infinite',
              }}>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.9"/>
                  <rect x="9" y="2" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.55"/>
                  <rect x="2" y="9" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.55"/>
                  <rect x="9" y="9" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.9"/>
                </svg>
              </div>
            </div>

            {/* Label + dots */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e2f0', letterSpacing: '-0.025em' }}>
                Toolbox
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(226,226,240,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Loading
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: 'rgba(129,140,248,0.8)',
                      animation: `ls-dot-blink 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6fb] dark:bg-[#07070f] text-[#0a0a14] dark:text-[#e2e2f0]">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/budget" replace />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/financial-health" element={<FinancialHealth />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/gifts" element={<Gifts />} />
        <Route path="/maintenance" element={<Maintenance />} />
      </Routes>
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
