import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { generateId, now } from '../lib/utils';
import type { Note } from '../lib/types';

const LS_KEY = 'scratchpad_notes';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNote(row: any): Note {
  return {
    id: row.id,
    title: row.title ?? '',
    content: row.content ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function loadFromLS(): Note[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useScratchpad() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  // Track local change IDs to ignore echoed realtime events
  const localIds = useRef(new Set<string>());

  // ── Initial load + migrate localStorage → Supabase ──────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('scratchpad_notes')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        let rows = (data ?? []).map(mapNote);

        // One-time migration: push any local notes not yet in Supabase
        if (rows.length === 0) {
          const local = loadFromLS();
          if (local.length > 0) {
            await supabase.from('scratchpad_notes').insert(
              local.map(n => ({
                id: n.id,
                title: n.title,
                content: n.content,
                created_at: n.createdAt,
                updated_at: n.updatedAt,
              }))
            );
            rows = local;
          }
        }

        setNotes(rows);
      } catch (err) {
        console.error('useScratchpad: load failed, falling back to localStorage', err);
        setNotes(loadFromLS());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Realtime subscription ────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('scratchpad_notes_rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scratchpad_notes' },
        payload => {
          const id = (payload.new as { id?: string })?.id ?? (payload.old as { id?: string })?.id;
          // Skip events we generated ourselves
          if (id && localIds.current.has(id)) {
            localIds.current.delete(id);
            return;
          }

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const note = mapNote(payload.new);
            setNotes(prev => {
              const exists = prev.some(n => n.id === note.id);
              const updated = exists
                ? prev.map(n => (n.id === note.id ? note : n))
                : [note, ...prev];
              return updated.sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              );
            });
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(n => n.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  const addNote = useCallback(async (): Promise<Note> => {
    const note: Note = {
      id: generateId(),
      title: '',
      content: '',
      createdAt: now(),
      updatedAt: now(),
    };
    setNotes(prev => [note, ...prev]);
    localIds.current.add(note.id);
    await supabase.from('scratchpad_notes').insert({
      id: note.id,
      title: note.title,
      content: note.content,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    });
    return note;
  }, []);

  // Debounce timer per note
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const updateNote = useCallback((id: string, changes: Partial<Pick<Note, 'title' | 'content'>>) => {
    const updatedAt = now();
    setNotes(prev =>
      prev
        .map(n => (n.id === id ? { ...n, ...changes, updatedAt } : n))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );

    // Debounce the Supabase write by 600ms to avoid hammering on every keystroke
    clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(async () => {
      localIds.current.add(id);
      await supabase
        .from('scratchpad_notes')
        .update({ ...changes, updated_at: updatedAt })
        .eq('id', id);
    }, 600);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    localIds.current.add(id);
    await supabase.from('scratchpad_notes').delete().eq('id', id);
  }, []);

  return { notes, loading, addNote, updateNote, deleteNote };
}
