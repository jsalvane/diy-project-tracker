import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

interface Props {
  projectId: string;
}

export function TaskList({ projectId }: Props) {
  const { state, addTask, toggleTask, deleteTask } = useApp();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = state.tasks
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.createdAt.localeCompare(b.createdAt);
    });

  const openCount = tasks.filter((t) => !t.completed).length;
  const totalCount = tasks.length;

  const handleAdd = () => {
    const text = inputValue.trim();
    if (!text) return;
    addTask({ projectId, text, completed: false });
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div>
      {totalCount > 0 && (
        <p className="text-xs text-gray-400 dark:text-zinc-600 mb-3">
          {openCount === 0
            ? `All ${totalCount} tasks complete`
            : `${openCount} of ${totalCount} remaining`}
        </p>
      )}

      {tasks.length > 0 && (
        <ul className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800/80 mb-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50/40 dark:hover:bg-orange-950/10 transition-colors group"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
                className="accent-orange-500 w-4 h-4 shrink-0 cursor-pointer rounded"
              />
              <span
                className={`flex-1 text-sm leading-snug ${
                  task.completed
                    ? 'line-through text-gray-400 dark:text-zinc-600'
                    : 'text-gray-800 dark:text-zinc-200'
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-sm text-gray-200 dark:text-zinc-800 group-hover:text-gray-400 dark:group-hover:text-zinc-600 hover:!text-red-500 dark:hover:!text-red-400 p-0.5 transition-colors"
                title="Delete task"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {tasks.length === 0 && (
        <div className="border border-gray-200 dark:border-zinc-800 rounded-xl text-center text-sm text-gray-400 dark:text-zinc-600 py-10 mb-3">
          No tasks yet. Add one below.
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a task and press Enter…"
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-orange-400 dark:focus:border-orange-600 transition-colors"
        />
      </div>
    </div>
  );
}
