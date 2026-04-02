import { useState, useEffect, useRef } from 'react';

const CORRECT_PIN = '9999';
const SESSION_KEY = 'pin_unlocked';

export function PinLock({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [visible, setVisible] = useState(false);

  const pinRef = useRef(pin);
  const unlockingRef = useRef(unlocking);
  pinRef.current = pin;
  unlockingRef.current = unlocking;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (unlockingRef.current) return;
      if (e.key >= '0' && e.key <= '9') pressDigit(e.key);
      else if (e.key === 'Backspace') pressDelete();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (unlocked) return <>{children}</>;

  function pressDigit(d: string) {
    if (unlockingRef.current) return;
    const next = pinRef.current + d;
    if (next.length > 4) return;
    setPin(next);
    pinRef.current = next;
    setError(false);
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setUnlocking(true);
        unlockingRef.current = true;
        setTimeout(() => setUnlocked(true), 950);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          pinRef.current = '';
          setError(false);
        }, 650);
      }
    }
  }

  function pressDelete() {
    if (unlockingRef.current) return;
    setPin(p => {
      const next = p.slice(0, -1);
      pinRef.current = next;
      return next;
    });
    setError(false);
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <>
      <style>{`
        @keyframes pl-grid-drift {
          from { transform: translate(0, 0); }
          to   { transform: translate(40px, 40px); }
        }
        @keyframes pl-scan {
          0%   { top: -2px; opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pl-orb-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.6; }
          50%       { transform: translate(-50%, -50%) scale(1.15); opacity: 1;   }
        }
        @keyframes pl-logo-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(129,140,248,0), 0 0 30px 6px rgba(99,102,241,0.2); }
          50%       { box-shadow: 0 0 0 8px rgba(129,140,248,0.07), 0 0 50px 12px rgba(99,102,241,0.35); }
        }
        @keyframes pl-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes pl-dot-pop {
          0%   { transform: scale(0.5); }
          65%  { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @keyframes pl-shake {
          0%,100% { transform: translateX(0); }
          18%     { transform: translateX(-7px); }
          36%     { transform: translateX(7px); }
          54%     { transform: translateX(-4px); }
          72%     { transform: translateX(4px); }
        }
        @keyframes pl-ring-burst {
          0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.9; }
          100% { transform: translate(-50%,-50%) scale(70); opacity: 0; }
        }
        @keyframes pl-screen-open {
          0%   { opacity: 1; filter: blur(0px)   brightness(1); }
          40%  { opacity: 1; filter: blur(2px)   brightness(2); }
          100% { opacity: 0; filter: blur(12px)  brightness(3); }
        }
        @keyframes pl-corner-flash {
          0%, 100% { opacity: 0; }
          40%, 60% { opacity: 1; }
        }
        .pl-screen-unlocking {
          animation: pl-screen-open 0.95s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          pointer-events: none;
        }
        .pl-content-enter {
          animation: pl-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .pl-dot-pop {
          animation: pl-dot-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .pl-shake {
          animation: pl-shake 0.42s ease-in-out;
        }
        /* Responsive: compact on small/short viewports */
        .pl-wrap { --pl-gap: 28px; --pl-btn: 72px; --pl-logo: 52px; --pl-btn-gap: 10px; }
        @media (max-height: 620px) {
          .pl-wrap { --pl-gap: 16px; --pl-btn: 60px; --pl-logo: 42px; --pl-btn-gap: 8px; }
        }
        @media (max-height: 480px) {
          .pl-wrap { --pl-gap: 10px; --pl-btn: 52px; --pl-logo: 36px; --pl-btn-gap: 6px; }
        }
      `}</style>

      <div
        className={`pl-wrap${unlocking ? ' pl-screen-unlocking' : ''}`}
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
          animation: 'pl-grid-drift 5s linear infinite',
        }} />

        {/* Center radial glow */}
        <div style={{
          position: 'absolute',
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.04) 40%, transparent 70%)',
          top: '50%', left: '50%',
          animation: 'pl-orb-pulse 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Scan line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.5) 30%, rgba(129,140,248,0.8) 50%, rgba(99,102,241,0.5) 70%, transparent 100%)',
          animation: 'pl-scan 7s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* Corner accents */}
        {[
          { top: 16, left: 16, borderTop: '1px solid rgba(129,140,248,0.3)', borderLeft: '1px solid rgba(129,140,248,0.3)' },
          { top: 16, right: 16, borderTop: '1px solid rgba(129,140,248,0.3)', borderRight: '1px solid rgba(129,140,248,0.3)' },
          { bottom: 16, left: 16, borderBottom: '1px solid rgba(129,140,248,0.3)', borderLeft: '1px solid rgba(129,140,248,0.3)' },
          { bottom: 16, right: 16, borderBottom: '1px solid rgba(129,140,248,0.3)', borderRight: '1px solid rgba(129,140,248,0.3)' },
        ].map((style, i) => (
          <div key={i} style={{
            position: 'absolute', width: 20, height: 20,
            opacity: unlocking ? 1 : 0.5,
            animation: unlocking ? `pl-corner-flash 0.95s ease forwards` : undefined,
            transition: 'opacity 0.3s',
            ...style,
          }} />
        ))}

        {/* Unlock ring burst */}
        {unlocking && (
          <div style={{
            position: 'absolute',
            width: 16, height: 16,
            borderRadius: '50%',
            background: 'rgba(129,140,248,0.7)',
            top: '50%', left: '50%',
            animation: 'pl-ring-burst 0.95s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            pointerEvents: 'none',
          }} />
        )}

        {/* Main content */}
        <div
          className={visible ? 'pl-content-enter' : ''}
          style={{
            opacity: visible ? undefined : 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 'var(--pl-gap)',
            position: 'relative', zIndex: 1,
          }}
        >
          {/* Logo + heading */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 'var(--pl-logo)', height: 'var(--pl-logo)',
              borderRadius: 16,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(129,140,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pl-logo-glow 3s ease-in-out infinite',
            }}>
              <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.9"/>
                <rect x="9" y="2" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.55"/>
                <rect x="2" y="9" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.55"/>
                <rect x="9" y="9" width="5" height="5" rx="1.2" fill="#818cf8" opacity="0.9"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e2f0', letterSpacing: '-0.025em', marginBottom: 5 }}>
                Toolbox
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(226,226,240,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Enter PIN to access
              </div>
            </div>
          </div>

          {/* PIN dots */}
          <div className={error ? 'pl-shake' : ''} style={{ display: 'flex', gap: 18 }}>
            {[0,1,2,3].map(i => {
              const filled = i < pin.length;
              return (
                <div
                  key={i}
                  className={filled && !error ? 'pl-dot-pop' : ''}
                  style={{
                    width: 13, height: 13,
                    borderRadius: '50%',
                    border: `2px solid ${
                      error    ? 'rgba(248,113,113,0.75)'
                      : filled ? '#818cf8'
                               : 'rgba(226,226,240,0.18)'
                    }`,
                    background: error ? 'rgba(248,113,113,0.45)' : filled ? '#818cf8' : 'transparent',
                    boxShadow: !error && filled ? '0 0 12px 3px rgba(129,140,248,0.55)' : 'none',
                    transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
                  }}
                />
              );
            })}
          </div>

          {/* Keypad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--pl-btn-gap)' }}>
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;
              const isDelete = d === '⌫';
              return (
                <button
                  key={i}
                  onClick={() => isDelete ? pressDelete() : pressDigit(d)}
                  style={{
                    width: 'var(--pl-btn)', height: 'var(--pl-btn)',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: isDelete ? 'transparent' : 'rgba(255,255,255,0.04)',
                    backdropFilter: 'blur(8px)',
                    color: isDelete ? 'rgba(226,226,240,0.38)' : '#e2e2f0',
                    fontSize: isDelete ? 18 : 22,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'inherit',
                    transition: 'transform 0.08s, background 0.12s, border-color 0.12s, box-shadow 0.12s',
                  }}
                  onPointerDown={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)';
                    if (!isDelete) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.2)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(129,140,248,0.4)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px 4px rgba(99,102,241,0.25)';
                    }
                  }}
                  onPointerUp={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.background = isDelete ? 'transparent' : 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                  onPointerLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.background = isDelete ? 'transparent' : 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Error message */}
          <div style={{
            height: 16,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(248,113,113,0.75)',
            opacity: error ? 1 : 0,
            transition: 'opacity 0.15s',
          }}>
            Incorrect PIN
          </div>
        </div>
      </div>
    </>
  );
}
