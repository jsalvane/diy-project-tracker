import { useState } from 'react';

const CORRECT_PIN = '9999';
const SESSION_KEY = 'pin_unlocked';

export function PinLock({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  function handleDigit(d: string) {
    const next = pin + d;
    if (next.length > 4) return;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        sessionStorage.setItem(SESSION_KEY, '1');
        setUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => { setPin(''); setError(false); }, 600);
      }
    }
  }

  function handleDelete() {
    setPin(p => p.slice(0, -1));
    setError(false);
  }

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center mb-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Enter PIN</h1>
        <p className="text-sm text-gray-400 dark:text-zinc-500">Enter your 4-digit PIN to continue</p>
      </div>

      {/* Dots */}
      <div className="flex gap-4">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              error
                ? 'border-red-400 bg-red-400'
                : i < pin.length
                  ? 'border-orange-400 bg-orange-400'
                  : 'border-gray-300 dark:border-zinc-600'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((d, i) => {
          if (d === '') return <div key={i} />;
          if (d === '⌫') {
            return (
              <button
                key={i}
                onClick={handleDelete}
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {d}
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
            >
              {d}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-400 animate-pulse">Incorrect PIN</p>
      )}
    </div>
  );
}
