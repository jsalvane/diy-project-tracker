import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { state, toggleDarkMode } = useApp();
  const location = useLocation();

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-teal-600 dark:hover:text-teal-400">
            DIY Tracker
          </Link>
          {location.pathname !== '/' && (
            <Link to="/" className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
              &larr; All Projects
            </Link>
          )}
        </div>
        <button
          onClick={toggleDarkMode}
          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Toggle dark mode"
        >
          {state.darkMode ? '☀ Light' : '● Dark'}
        </button>
      </div>
    </header>
  );
}
