import { Link, useLocation } from 'react-router-dom';


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
  const location = useLocation();

  const isProjectDetail = location.pathname.startsWith('/project/');

  // On desktop: only show the header when on a project detail page (back button)
  // On mobile: always show (branding + controls)

  return (
    <header
      className={isProjectDetail ? 'flex' : 'flex lg:hidden'}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--ink-line)',
      }}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-5 h-[52px] flex items-center justify-between gap-3">

        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          {isProjectDetail ? (
            <Link
              to="/projects"
              className="flex items-center gap-1.5 transition-colors"
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', textDecoration: 'none' }}
            >
              <ChevronLeft />
              <span style={{ color: 'var(--ink-3)' }}>All Projects</span>
            </Link>
          ) : (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <span className="font-serif" style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--ink)' }}>
                Toolbox<em style={{ color: 'var(--rust)' }}>.</em>
              </span>
            </Link>
          )}
        </div>

        {/* Right — search */}
        <button
          onClick={onCmdK}
          className="w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors hover:bg-[var(--paper-2)]"
          style={{ color: 'var(--ink-3)', border: 'none', background: 'transparent', cursor: 'pointer' }}
          title="Search (⌘K)"
        >
          <SearchIcon />
        </button>
      </div>
    </header>
  );
}
