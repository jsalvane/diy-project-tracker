import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { MaintenanceTask, MaintenanceCompletion } from '../lib/types';
import { generateId, now, todayStr } from '../lib/utils';
import { computeNextDueDate } from '../lib/maintenanceCalc';
import type { PresetTask } from '../lib/maintenancePresets';

// ── Row mappers ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTask(row: any): MaintenanceTask {
  return {
    id: row.id,
    name: row.name,
    group: row.group,
    category: row.category,
    machineId: row.machine_id ?? '',
    instructions: row.instructions ?? '',
    recurrenceType: row.recurrence_type,
    recurrenceUnit: row.recurrence_unit ?? '',
    recurrenceValue: row.recurrence_value ?? 0,
    nextDueDate: row.next_due_date ?? '',
    currentUsage: row.current_usage ?? 0,
    lastCompletionUsage: row.last_completion_usage ?? 0,
    isPreset: row.is_preset ?? false,
    icon: row.icon ?? '',
    snoozedUntil: row.snoozed_until ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function taskToRow(t: MaintenanceTask) {
  return {
    id: t.id,
    name: t.name,
    group: t.group,
    category: t.category,
    machine_id: t.machineId || null,
    instructions: t.instructions,
    recurrence_type: t.recurrenceType,
    recurrence_unit: t.recurrenceUnit || null,
    recurrence_value: t.recurrenceValue,
    next_due_date: t.nextDueDate || null,
    current_usage: t.currentUsage,
    last_completion_usage: t.lastCompletionUsage,
    is_preset: t.isPreset,
    icon: t.icon,
    snoozed_until: t.snoozedUntil || null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCompletion(row: any): MaintenanceCompletion {
  return {
    id: row.id,
    taskId: row.task_id,
    completedAt: row.completed_at,
    notes: row.notes ?? '',
    cost: Number(row.cost) ?? 0,
    photoUrl: row.photo_url ?? '',
    usageAtCompletion: row.usage_at_completion ?? 0,
    createdAt: row.created_at,
  };
}

function completionToRow(c: MaintenanceCompletion) {
  return {
    id: c.id,
    task_id: c.taskId,
    completed_at: c.completedAt,
    notes: c.notes,
    cost: c.cost,
    photo_url: c.photoUrl || null,
    usage_at_completion: c.usageAtCompletion,
    created_at: c.createdAt,
  };
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useMaintenance() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [completions, setCompletions] = useState<MaintenanceCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Ref mirror so async callbacks can read the latest tasks without
  // doing DB writes inside a setState updater (which is unsafe and
  // also fails: a Supabase builder is lazy and never executes unless
  // its .then()/await is consumed).
  const tasksRef = useRef<MaintenanceTask[]>([]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const [{ data: taskRows }, { data: compRows }] = await Promise.all([
          supabase.from('maintenance_tasks').select('*').order('created_at'),
          supabase.from('maintenance_completions').select('*').order('completed_at', { ascending: false }),
        ]);
        const mappedTasks = (taskRows ?? []).map(mapTask);
        const mappedComps = (compRows ?? []).map(mapCompletion);

        if (mappedTasks.length === 0) {
          setNeedsOnboarding(true);
        }

        // Auto-heal: rows whose nextDueDate never advanced because the
        // pre-fix completeTask fired the Supabase update without an await
        // (lazy builder, request never sent). For each task with a
        // completion on/after its current nextDueDate, recompute and persist.
        const compsByTask = new Map<string, MaintenanceCompletion[]>();
        for (const c of mappedComps) {
          const arr = compsByTask.get(c.taskId);
          if (arr) arr.push(c); else compsByTask.set(c.taskId, [c]);
        }
        const pendingFixes: MaintenanceTask[] = [];
        const healedTasks = mappedTasks.map(t => {
          if (!t.nextDueDate) return t;
          if (t.recurrenceType === 'usage') return t; // usage status comes from currentUsage, not nextDueDate
          const taskComps = compsByTask.get(t.id) ?? [];
          if (taskComps.length === 0) return t;
          // Comps were loaded sorted desc by completed_at
          const latest = taskComps[0].completedAt.slice(0, 10);
          if (latest < t.nextDueDate) return t;
          const newNextDue = t.recurrenceType === 'custom'
            ? ''
            : computeNextDueDate(t.recurrenceType, t.recurrenceUnit, t.recurrenceValue, latest);
          if (newNextDue === t.nextDueDate) return t;
          const fixed: MaintenanceTask = { ...t, nextDueDate: newNextDue, updatedAt: now() };
          pendingFixes.push(fixed);
          return fixed;
        });

        setTasks(healedTasks);
        setCompletions(mappedComps);

        // Persist heals — Promise.all consumes each thenable's .then(),
        // which is what actually triggers the HTTP request.
        if (pendingFixes.length) {
          await Promise.all(pendingFixes.map(t =>
            supabase.from('maintenance_tasks').update(taskToRow(t)).eq('id', t.id),
          ));
        }
      } catch (err) {
        console.error('Failed to load maintenance:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Realtime subscriptions for cross-device sync
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const task = mapTask(payload.new);
          setTasks(prev => prev.some(t => t.id === task.id) ? prev : [...prev, task]);
        } else if (payload.eventType === 'UPDATE') {
          const task = mapTask(payload.new);
          setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setTasks(prev => prev.filter(t => t.id !== id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_completions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const comp = mapCompletion(payload.new);
          setCompletions(prev => prev.some(c => c.id === comp.id) ? prev : [comp, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setCompletions(prev => prev.filter(c => c.id !== id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── CRUD: Tasks ───────────────────────────────────────────────────────

  const addTask = useCallback(async (data: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const task: MaintenanceTask = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setTasks(prev => [...prev, task]);
    setNeedsOnboarding(false);
    await supabase.from('maintenance_tasks').insert(taskToRow(task));
    return task;
  }, []);

  const updateTask = useCallback(async (task: MaintenanceTask) => {
    const updated = { ...task, updatedAt: now() };
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    await supabase.from('maintenance_tasks').update(taskToRow(updated)).eq('id', updated.id);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setCompletions(prev => prev.filter(c => c.taskId !== id));
    await supabase.from('maintenance_tasks').delete().eq('id', id);
  }, []);

  // ── Complete a task ───────────────────────────────────────────────────

  const completeTask = useCallback(async (
    taskId: string,
    data: { notes: string; cost: number; usageReading: number },
  ) => {
    const t = tasksRef.current.find(x => x.id === taskId);
    if (!t) return;

    const completion: MaintenanceCompletion = {
      id: generateId(),
      taskId,
      completedAt: now(),
      notes: data.notes,
      cost: data.cost,
      photoUrl: '',
      usageAtCompletion: data.usageReading,
      createdAt: now(),
    };

    const today = todayStr();
    const nextDue = computeNextDueDate(t.recurrenceType, t.recurrenceUnit, t.recurrenceValue, today);
    // 'custom' recurrence has no auto-rollover — clear nextDueDate on
    // completion so it doesn't remain stuck in the past as 'overdue'.
    const newNextDueDate = t.recurrenceType === 'custom' ? '' : (nextDue || t.nextDueDate);
    const updated: MaintenanceTask = {
      ...t,
      nextDueDate: newNextDueDate,
      lastCompletionUsage: data.usageReading > 0 ? data.usageReading : t.lastCompletionUsage,
      currentUsage: data.usageReading > 0 ? data.usageReading : t.currentUsage,
      snoozedUntil: '', // Clear snooze on completion
      updatedAt: now(),
    };

    // Optimistic local update
    setCompletions(prev => [completion, ...prev]);
    setTasks(prev => prev.map(x => x.id === taskId ? updated : x));

    // Persist — both awaits are required: a Supabase builder is lazy and
    // never executes unless its .then()/await is consumed.
    await supabase.from('maintenance_completions').insert(completionToRow(completion));
    await supabase.from('maintenance_tasks').update(taskToRow(updated)).eq('id', updated.id);
  }, []);

  // ── Snooze ────────────────────────────────────────────────────────────

  const snoozeTask = useCallback(async (taskId: string, days: number) => {
    const t = tasksRef.current.find(x => x.id === taskId);
    if (!t) return;
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + days);
    const snoozedUntil = snoozeDate.toISOString().slice(0, 10);
    const updated = { ...t, snoozedUntil, updatedAt: now() };
    setTasks(prev => prev.map(x => x.id === taskId ? updated : x));
    await supabase.from('maintenance_tasks').update(taskToRow(updated)).eq('id', updated.id);
  }, []);

  // ── Update usage (odometer/hours) ─────────────────────────────────────

  const updateUsage = useCallback(async (taskId: string, newUsage: number) => {
    const t = tasksRef.current.find(x => x.id === taskId);
    if (!t) return;
    const updated = { ...t, currentUsage: newUsage, updatedAt: now() };
    setTasks(prev => prev.map(x => x.id === taskId ? updated : x));
    await supabase.from('maintenance_tasks').update(taskToRow(updated)).eq('id', updated.id);
  }, []);

  // ── Import presets from library ───────────────────────────────────────

  const importFromLibrary = useCallback(async (presets: PresetTask[]) => {
    const today = todayStr();
    const newTasks: MaintenanceTask[] = presets.map(p => {
      const nextDue = computeNextDueDate(p.recurrenceType, p.recurrenceUnit, p.recurrenceValue, today);
      return {
        id: generateId(),
        name: p.name,
        group: p.group,
        category: p.category,
        machineId: '',
        instructions: p.instructions,
        recurrenceType: p.recurrenceType,
        recurrenceUnit: p.recurrenceUnit,
        recurrenceValue: p.recurrenceValue,
        nextDueDate: nextDue,
        currentUsage: 0,
        lastCompletionUsage: 0,
        isPreset: true,
        icon: p.icon,
        snoozedUntil: '',
        createdAt: now(),
        updatedAt: now(),
      };
    });

    setTasks(prev => [...prev, ...newTasks]);
    setNeedsOnboarding(false);

    // Batch insert
    const rows = newTasks.map(taskToRow);
    if (rows.length) {
      await supabase.from('maintenance_tasks').insert(rows);
    }
  }, []);

  return {
    tasks,
    completions,
    loading,
    needsOnboarding,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    snoozeTask,
    updateUsage,
    importFromLibrary,
  };
}
