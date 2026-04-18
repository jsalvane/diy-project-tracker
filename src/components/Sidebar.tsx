import { Link, useLocation } from 'react-router-dom';

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

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: '/',            label: 'Home',        icon: HomeIcon,   exact: true,  matchPaths: null },
  { path: '/money',       label: 'Money',       icon: DollarIcon, exact: false, matchPaths: ['/money', '/financial-health', '/budget'] },
  { path: '/projects',    label: 'Projects',    icon: FolderIcon, exact: false, matchPaths: ['/projects', '/project/'] },
  { path: '/maintenance', label: 'Maintenance', icon: WrenchIcon, exact: false, matchPaths: null },
  { path: '/gifts',       label: 'Gifts',       icon: GiftIcon,   exact: false, matchPaths: null },
  { path: '/scratchpad',  label: 'Scratchpad',  icon: NoteIcon,   exact: false, matchPaths: null },
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
  const location = useLocation();

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30"
        style={{
          width: 'var(--sidebar-w)',
          background: 'var(--paper)',
          borderRight: '1px solid var(--ink-line)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span
              className="font-serif"
              style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              Toolbox<em style={{ color: 'var(--rust)' }}>.</em>
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
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors duration-150 relative"
                style={{
                  color: active ? 'var(--ink)' : 'var(--ink-3)',
                  background: active ? 'var(--paper-2)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                    style={{ width: 2, height: 18, background: 'var(--rust)' }}
                  />
                )}
                <Icon size={16} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom — search */}
        <div className="px-3 pb-5 pt-3" style={{ borderTop: '1px solid var(--ink-line)' }}>
          <button
            onClick={onCmdK}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] transition-colors duration-150 hover:bg-[var(--paper-2)]"
            style={{ color: 'var(--ink-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Search</span>
            </div>
            <kbd
              className="tape-label px-1.5 py-0.5 rounded"
              style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-line)', fontSize: 9, letterSpacing: '0.05em' }}
            >
              ⌘K
            </kbd>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around"
        style={{
          background: 'var(--paper)',
          borderTop: '1px solid var(--ink-line)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
          paddingTop: 8,
        }}
      >
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const active = isNavActive(item, location.pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 px-1 py-1 min-w-0 flex-1 relative"
              style={{ color: active ? 'var(--ink)' : 'var(--ink-3)', textDecoration: 'none' }}
            >
              {active && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 2,
                  background: 'var(--rust)',
                  borderRadius: 1,
                }} />
              )}
              <Icon size={20} />
              <span style={{
                fontSize: 9,
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: active ? 'var(--rust)' : 'var(--ink-3)',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
