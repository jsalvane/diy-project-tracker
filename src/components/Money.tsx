import { useState } from 'react';
import { Budget } from './Budget';
import { FinancialHealth } from './FinancialHealth';
import { HSA } from './HSA';
import { Goals } from './Goals';

type MoneyTab = 'budget' | 'financial-health' | 'hsa' | 'goals';

const TABS: { id: MoneyTab; label: string; badge?: string }[] = [
  { id: 'budget',           label: 'Budget'          },
  { id: 'financial-health', label: 'Financial Health' },
  { id: 'hsa',              label: 'HSA' },
  { id: 'goals',            label: 'Goals' },
];

export function Money() {
  const [activeTab, setActiveTab] = useState<MoneyTab>('budget');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-10">
      <div className="mb-6">
        <span className="tape-label">Money</span>
        <h1 className="display-lg mt-1" style={{ color: 'var(--ink)' }}>
          Finance<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
        </h1>
      </div>

      {/* Top-level tabs */}
      <div
        className="flex mb-6 sm:mb-8 gap-0 overflow-x-auto scrollbar-hide"
        style={{ borderBottom: '1px solid var(--ink-line)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="tape-label px-4 sm:px-5 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
            style={{
              borderColor: activeTab === tab.id ? 'var(--rust)' : 'transparent',
              color: activeTab === tab.id ? 'var(--rust)' : 'var(--ink-3)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'budget'           && <Budget embedded />}
      {activeTab === 'financial-health' && <FinancialHealth embedded />}
      {activeTab === 'hsa'              && <HSA />}
      {activeTab === 'goals'            && <Goals />}
    </div>
  );
}
