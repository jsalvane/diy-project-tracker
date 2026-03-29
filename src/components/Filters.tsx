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
    'text-xs px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500';

  return (
    <div className="flex flex-wrap items-end gap-2 mb-3">
      <div>
        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">From</label>
        <input
          type="date"
          className={inputCls + ' w-32'}
          value={filters.dateFrom}
          onChange={(e) => setFilter('dateFrom', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">To</label>
        <input
          type="date"
          className={inputCls + ' w-32'}
          value={filters.dateTo}
          onChange={(e) => setFilter('dateTo', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Store</label>
        <select
          className={inputCls + ' w-32'}
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
        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Category</label>
        <select
          className={inputCls + ' w-32'}
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
        <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Search</label>
        <input
          type="text"
          className={inputCls + ' w-40'}
          placeholder="Search entries..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </div>
      {isFiltered && (
        <button
          onClick={clearFilters}
          className="text-xs px-2 py-1.5 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
