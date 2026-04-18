import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Task } from '../lib/types';

interface Props {
  projectId: string;
}

export function TaskList({ projectId }: Props) {
  const { state, addTask, updateTask, toggleTask, deleteTask } = useApp();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const [taskOrder, setTaskOrder] = useState<string[]>([]);

  const storageKey = `taskOrder_${projectId}`;
  const projectTasks = state.tasks.filter((t) => t.projectId === projectId);

  // Sync taskOrder when tasks are added/removed
  useEffect(() => {
    const saved: string[] = (() => {
      try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]'); }
      catch { return []; }
    })();
    const currentIds = projectTasks.map((t) => t.id);
    const synced = [
      ...saved.filter((id) => currentIds.includes(id)),
      ...currentIds.filter((id) => !saved.includes(id)),
    ];
    setTaskOrder(synced);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks.length, storageKey]);

  // Persist order to localStorage
  useEffect(() => {
    if (taskOrder.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(taskOrder));
    }
  }, [taskOrder, storageKey]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const tasks = [...projectTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const ai = taskOrder.indexOf(a.id);
    const bi = taskOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return a.createdAt.localeCompare(b.createdAt);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const incompleteIds = tasks.filter((t) => !t.completed).map((t) => t.id);
  const openCount = incompleteIds.length;
  const totalCount = tasks.length;

  const moveTask = (id: string, direction: 'up' | 'down') => {
    const idx = incompleteIds.indexOf(id);
    if (direction === 'up' && idx <= 0) return;
    if (direction === 'down' && idx >= incompleteIds.length - 1) return;
    const swapId = direction === 'up' ? incompleteIds[idx - 1] : incompleteIds[idx + 1];
    setTaskOrder((prev) => {
      const newOrder = [...prev];
      const ai = newOrder.indexOf(id);
      const bi = newOrder.indexOf(swapId);
      if (ai !== -1 && bi !== -1) [newOrder[ai], newOrder[bi]] = [newOrder[bi], newOrder[ai]];
      return newOrder;
    });
  };

  const handleAdd = () => {
    const text = inputValue.trim();
    if (!text) return;
    addTask({ projectId, text, completed: false });
    setInputValue('');
    inputRef.current?.focus();
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = (task: Task) => {
    const text = editText.trim();
    if (text && text !== task.text) updateTask({ ...task, text });
    setEditingId(null);
  };

  return (
    <div>
      {totalCount > 0 && (
        <p className="text-[11px] text-[var(--ink-4)] mb-3">
          {openCount === 0
            ? `All ${totalCount} tasks complete`
            : `${openCount} of ${totalCount} remaining`}
        </p>
      )}

      {tasks.length > 0 && (
        <ul className="border border-[var(--ink-line)] rounded-xl overflow-hidden divide-y divide-[var(--ink-line)] mb-3">
          {tasks.map((task) => {
            const idxInIncomplete = incompleteIds.indexOf(task.id);
            const canMoveUp = !task.completed && idxInIncomplete > 0;
            const canMoveDown = !task.completed && idxInIncomplete < incompleteIds.length - 1;
            const isEditing = editingId === task.id;

            return (
              <li
                key={task.id}
                className="flex items-center gap-2 px-4 py-3 hover:bg-[rgba(227,25,55,0.03)] transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                  className="accent-[var(--rust)] w-4 h-4 shrink-0 cursor-pointer rounded"
                />

                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(task);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => saveEdit(task)}
                    className="flex-1 text-[13px] leading-snug bg-transparent border-b border-[var(--rust)] text-[var(--ink)] focus:outline-none py-0.5"
                  />
                ) : (
                  <span
                    onClick={() => !task.completed && startEdit(task)}
                    className={`flex-1 text-[13px] leading-snug ${
                      task.completed
                        ? 'line-through text-[var(--ink-4)]'
                        : 'text-[var(--ink)] cursor-text'
                    }`}
                  >
                    {task.text}
                  </span>
                )}

                {!task.completed && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => moveTask(task.id, 'up')}
                      disabled={!canMoveUp}
                      className="text-xs text-[var(--ink-4)] hover:text-[var(--rust)] disabled:opacity-25 disabled:cursor-not-allowed p-0.5 transition-colors leading-none"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'down')}
                      disabled={!canMoveDown}
                      className="text-xs text-[var(--ink-4)] hover:text-[var(--rust)] disabled:opacity-25 disabled:cursor-not-allowed p-0.5 transition-colors leading-none"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                )}

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-sm text-[var(--ink-4)] opacity-0 group-hover:opacity-100 hover:!text-[var(--rust)]!text-[var(--rust)] p-0.5 transition-colors shrink-0"
                  title="Delete task"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {tasks.length === 0 && (
        <div className="border border-[var(--ink-line)] rounded-xl text-center text-[13px] text-[var(--ink-4)] py-10 mb-3">
          No tasks yet. Add one below.
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add a task and press Enter…"
          className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-dashed border-[var(--ink-line-2)] bg-transparent text-[var(--ink)] placeholder-[rgba(10,10,20,0.3)] focus:outline-none focus:border-[var(--rust)] transition-colors"
        />
      </div>
    </div>
  );
}
