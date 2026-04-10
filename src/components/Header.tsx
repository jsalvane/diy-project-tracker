import { useApp } from '../context/AppContext';
import { Link, useLocation } from 'react-router-dom';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

interface Props {
  onCmdK: () => void;
}

export function Header({ onCmdK }: Props) {
  const { state, toggleDarkMode } = useApp();
  const location = useLocation();

  const isProjectDetail = location.pathname.startsWith('/project/');

  // On desktop: only show the header when on a project detail page (back button)
  // On mobile: always show (branding + controls)

  return (
    <header
      className={`sticky top-0 z-20 glass border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] ${
        // On desktop, hide the header unless we're on project detail (sidebar handles nav)
        isProjectDetail ? 'flex' : 'flex lg:hidden'
      }`}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-5 h-[52px] flex items-center justify-between gap-3">

        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          {isProjectDetail ? (
            /* Back button — shown on all screen sizes for project detail */
            <Link
              to="/projects"
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.45)] hover:text-[#E31937] dark:hover:text-[#FF4D5C] transition-colors"
            >
              <ChevronLeft />
              All Projects
            </Link>
          ) : (
            /* Mobile-only brand (desktop has sidebar with logo) */
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/apple-touch-icon.png"
                alt="Toolbox"
                style={{ width: 24, height: 24, borderRadius: 6, boxShadow: '0 0 10px rgba(227,25,55,0.35)' }}
              />
              <span className="text-[13.5px] font-bold tracking-[-0.03em] text-[#0a0a14] dark:text-[#e2e2f0] group-hover:text-[#E31937] dark:group-hover:text-[#FF4D5C] transition-colors">
                Toolbox
              </span>
            </Link>
          )}
        </div>

        {/* Right — controls */}
        <div className="flex items-center gap-1">
          {/* Search button (mobile) */}
          <button
            onClick={onCmdK}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.38)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] hover:bg-[rgba(0,0,20,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            title="Search (⌘K)"
          >
            <SearchIcon />
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.38)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0] hover:bg-[rgba(0,0,20,0.05)] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            title={state.darkMode ? 'Light mode' : 'Dark mode'}
          >
            {state.darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
