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
  return (
    <div style={{ marginBottom: 16 }}>
      {/* Row 1: dates side-by-side */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
        <div>
          <label className="tape-label block mb-1">From</label>
          <input type="date" className="field w-full sm:w-36" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} />
        </div>
        <div>
          <label className="tape-label block mb-1">To</label>
          <input type="date" className="field w-full sm:w-36" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} />
        </div>
        <div>
          <label className="tape-label block mb-1">Store</label>
          <select className="field w-full sm:w-36" value={filters.store} onChange={(e) => setFilter('store', e.target.value)}>
            <option value="">All stores</option>
            {uniqueStores.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <label className="tape-label block mb-1">Category</label>
          <select className="field w-full sm:w-36" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {uniqueCategories.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="tape-label block mb-1">Search</label>
          <input type="text" className="field w-full sm:w-44" placeholder="Search entries…" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
        </div>
        {isFiltered && (
          <div className="flex items-end">
            <button onClick={clearFilters} className="tape-label px-3 py-2 rounded-lg transition-colors"
              style={{ color: 'var(--rust)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
