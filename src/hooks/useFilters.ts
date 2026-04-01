import { useState, useMemo } from 'react';
import type { Entry, FilterState } from '../lib/types';
import { EMPTY_FILTER } from '../lib/constants';
import { sumPrices } from '../lib/utils';

export function useFilters(entries: Entry[]) {
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTER });

  const setFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({ ...EMPTY_FILTER });

  const isFiltered = Object.values(filters).some((v) => v !== '');

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (filters.dateFrom) {
      result = result.filter((e) => e.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((e) => e.date <= filters.dateTo);
    }
    if (filters.store) {
      result = result.filter((e) => e.store === filters.store);
    }
    if (filters.category) {
      result = result.filter((e) => e.category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.store.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [entries, filters]);

  const filteredTotal = useMemo(() => sumPrices(filteredEntries.map((e) => e.price)), [filteredEntries]);
  const confirmedEntries = useMemo(() => entries.filter((e) => !e.isPending), [entries]);
  const pendingEntries = useMemo(() => entries.filter((e) => e.isPending), [entries]);
  const grandTotal = useMemo(() => sumPrices(confirmedEntries.map((e) => e.price)), [confirmedEntries]);
  const pendingTotal = useMemo(() => sumPrices(pendingEntries.map((e) => e.price)), [pendingEntries]);

  const uniqueStores = useMemo(() => [...new Set(entries.map((e) => e.store))].sort(), [entries]);
  const uniqueCategories = useMemo(() => [...new Set(entries.map((e) => e.category))].sort(), [entries]);

  return {
    filters,
    setFilter,
    clearFilters,
    isFiltered,
    filteredEntries,
    filteredTotal,
    grandTotal,
    pendingTotal,
    uniqueStores,
    uniqueCategories,
  };
}
