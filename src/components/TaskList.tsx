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
        <p className="text-[11px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] mb-3">
          {openCount === 0
            ? `All ${totalCount} tasks complete`
            : `${openCount} of ${totalCount} remaining`}
        </p>
      )}

      {tasks.length > 0 && (
        <ul className="border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden divide-y divide-[rgba(0,0,20,0.04)] dark:divide-[rgba(255,255,255,0.04)] mb-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(227,25,55,0.03)] dark:hover:bg-[rgba(255,77,92,0.04)] transition-colors group"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
                className="accent-[#E31937] w-4 h-4 shrink-0 cursor-pointer rounded"
              />
              <span
                className={`flex-1 text-[13px] leading-snug ${
                  task.completed
                    ? 'line-through text-[rgba(10,10,20,0.3)] dark:text-[rgba(226,226,240,0.25)]'
                    : 'text-[#0a0a14] dark:text-[#e2e2f0]'
                }`}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-sm text-[rgba(10,10,20,0.15)] dark:text-[rgba(226,226,240,0.12)] group-hover:text-[rgba(10,10,20,0.3)] dark:group-hover:text-[rgba(226,226,240,0.25)] hover:!text-red-500 dark:hover:!text-red-400 p-0.5 transition-colors"
                title="Delete task"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {tasks.length === 0 && (
        <div className="border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] rounded-xl text-center text-[13px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] py-10 mb-3">
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
          className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-dashed border-[rgba(0,0,20,0.12)] dark:border-[rgba(255,255,255,0.1)] bg-transparent text-[#0a0a14] dark:text-[#e2e2f0] placeholder-[rgba(10,10,20,0.3)] dark:placeholder-[rgba(226,226,240,0.25)] focus:outline-none focus:border-[#E31937] dark:focus:border-[#FF4D5C] transition-colors"
        />
      </div>
    </div>
  );
}
