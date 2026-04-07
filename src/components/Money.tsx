import { useState } from 'react';
import { Budget } from './Budget';
import { FinancialHealth } from './FinancialHealth';
import { HSA } from './HSA';

type MoneyTab = 'budget' | 'financial-health' | 'hsa';

const TABS: { id: MoneyTab; label: string; badge?: string }[] = [
  { id: 'budget',           label: 'Budget'          },
  { id: 'financial-health', label: 'Financial Health' },
  { id: 'hsa',              label: 'HSA', badge: 'Soon' },
];

export function Money() {
  const [activeTab, setActiveTab] = useState<MoneyTab>('budget');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-10">
      <h1 className="text-[22px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.035em] mb-5 sm:mb-7">
        Money
      </h1>

      {/* Top-level tabs */}
      <div className="flex border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] mb-6 sm:mb-8 gap-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-[#6366f1] text-[#6366f1] dark:text-[#818cf8] dark:border-[#818cf8]'
                : 'border-transparent text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0]'
            }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(99,102,241,0.1)] text-[#6366f1] dark:bg-[rgba(129,140,248,0.12)] dark:text-[#818cf8]">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'budget'           && <Budget embedded />}
      {activeTab === 'financial-health' && <FinancialHealth embedded />}
      {activeTab === 'hsa'              && <HSA />}
    </div>
  );
}
