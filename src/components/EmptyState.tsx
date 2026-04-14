export function EmptyState({ icon, message, children }: { icon?: React.ReactNode; message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 animate-fade-in">
      {icon ? (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[rgba(0,0,20,0.04)] dark:bg-[rgba(255,255,255,0.05)] text-[rgba(10,10,20,0.25)] dark:text-[rgba(226,226,240,0.2)]">
          {icon}
        </div>
      ) : (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-[rgba(0,0,20,0.04)] dark:bg-[rgba(255,255,255,0.05)] text-[rgba(10,10,20,0.25)] dark:text-[rgba(226,226,240,0.2)]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
      )}
      <p className="text-[14px] font-medium text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] text-center max-w-xs">
        {message}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
