import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Machine } from '../lib/types';
import { generateId, now } from '../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMachine(row: any): Machine {
  return {
    id: row.id,
    name: row.name,
    manufacturer: row.manufacturer ?? '',
    model: row.model ?? '',
    year: row.year ?? '',
    serialNumber: row.serial_number ?? '',
    purchaseDate: row.purchase_date ?? '',
    manualUrl: row.manual_url ?? '',
    notes: row.notes ?? '',
    icon: row.icon ?? '',
    category: row.category ?? 'other',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function machineToRow(m: Machine) {
  return {
    id: m.id,
    name: m.name,
    manufacturer: m.manufacturer,
    model: m.model,
    year: m.year,
    serial_number: m.serialNumber,
    purchase_date: m.purchaseDate || null,
    manual_url: m.manualUrl,
    notes: m.notes,
    icon: m.icon,
    category: m.category,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('machines').select('*').order('created_at');
        setMachines((data ?? []).map(mapMachine));
      } catch (err) {
        console.error('Failed to load machines:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('machines-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const m = mapMachine(payload.new);
          setMachines(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
        } else if (payload.eventType === 'UPDATE') {
          const m = mapMachine(payload.new);
          setMachines(prev => prev.map(x => x.id === m.id ? m : x));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setMachines(prev => prev.filter(x => x.id !== id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const addMachine = useCallback(async (data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => {
    const machine: Machine = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setMachines(prev => [...prev, machine]);
    await supabase.from('machines').insert(machineToRow(machine));
    return machine;
  }, []);

  const updateMachine = useCallback(async (machine: Machine) => {
    const updated = { ...machine, updatedAt: now() };
    setMachines(prev => prev.map(m => m.id === updated.id ? updated : m));
    await supabase.from('machines').update(machineToRow(updated)).eq('id', updated.id);
  }, []);

  const deleteMachine = useCallback(async (id: string) => {
    setMachines(prev => prev.filter(m => m.id !== id));
    await supabase.from('machines').delete().eq('id', id);
  }, []);

  return { machines, loading, addMachine, updateMachine, deleteMachine };
}
