import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/',                label: 'Projects'  },
  { path: '/financial-health', label: 'Financial' },
  { path: '/budget',           label: 'Budget'    },
  { path: '/gifts',            label: 'Gifts'     },
];

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/>
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/>
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

export function Header() {
  const { state, toggleDarkMode } = useApp();
  const location = useLocation();

  const isProjectDetail = location.pathname.startsWith('/project/');
  const activeTab = isProjectDetail ? '/' : location.pathname;

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 h-[52px] flex items-center justify-between gap-2 sm:gap-4">

        {/* Left — Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            {/* Logo mark */}
            <div className="w-6 h-6 rounded-[6px] bg-[#6366f1] dark:bg-[#818cf8] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(99,102,241,0.35)]">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="hidden sm:inline text-[13px] font-semibold tracking-[-0.02em] text-[#0a0a14] dark:text-[#e2e2f0] group-hover:text-[#6366f1] dark:group-hover:text-[#818cf8] transition-colors">
              Toolbox
            </span>
          </Link>

          {/* Divider */}
          <span className="w-px h-4 bg-[rgba(0,0,20,0.1)] dark:bg-[rgba(255,255,255,0.08)]" />

          {/* Back link or nav */}
          {isProjectDetail ? (
            <Link
              to="/"
              className="flex items-center gap-1 text-[12px] font-medium text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#6366f1] dark:hover:text-[#818cf8] transition-colors"
            >
              <ChevronLeft />
              All Projects
            </Link>
          ) : (
            <nav className="flex items-center gap-0.5">
              {TABS.map(tab => {
                const isActive = activeTab === tab.path;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`text-[12px] sm:text-[12.5px] font-medium px-2 sm:px-3 py-1.5 rounded-[7px] transition-all duration-150 ${
                      isActive
                        ? 'bg-[rgba(99,102,241,0.1)] dark:bg-[rgba(129,140,248,0.12)] text-[#6366f1] dark:text-[#818cf8]'
                        : 'text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] hover:bg-[rgba(0,0,20,0.04)] dark:hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right — Controls */}
        <button
          onClick={toggleDarkMode}
          className="w-7 h-7 flex items-center justify-center rounded-[7px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] hover:bg-[rgba(0,0,20,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          title={state.darkMode ? 'Light mode' : 'Dark mode'}
        >
          {state.darkMode ? <SunIcon /> : <MoonIcon />}
        </button>

      </div>
    </header>
  );
}
