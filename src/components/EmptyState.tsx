export function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
      <p className="text-sm">{message}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
