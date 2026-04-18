import { useState, useEffect, useRef } from 'react';
import { useBudget } from '../hooks/useBudget';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useSimpleFin } from '../hooks/useSimpleFin';
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
  const sf = useSimpleFin();

  const loading = budget.loading || subs.loading;

  // Auto-sync SimpleFin on load if connected, has mappings, and last sync > 1hr ago
  const autoSyncRan = useRef(false);
  useEffect(() => {
    if (autoSyncRan.current) return;
    if (budget.loading || sf.loading || sf.syncing) return;
    if (!sf.connected || Object.keys(sf.mappings).length === 0) return;

    const staleMs = 60 * 60 * 1000; // 1 hour
    const sinceSync = sf.lastSynced
      ? Date.now() - new Date(sf.lastSynced).getTime()
      : Infinity;

    if (sinceSync > staleMs) {
      autoSyncRan.current = true;
      sf.sync(budget.creditCards, budget.updateCreditCard);
    }
  }, [budget.loading, sf.loading, sf.syncing, sf.connected, sf.mappings, sf.lastSynced, budget.creditCards, budget.updateCreditCard, sf.sync]);

  const content = (
    <>
      {!embedded && (
        <>
          <div className="tape-label mb-2">Money · Budget</div>
          <h1 className="display-lg mb-6">
            Budget<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
          </h1>
        </>
      )}

      {/* Tabs */}
      <div
        className="flex mb-5 sm:mb-8 gap-0 overflow-x-auto scrollbar-hide"
        style={{ borderBottom: '1px solid var(--ink-line)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="tape-label px-3 sm:px-5 py-2.5 border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#E31937]/20" />
            <div className="absolute inset-0 rounded-full border-t border-[#E31937] animate-spin" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'monthly'       && <MonthlyBudget {...budget} simpleFin={sf} />}
          {activeTab === 'cards'         && <CreditCardsTab {...budget} simpleFin={sf} />}
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
