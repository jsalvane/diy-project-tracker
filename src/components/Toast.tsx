import { useApp } from '../context/AppContext';

export function Toast() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
        >
          <span>{toast.message}</span>
          {toast.undoAction && (
            <button
              onClick={() => {
                toast.undoAction!();
                dismissToast(toast.id);
              }}
              className="font-medium text-teal-400 dark:text-teal-600 hover:underline"
            >
              Undo
            </button>
          )}
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 ml-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
