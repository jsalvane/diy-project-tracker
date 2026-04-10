import { useState } from 'react';
import type { MaintenanceTask, MaintenanceGroup, MaintenanceCategory, RecurrenceType, RecurrenceUnit, Machine } from '../../lib/types';
import { CATEGORY_META, getCategoriesForGroup } from '../../lib/maintenancePresets';
import { todayStr } from '../../lib/utils';

interface Props {
  task?: MaintenanceTask; // if editing
  machines?: Machine[];
  defaultMachineId?: string;
  onSave: (data: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const RECURRENCE_TYPE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'date', label: 'Date-based' },
  { value: 'usage', label: 'Usage-based' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'custom', label: 'Custom date' },
];

const DATE_UNITS: { value: RecurrenceUnit; label: string }[] = [
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

const USAGE_UNITS: { value: RecurrenceUnit; label: string }[] = [
  { value: 'miles', label: 'Miles' },
  { value: 'hours', label: 'Hours' },
  { value: 'uses', label: 'Uses' },
];

const SEASON_OPTIONS: { value: RecurrenceUnit; label: string }[] = [
  { value: 'pre-season', label: 'Pre-season' },
  { value: 'post-season', label: 'Post-season' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'season-end', label: 'Season end' },
  { value: 'post-salt', label: 'Post-salt' },
];

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] bg-[#ffffff] dark:bg-[#0a0a14] text-[#0a0a14] dark:text-[#e2e2f0] text-sm focus:outline-none focus:border-[#E31937] dark:focus:border-[#FF4D5C]';
const labelCls = 'block text-[11px] font-semibold tracking-[0.06em] uppercase text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.32)] mb-1.5';

export function TaskForm({ task, machines = [], defaultMachineId = '', onSave, onCancel }: Props) {
  const [group, setGroup] = useState<MaintenanceGroup>(task?.group ?? 'home');
  const [category, setCategory] = useState<MaintenanceCategory>(task?.category ?? 'hvac');
  const [machineId, setMachineId] = useState(task?.machineId ?? defaultMachineId);
  const [name, setName] = useState(task?.name ?? '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(task?.recurrenceType ?? 'date');
  const [recurrenceUnit, setRecurrenceUnit] = useState<RecurrenceUnit | ''>(task?.recurrenceUnit ?? 'months');
  const [recurrenceValue, setRecurrenceValue] = useState(String(task?.recurrenceValue ?? ''));
  const [instructions, setInstructions] = useState(task?.instructions ?? '');
  const [anchorDate, setAnchorDate] = useState(task?.nextDueDate ?? todayStr());
  const [currentUsage, setCurrentUsage] = useState(String(task?.currentUsage ?? '0'));

  const categories = getCategoriesForGroup(group);
  const machineOptions = machines.filter(m =>
    group === 'machines'
      ? CATEGORY_META[m.category]?.group === 'machines'
      : true
  );

  function handleGroupChange(g: MaintenanceGroup) {
    setGroup(g);
    const cats = getCategoriesForGroup(g);
    if (!cats.includes(category)) setCategory(cats[0]);
    // Clear machine if switching to home
    if (g === 'home') setMachineId('');
  }

  function handleRecurrenceTypeChange(rt: RecurrenceType) {
    setRecurrenceType(rt);
    if (rt === 'date') setRecurrenceUnit('months');
    else if (rt === 'usage') setRecurrenceUnit('miles');
    else if (rt === 'seasonal') setRecurrenceUnit('pre-season');
    else setRecurrenceUnit('');
  }

  // When a machine is selected, auto-set its category
  function handleMachineChange(id: string) {
    setMachineId(id);
    if (id) {
      const m = machines.find(x => x.id === id);
      if (m) setCategory(m.category);
    }
  }

  function handleSave() {
    if (!name.trim()) return;
    const val = parseInt(recurrenceValue) || 0;
    // anchorDate is always the next due date — computeNextDueDate is only used
    // on task completion (in useMaintenance) to advance to the following occurrence.
    const nextDue = anchorDate;

    onSave({
      name: name.trim(),
      group,
      category,
      machineId,
      instructions: instructions.trim(),
      recurrenceType,
      recurrenceUnit,
      recurrenceValue: val,
      nextDueDate: nextDue || anchorDate,
      currentUsage: parseInt(currentUsage) || 0,
      lastCompletionUsage: task?.lastCompletionUsage ?? 0,
      isPreset: task?.isPreset ?? false,
      icon: CATEGORY_META[category].icon,
      snoozedUntil: task?.snoozedUntil ?? '',
    });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">
        {task ? 'Edit Task' : 'Add Task'}
      </h2>

      {/* Group toggle */}
      <div>
        <label className={labelCls}>Group</label>
        <div className="flex gap-2">
          {(['home', 'machines'] as MaintenanceGroup[]).map(g => (
            <button
              key={g}
              onClick={() => handleGroupChange(g)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                group === g
                  ? 'border-[#E31937] dark:border-[#FF4D5C] bg-[rgba(227,25,55,0.08)] dark:bg-[rgba(255,77,92,0.08)] text-[#E31937] dark:text-[#FF4D5C]'
                  : 'border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.5)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              {g === 'home' ? 'Home' : 'Machines'}
            </button>
          ))}
        </div>
      </div>

      {/* Machine selector (only for machines group) */}
      {group === 'machines' && machineOptions.length > 0 && (
        <div>
          <label className={labelCls}>Machine (optional)</label>
          <select
            value={machineId}
            onChange={e => handleMachineChange(e.target.value)}
            className={inputCls}
          >
            <option value="">— No specific machine —</option>
            {machineOptions.map(m => (
              <option key={m.id} value={m.id}>
                {m.icon || CATEGORY_META[m.category].icon} {m.name}
                {(m.manufacturer || m.model) ? ` (${[m.manufacturer, m.model].filter(Boolean).join(' ')})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category */}
      <div>
        <label className={labelCls}>Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as MaintenanceCategory)}
          className={inputCls}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}</option>
          ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <label className={labelCls}>Task Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Oil change" className={inputCls} />
      </div>

      {/* Recurrence Type */}
      <div>
        <label className={labelCls}>Recurrence Type</label>
        <select value={recurrenceType} onChange={e => handleRecurrenceTypeChange(e.target.value as RecurrenceType)} className={inputCls}>
          {RECURRENCE_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Conditional recurrence fields */}
      {recurrenceType === 'date' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Every</label>
            <input type="number" min="1" value={recurrenceValue} onChange={e => setRecurrenceValue(e.target.value)} placeholder="1" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Unit</label>
            <select value={recurrenceUnit} onChange={e => setRecurrenceUnit(e.target.value as RecurrenceUnit)} className={inputCls}>
              {DATE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {recurrenceType === 'usage' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Threshold</label>
            <input type="number" min="1" value={recurrenceValue} onChange={e => setRecurrenceValue(e.target.value)} placeholder="5000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Unit</label>
            <select value={recurrenceUnit} onChange={e => setRecurrenceUnit(e.target.value as RecurrenceUnit)} className={inputCls}>
              {USAGE_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {recurrenceType === 'seasonal' && (
        <div>
          <label className={labelCls}>Season</label>
          <select value={recurrenceUnit} onChange={e => setRecurrenceUnit(e.target.value as RecurrenceUnit)} className={inputCls}>
            {SEASON_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {/* Anchor / due date */}
      <div>
        <label className={labelCls}>Next Due Date</label>
        <input type="date" value={anchorDate} onChange={e => setAnchorDate(e.target.value)} className={inputCls} />
      </div>

      {/* Current usage for usage-based */}
      {recurrenceType === 'usage' && (
        <div>
          <label className={labelCls}>Current Reading ({recurrenceUnit})</label>
          <input type="number" value={currentUsage} onChange={e => setCurrentUsage(e.target.value)} placeholder="0" className={inputCls} />
        </div>
      )}

      {/* Instructions */}
      <div>
        <label className={labelCls}>Instructions</label>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={3}
          placeholder="Step-by-step instructions..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgba(0,0,20,0.1)] dark:border-[rgba(255,255,255,0.08)] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.5)] hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#E31937] text-white hover:bg-[#C41230] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {task ? 'Save Changes' : 'Add Task'}
        </button>
      </div>
    </div>
  );
}
