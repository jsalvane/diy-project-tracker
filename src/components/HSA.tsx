export function HSA() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,0.1)' }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[15px] font-semibold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.02em]">HSA Tracker</p>
        <p className="text-[13px] text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] mt-1">Coming soon</p>
      </div>
    </div>
  );
}
