interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
