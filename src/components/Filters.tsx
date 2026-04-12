import type { FilterState } from '../lib/types';

interface Props {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  clearFilters: () => void;
  isFiltered: boolean;
  uniqueStores: string[];
  uniqueCategories: string[];
}

export function Filters({ filters, setFilter, clearFilters, isFiltered, uniqueStores, uniqueCategories }: Props) {
  const inputCls =
    'text-[13px] px-2.5 py-1.5 rounded-lg border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#111118] text-[#0a0a14] dark:text-[#e2e2f0] focus:outline-none focus:ring-2 focus:ring-[#E31937]/40 focus:border-[#E31937] dark:focus:border-[#FF4D5C] transition-colors';

  return (
    <div className="flex flex-wrap items-end gap-2 sm:gap-3 mb-4">
      <div className="w-[calc(50%-4px)] sm:w-auto">
        <label className="block text-[10px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1">From</label>
        <input
          type="date"
          className={inputCls + ' w-full sm:w-36'}
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
        />
      </div>
      <div className="w-[calc(50%-4px)] sm:w-auto">
        <label className="block text-[10px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1">To</label>
        <input
          type="date"
          className={inputCls + ' w-full sm:w-36'}
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
        />
      </div>
      <div className="w-[calc(50%-4px)] sm:w-auto">
        <label className="block text-[10px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1">Store</label>
        <select
          className={inputCls + ' w-full sm:w-36'}
          value={filters.store}
          onChange={(e) => setFilter('store', e.target.value)}
        >
          <option value="">All stores</option>
          {uniqueStores.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="w-[calc(50%-4px)] sm:w-auto">
        <label className="block text-[10px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1">Category</label>
        <select
          className={inputCls + ' w-full sm:w-36'}
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="">All categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-auto">
        <label className="block text-[10px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1">Search</label>
        <input
          type="text"
          className={inputCls + ' w-full sm:w-44'}
          placeholder="Search entries..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </div>
      {isFiltered && (
        <button
          onClick={clearFilters}
          className="text-[13px] font-medium px-3 py-1.5 text-[#E31937] dark:text-[#FF4D5C] hover:bg-[rgba(227,25,55,0.08)] dark:hover:bg-[rgba(255,77,92,0.1)] rounded-lg transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
