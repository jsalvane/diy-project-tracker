import { useState } from 'react';
import { useBudget } from '../hooks/useBudget';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { MonthlyBudget } from './MonthlyBudget';
import { CreditCardsTab } from './CreditCardsTab';
import { LoansTab } from './LoansTab';
import { SubscriptionsTab } from './SubscriptionsTab';

type Tab = 'monthly' | 'cards' | 'loans' | 'subscriptions';

const TABS: { id: Tab; label: string }[] = [
  { id: 'monthly',       label: 'Monthly Budget'  },
  { id: 'cards',         label: 'Credit Cards'    },
  { id: 'loans',         label: 'Loans'           },
  { id: 'subscriptions', label: 'Subscriptions'   },
];

export function Budget({ embedded }: { embedded?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState<Tab>('monthly');
  const budget = useBudget();
  const subs = useSubscriptions();

  const loading = budget.loading || subs.loading;

  const content = (
    <>
      {!embedded && (
        <h1 className="text-[22px] font-bold text-[#0a0a14] dark:text-[#e2e2f0] tracking-[-0.035em] mb-4 sm:mb-7">Budget</h1>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.06)] mb-5 sm:mb-8 gap-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-5 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-[#6366f1] dark:border-[#818cf8] text-[#6366f1] dark:text-[#818cf8]'
                : 'border-transparent text-[rgba(10,10,20,0.45)] dark:text-[rgba(226,226,240,0.4)] hover:text-[#0a0a14] dark:hover:text-[#e2e2f0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#6366f1]/20" />
            <div className="absolute inset-0 rounded-full border-t border-[#6366f1] animate-spin" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'monthly'       && <MonthlyBudget {...budget} />}
          {activeTab === 'cards'         && <CreditCardsTab {...budget} />}
          {activeTab === 'loans'         && <LoansTab {...budget} />}
          {activeTab === 'subscriptions' && (
            <SubscriptionsTab
              subscriptions={subs.subscriptions}
              addSubscription={subs.addSubscription}
              updateSubscription={subs.updateSubscription}
              deleteSubscription={subs.deleteSubscription}
            />
          )}
        </>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-10">
      {content}
    </div>
  );
}
