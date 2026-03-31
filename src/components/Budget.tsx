import { useState } from 'react';
import { useBudget } from '../hooks/useBudget';
import { MonthlyBudget } from './MonthlyBudget';
import { CreditCardsTab } from './CreditCardsTab';
import { LoansTab } from './LoansTab';

type Tab = 'monthly' | 'cards' | 'loans';

const TABS: { id: Tab; label: string }[] = [
  { id: 'monthly', label: 'Monthly Budget' },
  { id: 'cards', label: 'Credit Cards' },
  { id: 'loans', label: 'Loans' },
];

export function Budget() {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const budget = useBudget();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Budget</h1>

      <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-orange-400 text-orange-400'
                : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {budget.loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'monthly' && <MonthlyBudget {...budget} />}
          {activeTab === 'cards' && <CreditCardsTab {...budget} />}
          {activeTab === 'loans' && <LoansTab {...budget} />}
        </>
      )}
    </div>
  );
}
