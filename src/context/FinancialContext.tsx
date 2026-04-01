import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import type { FinancialQuarter, FinancialState, FinancialAction } from '../lib/financialTypes';
import { loadFinancialState, saveFinancialState } from '../lib/financialStorage';
import { createFinancialSeedData } from '../lib/financialSeed';
import { generateId, now } from '../lib/utils';
import { supabase } from '../lib/supabase';

// ── Reducer ──────────────────────────────────────────────────────────

function reducer(state: FinancialState, action: FinancialAction): FinancialState {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'ADD_QUARTER':
      return {
        ...state,
        quarters: [...state.quarters, action.payload],
        activeQuarterId: action.payload.id,
      };
    case 'UPDATE_QUARTER':
      return {
        ...state,
        quarters: state.quarters.map((q) =>
          q.id === action.payload.id ? action.payload : q
        ),
      };
    case 'DELETE_QUARTER': {
      const remaining = state.quarters.filter((q) => q.id !== action.payload);
      const newActive =
        state.activeQuarterId === action.payload
          ? (remaining[0]?.id ?? null)
          : state.activeQuarterId;
      return { quarters: remaining, activeQuarterId: newActive };
    }
    case 'SET_ACTIVE_QUARTER':
      return { ...state, activeQuarterId: action.payload };
    case 'REPLACE_ALL_QUARTERS':
      return {
        quarters: action.payload,
        activeQuarterId: action.payload[0]?.id ?? null,
      };
    default:
      return state;
  }
}

// ── Row mappers ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQuarter(row: any): FinancialQuarter {
  return {
    id: row.id,
    quarterLabel: row.quarter_label,
    dateCaptured: row.date_captured,
    assets: row.assets,
    liabilities: row.liabilities,
    income: row.income,
    expenses: row.expenses,
    savingsInvesting: row.savings_investing,
    reportedSummaryValues: row.reported_summary_values,
    notes: row.notes ?? '',
  };
}

function quarterToRow(q: FinancialQuarter) {
  return {
    id: q.id,
    quarter_label: q.quarterLabel,
    date_captured: q.dateCaptured,
    assets: q.assets,
    liabilities: q.liabilities,
    income: q.income,
    expenses: q.expenses,
    savings_investing: q.savingsInvesting,
    reported_summary_values: q.reportedSummaryValues,
    notes: q.notes,
    updated_at: now(),
  };
}

// ── Context ──────────────────────────────────────────────────────────

interface FinancialContextValue {
  state: FinancialState;
  loading: boolean;
  addQuarter: (data: Omit<FinancialQuarter, 'id'>) => Promise<FinancialQuarter>;
  updateQuarter: (quarter: FinancialQuarter) => Promise<void>;
  deleteQuarter: (id: string) => Promise<void>;
  setActiveQuarter: (id: string | null) => void;
  replaceAllQuarters: (quarters: FinancialQuarter[]) => void;
}

const FinancialContext = createContext<FinancialContextValue | null>(null);

export function FinancialProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    quarters: [],
    activeQuarterId: null,
  });
  const [loading, setLoading] = useState(true);

  // Persist to localStorage on every state change
  useEffect(() => {
    if (!loading) {
      saveFinancialState(state);
    }
  }, [state, loading]);

  // Load from Supabase on mount; fallback to localStorage/seed
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('financial_quarters')
          .select('*')
          .order('date_captured');

        if (error) throw error;

        const rows = data ?? [];

        if (rows.length === 0) {
          // No data in DB — migrate from localStorage or seed
          const local = loadFinancialState();
          const source =
            local.quarters.length > 0 ? local : createFinancialSeedData();

          await supabase
            .from('financial_quarters')
            .insert(source.quarters.map(quarterToRow));

          // Default active to most recently captured
          const sorted = [...source.quarters].sort(
            (a, b) => b.dateCaptured.localeCompare(a.dateCaptured)
          );
          dispatch({
            type: 'LOAD_STATE',
            payload: { ...source, activeQuarterId: sorted[0]?.id ?? null },
          });
        } else {
          const quarters = rows.map(mapQuarter);
          const sorted = [...quarters].sort(
            (a, b) => b.dateCaptured.localeCompare(a.dateCaptured)
          );
          dispatch({
            type: 'LOAD_STATE',
            payload: {
              quarters,
              activeQuarterId: sorted[0]?.id ?? null,
            },
          });
        }
      } catch (err) {
        console.error('Failed to load financial data from Supabase:', err);
        // Fall back to localStorage
        const local = loadFinancialState();
        dispatch({ type: 'LOAD_STATE', payload: local });
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addQuarter = useCallback(async (data: Omit<FinancialQuarter, 'id'>) => {
    const quarter: FinancialQuarter = { ...data, id: generateId() };
    dispatch({ type: 'ADD_QUARTER', payload: quarter });
    const { error } = await supabase.from('financial_quarters').insert(quarterToRow(quarter));
    if (error) console.error('Failed to add quarter:', error);
    return quarter;
  }, []);

  const updateQuarter = useCallback(async (quarter: FinancialQuarter) => {
    dispatch({ type: 'UPDATE_QUARTER', payload: quarter });
    const { error } = await supabase.from('financial_quarters').update(quarterToRow(quarter)).eq('id', quarter.id);
    if (error) console.error('Failed to update quarter:', error);
  }, []);

  const deleteQuarter = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_QUARTER', payload: id });
    const { error } = await supabase.from('financial_quarters').delete().eq('id', id);
    if (error) console.error('Failed to delete quarter:', error);
  }, []);

  const setActiveQuarter = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_QUARTER', payload: id });
  }, []);

  const replaceAllQuarters = useCallback(async (quarters: FinancialQuarter[]) => {
    dispatch({ type: 'REPLACE_ALL_QUARTERS', payload: quarters });
    await supabase.from('financial_quarters').delete().neq('id', '');
    if (quarters.length > 0) {
      supabase.from('financial_quarters').insert(quarters.map(quarterToRow));
    }
  }, []);

  return (
    <FinancialContext.Provider
      value={{
        state,
        loading,
        addQuarter,
        updateQuarter,
        deleteQuarter,
        setActiveQuarter,
        replaceAllQuarters,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial(): FinancialContextValue {
  const ctx = useContext(FinancialContext);
  if (!ctx) throw new Error('useFinancial must be used within FinancialProvider');
  return ctx;
}
