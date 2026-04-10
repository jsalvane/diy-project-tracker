import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PriceAlert } from '../lib/types';
import { generateId, now } from '../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPriceAlert(row: any): PriceAlert {
  return {
    id: row.id,
    giftId: row.gift_id,
    url: row.url,
    label: row.label ?? '',
    targetPrice: Number(row.target_price),
    currentPrice: row.current_price != null ? Number(row.current_price) : null,
    lowestPrice: row.lowest_price != null ? Number(row.lowest_price) : null,
    lastChecked: row.last_checked ?? null,
    lastAlerted: row.last_alerted ?? null,
    consecutiveFailures: row.consecutive_failures ?? 0,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function usePriceAlerts() {
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('price_alerts')
          .select('*')
          .order('created_at');
        setPriceAlerts((data ?? []).map(mapPriceAlert));
      } catch (err) {
        console.error('Failed to load price alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const addPriceAlert = useCallback(async (data: {
    giftId: string;
    url: string;
    label: string;
    targetPrice: number;
  }) => {
    const ts = now();
    const alert: PriceAlert = {
      id: generateId(),
      giftId: data.giftId,
      url: data.url,
      label: data.label,
      targetPrice: data.targetPrice,
      currentPrice: null,
      lowestPrice: null,
      lastChecked: null,
      lastAlerted: null,
      consecutiveFailures: 0,
      isActive: true,
      createdAt: ts,
      updatedAt: ts,
    };
    setPriceAlerts(prev => [...prev, alert]);
    await supabase.from('price_alerts').insert({
      id: alert.id,
      gift_id: alert.giftId,
      url: alert.url,
      label: alert.label,
      target_price: alert.targetPrice,
      is_active: true,
      consecutive_failures: 0,
      created_at: alert.createdAt,
      updated_at: alert.updatedAt,
    });
    return alert;
  }, []);

  const updatePriceAlert = useCallback(async (alert: PriceAlert) => {
    const updated = { ...alert, updatedAt: now() };
    setPriceAlerts(prev => prev.map(a => a.id === updated.id ? updated : a));
    await supabase.from('price_alerts').update({
      url: updated.url,
      label: updated.label,
      target_price: updated.targetPrice,
      is_active: updated.isActive,
      consecutive_failures: updated.consecutiveFailures,
      updated_at: updated.updatedAt,
    }).eq('id', updated.id);
  }, []);

  const deletePriceAlert = useCallback(async (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
    await supabase.from('price_alerts').delete().eq('id', id);
  }, []);

  return { priceAlerts, loading: loading, addPriceAlert, updatePriceAlert, deletePriceAlert };
}
