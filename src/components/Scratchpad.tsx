import { useState, useEffect, useRef } from 'react';
import { useScratchpad } from '../hooks/useScratchpad';
import type { Note } from '../lib/types';

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  );
}

// ─── Note List Item ────────────────────────────────────────────────────────────
function NoteItem({ note, isActive, onClick }: { note: Note; isActive: boolean; onClick: () => void }) {
  const snippet = note.content.replace(/\n+/g, ' ').trim();
  const title = note.title.trim() || 'Untitled';

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-3 rounded-[10px] transition-all duration-150"
      style={{
        background: isActive ? 'var(--paper-2)' : 'transparent',
        border: `1px solid ${isActive ? 'var(--ink-line-2)' : 'transparent'}`,
      }}
    >
      <div
        className="text-[13px] font-semibold truncate mb-0.5"
        style={{ color: isActive ? 'var(--ink)' : 'var(--ink-2)' }}
      >
        {title}
      </div>
      <div className="flex items-center gap-2">
        <span className="tape-label shrink-0" style={{ fontSize: 9 }}>
          {formatRelative(note.updatedAt)}
        </span>
        {snippet && (
          <span className="truncate" style={{ fontSize: 11, color: 'var(--ink-4)' }}>
            {snippet}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────
function Editor({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note;
  onUpdate: (id: string, changes: Partial<Pick<Note, 'title' | 'content'>>) => void;
  onDelete: (id: string) => void;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Focus title when a new (empty) note is opened
  useEffect(() => {
    if (!note.title && !note.content) {
      titleRef.current?.focus();
    }
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDelete() {
    if (showDeleteConfirm) {
      onDelete(note.id);
    } else {
      setShowDeleteConfirm(true);
    }
  }

  // Reset confirm state when switching notes
  useEffect(() => { setShowDeleteConfirm(false); }, [note.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: '1px solid var(--ink-line)' }}>
        <span className="tape-label">{formatRelative(note.updatedAt)}</span>
        <button
          onClick={handleDelete}
          className="tape-label flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-150"
          style={{
            background: showDeleteConfirm ? 'var(--rust)' : 'transparent',
            color: showDeleteConfirm ? 'var(--paper)' : 'var(--ink-4)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <TrashIcon />
          {showDeleteConfirm ? 'Confirm delete' : 'Delete'}
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-5 pb-2 shrink-0">
        <input
          ref={titleRef}
          type="text"
          value={note.title}
          onChange={e => onUpdate(note.id, { title: e.target.value })}
          placeholder="Title"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: "'Instrument Serif', serif",
            fontSize: 28,
            fontWeight: 400,
            color: 'var(--ink)',
          }}
        />
      </div>

      {/* Body — ruled paper */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        <textarea
          value={note.content}
          onChange={e => onUpdate(note.id, { content: e.target.value })}
          placeholder="Start writing…"
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: 15,
            lineHeight: '28px',
            color: 'var(--ink)',
            fontFamily: "'Inter', sans-serif",
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--ink-line) 27px, var(--ink-line) 28px)',
            backgroundAttachment: 'local',
            paddingTop: 4,
          }}
        />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <p className="font-serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
        Select a note or create a new one<em style={{ color: 'var(--rust)' }}>.</em>
      </p>
      <button onClick={onCreate} className="btn-ghost btn-sm">
        New note
      </button>
    </div>
  );
}

// ─── Scratchpad ───────────────────────────────────────────────────────────────
export function Scratchpad() {
  const { notes, loading, addNote, updateNote, deleteNote } = useScratchpad();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Auto-select first note once loaded
  useEffect(() => {
    if (!loading && activeId === null && notes.length > 0) {
      setActiveId(notes[0].id);
    }
  }, [loading, notes, activeId]);

  // Keep activeId valid when notes change (e.g. after delete)
  useEffect(() => {
    if (activeId && !notes.find(n => n.id === activeId)) {
      setActiveId(notes[0]?.id ?? null);
    }
  }, [notes, activeId]);

  async function handleNew() {
    const note = await addNote();
    setActiveId(note.id);
  }

  function handleDelete(id: string) {
    const idx = notes.findIndex(n => n.id === id);
    deleteNote(id);
    // Select adjacent note after delete
    const remaining = notes.filter(n => n.id !== id);
    setActiveId(remaining[Math.max(0, idx - 1)]?.id ?? null);
  }

  const activeNote = notes.find(n => n.id === activeId) ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="tape-label">Scratchpad</span>
          <p className="display-md" style={{ color: 'var(--ink)', marginTop: 4 }}>
            Notes<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
          </p>
        </div>
        <button
          onClick={handleNew}
          className="btn-primary btn-sm flex items-center gap-1.5"
        >
          <PlusIcon />
          New note
        </button>
      </div>

      {/* Two-panel layout */}
      <div
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--ink-line)',
          borderRadius: 14,
          overflow: 'hidden',
          height: 'calc(100vh - 220px)',
          minHeight: 400,
          display: 'flex',
        }}
      >
        {/* Sidebar */}
        <div
          style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--ink-line)', overflowY: 'auto' }}
        >
          {loading ? (
            <div className="px-3 py-4 text-center tape-label">Loading…</div>
          ) : notes.length === 0 ? (
            <div className="px-3 py-4 text-center tape-label">No notes yet</div>
          ) : (
            <div className="p-2 flex flex-col gap-0.5">
              {notes.map(note => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isActive={note.id === activeId}
                  onClick={() => setActiveId(note.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="flex-1 overflow-hidden">
          {activeNote ? (
            <Editor note={activeNote} onUpdate={updateNote} onDelete={handleDelete} />
          ) : (
            <EmptyState onCreate={handleNew} />
          )}
        </div>
      </div>
    </div>
  );
}
