import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Goal } from '../lib/types';
import { generateId, now } from '../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGoal(row: any): Goal {
  return {
    id: row.id,
    name: row.name,
    type: row.type ?? 'savings',
    targetAmount: Number(row.target_amount ?? 0),
    currentAmount: Number(row.current_amount ?? 0),
    monthlyContribution: Number(row.monthly_contribution ?? 0),
    targetDate: row.target_date ?? '',
    notes: row.notes ?? '',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function goalToRow(g: Goal) {
  return {
    id: g.id,
    name: g.name,
    type: g.type,
    target_amount: g.targetAmount,
    current_amount: g.currentAmount,
    monthly_contribution: g.monthlyContribution,
    target_date: g.targetDate || null,
    notes: g.notes,
    sort_order: g.sortOrder,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  };
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('goals').select('*').order('sort_order');
        setGoals((data ?? []).map(mapGoal));
      } catch (err) {
        console.error('Failed to load goals:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const addGoal = useCallback(async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const g: Goal = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setGoals(prev => [...prev, g]);
    await supabase.from('goals').insert(goalToRow(g));
    return g;
  }, []);

  const updateGoal = useCallback(async (g: Goal) => {
    const updated = { ...g, updatedAt: now() };
    setGoals(prev => prev.map(x => (x.id === updated.id ? updated : x)));
    const row = goalToRow(updated);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _c, ...rest } = row;
    await supabase.from('goals').update(rest).eq('id', updated.id);
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await supabase.from('goals').delete().eq('id', id);
  }, []);

  return { goals, loading, addGoal, updateGoal, deleteGoal };
}
