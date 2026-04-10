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
      <div className="py-1">
        <div className="px-4 pt-2 pb-1 text-[10px] font-semibold tracking-[0.08em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(255,255,255,0.28)]">
          {groupLabel}
        </div>
        {items.map(item => {
          const idx = globalIdx++;
          const isActive = idx === activeIdx;
          return (
            <button
              key={item.id}
              data-idx={idx}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                isActive
                  ? 'bg-[rgba(227,25,55,0.1)] dark:bg-[rgba(255,77,92,0.12)]'
                  : 'hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-[#E31937] dark:text-[#FF4D5C]' : 'text-[rgba(10,10,20,0.35)] dark:text-[rgba(255,255,255,0.3)]'}`}>
                {item.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`text-[13px] font-medium ${isActive ? 'text-[#E31937] dark:text-[#FF4D5C]' : 'text-[#0a0a14] dark:text-[#e2e2f0]'}`}>
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="ml-2 text-[11px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(255,255,255,0.28)] capitalize">
                    {item.sublabel}
                  </span>
                )}
              </span>
              {isActive && (
                <span className="shrink-0 text-[rgba(227,25,55,0.6)] dark:text-[rgba(255,77,92,0.6)]">
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
        className="absolute inset-0 bg-black/40 dark:bg-black/65"
        style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[560px] mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border-2)',
          animation: 'cmd-modal 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--c-border)' }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[rgba(10,10,20,0.35)] dark:text-[rgba(255,255,255,0.3)]">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search or jump to..."
            className="flex-1 bg-transparent outline-none text-[14px] font-medium text-[#0a0a14] dark:text-[#e2e2f0] placeholder-[rgba(10,10,20,0.3)] dark:placeholder-[rgba(255,255,255,0.28)]"
          />
          <kbd className="shrink-0 text-[11px] font-mono px-1.5 py-0.5 rounded text-[rgba(10,10,20,0.3)] dark:text-[rgba(255,255,255,0.28)] bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.07)] border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.1)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto">
          {flatResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(255,255,255,0.3)]">
              No results for "{query}"
            </div>
          ) : (
            <>
              {renderGroup(sectionResults, 'Sections')}
              {renderGroup(projectResults, 'Projects')}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="flex items-center gap-4 px-4 py-2.5"
          style={{ borderTop: '1px solid var(--c-border)' }}
        >
          {[
            { keys: ['↑', '↓'], label: 'Navigate' },
            { keys: ['↵'], label: 'Select' },
            { keys: ['ESC'], label: 'Close' },
          ].map(({ keys, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              {keys.map(k => (
                <kbd
                  key={k}
                  className="text-[10px] font-mono px-1 py-0.5 rounded bg-[rgba(0,0,20,0.05)] dark:bg-[rgba(255,255,255,0.07)] border border-[rgba(0,0,20,0.08)] dark:border-[rgba(255,255,255,0.1)] text-[rgba(10,10,20,0.45)] dark:text-[rgba(255,255,255,0.35)]"
                >
                  {k}
                </kbd>
              ))}
              <span className="text-[11px] text-[rgba(10,10,20,0.3)] dark:text-[rgba(255,255,255,0.25)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
