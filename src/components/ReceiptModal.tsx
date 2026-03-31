import { useRef } from 'react';

interface Props {
  description: string;
  receiptUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function ReceiptModal({ description, receiptUrl, uploading, onUpload, onRemove, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isPdf = Boolean(receiptUrl && receiptUrl.toLowerCase().includes('.pdf'));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-4">
            Receipt — {description || 'Entry'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors text-lg leading-none shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content area */}
        <div className="p-5">
          {uploading ? (
            <div className="w-full flex flex-col items-center justify-center h-48 bg-gray-50 dark:bg-zinc-800 rounded-xl">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-sm text-gray-400 dark:text-zinc-500">Uploading…</span>
            </div>
          ) : receiptUrl ? (
            isPdf ? (
              <div className="w-full flex flex-col items-center justify-center h-48 bg-gray-50 dark:bg-zinc-800 rounded-xl gap-3">
                <PdfIcon className="w-14 h-14 text-red-400" />
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="text-sm font-medium text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 underline underline-offset-2 transition-colors"
                >
                  Download Receipt PDF
                </a>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={receiptUrl}
                  alt="Receipt"
                  className="w-full rounded-xl object-contain max-h-80 bg-gray-50 dark:bg-zinc-800"
                />
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium px-2.5 py-1 rounded-lg bg-black/60 text-white hover:bg-black/80"
                >
                  Download
                </a>
              </div>
            )
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center h-48 bg-gray-50 dark:bg-zinc-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 hover:border-orange-400 dark:hover:border-orange-600 transition-colors group"
            >
              <UploadIcon className="w-8 h-8 text-gray-300 dark:text-zinc-600 group-hover:text-orange-400 dark:group-hover:text-orange-500 mb-2 transition-colors" />
              <span className="text-sm text-gray-400 dark:text-zinc-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                Tap to add receipt (photo or PDF)
              </span>
            </button>
          )}
        </div>

        {/* Actions */}
        {receiptUrl && !uploading && (
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 text-sm font-medium px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              Replace
            </button>
            <button
              onClick={onRemove}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Remove
            </button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
