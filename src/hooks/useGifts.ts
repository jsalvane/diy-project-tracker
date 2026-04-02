import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Gift, GiftRecipient } from '../lib/types';
import { generateId, now } from '../lib/utils';
import { createGiftSeedData } from '../lib/giftSeed';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecipient(row: any): GiftRecipient {
  return {
    id: row.id,
    name: row.name,
    budget: row.budget ?? 0,
    occasion: row.occasion ?? '',
    color: row.color ?? 'orange',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapGift(row: any): Gift {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    idea: row.idea,
    cost: row.cost ?? 0,
    status: row.status ?? 'want',
    priority: row.priority ?? 'medium',
    notes: row.notes ?? '',
    link: row.link ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useGifts() {
  const [recipients, setRecipients] = useState<GiftRecipient[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: recs }, { data: giftRows }] = await Promise.all([
          supabase.from('gift_recipients').select('*').order('created_at'),
          supabase.from('gifts').select('*').order('created_at'),
        ]);
        const mappedRecs = (recs ?? []).map(mapRecipient);
        const mappedGifts = (giftRows ?? []).map(mapGift);

        if (mappedRecs.length === 0) {
          const seed = createGiftSeedData();
          await supabase.from('gift_recipients').insert(seed.recipients.map(r => ({
            id: r.id, name: r.name, budget: r.budget, occasion: r.occasion,
            color: r.color, created_at: r.createdAt, updated_at: r.updatedAt,
          })));
          await supabase.from('gifts').insert(seed.gifts.map(g => ({
            id: g.id, recipient_id: g.recipientId, idea: g.idea, cost: g.cost,
            status: g.status, priority: g.priority, notes: g.notes, link: g.link,
            created_at: g.createdAt, updated_at: g.updatedAt,
          })));
          setRecipients(seed.recipients);
          setGifts(seed.gifts);
        } else {
          setRecipients(mappedRecs);
          setGifts(mappedGifts);
        }
      } catch (err) {
        console.error('Failed to load gifts:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Recipients ──────────────────────────────────────────────────────────────

  const addRecipient = useCallback(async (data: Omit<GiftRecipient, 'id' | 'createdAt' | 'updatedAt'>) => {
    const r: GiftRecipient = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setRecipients(prev => [...prev, r]);
    await supabase.from('gift_recipients').insert({
      id: r.id, name: r.name, budget: r.budget, occasion: r.occasion,
      color: r.color, created_at: r.createdAt, updated_at: r.updatedAt,
    });
    return r;
  }, []);

  const updateRecipient = useCallback(async (r: GiftRecipient) => {
    const updated = { ...r, updatedAt: now() };
    setRecipients(prev => prev.map(x => x.id === updated.id ? updated : x));
    await supabase.from('gift_recipients').update({
      name: updated.name, budget: updated.budget, occasion: updated.occasion,
      color: updated.color, updated_at: updated.updatedAt,
    }).eq('id', updated.id);
  }, []);

  const deleteRecipient = useCallback(async (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
    setGifts(prev => prev.filter(g => g.recipientId !== id));
    await supabase.from('gift_recipients').delete().eq('id', id);
  }, []);

  // ── Gifts ───────────────────────────────────────────────────────────────────

  const addGift = useCallback(async (data: Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>) => {
    const g: Gift = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setGifts(prev => [...prev, g]);
    await supabase.from('gifts').insert({
      id: g.id, recipient_id: g.recipientId, idea: g.idea, cost: g.cost,
      status: g.status, priority: g.priority, notes: g.notes, link: g.link,
      created_at: g.createdAt, updated_at: g.updatedAt,
    });
    return g;
  }, []);

  const updateGift = useCallback(async (g: Gift) => {
    const updated = { ...g, updatedAt: now() };
    setGifts(prev => prev.map(x => x.id === updated.id ? updated : x));
    await supabase.from('gifts').update({
      idea: updated.idea, cost: updated.cost, status: updated.status,
      priority: updated.priority, notes: updated.notes, link: updated.link,
      updated_at: updated.updatedAt,
    }).eq('id', updated.id);
  }, []);

  const deleteGift = useCallback(async (id: string) => {
    setGifts(prev => prev.filter(g => g.id !== id));
    await supabase.from('gifts').delete().eq('id', id);
  }, []);

  const reseedGifts = useCallback(async () => {
    await supabase.from('gift_recipients').delete().neq('id', '');
    const seed = createGiftSeedData();
    await supabase.from('gift_recipients').insert(seed.recipients.map(r => ({
      id: r.id, name: r.name, budget: r.budget, occasion: r.occasion,
      color: r.color, created_at: r.createdAt, updated_at: r.updatedAt,
    })));
    await supabase.from('gifts').insert(seed.gifts.map(g => ({
      id: g.id, recipient_id: g.recipientId, idea: g.idea, cost: g.cost,
      status: g.status, priority: g.priority, notes: g.notes, link: g.link,
      created_at: g.createdAt, updated_at: g.updatedAt,
    })));
    setRecipients(seed.recipients);
    setGifts(seed.gifts);
  }, []);

  return {
    recipients, gifts, loading,
    addRecipient, updateRecipient, deleteRecipient,
    addGift, updateGift, deleteGift,
    reseedGifts,
  };
}
