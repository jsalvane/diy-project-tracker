import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscription } from '../lib/types';
import { generateId, now } from '../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubscription(row: any): Subscription {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount ?? 0,
    frequency: row.frequency ?? 'monthly',
    renewalDay: row.renewal_day ?? 1,
    freeTrial: row.free_trial ?? false,
    trialExpiration: row.trial_expiration ?? '',
    category: row.category ?? 'other',
    status: row.status ?? 'active',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('*')
          .order('sort_order');
        setSubscriptions((data ?? []).map(mapSubscription));
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const addSubscription = useCallback(async (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    const sub: Subscription = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setSubscriptions(prev => [...prev, sub]);
    await supabase.from('subscriptions').insert({
      id: sub.id,
      name: sub.name,
      amount: sub.amount,
      frequency: sub.frequency,
      renewal_day: sub.renewalDay,
      free_trial: sub.freeTrial,
      trial_expiration: sub.trialExpiration || null,
      category: sub.category,
      status: sub.status,
      sort_order: sub.sortOrder,
      created_at: sub.createdAt,
      updated_at: sub.updatedAt,
    });
    return sub;
  }, []);

  const updateSubscription = useCallback(async (sub: Subscription) => {
    const updated = { ...sub, updatedAt: now() };
    setSubscriptions(prev => prev.map(s => s.id === updated.id ? updated : s));
    await supabase.from('subscriptions').update({
      name: updated.name,
      amount: updated.amount,
      frequency: updated.frequency,
      renewal_day: updated.renewalDay,
      free_trial: updated.freeTrial,
      trial_expiration: updated.trialExpiration || null,
      category: updated.category,
      status: updated.status,
      sort_order: updated.sortOrder,
      updated_at: updated.updatedAt,
    }).eq('id', updated.id);
  }, []);

  const deleteSubscription = useCallback(async (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    await supabase.from('subscriptions').delete().eq('id', id);
  }, []);

  return {
    subscriptions,
    loading,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
}
