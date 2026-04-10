import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ── Icons ─────────────────────────────────────────────────────────────────────

function HomeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function DollarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function FolderIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function WrenchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}

function GiftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  );
}

function NoteIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function SunIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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

function MoonIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/',            label: 'Home',       icon: HomeIcon,   exact: true,  matchPaths: null },
  { path: '/money',       label: 'Money',      icon: DollarIcon, exact: false, matchPaths: ['/money', '/financial-health', '/budget'] },
  { path: '/projects',    label: 'Projects',   icon: FolderIcon, exact: false, matchPaths: ['/projects', '/project/'] },
  { path: '/maintenance', label: 'Maintenance',icon: WrenchIcon, exact: false, matchPaths: null },
  { path: '/gifts',       label: 'Gifts',      icon: GiftIcon,   exact: false, matchPaths: null },
  { path: '/scratchpad',  label: 'Scratchpad', icon: NoteIcon,   exact: false, matchPaths: null },
];

function isNavActive(item: typeof NAV_ITEMS[number], pathname: string): boolean {
  if (item.exact) return pathname === item.path;
  if (item.matchPaths) {
    return item.matchPaths.some(p => pathname === p || pathname.startsWith(p));
  }
  return pathname === item.path || pathname.startsWith(item.path + '/');
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar({ onCmdK }: { onCmdK: () => void }) {
  const { state, toggleDarkMode } = useApp();
  const location = useLocation();

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30"
        style={{
          width: 'var(--sidebar-w)',
          background: '#0b0b14',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/apple-touch-icon.png"
              alt="Toolbox"
              style={{ width: 30, height: 30, borderRadius: 8, boxShadow: '0 0 16px rgba(227,25,55,0.45)' }}
            />
            <span className="text-[15px] font-bold tracking-[-0.04em] text-white group-hover:text-[#FF4D5C] transition-colors">
              Toolbox
            </span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item, location.pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-[9px] rounded-[9px] transition-all duration-150 ${
                  active
                    ? 'bg-[rgba(255,77,92,0.13)] text-[#FF4D5C]'
                    : 'text-[rgba(255,255,255,0.36)] hover:text-[rgba(255,255,255,0.82)] hover:bg-[rgba(255,255,255,0.055)]'
                }`}
              >
                <Icon size={17} />
                <span className="text-[13px] font-medium flex-1">{item.label}</span>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF4D5C', opacity: 0.9 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div
          className="px-3 pb-5 pt-3 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Search / Cmd+K */}
          <button
            onClick={onCmdK}
            className="w-full flex items-center justify-between px-3 py-[9px] rounded-[9px] transition-all duration-150 group hover:bg-[rgba(255,255,255,0.055)]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <div className="flex items-center gap-3">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="text-[13px] font-medium group-hover:text-[rgba(255,255,255,0.75)] transition-colors">
                Search
              </span>
            </div>
            <kbd
              className="text-[10px] font-mono px-1.5 py-0.5 rounded tracking-wide transition-colors"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-3 py-[9px] rounded-[9px] transition-all duration-150 hover:bg-[rgba(255,255,255,0.055)]"
            style={{ color: 'rgba(255,255,255,0.36)' }}
          >
            {state.darkMode ? <SunIcon size={17} /> : <MoonIcon size={17} />}
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {state.darkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around bg-white dark:bg-[#0b0b14] border-t border-[rgba(0,0,20,0.08)] dark:border-[rgba(255,255,255,0.06)]"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          paddingBottom: 'env(safe-area-inset-bottom, 6px)',
          paddingTop: 6,
        }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = isNavActive(item, location.pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-[3px] px-3 py-1.5 rounded-xl transition-all duration-150 min-w-0 ${
                active
                  ? 'text-[#E31937] dark:text-[#FF4D5C]'
                  : 'text-[rgba(10,10,20,0.3)] dark:text-[rgba(255,255,255,0.28)]'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-semibold tracking-tight truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
