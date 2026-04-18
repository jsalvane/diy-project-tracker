import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey } from '../lib/useEscapeKey';

interface Props {
  description: string;
  receiptUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function ReceiptModal({ description, receiptUrl, uploading, onUpload, onRemove, onClose }: Props) {
  useEscapeKey(onClose);
  const fileRef = useRef<HTMLInputElement>(null);
  const isPdf = Boolean(receiptUrl && receiptUrl.toLowerCase().includes('.pdf'));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    e.target.value = '';
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,22,18,0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-[14px] w-full max-w-sm overflow-hidden"
        style={{ background: 'var(--paper)', border: '1px solid var(--ink-line-2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--ink-line)' }}>
          <span className="tape-label truncate pr-4">Receipt — {description || 'Entry'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>

        <div className="p-5">
          {uploading ? (
            <div className="w-full flex flex-col items-center justify-center h-48 rounded-xl" style={{ background: 'var(--paper-2)' }}>
              <div className="w-8 h-8 border-2 rounded-full animate-spin mb-3" style={{ borderColor: 'var(--rust)', borderTopColor: 'transparent' }} />
              <span className="tape-label">Uploading…</span>
            </div>
          ) : receiptUrl ? (
            isPdf ? (
              <div className="w-full flex flex-col items-center justify-center h-48 rounded-xl gap-3" style={{ background: 'var(--paper-2)' }}>
                <PdfIcon className="w-14 h-14" style={{ color: 'var(--rust)' }} />
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" download
                  style={{ fontSize: 13, fontWeight: 500, color: 'var(--rust)', textDecoration: 'underline' }}>
                  Download Receipt PDF
                </a>
              </div>
            ) : (
              <div className="relative group">
                <img src={receiptUrl} alt="Receipt" className="w-full rounded-xl object-contain max-h-80" style={{ background: 'var(--paper-2)' }} />
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" download
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity tape-label px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(26,22,18,0.7)', color: 'var(--paper)' }}>
                  Download
                </a>
              </div>
            )
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center h-48 rounded-xl transition-colors group"
              style={{ background: 'var(--paper-2)', border: '2px dashed var(--ink-line-2)', cursor: 'pointer' }}>
              <UploadIcon className="w-8 h-8 mb-2" style={{ color: 'var(--ink-4)' }} />
              <span className="tape-label">Tap to add receipt (photo or PDF)</span>
            </button>
          )}
        </div>

        {receiptUrl && !uploading && (
          <div className="flex gap-2 px-5 pb-5">
            <button onClick={() => fileRef.current?.click()} className="btn-primary btn-sm flex-1">Replace</button>
            <button onClick={onRemove} className="btn-danger btn-sm">Remove</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      </div>
    </div>,
    document.body
  );
}

function UploadIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PdfIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
