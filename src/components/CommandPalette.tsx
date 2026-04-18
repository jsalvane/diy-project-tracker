import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  path: string;
  type: 'section' | 'project';
  icon: React.ReactNode;
}

const SECTION_ITEMS: Omit<PaletteItem, 'icon'>[] = [
  { id: 'home',        label: 'Home',        path: '/',            type: 'section' },
  { id: 'money',       label: 'Money',        path: '/money',       type: 'section' },
  { id: 'budget',      label: 'Budget',       path: '/budget',      type: 'section' },
  { id: 'fin-health',  label: 'Financial Health', path: '/financial-health', type: 'section' },
  { id: 'projects',    label: 'Projects',     path: '/projects',    type: 'section' },
  { id: 'maintenance', label: 'Maintenance',  path: '/maintenance', type: 'section' },
  { id: 'gifts',       label: 'Gifts',        path: '/gifts',       type: 'section' },
  { id: 'scratchpad',  label: 'Scratchpad',   path: '/scratchpad',  type: 'section' },
];

function SectionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const { state } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const projectItems: PaletteItem[] = state.projects.map(p => ({
    id: p.id,
    label: p.name,
    sublabel: p.status.replace('_', ' '),
    path: `/project/${p.id}`,
    type: 'project' as const,
    icon: <ProjectIcon />,
  }));

  const sectionItems: PaletteItem[] = SECTION_ITEMS.map(s => ({
    ...s,
    icon: <SectionIcon />,
  }));

  const all = [...sectionItems, ...projectItems];

  const filtered = query.trim()
    ? all.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        (item.sublabel && item.sublabel.toLowerCase().includes(query.toLowerCase()))
      )
    : all;

  const sectionResults = filtered.filter(i => i.type === 'section');
  const projectResults = filtered.filter(i => i.type === 'project');

  const flatResults = [...sectionResults, ...projectResults];

  const handleSelect = useCallback((item: PaletteItem) => {
    navigate(item.path);
    onClose();
    setQuery('');
  }, [navigate, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatResults[activeIdx];
        if (item) handleSelect(item);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flatResults, activeIdx, handleSelect, onClose]);

  if (!open) return null;

  let globalIdx = 0;

  function renderGroup(items: PaletteItem[], groupLabel: string) {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="tape-label px-4 pt-3 pb-1" style={{ color: 'var(--ink-4)' }}>
          {groupLabel}
        </div>
        <div className="receipt-strip mx-4" />
        {items.map(item => {
          const idx = globalIdx++;
          const isActive = idx === activeIdx;
          return (
            <button
              key={item.id}
              data-idx={idx}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIdx(idx)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
              style={{
                background: isActive ? 'var(--paper-2)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{ flexShrink: 0, color: isActive ? 'var(--rust)' : 'var(--ink-3)' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? 'var(--rust)' : 'var(--ink)' }}>
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="tape-label ml-2" style={{ textTransform: 'capitalize', letterSpacing: '0.05em' }}>
                    {item.sublabel}
                  </span>
                )}
              </span>
              {isActive && (
                <span style={{ flexShrink: 0, color: 'var(--rust)' }}>
                  <ArrowIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ animation: 'cmd-backdrop 0.15s ease-out' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(26,22,18,0.45)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[560px] mx-4 overflow-hidden animate-cmd-modal"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--ink-line-2)',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(26,22,18,0.25)',
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search or jump to..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "'Inter', sans-serif",
              color: 'var(--ink)',
            }}
          />
          <kbd className="tape-label px-1.5 py-0.5 rounded" style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-line)', fontSize: 9 }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto scrollbar-hide">
          {flatResults.length === 0 ? (
            <div className="tape-label px-4 py-8 text-center" style={{ color: 'var(--ink-4)' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {renderGroup(sectionResults, 'Sections')}
              {renderGroup(projectResults, 'Projects')}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-5 px-4 py-2.5" style={{ borderTop: '1px solid var(--ink-line)' }}>
          {[
            { keys: ['↑', '↓'], label: 'Navigate' },
            { keys: ['↵'], label: 'Select' },
            { keys: ['ESC'], label: 'Close' },
          ].map(({ keys, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              {keys.map(k => (
                <kbd
                  key={k}
                  className="tape-label px-1 py-0.5 rounded"
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--ink-line)', fontSize: 9 }}
                >
                  {k}
                </kbd>
              ))}
              <span className="tape-label" style={{ color: 'var(--ink-4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
