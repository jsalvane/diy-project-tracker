export function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
      <p className="text-[13px]">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
