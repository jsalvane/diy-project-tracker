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
      className={`w-full text-left px-3 py-3 rounded-xl border transition-all duration-150 ${
        isActive
          ? 'bg-[rgba(227,25,55,0.08)] dark:bg-[rgba(255,77,92,0.1)] border-[rgba(227,25,55,0.2)] dark:border-[rgba(255,77,92,0.2)]'
          : 'bg-transparent border-transparent hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)]'
      }`}
    >
      <div className={`text-[13px] font-semibold truncate mb-0.5 ${
        isActive ? 'text-[#E31937] dark:text-[#FF4D5C]' : 'text-[#0a0a14] dark:text-[#e2e2f0]'
      }`}>
        {title}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] shrink-0">
          {formatRelative(note.updatedAt)}
        </span>
        {snippet && (
          <span className="text-[11.5px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] truncate">
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
      <div className="flex items-center justify-between px-6 py-3 border-b border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)] shrink-0">
        <span className="text-[11px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)]">
          {formatRelative(note.updatedAt)}
        </span>
        <button
          onClick={handleDelete}
          className={`flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
            showDeleteConfirm
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)] hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-[rgba(239,68,68,0.08)]'
          }`}
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
          className="w-full bg-transparent outline-none text-[22px] font-bold tracking-[-0.03em] text-[#0a0a14] dark:text-[#e2e2f0] placeholder:text-[rgba(10,10,20,0.2)] dark:placeholder:text-[rgba(226,226,240,0.15)]"
        />
      </div>

      {/* Body */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        <textarea
          value={note.content}
          onChange={e => onUpdate(note.id, { content: e.target.value })}
          placeholder="Start writing…"
          className="w-full h-full bg-transparent outline-none resize-none text-[14.5px] leading-relaxed text-[#0a0a14] dark:text-[#e2e2f0] placeholder:text-[rgba(10,10,20,0.2)] dark:placeholder:text-[rgba(226,226,240,0.15)]"
        />
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
      <div className="w-12 h-12 rounded-2xl bg-[rgba(227,25,55,0.08)] dark:bg-[rgba(255,77,92,0.1)] flex items-center justify-center mb-1">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(227,25,55,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      </div>
      <p className="text-[13px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)]">
        Select a note or create a new one
      </p>
      <button
        onClick={onCreate}
        className="mt-1 text-[12.5px] font-semibold text-[#E31937] dark:text-[#FF4D5C] hover:underline"
      >
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
          <h1 className="text-[18px] font-bold tracking-[-0.025em] text-[#0a0a14] dark:text-[#e2e2f0]">Scratchpad</h1>
          <p className="text-[12.5px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mt-0.5">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-[9px] bg-[#E31937] hover:bg-[#C41230] text-white transition-colors"
        >
          <PlusIcon />
          New note
        </button>
      </div>

      {/* Two-panel layout */}
      <div
        className="bg-[#ffffff] dark:bg-[#0f0f1a] rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] overflow-hidden"
        style={{ height: 'calc(100vh - 180px)', minHeight: 400, display: 'flex' }}
      >
        {/* Sidebar */}
        <div
          className="shrink-0 border-r border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)] overflow-y-auto"
          style={{ width: 220 }}
        >
          {loading ? (
            <div className="px-3 py-4 text-[12px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] text-center">
              Loading…
            </div>
          ) : notes.length === 0 ? (
            <div className="px-3 py-4 text-[12px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)] text-center">
              No notes yet
            </div>
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
