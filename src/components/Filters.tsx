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
    'text-sm px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">From</label>
        <input
          type="date"
          className={inputCls + ' w-36'}
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">To</label>
        <input
          type="date"
          className={inputCls + ' w-36'}
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">Store</label>
        <select
          className={inputCls + ' w-36'}
          value={filters.store}
          onChange={(e) => setFilter('store', e.target.value)}
        >
          <option value="">All stores</option>
          {uniqueStores.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">Category</label>
        <select
          className={inputCls + ' w-36'}
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="">All categories</option>
          {uniqueCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">Search</label>
        <input
          type="text"
          className={inputCls + ' w-44'}
          placeholder="Search entries..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </div>
      {isFiltered && (
        <button
          onClick={clearFilters}
          className="text-sm font-medium px-3 py-1.5 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
