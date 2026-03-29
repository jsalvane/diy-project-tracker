import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { state, toggleDarkMode } = useApp();
  const location = useLocation();

  return (
    <header className="border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link to="/" className="font-bold text-base tracking-tight text-gray-900 dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
            DIY Tracker
          </Link>
          {location.pathname !== '/' && (
            <Link to="/" className="text-sm text-gray-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
              &larr; All Projects
            </Link>
          )}
        </div>
        <button
          onClick={toggleDarkMode}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors"
          title="Toggle dark mode"
        >
          {state.darkMode ? '☀ Light' : '◑ Dark'}
        </button>
      </div>
    </header>
  );
}
