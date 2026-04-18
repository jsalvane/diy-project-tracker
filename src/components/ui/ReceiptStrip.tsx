/** Dashed horizontal divider — the receipt-tape separator */
export function ReceiptStrip({ className }: { className?: string }) {
  return <div className={`receipt-strip ${className ?? ''}`} />;
}
