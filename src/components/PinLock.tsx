import { useState, useEffect, useRef } from 'react';

const CORRECT_PIN = '9999';
const SESSION_KEY = 'pin_unlocked';

// Phone-style sub-labels (skip 1, 0 shows '+')
const LETTERS: Record<string, string> = {
  '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
  '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
};

function BackspaceIcon() {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" fill="none" style={{ display: 'block' }}>
      <path
        d="M11 1H25C26.1 1 27 1.9 27 3V19C27 20.1 26.1 21 25 21H11L1 11L11 1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <line x1="16" y1="8" x2="21" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="21" y1="8" x2="16" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function PinLock({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  // Track which dot index was just filled for per-dot animation key
  const [dotAnimKey, setDotAnimKey] = useState(0);

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
      if (e.key >= '0' && e.key <= '9') {
        setPressedKey(e.key);
        setTimeout(() => setPressedKey(null), 140);
        pressDigit(e.key);
      } else if (e.key === 'Backspace') {
        setPressedKey('del');
        setTimeout(() => setPressedKey(null), 140);
        pressDelete();
      }
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
    setDotAnimKey(k => k + 1);
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
        }, 720);
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

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['',  '0', 'del'],
  ];

  return (
    <>
      <style>{`
        /* ── Entrance ─────────────────────────────────────────────────────── */
        @keyframes pl-icon-rise {
          from { opacity: 0; transform: scale(0.8) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pl-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Dot fill pop ─────────────────────────────────────────────────── */
        @keyframes pl-dot-pop {
          0%   { transform: scale(0.3); }
          50%  { transform: scale(1.35); }
          72%  { transform: scale(0.88); }
          88%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        /* ── Error shake ──────────────────────────────────────────────────── */
        @keyframes pl-shake {
          0%,100% { transform: translateX(0); }
          12% { transform: translateX(-12px); }
          25% { transform: translateX(12px); }
          38% { transform: translateX(-9px); }
          52% { transform: translateX(9px); }
          65% { transform: translateX(-5px); }
          78% { transform: translateX(5px); }
          90% { transform: translateX(-2px); }
        }

        /* ── Unlock exit ──────────────────────────────────────────────────── */
        @keyframes pl-unlock-out {
          0%   { opacity: 1; transform: scale(1) translateY(0px); filter: blur(0px); }
          40%  { opacity: 1; transform: scale(1.03) translateY(-8px); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.12) translateY(-30px); filter: blur(28px); }
        }

        /* ── Success flash ────────────────────────────────────────────────── */
        @keyframes pl-flash {
          0%   { opacity: 0; }
          20%  { opacity: 0.22; }
          100% { opacity: 0; }
        }

        /* ── Scan line (ambient loading effect) ──────────────────────────── */
        @keyframes pl-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        /* ── Applied classes ─────────────────────────────────────────────── */
        .pl-icon-rise { animation: pl-icon-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.04s both; }
        .pl-rise-1    { animation: pl-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.14s both; }
        .pl-rise-2    { animation: pl-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both; }
        .pl-rise-3    { animation: pl-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.31s both; }
        .pl-rise-4    { animation: pl-rise 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.40s both; }
        .pl-dot-pop   { animation: pl-dot-pop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .pl-shake     { animation: pl-shake 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
        .pl-unlock-out { animation: pl-unlock-out 0.95s cubic-bezier(0.4, 0, 1, 1) forwards; }
        .pl-flash     { animation: pl-flash 0.95s ease-out forwards; }

        /* ── Key button ──────────────────────────────────────────────────── */
        .pl-key {
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          transition: transform 0.09s ease, background 0.09s ease,
                      border-color 0.09s ease, box-shadow 0.09s ease;
          outline: none;
        }
        .pl-key:active,
        .pl-key.pl-pressed {
          transform: scale(0.91) !important;
          background: rgba(255,255,255,0.16) !important;
          border-color: rgba(255,255,255,0.2) !important;
          box-shadow: inset 0 0 30px rgba(255,255,255,0.04) !important;
        }
        .pl-key-del:active,
        .pl-key-del.pl-pressed {
          transform: scale(0.91) !important;
          background: rgba(255,255,255,0.07) !important;
        }

        /* ── Responsive sizing ────────────────────────────────────────────── */
        .pl-wrap {
          --kw: 98px;
          --kh: 98px;
          --kgap: 14px;
          --kr: 20px;
          --ds: 18px;
          --dgap: 30px;
        }
        @media (max-height: 720px) {
          .pl-wrap { --kw: 84px; --kh: 84px; --kgap: 12px; --ds: 16px; --dgap: 26px; --kr: 17px; }
        }
        @media (max-height: 600px) {
          .pl-wrap { --kw: 70px; --kh: 70px; --kgap: 10px; --ds: 13px; --dgap: 21px; --kr: 13px; }
        }
      `}</style>

      {/* White flash on success */}
      {unlocking && (
        <div
          className="pl-flash"
          style={{
            position: 'fixed', inset: 0, zIndex: 1002,
            background: '#ffffff',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        className={`pl-wrap${unlocking ? ' pl-unlock-out' : ''}`}
        style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #232325 0%, #2a0a10 55%, #9b1020 100%)',
          pointerEvents: unlocking ? 'none' : 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Subtle horizontal rule at bottom edge */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
        }} />

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0s',
        }}>
          {/* App icon */}
          <div className={visible ? 'pl-icon-rise' : ''} style={{ marginBottom: 30 }}>
            <img
              src="/apple-touch-icon.png"
              alt="Toolbox"
              style={{
                width: 80, height: 80,
                borderRadius: 22,
                boxShadow: [
                  '0 24px 64px rgba(0,0,0,0.85)',
                  '0 0 0 1px rgba(255,255,255,0.08)',
                  '0 0 48px rgba(227,25,55,0.10)',
                ].join(', '),
                display: 'block',
              }}
            />
          </div>

          {/* App name — wide-tracked caps like TESLA */}
          <div
            className={visible ? 'pl-rise-1' : ''}
            style={{
              fontSize: 14,
              fontWeight: 300,
              color: 'rgba(255,255,255,0.88)',
              letterSpacing: '0.40em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            Toolbox
          </div>

          {/* Subtitle */}
          <div
            className={visible ? 'pl-rise-2' : ''}
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.06em',
              marginBottom: 56,
            }}
          >
            Enter passcode to continue
          </div>

          {/* PIN dots */}
          <div
            className={`${error ? 'pl-shake' : ''} ${visible ? 'pl-rise-3' : ''}`}
            style={{
              display: 'flex',
              gap: 'var(--dgap)',
              marginBottom: 56,
              alignItems: 'center',
            }}
          >
            {[0, 1, 2, 3].map(i => {
              const filled = i < pin.length;
              // Use dotAnimKey so re-entering a digit at same position re-triggers animation
              const animKey = filled ? `${i}-${dotAnimKey}` : `${i}-empty`;
              return (
                <div
                  key={animKey}
                  className={filled && !error ? 'pl-dot-pop' : ''}
                  style={{
                    width: 'var(--ds)',
                    height: 'var(--ds)',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: error
                      ? '#ef4444'
                      : filled
                      ? '#ffffff'
                      : 'transparent',
                    border: `1.5px solid ${
                      error ? '#ef4444' : filled ? '#ffffff' : 'rgba(255,255,255,0.22)'
                    }`,
                    boxShadow: filled && !error
                      ? '0 0 16px rgba(255,255,255,0.6), 0 0 5px rgba(255,255,255,0.95)'
                      : error
                      ? '0 0 14px rgba(239,68,68,0.65)'
                      : 'none',
                    transition: 'background 0.1s, border-color 0.1s, box-shadow 0.15s',
                  }}
                />
              );
            })}
          </div>

          {/* Keypad */}
          <div
            className={visible ? 'pl-rise-4' : ''}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--kgap)' }}
          >
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 'var(--kgap)' }}>
                {row.map((key, ki) => {
                  if (key === '') {
                    return (
                      <div
                        key={ki}
                        style={{ width: 'var(--kw)', height: 'var(--kh)' }}
                      />
                    );
                  }

                  const isDelete = key === 'del';
                  const isPressed = pressedKey === key;

                  return (
                    <button
                      key={ki}
                      className={`pl-key${isDelete ? ' pl-key-del' : ''}${isPressed ? ' pl-pressed' : ''}`}
                      onClick={() => isDelete ? pressDelete() : pressDigit(key)}
                      style={{
                        width: 'var(--kw)',
                        height: 'var(--kh)',
                        borderRadius: isDelete ? 'var(--kr)' : 'var(--kr)',
                        border: isDelete
                          ? '1px solid transparent'
                          : '1px solid rgba(255,255,255,0.09)',
                        background: isDelete
                          ? 'transparent'
                          : 'rgba(255,255,255,0.055)',
                        color: isDelete
                          ? 'rgba(255,255,255,0.42)'
                          : 'rgba(255,255,255,0.92)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                        fontFamily: 'inherit',
                        backdropFilter: isDelete ? 'none' : 'blur(10px)',
                        WebkitBackdropFilter: isDelete ? 'none' : 'blur(10px)',
                        boxShadow: isDelete
                          ? 'none'
                          : 'inset 0 1px 0 rgba(255,255,255,0.06)',
                      }}
                    >
                      {isDelete ? (
                        <BackspaceIcon />
                      ) : (
                        <>
                          <span style={{
                            fontSize: 32,
                            fontWeight: 200,
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                            color: 'rgba(255,255,255,0.92)',
                          }}>
                            {key}
                          </span>
                          {LETTERS[key] && (
                            <span style={{
                              fontSize: 8,
                              fontWeight: 500,
                              letterSpacing: '0.20em',
                              color: 'rgba(255,255,255,0.24)',
                              lineHeight: 1,
                              marginTop: 1,
                            }}>
                              {LETTERS[key]}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Error label */}
          <div style={{
            marginTop: 32,
            height: 14,
            fontSize: 10.5,
            fontWeight: 500,
            color: '#ef4444',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: error ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}>
            Incorrect passcode
          </div>
        </div>
      </div>
    </>
  );
}
