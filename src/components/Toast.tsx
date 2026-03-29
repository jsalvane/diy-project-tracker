import { useApp } from '../context/AppContext';

export function Toast() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up border border-zinc-700 dark:border-gray-200"
        >
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction!();
                dismissToast(toast.id);
              }}
              className="font-semibold text-orange-400 dark:text-orange-600 hover:underline"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-zinc-500 dark:text-gray-400 hover:text-white dark:hover:text-zinc-900 ml-1 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
