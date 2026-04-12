import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { HSAExpense, HSAPerson, HSACategory } from '../lib/types';
import { generateId, now } from '../lib/utils';

// ── Row mappers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExpense(row: any): HSAExpense {
  return {
    id: row.id,
    person: row.person as HSAPerson,
    provider: row.provider,
    date: row.date,
    category: (row.category ?? 'medical') as HSACategory,
    description: row.description ?? '',
    amount: Number(row.amount) ?? 0,
    reimbursed: row.reimbursed ?? false,
    receiptUrl: row.receipt_url ?? '',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function expenseToRow(e: HSAExpense) {
  return {
    id: e.id,
    person: e.person,
    provider: e.provider,
    date: e.date,
    category: e.category,
    description: e.description,
    amount: e.amount,
    reimbursed: e.reimbursed,
    receipt_url: e.receiptUrl || null,
    sort_order: e.sortOrder,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useHSA() {
  const [expenses, setExpenses] = useState<HSAExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('hsa_expenses')
          .select('*')
          .order('date', { ascending: false });
        setExpenses((data ?? []).map(mapExpense));
      } catch (err) {
        console.error('Failed to load HSA expenses:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Realtime subscriptions for cross-device sync
  useEffect(() => {
    const channel = supabase
      .channel('hsa-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hsa_expenses' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const expense = mapExpense(payload.new);
          setExpenses(prev => prev.some(e => e.id === expense.id) ? prev : [expense, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const expense = mapExpense(payload.new);
          setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setExpenses(prev => prev.filter(e => e.id !== id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────

  const addExpense = useCallback(async (data: Omit<HSAExpense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const expense: HSAExpense = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setExpenses(prev => [expense, ...prev]);
    await supabase.from('hsa_expenses').insert(expenseToRow(expense));
    return expense;
  }, []);

  const updateExpense = useCallback(async (expense: HSAExpense) => {
    const updated = { ...expense, updatedAt: now() };
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    await supabase.from('hsa_expenses').update(expenseToRow(updated)).eq('id', updated.id);
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    await supabase.from('hsa_expenses').delete().eq('id', id);
  }, []);

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
